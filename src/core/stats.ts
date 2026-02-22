import type { DailyStat } from "./types.js";
import type { DailyStatRow, IStorage } from "../storage/interface.js";
import { generateId } from "../utils/ids.js";
import { createLogger } from "../utils/logger.js";

const logger = createLogger("stats");

/** Get today's date as a YYYY-MM-DD string. */
function toDateKey(): string {
  return new Date().toISOString().split("T")[0];
}

/**
 * Stats service — tracks daily productivity metrics and streaks.
 * Records task creation/completion counts per day and calculates
 * consecutive-day completion streaks.
 */
export class StatsService {
  constructor(private queries: IStorage) {}

  /** Ensure a DailyStatRow exists for today, creating one if needed. */
  private ensureToday(): DailyStatRow {
    const date = toDateKey();
    const existing = this.queries.getDailyStat(date);
    if (existing) return existing;

    const stat: DailyStatRow = {
      id: generateId(),
      date,
      tasksCompleted: 0,
      tasksCreated: 0,
      minutesTracked: 0,
      streak: 0,
      createdAt: new Date().toISOString(),
    };
    this.queries.upsertDailyStat(stat);
    logger.debug("Daily stat created", { date });
    return stat;
  }

  /** Increment tasksCreated for today. */
  async recordTaskCreated(): Promise<DailyStat> {
    const stat = this.ensureToday();
    const updated: DailyStatRow = {
      ...stat,
      tasksCreated: stat.tasksCreated + 1,
    };
    this.queries.upsertDailyStat(updated);
    logger.debug("Task created recorded", { date: stat.date, count: updated.tasksCreated });
    return updated;
  }

  /**
   * Increment tasksCompleted (and optionally minutesTracked) for today.
   * Recalculates the current streak after recording.
   */
  async recordTaskCompleted(estimatedMinutes?: number): Promise<DailyStat> {
    const stat = this.ensureToday();
    const updated: DailyStatRow = {
      ...stat,
      tasksCompleted: stat.tasksCompleted + 1,
      minutesTracked: stat.minutesTracked + (estimatedMinutes ?? 0),
    };

    // Recalculate streak: count consecutive days ending at today with >= 1 completion
    const streak = this.calculateCurrentStreak(updated);
    updated.streak = streak;

    this.queries.upsertDailyStat(updated);
    logger.debug("Task completed recorded", {
      date: stat.date,
      completed: updated.tasksCompleted,
      streak,
    });
    return updated;
  }

  /** Get today's DailyStat. Returns a zeroed-out stat if none exists. */
  async getToday(): Promise<DailyStat> {
    return this.ensureToday();
  }

  /** Get daily stats for a date range (inclusive). */
  async getStats(startDate: string, endDate: string): Promise<DailyStatRow[]> {
    return this.queries.listDailyStats(startDate, endDate);
  }

  /**
   * Calculate the current consecutive-day completion streak.
   * A streak day is any day with tasksCompleted >= 1.
   * Counts backwards from today.
   */
  async getCurrentStreak(): Promise<number> {
    const todayStat = this.queries.getDailyStat(toDateKey());
    return this.calculateCurrentStreak(todayStat);
  }

  /**
   * Find the best (longest) streak within a date range.
   * Returns the maximum number of consecutive days with >= 1 task completed.
   */
  async getBestStreak(startDate: string, endDate: string): Promise<number> {
    const stats = this.queries.listDailyStats(startDate, endDate);
    if (stats.length === 0) return 0;

    // Build a set of dates with completions for O(1) lookup
    const completionDates = new Set<string>();
    for (const stat of stats) {
      if (stat.tasksCompleted >= 1) {
        completionDates.add(stat.date);
      }
    }

    if (completionDates.size === 0) return 0;

    // Walk day-by-day through the range and find the longest run
    let best = 0;
    let current = 0;
    const cursor = new Date(startDate + "T00:00:00Z");
    const end = new Date(endDate + "T00:00:00Z");

    while (cursor <= end) {
      const dateKey = cursor.toISOString().split("T")[0];
      if (completionDates.has(dateKey)) {
        current++;
        if (current > best) best = current;
      } else {
        current = 0;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    return best;
  }

  /**
   * Internal helper to calculate current streak, counting backwards from today.
   * Accepts an optional "today override" stat to include uncommitted changes
   * (e.g., a just-recorded completion).
   */
  private calculateCurrentStreak(todayOverride?: DailyStatRow): number {
    const today = toDateKey();

    // Check if today has completions (use override if provided)
    const todayCompleted = todayOverride
      ? todayOverride.tasksCompleted
      : (this.queries.getDailyStat(today)?.tasksCompleted ?? 0);

    if (todayCompleted < 1) return 0;

    // Start at 1 for today, then walk backwards
    let streak = 1;
    const cursor = new Date(today + "T00:00:00Z");

    while (true) {
      cursor.setUTCDate(cursor.getUTCDate() - 1);
      const dateKey = cursor.toISOString().split("T")[0];
      const stat = this.queries.getDailyStat(dateKey);

      if (!stat || stat.tasksCompleted < 1) break;
      streak++;
    }

    return streak;
  }
}
