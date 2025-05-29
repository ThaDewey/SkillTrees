import { parseDegreePlanForD3 } from "./DegreePlanParser.js";

export function renderD3TechTree(degreePlan) {
    d3.select("#d3tree").selectAll("*").remove();

    // Convert to D3 hierarchy and then to flat graph
    const data = parseDegreePlanForD3(degreePlan);
    const { nodes, links } = degreePlanToGraph(data);

    const width = window.innerWidth - 40;
    const height = 900;

    const svg = d3.select("#d3tree")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Add a group to hold all graph elements
    const container = svg.append("g");

    // Enable zoom and pan on the SVG
    svg.call(
        d3.zoom()
            .scaleExtent([0.1, 3])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            })
    );

    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links).id(d => d.id).distance(120))
        .force("charge", d3.forceManyBody().strength(-400))
        .force("center", d3.forceCenter(width / 2, height / 2));

    // Use 'container' instead of 'svg' for all elements:
    const link = container.append("g")
        .attr("stroke", "#999")
        .attr("stroke-opacity", 0.6)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("stroke-width", 2);

    const node = container.append("g")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .selectAll("rect")
        .data(nodes)
        .join("rect")
        .attr("width", 90)
        .attr("height", 32)
        .attr("rx", 10)
        .attr("ry", 10)
        .attr("fill", d => color(d.group))
        .call(drag(simulation));

    const label = container.append("g")
        .selectAll("text")
        .data(nodes)
        .join("text")
        .text(d => d.label)
        .attr("font-size", 13)
        .attr("dy", 20)
        .attr("dx", 10);

    simulation.on("tick", () => {
        link
            .attr("x1", d => d.source.x + 45)
            .attr("y1", d => d.source.y + 16)
            .attr("x2", d => d.target.x + 45)
            .attr("y2", d => d.target.y + 16);

        node
            .attr("x", d => d.x)
            .attr("y", d => d.y);

        label
            .attr("x", d => d.x)
            .attr("y", d => d.y);
    });

    function drag(simulation) {
        return d3.drag()
            .on("start", event => {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            })
            .on("drag", event => {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            })
            .on("end", event => {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            });
    }
}

// Helper function from above
function degreePlanToGraph(degreePlan) {
    const nodes = [];
    const links = [];
    let nodeId = 0;

    function traverse(node, parentId = null) {
        const thisId = nodeId++;
        nodes.push({
            id: thisId,
            label: node.label || node.name || node.id || `Node ${thisId}`,
            group: node.type || node.reqType || 1
        });
        if (parentId !== null) {
            links.push({ source: parentId, target: thisId });
        }
        if (node.children) {
            node.children.forEach(child => traverse(child, thisId));
        }
    }

    traverse(degreePlan);
    return { nodes, links };
}