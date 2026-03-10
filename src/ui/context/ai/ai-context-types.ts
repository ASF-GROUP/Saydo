import type { AIConfigInfo, AIChatMessage, ChatSessionInfo } from "../../api/index.js";

export interface AIState {
  config: AIConfigInfo | null;
  messages: AIChatMessage[];
  isStreaming: boolean;
  isConfigured: boolean;
}

export interface AIContextValue extends AIState {
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => Promise<void>;
  restoreMessages: () => Promise<void>;
  updateConfig: (config: {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
    authType?: string;
    oauthToken?: string;
  }) => Promise<void>;
  refreshConfig: () => Promise<void>;
  retryLastMessage: () => void;
  voiceCallActive: boolean;
  setVoiceCallMode: (active: boolean) => void;
  /** Increments when AI tools mutate projects/tags — watch this to refresh data */
  dataMutationCount: number;
  /** Currently focused task ID — used to give AI context about what the user is viewing */
  focusedTaskId: string | null;
  setFocusedTaskId: (taskId: string | null) => void;
  // Phase 5: Message actions
  editAndResend: (messageIndex: number, newText: string) => void;
  regenerateLastResponse: () => void;
  // Phase 6: Session management
  sessions: ChatSessionInfo[];
  activeSessionId: string | null;
  createNewSession: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export const SAFETY_TIMEOUT_MS = 90_000;

export const TASK_MUTATING_TOOLS = new Set([
  "create_task",
  "complete_task",
  "update_task",
  "delete_task",
  "bulk_create_tasks",
  "bulk_complete_tasks",
  "bulk_update_tasks",
]);

export const DATA_MUTATING_TOOLS = new Set([
  "create_project",
  "update_project",
  "delete_project",
  "add_tags_to_task",
  "remove_tags_from_task",
  "save_memory",
  "forget_memory",
  "bulk_create_tasks",
  "bulk_complete_tasks",
  "bulk_update_tasks",
]);

export function parseStreamError(data: string): {
  message: string;
  category: string;
  retryable: boolean;
} {
  try {
    const parsed = JSON.parse(data);
    if (parsed && typeof parsed.message === "string" && typeof parsed.category === "string") {
      return {
        message: parsed.message,
        category: parsed.category,
        retryable: !!parsed.retryable,
      };
    }
  } catch {
    // Plain string error (legacy format)
  }
  return { message: data, category: "unknown", retryable: true };
}
