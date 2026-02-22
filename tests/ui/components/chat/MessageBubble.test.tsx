import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  AlertTriangle: (props: any) => <svg data-testid="alert-icon" {...props} />,
  RotateCcw: (props: any) => <svg data-testid="retry-icon" {...props} />,
  Bot: (props: any) => <svg data-testid="bot-icon" {...props} />,
}));

vi.mock("../../../../src/ui/components/chat/ToolCallBadge.js", () => ({
  ToolCallBadge: ({ name }: any) => <span data-testid="tool-badge">{name}</span>,
}));

vi.mock("../../../../src/ui/components/chat/MarkdownMessage.js", () => ({
  MarkdownMessage: ({ content }: any) => <div data-testid="markdown-message">{content}</div>,
}));

vi.mock("../../../../src/ui/components/chat/ChatToolResultCard.js", () => ({
  ChatToolResultCard: () => <div data-testid="tool-result-card" />,
}));

vi.mock("../../../../src/ui/components/ChatTaskCard.js", () => ({
  ChatTaskCard: ({ task }: any) => <div data-testid="task-card">{task.title}</div>,
}));

vi.mock("../../../../src/ui/components/chat/MessageActions.js", () => ({
  MessageActions: () => null,
}));

import { MessageBubble } from "../../../../src/ui/components/chat/MessageBubble.js";
import type { AIChatMessage } from "../../../../src/ui/api/index.js";

function makeMessage(overrides: Partial<AIChatMessage> = {}): AIChatMessage {
  return {
    role: "assistant",
    content: "Hello!",
    isError: false,
    ...overrides,
  } as AIChatMessage;
}

describe("MessageBubble", () => {
  it("renders user message with correct styling", () => {
    const msg = makeMessage({ role: "user", content: "Hi there" });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText("Hi there")).toBeDefined();
  });

  it("renders assistant message with bot icon", () => {
    const msg = makeMessage({ role: "assistant", content: "Hi from AI" });
    render(<MessageBubble message={msg} />);
    expect(screen.getByTestId("bot-icon")).toBeDefined();
    expect(screen.getByText("Hi from AI")).toBeDefined();
  });

  it("renders error message with alert icon", () => {
    const msg = makeMessage({ isError: true, content: "Something went wrong" });
    render(<MessageBubble message={msg} />);
    expect(screen.getByTestId("alert-icon")).toBeDefined();
    expect(screen.getByText("Something went wrong")).toBeDefined();
  });

  it("shows retry button for error messages when onRetry provided", () => {
    const onRetry = vi.fn();
    const msg = makeMessage({ isError: true, content: "Error" });
    render(<MessageBubble message={msg} onRetry={onRetry} />);
    const retryBtn = screen.getByText("Retry");
    expect(retryBtn).toBeDefined();
    fireEvent.click(retryBtn);
    expect(onRetry).toHaveBeenCalled();
  });

  it("does not show retry button when onRetry is undefined", () => {
    const msg = makeMessage({ isError: true, content: "Error" });
    render(<MessageBubble message={msg} />);
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("returns null for tool role messages", () => {
    const msg = makeMessage({ role: "tool" as any });
    const { container } = render(<MessageBubble message={msg} />);
    expect(container.innerHTML).toBe("");
  });

  it("shows error hint for auth errors", () => {
    const msg = makeMessage({
      isError: true,
      content: "Unauthorized",
      errorCategory: "auth",
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByText("Check your API key in Settings.")).toBeDefined();
  });

  it("renders tool call badges when present", () => {
    const msg = makeMessage({
      content: "Done",
      toolCalls: [{ id: "tc1", name: "create_task", arguments: "{}" }],
    });
    render(<MessageBubble message={msg} />);
    expect(screen.getByTestId("tool-badge")).toBeDefined();
  });
});
