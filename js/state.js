// Global mutable state and the level model.

export const GRID = 9;

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

export function emptyLevel(name = 'Untitled house') {
  const now = Date.now();
  return {
    id: id('lvl'),
    name,
    description: '',
    rooms: [],
    doorways: [],
    solution: {},
    playerPlacement: {},
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
    cells: [],
  };
}

// In-memory state. Persistence is in storage.js.
export const state = {
  levels: [],
  activeId: null,
  characters: [],
  mode: 'edit',       // 'edit' | 'play'
  tool: 'paint',      // 'paint' | 'erase' | 'doorway' | 'solution'
  selectedRoomId: null,
  selectedCharacterId: null,
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
  // Remove any solution placement that no longer sits in a room.
  if (lvl.solution[k] && !roomId) delete lvl.solution[k];
  if (lvl.playerPlacement[k] && !roomId) delete lvl.playerPlacement[k];
  // Drop doorways whose adjacent cell is no longer relevant. Doorways become
  // stale silently — they just won't render if there's no wall there anymore.
  if (roomId) {
    const room = lvl.rooms.find((r) => r.id === roomId);
    if (room) room.cells.push([x, y]);
  }
  lvl.updatedAt = Date.now();
  rebuildCellCache();
}

// Doorway helpers. We store doorways as canonical edge strings:
//   "h:x,y"  — horizontal edge between (x,y) and (x,y+1)
//   "v:x,y"  — vertical edge between (x,y) and (x+1,y)
export function edgeKey(x, y, side) {
  switch (side) {
    case 'top':    return y > 0 ? `h:${x},${y - 1}` : null;
    case 'bottom': return y < GRID - 1 ? `h:${x},${y}` : null;
    case 'left':   return x > 0 ? `v:${x - 1},${y}` : null;
    case 'right':  return x < GRID - 1 ? `v:${x},${y}` : null;
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

export function deleteRoom(roomId) {
  const lvl = activeLevel();
  if (!lvl) return;
  const room = lvl.rooms.find((r) => r.id === roomId);
  if (!room) return;
  // Drop any solution/player placements in that room's cells.
  for (const [x, y] of room.cells) {
    const k = key(x, y);
    delete lvl.solution[k];
    delete lvl.playerPlacement[k];
  }
  lvl.rooms = lvl.rooms.filter((r) => r.id !== roomId);
  if (state.selectedRoomId === roomId) state.selectedRoomId = null;
  lvl.updatedAt = Date.now();
  rebuildCellCache();
}
