import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import PomodoroPlugin from "../../src/plugins/builtin/pomodoro/index.js";
import type { PluginAPI, PluginSettingsAccessor } from "../../src/plugins/api.js";

function createMockAPI() {
  const registeredCommands: { id: string; name: string; callback: () => void }[] = [];
  let statusBarText = "";
  let statusBarIcon = "";
  let viewRender: (() => string) | null = null;

  const api = {
    commands: {
      register: (cmd: { id: string; name: string; callback: () => void }) => {
        registeredCommands.push(cmd);
      },
    },
    ui: {
      addStatusBarItem: (item: { id: string; text: string; icon: string }) => {
        statusBarText = item.text;
        statusBarIcon = item.icon;
        return {
          update: (data: { text?: string; icon?: string }) => {
            if (data.text !== undefined) statusBarText = data.text;
            if (data.icon !== undefined) statusBarIcon = data.icon;
          },
        };
      },
      addSidebarPanel: undefined,
      addView: (view: {
        id: string;
        name: string;
        icon: string;
        slot?: string;
        contentType?: string;
        render?: () => string;
      }) => {
        viewRender = view.render ?? null;
      },
    },
    tasks: { list: undefined, create: undefined },
    storage: undefined,
    events: { on: vi.fn(), off: vi.fn() },
    settings: {
      get: vi.fn(),
      set: vi.fn(),
    },
  };

  return {
    api: api as unknown as PluginAPI,
    registeredCommands,
    getStatusBarText: () => statusBarText,
    getStatusBarIcon: () => statusBarIcon,
    getViewContent: () => {
      const raw = viewRender?.() ?? "";
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
    getViewContentRaw: () => viewRender?.() ?? "",
    settings: api.settings as unknown as PluginSettingsAccessor,
  };
}

function setupDefaultSettings(settingsGet: ReturnType<typeof vi.fn>) {
  settingsGet.mockImplementation((key: string) => {
    const defaults: Record<string, number> = {
      workMinutes: 25,
      breakMinutes: 5,
      longBreakMinutes: 15,
      sessionsBeforeLongBreak: 4,
    };
    return defaults[key];
  });
}

/** Helper to extract text values from structured content elements */
function findElement(content: { elements: Array<{ type: string; value?: string; variant?: string; elements?: unknown[] }> }, type: string, variant?: string) {
  return content.elements.find(
    (e: { type: string; variant?: string }) => e.type === type && (!variant || e.variant === variant),
  );
}

function findBadges(content: { elements: Array<{ type: string; elements?: Array<{ type: string; value?: string }> }> }): Array<{ type: string; value?: string }> {
  const row = content.elements.find(
    (e) => e.type === "row" && e.elements?.some((child) => child.type === "badge"),
  );
  return (row?.elements?.filter((e) => e.type === "badge") ?? []) as Array<{ type: string; value?: string }>;
}

describe("Pomodoro Plugin", () => {
  let plugin: PomodoroPlugin;
  let mock: ReturnType<typeof createMockAPI>;

  beforeEach(async () => {
    vi.useFakeTimers();
    plugin = new PomodoroPlugin();
    mock = createMockAPI();
    plugin.app = mock.api;
    plugin.settings = mock.settings;
    setupDefaultSettings(mock.settings.get as ReturnType<typeof vi.fn>);
    await plugin.onLoad();
  });

  afterEach(async () => {
    await plugin.onUnload();
    vi.useRealTimers();
  });

  it("should register 4 commands", () => {
    expect(mock.registeredCommands).toHaveLength(4);
    const names = mock.registeredCommands.map((c) => c.name);
    expect(names).toContain("Pomodoro: Start");
    expect(names).toContain("Pomodoro: Pause");
    expect(names).toContain("Pomodoro: Reset");
    expect(names).toContain("Pomodoro: Skip");
  });

  it("should show Ready in status bar when idle", () => {
    expect(mock.getStatusBarText()).toBe("Ready");
  });

  it("should return valid structured JSON from view", () => {
    const raw = mock.getViewContentRaw();
    expect(() => JSON.parse(raw)).not.toThrow();

    const content = mock.getViewContent();
    expect(content).not.toBeNull();
    expect(content.layout).toBe("center");
    expect(Array.isArray(content.elements)).toBe(true);
  });

  it("should show view content with initial state", () => {
    const content = mock.getViewContent();
    const phaseLabel = findElement(content, "text", "subtitle");
    expect(phaseLabel?.value).toBe("Work");

    const timer = findElement(content, "text", "mono");
    expect(timer?.value).toBe("25:00");

    const badges = findBadges(content);
    expect(badges.some((b) => b.value === "Session 1/4")).toBe(true);
    expect(badges.some((b) => b.value === "Idle")).toBe(true);
  });

  describe("Timer operations", () => {
    function executeCommand(name: string) {
      const cmd = mock.registeredCommands.find((c) => c.name === name);
      cmd?.callback();
    }

    it("should start timer and count down", () => {
      executeCommand("Pomodoro: Start");

      // Tick 1 second
      vi.advanceTimersByTime(1000);
      expect(mock.getStatusBarText()).toBe("24:59");

      // Tick 59 more seconds
      vi.advanceTimersByTime(59000);
      expect(mock.getStatusBarText()).toBe("24:00");
    });

    it("should pause timer", () => {
      executeCommand("Pomodoro: Start");
      vi.advanceTimersByTime(5000);

      executeCommand("Pomodoro: Pause");
      expect(mock.getStatusBarText()).toBe("24:55 (paused)");

      // Should not tick further
      vi.advanceTimersByTime(5000);
      expect(mock.getStatusBarText()).toBe("24:55 (paused)");
    });

    it("should reset timer to beginning of phase", () => {
      executeCommand("Pomodoro: Start");
      vi.advanceTimersByTime(60000); // 1 minute

      executeCommand("Pomodoro: Reset");
      expect(mock.getStatusBarText()).toBe("Ready");

      const content = mock.getViewContent();
      const timer = findElement(content, "text", "mono");
      expect(timer?.value).toBe("25:00");
    });

    it("should skip to next phase", () => {
      executeCommand("Pomodoro: Skip");

      const content = mock.getViewContent();
      const phaseLabel = findElement(content, "text", "subtitle");
      expect(phaseLabel?.value).toBe("Break");

      const timer = findElement(content, "text", "mono");
      expect(timer?.value).toBe("05:00");
    });

    it("should transition from work to break automatically", () => {
      executeCommand("Pomodoro: Start");

      // Advance through full 25 minutes
      vi.advanceTimersByTime(25 * 60 * 1000);

      const content = mock.getViewContent();
      const phaseLabel = findElement(content, "text", "subtitle");
      expect(phaseLabel?.value).toBe("Break");
    });

    it("should transition to long break after configured sessions", () => {
      // Simulate: work → break → work → break → work → break → work → long break
      // sessionsBeforeLongBreak = 4, so after 4 work sessions it should be a long break

      executeCommand("Pomodoro: Start");

      // Session 1: work (25min) + break (5min) = 30min
      vi.advanceTimersByTime(25 * 60 * 1000); // work done → auto break
      vi.advanceTimersByTime(5 * 60 * 1000); // break done → auto work

      // Session 2: work (25min) + break (5min) = 30min
      vi.advanceTimersByTime(25 * 60 * 1000);
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Session 3: work (25min) + break (5min) = 30min
      vi.advanceTimersByTime(25 * 60 * 1000);
      vi.advanceTimersByTime(5 * 60 * 1000);

      // Session 4: work (25min) → should get long break
      vi.advanceTimersByTime(25 * 60 * 1000);

      const content = mock.getViewContent();
      const phaseLabel = findElement(content, "text", "subtitle");
      expect(phaseLabel?.value).toBe("Long Break");

      const timer = findElement(content, "text", "mono");
      expect(timer?.value).toBe("15:00");
    });

    it("should resume from paused state", () => {
      executeCommand("Pomodoro: Start");
      vi.advanceTimersByTime(5000); // 5 seconds

      executeCommand("Pomodoro: Pause");
      const pausedTime = mock.getStatusBarText(); // "24:55 (paused)"
      expect(pausedTime).toContain("24:55");

      executeCommand("Pomodoro: Start");
      vi.advanceTimersByTime(1000);
      expect(mock.getStatusBarText()).toBe("24:54");
    });

    it("should show correct button labels for each state", () => {
      // Idle — should show "Start"
      let content = mock.getViewContent();
      let buttonRow = content.elements.find(
        (e: { type: string; elements?: Array<{ type: string }> }) =>
          e.type === "row" && e.elements?.some((c: { type: string }) => c.type === "button"),
      );
      let buttons = buttonRow?.elements?.filter((e: { type: string }) => e.type === "button") ?? [];
      expect(buttons[0]?.label).toBe("Start");

      // Running — should show "Pause"
      executeCommand("Pomodoro: Start");
      content = mock.getViewContent();
      buttonRow = content.elements.find(
        (e: { type: string; elements?: Array<{ type: string }> }) =>
          e.type === "row" && e.elements?.some((c: { type: string }) => c.type === "button"),
      );
      buttons = buttonRow?.elements?.filter((e: { type: string }) => e.type === "button") ?? [];
      expect(buttons[0]?.label).toBe("Pause");

      // Paused — should show "Resume"
      executeCommand("Pomodoro: Pause");
      content = mock.getViewContent();
      buttonRow = content.elements.find(
        (e: { type: string; elements?: Array<{ type: string }> }) =>
          e.type === "row" && e.elements?.some((c: { type: string }) => c.type === "button"),
      );
      buttons = buttonRow?.elements?.filter((e: { type: string }) => e.type === "button") ?? [];
      expect(buttons[0]?.label).toBe("Resume");
    });
  });

  describe("Settings integration", () => {
    function _executeCommand(name: string) {
      const cmd = mock.registeredCommands.find((c) => c.name === name);
      cmd?.callback();
    }

    it("should use custom work duration", async () => {
      await plugin.onUnload();

      const customMock = createMockAPI();
      (customMock.settings.get as ReturnType<typeof vi.fn>).mockImplementation((key: string) => {
        if (key === "workMinutes") return 10;
        if (key === "breakMinutes") return 3;
        if (key === "longBreakMinutes") return 10;
        if (key === "sessionsBeforeLongBreak") return 2;
        return 0;
      });

      const customPlugin = new PomodoroPlugin();
      customPlugin.app = customMock.api;
      customPlugin.settings = customMock.settings;
      await customPlugin.onLoad();

      const content = customMock.getViewContent();
      const timer = findElement(content, "text", "mono");
      expect(timer?.value).toBe("10:00");

      const badges = findBadges(content);
      expect(badges.some((b) => b.value === "Session 1/2")).toBe(true);

      await customPlugin.onUnload();
    });
  });
});
