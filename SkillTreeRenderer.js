// --- Renderer ---
// Responsible for rendering the skill tree using vis-network.
export class SkillTreeRenderer {
	/**
	 * Renders the skill tree graph in the specified container.
	 * @param {string} containerId - The DOM element ID for the network.
	 * @param {Array} nodes - The array of node objects.
	 * @param {Array} edges - The array of edge objects.
	 */
	render(containerId, nodes, edges) {
		const container = document.getElementById(containerId);
		const data = {
			nodes: new vis.DataSet(nodes),
			edges: new vis.DataSet(edges),
		};
		const options = {
			nodes: { shape: "box", font: { size: 14 } },
			edges: { arrows: "to", smooth: false },
			physics: false,
		};
		new vis.Network(container, data, options);
	}

	/**
	 * Renders the skill tree grouped by blocks.
	 * @param {string} containerId - The DOM element ID for the parent container.
	 * @param {Array} nodes - The array of node objects (each should have a 'block' property).
	 * @param {Array} edges - The array of edge objects.
	 */
	renderByBlocks(containerId, nodes, edges) {
		const container = document.getElementById(containerId);
		container.innerHTML = ""; // Clear previous content

		// Group nodes by block
		const blocks = {};
		nodes.forEach(node => {
			const block = node.block || "Other";
			if (!blocks[block]) blocks[block] = [];
			blocks[block].push(node);
		});

		// For each block, create a div and render its nodes
		Object.entries(blocks).forEach(([blockTitle, blockNodes], i) => {
			const blockDiv = document.createElement("div");
			blockDiv.className = "block-container";
			blockDiv.style.marginBottom = "2em";
			blockDiv.style.border = "1px solid #ccc";
			blockDiv.style.padding = "1em";
			blockDiv.style.background = "#fafbfc";

			const title = document.createElement("h3");
			title.textContent = blockTitle;
			blockDiv.appendChild(title);

			// You can render a mini-network or just list the courses
			const list = document.createElement("ul");
			blockNodes.forEach(node => {
				const item = document.createElement("li");
				item.textContent = node.label;
				list.appendChild(item);
			});
			blockDiv.appendChild(list);

			container.appendChild(blockDiv);
		});
	}
}
