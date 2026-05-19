// Murdoku companion API. Phase 12 ships profile endpoints only.
// Subsequent phases add level sharing, completions, sessions, admin.

import express from 'express';
import cors from 'cors';
import { createHash } from 'node:crypto';
import { db, nowMs } from './db.js';

const PORT = Number(process.env.PORT) || 8080;
// SERVER_SALT is what makes stored token hashes useless if the sqlite
// file leaks. We fall back to a known default so the server still
// boots in unconfigured environments (local dev, first Fly deploy),
// but anything public-facing should set a real one via
// `fly secrets set SERVER_SALT=...`. Setting it later invalidates
// every token minted under the default, which is fine pre-launch.
const SERVER_SALT = process.env.SERVER_SALT || 'murdoku-dev-salt';
const ADMIN_USER = process.env.ADMIN_USER;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!process.env.SERVER_SALT) {
  console.warn('SERVER_SALT not set, using insecure default. Set it via `fly secrets set SERVER_SALT=...` before going public.');
}

// ----- Config / constants -----

const RESERVED_NAMES = new Set(['admin', 'system', 'anonymous', 'guest', 'murdoku']);
const PROFILE_NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const TOKEN_RE = /^[A-Za-z0-9_-]{43}$/; // base64url, 32 bytes => 43 chars w/o padding

function hashToken(token) {
  return createHash('sha256').update(token + SERVER_SALT).digest('hex');
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
// retains it; the server stores sha256(token + salt). If the name is
// taken under a different token, return 409 so the client can prompt
// the user to rename. If the same name + token comes back, it's an
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

// ----- Minimal admin dashboard (basic-auth gated) -----

function basicAuth(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASSWORD) {
    return res.status(503).send('Admin not configured.');
  }
  const h = req.headers.authorization || '';
  const m = /^Basic (.+)$/.exec(h);
  if (m) {
    const decoded = Buffer.from(m[1], 'base64').toString('utf8');
    const colon = decoded.indexOf(':');
    if (colon !== -1) {
      const u = decoded.slice(0, colon);
      const p = decoded.slice(colon + 1);
      if (u === ADMIN_USER && p === ADMIN_PASSWORD) return next();
    }
  }
  res.set('WWW-Authenticate', 'Basic realm="murdoku-admin"');
  res.status(401).send('Authentication required.');
}

app.get('/admin', basicAuth, (_req, res) => {
  const stats = db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM profiles)                            AS profiles,
         (SELECT COUNT(*) FROM profiles WHERE banned_at IS NOT NULL) AS banned`
    )
    .get();
  const recent = db
    .prepare(
      `SELECT name, datetime(created_at / 1000, 'unixepoch') AS created
       FROM profiles ORDER BY created_at DESC LIMIT 20`
    )
    .all();
  const rows = recent
    .map((r) => `<tr><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.created)}</td></tr>`)
    .join('');
  res.set('content-type', 'text/html; charset=utf-8');
  res.send(`<!doctype html>
<html><head><meta charset="utf-8"><title>Murdoku admin</title>
<style>
  body{font:14px ui-sans-serif,system-ui,sans-serif;background:#1f1b2e;color:#ece8ff;margin:0;padding:24px}
  h1{margin:0 0 8px;color:#f0abfc}
  h2{margin:24px 0 8px;font-size:14px;color:#c084fc;letter-spacing:1px;text-transform:uppercase}
  table{border-collapse:collapse;width:100%}
  td,th{border-bottom:1px solid #4a416c;padding:6px 10px;text-align:left}
  .kpis{display:flex;gap:14px;margin:12px 0}
  .kpi{background:#2f2848;border:1px solid #4a416c;padding:10px 14px;border-radius:8px}
  .kpi strong{font-size:18px;color:#f0abfc;display:block}
</style></head>
<body>
  <h1>Murdoku admin</h1>
  <p>Phase 12 overview. Sessions, leaderboards, and the actions table land in later phases.</p>
  <div class="kpis">
    <div class="kpi"><strong>${stats.profiles}</strong>profiles</div>
    <div class="kpi"><strong>${stats.banned}</strong>banned</div>
  </div>
  <h2>Most recent profiles</h2>
  <table><thead><tr><th>Name</th><th>Created</th></tr></thead><tbody>${rows || '<tr><td colspan=2><em>None yet.</em></td></tr>'}</tbody></table>
</body></html>`);
});

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ----- Boot -----

app.listen(PORT, '0.0.0.0', () => {
  console.log(`murdoku-api listening on :${PORT}`);
});
