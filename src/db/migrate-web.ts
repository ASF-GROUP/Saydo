import m0000 from "./migrations/0000_cool_spencer_smythe.sql?raw";
import m0001 from "./migrations/0001_cool_rictor.sql?raw";
import type { Database } from "sql.js";

const migrations: string[] = [m0000, m0001];

export function runWebMigrations(sqlite: Database): void {
  for (const sql of migrations) {
    for (const stmt of sql.split("--> statement-breakpoint")) {
      const trimmed = stmt.trim();
      if (trimmed) {
        sqlite.run(trimmed);
      }
    }
  }
}
