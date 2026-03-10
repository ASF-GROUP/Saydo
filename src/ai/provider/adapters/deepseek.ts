/**
 * DeepSeek provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const deepseekPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "deepseek",
  displayName: "DeepSeek",
  needsApiKey: true,
  defaultBaseUrl: "https://api.deepseek.com/v1",
  defaultModel: "deepseek-chat",
  modelFilter: (id) => /deepseek/.test(id),
});
