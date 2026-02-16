import { useState, useRef } from "react";
import { Plus } from "lucide-react";

interface InlineAddSubtaskProps {
  parentId: string;
  depth: number;
  onAdd: (parentId: string, title: string) => void;
}

export function InlineAddSubtask({ parentId, depth, onAdd }: InlineAddSubtaskProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const indentPadding = { paddingLeft: `${depth * 1.5 + 0.75}rem` };

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (trimmed) {
      onAdd(parentId, trimmed);
      setValue("");
    }
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => {
          setEditing(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        style={indentPadding}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-on-surface-muted hover:text-accent transition-colors w-full text-left"
      >
        <Plus size={12} />
        Add sub-task
      </button>
    );
  }

  return (
    <div style={indentPadding} className="flex items-center gap-2 px-3 py-1.5">
      <div className="w-4 h-4 rounded-full border-2 border-on-surface-muted/40 flex-shrink-0" />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSubmit();
          if (e.key === "Escape") {
            setValue("");
            setEditing(false);
          }
        }}
        onBlur={handleSubmit}
        placeholder="Sub-task title..."
        autoFocus
        className="flex-1 text-sm bg-transparent border-none outline-none text-on-surface placeholder-on-surface-muted/50"
      />
    </div>
  );
}
