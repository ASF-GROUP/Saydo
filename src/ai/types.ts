export type ProviderName = "openai" | "anthropic" | "openrouter" | "ollama" | "lmstudio";

export interface AIProviderConfig {
  provider: ProviderName;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatResponse {
  content: string;
  toolCalls?: ToolCall[];
}

export interface StreamEvent {
  type: "token" | "tool_call" | "tool_result" | "done" | "error";
  data: string;
}
