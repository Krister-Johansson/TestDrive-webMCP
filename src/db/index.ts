import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { drizzle } from "drizzle-orm/node-sqlite";
import { migrate } from "drizzle-orm/node-sqlite/migrator";

const migrationsFolder = path.join(process.cwd(), "drizzle");

export function createDb(source: string) {
  if (source !== ":memory:") {
    fs.mkdirSync(path.dirname(source), { recursive: true });
  }
  const client = new DatabaseSync(source);
  if (source !== ":memory:") {
    client.exec("PRAGMA journal_mode = WAL;");
  }
  const db = drizzle({ client });
  // node:sqlite turns foreign keys on by default. Migrations may rebuild tables, and a
  // DROP TABLE with foreign keys on cascades into child rows, so switch them off first.
  client.exec("PRAGMA foreign_keys = OFF;");
  migrate(db, { migrationsFolder });
  client.exec("PRAGMA foreign_keys = ON;");
  return db;
}

export function createTestDb() {
  return createDb(":memory:");
}

export type Db = ReturnType<typeof createDb>;

export function defaultDbFile() {
  return process.env.DB_FILE ?? path.join(process.cwd(), "data", "testdrive.db");
}

declare global {
  var __testdriveDb: Db | undefined;
}

export function getDb(): Db {
  if (!globalThis.__testdriveDb) {
    globalThis.__testdriveDb = createDb(defaultDbFile());
  }
  return globalThis.__testdriveDb;
}
