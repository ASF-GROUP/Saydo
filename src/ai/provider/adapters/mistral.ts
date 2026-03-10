/**
 * Mistral AI provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const mistralPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "mistral",
  displayName: "Mistral AI",
  needsApiKey: true,
  defaultBaseUrl: "https://api.mistral.ai/v1",
  defaultModel: "mistral-large-latest",
  modelFilter: (id) => /mistral/.test(id),
});
