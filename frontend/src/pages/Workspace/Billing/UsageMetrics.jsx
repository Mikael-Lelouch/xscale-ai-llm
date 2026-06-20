import React from "react";
import { AlertTriangle, AlertCircle } from "react-feather";

const UsageMetric = ({ name, used, limit, percentage, unit = "" }) => {
  let statusColor = "text-green-400";
  let barColor = "bg-green-500";

  if (percentage >= 100) {
    statusColor = "text-red-400";
    barColor = "bg-red-500";
  } else if (percentage >= 90) {
    statusColor = "text-orange-400";
    barColor = "bg-orange-500";
  } else if (percentage >= 80) {
    statusColor = "text-yellow-400";
    barColor = "bg-yellow-500";
  }

  return (
    <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <span className={`text-sm font-bold ${statusColor}`}>
          {percentage}%
        </span>
      </div>

      <div className="mb-4">
        <div className="bg-gray-900 bg-opacity-50 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-300`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          ></div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400">
          {used.toLocaleString()} {unit}
          {limit && ` / ${limit.toLocaleString()} ${unit}`}
        </span>
        {percentage >= 100 && (
          <AlertCircle className="text-red-400" size={16} />
        )}
        {percentage >= 80 && percentage < 100 && (
          <AlertTriangle className="text-yellow-400" size={16} />
        )}
      </div>

      {limit && (
        <p className="text-xs text-gray-500 mt-2">
          {limit - used <= 0
            ? "Limit exceeded"
            : `${(limit - used).toLocaleString()} ${unit} remaining`}
        </p>
      )}
    </div>
  );
};

export default function UsageMetrics({ usage, tier, onRefresh }) {
  if (!usage) {
    return <div className="text-gray-400">No usage data available</div>;
  }

  const metrics = [
    {
      name: "Messages",
      used: usage.usage.messages.used,
      limit: usage.usage.messages.limit,
      percentage: usage.usage.messages.percentage,
      unit: "msgs",
    },
    {
      name: "Storage",
      used: usage.usage.storage.used.toFixed(2),
      limit: usage.usage.storage.limit,
      percentage: usage.usage.storage.percentage,
      unit: "GB",
    },
    {
      name: "Tokens",
      used: usage.usage.tokens.used,
      limit: usage.usage.tokens.limit,
      percentage: usage.usage.tokens.percentage,
      unit: "tokens",
    },
    {
      name: "Inference Time",
      used: usage.usage.inference.used.toFixed(2),
      limit: usage.usage.inference.limit,
      percentage: usage.usage.inference.percentage,
      unit: "hrs",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Warning Alerts */}
      {usage.warnings && usage.warnings.length > 0 && (
        <div className="bg-yellow-900 bg-opacity-20 border border-yellow-700 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="text-yellow-400 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-yellow-300">
                Usage Warnings
              </h4>
              <ul className="mt-2 space-y-1">
                {usage.warnings.map((warning) => (
                  <li key={warning.id} className="text-sm text-yellow-200">
                    {warning.metric.charAt(0).toUpperCase() +
                      warning.metric.slice(1)}{" "}
                    at {warning.percentage}% of limit ({warning.current} /{" "}
                    {warning.limit})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Billing Period */}
      <div className="bg-gray-700 bg-opacity-30 border border-gray-600 rounded-lg p-4">
        <p className="text-sm text-gray-400">
          Current billing period:{" "}
          <span className="text-white font-semibold">
            {new Date(usage.billing_period.start).toLocaleDateString()} -{" "}
            {new Date(usage.billing_period.end).toLocaleDateString()}
          </span>
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric) => (
          <UsageMetric
            key={metric.name}
            {...metric}
          />
        ))}
      </div>

      {/* Upgrade CTA */}
      {(usage.usage.messages.percentage >= 80 ||
        usage.usage.storage.percentage >= 80) && (
        <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-6">
          <h4 className="font-semibold text-white mb-2">
            Approaching Limits?
          </h4>
          <p className="text-blue-200 text-sm mb-4">
            Upgrade to a higher tier to increase your usage limits and unlock
            more features.
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition">
            View Upgrade Options
          </button>
        </div>
      )}
    </div>
  );
}
