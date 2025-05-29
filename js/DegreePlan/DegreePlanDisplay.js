// DegreePlanDisplay.js

import { DegreePlanLoader } from "./DegreePlanLoader.js";
import { renderStructure } from "./DegreeSheetView.js";
import { renderSphereGrid, renderForceLayout, renderRadialLayout, renderMindMapLayout, renderHierarchicalLayout, renderTechTreeLayout } from "./SphereGridView.js";
import { renderD3TechTree } from "./D3TechTree.js";
import { randomlyCompleteCourses } from "./js/DegreePlan/DegreePlanParser.js";

let degreeTitle = "Degree Plan";

// Get initial layout from URL, default to DegreeSheet
function getInitialLayout() {
	const params = new URLSearchParams(window.location.search);
	const view = params.get("view");
	if (view === "SphereGrid" || view === "DegreeSheet") {
		return view;
	}
	return "DegreeSheet";
}

let currentLayout = getInitialLayout();

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
	window.degreePlan = degreePlan;

	// Add this line here:
	updateCreditProgress(degreePlan);

	// Get the network container
	const networkContainer = document.getElementById("network");

	// Clear the network container
	if (networkContainer) networkContainer.innerHTML = "";

	// Render the appropriate layout
	if (currentLayout === "SphereGrid") {
		renderSphereGrid(degreePlan, networkContainer);
	} else if (currentLayout === "force") {
		renderForceLayout(degreePlan, networkContainer);
	} else if (currentLayout === "radial") {
		renderRadialLayout(degreePlan, networkContainer);
	} else if (currentLayout === "DegreeSheet") {
		renderStructure(degreePlan, networkContainer);
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

	// Randomly complete some courses for demonstration
	randomlyCompleteCourses(degreePlan);
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
 * Renders a single rule, handling nested ruleset