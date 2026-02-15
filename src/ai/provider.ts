import type {
  ChatMessage,
  ToolDefinition,
  ChatResponse,
  StreamEvent,
  AIProviderConfig,
} from "./types.js";
import { OpenAIProvider } from "./providers/openai.js";
import { AnthropicProvider } from "./providers/anthropic.js";
import { OpenRouterProvider } from "./providers/openrouter.js";
import { OllamaProvider } from "./providers/ollama.js";
import { LMStudioProvider } from "./providers/lmstudio.js";
import { AIProviderRegistry } from "./provider-registry.js";

export interface AIProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], tools?: ToolDefinition[]): AsyncIterable<StreamEvent>;
}

let _registry: AIProviderRegistry | null = null;

/** Create a registry with all built-in providers registered. */
export function createDefaultRegistry(): AIProviderRegistry {
  const registry = new AIProviderRegistry();

  registry.register({
    name: "openai",
    displayName: "OpenAI",
    needsApiKey: true,
    defaultModel: "gpt-4o",
    showBaseUrl: false,
    pluginId: null,
    factory: (config) => new OpenAIProvider(config),
  });

  registry.register({
    name: "anthropic",
    displayName: "Anthropic",
    needsApiKey: true,
    defaultModel: "claude-sonnet-4-5-20250929",
    showBaseUrl: false,
    pluginId: null,
    factory: (config) => new AnthropicProvider(config),
  });

  registry.register({
    name: "openrouter",
    displayName: "OpenRouter",
    needsApiKey: true,
    defaultModel: "anthropic/claude-sonnet-4-5-20250929",
    showBaseUrl: false,
    pluginId: null,
    factory: (config) => new OpenRouterProvider(config),
  });

  registry.register({
    name: "ollama",
    displayName: "Ollama (local)",
    needsApiKey: false,
    defaultModel: "llama3.2",
    defaultBaseUrl: "http://localhost:11434",
    showBaseUrl: true,
    pluginId: null,
    factory: (config) => new OllamaProvider(config),
  });

  registry.register({
    name: "lmstudio",
    displayName: "LM Studio (local)",
    needsApiKey: false,
    defaultModel: "default",
    defaultBaseUrl: "http://localhost:1234/v1",
    showBaseUrl: true,
    pluginId: null,
    factory: (config) => new LMStudioProvider(config),
  });

  return registry;
}

export function getProviderRegistry(): AIProviderRegistry {
  if (!_registry) {
    _registry = createDefaultRegistry();
  }
  return _registry;
}

export function setProviderRegistry(registry: AIProviderRegistry): void {
  _registry = registry;
}

/** Backward-compatible factory — delegates to the registry singleton. */
export function createProvider(config: AIProviderConfig): AIProvider {
  return getProviderRegistry().createProvider(config);
}
