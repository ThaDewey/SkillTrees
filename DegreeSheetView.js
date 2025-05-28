export function renderStructure(degreePlan) {
    let degreeTitle = degreePlan.blocks[1]?.Title || "Degree Plan";
    const degreeInfo = getDegreeInfo(degreePlan);
    const blocks = getBlockInfo(degreePlan);
    const htmlStructure = BuildElement("div");
    htmlStructure.className = "degree-info";

    let htmlDegreeInfo = renderDegreeInfo(degreeInfo, degreeTitle);
    htmlStructure.appendChild(htmlDegreeInfo);

    let htmlBlocks = renderBlocks(blocks);
    htmlStructure.appendChild(htmlBlocks);

    // Replace the h2 with id or degree with the Degreetitle
    const h2s = document.getElementsByTagName("h2");
    for (let h2 of h2s) {
        if (h2.id === "degree" || h2.id === "Degree") {
            h2.textContent = degreeTitle;
        }
    }
    return htmlStructure;
}

function renderDegreeInfo(degreeInfo, degreeTitle) {
    const infoDiv = BuildElement("div");
    infoDiv.className = "degree-info";
    let fire = BuildElement("p", degreeTitle);
    infoDiv.appendChild(fire);

    Object.entries(degreeInfo).forEach(([key, value]) => {
        let el = BuildElement("p", `${key}: ${value}`);
        infoDiv.appendChild(el);
    });

    return infoDiv;
}

function renderBlocks(blocks) {
    const blocksContainer = BuildElement("div");
    blocksContainer.className = "blocks-container";

    if (!Array.isArray(blocks)) return blocksContainer;

    blocks.forEach((block) => {
        const blockDiv = BuildElement("div");
        blockDiv.className = "block";

        const blockType = BuildElement("h2", block.BlockType === "CORE" ? "Core" : "Program");
        const title = BuildElement("h3", block.Title || "Untitled Block");
        const id = BuildElement("p", `ID: ${block.BlockID || "Unknown ID"}`);
        const credits = BuildElement("p", `Credits: ${block.Credits || 0}`);

        blockDiv.appendChild(blockType);
        blockDiv.appendChild(title);
        blockDiv.appendChild(id);
        blockDiv.appendChild(credits);

        // Render categories (top-level rules)
        if (Array.isArray(block.rules) && block.rules.length > 0) {
            const categoriesContainer = renderCategories(block.rules);
            blockDiv.appendChild(categoriesContainer);
        }

        blocksContainer.appendChild(blockDiv);
    });

    return blocksContainer;
}

function renderCategories(categories) {
    const categoriesContainer = BuildElement("div");
    categoriesContainer.className = "categories-container";

    categories.forEach((category) => {
        const categoryDiv = BuildElement("div");
        categoryDiv.className = "category";
        const categoryLabel = BuildElement("h4", category.label || "Category");
        categoryDiv.appendChild(categoryLabel);

        // Render subcategories (nested rules)
        if (Array.isArray(category.rules) && category.rules.length > 0) {
            const subcategoriesContainer = renderSubcategories(category.rules);
            categoryDiv.appendChild(subcategoriesContainer);
        }

        categoriesContainer.appendChild(categoryDiv);
    });

    return categoriesContainer;
}

function renderSubcategories(subcategories) {
    const subcategoriesContainer = BuildElement("div");
    subcategoriesContainer.className = "subcategories-container";

    subcategories.forEach((subcat) => {
        const subcatDiv = BuildElement("div");
        subcatDiv.className = "subcategory";
        const subcatLabel = BuildElement("h5", subcat.label || "Subcategory");
        subcatDiv.appendChild(subcatLabel);
        const categoryId = subcat.id || "unknown-category";

        const categoryCoursesCount = Array.isArray(subcat.courses) ? subcat.courses.length : 0;

        const Requirement = subcat.reqType || "Requirement Type";
        const RequirementCount = subcat.reqCount || 0;
        const connections = subcat.Conn || "null";
        const categoryInfo = BuildElement("p", `ID: ${categoryId}, Courses: ${categoryCoursesCount}, Requirement: ${Requirement}, Count: ${RequirementCount}, Connections: ${connections}`);
        subcatDiv.appendChild(categoryInfo);

        // Render courses
        if (Array.isArray(subcat.courses) && subcat.courses.length > 0) {
            const courseList = BuildElement("ul");
            subcat.courses.forEach((course) => {
                if (course.Hide === 1) return;
                const courseLabel = course.Subj === "@" ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@") : `${course.Subj} ${course.Num}`;
                const courseItem = BuildElement("li", courseLabel);
                courseList.appendChild(courseItem);
            });
            subcatDiv.appendChild(courseList);
        }

        subcategoriesContainer.appendChild(subcatDiv);
    });

    return subcategoriesContainer;
}

function getDegreeInfo(degreePlan) {
    if (!degreePlan || typeof degreePlan !== "object") return {};

    return {
        school: degreePlan.school || "Unknown School",
        major: degreePlan.major || "Unknown Major",
        degree: degreePlan.degree || "Unknown Degree",
        year: degreePlan.year || "Unknown Year",
    };
}

function getBlockInfo(degreePlan) {
    if (!degreePlan || !Array.isArray(degreePlan.blocks)) return [];

    return degreePlan.blocks.map((block) => ({
        Title: block.Title || "Untitled Block",
        BlockID: block.BlockID || "Unknown ID",
        Credits: block.Credits || 0,
        BlockType: block.BlockType,
        rules: block.rules || [],
    }));
}

// Utility functions
function CreateElement(elementType) {
    return document.createElement(elementType);
}
function BuildElement(elementType, text) {
    let element = CreateElement(elementType);
    element = ApplyText(element, text);
    return element;
}
function ApplyText(element, text) {
    element.textContent = text;
    return element;
}