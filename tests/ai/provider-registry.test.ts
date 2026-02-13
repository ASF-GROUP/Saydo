import { describe, it, expect } from "vitest";
import { AIProviderRegistry } from "../../src/ai/provider-registry.js";

describe("AIProviderRegistry", () => {
  function createTestProvider() {
    return {
      chat: async () => ({ content: "test" }),
      streamChat: async function* () {
        yield { type: "done" as const, data: "" };
      },
    };
  }

  it("registers and retrieves a provider", () => {
    const registry = new AIProviderRegistry();
    registry.register({
      name: "test",
      displayName: "Test Provider",
      needsApiKey: false,
      defaultModel: "test-model",
      pluginId: null,
      factory: () => createTestProvider(),
    });

    expect(registry.get("test")).toBeDefined();
    expect(registry.get("test")!.displayName).toBe("Test Provider");
  });

  it("returns all registered providers", () => {
    const registry = new AIProviderRegistry();
    registry.register({
      name: "a",
      displayName: "A",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    });
    registry.register({
      name: "b",
      displayName: "B",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    });

    expect(registry.getAll()).toHaveLength(2);
  });

  it("throws on duplicate registration", () => {
    const registry = new AIProviderRegistry();
    const reg = {
      name: "dup",
      displayName: "Dup",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    };
    registry.register(reg);
    expect(() => registry.register(reg)).toThrow("already registered");
  });

  it("unregisters a provider by name", () => {
    const registry = new AIProviderRegistry();
    registry.register({
      name: "remove-me",
      displayName: "Remove",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    });
    expect(registry.get("remove-me")).toBeDefined();

    registry.unregister("remove-me");
    expect(registry.get("remove-me")).toBeUndefined();
  });

  it("unregisters all providers by plugin ID", () => {
    const registry = new AIProviderRegistry();
    registry.register({
      name: "plugin-a:prov1",
      displayName: "P1",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: "plugin-a",
      factory: () => createTestProvider(),
    });
    registry.register({
      name: "plugin-a:prov2",
      displayName: "P2",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: "plugin-a",
      factory: () => createTestProvider(),
    });
    registry.register({
      name: "built-in",
      displayName: "Built-In",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    });

    registry.unregisterByPlugin("plugin-a");

    expect(registry.getAll()).toHaveLength(1);
    expect(registry.get("built-in")).toBeDefined();
  });

  it("creates a provider instance via factory", () => {
    const registry = new AIProviderRegistry();
    registry.register({
      name: "test",
      displayName: "Test",
      needsApiKey: false,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    });

    const provider = registry.createProvider({ provider: "test" });
    expect(provider).toBeDefined();
    expect(provider.chat).toBeTypeOf("function");
  });

  it("throws when creating with unknown provider", () => {
    const registry = new AIProviderRegistry();
    expect(() => registry.createProvider({ provider: "nope" })).toThrow("Unknown AI provider");
  });

  it("throws when API key is needed but missing", () => {
    const registry = new AIProviderRegistry();
    registry.register({
      name: "paid",
      displayName: "Paid",
      needsApiKey: true,
      defaultModel: "m",
      pluginId: null,
      factory: () => createTestProvider(),
    });

    expect(() => registry.createProvider({ provider: "paid" })).toThrow("requires an API key");
    expect(() => registry.createProvider({ provider: "paid", apiKey: "sk-test" })).not.toThrow();
  });
});
