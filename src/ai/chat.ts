import type { AIProvider } from "./provider.js";
import type { ChatMessage, StreamEvent } from "./types.js";
import { getToolDefinitions, executeTool, type ToolServices } from "./tools.js";

export class ChatSession {
  private messages: ChatMessage[] = [];
  private provider: AIProvider;
  private services: ToolServices;

  constructor(provider: AIProvider, services: ToolServices, systemMessage: ChatMessage) {
    this.provider = provider;
    this.services = services;
    this.messages.push(systemMessage);
  }

  addUserMessage(content: string): void {
    this.messages.push({ role: "user", content });
  }

  getMessages(): ChatMessage[] {
    return this.messages.filter((m) => m.role !== "system");
  }

  async *run(): AsyncIterable<StreamEvent> {
    const tools = getToolDefinitions();
    let maxIterations = 10; // Safety limit for tool call loops

    while (maxIterations-- > 0) {
      let fullContent = "";
      let toolCalls: { id: string; name: string; arguments: string }[] | null = null;

      // Stream from provider
      for await (const event of this.provider.streamChat(this.messages, tools)) {
        if (event.type === "token") {
          fullContent += event.data;
          yield event;
        } else if (event.type === "tool_call") {
          toolCalls = JSON.parse(event.data);
        } else if (event.type === "done") {
          // No tool calls — we're done
        } else if (event.type === "error") {
          yield event;
          return;
        }
      }

      // If no tool calls, append assistant message and finish
      if (!toolCalls || toolCalls.length === 0) {
        this.messages.push({ role: "assistant", content: fullContent });
        yield { type: "done", data: "" };
        return;
      }

      // Append assistant message with tool calls
      this.messages.push({
        role: "assistant",
        content: fullContent,
        toolCalls,
      });

      // Execute each tool call
      for (const tc of toolCalls) {
        try {
          const args = JSON.parse(tc.arguments);
          const result = await executeTool(tc.name, args, this.services);

          yield { type: "tool_result", data: JSON.stringify({ tool: tc.name, result }) };

          this.messages.push({
            role: "tool",
            content: result,
            toolCallId: tc.id,
          });
        } catch (err: unknown) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          const errorResult = JSON.stringify({ error: errorMsg });

          yield { type: "tool_result", data: JSON.stringify({ tool: tc.name, error: errorMsg }) };

          this.messages.push({
            role: "tool",
            content: errorResult,
            toolCallId: tc.id,
          });
        }
      }

      // Loop: re-call provider with tool results appended
    }

    yield { type: "error", data: "Too many tool call iterations" };
  }
}

export class ChatManager {
  private session: ChatSession | null = null;

  getOrCreateSession(provider: AIProvider, services: ToolServices): ChatSession {
    if (!this.session) {
      const systemMessage = this.buildSystemMessage(services);
      this.session = new ChatSession(provider, services, systemMessage);
    }
    return this.session;
  }

  getSession(): ChatSession | null {
    return this.session;
  }

  clearSession(): void {
    this.session = null;
  }

  resetWithProvider(provider: AIProvider, services: ToolServices): ChatSession {
    this.session = null;
    return this.getOrCreateSession(provider, services);
  }

  private buildSystemMessage(_services: ToolServices): ChatMessage {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    return {
      role: "system",
      content: `You are Docket's AI assistant. You help users manage their tasks efficiently.

Current date and time: ${dateStr}, ${timeStr}

You can:
- Create, list, update, complete, and delete tasks
- Help users organize their work
- Suggest priorities and due dates

Guidelines:
- Be concise and helpful
- When listing tasks, format them clearly
- When creating tasks, confirm what was created
- Use the tools available to you to perform actions
- If a user asks about their tasks, use list_tasks to check first
- Dates should be in ISO 8601 format when calling tools`,
    };
  }
}
