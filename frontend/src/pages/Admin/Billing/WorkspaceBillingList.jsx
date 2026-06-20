import React from "react";
import { Edit2, ExternalLink } from "react-feather";

const WorkspaceRow = ({ workspace }) => {
  const getTierColor = (tier) => {
    switch (tier) {
      case "free":
        return "text-gray-400";
      case "pro":
        return "text-blue-400";
      case "team":
        return "text-purple-400";
      case "enterprise":
        return "text-pink-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "active":
        return "bg-green-900 text-green-300";
      case "past_due":
        return "bg-yellow-900 text-yellow-300";
      case "canceled":
        return "bg-red-900 text-red-300";
      default:
        return "bg-gray-900 text-gray-300";
    }
  };

  return (
    <tr className="border-b border-gray-600 hover:bg-gray-700 bg-opacity-20 transition">
      <td className="px-6 py-4">
        <div>
          <p className="text-white font-medium">{workspace.name}</p>
          <p className="text-xs text-gray-500">{workspace.slug}</p>
        </div>
      </td>
      <td className={`px-6 py-4 font-medium text-sm ${getTierColor(workspace.tier)}`}>
        {workspace.tier.charAt(0).toUpperCase() + workspace.tier.slice(1)}
      </td>
      <td className="px-6 py-4 text-sm">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBg(workspace.status)}`}>
          {workspace.status
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")}
        </span>
      </td>
      <td className="px-6 py-4 text-sm text-gray-300">
        {workspace.users} user{workspace.users !== 1 ? "s" : ""}
      </td>
      <td className="px-6 py-4 text-xs text-gray-500">
        {new Date(workspace.created_at).toLocaleDateString()}
      </td>
      <td className="px-6 py-4">
        <button className="text-blue-400 hover:text-blue-300 flex items-center gap-2 transition text-sm">
          <Edit2 size={16} />
          Manage
        </button>
      </td>
    </tr>
  );
};

export default function WorkspaceBillingList({ workspaces = [], onRefresh }) {
  if (workspaces.length === 0) {
    return (
      <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-12 text-center">
        <p className="text-gray-400">No workspaces found</p>
      </div>
    );
  }

  const tierCounts = {
    free: workspaces.filter((w) => w.tier === "free").length,
    pro: workspaces.filter((w) => w.tier === "pro").length,
    team: workspaces.filter((w) => w.tier === "team").length,
    enterprise: workspaces.filter((w) => w.tier === "enterprise").length,
  };

  return (
    <div className="space-y-6">
      {/* Filter Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase">Free Tier</p>
          <p className="text-xl font-bold text-gray-300 mt-1">
            {tierCounts.free}
          </p>
        </div>
        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase">Pro</p>
          <p className="text-xl font-bold text-blue-300 mt-1">
            {tierCounts.pro}
          </p>
        </div>
        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase">Team</p>
          <p className="text-xl font-bold text-purple-300 mt-1">
            {tierCounts.team}
          </p>
        </div>
        <div className="bg-gray-700 bg-opacity-50 border border-gray-600 rounded-lg p-4">
          <p className="text-gray-400 text-xs uppercase">Enterprise</p>
          <p className="text-xl font-bold text-pink-300 mt-1">
            {tierCounts.enterprise}
          </p>
        </div>
      </div>

      {/* Workspaces Table */}
      <div className="overflow-x-auto bg-gray-700 bg-opacity-30 rounded-lg border border-gray-600">
        <table className="w-full">
          <thead className="bg-gray-800 bg-opacity-50 border-b border-gray-600">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Workspace
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Tier
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Status
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Users
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Created
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-300 uppercase tracking-wide">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {workspaces.map((workspace) => (
              <WorkspaceRow key={workspace.id} workspace={workspace} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
