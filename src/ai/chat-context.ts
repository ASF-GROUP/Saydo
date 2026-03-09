import type { ToolContext } from "./tools/types.js";
import type { IStorage } from "../storage/interface.js";

/**
 * Gather live context from services for the system message.
 * Must be called async before building the system message.
 */
export async function gatherContext(
  services: ToolContext,
  options?: {
    compact?: boolean;
    voiceCall?: boolean;
    storage?: IStorage;
    focusedTaskId?: string;
  },
): Promise<string> {
  const { taskService, projectService } = services;
  const todayISO = new Date().toISOString().split("T")[0];
  const compact = options?.compact ?? false;
  const voiceCall = options?.voiceCall ?? false;
  const storage = options?.storage ?? services.storage;
  const focusedTaskId = options?.focusedTaskId;

  const allTasks = await taskService.list();
  const projects = await projectService.list();

  const pending = allTasks.filter((t) => t.status === "pending");
  const overdue = pending.filter((t) => t.dueDate && t.dueDate < todayISO);

  const voiceCallBlock = voiceCall
    ? `## Voice Call Mode
You are in a live voice call with the user. Follow these rules:
- Be conversational and concise — speak in short sentences
- Confirm actions briefly: "Done, created Buy groceries for tomorrow"
- Ask follow-up questions naturally: "Anything else?"
- When user says multiple tasks in one sentence, create each one separately
- For "plan my day" or "what's on my plate": query tasks, summarize briefly, suggest an order
- Don't use markdown formatting — your response will be spoken aloud
- Keep responses under 3 sentences unless the user asks for details
- End your responses in a way that invites the user to continue talking

`
    : "";

  if (compact) {
    const lines: string[] = [`Pending: ${pending.length}`];
    if (overdue.length > 0) lines.push(`Overdue: ${overdue.length}`);
    if (projects.length > 0) lines.push(`Projects: ${projects.map((p) => p.name).join(", ")}`);
    return voiceCallBlock + lines.join(". ") + ".";
  }

  const dueToday = pending.filter((t) => t.dueDate?.startsWith(todayISO));
  const highPriority = pending.filter((t) => t.priority === 1 || t.priority === 2);
  const noPriority = pending.filter((t) => t.priority === null);

  const lines: string[] = ["## Current Task Context"];

  lines.push(`- Total pending tasks: ${pending.length}`);
  if (overdue.length > 0) {
    lines.push(`- OVERDUE tasks: ${overdue.length}`);
    for (const t of overdue.slice(0, 5)) {
      lines.push(`  - "${t.title}" (due ${t.dueDate}${t.priority ? `, P${t.priority}` : ""})`);
    }
    if (overdue.length > 5) lines.push(`  - ...and ${overdue.length - 5} more`);
  }
  if (dueToday.length > 0) {
    lines.push(`- Due TODAY: ${dueToday.length}`);
    for (const t of dueToday.slice(0, 5)) {
      lines.push(`  - "${t.title}"${t.priority ? ` (P${t.priority})` : ""}`);
    }
  }
  if (highPriority.length > 0) {
    lines.push(`- High priority (P1/P2): ${highPriority.length}`);
  }
  if (noPriority.length > 0) {
    lines.push(`- Tasks without priority: ${noPriority.length}`);
  }
  if (projects.length > 0) {
    lines.push(`- Projects: ${projects.map((p) => p.name).join(", ")}`);
  }

  // Tags and scheduling insights for analytical tools
  const untagged = pending.filter((t) => t.tags.length === 0);
  if (untagged.length > 0) {
    lines.push(`- Tasks without tags: ${untagged.length} (try asking me to organize them)`);
  }

  const unscheduled = pending.filter((t) => !t.dueDate);
  if (unscheduled.length > 0) {
    lines.push(`- Tasks without due dates: ${unscheduled.length}`);
  }

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoISO = sevenDaysAgo.toISOString();
  const completedRecently = allTasks.filter(
    (t) => t.status === "completed" && t.completedAt && t.completedAt >= sevenDaysAgoISO,
  );
  if (completedRecently.length > 0) {
    lines.push(`- Tasks completed in last 7 days: ${completedRecently.length}`);
  }

  // Inject AI memories
  if (storage) {
    try {
      const memories = storage.listAiMemories();
      if (memories.length > 0) {
        lines.push("");
        lines.push("## Your memories about the user");
        for (const m of memories) {
          lines.push(`- [${m.category}] ${m.content}`);
        }
      }
    } catch {
      // Non-critical — memories just won't be injected
    }
  }

  // Inject custom instructions
  if (storage) {
    try {
      const customInstructions = storage.getAppSetting("ai_custom_instructions");
      if (customInstructions?.value) {
        lines.push("");
        lines.push("## User's Custom Instructions");
        lines.push(customInstructions.value);
      }
    } catch {
      // Non-critical
    }
  }

  // Inject focused task context
  if (focusedTaskId) {
    try {
      const task = await taskService.get(focusedTaskId);
      if (task) {
        lines.push("");
        lines.push("## Currently Focused Task");
        lines.push(`- Title: "${task.title}"`);
        lines.push(`- ID: ${task.id}`);
        lines.push(`- Status: ${task.status}`);
        if (task.priority) lines.push(`- Priority: P${task.priority}`);
        if (task.dueDate) lines.push(`- Due: ${task.dueDate}`);
        if (task.projectId) lines.push(`- Project ID: ${task.projectId}`);
        if (task.tags.length > 0) lines.push(`- Tags: ${task.tags.join(", ")}`);
        if (task.description) lines.push(`- Description: ${task.description}`);
        if (task.estimatedMinutes) lines.push(`- Estimated: ${task.estimatedMinutes} minutes`);
        if (task.deadline) lines.push(`- Deadline: ${task.deadline}`);
        if (task.recurrence) lines.push(`- Recurrence: ${task.recurrence}`);
        if (task.remindAt) lines.push(`- Reminder: ${task.remindAt}`);
      }
    } catch {
      // Non-critical — focused task just won't be injected
    }
  }

  return voiceCallBlock + lines.join("\n");
}
