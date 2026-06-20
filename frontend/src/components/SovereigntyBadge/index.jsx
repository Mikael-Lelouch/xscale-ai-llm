import React, { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import { Cloud, FlagCheckered } from "@phosphor-icons/react";
import System from "@/models/system";

/**
 * SovereigntyBadge Component
 *
 * Displays the current deployment mode (Local, EU Cloud, or US Cloud)
 * with appropriate styling and tooltips.
 *
 * @param {string} mode - Deployment mode: 'local' | 'cloud-eu' | 'cloud-us'
 * @param {string} size - Badge size: 'sm' | 'md' | 'lg' (default: 'md')
 * @param {boolean} showTooltip - Show tooltip on hover (default: true)
 * @param {string} className - Additional CSS classes
 */
export default function SovereigntyBadge({
  mode = "local",
  size = "md",
  showTooltip = true,
  className = "",
}) {
  const badgeId = `sovereignty-badge-${Math.random().toString(36).substr(2, 9)}`;

  const config = {
    local: {
      label: "Local (Sovereign)",
      icon: "🇫🇷",
      bgColor: "bg-cyan-900/40 dark:bg-cyan-900/50",
      borderColor: "border-cyan-400/50 dark:border-cyan-400/60",
      textColor: "text-cyan-300 dark:text-cyan-200",
      glowColor: "shadow-[0_0_20px_rgba(6,182,212,0.3)] dark:shadow-[0_0_20px_rgba(6,182,212,0.5)]",
      tooltipText:
        "Local Deployment: Your data stays on your infrastructure. Full GDPR compliance. Complete data sovereignty with Ollama, LM Studio, or Local AI.",
    },
    "cloud-eu": {
      label: "EU Cloud",
      icon: "🇪🇺",
      bgColor: "bg-blue-900/30 dark:bg-blue-900/40",
      borderColor: "border-blue-400/40 dark:border-blue-400/50",
      textColor: "text-blue-300 dark:text-blue-200",
      glowColor: "shadow-[0_0_15px_rgba(59,130,246,0.2)]",
      tooltipText:
        "EU Cloud Deployment: Data processed within EU infrastructure. GDPR compliant with EU data centers.",
    },
    "cloud-us": {
      label: "Cloud US",
      icon: "☁️",
      bgColor: "bg-slate-700/30 dark:bg-slate-700/40",
      borderColor: "border-slate-400/40 dark:border-slate-400/50",
      textColor: "text-slate-300 dark:text-slate-200",
      glowColor: "shadow-[0_0_15px_rgba(100,116,139,0.2)]",
      tooltipText:
        "US Cloud Deployment: Data processed in US cloud infrastructure.",
    },
  };

  const sizeConfig = {
    sm: {
      padding: "px-2 py-1",
      textSize: "text-xs",
      iconSize: "text-sm",
      gap: "gap-1",
    },
    md: {
      padding: "px-3 py-1.5",
      textSize: "text-sm",
      iconSize: "text-base",
      gap: "gap-1.5",
    },
    lg: {
      padding: "px-4 py-2",
      textSize: "text-base",
      iconSize: "text-lg",
      gap: "gap-2",
    },
  };

  const currentConfig = config[mode] || config.local;
  const currentSizeConfig = sizeConfig[size] || sizeConfig.md;

  return (
    <>
      <div
        id={badgeId}
        className={`
          inline-flex items-center ${currentSizeConfig.gap}
          ${currentSizeConfig.padding}
          rounded-full
          border
          ${currentConfig.bgColor}
          ${currentConfig.borderColor}
          ${currentConfig.textColor}
          font-medium
          transition-all duration-300
          hover:border-opacity-100
          ${currentConfig.glowColor}
          ${className}
        `}
      >
        <span className={currentSizeConfig.iconSize}>{currentConfig.icon}</span>
        <span className={`${currentSizeConfig.textSize} hidden sm:inline`}>
          {currentConfig.label}
        </span>
      </div>

      {showTooltip && (
        <Tooltip
          anchorId={badgeId}
          content={currentConfig.tooltipText}
          place="bottom"
          className="max-w-xs text-xs"
        />
      )}
    </>
  );
}

/**
 * Hook to determine current deployment mode
 * Checks System.keys() for LLM provider configuration
 *
 * @returns {'local' | 'cloud-eu' | 'cloud-us'} Current deployment mode
 */
export async function useDeploymentMode() {
  const settings = await System.keys();

  if (!settings) return "cloud-us";

  const provider = settings?.LLMProvider || "";
  const isLocal =
    provider.toLowerCase().includes("ollama") ||
    provider.toLowerCase().includes("lmstudio") ||
    provider.toLowerCase().includes("localai");

  if (isLocal) return "local";

  // Could be extended to detect EU vs US cloud by checking API endpoints
  // For now, default to cloud-us
  return "cloud-us";
}

/**
 * Wrapper component that auto-detects deployment mode
 * Useful for simple "just show me the badge" scenarios
 */
export function AutoDetectSovereigntyBadge({ size = "md", className = "" }) {
  const [mode, setMode] = useState("cloud-us");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function detectMode() {
      const detectedMode = await useDeploymentMode();
      setMode(detectedMode);
      setLoading(false);
    }
    detectMode();
  }, []);

  if (loading) {
    return (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-slate-700/20 border border-slate-400/20 animate-pulse ${className}`} />
    );
  }

  return <SovereigntyBadge mode={mode} size={size} className={className} />;
}
