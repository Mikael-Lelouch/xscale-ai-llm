import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Gear } from "@phosphor-icons/react";
import LocalModels from "@/models/localModels";
import ModelSelector from "../ModelSelector";
import ProviderSettings from "../ProviderSettings";
import showToast from "@/utils/toast";

export default function ProviderCard({
  provider,
  name,
  description,
  logo,
  baseUrlDefault,
}) {
  const [health, setHealth] = useState(null);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [loadingHealth, setLoadingHealth] = useState(true);
  const [loadingModels, setLoadingModels] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState({
    baseUrl: baseUrlDefault,
    temperature: 0.7,
    maxTokens: 2048,
  });
  const [testingConnection, setTestingConnection] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Check health on mount
  useEffect(() => {
    checkHealth();
  }, []);

  // Load models when health is good
  useEffect(() => {
    if (health?.status === "connected" && expanded) {
      loadModels();
    }
  }, [health?.status, expanded]);

  const checkHealth = async () => {
    setLoadingHealth(true);
    const result = await LocalModels.health();
    if (result?.providers?.[provider]) {
      setHealth(result.providers[provider]);
    } else {
      setHealth({ status: "error", message: "Provider not found" });
    }
    setLoadingHealth(false);
  };

  const loadModels = async () => {
    setLoadingModels(true);
    const result = await LocalModels.listModels(provider);
    if (result?.models && !result.error) {
      setModels(result.models);
    } else {
      setModels([]);
    }
    setLoadingModels(false);
  };

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
  };

  const handleTestConnection = async (baseUrl) => {
    setTestingConnection(true);
    const result = await LocalModels.testConnection(provider, baseUrl);
    setTestingConnection(false);

    if (result?.success) {
      showToast(`Successfully connected to ${name}!`, "success");
      // Refresh health and models after successful connection
      checkHealth();
      setTimeout(() => loadModels(), 500);
    } else {
      showToast(
        `Failed to connect: ${result?.error || "Unknown error"}`,
        "error"
      );
    }
  };

  const handleSaveConfig = async (newConfig) => {
    setSaveLoading(true);
    const result = await LocalModels.saveConfig({
      provider,
      model: selectedModel,
      settings: newConfig,
    });
    setSaveLoading(false);

    if (result?.success) {
      showToast("Configuration saved successfully!", "success");
      setConfig(newConfig);
    } else {
      showToast(
        `Failed to save: ${result?.error || "Unknown error"}`,
        "error"
      );
    }
  };

  const handleSelectModel = (model) => {
    setSelectedModel(model.name);
    // Show a success toast that this model is selected
    showToast(`Selected ${model.name} for ${name}`, "info");
  };

  const isConnected = health?.status === "connected";
  const showSettings = expanded && isConnected;

  return (
    <div className="bg-theme-bg-secondary rounded-lg border-2 border-theme-sidebar-border hover:border-opacity-60 transition-all overflow-hidden">
      {/* Card Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-start justify-between hover:bg-theme-bg-primary transition-colors"
      >
        <div className="flex items-start gap-4 flex-1 text-left">
          {/* Provider Logo/Icon */}
          <div className="flex-shrink-0 mt-1">
            {logo ? (
              <img src={logo} alt={name} className="h-8 w-8 rounded" />
            ) : (
              <Gear className="h-8 w-8 text-primary-button" />
            )}
          </div>

          {/* Provider Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-sm">{name}</h3>
            <p className="text-theme-text-secondary text-xs mt-0.5 truncate">
              {description}
            </p>
          </div>
        </div>

        {/* Health Status Badge */}
        <div className="flex-shrink-0 ml-4 flex flex-col items-end gap-2">
          {loadingHealth ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-gray-400 rounded-full animate-pulse" />
              <span className="text-xs text-theme-text-secondary">
                Checking...
              </span>
            </div>
          ) : isConnected ? (
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" weight="fill" />
              <span className="text-xs text-green-500 font-semibold">
                Connected
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" weight="fill" />
              <span className="text-xs text-red-500 font-semibold">
                Not Connected
              </span>
            </div>
          )}
          {health?.message && (
            <p className="text-xs text-theme-text-secondary text-right max-w-xs">
              {health.message}
            </p>
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t border-theme-sidebar-border px-6 py-4 bg-theme-bg-primary bg-opacity-40">
          {!isConnected ? (
            <div className="text-center py-6">
              <p className="text-theme-text-secondary text-sm mb-4">
                This provider is not currently available. Check that it's
                running and accessible.
              </p>
              <button
                onClick={checkHealth}
                disabled={loadingHealth}
                className="px-4 py-2 rounded-lg bg-primary-button text-white text-sm font-semibold hover:bg-opacity-80 disabled:opacity-50"
              >
                {loadingHealth ? "Checking..." : "Retry"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Model Selector */}
              <div>
                <label className="block text-xs font-semibold text-theme-text-secondary uppercase tracking-wide mb-2">
                  Use Model for XSCALE AI
                </label>
                <ModelSelector
                  models={models}
                  selectedModel={selectedModel}
                  loading={loadingModels}
                  onSelect={handleSelectModel}
                  disabled={!isConnected}
                />
              </div>

              {/* Provider Settings */}
              {showSettings && (
                <ProviderSettings
                  provider={provider}
                  config={config}
                  onConfigChange={handleConfigChange}
                  onTestConnection={handleTestConnection}
                  testingConnection={testingConnection}
                  saveLoading={saveLoading}
                  onSave={handleSaveConfig}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
