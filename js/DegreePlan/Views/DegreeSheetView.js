/**
 * @typedef {Object} Course
 * @property {string} Subj - The subject code of the course (e.g., "ENG", "CMSC", "@").
 * @property {string} Num - The course number (e.g., "1133", "3@", "@").
 * @property {Object} [With] - Optional object for additional attributes or filters (e.g., { ATTRIBUTE: "ZCMP" }).
 * @property {number} [Hide] - If 1, the course is hidden; otherwise, visible.
 * @property {string} [code] - Optional combined course code (e.g., "ENG 1133").
 * @property {Object} [DWTITLE] - Optional object for display title overrides.
 * @property {string} [DWTERM] - Optional term information.
 * @property {string} [DWTRANSFER] - Optional transfer information.
 */
import { parseDegreePlanHierarchical, parseDegreePlanFlat } from "../../Parsers/DegreePlanParser.js";
import * as html from "../../Utils/domUtils.js";
import { getCourseDescription } from "../CourseLoader.js";

let codes = {};
let majorcode = -9999;


async function loadCodes() {
    try {
        const response = await fetch('../../DegreeJSON/Codes.json');
        if (!response.ok) {
            throw new Error(`Failed to load JSON: ${response.statusText}`);
        }
        const codes = await response.json();
        console.log("Loaded codes:", codes);
        return codes;
    } catch (error) {
        console.error("Error loading Codes.json:", error);
    }
}



export async function renderStructure(degreePlan) {

    console.log("renderStructure:", degreePlan);
    const blocks = parseDegreePlanHierarchical(degreePlan);

    console.log("Parsed blocks:", blocks);


    codes = await loadCodes();
    if (!codes) {
        console.error("Failed to load codes. Aborting render.");
        return;
    }

    console.log("Loaded codes:", codes);

    const htmlStructure = html.buildElement({
        elementType: "div",
        classList: ["degree-plan"]
    });

    let info = {};
    // Render sections
    const header = RenderDegreePlanHeader(degreePlan);
    htmlStructure.appendChild(header);

    const universityCore = renderUniversityCore(blocks);
    htmlStructure.appendChild(universityCore);

    const supportCourses = renderSupportCourses(blocks);
    htmlStructure.appendChild(supportCourses);

    const majorRequirements = renderMajorRequirements(blocks);
    htmlStructure.appendChild(majorRequirements);

    const electives = renderElectives(blocks);
    htmlStructure.appendChild(electives);

    console.log("Rendered HTML structure:", htmlStructure);

    return { DegreeInfo: info, html: htmlStructure, data: blocks };
}


function RenderDegreePlanHeader(degreePlan) {
    const header = html.buildElement({
        elementType: "div",
        classList: ["degree_header", "container"]
    });


    const upperHeader = RenderUpperHeader(degreePlan);

    const bodyHeader = renderBodyHeader(degreePlan);

    header.appendChild(upperHeader);

    header.appendChild(bodyHeader);

    return header;
}

function RenderUpperHeader(degreePlan) {
    majorcode = degreePlan.major;
    const CodeInfo = codes.majors[degreePlan.major];

    const div = html.buildElement({
        elementType: "div",
        classList: ["row", "justify-content-between"],
        id: "upper-header"
    });

    const major_top = html.buildElement({
        elementType: "p",
        text: `${CodeInfo.name || "Unknown Major"}`,
        classList: ["col", "text-center"],
        id: "major-top",
        parent: div
    });
    const title = html.buildElement({
        elementType: "p",
        text: `University of Central Oklahoma Undergraduate Catalog ${degreePlan.Cat_yr_start}-${degreePlan.Cat_yr}`,
        classList: ["col", "text-center"],
        id: "degree-plan-title",
        parent: div
    });

    const hr_top = html.buildElement({
        elementType: "hr",
        classList: ["col-12"],
        id: "hr-top",
        parent: div,
    });


    // console.log("codes", codes);

    // console.log("Code Info:", CodeInfo);


    return div

}

function renderBodyHeader(degreePlan) {
    const CodeInfo = codes.majors[degreePlan.major];
    const div = html.CreateElement("div");
    div.classList.add("row", "justify-content-between");
    const l_col = html.CreateElement("div");
    l_col.classList.add("col");
    const r_col = html.CreateElement("div");
    r_col.classList.add("col");

    div.appendChild(l_col);
    div.appendChild(r_col);

    let collegeName = codes.Colleges[CodeInfo.college];
    let programName = CodeInfo.name;
    let degreeType = CodeInfo.degree;;
    let awardType = CodeInfo.type;
    console.log("awardType:", awardType);


    const program = html.buildElement({
        elementType: "p",
        text: `Program: ${programName}`,
        id: "program-name",
        parent: l_col
    });


    const major = html.buildElement({
        elementType: "p",
        text: `Major: ${programName}`,
        id: "major-name",
        parent: l_col
    });

    const degree = html.buildElement({
        elementType: "p",
        text: `Degree: ${degreeType}`,
        id: "degree-type",
        parent: l_col
    });

    const department = html.buildElement({
        elementType: "p",
        text: `Department: ${degreePlan.dept || "Not Yet Implemented"}`,
        id: "department-name",
        parent: r_col
    });

    const college = html.buildElement({
        elementType: "p",
        text: `College: ${collegeName}`,
        id: "college-name",
        parent: r_col
    });

    const majorCode = html.buildElement({
        elementType: "p",
        text: `Major Code: ${degreePlan.major || "Unknown"}`,
        id: "major-code",
        parent: r_col
    });

    const hr_bot = html.buildElement({
        elementType: "hr",
        classList: ["col-12"],
        id: "hr-bottom",
        parent: div
    });



    return div;


}


function renderUniversityCore(blocks) {
    const coreBlock = blocks.find((block) => block.type === "core");
    const universityCore = html.BuildElement("div");
    universityCore.classList.add("university-core", "row");

    if (!blocks[0] || !blocks[0].label) {
        console.error("Invalid block or missing label in blocks[0]:", blocks[0]);
        return universityCore;
    }

    const coreMinMax = codes.DegreeMinMax[blocks[0].label];
    if (!coreMinMax) {
        console.error(`DegreeMinMax entry not found for label: ${blocks[0].label}`);
        return universityCore;
    }

    const title = createUniversityCoreTitle(coreMinMax);
    universityCore.appendChild(title);

    if (coreBlock && coreBlock.categories) {
        const coreList = html.buildElement({
            elementType: "div",
            classList: ["core-list", "row"],
            id: coreBlock.id || "core-list"
        });

        coreBlock.categories.forEach((category) => {
            const categoryDiv = createCoreCategoryDiv(category);
            coreList.appendChild(categoryDiv);

            const categoryHeader = createCoreCategoryHeader(category);
            categoryDiv.appendChild(categoryHeader);

            if (category.subcategories) {
                const subcategoryList = createCoreSubcategoryList(category.subcategories);
                categoryDiv.appendChild(subcategoryList);
            }

            appendCategoryMinMax(categoryHeader, category.label);

            console.log(`Category MinMax: ${codes.DegreeMinMax[category.label]} | Label: ${category.label}`);
        });

        universityCore.appendChild(coreList);
    }

    universityCore.appendChild(html.BuildElement("hr"));
    return universityCore;
}

function createUniversityCoreTitle(coreMinMax) {
    const title = html.BuildElement("h2", `University Core (Total Listed ${coreMinMax.min}-${coreMinMax.max})`);
    title.classList.add("col", "text-center");
    return title;
}

function createCoreCategoryDiv(category) {
    return html.buildElement({
        elementType: "div",
        classList: ["category-item", "row", "justify-content-between", "col-6", "category"],
        id: category.id || replaceSpaces(`category-item_${category.label}`) || "unknown",
    });
}

function createCoreCategoryHeader(category) {
    return html.BuildElement("h3", `${category.label || "Category"} `);
}

function createCoreSubcategoryList(subcategories) {
    const subcategoryList = html.BuildElement("div");

    console.log("subcategories", subcategories);
    subcategories.forEach((subcategory) => {

        const subcategoryItem = html.buildElement({
            elementType: "div",
            classList: ["subcategory-item", "col"],
            id: replaceSpaces(`subcategory-item_${subcategory.label}`),
            parent: subcategoryList
        });

        const subCategory_Header = html.buildElement({
            elementType: "h4",
            text: `${subcategory.label || "Subcategory"}: ${subcategory.reqCount || 0}`,
            classList: ["subcategory-header"],
            parent: subcategoryItem
        });

        console.log("subcategory.courses", subcategory.courses);

        if (Array.isArray(subcategory.courses) && subcategory.courses.length > 0) {
            createCoursesList(subcategory.conn, subcategory.courses, subcategoryItem);
        }

    });
    return subcategoryList;
}


function appendCategoryMinMax(categoryHeader, label) {
    const categoryMinMax = codes.DegreeMinMax[label];
    if (typeof categoryMinMax === "object" && categoryMinMax !== null) {
        categoryHeader.innerHTML += ` (${categoryMinMax.min !== undefined ? categoryMinMax.min : ""}${categoryMinMax.max !== undefined ? "-" + categoryMinMax.max : ""})`;
    } else if (typeof categoryMinMax === "number") {
        categoryHeader.innerHTML += ` (${categoryMinMax})`;
    }
}

function removeSpaces(str) {
    return str.replace(/\s+/g, '');
}
function replaceSpaces(str) {
    return str.replace(/\s+/g, '_');
}

function renderSupportCourses(blocks) {
    const supportedTypes = blocks.map(b => b.type);
    if (!supportedTypes.includes("support")) {
        return html.BuildElement("div"); // Return empty div if support block not present
    }

    const supportBlock = blocks.find((block) => block.type === "support");
    const supportCourses = html.BuildElement("div");
    supportCourses.className = "support-courses";

    const title = html.BuildElement("h2", "Support Courses");
    supportCourses.appendChild(title);

    if (supportBlock && supportBlock.categories) {
        const supportList = html.BuildElement("ul");
        supportBlock.categories.forEach((category) => {
            const categoryItem = html.BuildElement("li", `${category.label || "Support Course"}: ${category.credits || 0}`);
            supportList.appendChild(categoryItem);
        });
        supportCourses.appendChild(supportList);
    }

    return supportCourses;
}

function renderMajorRequirements(blocks) {
    const majorBlock = blocks.find((block) => block.type === "program");

    // const majorRequirements = html.CreateElement("div");

    // majorRequirements.classList.add("major-requirements", "row");

    const majorRequirements = html.buildElement({
        elementType: "div",
        classList: ["major-requirements", "row"],
        id: "major-requirements"
    });
    const title = html.buildElement({
        elementType: "h2",
        text: "Major Requirements",
        classList: ["col-12", "text-center"],
        id: "major-requirements-title",
        parent: majorRequirements
    });
    const degreetitle = html.buildElement({
        elementType: "h2",
        text: codes.majors[majorcode].name,
        classList: ["col-12", "text-center"],
        id: "degree-title",
        parent: majorRequirements
    });

    renderMajorCategories(majorBlock, majorRequirements);

    return majorRequirements;
}

function renderMajorCategories(majorBlock, majorRequirements) {
    if (majorBlock && majorBlock.categories) {

        const majorList = html.buildElement({
            elementType: "div",
            classList: ["major-list", "row"],
            id: majorBlock.id || "major-list"
        });

        majorBlock.categories.forEach((category) => {

            const categoryItem = html.buildElement({
                elementType: "div",
                classList: ["category-item", "col-6"],
                id: category.id || replaceSpaces(`category-item_${category.label}`) || "unknown",
                parent: majorList
            });

            const categoryHeader = html.buildElement({
                elementType: "h3",
                text: `${category.label || "Requirement"}: ${category.credits || 0}`,
                classList: ["category-header"],
                parent: categoryItem

            });

            renderSubcategories(category, categoryItem);
        });
        majorRequirements.appendChild(majorList);
    }
}

function renderSubcategories(category, categoryItem) {
    if (!category.subcategories) return;

    const subCategoryList = createSubCategoryList(category, categoryItem);

    category.subcategories.forEach((subcategory) => {

        const subcategoryItem = createSubCategoryItem(subcategory, subCategoryList);

        createSubCategoryHeader(subcategory, subcategoryItem);

        // Render courses if present in the subcategory
        const isArray = Array.isArray(subcategory.courses);
        const hasItems = isArray && subcategory.courses.length > 0;

        if (isArray && hasItems) {
            createCoursesList(subcategory.courses, subcategoryItem);
        }
    });

    categoryItem.appendChild(subCategoryList);
}

function createSubCategoryList(category, parent) {
    return html.buildElement({
        elementType: "div",
        classList: ["subcategory-list", "row"],
        id: category.id || replaceSpaces(`subcategory-list_${category.label}`) || "unknown",
        parent: parent
    });
}

function createSubCategoryItem(subcategory, parent) {
    return html.buildElement({
        elementType: "div",
        classList: ["subcategory-item", "col-6"],
        id: replaceSpaces(`subcategory-item_${subcategory.label}`) || "unknown",
        parent: parent
    });
}

function createSubCategoryHeader(subcategory, parent) {
    return html.buildElement({
        elementType: "h4",
        text: `${subcategory.label || "Subcategory"}: ${subcategory.reqCount || 0}`,
        classList: ["subcategory-header"],
        parent: parent
    });
}



/**
 * Creates a list of courses within a subcategory, no lists, just buttons.
 * @param {Course[]} courses - Array of course objects.
 * @param {HTMLElement} parent - Parent element to append the courses container to.
 */
function createCoursesList(conn, courses, parent) {
    console.log("Creating courses list:", courses);

    if (!Array.isArray(courses)) {
        console.warn("createCoursesList: 'courses' is not an array", courses);
        return;
    }

    const connection = conn || "And";
    if (connection === "Or") {
        createOrCoursesGroup(courses, parent);
    } else {
        createAndCoursesList(courses, parent);
    }
}

function createOrCoursesGroup(courses, parent) {
    const groupDiv = html.buildElement({
        elementType: "div",
        classList: [
            "mb-2"
        ],
        attributes: { role: "group" },
        parent: parent
    });

    groupDiv.style.flexWrap = "wrap";

    courses.forEach((course) => {
        createCourseButton(course, groupDiv);
    });
}
/**
 * Updates the progress bar based on the value.
 * @param {number} value - The value to add or subtract from the progress bar.
 */
function updateProgressBar(value) {
    const progressBar = document.getElementById("progress-bar");
    const progressLabel = document.getElementById("progress-label");
    const progressOutput = document.getElementById("progress-output"); // Numeric output element

    if (!progressBar || !progressLabel || !progressOutput) {
        console.error("Progress bar, label, or output not found!");
        return;
    }

    // Get the current progress value
    let currentProgress = parseInt(progressBar.style.width || "0", 10);

    // Update the progress value
    currentProgress = Math.max(0, Math.min(currentProgress + value, 100)); // Ensure value is between 0 and 100

    // Update the progress bar and label
    progressBar.style.width = `${currentProgress}%`;
    progressLabel.textContent = `${currentProgress}%`;

    // Update the numeric output
    progressOutput.textContent = `Progress: ${currentProgress} out of 100`;
}

/**
 * Creates a course button and attaches Bootstrap tooltip functionality to fetch course descriptions.
 * @param {object} course - The course object containing course details.
 * @param {HTMLElement} parent - The parent element to append the button.
 */
async function createCourseButton(course, parent) {
    const courseId = `${course.subj}${course.num}`;
    const description = await getCourseDescription(courseId);

    // Create the button element
    let button = html.buildElement({
        elementType: "button",
        text: courseId,
        classList: [
            "course-item",
            "btn",
            "btn-outline-primary",
            "col"
        ],
        parent: parent
    });

    // Add Bootstrap tooltip attributes
    button.setAttribute("data-bs-toggle", "tooltip");
    button.setAttribute("data-bs-placement", "top");
    button.setAttribute("title", description);

    // Initialize the tooltip using Bootstrap's JavaScript
    const tooltip = new bootstrap.Tooltip(button);

    // Attach click event listener to toggle state and update progress bar
    button.addEventListener("click", () => {
        const value = parseInt(button.getAttribute("data-value") || "5", 10); // Default value is 5

        // Toggle the active state
        if (button.classList.contains("active")) {
            button.classList.remove("active");
            updateProgressBar(-value); // Subtract the value
        } else {
            button.classList.add("active");
            updateProgressBar(value); // Add the value
        }
    });

    // Optionally set a default data-value attribute for progress bar updates
    button.setAttribute("data-value", getLastDigit(course.num));
}
/**
 * Returns the last digit of a given number.
 * @param {number} num - The input number.
 * @returns {number} The last digit of the number.
 */
function getLastDigit(num) {
    return Math.abs(num) % 10;
}

function createAndCoursesList(courses, parent) {
    const ul = html.buildElement({
        elementType: "ul",
        classList: ["course-list", "mb-2"],
        parent: parent
    });

    courses.forEach((course) => {
        createCourseListItem(course, ul);
    });
}

function createCourseListItem(course, parent) {
    html.buildElement({
        elementType: "li",
        text: `${course.subj}${course.num}`,
        classList: ["course-item"],
        parent: parent
    });
}






function renderElectives(blocks) {
    const electivesBlock = blocks.find((block) => block.type === "electives");
    const electives = html.BuildElement("div");
    electives.className = "electives";

    const title = html.BuildElement("h2", "Electives");
    electives.appendChild(title);

    if (electivesBlock && electivesBlock.categories && electivesBlock.categories.length > 0) {
        const electivesList = html.BuildElement("ul");
        electivesBlock.categories.forEach((category) => {
            const categoryItem = html.BuildElement("li", `${category.label || "Elective"}: ${category.credits || 0}`);
            electivesList.appendChild(categoryItem);
        });
        electives.appendChild(electivesList);
    } else {
        const noElectivesMessage = html.BuildElement("p", "No electives available.");
        electives.appendChild(noElectivesMessage);
    }

    return electives;
}

/**
 * Renders the course buttons within a Bootstrap accordion.
 * @param {Array} courses - Array of course objects.
 * @param {HTMLElement} parent - The parent element to append the accordion.
 */
function renderCoursesInAccordion(courses, parent) {
    // Prepare accordion items
    const accordionItems = courses.map((course, index) => {
        const buttonContainer = document.createElement("div");
        buttonContainer.className = "button-container";

        // Create a button for each course
        const button = BuildElement(
            "button",
            `${course.Subj || course.subj || ""} ${course.Num || course.num || ""}`,
            ["btn", "btn-outline-primary", "course-item"]
        );

        // Attach click event listener to toggle state and update progress bar
        button.addEventListener("click", () => {
            const value = parseInt(button.getAttribute("data-value") || "5", 10); // Default value is 5

            // Toggle the active state
            if (button.classList.contains("active")) {
                button.classList.remove("active");
                updateProgressBar(-value); // Subtract the value
            } else {
                button.classList.add("active");
                updateProgressBar(value); // Add the value
            }
        });

        // Set a default data-value attribute for progress bar updates
        button.setAttribute("data-value", "5");

        buttonContainer.appendChild(button);

        return {
            title: `Course Group ${index + 1}`,
            content: buttonContainer.outerHTML // Add the button container as content
        };
    });

    // Create the accordion using the utility function
    const accordion = buildBootstrapAccordion("courseAccordion", accordionItems);

    // Append the accordion to the parent element
    parent.appendChild(accordion);
}

