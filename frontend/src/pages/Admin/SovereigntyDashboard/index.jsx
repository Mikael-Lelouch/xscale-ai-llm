import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import {
  ShieldCheck,
  DownloadSimple,
  ArrowPathRoundedSquare,
} from "@phosphor-icons/react";
import Admin from "@/models/admin";
import StatusCards from "./StatusCards";
import DataResidencyMap from "./DataResidencyMap";
import ModelChart from "./ModelChart";
import ComplianceChecklist from "./ComplianceChecklist";
import ActivityLog from "./ActivityLog";

export default function SovereigntyDashboard() {
  const [stats, setStats] = useState(null);
  const [activityLogs, setActivityLogs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setRefreshing(true);

    try {
      const [statsData, logsData] = await Promise.all([
        Admin.sovereigntyStats(),
        Admin.sovereigntyActivityLog(),
      ]);

      setStats(statsData);
      setActivityLogs(logsData?.logs || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching sovereignty data:", err);
      setError(
        "Erreur lors du chargement des données. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(() => fetchData(false), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleExportPDF = async () => {
    try {
      const pdfBlob = await Admin.exportCompliancePDF();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attestation-souverainete-${new Date().toISOString().split("T")[0]}.pdf`;
      link.click();
    } catch (err) {
      console.error("Error exporting PDF:", err);
      setError("Erreur lors de l'export du PDF");
    }
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header */}
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2 mb-8">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🇫🇷</div>
              <div>
                <h1 className="text-2xl leading-8 font-bold text-theme-text-primary">
                  Tableau de Bord Souveraineté
                </h1>
                <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-1">
                  Vérifiez que vos données ne quittent jamais la France
                </p>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Actions Bar */}
          <div className="mb-8 flex items-center justify-end gap-3">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-theme-bg-primary border border-white/10 hover:border-white/20 hover:bg-theme-bg-primary/80 transition-all text-theme-text-primary text-sm font-semibold disabled:opacity-50"
            >
              <ArrowPathRoundedSquare
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                weight="fill"
              />
              Actualiser
            </button>

            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-500/20 to-teal-500/20 border border-cyan-500/50 hover:from-cyan-500/30 hover:to-teal-500/30 transition-all text-theme-text-primary text-sm font-semibold"
            >
              <DownloadSimple className="h-4 w-4" weight="fill" />
              Attestation PDF
            </button>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Status Cards */}
            <div>
              <StatusCards stats={stats} />
            </div>

            {/* Data Residency and Metrics */}
            <div>
              <DataResidencyMap
                dataResidency={stats?.dataResidency}
                metrics={stats?.metrics}
              />
            </div>

            {/* Model Usage Chart */}
            <div>
              <ModelChart providerUsage={stats?.providerUsage} />
            </div>

            {/* Compliance Checklist */}
            <div>
              <ComplianceChecklist compliance={stats?.compliance} />
            </div>

            {/* Activity Log */}
            <div>
              <ActivityLog logs={activityLogs} isLoading={loading} />
            </div>

            {/* System Configuration Section */}
            <div className="bg-theme-bg-secondary rounded-lg p-8 border border-white/10">
              <div className="flex items-center gap-3 mb-6">
                <ShieldCheck className="h-6 w-6 text-emerald-400" weight="fill" />
                <h3 className="text-xl font-bold text-theme-text-primary">
                  Configuration Système
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
                  <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
                    Provider LLM
                  </p>
                  <p className="text-lg font-bold text-theme-text-primary">
                    {stats?.dataResidency?.provider || "Ollama"}
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-2">
                    Moteur d'inférence principal
                  </p>
                </div>

                <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
                  <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
                    Moteur d'Embedding
                  </p>
                  <p className="text-lg font-bold text-theme-text-primary">
                    Local
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-2">
                    Intégrations vectorielles locales
                  </p>
                </div>

                <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
                  <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
                    Base de Données Vectorielle
                  </p>
                  <p className="text-lg font-bold text-theme-text-primary">
                    Lance (SQLite)
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-2">
                    Stockage local optimisé
                  </p>
                </div>

                <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
                  <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
                    Telemetry
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    Désactivée
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-2">
                    Zéro tracking externe
                  </p>
                </div>

                <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
                  <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
                    Localisation des Données
                  </p>
                  <p className="text-lg font-bold text-cyan-400">
                    {stats?.dataResidency?.dataLocation || "/app/server/storage"}
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-2">
                    France - Stockage local
                  </p>
                </div>

                <div className="bg-theme-bg-primary rounded-lg p-6 border border-white/5">
                  <p className="text-xs text-theme-text-secondary font-semibold uppercase tracking-wide mb-2">
                    Dépendances Cloud
                  </p>
                  <p className="text-lg font-bold text-emerald-400">
                    Aucune
                  </p>
                  <p className="text-xs text-theme-text-secondary mt-2">
                    Fonctionne hors ligne
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center py-8 border-t border-white/10">
              <p className="text-xs text-theme-text-secondary mb-2">
                Souveraineté Numérique Française
              </p>
              <p className="text-sm font-semibold text-theme-text-primary">
                Intelligence Artificielle 100% Française & Open-Source
              </p>
              <p className="text-xs text-theme-text-secondary mt-2">
                ✓ Aucune donnée n'est envoyée à OpenAI, Google, Microsoft ou Claude
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
