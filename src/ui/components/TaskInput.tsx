import React, { useState, useMemo } from "react";
import { parseTask } from "../../parser/task-parser.js";

interface TaskInputProps {
  onSubmit: (input: ReturnType<typeof parseTask>) => void;
  placeholder?: string;
}

export function TaskInput({ onSubmit, placeholder }: TaskInputProps) {
  const [value, setValue] = useState("");

  const preview = useMemo(() => {
    if (!value.trim()) return null;
    return parseTask(value);
  }, [value]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;

    const parsed = parseTask(value);
    onSubmit(parsed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder ?? 'Add a task... (e.g., "buy milk tomorrow p1 #groceries")'}
        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      {preview && (
        <div className="flex flex-wrap gap-2 mt-1.5 px-1 text-xs">
          <span className="text-gray-600 dark:text-gray-400">{preview.title}</span>
          {preview.priority && (
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              P{preview.priority}
            </span>
          )}
          {preview.dueDate && (
            <span className="text-blue-600 dark:text-blue-400">
              {preview.dueDate.toLocaleDateString()}
            </span>
          )}
          {preview.tags.map((tag) => (
            <span key={tag} className="text-purple-600 dark:text-purple-400">
              #{tag}
            </span>
          ))}
          {preview.project && (
            <span className="text-green-600 dark:text-green-400">+{preview.project}</span>
          )}
        </div>
      )}
    </form>
  );
}
