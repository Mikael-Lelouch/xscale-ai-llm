import React from "react";
import { CheckCircle, XCircle, MapPin, ShieldCheck } from "@phosphor-icons/react";

export default function StatusCards({ stats }) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-theme-bg-secondary rounded-lg p-6 border border-white/10 animate-pulse"
          >
            <div className="h-4 bg-theme-bg-primary rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-theme-bg-primary rounded w-full"></div>
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Zéro Donnée Externe",
      icon: <CheckCircle className="h-8 w-8" weight="fill" />,
      value: stats.compliance?.isCompliant ? "✓ Conforme" : "✗ Non Conforme",
      color: stats.compliance?.isCompliant
        ? "text-emerald-400"
        : "text-red-400",
      bgColor: stats.compliance?.isCompliant
        ? "bg-emerald-500/10"
        : "bg-red-500/10",
      borderColor: stats.compliance?.isCompliant
        ? "border-emerald-500/20"
        : "border-red-500/20",
      description: "Aucune utilisation de providers externes",
    },
    {
      title: "100% Modèles Français",
      icon: <ShieldCheck className="h-8 w-8" weight="fill" />,
      value: `${stats.providerUsage?.byProvider?.[0]?.percentage || 0}%`,
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      description: "Utilisation de Mistral et Ollama",
    },
    {
      title: "Données Locales",
      icon: <MapPin className="h-8 w-8" weight="fill" />,
      value: stats.dataResidency?.region || "France",
      color: "text-teal-400",
      bgColor: "bg-teal-500/10",
      borderColor: "border-teal-500/20",
      description: stats.dataResidency?.dataLocation || "/app/server/storage",
    },
    {
      title: "Score de Conformité",
      icon: <ShieldCheck className="h-8 w-8" weight="fill" />,
      value: `${stats.compliance?.complianceScore || 0}%`,
      color: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/20",
      description: "Vérification RGPD et Souveraineté",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`rounded-lg p-6 border ${card.borderColor} ${card.bgColor} backdrop-blur-sm`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-theme-text-secondary text-xs font-semibold uppercase tracking-wide mb-1">
                {card.title}
              </p>
              <p className={`text-2xl font-bold ${card.color}`}>
                {card.value}
              </p>
            </div>
            <div className={card.color}>{card.icon}</div>
          </div>
          <p className="text-xs text-theme-text-secondary">{card.description}</p>
        </div>
      ))}
    </div>
  );
}
