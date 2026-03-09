/**
 * Grammar rules for task-specific syntax.
 * Extracts structured tokens from task input strings.
 */

/** Extract priority (p1, p2, p3, p4) from input. */
export function extractPriority(input: string): { priority: number | null; text: string } {
  const match = input.match(/\bp([1-4])\b/i);
  if (!match) return { priority: null, text: input };

  const priority = parseInt(match[1], 10);
  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { priority, text };
}

/** Extract tags (#tag1 #tag-name) from input. */
export function extractTags(input: string): { tags: string[]; text: string } {
  const tagPattern = /#([\w-]+)/g;
  const tags: string[] = [];
  let match;

  while ((match = tagPattern.exec(input)) !== null) {
    tags.push(match[1].toLowerCase());
  }

  const text = input
    .replace(/#[\w-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return { tags, text };
}

/** Extract recurrence pattern from input. */
export function extractRecurrence(input: string): { recurrence: string | null; text: string } {
  // "every N days/weeks"
  const everyMatch = input.match(/\bevery\s+(\d+)\s+(day|week)s?\b/i);
  if (everyMatch) {
    const n = parseInt(everyMatch[1], 10);
    const unit = everyMatch[2].toLowerCase();
    const suffix = n === 1 ? "" : "s";
    const recurrence = `every ${n} ${unit}${suffix}`;
    const text = input.replace(everyMatch[0], "").replace(/\s+/g, " ").trim();
    return { recurrence, text };
  }

  // "every day/week/month"
  const everyUnitMatch = input.match(/\bevery\s+(day|week|month)\b/i);
  if (everyUnitMatch) {
    const unit = everyUnitMatch[1].toLowerCase();
    const recurrence = unit === "day" ? "daily" : unit === "week" ? "weekly" : "monthly";
    const text = input.replace(everyUnitMatch[0], "").replace(/\s+/g, " ").trim();
    return { recurrence, text };
  }

  // Simple keywords: daily, weekly, monthly, weekdays
  const keywordMatch = input.match(/\b(daily|weekly|monthly|weekdays)\b/i);
  if (keywordMatch) {
    const recurrence = keywordMatch[1].toLowerCase();
    const text = input.replace(keywordMatch[0], "").replace(/\s+/g, " ").trim();
    return { recurrence, text };
  }

  return { recurrence: null, text: input };
}

/** Extract project (+projectName) from input. */
export function extractProject(input: string): { project: string | null; text: string } {
  const match = input.match(/\+([\w-]+)/);
  if (!match) return { project: null, text: input };

  const project = match[1];
  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { project, text };
}

/** Extract estimated duration (~30m, ~1h, ~1.5h, ~90m, ~1h30m) from input. The ~ prefix is required. */
export function extractDuration(input: string): {
  estimatedMinutes: number | null;
  text: string;
} {
  // Try compound format first: ~1h30m
  const compoundMatch = input.match(/~(\d+)h(\d+)m\b/i);
  if (compoundMatch) {
    const hours = parseInt(compoundMatch[1], 10);
    const mins = parseInt(compoundMatch[2], 10);
    const estimatedMinutes = hours * 60 + mins;
    const text = input.replace(compoundMatch[0], "").replace(/\s+/g, " ").trim();
    return { estimatedMinutes, text };
  }

  // Simple format: ~30m, ~1h, ~1.5h
  const match = input.match(/~(\d+(?:\.\d+)?)(m|h)\b/i);
  if (!match) return { estimatedMinutes: null, text: input };

  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  const estimatedMinutes = unit === "h" ? Math.round(value * 60) : Math.round(value);
  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { estimatedMinutes, text };
}

/** Extract hard deadline (!!tomorrow, !!jan 15, !!next friday, deadline friday) from input. The !! prefix or "deadline" keyword marks a hard deadline. */
export function extractDeadline(input: string): {
  deadlineText: string | null;
  text: string;
} {
  // Try "deadline <date>" keyword syntax first
  const keywordMatch = input.match(
    /\bdeadline\s+([a-zA-Z0-9][a-zA-Z0-9 ]*?)(?=\s+[~#!+]|\s+p[1-4]\b|$)/i,
  );
  if (keywordMatch) {
    const deadlineText = keywordMatch[1].trim();
    const text = input.replace(keywordMatch[0], "").replace(/\s+/g, " ").trim();
    return { deadlineText, text };
  }

  // Fall back to !! prefix syntax
  const match = input.match(/!!([a-zA-Z0-9][a-zA-Z0-9 ]*?)(?=\s+[~#!+]|\s+p[1-4]\b|$)/i);
  if (!match) return { deadlineText: null, text: input };

  const deadlineText = match[1].trim();
  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { deadlineText, text };
}

/** Extract dread level (~d1-~d5 or !frog1-!frog5) from input. */
export function extractDreadLevel(input: string): {
  dreadLevel: number | null;
  text: string;
} {
  const match = input.match(/(?:~d|!frog)([1-5])\b/i);
  if (!match) return { dreadLevel: null, text: input };

  const dreadLevel = parseInt(match[1], 10);
  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { dreadLevel, text };
}

/** Extract someday marker (~someday or /someday) from input. */
export function extractSomeday(input: string): { isSomeday: boolean; text: string } {
  const match = input.match(/(?:~|\/)(someday)\b/i);
  if (!match) return { isSomeday: false, text: input };

  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { isSomeday: true, text };
}
