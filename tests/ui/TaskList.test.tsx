import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TaskList } from "../../src/ui/components/TaskList.js";
import type { Task } from "../../src/core/types.js";

function createTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "test-id-1",
    title: "Test task",
    description: null,
    status: "pending",
    priority: null,
    dueDate: null,
    dueTime: false,
    completedAt: null,
    projectId: null,
    recurrence: null,
    tags: [],
    sortOrder: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("TaskList", () => {
  it("renders tasks", () => {
    const tasks = [
      createTask({ id: "1", title: "Task one" }),
      createTask({ id: "2", title: "Task two" }),
    ];

    render(
      <TaskList tasks={tasks} onToggle={() => {}} onSelect={() => {}} selectedTaskId={null} />,
    );

    expect(screen.getByText("Task one")).toBeInTheDocument();
    expect(screen.getByText("Task two")).toBeInTheDocument();
  });

  it("shows empty message when no tasks", () => {
    render(
      <TaskList
        tasks={[]}
        onToggle={() => {}}
        onSelect={() => {}}
        selectedTaskId={null}
        emptyMessage="Nothing here!"
      />,
    );

    expect(screen.getByText("Nothing here!")).toBeInTheDocument();
  });

  it("shows default empty message", () => {
    render(<TaskList tasks={[]} onToggle={() => {}} onSelect={() => {}} selectedTaskId={null} />);

    expect(screen.getByText("No tasks yet. Add one above!")).toBeInTheDocument();
  });

  it("calls onSelect when a task is clicked", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const tasks = [createTask({ id: "task-1", title: "Click me" })];

    render(
      <TaskList tasks={tasks} onToggle={() => {}} onSelect={onSelect} selectedTaskId={null} />,
    );

    await user.click(screen.getByText("Click me"));
    expect(onSelect).toHaveBeenCalledWith("task-1");
  });

  it("highlights the selected task", () => {
    const tasks = [
      createTask({ id: "1", title: "Selected task" }),
      createTask({ id: "2", title: "Other task" }),
    ];

    const { container } = render(
      <TaskList tasks={tasks} onToggle={() => {}} onSelect={() => {}} selectedTaskId="1" />,
    );

    // The selected task's container should have the blue ring class
    const selectedItem = container.querySelector(".ring-1");
    expect(selectedItem).toBeInTheDocument();
    expect(selectedItem!.textContent).toContain("Selected task");
  });
});
