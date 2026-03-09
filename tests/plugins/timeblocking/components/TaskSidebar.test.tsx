import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DndContext } from "@dnd-kit/core";
import { TaskSidebar } from "../../../../src/plugins/builtin/timeblocking/components/TaskSidebar.js";
import type { Task } from "../../../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Write report",
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
    estimatedMinutes: null,
    actualMinutes: null,
    deadline: null,
    isSomeday: false,
    sectionId: null,
    tags: [],
    sortOrder: 0,
    createdAt: "2026-03-09T00:00:00Z",
    updatedAt: "2026-03-09T00:00:00Z",
    ...overrides,
  };
}

function renderSidebar(
  tasks: Task[] = [],
  scheduledTaskIds: Set<string> = new Set(),
  onTaskClick?: (taskId: string) => void,
) {
  return render(
    <DndContext>
      <TaskSidebar tasks={tasks} scheduledTaskIds={scheduledTaskIds} onTaskClick={onTaskClick} />
    </DndContext>,
  );
}

describe("TaskSidebar", () => {
  it("renders pending tasks", () => {
    renderSidebar([makeTask({ title: "Write report" })]);
    expect(screen.getByText("Write report")).toBeInTheDocument();
  });

  it("filters out completed tasks", () => {
    renderSidebar([
      makeTask({ id: "t1", title: "Done task", status: "completed" }),
      makeTask({ id: "t2", title: "Pending task", status: "pending" }),
    ]);
    expect(screen.queryByText("Done task")).not.toBeInTheDocument();
    expect(screen.getByText("Pending task")).toBeInTheDocument();
  });

  it("shows 'scheduled' badge for scheduled tasks", () => {
    renderSidebar(
      [makeTask({ id: "t1", title: "Scheduled task" })],
      new Set(["t1"]),
    );
    expect(screen.getByText("scheduled")).toBeInTheDocument();
  });

  it("shows empty state when no pending tasks", () => {
    renderSidebar([]);
    expect(screen.getByText("No pending tasks")).toBeInTheDocument();
  });

  it("shows estimated minutes when available", () => {
    renderSidebar([makeTask({ estimatedMinutes: 45 })]);
    expect(screen.getByText("45m")).toBeInTheDocument();
  });

  it("shows due date when available", () => {
    renderSidebar([makeTask({ dueDate: "2026-03-15" })]);
    expect(screen.getByText("Mar 15")).toBeInTheDocument();
  });

  it("shows header text", () => {
    renderSidebar();
    expect(screen.getByText("Tasks")).toBeInTheDocument();
    expect(screen.getByText("Drag to schedule")).toBeInTheDocument();
  });

  it("calls onTaskClick when a task is clicked", () => {
    const onTaskClick = vi.fn();
    renderSidebar([makeTask({ id: "t1", title: "Click me" })], new Set(), onTaskClick);
    fireEvent.click(screen.getByText("Click me"));
    expect(onTaskClick).toHaveBeenCalledWith("t1");
  });

  it("renders tasks correctly with groups", () => {
    const tasks = [
      makeTask({ id: "t1", title: "Overdue task", dueDate: "2026-01-01" }),
      makeTask({ id: "t2", title: "Today task", dueDate: "2026-03-09" }),
      makeTask({ id: "t3", title: "Unscheduled task" }),
    ];
    render(
      <DndContext>
        <TaskSidebar
          tasks={tasks}
          scheduledTaskIds={new Set()}
          groups={{
            overdue: [tasks[0]],
            today: [tasks[1]],
            unscheduled: [tasks[2]],
          }}
        />
      </DndContext>,
    );
    expect(screen.getByText("Overdue")).toBeInTheDocument();
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Unscheduled")).toBeInTheDocument();
    expect(screen.getByText("Overdue task")).toBeInTheDocument();
    expect(screen.getByText("Today task")).toBeInTheDocument();
    expect(screen.getByText("Unscheduled task")).toBeInTheDocument();
  });
});
