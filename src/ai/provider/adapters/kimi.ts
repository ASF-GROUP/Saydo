/**
 * Kimi (Moonshot) provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const kimiPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "kimi",
  displayName: "Kimi (Moonshot)",
  needsApiKey: true,
  defaultBaseUrl: "https://api.moonshot.cn/v1",
  defaultModel: "moonshot-v1-auto",
  modelFilter: (id) => /moonshot|kimi/.test(id),
});
