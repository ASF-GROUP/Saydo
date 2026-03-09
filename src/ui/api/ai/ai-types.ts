export interface AIConfigInfo {
  provider: string | null;
  model: string | null;
  baseUrl: string | null;
  hasApiKey: boolean;
}

export interface AIChatMessage {
  role: "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: { id: string; name: string; arguments: string }[];
  toolResults?: { toolName: string; data: string }[];
  isError?: boolean;
  errorCategory?: string;
  retryable?: boolean;
}

export interface ChatSessionInfo {
  sessionId: string;
  title: string;
  createdAt: string;
  messageCount: number;
}

export interface AIProviderInfo {
  name: string;
  displayName: string;
  needsApiKey: boolean;
  optionalApiKey?: boolean;
  defaultModel: string;
  suggestedModels?: string[];
  defaultBaseUrl?: string;
  showBaseUrl?: boolean;
  pluginId: string | null;
}

export interface ModelDiscoveryInfo {
  id: string;
  label: string;
  loaded: boolean;
}
