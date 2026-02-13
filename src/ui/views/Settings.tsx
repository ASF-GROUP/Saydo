import { useState, useEffect, useCallback } from "react";
import { themeManager } from "../themes/manager.js";
import { usePluginContext } from "../context/PluginContext.js";
import { useAIContext } from "../context/AIContext.js";
import { api, type PluginInfo, type SettingDefinitionInfo } from "../api.js";

export function Settings() {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrent());
  const { plugins } = usePluginContext();
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);

  const handleThemeChange = (themeId: string) => {
    themeManager.setTheme(themeId);
    setCurrentTheme(themeId);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Appearance</h2>
        <div className="flex gap-3">
          <button
            onClick={() => handleThemeChange("light")}
            className={`px-4 py-2 rounded-lg border ${
              currentTheme === "light"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Light
          </button>
          <button
            onClick={() => handleThemeChange("dark")}
            className={`px-4 py-2 rounded-lg border ${
              currentTheme === "dark"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                : "border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            Dark
          </button>
        </div>
      </section>

      <AIAssistantSettings />

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Plugins</h2>
        {plugins.length === 0 ? (
          <p className="text-gray-500">No plugins installed.</p>
        ) : (
          <div className="space-y-3">
            {plugins.map((plugin) => (
              <PluginCard
                key={plugin.id}
                plugin={plugin}
                expanded={expandedPlugin === plugin.id}
                onToggleExpand={() =>
                  setExpandedPlugin(expandedPlugin === plugin.id ? null : plugin.id)
                }
              />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h2>
        <p className="text-gray-500">Shortcut customization coming soon.</p>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Data</h2>
        <p className="text-gray-500">Data management coming soon.</p>
      </section>
    </div>
  );
}

function PluginCard({
  plugin,
  expanded,
  onToggleExpand,
}: {
  plugin: PluginInfo;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{plugin.name}</span>
            <span className="text-xs text-gray-400">v{plugin.version}</span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded ${
                plugin.enabled
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-500"
              }`}
            >
              {plugin.enabled ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            by {plugin.author} — {plugin.description}
          </p>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && plugin.settings.length > 0 && (
        <PluginSettings pluginId={plugin.id} definitions={plugin.settings} />
      )}

      {expanded && plugin.settings.length === 0 && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400">No configurable settings.</p>
        </div>
      )}
    </div>
  );
}

const PROVIDERS = [
  { value: "", label: "None (disabled)" },
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "ollama", label: "Ollama (local)" },
  { value: "lmstudio", label: "LM Studio (local)" },
] as const;

const PROVIDER_DEFAULTS: Record<string, { model: string; baseUrl?: string; needsKey: boolean }> = {
  openai: { model: "gpt-4o", needsKey: true },
  anthropic: { model: "claude-sonnet-4-5-20250929", needsKey: true },
  openrouter: { model: "anthropic/claude-sonnet-4-5-20250929", needsKey: true },
  ollama: { model: "llama3.2", baseUrl: "http://localhost:11434", needsKey: false },
  lmstudio: { model: "default", baseUrl: "http://localhost:1234", needsKey: false },
};

function AIAssistantSettings() {
  const { config, isConfigured, updateConfig, refreshConfig } = useAIContext();
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (config && !loaded) {
      setProvider(config.provider ?? "");
      setModel(config.model ?? "");
      setBaseUrl(config.baseUrl ?? "");
      setLoaded(true);
    }
  }, [config, loaded]);

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    setApiKey("");
    const defaults = PROVIDER_DEFAULTS[newProvider];
    const newModel = defaults?.model ?? "";
    const newBaseUrl = defaults?.baseUrl ?? "";
    setModel(newModel);
    setBaseUrl(newBaseUrl);

    if (!newProvider) {
      // Clearing provider
      await updateConfig({ provider: "", apiKey: "", model: "", baseUrl: "" });
    }
  };

  const handleSave = async () => {
    await updateConfig({
      provider: provider || undefined,
      apiKey: apiKey || undefined,
      model: model || undefined,
      baseUrl: baseUrl || undefined,
    });
    setApiKey(""); // Clear the key field after saving
    await refreshConfig();
  };

  const needsKey = PROVIDER_DEFAULTS[provider]?.needsKey ?? false;
  const showBaseUrl = provider === "ollama" || provider === "lmstudio";

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">AI Assistant</h2>

      <div className="space-y-4 max-w-md">
        {/* Provider selector */}
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {provider && (
          <>
            {/* API Key */}
            {needsKey && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  API Key
                  {config?.hasApiKey && (
                    <span className="font-normal text-green-500 ml-2">Saved</span>
                  )}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={config?.hasApiKey ? "Enter new key to update" : "Enter API key"}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {/* Model */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={PROVIDER_DEFAULTS[provider]?.model ?? ""}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Base URL (for local providers) */}
            {showBaseUrl && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={PROVIDER_DEFAULTS[provider]?.baseUrl ?? ""}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            {/* Save button */}
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>

            {/* Status */}
            <p className={`text-xs ${isConfigured ? "text-green-500" : "text-gray-400"}`}>
              {isConfigured ? "Connected" : "Not configured"}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function PluginSettings({
  pluginId,
  definitions,
}: {
  pluginId: string;
  definitions: SettingDefinitionInfo[];
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [loaded, setLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const data = await api.getPluginSettings(pluginId);
      setValues(data);
      setLoaded(true);
    } catch {
      // Non-critical
    }
  }, [pluginId]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleChange = async (key: string, value: unknown) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    await api.updatePluginSetting(pluginId, key, value);
  };

  if (!loaded) {
    return (
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-400">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
      {definitions.map((def) => (
        <SettingField
          key={def.id}
          definition={def}
          value={values[def.id] ?? def.default}
          onChange={(v) => handleChange(def.id, v)}
        />
      ))}
    </div>
  );
}

function SettingField({
  definition,
  value,
  onChange,
}: {
  definition: SettingDefinitionInfo;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
        {definition.name}
        {definition.description && (
          <span className="font-normal text-gray-400 ml-1">— {definition.description}</span>
        )}
      </label>
      {definition.type === "text" && (
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={definition.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      )}
      {definition.type === "number" && (
        <input
          type="number"
          value={Number(value ?? 0)}
          min={definition.min}
          max={definition.max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      )}
      {definition.type === "boolean" && (
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            value ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span
            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
              value ? "translate-x-4.5" : "translate-x-0.5"
            }`}
          />
        </button>
      )}
      {definition.type === "select" && (
        <select
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          {definition.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
