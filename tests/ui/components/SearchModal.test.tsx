import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

vi.mock("lucide-react", () => ({
  Search: (props: any) => <svg data-testid="search-icon" {...props} />,
  X: (props: any) => <svg data-testid="x-icon" {...props} />,
  FileText: (props: any) => <svg data-testid="file-icon" {...props} />,
  Hash: (props: any) => <svg data-testid="hash-icon" {...props} />,
  Calendar: (props: any) => <svg data-testid="cal-icon" {...props} />,
  Flag: (props: any) => <svg data-testid="flag-icon" {...props} />,
}));

import { SearchModal } from "../../../src/ui/components/SearchModal.js";
import type { Task, Project } from "../../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Buy groceries",
    description: null,
    status: "pending",
    priority: null,
    dueDate: null,
    dueTime: false,
    completedAt: null,
    projectId: null,
    recurrence: null,
    parentId: null,
    remindAt: null,
    tags: [],
    sortOrder: 0,
    createdAt: "2026-02-20T10:00:00.000Z",
    updatedAt: "2026-02-20T10:00:00.000Z",
    ...overrides,
  };
}

describe("SearchModal", () => {
  const tasks = [
    makeTask({ id: "t1", title: "Buy groceries" }),
    makeTask({ id: "t2", title: "Write report" }),
    makeTask({ id: "t3", title: "Buy milk", tags: [{ id: "tag-1", name: "shop", color: "" }] }),
  ];
  const projects: Project[] = [];
  const onClose = vi.fn();
  const onSelectTask = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when not open", () => {
    const { container } = render(
      <SearchModal
        isOpen={false}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders search dialog when open", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByPlaceholderText("Search tasks...")).toBeTruthy();
  });

  it("shows no results initially (empty query)", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );
    // No results shown until user types
    expect(screen.queryByText("Buy groceries")).toBeNull();
  });

  it("filters tasks by search query", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search tasks..."), {
      target: { value: "buy" },
    });

    expect(screen.getByText("Buy groceries")).toBeTruthy();
    expect(screen.getByText("Buy milk")).toBeTruthy();
    expect(screen.queryByText("Write report")).toBeNull();
  });

  it("shows no results message when nothing matches", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search tasks..."), {
      target: { value: "zzzznothing" },
    });

    expect(screen.getByText("No tasks found")).toBeTruthy();
  });

  it("navigates to task on click and closes", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search tasks..."), {
      target: { value: "report" },
    });

    fireEvent.click(screen.getByText("Write report"));
    expect(onSelectTask).toHaveBeenCalledWith("t2");
    expect(onClose).toHaveBeenCalled();
  });

  it("closes on Escape key", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    const container = screen.getByRole("dialog").querySelector("div[class*='bg-surface']")!;
    fireEvent.keyDown(container, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("closes when clicking backdrop", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    fireEvent.click(screen.getByRole("dialog"));
    expect(onClose).toHaveBeenCalled();
  });

  it("searches by tag name", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText("Search tasks..."), {
      target: { value: "shop" },
    });

    expect(screen.getByText("Buy milk")).toBeTruthy();
    expect(screen.queryByText("Buy groceries")).toBeNull();
  });

  it("navigates with arrow keys and enter", () => {
    render(
      <SearchModal
        isOpen={true}
        onClose={onClose}
        tasks={tasks}
        projects={projects}
        onSelectTask={onSelectTask}
      />,
    );

    const input = screen.getByPlaceholderText("Search tasks...");
    fireEvent.change(input, { target: { value: "buy" } });

    const container = screen.getByRole("dialog").querySelector("div[class*='bg-surface']")!;

    // First result is selected by default, ArrowDown to second
    fireEvent.keyDown(container, { key: "ArrowDown" });
    fireEvent.keyDown(container, { key: "Enter" });

    // Should select second matching result (Buy milk)
    expect(onSelectTask).toHaveBeenCalledWith("t3");
  });
});
