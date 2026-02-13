import { describe, it, expect } from "vitest";
import { exportJSON, exportCSV, exportMarkdown } from "../../src/core/export.js";
import type { Task } from "../../src/core/types.js";

function makeTasks(): Task[] {
  return [
    {
      id: "t1",
      title: "Buy groceries",
      description: "Milk and eggs",
      status: "pending",
      priority: 1,
      dueDate: "2025-12-25T00:00:00.000Z",
      dueTime: false,
      completedAt: null,
      projectId: null,
      recurrence: null,
      tags: [{ id: "tag1", name: "shopping", color: "#000" }],
      sortOrder: 0,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
    },
    {
      id: "t2",
      title: 'Task with "quotes" and, commas',
      description: null,
      status: "completed",
      priority: null,
      dueDate: null,
      dueTime: false,
      completedAt: "2025-06-01T12:00:00.000Z",
      projectId: "p1",
      recurrence: null,
      tags: [],
      sortOrder: 1,
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-06-01T12:00:00.000Z",
    },
  ];
}

describe("exportJSON", () => {
  it("produces valid JSON with all data", () => {
    const data = {
      tasks: makeTasks(),
      projects: [],
      tags: [{ id: "tag1", name: "shopping", color: "#000" }],
      exportedAt: "2025-06-01T00:00:00.000Z",
      version: "1.0",
    };

    const output = exportJSON(data);
    const parsed = JSON.parse(output);

    expect(parsed.tasks).toHaveLength(2);
    expect(parsed.version).toBe("1.0");
    expect(parsed.exportedAt).toBe("2025-06-01T00:00:00.000Z");
  });
});

describe("exportCSV", () => {
  it("produces correct headers", () => {
    const csv = exportCSV([]);
    expect(csv).toBe(
      "id,title,description,status,priority,dueDate,projectId,tags,recurrence,createdAt,updatedAt,completedAt",
    );
  });

  it("properly escapes commas and quotes", () => {
    const csv = exportCSV(makeTasks());
    const lines = csv.split("\n");

    expect(lines).toHaveLength(3); // header + 2 rows
    // Task with quotes and commas should be double-quoted
    expect(lines[2]).toContain('"Task with ""quotes"" and, commas"');
  });

  it("includes all task fields", () => {
    const csv = exportCSV(makeTasks());
    const lines = csv.split("\n");
    const firstRow = lines[1];

    expect(firstRow).toContain("t1");
    expect(firstRow).toContain("Buy groceries");
    expect(firstRow).toContain("shopping");
  });
});

describe("exportMarkdown", () => {
  it("formats pending tasks with [ ]", () => {
    const md = exportMarkdown(makeTasks());
    const lines = md.split("\n");

    expect(lines[0]).toMatch(/^- \[ \] Buy groceries/);
    expect(lines[0]).toContain("(P1)");
    expect(lines[0]).toContain("#shopping");
  });

  it("formats completed tasks with [x]", () => {
    const md = exportMarkdown(makeTasks());
    const lines = md.split("\n");

    expect(lines[1]).toMatch(/^- \[x\]/);
  });

  it("includes due dates", () => {
    const md = exportMarkdown(makeTasks());
    expect(md).toContain("due:");
  });
});
