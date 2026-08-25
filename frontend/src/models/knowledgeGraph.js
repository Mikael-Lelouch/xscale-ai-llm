import { API_BASE } from "@/utils/constants";
import { baseHeaders } from "@/utils/request";

const KnowledgeGraph = {
  get: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/knowledge-graph`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch graph data");
        return res.json();
      })
      .catch((error) => {
        console.error(error);
        return { nodes: [], edges: [], error: error.message };
      });
  },
  stats: async function (slug) {
    return await fetch(`${API_BASE}/workspace/${slug}/knowledge-graph/stats`, {
      method: "GET",
      headers: baseHeaders(),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch stats");
        return res.json();
      })
      .catch(() => ({
        totalNodes: 0,
        totalEdges: 0,
        nodeTypes: [],
        relationshipTypes: [],
      }));
  },
  rebuild: async function (slug) {
    return await fetch(
      `${API_BASE}/workspace/${slug}/knowledge-graph/rebuild`,
      {
        method: "POST",
        headers: baseHeaders(),
      }
    )
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return {
            success: false,
            error: data?.error || "Failed to rebuild graph",
          };
        }
        return data;
      })
      .catch((error) => ({ success: false, error: error.message }));
  },
};

export default KnowledgeGraph;
