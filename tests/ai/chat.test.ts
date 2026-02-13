import { describe, it, expect, vi } from "vitest";
import { ChatSession, ChatManager } from "../../src/ai/chat.js";
import type { AIProvider } from "../../src/ai/provider.js";
import type { ChatMessage, ChatResponse, StreamEvent } from "../../src/ai/types.js";
import { createTestServices } from "../integration/helpers.js";

function createMockProvider(responses: Array<{ content: string; toolCalls?: ChatResponse["toolCalls"] }>): AIProvider {
  let callCount = 0;
  return {
    chat: vi.fn(),
    async *streamChat(): AsyncIterable<StreamEvent> {
      const response = responses[callCount++];
      if (!response) return;

      if (response.content) {
        yield { type: "token", data: response.content };
      }
      if (response.toolCalls?.length) {
        yield { type: "tool_call", data: JSON.stringify(response.toolCalls) };
      } else {
        yield { type: "done", data: "" };
      }
    },
  };
}

describe("ChatSession", () => {
  it("tracks message history", () => {
    const provider = createMockProvider([]);
    const { taskService, projectService } = createTestServices();
    const session = new ChatSession(
      provider,
      { taskService, projectService },
      { role: "system", content: "You are helpful." },
    );

    session.addUserMessage("Hello");
    const messages = session.getMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].role).toBe("user");
    expect(messages[0].content).toBe("Hello");
  });

  it("appends assistant response after run", async () => {
    const provider = createMockProvider([{ content: "Hello! How can I help?" }]);
    const { taskService, projectService } = createTestServices();
    const session = new ChatSession(
      provider,
      { taskService, projectService },
      { role: "system", content: "You are helpful." },
    );

    session.addUserMessage("Hi");
    const events: StreamEvent[] = [];
    for await (const event of session.run()) {
      events.push(event);
    }

    expect(events.some((e) => e.type === "token")).toBe(true);
    expect(events.some((e) => e.type === "done")).toBe(true);

    const messages = session.getMessages();
    expect(messages).toHaveLength(2);
    expect(messages[1].role).toBe("assistant");
    expect(messages[1].content).toBe("Hello! How can I help?");
  });

  it("handles tool call loop", async () => {
    const { taskService, projectService } = createTestServices();

    const provider = createMockProvider([
      // First response: tool call
      {
        content: "",
        toolCalls: [
          {
            id: "call_1",
            name: "create_task",
            arguments: JSON.stringify({ title: "Buy milk" }),
          },
        ],
      },
      // Second response: final text
      { content: "I created the task for you!" },
    ]);

    const session = new ChatSession(
      provider,
      { taskService, projectService },
      { role: "system", content: "You are helpful." },
    );

    session.addUserMessage("Create a task: buy milk");
    const events: StreamEvent[] = [];
    for await (const event of session.run()) {
      events.push(event);
    }

    // Should have tool_result and token events
    expect(events.some((e) => e.type === "tool_result")).toBe(true);
    expect(events.some((e) => e.type === "token")).toBe(true);

    // Task should actually be created
    const tasks = await taskService.list();
    expect(tasks.some((t) => t.title === "Buy milk")).toBe(true);
  });
});

describe("ChatManager", () => {
  it("creates and reuses session", () => {
    const manager = new ChatManager();
    const provider = createMockProvider([]);
    const { taskService, projectService } = createTestServices();
    const services = { taskService, projectService };

    const s1 = manager.getOrCreateSession(provider, services);
    const s2 = manager.getOrCreateSession(provider, services);
    expect(s1).toBe(s2);
  });

  it("clearSession resets session", () => {
    const manager = new ChatManager();
    const provider = createMockProvider([]);
    const { taskService, projectService } = createTestServices();
    const services = { taskService, projectService };

    manager.getOrCreateSession(provider, services);
    manager.clearSession();
    expect(manager.getSession()).toBeNull();
  });

  it("resetWithProvider creates new session", () => {
    const manager = new ChatManager();
    const provider1 = createMockProvider([]);
    const provider2 = createMockProvider([]);
    const { taskService, projectService } = createTestServices();
    const services = { taskService, projectService };

    const s1 = manager.getOrCreateSession(provider1, services);
    const s2 = manager.resetWithProvider(provider2, services);
    expect(s1).not.toBe(s2);
  });
});
