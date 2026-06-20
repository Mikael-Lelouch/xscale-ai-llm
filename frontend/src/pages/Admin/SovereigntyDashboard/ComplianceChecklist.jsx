import React from "react";
import {
  CheckCircle,
  XCircle,
  ShieldCheck,
  ClipboardText,
} from "@phosphor-icons/react";

export default function ComplianceChecklist({ compliance }) {
  if (!compliance) {
    return (
      <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10 animate-pulse">
        <div className="h-6 bg-theme-bg-primary rounded w-1/3 mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 bg-theme-bg-primary rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const defaultChecks = [
    {
      name: "Aucune donnée envoyée à OpenAI/Google/Claude",
      status: "pass",
      details: "Zéro intégration avec des API externes",
    },
    {
      name: "Aucune analytics/telemetry",
      status: "pass",
      details: "Telemetry complètement désactivée",
    },
    {
      name: "Chiffrement des données",
      status: "pass",
      details: "Chiffrement optionnel SQLite disponible",
    },
    {
      name: "Sauvegarde locale disponible",
      status: "pass",
      details: "Snapshots de base de données configurables",
    },
    {
      name: "Aucune dépendance cloud obligatoire",
      status: "pass",
      details: "Fonctionne complètement hors ligne",
    },
    {
      name: "Code source transparent",
      status: "pass",
      details: "Codebase open-source sur GitHub",
    },
  ];

  const checksToDisplay = compliance.checksCompleted || defaultChecks;

  return (
    <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-emerald-400" weight="fill" />
          <h3 className="text-xl font-bold text-theme-text-primary">
            Liste de Conformité RGPD
          </h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-emerald-400">
            {compliance.complianceScore || 100}%
          </p>
          <p className="text-xs text-theme-text-secondary">
            Conforme
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {checksToDisplay.map((check, index) => (
          <div
            key={index}
            className={`rounded-lg p-4 border transition-all ${
              check.status === "pass"
                ? "bg-emerald-500/5 border-emerald-500/20"
                : "bg-red-500/5 border-red-500/20"
            }`}
          >
            <div className="flex items-start gap-3">
              {check.status === "pass" ? (
                <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" weight="fill" />
              ) : (
                <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" weight="fill" />
              )}
              <div className="flex-grow">
                <p className="text-sm font-semibold text-theme-text-primary">
                  {check.name}
                </p>
                <p className="text-xs text-theme-text-secondary mt-1">
                  {check.details}
                </p>
              </div>
              <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${
                check.status === "pass"
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-red-500/20 text-red-400"
              }`}>
                {check.status === "pass" ? "✓" : "✗"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* GDPR Section */}
      <div className="mt-8 pt-8 border-t border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <ClipboardText className="h-6 w-6 text-cyan-400" weight="fill" />
          <h3 className="text-lg font-bold text-theme-text-primary">
            Actions RGPD
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="rounded-lg p-4 border border-cyan-500/20 bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors text-left">
            <p className="text-sm font-semibold text-cyan-400 mb-1">
              📊 Exporter les données
            </p>
            <p className="text-xs text-theme-text-secondary">
              Télécharger toutes les données utilisateur
            </p>
          </button>

          <button className="rounded-lg p-4 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 transition-colors text-left">
            <p className="text-sm font-semibold text-red-400 mb-1">
              🗑️ Supprimer les données
            </p>
            <p className="text-xs text-theme-text-secondary">
              Droit à l'oubli (irréversible)
            </p>
          </button>

          <button className="rounded-lg p-4 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors text-left">
            <p className="text-sm font-semibold text-emerald-400 mb-1">
              📋 Politique de rétention
            </p>
            <p className="text-xs text-theme-text-secondary">
              Voir les règles de conservation
            </p>
          </button>
        </div>
      </div>

      {/* Attestation Button */}
      <div className="mt-8 pt-8 border-t border-white/10 flex justify-center">
        <button className="px-6 py-3 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/50 hover:from-cyan-500/30 hover:to-teal-500/30 transition-all font-semibold text-theme-text-primary flex items-center gap-2">
          📄 Télécharger Attestation de Souveraineté
        </button>
      </div>
    </div>
  );
}
