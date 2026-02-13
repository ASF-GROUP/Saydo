import type { ToolDefinition } from "./types.js";
import type { TaskService } from "../core/tasks.js";
import type { ProjectService } from "../core/projects.js";

export function getToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: "create_task",
      description: "Create a new task. Returns the created task.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Task title (required)" },
          priority: {
            type: "number",
            description: "Priority 1-4 (1=urgent, 4=low)",
            enum: [1, 2, 3, 4],
          },
          dueDate: { type: "string", description: "Due date as ISO 8601 string" },
          tags: { type: "array", items: { type: "string" }, description: "Tag names" },
          projectId: { type: "string", description: "Project ID to assign to" },
        },
        required: ["title"],
      },
    },
    {
      name: "list_tasks",
      description: "List tasks with optional filters. Returns an array of tasks.",
      parameters: {
        type: "object",
        properties: {
          status: {
            type: "string",
            description: "Filter by status",
            enum: ["pending", "completed", "cancelled"],
          },
          projectId: { type: "string", description: "Filter by project ID" },
          search: { type: "string", description: "Search tasks by title" },
        },
      },
    },
    {
      name: "complete_task",
      description: "Mark a task as completed.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "The ID of the task to complete" },
        },
        required: ["taskId"],
      },
    },
    {
      name: "update_task",
      description: "Update an existing task's fields.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "The ID of the task to update" },
          title: { type: "string", description: "New title" },
          priority: { type: "number", description: "New priority 1-4", enum: [1, 2, 3, 4] },
          dueDate: { type: "string", description: "New due date as ISO 8601 string" },
        },
        required: ["taskId"],
      },
    },
    {
      name: "delete_task",
      description: "Permanently delete a task.",
      parameters: {
        type: "object",
        properties: {
          taskId: { type: "string", description: "The ID of the task to delete" },
        },
        required: ["taskId"],
      },
    },
  ];
}

export interface ToolServices {
  taskService: TaskService;
  projectService: ProjectService;
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>,
  services: ToolServices,
): Promise<string> {
  const { taskService } = services;

  switch (name) {
    case "create_task": {
      const task = await taskService.create({
        title: args.title as string,
        priority: (args.priority as number) ?? null,
        dueDate: (args.dueDate as string) ?? null,
        dueTime: false,
        tags: (args.tags as string[]) ?? [],
        projectId: (args.projectId as string) ?? null,
      });
      return JSON.stringify({
        success: true,
        task: { id: task.id, title: task.title, status: task.status },
      });
    }

    case "list_tasks": {
      const filter: Record<string, string> = {};
      if (args.status) filter.status = args.status as string;
      if (args.projectId) filter.projectId = args.projectId as string;
      if (args.search) filter.search = args.search as string;

      const tasks = await taskService.list(Object.keys(filter).length > 0 ? filter : undefined);
      const summary = tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate,
        projectId: t.projectId,
        tags: t.tags.map((tag) => tag.name),
      }));
      return JSON.stringify({ tasks: summary, count: summary.length });
    }

    case "complete_task": {
      const task = await taskService.complete(args.taskId as string);
      return JSON.stringify({
        success: true,
        task: { id: task.id, title: task.title, status: task.status },
      });
    }

    case "update_task": {
      const { taskId, ...updates } = args;
      const task = await taskService.update(taskId as string, updates);
      return JSON.stringify({
        success: true,
        task: { id: task.id, title: task.title, status: task.status },
      });
    }

    case "delete_task": {
      const deleted = await taskService.delete(args.taskId as string);
      return JSON.stringify({ success: true, deleted });
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}
