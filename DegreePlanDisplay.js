// DegreePlanDisplay.js

import { DegreePlanLoader } from "./DegreePlanLoader.js";
import { renderStructure } from "./DegreeSheetView.js"; // <-- Import here

let degreeTitle = "Degree Plan";

// Track the current layout type
let currentLayout = "DegreeSheet"; // default layout

/**
 * Main render function that chooses the layout.
 */
async function renderDegreePlan() {
	const urlParams = new URLSearchParams(window.location.search);
	let key = urlParams.get("key");
	if (!/^\d{4}$/.test(key)) {
		key = "5040";
	}

	const loader = new DegreePlanLoader();
	const degreePlan = await loader.load(`DegreeJSON/${key}.json`);

	const container = document.getElementById("network");
	if (!container) return;
	container.innerHTML = "";

	let htmlTree;
	switch (currentLayout) {
		case "raw":
			htmlTree = renderRawJSON(degreePlan);
			break;
		case "tree":
			htmlTree = renderTree(degreePlan);
			break;
		case "SphereGrid":
			htmlTree = renderSphereGrid(degreePlan);
			break;
		case "DegreeSheet":
		default:
			htmlTree = renderStructure(degreePlan);
			break;
	}
	container.appendChild(htmlTree);
}

/**
 * Switches the layout and re-renders.
 * @param {string} layoutType - "DegreeSheet", "raw", "tree", etc.
 */
window.changeLayout = function (layoutType) {
	console.log("Changing layout to:", layoutType);
	currentLayout = layoutType;
	renderDegreePlan(layoutType);
};
// Render on initial page load
window.addEventListener("DOMContentLoaded", () => renderDegreePlan());

/**
 * Renders the raw JSON as formatted text.
 */
function renderRawJSON(degreePlan) {
	const pre = document.createElement("pre");
	pre.textContent = JSON.stringify(degreePlan, null, 2);
	return pre;
}

/**
 * Renders a simple tree view (optional, for demonstration).
 */
function renderTree(obj) {
	function walk(o) {
		if (Array.isArray(o)) {
			const ul = document.createElement("ul");
			o.forEach((item) => ul.appendChild(walk(item)));
			return ul;
		} else if (typeof o === "object" && o !== null) {
			const dl = document.createElement("dl");
			for (const key in o) {
				const dt = document.createElement("dt");
				dt.textContent = key;
				const dd = document.createElement("dd");
				dd.appendChild(walk(o[key]));
				dl.appendChild(dt);
				dl.appendChild(dd);
			}
			return dl;
		} else {
			return document.createTextNode(String(o));
		}
	}
	return walk(obj);
}

function renderDegreeInfo(degreeInfo) {
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

/**
 * Renders categories (top-level rules) for a block.
 */
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

/**
 * Renders subcategories (nested rules) for a category.
 */
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

/**
 * Renders a list of rules as HTML elements, supporting nested rulesets.
 * @param {Array} rules - The rules to render.
 * @returns {HTMLElement}
 */
/**
 * Renders a list of rules as HTML elements, supporting nested rulesets.
 * @param {Array} rules - The rules to render.
 * @returns {HTMLElement}
 */
function renderRules(rules) {
	console.log("Rendering rules:" + rules.labels);
	const rulesContainer = BuildElement("div");
	rulesContainer.className = "rules-container";

	rules.forEach((rule) => {
		const ruleDiv = renderRule(rule);
		rulesContainer.appendChild(ruleDiv);
	});

	return rulesContainer;
}

/**
 * Renders a single rule, handling nested rulesets and different rule types.
 * @param {Object|Array|string|number} rule - The rule to render.
 * @returns {HTMLElement}
 */
function renderRule(rule) {
	console.log("Rendering rule:" + rule.label);

	const ruleDiv = BuildElement("div");
	ruleDiv.className = "rule";
	ruleDiv.id = getRuleId(rule);

	if (isRuleObject(rule)) {
		renderRuleObject(rule, ruleDiv);
	} else if (Array.isArray(rule)) {
		renderRuleArray(rule, ruleDiv);
	} else {
		renderRulePrimitive(rule, ruleDiv);
	}

	return ruleDiv;
}

function renderRuleObject(rule, container) {
	console.log("Rendering rule object:" + rule.label);

	Object.entries(rule).forEach(([key, value]) => {
		if (key === "rules" && Array.isArray(value)) {
			console.log("Rendering nested rules for key: " + key);
			renderNestedRules(value, container);
		} else if (Array.isArray(value)) {
			console.log("Rendering rule array for key: " + key);
			renderRuleArrayField(key, value, container);
		} else {
			console.log("Rendering course for key: " + key);
			renderCourse(key, value, container);
		}
	});
}

function renderNestedRules(rulesArray, container) {
	console.log("Rendering nested rules:" + rulesArray.label);

	const nestedRules = renderRules(rulesArray);
	container.appendChild(nestedRules);
}

function renderRuleArrayField(key, valueArray, container) {
	const arrayTitle = BuildElement("p", `${key}:`);
	const arrayContainer = BuildElement("div");
	arrayContainer.className = "rule-array";
	valueArray.forEach((item) => {
		const itemDiv = renderRule(item);
		arrayContainer.appendChild(itemDiv);
	});
	container.appendChild(arrayTitle);
	container.appendChild(arrayContainer);
}

function renderCourse(key, value, container) {
	const courseItem = BuildElement("p", `1 ${key}: ${value}`);
	container.appendChild(courseItem);
}

function renderRuleArray(ruleArray, container) {
	console.log("Rendering rule array:", ruleArray);
	ruleArray.forEach((item) => {
		const itemDiv = renderRule(item);
		container.appendChild(itemDiv);
	});
}

function renderRulePrimitive(rule, container) {
	const ruleItem = BuildElement("p", String(rule));
	container.appendChild(ruleItem);
}

/**
 * Generates a unique or descriptive ID for a rule element.
 * @param {Object|Array|string|number} rule
 * @returns {string}
 */
function getRuleId(rule) {
	if (isRuleObject(rule) && rule.id) {
		return `rule-${rule.id}`;
	}
	return `rule-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Determines if a value is a rule object (not an array, not null, is object).
 * @param {any} rule
 * @returns {boolean}
 */
function isRuleObject(rule) {
	return rule && typeof rule === "object" && !Array.isArray(rule);
}

/**
 * Extracts and returns the degree information from the degree plan JSON.
 * @param {Object} degreePlan - The loaded degree plan object.
 * @returns {Object} - An object containing degree information.
 */
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
		rules: block.rules || [],
	}));
}

/**
 * Exposed function to trigger re-rendering of the degree plan.
 */
window.changeLayout = function () {
	renderDegreePlan();
};

// Render on initial page load
window.addEventListener("DOMContentLoaded", () => renderDegreePlan());

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

function renderSphereGrid(degreePlan) {
	// Placeholder: Replace this with your actual sphere grid rendering logic
	const div = document.createElement("div");
	div.textContent = "Sphere Grid View coming soon!";
	return div;
}
