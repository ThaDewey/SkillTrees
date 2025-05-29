import { parseDegreePlanHierarchical } from "./DegreePlanParser.js";
import { buildSkillTreeGraph } from "./SkillTreeGraphBuilder.js";


/**
 * Generates points on a sphere using spherical coordinates.
 * @param {number} rows - Number of rows (latitude divisions).
 * @param {number} cols - Number of columns (longitude divisions).
 * @param {number} radius - Radius of the sphere.
 * @returns {Array} Array of points with x, y, z coordinates and metadata.
 */
function generateSphereGrid(rows, cols, radius = 150) {
    const points = [];
    for (let i = 0; i < rows; i++) {
        const theta = Math.PI * (i + 1) / (rows + 1); // Latitude
        for (let j = 0; j < cols; j++) {
            const phi = 2 * Math.PI * j / cols; // Longitude
            const x = radius * Math.sin(theta) * Math.cos(phi);
            const y = radius * Math.cos(theta);
            const z = radius * Math.sin(theta) * Math.sin(phi);
            points.push({ x, y, z, key: `${i}-${j}`, row: i, col: j });
        }
    }
    return points;
}

/**
 * Renders a hierarchical cluster view: Block > Category > Subcategory > Courses
 */
export function renderSphereGrid(degreePlan, container) {
    if (!container) {
        console.error("Network container not found!");
        return null;
    }

    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);

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
        physics: { enabled: true },
        nodes: { font: { color: "#000", size: 14 } },
        edges: { color: "#ccc" },
        interaction: { dragNodes: true, multiselect: true },
        manipulation: {
            enabled: true
        }
    };

    new vis.Network(container, data, options);
}

// Force-directed layout (default vis-network)
export function renderForceLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);
    renderVisNetwork({ nodes, edges, groupMap }, container, { physics: true });
}

// Radial layout (example: disables physics, you can add custom positioning)
export function renderRadialLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);

    // Helper to set node position (do not fix except center)
    function setNodePos(id, x, y, fix = false) {
        const node = nodes.find(n => n.id === id);
        if (node) {
            node.x = x;
            node.y = y;
            node.fixed = fix ? { x: true, y: true } : false;
        }
    }

    const centerX = 0, centerY = 0;
    const radius = 350;

    // Place major node at center and fix it
    setNodePos("major-center", centerX, centerY, true);

    // Place block nodes in a circle around the center (not fixed)
    const blockNodes = nodes.filter(n => typeof n.id === "string" && n.id.startsWith("block-"));
    const blockCount = blockNodes.length;
    blockNodes.forEach((blockNode, idx) => {
        const angle = (2 * Math.PI * idx) / blockCount;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);
        setNodePos(blockNode.id, x, y, false); // not fixed
    });

    // (Optional) You can also set initial positions for categories, subcats, etc.

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    const options = {
        physics: { enabled: true }, // Enable physics!
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
        manipulation: { enabled: true }
    };
    new vis.Network(container, data, options);
}

// Mind Map Layout: Major in center, blocks as main branches, categories/subcategories/courses as sub-branches.
export function renderMindMapLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);

    // Helper to set/fix node position by id
    function setNodePos(id, x, y, fix = false) {
        const node = nodes.find(n => n.id === id);
        if (node) {
            node.x = x;
            node.y = y;
            if (fix) {
                node.fixed = { x: true, y: true };
            } else {
                node.fixed = false;
            }
        }
    }

    const centerX = 0, centerY = 0;
    const blockRadius = 300;
    const catRadius = 120;
    const subcatRadius = 60;
    const courseRadius = 30;

    // Place major node at center
    setNodePos("major-center", centerX, centerY);

    // Find block nodes
    const blockNodes = nodes.filter(n => typeof n.id === "string" && n.id.startsWith("block-"));
    const blockCount = blockNodes.length;

    blockNodes.forEach((blockNode, bIdx) => {
        // Place blocks in a circle around major
        const blockAngle = (2 * Math.PI * bIdx) / blockCount;
        const bx = centerX + blockRadius * Math.cos(blockAngle);
        const by = centerY + blockRadius * Math.sin(blockAngle);
        setNodePos(blockNode.id, bx, by);

        // Find categories for this block
        const catNodes = nodes.filter(n =>
            typeof n.id === "string" &&
            n.id.startsWith(`cat-${blockNode.id.split("-")[1]}-`)
        );
        const catCount = catNodes.length;
        catNodes.forEach((catNode, cIdx) => {
            // Place categories in a circle around block
            const catAngle = blockAngle + (Math.PI / blockCount) * (cIdx - (catCount - 1) / 2);
            const cx = bx + catRadius * Math.cos(catAngle);
            const cy = by + catRadius * Math.sin(catAngle);
            setNodePos(catNode.id, cx, cy);

            // Find subcategories for this category
            const catParts = catNode.id.split("-");
            const subcatNodes = nodes.filter(n =>
                typeof n.id === "string" &&
                n.id.startsWith(`subcat-${catParts[1]}-${catParts[2]}-`)
            );
            const subcatCount = subcatNodes.length;
            subcatNodes.forEach((subcatNode, sIdx) => {
                // Place subcategories in a circle around category
                const subcatAngle = catAngle + (Math.PI / catCount) * (sIdx - (subcatCount - 1) / 2);
                const sx = cx + subcatRadius * Math.cos(subcatAngle);
                const sy = cy + subcatRadius * Math.sin(subcatAngle);
                setNodePos(subcatNode.id, sx, sy);

                // Find courses for this subcategory
                const courseNodes = nodes.filter(n =>
                    typeof n.group === "string" &&
                    n.group === `${catParts[1]}-${catParts[2]}-${sIdx}`
                );
                const courseCount = courseNodes.length;
                courseNodes.forEach((courseNode, crsIdx) => {
                    // Place courses in a circle around subcategory
                    const courseAngle = subcatAngle + (Math.PI / subcatCount) * (crsIdx - (courseCount - 1) / 2);
                    const crsx = sx + courseRadius * Math.cos(courseAngle);
                    const crsy = sy + courseRadius * Math.sin(courseAngle);
                    setNodePos(courseNode.id, crsx, crsy);
                });
            });
        });
    });

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    const options = {
        physics: true, // Disable physics for fixed positions
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
        manipulation: { enabled: true }
    };
    new vis.Network(container, data, options);
}

// Hierarchical layout: Directed tree structure (e.g., Block > Category > Subcategory > Courses)
export function renderHierarchicalLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: "UD", // "UD" = top-down, "LR" = left-right, etc.
                sortMethod: "directed",
                nodeSpacing: 200,
                levelSeparation: 150,
                treeSpacing: 300
            }
        },
        physics: false, // Physics off for hierarchical
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
        manipulation: { enabled: true }
    };

    new vis.Network(container, data, options);
}

// Tech Tree Layout: Similar to hierarchical but with adjustable parameters
export function renderTechTreeLayout(degreePlan, container) {
    const { nodes, edges, groupMap } = buildSkillTreeGraph(degreePlan);

    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    const options = {
        layout: {
            hierarchical: {
                enabled: true,
                direction: "LR", // Left-to-right
                sortMethod: "directed",
                nodeSpacing: 180,
                levelSeparation: 120,
                treeSpacing: 200
            }
        },
        physics: false,
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
        manipulation: { enabled: true }
    };

    new vis.Network(container, data, options);
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

// Helper: Project 3D to 2D
function project({ x, y, z }, width, height, fov = 400, viewerZ = 400) {
    const scale = fov / (viewerZ - z);
    return {
        x: width / 2 + x * scale,
        y: height / 2 - y * scale,
    };
}

// Helper: Assign colors by block
function blockColor(idx) {
    const palette = [
        "#6cf", "#fc6", "#c6f", "#6fc", "#f66", "#6f6", "#66f", "#ccc"
    ];
    return palette[idx % palette.length];
}


window.setLayout = function(layoutType) {
    const container = document.getElementById("network");
    container.innerHTML = "";
    if (layoutType === "force") {
        renderForceLayout(window.degreePlan, container);
    } else if (layoutType === "radial") {
        renderRadialLayout(window.degreePlan, container);
    } else if (layoutType === "mindmap") {
        renderMindMapLayout(window.degreePlan, container);
    } else if (layoutType === "hierarchical") {
        renderHierarchicalLayout(window.degreePlan, container);
    }
};
