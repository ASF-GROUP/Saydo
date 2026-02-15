import { Clock } from "lucide-react";
import { parseTask } from "../../parser/task-parser.js";
import { TaskInput } from "../components/TaskInput.js";
import { TaskList } from "../components/TaskList.js";
import type { Task } from "../../core/types.js";

interface UpcomingProps {
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

export function Upcoming({
  tasks,
  onCreateTask,
  onToggleTask,
  onSelectTask,
  selectedTaskId,
  selectedTaskIds,
  onMultiSelect,
  onReorder,
}: UpcomingProps) {
  const upcomingTasks = tasks
    .filter((t) => t.status === "pending" && t.dueDate)
    .sort((a, b) => (a.dueDate! > b.dueDate! ? 1 : -1));

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Clock size={24} className="text-accent" />
        <h1 className="text-2xl font-bold text-on-surface">Upcoming</h1>
        <span className="text-sm text-on-surface-muted">{upcomingTasks.length} tasks</span>
      </div>
      <TaskInput
        onSubmit={onCreateTask}
        placeholder='Add an upcoming task... (e.g., "plan trip next monday p2")'
      />
      <TaskList
        tasks={upcomingTasks}
        onToggle={onToggleTask}
        onSelect={onSelectTask}
        selectedTaskId={selectedTaskId}
        emptyMessage="No upcoming tasks with due dates."
        selectedTaskIds={selectedTaskIds}
        onMultiSelect={onMultiSelect}
        onReorder={onReorder}
      />
    </div>
  );
}
