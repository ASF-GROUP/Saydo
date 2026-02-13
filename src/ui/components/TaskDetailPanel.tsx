import { useState } from "react";
import type { Task, UpdateTaskInput } from "../../core/types.js";

interface TaskDetailPanelProps {
  task: Task;
  onUpdate: (id: string, input: UpdateTaskInput) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

const PRIORITIES = [
  { value: 1, label: "P1", color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" },
  {
    value: 2,
    label: "P2",
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
  },
  {
    value: 3,
    label: "P3",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  },
  {
    value: 4,
    label: "P4",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
];

export function TaskDetailPanel({ task, onUpdate, onDelete, onClose }: TaskDetailPanelProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? "");

  const handleTitleBlur = () => {
    const trimmed = title.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdate(task.id, { title: trimmed });
    }
  };

  const handleDescriptionBlur = () => {
    const newDesc = description || null;
    if (newDesc !== task.description) {
      onUpdate(task.id, { description: newDesc });
    }
  };

  const handlePriorityClick = (priority: number) => {
    const newPriority = task.priority === priority ? null : priority;
    onUpdate(task.id, { priority: newPriority });
  };

  return (
    <div className="w-96 border-l border-gray-200 dark:border-gray-700 flex flex-col bg-white dark:bg-gray-900 overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <span className="text-xs text-gray-400 font-mono">{task.id.slice(0, 8)}</span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-lg"
        >
          &times;
        </button>
      </div>

      <div className="flex-1 p-4 space-y-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="w-full text-lg font-semibold bg-transparent border-none focus:outline-none focus:ring-0"
        />

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Priority
          </label>
          <div className="flex gap-2 mt-1">
            {PRIORITIES.map((p) => (
              <button
                key={p.value}
                onClick={() => handlePriorityClick(p.value)}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  task.priority === p.value
                    ? p.color
                    : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description..."
            className="w-full mt-1 p-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[80px] resize-y"
          />
        </div>

        {task.dueDate && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Due Date
            </label>
            <p className="text-sm mt-1">{new Date(task.dueDate).toLocaleDateString()}</p>
          </div>
        )}

        {task.tags.length > 0 && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tags
            </label>
            <div className="flex gap-1.5 mt-1 flex-wrap">
              {task.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {task.recurrence && (
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              Recurrence
            </label>
            <p className="text-sm mt-1">{task.recurrence}</p>
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Created
          </label>
          <p className="text-sm mt-1 text-gray-500">{new Date(task.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onDelete(task.id)}
          className="text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400"
        >
          Delete task
        </button>
      </div>
    </div>
  );
}
