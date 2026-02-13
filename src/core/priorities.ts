import { PRIORITIES } from "../config/defaults.js";

/** Get priority metadata by value. */
export function getPriority(value: number) {
  const entry = Object.values(PRIORITIES).find((p) => p.value === value);
  return entry ?? null;
}

/** Sort tasks by priority (P1 first, null last), then by sortOrder within same priority. */
export function sortByPriority<T extends { priority: number | null; sortOrder?: number }>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    if (a.priority === null && b.priority === null) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    if (a.priority === null) return 1;
    if (b.priority === null) return -1;
    if (a.priority !== b.priority) return a.priority - b.priority;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}
