const { Router } = require("express");
const { WorkspaceTier, TierDefinitions } = require("../models/workspaceTier");
const { UsageMetrics } = require("../models/usageMetrics");
const { BillingInvoice } = require("../models/billingInvoice");
const { UsageWarning } = require("../models/usageWarning");
const { StripeSubscription } = require("../models/stripeSubscription");
const { validatedRequest } = require("../utils/http");
const {
  validWorkspaceKey,
  validApiKey,
} = require("../middleware/validApiKey");
const prisma = require("../utils/prisma");

function billingEndpoints(app) {
  const router = Router();

  /**
   * Get current workspace subscription and tier info
   * GET /api/v1/billing/workspace/:workspaceId/subscription
   */
  router.get(
    "/v1/billing/workspace/:workspaceId/subscription",
    [validWorkspaceKey],
    async (request, response) => {
      try {
        const { workspaceId } = request.params;

        const tier = await WorkspaceTier.getByWorkspaceId(
          parseInt(workspaceId)
        );
        if (!tier) {
          return response.status(404).json({
            success: false,
            message: "No subscription found for this workspace",
          });
        }

        const subscription = await StripeSubscription.getByWorkspaceId(
          parseInt(workspaceId)
        );

        return response.status(200).json({
          success: true,
          tier: {
            id: tier.id,
            tier: tier.tier,
            name: tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1),
            max_users: tier.max_users,
            max_storage_gb: tier.max_storage_gb,
            max_messages_month: tier.max_messages_month,
            max_tokens_month: tier.max_tokens_month,
            max_inference_hours: tier.max_inference_hours,
            monthly_price: tier.monthly_price,
            status: tier.status,
            current_period_start: tier.current_period_start,
            current_period_end: tier.current_period_end,
            trial_ends_at: tier.trial_ends_at,
            billing_email: tier.billing_email,
          },
          subscription: subscription
            ? {
                id: subscription.id,
                stripe_subscription_id:
                  subscription.stripe_subscription_id,
                status: subscription.status,
                current_period_start: subscription.current_period_start,
                current_period_end: subscription.current_period_end,
                cancel_at_period_end:
                  subscription.cancel_at_period_end,
                canceled_at: subscription.canceled_at,
              }
            : null,
        });
      } catch (e) {
        console.error("Error fetching subscription:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  /**
   * Get current usage metrics for workspace
   * GET /api/v1/billing/workspace/:workspaceId/usage
   */
  router.get(
    "/v1/billing/workspace/:workspaceId/usage",
    [validWorkspaceKey],
    async (request, response) => {
      try {
        const { workspaceId } = request.params;

        const usageStatus = await UsageMetrics.getUsageStatus(
          parseInt(workspaceId)
        );

        // Get unacknowledged warnings
        const warnings = await UsageWarning.getUnacknowledged(
          parseInt(workspaceId)
        );

        return response.status(200).json({
          success: true,
          usage: usageStatus.usage,
          tier: usageStatus.tier,
          billing_period: usageStatus.billing_period,
          warnings: warnings.map((w) => ({
            id: w.id,
            type: w.warning_type,
            metric: w.metric_type,
            percentage: w.threshold_percent,
            current: w.current_usage,
            limit: w.limit,
            created_at: w.created_at,
          })),
        });
      } catch (e) {
        console.error("Error fetching usage:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  /**
   * Get invoices for workspace
   * GET /api/v1/billing/workspace/:workspaceId/invoices
   */
  router.get(
    "/v1/billing/workspace/:workspaceId/invoices",
    [validWorkspaceKey],
    async (request, response) => {
      try {
        const { workspaceId } = request.params;
        const limit = Math.min(parseInt(request.query.limit) || 12, 100);

        const invoices = await BillingInvoice.getByWorkspaceId(
          parseInt(workspaceId),
          limit
        );

        return response.status(200).json({
          success: true,
          invoices: invoices.map((inv) => ({
            id: inv.id,
            invoice_number: inv.invoice_number,
            status: inv.status,
            amount: inv.total,
            currency: inv.currency,
            issued_at: inv.issued_at,
            due_date: inv.due_date,
            paid_at: inv.paid_at,
            pdf_url: inv.pdf_url,
            billing_period_start: inv.billing_period_start,
            billing_period_end: inv.billing_period_end,
          })),
        });
      } catch (e) {
        console.error("Error fetching invoices:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  /**
   * Get invoice PDF
   * GET /api/v1/billing/workspace/:workspaceId/invoices/:invoiceId/pdf
   */
  router.get(
    "/v1/billing/workspace/:workspaceId/invoices/:invoiceId/pdf",
    [validWorkspaceKey],
    async (request, response) => {
      try {
        const { invoiceId } = request.params;

        const invoice = await BillingInvoice.get(parseInt(invoiceId));
        if (!invoice || !invoice.pdf_url) {
          return response.status(404).json({
            success: false,
            message: "Invoice PDF not found",
          });
        }

        // Redirect to PDF URL (or could implement download)
        return response.status(200).json({
          success: true,
          pdf_url: invoice.pdf_url,
          invoice_number: invoice.invoice_number,
        });
      } catch (e) {
        console.error("Error fetching invoice PDF:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  /**
   * Acknowledge a usage warning
   * PATCH /api/v1/billing/workspace/:workspaceId/warnings/:warningId/acknowledge
   */
  router.patch(
    "/v1/billing/workspace/:workspaceId/warnings/:warningId/acknowledge",
    [validWorkspaceKey],
    async (request, response) => {
      try {
        const { warningId } = request.params;

        const warning = await UsageWarning.acknowledge(parseInt(warningId));

        return response.status(200).json({
          success: true,
          message: "Warning acknowledged",
          warning,
        });
      } catch (e) {
        console.error("Error acknowledging warning:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  /**
   * Get available tiers (public endpoint)
   * GET /api/v1/billing/tiers
   */
  router.get("/v1/billing/tiers", async (request, response) => {
    try {
      const tiers = [
        {
          name: "free",
          displayName: "Free",
          price: 0,
          description: "Perfect for getting started",
          features: {
            users: "1 user",
            storage: "1 GB",
            messages: "1,000 messages/month",
            tokens: "100k tokens/month",
            inference: "1 hour/month",
          },
          limits: TierDefinitions.FREE,
        },
        {
          name: "pro",
          displayName: "Pro",
          price: 29.99,
          description: "For individual power users",
          features: {
            users: "5 users",
            storage: "10 GB",
            messages: "50k messages/month",
            tokens: "5M tokens/month",
            inference: "100 hours/month",
          },
          limits: TierDefinitions.PRO,
        },
        {
          name: "team",
          displayName: "Team",
          price: 99.99,
          description: "For teams and organizations",
          features: {
            users: "10 users",
            storage: "50 GB",
            messages: "500k messages/month",
            tokens: "50M tokens/month",
            inference: "1000 hours/month",
          },
          limits: TierDefinitions.TEAM,
        },
        {
          name: "enterprise",
          displayName: "Enterprise",
          price: null,
          description: "Custom plans for enterprises",
          features: {
            users: "Unlimited users",
            storage: "Unlimited storage",
            messages: "Unlimited messages",
            tokens: "Unlimited tokens",
            inference: "Unlimited inference",
          },
          limits: TierDefinitions.ENTERPRISE,
        },
      ];

      return response.status(200).json({
        success: true,
        tiers,
      });
    } catch (e) {
      console.error("Error fetching tiers:", e.message);
      return response.status(500).json({
        success: false,
        error: e.message,
      });
    }
  });

  /**
   * ADMIN ENDPOINTS
   */

  /**
   * Get all workspaces with billing info (admin)
   * GET /api/v1/billing/admin/workspaces
   */
  router.get(
    "/v1/billing/admin/workspaces",
    [validApiKey],
    async (request, response) => {
      try {
        // Check admin role
        if (request.user?.role !== "admin") {
          return response.status(403).json({
            success: false,
            message: "Admin access required",
          });
        }

        const limit = Math.min(parseInt(request.query.limit) || 50, 200);
        const offset = parseInt(request.query.offset) || 0;

        const workspaces = await prisma.workspaces.findMany({
          skip: offset,
          take: limit,
          include: {
            workspace_tier: true,
          },
        });

        const total = await prisma.workspaces.count();

        const withBilling = await Promise.all(
          workspaces.map(async (ws) => ({
            id: ws.id,
            name: ws.name,
            slug: ws.slug,
            tier: ws.workspace_tier?.tier || "free",
            status: ws.workspace_tier?.status || "unknown",
            users: (
              await prisma.workspace_users.count({
                where: { workspace_id: ws.id },
              })
            ),
            created_at: ws.createdAt,
          }))
        );

        return response.status(200).json({
          success: true,
          workspaces: withBilling,
          pagination: {
            total,
            limit,
            offset,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (e) {
        console.error("Error fetching admin workspaces:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  /**
   * Get billing analytics (admin)
   * GET /api/v1/billing/admin/analytics
   */
  router.get(
    "/v1/billing/admin/analytics",
    [validApiKey],
    async (request, response) => {
      try {
        // Check admin role
        if (request.user?.role !== "admin") {
          return response.status(403).json({
            success: false,
            message: "Admin access required",
          });
        }

        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

        const thisMonthRevenue = await BillingInvoice.getRevenueForPeriod(
          thisMonth,
          now
        );
        const lastMonthRevenue = await BillingInvoice.getRevenueForPeriod(
          lastMonth,
          lastMonthEnd
        );

        const subscriptions = await StripeSubscription.getActive();
        const tierBreakdown = await prisma.workspace_tiers.groupBy({
          by: ["tier"],
          _count: true,
        });

        return response.status(200).json({
          success: true,
          analytics: {
            current_month_revenue: thisMonthRevenue.revenue,
            current_month_invoices: thisMonthRevenue.invoiceCount,
            last_month_revenue: lastMonthRevenue.revenue,
            active_subscriptions: subscriptions.length,
            tier_breakdown: tierBreakdown.reduce((acc, tb) => {
              acc[tb.tier] = tb._count;
              return acc;
            }, {}),
          },
        });
      } catch (e) {
        console.error("Error fetching analytics:", e.message);
        return response.status(500).json({
          success: false,
          error: e.message,
        });
      }
    }
  );

  app.use("/api", router);
}

module.exports = { billingEndpoints };
