import { describe, it, expect } from "vitest";
import { deepseekPlugin } from "../../src/ai/provider/adapters/deepseek.js";
import { geminiPlugin } from "../../src/ai/provider/adapters/gemini.js";
import { mistralPlugin } from "../../src/ai/provider/adapters/mistral.js";
import { kimiPlugin } from "../../src/ai/provider/adapters/kimi.js";
import { dashscopePlugin } from "../../src/ai/provider/adapters/dashscope.js";
import { groqPlugin } from "../../src/ai/provider/adapters/groq.js";
import { zaiPlugin } from "../../src/ai/provider/adapters/zai.js";
import { createDefaultRegistry } from "../../src/ai/provider.js";

const newProviders = [
  {
    plugin: deepseekPlugin,
    name: "deepseek",
    displayName: "DeepSeek",
    defaultModel: "deepseek-chat",
  },
  {
    plugin: geminiPlugin,
    name: "gemini",
    displayName: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
  },
  {
    plugin: mistralPlugin,
    name: "mistral",
    displayName: "Mistral AI",
    defaultModel: "mistral-large-latest",
  },
  {
    plugin: kimiPlugin,
    name: "kimi",
    displayName: "Kimi (Moonshot)",
    defaultModel: "moonshot-v1-auto",
  },
  {
    plugin: dashscopePlugin,
    name: "dashscope",
    displayName: "Alibaba DashScope",
    defaultModel: "qwen-plus",
  },
  {
    plugin: groqPlugin,
    name: "groq",
    displayName: "Groq",
    defaultModel: "llama-3.3-70b-versatile",
  },
  {
    plugin: zaiPlugin,
    name: "zai",
    displayName: "ZAI (Zhipu AI)",
    defaultModel: "glm-4-plus",
  },
];

describe("new provider adapters", () => {
  for (const { plugin, name, displayName, defaultModel } of newProviders) {
    describe(name, () => {
      it("has correct name", () => {
        expect(plugin.name).toBe(name);
      });

      it("has correct displayName", () => {
        expect(plugin.displayName).toBe(displayName);
      });

      it("has correct defaultModel", () => {
        expect(plugin.defaultModel).toBe(defaultModel);
      });

      it("requires an API key", () => {
        expect(plugin.needsApiKey).toBe(true);
      });

      it("creates an executor with a mock config", () => {
        const executor = plugin.createExecutor({
          provider: name,
          apiKey: "test-key-123",
        });
        expect(executor).toBeDefined();
        expect(executor.execute).toBeTypeOf("function");
        expect(executor.getCapabilities).toBeTypeOf("function");
      });
    });
  }
});

describe("all new providers registered in default registry", () => {
  it("contains all 12 providers", () => {
    const registry = createDefaultRegistry();
    const all = registry.getAll();
    expect(all).toHaveLength(12);

    const names = all.map((r) => r.plugin.name);
    for (const { name } of newProviders) {
      expect(names).toContain(name);
    }
  });

  for (const { name } of newProviders) {
    it(`creates an executor for ${name} with API key`, () => {
      const registry = createDefaultRegistry();
      const executor = registry.createExecutor({ provider: name, apiKey: "test-key" });
      expect(executor).toBeDefined();
      expect(executor.execute).toBeTypeOf("function");
    });

    it(`throws for ${name} without API key`, () => {
      const registry = createDefaultRegistry();
      expect(() => registry.createExecutor({ provider: name })).toThrow("requires an API key");
    });
  }
});
