jest.mock("../../../models/knowledgeGraph", () => ({
  KnowledgeGraph: {},
}));
jest.mock("../../../models/documents", () => ({
  Document: {},
}));

const {
  toVisualizationGraph,
  countValue,
} = require("../../../utils/rag/graphVisualization");
const { GraphBuilder } = require("../../../utils/rag/graphBuilder");

describe("toVisualizationGraph", () => {
  it("maps numeric edge ends to node UUIDs", () => {
    const graph = toVisualizationGraph(
      [
        {
          id: 1,
          uuid: "node-a",
          nodeType: "document",
          label: "Policy.pdf",
        },
        {
          id: 2,
          uuid: "node-b",
          nodeType: "concept",
          label: "GDPR",
          category: "topic",
        },
      ],
      [
        {
          uuid: "edge-1",
          fromNodeId: 1,
          toNodeId: 2,
          relationshipType: "mentions",
          weight: 80,
          confidence: 0.8,
        },
      ]
    );

    expect(graph.nodes.map((n) => n.id)).toEqual(["node-a", "node-b"]);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0]).toMatchObject({
      id: "edge-1",
      source: "node-a",
      target: "node-b",
      relationshipType: "mentions",
    });
  });

  it("drops edges whose endpoints are missing", () => {
    const graph = toVisualizationGraph(
      [{ id: 1, uuid: "only-node", label: "Solo" }],
      [{ uuid: "orphan", fromNodeId: 1, toNodeId: 99 }]
    );
    expect(graph.edges).toEqual([]);
  });
});

describe("countValue", () => {
  it("reads Prisma groupBy count shapes", () => {
    expect(countValue(4)).toBe(4);
    expect(countValue({ _all: 7 })).toBe(7);
    expect(countValue(null)).toBe(0);
  });
});

describe("GraphBuilder.extractConcepts", () => {
  it("returns an empty list for blank text", () => {
    expect(GraphBuilder.extractConcepts("", "doc-1")).toEqual([]);
    expect(GraphBuilder.extractConcepts(null, "doc-1")).toEqual([]);
  });

  it("extracts emails, urls, locations and person-like names", () => {
    const text =
      "Jean Dupont visited Paris and wrote to security@xscale.ai. See https://xscale.ai for details about Acme Corporation.";
    const concepts = GraphBuilder.extractConcepts(text, "doc-1");
    const values = concepts.map((c) => c.value);

    expect(values).toEqual(
      expect.arrayContaining([
        "Jean Dupont",
        "Paris",
        "security@xscale.ai",
        "https://xscale.ai",
      ])
    );
    expect(concepts.find((c) => c.value === "Paris")?.type).toBe("location");
    expect(concepts.find((c) => c.value === "Jean Dupont")?.type).toBe(
      "person"
    );
  });

  it("caps the number of extracted concepts", () => {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const text = Array.from({ length: 80 }, (_, i) => {
      const first = `${alphabet[i % 26]}ohn`;
      const last = `${alphabet[(i + 3) % 26]}mith${alphabet[i % 26].toLowerCase()}`;
      return `${first} ${last}`;
    }).join(". ");
    const concepts = GraphBuilder.extractConcepts(text, "doc-1");
    expect(concepts.length).toBeLessThanOrEqual(50);
    expect(concepts.length).toBeGreaterThan(10);
  });
});
