-- CreateTable audit_logs
CREATE TABLE "audit_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "event_type" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "provider" TEXT,
    "model" TEXT,
    "metadata" TEXT,
    "data_location" TEXT,
    "workspace_id" INTEGER,
    "user_id" INTEGER,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateIndex audit_logs_event_type
CREATE INDEX "audit_logs_event_type" ON "audit_logs"("event_type");

-- CreateIndex audit_logs_created_at
CREATE INDEX "audit_logs_created_at" ON "audit_logs"("created_at");

-- CreateIndex audit_logs_provider
CREATE INDEX "audit_logs_provider" ON "audit_logs"("provider");

-- CreateIndex audit_logs_workspace_id
CREATE INDEX "audit_logs_workspace_id" ON "audit_logs"("workspace_id");
