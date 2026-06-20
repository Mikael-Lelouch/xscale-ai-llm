const prisma = require("../utils/prisma");
const { v4: uuidv4 } = require("uuid");
const { Workspace } = require("./workspace");
const { Document } = require("./documents");

const WorkspaceTemplate = {
  /**
   * Get all active templates
   * @returns {Promise<Array>} Array of template objects
   */
  getAll: async function () {
    try {
      const templates = await prisma.workspace_templates.findMany({
        where: { isActive: true },
        include: {
          documents: {
            orderBy: { displayOrder: "asc" },
          },
          flows: {
            orderBy: { displayOrder: "asc" },
          },
        },
        orderBy: { name: "asc" },
      });
      return templates;
    } catch (error) {
      console.error("Error fetching all templates:", error.message);
      return [];
    }
  },

  /**
   * Get template by slug with all related data
   * @param {string} slug - Template slug
   * @returns {Promise<Object|null>} Template object with documents and flows
   */
  getBySlug: async function (slug) {
    try {
      const template = await prisma.workspace_templates.findUnique({
        where: { slug },
        include: {
          documents: {
            orderBy: { displayOrder: "asc" },
          },
          flows: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });
      return template;
    } catch (error) {
      console.error("Error fetching template by slug:", error.message);
      return null;
    }
  },

  /**
   * Get template by ID
   * @param {number} id - Template ID
   * @returns {Promise<Object|null>} Template object
   */
  get: async function (id) {
    try {
      const template = await prisma.workspace_templates.findUnique({
        where: { id },
        include: {
          documents: {
            orderBy: { displayOrder: "asc" },
          },
          flows: {
            orderBy: { displayOrder: "asc" },
          },
        },
      });
      return template;
    } catch (error) {
      console.error("Error fetching template:", error.message);
      return null;
    }
  },

  /**
   * Create a new template
   * @param {Object} templateData - Template data
   * @returns {Promise<{template: Object|null, message: string|null}>}
   */
  create: async function (templateData = {}) {
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
      } = templateData;

      if (!name || !slug || !category || !systemPrompt) {
        return {
          template: null,
          message: "Missing required fields: name, slug, category, systemPrompt",
        };
      }

      const template = await prisma.workspace_templates.create({
        data: {
          name,
          slug,
          description,
          category,
          language,
          systemPrompt,
          welcomeMessage,
          previewImageUrl,
          tags: tags ? JSON.stringify(tags) : null,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      return { template, message: null };
    } catch (error) {
      console.error("Error creating template:", error.message);
      return { template: null, message: error.message };
    }
  },

  /**
   * Update a template
   * @param {number} id - Template ID
   * @param {Object} updates - Template updates
   * @returns {Promise<{template: Object|null, message: string|null}>}
   */
  update: async function (id, updates = {}) {
    try {
      const template = await prisma.workspace_templates.update({
        where: { id },
        data: updates,
      });
      return { template, message: null };
    } catch (error) {
      console.error("Error updating template:", error.message);
      return { template: null, message: error.message };
    }
  },

  /**
   * Delete a template
   * @param {number} id - Template ID
   * @returns {Promise<boolean>}
   */
  delete: async function (id) {
    try {
      await prisma.workspace_templates.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      console.error("Error deleting template:", error.message);
      return false;
    }
  },

  /**
   * Add a document to a template
   * @param {number} templateId - Template ID
   * @param {Object} documentData - Document data
   * @returns {Promise<{document: Object|null, message: string|null}>}
   */
  addDocument: async function (templateId, documentData = {}) {
    try {
      const { filename, content, docType = "reference", displayOrder = 0 } =
        documentData;

      if (!filename || !content) {
        return {
          document: null,
          message: "Missing required fields: filename, content",
        };
      }

      const document = await prisma.workspace_template_documents.create({
        data: {
          templateId,
          filename,
          content,
          docType,
          displayOrder,
        },
      });

      return { document, message: null };
    } catch (error) {
      console.error("Error adding template document:", error.message);
      return { document: null, message: error.message };
    }
  },

  /**
   * Add a flow to a template
   * @param {number} templateId - Template ID
   * @param {Object} flowData - Flow data
   * @returns {Promise<{flow: Object|null, message: string|null}>}
   */
  addFlow: async function (templateId, flowData = {}) {
    try {
      const { name, description, flowConfig, displayOrder = 0 } = flowData;

      if (!name || !flowConfig) {
        return {
          flow: null,
          message: "Missing required fields: name, flowConfig",
        };
      }

      const flow = await prisma.workspace_template_flows.create({
        data: {
          templateId,
          name,
          description,
          flowConfig:
            typeof flowConfig === "string"
              ? flowConfig
              : JSON.stringify(flowConfig),
          displayOrder,
        },
      });

      return { flow, message: null };
    } catch (error) {
      console.error("Error adding template flow:", error.message);
      return { flow: null, message: error.message };
    }
  },

  /**
   * Create a workspace from a template
   * @param {number} templateId - Template ID
   * @param {string} workspaceName - Name for the new workspace
   * @param {number} creatorId - User ID creating the workspace
   * @returns {Promise<{workspace: Object|null, message: string|null}>}
   */
  applyToNewWorkspace: async function (
    templateId,
    workspaceName,
    creatorId = null
  ) {
    try {
      const template = await this.get(templateId);
      if (!template) {
        return { workspace: null, message: "Template not found" };
      }

      // Create the workspace with template's system prompt
      const { workspace, message } = await Workspace.new(
        workspaceName,
        creatorId,
        {
          openAiPrompt: template.systemPrompt,
          chatMode: "automatic",
        }
      );

      if (!workspace) {
        return { workspace: null, message };
      }

      // Record template usage
      try {
        await prisma.workspace_template_usage.create({
          data: {
            templateId,
            workspaceId: workspace.id,
          },
        });
      } catch (usageError) {
        console.warn("Could not record template usage:", usageError.message);
      }

      // Add template documents to workspace
      for (const doc of template.documents) {
        try {
          const docId = uuidv4();
          await Document.new(workspace.id, {
            docId,
            filename: doc.filename,
            content: doc.content,
            docType: doc.docType || "reference",
          });
        } catch (docError) {
          console.warn(
            `Could not import document ${doc.filename}:`,
            docError.message
          );
        }
      }

      return { workspace, message: null };
    } catch (error) {
      console.error("Error applying template to workspace:", error.message);
      return { workspace: null, message: error.message };
    }
  },

  /**
   * Get template usage statistics
   * @param {number} templateId - Template ID
   * @returns {Promise<number>} Number of workspaces created from this template
   */
  getUsageCount: async function (templateId) {
    try {
      const count = await prisma.workspace_template_usage.count({
        where: { templateId },
      });
      return count;
    } catch (error) {
      console.error("Error getting template usage count:", error.message);
      return 0;
    }
  },

  /**
   * Get all templates with usage counts
   * @returns {Promise<Array>} Templates with usageCount field
   */
  getAllWithUsage: async function () {
    try {
      const templates = await this.getAll();
      const templatesWithUsage = await Promise.all(
        templates.map(async (template) => {
          const usageCount = await this.getUsageCount(template.id);
          return { ...template, usageCount };
        })
      );
      return templatesWithUsage;
    } catch (error) {
      console.error("Error getting templates with usage:", error.message);
      return [];
    }
  },
};

module.exports = { WorkspaceTemplate };
