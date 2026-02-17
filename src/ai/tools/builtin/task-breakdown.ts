/**
 * break_down_task tool — breaks a parent task into subtasks.
 * The LLM decides the breakdown in its reasoning, then calls this tool
 * with the resulting subtask titles. This keeps execution deterministic.
 */

import type { ToolRegistry } from "../registry.js";

export function registerTaskBreakdownTool(registry: ToolRegistry): void {
  registry.register(
    {
      name: "break_down_task",
      description:
        "Break a task into subtasks. Provide the parent task ID and a list of subtask titles. " +
        "Optionally inherit priority, due date, project, and tags from the parent.",
      parameters: {
        type: "object",
        properties: {
          taskId: {
            type: "string",
            description: "The ID of the parent task to break down",
          },
          subtasks: {
            type: "array",
            items: { type: "string" },
            description: "Titles for the subtasks to create",
          },
          copyFields: {
            type: "boolean",
            description:
              "Whether to inherit priority, dueDate, projectId, and tags from the parent (default true)",
          },
        },
        required: ["taskId", "subtasks"],
      },
    },
    async (args, ctx) => {
      const taskId = args.taskId as string;
      const subtaskTitles = args.subtasks as string[];
      const copyFields = (args.copyFields as boolean) ?? true;

      const parent = await ctx.taskService.get(taskId);
      if (!parent) {
        return JSON.stringify({ error: `Task not found: ${taskId}` });
      }

      if (subtaskTitles.length === 0) {
        return JSON.stringify({
          error: "No subtask titles provided",
        });
      }

      const created: { id: string; title: string }[] = [];

      for (const title of subtaskTitles) {
        const task = await ctx.taskService.create({
          title,
          parentId: taskId,
          tags: copyFields ? parent.tags.map((t) => t.name) : [],
          ...(copyFields
            ? {
                priority: parent.priority,
                dueDate: parent.dueDate,
                projectId: parent.projectId,
              }
            : {}),
        });
        created.push({ id: task.id, title: task.title });
      }

      return JSON.stringify({
        success: true,
        parent: { id: parent.id, title: parent.title },
        subtasks: created,
        count: created.length,
      });
    },
  );
}
