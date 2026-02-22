import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  listTags,
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../../../src/ui/api/projects.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// listTags
// ---------------------------------------------------------------------------
describe("listTags", () => {
  it("GETs /api/tags", async () => {
    const tags = [{ id: "tag1", name: "urgent", color: "#ff0000" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(tags),
    });

    const result = await listTags();

    expect(mockFetch).toHaveBeenCalledWith("/api/tags");
    expect(result).toEqual(tags);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "DB error" }),
    });

    await expect(listTags()).rejects.toThrow("DB error");
  });
});

// ---------------------------------------------------------------------------
// listProjects
// ---------------------------------------------------------------------------
describe("listProjects", () => {
  it("GETs /api/projects", async () => {
    const projects = [{ id: "p1", name: "Work" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(projects),
    });

    const result = await listProjects();

    expect(mockFetch).toHaveBeenCalledWith("/api/projects");
    expect(result).toEqual(projects);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    await expect(listProjects()).rejects.toThrow("Server error");
  });
});

// ---------------------------------------------------------------------------
// createProject
// ---------------------------------------------------------------------------
describe("createProject", () => {
  it("POSTs to /api/projects with name only", async () => {
    const project = { id: "p2", name: "Personal" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(project),
    });

    const result = await createProject("Personal");

    expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Personal",
        color: undefined,
        icon: undefined,
        parentId: undefined,
        isFavorite: undefined,
        viewStyle: undefined,
      }),
    });
    expect(result).toEqual(project);
  });

  it("POSTs with all optional fields", async () => {
    const project = { id: "p3", name: "Sub" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(project),
    });

    const result = await createProject("Sub", "#00ff00", "folder", "p1", true, "board");

    expect(mockFetch).toHaveBeenCalledWith("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sub",
        color: "#00ff00",
        icon: "folder",
        parentId: "p1",
        isFavorite: true,
        viewStyle: "board",
      }),
    });
    expect(result).toEqual(project);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "name is required" }),
    });

    await expect(createProject("")).rejects.toThrow("name is required");
  });
});

// ---------------------------------------------------------------------------
// updateProject
// ---------------------------------------------------------------------------
describe("updateProject", () => {
  it("PATCHes /api/projects/:id with data", async () => {
    const updated = { id: "p1", name: "Renamed" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    const result = await updateProject("p1", { name: "Renamed" });

    expect(mockFetch).toHaveBeenCalledWith("/api/projects/p1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Renamed" }),
    });
    expect(result).toEqual(updated);
  });

  it("encodes special characters in id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(null),
    });

    await updateProject("id with spaces", { color: "#000" });

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/projects/id%20with%20spaces");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Project not found" }),
    });

    await expect(updateProject("bad", { name: "x" })).rejects.toThrow("Project not found");
  });
});

// ---------------------------------------------------------------------------
// deleteProject
// ---------------------------------------------------------------------------
describe("deleteProject", () => {
  it("DELETEs /api/projects/:id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteProject("p1");

    expect(mockFetch).toHaveBeenCalledWith("/api/projects/p1", {
      method: "DELETE",
    });
  });

  it("encodes special characters in id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteProject("special/id");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/projects/special%2Fid");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Delete failed" }),
    });

    await expect(deleteProject("p1")).rejects.toThrow("Delete failed");
  });
});
