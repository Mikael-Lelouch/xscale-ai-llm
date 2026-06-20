import React, { useEffect, useState } from "react";
import DefaultLayout from "@/components/LayoutComponents/DefaultLayout";
import { API_BASE } from "@/utils/constants";
import UsageMetrics from "./UsageMetrics";
import SubscriptionInfo from "./SubscriptionInfo";
import InvoiceHistory from "./InvoiceHistory";
import QuotaWarningBanner from "@/components/QuotaWarningBanner";
import { AlertCircle, CheckCircle, Clock, CreditCard } from "react-feather";

export default function WorkspaceBillingPage({ workspace }) {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("usage");

  useEffect(() => {
    fetchBillingData();
  }, [workspace?.id]);

  async function fetchBillingData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch subscription info
      const subRes = await fetch(
        `${API_BASE}/api/v1/billing/workspace/${workspace?.id}/subscription`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData);
      }

      // Fetch usage metrics
      const usageRes = await fetch(
        `${API_BASE}/api/v1/billing/workspace/${workspace?.id}/usage`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        setUsage(usageData);
      }

      // Fetch invoices
      const invRes = await fetch(
        `${API_BASE}/api/v1/billing/workspace/${workspace?.id}/invoices`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (invRes.ok) {
        const invData = await invRes.json();
        setInvoices(invData.invoices || []);
      }
    } catch (err) {
      console.error("Error fetching billing data:", err);
      setError("Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DefaultLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DefaultLayout>
    );
  }

  const hasCriticalWarning = usage?.warnings?.some(
    (w) => w.percentage === 100
  );

  return (
    <DefaultLayout>
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Billing & Usage</h1>
            <p className="text-gray-400 mt-2">
              Manage your workspace subscription and monitor usage limits
            </p>
          </div>
          <CreditCard className="text-blue-600" size={48} />
        </div>

        {/* Critical Warning Banner */}
        {hasCriticalWarning && <QuotaWarningBanner warnings={usage.warnings} />}

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Current Plan Status */}
        {subscription && (
          <div className="bg-gradient-to-r from-blue-900 to-blue-800 rounded-lg p-6 border border-blue-700">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {subscription.tier.name} Plan
                </h2>
                <p className="text-blue-200 mt-1">
                  ${subscription.tier.monthly_price.toFixed(2)}/month
                </p>
                {subscription.tier.trial_ends_at && (
                  <p className="text-sm text-blue-300 mt-2 flex items-center gap-2">
                    <Clock size={16} />
                    Trial ends{" "}
                    {new Date(
                      subscription.tier.trial_ends_at
                    ).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-3">
                  {subscription.tier.status === "active" && (
                    <CheckCircle className="text-green-400" size={20} />
                  )}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      subscription.tier.status === "active"
                        ? "bg-green-900 bg-opacity-50 text-green-300"
                        : "bg-yellow-900 bg-opacity-50 text-yellow-300"
                    }`}
                  >
                    {subscription.tier.status.charAt(0).toUpperCase() +
                      subscription.tier.status.slice(1)}
                  </span>
                </div>
                <p className="text-sm text-blue-200">
                  Renews{" "}
                  {new Date(
                    subscription.tier.current_period_end
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-600 flex gap-4">
          <button
            onClick={() => setActiveTab("usage")}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === "usage"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Usage Metrics
          </button>
          <button
            onClick={() => setActiveTab("invoices")}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === "invoices"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Invoices
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "usage" && usage && (
          <UsageMetrics
            usage={usage}
            tier={subscription?.tier}
            onRefresh={fetchBillingData}
          />
        )}
        {activeTab === "invoices" && (
          <InvoiceHistory invoices={invoices} />
        )}
      </div>
    </DefaultLayout>
  );
}
