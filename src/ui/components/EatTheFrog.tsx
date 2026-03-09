import { useState, useEffect, useMemo, useCallback } from "react";
import { Check } from "lucide-react";
import type { Task } from "../../core/types.js";
import { FrogIcon, getDreadLevelColor } from "./DreadLevelSelector.js";

interface EatTheFrogProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
}

/**
 * Select the highest-dread pending task.
 * Tiebreak: earliest due time, then alphabetical by title.
 */
export function selectFrogTask(tasks: Task[]): Task | null {
  const candidates = tasks.filter(
    (t) => t.status === "pending" && t.dreadLevel != null && t.dreadLevel > 0,
  );

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    // Highest dread first
    const dreadDiff = (b.dreadLevel ?? 0) - (a.dreadLevel ?? 0);
    if (dreadDiff !== 0) return dreadDiff;

    // Earliest due time (null last)
    if (a.dueDate && b.dueDate) {
      const dateDiff = a.dueDate.localeCompare(b.dueDate);
      if (dateDiff !== 0) return dateDiff;
    } else if (a.dueDate) {
      return -1;
    } else if (b.dueDate) {
      return 1;
    }

    // Alphabetical
    return a.title.localeCompare(b.title);
  });

  return candidates[0];
}

/**
 * "Eat the Frog" section — shows the highest-dread task for today.
 * Displays a prominent card encouraging the user to tackle their most dreaded task first.
 * Returns null when no tasks have dread levels.
 */
export function EatTheFrog({ tasks, onToggleTask, onSelectTask }: EatTheFrogProps) {
  const [dismissed, setDismissed] = useState(false);
  const [frogEaten, setFrogEaten] = useState(false);

  const frogTask = useMemo(() => selectFrogTask(tasks), [tasks]);

  // Reset dismissed state when frog task changes
  useEffect(() => {
    setDismissed(false);
    setFrogEaten(false);
  }, [frogTask?.id]);

  const handleComplete = useCallback(() => {
    if (!frogTask) return;
    setFrogEaten(true);
    onToggleTask(frogTask.id);
    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      setDismissed(true);
    }, 3000);
  }, [frogTask, onToggleTask]);

  if (!frogTask || dismissed) return null;

  const dreadColor = getDreadLevelColor(frogTask.dreadLevel ?? 1);

  if (frogEaten) {
    return (
      <div className="mb-4 rounded-lg border border-success/30 bg-success/5 p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
            <Check size={20} className="text-success" />
          </div>
          <div>
            <p className="text-sm font-semibold text-success">Frog eaten!</p>
            <p className="text-xs text-on-surface-muted">
              Great job tackling your most dreaded task first.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="mb-4 rounded-lg border border-border bg-surface-secondary p-4 animate-fade-in cursor-pointer hover:bg-surface-tertiary transition-colors"
      onClick={() => onSelectTask(frogTask.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelectTask(frogTask.id);
        }
      }}
      aria-label={`Eat the frog: ${frogTask.title}`}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${dreadColor.fill}15` }}
        >
          <FrogIcon size={22} color={dreadColor.fill} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-on-surface-muted uppercase tracking-wider mb-0.5">
            Eat this frog first!
          </p>
          <p className="text-sm font-semibold text-on-surface truncate">{frogTask.title}</p>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleComplete();
          }}
          className="px-3 py-1.5 text-xs font-medium rounded-md bg-success/10 text-success hover:bg-success/20 transition-colors flex-shrink-0"
          aria-label="Complete frog task"
        >
          Done
        </button>
      </div>
    </div>
  );
}
