import React from "react";
import { TrendingUp, Users, DollarSign, Activity } from "react-feather";

export default function BillingAnalytics({ analytics }) {
  if (!analytics) {
    return (
      <div className="text-gray-400 text-center py-12">
        No analytics data available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">
                Monthly Revenue
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                ${analytics.current_month_revenue?.toFixed(2) || "0.00"}
              </p>
            </div>
            <DollarSign className="text-green-400" size={24} />
          </div>
        </div>

        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">
                Invoices This Month
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {analytics.current_month_invoices || 0}
              </p>
            </div>
            <Activity className="text-blue-400" size={24} />
          </div>
        </div>

        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">
                Last Month Revenue
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                ${analytics.last_month_revenue?.toFixed(2) || "0.00"}
              </p>
            </div>
            <TrendingUp className="text-purple-400" size={24} />
          </div>
        </div>

        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-xs uppercase">
                Active Subscriptions
              </p>
              <p className="text-2xl font-bold text-white mt-1">
                {analytics.active_subscriptions || 0}
              </p>
            </div>
            <Users className="text-pink-400" size={24} />
          </div>
        </div>
      </div>

      {/* Tier Distribution Chart */}
      <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Distribution by Tier
        </h3>
        <div className="space-y-3">
          {analytics.tier_breakdown && (
            <>
              {["free", "pro", "team", "enterprise"].map((tier) => {
                const count = analytics.tier_breakdown[tier] || 0;
                const total = Object.values(analytics.tier_breakdown).reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={tier}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-300 text-sm capitalize font-medium">
                        {tier}
                      </span>
                      <span className="text-white font-semibold">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="bg-gray-900 bg-opacity-50 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Summary
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800 bg-opacity-50 rounded p-4">
            <p className="text-gray-400 text-sm">Total Workspaces</p>
            <p className="text-2xl font-bold text-white mt-2">
              {analytics.tier_breakdown
                ? Object.values(analytics.tier_breakdown).reduce(
                    (a, b) => a + b,
                    0
                  )
                : 0}
            </p>
          </div>
          <div className="bg-gray-800 bg-opacity-50 rounded p-4">
            <p className="text-gray-400 text-sm">MRR (Monthly Recurring)</p>
            <p className="text-2xl font-bold text-white mt-2">
              ${(analytics.current_month_revenue || 0).toFixed(2)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
