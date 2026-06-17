const { SystemSettings } = require("../../../models/systemSettings");

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
      const providers = {
        ollama: {
          baseUrl: process.env.OLLAMA_BASE_PATH || "http://localhost:11434",
          name: "Ollama",
          status: "unknown",
          error: null,
        },
        lmstudio: {
          baseUrl: process.env.LMSTUDIO_BASE_PATH || "http://localhost:1234/v1",
          name: "LM Studio",
          status: "unknown",
          error: null,
        },
        localai: {
          baseUrl: process.env.LOCAL_AI_BASE_PATH || "http://localhost:8080/v1",
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

          const response = await fetch(`${provider.baseUrl}/models`, {
            method: "GET",
            signal: controller.signal,
            headers: { "Content-Type": "application/json" },
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            provider.status = "connected";
          } else {
            provider.status = "error";
            provider.error = `HTTP ${response.status}`;
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
   * List available models from local providers
   */
  app.get("/v1/local-models/list", async (req, res) => {
    /*
    #swagger.tags = ['Local Models']
    #swagger.description = 'List available models from local providers'
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/LocalModelsList" }
    }
    */
    try {
      const models = {
        ollama: [],
        lmstudio: [],
        localai: [],
      };

      // Fetch Ollama models
      try {
        const ollamaUrl = process.env.OLLAMA_BASE_PATH || "http://localhost:11434";
        const response = await fetch(`${ollamaUrl}/api/tags`);
        if (response.ok) {
          const data = await response.json();
          models.ollama = (data.models || []).map((m) => ({
            name: m.name,
            size: m.size,
            modified: m.modified_at,
          }));
        }
      } catch (e) {
        // Ollama not available
      }

      // Fetch LM Studio models
      try {
        const lmstudioUrl = process.env.LMSTUDIO_BASE_PATH || "http://localhost:1234/v1";
        const response = await fetch(`${lmstudioUrl}/models`);
        if (response.ok) {
          const data = await response.json();
          models.lmstudio = (data.data || []).map((m) => ({
            name: m.id,
            owned_by: m.owned_by,
          }));
        }
      } catch (e) {
        // LM Studio not available
      }

      // Fetch LocalAI models
      try {
        const localaiUrl = process.env.LOCAL_AI_BASE_PATH || "http://localhost:8080/v1";
        const response = await fetch(`${localaiUrl}/models`);
        if (response.ok) {
          const data = await response.json();
          models.localai = (data.data || []).map((m) => ({
            name: m.id,
          }));
        }
      } catch (e) {
        // LocalAI not available
      }

      return res.status(200).json({
        success: true,
        models,
        recommendations: {
          local: [
            { name: "mistral", source: "ollama", size: "7b", recommended: true },
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
   * GET /v1/system/deployment-mode
   * Detect current deployment mode (local vs cloud)
   */
  app.get("/v1/system/deployment-mode", async (req, res) => {
    /*
    #swagger.tags = ['System Settings']
    #swagger.description = 'Detect current deployment mode (local vs cloud)'
    #swagger.responses[200] = {
      schema: { $ref: "#/definitions/DeploymentMode" }
    }
    */
    try {
      // Check if a local LLM provider is configured
      const llmProvider = await SystemSettings.getValueOrFallback(
        { label: "llm_provider" },
        process.env.LLM_PROVIDER || "openai"
      );

      const localProviders = ["ollama", "lmstudio", "localai", "privatemode", "textgenwebui"];
      const isLocal = localProviders.includes(llmProvider);

      return res.status(200).json({
        success: true,
        mode: isLocal ? "local" : llmProvider.includes("azure") ? "cloud-eu" : "cloud-us",
        provider: llmProvider,
        isLocal,
      });
    } catch (error) {
      console.error("Error detecting deployment mode:", error);
      return res.status(500).json({
        success: false,
        error: error.message,
        mode: "cloud-us",
      });
    }
  });
}

module.exports = { apiLocalModelsEndpoints };
