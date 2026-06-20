const prisma = require("../utils/prisma");

const UsageWarning = {
  // Create a new warning
  create: async function (workspaceId, warningData) {
    try {
      const {
        warningType, // quota_80, quota_90, quota_100, overage_charge
        metricType, // messages, storage, users, tokens, inference_hours
        thresholdPercent = 80,
        currentUsage,
        limit,
      } = warningData;

      // Check if warning already exists
      const existing = await prisma.usage_warnings.findFirst({
        where: {
          workspace_id: workspaceId,
          warning_type: warningType,
          metric_type: metricType,
          acknowledged: false,
        },
      });

      if (existing) {
        // Update existing unacknowledged warning
        return await prisma.usage_warnings.update({
          where: { id: existing.id },
          data: {
            threshold_percent: thresholdPercent,
            current_usage: currentUsage,
            limit,
            updated_at: new Date(),
          },
        });
      }

      // Create new warning
      return await prisma.usage_warnings.create({
        data: {
          workspace_id: workspaceId,
          warning_type: warningType,
          metric_type: metricType,
          threshold_percent: thresholdPercent,
          current_usage: currentUsage,
          limit,
        },
      });
    } catch (e) {
      console.error("Error creating usage warning:", e.message);
      throw e;
    }
  },

  // Get warning by ID
  get: async function (warningId) {
    try {
      return await prisma.usage_warnings.findUnique({
        where: { id: warningId },
      });
    } catch (e) {
      console.error("Error fetching warning:", e.message);
      throw e;
    }
  },

  // Get all unacknowledged warnings for workspace
  getUnacknowledged: async function (workspaceId) {
    try {
      return await prisma.usage_warnings.findMany({
        where: {
          workspace_id: workspaceId,
          acknowledged: false,
        },
        orderBy: { created_at: "desc" },
      });
    } catch (e) {
      console.error("Error fetching unacknowledged warnings:", e.message);
      throw e;
    }
  },

  // Get all warnings for workspace
  getByWorkspaceId: async function (workspaceId, limit = 10) {
    try {
      return await prisma.usage_warnings.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { created_at: "desc" },
        take: limit,
      });
    } catch (e) {
      console.error("Error fetching warnings for workspace:", e.message);
      throw e;
    }
  },

  // Get warnings by type
  getByType: async function (
    workspaceId,
    warningType,
    acknowledged = false
  ) {
    try {
      return await prisma.usage_warnings.findMany({
        where: {
          workspace_id: workspaceId,
          warning_type: warningType,
          acknowledged,
        },
      });
    } catch (e) {
      console.error("Error fetching warnings by type:", e.message);
      throw e;
    }
  },

  // Get warnings by metric
  getByMetric: async function (
    workspaceId,
    metricType,
    acknowledged = false
  ) {
    try {
      return await prisma.usage_warnings.findMany({
        where: {
          workspace_id: workspaceId,
          metric_type: metricType,
          acknowledged,
        },
      });
    } catch (e) {
      console.error("Error fetching warnings by metric:", e.message);
      throw e;
    }
  },

  // Acknowledge a warning
  acknowledge: async function (warningId) {
    try {
      return await prisma.usage_warnings.update({
        where: { id: warningId },
        data: {
          acknowledged: true,
          acknowledged_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (e) {
      console.error("Error acknowledging warning:", e.message);
      throw e;
    }
  },

  // Acknowledge all warnings of a type for workspace
  acknowledgeAll: async function (
    workspaceId,
    warningType = null,
    metricType = null
  ) {
    try {
      const where = {
        workspace_id: workspaceId,
        acknowledged: false,
      };

      if (warningType) {
        where.warning_type = warningType;
      }

      if (metricType) {
        where.metric_type = metricType;
      }

      return await prisma.usage_warnings.updateMany({
        where,
        data: {
          acknowledged: true,
          acknowledged_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (e) {
      console.error("Error acknowledging warnings:", e.message);
      throw e;
    }
  },

  // Check and create warning if threshold exceeded
  checkAndCreate: async function (
    workspaceId,
    metricType,
    currentValue,
    limit,
    thresholds = [80, 90, 100]
  ) {
    try {
      if (!limit || limit === null) return null; // unlimited metric

      const percentage = Math.round((currentValue / limit) * 100);

      for (const threshold of thresholds.sort((a, b) => b - a)) {
        if (percentage >= threshold) {
          const warningType =
            threshold === 100
              ? "quota_100"
              : threshold === 90
                ? "quota_90"
                : "quota_80";

          return await this.create(workspaceId, {
            warningType,
            metricType,
            thresholdPercent: threshold,
            currentUsage: currentValue,
            limit,
          });
        }
      }

      return null;
    } catch (e) {
      console.error("Error checking and creating warning:", e.message);
      throw e;
    }
  },

  // Get critical warnings (at 100% limit)
  getCritical: async function (workspaceId = null) {
    try {
      const where = {
        warning_type: "quota_100",
        acknowledged: false,
      };

      if (workspaceId) {
        where.workspace_id = workspaceId;
      }

      return await prisma.usage_warnings.findMany({
        where,
        orderBy: { created_at: "desc" },
      });
    } catch (e) {
      console.error("Error fetching critical warnings:", e.message);
      throw e;
    }
  },

  // Delete old acknowledged warnings (cleanup)
  deleteOldWarnings: async function (daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      return await prisma.usage_warnings.deleteMany({
        where: {
          acknowledged: true,
          acknowledged_at: {
            lt: cutoffDate,
          },
        },
      });
    } catch (e) {
      console.error("Error deleting old warnings:", e.message);
      throw e;
    }
  },

  // Get all warnings (admin)
  all: async function (limit = 100, offset = 0) {
    try {
      return await prisma.usage_warnings.findMany({
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
      });
    } catch (e) {
      console.error("Error fetching all warnings:", e.message);
      throw e;
    }
  },
};

module.exports = { UsageWarning };
