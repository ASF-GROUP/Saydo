import { useCallback, type Dispatch, type SetStateAction } from "react";
import { api, type AIChatMessage } from "../../api/index.js";

interface UseAISessionManagementParams {
  setMessages: Dispatch<SetStateAction<AIChatMessage[]>>;
  setActiveSessionId: Dispatch<SetStateAction<string | null>>;
  activeSessionId: string | null;
  refreshSessions: () => Promise<void>;
}

interface UseAISessionManagementReturn {
  createNewSession: () => Promise<void>;
  switchSession: (sessionId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  renameSession: (sessionId: string, title: string) => Promise<void>;
}

export function useAISessionManagement({
  setMessages,
  setActiveSessionId,
  activeSessionId,
  refreshSessions,
}: UseAISessionManagementParams): UseAISessionManagementReturn {
  const createNewSession = useCallback(async () => {
    await api.createNewChatSession();
    setMessages([]);
    setActiveSessionId(null);
    await refreshSessions();
  }, [setMessages, setActiveSessionId, refreshSessions]);

  const switchSession = useCallback(
    async (sessionId: string) => {
      try {
        const msgs = await api.switchChatSession(sessionId);
        setMessages(msgs.filter((m: AIChatMessage) => m.role !== "tool"));
        setActiveSessionId(sessionId);
      } catch {
        // Non-critical
      }
    },
    [setMessages, setActiveSessionId],
  );

  const deleteSession = useCallback(
    async (sessionId: string) => {
      await api.deleteChatSession(sessionId);
      if (activeSessionId === sessionId) {
        setMessages([]);
        setActiveSessionId(null);
      }
      await refreshSessions();
    },
    [activeSessionId, setMessages, setActiveSessionId, refreshSessions],
  );

  const renameSession = useCallback(
    async (sessionId: string, title: string) => {
      await api.renameChatSession(sessionId, title);
      await refreshSessions();
    },
    [refreshSessions],
  );

  return { createNewSession, switchSession, deleteSession, renameSession };
}
