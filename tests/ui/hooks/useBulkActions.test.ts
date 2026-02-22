import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useBulkActions } from "../../../src/ui/hooks/useBulkActions.js";

const mockPlaySound = vi.fn();

const mockTaskContext = {
  state: {
    tasks: [
      {
        id: "t1",
        title: "Task 1",
        tags: [{ id: "tag1", name: "work", color: "#f00" }],
      },
      {
        id: "t2",
        title: "Task 2",
        tags: [{ id: "tag2", name: "home", color: "#0f0" }],
      },
    ],
  },
  completeManyTasks: vi.fn().mockResolvedValue([]),
  deleteManyTasks: vi.fn().mockResolvedValue(undefined),
  updateManyTasks: vi.fn().mockResolvedValue([]),
  updateTask: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../../../src/ui/context/TaskContext.js", () => ({
  useTaskContext: () => mockTaskContext,
}));

vi.mock("../../../src/ui/hooks/useSoundEffect.js", () => ({
  useSoundEffect: () => mockPlaySound,
}));

describe("useBulkActions", () => {
  let clearSelection: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    clearSelection = vi.fn();
  });

  it("handleBulkComplete completes all selected and plays sound", async () => {
    const selected = new Set(["t1", "t2"]);
    const { result } = renderHook(() => useBulkActions(selected, clearSelection));

    await act(async () => {
      await result.current.handleBulkComplete();
    });

    expect(mockTaskContext.completeManyTasks).toHaveBeenCalledWith(["t1", "t2"]);
    expect(mockPlaySound).toHaveBeenCalledWith("complete");
    expect(clearSelection).toHaveBeenCalled();
  });

  it("handleBulkDelete deletes all selected and plays sound", async () => {
    const selected = new Set(["t1"]);
    const { result } = renderHook(() => useBulkActions(selected, clearSelection));

    await act(async () => {
      await result.current.handleBulkDelete();
    });

    expect(mockTaskContext.deleteManyTasks).toHaveBeenCalledWith(["t1"]);
    expect(mockPlaySound).toHaveBeenCalledWith("delete");
    expect(clearSelection).toHaveBeenCalled();
  });

  it("handleBulkMoveToProject updates all selected", async () => {
    const selected = new Set(["t1", "t2"]);
    const { result } = renderHook(() => useBulkActions(selected, clearSelection));

    await act(async () => {
      await result.current.handleBulkMoveToProject("p1");
    });

    expect(mockTaskContext.updateManyTasks).toHaveBeenCalledWith(["t1", "t2"], {
      projectId: "p1",
    });
    expect(clearSelection).toHaveBeenCalled();
  });

  it("handleBulkMoveToProject supports null (move to inbox)", async () => {
    const selected = new Set(["t1"]);
    const { result } = renderHook(() => useBulkActions(selected, clearSelection));

    await act(async () => {
      await result.current.handleBulkMoveToProject(null);
    });

    expect(mockTaskContext.updateManyTasks).toHaveBeenCalledWith(["t1"], {
      projectId: null,
    });
  });

  it("handleBulkAddTag appends tag without duplicates", async () => {
    const selected = new Set(["t1", "t2"]);
    const { result } = renderHook(() => useBulkActions(selected, clearSelection));

    await act(async () => {
      await result.current.handleBulkAddTag("urgent");
    });

    // t1 has ["work"], so should get ["work", "urgent"]
    expect(mockTaskContext.updateTask).toHaveBeenCalledWith("t1", {
      tags: ["work", "urgent"],
    });
    // t2 has ["home"], so should get ["home", "urgent"]
    expect(mockTaskContext.updateTask).toHaveBeenCalledWith("t2", {
      tags: ["home", "urgent"],
    });
    expect(clearSelection).toHaveBeenCalled();
  });

  it("handleBulkAddTag skips tasks that already have the tag", async () => {
    const selected = new Set(["t1"]);
    const { result } = renderHook(() => useBulkActions(selected, clearSelection));

    await act(async () => {
      await result.current.handleBulkAddTag("work"); // t1 already has "work"
    });

    expect(mockTaskContext.updateTask).not.toHaveBeenCalled();
    expect(clearSelection).toHaveBeenCalled();
  });
});
