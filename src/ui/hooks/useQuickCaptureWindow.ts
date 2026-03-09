import { useCallback } from "react";
import { isTauri } from "../../utils/tauri.js";

/**
 * Provides show/hide/focus helpers for the quick-capture Tauri window.
 * All operations are no-ops when running outside Tauri.
 */
export function useQuickCaptureWindow() {
  const showWindow = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const win = await WebviewWindow.getByLabel("quick-capture");
      if (!win) return;
      await win.center();
      await win.show();
      await win.setFocus();
    } catch {
      // Window may not exist — degrade gracefully
    }
  }, []);

  const hideWindow = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const { WebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      const win = await WebviewWindow.getByLabel("quick-capture");
      if (!win) return;
      await win.hide();
    } catch {
      // Degrade gracefully
    }
  }, []);

  return { showWindow, hideWindow };
}
