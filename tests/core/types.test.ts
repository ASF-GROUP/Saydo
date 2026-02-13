import { describe, it, expect } from "vitest";
import { CreateTaskInput, TaskStatus, Priority } from "../../src/core/types.js";

describe("TaskStatus schema", () => {
  it("accepts 'pending'", () => {
    expect(TaskStatus.parse("pending")).toBe("pending");
  });

  it("accepts 'completed'", () => {
    expect(TaskStatus.parse("completed")).toBe("completed");
  });

  it("accepts 'cancelled'", () => {
    expect(TaskStatus.parse("cancelled")).toBe("cancelled");
  });

  it("rejects invalid status", () => {
    expect(() => TaskStatus.parse("done")).toThrow();
    expect(() => TaskStatus.parse("")).toThrow();
    expect(() => TaskStatus.parse(123)).toThrow();
  });
});

describe("Priority schema", () => {
  it("accepts 1-4", () => {
    expect(Priority.parse(1)).toBe(1);
    expect(Priority.parse(2)).toBe(2);
    expect(Priority.parse(3)).toBe(3);
    expect(Priority.parse(4)).toBe(4);
  });

  it("accepts null", () => {
    expect(Priority.parse(null)).toBeNull();
  });

  it("rejects 0 and 5", () => {
    expect(() => Priority.parse(0)).toThrow();
    expect(() => Priority.parse(5)).toThrow();
  });

  it("rejects floats", () => {
    expect(() => Priority.parse(1.5)).toThrow();
  });

  it("rejects negative numbers", () => {
    expect(() => Priority.parse(-1)).toThrow();
  });
});

describe("CreateTaskInput schema", () => {
  it("accepts minimal valid input", () => {
    const result = CreateTaskInput.parse({ title: "Buy milk" });
    expect(result.title).toBe("Buy milk");
    expect(result.tags).toEqual([]);
    expect(result.dueTime).toBe(false);
  });

  it("accepts full input", () => {
    const result = CreateTaskInput.parse({
      title: "Buy milk",
      description: "From the store",
      priority: 1,
      dueDate: "2025-01-15T15:00:00Z",
      dueTime: true,
      projectId: "proj-1",
      recurrence: "daily",
      tags: ["groceries", "urgent"],
    });
    expect(result.title).toBe("Buy milk");
    expect(result.priority).toBe(1);
    expect(result.tags).toEqual(["groceries", "urgent"]);
  });

  it("rejects empty title", () => {
    expect(() => CreateTaskInput.parse({ title: "" })).toThrow();
  });

  it("rejects title over 500 characters", () => {
    expect(() => CreateTaskInput.parse({ title: "a".repeat(501) })).toThrow();
  });

  it("accepts title at 500 characters", () => {
    const result = CreateTaskInput.parse({ title: "a".repeat(500) });
    expect(result.title).toHaveLength(500);
  });

  it("rejects description over 10000 characters", () => {
    expect(() => CreateTaskInput.parse({ title: "t", description: "a".repeat(10001) })).toThrow();
  });

  it("accepts null description", () => {
    const result = CreateTaskInput.parse({ title: "t", description: null });
    expect(result.description).toBeNull();
  });

  it("rejects invalid priority", () => {
    expect(() => CreateTaskInput.parse({ title: "t", priority: 5 })).toThrow();
    expect(() => CreateTaskInput.parse({ title: "t", priority: 0 })).toThrow();
  });

  it("accepts null priority", () => {
    const result = CreateTaskInput.parse({ title: "t", priority: null });
    expect(result.priority).toBeNull();
  });

  it("rejects invalid dueDate format", () => {
    expect(() => CreateTaskInput.parse({ title: "t", dueDate: "not-a-date" })).toThrow();
  });

  it("defaults tags to empty array", () => {
    const result = CreateTaskInput.parse({ title: "t" });
    expect(result.tags).toEqual([]);
  });
});
