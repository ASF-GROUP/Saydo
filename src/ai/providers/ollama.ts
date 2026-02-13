import type { AIProviderConfig } from "../types.js";
import { OpenAIProvider } from "./openai.js";

export class OllamaProvider extends OpenAIProvider {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      apiKey: "ollama",
      baseUrl: config.baseUrl ?? "http://localhost:11434/v1",
      model: config.model ?? "llama3.2",
    });
  }
}
