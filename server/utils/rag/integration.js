/**
 * RAG Integration for Vector Database Providers
 * Hooks semantic reranking into the vector search pipeline
 */

const { RAGService } = require("./index");

/**
 * Global RAG service instance (singleton pattern)
 */
let ragServiceInstance = null;

/**
 * Get or create RAG service instance
 * @param {Object} options - Configuration options
 * @returns {RAGService} RAG service instance
 */
function getRagService(options = {}) {
  if (!ragServiceInstance) {
    ragServiceInstance = new RAGService(options);
  }
  return ragServiceInstance;
}

/**
 * Process vector search results with optional reranking
 * Integrates into the existing vector search pipeline
 *
 * @param {Object} params - Parameters
 * @param {Array} params.vectorSearchResults - Results from vector similarity search
 * @param {string} params.query - Original user query
 * @param {Object} params.workspace - Workspace configuration
 * @param {Object} params.LLMConnector - LLM connector for reranking
 * @param {boolean} params.enableReranking - Whether to apply reranking
 * @returns {Promise<Array>} Processed documents with reranking scores if applied
 */
async function processVectorSearchWithReranking({
  vectorSearchResults = [],
  query = "",
  workspace = null,
  LLMConnector = null,
  enableReranking = true,
}) {
  // If reranking disabled or results empty, return as-is
  if (!enableReranking || !vectorSearchResults || vectorSearchResults.length === 0) {
    return vectorSearchResults;
  }

  // If workspace settings indicate reranking mode, apply it
  const vectorSearchMode = workspace?.vectorSearchMode || "default";
  if (vectorSearchMode !== "rerank") {
    return vectorSearchResults;
  }

  try {
    const ragService = getRagService({
      scoreThreshold: workspace?.rerankerThreshold || 60,
      topK: workspace?.topN || 5,
    });

    // Determine which reranker to use
    let rerankerType = "none";
    if (workspace?.rerankerType === "llm" && LLMConnector) {
      rerankerType = "llm";
    } else if (workspace?.rerankerType === "native") {
      rerankerType = "native";
    } else if (vectorSearchMode === "rerank" && LLMConnector) {
      // Default to LLM if available when reranking is enabled
      rerankerType = "llm";
    }

    const reranked = await ragService.performSemanticSearch({
      query,
      vectorSearchResults,
      LLMConnector,
      rerankerType,
      rerankerThreshold: workspace?.rerankerThreshold || 60,
      topK: workspace?.topN || 5,
    });

    // Format with citation strength metadata
    return ragService.formatDocumentsWithCitations(reranked);
  } catch (error) {
    console.error(
      "[RAG Integration] Error during reranking:",
      error.message
    );
    // Graceful fallback: return original results
    return vectorSearchResults;
  }
}

/**
 * Patch vector database performSimilaritySearch to include reranking
 * This wraps the original method and adds reranking capability
 *
 * @param {Object} VectorDbClass - The vector database class to patch
 * @param {Object} workspace - Workspace configuration
 * @param {Object} LLMConnector - LLM connector for reranking
 * @returns {Function} Wrapped performSimilaritySearch
 */
function createRankedSearchWrapper(VectorDbClass, workspace, LLMConnector) {
  const originalMethod = VectorDbClass.prototype.performSimilaritySearch;

  return async function performSimilaritySearchWithReranking(params = {}) {
    // Call original vector search
    const searchResults = await originalMethod.call(this, params);

    // If reranking not enabled, return original results
    if (!params.rerank || workspace?.vectorSearchMode !== "rerank") {
      return searchResults;
    }

    // Process with reranking
    try {
      const reranked = await processVectorSearchWithReranking({
        vectorSearchResults: searchResults.sources || [],
        query: params.input,
        workspace,
        LLMConnector,
        enableReranking: true,
      });

      return {
        ...searchResults,
        sources: reranked,
      };
    } catch (error) {
      console.error("[RAG Integration] Reranking failed:", error.message);
      return searchResults;
    }
  };
}

/**
 * Initialize RAG integration with workspace and LLM connector
 * @param {Object} workspace - Workspace configuration
 * @param {Object} LLMConnector - LLM connector instance
 * @returns {Object} RAG context for use in chat handlers
 */
function initializeRAGContext(workspace, LLMConnector) {
  const ragService = getRagService({
    scoreThreshold: workspace?.rerankerThreshold || 60,
    topK: workspace?.topN || 5,
  });

  return {
    ragService,
    workspace,
    LLMConnector,
    rerankerEnabled: workspace?.vectorSearchMode === "rerank",
    rerankerType: workspace?.rerankerType || "llm",

    /**
     * Apply reranking to search results
     * @param {Array} results - Vector search results
     * @param {string} query - User query
     * @returns {Promise<Array>} Reranked results
     */
    async applyReranking(results, query) {
      return await processVectorSearchWithReranking({
        vectorSearchResults: results,
        query,
        workspace,
        LLMConnector,
        enableReranking: this.rerankerEnabled,
      });
    },

    /**
     * Get reranking statistics
     * @returns {Object} Stats including cache info
     */
    getStats() {
      return ragService.getStats();
    },

    /**
     * Clear reranking cache
     */
    clearCache() {
      ragService.clearCache();
    },
  };
}

module.exports = {
  getRagService,
  processVectorSearchWithReranking,
  createRankedSearchWrapper,
  initializeRAGContext,
};
