const { UsageMetrics } = require("../models/usageMetrics");
const { UsageWarning } = require("../models/usageWarning");
const { WorkspaceTier } = require("../models/workspaceTier");

/**
 * Middleware to enforce usage quotas for workspaces
 * Checks if an operation would exceed the workspace's usage limits
 *
 * Usage:
 *   app.post('/api/chat/:workspaceId', quotaEnforcement(), chatHandler)
 */
function quotaEnforcement(options = {}) {
  const {
    metricType = "messages", // messages, tokens, storage, inference_hours
    checkValue = null, // Optional: pass a value to check against
    allowOverage = false, // Free tier: block. Pro/Team: allow with overage charge. Enterprise: always allow
  } = options;

  return async (request, response, next) => {
    try {
      // Extract workspace ID from request
      const workspaceId = parseInt(
        request.params.workspaceId ||
          request.body?.workspaceId ||
          request.query?.workspaceId
      );

      if (!workspaceId || isNaN(workspaceId)) {
        return next(); // Skip if no workspace ID
      }

      // Get workspace tier and current usage
      const usageStatus = await UsageMetrics.getUsageStatus(workspaceId);
      const tier = await WorkspaceTier.getByWorkspaceId(workspaceId);

      if (!tier || !usageStatus) {
        return next(); // Skip if no tier found
      }

      const metric = usageStatus.usage[metricType];

      // Check if metric has a limit
      if (!metric || metric.limit === null) {
        return next(); // Unlimited metric, proceed
      }

      // Prepare response metadata
      const quotaInfo = {
        metric: metricType,
        limit: metric.limit,
        used: metric.used,
        percentage: metric.percentage,
        tier: tier.tier,
        warningThresholds: {
          warning: 80,
          critical: 90,
          exceeded: 100,
        },
      };

      // Set quota info in response headers for frontend
      response.set("X-Quota-Metric", metricType);
      response.set("X-Quota-Limit", metric.limit.toString());
      response.set("X-Quota-Used", metric.used.toString());
      response.set("X-Quota-Percentage", metric.percentage.toString());

      // Check for quota exceeded
      if (metric.percentage >= 100) {
        // Quota is exceeded
        response.set("X-Quota-Status", "exceeded");

        if (!allowOverage || tier.tier === "free") {
          // Free tier cannot exceed - block the request
          return response.status(429).json({
            success: false,
            error: `Quota exceeded for ${metricType}`,
            message: `You have reached your monthly limit of ${metric.limit} ${metricType}. Please upgrade your plan to continue.`,
            quota: quotaInfo,
            action: "upgrade",
            upgradeUrl: `/workspace/${workspaceId}/billing?tab=upgrade`,
          });
        }

        // Pro/Team/Enterprise can exceed with overage charges
        response.set("X-Quota-Status", "overage");
        response.set(
          "X-Quota-Message",
          `Usage exceeds limit. Additional charges apply.`
        );
      } else if (metric.percentage >= 90) {
        // Critical warning - 90% of limit
        response.set("X-Quota-Status", "critical");
        response.set(
          "X-Quota-Message",
          `Warning: You are using ${metric.percentage}% of your ${metricType} quota`
        );

        // Create critical warning if not already created
        await UsageWarning.checkAndCreate(
          workspaceId,
          metricType,
          metric.used,
          metric.limit,
          [90, 100]
        );
      } else if (metric.percentage >= 80) {
        // Warning - 80% of limit
        response.set("X-Quota-Status", "warning");
        response.set(
          "X-Quota-Message",
          `Warning: You are using ${metric.percentage}% of your ${metricType} quota`
        );

        // Create warning if not already created
        await UsageWarning.checkAndCreate(
          workspaceId,
          metricType,
          metric.used,
          metric.limit,
          [80]
        );
      } else {
        // OK - under 80%
        response.set("X-Quota-Status", "ok");
      }

      // Store quota info in request for downstream handlers
      request.quotaInfo = quotaInfo;
      request.usageStatus = usageStatus;

      next();
    } catch (e) {
      console.error("Error in quota enforcement middleware:", e.message);
      // Don't block on middleware error - log and continue
      next();
    }
  };
}

/**
 * Helper function to check quota and return status
 * Useful for programmatic checks
 */
async function checkQuota(
  workspaceId,
  metricType = "messages",
  valueToAdd = 0
) {
  try {
    const usageStatus = await UsageMetrics.getUsageStatus(workspaceId);
    const metric = usageStatus.usage[metricType];

    if (!metric || metric.limit === null) {
      return { allowed: true, status: "unlimited" };
    }

    const projectedUsage = metric.used + valueToAdd;
    const wouldExceed = projectedUsage > metric.limit;
    const percentage = Math.round((projectedUsage / metric.limit) * 100);

    return {
      allowed: !wouldExceed,
      status: wouldExceed ? "exceeded" : "ok",
      current: metric.used,
      projected: projectedUsage,
      limit: metric.limit,
      percentage,
    };
  } catch (e) {
    console.error("Error checking quota:", e.message);
    throw e;
  }
}

/**
 * Helper function to record usage and check if quota exceeded
 */
async function recordUsageAndCheckQuota(workspaceId, metricType, value) {
  try {
    // Check if operation would exceed quota
    const quotaStatus = await checkQuota(
      workspaceId,
      metricType,
      value
    );

    if (!quotaStatus.allowed) {
      return {
        success: false,
        quotaExceeded: true,
        message: `Cannot record ${value} ${metricType} - quota would be exceeded`,
        currentUsage: quotaStatus.current,
        limit: quotaStatus.limit,
      };
    }

    // Record the usage
    const metricData = {
      [metricType]: value,
    };

    const recorded = await UsageMetrics.recordEvent(workspaceId, {
      messages: metricType === "messages" ? value : 0,
      tokens: metricType === "tokens" ? value : 0,
      storage: metricType === "storage" ? value : 0,
      inferenceHours:
        metricType === "inference_hours" ? value : 0,
    });

    return {
      success: true,
      quotaExceeded: false,
      recorded,
      newUsage: quotaStatus.projected,
      limit: quotaStatus.limit,
    };
  } catch (e) {
    console.error("Error recording usage and checking quota:", e.message);
    throw e;
  }
}

module.exports = {
  quotaEnforcement,
  checkQuota,
  recordUsageAndCheckQuota,
};
