// --- Parser ---
// Responsible for parsing the degree plan blocks into nodes (courses) and edges (connections).

export class DegreePlanParser {
	/**
	 * Parses the degree plan to extract school, major, year, nodes, and edges.
	 * Arranges nodes vertically by block, with each block on a new row.
	 * @param {Object} degreePlan - The full degree plan JSON object.
	 * @returns {{courses: Array, edges: Array, school: string, major: string, year: string}} - Parsed data.
	 */
	parse(degreePlan) {
		const school = degreePlan.school || "Unknown School";
		const major = degreePlan.major || "Unknown Major";
		const degree = degreePlan.blocks[1].Title || "Unknown Major"; // Assuming the second block contains the degree title
		const year = degreePlan.year || "Unknown Year";
		const blocks = degreePlan.blocks || [];
		const courses = [];
		const edges = [];
		let nodeId = 1;
		const idMap = {};

		// Vertical layout variables
		const blockSpacing = 250; // vertical space between blocks
		const courseSpacing = 180; // horizontal space between courses

		/**
		 * Adds a course as a node if not already present.
		 * @param {Object} course - The course object.
		 * @param {string} labelPrefix - Optional prefix for the node label.
		 * @param {number} x - X position for the node.
		 * @param {number} y - Y position for the node.
		 * @param {string} block - Optional block identifier.
		 * @returns {number|null} - The node's unique ID or null if not added.
		 */
		function addCourse(course, labelPrefix = "", x = 0, y = 0, block = "") {
			if (course.Hide === 1) return null;

			// let isCourseAtSymbol = course.Subj === "@";
			// let courseWith = course.With?.ATTRIBUTE ? `Requirement: ${attributeNames[course.With.ATTRIBUTE] || course.With.ATTRIBUTE}` : null;

			let label = `${course.Subj} ${course.Num}`;

			if (!label) return null;

			// label = labelPrefix ? `${labelPrefix}: ${label}` : label;

			if (!idMap[label]) {
				idMap[label] = nodeId++;
				courses.push({ id: idMap[label], label, x, y, fixed: { x: true, y: true }, block });
			}
			return idMap[label];
		}

		// Traverse blocks and rules to build nodes and edges, vertically by block
		blocks.forEach((block, blockIdx) => {
			let courseIdx = 0;
			block.rules?.forEach((ruleGroup) => {
				ruleGroup.rules?.forEach((rule) => {
					let prevId = null;
					rule.courses?.forEach((course) => {
						// Position: x by course index, y by block index
						const x = courseIdx * courseSpacing;
						const y = blockIdx * blockSpacing;
						// Pass block title or ID to the node
						const currId = addCourse(course, rule.label, x, y, block.Title || block.BlockID || "");
						if (currId && prevId) {
							edges.push({ from: prevId, to: currId });
						}
						prevId = currId;
						courseIdx++;
					});
				});
			});
		});

		return { courses, edges, school, major, year, degree };
	}
}
