// Sqlite layer. Single file at the path in DATABASE_PATH (default
// /data/murdoku.db, mounted on the Fly volume). Schema migrations are
// idempotent CREATE statements run on every startup; the data model is
// append-only in spirit so we never need to ALTER existing columns.

import Database from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const DATABASE_PATH = process.env.DATABASE_PATH || '/data/murdoku.db';

mkdirSync(dirname(DATABASE_PATH), { recursive: true });

export const db = new Database(DATABASE_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.pragma('synchronous = NORMAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id                  INTEGER PRIMARY KEY,
    name                TEXT NOT NULL,
    name_lower          TEXT UNIQUE NOT NULL,
    token_hash          TEXT NOT NULL,
    avatar_kind         TEXT NOT NULL DEFAULT 'procgen',
    avatar_portrait_id  TEXT,
    created_at          INTEGER NOT NULL,
    last_seen_at        INTEGER NOT NULL,
    banned_at           INTEGER
  );
  CREATE INDEX IF NOT EXISTS idx_profiles_last_seen
    ON profiles(last_seen_at);
`);

export function nowMs() {
  return Date.now();
}
