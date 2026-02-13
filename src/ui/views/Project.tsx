import { TaskInput } from "../components/TaskInput.js";
import { TaskList } from "../components/TaskList.js";
import type { Task, Project as ProjectType } from "../../core/types.js";

interface ProjectProps {
  project: ProjectType;
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
}

export function Project({
  project,
  tasks,
  onCreateTask,
  onToggleTask,
  onSelectTask,
  selectedTaskId,
}: ProjectProps) {
  const projectTasks = tasks.filter((t) => t.status === "pending" && t.projectId === project.id);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: project.color }} />
        <h1 className="text-2xl font-bold">{project.name}</h1>
      </div>
      <TaskInput onSubmit={onCreateTask} placeholder={`Add a task to ${project.name}...`} />
      <TaskList
        tasks={projectTasks}
        onToggle={onToggleTask}
        onSelect={onSelectTask}
        selectedTaskId={selectedTaskId}
        emptyMessage="No tasks in this project yet."
      />
    </div>
  );
}
