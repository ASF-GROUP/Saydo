/**
 * OpenAI provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const openaiPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "openai",
  displayName: "OpenAI",
  needsApiKey: true,
  supportsOAuth: true,
  defaultModel: "gpt-4o",
  modelFilter: (id) => /gpt|o[1-9]|chatgpt/.test(id),
});
