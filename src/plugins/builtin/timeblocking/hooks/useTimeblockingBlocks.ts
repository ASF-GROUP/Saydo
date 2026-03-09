import { useCallback } from "react";
import type { TimeBlock, TimeSlot } from "../types.js";
import type { TimeBlockStore } from "../store.js";
import type TimeblockingPlugin from "../index.js";
import { isOverlapping } from "../slot-helpers.js";
import { formatDateStr, timeToMinutes, minutesToTime, snapToGrid } from "../components/TimelineColumn.js";
import { SIDEBAR_MIN_WIDTH, SIDEBAR_MAX_WIDTH } from "../utils/timeblocking-utils.js";

export interface UseTimeblockingBlocksParams {
  store: TimeBlockStore;
  plugin: TimeblockingPlugin;
  blocks: TimeBlock[];
  slotsState: TimeSlot[];
  selectedDate: Date;
  selectedBlockId: string | null;
  editingBlockId: string | null;
  editingTitle: string;
  sidebarWidth: number;
  workDayStart: string;
  workDayEnd: string;
  gridInterval: number;
  defaultDuration: number;
  refreshData: () => void;
  setEditingBlockId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingTitle: React.Dispatch<React.SetStateAction<string>>;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
  setSettingsVersion: React.Dispatch<React.SetStateAction<number>>;
  setSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
}

export interface UseTimeblockingBlocksReturn {
  createBlockAtNextAvailable: () => Promise<void>;
  deleteSelectedBlock: () => Promise<void>;
  handleBlockCreate: (date: string, startTime: string, endTime: string) => Promise<void>;
  handleBlockMove: (blockId: string, newDate: string, newStartTime: string) => Promise<void>;
  handleBlockResize: (blockId: string, newStartTime: string, newEndTime: string) => Promise<void>;
  handleBlockClick: (blockId: string) => void;
  handleSlotClick: (slotId: string) => void;
  handleSlotCreate: (date: string, startTime: string, endTime: string) => Promise<void>;
  handleTaskToggle: (taskId: string) => Promise<void>;
  handleTaskClick: (taskId: string) => void;
  handleSlotResize: (slotId: string, edge: "top" | "bottom") => Promise<void>;
  handleEditingConfirm: () => Promise<void>;
  handleEditingCancel: () => Promise<void>;
  handleDuplicateBlock: (blockId: string) => Promise<void>;
  handleToggleLock: (blockId: string) => Promise<void>;
  handleChangeColor: (blockId: string, color: string) => Promise<void>;
  handleClearSlotTasks: (slotId: string) => Promise<void>;
  handleDeleteSlot: (slotId: string) => Promise<void>;
  handleSettingChange: (key: string, value: string) => void;
  handleFocusStatusUpdate: (status: string) => void;
  handleDividerPointerDown: (e: React.PointerEvent) => void;
}

export function useTimeblockingBlocks(params: UseTimeblockingBlocksParams): UseTimeblockingBlocksReturn {
  const {
    store, plugin, blocks, slotsState, selectedDate, selectedBlockId,
    editingBlockId, editingTitle, sidebarWidth,
    workDayStart, workDayEnd, gridInterval, defaultDuration,
    refreshData, setEditingBlockId, setEditingTitle, setSelectedBlockId,
    setSettingsVersion, setSidebarWidth,
  } = params;

  // Create block at next available time
  const createBlockAtNextAvailable = useCallback(async () => {
    const todayStr = formatDateStr(selectedDate);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMin = timeToMinutes(workDayStart);
    const endMin = timeToMinutes(workDayEnd);

    // Find next available slot
    const dayBlocks = store.listBlocks(todayStr);
    let candidateStart = Math.max(snapToGrid(nowMinutes, gridInterval), startMin);

    // Check for overlaps and find a free slot
    for (let attempt = 0; attempt < 100; attempt++) {
      const candidateEnd = Math.min(candidateStart + defaultDuration, endMin);
      if (candidateEnd <= candidateStart || candidateStart >= endMin) break;

      const hasOverlap = dayBlocks.some((b) =>
        isOverlapping(
          minutesToTime(candidateStart),
          minutesToTime(candidateEnd),
          b.startTime,
          b.endTime,
        ),
      );

      if (!hasOverlap) {
        const block = await store.createBlock({
          title: "New Block",
          date: todayStr,
          startTime: minutesToTime(candidateStart),
          endTime: minutesToTime(candidateEnd),
          locked: false,
        });
        refreshData();
        setEditingBlockId(block.id);
        setEditingTitle("New Block");
        return;
      }

      candidateStart += gridInterval;
    }
  }, [selectedDate, workDayStart, workDayEnd, gridInterval, defaultDuration, store, refreshData, setEditingBlockId, setEditingTitle]);

  // Delete selected block
  const deleteSelectedBlock = useCallback(async () => {
    if (!selectedBlockId) return;
    try {
      await store.deleteBlock(selectedBlockId);
      setSelectedBlockId(null);
      refreshData();
    } catch {
      // Block might not exist
    }
  }, [selectedBlockId, store, refreshData, setSelectedBlockId]);

  // Block operations
  const handleBlockCreate = useCallback(
    async (_date: string, startTime: string, endTime: string) => {
      const block = await store.createBlock({
        title: "New Block",
        date: _date,
        startTime,
        endTime,
        locked: false,
      });
      refreshData();
      setEditingBlockId(block.id);
      setEditingTitle("New Block");
    },
    [store, refreshData, setEditingBlockId, setEditingTitle],
  );

  const handleBlockMove = useCallback(
    async (blockId: string, newDate: string, newStartTime: string) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
      const newEndTime = minutesToTime(timeToMinutes(newStartTime) + duration);
      await store.updateBlock(blockId, {
        date: newDate,
        startTime: newStartTime,
        endTime: newEndTime,
      });
      refreshData();
    },
    [store, blocks, refreshData],
  );

  const handleBlockResize = useCallback(
    async (blockId: string, newStartTime: string, newEndTime: string) => {
      await store.updateBlock(blockId, {
        startTime: newStartTime,
        endTime: newEndTime,
      });
      refreshData();
    },
    [store, refreshData],
  );

  const handleBlockClick = useCallback((blockId: string) => {
    setSelectedBlockId(blockId);
  }, [setSelectedBlockId]);

  const handleSlotClick = useCallback((_slotId: string) => {
    // Future: open slot detail panel
  }, []);

  const handleSlotCreate = useCallback(
    async (date: string, startTime: string, endTime: string) => {
      await store.createSlot({
        title: "Focus Block",
        date,
        startTime,
        endTime,
        taskIds: [],
      });
      refreshData();
    },
    [store, refreshData],
  );

  const handleTaskToggle = useCallback(
    async (_taskId: string) => {
      // Task toggle requires task:write + update API — future enhancement
    },
    [],
  );

  const handleTaskClick = useCallback((taskId: string) => {
    // Dispatch custom event for App.tsx to open the task detail panel
    window.dispatchEvent(new CustomEvent("saydo:open-task-detail", { detail: { taskId } }));
  }, []);

  const handleSlotResize = useCallback(
    async (slotId: string, _edge: "top" | "bottom") => {
      void slotId;
    },
    [],
  );

  // Inline editing handlers
  const handleEditingConfirm = useCallback(async () => {
    if (!editingBlockId) return;
    const trimmed = editingTitle.trim();
    if (trimmed) {
      await store.updateBlock(editingBlockId, { title: trimmed });
    } else {
      await store.deleteBlock(editingBlockId);
    }
    setEditingBlockId(null);
    setEditingTitle("");
    refreshData();
  }, [editingBlockId, editingTitle, store, refreshData, setEditingBlockId, setEditingTitle]);

  const handleEditingCancel = useCallback(async () => {
    if (!editingBlockId) return;
    await store.deleteBlock(editingBlockId);
    setEditingBlockId(null);
    setEditingTitle("");
    refreshData();
  }, [editingBlockId, store, refreshData, setEditingBlockId, setEditingTitle]);

  const handleDuplicateBlock = useCallback(
    async (blockId: string) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      const duration = timeToMinutes(block.endTime) - timeToMinutes(block.startTime);
      const newStart = block.endTime;
      const newEnd = minutesToTime(timeToMinutes(newStart) + duration);
      await store.createBlock({
        title: block.title,
        date: block.date,
        startTime: newStart,
        endTime: newEnd,
        color: block.color,
        locked: false,
        taskId: block.taskId,
      });
      refreshData();
    },
    [blocks, store, refreshData],
  );

  const handleToggleLock = useCallback(
    async (blockId: string) => {
      const block = blocks.find((b) => b.id === blockId);
      if (!block) return;
      await store.updateBlock(blockId, { locked: !block.locked });
      refreshData();
    },
    [blocks, store, refreshData],
  );

  const handleChangeColor = useCallback(
    async (blockId: string, color: string) => {
      await store.updateBlock(blockId, { color });
      refreshData();
    },
    [store, refreshData],
  );

  const handleClearSlotTasks = useCallback(
    async (slotId: string) => {
      const slot = slotsState.find((s) => s.id === slotId);
      if (!slot) return;
      await store.updateSlot(slotId, { taskIds: [] });
      refreshData();
    },
    [slotsState, store, refreshData],
  );

  const handleDeleteSlot = useCallback(
    async (slotId: string) => {
      await store.deleteSlot(slotId);
      refreshData();
    },
    [store, refreshData],
  );

  // Settings change handler
  const handleSettingChange = useCallback(
    (key: string, value: string) => {
      plugin.settings.set(key, value);
      setSettingsVersion((v) => v + 1);
    },
    [plugin.settings, setSettingsVersion],
  );

  // Focus timer status bar update
  const handleFocusStatusUpdate = useCallback(
    (_status: string) => {
      // Status bar integration — future enhancement
    },
    [],
  );

  // Sidebar resize via divider drag
  const handleDividerPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      const startX = e.clientX;
      const startWidth = sidebarWidth;

      const onPointerMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(
          SIDEBAR_MIN_WIDTH,
          Math.min(SIDEBAR_MAX_WIDTH, startWidth + delta),
        );
        setSidebarWidth(newWidth);
      };

      const onPointerUp = () => {
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
      };

      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    },
    [sidebarWidth, setSidebarWidth],
  );

  return {
    createBlockAtNextAvailable,
    deleteSelectedBlock,
    handleBlockCreate,
    handleBlockMove,
    handleBlockResize,
    handleBlockClick,
    handleSlotClick,
    handleSlotCreate,
    handleTaskToggle,
    handleTaskClick,
    handleSlotResize,
    handleEditingConfirm,
    handleEditingCancel,
    handleDuplicateBlock,
    handleToggleLock,
    handleChangeColor,
    handleClearSlotTasks,
    handleDeleteSlot,
    handleSettingChange,
    handleFocusStatusUpdate,
    handleDividerPointerDown,
  };
}
