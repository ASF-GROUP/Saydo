import { describe, it, expect, beforeEach } from "vitest";
import { createTestServices } from "./helpers.js";
import { TemplateService } from "../../src/core/templates.js";
import type { TaskService } from "../../src/core/tasks.js";
import type { IStorage } from "../../src/storage/interface.js";
import { NotFoundError } from "../../src/core/errors.js";

describe("TemplateService (integration)", () => {
  let storage: IStorage;
  let taskService: TaskService;
  let templateService: TemplateService;

  beforeEach(() => {
    const services = createTestServices();
    storage = services.storage;
    taskService = services.taskService;
    templateService = new TemplateService(storage, taskService);
  });

  describe("create", () => {
    it("creates a template with required fields", async () => {
      const template = await templateService.create({
        name: "Bug Report",
        title: "Fix: {{issue}}",
      });

      expect(template.id).toBeDefined();
      expect(template.name).toBe("Bug Report");
      expect(template.title).toBe("Fix: {{issue}}");
      expect(template.tags).toEqual([]);
      expect(template.priority).toBeNull();
    });

    it("creates a template with all fields", async () => {
      const template = await templateService.create({
        name: "Sprint Task",
        title: "{{task}} for sprint {{sprint}}",
        description: "Part of sprint {{sprint}} deliverables",
        priority: 2,
        tags: ["sprint", "dev"],
        recurrence: "weekly",
      });

      expect(template.name).toBe("Sprint Task");
      expect(template.description).toBe("Part of sprint {{sprint}} deliverables");
      expect(template.priority).toBe(2);
      expect(template.tags).toEqual(["sprint", "dev"]);
      expect(template.recurrence).toBe("weekly");
    });
  });

  describe("list", () => {
    it("lists all templates", async () => {
      await templateService.create({ name: "Template A", title: "Task A" });
      await templateService.create({ name: "Template B", title: "Task B" });

      const templates = await templateService.list();
      expect(templates).toHaveLength(2);
    });

    it("returns empty array when no templates exist", async () => {
      const templates = await templateService.list();
      expect(templates).toEqual([]);
    });
  });

  describe("get", () => {
    it("returns a template by ID", async () => {
      const created = await templateService.create({
        name: "Test",
        title: "Test title",
      });

      const template = await templateService.get(created.id);
      expect(template).not.toBeNull();
      expect(template!.name).toBe("Test");
    });

    it("returns null for missing ID", async () => {
      const template = await templateService.get("nonexistent");
      expect(template).toBeNull();
    });
  });

  describe("update", () => {
    it("updates template fields", async () => {
      const template = await templateService.create({
        name: "Old Name",
        title: "Old Title",
      });

      const updated = await templateService.update(template.id, {
        name: "New Name",
        title: "New Title {{var}}",
        priority: 1,
      });

      expect(updated.name).toBe("New Name");
      expect(updated.title).toBe("New Title {{var}}");
      expect(updated.priority).toBe(1);
    });

    it("throws NotFoundError for missing template", async () => {
      await expect(templateService.update("nonexistent", { name: "Fail" })).rejects.toThrow(
        NotFoundError,
      );
    });
  });

  describe("delete", () => {
    it("deletes a template", async () => {
      const template = await templateService.create({
        name: "Delete Me",
        title: "To be deleted",
      });

      const result = await templateService.delete(template.id);
      expect(result).toBe(true);

      const after = await templateService.get(template.id);
      expect(after).toBeNull();
    });

    it("returns false for missing template", async () => {
      const result = await templateService.delete("nonexistent");
      expect(result).toBe(false);
    });
  });

  describe("instantiate", () => {
    it("creates a task from a template", async () => {
      const template = await templateService.create({
        name: "Basic Template",
        title: "Buy groceries",
        priority: 3,
        tags: ["shopping"],
      });

      const task = await templateService.instantiate(template.id);
      expect(task.title).toBe("Buy groceries");
      expect(task.priority).toBe(3);
      expect(task.tags.map((t) => t.name)).toEqual(["shopping"]);
    });

    it("substitutes {{variables}} in title", async () => {
      const template = await templateService.create({
        name: "Bug Fix",
        title: "Fix: {{issue}}",
      });

      const task = await templateService.instantiate(template.id, {
        issue: "login crash",
      });
      expect(task.title).toBe("Fix: login crash");
    });

    it("substitutes variables in description", async () => {
      const template = await templateService.create({
        name: "Sprint",
        title: "Sprint {{num}} task",
        description: "Assigned to {{team}} for sprint {{num}}",
      });

      const task = await templateService.instantiate(template.id, {
        num: "14",
        team: "Backend",
      });
      expect(task.title).toBe("Sprint 14 task");
      expect(task.description).toBe("Assigned to Backend for sprint 14");
    });

    it("throws NotFoundError for missing template", async () => {
      await expect(templateService.instantiate("nonexistent")).rejects.toThrow(NotFoundError);
    });

    it("leaves unreplaced variables as-is", async () => {
      const template = await templateService.create({
        name: "Partial",
        title: "{{replaced}} and {{unreplaced}}",
      });

      const task = await templateService.instantiate(template.id, {
        replaced: "hello",
      });
      expect(task.title).toBe("hello and {{unreplaced}}");
    });
  });
});
