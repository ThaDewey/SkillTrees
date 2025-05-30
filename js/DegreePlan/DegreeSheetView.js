import { parseDegreePlanHierarchical, parseDegreePlanFlat } from "./DegreePlanParser.js";
import * as html from "./domUtils.js";

export function renderStructure(degreePlan) {
    const blocks = parseDegreePlanHierarchical(degreePlan);

    const htmlStructure = html.BuildElement("div");
    htmlStructure.className = "degree-info";

    let degreeTitle = blocks[1]?.label || "Degree Plan";
    let degreeInfo = {
        school: degreePlan.school || "Unknown School",
        major: degreePlan.major || "Unknown Major",
        degree: degreeTitle,
        year: degreePlan.year || "Unknown Year",
    };
    let htmlDegreeInfo = renderDegreeInfo(degreeInfo, degreeTitle);
    htmlStructure.appendChild(htmlDegreeInfo);

    let htmlBlocks = renderBlocks(blocks);
    htmlStructure.appendChild(htmlBlocks);

    return { DegreeInfo: degreeInfo, html: htmlStructure, data: blocks }; // Return both HTML and parsed data
}

function renderDegreeInfo(degreeInfo, degreeTitle) {
    const infoDiv = html.BuildElement("div");
    infoDiv.className = "degree-info";
    let fire = html.BuildElement("p", degreeTitle);
    infoDiv.appendChild(fire);

    Object.entries(degreeInfo).forEach(([key, value]) => {
        let el = html.BuildElement("p", `${key}: ${value}`);
        infoDiv.appendChild(el);
    });

    return infoDiv;
}

function renderBlocks(blocks) {
    const blocksContainer = html.BuildElement("div");
    blocksContainer.className = "blocks-container";

    blocks.forEach((block) => {
        const blockDiv = html.BuildElement("div");
        blockDiv.className = "block";

        const blockType = html.BuildElement("h2", block.type === "core" ? "Core" : "Program");
        const title = html.BuildElement("h3", block.label || "Untitled Block");
        const id = html.BuildElement("p", `ID: ${block.id || "Unknown ID"}`);
        const credits = html.BuildElement("p", `Credits: ${block.credits || 0}`);

        blockDiv.appendChild(blockType);
        blockDiv.appendChild(title);
        blockDiv.appendChild(id);
        blockDiv.appendChild(credits);

        // Render categories
        if (Array.isArray(block.categories) && block.categories.length > 0) {
            const categoriesContainer = renderCategories(block.categories);
            blockDiv.appendChild(categoriesContainer);
        }

        blocksContainer.appendChild(blockDiv);
    });

    return blocksContainer;
}

function renderCategories(categories) {
    const categoriesContainer = html.BuildElement("div");
    categoriesContainer.className = "categories-container";

    categories.forEach((category) => {
        const categoryDiv = html.BuildElement("div");
        categoryDiv.className = "category";
        const categoryLabel = html.BuildElement("h4", category.label || "Category");
        categoryDiv.appendChild(categoryLabel);

        // Render subcategories
        if (Array.isArray(category.subcategories) && category.subcategories.length > 0) {
            const subcategoriesContainer = renderSubcategories(category.subcategories);
            categoryDiv.appendChild(subcategoriesContainer);
        }

        categoriesContainer.appendChild(categoryDiv);
    });

    return categoriesContainer;
}

function renderSubcategories(subcategories) {
    const subcategoriesContainer = html.BuildElement("div");
    subcategoriesContainer.className = "subcategories-container";

    subcategories.forEach((subcat) => {
        const subcatDiv = html.BuildElement("div");
        subcatDiv.className = "subcategory";
        const subcatLabel = html.BuildElement("h5", subcat.label || "Subcategory");
        subcatDiv.appendChild(subcatLabel);

        const categoryId = subcat.id || "unknown-category";
        const categoryCoursesCount = Array.isArray(subcat.courses) ? subcat.courses.length : 0;
        const Requirement = subcat.reqType || "Requirement Type";
        const RequirementCount = subcat.reqCount || 0;
        const connections = subcat.conn || "null";
        const categoryInfo = html.BuildElement("p", `ID: ${categoryId}, Courses: ${categoryCoursesCount}, Requirement: ${Requirement}, Count: ${RequirementCount}, Connections: ${connections}`);
        subcatDiv.appendChild(categoryInfo);

        // Render courses
        if (Array.isArray(subcat.courses) && subcat.courses.length > 0) {
            const courseList = html.BuildElement("ul");
            subcat.courses.forEach((course) => {
                const courseItem = html.BuildElement("li", course.label);
                courseList.appendChild(courseItem);
            });
            subcatDiv.appendChild(courseList);
        }

        subcategoriesContainer.appendChild(subcatDiv);
    });

    return subcategoriesContainer;
}

// async function renderDegreePlan() {
//     console.log("Rendering degree plan with layout:", currentLayout);

//     const urlParams = new URLSearchParams(window.location.search);
//     let key = urlParams.get("key");
//     console.log("Degree plan key:", key);

//     if (!/^\d{4}$/.test(key)) {
//         key = "5040"; // Default key
//         console.log("Invalid key detected. Using default key:", key);
//     }

//     const loader = new DegreePlanLoader();
//     console.log("Loading degree plan from:", `DegreeJSON/${key}.json`);
//     const degreePlan = await loader.load(`DegreeJSON/${key}.json`);

//     if (!degreePlan) {
//         console.error("Failed to load degree plan!");
//         return;
//     }
//     console.log("Loaded degree plan:", degreePlan);

//     const networkContainer = document.getElementById("network");
//     if (!networkContainer) {
//         console.error("Network container not found!");
//         return;
//     }

//     console.log("Clearing network container...");
//     networkContainer.innerHTML = ""; // Clear previous content

//     let newData;
//     let htmlTree;
//     let creditHours; // Properly calculate and return credit hours
//     switch (currentLayout) {
//         case "DegreeSheet":
//             console.log("Rendering DegreeSheet layout...");
//             newData = renderStructure(degreePlan); // Extract both HTML and parsed data
//             htmlTree = newData.html; // Render the degree sheet
//             creditHours = calculateCreditHours(newData.data); // Use parsed data for calculations
//             console.log("Rendered DegreeSheet:", htmlTree);
//             break;
//         case "raw":
//             console.log("Rendering raw JSON layout...");
//             htmlTree = renderRawJSON(degreePlan);
//             console.log("Rendered raw JSON:", htmlTree);
//             break;
//         case "tree":
//             console.log("Rendering tree layout...");
//             htmlTree = renderTree(degreePlan);
//             console.log("Rendered tree layout:", htmlTree);
//             break;
//         case "SphereGrid":
//             console.log("Rendering SphereGrid layout...");
//             renderSphereGrid(degreePlan, networkContainer); // Render sphere grid directly
//             console.log("Rendered SphereGrid layout.");
//             return; // Skip appending since renderSphereGrid handles rendering
//         default:
//             console.error("Unknown layout:", currentLayout);
//             return;
//     }

//     console.log("Appending rendered content to network container...");
//     networkContainer.appendChild(htmlTree); // Append the rendered content

//     console.log("Calculating credit hours...");

//     console.log("Credit hours after calculation:", creditHours);

//     console.log("Updating progress bar...");
//     updateProgressBar(creditHours); // Update the progress bar
// }

