import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useMultiSelect } from "../../../src/ui/hooks/useMultiSelect.js";

const IDS = ["a", "b", "c", "d", "e"];

describe("useMultiSelect", () => {
  it("starts with empty selection", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("plain click selects a single item (replaces previous)", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    act(() => {
      result.current.handleMultiSelect("b", { ctrlKey: false, metaKey: false, shiftKey: false });
    });
    expect(result.current.selectedIds).toEqual(new Set(["b"]));

    act(() => {
      result.current.handleMultiSelect("d", { ctrlKey: false, metaKey: false, shiftKey: false });
    });
    expect(result.current.selectedIds).toEqual(new Set(["d"]));
  });

  it("Ctrl+click toggles individual items", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    act(() => {
      result.current.handleMultiSelect("a", { ctrlKey: true, metaKey: false, shiftKey: false });
    });
    expect(result.current.selectedIds).toEqual(new Set(["a"]));

    act(() => {
      result.current.handleMultiSelect("c", { ctrlKey: true, metaKey: false, shiftKey: false });
    });
    expect(result.current.selectedIds).toEqual(new Set(["a", "c"]));

    // Toggle off
    act(() => {
      result.current.handleMultiSelect("a", { ctrlKey: true, metaKey: false, shiftKey: false });
    });
    expect(result.current.selectedIds).toEqual(new Set(["c"]));
  });

  it("Meta+click also toggles (macOS Cmd)", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    act(() => {
      result.current.handleMultiSelect("b", { ctrlKey: false, metaKey: true, shiftKey: false });
    });
    expect(result.current.selectedIds).toEqual(new Set(["b"]));
  });

  it("Shift+click selects a range", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    // First click to set anchor
    act(() => {
      result.current.handleMultiSelect("b", { ctrlKey: false, metaKey: false, shiftKey: false });
    });

    // Shift+click to select range b..d
    act(() => {
      result.current.handleMultiSelect("d", { ctrlKey: false, metaKey: false, shiftKey: true });
    });
    expect(result.current.selectedIds).toEqual(new Set(["b", "c", "d"]));
  });

  it("Shift+click works in reverse direction", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    act(() => {
      result.current.handleMultiSelect("d", { ctrlKey: false, metaKey: false, shiftKey: false });
    });
    act(() => {
      result.current.handleMultiSelect("b", { ctrlKey: false, metaKey: false, shiftKey: true });
    });
    expect(result.current.selectedIds).toEqual(new Set(["b", "c", "d"]));
  });

  it("clearSelection empties the set", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    act(() => {
      result.current.handleMultiSelect("a", { ctrlKey: false, metaKey: false, shiftKey: false });
    });
    expect(result.current.selectedIds.size).toBe(1);

    act(() => {
      result.current.clearSelection();
    });
    expect(result.current.selectedIds.size).toBe(0);
  });

  it("selectAll selects all ordered ids", () => {
    const { result } = renderHook(() => useMultiSelect(IDS));

    act(() => {
      result.current.selectAll();
    });
    expect(result.current.selectedIds).toEqual(new Set(IDS));
  });
});
