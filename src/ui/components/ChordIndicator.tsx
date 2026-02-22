import { useSyncExternalStore } from "react";
import { shortcutManager } from "../shortcutManagerInstance.js";

function subscribeToPendingChord(onStoreChange: () => void) {
  return shortcutManager.onChordChange(() => onStoreChange());
}

function getPendingChordSnapshot() {
  return shortcutManager.getPendingChord();
}

/**
 * Small floating pill that displays the pending chord key.
 * Only visible while the user is mid-chord (e.g. pressed "g", waiting for the second key).
 */
export function ChordIndicator() {
  const pending = useSyncExternalStore(subscribeToPendingChord, getPendingChordSnapshot);

  if (!pending) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 px-3 py-1.5 bg-surface border border-border rounded-full shadow-lg text-sm font-medium text-on-surface animate-fade-in">
      <kbd className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 bg-surface-hover border border-border rounded text-xs font-mono">
        {pending.toUpperCase()}
      </kbd>
      <span className="text-muted text-xs">then ...</span>
    </div>
  );
}
