import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: () => false,
}));

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

import {
  listPlugins,
  getPluginSettings,
  updatePluginSetting,
  listPluginCommands,
  executePluginCommand,
  getStatusBarItems,
  getPluginPanels,
  getPluginViews,
  getPluginViewContent,
  getPluginPermissions,
  approvePluginPermissions,
  revokePluginPermissions,
  getPluginStore,
  installPlugin,
  uninstallPlugin,
  togglePlugin,
} from "../../../src/ui/api/plugins.js";

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// listPlugins
// ---------------------------------------------------------------------------
describe("listPlugins", () => {
  it("GETs /api/plugins", async () => {
    const plugins = [{ id: "pomodoro", name: "Pomodoro", enabled: true }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(plugins),
    });

    const result = await listPlugins();

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins");
    expect(result).toEqual(plugins);
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Failed to load plugins" }),
    });

    await expect(listPlugins()).rejects.toThrow("Failed to load plugins");
  });
});

// ---------------------------------------------------------------------------
// getPluginSettings
// ---------------------------------------------------------------------------
describe("getPluginSettings", () => {
  it("GETs /api/plugins/:id/settings", async () => {
    const settings = { duration: 25, breakTime: 5 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(settings),
    });

    const result = await getPluginSettings("pomodoro");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/pomodoro/settings");
    expect(result).toEqual(settings);
  });
});

// ---------------------------------------------------------------------------
// updatePluginSetting
// ---------------------------------------------------------------------------
describe("updatePluginSetting", () => {
  it("PUTs to /api/plugins/:id/settings with key and value", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await updatePluginSetting("pomodoro", "duration", 30);

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/pomodoro/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: "duration", value: 30 }),
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Setting update failed" }),
    });

    await expect(updatePluginSetting("pomodoro", "bad", null)).rejects.toThrow(
      "Setting update failed",
    );
  });
});

// ---------------------------------------------------------------------------
// listPluginCommands
// ---------------------------------------------------------------------------
describe("listPluginCommands", () => {
  it("GETs /api/plugins/commands", async () => {
    const commands = [{ id: "start-timer", name: "Start Timer", hotkey: "Ctrl+T" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(commands),
    });

    const result = await listPluginCommands();

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/commands");
    expect(result).toEqual(commands);
  });
});

// ---------------------------------------------------------------------------
// executePluginCommand
// ---------------------------------------------------------------------------
describe("executePluginCommand", () => {
  it("POSTs to /api/plugins/commands/:id", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await executePluginCommand("start-timer");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/commands/start-timer", {
      method: "POST",
    });
  });

  it("encodes command id with special characters", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await executePluginCommand("plugin:do something");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/plugins/commands/plugin%3Ado%20something");
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Command not found" }),
    });

    await expect(executePluginCommand("nonexistent")).rejects.toThrow("Command not found");
  });
});

// ---------------------------------------------------------------------------
// getStatusBarItems
// ---------------------------------------------------------------------------
describe("getStatusBarItems", () => {
  it("GETs /api/plugins/ui/status-bar", async () => {
    const items = [{ id: "timer", text: "25:00", icon: "clock" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(items),
    });

    const result = await getStatusBarItems();

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/ui/status-bar");
    expect(result).toEqual(items);
  });
});

// ---------------------------------------------------------------------------
// getPluginPanels
// ---------------------------------------------------------------------------
describe("getPluginPanels", () => {
  it("GETs /api/plugins/ui/panels", async () => {
    const panels = [{ id: "timer-panel", title: "Timer", icon: "clock", content: "<div/>" }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(panels),
    });

    const result = await getPluginPanels();

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/ui/panels");
    expect(result).toEqual(panels);
  });
});

// ---------------------------------------------------------------------------
// getPluginViews
// ---------------------------------------------------------------------------
describe("getPluginViews", () => {
  it("GETs /api/plugins/ui/views", async () => {
    const views = [
      {
        id: "calendar",
        name: "Calendar",
        icon: "cal",
        slot: "navigation",
        contentType: "structured",
        pluginId: "calendar-plugin",
      },
    ];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(views),
    });

    const result = await getPluginViews();

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/ui/views");
    expect(result).toEqual(views);
  });
});

// ---------------------------------------------------------------------------
// getPluginViewContent
// ---------------------------------------------------------------------------
describe("getPluginViewContent", () => {
  it("GETs /api/plugins/ui/views/:id/content and returns content string", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: "<div>Calendar view</div>" }),
    });

    const result = await getPluginViewContent("calendar");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/ui/views/calendar/content");
    expect(result).toBe("<div>Calendar view</div>");
  });

  it("encodes view id", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ content: "" }),
    });

    await getPluginViewContent("view with spaces");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toBe("/api/plugins/ui/views/view%20with%20spaces/content");
  });
});

// ---------------------------------------------------------------------------
// getPluginPermissions
// ---------------------------------------------------------------------------
describe("getPluginPermissions", () => {
  it("GETs /api/plugins/:id/permissions and returns permissions array", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ permissions: ["tasks:read", "tasks:write"] }),
    });

    const result = await getPluginPermissions("pomodoro");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/pomodoro/permissions");
    expect(result).toEqual(["tasks:read", "tasks:write"]);
  });

  it("returns null when permissions are null", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ permissions: null }),
    });

    const result = await getPluginPermissions("new-plugin");

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// approvePluginPermissions
// ---------------------------------------------------------------------------
describe("approvePluginPermissions", () => {
  it("POSTs to /api/plugins/:id/permissions/approve", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await approvePluginPermissions("pomodoro", ["tasks:read"]);

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/pomodoro/permissions/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ permissions: ["tasks:read"] }),
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Approval failed" }),
    });

    await expect(approvePluginPermissions("bad", ["x"])).rejects.toThrow("Approval failed");
  });
});

// ---------------------------------------------------------------------------
// revokePluginPermissions
// ---------------------------------------------------------------------------
describe("revokePluginPermissions", () => {
  it("POSTs to /api/plugins/:id/permissions/revoke", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await revokePluginPermissions("pomodoro");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/pomodoro/permissions/revoke", {
      method: "POST",
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Revoke failed" }),
    });

    await expect(revokePluginPermissions("bad")).rejects.toThrow("Revoke failed");
  });
});

// ---------------------------------------------------------------------------
// getPluginStore
// ---------------------------------------------------------------------------
describe("getPluginStore", () => {
  it("GETs /api/plugins/store", async () => {
    const store = {
      plugins: [{ id: "calendar", name: "Calendar Plugin", version: "1.0.0" }],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(store),
    });

    const result = await getPluginStore();

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/store");
    expect(result).toEqual(store);
  });
});

// ---------------------------------------------------------------------------
// installPlugin
// ---------------------------------------------------------------------------
describe("installPlugin", () => {
  it("POSTs to /api/plugins/install and succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await installPlugin("calendar", "https://example.com/cal.zip");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/install", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pluginId: "calendar",
        downloadUrl: "https://example.com/cal.zip",
      }),
    });
  });

  it("throws when server responds with success: false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, error: "Download failed" }),
    });

    await expect(installPlugin("cal", "https://bad.url")).rejects.toThrow("Download failed");
  });

  it("throws generic message when error is not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });

    await expect(installPlugin("cal", "https://bad.url")).rejects.toThrow("Install failed");
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: "Server error" }),
    });

    await expect(installPlugin("cal", "https://x")).rejects.toThrow("Server error");
  });
});

// ---------------------------------------------------------------------------
// uninstallPlugin
// ---------------------------------------------------------------------------
describe("uninstallPlugin", () => {
  it("POSTs to /api/plugins/:id/uninstall and succeeds", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });

    await uninstallPlugin("calendar");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/calendar/uninstall", {
      method: "POST",
    });
  });

  it("throws when success is false", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false, error: "Cannot uninstall built-in" }),
    });

    await expect(uninstallPlugin("builtin")).rejects.toThrow("Cannot uninstall built-in");
  });

  it("throws generic message when error is not provided", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: false }),
    });

    await expect(uninstallPlugin("x")).rejects.toThrow("Uninstall failed");
  });
});

// ---------------------------------------------------------------------------
// togglePlugin
// ---------------------------------------------------------------------------
describe("togglePlugin", () => {
  it("POSTs to /api/plugins/:id/toggle", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true });

    await togglePlugin("pomodoro");

    expect(mockFetch).toHaveBeenCalledWith("/api/plugins/pomodoro/toggle", {
      method: "POST",
    });
  });

  it("throws on error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: "Plugin not found" }),
    });

    await expect(togglePlugin("nonexistent")).rejects.toThrow("Plugin not found");
  });
});
