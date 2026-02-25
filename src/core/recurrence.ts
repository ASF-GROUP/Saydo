/**
 * Recurrence rule handling for recurring tasks.
 *
 * Recurrence strings follow a simplified RRULE-like format:
 * - "daily" — every day
 * - "weekly" — every week (same day)
 * - "monthly" — every month (same date)
 * - "yearly" — every year (same month/day)
 * - "weekdays" — every Mon-Fri
 * - "every N days" — every N days
 * - "every N weeks" — every N weeks
 */

export function getNextOccurrence(recurrence: string, fromDate: Date): Date | null {
  const next = new Date(fromDate);

  switch (recurrence) {
    case "daily":
      next.setDate(next.getDate() + 1);
      return next;
    case "weekly":
      next.setDate(next.getDate() + 7);
      return next;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      return next;
    case "yearly":
      next.setFullYear(next.getFullYear() + 1);
      return next;
    case "weekdays": {
      do {
        next.setDate(next.getDate() + 1);
      } while (next.getDay() === 0 || next.getDay() === 6);
      return next;
    }
    default: {
      // "every N days" or "every N weeks"
      const match = recurrence.match(/^every\s+(\d+)\s+(day|week)s?$/);
      if (match) {
        const n = parseInt(match[1], 10);
        const unit = match[2];
        if (unit === "day") next.setDate(next.getDate() + n);
        if (unit === "week") next.setDate(next.getDate() + n * 7);
        return next;
      }
      return null;
    }
  }
}
