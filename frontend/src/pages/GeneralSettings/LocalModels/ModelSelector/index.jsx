import { CaretDown } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

export default function ModelSelector({
  models = [],
  selectedModel,
  loading = false,
  onSelect,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (model) => {
    onSelect(model);
    setIsOpen(false);
  };

  const displayText = selectedModel
    ? models.find((m) => m.name === selectedModel)?.name || selectedModel
    : "Select a model...";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && !loading && setIsOpen(!isOpen)}
        disabled={disabled || loading}
        className={`w-full flex items-center justify-between px-4 py-2 rounded-lg border border-theme-sidebar-border bg-theme-settings-input-bg text-white text-sm transition-all ${
          disabled || loading
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-theme-text-secondary"
        }`}
      >
        <span className={loading ? "opacity-50" : ""}>
          {loading ? "Loading models..." : displayText}
        </span>
        <CaretDown
          className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          weight="bold"
        />
      </button>

      {isOpen && !disabled && models.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-theme-bg-primary border border-theme-sidebar-border rounded-lg shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {models.map((model) => (
              <button
                key={model.name}
                onClick={() => handleSelect(model)}
                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                  selectedModel === model.name
                    ? "bg-primary-button text-white font-semibold"
                    : "text-theme-text-secondary hover:bg-theme-settings-input-bg hover:text-white"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{model.name}</span>
                  {model.size && (
                    <span className="text-xs opacity-70">{model.size}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && models.length === 0 && !disabled && (
        <div className="absolute z-50 w-full mt-2 bg-theme-bg-primary border border-theme-sidebar-border rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-theme-text-secondary">
            No models available
          </p>
        </div>
      )}
    </div>
  );
}
