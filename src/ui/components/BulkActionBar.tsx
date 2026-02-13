import { useState } from "react";
import type { Project } from "../../core/types.js";

interface BulkActionBarProps {
  selectedCount: number;
  onCompleteAll: () => void;
  onDeleteAll: () => void;
  onMoveToProject: (projectId: string | null) => void;
  onAddTag: (tag: string) => void;
  onClear: () => void;
  projects: Project[];
}

export function BulkActionBar({
  selectedCount,
  onCompleteAll,
  onDeleteAll,
  onMoveToProject,
  onAddTag,
  onClear,
  projects,
}: BulkActionBarProps) {
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <div className="sticky top-0 z-10 flex items-center gap-2 px-4 py-2 mb-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
      <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
        {selectedCount} selected
      </span>
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={onCompleteAll}
          className="px-3 py-1 text-xs rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50"
        >
          Complete All
        </button>
        <button
          onClick={onDeleteAll}
          className="px-3 py-1 text-xs rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50"
        >
          Delete All
        </button>
        <div className="relative">
          <button
            onClick={() => setShowProjectMenu((v) => !v)}
            className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Move to Project
          </button>
          {showProjectMenu && (
            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
              <button
                onClick={() => {
                  onMoveToProject(null);
                  setShowProjectMenu(false);
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500"
              >
                No Project (Inbox)
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onMoveToProject(p.id);
                    setShowProjectMenu(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>
        {showTagInput ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (tagInput.trim()) {
                onAddTag(tagInput.trim());
                setTagInput("");
                setShowTagInput(false);
              }
            }}
            className="flex items-center gap-1"
          >
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Tag name"
              autoFocus
              className="w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
              onBlur={() => {
                if (!tagInput) setShowTagInput(false);
              }}
            />
          </form>
        ) : (
          <button
            onClick={() => setShowTagInput(true)}
            className="px-3 py-1 text-xs rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            Add Tag
          </button>
        )}
        <button
          onClick={onClear}
          className="px-3 py-1 text-xs rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
