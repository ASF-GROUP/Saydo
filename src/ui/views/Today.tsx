import { CalendarDays } from "lucide-react";
import { parseTask } from "../../parser/task-parser.js";
import { TaskInput } from "../components/TaskInput.js";
import { TaskList } from "../components/TaskList.js";
import type { Task } from "../../core/types.js";

interface TodayProps {
  tasks: Task[];
  onCreateTask: (input: ReturnType<typeof parseTask>) => void;
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
  selectedTaskIds?: Set<string>;
  onMultiSelect?: (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  onReorder?: (orderedIds: string[]) => void;
}

export function Today({
  tasks,
  onCreateTask,
  onToggleTask,
  onSelectTask,
  selectedTaskId,
  selectedTaskIds,
  onMultiSelect,
  onReorder,
}: TodayProps) {
  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.status === "pending" && t.dueDate?.startsWith(today));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <CalendarDays size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-on-surface">Today</h1>
        <span className="text-sm text-on-surface-muted">
          {new Date().toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>
      <TaskInput
        onSubmit={onCreateTask}
        placeholder='Add a task for today... (e.g., "buy milk today p1")'
      />
      <TaskList
        tasks={todayTasks}
        onToggle={onToggleTask}
        onSelect={onSelectTask}
        selectedTaskId={selectedTaskId}
        emptyMessage="Nothing due today!"
        selectedTaskIds={selectedTaskIds}
        onMultiSelect={onMultiSelect}
        onReorder={onReorder}
      />
    </div>
  );
}
