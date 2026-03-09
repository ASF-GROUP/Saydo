import type { TimeBlock } from "../types.js";
import { formatDateStr, timeToMinutes } from "../components/TimelineColumn.js";

export type ViewMode = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export const VIEW_MODE_LABELS: Array<{ value: ViewMode; label: string }> = [
  { value: 1, label: "Day" },
  { value: 3, label: "3D" },
  { value: 5, label: "5D" },
  { value: 7, label: "Week" },
];

export function getPixelsPerHour(dayCount: ViewMode): number {
  if (dayCount === 1) return 80;
  if (dayCount <= 3) return 64;
  if (dayCount <= 5) return 48;
  return 40;
}

export function formatDateRange(startDate: Date, dayCount: number): string {
  if (dayCount === 1) {
    return startDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + dayCount - 1);
  const startStr = startDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const endStr = endDate.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startStr} \u2013 ${endStr}`;
}

export function getDateRangeStrings(startDate: Date, dayCount: number): { startStr: string; endStr: string } {
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + dayCount - 1);
  return { startStr: formatDateStr(startDate), endStr: formatDateStr(endDate) };
}

/** Find the currently active block (current time falls within its range). */
export function findActiveBlock(blocks: TimeBlock[]): TimeBlock | null {
  const now = new Date();
  const todayStr = formatDateStr(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return blocks.find(
    (b) =>
      b.date === todayStr &&
      nowMinutes >= timeToMinutes(b.startTime) &&
      nowMinutes < timeToMinutes(b.endTime),
  ) ?? null;
}

export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 400;
export const SIDEBAR_DEFAULT_WIDTH = 280;
