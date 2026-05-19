// Thin fetch wrapper around the Murdoku companion API. The base URL is
// read from a <meta name="murdoku-api-base"> tag in index.html so the
// frontend stays buildless: change the meta value in one place to point
// at a different deployment.
//
// Every call here is best-effort. The frontend treats the API as
// optional, returns false on network failure, and only surfaces errors
// when the user is expected to act (e.g. name collision on claim).

const META_NAME = 'murdoku-api-base';

function apiBase() {
  const meta = document.querySelector(`meta[name="${META_NAME}"]`);
  const v = meta && meta.getAttribute('content');
  return v && v.trim() ? v.trim().replace(/\/+$/, '') : null;
}

export function apiAvailable() {
  return !!apiBase();
}

async function call(method, path, { body, token, signal } = {}) {
  const base = apiBase();
  if (!base) throw new Error('API base URL not configured');
  const res = await fetch(base + path, {
    method,
    signal,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    mode: 'cors',
  });
  return res;
}

// Lightweight health probe. Returns true if /healthz responds OK within
// the timeout, false otherwise. Used on boot to decide whether to flip
// the offline banner and whether to attempt claims.
export async function probeServer(timeoutMs = 3000) {
  if (!apiAvailable()) return false;
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await call('GET', '/healthz', { signal: ctl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

// Claim a profile name on the server with the given client-generated
// token. Returns { ok, nameTaken, status } so the caller can decide
// what to do with collisions.
//   ok: 201 the profile was registered; or 200 if the same name +
//       token combination already exists (idempotent re-claim).
//   nameTaken: 409 the name exists but the token does not match. The
//       UI should prompt the user to pick another name.
export async function claimProfile(name, token) {
  if (!apiAvailable()) return { ok: false, nameTaken: false, status: 0 };
  let res;
  try {
    res = await call('POST', '/profiles', { body: { name, token } });
  } catch {
    return { ok: false, nameTaken: false, status: 0 };
  }
  if (res.status === 201 || res.status === 200) {
    return { ok: true, nameTaken: false, status: res.status };
  }
  if (res.status === 409) {
    return { ok: false, nameTaken: true, status: 409 };
  }
  return { ok: false, nameTaken: false, status: res.status };
}

// Verify the active profile's token still matches the server's record.
// Returns true on a 200, false on 401, null on transport failure.
export async function whoami(token) {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', '/profiles/me', { token });
    if (res.ok) return true;
    if (res.status === 401) return false;
    return null;
  } catch {
    return null;
  }
}

// ----- Shared puzzles -----
//
// Two URL namespaces: /levels/:code for shipped samples (mN), and
// /custom/:code for user-shared puzzles. The leaderboard, completions,
// and record-completion routes mirror each other under both prefixes;
// the per-puzzle wrappers below take a `namespace` argument so the
// caller picks which prefix to hit. Custom CRUD routes only exist
// under /custom.

function nsPrefix(namespace) {
  return namespace === 'sample' ? '/levels' : '/custom';
}

// Publish an authored level to the server. The server re-runs the
// validator; on a 422 the caller gets the array of error strings
// produced server-side and can show them to the player. On success
// returns { ok: true, code, url }.
export async function shareLevel(token, level) {
  if (!apiAvailable()) return { ok: false, status: 0 };
  try {
    const res = await call('POST', '/custom', { token, body: { level } });
    const data = await safeJson(res);
    if (res.status === 201) {
      return { ok: true, code: data.code, url: shareUrlFor(data.code) };
    }
    if (res.status === 422) {
      return { ok: false, invalid: true, errors: data.details || [], status: 422 };
    }
    return { ok: false, status: res.status, error: data && data.error };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Update an existing shared level. Owner-only; server returns 403 if
// the bearer token's profile is not the level's owner.
export async function updateSharedLevel(token, code, level) {
  if (!apiAvailable()) return { ok: false, status: 0 };
  try {
    const res = await call('PUT', `/custom/${encodeURIComponent(code)}`, {
      token,
      body: { level },
    });
    const data = await safeJson(res);
    if (res.ok) return { ok: true };
    if (res.status === 422) {
      return { ok: false, invalid: true, errors: data.details || [], status: 422 };
    }
    if (res.status === 403) return { ok: false, forbidden: true, status: 403 };
    return { ok: false, status: res.status, error: data && data.error };
  } catch {
    return { ok: false, status: 0 };
  }
}

// Public fetch of a shared puzzle by code. Returns the full record
// (code, name, ownerName, ownerId, playsCount, createdAt, level).
export async function getSharedLevel(code) {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', `/custom/${encodeURIComponent(code)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Fire-and-forget plays counter bump. Called once per first open of a
// shared puzzle on this device.
export async function bumpPlays(code) {
  if (!apiAvailable()) return;
  try {
    await call('POST', `/custom/${encodeURIComponent(code)}/plays`);
  } catch {
    // swallow; the count is best-effort
  }
}

// Post a completion record after a player wins a puzzle. Namespace
// must be either 'sample' (for shipped mN codes) or 'custom' (for
// player-shared codes), the URL prefix is selected accordingly.
// Pass `backfill: true` for pre-feature wins that don't have a real
// duration or mistake count, the server stores those as flagged rows
// and excludes them from the time / mistake leaderboards.
export async function recordCompletion(token, code, namespace, durationMs, mistakes, { backfill = false } = {}) {
  if (!apiAvailable()) return false;
  try {
    const res = await call('POST', `${nsPrefix(namespace)}/${encodeURIComponent(code)}/completions`, {
      token,
      body: { durationMs, mistakes, backfill: backfill || undefined },
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Public leaderboard for a single puzzle. Returns the array of
// entries (each { profile_name, best_ms, best_mistakes, first_at })
// or null on failure.
export async function getLeaderboard(code, namespace) {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', `${nsPrefix(namespace)}/${encodeURIComponent(code)}/leaderboard`);
    if (!res.ok) return null;
    const data = await res.json();
    return data.entries || [];
  } catch {
    return null;
  }
}

// Full solver list for a puzzle. Newest first, one row per completion
// (so a player who finishes twice shows up twice). Returns
// { levelName, entries } where each entry has profile_name,
// duration_ms, mistakes, completed_at. Returns null on failure.
export async function getLevelCompletions(code, namespace) {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', `${nsPrefix(namespace)}/${encodeURIComponent(code)}/completions`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Global player rankings: who has solved the most puzzles, with total
// guesses as the tiebreaker. Returns the array of entries (each
// { name, completion_count, total_guesses }) or null on failure.
export async function getRankings() {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', '/rankings');
    if (!res.ok) return null;
    const data = await res.json();
    return data.entries || [];
  } catch {
    return null;
  }
}

// Cross-namespace directory of every puzzle that has at least one
// completion. Used by the global Leaderboards button so the player can
// pick any active puzzle without remembering its code. Each entry
// carries its own { code, namespace, name, completion_count,
// last_completed_at }; namespace tells the caller which prefix to
// hand back into the per-puzzle wrappers.
export async function getPuzzles() {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', '/puzzles');
    if (!res.ok) return null;
    const data = await res.json();
    return data.entries || [];
  } catch {
    return null;
  }
}

// Public player directory. Returns the array of entries (each
// { name, created_at, last_seen_at, completion_count, authored_count })
// or null on failure.
export async function getPlayers() {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', '/players');
    if (!res.ok) return null;
    const data = await res.json();
    return data.entries || [];
  } catch {
    return null;
  }
}

// Public profile view for a single player. Returns the full record
// { name, createdAt, lastSeenAt, authoredCount, completions[] } or
// null on a network or 404 failure.
export async function getPlayerProfile(name) {
  if (!apiAvailable()) return null;
  try {
    const res = await call('GET', `/players/${encodeURIComponent(name)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// Convenience: build the public share URL for a level code. We point
// at the current origin + ?play=<code> so the link the author copies
// matches the URL handler in main.js.
export function shareUrlFor(code) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?play=${encodeURIComponent(code)}`;
}

async function safeJson(res) {
  try { return await res.json(); } catch { return null; }
}
