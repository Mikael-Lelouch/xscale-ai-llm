import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChartPie } from "@phosphor-icons/react";

export default function ModelChart({ providerUsage }) {
  if (!providerUsage || !providerUsage.byProvider || providerUsage.byProvider.length === 0) {
    return (
      <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10 flex items-center justify-center h-80">
        <div className="text-center">
          <ChartPie className="h-12 w-12 text-theme-text-secondary mx-auto mb-4 opacity-50" />
          <p className="text-theme-text-secondary text-sm">
            Aucune donnée d'utilisation disponible
          </p>
        </div>
      </div>
    );
  }

  const data = providerUsage.byProvider.map((item) => ({
    name: item.model || item.provider,
    value: parseInt(item.count),
    provider: item.provider,
    percentage: item.percentage,
  }));

  const COLORS = [
    "#06b6d4", // cyan
    "#14b8a6", // teal
    "#f59e0b", // amber
    "#ef4444", // red
    "#8b5cf6", // violet
    "#ec4899", // pink
  ];

  const totalCount = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10">
      <div className="flex items-center gap-3 mb-6">
        <ChartPie className="h-6 w-6 text-cyan-400" weight="fill" />
        <h3 className="text-xl font-bold text-theme-text-primary">
          Utilisation des Modèles (30 derniers jours)
        </h3>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2">
          {totalCount > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) =>
                    `${name}: ${percentage}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${value} requêtes`}
                  contentStyle={{
                    backgroundColor: "#1a1f2e",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-theme-text-secondary">Aucune donnée</p>
            </div>
          )}
        </div>

        {/* Legend and Stats */}
        <div className="space-y-3">
          <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
            <p className="text-sm text-theme-text-secondary font-semibold mb-4">
              RÉPARTITION
            </p>
            {data.map((item, index) => (
              <div key={index} className="flex items-center justify-between mb-3 last:mb-0">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{
                      backgroundColor: COLORS[index % COLORS.length],
                    }}
                  ></div>
                  <span className="text-xs text-theme-text-primary">
                    {item.name}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-theme-text-primary">
                    {item.percentage}%
                  </p>
                  <p className="text-xs text-theme-text-secondary">
                    {item.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-4 border border-emerald-500/20">
            <p className="text-xs text-theme-text-secondary font-semibold mb-2">
              TOTAL
            </p>
            <p className="text-2xl font-bold text-emerald-400">
              {totalCount}
            </p>
            <p className="text-xs text-theme-text-secondary mt-2">
              100% Français/Open-Source
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 p-4 bg-cyan-500/5 rounded-lg border border-cyan-500/20">
        <p className="text-xs font-semibold text-theme-text-primary mb-2">
          ✓ Zéro utilisation d'API externe
        </p>
        <p className="text-xs text-theme-text-secondary">
          Tous les modèles sont exécutés localement via Ollama ou Mistral. Aucune donnée n'est envoyée à OpenAI, Google, ou Claude.
        </p>
      </div>
    </div>
  );
}
