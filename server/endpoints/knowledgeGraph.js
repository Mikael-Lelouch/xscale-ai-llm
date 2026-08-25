const { validatedRequest } = require("../utils/middleware/validatedRequest");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");
const { validWorkspaceSlug } = require("../utils/middleware/validWorkspace");
const { KnowledgeGraph } = require("../models/knowledgeGraph");
const { GraphBuilder } = require("../utils/rag/graphBuilder");
const { Telemetry } = require("../models/telemetry");

function knowledgeGraphEndpoints(app) {
  if (!app) return;

  const guards = [
    validatedRequest,
    flexUserRoleValid([ROLES.all]),
    validWorkspaceSlug,
  ];

  app.get(
    "/workspace/:slug/knowledge-graph",
    guards,
    async (_request, response) => {
      try {
        const workspace = response.locals.workspace;
        const graphData = await KnowledgeGraph.getGraphData(workspace.id);
        response.status(200).json(graphData);
      } catch (error) {
        console.error("Failed to get knowledge graph:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/workspace/:slug/knowledge-graph/stats",
    guards,
    async (_request, response) => {
      try {
        const workspace = response.locals.workspace;
        const stats = await KnowledgeGraph.getGraphStatistics(workspace.id);
        response.status(200).json(stats);
      } catch (error) {
        console.error("Failed to get knowledge graph stats:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  app.get(
    "/workspace/:slug/knowledge-graph/search",
    guards,
    async (request, response) => {
      try {
        const workspace = response.locals.workspace;
        const query = String(request.query?.q || "").trim();
        if (!query) return response.status(200).json([]);
        const results = await KnowledgeGraph.searchNodes(workspace.id, query);
        response.status(200).json(results);
      } catch (error) {
        console.error("Failed to search knowledge graph:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );

  app.post(
    "/workspace/:slug/knowledge-graph/rebuild",
    guards,
    async (_request, response) => {
      try {
        const workspace = response.locals.workspace;
        const result = await GraphBuilder.rebuildWorkspaceGraph(workspace.id);

        if (!result.success) {
          return response.status(500).json({ error: result.error });
        }

        await Telemetry.sendTelemetry("knowledge_graph_rebuilt", {
          documentsProcessed: result.documentsProcessed,
          nodesCreated: result.nodesCreated,
          edgesCreated: result.edgesCreated,
        }).catch(() => null);

        response.status(200).json(result);
      } catch (error) {
        console.error("Failed to rebuild graph:", error);
        response.status(500).json({ error: error.message });
      }
    }
  );
}

module.exports = { knowledgeGraphEndpoints };
