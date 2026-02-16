import { describe, it, expect } from "vitest";
import { createTestServices } from "./helpers.js";

describe("Reminder system", () => {
  it("should create a task with remindAt", async () => {
    const { taskService } = createTestServices();
    const remindAt = new Date(Date.now() + 60_000).toISOString();

    const task = await taskService.create({
      title: "Remind me",
      dueTime: false,
      tags: [],
      remindAt,
    });

    expect(task.remindAt).toBe(remindAt);
  });

  it("should persist remindAt through get()", async () => {
    const { taskService } = createTestServices();
    const remindAt = new Date(Date.now() + 60_000).toISOString();

    const created = await taskService.create({
      title: "Persist reminder",
      dueTime: false,
      tags: [],
      remindAt,
    });

    const fetched = await taskService.get(created.id);
    expect(fetched).not.toBeNull();
    expect(fetched!.remindAt).toBe(remindAt);
  });

  it("should include remindAt in list()", async () => {
    const { taskService } = createTestServices();
    const remindAt = new Date(Date.now() + 60_000).toISOString();

    await taskService.create({
      title: "Listed reminder",
      dueTime: false,
      tags: [],
      remindAt,
    });

    const tasks = await taskService.list();
    expect(tasks[0].remindAt).toBe(remindAt);
  });

  it("should update task to set remindAt", async () => {
    const { taskService } = createTestServices();
    const task = await taskService.create({
      title: "No reminder yet",
      dueTime: false,
      tags: [],
    });

    expect(task.remindAt).toBeNull();

    const remindAt = new Date(Date.now() + 60_000).toISOString();
    const updated = await taskService.update(task.id, { remindAt } as any);
    expect(updated.remindAt).toBe(remindAt);
  });

  it("should update task to clear remindAt", async () => {
    const { taskService } = createTestServices();
    const remindAt = new Date(Date.now() + 60_000).toISOString();

    const task = await taskService.create({
      title: "Has reminder",
      dueTime: false,
      tags: [],
      remindAt,
    });

    const updated = await taskService.update(task.id, { remindAt: null } as any);
    expect(updated.remindAt).toBeNull();
  });

  it("getDueReminders() returns tasks with past remindAt", async () => {
    const { taskService } = createTestServices();
    const pastTime = new Date(Date.now() - 60_000).toISOString();

    await taskService.create({
      title: "Due reminder",
      dueTime: false,
      tags: [],
      remindAt: pastTime,
    });

    const due = await taskService.getDueReminders();
    expect(due).toHaveLength(1);
    expect(due[0].title).toBe("Due reminder");
  });

  it("getDueReminders() excludes completed tasks", async () => {
    const { taskService } = createTestServices();
    const pastTime = new Date(Date.now() - 60_000).toISOString();

    const task = await taskService.create({
      title: "Completed reminder",
      dueTime: false,
      tags: [],
      remindAt: pastTime,
    });

    await taskService.complete(task.id);

    const due = await taskService.getDueReminders();
    expect(due).toHaveLength(0);
  });

  it("getDueReminders() excludes future remindAt", async () => {
    const { taskService } = createTestServices();
    const futureTime = new Date(Date.now() + 3_600_000).toISOString();

    await taskService.create({
      title: "Future reminder",
      dueTime: false,
      tags: [],
      remindAt: futureTime,
    });

    const due = await taskService.getDueReminders();
    expect(due).toHaveLength(0);
  });

  it("getDueReminders() excludes tasks without remindAt", async () => {
    const { taskService } = createTestServices();

    await taskService.create({
      title: "No reminder",
      dueTime: false,
      tags: [],
    });

    const due = await taskService.getDueReminders();
    expect(due).toHaveLength(0);
  });

  it("getDueReminders() hydrates tags correctly", async () => {
    const { taskService } = createTestServices();
    const pastTime = new Date(Date.now() - 60_000).toISOString();

    await taskService.create({
      title: "Tagged reminder",
      dueTime: false,
      tags: ["urgent", "work"],
      remindAt: pastTime,
    });

    const due = await taskService.getDueReminders();
    expect(due).toHaveLength(1);
    expect(due[0].tags).toHaveLength(2);
    expect(due[0].tags.map((t) => t.name).sort()).toEqual(["urgent", "work"]);
  });

  it("restoreTask preserves remindAt", async () => {
    const { taskService } = createTestServices();
    const remindAt = new Date(Date.now() + 60_000).toISOString();

    const task = await taskService.create({
      title: "Restore me",
      dueTime: false,
      tags: [],
      remindAt,
    });

    await taskService.delete(task.id);
    const restored = await taskService.restoreTask(task);
    expect(restored.remindAt).toBe(remindAt);
  });

  it("create task without remindAt defaults to null", async () => {
    const { taskService } = createTestServices();

    const task = await taskService.create({
      title: "No reminder",
      dueTime: false,
      tags: [],
    });

    expect(task.remindAt).toBeNull();
  });
});
