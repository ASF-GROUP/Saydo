import { useCallback } from "react";
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

function SortableTaskItem({
  task,
  onToggle,
  onSelect,
  isSelected,
  isMultiSelected,
  showCheckbox,
  onMultiSelect,
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
    />
  );
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

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        {emptyMessage ?? "No tasks yet. Add one above!"}
      </div>
    );
  }

  const isMultiSelectActive = selectedTaskIds && selectedTaskIds.size > 0;
  const taskIds = tasks.map((t) => t.id);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              onSelect={onSelect}
              isSelected={selectedTaskId === task.id}
              isMultiSelected={selectedTaskIds?.has(task.id) ?? false}
              showCheckbox={!!isMultiSelectActive || !!onMultiSelect}
              onMultiSelect={onMultiSelect}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
