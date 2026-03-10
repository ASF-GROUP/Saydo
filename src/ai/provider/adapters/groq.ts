/**
 * Groq provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const groqPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "groq",
  displayName: "Groq",
  needsApiKey: true,
  defaultBaseUrl: "https://api.groq.com/openai/v1",
  defaultModel: "llama-3.3-70b-versatile",
  modelFilter: (id) => /llama|mixtral|gemma/.test(id),
});
