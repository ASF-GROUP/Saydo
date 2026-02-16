import { useState, useEffect } from "react";
import { shortcutManager } from "../../shortcutManagerInstance.js";
import { api } from "../../api/index.js";

export function KeyboardTab() {
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
      <h2 className="text-lg font-semibold mb-3 text-on-surface">Keyboard Shortcuts</h2>
      <div className="space-y-2 max-w-lg">
        {shortcuts.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-on-surface-secondary">{s.description}</span>
            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-0.5 text-xs rounded border ${
                  recordingId === s.id
                    ? "border-accent bg-accent/10 text-accent animate-pulse"
                    : "border-border bg-surface-secondary text-on-surface-secondary"
                }`}
              >
                {recordingId === s.id ? "Press keys..." : s.currentKey}
              </kbd>
              <button
                onClick={() => setRecordingId(recordingId === s.id ? null : s.id)}
                className="text-xs text-accent hover:text-accent-hover"
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
                  className="text-xs text-on-surface-muted hover:text-on-surface-secondary"
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
