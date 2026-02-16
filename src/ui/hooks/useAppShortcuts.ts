import { useEffect } from "react";
import { shortcutManager } from "../shortcutManagerInstance.js";
import { themeManager } from "../themes/manager.js";
import { api } from "../api/index.js";

export function useAppShortcuts(
  setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>,
  undo: () => void,
  redo: () => void,
) {
  useEffect(() => {
    shortcutManager.register({
      id: "command-palette",
      description: "Open Command Palette",
      defaultKey: "ctrl+k",
      callback: () => setCommandPaletteOpen((open) => !open),
    });
    shortcutManager.register({
      id: "toggle-dark-mode",
      description: "Toggle Dark Mode",
      defaultKey: "ctrl+shift+d",
      callback: () => themeManager.toggle(),
    });
    shortcutManager.register({
      id: "undo",
      description: "Undo",
      defaultKey: "ctrl+z",
      callback: () => undo(),
    });
    shortcutManager.register({
      id: "redo",
      description: "Redo",
      defaultKey: "ctrl+shift+z",
      callback: () => redo(),
    });

    // Load custom bindings from settings
    api.getAppSetting("keyboard_shortcuts").then((val) => {
      if (val) {
        try {
          shortcutManager.loadCustomBindings(JSON.parse(val));
        } catch {
          // Non-critical
        }
      }
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      shortcutManager.handleKeyDown(e);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, setCommandPaletteOpen]);
}
