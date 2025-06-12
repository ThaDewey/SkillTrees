
// --- Layout: Horizontal (linear) ---
// Responsible for positioning nodes in a horizontal row.
export class HorizontalLayout {
  /**
   * Applies a horizontal layout to the nodes.
   * @param {Array} nodes - The array of node objects.
   * @returns {Array} - The nodes array with x, y, and fixed properties set.
   */
  apply(nodes) {
    // Place nodes in a single row, spaced horizontally
    const spacing = 180;
    const y = 0;
    nodes.forEach((node, i) => {
      node.x = i * spacing;
      node.y = y;
      node.fixed = { x: true, y: true };
    });
    return nodes;
  }

/**
 * Applies block-specific layout (no-op for horizontal layout).
 * @param {Array} blocks - The array of block objects.
 * @returns {Array} - The blocks array unchanged.
 */
applyBlocks(blocks) {
    // No block-specific layout or rendering is done here.
    // This class is only responsible for positioning data, not rendering.
    // Rendering (drawing divs, showing titles, etc.) should be handled in your UI/component code, not in the layout class.
    return blocks;
}

}