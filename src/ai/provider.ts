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

export interface AIProvider {
  chat(messages: ChatMessage[], tools?: ToolDefinition[]): Promise<ChatResponse>;
  streamChat(messages: ChatMessage[], tools?: ToolDefinition[]): AsyncIterable<StreamEvent>;
}

export function createProvider(config: AIProviderConfig): AIProvider {
  switch (config.provider) {
    case "openai":
      if (!config.apiKey) throw new Error("OpenAI requires an API key");
      return new OpenAIProvider(config);
    case "anthropic":
      if (!config.apiKey) throw new Error("Anthropic requires an API key");
      return new AnthropicProvider(config);
    case "openrouter":
      if (!config.apiKey) throw new Error("OpenRouter requires an API key");
      return new OpenRouterProvider(config);
    case "ollama":
      return new OllamaProvider(config);
    case "lmstudio":
      return new LMStudioProvider(config);
    default:
      throw new Error(`Unknown AI provider: ${config.provider}`);
  }
}
