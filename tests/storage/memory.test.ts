import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "../../src/db/schema.js";
import { SQLiteBackend } from "../../src/storage/sqlite-backend.js";
import type { IStorage, AiMemoryRow } from "../../src/storage/interface.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../src/db/migrations");

function createBackend(): IStorage {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder });
  return new SQLiteBackend(db);
}

const now = new Date().toISOString();

function makeMemory(overrides: Partial<AiMemoryRow> = {}): AiMemoryRow {
  return {
    id: "mem-1",
    content: "Test memory",
    category: "context",
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe("SQLiteBackend — AI Memories", () => {
  let storage: IStorage;

  beforeEach(() => {
    storage = createBackend();
  });

  it("returns empty list when no memories", () => {
    expect(storage.listAiMemories()).toEqual([]);
  });

  it("inserts and lists a memory", () => {
    const memory = makeMemory();
    storage.insertAiMemory(memory);

    const memories = storage.listAiMemories();
    expect(memories).toHaveLength(1);
    expect(memories[0].id).toBe("mem-1");
    expect(memories[0].content).toBe("Test memory");
    expect(memories[0].category).toBe("context");
  });

  it("inserts multiple memories", () => {
    storage.insertAiMemory(makeMemory({ id: "mem-1", content: "First" }));
    storage.insertAiMemory(makeMemory({ id: "mem-2", content: "Second", category: "preference" }));

    const memories = storage.listAiMemories();
    expect(memories).toHaveLength(2);
  });

  it("updates a memory content and category", () => {
    storage.insertAiMemory(makeMemory());
    storage.updateAiMemory("mem-1", "Updated content", "habit");

    const memories = storage.listAiMemories();
    expect(memories).toHaveLength(1);
    expect(memories[0].content).toBe("Updated content");
    expect(memories[0].category).toBe("habit");
    expect(memories[0].updatedAt).not.toBe(now); // updatedAt should change
  });

  it("deletes a memory", () => {
    storage.insertAiMemory(makeMemory());
    const result = storage.deleteAiMemory("mem-1");
    expect(result.changes).toBe(1);

    const memories = storage.listAiMemories();
    expect(memories).toHaveLength(0);
  });

  it("delete returns 0 changes for unknown id", () => {
    const result = storage.deleteAiMemory("nonexistent");
    expect(result.changes).toBe(0);
  });

  it("handles all category values", () => {
    const categories: AiMemoryRow["category"][] = [
      "preference",
      "habit",
      "context",
      "instruction",
      "pattern",
    ];

    for (const cat of categories) {
      storage.insertAiMemory(makeMemory({ id: `mem-${cat}`, category: cat }));
    }

    const memories = storage.listAiMemories();
    expect(memories).toHaveLength(5);
    const storedCategories = memories.map((m) => m.category).sort();
    expect(storedCategories).toEqual([...categories].sort());
  });

  it("update does not throw for unknown id", () => {
    // Should not throw, just be a no-op
    expect(() => storage.updateAiMemory("nonexistent", "content", "context")).not.toThrow();
  });
});
