/**
 * Google Gemini provider — thin config over the OpenAI-compatible base.
 * Uses Google's OpenAI-compatible endpoint at /v1beta/openai.
 */

import { createOpenAICompatPlugin } from "./openai-compat.js";
import type { LLMProviderPlugin } from "../interface.js";

export const geminiPlugin: LLMProviderPlugin = createOpenAICompatPlugin({
  name: "gemini",
  displayName: "Google Gemini",
  needsApiKey: true,
  defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
  defaultModel: "gemini-2.5-flash",
  modelFilter: (id) => /gemini/.test(id),
});
