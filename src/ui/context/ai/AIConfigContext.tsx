import { createContext, useContext } from "react";
import type { AIConfigInfo } from "../../api/index.js";

export interface AIConfigContextValue {
  config: AIConfigInfo | null;
  isConfigured: boolean;
  updateConfig: (cfg: {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    authType?: string;
    oauthToken?: string;
  }) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

export const AIConfigContext = createContext<AIConfigContextValue | null>(null);

export function useAIConfigContext(): AIConfigContextValue {
  const context = useContext(AIConfigContext);
  if (!context) {
    throw new Error("useAIConfigContext must be used within an AIProvider");
  }
  return context;
}
