import { useState, useRef, useEffect, useCallback } from "react";
import { useAIContext } from "../context/AIContext.js";
import type { AIChatMessage } from "../api.js";

interface AIChatPanelProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export function AIChatPanel({ onClose, onOpenSettings }: AIChatPanelProps) {
  const { messages, isStreaming, isConfigured, sendMessage, clearChat, restoreMessages } =
    useAIContext();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [restored, setRestored] = useState(false);

  // Restore chat history on first open
  useEffect(() => {
    if (!restored && isConfigured) {
      restoreMessages();
      setRestored(true);
    }
  }, [restored, isConfigured, restoreMessages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    await sendMessage(text);
  };

  const handleVoiceResult = useCallback((transcript: string) => {
    setInput((prev) => (prev ? prev + " " + transcript : transcript));
  }, []);

  if (!isConfigured) {
    return (
      <aside className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-sm">AI Chat</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            &times;
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
            <span className="text-2xl">&#x1f916;</span>
          </div>
          <h4 className="font-medium text-sm mb-2">AI Assistant</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Configure an AI provider in Settings to start chatting.
          </p>
          <button
            onClick={onOpenSettings}
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Open Settings
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm">AI Chat</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={clearChat}
            title="Clear chat"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs"
          >
            Clear
          </button>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
          >
            &times;
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center mt-8 space-y-2">
            <p className="text-xs text-gray-400">Ask me anything about your tasks!</p>
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {["What tasks do I have?", "Plan my day", "What's overdue?"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage(suggestion)}
                  disabled={isStreaming}
                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} message={msg} />
        ))}
        {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex items-center gap-1.5 text-gray-400 text-sm">
            <span
              className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your tasks..."
            disabled={isStreaming}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <VoiceButton onResult={handleVoiceResult} disabled={isStreaming} />
          <button
            type="submit"
            disabled={isStreaming || !input.trim()}
            className="px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </aside>
  );
}

function MessageBubble({ message }: { message: AIChatMessage }) {
  const isUser = message.role === "user";
  const isTool = message.role === "tool";

  // Don't render raw tool result messages
  if (isTool) return null;

  // Show tool call indicators for assistant messages that used tools
  const hasToolCalls = message.toolCalls && message.toolCalls.length > 0;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className="max-w-[85%] space-y-1">
        {hasToolCalls && (
          <div className="flex flex-wrap gap-1">
            {message.toolCalls!.map((tc) => (
              <ToolCallBadge key={tc.id} name={tc.name} args={tc.arguments} />
            ))}
          </div>
        )}
        {message.content && (
          <div
            className={`px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
              isUser
                ? "bg-blue-500 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
}

function ToolCallBadge({ name, args }: { name: string; args: string }) {
  let label = name.replace(/_/g, " ");
  try {
    const parsed = JSON.parse(args);
    if (parsed.title) label = `${name === "create_task" ? "Creating" : "Task"}: ${parsed.title}`;
    else if (parsed.taskId) label = `${label} (${parsed.taskId.slice(0, 6)}...)`;
  } catch {
    // Use raw name
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full">
      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
      {label}
    </span>
  );
}

// Speech Recognition type declarations
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

function VoiceButton({
  onResult,
  disabled,
}: {
  onResult: (text: string) => void;
  disabled: boolean;
}) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const toggleListening = useCallback(() => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };

    recognition.onerror = () => {
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [listening, onResult]);

  if (!isSupported) return null;

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      title={listening ? "Stop listening" : "Voice input"}
      className={`px-2 py-2 text-sm rounded-lg border disabled:opacity-50 ${
        listening
          ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-500"
          : "border-gray-300 dark:border-gray-600 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {listening ? (
        <svg className="w-4 h-4 animate-pulse" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="6" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
          <line x1="8" y1="23" x2="16" y2="23" />
        </svg>
      )}
    </button>
  );
}
