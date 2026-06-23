-- PHASE 5: Multi-tenant Billing System
-- Add workspace tier subscriptions and usage tracking

-- CreateTable workspace_tiers
CREATE TABLE "workspace_tiers" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL UNIQUE,
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
    "auto_renew" BOOLEAN NOT NULL DEFAULT 1,
    "billing_email" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_tiers_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable usage_metrics
CREATE TABLE "usage_metrics" (
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
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_metrics_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "usage_metrics_workspace_tier_id_fkey" FOREIGN KEY ("workspace_tier_id") REFERENCES "workspace_tiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable billing_invoices
CREATE TABLE "billing_invoices" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "workspace_tier_id" INTEGER NOT NULL,
    "invoice_number" TEXT NOT NULL UNIQUE,
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
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "billing_invoices_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "billing_invoices_workspace_tier_id_fkey" FOREIGN KEY ("workspace_tier_id") REFERENCES "workspace_tiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable stripe_subscriptions
CREATE TABLE "stripe_subscriptions" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "workspace_tier_id" INTEGER NOT NULL,
    "stripe_subscription_id" TEXT NOT NULL UNIQUE,
    "stripe_customer_id" TEXT NOT NULL,
    "stripe_product_id" TEXT,
    "stripe_price_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_start" DATETIME NOT NULL,
    "current_period_end" DATETIME NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT 0,
    "canceled_at" DATETIME,
    "stripe_payment_method_id" TEXT,
    "metadata" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "stripe_subscriptions_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "stripe_subscriptions_workspace_tier_id_fkey" FOREIGN KEY ("workspace_tier_id") REFERENCES "workspace_tiers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable payment_methods
CREATE TABLE "payment_methods" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "stripe_payment_method_id" TEXT NOT NULL UNIQUE,
    "stripe_customer_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "card_last_four" TEXT,
    "card_brand" TEXT,
    "card_exp_month" INTEGER,
    "card_exp_year" INTEGER,
    "account_last_four" TEXT,
    "account_bank_name" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT 0,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_methods_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable usage_warnings
CREATE TABLE "usage_warnings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspace_id" INTEGER NOT NULL,
    "warning_type" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "threshold_percent" INTEGER NOT NULL DEFAULT 80,
    "current_usage" INTEGER NOT NULL,
    "limit" INTEGER NOT NULL,
    "acknowledged" BOOLEAN NOT NULL DEFAULT 0,
    "acknowledged_at" DATETIME,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "usage_warnings_workspace_id_fkey" FOREIGN KEY ("workspace_id") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex workspace_tiers
CREATE INDEX "workspace_tiers_workspace_id_idx" ON "workspace_tiers"("workspace_id");
CREATE INDEX "workspace_tiers_tier_idx" ON "workspace_tiers"("tier");
CREATE INDEX "workspace_tiers_status_idx" ON "workspace_tiers"("status");

-- CreateIndex usage_metrics
CREATE INDEX "usage_metrics_workspace_id_idx" ON "usage_metrics"("workspace_id");
CREATE INDEX "usage_metrics_workspace_tier_id_idx" ON "usage_metrics"("workspace_tier_id");
CREATE INDEX "usage_metrics_snapshot_date_idx" ON "usage_metrics"("snapshot_date");
CREATE INDEX "usage_metrics_billing_period_start_idx" ON "usage_metrics"("billing_period_start");

-- CreateIndex billing_invoices
CREATE INDEX "billing_invoices_workspace_id_idx" ON "billing_invoices"("workspace_id");
CREATE INDEX "billing_invoices_workspace_tier_id_idx" ON "billing_invoices"("workspace_tier_id");
CREATE INDEX "billing_invoices_status_idx" ON "billing_invoices"("status");
CREATE INDEX "billing_invoices_issued_at_idx" ON "billing_invoices"("issued_at");
CREATE INDEX "billing_invoices_billing_period_start_idx" ON "billing_invoices"("billing_period_start");

-- CreateIndex stripe_subscriptions
CREATE INDEX "stripe_subscriptions_workspace_id_idx" ON "stripe_subscriptions"("workspace_id");
CREATE INDEX "stripe_subscriptions_stripe_subscription_id_idx" ON "stripe_subscriptions"("stripe_subscription_id");
CREATE INDEX "stripe_subscriptions_stripe_customer_id_idx" ON "stripe_subscriptions"("stripe_customer_id");

-- CreateIndex payment_methods
CREATE INDEX "payment_methods_workspace_id_idx" ON "payment_methods"("workspace_id");
CREATE INDEX "payment_methods_stripe_payment_method_id_idx" ON "payment_methods"("stripe_payment_method_id");

-- CreateIndex usage_warnings
CREATE INDEX "usage_warnings_workspace_id_idx" ON "usage_warnings"("workspace_id");
CREATE INDEX "usage_warnings_warning_type_idx" ON "usage_warnings"("warning_type");
CREATE INDEX "usage_warnings_created_at_idx" ON "usage_warnings"("created_at");

-- Note: Foreign key constraints are already defined in CREATE TABLE statements above
-- SQLite does not support ALTER TABLE ADD CONSTRAINT for foreign keys
-- The workspace_id foreign keys are enforced through the table definitions
