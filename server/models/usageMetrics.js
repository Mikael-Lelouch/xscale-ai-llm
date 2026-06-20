const prisma = require("../utils/prisma");

const UsageMetrics = {
  // Record a new metric event
  recordEvent: async function (workspaceId, metricData) {
    try {
      const {
        messages = 0,
        tokens = 0,
        storage = 0,
        inferenceHours = 0,
      } = metricData;

      // Get the current workspace tier
      const tier = await prisma.workspace_tiers.findUnique({
        where: { workspace_id: workspaceId },
      });

      if (!tier) {
        throw new Error(
          `No tier found for workspace ${workspaceId}. Initialize tier first.`
        );
      }

      // Get or create today's metric
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      let metric = await prisma.usage_metrics.findFirst({
        where: {
          workspace_tier_id: tier.id,
          snapshot_date: {
            gte: today,
            lt: tomorrow,
          },
          snapshot_type: "daily",
        },
      });

      if (!metric) {
        // Create new daily snapshot
        const billingStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const billingEnd = new Date(
          today.getFullYear(),
          today.getMonth() + 1,
          0
        );

        metric = await prisma.usage_metrics.create({
          data: {
            workspace_id: workspaceId,
            workspace_tier_id: tier.id,
            snapshot_type: "daily",
            snapshot_date: today,
            billing_period_start: billingStart,
            billing_period_end: billingEnd,
          },
        });
      }

      // Update the metric
      const updates = {};
      if (messages > 0)
        updates.messages_used = metric.messages_used + messages;
      if (tokens > 0) updates.tokens_used = metric.tokens_used + tokens;
      if (storage > 0)
        updates.documents_stored_gb = metric.documents_stored_gb + storage;
      if (inferenceHours > 0)
        updates.inference_hours = metric.inference_hours + inferenceHours;

      updates.updated_at = new Date();

      return await prisma.usage_metrics.update({
        where: { id: metric.id },
        data: updates,
      });
    } catch (e) {
      console.error("Error recording usage event:", e.message);
      throw e;
    }
  },

  // Get current month's usage
  getCurrentMonthUsage: async function (workspaceId) {
    try {
      const now = new Date();
      const billingStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const billingEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const metrics = await prisma.usage_metrics.findMany({
        where: {
          workspace_id: workspaceId,
          billing_period_start: billingStart,
          billing_period_end: billingEnd,
        },
      });

      // Aggregate all metrics for the month
      const aggregated = {
        messages_used: 0,
        tokens_used: 0,
        documents_stored_gb: 0,
        inference_hours: 0,
        billing_period_start: billingStart,
        billing_period_end: billingEnd,
      };

      for (const metric of metrics) {
        aggregated.messages_used += metric.messages_used;
        aggregated.tokens_used += metric.tokens_used;
        aggregated.documents_stored_gb = Math.max(
          aggregated.documents_stored_gb,
          metric.documents_stored_gb
        ); // Storage is max, not sum
        aggregated.inference_hours += metric.inference_hours;
      }

      return aggregated;
    } catch (e) {
      console.error("Error fetching current month usage:", e.message);
      throw e;
    }
  },

  // Get usage for a specific period
  getUsageForPeriod: async function (
    workspaceId,
    startDate,
    endDate = new Date()
  ) {
    try {
      const metrics = await prisma.usage_metrics.findMany({
        where: {
          workspace_id: workspaceId,
          snapshot_date: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { snapshot_date: "asc" },
      });

      return metrics;
    } catch (e) {
      console.error("Error fetching usage for period:", e.message);
      throw e;
    }
  },

  // Get latest snapshot for workspace
  getLatestSnapshot: async function (workspaceId) {
    try {
      return await prisma.usage_metrics.findFirst({
        where: { workspace_id: workspaceId },
        orderBy: { snapshot_date: "desc" },
      });
    } catch (e) {
      console.error("Error fetching latest snapshot:", e.message);
      throw e;
    }
  },

  // Get usage status (percentage of limits)
  getUsageStatus: async function (workspaceId) {
    try {
      const tier = await prisma.workspace_tiers.findUnique({
        where: { workspace_id: workspaceId },
      });

      if (!tier) {
        throw new Error(
          `No tier found for workspace ${workspaceId}. Initialize tier first.`
        );
      }

      const currentUsage = await this.getCurrentMonthUsage(workspaceId);

      const status = {
        workspace_id: workspaceId,
        tier: tier.tier,
        usage: {
          messages: {
            used: currentUsage.messages_used,
            limit: tier.max_messages_month,
            percentage: tier.max_messages_month
              ? Math.round(
                  (currentUsage.messages_used / tier.max_messages_month) * 100
                )
              : 0,
          },
          tokens: {
            used: currentUsage.tokens_used,
            limit: tier.max_tokens_month,
            percentage: tier.max_tokens_month
              ? Math.round(
                  (currentUsage.tokens_used / tier.max_tokens_month) * 100
                )
              : 0,
          },
          storage: {
            used: currentUsage.documents_stored_gb,
            limit: tier.max_storage_gb,
            percentage: tier.max_storage_gb
              ? Math.round(
                  (currentUsage.documents_stored_gb / tier.max_storage_gb) *
                    100
                )
              : 0,
          },
          inference: {
            used: currentUsage.inference_hours,
            limit: tier.max_inference_hours,
            percentage: tier.max_inference_hours
              ? Math.round(
                  (currentUsage.inference_hours / tier.max_inference_hours) *
                    100
                )
              : 0,
          },
        },
        billing_period: {
          start: currentUsage.billing_period_start,
          end: currentUsage.billing_period_end,
        },
      };

      return status;
    } catch (e) {
      console.error("Error fetching usage status:", e.message);
      throw e;
    }
  },

  // Check if usage exceeds limit
  isQuotaExceeded: async function (workspaceId, metricType, newValue = null) {
    try {
      const status = await this.getUsageStatus(workspaceId);
      const metric = status.usage[metricType];

      if (!metric || metric.limit === null) return false; // unlimited

      if (newValue !== null) {
        return metric.used + newValue > metric.limit;
      }

      return metric.percentage >= 100;
    } catch (e) {
      console.error("Error checking quota:", e.message);
      throw e;
    }
  },

  // Check if usage is near limit (warning threshold)
  isNearLimit: async function (workspaceId, metricType, threshold = 80) {
    try {
      const status = await this.getUsageStatus(workspaceId);
      const metric = status.usage[metricType];

      if (!metric || metric.limit === null) return false; // unlimited

      return metric.percentage >= threshold;
    } catch (e) {
      console.error("Error checking limit threshold:", e.message);
      throw e;
    }
  },

  // Get all metrics for workspace
  all: async function (workspaceId) {
    try {
      return await prisma.usage_metrics.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { snapshot_date: "desc" },
      });
    } catch (e) {
      console.error("Error fetching all metrics:", e.message);
      throw e;
    }
  },

  // Delete old metrics (cleanup)
  deleteOldMetrics: async function (daysOld = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      return await prisma.usage_metrics.deleteMany({
        where: {
          created_at: {
            lt: cutoffDate,
          },
        },
      });
    } catch (e) {
      console.error("Error deleting old metrics:", e.message);
      throw e;
    }
  },
};

module.exports = { UsageMetrics };
