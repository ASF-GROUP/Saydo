import { TaskInput } from "../components/TaskInput.js";
import { TaskList } from "../components/TaskList.js";
import type { Task } from "../../core/types.js";

interface InboxProps {
  tasks: Task[];
  onCreateTask: (parsed: {
    title: string;
    priority: number | null;
    tags: string[];
    project: string | null;
    dueDate: Date | null;
    dueTime: boolean;
  }) => void;
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

export function Inbox({
  tasks,
  onCreateTask,
  onToggleTask,
  onSelectTask,
  selectedTaskId,
  selectedTaskIds,
  onMultiSelect,
  onReorder,
}: InboxProps) {
  const inboxTasks = tasks.filter((t) => t.status === "pending" && !t.projectId);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Inbox</h1>
      <TaskInput onSubmit={onCreateTask} />
      <TaskList
        tasks={inboxTasks}
        onToggle={onToggleTask}
        onSelect={onSelectTask}
        selectedTaskId={selectedTaskId}
        emptyMessage="Your inbox is empty. Add a task above!"
        selectedTaskIds={selectedTaskIds}
        onMultiSelect={onMultiSelect}
        onReorder={onReorder}
      />
    </div>
  );
}
