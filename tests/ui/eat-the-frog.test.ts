import { describe, it, expect } from "vitest";
import { selectFrogTask } from "../../src/ui/components/EatTheFrog.js";
import type { Task } from "../../src/core/types.js";

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

describe("selectFrogTask", () => {
  it("returns null when no tasks have dread levels", () => {
    const tasks = [
      makeTask({ id: "1", title: "No dread" }),
      makeTask({ id: "2", title: "Also no dread" }),
    ];
    expect(selectFrogTask(tasks)).toBeNull();
  });

  it("returns null for an empty task list", () => {
    expect(selectFrogTask([])).toBeNull();
  });

  it("selects the highest dread level task", () => {
    const tasks = [
      makeTask({ id: "1", title: "Low dread", dreadLevel: 2 }),
      makeTask({ id: "2", title: "High dread", dreadLevel: 5 }),
      makeTask({ id: "3", title: "Medium dread", dreadLevel: 3 }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("2");
  });

  it("ignores completed tasks", () => {
    const tasks = [
      makeTask({ id: "1", title: "Completed", dreadLevel: 5, status: "completed" }),
      makeTask({ id: "2", title: "Pending", dreadLevel: 2 }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("2");
  });

  it("ignores cancelled tasks", () => {
    const tasks = [
      makeTask({ id: "1", title: "Cancelled", dreadLevel: 5, status: "cancelled" }),
      makeTask({ id: "2", title: "Pending", dreadLevel: 1 }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("2");
  });

  it("tiebreaks by earliest due date", () => {
    const tasks = [
      makeTask({ id: "1", title: "Later", dreadLevel: 4, dueDate: "2026-01-02T10:00:00Z" }),
      makeTask({ id: "2", title: "Earlier", dreadLevel: 4, dueDate: "2026-01-01T08:00:00Z" }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("2");
  });

  it("tasks with due date win over tasks without when dread is equal", () => {
    const tasks = [
      makeTask({ id: "1", title: "No date", dreadLevel: 3 }),
      makeTask({ id: "2", title: "Has date", dreadLevel: 3, dueDate: "2026-01-01T08:00:00Z" }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("2");
  });

  it("tiebreaks alphabetically when dread and due date are equal", () => {
    const tasks = [
      makeTask({ id: "1", title: "Zeta task", dreadLevel: 3, dueDate: "2026-01-01T08:00:00Z" }),
      makeTask({ id: "2", title: "Alpha task", dreadLevel: 3, dueDate: "2026-01-01T08:00:00Z" }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("2");
  });

  it("ignores tasks with dreadLevel 0 or null", () => {
    const tasks = [
      makeTask({ id: "1", title: "Zero dread", dreadLevel: 0 }),
      makeTask({ id: "2", title: "Null dread", dreadLevel: null }),
      makeTask({ id: "3", title: "Has dread", dreadLevel: 1 }),
    ];
    const frog = selectFrogTask(tasks);
    expect(frog).not.toBeNull();
    expect(frog!.id).toBe("3");
  });
});
