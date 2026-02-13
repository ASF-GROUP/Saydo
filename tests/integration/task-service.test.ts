import { describe, it, expect, beforeEach } from "vitest";
import { createTestServices } from "./helpers.js";
import type { TaskService } from "../../src/core/tasks.js";
import type { TagService } from "../../src/core/tags.js";
import type { ProjectService } from "../../src/core/projects.js";
import { NotFoundError } from "../../src/core/errors.js";

describe("TaskService (integration)", () => {
  let taskService: TaskService;
  let tagService: TagService;
  let projectService: ProjectService;

  beforeEach(() => {
    const services = createTestServices();
    taskService = services.taskService;
    tagService = services.tagService;
    projectService = services.projectService;
  });

  describe("create", () => {
    it("creates a task with minimal input", async () => {
      const task = await taskService.create({ title: "Buy milk" });

      expect(task.id).toBeDefined();
      expect(task.title).toBe("Buy milk");
      expect(task.status).toBe("pending");
      expect(task.priority).toBeNull();
      expect(task.dueDate).toBeNull();
      expect(task.dueTime).toBe(false);
      expect(task.tags).toEqual([]);
      expect(task.completedAt).toBeNull();
      expect(task.projectId).toBeNull();
    });

    it("creates a task with all fields", async () => {
      const project = await projectService.create("Work");
      const task = await taskService.create({
        title: "Finish report",
        description: "Q4 quarterly report",
        priority: 1,
        dueDate: "2025-12-31T17:00:00.000Z",
        dueTime: true,
        projectId: project.id,
        tags: ["urgent", "work"],
      });

      expect(task.title).toBe("Finish report");
      expect(task.description).toBe("Q4 quarterly report");
      expect(task.priority).toBe(1);
      expect(task.dueDate).toBe("2025-12-31T17:00:00.000Z");
      expect(task.dueTime).toBe(true);
      expect(task.projectId).toBe(project.id);
      expect(task.tags).toHaveLength(2);
      expect(task.tags.map((t) => t.name).sort()).toEqual(["urgent", "work"]);
    });

    it("auto-creates missing tags", async () => {
      await taskService.create({ title: "Task 1", tags: ["new-tag"] });

      const tags = await tagService.list();
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("new-tag");
    });

    it("reuses existing tags", async () => {
      await taskService.create({ title: "Task 1", tags: ["shared"] });
      await taskService.create({ title: "Task 2", tags: ["shared"] });

      const tags = await tagService.list();
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("shared");
    });
  });

  describe("list", () => {
    it("returns all tasks", async () => {
      await taskService.create({ title: "Task 1" });
      await taskService.create({ title: "Task 2" });
      await taskService.create({ title: "Task 3" });

      const tasks = await taskService.list();
      expect(tasks).toHaveLength(3);
    });

    it("returns tasks sorted by priority (highest first)", async () => {
      await taskService.create({ title: "Low", priority: 4 });
      await taskService.create({ title: "High", priority: 1 });
      await taskService.create({ title: "Mid", priority: 2 });
      await taskService.create({ title: "None" });

      const tasks = await taskService.list();
      const titles = tasks.map((t) => t.title);
      expect(titles).toEqual(["High", "Mid", "Low", "None"]);
    });

    it("filters by status", async () => {
      const task = await taskService.create({ title: "Done" });
      await taskService.create({ title: "Not done" });
      await taskService.complete(task.id);

      const pending = await taskService.list({ status: "pending" });
      expect(pending).toHaveLength(1);
      expect(pending[0].title).toBe("Not done");

      const completed = await taskService.list({ status: "completed" });
      expect(completed).toHaveLength(1);
      expect(completed[0].title).toBe("Done");
    });

    it("filters by tag", async () => {
      await taskService.create({ title: "Tagged", tags: ["important"] });
      await taskService.create({ title: "Untagged" });

      const filtered = await taskService.list({ tag: "important" });
      expect(filtered).toHaveLength(1);
      expect(filtered[0].title).toBe("Tagged");
    });

    it("returns tasks with hydrated tags", async () => {
      await taskService.create({ title: "Multi-tag", tags: ["a", "b", "c"] });

      const tasks = await taskService.list();
      expect(tasks[0].tags).toHaveLength(3);
      expect(tasks[0].tags.map((t) => t.name).sort()).toEqual(["a", "b", "c"]);
    });
  });

  describe("get", () => {
    it("returns a task by ID with tags", async () => {
      const created = await taskService.create({
        title: "Fetch me",
        tags: ["test"],
      });

      const task = await taskService.get(created.id);
      expect(task).not.toBeNull();
      expect(task!.id).toBe(created.id);
      expect(task!.title).toBe("Fetch me");
      expect(task!.tags).toHaveLength(1);
      expect(task!.tags[0].name).toBe("test");
    });

    it("returns null for missing ID", async () => {
      const task = await taskService.get("nonexistent");
      expect(task).toBeNull();
    });
  });

  describe("update", () => {
    it("updates the title", async () => {
      const task = await taskService.create({ title: "Old" });
      const updated = await taskService.update(task.id, { title: "New" });

      expect(updated.title).toBe("New");
      expect(updated.id).toBe(task.id);
    });

    it("updates priority", async () => {
      const task = await taskService.create({ title: "Task", priority: 4 });
      const updated = await taskService.update(task.id, { priority: 1 });

      expect(updated.priority).toBe(1);
    });

    it("replaces all tags on update", async () => {
      const task = await taskService.create({
        title: "Task",
        tags: ["old-tag"],
      });
      const updated = await taskService.update(task.id, {
        tags: ["new-tag-a", "new-tag-b"],
      });

      expect(updated.tags).toHaveLength(2);
      expect(updated.tags.map((t) => t.name).sort()).toEqual(["new-tag-a", "new-tag-b"]);
    });

    it("throws NotFoundError for missing task", async () => {
      await expect(taskService.update("nonexistent", { title: "Fail" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("complete", () => {
    it("sets status to completed and records completedAt", async () => {
      const task = await taskService.create({ title: "Finish me" });
      const completed = await taskService.complete(task.id);

      expect(completed.status).toBe("completed");
      expect(completed.completedAt).toBeDefined();
      expect(completed.completedAt).not.toBeNull();
    });

    it("throws NotFoundError for missing task", async () => {
      await expect(taskService.complete("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("creates next occurrence for a daily recurring task", async () => {
      const dueDate = new Date("2025-06-15T10:00:00.000Z");
      const task = await taskService.create({
        title: "Daily standup",
        recurrence: "daily",
        dueDate: dueDate.toISOString(),
        priority: 2,
        tags: ["work"],
      });

      await taskService.complete(task.id);

      const tasks = await taskService.list({ status: "pending" });
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("Daily standup");
      expect(tasks[0].recurrence).toBe("daily");
      expect(tasks[0].priority).toBe(2);
      expect(tasks[0].tags.map((t) => t.name)).toEqual(["work"]);

      const nextDue = new Date(tasks[0].dueDate!);
      expect(nextDue.toISOString()).toBe("2025-06-16T10:00:00.000Z");
    });

    it("does not create next occurrence for non-recurring task", async () => {
      const task = await taskService.create({ title: "One-off task" });

      await taskService.complete(task.id);

      const pending = await taskService.list({ status: "pending" });
      expect(pending).toHaveLength(0);
    });

    it("creates next occurrence for weekly recurring task", async () => {
      const dueDate = new Date("2025-06-15T10:00:00.000Z");
      const task = await taskService.create({
        title: "Weekly review",
        recurrence: "weekly",
        dueDate: dueDate.toISOString(),
      });

      await taskService.complete(task.id);

      const tasks = await taskService.list({ status: "pending" });
      expect(tasks).toHaveLength(1);
      const nextDue = new Date(tasks[0].dueDate!);
      expect(nextDue.toISOString()).toBe("2025-06-22T10:00:00.000Z");
    });
  });

  describe("delete", () => {
    it("removes the task and its tag associations", async () => {
      const task = await taskService.create({
        title: "Delete me",
        tags: ["temp"],
      });

      const result = await taskService.delete(task.id);
      expect(result).toBe(true);

      const fetched = await taskService.get(task.id);
      expect(fetched).toBeNull();

      // Tag itself should still exist (only junction rows deleted)
      const tags = await tagService.list();
      expect(tags).toHaveLength(1);
      expect(tags[0].name).toBe("temp");
    });

    it("returns false for missing task", async () => {
      const result = await taskService.delete("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("full lifecycle", () => {
    it("create → read → update → complete → delete", async () => {
      // Create
      const task = await taskService.create({
        title: "Lifecycle task",
        priority: 3,
        tags: ["lifecycle"],
      });
      expect(task.status).toBe("pending");

      // Read
      const fetched = await taskService.get(task.id);
      expect(fetched!.title).toBe("Lifecycle task");
      expect(fetched!.tags).toHaveLength(1);

      // Update
      const updated = await taskService.update(task.id, {
        title: "Updated lifecycle task",
        priority: 1,
        tags: ["lifecycle", "updated"],
      });
      expect(updated.title).toBe("Updated lifecycle task");
      expect(updated.priority).toBe(1);
      expect(updated.tags).toHaveLength(2);

      // Complete
      const completed = await taskService.complete(task.id);
      expect(completed.status).toBe("completed");
      expect(completed.completedAt).not.toBeNull();

      // Delete
      const deleted = await taskService.delete(task.id);
      expect(deleted).toBe(true);

      const gone = await taskService.get(task.id);
      expect(gone).toBeNull();
    });
  });
});
