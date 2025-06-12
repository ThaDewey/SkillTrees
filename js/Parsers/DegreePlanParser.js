// --- Parser ---
// Responsible for parsing the degree plan blocks into nodes (courses) and edges (connections).

export class DegreePlanParser {
    /**
     * Parses the degree plan to extract school, major, year, nodes, and edges.
     * Arranges nodes vertically by block, with each block on a new row.
     * @param {Object} degreePlan - The full degree plan JSON object.
     * @returns {{courses: Array, edges: Array, school: string, major: string, year: string}} - Parsed data.
     */
    parse(degreePlan) {
        const school = degreePlan.school || "Unknown School";
        const major = degreePlan.major || "Unknown Major";
        const degree = degreePlan.blocks[1].Title || "Unknown Major"; // Assuming the second block contains the degree title
        const year = degreePlan.year || "Unknown Year";
        const blocks = degreePlan.blocks || [];
        const courses = [];
        const edges = [];
        let nodeId = 1;
        const idMap = {};

        // Vertical layout variables
        const blockSpacing = 250; // vertical space between blocks
        const courseSpacing = 180; // horizontal space between courses

        /**
         * Adds a course as a node if not already present.
         * @param {Object} course - The course object.
         * @param {string} labelPrefix - Optional prefix for the node label.
         * @param {number} x - X position for the node.
         * @param {number} y - Y position for the node.
         * @param {string} block - Optional block identifier.
         * @returns {number|null} - The node's unique ID or null if not added.
         */
        function addCourse(course, labelPrefix = "", x = 0, y = 0, block = "") {
            if (course.Hide === 1) return null;

            let label = `${course.Subj} ${course.Num}`;
            if (!label) return null;

            if (!idMap[label]) {
                idMap[label] = nodeId++;
                courses.push({ id: idMap[label], label, x, y, fixed: { x: true, y: true }, block });
            }
            return idMap[label];
        }

        // Traverse blocks and rules to build nodes and edges, vertically by block
        blocks.forEach((block, blockIdx) => {
            let courseIdx = 0;
            block.rules?.forEach((ruleGroup) => {
                ruleGroup.rules?.forEach((rule) => {
                    let prevId = null;
                    rule.courses?.forEach((course) => {
                        // Position: x by course index, y by block index
                        const x = courseIdx * courseSpacing;
                        const y = blockIdx * blockSpacing;
                        // Pass block title or ID to the node
                        const currId = addCourse(course, rule.label, x, y, block.Title || block.BlockID || "");
                        if (currId && prevId) {
                            edges.push({ from: prevId, to: currId });
                        }
                        prevId = currId;
                        courseIdx++;
                    });
                });
            });
        });

        return { courses, edges, school, major, year, degree };
    }

    /**
     * Calculates total and completed credit hours for the degree plan.
     * @param {Object} degreePlan - The degree plan object.
     * @returns {{totalCredits: number, completedCredits: number}} - Credit hour information.
     */
    calculateCreditHours(degreePlan) {
        console.log("Calculating credit hours for degree plan:", degreePlan);

        let totalCredits = 0;
        let completedCredits = 0;

        degreePlan.blocks.forEach((block) => {
            block.rules?.forEach((category) => {
                category.rules?.forEach((subcategory) => {
                    subcategory.courses?.forEach((course) => {
                        totalCredits += course.Credits || 0; // Add course credits to total
                        completedCredits += course.Completed ? course.Credits || 0 : 0; // Add completed credits
                    });
                });
            });
        });

        console.log(`Total Credits: ${totalCredits}, Completed Credits: ${completedCredits}`);
        return { totalCredits, completedCredits };
    }

    /**
     * Updates the progress bar based on credit hour information.
     * @param {Object} creditHours - An object containing total and completed credit hours.
     */
    updateProgressBar(creditHours) {
        const progressElement = document.getElementById("credit-progress-bar");
        const progressLabel = document.getElementById("credit-progress-label");

        if (!progressElement || !progressLabel) {
            console.error("Progress bar elements not found!");
            return;
        }

        const { totalCredits, completedCredits } = creditHours;
        const progressPercentage = (completedCredits / totalCredits) * 100;

        progressElement.style.width = `${progressPercentage}%`; // Update progress bar width
        progressLabel.textContent = `Credits: ${completedCredits} / ${totalCredits}`; // Update progress label

        console.log(`Progress bar updated: ${progressPercentage.toFixed(2)}%`);
    }
}

/**
 * Parses a hierarchical degree plan structure into a normalized format.
 * Applies random completeness to the result before returning the final parsed structure.
 *
 * @param {Object} degreePlan - The degree plan object to parse.
 * @returns {Array<Object>} An array of parsed block objects.
 */
export function parseDegreePlanHierarchical(degreePlan) {
    console.log("Parsing degree plan into hierarchical structure...");

    const blocks = degreePlan.blocks || [];
    const result = blocks.map((block) => ({
        type: block.BlockType === "CORE" ? "core" : "program",
        label: block.Title || "Untitled Block",
        id: block.BlockID || "",
        credits: block.Credits || 0,
        categories: (block.rules || []).map((category) => ({
            label: category.label || "Category",
            subcategories: (category.rules || []).map((subcat) => ({
                label: subcat.label || "Subcategory",
                id: subcat.id || "",
                reqType: subcat.reqType,
                reqCount: subcat.reqCount,
                conn: subcat.Conn,
                courses: (subcat.courses || [])
                    .filter((c) => c.Hide !== 1)
                    .map((course) => ({
                        label: course.Subj === "@"
                            ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@")
                            : `${course.Subj} ${course.Num}`,
                        subj: course.Subj,
                        num: course.Num,
                        with: course.With,
                        completed: !!course.Completed // Ensure completed status is included
                    })),
            })),
        })),
    }));

    console.log("Applying random completeness to parsed result...");
    applyRandomCompletenessToResult(result); // Apply random completeness to the result

    return result;
}

/**
 * Randomly assigns Completed: true or false to every course in the parsed result.
 * @param {Array<Object>} result - The parsed hierarchical structure.
 */
function applyRandomCompletenessToResult(result) {
    result.forEach((block) => {
        block.categories.forEach((category) => {
            category.subcategories.forEach((subcat) => {
                subcat.courses.forEach((course) => {
                    course.completed = Math.random() < 0.5; // 50% chance of being completed
                });
            });
        });
    });
}

/**
 * Converts a degree plan to a D3.js-compatible hierarchy.
 * @param {Object} degreePlan
 * @returns {Object} D3 hierarchy root node
 */
export function parseDegreePlanForD3(degreePlan) {
    if (!degreePlan || !degreePlan.blocks) return { name: "No Data", children: [] };

    return {
        name: degreePlan.major || degreePlan.title || "Degree Plan",
        children: (degreePlan.blocks || []).map(block => ({
            name: block.Title || block.BlockID || "Block",
            children: (block.rules || []).map(category => ({
                name: category.label || "Category",
                children: (category.rules || []).map(subcat => ({
                    name: subcat.label || "Subcategory",
                    children: (subcat.courses || [])
                        .filter(c => c.Hide !== 1)
                        .map(course => ({
                            name: course.Subj === "@"
                                ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@")
                                : `${course.Subj} ${course.Num}`
                        }))
                }))
            }))
        }))
    };
}

/**
 * Converts a degree plan to a flat array in the "techs.json" format.
 * Each course becomes a tech node.
 * @param {Object} degreePlan
 * @returns {Array} Array of tech objects
 */
export function exportDegreePlanAsTechs(degreePlan) {
    if (!degreePlan || !degreePlan.blocks) return [];

    const techs = [];
    const courseIdMap = {}; // Map course label to id for prerequisites

    // Assign x/y grid positions for visualization (optional, here by block/category index)
    let x = 0;
    (degreePlan.blocks || []).forEach((block, blockIdx) => {
        (block.rules || []).forEach((category, catIdx) => {
            (category.rules || []).forEach((subcat, subcatIdx) => {
                (subcat.courses || []).forEach((course, courseIdx) => {
                    if (course.Hide === 1) return;

                    // Build a unique id for the course
                    const id = `${course.Subj}_${course.Num}`.replace(/\s+/g, "_");
                    const title = course.Subj === "@"
                        ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@")
                        : `${course.Subj} ${course.Num}`;

                    // Optionally, use emoji or other logic for icon/outputs
                    const icon = ""; // You can map course types to icons if desired
                    const outputs = []; // Fill as needed
                    const turns = 1; // Or use course.Credits or another field

                    // Assign grid positions (customize as needed)
                    const tech = {
                        id,
                        title,
                        icon,
                        outputs,
                        turns,
                        x: x,
                        y: blockIdx * 10 + catIdx * 2 + subcatIdx,
                        requires: [],
                        completed: !!course.Completed // <-- add this line
                    };

                    techs.push(tech);
                    courseIdMap[title] = id;
                });
                x++;
            });
        });
    });

    // Now, add prerequisites (requires) if your data has them
    // Example: If a course has a "Prereqs" array, map those to "requires"
    // (You may need to adapt this to your data structure)
    techs.forEach(tech => {
        // Find the original course object
        const course = findCourseById(degreePlan, tech.id);
        if (course && course.Prereqs && Array.isArray(course.Prereqs)) {
            tech.requires = course.Prereqs
                .map(prereq => {
                    const prereqTitle = prereq.Subj === "@"
                        ? (prereq.With?.ATTRIBUTE ? `Requirement: ${prereq.With.ATTRIBUTE}` : "@")
                        : `${prereq.Subj} ${prereq.Num}`;
                    return courseIdMap[prereqTitle];
                })
                .filter(Boolean);
        }
    });

    return techs;
}

// Helper to find a course by id in the degree plan
function findCourseById(degreePlan, id) {
    for (const block of degreePlan.blocks || []) {
        for (const category of block.rules || []) {
            for (const subcat of category.rules || []) {
                for (const course of subcat.courses || []) {
                    const courseId = `${course.Subj}_${course.Num}`.replace(/\s+/g, "_");
                    if (courseId === id) return course;
                }
            }
        }
    }
    return null;
}

/**
 * Randomly assigns Completed: true or false to every course in the degree plan.
 * Call this before parsing for display/testing.
 */
export function randomlyCompleteCourses(degreePlan) {
    for (const block of degreePlan.blocks || []) {
        for (const category of block.rules || []) {
            for (const subcat of category.rules || []) {
                for (const course of subcat.courses || []) {
                    course.Completed = Math.random() < 0.5; // 50% chance
                }
            }
        }
    }
}

async function renderDegreePlan() {
    console.log("Rendering degree plan with layout:", currentLayout);

    const urlParams = new URLSearchParams(window.location.search);
    let key = urlParams.get("key");
    console.log("Degree plan key:", key);

    if (!/^\d{4}$/.test(key)) {
        key = "5040"; // Default key
        console.log("Invalid key detected. Using default key:", key);
    }

    const loader = new DegreePlanLoader();
    console.log("Loading degree plan from:", `DegreeJSON/${key}.json`);
    const degreePlan = await loader.load(`DegreeJSON/${key}.json`);

    if (!degreePlan) {
        console.error("Failed to load degree plan!");
        return;
    }
    console.log("Loaded degree plan:", degreePlan);

    const networkContainer = document.getElementById("network");
    if (!networkContainer) {
        console.error("Network container not found!");
        return;
    }

    console.log("Clearing network container...");
    networkContainer.innerHTML = ""; // Clear previous content

    let htmlTree;
    switch (currentLayout) {
        case "DegreeSheet":
            console.log("Rendering DegreeSheet layout...");
            htmlTree = renderStructure(degreePlan); // Render the degree sheet
            console.log("Rendered DegreeSheet:", htmlTree);
            break;
        case "raw":
            console.log("Rendering raw JSON layout...");
            htmlTree = renderRawJSON(degreePlan);
            console.log("Rendered raw JSON:", htmlTree);
            break;
        case "tree":
            console.log("Rendering tree layout...");
            htmlTree = renderTree(degreePlan);
            console.log("Rendered tree layout:", htmlTree);
            break;
        case "SphereGrid":
            console.log("Rendering SphereGrid layout...");
            renderSphereGrid(degreePlan, networkContainer); // Render sphere grid directly
            console.log("Rendered SphereGrid layout.");
            return; // Skip appending since renderSphereGrid handles rendering
        default:
            console.error("Unknown layout:", currentLayout);
            return;
    }

    console.log("Appending rendered content to network container...");
    networkContainer.appendChild(htmlTree); // Append the rendered content

    console.log("Calculating credit hours...");
    const creditHours = { totalCredits: 0, completedCredits: 0 }; // Properly initialize the creditHours object
    console.log("Initialized creditHours:", creditHours);

    setDefaultCreditsForUG(degreePlan, creditHours); // Set total credits for UG degrees
    console.log("Credit hours after setting defaults:", creditHours);

    creditHours.completedCredits = calculateCompletedCreditHours(degreePlan); // Calculate completed credits
    console.log("Credit hours after calculating completed credits:", creditHours);

    updateProgressBar(creditHours); // Update the progress bar
}

/**
 * Parses a degree plan into a flat array of items for easier calculations.
 * @param {Object} degreePlan - The degree plan object.
 * @returns {Array<Object>} - Flattened array of items.
 */
export function parseDegreePlanFlat(degreePlan) {
    console.log("Parsing degree plan into flat structure...");

    const items = [];

    (degreePlan.blocks || []).forEach((block) => {
        const blockItem = {
            type: block.BlockType === "CORE" ? "core" : "program",
            label: block.Title || "Untitled Block",
            id: block.BlockID || "",
            credits: block.Credits || 0,
            completed: false, // Default to not completed
        };
        items.push(blockItem);

        (block.rules || []).forEach((category) => {
            const categoryItem = {
                type: "category",
                label: category.label || "Category",
                parentId: blockItem.id,
                completed: false,
            };
            items.push(categoryItem);

            (category.rules || []).forEach((subcat) => {
                const subcatItem = {
                    type: "subcategory",
                    label: subcat.label || "Subcategory",
                    parentId: categoryItem.parentId,
                    completed: false,
                };
                items.push(subcatItem);

                (subcat.courses || []).forEach((course) => {
                    const courseItem = {
                        type: "course",
                        label: course.Subj === "@"
                            ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@")
                            : `${course.Subj} ${course.Num}`,
                        subj: course.Subj,
                        num: course.Num,
                        credits: course.Credits || 0,
                        completed: !!course.Completed, // Use existing completion status
                    };
                    items.push(courseItem);
                });
            });
        });
    });

    console.log("Flat structure parsed:", items);
    return items;
}
