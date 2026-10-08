import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
export function openDb(dir: string) {
  mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(join(dir, "rincon.sqlite"));
  db.exec(`
    PRAGMA journal_mode=WAL;
    PRAGMA foreign_keys=ON;
    PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, expires INTEGER NOT NULL, version TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS media (
      id TEXT PRIMARY KEY, kind TEXT NOT NULL, filename TEXT NOT NULL, mime TEXT NOT NULL,
      size INTEGER NOT NULL, title TEXT NOT NULL, date TEXT NOT NULL, album TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]', favorite INTEGER NOT NULL DEFAULT 0,
      artist TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS media_date ON media(date);
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY, type TEXT NOT NULL, title TEXT NOT NULL, body TEXT NOT NULL,
      author TEXT NOT NULL, date TEXT NOT NULL, favorite INTEGER NOT NULL DEFAULT 0, createdAt TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);
  `);
  return db;
}
