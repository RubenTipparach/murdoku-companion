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
