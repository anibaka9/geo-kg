import { Database } from "bun:sqlite";
import { existsSync } from "node:fs";
import { SCHEMA_VERSION } from "./schema";

export function resolveDatabasePath(): string {
  return process.env.DATABASE_PATH || "./output/licenses.db";
}

export function openDb(path: string): Database {
  if (!existsSync(path)) {
    throw new Error(`Database not found at ${path}. Run: bun run parse`);
  }

  const db = new Database(path, { readonly: true });
  db.exec("PRAGMA query_only = ON;");

  const row = db.query("PRAGMA user_version").get() as { user_version: number };
  if (row.user_version !== SCHEMA_VERSION) {
    throw new Error(
      `Stale database at ${path} (schema version ${row.user_version}, expected ${SCHEMA_VERSION}). Run: bun run parse`,
    );
  }

  return db;
}
