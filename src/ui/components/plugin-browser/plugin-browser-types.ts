import type { SettingDefinitionInfo } from "../../api/index.js";

// ── Types ────────────────────────────────────────────

export interface BrowserPlugin {
  id: string;
  name: string;
  description: string;
  author: string;
  version: string;
  icon?: string;
  repository?: string;
  downloadUrl?: string;
  tags: string[];
  downloads?: number;
  longDescription?: string;
  installed: boolean;
  enabled: boolean;
  builtin: boolean;
  permissions: string[];
  settings: SettingDefinitionInfo[];
}

export type FilterTab = "all" | "installed" | "not-installed";

// ── Props ────────────────────────────────────────────

export interface PluginBrowserProps {
  open: boolean;
  onClose: () => void;
}
