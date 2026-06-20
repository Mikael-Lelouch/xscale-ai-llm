const prisma = require("../utils/prisma");

const LocalModelConfig = {
  tablename: "local_model_configs",

  /**
   * Get config for a specific provider
   * @param {string} providerId - Provider identifier (ollama, lmstudio, localai)
   * @returns {Promise<Object|null>}
   */
  get: async function (providerId) {
    try {
      const config = await prisma.local_model_configs.findUnique({
        where: { providerId },
      });
      return config || null;
    } catch (error) {
      console.error("Error getting local model config:", error.message);
      return null;
    }
  },

  /**
   * Get all local model configs
   * @returns {Promise<Array>}
   */
  all: async function () {
    try {
      const configs = await prisma.local_model_configs.findMany();
      return configs;
    } catch (error) {
      console.error("Error fetching all local model configs:", error.message);
      return [];
    }
  },

  /**
   * Create or update a config for a provider
   * @param {string} providerId - Provider identifier (ollama, lmstudio, localai)
   * @param {Object} data - Configuration data
   * @returns {Promise<Object|null>}
   */
  upsert: async function (providerId, data = {}) {
    try {
      // Validate and sanitize data
      const sanitized = this._validateData(data);

      const config = await prisma.local_model_configs.upsert({
        where: { providerId },
        update: sanitized,
        create: { providerId, ...sanitized },
      });

      return config;
    } catch (error) {
      console.error("Error upserting local model config:", error.message);
      return null;
    }
  },

  /**
   * Delete a config for a provider
   * @param {string} providerId - Provider identifier
   * @returns {Promise<boolean>}
   */
  delete: async function (providerId) {
    try {
      await prisma.local_model_configs.delete({
        where: { providerId },
      });
      return true;
    } catch (error) {
      console.error("Error deleting local model config:", error.message);
      return false;
    }
  },

  /**
   * Validate and sanitize configuration data
   * @param {Object} data - Raw configuration data
   * @returns {Object} - Sanitized configuration data
   */
  _validateData: function (data = {}) {
    const sanitized = {};

    // Validate isEnabled
    if (typeof data.isEnabled === "boolean") {
      sanitized.isEnabled = data.isEnabled;
    } else if (typeof data.isEnabled === "string") {
      sanitized.isEnabled = data.isEnabled === "true";
    }

    // Validate baseUrl
    if (typeof data.baseUrl === "string" && data.baseUrl.trim()) {
      try {
        new URL(data.baseUrl); // Validate URL format
        sanitized.baseUrl = data.baseUrl.trim();
      } catch (e) {
        throw new Error("Invalid baseUrl format");
      }
    }

    // Validate temperature (0-1)
    if (data.temperature !== undefined) {
      const temp = parseFloat(data.temperature);
      if (Number.isNaN(temp) || temp < 0 || temp > 1) {
        throw new Error("Temperature must be between 0 and 1");
      }
      sanitized.temperature = temp;
    }

    // Validate maxTokens (must be positive)
    if (data.maxTokens !== undefined) {
      const tokens = parseInt(data.maxTokens, 10);
      if (Number.isNaN(tokens) || tokens <= 0) {
        throw new Error("maxTokens must be a positive integer");
      }
      sanitized.maxTokens = tokens;
    }

    // Validate defaultModel
    if (data.defaultModel !== undefined) {
      if (data.defaultModel === null) {
        sanitized.defaultModel = null;
      } else if (typeof data.defaultModel === "string" && data.defaultModel.trim()) {
        sanitized.defaultModel = data.defaultModel.trim();
      }
    }

    return sanitized;
  },
};

module.exports = { LocalModelConfig };
