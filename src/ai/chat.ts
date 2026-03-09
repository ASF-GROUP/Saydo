import type { LLMExecutor } from "./provider/interface.js";
import type { LLMExecutionContext, PipelineResult } from "./core/context.js";
import type { LLMPipeline } from "./core/pipeline.js";
import type { ToolRegistry } from "./tools/registry.js";
import type { ToolContext } from "./tools/types.js";
import type { ChatMessage, StreamEvent, LLMRequest } from "./types.js";
import type { IStorage } from "../storage/interface.js";
import { generateId } from "../utils/ids.js";
import { AIError, classifyProviderError, type StreamErrorData } from "./errors.js";
import { createLogger } from "../utils/logger.js";
import { buildSystemMessage, LOCAL_PROVIDER_TOOLS } from "./chat-prompts.js";

const logger = createLogger("chat");

const STREAM_TIMEOUT_MS = 60_000;
const DEFAULT_CONTEXT_BUDGET = 8_000; // tokens — conservative for 8k-128k models
const KEEP_RECENT_MESSAGES = 12; // ~6 turns of user/assistant

async function* withTimeout(
  source: AsyncIterable<StreamEvent>,
  timeoutMs: number,
): AsyncGenerator<StreamEvent> {
  const iterator = source[Symbol.asyncIterator]();
  while (true) {
    const result = await Promise.race([
      iterator.next(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new AIError("Response timed out.", "timeout", true)), timeoutMs),
      ),
    ]);
    if (result.done) return;
    yield result.value;
  }
}

export class ChatSession {
  private messages: ChatMessage[] = [];
  private executor: LLMExecutor;
  private pipeline: LLMPipeline | null;
  private toolRegistry: ToolRegistry;
  private services: ToolContext;
  private model: string;
  private providerName: string;
  readonly sessionId: string;
  private queries?: IStorage;
  private running = false;
  private runQueue: Array<() => void> = [];

  constructor(
    executor: LLMExecutor,
    services: ToolContext,
    systemMessage: ChatMessage,
    options: {
      sessionId?: string;
      queries?: IStorage;
      pipeline?: LLMPipeline;
      toolRegistry: ToolRegistry;
      model?: string;
      providerName?: string;
    },
  ) {
    this.executor = executor;
    this.services = services;
    this.sessionId = options.sessionId ?? generateId();
    this.queries = options.queries;
    this.pipeline = options.pipeline ?? null;
    this.toolRegistry = options.toolRegistry;
    this.model = options.model ?? "default";
    this.providerName = options.providerName ?? "unknown";
    this.messages.push(systemMessage);
    logger.info("Chat session created", {
      sessionId: this.sessionId,
      provider: this.providerName,
      model: this.model,
    });
  }

  /** Restore previously persisted messages (used when rehydrating a session). */
  restoreMessages(msgs: ChatMessage[]): void {
    this.messages.push(...msgs);
  }

  /** Rough token estimate: ~4 chars per token for English text. */
  private estimateTokens(): number {
    return this.messages.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);
  }

  /**
   * Compact conversation if it exceeds the context budget.
   * Replaces old messages with a summary, keeping the system message and recent messages.
   */
  private async compactIfNeeded(): Promise<void> {
    const estimate = this.estimateTokens();
    if (estimate <= DEFAULT_CONTEXT_BUDGET) return;

    // Find the system message (always first)
    const systemMsg = this.messages[0];
    if (systemMsg?.role !== "system") return;

    // Keep system + last N messages
    const nonSystemMessages = this.messages.slice(1);
    if (nonSystemMessages.length <= KEEP_RECENT_MESSAGES) return;

    const oldMessages = nonSystemMessages.slice(0, -KEEP_RECENT_MESSAGES);
    const recentMessages = nonSystemMessages.slice(-KEEP_RECENT_MESSAGES);
    const oldCount = this.messages.length;

    try {
      // Build compaction request
      const compactionMessages: ChatMessage[] = [
        ...oldMessages,
        {
          role: "user",
          content:
            "Summarize this conversation so far in 2-4 paragraphs. Preserve: key decisions, task actions taken, user preferences mentioned, and any pending questions or plans.",
        },
      ];

      const request: LLMRequest = {
        messages: compactionMessages,
        model: this.model,
      };

      const ctx: LLMExecutionContext = {
        request,
        providerName: this.providerName,
        capabilities: this.executor.getCapabilities(this.model),
        metadata: new Map(),
      };

      const result = await this.executor.execute(ctx);
      let summary = "";
      if (result.mode === "stream") {
        for await (const event of result.events) {
          if (event.type === "token") summary += event.data;
        }
      } else {
        summary = result.response.content;
      }

      if (!summary) return;

      // Replace old messages with summary
      const summaryMsg: ChatMessage = {
        role: "assistant",
        content: `[Conversation summary]\n\n${summary}`,
      };

      this.messages = [systemMsg, summaryMsg, ...recentMessages];

      logger.info("Conversation compacted", {
        sessionId: this.sessionId,
        before: oldCount,
        after: this.messages.length,
      });
    } catch (err) {
      logger.warn("Conversation compaction failed", {
        sessionId: this.sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
      // Non-fatal — continue with uncompacted messages
    }
  }

  addUserMessage(content: string): void {
    logger.debug("User message added", { sessionId: this.sessionId, length: content.length });
    const msg: ChatMessage = { role: "user", content };
    this.messages.push(msg);
    this.persistMessage(msg);
  }

  getMessages(): ChatMessage[] {
    return this.messages.filter((m) => m.role !== "system");
  }

  async *run(): AsyncIterable<StreamEvent> {
    // Serialize concurrent runs — second caller waits until first completes
    if (this.running) {
      await new Promise<void>((resolve) => this.runQueue.push(resolve));
    }
    this.running = true;
    try {
      yield* this.executeRun();
    } finally {
      this.running = false;
      const next = this.runQueue.shift();
      if (next) next();
    }
  }

  private async *executeRun(): AsyncIterable<StreamEvent> {
    // Compact conversation if approaching context limits
    await this.compactIfNeeded();

    const isLocal = this.providerName === "ollama" || this.providerName === "lmstudio";
    const allTools = this.toolRegistry.getDefinitions();
    const tools = isLocal ? allTools.filter((t) => LOCAL_PROVIDER_TOOLS.has(t.name)) : allTools;
    let maxIterations = 10;
    let lastToolSignature = "";

    while (maxIterations-- > 0) {
      let fullContent = "";
      let toolCalls: { id: string; name: string; arguments: string }[] | null = null;

      try {
        const request: LLMRequest = {
          messages: this.messages,
          tools: tools.length > 0 ? tools : undefined,
          model: this.model,
        };

        const ctx: LLMExecutionContext = {
          request,
          providerName: this.providerName,
          capabilities: this.executor.getCapabilities(this.model),
          metadata: new Map(),
        };

        let result: PipelineResult;
        if (this.pipeline) {
          result = await this.pipeline.execute(ctx, (c) => this.executor.execute(c));
        } else {
          result = await this.executor.execute(ctx);
        }

        if (result.mode === "stream") {
          for await (const event of withTimeout(result.events, STREAM_TIMEOUT_MS)) {
            if (event.type === "token") {
              fullContent += event.data;
              yield event;
            } else if (event.type === "tool_call") {
              toolCalls = JSON.parse(event.data);
              yield event;
            } else if (event.type === "error") {
              if (fullContent) {
                const partialMsg: ChatMessage = { role: "assistant", content: fullContent };
                this.messages.push(partialMsg);
                this.persistMessage(partialMsg);
              }
              yield event;
              return;
            }
          }
        } else {
          // Complete mode — convert to events
          fullContent = result.response.content;
          if (fullContent) {
            yield { type: "token", data: fullContent };
          }
          if (result.response.toolCalls?.length) {
            toolCalls = result.response.toolCalls;
            yield { type: "tool_call", data: JSON.stringify(toolCalls) };
          }
        }
      } catch (err) {
        if (fullContent) {
          const partialMsg: ChatMessage = { role: "assistant", content: fullContent };
          this.messages.push(partialMsg);
          this.persistMessage(partialMsg);
        }
        const aiError = classifyProviderError(err);
        logger.error("Provider error", {
          sessionId: this.sessionId,
          category: aiError.category,
          retryable: aiError.retryable,
        });
        const errorData: StreamErrorData = {
          message: aiError.message,
          category: aiError.category,
          retryable: aiError.retryable,
          ...(aiError.retryAfterMs !== undefined ? { retryAfterMs: aiError.retryAfterMs } : {}),
        };
        yield { type: "error", data: JSON.stringify(errorData) };
        return;
      }

      if (toolCalls && toolCalls.length > 0) {
        logger.debug("Tool calls received", {
          sessionId: this.sessionId,
          tools: toolCalls.map((tc) => tc.name),
        });

        // Detect hallucination loop: same tool calls repeated back-to-back
        const signature = toolCalls
          .map((tc) => `${tc.name}:${tc.arguments}`)
          .sort()
          .join("|");
        if (signature === lastToolSignature) {
          logger.warn("Duplicate tool call loop detected, breaking", { sessionId: this.sessionId });
          const msg: ChatMessage = { role: "assistant", content: fullContent || "Done." };
          this.messages.push(msg);
          this.persistMessage(msg);
          yield { type: "done", data: "" };
          return;
        }
        lastToolSignature = signature;
      }

      if (!toolCalls || toolCalls.length === 0) {
        const msg: ChatMessage = { role: "assistant", content: fullContent };
        this.messages.push(msg);
        this.persistMessage(msg);
        yield { type: "done", data: "" };
        return;
      }

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: fullContent,
        toolCalls,
      };
      this.messages.push(assistantMsg);
      this.persistMessage(assistantMsg);

      for (const tc of toolCalls) {
        try {
          const args = JSON.parse(tc.arguments);
          const result = await this.toolRegistry.execute(tc.name, args, this.services);

          yield { type: "tool_result", data: JSON.stringify({ tool: tc.name, result }) };

          const toolMsg: ChatMessage = { role: "tool", content: result, toolCallId: tc.id };
          this.messages.push(toolMsg);
          this.persistMessage(toolMsg);
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          logger.warn("Tool execution failed", {
            sessionId: this.sessionId,
            tool: tc.name,
            error: errorMsg,
          });
          const errorResult = JSON.stringify({ error: errorMsg });

          yield { type: "tool_result", data: JSON.stringify({ tool: tc.name, error: errorMsg }) };

          const toolMsg: ChatMessage = { role: "tool", content: errorResult, toolCallId: tc.id };
          this.messages.push(toolMsg);
          this.persistMessage(toolMsg);
        }
      }

      yield { type: "done", data: "" };
    }

    logger.warn("Max tool iterations exceeded", { sessionId: this.sessionId });
    const tooManyError: StreamErrorData = {
      message: "Too many tool call iterations",
      category: "unknown",
      retryable: true,
    };
    yield { type: "error", data: JSON.stringify(tooManyError) };
  }

  /**
   * Silently review the conversation and extract memories worth saving.
   * Fire-and-forget — errors are logged but not surfaced to the user.
   */
  async extractMemories(): Promise<void> {
    // Skip short conversations
    const userMessages = this.messages.filter((m) => m.role === "user");
    if (userMessages.length < 2) return;

    const extractPrompt =
      "Review this conversation. If the user shared any preferences, habits, schedules, work patterns, or important context worth remembering for future conversations, use save_memory to store them. Use recall_memories first to avoid duplicates. If nothing is worth saving, do nothing. Do not respond with text.";

    this.messages.push({ role: "user", content: extractPrompt });

    try {
      for await (const _event of this.executeRun()) {
        // Consume all events silently
      }
    } catch (err) {
      logger.warn("Memory extraction failed", {
        sessionId: this.sessionId,
        error: err instanceof Error ? err.message : String(err),
      });
    }

    // Remove the extraction prompt and any responses from the persisted history
    // (we don't want this meta-conversation visible to the user)
  }

  private persistMessage(msg: ChatMessage): void {
    if (!this.queries) return;
    this.queries.insertChatMessage({
      sessionId: this.sessionId,
      role: msg.role,
      content: msg.content,
      toolCallId: msg.toolCallId ?? null,
      toolCalls: msg.toolCalls ? JSON.stringify(msg.toolCalls) : null,
      createdAt: new Date().toISOString(),
    });
  }
}

export class ChatManager {
  private session: ChatSession | null = null;

  getOrCreateSession(
    executor: LLMExecutor,
    services: ToolContext,
    options: {
      queries?: IStorage;
      contextBlock?: string;
      pipeline?: LLMPipeline;
      toolRegistry: ToolRegistry;
      model?: string;
      providerName?: string;
    },
  ): ChatSession {
    if (!this.session) {
      logger.info("Creating chat session");
      const systemMessage = buildSystemMessage(
        services,
        options.contextBlock,
        options.providerName,
      );
      this.session = new ChatSession(executor, services, systemMessage, options);
    }
    return this.session;
  }

  getSession(): ChatSession | null {
    return this.session;
  }

  /** Replace the current session (e.g., when restoring a persisted session). */
  setSession(session: ChatSession | null): void {
    this.session = session;
  }

  clearSession(queries?: IStorage): void {
    logger.info("Chat session cleared", { sessionId: this.session?.sessionId });
    if (this.session && queries) {
      queries.deleteChatSession(this.session.sessionId);
    }
    this.session = null;
  }

  resetWithProvider(
    executor: LLMExecutor,
    services: ToolContext,
    options: {
      queries?: IStorage;
      pipeline?: LLMPipeline;
      toolRegistry: ToolRegistry;
      model?: string;
      providerName?: string;
    },
  ): ChatSession {
    this.session = null;
    return this.getOrCreateSession(executor, services, options);
  }

  restoreSession(
    executor: LLMExecutor,
    services: ToolContext,
    queries: IStorage,
    options: {
      pipeline?: LLMPipeline;
      toolRegistry: ToolRegistry;
      model?: string;
      providerName?: string;
    },
  ): ChatSession | null {
    const latest = queries.getLatestSessionId();
    if (!latest) {
      logger.debug("No previous session to restore");
      return null;
    }

    const rows = queries.listChatMessages(latest.sessionId);
    if (rows.length === 0) return null;

    const systemMessage = buildSystemMessage(services, "", options.providerName);
    const session = new ChatSession(executor, services, systemMessage, {
      sessionId: latest.sessionId,
      queries,
      ...options,
    });

    const restoredMessages: ChatMessage[] = [];
    for (const row of rows) {
      if (row.role === "system") continue;
      const msg: ChatMessage = {
        role: row.role as ChatMessage["role"],
        content: row.content,
        ...(row.toolCallId ? { toolCallId: row.toolCallId } : {}),
        ...(row.toolCalls ? { toolCalls: JSON.parse(row.toolCalls) } : {}),
      };
      restoredMessages.push(msg);
    }

    session.restoreMessages(restoredMessages);
    this.session = session;
    logger.info("Chat session restored", {
      sessionId: latest.sessionId,
      messageCount: rows.length,
    });
    return session;
  }

  /** @deprecated Use the standalone buildSystemMessage from chat-prompts.ts */
  buildSystemMessage(services: ToolContext, contextBlock = "", providerName = ""): ChatMessage {
    return buildSystemMessage(services, contextBlock, providerName);
  }
}

// ── Re-exports for backward compatibility ──
export { gatherContext } from "./chat-context.js";
export { buildSystemMessage, buildFullPrompt, buildCompactPrompt } from "./chat-prompts.js";
export type { ToolContext as ToolServices } from "./tools/types.js";
