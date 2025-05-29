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

			// let isCourseAtSymbol = course.Subj === "@";
			// let courseWith = course.With?.ATTRIBUTE ? `Requirement: ${attributeNames[course.With.ATTRIBUTE] || course.With.ATTRIBUTE}` : null;

			let label = `${course.Subj} ${course.Num}`;

			if (!label) return null;

			// label = labelPrefix ? `${labelPrefix}: ${label}` : label;

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
}

// Add to DegreePlanParser.js

export function parseDegreePlanHierarchical(degreePlan) {
	const blocks = degreePlan.blocks || [];
	return blocks.map((block) => ({
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
						label: course.Subj === "@" ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@") : `${course.Subj} ${course.Num}`,
						subj: course.Subj,
						num: course.Num,
						with: course.With,
					})),
			})),
		})),
	}));
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
                        y: blockIdx * 10 + catIdx * 2 + subcatIdx, // Example: spread vertically by block/category/subcat
                        requires: []
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
