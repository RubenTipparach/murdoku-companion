// Murdoku companion API. Phase 12 ships profile endpoints only.
// Subsequent phases add level sharing, completions, sessions, admin.

import express from 'express';
import cors from 'cors';
import { createHash } from 'node:crypto';
import { db, nowMs } from './db.js';

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

// ----- Boot -----

app.listen(PORT, '0.0.0.0', () => {
  console.log(`murdoku-api listening on :${PORT}`);
});
