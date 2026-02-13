import { describe, it, expect, beforeEach, vi } from "vitest";
import { createTestServices } from "../integration/helpers.js";
import type { TaskService } from "../../src/core/tasks.js";
import type { ProjectService } from "../../src/core/projects.js";
import type { AppServices } from "../../src/bootstrap.js";
import { addTask } from "../../src/cli/commands/add.js";
import { listTasks } from "../../src/cli/commands/list.js";
import { doneTask } from "../../src/cli/commands/done.js";
import { editTask } from "../../src/cli/commands/edit.js";
import { deleteTask } from "../../src/cli/commands/delete.js";

describe("CLI commands", () => {
  let services: AppServices;
  let taskService: TaskService;
  let _projectService: ProjectService;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    const testServices = createTestServices();
    services = testServices;
    taskService = testServices.taskService;
    _projectService = testServices.projectService;
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  describe("add", () => {
    it("creates a task and prints confirmation", async () => {
      await addTask("buy milk", services);

      expect(logSpy).toHaveBeenCalledOnce();
      expect(logSpy.mock.calls[0][0]).toContain("Created");
      expect(logSpy.mock.calls[0][0]).toContain("buy milk");

      const tasks = await taskService.list();
      expect(tasks).toHaveLength(1);
      expect(tasks[0].title).toBe("buy milk");
    });

    it("outputs JSON when --json flag is set", async () => {
      await addTask("test task", services, { json: true });

      expect(logSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.title).toBe("test task");
      expect(output.id).toBeDefined();
    });
  });

  describe("list", () => {
    it("lists pending tasks", async () => {
      await taskService.create({ title: "Task 1" });
      await taskService.create({ title: "Task 2" });

      await listTasks({}, services);

      expect(logSpy).toHaveBeenCalledTimes(2);
      const output = logSpy.mock.calls.map((c) => c[0]).join("\n");
      expect(output).toContain("Task 1");
      expect(output).toContain("Task 2");
    });

    it("outputs JSON when --json flag is set", async () => {
      await taskService.create({ title: "JSON task" });

      await listTasks({ json: true }, services);

      expect(logSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output).toHaveLength(1);
      expect(output[0].title).toBe("JSON task");
    });

    it("shows message when no tasks found", async () => {
      await listTasks({}, services);

      expect(logSpy).toHaveBeenCalledOnce();
      expect(logSpy.mock.calls[0][0]).toContain("No tasks found");
    });

    it("filters by search query", async () => {
      await taskService.create({ title: "buy milk" });
      await taskService.create({ title: "write report" });

      await listTasks({ search: "milk" }, services);

      expect(logSpy).toHaveBeenCalledOnce();
      expect(logSpy.mock.calls[0][0]).toContain("buy milk");
    });
  });

  describe("done", () => {
    it("marks a task as completed", async () => {
      const task = await taskService.create({ title: "Finish me" });

      await doneTask(task.id, services);

      expect(logSpy).toHaveBeenCalledOnce();
      expect(logSpy.mock.calls[0][0]).toContain("Completed");

      const fetched = await taskService.get(task.id);
      expect(fetched!.status).toBe("completed");
    });

    it("outputs JSON when --json flag is set", async () => {
      const task = await taskService.create({ title: "Done JSON" });

      await doneTask(task.id, services, { json: true });

      expect(logSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.status).toBe("completed");
    });
  });

  describe("edit", () => {
    it("updates task title", async () => {
      const task = await taskService.create({ title: "Old title" });

      await editTask(task.id, { title: "New title" }, services);

      expect(logSpy).toHaveBeenCalledOnce();
      expect(logSpy.mock.calls[0][0]).toContain("Updated");

      const fetched = await taskService.get(task.id);
      expect(fetched!.title).toBe("New title");
    });

    it("updates task priority", async () => {
      const task = await taskService.create({ title: "Task", priority: 4 });

      await editTask(task.id, { priority: "1" }, services);

      const fetched = await taskService.get(task.id);
      expect(fetched!.priority).toBe(1);
    });

    it("outputs JSON when --json flag is set", async () => {
      const task = await taskService.create({ title: "Edit JSON" });

      await editTask(task.id, { title: "Edited", json: true }, services);

      expect(logSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.title).toBe("Edited");
    });
  });

  describe("delete", () => {
    it("removes a task", async () => {
      const task = await taskService.create({ title: "Delete me" });

      await deleteTask(task.id, services);

      expect(logSpy).toHaveBeenCalledOnce();
      expect(logSpy.mock.calls[0][0]).toContain("Deleted");

      const fetched = await taskService.get(task.id);
      expect(fetched).toBeNull();
    });

    it("outputs JSON when --json flag is set", async () => {
      const task = await taskService.create({ title: "Delete JSON" });

      await deleteTask(task.id, services, { json: true });

      expect(logSpy).toHaveBeenCalledOnce();
      const output = JSON.parse(logSpy.mock.calls[0][0]);
      expect(output.deleted).toBe(true);
    });
  });
});
