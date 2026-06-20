import React, { useState } from "react";
import { Activity, Download } from "@phosphor-icons/react";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ActivityLog({ logs, isLoading }) {
  const [selectedFilter, setSelectedFilter] = useState("all");

  const eventTypeColors = {
    inference_recorded: "bg-blue-500/10 text-blue-400",
    provider_change: "bg-yellow-500/10 text-yellow-400",
    compliance_check: "bg-emerald-500/10 text-emerald-400",
    data_residency_check: "bg-cyan-500/10 text-cyan-400",
  };

  const eventTypeLabels = {
    inference_recorded: "Inférence",
    provider_change: "Changement Provider",
    compliance_check: "Vérification Conformité",
    data_residency_check: "Vérification Résidence",
  };

  const filteredLogs =
    selectedFilter === "all"
      ? logs
      : logs?.filter((log) => log.eventType === selectedFilter);

  const handleExportCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = [
      "Date",
      "Type d'Événement",
      "Nom de l'Événement",
      "Provider",
      "Modèle",
      "Détails",
    ];
    const csvData = logs.map((log) => [
      new Date(log.createdAt).toLocaleString("fr-FR"),
      eventTypeLabels[log.eventType] || log.eventType,
      log.eventName,
      log.provider || "-",
      log.model || "-",
      log.metadata ? JSON.stringify(log.metadata) : "-",
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) =>
        row.map((cell) => `"${cell}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `audit-log-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10">
        <div className="h-6 bg-theme-bg-primary rounded w-1/3 mb-4"></div>
        <Skeleton.default
          height="200px"
          width="100%"
          count={5}
          baseColor="var(--theme-bg-primary)"
          highlightColor="var(--theme-bg-secondary)"
        />
      </div>
    );
  }

  return (
    <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-cyan-400" weight="fill" />
          <h3 className="text-xl font-bold text-theme-text-primary">
            Journal d'Activité
          </h3>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!logs || logs.length === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors text-cyan-400 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="h-4 w-4" weight="fill" />
          Exporter CSV
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
        {[
          { value: "all", label: "Tous" },
          { value: "inference_recorded", label: "Inférences" },
          { value: "compliance_check", label: "Conformité" },
          { value: "provider_change", label: "Provider" },
          { value: "data_residency_check", label: "Résidence" },
        ].map((filter) => (
          <button
            key={filter.value}
            onClick={() => setSelectedFilter(filter.value)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedFilter === filter.value
                ? "bg-cyan-500/30 border border-cyan-500/50 text-cyan-300"
                : "bg-theme-bg-primary border border-white/10 text-theme-text-secondary hover:border-white/20"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Logs Table */}
      {filteredLogs && filteredLogs.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-xs font-semibold text-theme-text-secondary uppercase">
                  Date & Heure
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-theme-text-secondary uppercase">
                  Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-theme-text-secondary uppercase">
                  Événement
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-theme-text-secondary uppercase">
                  Provider
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-theme-text-secondary uppercase">
                  Modèle
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, index) => (
                <tr
                  key={index}
                  className="border-b border-white/5 hover:bg-theme-bg-primary/50 transition-colors"
                >
                  <td className="py-3 px-4 text-xs text-theme-text-secondary">
                    {new Date(log.createdAt).toLocaleString("fr-FR")}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        eventTypeColors[log.eventType] ||
                        "bg-gray-500/10 text-gray-400"
                      }`}
                    >
                      {eventTypeLabels[log.eventType] || log.eventType}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-theme-text-primary">
                    {log.eventName}
                  </td>
                  <td className="py-3 px-4 text-xs text-theme-text-secondary">
                    <code className="bg-theme-bg-primary px-2 py-1 rounded">
                      {log.provider || "-"}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-xs text-theme-text-secondary">
                    <code className="bg-theme-bg-primary px-2 py-1 rounded">
                      {log.model || "-"}
                    </code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="py-12 text-center">
          <Activity className="h-12 w-12 text-theme-text-secondary mx-auto mb-3 opacity-30" />
          <p className="text-theme-text-secondary text-sm">
            Aucun événement trouvé
          </p>
        </div>
      )}

      {/* Pagination Info */}
      <div className="mt-4 text-xs text-theme-text-secondary text-center">
        Affichage de {filteredLogs?.length || 0} événement
        {filteredLogs?.length !== 1 ? "s" : ""} (derniers 50)
      </div>
    </div>
  );
}
