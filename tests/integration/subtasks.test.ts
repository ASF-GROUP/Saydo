import { describe, it, expect, beforeEach } from "vitest";
import { createTestServices } from "./helpers.js";
import type { TaskService } from "../../src/core/tasks.js";

describe("Sub-tasks (integration)", () => {
  let taskService: TaskService;

  beforeEach(() => {
    const services = createTestServices();
    taskService = services.taskService;
  });

  describe("create with parentId", () => {
    it("creates a sub-task with parentId", async () => {
      const parent = await taskService.create({ title: "Parent task" });
      const child = await taskService.create({
        title: "Child task",
        parentId: parent.id,
      });

      expect(child.parentId).toBe(parent.id);
    });

    it("creates a task without parentId (null by default)", async () => {
      const task = await taskService.create({ title: "Top-level task" });
      expect(task.parentId).toBeNull();
    });
  });

  describe("getChildren", () => {
    it("returns direct children of a task", async () => {
      const parent = await taskService.create({ title: "Parent" });
      await taskService.create({ title: "Child 1", parentId: parent.id });
      await taskService.create({ title: "Child 2", parentId: parent.id });
      await taskService.create({ title: "Unrelated" });

      const children = await taskService.getChildren(parent.id);
      expect(children).toHaveLength(2);
      expect(children.map((c) => c.title).sort()).toEqual(["Child 1", "Child 2"]);
    });

    it("returns empty array for task with no children", async () => {
      const task = await taskService.create({ title: "Leaf" });
      const children = await taskService.getChildren(task.id);
      expect(children).toHaveLength(0);
    });
  });

  describe("listTree", () => {
    it("returns nested tree structure", async () => {
      const parent = await taskService.create({ title: "Parent" });
      await taskService.create({ title: "Child 1", parentId: parent.id });
      await taskService.create({ title: "Child 2", parentId: parent.id });
      await taskService.create({ title: "Top-level" });

      const tree = await taskService.listTree();
      // Top-level tasks only
      expect(tree).toHaveLength(2);

      const parentNode = tree.find((t) => t.title === "Parent");
      expect(parentNode).toBeDefined();
      expect(parentNode!.children).toHaveLength(2);
      expect(parentNode!.children!.map((c) => c.title).sort()).toEqual(["Child 1", "Child 2"]);

      const topLevel = tree.find((t) => t.title === "Top-level");
      expect(topLevel).toBeDefined();
      expect(topLevel!.children).toHaveLength(0);
    });

    it("handles deeply nested tasks", async () => {
      const root = await taskService.create({ title: "Root" });
      const mid = await taskService.create({ title: "Mid", parentId: root.id });
      await taskService.create({ title: "Leaf", parentId: mid.id });

      const tree = await taskService.listTree();
      expect(tree).toHaveLength(1);
      expect(tree[0].title).toBe("Root");
      expect(tree[0].children).toHaveLength(1);
      expect(tree[0].children![0].title).toBe("Mid");
      expect(tree[0].children![0].children).toHaveLength(1);
      expect(tree[0].children![0].children![0].title).toBe("Leaf");
    });
  });

  describe("complete (cascade)", () => {
    it("completing a parent also completes its children", async () => {
      const parent = await taskService.create({ title: "Parent" });
      const child1 = await taskService.create({ title: "Child 1", parentId: parent.id });
      const child2 = await taskService.create({ title: "Child 2", parentId: parent.id });

      await taskService.complete(parent.id);

      const updatedChild1 = await taskService.get(child1.id);
      const updatedChild2 = await taskService.get(child2.id);
      expect(updatedChild1!.status).toBe("completed");
      expect(updatedChild2!.status).toBe("completed");
    });

    it("completing a parent cascades to nested grandchildren", async () => {
      const root = await taskService.create({ title: "Root" });
      const mid = await taskService.create({ title: "Mid", parentId: root.id });
      const leaf = await taskService.create({ title: "Leaf", parentId: mid.id });

      await taskService.complete(root.id);

      expect((await taskService.get(mid.id))!.status).toBe("completed");
      expect((await taskService.get(leaf.id))!.status).toBe("completed");
    });

    it("completing a child does not affect parent", async () => {
      const parent = await taskService.create({ title: "Parent" });
      const child = await taskService.create({ title: "Child", parentId: parent.id });

      await taskService.complete(child.id);

      const updatedParent = await taskService.get(parent.id);
      expect(updatedParent!.status).toBe("pending");
    });
  });

  describe("delete (cascade via FK)", () => {
    it("deleting a parent removes children from the database", async () => {
      const parent = await taskService.create({ title: "Parent" });
      const child = await taskService.create({ title: "Child", parentId: parent.id });

      await taskService.delete(parent.id);

      // Child should be cascade-deleted by the FK constraint
      const deletedChild = await taskService.get(child.id);
      expect(deletedChild).toBeNull();
    });
  });

  describe("indent", () => {
    it("makes a task a child of its previous sibling", async () => {
      const t1 = await taskService.create({ title: "Task 1" });
      await taskService.reorder([t1.id]);
      const t2 = await taskService.create({ title: "Task 2" });
      // Give t2 a higher sort order
      await taskService.update(t2.id, {} as any);
      // Force sort orders
      await taskService.reorder([t1.id, t2.id]);

      const indented = await taskService.indent(t2.id);
      expect(indented.parentId).toBe(t1.id);
    });

    it("does nothing when no previous sibling exists", async () => {
      const t1 = await taskService.create({ title: "Task 1" });
      const result = await taskService.indent(t1.id);
      expect(result.parentId).toBeNull();
    });
  });

  describe("outdent", () => {
    it("moves a child to its parent's parent level", async () => {
      const parent = await taskService.create({ title: "Parent" });
      const child = await taskService.create({ title: "Child", parentId: parent.id });

      const outdented = await taskService.outdent(child.id);
      expect(outdented.parentId).toBeNull();
    });

    it("does nothing for top-level tasks", async () => {
      const task = await taskService.create({ title: "Top level" });
      const result = await taskService.outdent(task.id);
      expect(result.parentId).toBeNull();
    });

    it("moves from grandchild to child level", async () => {
      const root = await taskService.create({ title: "Root" });
      const mid = await taskService.create({ title: "Mid", parentId: root.id });
      const leaf = await taskService.create({ title: "Leaf", parentId: mid.id });

      const outdented = await taskService.outdent(leaf.id);
      expect(outdented.parentId).toBe(root.id);
    });
  });

  describe("update parentId", () => {
    it("can move a task to a different parent", async () => {
      const p1 = await taskService.create({ title: "Parent 1" });
      const p2 = await taskService.create({ title: "Parent 2" });
      const child = await taskService.create({ title: "Child", parentId: p1.id });

      const updated = await taskService.update(child.id, { parentId: p2.id } as any);
      expect(updated.parentId).toBe(p2.id);
    });

    it("can move a sub-task to top level", async () => {
      const parent = await taskService.create({ title: "Parent" });
      const child = await taskService.create({ title: "Child", parentId: parent.id });

      const updated = await taskService.update(child.id, { parentId: null } as any);
      expect(updated.parentId).toBeNull();
    });
  });
});
