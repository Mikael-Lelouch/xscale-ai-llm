const prisma = require("../utils/prisma");

const BillingInvoice = {
  // Create a new invoice
  create: async function (workspaceId, invoiceData) {
    try {
      const {
        subtotal = 0,
        tax = 0,
        overageAmount = 0,
        stripeInvoiceId = null,
        billingPeriodStart,
        billingPeriodEnd,
        dueDate = null,
      } = invoiceData;

      const tier = await prisma.workspace_tiers.findUnique({
        where: { workspace_id: workspaceId },
      });

      if (!tier) {
        throw new Error(
          `No tier found for workspace ${workspaceId}. Initialize tier first.`
        );
      }

      // Generate invoice number (format: INV-WORKSPACE_ID-TIMESTAMP)
      const timestamp = Date.now();
      const invoiceNumber = `INV-${workspaceId}-${timestamp}`;

      const total = subtotal + tax + overageAmount;

      return await prisma.billing_invoices.create({
        data: {
          workspace_id: workspaceId,
          workspace_tier_id: tier.id,
          invoice_number: invoiceNumber,
          stripe_invoice_id: stripeInvoiceId,
          status: "draft",
          subtotal,
          tax,
          total,
          currency: "USD",
          overage_amount: overageAmount,
          billing_period_start: billingPeriodStart,
          billing_period_end: billingPeriodEnd,
          due_date: dueDate,
        },
      });
    } catch (e) {
      console.error("Error creating invoice:", e.message);
      throw e;
    }
  },

  // Get invoice by ID
  get: async function (invoiceId) {
    try {
      return await prisma.billing_invoices.findUnique({
        where: { id: invoiceId },
        include: {
          workspace_tier: true,
        },
      });
    } catch (e) {
      console.error("Error fetching invoice:", e.message);
      throw e;
    }
  },

  // Get invoice by invoice number
  getByNumber: async function (invoiceNumber) {
    try {
      return await prisma.billing_invoices.findUnique({
        where: { invoice_number: invoiceNumber },
        include: {
          workspace_tier: true,
        },
      });
    } catch (e) {
      console.error("Error fetching invoice by number:", e.message);
      throw e;
    }
  },

  // Get invoice by Stripe ID
  getByStripeId: async function (stripeInvoiceId) {
    try {
      return await prisma.billing_invoices.findFirst({
        where: { stripe_invoice_id: stripeInvoiceId },
        include: {
          workspace_tier: true,
        },
      });
    } catch (e) {
      console.error("Error fetching invoice by Stripe ID:", e.message);
      throw e;
    }
  },

  // Get all invoices for workspace
  getByWorkspaceId: async function (workspaceId, limit = 12) {
    try {
      return await prisma.billing_invoices.findMany({
        where: { workspace_id: workspaceId },
        orderBy: { issued_at: "desc" },
        take: limit,
        include: {
          workspace_tier: true,
        },
      });
    } catch (e) {
      console.error("Error fetching invoices for workspace:", e.message);
      throw e;
    }
  },

  // Update invoice status
  updateStatus: async function (invoiceId, status) {
    try {
      const validStatuses = [
        "draft",
        "pending",
        "sent",
        "paid",
        "failed",
        "void",
      ];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}`);
      }

      const updates = {
        status,
        updated_at: new Date(),
      };

      if (status === "paid") {
        updates.paid_at = new Date();
      }

      return await prisma.billing_invoices.update({
        where: { id: invoiceId },
        data: updates,
      });
    } catch (e) {
      console.error("Error updating invoice status:", e.message);
      throw e;
    }
  },

  // Mark invoice as sent
  markAsSent: async function (invoiceId, pdfUrl = null) {
    try {
      return await prisma.billing_invoices.update({
        where: { id: invoiceId },
        data: {
          status: "sent",
          pdf_url: pdfUrl,
          email_sent_at: new Date(),
          updated_at: new Date(),
        },
      });
    } catch (e) {
      console.error("Error marking invoice as sent:", e.message);
      throw e;
    }
  },

  // Mark invoice as paid
  markAsPaid: async function (invoiceId, paidAt = new Date()) {
    try {
      return await prisma.billing_invoices.update({
        where: { id: invoiceId },
        data: {
          status: "paid",
          paid_at: paidAt,
          updated_at: new Date(),
        },
      });
    } catch (e) {
      console.error("Error marking invoice as paid:", e.message);
      throw e;
    }
  },

  // Get invoices for a date range
  getForPeriod: async function (
    workspaceId,
    startDate,
    endDate = new Date()
  ) {
    try {
      return await prisma.billing_invoices.findMany({
        where: {
          workspace_id: workspaceId,
          issued_at: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { issued_at: "desc" },
      });
    } catch (e) {
      console.error("Error fetching invoices for period:", e.message);
      throw e;
    }
  },

  // Get monthly revenue (admin analytics)
  getMonthlyRevenue: async function (month, year) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      const invoices = await prisma.billing_invoices.findMany({
        where: {
          issued_at: {
            gte: startDate,
            lte: endDate,
          },
          status: "paid",
        },
      });

      const revenue = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const count = invoices.length;

      return {
        month,
        year,
        revenue,
        invoiceCount: count,
        averageInvoice: count > 0 ? revenue / count : 0,
      };
    } catch (e) {
      console.error("Error fetching monthly revenue:", e.message);
      throw e;
    }
  },

  // Get revenue for a period
  getRevenueForPeriod: async function (startDate, endDate = new Date()) {
    try {
      const invoices = await prisma.billing_invoices.findMany({
        where: {
          issued_at: {
            gte: startDate,
            lte: endDate,
          },
          status: "paid",
        },
      });

      const revenue = invoices.reduce((sum, inv) => sum + inv.total, 0);

      return {
        revenue,
        invoiceCount: invoices.length,
        averageInvoice:
          invoices.length > 0 ? revenue / invoices.length : 0,
        startDate,
        endDate,
      };
    } catch (e) {
      console.error("Error fetching revenue for period:", e.message);
      throw e;
    }
  },

  // Get overdue invoices
  getOverdue: async function () {
    try {
      const today = new Date();
      return await prisma.billing_invoices.findMany({
        where: {
          status: { in: ["pending", "sent"] },
          due_date: {
            lt: today,
          },
        },
        orderBy: { due_date: "asc" },
      });
    } catch (e) {
      console.error("Error fetching overdue invoices:", e.message);
      throw e;
    }
  },

  // Get all invoices (admin)
  all: async function (limit = 100, offset = 0) {
    try {
      return await prisma.billing_invoices.findMany({
        orderBy: { issued_at: "desc" },
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
      console.error("Error fetching all invoices:", e.message);
      throw e;
    }
  },

  // Delete invoice (soft delete by voiding)
  delete: async function (invoiceId) {
    try {
      return await prisma.billing_invoices.update({
        where: { id: invoiceId },
        data: {
          status: "void",
          updated_at: new Date(),
        },
      });
    } catch (e) {
      console.error("Error deleting invoice:", e.message);
      throw e;
    }
  },
};

module.exports = { BillingInvoice };
