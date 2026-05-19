// localStorage persistence.

const LS_LEVELS = 'murdoku.levels';
const LS_ACTIVE = 'murdoku.activeId';
const LS_COMPLETED = 'murdoku.completedSamples';

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
