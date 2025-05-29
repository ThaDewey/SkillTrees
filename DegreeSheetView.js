import { parseDegreePlanHierarchical } from "./DegreePlanParser.js";
import * as html from "./domUtils.js";

export function renderStructure(degreePlan) {
    // Use the shared parser
    const blocks = parseDegreePlanHierarchical(degreePlan);

    const htmlStructure = html.BuildElement("div");
    htmlStructure.className = "degree-info";

    // You can still use your degree info logic if you want
    let degreeTitle = blocks[1]?.label || "Degree Plan";
    let degreeInfo = {
        school: degreePlan.school || "Unknown School",
        major: degreePlan.major || "Unknown Major",
        degree: degreeTitle,
        year: degreePlan.year || "Unknown Year",
    };
    let htmlDegreeInfo = renderDegreeInfo(degreeInfo, degreeTitle);
    htmlStructure.appendChild(htmlDegreeInfo);

    // Render blocks using the parsed structure
    let htmlBlocks = renderBlocks(blocks);
    htmlStructure.appendChild(htmlBlocks);

    // Update the h2 title if needed
    const h2s = document.getElementsByTagName("h2");
    for (let h2 of h2s) {
        if (h2.id === "degree" || h2.id === "Degree") {
            h2.textContent = degreeTitle;
        }
    }
    return htmlStructure;
}

function renderDegreeInfo(degreeInfo, degreeTitle) {
    const infoDiv= html.BuildElement("div");
    infoDiv.className = "degree-info";
    let fire= html.BuildElement("p", degreeTitle);
    infoDiv.appendChild(fire);

    Object.entries(degreeInfo).forEach(([key, value]) => {
        let el= html.BuildElement("p", `${key}: ${value}`);
        infoDiv.appendChild(el);
    });

    return infoDiv;
}

function renderBlocks(blocks) {
    const blocksContainer= html.BuildElement("div");
    blocksContainer.className = "blocks-container";

    blocks.forEach((block) => {
        const blockDiv= html.BuildElement("div");
        blockDiv.className = "block";

        const blockType= html.BuildElement("h2", block.type === "core" ? "Core" : "Program");
        const title= html.BuildElement("h3", block.label || "Untitled Block");
        const id= html.BuildElement("p", `ID: ${block.id || "Unknown ID"}`);
        const credits= html.BuildElement("p", `Credits: ${block.credits || 0}`);

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
    const categoriesContainer= html.BuildElement("div");
    categoriesContainer.className = "categories-container";

    categories.forEach((category) => {
        const categoryDiv= html.BuildElement("div");
        categoryDiv.className = "category";
        const categoryLabel= html.BuildElement("h4", category.label || "Category");
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
    const subcategoriesContainer= html.BuildElement("div");
    subcategoriesContainer.className = "subcategories-container";

    subcategories.forEach((subcat) => {
        const subcatDiv= html.BuildElement("div");
        subcatDiv.className = "subcategory";
        const subcatLabel= html.BuildElement("h5", subcat.label || "Subcategory");
        subcatDiv.appendChild(subcatLabel);

        const categoryId = subcat.id || "unknown-category";
        const categoryCoursesCount = Array.isArray(subcat.courses) ? subcat.courses.length : 0;
        const Requirement = subcat.reqType || "Requirement Type";
        const RequirementCount = subcat.reqCount || 0;
        const connections = subcat.conn || "null";
        const categoryInfo= html.BuildElement("p", `ID: ${categoryId}, Courses: ${categoryCoursesCount}, Requirement: ${Requirement}, Count: ${RequirementCount}, Connections: ${connections}`);
        subcatDiv.appendChild(categoryInfo);

        // Render courses
        if (Array.isArray(subcat.courses) && subcat.courses.length > 0) {
            const courseList= html.BuildElement("ul");
            subcat.courses.forEach((course) => {
                const courseItem= html.BuildElement("li", course.label);
                courseList.appendChild(courseItem);
            });
            subcatDiv.appendChild(courseList);
        }

        subcategoriesContainer.appendChild(subcatDiv);
    });

    return subcategoriesContainer;
}

