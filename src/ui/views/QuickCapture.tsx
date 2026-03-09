import { useEffect, useCallback } from "react";
import { TaskInput } from "../components/TaskInput.js";
import { isTauri } from "../../utils/tauri.js";
import type { ParsedTask } from "../../parser/task-parser.js";

/**
 * Minimal quick-capture view rendered in the borderless Tauri capture window.
 * Contains only a TaskInput — no sidebar, no navigation, no chrome.
 *
 * Lifecycle:
 * - On Enter (task submit): emits `quick-capture-submit` event to main window, then hides
 * - On Escape: hides the window
 * - On blur: hides the window
 */
export function QuickCapture() {
  const hideWindow = useCallback(async () => {
    if (!isTauri()) return;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().hide();
    } catch {
      // Degrade gracefully
    }
  }, []);

  // Hide on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hideWindow();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [hideWindow]);

  // Hide on window blur
  useEffect(() => {
    const handleBlur = () => {
      hideWindow();
    };
    window.addEventListener("blur", handleBlur);
    return () => window.removeEventListener("blur", handleBlur);
  }, [hideWindow]);

  const handleSubmit = useCallback(
    async (input: ParsedTask) => {
      if (!isTauri()) return;
      try {
        const { emit } = await import("@tauri-apps/api/event");
        await emit("quick-capture-submit", {
          title: input.title,
          priority: input.priority,
          tags: input.tags,
          project: input.project,
          dueDate: input.dueDate ? input.dueDate.toISOString() : null,
          dueTime: input.dueTime,
          recurrence: input.recurrence,
          estimatedMinutes: input.estimatedMinutes,
          deadline: input.deadline ? input.deadline.toISOString() : null,
          isSomeday: input.isSomeday,
        });
      } catch {
        // Degrade gracefully
      }
      hideWindow();
    },
    [hideWindow],
  );

  return (
    <div className="h-screen w-screen bg-surface flex items-center px-3 shadow-2xl border border-border rounded-xl">
      <div className="flex-1">
        <TaskInput
          onSubmit={handleSubmit}
          placeholder='Quick capture... (e.g., "buy milk tomorrow p1 #groceries")'
          autoFocusTrigger={1}
        />
      </div>
    </div>
  );
}
