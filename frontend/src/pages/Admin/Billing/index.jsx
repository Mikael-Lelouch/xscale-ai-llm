import React, { useEffect, useState } from "react";
import { useState as useGlobalState } from "zustand";
import DefaultLayout from "@/components/LayoutComponents/DefaultLayout";
import { API_BASE } from "@/utils/constants";
import BillingAnalytics from "./BillingAnalytics";
import WorkspaceBillingList from "./WorkspaceBillingList";
import { CreditCard, TrendingUp, Users, AlertCircle } from "react-feather";

export default function BillingDashboard() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    fetchBillingData();
  }, []);

  async function fetchBillingData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch analytics
      const analyticsRes = await fetch(
        `${API_BASE}/api/v1/billing/admin/analytics`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setAnalytics(analyticsData.analytics);
      }

      // Fetch workspaces
      const workspacesRes = await fetch(
        `${API_BASE}/api/v1/billing/admin/workspaces?limit=50`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        }
      );

      if (workspacesRes.ok) {
        const workspacesData = await workspacesRes.json();
        setWorkspaces(workspacesData.workspaces);
      }
    } catch (err) {
      console.error("Error fetching billing data:", err);
      setError("Failed to load billing data");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DefaultLayout headerEntity="admin">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DefaultLayout>
    );
  }

  return (
    <DefaultLayout headerEntity="admin">
      <div className="p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Billing & Revenue</h1>
            <p className="text-gray-400 mt-2">
              Manage subscriptions, invoices, and revenue analytics
            </p>
          </div>
          <CreditCard className="text-blue-600" size={48} />
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <span className="text-red-300">{error}</span>
          </div>
        )}

        {/* Key Metrics */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Current Month Revenue</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    ${analytics.current_month_revenue?.toFixed(2) || "0.00"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {analytics.current_month_invoices} invoices
                  </p>
                </div>
                <TrendingUp className="text-green-400" size={32} />
              </div>
            </div>

            <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Active Subscriptions</p>
                  <p className="text-2xl font-bold text-white mt-2">
                    {analytics.active_subscriptions || 0}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">paid plans</p>
                </div>
                <Users className="text-blue-400" size={32} />
              </div>
            </div>

            <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
              <div>
                <p className="text-gray-400 text-sm">Tier Breakdown</p>
                <div className="mt-3 space-y-2">
                  {analytics.tier_breakdown && (
                    <>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Free</span>
                        <span className="text-white font-semibold">
                          {analytics.tier_breakdown.free || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Pro</span>
                        <span className="text-white font-semibold">
                          {analytics.tier_breakdown.pro || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Team</span>
                        <span className="text-white font-semibold">
                          {analytics.tier_breakdown.team || 0}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300">Enterprise</span>
                        <span className="text-white font-semibold">
                          {analytics.tier_breakdown.enterprise || 0}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-600 flex gap-4">
          <button
            onClick={() => setActiveTab("overview")}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === "overview"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => setActiveTab("workspaces")}
            className={`pb-3 px-4 font-medium transition ${
              activeTab === "workspaces"
                ? "text-blue-400 border-b-2 border-blue-400"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Workspaces
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && <BillingAnalytics analytics={analytics} />}
        {activeTab === "workspaces" && (
          <WorkspaceBillingList
            workspaces={workspaces}
            onRefresh={fetchBillingData}
          />
        )}
      </div>
    </DefaultLayout>
  );
}
