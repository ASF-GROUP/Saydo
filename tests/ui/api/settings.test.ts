import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  getAppSetting,
  setAppSetting,
  exportAllData,
  getStorageInfo,
} from "../../../src/ui/api/settings.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getAppSetting
// ---------------------------------------------------------------------------
describe("getAppSetting", () => {
  it("GETs /api/settings/:key and returns value", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ value: "dark" }),
    });

    const result = await getAppSetting("theme");

    expect(mockFetch).toHaveBeenCalledWith("/api/settings/theme");
    expect(result).toBe("dark");
  });

  it("returns null when value is null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ value: null }),
    });

    const result = await getAppSetting("missing_key");

    expect(result).toBeNull();
  });

  it("returns null on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({}),
    });

    const result = await getAppSetting("nonexistent");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setAppSetting
// ---------------------------------------------------------------------------
describe("setAppSetting", () => {
  it("PUTs to /api/settings/:key with value", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await setAppSetting("theme", "dark");

    expect(mockFetch).toHaveBeenCalledWith("/api/settings/theme", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: "dark" }),
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Write failed" }),
    });

    await expect(setAppSetting("key", "val")).rejects.toThrow("Write failed");
  });
});

// ---------------------------------------------------------------------------
// getStorageInfo
// ---------------------------------------------------------------------------
describe("getStorageInfo", () => {
  it("GETs /api/settings/storage", async () => {
    const info = { mode: "sqlite", path: "./data/saydo.db" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(info),
    });

    const result = await getStorageInfo();

    expect(mockFetch).toHaveBeenCalledWith("/api/settings/storage");
    expect(result).toEqual(info);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Config error" }),
    });

    await expect(getStorageInfo()).rejects.toThrow("Config error");
  });
});

// ---------------------------------------------------------------------------
// exportAllData
// ---------------------------------------------------------------------------
describe("exportAllData", () => {
  it("calls listTasks and listProjects, extracts tags from tasks", async () => {
    const tasks = [
      {
        id: "t1",
        title: "Task 1",
        tags: [
          { id: "tag1", name: "urgent", color: "#f00" },
          { id: "tag2", name: "work", color: "#0f0" },
        ],
      },
      {
        id: "t2",
        title: "Task 2",
        tags: [{ id: "tag1", name: "urgent", color: "#f00" }],
      },
    ];
    const projects = [{ id: "p1", name: "Work" }];

    // exportAllData calls listTasks() then listProjects() via Promise.all
    // Both internally call fetch
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(tasks),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(projects),
      });

    const result = await exportAllData();

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.tasks).toEqual(tasks);
    expect(result.projects).toEqual(projects);
    // Tags should be deduplicated
    expect(result.tags).toHaveLength(2);
    expect(result.tags).toContainEqual({ id: "tag1", name: "urgent", color: "#f00" });
    expect(result.tags).toContainEqual({ id: "tag2", name: "work", color: "#0f0" });
  });

  it("returns empty tags when tasks have no tags", async () => {
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: "t1", title: "No tags", tags: [] }]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      });

    const result = await exportAllData();

    expect(result.tags).toEqual([]);
  });
});
