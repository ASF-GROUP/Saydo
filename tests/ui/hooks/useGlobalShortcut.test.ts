import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useGlobalShortcut } from "../../../src/ui/hooks/useGlobalShortcut.js";

// Mock the Tauri detection utility
vi.mock("../../../src/utils/tauri.js", () => ({
  isTauri: vi.fn(() => false),
}));

// Mock the Tauri global-shortcut plugin
const mockRegister = vi.fn();
const mockUnregister = vi.fn();
vi.mock("@tauri-apps/plugin-global-shortcut", () => ({
  register: (...args: unknown[]) => mockRegister(...args),
  unregister: (...args: unknown[]) => mockUnregister(...args),
}));

import { isTauri } from "../../../src/utils/tauri.js";

describe("useGlobalShortcut", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("does nothing when isTauri returns false", () => {
    vi.mocked(isTauri).mockReturnValue(false);
    const callback = vi.fn();

    renderHook(() => useGlobalShortcut("CmdOrCtrl+Shift+Space", callback));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("does nothing when enabled is false", () => {
    vi.mocked(isTauri).mockReturnValue(true);
    const callback = vi.fn();

    renderHook(() => useGlobalShortcut("CmdOrCtrl+Shift+Space", callback, false));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("does nothing when shortcut is empty", () => {
    vi.mocked(isTauri).mockReturnValue(true);
    const callback = vi.fn();

    renderHook(() => useGlobalShortcut("", callback, true));

    expect(mockRegister).not.toHaveBeenCalled();
  });

  it("registers the shortcut when isTauri is true and enabled", async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    mockRegister.mockResolvedValue(undefined);
    const callback = vi.fn();

    renderHook(() => useGlobalShortcut("CmdOrCtrl+Shift+Space", callback, true));

    // Wait for async setup
    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith("CmdOrCtrl+Shift+Space", expect.any(Function));
    });
  });

  it("unregisters on cleanup", async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    mockRegister.mockResolvedValue(undefined);
    mockUnregister.mockResolvedValue(undefined);
    const callback = vi.fn();

    const { unmount } = renderHook(() =>
      useGlobalShortcut("CmdOrCtrl+Shift+Space", callback, true),
    );

    // Wait for registration
    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    unmount();

    await vi.waitFor(() => {
      expect(mockUnregister).toHaveBeenCalledWith("CmdOrCtrl+Shift+Space");
    });
  });

  it("invokes callback on Pressed event", async () => {
    vi.mocked(isTauri).mockReturnValue(true);
    mockRegister.mockResolvedValue(undefined);
    const callback = vi.fn();

    renderHook(() => useGlobalShortcut("CmdOrCtrl+Shift+Space", callback, true));

    await vi.waitFor(() => {
      expect(mockRegister).toHaveBeenCalled();
    });

    // Simulate the shortcut being pressed
    const registeredHandler = mockRegister.mock.calls[0][1] as (event: { state: string }) => void;
    registeredHandler({ state: "Pressed" });
    expect(callback).toHaveBeenCalledTimes(1);

    // Released should not trigger
    registeredHandler({ state: "Released" });
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
