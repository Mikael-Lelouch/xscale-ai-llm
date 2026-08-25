/**
 * Map persisted knowledge-graph rows into the D3-friendly {nodes, edges} shape.
 * Node ids in the visualization are UUIDs; edge source/target must match those
 * ids (not the numeric primary keys stored on the edge rows).
 *
 * @param {Array<{id: number, uuid: string, nodeType?: string, label?: string, description?: string, docId?: string, category?: string}>} nodes
 * @param {Array<{uuid: string, fromNodeId: number, toNodeId: number, relationshipType?: string, weight?: number, confidence?: number, reasoning?: string}>} edges
 * @returns {{nodes: object[], edges: object[]}}
 */
function toVisualizationGraph(nodes = [], edges = []) {
  const idToUuid = new Map();
  for (const node of nodes) {
    if (node == null || node.id == null || !node.uuid) continue;
    idToUuid.set(node.id, node.uuid);
  }

  return {
    nodes: nodes
      .filter((node) => node && node.uuid)
      .map((node) => ({
        id: node.uuid,
        dbId: node.id,
        nodeType: node.nodeType || "concept",
        label: node.label || "",
        description: node.description || null,
        docId: node.docId || null,
        category: node.category || null,
      })),
    edges: edges
      .map((edge) => {
        if (!edge) return null;
        const source = idToUuid.get(edge.fromNodeId);
        const target = idToUuid.get(edge.toNodeId);
        if (!source || !target) return null;
        return {
          id: edge.uuid,
          source,
          target,
          relationshipType: edge.relationshipType || "related",
          weight: typeof edge.weight === "number" ? edge.weight : 50,
          confidence:
            typeof edge.confidence === "number" ? edge.confidence : 0.5,
          reasoning: edge.reasoning || null,
        };
      })
      .filter(Boolean),
  };
}

function countValue(groupCount) {
  if (typeof groupCount === "number") return groupCount;
  if (groupCount && typeof groupCount._all === "number") return groupCount._all;
  return 0;
}

module.exports = { toVisualizationGraph, countValue };
