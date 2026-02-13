import { describe, it, expect, beforeEach } from "vitest";
import { createTestServices } from "./helpers.js";
import type { TaskService } from "../../src/core/tasks.js";
import type { ProjectService } from "../../src/core/projects.js";
import type { EventBus } from "../../src/core/event-bus.js";

describe("TaskService bulk operations (integration)", () => {
  let taskService: TaskService;
  let projectService: ProjectService;
  let eventBus: EventBus;

  beforeEach(() => {
    const services = createTestServices();
    taskService = services.taskService;
    projectService = services.projectService;
    eventBus = services.eventBus;
  });

  describe("completeMany", () => {
    it("completes multiple tasks", async () => {
      const t1 = await taskService.create({ title: "Task 1" });
      const t2 = await taskService.create({ title: "Task 2" });
      const t3 = await taskService.create({ title: "Task 3" });

      const results = await taskService.completeMany([t1.id, t2.id]);

      expect(results).toHaveLength(2);
      expect(results[0].status).toBe("completed");
      expect(results[1].status).toBe("completed");

      const remaining = await taskService.list({ status: "pending" });
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(t3.id);
    });

    it("handles recurring tasks in completeMany", async () => {
      const t = await taskService.create({
        title: "Daily task",
        recurrence: "daily",
        dueDate: "2025-06-15T10:00:00.000Z",
      });

      await taskService.completeMany([t.id]);

      const pending = await taskService.list({ status: "pending" });
      expect(pending).toHaveLength(1);
      expect(pending[0].title).toBe("Daily task");
      expect(pending[0].recurrence).toBe("daily");
    });
  });

  describe("deleteMany", () => {
    it("deletes multiple tasks in batch", async () => {
      const t1 = await taskService.create({ title: "Task 1", tags: ["a"] });
      const t2 = await taskService.create({ title: "Task 2", tags: ["b"] });
      const t3 = await taskService.create({ title: "Task 3" });

      const deleted = await taskService.deleteMany([t1.id, t2.id]);

      expect(deleted).toHaveLength(2);
      expect(deleted.map((t) => t.id).sort()).toEqual([t1.id, t2.id].sort());

      const remaining = await taskService.list();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe(t3.id);
    });

    it("emits delete events per task", async () => {
      const events: string[] = [];
      eventBus.on("task:delete", (task) => events.push(task.id));

      const t1 = await taskService.create({ title: "Task 1" });
      const t2 = await taskService.create({ title: "Task 2" });

      await taskService.deleteMany([t1.id, t2.id]);

      expect(events).toHaveLength(2);
    });
  });

  describe("updateMany", () => {
    it("updates priority for multiple tasks", async () => {
      const t1 = await taskService.create({ title: "Task 1", priority: 4 });
      const t2 = await taskService.create({ title: "Task 2", priority: 4 });

      const results = await taskService.updateMany([t1.id, t2.id], { priority: 1 });

      expect(results).toHaveLength(2);
      expect(results[0].priority).toBe(1);
      expect(results[1].priority).toBe(1);
    });

    it("moves multiple tasks to a project", async () => {
      const project = await projectService.create("Test Project");
      const t1 = await taskService.create({ title: "Task 1" });
      const t2 = await taskService.create({ title: "Task 2" });

      await taskService.updateMany([t1.id, t2.id], { projectId: project.id });

      const fetched1 = await taskService.get(t1.id);
      const fetched2 = await taskService.get(t2.id);
      expect(fetched1!.projectId).toBe(project.id);
      expect(fetched2!.projectId).toBe(project.id);
    });
  });

  describe("restoreTask", () => {
    it("restores a previously deleted task", async () => {
      const original = await taskService.create({
        title: "Restore me",
        priority: 2,
        tags: ["important"],
      });

      await taskService.delete(original.id);
      expect(await taskService.get(original.id)).toBeNull();

      const restored = await taskService.restoreTask(original);
      expect(restored.id).toBe(original.id);
      expect(restored.title).toBe("Restore me");
      expect(restored.priority).toBe(2);

      const fetched = await taskService.get(original.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.title).toBe("Restore me");
    });
  });

  describe("reorder", () => {
    it("assigns sequential sort orders", async () => {
      const t1 = await taskService.create({ title: "Task 1" });
      const t2 = await taskService.create({ title: "Task 2" });
      const t3 = await taskService.create({ title: "Task 3" });

      await taskService.reorder([t3.id, t1.id, t2.id]);

      const fetched1 = await taskService.get(t1.id);
      const fetched2 = await taskService.get(t2.id);
      const fetched3 = await taskService.get(t3.id);

      expect(fetched3!.sortOrder).toBe(0);
      expect(fetched1!.sortOrder).toBe(1);
      expect(fetched2!.sortOrder).toBe(2);
    });

    it("emits reorder event", async () => {
      let emittedIds: string[] = [];
      eventBus.on("task:reorder", (ids) => {
        emittedIds = ids;
      });

      const t1 = await taskService.create({ title: "Task 1" });
      const t2 = await taskService.create({ title: "Task 2" });

      await taskService.reorder([t2.id, t1.id]);

      expect(emittedIds).toEqual([t2.id, t1.id]);
    });
  });
});
