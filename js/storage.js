// localStorage persistence.

const LS_LEVELS = 'murdoku.levels';
const LS_ACTIVE = 'murdoku.activeId';

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
