import { describe, it, expect, beforeEach, vi } from "vitest";
import { TimeBlockStore } from "../../../src/plugins/builtin/timeblocking/store.js";
import { buildTimeblockingTools } from "../../../src/plugins/builtin/timeblocking/ai-tools.js";
import type { PluginStorageAPI } from "../../../src/plugins/builtin/timeblocking/types.js";
import type { ToolContext } from "../../../src/ai/tools/types.js";

function createMockStorage(): PluginStorageAPI {
  const data = new Map<string, unknown>();
  return {
    get: vi.fn(async <T>(key: string) => (data.get(key) as T) ?? null),
    set: vi.fn(async (key: string, value: unknown) => { data.set(key, value); }),
    delete: vi.fn(async (key: string) => { data.delete(key); }),
    keys: vi.fn(async () => Array.from(data.keys())),
  };
}

const defaultSettings = () => ({
  workDayStart: "09:00",
  workDayEnd: "17:00",
  defaultDurationMinutes: 30,
});

const mockCtx = {} as ToolContext;

describe("Timeblocking AI Tools", () => {
  let store: TimeBlockStore;
  let tools: ReturnType<typeof buildTimeblockingTools>;

  function findTool(name: string) {
    const tool = tools.find((t) => t.definition.name === name);
    if (!tool) throw new Error(`Tool "${name}" not found`);
    return tool;
  }

  beforeEach(async () => {
    store = new TimeBlockStore(createMockStorage());
    await store.initialize();
    tools = buildTimeblockingTools(store, defaultSettings);
  });

  it("registers all 8 tools", () => {
    expect(tools).toHaveLength(8);
    const names = tools.map((t) => t.definition.name);
    expect(names).toContain("timeblocking_list_blocks");
    expect(names).toContain("timeblocking_create_block");
    expect(names).toContain("timeblocking_update_block");
    expect(names).toContain("timeblocking_delete_block");
    expect(names).toContain("timeblocking_schedule_task");
    expect(names).toContain("timeblocking_get_availability");
    expect(names).toContain("timeblocking_set_recurrence");
    expect(names).toContain("timeblocking_replan_day");
  });

  describe("timeblocking_list_blocks", () => {
    it("returns blocks for a date", async () => {
      await store.createBlock({ title: "Block A", date: "2026-03-10", startTime: "09:00", endTime: "10:00", locked: false });
      await store.createBlock({ title: "Block B", date: "2026-03-11", startTime: "10:00", endTime: "11:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_list_blocks").executor({ date: "2026-03-10" }, mockCtx));
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Block A");
    });

    it("returns blocks for a date range", async () => {
      await store.createBlock({ title: "Block A", date: "2026-03-10", startTime: "09:00", endTime: "10:00", locked: false });
      await store.createBlock({ title: "Block B", date: "2026-03-11", startTime: "10:00", endTime: "11:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_list_blocks").executor(
        { startDate: "2026-03-10", endDate: "2026-03-11" }, mockCtx,
      ));
      expect(result).toHaveLength(2);
    });
  });

  describe("timeblocking_create_block", () => {
    it("creates and returns a block", async () => {
      const result = JSON.parse(await findTool("timeblocking_create_block").executor(
        { title: "New Block", date: "2026-03-10", startTime: "09:00", endTime: "10:00" }, mockCtx,
      ));
      expect(result.title).toBe("New Block");
      expect(result.id).toBeTruthy();
      expect(store.listBlocks("2026-03-10")).toHaveLength(1);
    });
  });

  describe("timeblocking_schedule_task", () => {
    it("avoids conflicts when scheduling", async () => {
      await store.createBlock({ title: "Existing", date: "2026-03-10", startTime: "09:00", endTime: "10:00", locked: false });

      const mockTaskService = {
        list: vi.fn(async () => [{
          id: "task-1", title: "My Task", estimatedMinutes: 30,
          status: "pending", description: null, priority: null, dueDate: null,
          dueTime: false, completedAt: null, projectId: null, recurrence: null,
          parentId: null, remindAt: null, actualMinutes: null, deadline: null,
          isSomeday: false, sectionId: null, tags: [], sortOrder: 0,
          createdAt: "2026-03-09", updatedAt: "2026-03-09",
        }]),
      } as unknown as ToolContext["taskService"];

      const ctx = { taskService: mockTaskService } as ToolContext;
      const result = JSON.parse(await findTool("timeblocking_schedule_task").executor(
        { taskId: "task-1", date: "2026-03-10" }, ctx,
      ));

      // Should not overlap with 09:00-10:00
      expect(result.startTime).not.toBe("09:00");
      expect(result.taskId).toBe("task-1");
    });
  });

  describe("timeblocking_get_availability", () => {
    it("returns free intervals", async () => {
      await store.createBlock({ title: "Busy", date: "2026-03-10", startTime: "10:00", endTime: "11:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_get_availability").executor(
        { date: "2026-03-10" }, mockCtx,
      ));

      // Should have at least: 09:00-10:00 and 11:00-17:00
      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(result[0].start).toBe("09:00");
      expect(result[0].end).toBe("10:00");
      expect(result[1].start).toBe("11:00");
    });
  });

  describe("timeblocking_replan_day", () => {
    it("moves blocks from one date to another", async () => {
      await store.createBlock({ title: "Old Block", date: "2026-03-08", startTime: "09:00", endTime: "10:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_replan_day").executor(
        { fromDate: "2026-03-08", toDate: "2026-03-10" }, mockCtx,
      ));

      expect(result.count).toBe(1);
      expect(result.moved[0].newDate).toBe("2026-03-10");
      expect(store.listBlocks("2026-03-10")).toHaveLength(1);
      expect(store.listBlocks("2026-03-08")).toHaveLength(0);
    });

    it("skips locked blocks", async () => {
      await store.createBlock({ title: "Locked", date: "2026-03-08", startTime: "09:00", endTime: "10:00", locked: true });

      const result = JSON.parse(await findTool("timeblocking_replan_day").executor(
        { fromDate: "2026-03-08", toDate: "2026-03-10" }, mockCtx,
      ));

      expect(result.count).toBe(0);
      expect(store.listBlocks("2026-03-08")).toHaveLength(1);
    });
  });

  describe("timeblocking_set_recurrence", () => {
    it("sets recurrence on a block", async () => {
      const block = await store.createBlock({ title: "Daily", date: "2026-03-10", startTime: "09:00", endTime: "10:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_set_recurrence").executor(
        { blockId: block.id, frequency: "weekly", interval: 1, daysOfWeek: [1, 3, 5] }, mockCtx,
      ));

      expect(result.recurrenceRule.frequency).toBe("weekly");
      expect(result.recurrenceRule.daysOfWeek).toEqual([1, 3, 5]);
    });
  });

  describe("timeblocking_delete_block", () => {
    it("deletes a block", async () => {
      const block = await store.createBlock({ title: "Delete me", date: "2026-03-10", startTime: "09:00", endTime: "10:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_delete_block").executor(
        { blockId: block.id }, mockCtx,
      ));

      expect(result.success).toBe(true);
      expect(store.listBlocks("2026-03-10")).toHaveLength(0);
    });
  });

  describe("timeblocking_update_block", () => {
    it("updates block fields", async () => {
      const block = await store.createBlock({ title: "Original", date: "2026-03-10", startTime: "09:00", endTime: "10:00", locked: false });

      const result = JSON.parse(await findTool("timeblocking_update_block").executor(
        { blockId: block.id, title: "Updated", locked: true }, mockCtx,
      ));

      expect(result.title).toBe("Updated");
      expect(result.locked).toBe(true);
    });
  });
});
