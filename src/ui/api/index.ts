import * as tasks from "./tasks.js";
import * as templates from "./templates.js";
import * as projects from "./projects.js";
import * as sections from "./sections.js";
import * as comments from "./comments.js";
import * as stats from "./stats.js";
import * as plugins from "./plugins.js";
import * as ai from "./ai.js";
import * as settings from "./settings.js";

export const api = {
  ...tasks,
  ...templates,
  ...projects,
  ...sections,
  ...comments,
  ...stats,
  ...plugins,
  ...ai,
  ...settings,
};

// Re-export all interfaces
export type {
  PluginInfo,
  SettingDefinitionInfo,
  PluginCommandInfo,
  StatusBarItemInfo,
  PanelInfo,
  ViewInfo,
  StorePluginInfo,
} from "./plugins.js";
export type {
  AIConfigInfo,
  AIChatMessage,
  AIProviderInfo,
  ModelDiscoveryInfo,
  ChatSessionInfo,
} from "./ai.js";
