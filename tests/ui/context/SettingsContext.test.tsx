import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act, waitFor } from "@testing-library/react";
import { SettingsProvider, useGeneralSettings } from "../../../src/ui/context/SettingsContext.js";

// Mock the api module
vi.mock("../../../src/ui/api/index.js", () => ({
  api: {
    getAppSetting: vi.fn().mockResolvedValue(null),
    setAppSetting: vi.fn().mockResolvedValue(undefined),
  },
}));

import { api } from "../../../src/ui/api/index.js";

function TestConsumer() {
  const { settings, loaded, updateSetting } = useGeneralSettings();
  return (
    <div>
      <span data-testid="loaded">{String(loaded)}</span>
      <span data-testid="accent">{settings.accent_color}</span>
      <span data-testid="density">{settings.density}</span>
      <span data-testid="date-format">{settings.date_format}</span>
      <span data-testid="time-format">{settings.time_format}</span>
      <span data-testid="default-priority">{settings.default_priority}</span>
      <span data-testid="confirm-delete">{settings.confirm_delete}</span>
      <span data-testid="start-view">{settings.start_view}</span>
      <span data-testid="week-start">{settings.week_start}</span>
      <button data-testid="set-accent" onClick={() => updateSetting("accent_color", "#ef4444")}>
        Set accent
      </button>
      <button data-testid="set-density" onClick={() => updateSetting("density", "compact")}>
        Set density
      </button>
    </div>
  );
}

describe("SettingsContext", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset document element state
    document.documentElement.style.removeProperty("--color-accent");
    document.documentElement.style.removeProperty("--color-accent-hover");
    document.documentElement.classList.remove("density-compact", "density-comfortable");
  });

  it("provides default settings when none are stored", async () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("true");
    });

    expect(screen.getByTestId("accent").textContent).toBe("#3b82f6");
    expect(screen.getByTestId("density").textContent).toBe("default");
    expect(screen.getByTestId("date-format").textContent).toBe("relative");
    expect(screen.getByTestId("time-format").textContent).toBe("12h");
    expect(screen.getByTestId("default-priority").textContent).toBe("none");
    expect(screen.getByTestId("confirm-delete").textContent).toBe("true");
    expect(screen.getByTestId("start-view").textContent).toBe("inbox");
    expect(screen.getByTestId("week-start").textContent).toBe("sunday");
  });

  it("loads settings from api on mount", async () => {
    (api.getAppSetting as any).mockImplementation((key: string) => {
      if (key === "accent_color") return Promise.resolve("#ef4444");
      if (key === "density") return Promise.resolve("compact");
      if (key === "start_view") return Promise.resolve("today");
      return Promise.resolve(null);
    });

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("true");
    });

    expect(screen.getByTestId("accent").textContent).toBe("#ef4444");
    expect(screen.getByTestId("density").textContent).toBe("compact");
    expect(screen.getByTestId("start-view").textContent).toBe("today");
  });

  it("updateSetting persists to api and updates context", async () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("true");
    });

    act(() => {
      screen.getByTestId("set-accent").click();
    });

    expect(screen.getByTestId("accent").textContent).toBe("#ef4444");
    expect(api.setAppSetting).toHaveBeenCalledWith("accent_color", "#ef4444");
  });

  it("accent color change applies CSS variable to documentElement", async () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("true");
    });

    act(() => {
      screen.getByTestId("set-accent").click();
    });

    expect(document.documentElement.style.getPropertyValue("--color-accent")).toBe("#ef4444");
    expect(document.documentElement.style.getPropertyValue("--color-accent-hover")).toBeTruthy();
  });

  it("density change applies CSS class to documentElement", async () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("loaded").textContent).toBe("true");
    });

    act(() => {
      screen.getByTestId("set-density").click();
    });

    expect(document.documentElement.classList.contains("density-compact")).toBe(true);
    expect(document.documentElement.classList.contains("density-comfortable")).toBe(false);
  });
});
