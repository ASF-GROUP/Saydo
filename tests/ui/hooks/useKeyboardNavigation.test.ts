import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useKeyboardNavigation } from "../../../src/ui/hooks/useKeyboardNavigation.js";

function fireKey(key: string, target?: HTMLElement) {
  const event = new KeyboardEvent("keydown", { key, bubbles: true });
  Object.defineProperty(event, "target", { value: target ?? document.body });
  document.dispatchEvent(event);
}

describe("useKeyboardNavigation", () => {
  const tasks = [
    { id: "t1", title: "Task 1" },
    { id: "t2", title: "Task 2" },
    { id: "t3", title: "Task 3" },
  ] as any[];

  let onSelect: ReturnType<typeof vi.fn>;
  let onOpen: ReturnType<typeof vi.fn>;
  let onClose: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSelect = vi.fn();
    onOpen = vi.fn();
    onClose = vi.fn();
  });

  it("j selects next task", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t1",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("j");
    expect(onSelect).toHaveBeenCalledWith("t2");
  });

  it("j selects first task when nothing is selected", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: null,
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("j");
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  it("j does not go past last task", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t3",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("j");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("k selects previous task", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t2",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("k");
    expect(onSelect).toHaveBeenCalledWith("t1");
  });

  it("k does not go before first task", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t1",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("k");
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("Enter opens selected task", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t2",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("Enter");
    expect(onOpen).toHaveBeenCalledWith("t2");
  });

  it("Enter does nothing when no task is selected", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: null,
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("Enter");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("Escape calls onClose", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t1",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    fireKey("Escape");
    expect(onClose).toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t1",
        onSelect,
        onOpen,
        onClose,
        enabled: false,
      }),
    );

    fireKey("j");
    fireKey("Enter");
    fireKey("Escape");
    expect(onSelect).not.toHaveBeenCalled();
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it("skips when focus is in form elements", () => {
    renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t1",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    const input = document.createElement("input");
    document.body.appendChild(input);
    fireKey("j", input);
    expect(onSelect).not.toHaveBeenCalled();
    document.body.removeChild(input);
  });

  it("cleans up event listener on unmount", () => {
    const { unmount } = renderHook(() =>
      useKeyboardNavigation({
        tasks,
        selectedTaskId: "t1",
        onSelect,
        onOpen,
        onClose,
        enabled: true,
      }),
    );

    unmount();
    fireKey("j");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
