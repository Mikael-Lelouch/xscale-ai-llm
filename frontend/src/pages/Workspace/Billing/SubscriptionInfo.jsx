import React from "react";
import { AlertCircle, Check } from "react-feather";

const FeatureRow = ({ name, included }) => (
  <div className="flex items-center justify-between py-2 px-3">
    <span className="text-gray-300 text-sm">{name}</span>
    {included ? (
      <Check className="text-green-400" size={18} />
    ) : (
      <span className="text-gray-600">✕</span>
    )}
  </div>
);

export default function SubscriptionInfo({ subscription }) {
  if (!subscription) {
    return <div className="text-gray-400">Loading subscription info...</div>;
  }

  const features = {
    free: [
      { name: "1 User", included: true },
      { name: "1 GB Storage", included: true },
      { name: "1,000 Messages/Month", included: true },
      { name: "Community Support", included: true },
    ],
    pro: [
      { name: "5 Users", included: true },
      { name: "10 GB Storage", included: true },
      { name: "50k Messages/Month", included: true },
      { name: "Email Support", included: true },
      { name: "Advanced Analytics", included: true },
    ],
    team: [
      { name: "10 Users", included: true },
      { name: "50 GB Storage", included: true },
      { name: "500k Messages/Month", included: true },
      { name: "Priority Support", included: true },
      { name: "Advanced Analytics", included: true },
      { name: "Team Management", included: true },
    ],
    enterprise: [
      { name: "Unlimited Users", included: true },
      { name: "Unlimited Storage", included: true },
      { name: "Unlimited Messages", included: true },
      { name: "24/7 Phone Support", included: true },
      { name: "Custom SLA", included: true },
      { name: "Dedicated Account Manager", included: true },
    ],
  };

  const tierFeatures = features[subscription.tier.tier] || [];

  return (
    <div className="space-y-6">
      {/* Current Plan Details */}
      <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Plan Features
        </h3>
        <div className="space-y-1 bg-gray-800 bg-opacity-50 rounded divide-y divide-gray-600">
          {tierFeatures.map((feature) => (
            <FeatureRow
              key={feature.name}
              name={feature.name}
              included={feature.included}
            />
          ))}
        </div>
      </div>

      {/* Billing Information */}
      <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Billing Information
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-gray-600">
            <span className="text-gray-400">Billing Email:</span>
            <span className="text-white font-medium">
              {subscription.tier.billing_email || "Not set"}
            </span>
          </div>
          <div className="flex justify-between items-center pb-3 border-b border-gray-600">
            <span className="text-gray-400">Current Period:</span>
            <span className="text-white font-medium text-sm">
              {new Date(
                subscription.tier.current_period_start
              ).toLocaleDateString()}{" "}
              -{" "}
              {new Date(
                subscription.tier.current_period_end
              ).toLocaleDateString()}
            </span>
          </div>
          {subscription.subscription && (
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Subscription Status:</span>
              <span
                className={`font-medium text-sm px-3 py-1 rounded ${
                  subscription.subscription.status === "active"
                    ? "bg-green-900 text-green-300"
                    : "bg-yellow-900 text-yellow-300"
                }`}
              >
                {subscription.subscription.status
                  .charAt(0)
                  .toUpperCase() +
                  subscription.subscription.status.slice(1)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition">
          Upgrade Plan
        </button>
        <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded transition">
          Manage Subscription
        </button>
      </div>

      {/* Trial Notice */}
      {subscription.tier.trial_ends_at && (
        <div className="bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-blue-400 mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-300">Trial Active</h4>
            <p className="text-blue-200 text-sm mt-1">
              Your trial ends on{" "}
              {new Date(subscription.tier.trial_ends_at).toLocaleDateString()}.
              Add a payment method to continue using this plan.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
