const { SystemSettings } = require("../../../models/systemSettings");
const { LocalModelConfig } = require("../../../models/localModelConfig");

function apiLocalModelsEndpoints(app) {
  if (!app) return;

  /**
   * GET /v1/local-models/health
   * Check health status of local model providers (Ollama, LM Studio, etc.)
   */
  app.get("/v1/local-models/health", async (req, res) => {
    /*
    #swagger.tags = ['Local Models']
    #swagger.description = 'Check health status of local model providers'
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/LocalModelsHealth" }
    }
    */
    try {
      const configs = await LocalModelConfig.all();
      const configMap = {};
      configs.forEach((config) => {
        configMap[config.providerId] = config;
      });

      const providers = {
        ollama: {
          baseUrl:
            configMap.ollama?.baseUrl ||
            process.env.OLLAMA_BASE_PATH ||
            "http://localhost:11434",
          name: "Ollama",
          status: "unknown",
          error: null,
        },
        lmstudio: {
          baseUrl:
            configMap.lmstudio?.baseUrl ||
            process.env.LMSTUDIO_BASE_PATH ||
            "http://localhost:1234/v1",
          name: "LM Studio",
          status: "unknown",
          error: null,
        },
        localai: {
          baseUrl:
            configMap.localai?.baseUrl ||
            process.env.LOCAL_AI_BASE_PATH ||
            "http://localhost:8080/v1",
          name: "LocalAI",
          status: "unknown",
          error: null,
        },
      };

      // Check each provider
      for (const [key, provider] of Object.entries(providers)) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          // Try /models endpoint first, fallback to /api/tags for Ollama
          let endpoints = ["/models"];
          if (key === "ollama") {
            endpoints = ["/api/tags", "/models"];
          }

          let response;
          let lastError = null;

          for (const endpoint of endpoints) {
            try {
              response = await fetch(`${provider.baseUrl}${endpoint}`, {
                method: "GET",
                signal: controller.signal,
                headers: { "Content-Type": "application/json" },
              });

              if (response.ok) {
                clearTimeout(timeoutId);
                break;
              }
            } catch (e) {
              lastError = e;
            }
          }

          clearTimeout(timeoutId);

          if (response && response.ok) {
            provider.status = "connected";
          } else {
            provider.status = "error";
            provider.error = response
              ? `HTTP ${response.status}`
              : lastError?.message || "Connection failed";
          }
        } catch (error) {
          provider.status = "disconnected";
          provider.error = error.message || "Connection failed";
        }
      }

      return res.status(200).json({
        success: true,
        providers,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Error checking local model providers health:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /v1/local-models/list
   * List available models from a local provider
   */
  app.get("/v1/local-models/list", async (req, res) => {
    /*
    #swagger.tags = ['Local Models']
    #swagger.description = 'List available models from a local provider'
    #swagger.parameters['provider'] = {
      in: 'query',
      description: 'Provider ID (ollama, lmstudio, localai)',
      required: false,
      type: 'string'
    }
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/LocalModelsList" }
    }
    */
    try {
      const provider = (req.query.provider || "").toLowerCase() || null;
      const validProviders = ["ollama", "lmstudio", "localai"];

      const models = {
        ollama: [],
        lmstudio: [],
        localai: [],
      };

      // Get configuration from database (takes precedence over env vars)
      const configs = await LocalModelConfig.all();
      const configMap = {};
      configs.forEach((config) => {
        configMap[config.providerId] = config;
      });

      // Fetch Ollama models
      if (!provider || provider === "ollama") {
        try {
          const ollamaUrl =
            configMap.ollama?.baseUrl ||
            process.env.OLLAMA_BASE_PATH ||
            "http://localhost:11434";
          const response = await fetch(`${ollamaUrl}/api/tags`, {
            timeout: 5000,
          });
          if (response.ok) {
            const data = await response.json();
            models.ollama = (data.models || []).map((m) => ({
              name: m.name,
              size: m.size,
              modified: m.modified_at,
            }));
          }
        } catch (e) {
          console.debug("Ollama models fetch failed:", e.message);
        }
      }

      // Fetch LM Studio models
      if (!provider || provider === "lmstudio") {
        try {
          const lmstudioUrl =
            configMap.lmstudio?.baseUrl ||
            process.env.LMSTUDIO_BASE_PATH ||
            "http://localhost:1234/v1";
          const response = await fetch(`${lmstudioUrl}/models`, {
            timeout: 5000,
          });
          if (response.ok) {
            const data = await response.json();
            models.lmstudio = (data.data || []).map((m) => ({
              name: m.id,
              owned_by: m.owned_by,
            }));
          }
        } catch (e) {
          console.debug("LM Studio models fetch failed:", e.message);
        }
      }

      // Fetch LocalAI models
      if (!provider || provider === "localai") {
        try {
          const localaiUrl =
            configMap.localai?.baseUrl ||
            process.env.LOCAL_AI_BASE_PATH ||
            "http://localhost:8080/v1";
          const response = await fetch(`${localaiUrl}/models`, {
            timeout: 5000,
          });
          if (response.ok) {
            const data = await response.json();
            models.localai = (data.data || []).map((m) => ({
              name: m.id,
            }));
          }
        } catch (e) {
          console.debug("LocalAI models fetch failed:", e.message);
        }
      }

      // If provider specified, return only that provider's models
      const response = provider && validProviders.includes(provider) ? { [provider]: models[provider] } : models;

      return res.status(200).json({
        success: true,
        models: response,
        recommendations: {
          local: [
            {
              name: "mistral",
              source: "ollama",
              size: "7b",
              recommended: true,
            },
            { name: "llama2", source: "ollama", size: "7b", recommended: false },
            { name: "zephyr", source: "ollama", size: "7b", recommended: false },
          ],
        },
      });
    } catch (error) {
      console.error("Error listing local models:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /v1/local-models/config
   * Get current configuration for all providers
   */
  app.get("/v1/local-models/config", async (req, res) => {
    /*
    #swagger.tags = ['Local Models']
    #swagger.description = 'Get current configuration for all local model providers'
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/LocalModelsConfig" }
    }
    */
    try {
      const configs = await LocalModelConfig.all();
      const configMap = {};

      // Convert to object keyed by providerId
      configs.forEach((config) => {
        configMap[config.providerId] = {
          id: config.id,
          providerId: config.providerId,
          isEnabled: config.isEnabled,
          baseUrl: config.baseUrl,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          defaultModel: config.defaultModel,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        };
      });

      return res.status(200).json({
        success: true,
        data: configMap,
      });
    } catch (error) {
      console.error("Error getting local model configs:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /v1/local-models/config
   * Save or update configuration for a local model provider
   */
  app.post("/v1/local-models/config", async (req, res) => {
    /*
    #swagger.tags = ['Local Models']
    #swagger.description = 'Save or update configuration for a local model provider'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        type: 'object',
        required: ['providerId', 'baseUrl'],
        properties: {
          providerId: { type: 'string', description: 'Provider ID (ollama, lmstudio, localai)' },
          isEnabled: { type: 'boolean', description: 'Enable/disable the provider' },
          baseUrl: { type: 'string', description: 'Base URL for the provider' },
          temperature: { type: 'number', description: 'Temperature setting (0-1)' },
          maxTokens: { type: 'integer', description: 'Max tokens for responses' },
          defaultModel: { type: 'string', description: 'Default model to use' }
        }
      }
    }
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/LocalModelConfigResponse" }
    }
    */
    try {
      const { providerId, baseUrl, isEnabled, temperature, maxTokens, defaultModel } = req.body;

      // Validate required fields
      if (!providerId || !baseUrl) {
        return res.status(400).json({
          success: false,
          error: "providerId and baseUrl are required",
        });
      }

      // Validate provider
      const validProviders = ["ollama", "lmstudio", "localai"];
      if (!validProviders.includes(providerId.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid providerId. Must be one of: ${validProviders.join(", ")}`,
        });
      }

      // Prepare config data
      const configData = {
        baseUrl,
        isEnabled: typeof isEnabled === "boolean" ? isEnabled : false,
      };

      if (temperature !== undefined) {
        configData.temperature = temperature;
      }

      if (maxTokens !== undefined) {
        configData.maxTokens = maxTokens;
      }

      if (defaultModel !== undefined) {
        configData.defaultModel = defaultModel;
      }

      // Save configuration
      const config = await LocalModelConfig.upsert(providerId.toLowerCase(), configData);

      if (!config) {
        return res.status(500).json({
          success: false,
          error: "Failed to save configuration",
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          id: config.id,
          providerId: config.providerId,
          isEnabled: config.isEnabled,
          baseUrl: config.baseUrl,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          defaultModel: config.defaultModel,
          createdAt: config.createdAt,
          updatedAt: config.updatedAt,
        },
      });
    } catch (error) {
      console.error("Error saving local model config:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * POST /v1/local-models/test-connection
   * Test connectivity to a local model provider
   */
  app.post("/v1/local-models/test-connection", async (req, res) => {
    /*
    #swagger.tags = ['Local Models']
    #swagger.description = 'Test connectivity to a local model provider'
    #swagger.parameters['body'] = {
      in: 'body',
      required: true,
      schema: {
        type: 'object',
        required: ['providerId', 'baseUrl'],
        properties: {
          providerId: { type: 'string', description: 'Provider ID (ollama, lmstudio, localai)' },
          baseUrl: { type: 'string', description: 'Base URL for the provider' }
        }
      }
    }
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/TestConnectionResponse" }
    }
    */
    try {
      const { providerId, baseUrl } = req.body;

      // Validate required fields
      if (!providerId || !baseUrl) {
        return res.status(400).json({
          success: false,
          error: "providerId and baseUrl are required",
        });
      }

      // Validate provider
      const validProviders = ["ollama", "lmstudio", "localai"];
      if (!validProviders.includes(providerId.toLowerCase())) {
        return res.status(400).json({
          success: false,
          error: `Invalid providerId. Must be one of: ${validProviders.join(", ")}`,
        });
      }

      // Validate URL format
      try {
        new URL(baseUrl);
      } catch (e) {
        return res.status(400).json({
          success: false,
          error: "Invalid baseUrl format",
        });
      }

      const provider = providerId.toLowerCase();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      try {
        // Determine endpoint based on provider
        let endpoint = "/models";
        if (provider === "ollama") {
          endpoint = "/api/tags";
        }

        const response = await fetch(`${baseUrl}${endpoint}`, {
          method: "GET",
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json({
            success: true,
            status: "connected",
            message: `Successfully connected to ${providerId}`,
            data: {
              provider: provider,
              connected: true,
              models: provider === "ollama"
                ? (data.models || []).length
                : (data.data || []).length,
            },
          });
        } else {
          return res.status(200).json({
            success: true,
            status: "error",
            message: `HTTP ${response.status} from ${providerId}`,
            data: {
              provider: provider,
              connected: false,
              statusCode: response.status,
            },
          });
        }
      } catch (fetchError) {
        clearTimeout(timeoutId);

        if (fetchError.name === "AbortError") {
          return res.status(200).json({
            success: true,
            status: "timeout",
            message: `Connection to ${providerId} timed out (3s)`,
            data: {
              provider: provider,
              connected: false,
            },
          });
        }

        return res.status(200).json({
          success: true,
          status: "disconnected",
          message: `Failed to connect to ${providerId}: ${fetchError.message}`,
          data: {
            provider: provider,
            connected: false,
            error: fetchError.message,
          },
        });
      }
    } catch (error) {
      console.error("Error testing local model connection:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  });

  /**
   * GET /v1/system/deployment-mode
   * Detect current deployment mode (local vs cloud) with enhanced region detection
   * Supports EU vs US cloud deployment detection for Azure, AWS, Mistral, and OpenAI
   */
  app.get("/v1/system/deployment-mode", async (req, res) => {
    /*
    #swagger.tags = ['System Settings']
    #swagger.description = 'Detect current deployment mode (local vs cloud) with region detection'
    #swagger.responses[200] = {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          mode: { type: 'string', enum: ['local', 'cloud-eu', 'cloud-us'] },
          provider: { type: 'string' },
          region: { type: 'string' },
          isEU: { type: 'boolean' },
          isCloud: { type: 'boolean' },
          isLocal: { type: 'boolean' },
          details: { type: 'object' }
        }
      }
    }
    */
    try {
      const { detectDeploymentMode } = require("../../../utils/helpers/deploymentRegionDetection");

      const deploymentInfo = await detectDeploymentMode();

      return res.status(200).json({
        success: true,
        mode: deploymentInfo.mode,
        provider: deploymentInfo.provider,
        region: deploymentInfo.region,
        isEU: deploymentInfo.isEU,
        isCloud: deploymentInfo.isCloud,
        isLocal: deploymentInfo.mode === "local",
        details: deploymentInfo.details,
      });
    } catch (error) {
      console.error("Error detecting deployment mode:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        mode: "cloud-us",
        isLocal: false,
        isEU: false,
      });
    }
  });
}

module.exports = { apiLocalModelsEndpoints };
