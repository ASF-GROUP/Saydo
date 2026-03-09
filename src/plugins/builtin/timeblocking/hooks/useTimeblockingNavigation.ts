import { useCallback } from "react";
import type { ViewMode } from "../utils/timeblocking-utils.js";

export interface UseTimeblockingNavigationParams {
  dayCount: ViewMode;
  setSelectedDate: React.Dispatch<React.SetStateAction<Date>>;
}

export interface UseTimeblockingNavigationReturn {
  goToPrevious: () => void;
  goToNext: () => void;
  goToToday: () => void;
}

export function useTimeblockingNavigation(params: UseTimeblockingNavigationParams): UseTimeblockingNavigationReturn {
  const { dayCount, setSelectedDate } = params;

  const goToPrevious = useCallback(() => {
    setSelectedDate((d) => {
      const prev = new Date(d);
      prev.setDate(prev.getDate() - dayCount);
      return prev;
    });
  }, [dayCount, setSelectedDate]);

  const goToNext = useCallback(() => {
    setSelectedDate((d) => {
      const next = new Date(d);
      next.setDate(next.getDate() + dayCount);
      return next;
    });
  }, [dayCount, setSelectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(new Date());
  }, [setSelectedDate]);

  return { goToPrevious, goToNext, goToToday };
}
