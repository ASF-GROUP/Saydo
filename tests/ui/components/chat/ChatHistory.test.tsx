import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => ({
  Plus: (props: any) => <svg data-testid="plus-icon" {...props} />,
  Trash2: (props: any) => <svg data-testid="trash-icon" {...props} />,
  MessageSquare: (props: any) => <svg data-testid="msg-icon" {...props} />,
  Check: (props: any) => <svg data-testid="check-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
  Pencil: (props: any) => <svg data-testid="pencil-icon" {...props} />,
}));

import { ChatHistory } from "../../../../src/ui/components/chat/ChatHistory.js";
import type { ChatSessionInfo } from "../../../../src/ui/api/index.js";

const now = new Date().toISOString();

const sessions: ChatSessionInfo[] = [
  { sessionId: "s1", title: "First Chat", messageCount: 5, createdAt: now },
  { sessionId: "s2", title: "Second Chat", messageCount: 3, createdAt: now },
];

describe("ChatHistory", () => {
  const defaultProps = {
    sessions,
    activeSessionId: "s1",
    onNewChat: vi.fn(),
    onSwitchSession: vi.fn(),
    onDeleteSession: vi.fn(),
    onRenameSession: vi.fn(),
    mode: "panel" as const,
  };

  it("renders nothing when sessions is empty", () => {
    const { container } = render(<ChatHistory {...defaultProps} sessions={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders session titles", () => {
    render(<ChatHistory {...defaultProps} />);
    expect(screen.getByText("First Chat")).toBeDefined();
    expect(screen.getByText("Second Chat")).toBeDefined();
  });

  it("renders History header", () => {
    render(<ChatHistory {...defaultProps} />);
    expect(screen.getByText("History")).toBeDefined();
  });

  it("shows message count for sessions", () => {
    render(<ChatHistory {...defaultProps} />);
    expect(screen.getByText(/5 msgs/)).toBeDefined();
    expect(screen.getByText(/3 msgs/)).toBeDefined();
  });

  it("calls onNewChat when new chat button is clicked", () => {
    render(<ChatHistory {...defaultProps} />);
    const newChatButton = screen.getByTitle("New chat");
    fireEvent.click(newChatButton);
    expect(defaultProps.onNewChat).toHaveBeenCalled();
  });

  it("calls onSwitchSession when a session is clicked", () => {
    render(<ChatHistory {...defaultProps} />);
    // Click on the second session
    fireEvent.click(screen.getByText("Second Chat"));
    expect(defaultProps.onSwitchSession).toHaveBeenCalledWith("s2");
  });
});
