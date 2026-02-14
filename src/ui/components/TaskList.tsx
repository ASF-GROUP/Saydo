import React, { useCallback, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ClipboardList } from "lucide-react";
import type { Task } from "../../core/types.js";
import { TaskItem } from "./TaskItem.js";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  selectedTaskId: string | null;
  emptyMessage?: string;
  selectedTaskIds?: Set<string>;
  onMultiSelect?: (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  onReorder?: (orderedIds: string[]) => void;
}

const SortableTaskItem = React.memo(function SortableTaskItem({
  task,
  onToggle,
  onSelect,
  isSelected,
  isMultiSelected,
  showCheckbox,
  onMultiSelect,
  depth,
  childCount,
  expanded,
  onToggleExpand,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
  isSelected: boolean;
  isMultiSelected: boolean;
  showCheckbox: boolean;
  onMultiSelect?: (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  depth?: number;
  childCount?: number;
  expanded?: boolean;
  onToggleExpand?: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TaskItem
      task={task}
      onToggle={onToggle}
      onSelect={onSelect}
      isSelected={isSelected}
      isMultiSelected={isMultiSelected}
      showCheckbox={showCheckbox}
      onMultiSelect={onMultiSelect}
      dragHandleProps={{ ...attributes, ...listeners }}
      style={style}
      innerRef={setNodeRef}
      depth={depth}
      childCount={childCount}
      expanded={expanded}
      onToggleExpand={onToggleExpand}
    />
  );
});

/** Build a parent→children map and count from a flat task list. */
function buildChildMap(tasks: Task[]): Map<string, Task[]> {
  const map = new Map<string, Task[]>();
  for (const t of tasks) {
    if (t.parentId) {
      if (!map.has(t.parentId)) map.set(t.parentId, []);
      map.get(t.parentId)!.push(t);
    }
  }
  return map;
}

export function TaskList({
  tasks,
  onToggle,
  onSelect,
  selectedTaskId,
  emptyMessage,
  selectedTaskIds,
  onMultiSelect,
  onReorder,
}: TaskListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id || !onReorder) return;

      const oldIndex = tasks.findIndex((t) => t.id === active.id);
      const newIndex = tasks.findIndex((t) => t.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...tasks];
      const [moved] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, moved);
      onReorder(reordered.map((t) => t.id));
    },
    [tasks, onReorder],
  );

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  if (tasks.length === 0) {
    return (
      <div
        role="status"
        className="flex flex-col items-center justify-center py-12 text-on-surface-muted"
      >
        <ClipboardList size={40} strokeWidth={1.25} className="mb-3 opacity-50" />
        <p className="text-sm">{emptyMessage ?? "No tasks yet. Add one above!"}</p>
      </div>
    );
  }

  // Build tree structure from flat list
  const childMap = buildChildMap(tasks);
  const topLevel = tasks.filter((t) => !t.parentId);

  // Flatten visible tree for DnD ordering
  function flattenVisible(items: Task[], depth: number): Array<{ task: Task; depth: number }> {
    const result: Array<{ task: Task; depth: number }> = [];
    for (const item of items) {
      result.push({ task: item, depth });
      const children = childMap.get(item.id);
      if (children && expandedIds.has(item.id)) {
        result.push(...flattenVisible(children, depth + 1));
      }
    }
    return result;
  }

  const visibleTasks = flattenVisible(topLevel, 0);
  const isMultiSelectActive = selectedTaskIds && selectedTaskIds.size > 0;
  const taskIds = visibleTasks.map((v) => v.task.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div role="list" aria-label="Tasks" className="space-y-0.5">
          {visibleTasks.map(({ task, depth }) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onSelect={onSelect}
              isSelected={selectedTaskId === task.id}
              isMultiSelected={selectedTaskIds?.has(task.id) ?? false}
              showCheckbox={!!isMultiSelectActive || !!onMultiSelect}
              onMultiSelect={onMultiSelect}
              depth={depth}
              childCount={childMap.get(task.id)?.length ?? 0}
              expanded={expandedIds.has(task.id)}
              onToggleExpand={handleToggleExpand}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
