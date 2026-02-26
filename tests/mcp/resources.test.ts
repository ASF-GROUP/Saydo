import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createMcpTestEnv } from "./helpers.js";

let env: Awaited<ReturnType<typeof createMcpTestEnv>>;

describe("MCP Resources", () => {
  beforeEach(async () => {
    env = await createMcpTestEnv();
  });

  afterEach(async () => {
    await env.cleanup();
  });

  it("lists all static resources", async () => {
    const result = await env.client.listResources();
    const uris = result.resources.map((r) => r.uri);

    expect(uris).toContain("saydo://tasks/pending");
    expect(uris).toContain("saydo://tasks/today");
    expect(uris).toContain("saydo://tasks/overdue");
    expect(uris).toContain("saydo://projects");
    expect(uris).toContain("saydo://tags");
    expect(uris).toContain("saydo://stats/today");
  });

  it("lists resource templates", async () => {
    const result = await env.client.listResourceTemplates();
    const templates = result.resourceTemplates.map((t) => t.uriTemplate);

    expect(templates).toContain("saydo://tasks/{taskId}");
    expect(templates).toContain("saydo://projects/{projectId}");
  });

  it("reads pending tasks (empty)", async () => {
    const result = await env.client.readResource({ uri: "saydo://tasks/pending" });
    expect(result.contents).toHaveLength(1);
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toEqual([]);
  });

  it("reads pending tasks (with data)", async () => {
    await env.services.taskService.create({
      title: "Test task",
      dueTime: false,
    });

    const result = await env.client.readResource({ uri: "saydo://tasks/pending" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Test task");
    expect(data[0].status).toBe("pending");
  });

  it("reads today tasks (includes overdue)", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await env.services.taskService.create({
      title: "Overdue task",
      dueDate: yesterday.toISOString(),
      dueTime: false,
    });

    const result = await env.client.readResource({ uri: "saydo://tasks/today" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Overdue task");
  });

  it("reads overdue tasks", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await env.services.taskService.create({
      title: "Past due",
      dueDate: yesterday.toISOString(),
      dueTime: false,
    });

    const result = await env.client.readResource({ uri: "saydo://tasks/overdue" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("Past due");
  });

  it("reads projects (empty)", async () => {
    const result = await env.client.readResource({ uri: "saydo://projects" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toEqual([]);
  });

  it("reads projects (excludes archived)", async () => {
    const proj = await env.services.projectService.create("Active");
    const arch = await env.services.projectService.create("Archived");
    await env.services.projectService.archive(arch.id);

    const result = await env.client.readResource({ uri: "saydo://projects" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("Active");
    expect(data[0].id).toBe(proj.id);
  });

  it("reads tags", async () => {
    await env.services.tagService.create("work", "#0000ff");
    await env.services.tagService.create("personal", "#00ff00");

    const result = await env.client.readResource({ uri: "saydo://tags" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toHaveLength(2);
    const names = data.map((t: { name: string }) => t.name);
    expect(names).toContain("work");
    expect(names).toContain("personal");
  });

  it("reads today stats", async () => {
    const result = await env.client.readResource({ uri: "saydo://stats/today" });
    const data = JSON.parse(result.contents[0].text!);
    expect(data).toHaveProperty("tasksCompleted");
    expect(data).toHaveProperty("tasksCreated");
    expect(data).toHaveProperty("currentStreak");
  });

  it("reads a single task by ID", async () => {
    const task = await env.services.taskService.create({
      title: "Detail task",
      dueTime: false,
      priority: 1,
    });

    const result = await env.client.readResource({
      uri: `saydo://tasks/${task.id}`,
    });
    const data = JSON.parse(result.contents[0].text!);
    expect(data.id).toBe(task.id);
    expect(data.title).toBe("Detail task");
    expect(data.priority).toBe(1);
  });

  it("returns error for non-existent task", async () => {
    const result = await env.client.readResource({
      uri: "saydo://tasks/nonexistent-id",
    });
    const data = JSON.parse(result.contents[0].text!);
    expect(data.error).toContain("not found");
  });

  it("reads a project with its tasks", async () => {
    const project = await env.services.projectService.create("My Project");
    await env.services.taskService.create({
      title: "Project task 1",
      projectId: project.id,
      dueTime: false,
    });
    await env.services.taskService.create({
      title: "Project task 2",
      projectId: project.id,
      dueTime: false,
    });

    const result = await env.client.readResource({
      uri: `saydo://projects/${project.id}`,
    });
    const data = JSON.parse(result.contents[0].text!);
    expect(data.name).toBe("My Project");
    expect(data.tasks).toHaveLength(2);
  });

  it("returns error for non-existent project", async () => {
    const result = await env.client.readResource({
      uri: "saydo://projects/nonexistent-id",
    });
    const data = JSON.parse(result.contents[0].text!);
    expect(data.error).toContain("not found");
  });
});
