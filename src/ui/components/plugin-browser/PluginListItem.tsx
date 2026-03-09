import { Download } from "lucide-react";
import { formatDownloads } from "../PluginCard.js";
import type { BrowserPlugin } from "./plugin-browser-types.js";

// ── PluginListItem ───────────────────────────────────

export function PluginListItem({
  plugin,
  selected,
  onClick,
}: {
  plugin: BrowserPlugin;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2.5 border-b border-border/50 transition-colors ${
        selected
          ? "bg-accent/10 border-l-2 border-l-accent"
          : "hover:bg-surface-secondary border-l-2 border-l-transparent"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span className="text-lg mt-0.5 shrink-0">{plugin.icon || "🧩"}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-on-surface truncate">{plugin.name}</span>
            {plugin.installed && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
                {plugin.enabled ? "Enabled" : "Installed"}
              </span>
            )}
            {plugin.builtin && (
              <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded bg-surface-tertiary text-on-surface-muted font-medium">
                Built-in
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xs text-on-surface-muted truncate">{plugin.author}</span>
            {plugin.downloads != null && plugin.downloads > 0 && (
              <span className="text-xs text-on-surface-muted flex items-center gap-0.5 shrink-0">
                <Download size={9} />
                {formatDownloads(plugin.downloads)}
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-muted mt-0.5 line-clamp-1">{plugin.description}</p>
        </div>
      </div>
    </button>
  );
}
