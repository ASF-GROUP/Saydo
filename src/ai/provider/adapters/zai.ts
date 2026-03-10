/**
 * ZAI (Zhipu AI) provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const zaiPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "zai",
  displayName: "ZAI (Zhipu AI)",
  needsApiKey: true,
  defaultBaseUrl: "https://open.bigmodel.cn/api/paas/v4",
  defaultModel: "glm-4-plus",
  modelFilter: (id) => /glm|codegeex|chatglm/.test(id),
});
