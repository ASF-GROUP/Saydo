import { describe, it, expect } from "vitest";
import { parseQuery } from "../../src/core/query-parser.js";

// Use a fixed reference date for deterministic tests
const REF = new Date("2025-03-15T12:00:00.000Z");

describe("parseQuery", () => {
  describe("priority", () => {
    it('parses "p1"', () => {
      const { filter } = parseQuery("p1", REF);
      expect(filter.priority).toBe(1);
    });

    it('parses "priority 3"', () => {
      const { filter } = parseQuery("priority 3", REF);
      expect(filter.priority).toBe(3);
    });

    it('parses "p2" with other text', () => {
      const { filter } = parseQuery("urgent tasks p2", REF);
      expect(filter.priority).toBe(2);
      expect(filter.search).toBe("urgent tasks");
    });
  });

  describe("status", () => {
    it('parses "completed"', () => {
      const { filter } = parseQuery("completed", REF);
      expect(filter.status).toBe("completed");
    });

    it('parses "done"', () => {
      const { filter } = parseQuery("done", REF);
      expect(filter.status).toBe("completed");
    });

    it('parses "pending"', () => {
      const { filter } = parseQuery("pending", REF);
      expect(filter.status).toBe("pending");
    });

    it('parses "todo"', () => {
      const { filter } = parseQuery("todo", REF);
      expect(filter.status).toBe("pending");
    });

    it('parses "open"', () => {
      const { filter } = parseQuery("open", REF);
      expect(filter.status).toBe("pending");
    });
  });

  describe("tags", () => {
    it('parses "#urgent"', () => {
      const { filter } = parseQuery("#urgent", REF);
      expect(filter.tag).toBe("urgent");
    });

    it('parses "tagged work"', () => {
      const { filter } = parseQuery("tagged work", REF);
      expect(filter.tag).toBe("work");
    });
  });

  describe("due dates", () => {
    it('parses "overdue"', () => {
      const { filter } = parseQuery("overdue", REF);
      expect(filter.dueBefore).toBeDefined();
      // Should be start of the reference day
      expect(new Date(filter.dueBefore!).getTime()).toBeLessThanOrEqual(REF.getTime());
    });

    it('parses "due today"', () => {
      const { filter } = parseQuery("due today", REF);
      expect(filter.dueAfter).toBeDefined();
      expect(filter.dueBefore).toBeDefined();
    });

    it('parses "due tomorrow"', () => {
      const { filter } = parseQuery("due tomorrow", REF);
      expect(filter.dueAfter).toBeDefined();
      expect(filter.dueBefore).toBeDefined();
      const after = new Date(filter.dueAfter!);
      expect(after.getDate()).toBe(16); // March 16
    });

    it('parses "due this week"', () => {
      const { filter } = parseQuery("due this week", REF);
      expect(filter.dueAfter).toBeDefined();
      expect(filter.dueBefore).toBeDefined();
    });
  });

  describe("combined queries", () => {
    it("parses priority + tag", () => {
      const { filter } = parseQuery("p1 #urgent", REF);
      expect(filter.priority).toBe(1);
      expect(filter.tag).toBe("urgent");
    });

    it("parses status + priority + search", () => {
      const { filter } = parseQuery("pending p2 buy groceries", REF);
      expect(filter.status).toBe("pending");
      expect(filter.priority).toBe(2);
      expect(filter.search).toBe("buy groceries");
    });

    it("parses overdue + tag", () => {
      const { filter } = parseQuery("overdue #work", REF);
      expect(filter.dueBefore).toBeDefined();
      expect(filter.tag).toBe("work");
    });
  });

  describe("free text search", () => {
    it("treats unrecognized text as search", () => {
      const { filter } = parseQuery("buy milk", REF);
      expect(filter.search).toBe("buy milk");
    });

    it("returns remaining text", () => {
      const { remainingText } = parseQuery("p1 buy milk", REF);
      expect(remainingText).toBe("buy milk");
    });
  });

  describe("empty and whitespace", () => {
    it("handles empty string", () => {
      const { filter } = parseQuery("", REF);
      expect(filter).toEqual({});
    });

    it("handles whitespace-only", () => {
      const { filter } = parseQuery("   ", REF);
      expect(filter).toEqual({});
    });
  });
});
