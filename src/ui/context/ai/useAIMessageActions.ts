import { useCallback, type MutableRefObject, type Dispatch, type SetStateAction } from "react";
import type { AIChatMessage } from "../../api/index.js";

interface UseAIMessageActionsParams {
  lastUserMessageRef: MutableRefObject<string>;
  setMessages: Dispatch<SetStateAction<AIChatMessage[]>>;
  sendMessage: (text: string) => Promise<void>;
}

interface UseAIMessageActionsReturn {
  retryLastMessage: () => void;
  editAndResend: (messageIndex: number, newText: string) => void;
  regenerateLastResponse: () => void;
}

export function useAIMessageActions({
  lastUserMessageRef,
  setMessages,
  sendMessage,
}: UseAIMessageActionsParams): UseAIMessageActionsReturn {
  const retryLastMessage = useCallback(() => {
    const text = lastUserMessageRef.current;
    if (!text) return;

    // Remove trailing error + user messages
    setMessages((prev) => {
      const copy = [...prev];
      // Pop the error message
      if (copy.length > 0 && copy[copy.length - 1]?.isError) {
        copy.pop();
      }
      // Pop the user message that triggered it
      if (copy.length > 0 && copy[copy.length - 1]?.role === "user") {
        copy.pop();
      }
      return copy;
    });

    // Re-send after state update settles
    setTimeout(() => {
      sendMessage(text);
    }, 0);
  }, [lastUserMessageRef, setMessages, sendMessage]);

  const editAndResend = useCallback(
    (messageIndex: number, newText: string) => {
      // Truncate history at the edit point and re-send
      setMessages((prev) => prev.slice(0, messageIndex));
      setTimeout(() => {
        sendMessage(newText);
      }, 0);
    },
    [setMessages, sendMessage],
  );

  const regenerateLastResponse = useCallback(() => {
    // Remove the last assistant message and re-send the last user message
    setMessages((prev) => {
      const copy = [...prev];
      // Pop trailing assistant messages
      while (copy.length > 0 && copy[copy.length - 1]?.role === "assistant") {
        copy.pop();
      }
      // The last message should now be the user message — grab its text
      const lastUser = copy[copy.length - 1];
      if (lastUser?.role === "user") {
        lastUserMessageRef.current = lastUser.content;
      }
      return copy;
    });

    setTimeout(() => {
      const text = lastUserMessageRef.current;
      if (text) {
        // Remove the user message too, sendMessage will re-add it
        setMessages((prev) => {
          if (prev.length > 0 && prev[prev.length - 1]?.role === "user") {
            return prev.slice(0, -1);
          }
          return prev;
        });
        setTimeout(() => sendMessage(text), 0);
      }
    }, 0);
  }, [lastUserMessageRef, setMessages, sendMessage]);

  return { retryLastMessage, editAndResend, regenerateLastResponse };
}
