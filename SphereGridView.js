import { DegreePlanParser } from "./DegreePlanParser.js";

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
 * Projects 3D points onto a 2D plane for visualization.
 * @param {Object} point - A point with x, y, z coordinates.
 * @param {number} width - Width of the canvas.
 * @param {number} height - Height of the canvas.
 * @param {number} fov - Field of view.
 * @param {number} viewerZ - Distance of the viewer from the sphere.
 * @returns {Object} Projected 2D coordinates.
 */
function project({ x, y, z }, width, height, fov = 400, viewerZ = 400) {
    const scale = fov / (viewerZ - z);
    return {
        x: width / 2 + x * scale,
        y: height / 2 - y * scale,
    };
}

/**
 * Generates nodes and edges for a sphere grid network.
 * @param {number} rows - Number of rows (latitude divisions).
 * @param {number} cols - Number of columns (longitude divisions).
 * @param {number} width - Width of the canvas.
 * @param {number} height - Height of the canvas.
 * @param {number} radius - Radius of the sphere.
 * @returns {Object} Nodes and edges for the network.
 */
function createSphereGridNetwork(rows = 8, cols = 16, width = 800, height = 800, radius = 300) {
    const points = generateSphereGrid(rows, cols, radius);

    // Create nodes
    const nodes = points.map(pt => {
        const pos = project(pt, width, height);
        return {
            id: pt.key,
            label: pt.key,
            x: pos.x,
            y: pos.y,
            fixed: true,
            shape: "dot",
            size: 16,
            color: "#6cf",
            borderWidth: 2
        };
    });

    // Create edges to connect neighboring points
    const edges = [];
    for (let pt of points) {
        const nextCol = (pt.col + 1) % cols; // Connect to next longitude
        edges.push({ from: pt.key, to: `${pt.row}-${nextCol}` });

        if (pt.row < rows - 1) { // Connect to next latitude
            edges.push({ from: pt.key, to: `${pt.row + 1}-${pt.col}` });
        }
    }

    return { nodes, edges };
}

/**
 * Renders the sphere grid based on the degree plan.
 * Maps blocks/categories/subcategories/courses to sphere nodes.
 * @param {Object} degreePlan - The degree plan data.
 */
export function renderSphereGrid(degreePlan, container) {
    if (!container) {
        console.error("Network container not found!");
        return null;
    }

    const parser = new DegreePlanParser();
    const { courses, edges, school, major, year, degree } = parser.parse(degreePlan);

    // Flatten all courses with block/category/subcategory info
    const courseDetails = [];
    courses.forEach((course, i) => {
        const blockIdx = Math.floor(i / (courses.length / 8));
        const categoryIdx = Math.floor((i % (courses.length / 8)) / (courses.length / 64));
        const subcatIdx = i % (courses.length / 64);
        courseDetails.push({
            ...course,
            blockIdx,
            categoryIdx,
            subcatIdx,
            courseIdx: i,
            blockLabel: `Block ${blockIdx + 1}`,
            categoryLabel: `Category ${categoryIdx + 1}`,
            subcategoryLabel: `Subcategory ${subcatIdx + 1}`,
        });
    });

    // Generate sphere points
    const rows = Math.ceil(Math.sqrt(courseDetails.length));
    const cols = Math.ceil(courseDetails.length / rows);
    const points = generateSphereGrid(rows, cols, 300);

    // Map courses to points
    const nodes = courseDetails.map((course, i) => {
        const pt = points[i];
        const pos = project(pt, 800, 800);
        return {
            id: `course-${i}`,
            label: `${course.blockLabel} > ${course.categoryLabel} > ${course.subcategoryLabel}: ${course.label}`,
            x: pos.x,
            y: pos.y,
            fixed: false, // Allow physics to adjust positions
            shape: "box", // Change shape to "box" for readable text
            size: 18,
            color: blockColor(course.blockIdx),
            borderWidth: 2,
            title: `${course.blockLabel}<br>${course.label}` // Tooltip for additional info
        };
    });

    // Create edges to connect neighboring nodes
    const sphereEdges = [];
    for (let i = 0; i < nodes.length; i++) {
        if ((i + 1) % cols !== 0 && i + 1 < nodes.length) {
            sphereEdges.push({ from: nodes[i].id, to: nodes[i + 1].id });
        }
        if (i + cols < nodes.length) {
            sphereEdges.push({ from: nodes[i].id, to: nodes[i + cols].id });
        }
    }

    // Render with vis-network
    const data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(sphereEdges),
    };
    const options = {
        physics: {
            enabled: true,
            barnesHut: {
                gravitationalConstant: -2000, // Increase repulsion
                centralGravity: 0.1, // Reduce central pull
                springLength: 200, // Increase spring length for more spacing
                springConstant: 0.04, // Adjust spring stiffness
            },
        },
        nodes: { font: { color: "#000", size: 14 } }, // Black text for better readability
        edges: { color: "#ccc" }, // Light gray edges
        interaction: { dragNodes: true }, // Allow dragging for manual adjustments
    };
    new vis.Network(container, data, options);
}

/**
 * Helper function to assign colors based on block index.
 * @param {number} idx - Block index.
 * @returns {string} Color code.
 */
function blockColor(idx) {
    const palette = [
        "#6cf", "#fc6", "#c6f", "#6fc", "#f66", "#6f6", "#66f", "#ccc"
    ];
    return palette[idx % palette.length];
}