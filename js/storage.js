// localStorage persistence.

const LS_LEVELS = 'murdoku.levels';
const LS_ACTIVE = 'murdoku.activeId';
const LS_COMPLETED = 'murdoku.completedSamples';
const LS_PROFILES = 'murdoku.profiles';
const LS_ACTIVE_PROFILE = 'murdoku.activeProfileName';
// Phase 11 legacy single-profile key. Migrated on load, then deleted.
const LS_PROFILE_LEGACY = 'murdoku.profile';

export function loadLevels() {
  try {
    const raw = localStorage.getItem(LS_LEVELS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLevels(levels) {
  localStorage.setItem(LS_LEVELS, JSON.stringify(levels));
}

export function loadActiveId() {
  return localStorage.getItem(LS_ACTIVE);
}

export function saveActiveId(id) {
  if (id) localStorage.setItem(LS_ACTIVE, id);
  else localStorage.removeItem(LS_ACTIVE);
}

// Keys of sample levels the user has solved at least once. Survives across
// fresh "play sample" sessions so a green check stays on the menu even when
// the player loads a brand-new copy of the same sample.
export function loadCompletedSamples() {
  try {
    const raw = localStorage.getItem(LS_COMPLETED);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCompletedSamples(arr) {
  localStorage.setItem(LS_COMPLETED, JSON.stringify(arr));
}

// The local profile registry. Every profile ever created on this device
// stays on disk so the player can sign back in after signing out. A
// profile is { name, token, createdAt, lastSeenAt, claimed }; the token
// is a 32-byte base64url secret generated client-side at creation and
// authenticates the profile to the server (Phase 12+).
//
// The Phase 11 single-profile key (`murdoku.profile`) is migrated into
// the registry on first load.
export function loadProfiles() {
  // Migrate Phase 11 single-profile shape into the registry.
  try {
    const legacy = localStorage.getItem(LS_PROFILE_LEGACY);
    if (legacy && !localStorage.getItem(LS_PROFILES)) {
      const parsed = JSON.parse(legacy);
      if (parsed && typeof parsed.name === 'string') {
        const migrated = {
          name: parsed.name,
          token: parsed.token || generateToken(),
          createdAt: parsed.createdAt || Date.now(),
          lastSeenAt: Date.now(),
          claimed: false,
        };
        localStorage.setItem(LS_PROFILES, JSON.stringify([migrated]));
        localStorage.setItem(LS_ACTIVE_PROFILE, migrated.name);
      }
      localStorage.removeItem(LS_PROFILE_LEGACY);
    }
  } catch {}
  try {
    const raw = localStorage.getItem(LS_PROFILES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((p) => p && typeof p.name === 'string') : [];
  } catch {
    return [];
  }
}

export function saveProfiles(profiles) {
  if (Array.isArray(profiles) && profiles.length) {
    localStorage.setItem(LS_PROFILES, JSON.stringify(profiles));
  } else {
    localStorage.removeItem(LS_PROFILES);
  }
}

export function loadActiveProfileName() {
  return localStorage.getItem(LS_ACTIVE_PROFILE);
}

export function saveActiveProfileName(name) {
  if (name) localStorage.setItem(LS_ACTIVE_PROFILE, name);
  else localStorage.removeItem(LS_ACTIVE_PROFILE);
}

// 32 random bytes, base64url-encoded. The server authenticates a profile
// by comparing sha256(token + server_salt). Generated once on profile
// creation and never sent over the wire except as a bearer credential.
export function generateToken() {
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  let bin = '';
  for (const b of buf) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
