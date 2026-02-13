/** Default application settings and constants. */

export const PRIORITIES = {
  P1: { value: 1, label: "P1", color: "#ef4444" },
  P2: { value: 2, label: "P2", color: "#f59e0b" },
  P3: { value: 3, label: "P3", color: "#3b82f6" },
  P4: { value: 4, label: "P4", color: "#6b7280" },
} as const;

export const TASK_STATUSES = ["pending", "completed", "cancelled"] as const;

export const DEFAULT_PROJECT_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
] as const;

export const COMMAND_PALETTE_HOTKEY = "Ctrl+K";
export const MAX_TASK_TITLE_LENGTH = 500;
export const MAX_DESCRIPTION_LENGTH = 10000;
