import { useState } from "react";
import { AlertTriangle, Calendar, ChevronDown, ChevronRight } from "lucide-react";
import type { Task, Project } from "../../core/types.js";

/** Map priority level to Tailwind border color class for the checkbox circle */
function getPriorityBorderClass(priority: number | null): string {
  switch (priority) {
    case 1:
      return "border-priority-1";
    case 2:
      return "border-priority-2";
    case 3:
      return "border-priority-3";
    default:
      return "border-on-surface-muted/30";
  }
}

interface OverdueSectionProps {
  tasks: Task[];
  projects: Map<string, Project>;
  onSelectTask: (id: string) => void;
  onToggleTask: (id: string) => void;
  onReschedule: () => void;
  selectedTaskId: string | null;
}

export function OverdueSection({
  tasks,
  projects,
  onSelectTask,
  onToggleTask,
  onReschedule,
  selectedTaskId,
}: OverdueSectionProps) {
  const [expanded, setExpanded] = useState(true);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 text-sm font-semibold text-error hover:text-error/80 transition-colors"
        >
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <AlertTriangle size={14} />
          Overdue
        </button>
        <span className="text-xs text-error font-medium">{tasks.length}</span>
        <button
          onClick={onReschedule}
          className="ml-auto text-xs text-accent hover:text-accent/80 font-medium transition-colors"
        >
          Reschedule
        </button>
      </div>
      {expanded && (
        <div>
          {tasks.map((task) => {
            const project = task.projectId ? projects.get(task.projectId) : null;
            const borderClass = getPriorityBorderClass(task.priority);
            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTask(task.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTask(task.id);
                  }
                }}
                className={`flex items-start gap-3 px-3 py-3 rounded-lg cursor-pointer transition-colors border-b border-border/30 last:border-b-0 ${
                  selectedTaskId === task.id
                    ? "bg-accent/5 ring-1 ring-accent/50"
                    : "hover:bg-surface-secondary"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleTask(task.id);
                  }}
                  aria-label="Complete task"
                  className={`w-5 h-5 rounded-full border-2 ${borderClass} flex-shrink-0 transition-colors mt-0.5`}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-on-surface block truncate">{task.title}</span>
                  <span className="text-xs text-error font-medium flex items-center gap-1 mt-0.5">
                    <Calendar size={11} />
                    {new Date(task.dueDate!).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {project && (
                  <span className="flex items-center gap-1.5 text-xs text-on-surface-muted flex-shrink-0 mt-0.5">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: project.color }}
                    />
                    {project.name}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
