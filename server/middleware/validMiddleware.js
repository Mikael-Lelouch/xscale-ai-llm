const { Workspace } = require("../models/workspace");

/**
 * Middleware to validate workspace ID parameters in routes.
 * Provides workspaceIdValid for use in knowledge graph and other endpoints.
 */

const validMiddleware = {
  /**
   * Validates that the workspaceId parameter is a valid, existing workspace.
   * Attaches the workspace to the request object if found.
   */
  async workspaceIdValid(request, response, next) {
    try {
      const workspaceId = parseInt(
        request.params.workspaceId ||
        request.body?.workspaceId ||
        request.query?.workspaceId,
        10
      );

      if (!workspaceId || isNaN(workspaceId)) {
        return response.status(400).json({
          error: "Invalid workspace ID",
          details: "A valid numeric workspace ID is required.",
        });
      }

      const workspace = await Workspace.get({ id: workspaceId });
      if (!workspace) {
        return response.status(404).json({
          error: "Workspace not found",
          details: `Workspace with ID ${workspaceId} does not exist.`,
        });
      }

      request.workspace = workspace;
      next();
    } catch (error) {
      console.error("workspaceIdValid middleware error:", error);
      return response.status(500).json({
        error: "Internal server error",
        details: "Failed to validate workspace ID.",
      });
    }
  },
};

module.exports = { validMiddleware };
