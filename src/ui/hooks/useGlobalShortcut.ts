import { useEffect, useRef } from "react";
import { isTauri } from "../../utils/tauri.js";

/**
 * Register a system-wide global shortcut via Tauri's global-shortcut plugin.
 * No-op when running in a browser (non-Tauri) environment.
 *
 * @param shortcut - The shortcut string (e.g. "CmdOrCtrl+Shift+Space")
 * @param callback - Function to invoke when the shortcut is triggered
 * @param enabled - Whether the shortcut should be active
 */
export function useGlobalShortcut(
  shortcut: string,
  callback: () => void,
  enabled: boolean = true,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!isTauri() || !enabled || !shortcut) return;

    let unregisterFn: (() => Promise<void>) | null = null;
    let cancelled = false;

    async function setup() {
      try {
        const { register } = await import("@tauri-apps/plugin-global-shortcut");
        if (cancelled) return;
        await register(shortcut, (event) => {
          // Only fire on key-down, not key-up
          if (event.state === "Pressed") {
            callbackRef.current();
          }
        });
        if (cancelled) {
          // Was cancelled while registering — unregister immediately
          const { unregister } = await import("@tauri-apps/plugin-global-shortcut");
          await unregister(shortcut);
        } else {
          unregisterFn = async () => {
            const { unregister } = await import("@tauri-apps/plugin-global-shortcut");
            await unregister(shortcut);
          };
        }
      } catch {
        // Shortcut registration can fail (e.g. shortcut already in use by another app).
        // Degrade gracefully.
      }
    }

    setup();

    return () => {
      cancelled = true;
      unregisterFn?.().catch(() => {});
    };
  }, [shortcut, enabled]);
}
