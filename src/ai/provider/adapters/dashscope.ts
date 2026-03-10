/**
 * Alibaba DashScope provider — thin config over the OpenAI-compatible base.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const dashscopePlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "dashscope",
  displayName: "Alibaba DashScope",
  needsApiKey: true,
  defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
  defaultModel: "qwen-plus",
  modelFilter: (id) => /qwen/.test(id),
});
