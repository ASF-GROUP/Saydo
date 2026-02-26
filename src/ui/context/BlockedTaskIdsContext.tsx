import { createContext, useContext } from "react";

export const BlockedTaskIdsContext = createContext<Set<string>>(new Set());

export function useBlockedTaskIds() {
  return useContext(BlockedTaskIdsContext);
}
