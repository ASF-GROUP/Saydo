import { describe, it, expect, beforeEach } from "vitest";
import { createTestServices } from "../integration/helpers.js";
import type { TaskService } from "../../src/core/tasks.js";

describe("Dread Level", () => {
  let taskService: TaskService;

  beforeEach(() => {
    const services = createTestServices();
    taskService = services.taskService;
  });

  it("creates a task with dreadLevel", async () => {
    const task = await taskService.create({
      title: "Scary task",
      dueTime: false,
      dreadLevel: 4,
    });

    expect(task.dreadLevel).toBe(4);
  });

  it("defaults dreadLevel to null when not provided", async () => {
    const task = await taskService.create({
      title: "Normal task",
      dueTime: false,
    });

    expect(task.dreadLevel).toBeNull();
  });

  it("updates dreadLevel on an existing task", async () => {
    const task = await taskService.create({
      title: "Update me",
      dueTime: false,
    });

    const updated = await taskService.update(task.id, { dreadLevel: 3 });
    expect(updated.dreadLevel).toBe(3);
  });

  it("clears dreadLevel by setting to null", async () => {
    const task = await taskService.create({
      title: "Clear me",
      dueTime: false,
      dreadLevel: 5,
    });

    const updated = await taskService.update(task.id, { dreadLevel: null });
    expect(updated.dreadLevel).toBeNull();
  });

  it("persists dreadLevel through get()", async () => {
    const task = await taskService.create({
      title: "Persist check",
      dueTime: false,
      dreadLevel: 2,
    });

    const fetched = await taskService.get(task.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.dreadLevel).toBe(2);
  });

  it("persists dreadLevel through list()", async () => {
    await taskService.create({
      title: "List check",
      dueTime: false,
      dreadLevel: 1,
    });

    const tasks = await taskService.list();
    expect(tasks.length).toBe(1);
    expect(tasks[0].dreadLevel).toBe(1);
  });

  it("validates dreadLevel min (1) via Zod schema", async () => {
    const { CreateTaskInput } = await import("../../src/core/types.js");

    const result = CreateTaskInput.safeParse({
      title: "Test",
      dueTime: false,
      dreadLevel: 0,
    });
    expect(result.success).toBe(false);
  });

  it("validates dreadLevel max (5) via Zod schema", async () => {
    const { CreateTaskInput } = await import("../../src/core/types.js");

    const result = CreateTaskInput.safeParse({
      title: "Test",
      dueTime: false,
      dreadLevel: 6,
    });
    expect(result.success).toBe(false);
  });

  it("allows valid dreadLevel values 1-5 via Zod schema", async () => {
    const { CreateTaskInput } = await import("../../src/core/types.js");

    for (const level of [1, 2, 3, 4, 5]) {
      const result = CreateTaskInput.safeParse({
        title: "Test",
        dueTime: false,
        dreadLevel: level,
      });
      expect(result.success).toBe(true);
    }
  });

  it("allows null dreadLevel via Zod schema", async () => {
    const { CreateTaskInput } = await import("../../src/core/types.js");

    const result = CreateTaskInput.safeParse({
      title: "Test",
      dueTime: false,
      dreadLevel: null,
    });
    expect(result.success).toBe(true);
  });

  it("restores dreadLevel when restoring a deleted task", async () => {
    const task = await taskService.create({
      title: "Restore me",
      dueTime: false,
      dreadLevel: 3,
    });

    await taskService.delete(task.id);
    const restored = await taskService.restoreTask(task);
    expect(restored.dreadLevel).toBe(3);
  });
});
