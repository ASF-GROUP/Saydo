import { useState, useCallback, useMemo } from "react";
import { useTaskContext } from "../context/TaskContext.js";
import { useUndoContext } from "../context/UndoContext.js";
import { useSoundEffect } from "./useSoundEffect.js";
import { api } from "../api/index.js";
import {
  createCompleteAction,
  createDeleteAction,
  createUpdateAction,
} from "../../core/actions.js";
import type { Task, UpdateTaskInput } from "../../core/types.js";

export function useTaskHandlers(
  selectedProjectId: string | null,
  projects?: { id: string; name: string }[],
) {
  const { state, createTask, updateTask, completeTask, deleteTask, refreshTasks } =
    useTaskContext();
  const { undoManager } = useUndoContext();
  const playSound = useSoundEffect();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Adapter: bridges TaskContext methods to the ActionAPI shape expected by action creators.
  // The action creators call through this, getting both the API call AND local state dispatch.
  // On undo, refreshTasks re-syncs state from the server.
  const actionApi = useMemo(
    () => ({
      completeTask: async (id: string) => {
        await completeTask(id);
        return {} as Task;
      },
      deleteTask,
      updateTask: async (id: string, input: UpdateTaskInput) => {
        await updateTask(id, input);
        return {} as Task;
      },
      createTask: async (input: any) => {
        await createTask(input);
        return {} as Task;
      },
      completeManyTasks: async () => {},
      deleteManyTasks: async () => {},
      updateManyTasks: async () => [] as Task[],
      refreshTasks,
    }),
    [completeTask, deleteTask, updateTask, createTask, refreshTasks],
  );

  const handleCreateTask = async (parsed: {
    title: string;
    priority: number | null;
    tags: string[];
    project: string | null;
    dueDate: Date | null;
    dueTime: boolean;
    recurrence?: string | null;
    estimatedMinutes?: number | null;
    deadline?: Date | null;
    isSomeday?: boolean;
    dreadLevel?: number | null;
  }) => {
    if (!parsed.title.trim()) return;
    let projectId = selectedProjectId;
    if (parsed.project && projects) {
      const match = projects.find((p) => p.name.toLowerCase() === parsed.project!.toLowerCase());
      if (match) projectId = match.id;
    }
    await createTask({
      title: parsed.title,
      priority: parsed.priority,
      dueDate: parsed.dueDate?.toISOString() ?? null,
      dueTime: parsed.dueTime,
      tags: parsed.tags,
      projectId,
      ...(parsed.recurrence ? { recurrence: parsed.recurrence } : {}),
      ...(parsed.estimatedMinutes != null ? { estimatedMinutes: parsed.estimatedMinutes } : {}),
      ...(parsed.deadline ? { deadline: parsed.deadline.toISOString() } : {}),
      ...(parsed.isSomeday ? { isSomeday: true } : {}),
      ...(parsed.dreadLevel != null ? { dreadLevel: parsed.dreadLevel } : {}),
    } as any);
    playSound("create");
  };

  const handleToggleTask = async (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) return;
    if (task.status === "completed") {
      // Uncomplete: wrap in update action so it's undoable
      await undoManager.perform(
        createUpdateAction(
          actionApi,
          id,
          { status: "completed" as any, completedAt: task.completedAt } as UpdateTaskInput,
          { status: "pending" as any, completedAt: null } as UpdateTaskInput,
        ),
      );
    } else {
      // Complete: wrap in complete action
      await undoManager.perform(createCompleteAction(actionApi, task as Task));
      playSound("complete");
    }
  };

  const handleSelectTask = (id: string) => {
    setSelectedTaskId(id);
  };

  const handleCloseDetail = () => {
    setSelectedTaskId(null);
  };

  const handleUpdateTask = async (id: string, input: Parameters<typeof updateTask>[1]) => {
    const task = state.tasks.find((t) => t.id === id);
    if (!task) {
      // Fallback: no snapshot available, just update without undo
      await updateTask(id, input);
      return;
    }
    // Snapshot old fields for the keys being changed
    const oldFields: Record<string, unknown> = {};
    for (const key of Object.keys(input)) {
      if (key === "tags") {
        oldFields.tags = task.tags.map((t) => t.name);
      } else {
        oldFields[key] = (task as any)[key];
      }
    }
    await undoManager.perform(
      createUpdateAction(actionApi, id, oldFields as UpdateTaskInput, input),
    );
  };

  const handleDeleteTask = async (id: string) => {
    const task = state.tasks.find((t) => t.id === id);
    if (task) {
      await undoManager.perform(createDeleteAction(actionApi, task as Task));
    } else {
      await deleteTask(id);
    }
    playSound("delete");
    setSelectedTaskId(null);
  };

  const handleUpdateDueDate = useCallback(
    async (taskId: string, dueDate: string | null) => {
      const task = state.tasks.find((t) => t.id === taskId);
      const newFields: UpdateTaskInput = dueDate
        ? { dueDate: new Date(dueDate).toISOString(), dueTime: false }
        : { dueDate: null, dueTime: false };

      if (task) {
        const oldFields: UpdateTaskInput = {
          dueDate: task.dueDate,
          dueTime: task.dueTime,
        };
        await undoManager.perform(createUpdateAction(actionApi, taskId, oldFields, newFields));
      } else {
        await updateTask(taskId, newFields);
      }
    },
    [updateTask, undoManager, actionApi, state.tasks],
  );

  const handleAddSubtask = useCallback(
    async (parentId: string, title: string) => {
      await createTask({
        title,
        priority: null,
        dueDate: null,
        dueTime: false,
        tags: [],
        projectId: selectedProjectId,
        parentId,
      } as any);
    },
    [createTask, selectedProjectId],
  );

  const handleIndent = useCallback(async (id: string) => {
    try {
      await api.indentTask(id);
    } catch {
      // Non-critical
    }
  }, []);

  const handleOutdent = useCallback(async (id: string) => {
    try {
      await api.outdentTask(id);
    } catch {
      // Non-critical
    }
  }, []);

  const handleReorder = useCallback(async (orderedIds: string[]) => {
    try {
      await api.reorderTasks(orderedIds);
    } catch {
      // Non-critical — visual order already reflects the change
    }
  }, []);

  const selectedTask = selectedTaskId ? state.tasks.find((t) => t.id === selectedTaskId) : null;

  return {
    selectedTaskId,
    setSelectedTaskId,
    selectedTask,
    handleCreateTask,
    handleToggleTask,
    handleSelectTask,
    handleCloseDetail,
    handleUpdateTask,
    handleDeleteTask,
    handleUpdateDueDate,
    handleAddSubtask,
    handleIndent,
    handleOutdent,
    handleReorder,
  };
}
