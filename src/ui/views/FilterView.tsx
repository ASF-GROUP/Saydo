import { useState, useEffect, useMemo } from "react";
import { Filter } from "lucide-react";
import { TaskList } from "../components/TaskList.js";
import { parseQuery } from "../../core/query-parser.js";
import { filterTasks } from "../../core/filters.js";
import { api } from "../api/index.js";
import type { Task } from "../../core/types.js";

interface SavedFilter {
  id: string;
  name: string;
  query: string;
  color?: string;
}

interface FilterViewProps {
  filterId: string;
  tasks: Task[];
  onToggleTask: (id: string) => void;
  onSelectTask: (id: string) => void;
  selectedTaskId: string | null;
  selectedTaskIds?: Set<string>;
  onMultiSelect?: (
    id: string,
    event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean },
  ) => void;
  onReorder?: (orderedIds: string[]) => void;
  onAddSubtask?: (parentId: string, title: string) => void;
  onUpdateDueDate?: (taskId: string, dueDate: string | null) => void;
  onContextMenu?: (taskId: string, position: { x: number; y: number }) => void;
}

const SAVED_FILTERS_KEY = "saved_filters";

export function FilterView({
  filterId,
  tasks,
  onToggleTask,
  onSelectTask,
  selectedTaskId,
  selectedTaskIds,
  onMultiSelect,
  onReorder,
  onAddSubtask,
  onUpdateDueDate,
  onContextMenu,
}: FilterViewProps) {
  const [savedFilter, setSavedFilter] = useState<SavedFilter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getAppSetting(SAVED_FILTERS_KEY)
      .then((val) => {
        if (val) {
          try {
            const filters: SavedFilter[] = JSON.parse(val);
            const found = filters.find((f) => f.id === filterId);
            setSavedFilter(found ?? null);
          } catch {
            setSavedFilter(null);
          }
        } else {
          setSavedFilter(null);
        }
      })
      .catch(() => setSavedFilter(null))
      .finally(() => setLoading(false));
  }, [filterId]);

  const filteredTasks = useMemo(() => {
    if (!savedFilter) return [];
    const parsed = parseQuery(savedFilter.query);
    return filterTasks(tasks, parsed.filter);
  }, [tasks, savedFilter]);

  if (loading) {
    return <p className="text-on-surface-muted text-sm p-4">Loading filter...</p>;
  }

  if (!savedFilter) {
    return <p className="text-on-surface-muted text-sm p-4">Filter not found.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
          <Filter size={16} className="text-accent" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-on-surface">{savedFilter.name}</h1>
          <p className="text-xs text-on-surface-muted">{savedFilter.query}</p>
        </div>
        <span className="text-sm text-on-surface-muted ml-auto">
          {filteredTasks.length} {filteredTasks.length === 1 ? "task" : "tasks"}
        </span>
      </div>

      <TaskList
        tasks={filteredTasks}
        onToggle={onToggleTask}
        onSelect={onSelectTask}
        selectedTaskId={selectedTaskId}
        emptyMessage="No tasks match this filter."
        selectedTaskIds={selectedTaskIds}
        onMultiSelect={onMultiSelect}
        onReorder={onReorder}
        onAddSubtask={onAddSubtask}
        onUpdateDueDate={onUpdateDueDate}
        onContextMenu={onContextMenu}
      />
    </div>
  );
}
