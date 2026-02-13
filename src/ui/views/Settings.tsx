import { useState, useEffect, useCallback } from "react";
import { themeManager } from "../themes/manager.js";
import { usePluginContext } from "../context/PluginContext.js";
import { useAIContext } from "../context/AIContext.js";
import { PermissionDialog } from "../components/PermissionDialog.js";
import { api, type PluginInfo, type SettingDefinitionInfo, type AIProviderInfo } from "../api.js";
import { exportJSON, exportCSV, exportMarkdown, type ExportData } from "../../core/export.js";
import { shortcutManager } from "../App.js";

export function Settings() {
  const [currentTheme, setCurrentTheme] = useState(themeManager.getCurrent());
  const { plugins, refreshPlugins } = usePluginContext();
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [permissionPlugin, setPermissionPlugin] = useState<PluginInfo | null>(null);

  const handleThemeChange = (themeId: string) => {
    themeManager.setTheme(themeId);
    setCurrentTheme(themeId);
  };

  const handleApprove = async (permissions: string[]) => {
    if (permissionPlugin) {
      await api.approvePluginPermissions(permissionPlugin.id, permissions);
      setPermissionPlugin(null);
      refreshPlugins();
    }
  };

  const handleRevoke = async (pluginId: string) => {
    await api.revokePluginPermissions(pluginId);
    refreshPlugins();
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
                onRequestApproval={() => setPermissionPlugin(plugin)}
                onRevoke={() => handleRevoke(plugin.id)}
              />
            ))}
          </div>
        )}
      </section>

      <KeyboardShortcutsSection />

      <DataSection />

      {permissionPlugin && (
        <PermissionDialog
          pluginName={permissionPlugin.name}
          permissions={permissionPlugin.permissions}
          onApprove={handleApprove}
          onCancel={() => setPermissionPlugin(null)}
        />
      )}
    </div>
  );
}

function PluginCard({
  plugin,
  expanded,
  onToggleExpand,
  onRequestApproval,
  onRevoke,
}: {
  plugin: PluginInfo;
  expanded: boolean;
  onToggleExpand: () => void;
  onRequestApproval: () => void;
  onRevoke: () => void;
}) {
  const isPending = !plugin.enabled && plugin.permissions.length > 0;

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
            {isPending ? (
              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                Needs Approval
              </span>
            ) : (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  plugin.enabled
                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                }`}
              >
                {plugin.enabled ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            by {plugin.author} — {plugin.description}
          </p>
        </div>
        <span className="text-gray-400 text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 space-y-3">
          {plugin.permissions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Permissions:
              </p>
              <div className="flex flex-wrap gap-1">
                {plugin.permissions.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isPending && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRequestApproval();
              }}
              className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Approve Permissions
            </button>
          )}

          {plugin.enabled && plugin.permissions.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRevoke();
              }}
              className="px-3 py-1 text-xs text-red-500 border border-red-300 dark:border-red-700 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              Revoke Permissions
            </button>
          )}

          {plugin.settings.length > 0 ? (
            <PluginSettings pluginId={plugin.id} definitions={plugin.settings} />
          ) : (
            <p className="text-xs text-gray-400">No configurable settings.</p>
          )}
        </div>
      )}
    </div>
  );
}

function AIAssistantSettings() {
  const { config, isConfigured, updateConfig, refreshConfig } = useAIContext();
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [provider, setProvider] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .listAIProviders()
      .then(setProviders)
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (config && !loaded) {
      setProvider(config.provider ?? "");
      setModel(config.model ?? "");
      setBaseUrl(config.baseUrl ?? "");
      setLoaded(true);
    }
  }, [config, loaded]);

  const currentProvider = providers.find((p) => p.name === provider);

  const handleProviderChange = async (newProvider: string) => {
    setProvider(newProvider);
    setApiKey("");
    const prov = providers.find((p) => p.name === newProvider);
    setModel(prov?.defaultModel ?? "");
    setBaseUrl(prov?.defaultBaseUrl ?? "");

    if (!newProvider) {
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
    setApiKey("");
    await refreshConfig();
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">AI Assistant</h2>

      <div className="space-y-4 max-w-md">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Provider
          </label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="">None (disabled)</option>
            {providers.map((p) => (
              <option key={p.name} value={p.name}>
                {p.displayName}
                {p.pluginId ? " (plugin)" : ""}
              </option>
            ))}
          </select>
        </div>

        {provider && (
          <>
            {currentProvider?.needsApiKey && (
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

            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Model
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder={currentProvider?.defaultModel ?? ""}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>

            {currentProvider?.showBaseUrl && (
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base URL
                </label>
                <input
                  type="text"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder={currentProvider?.defaultBaseUrl ?? ""}
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}

            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Save
            </button>

            <p className={`text-xs ${isConfigured ? "text-green-500" : "text-gray-400"}`}>
              {isConfigured ? "Connected" : "Not configured"}
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function KeyboardShortcutsSection() {
  const [shortcuts, setShortcuts] = useState(shortcutManager.getAll());
  const [recordingId, setRecordingId] = useState<string | null>(null);

  useEffect(() => {
    return shortcutManager.subscribe(() => {
      setShortcuts(shortcutManager.getAll());
    });
  }, []);

  useEffect(() => {
    if (!recordingId) return;

    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Skip modifier-only keys
      if (["Control", "Meta", "Alt", "Shift"].includes(e.key)) return;

      const parts: string[] = [];
      if (e.ctrlKey || e.metaKey) parts.push("ctrl");
      if (e.altKey) parts.push("alt");
      if (e.shiftKey) parts.push("shift");

      let key = e.key.toLowerCase();
      if (key === " ") key = "space";
      if (key === "escape") {
        setRecordingId(null);
        return;
      }
      parts.push(key);

      const combo = parts.join("+");
      const result = shortcutManager.rebind(recordingId, combo);
      if (result.ok) {
        const json = shortcutManager.toJSON();
        api.setAppSetting("keyboard_shortcuts", JSON.stringify(json));
      }
      setRecordingId(null);
    };

    document.addEventListener("keydown", handler, true);
    return () => document.removeEventListener("keydown", handler, true);
  }, [recordingId]);

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">Keyboard Shortcuts</h2>
      <div className="space-y-2 max-w-lg">
        {shortcuts.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-gray-700 dark:text-gray-300">{s.description}</span>
            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-0.5 text-xs rounded border ${
                  recordingId === s.id
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 animate-pulse"
                    : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {recordingId === s.id ? "Press keys..." : s.currentKey}
              </kbd>
              <button
                onClick={() => setRecordingId(recordingId === s.id ? null : s.id)}
                className="text-xs text-blue-500 hover:text-blue-600"
              >
                {recordingId === s.id ? "Cancel" : "Edit"}
              </button>
              {s.currentKey !== s.defaultKey && (
                <button
                  onClick={() => {
                    shortcutManager.resetToDefault(s.id);
                    const json = shortcutManager.toJSON();
                    api.setAppSetting("keyboard_shortcuts", JSON.stringify(json));
                  }}
                  className="text-xs text-gray-400 hover:text-gray-600"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function DataSection() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: "json" | "csv" | "markdown") => {
    setExporting(true);
    try {
      const data = await api.exportAllData();
      let content: string;
      let filename: string;
      let mimeType: string;

      if (format === "json") {
        const exportData: ExportData = {
          ...data,
          exportedAt: new Date().toISOString(),
          version: "1.0",
        };
        content = exportJSON(exportData);
        filename = `docket-export-${new Date().toISOString().split("T")[0]}.json`;
        mimeType = "application/json";
      } else if (format === "csv") {
        content = exportCSV(data.tasks);
        filename = `docket-tasks-${new Date().toISOString().split("T")[0]}.csv`;
        mimeType = "text/csv";
      } else {
        content = exportMarkdown(data.tasks);
        filename = `docket-tasks-${new Date().toISOString().split("T")[0]}.md`;
        mimeType = "text/markdown";
      }

      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold mb-3">Data</h2>
      <div className="flex gap-3">
        <button
          onClick={() => handleExport("json")}
          disabled={exporting}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Export JSON
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={exporting}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Export CSV
        </button>
        <button
          onClick={() => handleExport("markdown")}
          disabled={exporting}
          className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          Export Markdown
        </button>
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
    return <p className="text-xs text-gray-400">Loading settings...</p>;
  }

  return (
    <div className="space-y-3">
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
