import type { AIProviderConfig } from "../types.js";
import { OpenAIProvider } from "./openai.js";

export class LMStudioProvider extends OpenAIProvider {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      apiKey: "lm-studio",
      baseUrl: config.baseUrl ?? "http://localhost:1234/v1",
      model: config.model ?? "default",
    });
  }
}
