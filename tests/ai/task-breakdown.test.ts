import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/ai/tools/registry.js";
import { registerTaskBreakdownTool } from "../../src/ai/tools/builtin/task-breakdown.js";
import { createTestServices } from "../integration/helpers.js";
import type { ToolContext } from "../../src/ai/tools/types.js";
import type { TaskService } from "../../src/core/tasks.js";

function exec(
  registry: ToolRegistry,
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  return registry.execute(name, args, ctx).then((r) => JSON.parse(r));
}

describe("break_down_task", () => {
  let registry: ToolRegistry;
  let ctx: ToolContext;
  let taskService: TaskService;

  beforeEach(() => {
    registry = new ToolRegistry();
    registerTaskBreakdownTool(registry);
    const services = createTestServices();
    taskService = services.taskService;
    ctx = { taskService, projectService: services.projectService };
  });

  it("breaks a task into subtasks with correct parentId", async () => {
    const parent = await taskService.create({
      title: "Ship feature X",
      tags: [],
    });

    const result = await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: ["Design", "Implement", "Test"] },
      ctx,
    );

    expect(result.success).toBe(true);
    expect(result.parent.id).toBe(parent.id);
    expect(result.count).toBe(3);
    expect(result.subtasks).toHaveLength(3);
    expect(result.subtasks[0].title).toBe("Design");
    expect(result.subtasks[1].title).toBe("Implement");
    expect(result.subtasks[2].title).toBe("Test");

    // Verify parentId is set
    const children = await taskService.getChildren(parent.id);
    expect(children).toHaveLength(3);
    expect(children.every((c) => c.parentId === parent.id)).toBe(true);
  });

  it("inherits priority, dueDate, projectId, tags from parent when copyFields=true", async () => {
    const project = await ctx.projectService.create("Project A");
    const parent = await taskService.create({
      title: "Parent task",
      tags: ["urgent", "backend"],
      priority: 1,
      dueDate: "2026-03-01T12:00:00.000Z",
      projectId: project.id,
    });

    const result = await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: ["Subtask A"], copyFields: true },
      ctx,
    );

    expect(result.success).toBe(true);
    const child = await taskService.get(result.subtasks[0].id);
    expect(child).toBeDefined();
    expect(child!.priority).toBe(1);
    expect(child!.dueDate).toBe("2026-03-01T12:00:00.000Z");
    expect(child!.projectId).toBe(project.id);
    expect(child!.tags.map((t: { name: string }) => t.name).sort()).toEqual(["backend", "urgent"]);
  });

  it("does not inherit fields when copyFields=false", async () => {
    const parent = await taskService.create({
      title: "Parent task",
      tags: ["work"],
      priority: 2,
      dueDate: "2026-03-01T12:00:00.000Z",
    });

    const result = await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: ["Clean subtask"], copyFields: false },
      ctx,
    );

    expect(result.success).toBe(true);
    const child = await taskService.get(result.subtasks[0].id);
    expect(child).toBeDefined();
    expect(child!.priority).toBeNull();
    expect(child!.dueDate).toBeNull();
    expect(child!.projectId).toBeNull();
    expect(child!.tags).toHaveLength(0);
  });

  it("returns error for non-existent task ID", async () => {
    const result = await exec(
      registry,
      "break_down_task",
      { taskId: "nonexistent", subtasks: ["Sub"] },
      ctx,
    );
    expect(result.error).toBe("Task not found: nonexistent");
  });

  it("returns error for empty subtasks array", async () => {
    const parent = await taskService.create({
      title: "Parent",
      tags: [],
    });

    const result = await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: [] },
      ctx,
    );
    expect(result.error).toBe("No subtask titles provided");
  });

  it("creates multiple subtasks in order", async () => {
    const parent = await taskService.create({
      title: "Ordered parent",
      tags: [],
    });

    const titles = ["Step 1", "Step 2", "Step 3", "Step 4"];
    const result = await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: titles },
      ctx,
    );

    expect(result.subtasks.map((s: { title: string }) => s.title)).toEqual(titles);
  });

  it("subtasks appear as children of parent via getChildren", async () => {
    const parent = await taskService.create({
      title: "Parent for children",
      tags: [],
    });

    await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: ["Child A", "Child B"] },
      ctx,
    );

    const children = await taskService.getChildren(parent.id);
    expect(children).toHaveLength(2);
    const childTitles = children.map((c) => c.title).sort();
    expect(childTitles).toEqual(["Child A", "Child B"]);
  });

  it("works with tasks that already have subtasks", async () => {
    const parent = await taskService.create({
      title: "Already has kids",
      tags: [],
    });
    await taskService.create({
      title: "Existing child",
      tags: [],
      parentId: parent.id,
    });

    const result = await exec(
      registry,
      "break_down_task",
      { taskId: parent.id, subtasks: ["New child"] },
      ctx,
    );

    expect(result.success).toBe(true);
    const children = await taskService.getChildren(parent.id);
    expect(children).toHaveLength(2);
    expect(children.map((c) => c.title).sort()).toEqual(["Existing child", "New child"]);
  });
});
