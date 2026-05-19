// Play-mode handlers and win check.

import { state, activeLevel, key, roomAt } from './state.js';

export function handleCellClickPlay(x, y) {
  const lvl = activeLevel();
  if (!lvl) return;
  // Can't place outside a room.
  if (!roomAt(x, y)) return;

  const k = key(x, y);
  const sel = state.selectedCharacterId;
  const current = lvl.playerPlacement[k];
  if (!sel) {
    if (current) { delete lvl.playerPlacement[k]; lvl.updatedAt = Date.now(); }
    return;
  }
  if (current === sel) {
    delete lvl.playerPlacement[k];
  } else {
    lvl.playerPlacement[k] = sel;
  }
  lvl.updatedAt = Date.now();
}

export function checkSolution() {
  const lvl = activeLevel();
  if (!lvl) return null;
  const solKeys = new Set(Object.keys(lvl.solution));
  const playKeys = new Set(Object.keys(lvl.playerPlacement));
  const all = new Set([...solKeys, ...playKeys]);
  const wrong = [];
  for (const k of all) {
    if (lvl.solution[k] !== lvl.playerPlacement[k]) wrong.push(k);
  }
  const win = wrong.length === 0 && solKeys.size > 0;
  return { win, wrong };
}

// Briefly tint mismatched cells in the DOM.
export function highlightCells(wrong) {
  for (const c of document.querySelectorAll('.cell')) {
    c.classList.remove('mismatch', 'correct');
  }
  if (!wrong) return;
  const wrongSet = new Set(wrong);
  for (const cellEl of document.querySelectorAll('.cell')) {
    const k = `${cellEl.dataset.x},${cellEl.dataset.y}`;
    if (wrongSet.has(k)) cellEl.classList.add('mismatch');
  }
}

export function clearPlayBoard() {
  const lvl = activeLevel();
  if (!lvl) return;
  lvl.playerPlacement = {};
  lvl.updatedAt = Date.now();
}
