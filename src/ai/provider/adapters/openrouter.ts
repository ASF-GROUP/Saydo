/**
 * OpenRouter provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const openrouterPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "openrouter",
  displayName: "OpenRouter",
  needsApiKey: true,
  defaultModel: "anthropic/claude-sonnet-4-5-20250929",
  defaultBaseUrl: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": "https://github.com/ASF-GROUP/Saydo",
    "X-Title": "ASF Saydo",
  },
});
