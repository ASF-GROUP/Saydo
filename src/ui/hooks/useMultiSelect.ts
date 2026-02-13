import { useState, useCallback, useRef } from "react";

export function useMultiSelect(orderedIds: string[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const lastClickedId = useRef<string | null>(null);

  const handleMultiSelect = useCallback(
    (id: string, event: { ctrlKey: boolean; metaKey: boolean; shiftKey: boolean }) => {
      setSelectedIds((prev) => {
        const next = new Set(prev);

        if (event.shiftKey && lastClickedId.current) {
          // Range select
          const startIdx = orderedIds.indexOf(lastClickedId.current);
          const endIdx = orderedIds.indexOf(id);
          if (startIdx !== -1 && endIdx !== -1) {
            const [lo, hi] = startIdx < endIdx ? [startIdx, endIdx] : [endIdx, startIdx];
            for (let i = lo; i <= hi; i++) {
              next.add(orderedIds[i]);
            }
          }
        } else if (event.ctrlKey || event.metaKey) {
          // Toggle single
          if (next.has(id)) {
            next.delete(id);
          } else {
            next.add(id);
          }
        } else {
          // Single select (replace)
          next.clear();
          next.add(id);
        }

        lastClickedId.current = id;
        return next;
      });
    },
    [orderedIds],
  );

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
    lastClickedId.current = null;
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(orderedIds));
  }, [orderedIds]);

  return { selectedIds, handleMultiSelect, clearSelection, selectAll };
}
