import { useState, useEffect, useCallback } from "react";
import { usePluginContext } from "../../context/PluginContext.js";
import { PermissionDialog } from "../../components/PermissionDialog.js";
import { api, type PluginInfo, type SettingDefinitionInfo } from "../../api/index.js";

export function PluginsTab() {
  const { plugins, refreshPlugins } = usePluginContext();
  const [expandedPlugin, setExpandedPlugin] = useState<string | null>(null);
  const [permissionPlugin, setPermissionPlugin] = useState<PluginInfo | null>(null);

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
    <>
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3 text-on-surface">Plugins</h2>
        {plugins.length === 0 ? (
          <>
            <p className="text-on-surface-muted">No plugins installed.</p>
            <a
              href="#/plugin-store"
              className="mt-2 inline-flex items-center text-sm font-medium text-accent hover:text-accent-hover"
            >
              Browse Plugin Store
            </a>
          </>
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

      {permissionPlugin && (
        <PermissionDialog
          pluginName={permissionPlugin.name}
          permissions={permissionPlugin.permissions}
          onApprove={handleApprove}
          onCancel={() => setPermissionPlugin(null)}
        />
      )}
    </>
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
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={onToggleExpand}
        className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-surface-secondary"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-on-surface">{plugin.name}</span>
            <span className="text-xs text-on-surface-muted">v{plugin.version}</span>
            {isPending ? (
              <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning">
                Needs Approval
              </span>
            ) : (
              <span
                className={`text-xs px-1.5 py-0.5 rounded ${
                  plugin.enabled
                    ? "bg-success/10 text-success"
                    : "bg-surface-tertiary text-on-surface-muted"
                }`}
              >
                {plugin.enabled ? "Active" : "Inactive"}
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-muted mt-0.5">
            by {plugin.author} — {plugin.description}
          </p>
        </div>
        <span className="text-on-surface-muted text-sm">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="px-4 py-3 border-t border-border space-y-3">
          {plugin.permissions.length > 0 && (
            <div>
              <p className="text-xs font-medium text-on-surface-secondary mb-1">Permissions:</p>
              <div className="flex flex-wrap gap-1">
                {plugin.permissions.map((p) => (
                  <span
                    key={p}
                    className="text-xs font-mono px-1.5 py-0.5 rounded bg-surface-tertiary text-on-surface-secondary"
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
              className="px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover"
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
              className="px-3 py-1 text-xs text-error border border-error/30 rounded hover:bg-error/10"
            >
              Revoke Permissions
            </button>
          )}

          {plugin.settings.length > 0 ? (
            <PluginSettings pluginId={plugin.id} definitions={plugin.settings} />
          ) : (
            <p className="text-xs text-on-surface-muted">No configurable settings.</p>
          )}
        </div>
      )}
    </div>
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
    return <p className="text-xs text-on-surface-muted">Loading settings...</p>;
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
      <label className="block text-xs font-medium text-on-surface-secondary mb-1">
        {definition.name}
        {definition.description && (
          <span className="font-normal text-on-surface-muted ml-1">— {definition.description}</span>
        )}
      </label>
      {definition.type === "text" && (
        <input
          type="text"
          value={String(value ?? "")}
          placeholder={definition.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-2 py-1 text-sm border border-border rounded bg-surface text-on-surface"
        />
      )}
      {definition.type === "number" && (
        <input
          type="number"
          value={Number(value ?? 0)}
          min={definition.min}
          max={definition.max}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-24 px-2 py-1 text-sm border border-border rounded bg-surface text-on-surface"
        />
      )}
      {definition.type === "boolean" && (
        <button
          onClick={() => onChange(!value)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
            value ? "bg-accent" : "bg-surface-tertiary"
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
          className="px-2 py-1 text-sm border border-border rounded bg-surface text-on-surface"
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
