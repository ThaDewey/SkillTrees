import { parseDegreePlanHierarchical, parseDegreePlanFlat } from "./DegreePlanParser.js";
import * as html from "./domUtils.js";

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

let codes = {};
let majorcode = -9999;

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

    const htmlStructure = html.BuildElement("div");
    htmlStructure.className = "degree-plan";
    let info = {};
    // Render sections
    const header = renderHeader(degreePlan);
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

function renderHeader(degreePlan) {
    const header = html.BuildElement("div");
    header.classList.add("header", "container");
    const upperHeader = RenderUpperHeader(degreePlan);
    const bodyHeader = renderBodyHeader(degreePlan);
    header.appendChild(upperHeader);
    header.appendChild(bodyHeader);

    return header;
}

function RenderUpperHeader(degreePlan) {
    const div = html.BuildElement("div");
    div.classList.add("row", "justify-content-between");

    const title = html.BuildElement("p", `University of Central Oklahoma Undergraduate Catalog ${degreePlan.Cat_yr_start}-${degreePlan.Cat_yr}`);

    console.log("codes", codes);

    const CodeInfo = codes.majors[degreePlan.major];
    majorcode = degreePlan.major;
    console.log("Code Info:", CodeInfo);

    const major_top = html.BuildElement("p", `${degreePlan.major || "Uknown"}`);
    const hr_top = html.BuildElement("hr");

    title.classList.add("col");
    major_top.classList.add("col");


    div.appendChild(major_top);
    div.appendChild(title);
    div.appendChild(hr_top);

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


    const program = html.BuildElement("p", `Program: ${programName}`);
    l_col.appendChild(program);

    const major = html.BuildElement("p", `Major: ${awardType}`);
    l_col.appendChild(major);

    const degree = html.BuildElement("p", `Degree: ${degreeType}`);
    l_col.appendChild(degree);

    const dept = html.BuildElement("p", `Dept: ${degreePlan.dept || "Not Yet Implmented"}`);
    r_col.appendChild(dept);

    const college = html.BuildElement("p", `College: ${collegeName}`);
    r_col.appendChild(college);

    const majorCode = html.BuildElement("p", `Major Code: ${degreePlan.major || "Uknown"}`);
    r_col.appendChild(majorCode);

    // Add a horizontal rule to visually separate sections within the body header
    const hr_bot = html.BuildElement("hr");
    div.appendChild(hr_bot);



    return div;


}


function renderUniversityCore(blocks) {
    const coreBlock = blocks.find((block) => block.type === "core");
    const universityCore = html.BuildElement("div");
    universityCore.classList.add("university-core", "row");

    // Check if blocks[0] and its label exist
    if (!blocks[0] || !blocks[0].label) {
        console.error("Invalid block or missing label in blocks[0]:", blocks[0]);
        return universityCore; // Return early
    }

    // Check if DegreeMinMax entry exists for the label
    const coreMinMax = codes.DegreeMinMax[blocks[0].label];
    if (!coreMinMax) {
        console.error(`DegreeMinMax entry not found for label: ${blocks[0].label}`);
        return universityCore; // Return early
    }

    const title = html.BuildElement("h2", `University Core (Total Listed ${coreMinMax.min}-${coreMinMax.max})`);
    title.classList.add("col", "text-center");
    universityCore.appendChild(title);

    if (coreBlock && coreBlock.categories) {
        const coreList = html.CreateElement("div");
        coreList.classList.add("core-list", "row");
        coreBlock.categories.forEach((category) => {
            const categorydiv = html.CreateElement("div");
            categorydiv.classList.add("category-item", "row", "justify-content-between");
            const categoryHeader = html.BuildElement("h4", `${category.label || "Category"} `);
            categorydiv.classList.add("col-6", "category");
            coreList.appendChild(categorydiv);
            categorydiv.appendChild(categoryHeader);

            if (category.subcategories) {
                const subcategoryList = html.BuildElement("div");
                category.subcategories.forEach((subcategory) => {
                    const subcategoryItem = html.BuildElement("div", `${subcategory.label || "Subcategory"}: ${subcategory.reqCount || 0}`);
                    subcategoryItem.className = "col";
                    subcategoryList.appendChild(subcategoryItem);
                });
                categorydiv.appendChild(subcategoryList);
            }

            const categoryMinMax = codes.DegreeMinMax[category.label];

            // Check if categoryMinMax is an object or integer
            if (typeof categoryMinMax === "object" && categoryMinMax !== null) {
                categoryHeader.innerHTML += ` (${categoryMinMax.min !== undefined ? categoryMinMax.min : ""}${categoryMinMax.max !== undefined ? "-" + categoryMinMax.max : ""})`;
            } else if (typeof categoryMinMax === "number") {
                categoryHeader.innerHTML += ` (${categoryMinMax})`;
            }


            console.log(`Category MinMax: ${categoryMinMax} | Label: ${category.label}`);


        });
        universityCore.appendChild(coreList);
    }

    universityCore.appendChild(html.BuildElement("hr"));
    return universityCore;
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
    const majorRequirements = html.CreateElement("div");

    majorRequirements.classList.add("major-requirements", "row");

    const title = html.BuildElement("h2", "Major Requirements");
    title.classList.add("col-12", "text-center");
    majorRequirements.appendChild(title);


    const degreeTitle = html.BuildElement("h2", codes.majors[majorcode].name);
    title.classList.add("col-12");
    majorRequirements.appendChild(degreeTitle);

    if (majorBlock && majorBlock.categories) {
        const majorList = html.CreateElement("div");
        majorList.id = majorBlock.id;

        majorBlock.categories.forEach((category) => {
            const categoryHeader = html.BuildElement("h3", `11 ${category.label || "Requirement"}: ${category.credits || 0}`);
            majorList.appendChild(categoryHeader);
            
            const categoryItem = html.CreateElement("div");
            categoryItem.id = category.id;
            categoryItem.classList.add("col-6", "CategoryItem");
            majorList.appendChild(categoryItem);



            if (category.subcategories) {
                const subcategoryList = html.CreateElement("div");
                subcategoryList.classList.add("subcategory-list");


                category.subcategories.forEach((subcategory) => {
                    const subcategoryItem = html.CreateElement("div");
                    subcategoryList.appendChild(subcategoryItem);
                    
                    const subcategoryHeader = html.BuildElement("p", `${subcategory.label || "Subcategory"}`);
                    subcategoryList.appendChild(subcategoryHeader);

                    // const subcategoryHeader = html.BuildElement("p", `${subcategory.label || "Subcategory"}: ${subcategory.reqCount || 0}`);
                    subcategoryList.appendChild(subcategoryHeader);

                });
                categoryItem.appendChild(subcategoryList);
            }
        });
        majorRequirements.appendChild(majorList);
    }

    return majorRequirements;
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