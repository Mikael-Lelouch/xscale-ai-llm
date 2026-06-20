const prisma = require("../utils/prisma");

const TierDefinitions = {
  FREE: {
    tier: "free",
    max_users: 1,
    max_storage_gb: 1,
    max_messages_month: 1000,
    max_tokens_month: 100000,
    max_inference_hours: 1,
    monthly_price: 0,
  },
  PRO: {
    tier: "pro",
    max_users: 5,
    max_storage_gb: 10,
    max_messages_month: 50000,
    max_tokens_month: 5000000,
    max_inference_hours: 100,
    monthly_price: 29.99,
  },
  TEAM: {
    tier: "team",
    max_users: 10,
    max_storage_gb: 50,
    max_messages_month: 500000,
    max_tokens_month: 50000000,
    max_inference_hours: 1000,
    monthly_price: 99.99,
  },
  ENTERPRISE: {
    tier: "enterprise",
    max_users: null, // unlimited
    max_storage_gb: null,
    max_messages_month: null,
    max_tokens_month: null,
    max_inference_hours: null,
    monthly_price: 0, // Custom pricing
  },
};

const WorkspaceTier = {
  // Get tier definition by ID
  get: async function (tierId) {
    try {
      return await prisma.workspace_tiers.findUnique({
        where: { id: tierId },
        include: {
          workspace: true,
          stripe_subscriptions: true,
        },
      });
    } catch (e) {
      console.error("Error getting workspace tier:", e.message);
      throw e;
    }
  },

  // Get tier by workspace ID
  getByWorkspaceId: async function (workspaceId) {
    try {
      return await prisma.workspace_tiers.findUnique({
        where: { workspace_id: workspaceId },
        include: {
          workspace: true,
          stripe_subscriptions: true,
        },
      });
    } catch (e) {
      console.error("Error getting workspace tier by workspace ID:", e.message);
      throw e;
    }
  },

  // Get tier by name
  getByName: async function (tierName) {
    try {
      return await prisma.workspace_tiers.findFirst({
        where: { tier: tierName.toLowerCase() },
      });
    } catch (e) {
      console.error("Error getting workspace tier by name:", e.message);
      throw e;
    }
  },

  // Create a new tier subscription for a workspace
  create: async function (workspaceId, tierName = "free") {
    try {
      const tierDef = TierDefinitions[tierName.toUpperCase()];
      if (!tierDef) {
        throw new Error(`Invalid tier name: ${tierName}`);
      }

      // Calculate period dates
      const now = new Date();
      const currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentPeriodEnd = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      );

      return await prisma.workspace_tiers.create({
        data: {
          workspace_id: workspaceId,
          tier: tierDef.tier,
          max_users: tierDef.max_users,
          max_storage_gb: tierDef.max_storage_gb,
          max_messages_month: tierDef.max_messages_month,
          max_tokens_month: tierDef.max_tokens_month,
          max_inference_hours: tierDef.max_inference_hours,
          monthly_price: tierDef.monthly_price,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          status: "active",
        },
      });
    } catch (e) {
      console.error("Error creating workspace tier:", e.message);
      throw e;
    }
  },

  // Update tier subscription
  update: async function (tierId, updates) {
    try {
      const allowedUpdates = [
        "tier",
        "max_users",
        "max_storage_gb",
        "max_messages_month",
        "max_tokens_month",
        "max_inference_hours",
        "monthly_price",
        "trial_ends_at",
        "status",
        "auto_renew",
        "billing_email",
      ];

      const sanitizedUpdates = {};
      for (const key of allowedUpdates) {
        if (key in updates) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      sanitizedUpdates.updated_at = new Date();

      return await prisma.workspace_tiers.update({
        where: { id: tierId },
        data: sanitizedUpdates,
      });
    } catch (e) {
      console.error("Error updating workspace tier:", e.message);
      throw e;
    }
  },

  // Change tier for a workspace
  changeTier: async function (workspaceId, newTierName) {
    try {
      const tierDef = TierDefinitions[newTierName.toUpperCase()];
      if (!tierDef) {
        throw new Error(`Invalid tier name: ${newTierName}`);
      }

      return await prisma.workspace_tiers.update({
        where: { workspace_id: workspaceId },
        data: {
          tier: tierDef.tier,
          max_users: tierDef.max_users,
          max_storage_gb: tierDef.max_storage_gb,
          max_messages_month: tierDef.max_messages_month,
          max_tokens_month: tierDef.max_tokens_month,
          max_inference_hours: tierDef.max_inference_hours,
          monthly_price: tierDef.monthly_price,
          updated_at: new Date(),
        },
        include: {
          workspace: true,
          stripe_subscriptions: true,
        },
      });
    } catch (e) {
      console.error("Error changing workspace tier:", e.message);
      throw e;
    }
  },

  // Get the default (Free) tier definition
  getDefaultTierDef: function () {
    return TierDefinitions.FREE;
  },

  // Get all tier definitions
  getAllTierDefs: function () {
    return TierDefinitions;
  },

  // Get specific tier definition
  getTierDef: function (tierName) {
    return TierDefinitions[tierName.toUpperCase()];
  },

  // Check if limit is exceeded
  isLimitExceeded: async function (workspaceId, metricType, currentValue) {
    try {
      const tier = await this.getByWorkspaceId(workspaceId);
      if (!tier) {
        throw new Error(`No tier found for workspace ${workspaceId}`);
      }

      const limits = {
        messages: tier.max_messages_month,
        storage: tier.max_storage_gb,
        users: tier.max_users,
        tokens: tier.max_tokens_month,
        inference: tier.max_inference_hours,
      };

      const limit = limits[metricType];
      if (limit === null) return false; // unlimited

      return currentValue >= limit;
    } catch (e) {
      console.error("Error checking limit:", e.message);
      throw e;
    }
  },

  // Get usage percentage for a metric
  getUsagePercentage: async function (workspaceId, metricType, currentValue) {
    try {
      const tier = await this.getByWorkspaceId(workspaceId);
      if (!tier) {
        throw new Error(`No tier found for workspace ${workspaceId}`);
      }

      const limits = {
        messages: tier.max_messages_month,
        storage: tier.max_storage_gb,
        users: tier.max_users,
        tokens: tier.max_tokens_month,
        inference: tier.max_inference_hours,
      };

      const limit = limits[metricType];
      if (limit === null) return 0; // unlimited = no percentage

      return Math.round((currentValue / limit) * 100);
    } catch (e) {
      console.error("Error calculating usage percentage:", e.message);
      throw e;
    }
  },

  // Get all tiers for a workspace
  all: async function (workspaceId = null) {
    try {
      const query = {};
      if (workspaceId) {
        query.where = { workspace_id: workspaceId };
      }

      return await prisma.workspace_tiers.findMany(query);
    } catch (e) {
      console.error("Error fetching workspace tiers:", e.message);
      throw e;
    }
  },

  // Delete tier (soft delete - set status to canceled)
  delete: async function (tierId) {
    try {
      return await prisma.workspace_tiers.update({
        where: { id: tierId },
        data: {
          status: "canceled",
          updated_at: new Date(),
        },
      });
    } catch (e) {
      console.error("Error deleting workspace tier:", e.message);
      throw e;
    }
  },
};

module.exports = { WorkspaceTier, TierDefinitions };
