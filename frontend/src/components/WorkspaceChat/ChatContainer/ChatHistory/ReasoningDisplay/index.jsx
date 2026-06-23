import React, { useState, useCallback } from "react";
import {
  CaretDown,
  Copy,
  PencilSimple,
  CaretRight,
} from "@phosphor-icons/react";
import renderMarkdown from "@/utils/chat/markdown";
import DOMPurify from "@/utils/chat/purify";

/**
 * ReasoningDisplay Component
 * Displays Chain-of-Thought (CoT) reasoning steps in an accordion-style format
 * Supports expanding/collapsing, copying, and editing individual steps
 */
export default function ReasoningDisplay({
  steps = [],
  onRegenerate = null,
  isExpanded = true,
  onToggleExpanded = null,
}) {
  const [expandedSteps, setExpandedSteps] = useState(
    new Set(steps && steps.length > 0 ? steps.map((_, idx) => idx) : [])
  );
  const [editingStep, setEditingStep] = useState(null);
  const [editText, setEditText] = useState("");
  const [copiedStep, setCopiedStep] = useState(null);

  const toggleStepExpanded = useCallback((stepIdx) => {
    setExpandedSteps((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(stepIdx)) {
        newSet.delete(stepIdx);
      } else {
        newSet.add(stepIdx);
      }
      return newSet;
    });
  }, []);

  const handleCopyStep = useCallback((stepIdx, content) => {
    navigator.clipboard.writeText(content);
    setCopiedStep(stepIdx);
    setTimeout(() => setCopiedStep(null), 2000);
  }, []);

  const handleEditStep = useCallback((stepIdx, content) => {
    setEditingStep(stepIdx);
    setEditText(content);
  }, []);

  const handleSaveEdit = useCallback(
    (stepIdx) => {
      if (onRegenerate && editText.trim() !== steps[stepIdx].content) {
        onRegenerate({
          stepNumber: steps[stepIdx].order,
          modifiedContent: editText,
        });
      }
      setEditingStep(null);
      setEditText("");
    },
    [steps, editText, onRegenerate]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingStep(null);
    setEditText("");
  }, []);

  if (!steps || steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-zinc-900 light:bg-slate-50 border border-zinc-700 light:border-slate-300 rounded-lg p-4 mb-4 w-full">
      {/* Header with toggle */}
      <button
        onClick={() => onToggleExpanded && onToggleExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left font-semibold text-zinc-200 light:text-slate-900 hover:opacity-80 transition-opacity mb-4"
      >
        <CaretDown
          size={18}
          weight="bold"
          className={`transform transition-transform ${
            !isExpanded ? "rotate-90" : ""
          }`}
        />
        <span className="text-sm">Processus de raisonnement (CoT)</span>
        <span className="text-xs text-zinc-500 light:text-slate-500 ml-auto">
          {steps.length} étape{steps.length !== 1 ? "s" : ""}
        </span>
      </button>

      {/* Reasoning steps */}
      {isExpanded && (
        <div className="space-y-3">
          {steps.map((step, stepIdx) => (
            <div
              key={stepIdx}
              className="border border-zinc-700 light:border-slate-300 rounded bg-zinc-800 light:bg-slate-100 overflow-hidden"
            >
              {/* Step header */}
              <button
                onClick={() => toggleStepExpanded(stepIdx)}
                className="flex items-start gap-2 w-full p-3 text-left hover:bg-zinc-700 light:hover:bg-slate-200 transition-colors"
              >
                <CaretRight
                  size={16}
                  weight="bold"
                  className={`mt-1 flex-shrink-0 text-blue-400 light:text-blue-600 transform transition-transform ${
                    expandedSteps.has(stepIdx) ? "rotate-90" : ""
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200 light:text-slate-900 text-sm">
                      Étape {step.order}
                    </span>
                    {editingStep === stepIdx && (
                      <span className="text-xs bg-orange-900 light:bg-orange-100 text-orange-200 light:text-orange-900 px-2 py-0.5 rounded">
                        Édition
                      </span>
                    )}
                  </div>
                  {!expandedSteps.has(stepIdx) && (
                    <p className="text-xs text-zinc-400 light:text-slate-600 line-clamp-1 mt-1">
                      {step.content.substring(0, 60)}
                      {step.content.length > 60 ? "..." : ""}
                    </p>
                  )}
                </div>
              </button>

              {/* Step content - expanded */}
              {expandedSteps.has(stepIdx) && (
                <div className="border-t border-zinc-700 light:border-slate-300 p-3 space-y-2">
                  {editingStep === stepIdx ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-zinc-700 light:bg-slate-200 text-zinc-100 light:text-slate-900 rounded p-2 text-xs border border-zinc-600 light:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows="6"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveEdit(stepIdx)}
                          className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                        >
                          Enregistrer
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 text-xs bg-zinc-700 light:bg-slate-300 hover:bg-zinc-600 light:hover:bg-slate-400 text-zinc-200 light:text-slate-900 rounded transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        className="text-xs text-zinc-300 light:text-slate-800 leading-relaxed markdown"
                        dangerouslySetInnerHTML={{
                          __html: DOMPurify.sanitize(
                            renderMarkdown(step.content)
                          ),
                        }}
                      />
                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() =>
                            handleCopyStep(stepIdx, step.content)
                          }
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 light:bg-slate-300 hover:bg-zinc-600 light:hover:bg-slate-400 text-zinc-200 light:text-slate-900 rounded transition-colors"
                          title="Copier l'étape"
                        >
                          <Copy size={12} />
                          {copiedStep === stepIdx ? "Copié" : "Copier"}
                        </button>
                        {onRegenerate && (
                          <button
                            onClick={() => handleEditStep(stepIdx, step.content)}
                            className="flex items-center gap-1 px-2 py-1 text-xs bg-zinc-700 light:bg-slate-300 hover:bg-zinc-600 light:hover:bg-slate-400 text-zinc-200 light:text-slate-900 rounded transition-colors"
                            title="Modifier et régénérer à partir de cette étape"
                          >
                            <PencilSimple size={12} />
                            Modifier
                          </button>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Collapsed indicator */}
      {!isExpanded && (
        <div className="text-xs text-zinc-500 light:text-slate-500 text-center py-2">
          Cliquez pour afficher le raisonnement détaillé
        </div>
      )}
    </div>
  );
}
