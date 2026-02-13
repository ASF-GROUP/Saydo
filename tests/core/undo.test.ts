import { describe, it, expect, vi } from "vitest";
import { UndoManager, type UndoableAction } from "../../src/core/undo.js";

function createAction(desc: string, log: string[]): UndoableAction {
  return {
    description: desc,
    execute: vi.fn(async () => {
      log.push(`exec:${desc}`);
    }),
    undo: vi.fn(async () => {
      log.push(`undo:${desc}`);
    }),
  };
}

describe("UndoManager", () => {
  it("performs an action", async () => {
    const mgr = new UndoManager();
    const log: string[] = [];
    const action = createAction("a", log);

    await mgr.perform(action);
    expect(log).toEqual(["exec:a"]);
    expect(mgr.canUndo()).toBe(true);
    expect(mgr.canRedo()).toBe(false);
  });

  it("undoes and redoes an action", async () => {
    const mgr = new UndoManager();
    const log: string[] = [];
    const action = createAction("a", log);

    await mgr.perform(action);
    const undone = await mgr.undo();

    expect(undone).toBe(action);
    expect(log).toEqual(["exec:a", "undo:a"]);
    expect(mgr.canUndo()).toBe(false);
    expect(mgr.canRedo()).toBe(true);

    const redone = await mgr.redo();
    expect(redone).toBe(action);
    expect(log).toEqual(["exec:a", "undo:a", "exec:a"]);
  });

  it("returns null when nothing to undo/redo", async () => {
    const mgr = new UndoManager();
    expect(await mgr.undo()).toBeNull();
    expect(await mgr.redo()).toBeNull();
  });

  it("clears redo stack on new perform", async () => {
    const mgr = new UndoManager();
    const log: string[] = [];

    await mgr.perform(createAction("a", log));
    await mgr.undo();
    expect(mgr.canRedo()).toBe(true);

    await mgr.perform(createAction("b", log));
    expect(mgr.canRedo()).toBe(false);
  });

  it("respects max stack depth (50)", async () => {
    const mgr = new UndoManager();
    const log: string[] = [];

    for (let i = 0; i < 60; i++) {
      await mgr.perform(createAction(`${i}`, log));
    }

    // Should only be able to undo 50 times
    let count = 0;
    while (mgr.canUndo()) {
      await mgr.undo();
      count++;
    }
    expect(count).toBe(50);
  });

  it("notifies subscribers", async () => {
    const mgr = new UndoManager();
    const listener = vi.fn();
    mgr.subscribe(listener);

    await mgr.perform(createAction("a", []));
    expect(listener).toHaveBeenCalledTimes(1);

    await mgr.undo();
    expect(listener).toHaveBeenCalledTimes(2);

    await mgr.redo();
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("allows unsubscribe", async () => {
    const mgr = new UndoManager();
    const listener = vi.fn();
    const unsub = mgr.subscribe(listener);

    await mgr.perform(createAction("a", []));
    expect(listener).toHaveBeenCalledTimes(1);

    unsub();
    await mgr.perform(createAction("b", []));
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
