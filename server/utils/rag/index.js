/**
 * RAG (Retrieval-Augmented Generation) utilities
 * Handles vector search, reranking, and source management
 */

const { SemanticReranker } = require("./reranker");

/**
 * RAG service for managing semantic search and document reranking
 */
class RAGService {
  constructor(options = {}) {
    this.reranker = new SemanticReranker({
      scoreThreshold: options.scoreThreshold || 60,
      topK: options.topK || 5,
      maxDocuments: options.maxDocuments || 20,
      cacheEnabled: options.cacheEnabled !== false,
    });
  }

  log(text, ...args) {
    console.log(`\x1b[33m[RAGService]\x1b[0m ${text}`, ...args);
  }

  /**
   * Perform semantic search with optional reranking
   * @param {Object} params - Search parameters
   * @param {string} params.query - User query
   * @param {Array} params.vectorSearchResults - Documents from vector search
   * @param {Object} params.LLMConnector - LLM connector for reranking
   * @param {string} params.rerankerType - "llm" | "native" | "none"
   * @param {number} params.rerankerThreshold - Score threshold (0-100)
   * @param {number} params.topK - Number of final results to return
   * @returns {Promise<Array>} Reranked documents or original results
   */
  async performSemanticSearch({
    query = "",
    vectorSearchResults = [],
    LLMConnector = null,
    rerankerType = "none",
    rerankerThreshold = 60,
    topK = 5,
  }) {
    const startTime = Date.now();

    if (!vectorSearchResults || vectorSearchResults.length === 0) {
      this.log("No vector search results to rerank");
      return [];
    }

    // If reranking disabled, return original results
    if (rerankerType === "none") {
      this.log(
        `Skipped reranking: returning top ${topK} of ${vectorSearchResults.length} docs`
      );
      return vectorSearchResults.slice(0, topK);
    }

    // Rerank with LLM
    if (rerankerType === "llm" && LLMConnector) {
      return await this.reranker.rerank({
        query,
        documents: vectorSearchResults,
        LLMConnector,
        topK,
        scoreThreshold: rerankerThreshold,
      });
    }

    // Rerank with native model
    if (rerankerType === "native") {
      return await this.reranker.rerankWithNativeModel({
        query,
        documents: vectorSearchResults,
        topK,
      });
    }

    // Fallback
    this.log(`Unknown reranker type: ${rerankerType}, using top-K`);
    return vectorSearchResults.slice(0, topK);
  }

  /**
   * Format document for response with citation strength
   * @param {Object} doc - Document with potential rerank scores
   * @returns {Object} Formatted document
   */
  formatDocumentWithCitationStrength(doc) {
    return {
      ...doc,
      citationStrength: doc.rerank_score || null,
      citationReason: doc.rerank_reason || null,
      isSemanticallyReranked: !!doc.rerank_matched,
    };
  }

  /**
   * Batch format documents with citation metadata
   * @param {Array} documents - Documents to format
   * @returns {Array} Formatted documents
   */
  formatDocumentsWithCitations(documents) {
    return documents.map((doc) => this.formatDocumentWithCitationStrength(doc));
  }

  /**
   * Get reranking statistics
   * @returns {Object} Stats
   */
  getStats() {
    return {
      cache: this.reranker.getCacheStats(),
      rerankerType: "semantic",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Clear reranking cache
   */
  clearCache() {
    this.reranker.clearCache();
  }
}

module.exports = {
  RAGService,
  SemanticReranker,
};
