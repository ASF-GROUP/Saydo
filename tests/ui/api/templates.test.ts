import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  instantiateTemplate,
} from "../../../src/ui/api/templates.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// listTemplates
// ---------------------------------------------------------------------------
describe("listTemplates", () => {
  it("GETs /api/templates", async () => {
    const templates = [{ id: "tpl1", name: "Daily standup", title: "Standup" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(templates),
    });

    const result = await listTemplates();

    expect(mockFetch).toHaveBeenCalledWith("/api/templates");
    expect(result).toEqual(templates);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "DB error" }),
    });

    await expect(listTemplates()).rejects.toThrow("DB error");
  });
});

// ---------------------------------------------------------------------------
// createTemplate
// ---------------------------------------------------------------------------
describe("createTemplate", () => {
  it("POSTs to /api/templates with input", async () => {
    const template = { id: "tpl2", name: "Weekly review" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(template),
    });

    const input = { name: "Weekly review", title: "Review {{week}}", priority: 2 };
    const result = await createTemplate(input as any);

    expect(mockFetch).toHaveBeenCalledWith("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    expect(result).toEqual(template);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: "Name required" }),
    });

    await expect(createTemplate({ name: "", title: "" } as any)).rejects.toThrow("Name required");
  });
});

// ---------------------------------------------------------------------------
// updateTemplate
// ---------------------------------------------------------------------------
describe("updateTemplate", () => {
  it("PATCHes /api/templates/:id", async () => {
    const updated = { id: "tpl1", name: "Updated" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    });

    const result = await updateTemplate("tpl1", { name: "Updated" } as any);

    expect(mockFetch).toHaveBeenCalledWith("/api/templates/tpl1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
    expect(result).toEqual(updated);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Template not found" }),
    });

    await expect(updateTemplate("bad", {} as any)).rejects.toThrow("Template not found");
  });
});

// ---------------------------------------------------------------------------
// deleteTemplate
// ---------------------------------------------------------------------------
describe("deleteTemplate", () => {
  it("DELETEs /api/templates/:id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await deleteTemplate("tpl1");

    expect(mockFetch).toHaveBeenCalledWith("/api/templates/tpl1", {
      method: "DELETE",
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Delete failed" }),
    });

    await expect(deleteTemplate("tpl1")).rejects.toThrow("Delete failed");
  });
});

// ---------------------------------------------------------------------------
// instantiateTemplate
// ---------------------------------------------------------------------------
describe("instantiateTemplate", () => {
  it("POSTs to /api/templates/:id/instantiate with variables", async () => {
    const task = { id: "t99", title: "Review Week 10" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(task),
    });

    const result = await instantiateTemplate("tpl1", { week: "10" });

    expect(mockFetch).toHaveBeenCalledWith("/api/templates/tpl1/instantiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: { week: "10" } }),
    });
    expect(result).toEqual(task);
  });

  it("sends empty variables when none provided", async () => {
    const task = { id: "t100", title: "Standup" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(task),
    });

    const result = await instantiateTemplate("tpl1");

    expect(mockFetch).toHaveBeenCalledWith("/api/templates/tpl1/instantiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variables: {} }),
    });
    expect(result).toEqual(task);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Template not found" }),
    });

    await expect(instantiateTemplate("bad")).rejects.toThrow("Template not found");
  });
});
