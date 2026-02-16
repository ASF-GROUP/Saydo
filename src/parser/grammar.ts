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
