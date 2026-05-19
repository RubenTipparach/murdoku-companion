// Grid rendering. Recomputes wall/doorway state on each render.

import {
  GRID,
  state,
  activeLevel,
  key,
  roomAt,
  hasDoorway,
  edgeKey,
} from './state.js';
import { findFurniture } from './decor.js';

const SIDES = ['top', 'right', 'bottom', 'left'];

function neighbor(x, y, side) {
  switch (side) {
    case 'top':    return y > 0 ? { x, y: y - 1 } : null;
    case 'right':  return x < GRID - 1 ? { x: x + 1, y } : null;
    case 'bottom': return y < GRID - 1 ? { x, y: y + 1 } : null;
    case 'left':   return x > 0 ? { x: x - 1, y } : null;
  }
}

// Wall between cell (x,y) and its neighbor on `side`.
function isWall(x, y, side) {
  const self = roomAt(x, y);
  const n = neighbor(x, y, side);
  if (!n) {
    // Edge of the grid. Wall only if the cell is inside a room.
    return !!self;
  }
  const other = roomAt(n.x, n.y);
  if (!self && !other) return false;        // outside-outside
  if (self && other && self.id === other.id) return false; // same room
  return true;                              // outside-room or room-room
}

// Identify the "anchor" cell of a room: bottom-most row, then the median x in
// that row. Mirrors the published Murdoku layout where room names sit along
// the bottom of each room.
function roomLabelAnchor(room) {
  if (!room.cells.length) return null;
  const maxY = Math.max(...room.cells.map((c) => c[1]));
  const bottom = room.cells.filter((c) => c[1] === maxY).map((c) => c[0]).sort((a, b) => a - b);
  const midX = bottom[Math.floor(bottom.length / 2)];
  return [midX, maxY];
}

export function renderGrid(container, handlers) {
  const lvl = activeLevel();
  container.innerHTML = '';
  if (!lvl) return;

  // Pre-compute anchor lookup so we can place a label on exactly one cell.
  const anchors = new Map();
  for (const room of lvl.rooms) {
    const a = roomLabelAnchor(room);
    if (a) anchors.set(key(a[0], a[1]), room);
  }

  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const cell = document.createElement('div');
      cell.className = 'cell';
      cell.dataset.x = x;
      cell.dataset.y = y;

      const room = roomAt(x, y);
      if (room) {
        cell.classList.add('in-room');
        cell.style.setProperty('--room-color', room.color);
        if (room.tilePattern && room.tilePattern !== 'solid') {
          cell.classList.add(`tile-${room.tilePattern}`);
        }
      } else {
        cell.classList.add('outside');
      }

      // Furniture decoration (rendered behind the portrait layer).
      const decoId = lvl.decorations && lvl.decorations[key(x, y)];
      if (room && decoId) {
        const f = findFurniture(decoId);
        if (f) {
          const dec = document.createElement('div');
          dec.className = 'furniture';
          dec.style.backgroundImage = `url('${f.sprite}')`;
          dec.title = f.name;
          cell.appendChild(dec);
        }
      }

      // Walls and doorways.
      for (const side of SIDES) {
        if (isWall(x, y, side)) {
          const w = document.createElement('div');
          w.className = `wall ${side}`;
          if (hasDoorway(x, y, side)) w.classList.add('doorway');
          cell.appendChild(w);
        }
      }

      // Portrait (solution in edit mode; playerPlacement in play mode).
      const k = key(x, y);
      let charId = null;
      if (state.mode === 'edit') {
        charId = lvl.solution[k] || null;
        if (charId) cell.classList.add('solution-marker');
      } else {
        charId = lvl.playerPlacement[k] || null;
      }
      if (charId) {
        const char = state.characters.find((c) => c.id === charId);
        if (char) {
          const p = document.createElement('div');
          p.className = 'portrait';
          // data-char-id lets the FLIP animator track a portrait across
          // re-renders and slide it between cells.
          p.dataset.charId = charId;
          p.style.backgroundImage = `url('${char.portrait}')`;
          p.title = char.name;
          cell.appendChild(p);
          // Highlight the cell when its character is the currently-selected
          // suspect so players can see where they've already placed them.
          if (state.selectedCharacterId === charId) {
            cell.classList.add('suspect-selected');
          }
        }
      }

      // Doorway tool: per-side click overlays. Only show on cells that already
      // have at least one wall (otherwise a doorway here is meaningless).
      if (state.mode === 'edit' && state.tool === 'doorway') {
        for (const side of SIDES) {
          if (!isWall(x, y, side)) continue;
          if (!edgeKey(x, y, side)) continue;
          const e = document.createElement('div');
          e.className = `edge-pick ${side}`;
          e.dataset.side = side;
          cell.appendChild(e);
        }
      }

      // Room label, at the anchor cell only. Suppressed entirely when the
      // global "show room names" toggle is off.
      if (state.showRoomNames) {
        const anchorRoom = anchors.get(k);
        if (anchorRoom && anchorRoom.name && anchorRoom.name.trim() !== '') {
          const label = document.createElement('div');
          label.className = 'room-label';
          label.textContent = anchorRoom.name;
          cell.appendChild(label);
        }
      }

      container.appendChild(cell);
    }
  }

  // Event wiring is added once at boot via delegation; nothing to attach here.
}
