import {
  useDirectServices,
  BASE,
  handleResponse,
  handleVoidResponse,
  getServices,
} from "../helpers.js";
import type { AIConfigInfo } from "./ai-types.js";

export async function getAIConfig(): Promise<AIConfigInfo> {
  if (useDirectServices()) {
    const svc = await getServices();
    const providerSetting = svc.storage.getAppSetting("ai_provider");
    const modelSetting = svc.storage.getAppSetting("ai_model");
    const baseUrlSetting = svc.storage.getAppSetting("ai_base_url");
    const apiKeySetting = svc.storage.getAppSetting("ai_api_key");
    return {
      provider: providerSetting?.value ?? null,
      model: modelSetting?.value ?? null,
      baseUrl: baseUrlSetting?.value ?? null,
      hasApiKey: !!apiKeySetting?.value,
    };
  }
  const res = await fetch(`${BASE}/ai/config`);
  return handleResponse<AIConfigInfo>(res);
}

export async function updateAIConfig(config: {
  provider?: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}): Promise<void> {
  if (useDirectServices()) {
    const svc = await getServices();
    if (config.provider) svc.storage.setAppSetting("ai_provider", config.provider);
    if (config.apiKey) svc.storage.setAppSetting("ai_api_key", config.apiKey);
    if (config.model !== undefined) {
      if (config.model) {
        svc.storage.setAppSetting("ai_model", config.model);
      } else {
        svc.storage.deleteAppSetting("ai_model");
      }
    }
    if (config.baseUrl !== undefined) {
      if (config.baseUrl) {
        svc.storage.setAppSetting("ai_base_url", config.baseUrl);
      } else {
        svc.storage.deleteAppSetting("ai_base_url");
      }
    }
    svc.chatManager.clearSession(svc.storage);
    svc.save();
    return;
  }
  await handleVoidResponse(
    await fetch(`${BASE}/ai/config`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    }),
  );
}
