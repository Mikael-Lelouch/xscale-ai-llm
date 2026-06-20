import React, { useState } from "react";
import { AlertTriangle, AlertCircle, X } from "react-feather";

export default function QuotaWarningBanner({ warnings = [] }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !warnings || warnings.length === 0) {
    return null;
  }

  const criticalWarning = warnings.find((w) => w.percentage === 100);
  const hasExceeded = criticalWarning !== undefined;

  if (hasExceeded) {
    return (
      <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4 relative">
        <button
          onClick={() => setDismissed(true)}
          className="absolute top-4 right-4 text-red-400 hover:text-red-300 transition"
        >
          <X size={18} />
        </button>

        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-400 mt-1 flex-shrink-0" size={20} />
          <div>
            <h4 className="font-bold text-red-300">
              Quota Limit Exceeded
            </h4>
            <p className="text-red-200 text-sm mt-1">
              You have reached your monthly limit for{" "}
              <span className="font-semibold">
                {criticalWarning.metric}
              </span>
              . Upgrade your plan or contact support to continue.
            </p>
            <button className="mt-3 bg-red-700 hover:bg-red-600 text-white font-medium py-1 px-3 rounded text-sm transition">
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4 relative">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 text-yellow-400 hover:text-yellow-300 transition"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <AlertTriangle
          className="text-yellow-400 mt-1 flex-shrink-0"
          size={20}
        />
        <div>
          <h4 className="font-bold text-yellow-300">
            Approaching Usage Limits
          </h4>
          <p className="text-yellow-200 text-sm mt-1">
            {warnings.length === 1
              ? `You're using ${warnings[0].percentage}% of your ${warnings[0].metric} quota.`
              : `You're approaching limits on ${warnings
                  .map((w) => w.metric)
                  .join(", ")}.`}
          </p>
          <p className="text-yellow-200 text-sm mt-2">
            Upgrade to a higher tier to increase your limits.
          </p>
          <button className="mt-3 bg-yellow-700 hover:bg-yellow-600 text-white font-medium py-1 px-3 rounded text-sm transition">
            View Upgrade Options
          </button>
        </div>
      </div>
    </div>
  );
}
