-- Add indexes for lazy loading optimization
-- Single column index on workspaceId for faster lookups
CREATE INDEX IF NOT EXISTS "workspace_documents_workspaceId_idx" ON "workspace_documents"("workspaceId");

-- Compound index for sorted pagination by creation date
CREATE INDEX IF NOT EXISTS "workspace_documents_workspaceId_createdAt_idx" ON "workspace_documents"("workspaceId", "createdAt" DESC);
