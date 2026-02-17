import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";

// Mock sounds module
vi.mock("../../../src/utils/sounds.js", () => ({
  playSound: vi.fn().mockResolvedValue(undefined),
}));

// Mock SettingsContext
const mockSettings = {
  sound_enabled: "true" as const,
  sound_volume: "70",
  sound_complete: "true" as const,
  sound_create: "true" as const,
  sound_delete: "true" as const,
  sound_reminder: "true" as const,
  accent_color: "#3b82f6",
  density: "default" as const,
  font_size: "default" as const,
  reduce_animations: "false" as const,
  week_start: "sunday" as const,
  date_format: "relative" as const,
  time_format: "12h" as const,
  default_priority: "none" as const,
  confirm_delete: "true" as const,
  start_view: "inbox" as const,
};

vi.mock("../../../src/ui/context/SettingsContext.js", () => ({
  useGeneralSettings: () => ({
    settings: { ...mockSettings },
    loaded: true,
    updateSetting: vi.fn(),
  }),
}));

import { playSound } from "../../../src/utils/sounds.js";
import { useSoundEffect } from "../../../src/ui/hooks/useSoundEffect.js";

describe("useSoundEffect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to defaults
    mockSettings.sound_enabled = "true";
    mockSettings.sound_volume = "70";
    mockSettings.sound_complete = "true";
    mockSettings.sound_create = "true";
    mockSettings.sound_delete = "true";
    mockSettings.sound_reminder = "true";
  });

  it("plays sound when enabled", () => {
    const { result } = renderHook(() => useSoundEffect());
    result.current("complete");
    expect(playSound).toHaveBeenCalledWith("complete", 0.7);
  });

  it("converts volume percentage to 0-1 range", () => {
    mockSettings.sound_volume = "50";
    const { result } = renderHook(() => useSoundEffect());
    result.current("create");
    expect(playSound).toHaveBeenCalledWith("create", 0.5);
  });

  it("does not play when master toggle is off", () => {
    mockSettings.sound_enabled = "false";
    const { result } = renderHook(() => useSoundEffect());
    result.current("complete");
    expect(playSound).not.toHaveBeenCalled();
  });

  it("does not play when per-event toggle is off", () => {
    mockSettings.sound_complete = "false";
    const { result } = renderHook(() => useSoundEffect());
    result.current("complete");
    expect(playSound).not.toHaveBeenCalled();
  });

  it("does not play when volume is 0", () => {
    mockSettings.sound_volume = "0";
    const { result } = renderHook(() => useSoundEffect());
    result.current("create");
    expect(playSound).not.toHaveBeenCalled();
  });

  it("handles each event type correctly", () => {
    const { result } = renderHook(() => useSoundEffect());
    result.current("delete");
    expect(playSound).toHaveBeenCalledWith("delete", 0.7);

    vi.clearAllMocks();
    result.current("reminder");
    expect(playSound).toHaveBeenCalledWith("reminder", 0.7);
  });

  it("swallows playSound errors silently", () => {
    (playSound as any).mockRejectedValueOnce(new Error("audio failed"));
    const { result } = renderHook(() => useSoundEffect());
    // Should not throw
    expect(() => result.current("complete")).not.toThrow();
  });

  it("does not play when volume is NaN", () => {
    mockSettings.sound_volume = "abc";
    const { result } = renderHook(() => useSoundEffect());
    result.current("create");
    expect(playSound).not.toHaveBeenCalled();
  });
});
