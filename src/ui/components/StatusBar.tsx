import { usePluginContext } from "../context/PluginContext.js";

export function StatusBar() {
  const { statusBarItems } = usePluginContext();

  return (
    <div className="flex items-center gap-4 px-4 py-1 border-t border-border bg-surface-secondary text-xs text-on-surface-muted">
      {statusBarItems.length === 0 ? (
        <span className="opacity-0 select-none">&nbsp;</span>
      ) : (
        statusBarItems.map((item) => (
          <span key={item.id} className="flex items-center gap-1">
            <span>{item.icon}</span>
            <span>{item.text}</span>
          </span>
        ))
      )}
    </div>
  );
}
