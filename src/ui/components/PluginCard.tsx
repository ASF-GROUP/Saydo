// ── Re-export facade ─────────────────────────────────
// Original 561-line file decomposed into focused modules under plugin-browser/
// All external imports continue to work through these re-exports.

export {
  GRADIENT_PALETTE,
  hashString,
  getGradient,
  formatDownloads,
  GradientBanner,
} from "./plugin-browser/gradient-utils.js";

export { PluginSettings } from "./plugin-browser/PluginSettingsPanel.js";

export type { StoreCardProps } from "./plugin-browser/StorePluginCard.js";
export type { SettingsCardProps } from "./plugin-browser/SettingsPluginCard.js";

import { StorePluginCard } from "./plugin-browser/StorePluginCard.js";
import type { StoreCardProps } from "./plugin-browser/StorePluginCard.js";
import { SettingsPluginCard } from "./plugin-browser/SettingsPluginCard.js";
import type { SettingsCardProps } from "./plugin-browser/SettingsPluginCard.js";

export type PluginCardProps = StoreCardProps | SettingsCardProps;

export function PluginCard(props: PluginCardProps) {
  if (props.mode === "store") {
    return <StorePluginCard {...props} />;
  }
  return <SettingsPluginCard {...props} />;
}
