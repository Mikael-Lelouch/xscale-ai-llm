import React, { useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import System from "@/models/system";
import { useDeploymentMode as useDeploymentModeHook } from "@/hooks/useDeploymentMode";

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
      icon: "🏠",
      securityIcon: "🛡️",
      bgColor: "bg-emerald-900/40 dark:bg-emerald-900/50",
      borderColor: "border-emerald-400/50 dark:border-emerald-400/60",
      textColor: "text-emerald-300 dark:text-emerald-200",
      glowColor: "shadow-[0_0_20px_rgba(16,185,129,0.3)] dark:shadow-[0_0_20px_rgba(16,185,129,0.5)]",
      tooltipText:
        "Local Deployment: Your data stays on your infrastructure. Full GDPR compliance. Complete data sovereignty with Ollama, LM Studio, or Local AI.",
    },
    "cloud-eu": {
      label: "EU Cloud",
      icon: "🇪🇺",
      securityIcon: "🛡️",
      bgColor: "bg-teal-900/40 dark:bg-teal-900/50",
      borderColor: "border-teal-400/50 dark:border-teal-400/60",
      textColor: "text-teal-300 dark:text-teal-200",
      glowColor: "shadow-[0_0_20px_rgba(20,184,166,0.3)] dark:shadow-[0_0_20px_rgba(20,184,166,0.5)]",
      tooltipText:
        "EU Cloud Deployment: Data processed within EU infrastructure. GDPR compliant with strict EU data residency requirements and Schrems II compliance.",
    },
    "cloud-us": {
      label: "Cloud US",
      icon: "☁️",
      securityIcon: "🌐",
      bgColor: "bg-slate-700/30 dark:bg-slate-700/40",
      borderColor: "border-slate-400/40 dark:border-slate-400/50",
      textColor: "text-slate-300 dark:text-slate-200",
      glowColor: "shadow-[0_0_15px_rgba(100,116,139,0.2)]",
      tooltipText:
        "US Cloud Deployment: Data processed in US cloud infrastructure. Subject to US data regulations and FISA surveillance rules.",
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
 * Wrapper component that auto-detects deployment mode
 * Useful for simple "just show me the badge" scenarios
 * Now uses the enhanced hook with proper EU detection
 */
export function AutoDetectSovereigntyBadge({ size = "md", className = "" }) {
  const { mode, isLoading } = useDeploymentModeHook();

  if (isLoading) {
    return (
      <div className={`inline-flex items-center px-3 py-1.5 rounded-full bg-slate-700/20 border border-slate-400/20 animate-pulse ${className}`} />
    );
  }

  return <SovereigntyBadge mode={mode} size={size} className={className} />;
}
