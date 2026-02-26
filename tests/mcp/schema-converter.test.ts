import { describe, it, expect } from "vitest";
import { z } from "zod";
import { jsonSchemaToZod } from "../../src/mcp/schema-converter.js";

describe("jsonSchemaToZod", () => {
  it("converts a string property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { name: { type: "string", description: "A name" } },
      required: ["name"],
    });
    expect(shape.name).toBeDefined();
    const result = z.object(shape).safeParse({ name: "hello" });
    expect(result.success).toBe(true);
  });

  it("marks required fields as non-optional", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { title: { type: "string" } },
      required: ["title"],
    });
    const missing = z.object(shape).safeParse({});
    expect(missing.success).toBe(false);
  });

  it("marks non-required fields as optional", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { title: { type: "string" } },
    });
    const result = z.object(shape).safeParse({});
    expect(result.success).toBe(true);
  });

  it("converts a number property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { count: { type: "number" } },
      required: ["count"],
    });
    const result = z.object(shape).safeParse({ count: 42 });
    expect(result.success).toBe(true);
    const bad = z.object(shape).safeParse({ count: "not a number" });
    expect(bad.success).toBe(false);
  });

  it("converts an integer property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { amount: { type: "integer" } },
      required: ["amount"],
    });
    const result = z.object(shape).safeParse({ amount: 5 });
    expect(result.success).toBe(true);
    const floatResult = z.object(shape).safeParse({ amount: 5.5 });
    expect(floatResult.success).toBe(false);
  });

  it("converts a boolean property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { active: { type: "boolean" } },
      required: ["active"],
    });
    const result = z.object(shape).safeParse({ active: true });
    expect(result.success).toBe(true);
  });

  it("converts an array of strings property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { tags: { type: "array", items: { type: "string" } } },
      required: ["tags"],
    });
    const result = z.object(shape).safeParse({ tags: ["a", "b"] });
    expect(result.success).toBe(true);
    const bad = z.object(shape).safeParse({ tags: [1, 2] });
    expect(bad.success).toBe(false);
  });

  it("converts a string enum property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { level: { type: "string", enum: ["low", "medium", "high"] } },
      required: ["level"],
    });
    const result = z.object(shape).safeParse({ level: "low" });
    expect(result.success).toBe(true);
    const bad = z.object(shape).safeParse({ level: "extreme" });
    expect(bad.success).toBe(false);
  });

  it("converts a number enum property", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { priority: { type: "number", enum: [1, 2, 3, 4] } },
      required: ["priority"],
    });
    const result = z.object(shape).safeParse({ priority: 2 });
    expect(result.success).toBe(true);
    const bad = z.object(shape).safeParse({ priority: 5 });
    expect(bad.success).toBe(false);
  });

  it("handles empty properties object", () => {
    const shape = jsonSchemaToZod({ type: "object" });
    expect(Object.keys(shape)).toHaveLength(0);
  });

  it("preserves description on fields", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: { name: { type: "string", description: "The user's name" } },
      required: ["name"],
    });
    expect(shape.name.description).toBe("The user's name");
  });

  it("converts a real tool schema (create_task-like)", () => {
    const shape = jsonSchemaToZod({
      type: "object",
      properties: {
        title: { type: "string", description: "Task title" },
        priority: { type: "number", enum: [1, 2, 3, 4] },
        dueDate: { type: "string", description: "ISO 8601" },
        tags: { type: "array", items: { type: "string" } },
        isSomeday: { type: "boolean" },
        estimatedMinutes: { type: "integer" },
      },
      required: ["title"],
    });

    const result = z.object(shape).safeParse({
      title: "Buy milk",
      priority: 2,
      tags: ["groceries"],
    });
    expect(result.success).toBe(true);

    // Optional fields can be omitted
    const minimal = z.object(shape).safeParse({ title: "Hello" });
    expect(minimal.success).toBe(true);
  });
});
