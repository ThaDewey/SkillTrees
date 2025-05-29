import { parseDegreePlanHierarchical } from "./DegreePlanParser.js";

export function buildSkillTreeGraph(degreePlan) {
    const blocks = parseDegreePlanHierarchical(degreePlan);

    const nodes = [];
    const edges = [];
    let nodeId = 1;
    const groupMap = {};

    // Add the central "major" node
    const majorLabel = degreePlan.major || "Major";
    const majorNodeId = "major-center";
    nodes.push({
        id: majorNodeId,
        label: majorLabel,
        shape: "ellipse",
        color: "#ffd700",
        font: { color: "#222", size: 32, vadjust: -10 }
    });

    blocks.forEach((block, bIdx) => {
        const blockId = `block-${bIdx}`;
        nodes.push({
            id: blockId,
            label: block.label,
            shape: "ellipse",
            color: "#9cf",
            font: { color: "#222", size: 24, vadjust: -10 }
        });
        edges.push({ from: majorNodeId, to: blockId });

        block.categories.forEach((category, cIdx) => {
            const categoryId = `cat-${bIdx}-${cIdx}`;
            nodes.push({
                id: categoryId,
                label: category.label,
                shape: "ellipse",
                color: "#aee",
                font: { color: "#222", size: 20, vadjust: -10 }
            });
            edges.push({ from: blockId, to: categoryId });

            category.subcategories.forEach((subcat, sIdx) => {
                const groupId = `${bIdx}-${cIdx}-${sIdx}`;
                groupMap[groupId] = subcat.label;

                const subcatNodeId = `subcat-${groupId}`;
                nodes.push({
                    id: subcatNodeId,
                    label: subcat.label,
                    shape: "ellipse",
                    color: "#bcd",
                    font: { color: "#222", size: 18, vadjust: -10 }
                });
                edges.push({ from: categoryId, to: subcatNodeId });

                (subcat.courses || []).forEach((course) => {
                    nodes.push({
                        id: nodeId,
                        label: `${course.subj} ${course.num}`,
                        group: groupId,
                        title: `${block.label}\n${category.label}\n${subcat.label}`,
                        shape: "box"
                    });
                    edges.push({ from: subcatNodeId, to: nodeId });
                    nodeId++;
                });
            });
        });
    });

    return { nodes, edges, groupMap };
}

// Standard force-directed layout
export function renderForceLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);
    renderVisNetwork({ nodes, edges, groupMap }, container, { physics: true });
}

// Radial layout (example: arrange nodes in a circle)
export function renderRadialLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);
    // Arrange nodes in a circle (modify nodes' x/y here if you want)
    // ...custom radial positioning logic...
    renderVisNetwork({ nodes, edges, groupMap }, container, { physics: false });
}

// Helper to render with vis-network
function renderVisNetwork({ nodes, edges, groupMap }, container, extraOptions = {}) {
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    const options = {
        groups: Object.fromEntries(
            Object.entries(groupMap).map(([id, label]) => [
                id,
                {
                    label,
                    color: { background: "#e0e7ef", border: "#8ca0c8" },
                    font: { color: "#222", size: 16 }
                }
            ])
        ),
        nodes: { font: { color: "#000", size: 14 } },
        edges: { color: "#ccc" },
        interaction: { dragNodes: true, multiselect: true },
        manipulation: { enabled: true },
        ...extraOptions
    };
    new vis.Network(container, data, options);
}