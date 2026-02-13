import type { Task, Project, Tag } from "./types.js";

export interface ExportData {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  exportedAt: string;
  version: string;
}

/** Export all data as a structured JSON string. */
export function exportJSON(data: ExportData): string {
  return JSON.stringify(data, null, 2);
}

/** Export tasks as CSV. */
export function exportCSV(tasks: Task[]): string {
  const headers = [
    "id",
    "title",
    "description",
    "status",
    "priority",
    "dueDate",
    "projectId",
    "tags",
    "recurrence",
    "createdAt",
    "updatedAt",
    "completedAt",
  ];

  const rows = tasks.map((task) => {
    return [
      escapeCSV(task.id),
      escapeCSV(task.title),
      escapeCSV(task.description ?? ""),
      escapeCSV(task.status),
      task.priority?.toString() ?? "",
      task.dueDate ?? "",
      task.projectId ?? "",
      escapeCSV(task.tags.map((t) => t.name).join(", ")),
      task.recurrence ?? "",
      task.createdAt,
      task.updatedAt,
      task.completedAt ?? "",
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

/** Export tasks as Markdown checkbox list. */
export function exportMarkdown(tasks: Task[]): string {
  const lines = tasks.map((task) => {
    const checkbox = task.status === "completed" ? "[x]" : "[ ]";
    const parts = [`- ${checkbox} ${task.title}`];

    if (task.priority) parts.push(`(P${task.priority})`);
    if (task.tags.length > 0) parts.push(task.tags.map((t) => `#${t.name}`).join(" "));
    if (task.dueDate) parts.push(`due: ${new Date(task.dueDate).toLocaleDateString()}`);

    return parts.join(" ");
  });

  return lines.join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
