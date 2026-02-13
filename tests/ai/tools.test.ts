import { describe, it, expect } from "vitest";
import { getToolDefinitions, executeTool } from "../../src/ai/tools.js";
import { createTestServices } from "../integration/helpers.js";

describe("getToolDefinitions", () => {
  it("returns all expected tools", () => {
    const tools = getToolDefinitions();
    const names = tools.map((t) => t.name);
    expect(names).toContain("create_task");
    expect(names).toContain("list_tasks");
    expect(names).toContain("complete_task");
    expect(names).toContain("update_task");
    expect(names).toContain("delete_task");
    expect(tools).toHaveLength(5);
  });

  it("each tool has name, description, and parameters", () => {
    const tools = getToolDefinitions();
    for (const tool of tools) {
      expect(tool.name).toBeTruthy();
      expect(tool.description).toBeTruthy();
      expect(tool.parameters).toBeDefined();
      expect(tool.parameters.type).toBe("object");
    }
  });
});

describe("executeTool", () => {
  it("create_task creates a task", async () => {
    const { taskService, projectService } = createTestServices();
    const result = await executeTool(
      "create_task",
      { title: "Test task" },
      { taskService, projectService },
    );
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.task.title).toBe("Test task");
    expect(parsed.task.status).toBe("pending");
  });

  it("list_tasks returns tasks", async () => {
    const { taskService, projectService } = createTestServices();
    await taskService.create({ title: "Task A", tags: [] });
    await taskService.create({ title: "Task B", tags: [] });

    const result = await executeTool("list_tasks", {}, { taskService, projectService });
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(2);
    expect(parsed.tasks).toHaveLength(2);
  });

  it("list_tasks filters by status", async () => {
    const { taskService, projectService } = createTestServices();
    const task = await taskService.create({ title: "Task A", tags: [] });
    await taskService.create({ title: "Task B", tags: [] });
    await taskService.complete(task.id);

    const result = await executeTool("list_tasks", { status: "pending" }, { taskService, projectService });
    const parsed = JSON.parse(result);
    expect(parsed.count).toBe(1);
    expect(parsed.tasks[0].title).toBe("Task B");
  });

  it("complete_task completes a task", async () => {
    const { taskService, projectService } = createTestServices();
    const task = await taskService.create({ title: "Do thing", tags: [] });

    const result = await executeTool(
      "complete_task",
      { taskId: task.id },
      { taskService, projectService },
    );
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.task.status).toBe("completed");
  });

  it("update_task updates a task", async () => {
    const { taskService, projectService } = createTestServices();
    const task = await taskService.create({ title: "Old title", tags: [] });

    const result = await executeTool(
      "update_task",
      { taskId: task.id, title: "New title" },
      { taskService, projectService },
    );
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.task.title).toBe("New title");
  });

  it("delete_task deletes a task", async () => {
    const { taskService, projectService } = createTestServices();
    const task = await taskService.create({ title: "Delete me", tags: [] });

    const result = await executeTool(
      "delete_task",
      { taskId: task.id },
      { taskService, projectService },
    );
    const parsed = JSON.parse(result);
    expect(parsed.success).toBe(true);
    expect(parsed.deleted).toBe(true);

    // Verify it's gone
    const listResult = await executeTool("list_tasks", {}, { taskService, projectService });
    expect(JSON.parse(listResult).count).toBe(0);
  });

  it("throws for unknown tool", async () => {
    const { taskService, projectService } = createTestServices();
    await expect(
      executeTool("unknown_tool", {}, { taskService, projectService }),
    ).rejects.toThrow("Unknown tool: unknown_tool");
  });
});
