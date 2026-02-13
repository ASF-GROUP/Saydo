import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as schema from "../../src/db/schema.js";
import { createQueries } from "../../src/db/queries.js";
import type { Queries } from "../../src/db/queries.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.resolve(__dirname, "../../src/db/migrations");

describe("Plugin Permissions (DB)", () => {
  let queries: Queries;

  beforeEach(() => {
    const sqlite = new Database(":memory:");
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    const db = drizzle(sqlite, { schema });
    migrate(db, { migrationsFolder });
    queries = createQueries(db);
  });

  it("returns null for unapproved plugins", () => {
    const perms = queries.getPluginPermissions("unknown-plugin");
    expect(perms).toBeNull();
  });

  it("stores and retrieves permissions", () => {
    queries.setPluginPermissions("my-plugin", ["task:read", "task:write"]);

    const perms = queries.getPluginPermissions("my-plugin");
    expect(perms).toEqual(["task:read", "task:write"]);
  });

  it("updates permissions on re-set", () => {
    queries.setPluginPermissions("my-plugin", ["task:read"]);
    queries.setPluginPermissions("my-plugin", ["task:read", "storage"]);

    const perms = queries.getPluginPermissions("my-plugin");
    expect(perms).toEqual(["task:read", "storage"]);
  });

  it("deletes permissions", () => {
    queries.setPluginPermissions("my-plugin", ["task:read"]);
    queries.deletePluginPermissions("my-plugin");

    const perms = queries.getPluginPermissions("my-plugin");
    expect(perms).toBeNull();
  });

  it("isolates permissions between plugins", () => {
    queries.setPluginPermissions("plugin-a", ["task:read"]);
    queries.setPluginPermissions("plugin-b", ["storage", "network"]);

    expect(queries.getPluginPermissions("plugin-a")).toEqual(["task:read"]);
    expect(queries.getPluginPermissions("plugin-b")).toEqual(["storage", "network"]);
  });
});
