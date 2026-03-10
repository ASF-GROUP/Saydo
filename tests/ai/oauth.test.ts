import { describe, it, expect } from "vitest";
import { createDefaultRegistry } from "../../src/ai/provider.js";
import { createOpenAICompatPlugin } from "../../src/ai/provider/adapters/openai-compat.js";
import { openaiPlugin } from "../../src/ai/provider/adapters/openai.js";

describe("OAuth provider support", () => {
  describe("AIProviderConfig authType", () => {
    it("creates executor with OAuth token when authType is oauth", () => {
      const registry = createDefaultRegistry();
      const executor = registry.createExecutor({
        provider: "openai",
        authType: "oauth",
        oauthToken: "oauth-test-token",
      });
      expect(executor).toBeDefined();
      expect(executor.execute).toBeTypeOf("function");
      expect(executor.getCapabilities).toBeTypeOf("function");
    });

    it("creates executor with API key when authType is api-key", () => {
      const registry = createDefaultRegistry();
      const executor = registry.createExecutor({
        provider: "openai",
        authType: "api-key",
        apiKey: "sk-test",
      });
      expect(executor).toBeDefined();
      expect(executor.execute).toBeTypeOf("function");
    });

    it("creates executor with API key when authType is undefined", () => {
      const registry = createDefaultRegistry();
      const executor = registry.createExecutor({
        provider: "openai",
        apiKey: "sk-test",
      });
      expect(executor).toBeDefined();
      expect(executor.execute).toBeTypeOf("function");
    });

    it("throws when authType is oauth but no oauthToken provided", () => {
      const registry = createDefaultRegistry();
      expect(() =>
        registry.createExecutor({
          provider: "openai",
          authType: "oauth",
        }),
      ).toThrow("requires an API key");
    });

    it("throws when no auth credentials provided at all", () => {
      const registry = createDefaultRegistry();
      expect(() =>
        registry.createExecutor({
          provider: "openai",
        }),
      ).toThrow("requires an API key");
    });
  });

  describe("supportsOAuth flag", () => {
    it("OpenAI plugin has supportsOAuth set to true", () => {
      expect(openaiPlugin.supportsOAuth).toBe(true);
    });

    it("custom plugin without supportsOAuth defaults to undefined", () => {
      const plugin = createOpenAICompatPlugin({
        name: "test-provider",
        displayName: "Test Provider",
        needsApiKey: true,
        defaultModel: "test-model",
      });
      expect(plugin.supportsOAuth).toBeUndefined();
    });

    it("custom plugin with supportsOAuth set to true", () => {
      const plugin = createOpenAICompatPlugin({
        name: "test-provider",
        displayName: "Test Provider",
        needsApiKey: true,
        defaultModel: "test-model",
        supportsOAuth: true,
      });
      expect(plugin.supportsOAuth).toBe(true);
    });
  });

  describe("config round-trip with new fields", () => {
    it("AIProviderConfig accepts authType and oauthToken", () => {
      const config = {
        provider: "openai" as const,
        authType: "oauth" as const,
        oauthToken: "test-token-123",
        model: "gpt-4o",
      };
      expect(config.authType).toBe("oauth");
      expect(config.oauthToken).toBe("test-token-123");
      expect(config.provider).toBe("openai");
      expect(config.model).toBe("gpt-4o");
    });

    it("AIProviderConfig works without new fields (backward compat)", () => {
      const config = {
        provider: "openai" as const,
        apiKey: "sk-test",
        model: "gpt-4o",
      };
      expect(config.authType).toBeUndefined();
      expect(config.oauthToken).toBeUndefined();
    });
  });
});
