import React from "react";
import { MapPin, Database, Lock } from "@phosphor-icons/react";

export default function DataResidencyMap({ dataResidency, metrics }) {
  if (!dataResidency) {
    return (
      <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10 animate-pulse">
        <div className="h-6 bg-theme-bg-primary rounded w-1/3 mb-4"></div>
        <div className="h-40 bg-theme-bg-primary rounded"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Data Location Card */}
      <div className="lg:col-span-2 bg-theme-bg-secondary rounded-lg p-8 border border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-6 w-6 text-cyan-400" weight="fill" />
          <h3 className="text-xl font-bold text-theme-text-primary">
            Localisation des Données
          </h3>
        </div>

        {/* France Flag and Info */}
        <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 rounded-lg p-8 border border-cyan-500/20 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-4xl mb-2">🇫🇷</p>
              <p className="text-2xl font-bold text-theme-text-primary mb-2">
                {dataResidency.region}
              </p>
              <p className="text-theme-text-secondary text-sm">
                Toutes les données sont stockées sur:
              </p>
              <p className="text-cyan-400 font-mono text-sm mt-2">
                {dataResidency.dataLocation}
              </p>
            </div>
            <div className="text-6xl opacity-30">🔒</div>
          </div>
        </div>

        {/* Detailed Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-theme-bg-primary rounded-lg border border-white/5">
            <Database className="h-5 w-5 text-teal-400" weight="fill" />
            <div>
              <p className="text-xs text-theme-text-secondary font-semibold">
                Type de Stockage
              </p>
              <p className="text-theme-text-primary font-medium">
                {dataResidency.storageType} (Local)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-theme-bg-primary rounded-lg border border-white/5">
            <Lock className="h-5 w-5 text-emerald-400" weight="fill" />
            <div>
              <p className="text-xs text-theme-text-secondary font-semibold">
                Provider LLM
              </p>
              <p className="text-theme-text-primary font-medium">
                {dataResidency.provider}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Sidebar */}
      <div className="space-y-4">
        {/* Inferences Count */}
        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-lg p-6 border border-cyan-500/20">
          <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
            Inférences (30j)
          </p>
          <p className="text-3xl font-bold text-cyan-400">
            {metrics?.totalInferencesLast30Days || 0}
          </p>
          <p className="text-xs text-theme-text-secondary mt-2">
            Entièrement locales
          </p>
        </div>

        {/* Workspaces */}
        <div className="bg-gradient-to-br from-teal-500/10 to-teal-500/5 rounded-lg p-6 border border-teal-500/20">
          <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
            Espaces de Travail
          </p>
          <p className="text-3xl font-bold text-teal-400">
            {metrics?.totalWorkspaces || 0}
          </p>
          <p className="text-xs text-theme-text-secondary mt-2">
            Configurés
          </p>
        </div>

        {/* Users */}
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 rounded-lg p-6 border border-emerald-500/20">
          <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
            Utilisateurs
          </p>
          <p className="text-3xl font-bold text-emerald-400">
            {metrics?.totalUsers || 0}
          </p>
          <p className="text-xs text-theme-text-secondary mt-2">
            Actifs
          </p>
        </div>
      </div>
    </div>
  );
}
