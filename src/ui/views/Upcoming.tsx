import { TaskList } from "../components/TaskList.js";
import type { Task } from "../../core/types.js";

interface UpcomingProps {
  tasks: Task[];
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
      <h1 className="text-2xl font-bold mb-4">Upcoming</h1>
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
