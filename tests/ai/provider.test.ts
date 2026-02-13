import { describe, it, expect } from "vitest";
import { createProvider } from "../../src/ai/provider.js";
import { OpenAIProvider } from "../../src/ai/providers/openai.js";
import { AnthropicProvider } from "../../src/ai/providers/anthropic.js";
import { OpenRouterProvider } from "../../src/ai/providers/openrouter.js";
import { OllamaProvider } from "../../src/ai/providers/ollama.js";
import { LMStudioProvider } from "../../src/ai/providers/lmstudio.js";

describe("createProvider", () => {
  it("creates an OpenAI provider", () => {
    const provider = createProvider({ provider: "openai", apiKey: "sk-test" });
    expect(provider).toBeInstanceOf(OpenAIProvider);
  });

  it("creates an Anthropic provider", () => {
    const provider = createProvider({ provider: "anthropic", apiKey: "sk-ant-test" });
    expect(provider).toBeInstanceOf(AnthropicProvider);
  });

  it("creates an OpenRouter provider", () => {
    const provider = createProvider({ provider: "openrouter", apiKey: "sk-or-test" });
    expect(provider).toBeInstanceOf(OpenRouterProvider);
  });

  it("creates an Ollama provider without API key", () => {
    const provider = createProvider({ provider: "ollama" });
    expect(provider).toBeInstanceOf(OllamaProvider);
  });

  it("creates an LM Studio provider without API key", () => {
    const provider = createProvider({ provider: "lmstudio" });
    expect(provider).toBeInstanceOf(LMStudioProvider);
  });

  it("throws for missing API key on OpenAI", () => {
    expect(() => createProvider({ provider: "openai" })).toThrow("OpenAI requires an API key");
  });

  it("throws for missing API key on Anthropic", () => {
    expect(() => createProvider({ provider: "anthropic" })).toThrow(
      "Anthropic requires an API key",
    );
  });

  it("throws for missing API key on OpenRouter", () => {
    expect(() => createProvider({ provider: "openrouter" })).toThrow(
      "OpenRouter requires an API key",
    );
  });

  it("throws for unknown provider", () => {
    expect(() => createProvider({ provider: "unknown" as any })).toThrow(
      "Unknown AI provider: unknown",
    );
  });
});
