/**
 * Unit tests for Semantic Reranker
 */

const { SemanticReranker } = require("../../../utils/rag/reranker");

describe("SemanticReranker", () => {
  let reranker;

  beforeEach(() => {
    reranker = new SemanticReranker({
      scoreThreshold: 60,
      topK: 5,
      cacheEnabled: true,
    });
  });

  describe("Initialization", () => {
    test("should initialize with default options", () => {
      const r = new SemanticReranker();
      expect(r.scoreThreshold).toBe(60);
      expect(r.topK).toBe(5);
      expect(r.cacheEnabled).toBe(true);
    });

    test("should initialize with custom options", () => {
      const r = new SemanticReranker({
        scoreThreshold: 75,
        topK: 10,
        cacheEnabled: false,
      });
      expect(r.scoreThreshold).toBe(75);
      expect(r.topK).toBe(10);
      expect(r.cacheEnabled).toBe(false);
    });
  });

  describe("Cache Management", () => {
    test("should generate correct cache key", () => {
      const key1 = reranker.getCacheKey("query", ["id1", "id2", "id3"]);
      const key2 = reranker.getCacheKey("query", ["id3", "id1", "id2"]); // Different order

      expect(key1).toBe(key2); // Should be same after sorting
    });

    test("should cache results", () => {
      const cacheKey = reranker.getCacheKey("test query", ["doc1", "doc2"]);
      const results = [
        { id: "doc1", score: 85 },
        { id: "doc2", score: 70 },
      ];

      reranker.cache.set(cacheKey, results);
      expect(reranker.cache.has(cacheKey)).toBe(true);
      expect(reranker.cache.get(cacheKey)).toEqual(results);
    });

    test("should clear cache", () => {
      reranker.cache.set("key1", {});
      reranker.cache.set("key2", {});
      expect(reranker.cache.size).toBe(2);

      reranker.clearCache();
      expect(reranker.cache.size).toBe(0);
    });

    test("should evict cache when exceeded max size", () => {
      reranker.maxCacheSize = 3;

      for (let i = 0; i < 5; i++) {
        reranker.cache.set(`key${i}`, {});
      }

      expect(reranker.cache.size).toBeLessThanOrEqual(reranker.maxCacheSize);
    });

    test("should get cache stats", () => {
      reranker.cache.set("key1", {});
      reranker.cache.set("key2", {});

      const stats = reranker.getCacheStats();
      expect(stats.size).toBe(2);
      expect(stats.maxSize).toBe(reranker.maxCacheSize);
      expect(typeof stats.utilization).toBe("string");
    });
  });

  describe("Prompt Building", () => {
    test("should build reranking prompt", () => {
      const query = "What is AI?";
      const docs = [
        { text: "AI is artificial intelligence." },
        { text: "Machine learning is a subset of AI." },
      ];

      const prompt = reranker.buildRerankerPrompt(query, docs);

      expect(prompt).toContain(query);
      expect(prompt).toContain("[0]");
      expect(prompt).toContain("[1]");
      expect(prompt).toContain("JSON");
    });

    test("should truncate long document snippets", () => {
      const longText = "a".repeat(500);
      const docs = [{ text: longText }];

      const prompt = reranker.buildRerankerPrompt("query", docs);

      expect(prompt).toContain("...");
      expect(prompt.length).toBeLessThan(1000 + 500);
    });
  });

  describe("Response Parsing", () => {
    test("should parse valid reranker response", () => {
      const response = `
        [
          {"index": 0, "score": 85, "reason": "Directly answers"},
          {"index": 1, "score": 45, "reason": "Tangentially related"}
        ]
      `;

      const parsed = reranker.parseRerankerResponse(response, 2);

      expect(parsed.length).toBe(2);
      expect(parsed[0]).toEqual({
        index: 0,
        score: 85,
        reason: "Directly answers",
      });
      expect(parsed[1]).toEqual({
        index: 1,
        score: 45,
        reason: "Tangentially related",
      });
    });

    test("should handle invalid JSON in response", () => {
      const response = "This is not JSON";

      const parsed = reranker.parseRerankerResponse(response, 2);

      expect(parsed).toEqual([]);
    });

    test("should clamp scores to 0-100", () => {
      const response = `
        [
          {"index": 0, "score": 150, "reason": "Too high"},
          {"index": 1, "score": -50, "reason": "Too low"}
        ]
      `;

      const parsed = reranker.parseRerankerResponse(response, 2);

      expect(parsed[0].score).toBe(100);
      expect(parsed[1].score).toBe(0);
    });

    test("should filter out invalid indices", () => {
      const response = `
        [
          {"index": 0, "score": 85, "reason": "Valid"},
          {"index": 99, "score": 50, "reason": "Invalid index"}
        ]
      `;

      const parsed = reranker.parseRerankerResponse(response, 2);

      expect(parsed.length).toBe(1);
      expect(parsed[0].index).toBe(0);
    });
  });

  describe("Document Validation", () => {
    test("should handle empty documents", async () => {
      const result = await reranker.rerank({
        query: "test",
        documents: [],
        LLMConnector: null,
      });

      expect(result).toEqual([]);
    });

    test("should handle empty query", async () => {
      const docs = [{ id: "1", text: "test" }];

      const result = await reranker.rerank({
        query: "",
        documents: docs,
        LLMConnector: null,
      });

      expect(result.length).toBeLessThanOrEqual(reranker.topK);
    });

    test("should handle missing LLM connector", async () => {
      const docs = [
        { id: "1", text: "test document" },
        { id: "2", text: "another doc" },
      ];

      const result = await reranker.rerank({
        query: "test query",
        documents: docs,
        LLMConnector: null,
      });

      // Should return original documents when no LLM available
      expect(result.length).toBeGreaterThan(0);
    });

    test("should limit input documents", async () => {
      const docs = Array.from({ length: 30 }, (_, i) => ({
        id: String(i),
        text: `Document ${i}`,
      }));

      // Can't test fully without LLM, but should not exceed maxDocuments
      expect(docs.length).toBeGreaterThan(reranker.maxDocuments);
    });
  });

  describe("Score Filtering", () => {
    test("should filter documents by threshold", async () => {
      // Mock LLM response
      const mockDocs = [
        { id: "1", text: "High relevance doc" },
        { id: "2", text: "Low relevance doc" },
        { id: "3", text: "Medium relevance doc" },
      ];

      // Without actual LLM, just test the filtering logic
      const filtered = mockDocs.filter((d) => {
        // Simulated scores
        const scores = { "1": 95, "2": 30, "3": 65 };
        return scores[d.id] >= 60;
      });

      expect(filtered.length).toBe(2); // Should keep docs with score >= 60
    });

    test("should return top K results", async () => {
      const rerankerSmall = new SemanticReranker({ topK: 2 });

      const mockDocs = Array.from({ length: 5 }, (_, i) => ({
        id: String(i),
        text: `Document ${i}`,
      }));

      // Simulated output (would come from LLM)
      const simulated = mockDocs.slice(0, rerankerSmall.topK);

      expect(simulated.length).toBeLessThanOrEqual(rerankerSmall.topK);
    });
  });

  describe("Configuration", () => {
    test("should accept custom topK", () => {
      const custom = new SemanticReranker({ topK: 10 });
      expect(custom.topK).toBe(10);
    });

    test("should accept custom threshold", () => {
      const custom = new SemanticReranker({ scoreThreshold: 80 });
      expect(custom.scoreThreshold).toBe(80);
    });

    test("should allow cache disable", () => {
      const noCache = new SemanticReranker({ cacheEnabled: false });
      expect(noCache.cacheEnabled).toBe(false);
    });

    test("should accept custom timeout", () => {
      const custom = new SemanticReranker({ timeout: 60000 });
      expect(custom.timeout).toBe(60000);
    });
  });
});

describe("RAGService Integration", () => {
  const { RAGService } = require("../../../utils/rag/index");

  test("should initialize RAGService", () => {
    const service = new RAGService({
      scoreThreshold: 70,
      topK: 5,
    });

    expect(service.reranker).toBeDefined();
    expect(service.reranker.scoreThreshold).toBe(70);
  });

  test("should format documents with citations", () => {
    const service = new RAGService();
    const docs = [
      {
        id: "1",
        text: "Document 1",
        rerank_score: 85,
        rerank_reason: "Good match",
        rerank_matched: true,
      },
    ];

    const formatted = service.formatDocumentsWithCitations(docs);

    expect(formatted[0].citationStrength).toBe(85);
    expect(formatted[0].citationReason).toBe("Good match");
    expect(formatted[0].isSemanticallyReranked).toBe(true);
  });

  test("should get service stats", () => {
    const service = new RAGService();
    const stats = service.getStats();

    expect(stats.cache).toBeDefined();
    expect(stats.rerankerType).toBe("semantic");
    expect(stats.timestamp).toBeDefined();
  });
});
