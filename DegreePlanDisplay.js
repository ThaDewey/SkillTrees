// --- Orchestrator ---
// Coordinates loading, parsing, layout, and rendering.
async function main(layoutType = "linear") {
	const loader = new DegreePlanLoader();
	const parser = new DegreePlanParser();
	const renderer = new SkillTreeRenderer();
	const layout = new HorizontalLayout();

	// Load the entire degree plan object
	const degreePlan = await loader.load("DegreeJSON/compSci.json");
	// Parse the full degree plan object (not just blocks)
	let { courses, edges, school, major, year, degree } = parser.parse(degreePlan);
	courses = layout.apply(courses);
	// Use renderByBlocks to group by block
	renderer.renderByBlocks("network", courses, edges);

	// Display school, major, and year in the HTML
	const infoDiv = document.getElementById("degree-info");
	if (infoDiv) {
		infoDiv.textContent = `School: ${school}, Major: ${major}, Year: ${year} , Degree: ${degree}`;
	}
}

// Expose layout change and initialize with horizontal layout on DOM ready.
window.changeLayout = function (layout) {
	main(layout);
};
window.addEventListener("DOMContentLoaded", () => main("linear"));

import { DegreePlanParser } from "./DegreePlanParser.js";
import { DegreePlanLoader } from "./DegreePlanLoader.js";
import { HorizontalLayout } from "./HorizontalLayout.js";
import { SkillTreeRenderer } from "./SkillTreeRenderer.js";
