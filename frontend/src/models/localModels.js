import { API_BASE } from "@/utils/constants";

const LocalModels = {
  // Get health status for all local model providers
  health: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/local-models/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch health status");
      return await response.json();
    } catch (e) {
      return { error: e.message, providers: {} };
    }
  },

  // List available models for a specific provider
  listModels: async (provider) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/local-models/list`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ provider }),
      });
      if (!response.ok) throw new Error(`Failed to list models for ${provider}`);
      return await response.json();
    } catch (e) {
      return { error: e.message, models: [] };
    }
  },

  // Get current local models configuration
  getConfig: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/local-models/config`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch configuration");
      return await response.json();
    } catch (e) {
      return { error: e.message };
    }
  },

  // Save local models configuration
  saveConfig: async (data) => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/local-models/config`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save configuration");
      }
      return await response.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Test connection to a provider
  testConnection: async (provider, baseUrl) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/v1/local-models/test-connection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ provider, baseUrl }),
        }
      );
      if (!response.ok) throw new Error("Connection test failed");
      return await response.json();
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // Get deployment mode (local vs cloud-eu vs cloud-us)
  deploymentMode: async () => {
    try {
      const response = await fetch(`${API_BASE}/api/v1/system/deployment-mode`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch deployment mode");
      return await response.json();
    } catch (e) {
      return {
        success: false,
        error: e.message,
        mode: "cloud-us",
        isLocal: false,
      };
    }
  },
};

export default LocalModels;
