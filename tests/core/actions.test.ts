import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createCompleteAction,
  createDeleteAction,
  createUpdateAction,
  createBulkCompleteAction,
  createBulkDeleteAction,
  createBulkUpdateAction,
} from "../../src/core/actions.js";
import { makeTask } from "../ui/helpers/mock-api.js";

function createMockActionAPI() {
  return {
    completeTask: vi.fn().mockResolvedValue(undefined),
    deleteTask: vi.fn().mockResolvedValue(undefined),
    updateTask: vi.fn().mockResolvedValue(undefined),
    createTask: vi.fn().mockResolvedValue(undefined),
    completeManyTasks: vi.fn().mockResolvedValue(undefined),
    deleteManyTasks: vi.fn().mockResolvedValue(undefined),
    updateManyTasks: vi.fn().mockResolvedValue([]),
    refreshTasks: vi.fn().mockResolvedValue(undefined),
  };
}

describe("createCompleteAction", () => {
  let api: ReturnType<typeof createMockActionAPI>;

  beforeEach(() => {
    api = createMockActionAPI();
  });

  it("execute calls completeTask", async () => {
    const task = makeTask({ id: "t1", title: "Buy milk" }) as any;
    const action = createCompleteAction(api, task);
    await action.execute();
    expect(api.completeTask).toHaveBeenCalledWith("t1");
  });

  it("undo restores pending status and refreshes", async () => {
    const task = makeTask({ id: "t1" }) as any;
    const action = createCompleteAction(api, task);
    await action.undo();
    expect(api.updateTask).toHaveBeenCalledWith("t1", { status: "pending" });
    expect(api.refreshTasks).toHaveBeenCalled();
  });

  it("has a descriptive description", () => {
    const task = makeTask({ title: "Buy milk" }) as any;
    const action = createCompleteAction(api, task);
    expect(action.description).toBe('Complete "Buy milk"');
  });
});

describe("createDeleteAction", () => {
  let api: ReturnType<typeof createMockActionAPI>;

  beforeEach(() => {
    api = createMockActionAPI();
  });

  it("execute calls deleteTask", async () => {
    const task = makeTask({ id: "t2" }) as any;
    const action = createDeleteAction(api, task);
    await action.execute();
    expect(api.deleteTask).toHaveBeenCalledWith("t2");
  });

  it("undo re-creates the task with original fields", async () => {
    const task = makeTask({
      id: "t2",
      title: "Deleted task",
      priority: 2,
      dueDate: "2026-03-01T00:00:00.000Z",
      tags: [{ id: "tag1", name: "work", color: "#f00" }],
    }) as any;
    const action = createDeleteAction(api, task);
    await action.undo();
    expect(api.createTask).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Deleted task",
        priority: 2,
        dueDate: "2026-03-01T00:00:00.000Z",
        tags: ["work"],
      }),
    );
    expect(api.refreshTasks).toHaveBeenCalled();
  });
});

describe("createUpdateAction", () => {
  let api: ReturnType<typeof createMockActionAPI>;

  beforeEach(() => {
    api = createMockActionAPI();
  });

  it("execute applies new fields", async () => {
    const action = createUpdateAction(api, "t3", { priority: 1 }, { priority: 3 });
    await action.execute();
    expect(api.updateTask).toHaveBeenCalledWith("t3", { priority: 3 });
  });

  it("undo restores old fields", async () => {
    const action = createUpdateAction(api, "t3", { priority: 1 }, { priority: 3 });
    await action.undo();
    expect(api.updateTask).toHaveBeenCalledWith("t3", { priority: 1 });
  });
});

describe("createBulkCompleteAction", () => {
  let api: ReturnType<typeof createMockActionAPI>;

  beforeEach(() => {
    api = createMockActionAPI();
  });

  it("execute calls completeManyTasks with all ids", async () => {
    const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })] as any[];
    const action = createBulkCompleteAction(api, tasks);
    await action.execute();
    expect(api.completeManyTasks).toHaveBeenCalledWith(["t1", "t2"]);
  });

  it("undo restores each task to pending", async () => {
    const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })] as any[];
    const action = createBulkCompleteAction(api, tasks);
    await action.undo();
    expect(api.updateTask).toHaveBeenCalledWith("t1", { status: "pending" });
    expect(api.updateTask).toHaveBeenCalledWith("t2", { status: "pending" });
    expect(api.refreshTasks).toHaveBeenCalled();
  });
});

describe("createBulkDeleteAction", () => {
  let api: ReturnType<typeof createMockActionAPI>;

  beforeEach(() => {
    api = createMockActionAPI();
  });

  it("execute calls deleteManyTasks", async () => {
    const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })] as any[];
    const action = createBulkDeleteAction(api, tasks);
    await action.execute();
    expect(api.deleteManyTasks).toHaveBeenCalledWith(["t1", "t2"]);
  });

  it("undo re-creates all tasks", async () => {
    const tasks = [
      makeTask({ id: "t1", title: "Task A" }),
      makeTask({ id: "t2", title: "Task B" }),
    ] as any[];
    const action = createBulkDeleteAction(api, tasks);
    await action.undo();
    expect(api.createTask).toHaveBeenCalledTimes(2);
    expect(api.refreshTasks).toHaveBeenCalled();
  });
});

describe("createBulkUpdateAction", () => {
  let api: ReturnType<typeof createMockActionAPI>;

  beforeEach(() => {
    api = createMockActionAPI();
  });

  it("execute calls updateManyTasks", async () => {
    const tasks = [makeTask({ id: "t1" }), makeTask({ id: "t2" })] as any[];
    const action = createBulkUpdateAction(api, tasks, { priority: 1 });
    await action.execute();
    expect(api.updateManyTasks).toHaveBeenCalledWith(["t1", "t2"], { priority: 1 });
  });

  it("undo restores each task's original fields", async () => {
    const tasks = [
      makeTask({ id: "t1", priority: 2, title: "A" }),
      makeTask({ id: "t2", priority: 3, title: "B" }),
    ] as any[];
    const action = createBulkUpdateAction(api, tasks, { priority: 1 });
    await action.undo();
    expect(api.updateTask).toHaveBeenCalledWith(
      "t1",
      expect.objectContaining({ priority: 2, title: "A" }),
    );
    expect(api.updateTask).toHaveBeenCalledWith(
      "t2",
      expect.objectContaining({ priority: 3, title: "B" }),
    );
    expect(api.refreshTasks).toHaveBeenCalled();
  });
});
