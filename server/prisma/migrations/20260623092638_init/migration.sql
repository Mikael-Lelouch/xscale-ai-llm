-- DropIndex
DROP INDEX "workspace_documents_workspaceId_createdAt_idx";

-- CreateTable
CREATE TABLE "sso_integrations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "saml_entity_id" TEXT,
    "saml_sso_url" TEXT,
    "saml_x509_cert" TEXT,
    "oauth_client_id" TEXT,
    "oauth_client_secret" TEXT,
    "oauth_scopes" TEXT DEFAULT 'openid,profile,email',
    "attribute_mapping" TEXT DEFAULT '{}',
    "group_mapping" TEXT DEFAULT '{}',
    "jit_enabled" BOOLEAN NOT NULL DEFAULT true,
    "metadata" TEXT DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sso_integrations_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_sso_accounts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "picture_url" TEXT,
    "metadata" TEXT DEFAULT '{}',
    "last_login" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_sso_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sso_oauth_tokens" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_sso_account_id" INTEGER NOT NULL,
    "access_token" TEXT NOT NULL,
    "refresh_token" TEXT,
    "token_type" TEXT NOT NULL DEFAULT 'Bearer',
    "expires_at" DATETIME NOT NULL,
    "scopes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sso_oauth_tokens_user_sso_account_id_fkey" FOREIGN KEY ("user_sso_account_id") REFERENCES "user_sso_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mfa_settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "totp_enabled" BOOLEAN NOT NULL DEFAULT false,
    "totp_secret" TEXT,
    "totp_verified" BOOLEAN NOT NULL DEFAULT false,
    "backup_codes_enabled" BOOLEAN NOT NULL DEFAULT false,
    "backup_codes" TEXT,
    "backup_codes_used" TEXT DEFAULT '[]',
    "last_mfa_challenge" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "mfa_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "mfa_recovery_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" DATETIME NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "used_at" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "mfa_recovery_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ip_whitelist" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "ip_address" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ip_whitelist_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "device_fingerprints" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "device_name" TEXT,
    "browser" TEXT,
    "os" TEXT,
    "trust_token" TEXT,
    "trusted" BOOLEAN NOT NULL DEFAULT false,
    "last_used" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "device_fingerprints_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_sessions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER NOT NULL,
    "session_token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "fingerprint" TEXT,
    "last_activity" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "login_attempts" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" INTEGER,
    "email" TEXT,
    "ip_address" TEXT NOT NULL,
    "success" BOOLEAN NOT NULL,
    "failure_reason" TEXT,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "login_attempts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_payment_methods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "card_last_four" TEXT,
    "card_brand" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "account_last_four" TEXT,
    "account_bank_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "payment_methods_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_payment_methods" ("account_bank_name", "account_last_four", "card_brand", "card_exp_month", "card_exp_year", "card_last_four", "created_at", "id", "is_default", "stripe_customer_id", "stripe_payment_method_id", "type", "updated_at", "workspace_id") SELECT "account_bank_name", "account_last_four", "card_brand", "card_exp_month", "card_exp_year", "card_last_four", "created_at", "id", "is_default", "stripe_customer_id", "stripe_payment_method_id", "type", "updated_at", "workspace_id" FROM "payment_methods";
DROP TABLE "payment_methods";
ALTER TABLE "new_payment_methods" RENAME TO "payment_methods";
CREATE UNIQUE INDEX "payment_methods_stripe_payment_method_id_key" ON "payment_methods"("stripe_payment_method_id");
CREATE INDEX "payment_methods_workspace_id_idx" ON "payment_methods"("workspace_id");
CREATE INDEX "payment_methods_stripe_payment_method_id_idx" ON "payment_methods"("stripe_payment_method_id");
CREATE TABLE "new_workspace_tiers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'free',
    "max_users" INTEGER,
    "max_storage_gb" INTEGER,
    "max_messages_month" INTEGER,
    "max_tokens_month" INTEGER,
    "max_inference_hours" INTEGER,
    "monthly_price" REAL NOT NULL DEFAULT 0,
    "trial_ends_at" DATETIME,
    "current_period_start" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "current_period_end" DATETIME NOT NULL,
    "subscription_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "billing_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "workspace_tiers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_workspace_tiers" ("auto_renew", "billing_email", "created_at", "current_period_end", "current_period_start", "id", "max_inference_hours", "max_messages_month", "max_storage_gb", "max_tokens_month", "max_users", "monthly_price", "status", "subscription_id", "tier", "trial_ends_at", "updated_at", "workspace_id") SELECT "auto_renew", "billing_email", "created_at", "current_period_end", "current_period_start", "id", "max_inference_hours", "max_messages_month", "max_storage_gb", "max_tokens_month", "max_users", "monthly_price", "status", "subscription_id", "tier", "trial_ends_at", "updated_at", "workspace_id" FROM "workspace_tiers";
DROP TABLE "workspace_tiers";
ALTER TABLE "new_workspace_tiers" RENAME TO "workspace_tiers";
CREATE UNIQUE INDEX "workspace_tiers_workspace_id_key" ON "workspace_tiers"("workspace_id");
CREATE INDEX "workspace_tiers_workspace_id_idx" ON "workspace_tiers"("workspace_id");
CREATE INDEX "workspace_tiers_tier_idx" ON "workspace_tiers"("tier");
CREATE INDEX "workspace_tiers_status_idx" ON "workspace_tiers"("status");
CREATE TABLE "new_local_model_configs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "providerId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "baseUrl" TEXT NOT NULL,
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "defaultModel" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_local_model_configs" ("baseUrl", "createdAt", "defaultModel", "id", "isEnabled", "maxTokens", "providerId", "temperature", "updatedAt") SELECT "baseUrl", "createdAt", "defaultModel", "id", "isEnabled", "maxTokens", "providerId", "temperature", "updatedAt" FROM "local_model_configs";
DROP TABLE "local_model_configs";
ALTER TABLE "new_local_model_configs" RENAME TO "local_model_configs";
CREATE UNIQUE INDEX "local_model_configs_providerId_key" ON "local_model_configs"("providerId");
CREATE TABLE "new_usage_metrics" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "workspace_tier_id" INTEGER NOT NULL,
    "messages_used" INTEGER NOT NULL DEFAULT 0,
    "documents_stored_gb" REAL NOT NULL DEFAULT 0.0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "tokens_used" INTEGER NOT NULL DEFAULT 0,
    "inference_hours" REAL NOT NULL DEFAULT 0.0,
    "snapshot_type" TEXT NOT NULL DEFAULT 'daily',
    "snapshot_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "billing_period_start" DATETIME NOT NULL,
    "billing_period_end" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "usage_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usage_metrics_workspace_tier_id_fkey" FOREIGN KEY ("workspace_tier_id") REFERENCES "workspace_tiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_usage_metrics" ("active_users", "billing_period_end", "billing_period_start", "created_at", "documents_stored_gb", "id", "inference_hours", "messages_used", "snapshot_date", "snapshot_type", "tokens_used", "updated_at", "workspace_id", "workspace_tier_id") SELECT "active_users", "billing_period_end", "billing_period_start", "created_at", "documents_stored_gb", "id", "inference_hours", "messages_used", "snapshot_date", "snapshot_type", "tokens_used", "updated_at", "workspace_id", "workspace_tier_id" FROM "usage_metrics";
DROP TABLE "usage_metrics";
ALTER TABLE "new_usage_metrics" RENAME TO "usage_metrics";
CREATE INDEX "usage_metrics_workspace_id_idx" ON "usage_metrics"("workspace_id");
CREATE INDEX "usage_metrics_workspace_tier_id_idx" ON "usage_metrics"("workspace_tier_id");
CREATE INDEX "usage_metrics_snapshot_date_idx" ON "usage_metrics"("snapshot_date");
CREATE INDEX "usage_metrics_billing_period_start_idx" ON "usage_metrics"("billing_period_start");
CREATE TABLE "new_billing_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "workspace_tier_id" INTEGER NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "stripe_invoice_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "subtotal" REAL NOT NULL DEFAULT 0,
    "tax" REAL NOT NULL DEFAULT 0,
    "total" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "overage_messages" INTEGER NOT NULL DEFAULT 0,
    "overage_storage_gb" REAL NOT NULL DEFAULT 0,
    "overage_amount" REAL NOT NULL DEFAULT 0,
    "billing_period_start" DATETIME NOT NULL,
    "billing_period_end" DATETIME NOT NULL,
    "issued_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" DATETIME,
    "paid_at" DATETIME,
    "pdf_url" TEXT,
    "email_sent_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "billing_invoices_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "billing_invoices_workspace_tier_id_fkey" FOREIGN KEY ("workspace_tier_id") REFERENCES "workspace_tiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_billing_invoices" ("billing_period_end", "billing_period_start", "created_at", "currency", "due_date", "email_sent_at", "id", "invoice_number", "issued_at", "overage_amount", "overage_messages", "overage_storage_gb", "paid_at", "pdf_url", "status", "stripe_invoice_id", "subtotal", "tax", "total", "updated_at", "workspace_id", "workspace_tier_id") SELECT "billing_period_end", "billing_period_start", "created_at", "currency", "due_date", "email_sent_at", "id", "invoice_number", "issued_at", "overage_amount", "overage_messages", "overage_storage_gb", "paid_at", "pdf_url", "status", "stripe_invoice_id", "subtotal", "tax", "total", "updated_at", "workspace_id", "workspace_tier_id" FROM "billing_invoices";
DROP TABLE "billing_invoices";
ALTER TABLE "new_billing_invoices" RENAME TO "billing_invoices";
CREATE UNIQUE INDEX "billing_invoices_invoice_number_key" ON "billing_invoices"("invoice_number");
CREATE INDEX "billing_invoices_workspace_id_idx" ON "billing_invoices"("workspace_id");
CREATE INDEX "billing_invoices_workspace_tier_id_idx" ON "billing_invoices"("workspace_tier_id");
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices"("status");
CREATE INDEX "billing_invoices_issued_at_idx" ON "billing_invoices"("issued_at");
CREATE INDEX "billing_invoices_billing_period_start_idx" ON "billing_invoices"("billing_period_start");
CREATE TABLE "new_usage_warnings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "warning_type" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "threshold_percent" INTEGER NOT NULL DEFAULT 80,
    "current_usage" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "usage_warnings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_usage_warnings" ("acknowledged", "acknowledged_at", "created_at", "current_usage", "id", "limit", "metric_type", "threshold_percent", "updated_at", "warning_type", "workspace_id") SELECT "acknowledged", "acknowledged_at", "created_at", "current_usage", "id", "limit", "metric_type", "threshold_percent", "updated_at", "warning_type", "workspace_id" FROM "usage_warnings";
DROP TABLE "usage_warnings";
ALTER TABLE "new_usage_warnings" RENAME TO "usage_warnings";
CREATE INDEX "usage_warnings_workspace_id_idx" ON "usage_warnings"("workspace_id");
CREATE INDEX "usage_warnings_warning_type_idx" ON "usage_warnings"("warning_type");
CREATE INDEX "usage_warnings_created_at_idx" ON "usage_warnings"("created_at");
CREATE TABLE "new_knowledge_graph_edges" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
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
    CONSTRAINT "knowledge_graph_edges_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_graph_edges_fromNodeId_fkey" FOREIGN KEY ("fromNodeId") REFERENCES "knowledge_graph_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "knowledge_graph_edges_toNodeId_fkey" FOREIGN KEY ("toNodeId") REFERENCES "knowledge_graph_nodes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_graph_edges" ("confidence", "createdAt", "fromNodeId", "id", "metadata", "reasoning", "relationshipType", "toNodeId", "updatedAt", "uuid", "weight", "workspaceId") SELECT "confidence", "createdAt", "fromNodeId", "id", "metadata", "reasoning", "relationshipType", "toNodeId", "updatedAt", "uuid", "weight", "workspaceId" FROM "knowledge_graph_edges";
DROP TABLE "knowledge_graph_edges";
ALTER TABLE "new_knowledge_graph_edges" RENAME TO "knowledge_graph_edges";
CREATE UNIQUE INDEX "knowledge_graph_edges_uuid_key" ON "knowledge_graph_edges"("uuid");
CREATE INDEX "knowledge_graph_edges_workspaceId_idx" ON "knowledge_graph_edges"("workspaceId");
CREATE INDEX "knowledge_graph_edges_fromNodeId_idx" ON "knowledge_graph_edges"("fromNodeId");
CREATE INDEX "knowledge_graph_edges_toNodeId_idx" ON "knowledge_graph_edges"("toNodeId");
CREATE INDEX "knowledge_graph_edges_relationshipType_idx" ON "knowledge_graph_edges"("relationshipType");
CREATE TABLE "new_stripe_subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "workspace_tier_id" INTEGER NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_product_id" TEXT,
    "stripe_price_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_start" DATETIME NOT NULL,
    "current_period_end" DATETIME NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "canceled_at" DATETIME,
    "stripe_payment_method_id" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "stripe_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stripe_subscriptions_workspace_tier_id_fkey" FOREIGN KEY ("workspace_tier_id") REFERENCES "workspace_tiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_stripe_subscriptions" ("cancel_at_period_end", "canceled_at", "created_at", "current_period_end", "current_period_start", "id", "metadata", "status", "stripe_customer_id", "stripe_payment_method_id", "stripe_price_id", "stripe_product_id", "stripe_subscription_id", "updated_at", "workspace_id", "workspace_tier_id") SELECT "cancel_at_period_end", "canceled_at", "created_at", "current_period_end", "current_period_start", "id", "metadata", "status", "stripe_customer_id", "stripe_payment_method_id", "stripe_price_id", "stripe_product_id", "stripe_subscription_id", "updated_at", "workspace_id", "workspace_tier_id" FROM "stripe_subscriptions";
DROP TABLE "stripe_subscriptions";
ALTER TABLE "new_stripe_subscriptions" RENAME TO "stripe_subscriptions";
CREATE UNIQUE INDEX "stripe_subscriptions_stripe_subscription_id_key" ON "stripe_subscriptions"("stripe_subscription_id");
CREATE INDEX "stripe_subscriptions_workspace_id_idx" ON "stripe_subscriptions"("workspace_id");
CREATE INDEX "stripe_subscriptions_stripe_subscription_id_idx" ON "stripe_subscriptions"("stripe_subscription_id");
CREATE INDEX "stripe_subscriptions_stripe_customer_id_idx" ON "stripe_subscriptions"("stripe_customer_id");
CREATE TABLE "new_knowledge_graph_nodes" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "uuid" TEXT NOT NULL,
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
    CONSTRAINT "knowledge_graph_nodes_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_knowledge_graph_nodes" ("category", "createdAt", "description", "docId", "embeddings", "id", "label", "metadata", "nodeType", "updatedAt", "uuid", "workspaceId") SELECT "category", "createdAt", "description", "docId", "embeddings", "id", "label", "metadata", "nodeType", "updatedAt", "uuid", "workspaceId" FROM "knowledge_graph_nodes";
DROP TABLE "knowledge_graph_nodes";
ALTER TABLE "new_knowledge_graph_nodes" RENAME TO "knowledge_graph_nodes";
CREATE UNIQUE INDEX "knowledge_graph_nodes_uuid_key" ON "knowledge_graph_nodes"("uuid");
CREATE INDEX "knowledge_graph_nodes_workspaceId_idx" ON "knowledge_graph_nodes"("workspaceId");
CREATE INDEX "knowledge_graph_nodes_nodeType_idx" ON "knowledge_graph_nodes"("nodeType");
CREATE INDEX "knowledge_graph_nodes_docId_idx" ON "knowledge_graph_nodes"("docId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "sso_integrations_workspace_id_idx" ON "sso_integrations"("workspace_id");

-- CreateIndex
CREATE INDEX "user_sso_accounts_user_id_idx" ON "user_sso_accounts"("user_id");

-- CreateIndex
CREATE INDEX "user_sso_accounts_provider_idx" ON "user_sso_accounts"("provider");

-- CreateIndex
CREATE UNIQUE INDEX "user_sso_accounts_provider_provider_user_id_key" ON "user_sso_accounts"("provider", "provider_user_id");

-- CreateIndex
CREATE INDEX "sso_oauth_tokens_user_sso_account_id_idx" ON "sso_oauth_tokens"("user_sso_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_settings_user_id_key" ON "mfa_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "mfa_recovery_sessions_token_key" ON "mfa_recovery_sessions"("token");

-- CreateIndex
CREATE INDEX "mfa_recovery_sessions_user_id_idx" ON "mfa_recovery_sessions"("user_id");

-- CreateIndex
CREATE INDEX "ip_whitelist_user_id_idx" ON "ip_whitelist"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "ip_whitelist_user_id_ip_address_key" ON "ip_whitelist"("user_id", "ip_address");

-- CreateIndex
CREATE UNIQUE INDEX "device_fingerprints_fingerprint_key" ON "device_fingerprints"("fingerprint");

-- CreateIndex
CREATE INDEX "device_fingerprints_user_id_idx" ON "device_fingerprints"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_sessions_session_token_key" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "user_sessions_user_id_idx" ON "user_sessions"("user_id");

-- CreateIndex
CREATE INDEX "user_sessions_session_token_idx" ON "user_sessions"("session_token");

-- CreateIndex
CREATE INDEX "login_attempts_user_id_idx" ON "login_attempts"("user_id");

-- CreateIndex
CREATE INDEX "login_attempts_email_idx" ON "login_attempts"("email");

-- CreateIndex
CREATE INDEX "login_attempts_ip_address_idx" ON "login_attempts"("ip_address");

-- CreateIndex
CREATE INDEX "login_attempts_timestamp_idx" ON "login_attempts"("timestamp");

-- CreateIndex
CREATE INDEX "workspace_documents_workspaceId_createdAt_idx" ON "workspace_documents"("workspaceId", "createdAt");

-- RedefineIndex
DROP INDEX "audit_logs_workspace_id";
CREATE INDEX "audit_logs_workspace_id_idx" ON "audit_logs"("workspace_id");

-- RedefineIndex
DROP INDEX "audit_logs_provider";
CREATE INDEX "audit_logs_provider_idx" ON "audit_logs"("provider");

-- RedefineIndex
DROP INDEX "audit_logs_created_at";
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- RedefineIndex
DROP INDEX "audit_logs_event_type";
CREATE INDEX "audit_logs_event_type_idx" ON "audit_logs"("event_type");
