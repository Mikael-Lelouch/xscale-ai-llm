import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const AgentFlows = {
  /**
   * Save a flow configuration
   * @param {string} name - Display name of the flow
   * @param {object} config - The configuration object for the flow
   * @param {string} [uuid] - Optional UUID for updating existing flow
   * @returns {Promise<{success: boolean, error: string | null, flow: {name: string, config: object, uuid: string} | null}>}
   */
  saveFlow: async (name, config, uuid = null) => {
    return await fetch(`${API_BASE}/agent-flows/save`, {
      method: "POST",
      headers: {
        ...baseHeaders(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, config, uuid }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.error || "Failed to save flow");
        return res;
      })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        flow: null,
      }));
  },

  /**
   * List all available flows in the system
   * @returns {Promise<{success: boolean, error: string | null, flows: Array<{name: string, uuid: string, description: string, steps: Array}>}>}
   */
  listFlows: async () => {
    return await fetch(`${API_BASE}/agent-flows/list`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        flows: [],
      }));
  },

  /**
   * Get a specific flow by UUID
   * @param {string} uuid - The UUID of the flow to retrieve
   * @returns {Promise<{success: boolean, error: string | null, flow: {name: string, config: object, uuid: string} | null}>}
   */
  getFlow: async (uuid) => {
    return await fetch(`${API_BASE}/agent-flows/${uuid}`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.error || "Failed to get flow");
        return res;
      })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
        flow: null,
      }));
  },

  /**
   * Execute a specific flow with streaming support
   * @param {string} uuid - The UUID of the flow to run
   * @param {object} variables - Optional variables to pass to the flow
   * @param {Function} onChunk - Callback for each streamed chunk
   * @returns {Promise<{success: boolean, error: string | null, results: object | null}>}
   */
  runFlow: async (uuid, variables = {}, onChunk = null) => {
    try {
      const response = await fetch(`${API_BASE}/agent-flows/${uuid}/run`, {
        method: "POST",
        headers: {
          ...baseHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ variables }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to run flow");
      }

      // Handle streaming response
      if (onChunk && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop(); // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const chunk = JSON.parse(line.slice(6));
                onChunk(chunk);
              } catch (e) {
                console.error("Failed to parse chunk:", e);
              }
            }
          }
        }

        // Process any remaining data
        if (buffer.startsWith("data: ")) {
          try {
            const chunk = JSON.parse(buffer.slice(6));
            onChunk(chunk);
          } catch (e) {
            console.error("Failed to parse final chunk:", e);
          }
        }

        return { success: true };
      } else {
        // Fallback to non-streaming response
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error("Flow execution error:", error);
      return {
        success: false,
        error: error.message,
        results: null,
      };
    }
  },

  /**
   * Get execution history for a flow
   * @param {string} uuid - The UUID of the flow
   * @param {number} limit - Number of results to return
   * @param {number} offset - Pagination offset
   * @returns {Promise<{success: boolean, error: string | null, executions: Array, stats: object}>}
   */
  getExecutionHistory: async (uuid, limit = 50, offset = 0) => {
    try {
      const response = await fetch(
        `${API_BASE}/agent-flows/${uuid}/executions?limit=${limit}&offset=${offset}`,
        {
          method: "GET",
          headers: baseHeaders(),
        }
      );

      if (!response.ok) throw new Error("Failed to get execution history");
      return await response.json();
    } catch (error) {
      console.error("Failed to get execution history:", error);
      return {
        success: false,
        error: error.message,
        executions: [],
        stats: {},
      };
    }
  },

  /**
   * Get a specific execution
   * @param {number} executionId - The execution ID
   * @returns {Promise<{success: boolean, error: string | null, execution: object | null}>}
   */
  getExecution: async (executionId) => {
    try {
      const response = await fetch(
        `${API_BASE}/agent-flows/execution/${executionId}`,
        {
          method: "GET",
          headers: baseHeaders(),
        }
      );

      if (!response.ok) throw new Error("Failed to get execution");
      return await response.json();
    } catch (error) {
      console.error("Failed to get execution:", error);
      return {
        success: false,
        error: error.message,
        execution: null,
      };
    }
  },

  /**
   * Delete a specific flow
   * @param {string} uuid - The UUID of the flow to delete
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  deleteFlow: async (uuid) => {
    return await fetch(`${API_BASE}/agent-flows/${uuid}`, {
      method: "DELETE",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error(res.error || "Failed to delete flow");
        return res;
      })
      .then((res) => res.json())
      .catch((e) => ({
        success: false,
        error: e.message,
      }));
  },

  /**
   * Toggle a flow's active status
   * @param {string} uuid - The UUID of the flow to toggle
   * @param {boolean} active - The new active status
   * @returns {Promise<{success: boolean, error: string | null}>}
   */
  toggleFlow: async (uuid, active) => {
    try {
      const result = await fetch(`${API_BASE}/agent-flows/${uuid}/toggle`, {
        method: "POST",
        headers: {
          ...baseHeaders(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ active }),
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.error || "Failed to toggle flow");
          return res;
        })
        .then((res) => res.json());
      return { success: true, flow: result.flow };
    } catch (error) {
      console.error("Failed to toggle flow:", error);
      return { success: false, error: error.message };
    }
  },
};

export default AgentFlows;
