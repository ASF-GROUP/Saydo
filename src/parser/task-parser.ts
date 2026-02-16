import { parseDate, removeDateText } from "./nlp.js";
import { extractPriority, extractTags, extractProject, extractRecurrence } from "./grammar.js";

export interface ParsedTask {
  title: string;
  priority: number | null;
  tags: string[];
  project: string | null;
  dueDate: Date | null;
  dueTime: boolean;
  recurrence: string | null;
}

/**
 * Parse a natural language task input string into structured task data.
 *
 * Examples:
 *  "buy milk tomorrow at 3pm p1 #groceries +shopping"
 *  → { title: "buy milk", dueDate: <tomorrow 15:00>, dueTime: true, priority: 1, tags: ["groceries"], project: "shopping" }
 *
 *  "review PR #dev"
 *  → { title: "review PR", dueDate: null, dueTime: false, priority: null, tags: ["dev"], project: null }
 */
export function parseTask(input: string): ParsedTask {
  let remaining = input.trim();

  // Extract priority (p1, p2, p3, p4)
  const { priority, text: afterPriority } = extractPriority(remaining);
  remaining = afterPriority;

  // Extract tags (#tag1 #tag2)
  const { tags, text: afterTags } = extractTags(remaining);
  remaining = afterTags;

  // Extract project (+projectName)
  const { project, text: afterProject } = extractProject(remaining);
  remaining = afterProject;

  // Extract recurrence (before dates, to avoid chrono-node confusion with "daily", "every day", etc.)
  const { recurrence, text: afterRecurrence } = extractRecurrence(remaining);
  remaining = afterRecurrence;

  // Extract date/time
  let dueDate: Date | null = null;
  let dueTime = false;
  const parsed = parseDate(remaining);
  if (parsed) {
    dueDate = parsed.date;
    dueTime = parsed.hasTime;
    remaining = removeDateText(remaining, parsed.text);
  }

  // Whatever's left is the title
  const title = remaining.replace(/\s+/g, " ").trim();

  return { title, priority, tags, project, dueDate, dueTime, recurrence };
}
