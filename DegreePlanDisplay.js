// DegreePlanDisplay.js

import { DegreePlanLoader } from "./DegreePlanLoader.js";
import { renderStructure } from "./DegreeSheetView.js";
import { renderSphereGrid } from "./SphereGridView.js";

let degreeTitle = "Degree Plan";

// Track the current layout type
let currentLayout = "DegreeSheet"; // default layout




/**
 * Switches the layout and re-renders.
 * @param {string} layoutType - "DegreeSheet", "raw", "tree", etc.
 */
window.changeLayout = function (layoutType) {
	console.log("Changing layout to:", layoutType);
	currentLayout = layoutType;
	renderDegreePlan(layoutType);
};

/**
 * Main render function that chooses the layout.
 */
async function renderDegreePlan() {
    console.log("Rendering degree plan with layout:", currentLayout);
    const urlParams = new URLSearchParams(window.location.search);
    let key = urlParams.get("key");
    if (!/^\d{4}$/.test(key)) {
        key = "5040";
    }

    const loader = new DegreePlanLoader();
    const degreePlan = await loader.load(`DegreeJSON/${key}.json`);

    // Get the network container
    const networkContainer = document.getElementById("network");

    // Clear the network container
    if (networkContainer) networkContainer.innerHTML = "";

    // Render the appropriate layout
    if (currentLayout === "SphereGrid") {
        renderSphereGrid(degreePlan, networkContainer); // Render directly into the network container
        return; // Skip appending since renderSphereGrid handles rendering
    }

    let htmlTree;
    switch (currentLayout) {
        case "raw":
            htmlTree = renderRawJSON(degreePlan);
            break;
        case "tree":
            htmlTree = renderTree(degreePlan);
            break;
        case "DegreeSheet":
        default:
            htmlTree = renderStructure(degreePlan);
            break;
    }

    networkContainer.appendChild(htmlTree);
}

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
