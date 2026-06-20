const { Router } = require("express");
const { validMiddleware } = require("../middleware/validMiddleware");
const { KnowledgeGraph } = require("../models/knowledgeGraph");
const { GraphBuilder } = require("../utils/rag/graphBuilder");
const { Document } = require("../models/documents");

const router = Router();

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph
 * Get complete graph data for visualization
 */
router.get(
  "/:workspaceId/knowledge-graph",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const graphData = await KnowledgeGraph.getGraphData(workspaceId);
      response.json(graphData);
    } catch (error) {
      console.error("Failed to get knowledge graph:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/stats
 * Get graph statistics
 */
router.get(
  "/:workspaceId/knowledge-graph/stats",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const stats = await KnowledgeGraph.getGraphStatistics(workspaceId);
      response.json(stats);
    } catch (error) {
      console.error("Failed to get knowledge graph stats:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/nodes
 * Get all nodes in graph
 */
router.get(
  "/:workspaceId/knowledge-graph/nodes",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const { type } = request.query;
      const nodes = await KnowledgeGraph.getNodes(workspaceId, type);
      response.json(nodes);
    } catch (error) {
      console.error("Failed to get knowledge graph nodes:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/edges
 * Get all edges in graph
 */
router.get(
  "/:workspaceId/knowledge-graph/edges",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const { relationshipType } = request.query;
      const edges = await KnowledgeGraph.getEdges(workspaceId, relationshipType);
      response.json(edges);
    } catch (error) {
      console.error("Failed to get knowledge graph edges:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/search
 * Search nodes by label or description
 */
router.get(
  "/:workspaceId/knowledge-graph/search",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const { q } = request.query;

      if (!q || q.trim().length === 0) {
        return response.json([]);
      }

      const results = await KnowledgeGraph.searchNodes(workspaceId, q);
      response.json(results);
    } catch (error) {
      console.error("Failed to search knowledge graph:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/node/:nodeId
 * Get node details with connections
 */
router.get(
  "/:workspaceId/knowledge-graph/node/:nodeId",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { nodeId } = request.params;
      const node = await KnowledgeGraph.getNodeWithConnections(parseInt(nodeId));

      if (!node) {
        return response.status(404).json({ error: "Node not found" });
      }

      response.json(node);
    } catch (error) {
      console.error("Failed to get node details:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/document/:docId
 * Get all nodes related to a document
 */
router.get(
  "/:workspaceId/knowledge-graph/document/:docId",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId, docId } = request.params;
      const nodes = await KnowledgeGraph.getDocumentNodes(workspaceId, docId);
      response.json(nodes);
    } catch (error) {
      console.error("Failed to get document nodes:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/workspace/:workspaceId/knowledge-graph/node
 * Create a new node
 */
router.post(
  "/:workspaceId/knowledge-graph/node",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const { nodeType, label, docId, description } = request.body;

      if (!nodeType || !label) {
        return response.status(400).json({
          error: "nodeType and label are required",
        });
      }

      const result = await KnowledgeGraph.createNode(
        parseInt(workspaceId),
        nodeType,
        label,
        docId || null,
        description || null
      );

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json(result.node);
    } catch (error) {
      console.error("Failed to create node:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/workspace/:workspaceId/knowledge-graph/edge
 * Create a new edge
 */
router.post(
  "/:workspaceId/knowledge-graph/edge",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const { fromNodeId, toNodeId, relationshipType, weight, confidence, reasoning } =
        request.body;

      if (!fromNodeId || !toNodeId || !relationshipType) {
        return response.status(400).json({
          error: "fromNodeId, toNodeId, and relationshipType are required",
        });
      }

      const result = await KnowledgeGraph.createEdge(
        parseInt(workspaceId),
        fromNodeId,
        toNodeId,
        relationshipType,
        weight || 50,
        confidence || 0.5,
        reasoning || null
      );

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json(result.edge);
    } catch (error) {
      console.error("Failed to create edge:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * PUT /api/v1/workspace/:workspaceId/knowledge-graph/edge/:edgeId
 * Update an edge
 */
router.put(
  "/:workspaceId/knowledge-graph/edge/:edgeId",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { edgeId } = request.params;
      const { weight, confidence, reasoning } = request.body;

      const result = await KnowledgeGraph.updateEdge(
        parseInt(edgeId),
        weight || null,
        confidence || null,
        reasoning || null
      );

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json(result.edge);
    } catch (error) {
      console.error("Failed to update edge:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/v1/workspace/:workspaceId/knowledge-graph/node/:nodeId
 * Delete a node
 */
router.delete(
  "/:workspaceId/knowledge-graph/node/:nodeId",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { nodeId } = request.params;
      const result = await KnowledgeGraph.deleteNode(parseInt(nodeId));

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json({ success: true, node: result.node });
    } catch (error) {
      console.error("Failed to delete node:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * DELETE /api/v1/workspace/:workspaceId/knowledge-graph/edge/:edgeId
 * Delete an edge
 */
router.delete(
  "/:workspaceId/knowledge-graph/edge/:edgeId",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { edgeId } = request.params;
      const result = await KnowledgeGraph.deleteEdge(parseInt(edgeId));

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json({ success: true, edge: result.edge });
    } catch (error) {
      console.error("Failed to delete edge:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/workspace/:workspaceId/knowledge-graph/rebuild
 * Rebuild the entire graph for a workspace
 */
router.post(
  "/:workspaceId/knowledge-graph/rebuild",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const result = await GraphBuilder.rebuildWorkspaceGraph(parseInt(workspaceId));

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json(result);
    } catch (error) {
      console.error("Failed to rebuild graph:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * POST /api/v1/workspace/:workspaceId/knowledge-graph/build-document
 * Build graph nodes for a specific document
 */
router.post(
  "/:workspaceId/knowledge-graph/build-document",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const { docId, filename, content } = request.body;

      if (!docId || !filename) {
        return response.status(400).json({
          error: "docId and filename are required",
        });
      }

      const result = await GraphBuilder.buildGraphForDocument(
        parseInt(workspaceId),
        docId,
        filename,
        content || ""
      );

      if (!result.success) {
        return response.status(500).json({ error: result.error });
      }

      response.json(result);
    } catch (error) {
      console.error("Failed to build document graph:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

/**
 * GET /api/v1/workspace/:workspaceId/knowledge-graph/export
 * Export graph as JSON
 */
router.get(
  "/:workspaceId/knowledge-graph/export",
  [validMiddleware.workspaceIdValid],
  async (request, response) => {
    try {
      const { workspaceId } = request.params;
      const graphData = await KnowledgeGraph.getGraphData(workspaceId);
      const stats = await KnowledgeGraph.getGraphStatistics(workspaceId);

      const exportData = {
        ...graphData,
        statistics: stats,
        exportedAt: new Date().toISOString(),
        workspaceId: parseInt(workspaceId),
      };

      response.setHeader("Content-Type", "application/json");
      response.setHeader(
        "Content-Disposition",
        `attachment; filename="knowledge-graph-${workspaceId}.json"`
      );
      response.json(exportData);
    } catch (error) {
      console.error("Failed to export graph:", error);
      response.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
