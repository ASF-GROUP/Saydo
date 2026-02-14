import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FocusMode } from "../../src/ui/components/FocusMode.js";
import type { Task } from "../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "t1",
    title: "Test Task",
    description: null,
    status: "pending",
    priority: null,
    dueDate: null,
    dueTime: false,
    completedAt: null,
    projectId: null,
    recurrence: null,
    parentId: null,
    tags: [],
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("FocusMode", () => {
  it("renders current task title", () => {
    const tasks = [makeTask({ title: "My Important Task" })];
    render(<FocusMode tasks={tasks} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("My Important Task")).toBeDefined();
  });

  it("shows progress indicator", () => {
    const tasks = [
      makeTask({ id: "t1", title: "Task 1" }),
      makeTask({ id: "t2", title: "Task 2" }),
      makeTask({ id: "t3", title: "Task 3" }),
    ];
    render(<FocusMode tasks={tasks} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("1/3")).toBeDefined();
  });

  it("shows empty state when no tasks", () => {
    render(<FocusMode tasks={[]} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("All done!")).toBeDefined();
  });

  it("calls onClose when Escape is pressed", () => {
    const onClose = vi.fn();
    const tasks = [makeTask()];
    render(<FocusMode tasks={tasks} onComplete={vi.fn()} onClose={onClose} />);

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onComplete when Space is pressed", () => {
    const onComplete = vi.fn();
    const tasks = [makeTask({ id: "t1" })];
    render(<FocusMode tasks={tasks} onComplete={onComplete} onClose={vi.fn()} />);

    fireEvent.keyDown(document, { key: " " });
    expect(onComplete).toHaveBeenCalledWith("t1");
  });

  it("shows priority badge when task has priority", () => {
    const tasks = [makeTask({ priority: 1 })];
    render(<FocusMode tasks={tasks} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("P1")).toBeDefined();
  });

  it("shows tags", () => {
    const tasks = [
      makeTask({
        tags: [
          { id: "tag1", name: "urgent", color: "#f00" },
          { id: "tag2", name: "work", color: "#0f0" },
        ],
      }),
    ];
    render(<FocusMode tasks={tasks} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("#urgent")).toBeDefined();
    expect(screen.getByText("#work")).toBeDefined();
  });

  it("shows keyboard hints", () => {
    const tasks = [makeTask()];
    render(<FocusMode tasks={tasks} onComplete={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Space")).toBeDefined();
    expect(screen.getByText("Esc")).toBeDefined();
  });
});
