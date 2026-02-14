import React from "react";
import { Calendar, ChevronDown, ChevronRight, GripVertical, Repeat } from "lucide-react";
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
  depth?: number;
  childCount?: number;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
}

const PRIORITY_BORDER: Record<number, string> = {
  1: "border-l-priority-1",
  2: "border-l-priority-2",
  3: "border-l-priority-3",
  4: "border-l-priority-4",
};

export const TaskItem = React.memo(function TaskItem({
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
  depth = 0,
  childCount = 0,
  expanded,
  onToggleExpand,
}: TaskItemProps) {
  const priority = task.priority ? getPriority(task.priority) : null;
  const isOverdue =
    task.dueDate && task.status === "pending" && new Date(task.dueDate) < new Date();

  const handleClick = (e: React.MouseEvent) => {
    if (onMultiSelect && (e.ctrlKey || e.metaKey || e.shiftKey)) {
      e.preventDefault();
      onMultiSelect(task.id, { ctrlKey: e.ctrlKey, metaKey: e.metaKey, shiftKey: e.shiftKey });
      return;
    }
    onSelect(task.id);
  };

  const indentPadding = depth > 0 ? { paddingLeft: `${depth * 1.5 + 0.75}rem` } : undefined;

  return (
    <div
      ref={innerRef}
      style={{ ...style, ...indentPadding }}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}${depth > 0 ? ` (sub-task, level ${depth})` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(task.id);
        }
      }}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg border-l-3 cursor-pointer transition-colors ${
        task.priority
          ? (PRIORITY_BORDER[task.priority] ?? "border-l-transparent")
          : "border-l-transparent"
      } ${
        isMultiSelected
          ? "bg-accent/10 ring-1 ring-accent"
          : isSelected
            ? "bg-accent/5 ring-1 ring-accent/50"
            : "hover:bg-surface-secondary"
      }`}
      onClick={handleClick}
    >
      {childCount > 0 && onToggleExpand && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand(task.id);
          }}
          aria-label={expanded ? "Collapse sub-tasks" : `Expand ${childCount} sub-tasks`}
          className="text-on-surface-muted hover:text-on-surface-secondary flex-shrink-0 -ml-1"
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      )}
      {dragHandleProps && (
        <span
          {...dragHandleProps}
          role="img"
          aria-label="Drag to reorder"
          className="cursor-grab text-on-surface-muted hover:text-on-surface-secondary select-none opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <GripVertical size={16} />
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
          className="w-4 h-4 rounded border-border text-accent flex-shrink-0"
        />
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        aria-label={
          task.status === "completed"
            ? "Mark task incomplete"
            : `Complete task${priority ? ` (${priority.label})` : ""}`
        }
        className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-colors ${
          task.status === "completed"
            ? "bg-success border-success"
            : priority
              ? `border-priority-${task.priority}`
              : "border-on-surface-muted"
        }`}
      />
      {priority && <span className="sr-only">{priority.label}</span>}
      <span
        className={`flex-1 text-sm ${
          task.status === "completed" ? "line-through text-on-surface-muted" : "text-on-surface"
        }`}
      >
        {task.title}
      </span>
      {task.recurrence && <Repeat size={14} className="text-on-surface-muted flex-shrink-0" />}
      {task.tags.map((tag) => (
        <span
          key={tag.id}
          className="text-xs px-1.5 py-0.5 rounded-md bg-surface-tertiary text-on-surface-secondary"
        >
          {tag.name}
        </span>
      ))}
      {childCount > 0 && !expanded && (
        <span className="text-xs px-1.5 py-0.5 rounded-md bg-accent/10 text-accent font-medium flex-shrink-0">
          {childCount}
        </span>
      )}
      {task.dueDate && (
        <span
          className={`text-xs flex items-center gap-1 ml-auto flex-shrink-0 ${
            isOverdue ? "text-error font-medium" : "text-on-surface-muted"
          }`}
        >
          <Calendar size={12} />
          {new Date(task.dueDate).toLocaleDateString()}
        </span>
      )}
    </div>
  );
});
