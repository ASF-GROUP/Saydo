import { describe, it, expect } from "vitest";
import { getPriority, sortByPriority } from "../../src/core/priorities.js";

describe("getPriority", () => {
  it("returns P1 metadata", () => {
    const p = getPriority(1);
    expect(p).not.toBeNull();
    expect(p!.value).toBe(1);
    expect(p!.label).toBe("P1");
    expect(p!.color).toBe("#ef4444");
  });

  it("returns P2 metadata", () => {
    const p = getPriority(2);
    expect(p).not.toBeNull();
    expect(p!.label).toBe("P2");
  });

  it("returns P3 metadata", () => {
    const p = getPriority(3);
    expect(p).not.toBeNull();
    expect(p!.label).toBe("P3");
  });

  it("returns P4 metadata", () => {
    const p = getPriority(4);
    expect(p).not.toBeNull();
    expect(p!.label).toBe("P4");
  });

  it("returns null for invalid priority", () => {
    expect(getPriority(0)).toBeNull();
    expect(getPriority(5)).toBeNull();
    expect(getPriority(-1)).toBeNull();
  });
});

describe("sortByPriority", () => {
  it("sorts P1 before P2 before P3 before P4", () => {
    const tasks = [{ priority: 3 }, { priority: 1 }, { priority: 4 }, { priority: 2 }];
    const sorted = sortByPriority(tasks);
    expect(sorted.map((t) => t.priority)).toEqual([1, 2, 3, 4]);
  });

  it("puts null priority last", () => {
    const tasks = [{ priority: null }, { priority: 2 }, { priority: null }, { priority: 1 }];
    const sorted = sortByPriority(tasks);
    expect(sorted.map((t) => t.priority)).toEqual([1, 2, null, null]);
  });

  it("handles all-null priorities", () => {
    const tasks = [{ priority: null }, { priority: null }];
    const sorted = sortByPriority(tasks);
    expect(sorted.map((t) => t.priority)).toEqual([null, null]);
  });

  it("handles empty array", () => {
    expect(sortByPriority([])).toEqual([]);
  });

  it("handles single element", () => {
    const tasks = [{ priority: 2 }];
    const sorted = sortByPriority(tasks);
    expect(sorted).toEqual([{ priority: 2 }]);
  });

  it("does not mutate original array", () => {
    const tasks = [{ priority: 3 }, { priority: 1 }];
    const original = [...tasks];
    sortByPriority(tasks);
    expect(tasks).toEqual(original);
  });
});
