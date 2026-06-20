-- CreateTable knowledge_graph_nodes
CREATE TABLE "knowledge_graph_nodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL UNIQUE,
    "workspaceId" INTEGER NOT NULL,
    "nodeType" TEXT NOT NULL DEFAULT 'concept',
    "label" TEXT NOT NULL,
    "description" TEXT,
    "docId" TEXT,
    "category" TEXT,
    "embeddings" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_graph_nodes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE
);

-- CreateTable knowledge_graph_edges
CREATE TABLE "knowledge_graph_edges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL UNIQUE,
    "workspaceId" INTEGER NOT NULL,
    "fromNodeId" INTEGER NOT NULL,
    "toNodeId" INTEGER NOT NULL,
    "relationshipType" TEXT NOT NULL,
    "weight" REAL NOT NULL DEFAULT 50.0,
    "confidence" REAL NOT NULL DEFAULT 0.5,
    "reasoning" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "knowledge_graph_edges_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE,
    CONSTRAINT "knowledge_graph_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_graph_nodes" ("id") ON DELETE CASCADE,
    CONSTRAINT "knowledge_graph_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_graph_nodes" ("id") ON DELETE CASCADE
);

-- CreateIndex
CREATE INDEX "knowledge_graph_nodes_workspaceId_idx" ON "knowledge_graph_nodes"("workspaceId");

-- CreateIndex
CREATE INDEX "knowledge_graph_nodes_nodeType_idx" ON "knowledge_graph_nodes"("nodeType");

-- CreateIndex
CREATE INDEX "knowledge_graph_nodes_docId_idx" ON "knowledge_graph_nodes"("docId");

-- CreateIndex
CREATE INDEX "knowledge_graph_edges_workspaceId_idx" ON "knowledge_graph_edges"("workspaceId");

-- CreateIndex
CREATE INDEX "knowledge_graph_edges_fromNodeId_idx" ON "knowledge_graph_edges"("fromNodeId");

-- CreateIndex
CREATE INDEX "knowledge_graph_edges_toNodeId_idx" ON "knowledge_graph_edges"("toNodeId");

-- CreateIndex
CREATE INDEX "knowledge_graph_edges_relationshipType_idx" ON "knowledge_graph_edges"("relationshipType");
