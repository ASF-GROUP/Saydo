import type { Task } from "../../core/types.js";
import { getPriority } from "../../core/priorities.js";

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  isMultiSelected?: boolean;
  showCheckbox?: boolean;
  onMultiSelect?: (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  dragHandleProps?: Record<string, unknown>;
  style?: React.CSSProperties;
  innerRef?: React.Ref<HTMLDivElement>;
}

export function TaskItem({
  task,
  onToggle,
  onSelect,
  isSelected,
  isMultiSelected,
  showCheckbox,
  onMultiSelect,
  dragHandleProps,
  style,
  innerRef,
}: TaskItemProps) {
  const priority = task.priority ? getPriority(task.priority) : null;

  const handleClick = (e: React.MouseEvent) => {
    if (onMultiSelect && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      onMultiSelect(task.id, { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey });
      return;
    }
    onSelect(task.id);
  };

  return (
    <div
      ref={innerRef}
      style={style}
      className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ${
        isMultiSelected
          ? "bg-blue-100 dark:bg-blue-900/40 ring-1 ring-blue-400 dark:ring-blue-600"
          : isSelected
            ? "bg-blue-50 dark:bg-blue-900/30 ring-1 ring-blue-300 dark:ring-blue-700"
            : "hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
      onClick={handleClick}
    >
      {dragHandleProps && (
        <span
          {...dragHandleProps}
          className="cursor-grab text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 select-none"
        >
          ⠿
        </span>
      )}
      {showCheckbox && (
        <input
          type="checkbox"
          checked={isMultiSelected ?? false}
          onChange={(e) => {
            e.stopPropagation();
            onMultiSelect?.(task.id, { ctrlKey: true, metaKey: false, shiftKey: false });
          }}
          onClick={(e) => e.stopPropagation()}
          className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-500 flex-shrink-0"
        />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 ${
          task.status === "completed"
            ? "bg-green-500 border-green-500"
            : priority
              ? `border-[${priority.color}]`
              : "border-gray-300 dark:border-gray-600"
        }`}
      />
      <span className={task.status === "completed" ? "line-through text-gray-400" : ""}>
        {task.title}
      </span>
      {task.tags.map((tag) => (
        <span
          key={tag.id}
          className="text-xs px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
        >
          {tag.name}
        </span>
      ))}
      {task.dueDate && (
        <span className="text-xs text-gray-500 ml-auto">
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
}
