import initSqlJs, { type Database } from "sql.js";
import { drizzle } from "drizzle-orm/sql-js";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import * as schema from "./schema.js";

export async function createWebDb(existingData?: Uint8Array): Promise<{
  db: BaseSQLiteDatabase<"sync", void, typeof schema>;
  sqlite: Database;
}> {
  const SQL = await initSqlJs({
    locateFile: (file: string) => `/sql-wasm/${file}`,
  });
  const sqlite = existingData ? new SQL.Database(existingData) : new SQL.Database();
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA foreign_keys = ON");
  const db = drizzle(sqlite, { schema });
  return { db, sqlite };
}
