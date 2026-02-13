import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { UndoManager } from "../../core/undo.js";

interface ToastInfo {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface UndoContextValue {
  undoManager: UndoManager;
  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
  toast: ToastInfo | null;
  dismissToast: () => void;
}

const UndoContext = createContext<UndoContextValue | null>(null);

export function UndoProvider({ children }: { children: ReactNode }) {
  const [undoManager] = useState(() => new UndoManager());
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [toast, setToast] = useState<ToastInfo | null>(null);

  // Subscribe to undo manager changes
  useEffect(() => {
    return undoManager.subscribe(() => {
      setCanUndo(undoManager.canUndo());
      setCanRedo(undoManager.canRedo());
    });
  }, [undoManager]);

  const dismissToast = useCallback(() => setToast(null), []);

  const undo = useCallback(async () => {
    const action = await undoManager.undo();
    if (action) {
      setToast({
        message: `Undone: ${action.description}`,
        actionLabel: "Redo",
        onAction: async () => {
          await undoManager.redo();
          setToast(null);
        },
      });
    }
  }, [undoManager]);

  const redo = useCallback(async () => {
    const action = await undoManager.redo();
    if (action) {
      setToast({
        message: `Redone: ${action.description}`,
      });
    }
  }, [undoManager]);

  const value = useMemo(
    () => ({ undoManager, undo, redo, canUndo, canRedo, toast, dismissToast }),
    [undoManager, undo, redo, canUndo, canRedo, toast, dismissToast],
  );

  return <UndoContext.Provider value={value}>{children}</UndoContext.Provider>;
}

export function useUndoContext(): UndoContextValue {
  const ctx = useContext(UndoContext);
  if (!ctx) throw new Error("useUndoContext must be used within UndoProvider");
  return ctx;
}
