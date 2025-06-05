// DegreePlanDisplay.js

import { DegreePlanLoader } from "./DegreePlanLoader.js";
import { renderStructure } from "./DegreeSheetView.js";
import { renderSphereGrid } from "./SphereGridView.js";
import { calculateCreditHours, updateProgressBar } from "./DegreeSheetCreditHours.js"; // Import the functions

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

	// Get the major code from the URL
	const urlParams = new URLSearchParams(window.location.search);
	let key = urlParams.get("key");
	console.log("Degree plan key:", key);

	// Validate the major code (must be a 4-digit number)
	if (!/^\d{4}$/.test(key)) {
		key = "5040"; // Default key if invalid
		console.log("Invalid key detected. Using default key:", key);
	}

	// Load the JSON file for the major code
	const loader = new DegreePlanLoader();
	const jsonPath = `DegreeJSON/${key}.json`;
	console.log("Loading degree plan from:", jsonPath);
	const degreePlan = await loader.load(jsonPath);

	if (!degreePlan) {
		console.error("Failed to load degree plan!");
		return;
	}
	console.log("Loaded degree plan:", degreePlan);

	// Get the container for rendering
	const networkContainer = document.getElementById("network");
	if (!networkContainer) {
		console.error("Network container not found!");
		return;
	}

	console.log("Clearing network container...");
	networkContainer.innerHTML = ""; // Clear previous content

	// Render the degree plan based on the current layout
	switch (currentLayout) {
		case "DegreeSheet":
			console.log("Rendering DegreeSheet layout...");
			const { DegreeInfo, html, data } = await renderStructure(degreePlan);
			console.log("Degree Info:", DegreeInfo);
			console.log("Rendered HTML:", html);
			console.log("Parsed Data:", data);
			networkContainer.appendChild(html);

			console.log("Calculating credit hours...");
			const creditHours = calculateCreditHours(DegreeInfo, data);
			console.log("Credit hours after calculation:", creditHours);

			console.log("Updating progress bar...");
			updateProgressBar(creditHours);
			break;

		case "raw":
			console.log("Rendering raw JSON layout...");
			const rawJson = renderRawJSON(degreePlan);
			networkContainer.appendChild(rawJson);
			break;

		case "tree":
			console.log("Rendering tree layout...");
			const treeView = renderTree(degreePlan);
			networkContainer.appendChild(treeView);
			break;

		case "SphereGrid":
			console.log("Rendering SphereGrid layout...");
			renderSphereGrid(degreePlan, networkContainer);
			break;

		default:
			console.error("Unknown layout:", currentLayout);
			break;
	}
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
 * Renders a single rule, handling nested rulesets.
 * @param {Object} rule - The rule object to render.
 * @returns {HTMLElement}
 */
function renderRule(rule) {
	const ruleDiv = BuildElement("div", rule.label, "rule");
	ruleDiv.dataset.ruleId = rule.id;

	// Render prerequisites
	if (rule.prereqs && rule.prereqs.length > 0) {
		const prereqsDiv = BuildElement("div", null, "prereqs");
		prereqsDiv.appendChild(BuildElement("strong", "Prerequisites:"));
		prereqsDiv.appendChild(renderRules(rule.prereqs));
		ruleDiv.appendChild(prereqsDiv);
	}

	// Render corequisites
	if (rule.coreqs && rule.coreqs.length > 0) {
		const coreqsDiv = BuildElement("div", null, "coreqs");
		coreqsDiv.appendChild(BuildElement("strong", "Corequisites:"));
		coreqsDiv.appendChild(renderRules(rule.coreqs));
		ruleDiv.appendChild(coreqsDiv);
	}

	// Render mutually exclusive rules
	if (rule.mutually_exclusive && rule.mutually_exclusive.length > 0) {
		const meDiv = BuildElement("div", null, "mutually-exclusive");
		meDiv.appendChild(BuildElement("strong", "Mutually Exclusive:"));
		meDiv.appendChild(renderRules(rule.mutually_exclusive));
		ruleDiv.appendChild(meDiv);
	}

	// Render comments
	if (rule.comments && rule.comments.length > 0) {
		const commentsDiv = BuildElement("div", null, "comments");
		commentsDiv.appendChild(BuildElement("strong", "Comments:"));
		rule.comments.forEach((comment) => {
			commentsDiv.appendChild(BuildElement("div", comment));
		});
		ruleDiv.appendChild(commentsDiv);
	}

	return ruleDiv;
}

/**
 * Updates the credit progress display.
 * @param {Object} degreePlan - The degree plan object.
 */
function updateCreditProgress(degreePlan) {
	const totalCredits = degreePlan.rules.reduce((sum, rule) => sum + (rule.credits || 0), 0);
	const completedCredits = degreePlan.rules.reduce((sum, rule) => sum + (rule.completedCredits || 0), 0);
	const progressElement = document.getElementById("credit-progress");

	if (progressElement) {
		progressElement.textContent = `Credits: ${completedCredits} / ${totalCredits}`;
	} else {
		console.warn("Credit progress element not found!");
	}
}

// Initial render
renderDegreePlan();