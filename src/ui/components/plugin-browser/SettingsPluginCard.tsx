import { ChevronDown, ChevronUp, Shield } from "lucide-react";
import type { PluginInfo } from "../../api/index.js";
import { GradientBanner } from "./gradient-utils.js";
import { PluginSettings } from "./PluginSettingsPanel.js";

// ── Settings Plugin Card ─────────────────────────────

export interface SettingsCardProps {
  mode: "settings";
  plugin: PluginInfo;
  expanded: boolean;
  onToggleExpand: () => void;
  // Built-in specific
  toggling?: boolean;
  onToggle?: () => void;
  // Community specific
  onRequestApproval?: () => void;
  onRevoke?: () => void;
}

export function SettingsPluginCard({
  plugin,
  expanded,
  onToggleExpand,
  toggling,
  onToggle,
  onRequestApproval,
  onRevoke,
}: SettingsCardProps) {
  const isBuiltin = plugin.builtin;
  const isPending = !plugin.enabled && plugin.permissions.length > 0 && !isBuiltin;

  return (
    <div className="border border-border rounded-lg bg-surface overflow-hidden hover:border-border-hover transition-colors">
      <GradientBanner pluginId={plugin.id} icon={plugin.icon} />

      <div className="p-4">
        {/* Header row */}
        <div className="flex items-start justify-between mb-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm text-on-surface truncate">{plugin.name}</h3>
              {isBuiltin && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent shrink-0">
                  Built-in
                </span>
              )}
              {isPending ? (
                <span className="text-xs px-1.5 py-0.5 rounded bg-warning/10 text-warning shrink-0">
                  Needs Approval
                </span>
              ) : (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                    plugin.enabled
                      ? "bg-success/10 text-success"
                      : "bg-surface-tertiary text-on-surface-muted"
                  }`}
                >
                  {plugin.enabled ? "Active" : "Inactive"}
                </span>
              )}
            </div>
            <p className="text-xs text-on-surface-muted mt-0.5">by {plugin.author}</p>
          </div>

          {/* Action: toggle switch for built-in, or nothing for community (actions in expanded) */}
          {isBuiltin && onToggle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              disabled={toggling}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ml-2 ${
                plugin.enabled ? "bg-accent" : "bg-surface-tertiary"
              } ${toggling ? "opacity-50" : ""}`}
            >
              <span
                className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                  plugin.enabled ? "translate-x-4.5" : "translate-x-0.5"
                }`}
              />
            </button>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-on-surface-secondary mt-2 line-clamp-2">{plugin.description}</p>

        {/* Footer: version + expand toggle */}
        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-on-surface-muted">v{plugin.version}</span>
          <button
            onClick={onToggleExpand}
            className="text-on-surface-muted hover:text-on-surface p-1 transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded detail section */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-border space-y-3">
          <div className="pt-3">
            {/* Permissions */}
            {plugin.permissions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-on-surface-secondary mb-1 flex items-center gap-1">
                  <Shield size={10} />
                  Permissions
                </p>
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

            {/* Approval / Revoke buttons for community plugins */}
            {isPending && onRequestApproval && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRequestApproval();
                }}
                className="mt-2 px-3 py-1 text-xs bg-accent text-white rounded hover:bg-accent-hover"
              >
                Approve Permissions
              </button>
            )}

            {!isBuiltin && plugin.enabled && plugin.permissions.length > 0 && onRevoke && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRevoke();
                }}
                className="mt-2 px-3 py-1 text-xs text-error border border-error/30 rounded hover:bg-error/10"
              >
                Revoke Permissions
              </button>
            )}

            {/* Settings */}
            {plugin.enabled && plugin.settings.length > 0 ? (
              <div className="mt-3">
                <p className="text-xs font-medium text-on-surface-secondary mb-2">Settings</p>
                <PluginSettings pluginId={plugin.id} definitions={plugin.settings} />
              </div>
            ) : plugin.settings.length === 0 ? (
              <p className="text-xs text-on-surface-muted mt-2">No configurable settings.</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
