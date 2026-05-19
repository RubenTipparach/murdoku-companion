// Play-mode handlers and win check.

import { state, activeLevel, key, roomAt, placeCharacterAt } from './state.js';

export function handleCellClickPlay(x, y) {
  const lvl = activeLevel();
  if (!lvl) return;
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
    lvl.updatedAt = Date.now();
  } else {
    // placeCharacterAt enforces the one-cell-per-character rule so the
    // suspect "moves" from their previous cell to this one.
    placeCharacterAt(x, y, sel);
  }
}

export function checkSolution() {
  const lvl = activeLevel();
  if (!lvl) return null;
  const solKeys = new Set(Object.keys(lvl.solution));
  // Cells the player has actually placed something on. We only ever
  // highlight these — missing-but-expected cells are NOT marked, since
  // outlining them lights up half the board mid-puzzle.
  const correct = [];
  const wrong = [];
  for (const k of Object.keys(lvl.playerPlacement)) {
    if (lvl.solution[k] === lvl.playerPlacement[k]) correct.push(k);
    else wrong.push(k);
  }
  // Did the player place every suspect the solution expects?
  const missingCount = [...solKeys].filter((k) => !(k in lvl.playerPlacement)).length;
  // Killer accusation: only enforced if the level defines a killer.
  const killerWrong = lvl.killerSolution
    ? lvl.playerKiller !== lvl.killerSolution
    : false;
  const win =
    wrong.length === 0 &&
    missingCount === 0 &&
    solKeys.size > 0 &&
    !killerWrong;
  return { win, correct, wrong, missingCount, killerWrong };
}

// Outline the player's placed cells per Check-Solution result.
// `correct` = placed and matches solution → green
// `wrong`   = placed and does NOT match  → red
// Empty cells (no player placement) are NEVER outlined.
export function highlightCells({ correct = [], wrong = [] } = {}) {
  for (const c of document.querySelectorAll('.cell')) {
    c.classList.remove('mismatch', 'correct');
  }
  const correctSet = new Set(correct);
  const wrongSet = new Set(wrong);
  for (const cellEl of document.querySelectorAll('.cell')) {
    const k = `${cellEl.dataset.x},${cellEl.dataset.y}`;
    if (correctSet.has(k)) cellEl.classList.add('correct');
    else if (wrongSet.has(k)) cellEl.classList.add('mismatch');
  }
}

export function clearPlayBoard() {
  const lvl = activeLevel();
  if (!lvl) return;
  lvl.playerPlacement = {};
  lvl.updatedAt = Date.now();
}
