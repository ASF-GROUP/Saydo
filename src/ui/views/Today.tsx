import { TaskList } from "../components/TaskList.js";
import type { Task } from "../../core/types.js";

interface TodayProps {
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
}

export function Today({ tasks, onToggleTask, onSelectTask, selectedTaskId }: TodayProps) {
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
      />
    </div>
  );
}
