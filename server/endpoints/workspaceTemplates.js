const { Router } = require("express");
const { WorkspaceTemplate } = require("../models/workspaceTemplate");
const {
  flexUserRoleValid,
  ROLES,
} = require("../utils/middleware/multiUserProtected");

const router = Router();

/**
 * GET /workspace-templates
 * Get all active workspace templates for gallery view
 */
router.get("/", async (request, response) => {
  try {
    const templates = await WorkspaceTemplate.getAll();
    return response.status(200).json({ templates, error: null });
  } catch (error) {
    console.error("Error fetching templates:", error.message);
    return response.status(500).json({
      templates: [],
      error: "Failed to fetch templates",
    });
  }
});

/**
 * GET /workspace-templates/with-usage
 * Get all active templates with usage statistics
 */
router.get("/with-usage", async (request, response) => {
  try {
    const templates = await WorkspaceTemplate.getAllWithUsage();
    return response.status(200).json({ templates, error: null });
  } catch (error) {
    console.error("Error fetching templates with usage:", error.message);
    return response.status(500).json({
      templates: [],
      error: "Failed to fetch templates",
    });
  }
});

/**
 * GET /workspace-templates/:slug
 * Get a specific template by slug
 */
router.get("/:slug", async (request, response) => {
  try {
    const { slug } = request.params;
    const template = await WorkspaceTemplate.getBySlug(slug);

    if (!template) {
      return response.status(404).json({
        template: null,
        error: "Template not found",
      });
    }

    return response.status(200).json({ template, error: null });
  } catch (error) {
    console.error("Error fetching template by slug:", error.message);
    return response.status(500).json({
      template: null,
      error: "Failed to fetch template",
    });
  }
});

/**
 * POST /workspace-templates
 * Create a new template (admin only)
 */
router.post(
  "/",
  flexUserRoleValid(ROLES.admin),
  async (request, response) => {
    try {
      const {
        name,
        slug,
        description,
        category,
        language = "fr",
        systemPrompt,
        welcomeMessage,
        previewImageUrl,
        tags,
        metadata,
      } = request.body;

      const { template, message } = await WorkspaceTemplate.create({
        name,
        slug,
        description,
        category,
        language,
        systemPrompt,
        welcomeMessage,
        previewImageUrl,
        tags,
        metadata,
      });

      if (!template) {
        return response.status(400).json({
          template: null,
          error: message || "Failed to create template",
        });
      }

      return response.status(201).json({ template, error: null });
    } catch (error) {
      console.error("Error creating template:", error.message);
      return response.status(500).json({
        template: null,
        error: "Failed to create template",
      });
    }
  }
);

/**
 * PUT /workspace-templates/:id
 * Update a template (admin only)
 */
router.put(
  "/:id",
  flexUserRoleValid(ROLES.admin),
  async (request, response) => {
    try {
      const { id } = request.params;
      const updates = request.body;

      const { template, message } = await WorkspaceTemplate.update(
        Number(id),
        updates
      );

      if (!template) {
        return response.status(400).json({
          template: null,
          error: message || "Failed to update template",
        });
      }

      return response.status(200).json({ template, error: null });
    } catch (error) {
      console.error("Error updating template:", error.message);
      return response.status(500).json({
        template: null,
        error: "Failed to update template",
      });
    }
  }
);

/**
 * DELETE /workspace-templates/:id
 * Delete a template (admin only)
 */
router.delete(
  "/:id",
  flexUserRoleValid(ROLES.admin),
  async (request, response) => {
    try {
      const { id } = request.params;
      const success = await WorkspaceTemplate.delete(Number(id));

      if (!success) {
        return response.status(400).json({
          success: false,
          error: "Failed to delete template",
        });
      }

      return response.status(200).json({ success: true, error: null });
    } catch (error) {
      console.error("Error deleting template:", error.message);
      return response.status(500).json({
        success: false,
        error: "Failed to delete template",
      });
    }
  }
);

/**
 * POST /workspace-templates/:templateId/documents
 * Add a document to a template (admin only)
 */
router.post(
  "/:templateId/documents",
  flexUserRoleValid(ROLES.admin),
  async (request, response) => {
    try {
      const { templateId } = request.params;
      const { filename, content, docType, displayOrder } = request.body;

      const { document, message } = await WorkspaceTemplate.addDocument(
        Number(templateId),
        {
          filename,
          content,
          docType,
          displayOrder,
        }
      );

      if (!document) {
        return response.status(400).json({
          document: null,
          error: message || "Failed to add document to template",
        });
      }

      return response.status(201).json({ document, error: null });
    } catch (error) {
      console.error("Error adding document to template:", error.message);
      return response.status(500).json({
        document: null,
        error: "Failed to add document to template",
      });
    }
  }
);

/**
 * POST /workspace-templates/:templateId/flows
 * Add a flow to a template (admin only)
 */
router.post(
  "/:templateId/flows",
  flexUserRoleValid(ROLES.admin),
  async (request, response) => {
    try {
      const { templateId } = request.params;
      const { name, description, flowConfig, displayOrder } = request.body;

      const { flow, message } = await WorkspaceTemplate.addFlow(
        Number(templateId),
        {
          name,
          description,
          flowConfig,
          displayOrder,
        }
      );

      if (!flow) {
        return response.status(400).json({
          flow: null,
          error: message || "Failed to add flow to template",
        });
      }

      return response.status(201).json({ flow, error: null });
    } catch (error) {
      console.error("Error adding flow to template:", error.message);
      return response.status(500).json({
        flow: null,
        error: "Failed to add flow to template",
      });
    }
  }
);

function workspaceTemplateEndpoints(app) {
  app.use("/v1/workspace-templates", router);
}

module.exports = { workspaceTemplateEndpoints };
