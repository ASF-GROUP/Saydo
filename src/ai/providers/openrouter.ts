import OpenAI from "openai";
import type { AIProviderConfig } from "../types.js";
import { OpenAIProvider } from "./openai.js";

export class OpenRouterProvider extends OpenAIProvider {
  constructor(config: AIProviderConfig) {
    super({
      ...config,
      baseUrl: config.baseUrl ?? "https://openrouter.ai/api/v1",
      model: config.model ?? "anthropic/claude-sonnet-4-5-20250929",
    });

    // Re-create client with OpenRouter-required headers
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl ?? "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://github.com/asf-org/docket",
        "X-Title": "ASF Docket",
      },
    });
  }
}
