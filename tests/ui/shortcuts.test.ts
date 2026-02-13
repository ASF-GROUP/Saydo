import { describe, it, expect, vi } from "vitest";
import { ShortcutManager, normalizeKeyCombo } from "../../src/ui/shortcuts.js";

describe("normalizeKeyCombo", () => {
  it("normalizes simple keys", () => {
    expect(normalizeKeyCombo("k")).toBe("k");
    expect(normalizeKeyCombo("ctrl+k")).toBe("ctrl+k");
    expect(normalizeKeyCombo("Ctrl+K")).toBe("ctrl+k");
  });

  it("sorts modifiers consistently", () => {
    expect(normalizeKeyCombo("shift+ctrl+k")).toBe("ctrl+shift+k");
    expect(normalizeKeyCombo("alt+ctrl+shift+z")).toBe("alt+ctrl+shift+z");
  });

  it("handles meta/cmd aliases", () => {
    expect(normalizeKeyCombo("cmd+k")).toBe("meta+k");
    expect(normalizeKeyCombo("command+k")).toBe("meta+k");
  });
});

describe("ShortcutManager", () => {
  it("registers and fires a shortcut", () => {
    const mgr = new ShortcutManager();
    const cb = vi.fn();
    mgr.register({ id: "test", description: "Test", defaultKey: "ctrl+k", callback: cb });

    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
    mgr.handleKeyDown(event);

    expect(cb).toHaveBeenCalledOnce();
  });

  it("does not fire for non-matching keys", () => {
    const mgr = new ShortcutManager();
    const cb = vi.fn();
    mgr.register({ id: "test", description: "Test", defaultKey: "ctrl+k", callback: cb });

    const event = new KeyboardEvent("keydown", { key: "j", ctrlKey: true });
    mgr.handleKeyDown(event);

    expect(cb).not.toHaveBeenCalled();
  });

  it("rebinds a shortcut", () => {
    const mgr = new ShortcutManager();
    const cb = vi.fn();
    mgr.register({ id: "test", description: "Test", defaultKey: "ctrl+k", callback: cb });

    const result = mgr.rebind("test", "ctrl+j");
    expect(result).toEqual({ ok: true });

    const event = new KeyboardEvent("keydown", { key: "j", ctrlKey: true });
    mgr.handleKeyDown(event);

    expect(cb).toHaveBeenCalledOnce();
  });

  it("detects conflicts on rebind", () => {
    const mgr = new ShortcutManager();
    mgr.register({ id: "a", description: "A", defaultKey: "ctrl+k", callback: vi.fn() });
    mgr.register({ id: "b", description: "B", defaultKey: "ctrl+j", callback: vi.fn() });

    const result = mgr.rebind("b", "ctrl+k");
    expect(result).toEqual({ ok: false, conflict: "A" });
  });

  it("resets to default", () => {
    const mgr = new ShortcutManager();
    const cb = vi.fn();
    mgr.register({ id: "test", description: "Test", defaultKey: "ctrl+k", callback: cb });
    mgr.rebind("test", "ctrl+j");

    mgr.resetToDefault("test");
    const bindings = mgr.getAll();
    const binding = bindings.find((b) => b.id === "test");
    expect(binding!.currentKey).toBe("ctrl+k");
  });

  it("serializes only custom bindings", () => {
    const mgr = new ShortcutManager();
    mgr.register({ id: "a", description: "A", defaultKey: "ctrl+a", callback: vi.fn() });
    mgr.register({ id: "b", description: "B", defaultKey: "ctrl+b", callback: vi.fn() });
    mgr.rebind("b", "ctrl+x");

    const json = mgr.toJSON();
    expect(json).toEqual({ b: "ctrl+x" });
  });

  it("loads custom bindings", () => {
    const mgr = new ShortcutManager();
    mgr.register({ id: "a", description: "A", defaultKey: "ctrl+a", callback: vi.fn() });

    mgr.loadCustomBindings({ a: "ctrl+q" });

    const binding = mgr.getAll().find((b) => b.id === "a");
    expect(binding!.currentKey).toBe("ctrl+q");
  });

  it("notifies subscribers on changes", () => {
    const mgr = new ShortcutManager();
    mgr.register({ id: "a", description: "A", defaultKey: "ctrl+a", callback: vi.fn() });
    const listener = vi.fn();
    mgr.subscribe(listener);

    mgr.rebind("a", "ctrl+q");
    expect(listener).toHaveBeenCalledOnce();
  });
});
