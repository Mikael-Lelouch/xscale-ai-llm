const prisma = require("../utils/prisma");

const StripeSubscription = {
  // Create a new Stripe subscription record
  create: async function (workspaceId, subscriptionData) {
    try {
      const {
        stripeSubscriptionId,
        stripeCustomerId,
        stripeProductId = null,
        stripePriceId = null,
        status = "active",
        currentPeriodStart,
        currentPeriodEnd,
        stripePaymentMethodId = null,
        metadata = null,
      } = subscriptionData;

      const tier = await prisma.workspace_tiers.findUnique({
        where: { workspace_id: workspaceId },
      });

      if (!tier) {
        throw new Error(
          `No tier found for workspace ${workspaceId}. Initialize tier first.`
        );
      }

      return await prisma.stripe_subscriptions.create({
        data: {
          workspace_id: workspaceId,
          workspace_tier_id: tier.id,
          stripe_subscription_id: stripeSubscriptionId,
          stripe_customer_id: stripeCustomerId,
          stripe_product_id: stripeProductId,
          stripe_price_id: stripePriceId,
          status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          stripe_payment_method_id: stripePaymentMethodId,
          metadata,
        },
      });
    } catch (e) {
      console.error("Error creating Stripe subscription:", e.message);
      throw e;
    }
  },

  // Get subscription by ID
  get: async function (subscriptionId) {
    try {
      return await prisma.stripe_subscriptions.findUnique({
        where: { id: subscriptionId },
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error("Error fetching Stripe subscription:", e.message);
      throw e;
    }
  },

  // Get subscription by workspace ID
  getByWorkspaceId: async function (workspaceId) {
    try {
      return await prisma.stripe_subscriptions.findFirst({
        where: { workspace_id: workspaceId },
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error(
        "Error fetching Stripe subscription by workspace:",
        e.message
      );
      throw e;
    }
  },

  // Get subscription by Stripe subscription ID
  getByStripeId: async function (stripeSubscriptionId) {
    try {
      return await prisma.stripe_subscriptions.findUnique({
        where: { stripe_subscription_id: stripeSubscriptionId },
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error(
        "Error fetching Stripe subscription by Stripe ID:",
        e.message
      );
      throw e;
    }
  },

  // Get subscription by Stripe customer ID
  getByCustomerId: async function (stripeCustomerId) {
    try {
      return await prisma.stripe_subscriptions.findFirst({
        where: { stripe_customer_id: stripeCustomerId },
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error(
        "Error fetching Stripe subscription by customer ID:",
        e.message
      );
      throw e;
    }
  },

  // Update subscription status
  updateStatus: async function (subscriptionId, status, periodDates = null) {
    try {
      const validStatuses = [
        "active",
        "past_due",
        "unpaid",
        "canceled",
        "incomplete",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid subscription status: ${status}`);
      }

      const updates = {
        status,
        updated_at: new Date(),
      };

      if (periodDates) {
        if (periodDates.start) {
          updates.current_period_start = periodDates.start;
        }
        if (periodDates.end) {
          updates.current_period_end = periodDates.end;
        }
      }

      if (status === "canceled") {
        updates.canceled_at = new Date();
      }

      return await prisma.stripe_subscriptions.update({
        where: { id: subscriptionId },
        data: updates,
      });
    } catch (e) {
      console.error("Error updating Stripe subscription status:", e.message);
      throw e;
    }
  },

  // Update subscription by Stripe ID
  updateByStripeId: async function (stripeSubscriptionId, updates) {
    try {
      const subscription = await this.getByStripeId(stripeSubscriptionId);
      if (!subscription) {
        throw new Error(
          `Stripe subscription not found: ${stripeSubscriptionId}`
        );
      }

      const allowedUpdates = [
        "status",
        "current_period_start",
        "current_period_end",
        "cancel_at_period_end",
        "stripe_payment_method_id",
        "metadata",
      ];

      const sanitizedUpdates = {};
      for (const key of allowedUpdates) {
        if (key in updates) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      sanitizedUpdates.updated_at = new Date();

      return await prisma.stripe_subscriptions.update({
        where: { id: subscription.id },
        data: sanitizedUpdates,
      });
    } catch (e) {
      console.error("Error updating Stripe subscription:", e.message);
      throw e;
    }
  },

  // Cancel subscription
  cancel: async function (subscriptionId, immediate = false) {
    try {
      const updates = {
        updated_at: new Date(),
      };

      if (immediate) {
        updates.status = "canceled";
        updates.canceled_at = new Date();
      } else {
        updates.cancel_at_period_end = true;
      }

      return await prisma.stripe_subscriptions.update({
        where: { id: subscriptionId },
        data: updates,
      });
    } catch (e) {
      console.error("Error canceling Stripe subscription:", e.message);
      throw e;
    }
  },

  // Cancel subscription by Stripe ID
  cancelByStripeId: async function (
    stripeSubscriptionId,
    immediate = false
  ) {
    try {
      const subscription = await this.getByStripeId(stripeSubscriptionId);
      if (!subscription) {
        throw new Error(
          `Stripe subscription not found: ${stripeSubscriptionId}`
        );
      }

      return await this.cancel(subscription.id, immediate);
    } catch (e) {
      console.error("Error canceling subscription by Stripe ID:", e.message);
      throw e;
    }
  },

  // Get subscriptions near renewal
  getNearRenewal: async function (daysAhead = 7) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + daysAhead);

      return await prisma.stripe_subscriptions.findMany({
        where: {
          status: "active",
          current_period_end: {
            gte: tomorrow,
            lte: renewalDate,
          },
        },
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error(
        "Error fetching subscriptions near renewal:",
        e.message
      );
      throw e;
    }
  },

  // Get past due subscriptions
  getPastDue: async function () {
    try {
      return await prisma.stripe_subscriptions.findMany({
        where: {
          status: { in: ["past_due", "unpaid"] },
        },
        orderBy: { created_at: "asc" },
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error("Error fetching past due subscriptions:", e.message);
      throw e;
    }
  },

  // Get active subscriptions
  getActive: async function (limit = 100, offset = 0) {
    try {
      return await prisma.stripe_subscriptions.findMany({
        where: { status: "active" },
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error("Error fetching active subscriptions:", e.message);
      throw e;
    }
  },

  // Get all subscriptions (admin)
  all: async function (limit = 100, offset = 0) {
    try {
      return await prisma.stripe_subscriptions.findMany({
        orderBy: { created_at: "desc" },
        skip: offset,
        take: limit,
        include: {
          workspace_tier: {
            include: {
              workspace: true,
            },
          },
        },
      });
    } catch (e) {
      console.error("Error fetching all subscriptions:", e.message);
      throw e;
    }
  },

  // Delete subscription (soft delete - cancel)
  delete: async function (subscriptionId) {
    try {
      return await this.cancel(subscriptionId, true);
    } catch (e) {
      console.error("Error deleting subscription:", e.message);
      throw e;
    }
  },
};

module.exports = { StripeSubscription };
