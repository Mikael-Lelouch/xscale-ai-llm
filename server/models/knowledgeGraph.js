const { v4: uuidv4 } = require("uuid");
const prisma = require("../utils/prisma");
const {
  toVisualizationGraph,
  countValue,
} = require("../utils/rag/graphVisualization");

function toWorkspaceId(workspaceId) {
  const id = Number(workspaceId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const KnowledgeGraph = {
  // Create a new node in the graph
  createNode: async function (
    workspaceId,
    nodeType,
    label,
    docId = null,
    description = null,
    category = null
  ) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) return { success: false, error: "Invalid workspace ID" };

      const node = await prisma.knowledge_graph_nodes.create({
        data: {
          uuid: uuidv4(),
          workspaceId: id,
          nodeType,
          label,
          docId,
          description,
          category,
          metadata: JSON.stringify({}),
        },
      });
      return { success: true, node };
    } catch (error) {
      console.error(`Failed to create knowledge graph node:`, error);
      return { success: false, error: error.message };
    }
  },

  // Create an edge (relationship) between two nodes
  createEdge: async function (
    workspaceId,
    fromNodeId,
    toNodeId,
    relationshipType,
    weight = 50,
    confidence = 0.5,
    reasoning = null
  ) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) return { success: false, error: "Invalid workspace ID" };

      // Check for duplicate edges
      const existing = await prisma.knowledge_graph_edges.findFirst({
        where: {
          workspaceId: id,
          fromNodeId,
          toNodeId,
          relationshipType,
        },
      });

      if (existing) {
        return { success: true, edge: existing, isNew: false };
      }

      const edge = await prisma.knowledge_graph_edges.create({
        data: {
          uuid: uuidv4(),
          workspaceId: id,
          fromNodeId,
          toNodeId,
          relationshipType,
          weight,
          confidence,
          reasoning,
          metadata: JSON.stringify({}),
        },
      });
      return { success: true, edge, isNew: true };
    } catch (error) {
      console.error(`Failed to create knowledge graph edge:`, error);
      return { success: false, error: error.message };
    }
  },

  // Get all nodes for a workspace
  getNodes: async function (workspaceId, nodeType = null) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) return [];
      const where = { workspaceId: id };
      if (nodeType) {
        where.nodeType = nodeType;
      }

      const nodes = await prisma.knowledge_graph_nodes.findMany({
        where,
        orderBy: { createdAt: "desc" },
      });
      return nodes;
    } catch (error) {
      console.error(`Failed to get knowledge graph nodes:`, error);
      return [];
    }
  },

  // Get all edges for a workspace
  getEdges: async function (workspaceId, relationshipType = null) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) return [];
      const where = { workspaceId: id };
      if (relationshipType) {
        where.relationshipType = relationshipType;
      }

      const edges = await prisma.knowledge_graph_edges.findMany({
        where,
        include: {
          fromNode: true,
          toNode: true,
        },
        orderBy: { createdAt: "desc" },
      });
      return edges;
    } catch (error) {
      console.error(`Failed to get knowledge graph edges:`, error);
      return [];
    }
  },

  // Get full graph structure for visualization
  getGraphData: async function (workspaceId) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) return { nodes: [], edges: [] };

      const nodes = await prisma.knowledge_graph_nodes.findMany({
        where: { workspaceId: id },
        select: {
          id: true,
          uuid: true,
          nodeType: true,
          label: true,
          description: true,
          docId: true,
          category: true,
          createdAt: true,
        },
      });

      const edges = await prisma.knowledge_graph_edges.findMany({
        where: { workspaceId: id },
        select: {
          id: true,
          uuid: true,
          fromNodeId: true,
          toNodeId: true,
          relationshipType: true,
          weight: true,
          confidence: true,
          reasoning: true,
          createdAt: true,
        },
      });

      return toVisualizationGraph(nodes, edges);
    } catch (error) {
      console.error(`Failed to get graph data:`, error);
      return { nodes: [], edges: [] };
    }
  },

  // Get node details with connected nodes
  getNodeWithConnections: async function (nodeId) {
    try {
      const node = await prisma.knowledge_graph_nodes.findUnique({
        where: { id: nodeId },
        include: {
          outgoingEdges: {
            include: { toNode: true },
          },
          incomingEdges: {
            include: { fromNode: true },
          },
        },
      });
      return node;
    } catch (error) {
      console.error(`Failed to get node with connections:`, error);
      return null;
    }
  },

  // Search nodes by label or description
  searchNodes: async function (workspaceId, query) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id || !query) return [];

      // SQLite does not support Prisma's `mode: "insensitive"`.
      const nodes = await prisma.knowledge_graph_nodes.findMany({
        where: {
          workspaceId: id,
          OR: [
            { label: { contains: query } },
            { description: { contains: query } },
          ],
        },
        take: 20,
      });
      return nodes;
    } catch (error) {
      console.error(`Failed to search knowledge graph nodes:`, error);
      return [];
    }
  },

  // Get nodes related to a specific document
  getDocumentNodes: async function (workspaceId, docId) {
    try {
      const nodes = await prisma.knowledge_graph_nodes.findMany({
        where: {
          workspaceId,
          docId,
        },
        include: {
          outgoingEdges: {
            include: { toNode: true },
          },
          incomingEdges: {
            include: { fromNode: true },
          },
        },
      });
      return nodes;
    } catch (error) {
      console.error(`Failed to get document nodes:`, error);
      return [];
    }
  },

  // Delete a node and all its connected edges
  deleteNode: async function (nodeId) {
    try {
      // Prisma will handle cascade deletes via the schema
      const node = await prisma.knowledge_graph_nodes.delete({
        where: { id: nodeId },
      });
      return { success: true, node };
    } catch (error) {
      console.error(`Failed to delete knowledge graph node:`, error);
      return { success: false, error: error.message };
    }
  },

  // Delete an edge
  deleteEdge: async function (edgeId) {
    try {
      const edge = await prisma.knowledge_graph_edges.delete({
        where: { id: edgeId },
      });
      return { success: true, edge };
    } catch (error) {
      console.error(`Failed to delete knowledge graph edge:`, error);
      return { success: false, error: error.message };
    }
  },

  // Update edge weight/confidence
  updateEdge: async function (edgeId, weight = null, confidence = null, reasoning = null) {
    try {
      const updateData = {};
      if (weight !== null) updateData.weight = weight;
      if (confidence !== null) updateData.confidence = confidence;
      if (reasoning !== null) updateData.reasoning = reasoning;
      if (Object.keys(updateData).length === 0) {
        return { success: true, edge: null };
      }

      const edge = await prisma.knowledge_graph_edges.update({
        where: { id: edgeId },
        data: updateData,
      });
      return { success: true, edge };
    } catch (error) {
      console.error(`Failed to update knowledge graph edge:`, error);
      return { success: false, error: error.message };
    }
  },

  // Get relationships between two specific nodes
  getRelationships: async function (fromNodeId, toNodeId) {
    try {
      const edges = await prisma.knowledge_graph_edges.findMany({
        where: {
          OR: [
            { fromNodeId, toNodeId },
            { fromNodeId: toNodeId, toNodeId: fromNodeId },
          ],
        },
      });
      return edges;
    } catch (error) {
      console.error(`Failed to get relationships:`, error);
      return [];
    }
  },

  // Get all nodes of a specific type
  getNodesByType: async function (workspaceId, nodeType) {
    try {
      const nodes = await prisma.knowledge_graph_nodes.findMany({
        where: {
          workspaceId,
          nodeType,
        },
        orderBy: { createdAt: "desc" },
      });
      return nodes;
    } catch (error) {
      console.error(`Failed to get nodes by type:`, error);
      return [];
    }
  },

  // Get nodes by category
  getNodesByCategory: async function (workspaceId, category) {
    try {
      const nodes = await prisma.knowledge_graph_nodes.findMany({
        where: {
          workspaceId,
          category,
        },
        orderBy: { createdAt: "desc" },
      });
      return nodes;
    } catch (error) {
      console.error(`Failed to get nodes by category:`, error);
      return [];
    }
  },

  // Clean up graph data for a workspace (delete all nodes/edges)
  clearWorkspaceGraph: async function (workspaceId) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) return { success: false, error: "Invalid workspace ID" };

      const edgesDeleted = await prisma.knowledge_graph_edges.deleteMany({
        where: { workspaceId: id },
      });
      const nodesDeleted = await prisma.knowledge_graph_nodes.deleteMany({
        where: { workspaceId: id },
      });
      return {
        success: true,
        nodesDeleted: nodesDeleted.count,
        edgesDeleted: edgesDeleted.count,
      };
    } catch (error) {
      console.error(`Failed to clear workspace graph:`, error);
      return { success: false, error: error.message };
    }
  },

  // Get statistics about the graph
  getGraphStatistics: async function (workspaceId) {
    try {
      const id = toWorkspaceId(workspaceId);
      if (!id) {
        return {
          totalNodes: 0,
          totalEdges: 0,
          nodeTypes: [],
          relationshipTypes: [],
        };
      }

      const nodeCount = await prisma.knowledge_graph_nodes.count({
        where: { workspaceId: id },
      });

      const edgeCount = await prisma.knowledge_graph_edges.count({
        where: { workspaceId: id },
      });

      const nodeTypes = await prisma.knowledge_graph_nodes.groupBy({
        by: ["nodeType"],
        where: { workspaceId: id },
        _count: { _all: true },
      });

      const relationshipTypes = await prisma.knowledge_graph_edges.groupBy({
        by: ["relationshipType"],
        where: { workspaceId: id },
        _count: { _all: true },
      });

      return {
        totalNodes: nodeCount,
        totalEdges: edgeCount,
        nodeTypes: nodeTypes.map((nt) => ({
          type: nt.nodeType,
          count: countValue(nt._count),
        })),
        relationshipTypes: relationshipTypes.map((rt) => ({
          type: rt.relationshipType,
          count: countValue(rt._count),
        })),
      };
    } catch (error) {
      console.error(`Failed to get graph statistics:`, error);
      return {
        totalNodes: 0,
        totalEdges: 0,
        nodeTypes: [],
        relationshipTypes: [],
      };
    }
  },
};

module.exports = { KnowledgeGraph };
