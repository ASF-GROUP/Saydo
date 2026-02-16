import { describe, it, expect } from "vitest";
import {
  PLUGIN_API_VERSION,
  PLUGIN_API_STABILITY,
  createPluginAPI,
} from "../../src/plugins/api.js";
import { createTestServices } from "../integration/helpers.js";
import { PluginSettingsManager } from "../../src/plugins/settings.js";
import { CommandRegistry } from "../../src/plugins/command-registry.js";
import { UIRegistry } from "../../src/plugins/ui-registry.js";
import type { Permission } from "../../src/plugins/types.js";

describe("Plugin API versioning", () => {
  it("PLUGIN_API_VERSION is 1.1.0", () => {
    expect(PLUGIN_API_VERSION).toBe("1.1.0");
  });

  it("PLUGIN_API_STABILITY is stable", () => {
    expect(PLUGIN_API_STABILITY).toBe("stable");
  });

  it("createPluginAPI returns object with meta property", () => {
    const { taskService, eventBus, storage } = createTestServices();
    const api = createPluginAPI({
      pluginId: "test-meta",
      permissions: [] as Permission[],
      taskService,
      eventBus,
      settingsManager: new PluginSettingsManager(storage),
      commandRegistry: new CommandRegistry(),
      uiRegistry: new UIRegistry(),
      settingDefinitions: [],
    });

    expect(api.meta).toBeDefined();
    expect(typeof api.meta).toBe("object");
  });

  it("meta.version matches PLUGIN_API_VERSION", () => {
    const { taskService, eventBus, storage } = createTestServices();
    const api = createPluginAPI({
      pluginId: "test-meta",
      permissions: [] as Permission[],
      taskService,
      eventBus,
      settingsManager: new PluginSettingsManager(storage),
      commandRegistry: new CommandRegistry(),
      uiRegistry: new UIRegistry(),
      settingDefinitions: [],
    });

    expect(api.meta.version).toBe(PLUGIN_API_VERSION);
  });

  it("meta.stability matches PLUGIN_API_STABILITY", () => {
    const { taskService, eventBus, storage } = createTestServices();
    const api = createPluginAPI({
      pluginId: "test-meta",
      permissions: [] as Permission[],
      taskService,
      eventBus,
      settingsManager: new PluginSettingsManager(storage),
      commandRegistry: new CommandRegistry(),
      uiRegistry: new UIRegistry(),
      settingDefinitions: [],
    });

    expect(api.meta.stability).toBe(PLUGIN_API_STABILITY);
  });
});
