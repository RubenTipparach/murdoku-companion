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

  -- A shared puzzle. Only exists once the author clicks Share on a
  -- level they authored locally. The full level JSON is stored under
  -- 'payload'; we keep 'name' denormalized for cheap listing. 'code'
  -- is a short shareable token that lives in the URL.
  CREATE TABLE IF NOT EXISTS levels (
    id           INTEGER PRIMARY KEY,
    code         TEXT UNIQUE NOT NULL,
    owner_id     INTEGER NOT NULL REFERENCES profiles(id),
    name         TEXT NOT NULL,
    payload      TEXT NOT NULL,
    plays_count  INTEGER NOT NULL DEFAULT 0,
    created_at   INTEGER NOT NULL,
    updated_at   INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_levels_owner   ON levels(owner_id);
  CREATE INDEX IF NOT EXISTS idx_levels_created ON levels(created_at);

  -- One row per win. Anyone who completes a shared puzzle posts here
  -- once. duration_ms is the on-the-clock solve time, mistakes is the
  -- count of bad placements during play. is_backfill flags rows that
  -- were posted as a "yes I finished this once, but I have no record
  -- of when or with what time" sync, used to retroactively credit
  -- local wins from before sample posting shipped. Backfill rows count
  -- toward completion totals but are excluded from time / mistake
  -- leaderboard sorts so they don't pollute the rankings.
  CREATE TABLE IF NOT EXISTS completions (
    id            INTEGER PRIMARY KEY,
    profile_id    INTEGER NOT NULL REFERENCES profiles(id),
    level_code    TEXT    NOT NULL,
    duration_ms   INTEGER NOT NULL,
    mistakes      INTEGER NOT NULL DEFAULT 0,
    completed_at  INTEGER NOT NULL,
    is_backfill   INTEGER NOT NULL DEFAULT 0
  );
  CREATE INDEX IF NOT EXISTS idx_completions_level
    ON completions(level_code, duration_ms);
  CREATE INDEX IF NOT EXISTS idx_completions_profile
    ON completions(profile_id, completed_at DESC);
`);

// Add the is_backfill column on databases that pre-date it. SQLite
// will throw a duplicate column error on a fresh schema, which we
// swallow so startup stays idempotent.
try {
  db.exec('ALTER TABLE completions ADD COLUMN is_backfill INTEGER NOT NULL DEFAULT 0');
} catch (err) {
  if (!/duplicate column/i.test(String(err && err.message))) throw err;
}

export function nowMs() {
  return Date.now();
}
