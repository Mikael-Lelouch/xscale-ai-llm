-- CreateTable agent_flow_executions
CREATE TABLE "agent_flow_executions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "flowUuid" TEXT NOT NULL,
    "flowName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "variables" TEXT NOT NULL DEFAULT '{}',
    "results" TEXT NOT NULL DEFAULT '[]',
    "error" TEXT,
    "createdBy" INTEGER,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "agent_flow_executions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "agent_flow_executions_flowUuid_idx" ON "agent_flow_executions"("flowUuid");

-- CreateIndex
CREATE INDEX "agent_flow_executions_status_idx" ON "agent_flow_executions"("status");

-- CreateIndex
CREATE INDEX "agent_flow_executions_createdBy_idx" ON "agent_flow_executions"("createdBy");

-- CreateIndex
CREATE INDEX "agent_flow_executions_startedAt_idx" ON "agent_flow_executions"("startedAt");
