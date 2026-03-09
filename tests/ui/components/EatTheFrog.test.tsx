import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { EatTheFrog } from "../../../src/ui/components/EatTheFrog.js";
import type { Task } from "../../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? "task-1",
    title: overrides.title ?? "Test task",
    description: null,
    status: overrides.status ?? "pending",
    priority: null,
    dueDate: overrides.dueDate ?? null,
    dueTime: false,
    completedAt: null,
    projectId: null,
    recurrence: null,
    parentId: null,
    remindAt: null,
    estimatedMinutes: null,
    actualMinutes: null,
    deadline: null,
    isSomeday: false,
    sectionId: null,
    dreadLevel: overrides.dreadLevel ?? null,
    tags: [],
    sortOrder: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

describe("EatTheFrog component", () => {
  it("renders nothing when no tasks have dread levels", () => {
    const { container } = render(
      <EatTheFrog
        tasks={[makeTask({ title: "Normal task" })]}
        onToggleTask={vi.fn()}
        onSelectTask={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });

  it("renders the frog card when a task has a dread level", () => {
    render(
      <EatTheFrog
        tasks={[makeTask({ title: "Scary task", dreadLevel: 4 })]}
        onToggleTask={vi.fn()}
        onSelectTask={vi.fn()}
      />,
    );
    expect(screen.getByText("Scary task")).toBeDefined();
    expect(screen.getByText("Eat this frog first!")).toBeDefined();
  });

  it("shows the highest dread task when multiple exist", () => {
    render(
      <EatTheFrog
        tasks={[
          makeTask({ id: "1", title: "Low dread", dreadLevel: 1 }),
          makeTask({ id: "2", title: "Max dread", dreadLevel: 5 }),
        ]}
        onToggleTask={vi.fn()}
        onSelectTask={vi.fn()}
      />,
    );
    expect(screen.getByText("Max dread")).toBeDefined();
  });

  it("has a Done button", () => {
    render(
      <EatTheFrog
        tasks={[makeTask({ title: "Do it", dreadLevel: 3 })]}
        onToggleTask={vi.fn()}
        onSelectTask={vi.fn()}
      />,
    );
    expect(screen.getByText("Done")).toBeDefined();
  });

  it("renders nothing for empty task list", () => {
    const { container } = render(
      <EatTheFrog tasks={[]} onToggleTask={vi.fn()} onSelectTask={vi.fn()} />,
    );
    expect(container.innerHTML).toBe("");
  });
});
