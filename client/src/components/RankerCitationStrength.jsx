/**
 * Citation Strength Indicator Component
 * Displays the semantic relevance score of cited documents
 * Shows which documents were reranked and their confidence score
 */

import React from "react";

/**
 * Citation Strength Bar Component
 * Visual indicator of document relevance (0-100%)
 */
export function CitationStrengthBar({ score, reason, className = "" }) {
  if (!score) return null;

  const getColorClass = (score) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-orange-500";
  };

  const getLabel = (score) => {
    if (score >= 85) return "Excellent match";
    if (score >= 70) return "Good match";
    if (score >= 60) return "Fair match";
    return "Weak match";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${getColorClass(score)} transition-all`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="text-xs font-semibold text-gray-700 min-w-fit">
        {score}%
      </span>
      {reason && (
        <span className="text-xs text-gray-500 italic" title={reason}>
          {getLabel(score)}
        </span>
      )}
    </div>
  );
}

/**
 * Citation Strength Tooltip
 * Shows detailed reranking information on hover
 */
export function CitationStrengthTooltip({
  document,
  isReranked,
  score,
  reason,
  children,
}) {
  if (!isReranked || !score) {
    return children;
  }

  return (
    <div className="relative group">
      {children}
      <div className="absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 w-64">
        <div className="font-semibold mb-1">Relevance Analysis</div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Relevance Score:</span>
            <span className="font-mono">{score}%</span>
          </div>
          {reason && (
            <div className="text-gray-300">
              <span className="block text-gray-400">Reason:</span>
              <span className="block italic">{reason}</span>
            </div>
          )}
          <div className="text-gray-400 text-xs pt-2 border-t border-gray-700">
            This document was semantically re-ranked by AI to improve relevance
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Source Citation with Strength Indicator
 * Full component for displaying a cited source with strength
 */
export function SourceCitationWithStrength({
  source,
  index,
  isReranked = false,
  score = null,
  reason = null,
  onClick,
  className = "",
}) {
  const getSourceTitle = () => {
    if (source.title) return source.title;
    if (source.metadata?.title) return source.metadata.title;
    return `Source ${index + 1}`;
  };

  const getSourcePreview = () => {
    const text = source.text || source.pageContent || "";
    return text.substring(0, 200) + (text.length > 200 ? "..." : "");
  };

  return (
    <CitationStrengthTooltip
      document={source}
      isReranked={isReranked}
      score={score}
      reason={reason}
    >
      <div
        className={`p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
        onClick={onClick}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <h4 className="font-semibold text-sm text-gray-900 flex-1">
            {getSourceTitle()}
          </h4>
          {isReranked && score && (
            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
              {score}%
            </span>
          )}
        </div>

        <p className="text-xs text-gray-600 mb-2">{getSourcePreview()}</p>

        {isReranked && score && (
          <div className="mt-2">
            <CitationStrengthBar
              score={score}
              reason={reason}
              className="mb-1"
            />
            {reason && (
              <p className="text-xs text-gray-500 italic mt-1">{reason}</p>
            )}
          </div>
        )}

        {source.metadata && (
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            {source.metadata.author && (
              <div>Author: {source.metadata.author}</div>
            )}
            {source.metadata.published && (
              <div>Published: {source.metadata.published}</div>
            )}
          </div>
        )}
      </div>
    </CitationStrengthTooltip>
  );
}

/**
 * Citation Filter Control
 * Allows users to filter sources by minimum relevance threshold
 */
export function CitationFilterControl({
  currentThreshold = 0,
  onThresholdChange,
  hasRerankedSources = false,
}) {
  if (!hasRerankedSources) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border border-gray-200">
      <label className="text-xs font-semibold text-gray-700">
        Show sources with min relevance:
      </label>
      <div className="flex items-center gap-1">
        {[0, 60, 70, 80, 90].map((threshold) => (
          <button
            key={threshold}
            onClick={() => onThresholdChange(threshold)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentThreshold === threshold
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
            }`}
          >
            {threshold === 0 ? "All" : `${threshold}%+`}
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Reranking Status Badge
 * Shows whether sources were semantically reranked
 */
export function ReankingStatusBadge({ isReranked, className = "" }) {
  if (!isReranked) return null;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 bg-green-50 border border-green-200 rounded text-xs text-green-700 ${className}`}
    >
      <svg
        className="w-3 h-3"
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
      Semantically Ranked
    </div>
  );
}

export default {
  CitationStrengthBar,
  CitationStrengthTooltip,
  SourceCitationWithStrength,
  CitationFilterControl,
  ReankingStatusBadge,
};
