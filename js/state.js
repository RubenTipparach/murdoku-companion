// Global mutable state and the level model.

export const DEFAULT_GRID = 9;
// Maximum supported grid size, bumping this requires no code changes,
// but levels above ~14 get cramped on mobile so we cap UI sizing there.
export const MAX_GRID = 14;

// Active grid size: read from the active level if present, else fall back
// to the default. Used by grid.js, doorway helpers, and CSS.
export function gridSize() {
  const lvl = activeLevel();
  return (lvl && lvl.size) ? lvl.size : DEFAULT_GRID;
}

const ROOM_PALETTE = [
  '#7b9ed1', '#c47b7b', '#7bc48f', '#c4a87b', '#a87bc4',
  '#7bc4c4', '#c47bb1', '#a3c47b', '#c4937b', '#7b89c4',
  '#9c7bc4', '#7bc4a3', '#c4c47b',
];

let paletteIndex = 0;

export function nextRoomColor() {
  const c = ROOM_PALETTE[paletteIndex % ROOM_PALETTE.length];
  paletteIndex++;
  return c;
}

function id(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 8);
}

export function emptyLevel(name = 'Untitled house', size = DEFAULT_GRID) {
  const now = Date.now();
  return {
    id: id('lvl'),
    name,
    description: '',
    size,
    rooms: [],
    doorways: [],
    solution: {},
    playerPlacement: {},
    decorations: {},
    // Per-character clue text. Keyed by character id. Rendered in Play mode.
    clues: {},
    // Whose body is on the floor. Their portrait gets a 🪦 badge and they
    // appear in the suspect roster already-placed by default for the player.
    victim: null,
    // Who actually did it (author truth). Player guesses via playerKiller.
    killerSolution: null,
    playerKiller: null,
    createdAt: now,
    updatedAt: now,
  };
}

export function newRoom() {
  return {
    id: id('room'),
    name: 'Room',
    description: '',
    color: nextRoomColor(),
    tilePattern: 'solid',
    cells: [],
  };
}

// In-memory state. Persistence is in storage.js.
export const state = {
  levels: [],
  activeId: null,
  characters: [],
  mode: 'edit',      // 'edit' | 'play'
  tool: 'paint',     // 'paint' | 'erase' | 'doorway' | 'solution'
  selectedRoomId: null,
  selectedCharacterId: null,
  showRoomNames: true,
  transparentGuests: false,
  showRowColMarks: false,
  // Sample keys (e.g. 'lvl_sample_lighthouse') the user has solved at
  // least once. Hydrated from localStorage at boot.
  completedSamples: new Set(),
  // Cache of cell → roomId for O(1) lookup. Rebuilt on render.
  cellRoomCache: new Map(),
};

export function activeLevel() {
  return state.levels.find((l) => l.id === state.activeId) || null;
}

export function key(x, y) { return `${x},${y}`; }
export function parseKey(k) { const [x, y] = k.split(',').map(Number); return { x, y }; }

// Rebuild the cell → roomId map for the active level.
export function rebuildCellCache() {
  const lvl = activeLevel();
  state.cellRoomCache.clear();
  if (!lvl) return;
  for (const room of lvl.rooms) {
    for (const [x, y] of room.cells) state.cellRoomCache.set(key(x, y), room.id);
  }
}

export function roomAt(x, y) {
  const id = state.cellRoomCache.get(key(x, y));
  if (!id) return null;
  const lvl = activeLevel();
  return lvl ? lvl.rooms.find((r) => r.id === id) || null : null;
}

// Assign a cell to a room. If room is null, clear it.
export function setCellRoom(x, y, roomId) {
  const lvl = activeLevel();
  if (!lvl) return;
  const k = key(x, y);
  // Remove from any existing room.
  for (const room of lvl.rooms) {
    room.cells = room.cells.filter(([cx, cy]) => !(cx === x && cy === y));
  }
  // When a cell stops being in a room, drop anything anchored to it.
  if (!roomId) {
    if (lvl.solution[k]) delete lvl.solution[k];
    if (lvl.playerPlacement[k]) delete lvl.playerPlacement[k];
    if (lvl.decorations && lvl.decorations[k]) delete lvl.decorations[k];
  }
  // Doorways become stale silently, they just won't render if there's no
  // wall there anymore.
  if (roomId) {
    const room = lvl.rooms.find((r) => r.id === roomId);
    if (room) room.cells.push([x, y]);
  }
  lvl.updatedAt = Date.now();
  rebuildCellCache();
}

// Doorway helpers. We store doorways as canonical edge strings:
//   "h:x,y", horizontal edge between (x,y) and (x,y+1)
//   "v:x,y", vertical edge between (x,y) and (x+1,y)
export function edgeKey(x, y, side) {
  switch (side) {
    case 'top':    return y > 0 ? `h:${x},${y - 1}` : null;
    case 'bottom': return y < gridSize() - 1 ? `h:${x},${y}` : null;
    case 'left':   return x > 0 ? `v:${x - 1},${y}` : null;
    case 'right':  return x < gridSize() - 1 ? `v:${x},${y}` : null;
  }
  return null;
}

export function toggleDoorway(x, y, side) {
  const lvl = activeLevel();
  if (!lvl) return;
  const k = edgeKey(x, y, side);
  if (!k) return;
  const idx = lvl.doorways.indexOf(k);
  if (idx >= 0) lvl.doorways.splice(idx, 1);
  else lvl.doorways.push(k);
  lvl.updatedAt = Date.now();
}

export function hasDoorway(x, y, side) {
  const lvl = activeLevel();
  if (!lvl) return false;
  const k = edgeKey(x, y, side);
  return k ? lvl.doorways.includes(k) : false;
}

// Place a character at (x,y) in whichever placement map the current mode
// targets (solution in edit, playerPlacement in play). Each character can
// only sit in one cell at a time, placing them somewhere new removes them
// from wherever they were before. Returns true if the placement happened.
export function placeCharacterAt(x, y, charId) {
  const lvl = activeLevel();
  if (!lvl || !charId) return false;
  if (!roomAt(x, y)) return false;
  const k = key(x, y);
  const map = state.mode === 'edit' ? lvl.solution : lvl.playerPlacement;
  // Remove this character from any other cell first.
  for (const otherK of Object.keys(map)) {
    if (map[otherK] === charId && otherK !== k) delete map[otherK];
  }
  map[k] = charId;
  lvl.updatedAt = Date.now();
  return true;
}

export function deleteRoom(roomId) {
  const lvl = activeLevel();
  if (!lvl) return;
  const room = lvl.rooms.find((r) => r.id === roomId);
  if (!room) return;
  // Drop any solution/player placements and decorations in that room's cells.
  for (const [x, y] of room.cells) {
    const k = key(x, y);
    delete lvl.solution[k];
    delete lvl.playerPlacement[k];
    if (lvl.decorations) delete lvl.decorations[k];
  }
  lvl.rooms = lvl.rooms.filter((r) => r.id !== roomId);
  if (state.selectedRoomId === roomId) state.selectedRoomId = null;
  lvl.updatedAt = Date.now();
  rebuildCellCache();
}

// Deep-clone the active level into a new, editable one. The clone always
// drops the isSample flag so the player can modify their copy freely.
export function cloneActiveLevel() {
  const lvl = activeLevel();
  if (!lvl) return null;
  const copy = JSON.parse(JSON.stringify(lvl));
  copy.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
  copy.name = (lvl.name || 'Level') + ' (copy)';
  copy.isSample = false;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  state.levels.push(copy);
  state.activeId = copy.id;
  state.selectedRoomId = null;
  rebuildCellCache();
  return copy;
}
