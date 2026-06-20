import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

export default function ProviderSettings({
  provider,
  config = {},
  onConfigChange,
  onTestConnection,
  testingConnection = false,
  saveLoading = false,
  onSave,
}) {
  const [localConfig, setLocalConfig] = useState(config);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBaseUrlChange = (e) => {
    const newConfig = { ...localConfig, baseUrl: e.target.value };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    setHasChanges(true);
  };

  const handleTemperatureChange = (e) => {
    const newConfig = { ...localConfig, temperature: parseFloat(e.target.value) };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    setHasChanges(true);
  };

  const handleMaxTokensChange = (e) => {
    const newConfig = { ...localConfig, maxTokens: parseInt(e.target.value) };
    setLocalConfig(newConfig);
    onConfigChange(newConfig);
    setHasChanges(true);
  };

  const handleSave = () => {
    onSave(localConfig);
    setHasChanges(false);
  };

  const handleTestConnection = () => {
    onTestConnection(localConfig.baseUrl);
  };

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-theme-sidebar-border">
      {/* Base URL */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wide">
          Base URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={localConfig.baseUrl || ""}
            onChange={handleBaseUrlChange}
            placeholder="http://localhost:11434"
            className="flex-1 border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button outline-none px-3 py-2"
          />
          <button
            onClick={handleTestConnection}
            disabled={testingConnection || !localConfig.baseUrl}
            className="px-3 py-2 rounded-lg bg-primary-button text-white text-sm font-semibold hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {testingConnection ? (
              <>
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <MagnifyingGlass className="h-4 w-4" />
                Test
              </>
            )}
          </button>
        </div>
      </div>

      {/* Temperature */}
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-center">
          <label className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wide">
            Temperature
          </label>
          <span className="text-xs text-theme-text-secondary bg-theme-settings-input-bg px-2 py-1 rounded">
            {(localConfig.temperature || 0.7).toFixed(2)}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={localConfig.temperature || 0.7}
          onChange={handleTemperatureChange}
          className="w-full h-2 bg-theme-settings-input-bg rounded-lg appearance-none cursor-pointer accent-primary-button"
        />
        <p className="text-xs text-theme-text-secondary">
          Lower values make responses more focused and deterministic. Higher
          values increase creativity.
        </p>
      </div>

      {/* Max Tokens */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-semibold text-theme-text-secondary uppercase tracking-wide">
          Max Tokens
        </label>
        <input
          type="number"
          value={localConfig.maxTokens || 2048}
          onChange={handleMaxTokensChange}
          min="1"
          max="32768"
          className="border-none bg-theme-settings-input-bg text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button outline-none px-3 py-2"
        />
        <p className="text-xs text-theme-text-secondary">
          Maximum number of tokens to generate in a response.
        </p>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <button
          onClick={handleSave}
          disabled={saveLoading}
          className="w-full mt-4 px-4 py-2 rounded-lg bg-primary-button text-white font-semibold text-sm hover:bg-opacity-80 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          {saveLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            "Save Configuration"
          )}
        </button>
      )}
    </div>
  );
}
