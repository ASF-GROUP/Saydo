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

/** Extract project (+projectName) from input. */
export function extractProject(input: string): { project: string | null; text: string } {
  const match = input.match(/\+([\w-]+)/);
  if (!match) return { project: null, text: input };

  const project = match[1];
  const text = input.replace(match[0], "").replace(/\s+/g, " ").trim();
  return { project, text };
}
