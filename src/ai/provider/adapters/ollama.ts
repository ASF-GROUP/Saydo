/**
 * Ollama provider — OpenAI-compatible with native /api/tags discovery.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";
import type { ModelDescriptor } from "../../core/capabilities.js";
import type { AIProviderConfig } from "../../types.js";
import { DEFAULT_CAPABILITIES } from "../../core/capabilities.js";

const FETCH_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, timeoutMs = FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function discoverOllamaModels(config: AIProviderConfig): Promise<ModelDescriptor[]> {
  const baseUrl = config.baseUrl ?? "http://localhost:11434";
  // Strip /v1 suffix if present (user might pass the OpenAI-compat URL)
  const host = baseUrl.replace(/\/v1\/?$/, "");
  const res = await fetchWithTimeout(`${host}/api/tags`);
  if (!res.ok) return [];
  const data = (await res.json()) as { models?: { name: string }[] };
  return (data.models ?? []).map((m) => ({
    id: m.name,
    label: m.name,
    capabilities: { ...DEFAULT_CAPABILITIES },
    loaded: true,
  }));
}

export const ollamaPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "ollama",
  displayName: "Ollama (local)",
  needsApiKey: false,
  defaultModel: "llama3.2",
  defaultBaseUrl: "http://localhost:11434/v1",
  showBaseUrl: true,
  fakeApiKey: "ollama",
  discoverModels: discoverOllamaModels,
});
