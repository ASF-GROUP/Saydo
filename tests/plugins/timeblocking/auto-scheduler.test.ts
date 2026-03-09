import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  scoreTasks,
  findAvailableGaps,
  autoSchedule,
  applySchedule,
  type SchedulerSettings,
  type ScheduleRequest as _ScheduleRequest,
} from "../../../src/plugins/builtin/timeblocking/auto-scheduler.js";
import type { TimeBlock } from "../../../src/plugins/builtin/timeblocking/types.js";
import type { PluginStorageAPI } from "../../../src/plugins/builtin/timeblocking/types.js";
import { TimeBlockStore } from "../../../src/plugins/builtin/timeblocking/store.js";
import type { Task } from "../../../src/core/types.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createMockStorage(): PluginStorageAPI {
  const data = new Map<string, unknown>();
  return {
    get: vi.fn(async <T>(key: string) => (data.get(key) as T) ?? null),
    set: vi.fn(async (key: string, value: unknown) => {
      data.set(key, value);
    }),
    delete: vi.fn(async (key: string) => {
      data.delete(key);
    }),
    keys: vi.fn(async () => Array.from(data.keys())),
  };
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: "task-1",
    title: "Test Task",
    description: null,
    status: "pending",
    priority: null,
    dueDate: null,
    dueTime: false,
    completedAt: null,
    projectId: null,
    recurrence: null,
    parentId: null,
    remindAt: null,
    estimatedMinutes: null,
    actualMinutes: null,
    deadline: null,
    isSomeday: false,
    sectionId: null,
    tags: [],
    sortOrder: 0,
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
    ...overrides,
  };
}

function makeBlock(overrides: Partial<TimeBlock> = {}): TimeBlock {
  return {
    id: "block-1",
    title: "Existing Block",
    date: "2026-03-10",
    startTime: "10:00",
    endTime: "11:00",
    locked: false,
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
    ...overrides,
  };
}

const DEFAULT_SETTINGS: SchedulerSettings = {
  workDayStart: "09:00",
  workDayEnd: "17:00",
  gridIntervalMinutes: 15,
  defaultDurationMinutes: 30,
  bufferMinutes: 5,
};

const REF_DATE = new Date("2026-03-09T12:00:00Z");

// ---------------------------------------------------------------------------
// scoreTasks
// ---------------------------------------------------------------------------

describe("scoreTasks", () => {
  it("should order by priority (p1 > p2 > p3 > p4)", () => {
    const tasks = [
      makeTask({ id: "t4", priority: 4 }),
      makeTask({ id: "t1", priority: 1 }),
      makeTask({ id: "t3", priority: 3 }),
      makeTask({ id: "t2", priority: 2 }),
    ];
    const scored = scoreTasks(tasks, REF_DATE);
    expect(scored[0].task.id).toBe("t1");
    expect(scored[1].task.id).toBe("t2");
    expect(scored[2].task.id).toBe("t3");
    // t4 last
    expect(scored[3].task.id).toBe("t4");
  });

  it("should give higher urgency to overdue tasks", () => {
    const overdue = makeTask({
      id: "overdue",
      dueDate: "2026-03-08T00:00:00.000Z",
      priority: 4,
    });
    const future = makeTask({
      id: "future",
      dueDate: "2026-04-01T00:00:00.000Z",
      priority: 4,
    });
    const scored = scoreTasks([overdue, future], REF_DATE);

    const overdueScored = scored.find((s) => s.task.id === "overdue")!;
    const futureScored = scored.find((s) => s.task.id === "future")!;
    expect(overdueScored.urgencyScore).toBe(1.0);
    expect(futureScored.urgencyScore).toBeLessThan(0.4);
  });

  it("should give urgency 0.9 to tasks due within 1 day", () => {
    const dueSoon = makeTask({
      id: "soon",
      dueDate: "2026-03-10T00:00:00.000Z",
      priority: 4,
    });
    const scored = scoreTasks([dueSoon], REF_DATE);
    expect(scored[0].urgencyScore).toBe(0.9);
  });

  it("should give higher energy score to high-priority (dread) tasks", () => {
    const highDread = makeTask({ id: "h", priority: 1 });
    const lowDread = makeTask({ id: "l", priority: 4 });
    const scored = scoreTasks([highDread, lowDread], REF_DATE);

    const h = scored.find((s) => s.task.id === "h")!;
    const l = scored.find((s) => s.task.id === "l")!;
    expect(h.energyScore).toBeGreaterThan(l.energyScore);
  });

  it("should compute composite: priority*0.4 + urgency*0.35 + energy*0.25", () => {
    const task = makeTask({ id: "t", priority: 1 });
    const scored = scoreTasks([task], REF_DATE);
    const s = scored[0];
    const expected = s.priorityScore * 0.4 + s.urgencyScore * 0.35 + s.energyScore * 0.25;
    expect(s.composite).toBeCloseTo(expected, 10);
  });

  it("should use default estimate of 30 for tasks without estimatedMinutes", () => {
    const task = makeTask({ id: "t", estimatedMinutes: null });
    const scored = scoreTasks([task], REF_DATE);
    expect(scored[0].estimatedMinutes).toBe(30);
  });

  it("should preserve estimated minutes when set", () => {
    const task = makeTask({ id: "t", estimatedMinutes: 90 });
    const scored = scoreTasks([task], REF_DATE);
    expect(scored[0].estimatedMinutes).toBe(90);
  });

  it("should have stable sort (by task id) for equal composites", () => {
    const t1 = makeTask({ id: "aaa", priority: 3 });
    const t2 = makeTask({ id: "bbb", priority: 3 });
    const scored = scoreTasks([t2, t1], REF_DATE);
    expect(scored[0].task.id).toBe("aaa");
    expect(scored[1].task.id).toBe("bbb");
  });
});

// ---------------------------------------------------------------------------
// findAvailableGaps
// ---------------------------------------------------------------------------

describe("findAvailableGaps", () => {
  it("should return full work day when no blocks exist", () => {
    const gaps = findAvailableGaps([], "09:00", "17:00", "2026-03-10");
    expect(gaps).toEqual([
      { startMinutes: 540, endMinutes: 1020, durationMinutes: 480 },
    ]);
  });

  it("should find gaps between blocks", () => {
    const blocks = [
      makeBlock({ id: "b1", startTime: "10:00", endTime: "11:00" }),
      makeBlock({ id: "b2", startTime: "13:00", endTime: "14:00" }),
    ];
    const gaps = findAvailableGaps(blocks, "09:00", "17:00", "2026-03-10");

    expect(gaps).toEqual([
      { startMinutes: 540, endMinutes: 600, durationMinutes: 60 },
      { startMinutes: 660, endMinutes: 780, durationMinutes: 120 },
      { startMinutes: 840, endMinutes: 1020, durationMinutes: 180 },
    ]);
  });

  it("should handle block at start of work day", () => {
    const blocks = [
      makeBlock({ id: "b1", startTime: "09:00", endTime: "10:00" }),
    ];
    const gaps = findAvailableGaps(blocks, "09:00", "17:00", "2026-03-10");
    expect(gaps[0].startMinutes).toBe(600); // 10:00
  });

  it("should handle block at end of work day", () => {
    const blocks = [
      makeBlock({ id: "b1", startTime: "16:00", endTime: "17:00" }),
    ];
    const gaps = findAvailableGaps(blocks, "09:00", "17:00", "2026-03-10");
    expect(gaps).toHaveLength(1);
    expect(gaps[0]).toEqual({
      startMinutes: 540,
      endMinutes: 960,
      durationMinutes: 420,
    });
  });

  it("should handle overlapping blocks", () => {
    const blocks = [
      makeBlock({ id: "b1", startTime: "10:00", endTime: "12:00" }),
      makeBlock({ id: "b2", startTime: "11:00", endTime: "13:00" }),
    ];
    const gaps = findAvailableGaps(blocks, "09:00", "17:00", "2026-03-10");
    // Should merge: 10:00-13:00
    expect(gaps).toEqual([
      { startMinutes: 540, endMinutes: 600, durationMinutes: 60 },
      { startMinutes: 780, endMinutes: 1020, durationMinutes: 240 },
    ]);
  });

  it("should ignore blocks outside work hours", () => {
    const blocks = [
      makeBlock({ id: "b1", startTime: "07:00", endTime: "08:00" }),
      makeBlock({ id: "b2", startTime: "18:00", endTime: "19:00" }),
    ];
    const gaps = findAvailableGaps(blocks, "09:00", "17:00", "2026-03-10");
    expect(gaps).toEqual([
      { startMinutes: 540, endMinutes: 1020, durationMinutes: 480 },
    ]);
  });

  it("should ignore blocks on different dates", () => {
    const blocks = [
      makeBlock({ id: "b1", date: "2026-03-11", startTime: "10:00", endTime: "11:00" }),
    ];
    const gaps = findAvailableGaps(blocks, "09:00", "17:00", "2026-03-10");
    expect(gaps).toEqual([
      { startMinutes: 540, endMinutes: 1020, durationMinutes: 480 },
    ]);
  });

  it("should return empty when work day start >= end", () => {
    const gaps = findAvailableGaps([], "17:00", "09:00", "2026-03-10");
    expect(gaps).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// autoSchedule
// ---------------------------------------------------------------------------

describe("autoSchedule", () => {
  it("should return empty schedule for empty tasks", () => {
    const result = autoSchedule({
      tasks: [],
      existingBlocks: [],
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    expect(result.proposed).toEqual([]);
    expect(result.warnings).toEqual([]);
    expect(result.totalScheduledMinutes).toBe(0);
  });

  it("should schedule a single task", () => {
    const tasks = [makeTask({ id: "t1", estimatedMinutes: 60 })];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    expect(result.proposed).toHaveLength(1);
    expect(result.proposed[0].taskId).toBe("t1");
    expect(result.proposed[0].startTime).toBe("09:00");
    expect(result.proposed[0].endTime).toBe("10:00");
  });

  it("should schedule tasks in priority order", () => {
    const tasks = [
      makeTask({ id: "low", priority: 4, estimatedMinutes: 30 }),
      makeTask({ id: "high", priority: 1, estimatedMinutes: 30 }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    expect(result.proposed).toHaveLength(2);
    // Output is sorted chronologically; high-priority goes first (earlier time)
    expect(result.proposed[0].taskId).toBe("high");
  });

  it("should warn when day is overbooked", () => {
    // 8 hours of work = 480 minutes. Create tasks totaling more.
    const tasks = [
      makeTask({ id: "t1", priority: 1, estimatedMinutes: 300 }),
      makeTask({ id: "t2", priority: 2, estimatedMinutes: 300 }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    // At least one task should have a warning
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("should use default duration for tasks without estimates", () => {
    const tasks = [makeTask({ id: "t1", estimatedMinutes: null })];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: { ...DEFAULT_SETTINGS, defaultDurationMinutes: 30 },
      referenceDate: REF_DATE,
    });
    expect(result.proposed).toHaveLength(1);
    // Duration should be at least gridInterval (15), and task gets 30min
    const block = result.proposed[0];
    const start = parseInt(block.startTime.split(":")[0]) * 60 + parseInt(block.startTime.split(":")[1]);
    const end = parseInt(block.endTime.split(":")[0]) * 60 + parseInt(block.endTime.split(":")[1]);
    expect(end - start).toBe(30);
  });

  it("should snap to grid interval", () => {
    const tasks = [makeTask({ id: "t1", estimatedMinutes: 45 })];
    // Place a block from 09:00-09:07 to force non-grid-aligned gap start
    const blocks = [
      makeBlock({ id: "b1", startTime: "09:00", endTime: "09:07", date: "2026-03-10" }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: blocks,
      date: "2026-03-10",
      settings: { ...DEFAULT_SETTINGS, gridIntervalMinutes: 15 },
      referenceDate: REF_DATE,
    });
    if (result.proposed.length > 0) {
      // Start should be snapped to 15-min grid
      const startMin = parseInt(result.proposed[0].startTime.split(":")[0]) * 60 +
        parseInt(result.proposed[0].startTime.split(":")[1]);
      expect(startMin % 15).toBe(0);
    }
  });

  it("should respect buffer between scheduled blocks", () => {
    const tasks = [
      makeTask({ id: "t1", priority: 1, estimatedMinutes: 30 }),
      makeTask({ id: "t2", priority: 1, estimatedMinutes: 30 }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: { ...DEFAULT_SETTINGS, bufferMinutes: 15 },
      referenceDate: REF_DATE,
    });
    if (result.proposed.length >= 2) {
      // Sort by start time
      const sorted = [...result.proposed].sort((a, b) => a.startTime.localeCompare(b.startTime));
      const end1 = parseInt(sorted[0].endTime.split(":")[0]) * 60 + parseInt(sorted[0].endTime.split(":")[1]);
      const start2 = parseInt(sorted[1].startTime.split(":")[0]) * 60 + parseInt(sorted[1].startTime.split(":")[1]);
      expect(start2 - end1).toBeGreaterThanOrEqual(15);
    }
  });

  it("should work around existing blocks", () => {
    const tasks = [makeTask({ id: "t1", estimatedMinutes: 60 })];
    const blocks = [
      makeBlock({ id: "b1", startTime: "09:00", endTime: "10:00", date: "2026-03-10" }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: blocks,
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    expect(result.proposed).toHaveLength(1);
    // Should be after the existing block
    expect(result.proposed[0].startTime >= "10:00").toBe(true);
  });

  it("should place high-dread tasks earlier and low-dread later", () => {
    const tasks = [
      makeTask({ id: "low", priority: 4, estimatedMinutes: 60 }),
      makeTask({ id: "high", priority: 1, estimatedMinutes: 60 }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    const highBlock = result.proposed.find((p) => p.taskId === "high");
    const lowBlock = result.proposed.find((p) => p.taskId === "low");
    if (highBlock && lowBlock) {
      expect(highBlock.startTime <= lowBlock.startTime).toBe(true);
    }
  });

  it("should sort proposed blocks chronologically", () => {
    const tasks = [
      makeTask({ id: "t1", priority: 1, estimatedMinutes: 30 }),
      makeTask({ id: "t2", priority: 2, estimatedMinutes: 30 }),
      makeTask({ id: "t3", priority: 3, estimatedMinutes: 30 }),
    ];
    const result = autoSchedule({
      tasks,
      existingBlocks: [],
      date: "2026-03-10",
      settings: DEFAULT_SETTINGS,
      referenceDate: REF_DATE,
    });
    for (let i = 1; i < result.proposed.length; i++) {
      expect(result.proposed[i].startTime >= result.proposed[i - 1].startTime).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// applySchedule
// ---------------------------------------------------------------------------

describe("applySchedule", () => {
  let store: TimeBlockStore;

  beforeEach(async () => {
    const storage = createMockStorage();
    store = new TimeBlockStore(storage);
    await store.initialize();
  });

  it("should create blocks in the store and return their IDs", async () => {
    const proposed = [
      {
        taskId: "t1",
        title: "Task 1",
        date: "2026-03-10",
        startTime: "09:00",
        endTime: "10:00",
        score: 0.8,
      },
      {
        taskId: "t2",
        title: "Task 2",
        date: "2026-03-10",
        startTime: "10:15",
        endTime: "11:15",
        score: 0.6,
      },
    ];

    const ids = await applySchedule(proposed, store);
    expect(ids).toHaveLength(2);

    const blocks = store.listBlocks("2026-03-10");
    expect(blocks).toHaveLength(2);
    expect(blocks[0].taskId).toBe("t1");
    expect(blocks[0].title).toBe("Task 1");
    expect(blocks[1].taskId).toBe("t2");
  });

  it("should create blocks with locked=false", async () => {
    const proposed = [
      {
        taskId: "t1",
        title: "Task 1",
        date: "2026-03-10",
        startTime: "09:00",
        endTime: "10:00",
        score: 0.8,
      },
    ];

    await applySchedule(proposed, store);
    const blocks = store.listBlocks("2026-03-10");
    expect(blocks[0].locked).toBe(false);
  });

  it("should handle empty proposed array", async () => {
    const ids = await applySchedule([], store);
    expect(ids).toEqual([]);
    expect(store.listBlocks()).toEqual([]);
  });
});
