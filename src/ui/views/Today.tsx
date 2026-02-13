import { TaskList } from "../components/TaskList.js";
import type { Task } from "../../core/types.js";

interface TodayProps {
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

export function Today({
  tasks,
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
      <h1 className="text-2xl font-bold mb-4">Today</h1>
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
