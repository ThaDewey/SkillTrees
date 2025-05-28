/**
 * Parses the degree plan JSON into a nested structure for a sphere grid.
 * Each node has a type: "block", "category", "subcategory", or "course".
 * You can adapt this for your visualization library.
 */
export function parseForSphereGrid(degreePlan) {
    const result = [];

    (degreePlan.blocks || []).forEach(block => {
        const blockNode = {
            type: block.BlockType === "CORE" ? "core" : "program",
            label: block.Title || "Untitled Block",
            id: block.BlockID || "",
            credits: block.Credits || 0,
            children: []
        };

        (block.rules || []).forEach(category => {
            const categoryNode = {
                type: "category",
                label: category.label || "Category",
                children: []
            };

            (category.rules || []).forEach(subcat => {
                const subcatNode = {
                    type: "subcategory",
                    label: subcat.label || "Subcategory",
                    id: subcat.id || "",
                    reqType: subcat.reqType,
                    reqCount: subcat.reqCount,
                    conn: subcat.Conn,
                    children: []
                };

                (subcat.courses || []).forEach(course => {
                    if (course.Hide === 1) return;
                    subcatNode.children.push({
                        type: "course",
                        label: course.Subj === "@"
                            ? (course.With?.ATTRIBUTE ? `Requirement: ${course.With.ATTRIBUTE}` : "@")
                            : `${course.Subj} ${course.Num}`,
                        subj: course.Subj,
                        num: course.Num,
                        with: course.With
                    });
                });

                categoryNode.children.push(subcatNode);
            });

            blockNode.children.push(categoryNode);
        });

        result.push(blockNode);
    });

    return result;
}