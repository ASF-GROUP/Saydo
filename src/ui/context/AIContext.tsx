import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { api, type AIConfigInfo, type AIChatMessage } from "../api.js";

interface AIState {
  config: AIConfigInfo | null;
  messages: AIChatMessage[];
  isStreaming: boolean;
  isConfigured: boolean;
}

interface AIContextValue extends AIState {
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => Promise<void>;
  updateConfig: (config: {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }) => Promise<void>;
  refreshConfig: () => Promise<void>;
}

const AIContext = createContext<AIContextValue | null>(null);

export function AIProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<AIConfigInfo | null>(null);
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const isConfigured = !!(config?.provider && (config.hasApiKey || config.provider === "ollama" || config.provider === "lmstudio"));

  const refreshConfig = useCallback(async () => {
    try {
      const cfg = await api.getAIConfig();
      setConfig(cfg);
    } catch {
      // Non-critical
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  const sendMessage = useCallback(async (text: string) => {
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setIsStreaming(true);

    try {
      const stream = await api.sendChatMessage(text);
      if (!stream) {
        setIsStreaming(false);
        return;
      }

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from buffer
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? ""; // Keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6);
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as { type: string; data: string };

            if (event.type === "token") {
              assistantContent += event.data;
              // Update the assistant message in real-time
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return [...prev.slice(0, -1), { ...last, content: assistantContent }];
                }
                return [...prev, { role: "assistant", content: assistantContent }];
              });
            } else if (event.type === "tool_result") {
              // Tool results are internal — we could display them but for now just continue
            } else if (event.type === "error") {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `Error: ${event.data}` },
              ]);
            }
            // "done" event just signals end
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${msg}` },
      ]);
    } finally {
      setIsStreaming(false);
    }
  }, []);

  const clearChat = useCallback(async () => {
    await api.clearChat();
    setMessages([]);
  }, []);

  const updateConfig = useCallback(async (cfg: {
    provider?: string;
    apiKey?: string;
    model?: string;
    baseUrl?: string;
  }) => {
    await api.updateAIConfig(cfg);
    await refreshConfig();
    setMessages([]);
  }, [refreshConfig]);

  return (
    <AIContext.Provider
      value={{ config, messages, isStreaming, isConfigured, sendMessage, clearChat, updateConfig, refreshConfig }}
    >
      {children}
    </AIContext.Provider>
  );
}

export function useAIContext(): AIContextValue {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error("useAIContext must be used within an AIProvider");
  }
  return context;
}
