import type { Task } from "../../core/types.js";
import { TaskItem } from "./TaskItem.js";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedTaskId: string | null;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  onToggle,
  onSelect,
  selectedTaskId,
  emptyMessage,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        {emptyMessage ?? "No tasks yet. Add one above!"}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onSelect={onSelect}
          isSelected={selectedTaskId === task.id}
        />
      ))}
    </div>
  );
}
