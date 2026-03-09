import { parseDate, removeDateText } from "./nlp.js";
import {
  extractPriority,
  extractTags,
  extractProject,
  extractRecurrence,
  extractDuration,
  extractDeadline,
  extractDreadLevel,
  extractSomeday,
} from "./grammar.js";

export interface ParsedTask {
  title: string;
  priority: number | null;
  tags: string[];
  project: string | null;
  dueDate: Date | null;
  dueTime: boolean;
  recurrence: string | null;
  estimatedMinutes: number | null;
  deadline: Date | null;
  isSomeday: boolean;
  dreadLevel: number | null;
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

  // Extract duration (~30m, ~1h, ~1.5h)
  const { estimatedMinutes, text: afterDuration } = extractDuration(remaining);
  remaining = afterDuration;

  // Extract dread level (~d1-~d5 or !frog1-!frog5)
  const { dreadLevel, text: afterDread } = extractDreadLevel(remaining);
  remaining = afterDread;

  // Extract hard deadline (!!tomorrow, !!jan 15, !!next friday)
  let deadline: Date | null = null;
  const { deadlineText, text: afterDeadline } = extractDeadline(remaining);
  remaining = afterDeadline;
  if (deadlineText) {
    const parsedDeadline = parseDate(deadlineText);
    if (parsedDeadline) {
      deadline = parsedDeadline.date;
    }
  }

  // Extract someday marker (~someday, /someday)
  const { isSomeday, text: afterSomeday } = extractSomeday(remaining);
  remaining = afterSomeday;

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

  return {
    title,
    priority,
    tags,
    project,
    dueDate,
    dueTime,
    recurrence,
    estimatedMinutes,
    deadline,
    isSomeday,
    dreadLevel,
  };
}
