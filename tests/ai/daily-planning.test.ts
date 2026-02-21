import { describe, it, expect, beforeEach } from "vitest";
import { ToolRegistry } from "../../src/ai/tools/registry.js";
import {
  registerPlanMyDayTool,
  registerDailyReviewTool,
} from "../../src/ai/tools/builtin/daily-planning.js";
import { createTestServices } from "../integration/helpers.js";
import type { ToolContext } from "../../src/ai/tools/types.js";
import type { TaskService } from "../../src/core/tasks.js";

function exec(
  registry: ToolRegistry,
  name: string,
  args: Record<string, unknown>,
  ctx: ToolContext,
) {
  return registry.execute(name, args, ctx).then((r) => JSON.parse(r));
}

function todayISO(): string {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
}

// ── plan_my_day ─────────────────────────────────────────────────────────────

describe("plan_my_day", () => {
  let registry: ToolRegistry;
  let ctx: ToolContext;
  let taskService: TaskService;

  beforeEach(() => {
    registry = new ToolRegistry();
    registerPlanMyDayTool(registry);
    const services = createTestServices();
    taskService = services.taskService;
    ctx = { taskService, projectService: services.projectService };
  });

  it("returns structure with empty state", async () => {
    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.date).toBe(todayISO());
    expect(result.greeting).toBeTruthy();
    expect(result.todaysTasks).toEqual([]);
    expect(result.overdueTasks).toEqual([]);
    expect(result.unscheduledHighPriority).toEqual([]);
    expect(result.workload.totalToday).toBe(0);
    expect(result.workload.assessment).toBe("light");
    expect(result.focusBlocks.blocks).toEqual([]);
    expect(result.remindersToday).toEqual([]);
    expect(result.productivityContext).toBeNull();
  });

  it("includes today's tasks sorted by priority", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "Low prio", tags: [], dueDate: today, priority: 4 });
    await taskService.create({ title: "High prio", tags: [], dueDate: today, priority: 1 });
    await taskService.create({ title: "Med prio", tags: [], dueDate: today, priority: 2 });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.todaysTasks).toHaveLength(3);
    expect(result.todaysTasks[0].title).toBe("High prio");
    expect(result.todaysTasks[1].title).toBe("Med prio");
    expect(result.todaysTasks[2].title).toBe("Low prio");
  });

  it("detects overdue tasks with daysOverdue", async () => {
    const twoDaysAgo = `${daysAgo(2)}T12:00:00.000Z`;
    await taskService.create({ title: "Late task", tags: [], dueDate: twoDaysAgo });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.overdueTasks).toHaveLength(1);
    expect(result.overdueTasks[0].title).toBe("Late task");
    expect(result.overdueTasks[0].daysOverdue).toBe(2);
  });

  it("detects unscheduled P1/P2 tasks", async () => {
    await taskService.create({ title: "Urgent no date", tags: [], priority: 1 });
    await taskService.create({ title: "Important no date", tags: [], priority: 2 });
    await taskService.create({ title: "Normal no date", tags: [], priority: 3 });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.unscheduledHighPriority).toHaveLength(2);
    expect(result.unscheduledHighPriority[0].title).toBe("Urgent no date");
    expect(result.unscheduledHighPriority[1].title).toBe("Important no date");
  });

  it("assesses light workload (<=2 tasks)", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "One task", tags: [], dueDate: today, priority: 4 });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.workload.totalToday).toBe(1);
    expect(result.workload.assessment).toBe("light");
  });

  it("assesses normal workload (3-5 tasks)", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    for (let i = 0; i < 4; i++) {
      await taskService.create({ title: `Task ${i}`, tags: [], dueDate: today, priority: 4 });
    }

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.workload.totalToday).toBe(4);
    expect(result.workload.assessment).toBe("normal");
  });

  it("assesses heavy workload (>5 tasks)", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    for (let i = 0; i < 6; i++) {
      await taskService.create({ title: `Task ${i}`, tags: [], dueDate: today, priority: 4 });
    }

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.workload.totalToday).toBe(6);
    expect(result.workload.assessment).toBe("heavy");
  });

  it("assesses heavy workload by priority weight (>12)", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    // 4 P1 tasks = 4*4 = 16 weight > 12
    for (let i = 0; i < 4; i++) {
      await taskService.create({ title: `P1 Task ${i}`, tags: [], dueDate: today, priority: 1 });
    }

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.workload.totalToday).toBe(4);
    expect(result.workload.priorityWeight).toBe(16);
    expect(result.workload.assessment).toBe("heavy");
  });

  it("classifies focus blocks as quick_win vs deep_work", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    // Quick win: short title, low priority, no description
    await taskService.create({ title: "Buy milk", tags: [], dueDate: today, priority: 4 });
    // Deep work: high priority
    await taskService.create({
      title: "Plan project",
      tags: [],
      dueDate: today,
      priority: 1,
    });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    const blocks = result.focusBlocks.blocks;
    expect(blocks.length).toBeGreaterThanOrEqual(1);

    const quickBlock = blocks.find((b: { type: string }) => b.type === "quick_win");
    const deepBlock = blocks.find((b: { type: string }) => b.type === "deep_work");
    expect(quickBlock?.tasks.some((t: { title: string }) => t.title === "Buy milk")).toBe(true);
    expect(deepBlock?.tasks.some((t: { title: string }) => t.title === "Plan project")).toBe(true);
  });

  it("orders quick wins first for medium energy", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "Buy milk", tags: [], dueDate: today, priority: 4 });
    await taskService.create({ title: "Plan project", tags: [], dueDate: today, priority: 1 });

    const result = await exec(registry, "plan_my_day", { energy_level: "medium" }, ctx);
    expect(result.focusBlocks.order).toBe("medium");
    if (result.focusBlocks.blocks.length >= 2) {
      expect(result.focusBlocks.blocks[0].type).toBe("quick_win");
      expect(result.focusBlocks.blocks[1].type).toBe("deep_work");
    }
  });

  it("orders deep work first for high energy", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "Buy milk", tags: [], dueDate: today, priority: 4 });
    await taskService.create({ title: "Plan project", tags: [], dueDate: today, priority: 1 });

    const result = await exec(registry, "plan_my_day", { energy_level: "high" }, ctx);
    expect(result.focusBlocks.order).toBe("high");
    if (result.focusBlocks.blocks.length >= 2) {
      expect(result.focusBlocks.blocks[0].type).toBe("deep_work");
      expect(result.focusBlocks.blocks[1].type).toBe("quick_win");
    }
  });

  it("shows only quick wins for low energy", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "Buy milk", tags: [], dueDate: today, priority: 4 });
    await taskService.create({ title: "Plan project", tags: [], dueDate: today, priority: 1 });

    const result = await exec(registry, "plan_my_day", { energy_level: "low" }, ctx);
    expect(result.focusBlocks.order).toBe("low");
    const types = result.focusBlocks.blocks.map((b: { type: string }) => b.type);
    expect(types).not.toContain("deep_work");
  });

  it("includes reminders due today", async () => {
    const today = `${todayISO()}T14:00:00.000Z`;
    await taskService.create({
      title: "Reminder task",
      tags: [],
      remindAt: today,
    });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.remindersToday).toHaveLength(1);
    expect(result.remindersToday[0].title).toBe("Reminder task");
  });

  it("returns null productivityContext with insufficient data", async () => {
    // Less than 5 completed tasks = no productivity context
    const t = await taskService.create({ title: "One task", tags: [] });
    await taskService.complete(t.id);

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.productivityContext).toBeNull();
  });

  it("returns productivityContext with sufficient completion history", async () => {
    // Create and complete 6 tasks (above PRODUCTIVITY_MIN_DAYS threshold)
    for (let i = 0; i < 6; i++) {
      const t = await taskService.create({ title: `Done task ${i}`, tags: [] });
      await taskService.complete(t.id);
    }

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.productivityContext).not.toBeNull();
    expect(result.productivityContext.recentCompletionRate).toBeGreaterThan(0);
    expect(result.productivityContext.insight).toBeTruthy();
  });

  it("caps lists at 10 items", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    for (let i = 0; i < 15; i++) {
      await taskService.create({ title: `Task ${i}`, tags: [], dueDate: today, priority: 4 });
    }

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.todaysTasks.length).toBeLessThanOrEqual(10);
  });

  it("truncates long titles", async () => {
    const longTitle = "A".repeat(80);
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: longTitle, tags: [], dueDate: today });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.todaysTasks[0].title.length).toBeLessThanOrEqual(60);
    expect(result.todaysTasks[0].title).toContain("...");
  });

  it("includes overdue count in workload", async () => {
    const yesterday = `${daysAgo(1)}T12:00:00.000Z`;
    await taskService.create({ title: "Overdue 1", tags: [], dueDate: yesterday });
    await taskService.create({ title: "Overdue 2", tags: [], dueDate: yesterday });

    const result = await exec(registry, "plan_my_day", {}, ctx);
    expect(result.workload.overdueCount).toBe(2);
  });
});

// ── daily_review ────────────────────────────────────────────────────────────

describe("daily_review", () => {
  let registry: ToolRegistry;
  let ctx: ToolContext;
  let taskService: TaskService;

  beforeEach(() => {
    registry = new ToolRegistry();
    registerDailyReviewTool(registry);
    const services = createTestServices();
    taskService = services.taskService;
    ctx = { taskService, projectService: services.projectService };
  });

  it("returns structure with empty state", async () => {
    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.date).toBe(todayISO());
    expect(result.completed).toEqual([]);
    expect(result.carriedOver).toEqual([]);
    expect(result.created).toEqual([]);
    expect(result.stats.completedCount).toBe(0);
    expect(result.stats.completionRate).toBe(0);
    expect(result.streak.currentDays).toBe(0);
    expect(result.streak.isActive).toBe(false);
    expect(result.tomorrow.taskCount).toBe(0);
    expect(result.suggestions).toEqual([]);
  });

  it("counts tasks completed today", async () => {
    const t1 = await taskService.create({ title: "Done today 1", tags: [] });
    const t2 = await taskService.create({ title: "Done today 2", tags: [] });
    await taskService.complete(t1.id);
    await taskService.complete(t2.id);

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.completed).toHaveLength(2);
    expect(result.stats.completedCount).toBe(2);
  });

  it("identifies carried over tasks", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "Carried over", tags: [], dueDate: today });

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.carriedOver).toHaveLength(1);
    expect(result.carriedOver[0].title).toBe("Carried over");
  });

  it("counts tasks created today", async () => {
    await taskService.create({ title: "New today", tags: [] });

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.created).toHaveLength(1);
    expect(result.stats.createdCount).toBe(1);
  });

  it("calculates completion rate", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    // 2 tasks due today, complete 1
    const t1 = await taskService.create({ title: "Completed", tags: [], dueDate: today });
    await taskService.create({ title: "Not done", tags: [], dueDate: today });
    await taskService.complete(t1.id);

    const result = await exec(registry, "daily_review", {}, ctx);
    // completedCount=1, carriedOver=1 (still pending + due today), planned=2
    expect(result.stats.completedCount).toBe(1);
    expect(result.stats.plannedCount).toBe(2);
    expect(result.stats.completionRate).toBe(50);
  });

  it("calculates net progress", async () => {
    // Complete 3 tasks, create 2 new ones = net +1
    for (let i = 0; i < 3; i++) {
      const t = await taskService.create({ title: `Done ${i}`, tags: [] });
      await taskService.complete(t.id);
    }
    await taskService.create({ title: "New 1", tags: [] });
    await taskService.create({ title: "New 2", tags: [] });

    const result = await exec(registry, "daily_review", {}, ctx);
    // completedCount=3, createdCount=5 (all were created today)
    // net = 3 - 5 = -2
    expect(result.stats.netProgress).toBe(result.stats.completedCount - result.stats.createdCount);
  });

  it("calculates active streak", async () => {
    // Complete a task (gives streak of 1 for today)
    const t = await taskService.create({ title: "Streak task", tags: [] });
    await taskService.complete(t.id);

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.streak.currentDays).toBeGreaterThanOrEqual(1);
    expect(result.streak.isActive).toBe(true);
  });

  it("reports inactive streak when no completions", async () => {
    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.streak.currentDays).toBe(0);
    expect(result.streak.isActive).toBe(false);
  });

  it("previews tomorrow's tasks", async () => {
    const tomorrow = `${daysFromNow(1)}T12:00:00.000Z`;
    await taskService.create({ title: "Tomorrow task", tags: [], dueDate: tomorrow });

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.tomorrow.taskCount).toBe(1);
    expect(result.tomorrow.tasks[0].title).toBe("Tomorrow task");
  });

  it("assesses tomorrow's workload", async () => {
    const tomorrow = `${daysFromNow(1)}T12:00:00.000Z`;
    for (let i = 0; i < 6; i++) {
      await taskService.create({ title: `Task ${i}`, tags: [], dueDate: tomorrow });
    }

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.tomorrow.assessment).toBe("heavy");
  });

  it("suggests action for carried over tasks", async () => {
    const today = `${todayISO()}T12:00:00.000Z`;
    await taskService.create({ title: "Leftover", tags: [], dueDate: today });

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.suggestions.length).toBeGreaterThanOrEqual(1);
    expect(result.suggestions.some((s: string) => s.includes("carried over"))).toBe(true);
  });

  it("suggests action for overdue tasks", async () => {
    const twoDaysAgo = `${daysAgo(2)}T12:00:00.000Z`;
    await taskService.create({ title: "Overdue", tags: [], dueDate: twoDaysAgo });

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.suggestions.some((s: string) => s.includes("overdue"))).toBe(true);
  });

  it("suggests action for unscheduled high-priority tasks", async () => {
    await taskService.create({ title: "Urgent unscheduled", tags: [], priority: 1 });

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.suggestions.some((s: string) => s.includes("high-priority"))).toBe(true);
  });

  it("suggests action for heavy tomorrow", async () => {
    const tomorrow = `${daysFromNow(1)}T12:00:00.000Z`;
    for (let i = 0; i < 7; i++) {
      await taskService.create({ title: `Heavy ${i}`, tags: [], dueDate: tomorrow });
    }

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.suggestions.some((s: string) => s.includes("Tomorrow looks heavy"))).toBe(true);
  });

  it("accepts optional date parameter", async () => {
    const yesterday = daysAgo(1);
    const result = await exec(registry, "daily_review", { date: yesterday }, ctx);
    expect(result.date).toBe(yesterday);
  });

  it("caps output lists at 10 items", async () => {
    for (let i = 0; i < 15; i++) {
      const t = await taskService.create({ title: `Bulk ${i}`, tags: [] });
      await taskService.complete(t.id);
    }

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.completed.length).toBeLessThanOrEqual(10);
  });

  it("truncates long titles in output", async () => {
    const longTitle = "B".repeat(80);
    const t = await taskService.create({ title: longTitle, tags: [] });
    await taskService.complete(t.id);

    const result = await exec(registry, "daily_review", {}, ctx);
    expect(result.completed[0].title.length).toBeLessThanOrEqual(60);
    expect(result.completed[0].title).toContain("...");
  });
});
