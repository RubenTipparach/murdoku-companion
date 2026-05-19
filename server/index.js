// Murdoku companion API. Phase 12 ships profile endpoints only.
// Subsequent phases add level sharing, completions, sessions, admin.

import express from 'express';
import cors from 'cors';
import { createHash, randomBytes } from 'node:crypto';
import { db, nowMs } from './db.js';
import { validateLevel } from './validator.js';

const PORT = Number(process.env.PORT) || 8080;

// ----- Config / constants -----

const RESERVED_NAMES = new Set(['admin', 'system', 'anonymous', 'guest', 'murdoku']);
const PROFILE_NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // base64url, 32 bytes => 43 chars w/o padding

// Tokens are 32 random bytes generated client-side. We store only the
// hash so a sqlite leak cannot be replayed as a bearer credential.
// No salt: with a 2^256 search space there's nothing to harden against.
function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function isValidName(name) {
  return typeof name === 'string'
    && PROFILE_NAME_RE.test(name)
    && !RESERVED_NAMES.has(name.toLowerCase());
}

function isValidToken(token) {
  return typeof token === 'string' && TOKEN_RE.test(token);
}

// ----- App -----

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.use(cors({
  origin: [
    'https://rubentipparach.github.io',
    /^http:\/\/localhost(:\d+)?$/,
    /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  ],
  credentials: false,
  maxAge: 86400,
}));

// Trust the Fly edge proxy so req.ip reflects the client.
app.set('trust proxy', true);

// ----- Rate limit (in-memory, per process) -----

const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateBuckets = new Map(); // ip -> { profileCreate: timestamps[] }

function rateLimit(ip, key, max) {
  const now = Date.now();
  let b = rateBuckets.get(ip);
  if (!b) { b = {}; rateBuckets.set(ip, b); }
  const arr = (b[key] = (b[key] || []).filter((t) => now - t < RATE_WINDOW_MS));
  if (arr.length >= max) return false;
  arr.push(now);
  return true;
}

// Sweep every 10 minutes so the map doesn't grow unbounded.
setInterval(() => {
  const cutoff = Date.now() - RATE_WINDOW_MS;
  for (const [ip, b] of rateBuckets) {
    let alive = false;
    for (const k of Object.keys(b)) {
      b[k] = b[k].filter((t) => t > cutoff);
      if (b[k].length) alive = true;
    }
    if (!alive) rateBuckets.delete(ip);
  }
}, 10 * 60 * 1000).unref();

// ----- Routes -----

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, ts: nowMs() });
});

// Create or re-claim a profile. The client generates the token and
// retains it; the server stores sha256(token). If the name is taken
// under a different token, return 409 so the client can prompt the
// user to rename. If the same name + token comes back, it's an
// idempotent re-claim (returns 200).
app.post('/profiles', (req, res) => {
  const { name, token } = req.body || {};
  if (!isValidName(name)) {
    return res.status(400).json({ error: 'invalid_name' });
  }
  if (!isValidToken(token)) {
    return res.status(400).json({ error: 'invalid_token' });
  }
  if (!rateLimit(req.ip, 'profileCreate', 3)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  const nameLower = name.toLowerCase();
  const tokenHash = hashToken(token);
  const now = nowMs();

  const existing = db
    .prepare('SELECT id, token_hash FROM profiles WHERE name_lower = ?')
    .get(nameLower);

  if (existing) {
    if (existing.token_hash !== tokenHash) {
      return res.status(409).json({ error: 'name_taken' });
    }
    db.prepare('UPDATE profiles SET last_seen_at = ? WHERE id = ?').run(now, existing.id);
    return res.status(200).json({ ok: true, name, claimed: true });
  }

  const info = db
    .prepare(
      `INSERT INTO profiles (name, name_lower, token_hash, created_at, last_seen_at)
       VALUES (?, ?, ?, ?, ?)`
    )
    .run(name, nameLower, tokenHash, now, now);

  return res.status(201).json({ ok: true, id: info.lastInsertRowid, name, claimed: true });
});

// Bearer-token middleware. Looks up the caller's profile by token hash.
// Attaches `req.profile = { id, name }` on success.
function requireProfile(req, res, next) {
  const h = req.headers.authorization || '';
  const m = /^Bearer (.+)$/.exec(h);
  if (!m || !isValidToken(m[1])) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const tokenHash = hashToken(m[1]);
  const row = db
    .prepare('SELECT id, name, banned_at FROM profiles WHERE token_hash = ?')
    .get(tokenHash);
  if (!row) return res.status(401).json({ error: 'unauthorized' });
  if (row.banned_at) return res.status(403).json({ error: 'banned' });
  req.profile = { id: row.id, name: row.name };
  db.prepare('UPDATE profiles SET last_seen_at = ? WHERE id = ?').run(nowMs(), row.id);
  next();
}

app.get('/profiles/me', requireProfile, (req, res) => {
  res.json({ id: req.profile.id, name: req.profile.name });
});

// ----- Shared levels -----

// Shipped sample puzzles. These ship inside the static client; the
// server only needs to know the codes and display names so it can
// validate completions and label leaderboards. Codes mN are short
// and never collide with the 8-char custom codes generated below.
// IMPORTANT: keep this list in sync with js/sample.js. If a new sample
// ships, add an entry here so its leaderboard works.
const SAMPLE_NAMES = {
  m1: 'The Crimson Conservatory',
  m2: 'Midnight at the Lighthouse',
  m3: 'Tea and Treachery',
  m4: "The Bookseller's Loft",
  m5: "The Magistrate's Study",
  m6: 'Ferns and Felonies',
  m7: 'The Atelier',
  m8: 'The Coastal Hotel',
  m9: 'The Speakeasy',
};
function isSampleCode(code) {
  return Object.prototype.hasOwnProperty.call(SAMPLE_NAMES, code);
}

// 8 base32 chars; ~40 bits of entropy is plenty for a shareable
// puzzle code. Crockford alphabet drops I/L/O/U to stay copy-friendly.
const CODE_ALPHABET = '0123456789abcdefghjkmnpqrstvwxyz';
function generateLevelCode() {
  const bytes = randomBytes(8);
  let out = '';
  for (let i = 0; i < 8; i++) out += CODE_ALPHABET[bytes[i] % 32];
  return out;
}

// Author shares a puzzle. The full level payload is validated server-
// side via the same module the client uses, so a tampered request
// can't smuggle in an invalid level. Returns the generated code +
// public URL for the share modal.
app.post('/custom', requireProfile, (req, res) => {
  const level = req.body && req.body.level;
  if (!level || typeof level !== 'object') {
    return res.status(400).json({ error: 'missing_level' });
  }
  const v = validateLevel(level);
  if (!v.ok) {
    return res.status(422).json({ error: 'invalid_level', details: v.errors });
  }
  const payload = JSON.stringify(level);
  if (payload.length > 200_000) {
    return res.status(413).json({ error: 'level_too_large' });
  }
  const now = nowMs();
  // Retry on the (astronomically unlikely) code collision.
  let code, info;
  for (let attempt = 0; attempt < 5; attempt++) {
    code = generateLevelCode();
    try {
      info = db
        .prepare(
          `INSERT INTO levels (code, owner_id, name, payload, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .run(code, req.profile.id, String(level.name || 'Untitled house'), payload, now, now);
      break;
    } catch (err) {
      if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') continue;
      throw err;
    }
  }
  if (!info) return res.status(500).json({ error: 'code_collision' });
  return res.status(201).json({ ok: true, code, id: info.lastInsertRowid });
});

// Fetch a shared puzzle. Public: anyone can pull a level by code.
// The owner's display name is denormalized in so the client can show
// "Authored by @X" without a second lookup.
app.get('/custom/:code', (req, res) => {
  const code = String(req.params.code || '').toLowerCase();
  const row = db
    .prepare(
      `SELECT l.code, l.name, l.payload, l.plays_count, l.created_at,
              l.owner_id, p.name AS owner_name
       FROM levels l
       JOIN profiles p ON p.id = l.owner_id
       WHERE l.code = ?`
    )
    .get(code);
  if (!row) return res.status(404).json({ error: 'not_found' });
  let level;
  try {
    level = JSON.parse(row.payload);
  } catch {
    return res.status(500).json({ error: 'corrupt_payload' });
  }
  res.json({
    code: row.code,
    name: row.name,
    ownerName: row.owner_name,
    ownerId: row.owner_id,
    playsCount: row.plays_count,
    createdAt: row.created_at,
    level,
  });
});

// Bump the plays counter. Called once when a player opens a shared
// puzzle for the first time (idempotency is on the client, the
// server just increments). Anonymous; no auth gate.
app.post('/custom/:code/plays', (req, res) => {
  const code = String(req.params.code || '').toLowerCase();
  const info = db
    .prepare('UPDATE levels SET plays_count = plays_count + 1 WHERE code = ?')
    .run(code);
  if (info.changes === 0) return res.status(404).json({ error: 'not_found' });
  res.json({ ok: true });
});

// Owner-only update. Used when the author edits their own shared
// puzzle and re-publishes. We re-validate, then overwrite payload
// and bump updated_at. Non-owners get 403.
app.put('/custom/:code', requireProfile, (req, res) => {
  const code = String(req.params.code || '').toLowerCase();
  const owner = db
    .prepare('SELECT owner_id FROM levels WHERE code = ?')
    .get(code);
  if (!owner) return res.status(404).json({ error: 'not_found' });
  if (owner.owner_id !== req.profile.id) {
    return res.status(403).json({ error: 'forbidden' });
  }
  const level = req.body && req.body.level;
  const v = validateLevel(level);
  if (!v.ok) {
    return res.status(422).json({ error: 'invalid_level', details: v.errors });
  }
  const payload = JSON.stringify(level);
  if (payload.length > 200_000) {
    return res.status(413).json({ error: 'level_too_large' });
  }
  db.prepare(
    `UPDATE levels SET payload = ?, name = ?, updated_at = ?
     WHERE code = ?`
  ).run(payload, String(level.name || 'Untitled house'), nowMs(), code);
  res.json({ ok: true });
});

// ----- Completions + leaderboard -----

// Common implementation: record a completion. `code` is taken from
// the URL, validated against either the SAMPLE_NAMES whitelist or
// the levels table depending on the namespace flag, then a single
// row is inserted. duration_ms must be positive, mistakes must be a
// non-negative integer. We do not de-duplicate per (profile, level):
// the player can post multiple completions across multiple sessions
// and the leaderboard reports their best.
function recordCompletionHandler(namespace) {
  return (req, res) => {
    const code = String(req.params.code || '').toLowerCase();
    const body = req.body || {};
    const isBackfill = body.backfill === true;
    const rawDuration = Number(body.durationMs);
    const durationMs = isBackfill
      ? (Number.isFinite(rawDuration) && rawDuration > 0 ? Math.floor(rawDuration) : 0)
      : (Number.isFinite(rawDuration) ? Math.floor(rawDuration) : 0);
    const mistakes = Number.isFinite(body.mistakes) ? Math.max(0, Math.floor(body.mistakes)) : 0;
    // Live posts require a positive duration; backfill rows are allowed
    // to be timeless since the win predates the timing feature.
    if (!isBackfill && durationMs <= 0) {
      return res.status(400).json({ error: 'bad_payload' });
    }
    if (namespace === 'sample') {
      if (!isSampleCode(code)) return res.status(404).json({ error: 'not_found' });
    } else {
      const lvl = db.prepare('SELECT 1 FROM levels WHERE code = ?').get(code);
      if (!lvl) return res.status(404).json({ error: 'not_found' });
    }
    // De-dupe backfill rows so a re-syncing client doesn't keep
    // stacking phantom completions. Live posts intentionally still
    // accept multiple inserts so a replay of the same puzzle counts.
    if (isBackfill) {
      const dup = db
        .prepare(
          `SELECT 1 FROM completions
           WHERE profile_id = ? AND level_code = ?
           LIMIT 1`
        )
        .get(req.profile.id, code);
      if (dup) return res.status(200).json({ ok: true, deduped: true });
    }
    db.prepare(
      `INSERT INTO completions (profile_id, level_code, duration_ms, mistakes, completed_at, is_backfill)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(req.profile.id, code, durationMs, mistakes, nowMs(), isBackfill ? 1 : 0);
    res.status(201).json({ ok: true });
  };
}

// Best time per profile, fastest first, top 50. completed_at on the
// winning row breaks ties so a player who matched the time later
// doesn't displace the earlier finisher.
function leaderboardHandler(namespace) {
  return (req, res) => {
    const code = String(req.params.code || '').toLowerCase();
    if (namespace === 'sample' && !isSampleCode(code)) {
      return res.status(404).json({ error: 'not_found' });
    }
    if (namespace === 'custom') {
      const lvl = db.prepare('SELECT 1 FROM levels WHERE code = ?').get(code);
      if (!lvl) return res.status(404).json({ error: 'not_found' });
    }
    // Exclude backfill rows from the time leaderboard: they have no
    // recorded duration and would sort to the top by accident.
    const rows = db
      .prepare(
        `SELECT p.name AS profile_name,
                MIN(c.duration_ms) AS best_ms,
                MIN(c.mistakes)    AS best_mistakes,
                MIN(c.completed_at) AS first_at
         FROM completions c
         JOIN profiles p ON p.id = c.profile_id
         WHERE c.level_code = ? AND c.is_backfill = 0
         GROUP BY c.profile_id
         ORDER BY best_ms ASC, first_at ASC
         LIMIT 50`
      )
      .all(code);
    res.json({ code, entries: rows });
  };
}

// Full solver list, one row per completion (a player who solves the
// same puzzle twice shows up twice), newest first. Used by the
// "Players completed" tab next to the leaderboard.
function completionsListHandler(namespace) {
  return (req, res) => {
    const code = String(req.params.code || '').toLowerCase();
    let levelName;
    if (namespace === 'sample') {
      if (!isSampleCode(code)) return res.status(404).json({ error: 'not_found' });
      levelName = SAMPLE_NAMES[code];
    } else {
      const lvl = db.prepare('SELECT name FROM levels WHERE code = ?').get(code);
      if (!lvl) return res.status(404).json({ error: 'not_found' });
      levelName = lvl.name;
    }
    const rows = db
      .prepare(
        `SELECT p.name AS profile_name,
                c.duration_ms,
                c.mistakes,
                c.completed_at
         FROM completions c
         JOIN profiles p ON p.id = c.profile_id
         WHERE c.level_code = ?
         ORDER BY c.completed_at DESC
         LIMIT 200`
      )
      .all(code);
    res.json({ code, levelName, entries: rows });
  };
}

// Sample namespace: /levels/:code is read-only (no CRUD, samples ship
// in the client) but accepts completions and exposes leaderboards.
app.post('/levels/:code/completions', requireProfile, recordCompletionHandler('sample'));
app.get('/levels/:code/leaderboard', leaderboardHandler('sample'));
app.get('/levels/:code/completions', completionsListHandler('sample'));

// Custom namespace: full CRUD + completions + leaderboard.
app.post('/custom/:code/completions', requireProfile, recordCompletionHandler('custom'));
app.get('/custom/:code/leaderboard', leaderboardHandler('custom'));
app.get('/custom/:code/completions', completionsListHandler('custom'));

// ----- Cross-namespace directory -----

// Combined list of every puzzle that has at least one completion,
// across both namespaces. Used by the global Leaderboards button in
// the start menu so the player can pick a puzzle to inspect without
// having to remember a share code. Newest activity first.
app.get('/puzzles', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.level_code AS code,
              COUNT(*)              AS completion_count,
              MAX(c.completed_at)   AS last_completed_at
       FROM completions c
       GROUP BY c.level_code
       ORDER BY last_completed_at DESC
       LIMIT 200`
    )
    .all();
  const entries = rows.map((r) => {
    if (isSampleCode(r.code)) {
      return { ...r, namespace: 'sample', name: SAMPLE_NAMES[r.code] };
    }
    const lvl = db.prepare('SELECT name FROM levels WHERE code = ?').get(r.code);
    return {
      ...r,
      namespace: 'custom',
      name: lvl ? lvl.name : `(deleted) ${r.code}`,
    };
  });
  res.json({ entries });
});

// ----- Public player directory -----

// List every profile, freshest first. Includes the count of puzzles
// each one has authored and solved, so the directory card can
// summarise "@X has solved N puzzles" without a second lookup per
// row. Banned profiles are hidden from the public listing.
app.get('/players', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.name,
              p.created_at,
              p.last_seen_at,
              (SELECT COUNT(DISTINCT c.level_code) FROM completions c WHERE c.profile_id = p.id) AS completion_count,
              (SELECT COALESCE(SUM(c.mistakes), 0)  FROM completions c WHERE c.profile_id = p.id AND c.is_backfill = 0) AS total_guesses,
              (SELECT COUNT(*) FROM levels    l WHERE l.owner_id   = p.id) AS authored_count
       FROM profiles p
       WHERE p.banned_at IS NULL
       ORDER BY p.last_seen_at DESC
       LIMIT 200`
    )
    .all();
  res.json({ entries: rows });
});

// Public global player leaderboard. Ranks players by puzzles
// completed (distinct level codes, DESC) with total guesses across
// live solves as a tiebreaker (ASC). Returns up to 100 rows. Used by
// the start-menu Leaderboards button as the "who has solved the most"
// scoreboard.
app.get('/rankings', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT p.name,
              (SELECT COUNT(DISTINCT c.level_code) FROM completions c WHERE c.profile_id = p.id) AS completion_count,
              (SELECT COALESCE(SUM(c.mistakes), 0)  FROM completions c WHERE c.profile_id = p.id AND c.is_backfill = 0) AS total_guesses
       FROM profiles p
       WHERE p.banned_at IS NULL
       ORDER BY completion_count DESC, total_guesses ASC, p.created_at ASC
       LIMIT 100`
    )
    .all();
  res.json({ entries: rows.filter((r) => r.completion_count > 0) });
});

// Public profile view: every solve this player has logged, with the
// level name denormalised in for display. Hidden if the profile is
// banned, so a banned account can't be browsed. Newest solve first.
app.get('/players/:name', (req, res) => {
  const nameLower = String(req.params.name || '').toLowerCase();
  const prof = db
    .prepare(
      `SELECT id, name, created_at, last_seen_at, banned_at
       FROM profiles WHERE name_lower = ?`
    )
    .get(nameLower);
  if (!prof || prof.banned_at) return res.status(404).json({ error: 'not_found' });
  const completions = db
    .prepare(
      `SELECT c.level_code,
              c.duration_ms,
              c.mistakes,
              c.completed_at,
              l.name AS level_name
       FROM completions c
       LEFT JOIN levels l ON l.code = c.level_code
       WHERE c.profile_id = ?
       ORDER BY c.completed_at DESC
       LIMIT 200`
    )
    .all(prof.id);
  // Fold the sample-name registry in so a /players/:name view shows
  // a friendly title for sample completions instead of "m1".
  for (const c of completions) {
    if (!c.level_name && isSampleCode(c.level_code)) {
      c.level_name = SAMPLE_NAMES[c.level_code];
    }
  }
  const authoredCount = db
    .prepare('SELECT COUNT(*) AS n FROM levels WHERE owner_id = ?')
    .get(prof.id).n;
  res.json({
    name: prof.name,
    createdAt: prof.created_at,
    lastSeenAt: prof.last_seen_at,
    authoredCount,
    completions,
  });
});

// ----- Admin dashboard -----

function formatDuration(ms) {
  if (!Number.isFinite(ms)) return '';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

app.get('/admin', (_req, res) => {
  const kpi = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM profiles)                             AS profiles,
         (SELECT COUNT(*) FROM profiles WHERE banned_at IS NOT NULL) AS banned,
         (SELECT COUNT(*) FROM levels)                               AS puzzles,
         (SELECT COUNT(*) FROM completions)                          AS completions`
    )
    .get();

  const profiles = db
    .prepare(
      `SELECT id, name,
              datetime(created_at   / 1000, 'unixepoch') AS created,
              datetime(last_seen_at / 1000, 'unixepoch') AS seen,
              (SELECT COUNT(*) FROM completions c WHERE c.profile_id = profiles.id) AS plays,
              (SELECT COUNT(*) FROM levels l WHERE l.owner_id = profiles.id)        AS authored
       FROM profiles ORDER BY last_seen_at DESC LIMIT 50`
    )
    .all();

  const puzzles = db
    .prepare(
      `SELECT l.code, l.name, l.plays_count,
              p.name AS owner_name,
              datetime(l.created_at / 1000, 'unixepoch') AS created,
              (SELECT COUNT(*) FROM completions c WHERE c.level_code = l.code) AS completions
       FROM levels l
       JOIN profiles p ON p.id = l.owner_id
       ORDER BY l.created_at DESC
       LIMIT 100`
    )
    .all();

  const completions = db
    .prepare(
      `SELECT c.duration_ms, c.mistakes,
              datetime(c.completed_at / 1000, 'unixepoch') AS done,
              p.name AS profile_name,
              l.name AS level_name,
              c.level_code
       FROM completions c
       JOIN profiles p ON p.id = c.profile_id
       LEFT JOIN levels l ON l.code = c.level_code
       ORDER BY c.completed_at DESC
       LIMIT 100`
    )
    .all();

  // Top times across all puzzles. One row per (level, profile) at
  // that profile's best time. Used as a "fastest solves" board.
  const leaderboard = db
    .prepare(
      `SELECT c.level_code AS code, l.name AS level_name,
              p.name AS profile_name,
              MIN(c.duration_ms) AS best_ms,
              MIN(c.mistakes)    AS best_mistakes
       FROM completions c
       JOIN profiles p ON p.id = c.profile_id
       LEFT JOIN levels l ON l.code = c.level_code
       GROUP BY c.level_code, c.profile_id
       ORDER BY best_ms ASC
       LIMIT 50`
    )
    .all();

  // Fold sample names in so the admin dashboard reads as a human-
  // friendly title for sample rows instead of "m1".
  for (const r of completions) {
    if (!r.level_name && isSampleCode(r.level_code)) r.level_name = SAMPLE_NAMES[r.level_code];
  }
  for (const r of leaderboard) {
    if (!r.level_name && isSampleCode(r.code)) r.level_name = SAMPLE_NAMES[r.code];
  }

  const profileRows = profiles
    .map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.created)}</td><td>${escapeHtml(r.seen)}</td><td class="num">${r.authored}</td><td class="num">${r.plays}</td></tr>`)
    .join('');

  const puzzleRows = puzzles
    .map((r) => `<tr><td><code>${escapeHtml(r.code)}</code></td><td>${escapeHtml(r.name)}</td><td>@${escapeHtml(r.owner_name)}</td><td>${escapeHtml(r.created)}</td><td class="num">${r.plays_count}</td><td class="num">${r.completions}</td></tr>`)
    .join('');

  const completionRows = completions
    .map((r) => `<tr><td>@${escapeHtml(r.profile_name)}</td><td>${escapeHtml(r.level_name || r.level_code)}</td><td class="num">${formatDuration(r.duration_ms)}</td><td class="num">${r.mistakes}</td><td>${escapeHtml(r.done)}</td></tr>`)
    .join('');

  const leaderboardRows = leaderboard
    .map((r, i) => `<tr><td class="num">${i + 1}</td><td>@${escapeHtml(r.profile_name)}</td><td>${escapeHtml(r.level_name || r.code)}</td><td class="num">${formatDuration(r.best_ms)}</td><td class="num">${r.best_mistakes}</td></tr>`)
    .join('');

  res.set('content-type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Murdoku admin</title>
<style>
  body{font:14px ui-sans-serif,system-ui,sans-serif;background:#1f1b2e;color:#ece8ff;margin:0;padding:24px;max-width:1100px}
  h1{margin:0 0 8px;color:#f0abfc}
  h2{margin:28px 0 8px;font-size:14px;color:#c084fc;letter-spacing:1px;text-transform:uppercase}
  table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
  td,th{border-bottom:1px solid #4a416c;padding:6px 10px;text-align:left;vertical-align:top}
  th{color:#c084fc;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:1px}
  .num{text-align:right;font-variant-numeric:tabular-nums}
  .kpis{display:flex;gap:14px;margin:12px 0;flex-wrap:wrap}
  .kpi{background:#2f2848;border:1px solid #4a416c;padding:10px 14px;border-radius:8px;min-width:90px}
  .kpi strong{font-size:18px;color:#f0abfc;display:block}
  .kpi span{font-size:12px;color:#a89dc4}
  code{background:#2f2848;padding:1px 6px;border-radius:4px;font-size:12px}
  em{color:#a89dc4}
</style></head>
<body>
  <h1>Murdoku admin</h1>
  <div class="kpis">
    <div class="kpi"><strong>${kpi.profiles}</strong><span>profiles</span></div>
    <div class="kpi"><strong>${kpi.banned}</strong><span>banned</span></div>
    <div class="kpi"><strong>${kpi.puzzles}</strong><span>shared puzzles</span></div>
    <div class="kpi"><strong>${kpi.completions}</strong><span>completions</span></div>
  </div>

  <h2>Profiles &amp; login timers</h2>
  <table>
    <thead><tr><th>Name</th><th>Created</th><th>Last seen</th><th class="num">Authored</th><th class="num">Plays</th></tr></thead>
    <tbody>${profileRows || '<tr><td colspan=5><em>None yet.</em></td></tr>'}</tbody>
  </table>

  <h2>User-generated puzzles</h2>
  <table>
    <thead><tr><th>Code</th><th>Name</th><th>Owner</th><th>Created</th><th class="num">Plays</th><th class="num">Solved by</th></tr></thead>
    <tbody>${puzzleRows || '<tr><td colspan=6><em>Nobody has shared a puzzle yet.</em></td></tr>'}</tbody>
  </table>

  <h2>Recent completions</h2>
  <table>
    <thead><tr><th>Player</th><th>Puzzle</th><th class="num">Time</th><th class="num">Mistakes</th><th>When</th></tr></thead>
    <tbody>${completionRows || '<tr><td colspan=5><em>No completions logged yet.</em></td></tr>'}</tbody>
  </table>

  <h2>Leaderboard (fastest solves across all puzzles)</h2>
  <table>
    <thead><tr><th class="num">#</th><th>Player</th><th>Puzzle</th><th class="num">Best time</th><th class="num">Mistakes</th></tr></thead>
    <tbody>${leaderboardRows || '<tr><td colspan=5><em>No leaderboard entries yet.</em></td></tr>'}</tbody>
  </table>
</body></html>`);
});

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ----- Boot -----

app.listen(PORT, '0.0.0.0', () => {
  console.log(`murdoku-api listening on :${PORT}`);
});
