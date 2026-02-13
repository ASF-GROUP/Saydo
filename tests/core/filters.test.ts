import { describe, it, expect } from "vitest";
import { filterTasks } from "../../src/core/filters.js";
import type { Task } from "../../src/core/types.js";

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "test-1",
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
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-01-15T10:00:00Z",
    ...overrides,
  };
}

const TASKS: Task[] = [
  makeTask({
    id: "1",
    title: "Buy milk",
    status: "pending",
    priority: 1,
    projectId: "proj-1",
    tags: [{ id: "t1", name: "groceries", color: "#fff" }],
  }),
  makeTask({
    id: "2",
    title: "Review PR",
    status: "pending",
    priority: 2,
    projectId: "proj-2",
    tags: [{ id: "t2", name: "dev", color: "#fff" }],
    dueDate: "2025-01-16T00:00:00Z",
  }),
  makeTask({
    id: "3",
    title: "Clean desk",
    status: "completed",
    priority: 3,
    completedAt: "2025-01-15T12:00:00Z",
  }),
  makeTask({
    id: "4",
    title: "Write docs",
    status: "pending",
    description: "Update the README with new features",
    tags: [{ id: "t2", name: "dev", color: "#fff" }],
    dueDate: "2025-01-20T00:00:00Z",
  }),
  makeTask({ id: "5", title: "Cancel subscription", status: "cancelled" }),
];

describe("filterTasks", () => {
  it("returns all tasks with empty filter", () => {
    expect(filterTasks(TASKS, {})).toHaveLength(5);
  });

  it("filters by status", () => {
    const pending = filterTasks(TASKS, { status: "pending" });
    expect(pending).toHaveLength(3);
    expect(pending.every((t) => t.status === "pending")).toBe(true);

    const completed = filterTasks(TASKS, { status: "completed" });
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe("3");

    const cancelled = filterTasks(TASKS, { status: "cancelled" });
    expect(cancelled).toHaveLength(1);
    expect(cancelled[0].id).toBe("5");
  });

  it("filters by projectId", () => {
    const result = filterTasks(TASKS, { projectId: "proj-1" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by tag", () => {
    const result = filterTasks(TASKS, { tag: "dev" });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(["2", "4"]);
  });

  it("filters by priority", () => {
    const result = filterTasks(TASKS, { priority: 1 });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by dueBefore", () => {
    const result = filterTasks(TASKS, { dueBefore: "2025-01-17T00:00:00Z" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by dueAfter", () => {
    const result = filterTasks(TASKS, { dueAfter: "2025-01-17T00:00:00Z" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("filters by dueBefore and dueAfter (range)", () => {
    const result = filterTasks(TASKS, {
      dueAfter: "2025-01-15T00:00:00Z",
      dueBefore: "2025-01-21T00:00:00Z",
    });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(["2", "4"]);
  });

  it("excludes tasks with no dueDate when filtering by dueBefore", () => {
    const result = filterTasks(TASKS, { dueBefore: "2025-12-31T00:00:00Z" });
    // Only tasks with a dueDate that is before the cutoff
    expect(result.every((t) => t.dueDate !== null)).toBe(true);
  });

  it("filters by search (title)", () => {
    const result = filterTasks(TASKS, { search: "milk" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("1");
  });

  it("filters by search (case-insensitive)", () => {
    const result = filterTasks(TASKS, { search: "REVIEW" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("2");
  });

  it("filters by search (matches description)", () => {
    const result = filterTasks(TASKS, { search: "README" });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("4");
  });

  it("combines multiple filters", () => {
    const result = filterTasks(TASKS, { status: "pending", tag: "dev" });
    expect(result).toHaveLength(2);
    expect(result.map((t) => t.id).sort()).toEqual(["2", "4"]);
  });

  it("returns empty for impossible filter", () => {
    const result = filterTasks(TASKS, { status: "pending", priority: 3 });
    expect(result).toHaveLength(0);
  });

  it("handles empty task array", () => {
    expect(filterTasks([], { status: "pending" })).toEqual([]);
  });
});
