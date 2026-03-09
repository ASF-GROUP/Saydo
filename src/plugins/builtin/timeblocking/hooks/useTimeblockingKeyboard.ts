import { useEffect } from "react";
import type { TimeBlock } from "../types.js";
import type { ViewMode } from "../utils/timeblocking-utils.js";

export interface UseTimeblockingKeyboardParams {
  goToPrevious: () => void;
  goToNext: () => void;
  goToToday: () => void;
  createBlockAtNextAvailable: () => Promise<void>;
  deleteSelectedBlock: () => Promise<void>;
  activeBlock: TimeBlock | null;
  setDayCount: React.Dispatch<React.SetStateAction<ViewMode>>;
  setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useTimeblockingKeyboard(params: UseTimeblockingKeyboardParams): void {
  const {
    goToPrevious, goToNext, goToToday,
    createBlockAtNextAvailable, deleteSelectedBlock,
    activeBlock, setDayCount, setSidebarCollapsed, setSelectedBlockId,
  } = params;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "t":
        case "T":
          e.preventDefault();
          goToToday();
          break;
        case "d":
        case "D":
          e.preventDefault();
          setDayCount(1);
          break;
        case "w":
        case "W":
          e.preventDefault();
          setDayCount(7);
          break;
        case "s":
        case "S":
          e.preventDefault();
          setSidebarCollapsed((c) => !c);
          break;
        case "n":
        case "N":
          e.preventDefault();
          createBlockAtNextAvailable();
          break;
        case "f":
        case "F":
          e.preventDefault();
          // Focus on active/selected block — handled by FocusTimer component
          if (activeBlock) {
            setSelectedBlockId(activeBlock.id);
          }
          break;
        case "Delete":
        case "Backspace":
          e.preventDefault();
          deleteSelectedBlock();
          break;
        default:
          if (e.key >= "1" && e.key <= "7") {
            e.preventDefault();
            setDayCount(parseInt(e.key) as ViewMode);
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goToPrevious, goToNext, goToToday, createBlockAtNextAvailable, deleteSelectedBlock, activeBlock, setDayCount, setSidebarCollapsed, setSelectedBlockId]);
}
