// Floor tiles + furniture decorations.
//
// Tile patterns are pure CSS classes (see css/style.css `.tile-*`). They
// layer a translucent pattern over the room's base color so any room color
// pairs sensibly with any pattern.
//
// Furniture is a set of 32x32 PNG sprites loaded from
// assets/furniture/manifest.json. A room's "decorations" map lives on the
// level (keyed by "x,y") so we can clean up stale entries when cells move
// in and out of rooms.

import { state, activeLevel, key } from './state.js';

export const TILE_PATTERNS = [
  'solid', 'check', 'stripe-v', 'stripe-h', 'wood', 'dots', 'diamond', 'square',
];

let furniture = [];

export async function loadFurniture() {
  try {
    const res = await fetch('./assets/furniture/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('furniture manifest http ' + res.status);
    furniture = await res.json();
  } catch (err) {
    console.warn('Failed to load furniture manifest:', err);
    furniture = [];
  }
}

export function getFurniture() { return furniture; }
export function findFurniture(id) { return furniture.find((f) => f.id === id) || null; }

function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Roll a fresh tile pattern + decoration set for a single room. Decorations
// live on the level, so this mutates both `room` and `level.decorations`.
export function rollRoom(roomId) {
  const lvl = activeLevel();
  if (!lvl) return;
  const room = lvl.rooms.find((r) => r.id === roomId);
  if (!room) return;

  // Pick a tile pattern other than the current one (to make rolling feel
  // like it did something even on small rooms with one cell).
  const candidates = TILE_PATTERNS.filter((p) => p !== room.tilePattern);
  room.tilePattern = candidates[Math.floor(Math.random() * candidates.length)];

  // Clear existing decorations in this room's cells.
  for (const [x, y] of room.cells) delete lvl.decorations[key(x, y)];

  if (furniture.length === 0 || room.cells.length === 0) {
    lvl.updatedAt = Date.now();
    return;
  }

  // Decorate ~30% of cells, capped at 6 to keep rooms readable. Avoid cells
  // that already hold a solution character so the puzzle stays legible.
  const free = room.cells.filter(([x, y]) => !lvl.solution[key(x, y)]);
  if (!free.length) {
    lvl.updatedAt = Date.now();
    return;
  }
  const count = Math.min(6, Math.max(1, Math.round(free.length * 0.3)));
  const picked = shuffle(free).slice(0, count);
  for (const [x, y] of picked) {
    const f = furniture[Math.floor(Math.random() * furniture.length)];
    lvl.decorations[key(x, y)] = f.id;
  }
  lvl.updatedAt = Date.now();
}

// Roll every room in the active level. Handy "redecorate the house" button.
export function rollAllRooms() {
  const lvl = activeLevel();
  if (!lvl) return;
  for (const room of lvl.rooms) rollRoom(room.id);
}

// Normalize a level loaded from storage so older levels still render.
export function normalizeLevel(lvl) {
  if (!lvl) return lvl;
  if (!lvl.decorations || typeof lvl.decorations !== 'object') lvl.decorations = {};
  if (!lvl.clues || typeof lvl.clues !== 'object') lvl.clues = {};
  if (!Array.isArray(lvl.rooms)) lvl.rooms = [];
  for (const room of lvl.rooms) {
    if (!room.tilePattern) room.tilePattern = 'solid';
  }
  return lvl;
}
