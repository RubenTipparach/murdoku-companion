// Ad-hoc solver: enumerate every assignment of suspects to candidate
// cells (derived from each suspect's clue anchor) and report how many
// satisfy: unique row, unique col, killer + victim share a room, and
// no other suspect is in that room. Used to verify medium-tier
// puzzles remain uniquely solvable after duplicating clue anchors.

import { SAMPLES, buildSampleLevel } from '../js/sample.js';

function cellsOfRoom(lvl, roomId) {
  const r = lvl.rooms.find((r) => r.id === roomId);
  return r ? new Set(r.cells.map(([x, y]) => `${x},${y}`)) : new Set();
}

function roomOfCell(lvl, k) {
  for (const r of lvl.rooms) {
    for (const [x, y] of r.cells) if (`${x},${y}` === k) return r.id;
  }
  return null;
}

// Predicates that match each clue's anchor pattern. Keep these in
// sync with the clue text. Returns the set of (x, y) cells consistent
// with the predicate, restricted to in-house cells.
function candidateCells(lvl, predicate) {
  const inHouse = new Set();
  for (const r of lvl.rooms) for (const [x, y] of r.cells) inHouse.add(`${x},${y}`);
  const out = [];
  for (const k of inHouse) {
    const [x, y] = k.split(',').map(Number);
    if (predicate(x, y, lvl, inHouse)) out.push(k);
  }
  return out;
}

const decAt = (lvl, x, y) => lvl.decorations[`${x},${y}`] || null;
const isArmchair = (lvl, x, y) => decAt(lvl, x, y) === 'armchair';
const isRug = (lvl, x, y) => decAt(lvl, x, y) === 'rug';
const has = (lvl, x, y, kind) => decAt(lvl, x, y) === kind;

// m10 clue predicates
const m10Preds = {
  // Sable: rug + table directly below
  'char-05': (x, y, l) => isRug(l, x, y) && has(l, x, y + 1, 'table'),
  // Penn: armchair + table directly to right + row constraint applied later
  'char-04': (x, y, l) => isArmchair(l, x, y) && has(l, x + 1, y, 'table'),
  // Bramwell: armchair + hearth directly to right
  'char-13': (x, y, l) => isArmchair(l, x, y) && has(l, x + 1, y, 'fireplace'),
  // Crowe: armchair + bookshelf directly above
  'char-10': (x, y, l) => isArmchair(l, x, y) && has(l, x, y - 1, 'bookshelf'),
  // Yew: rug + plant directly above
  'char-15': (x, y, l) => isRug(l, x, y) && has(l, x, y - 1, 'plant'),
  // Ardent: armchair + banner directly above
  'char-08': (x, y, l) => isArmchair(l, x, y) && has(l, x, y - 1, 'banner'),
  // Roe: rug + clock directly to right
  'char-16': (x, y, l) => isRug(l, x, y) && has(l, x + 1, y, 'clock'),
};

function solveLevel(lvl, preds, extraConstraints = () => true) {
  const charIds = Object.keys(preds);
  const candidates = {};
  for (const id of charIds) candidates[id] = candidateCells(lvl, preds[id]);

  console.log(`Level ${lvl.code}: ${lvl.name}`);
  for (const id of charIds) {
    console.log(`  ${id}: ${candidates[id].length} cells: ${candidates[id].join(' | ')}`);
  }

  const solutions = [];
  const usedRows = new Set();
  const usedCols = new Set();
  const assignment = {};

  function backtrack(idx) {
    if (idx === charIds.length) {
      if (!extraConstraints(assignment, lvl)) return;
      solutions.push({ ...assignment });
      return;
    }
    const id = charIds[idx];
    for (const k of candidates[id]) {
      const [x, y] = k.split(',').map(Number);
      if (usedRows.has(y) || usedCols.has(x)) continue;
      // Inter-suspect predicate: Penn must be one row below Sable.
      if (id === 'char-04' && assignment['char-05']) {
        const [, sy] = assignment['char-05'].split(',').map(Number);
        if (y !== sy + 1) continue;
      }
      usedRows.add(y);
      usedCols.add(x);
      assignment[id] = k;
      backtrack(idx + 1);
      delete assignment[id];
      usedRows.delete(y);
      usedCols.delete(x);
    }
  }
  backtrack(0);
  console.log(`  ${solutions.length} solution(s)`);
  if (solutions.length !== 1) {
    for (const s of solutions) console.log('   ', s);
  } else {
    console.log('   ', solutions[0]);
  }
  return solutions;
}

function killerRoomConstraint(victimId, killerId) {
  return (assignment, lvl) => {
    const vk = assignment[victimId];
    const kk = assignment[killerId];
    const vroom = roomOfCell(lvl, vk);
    const kroom = roomOfCell(lvl, kk);
    if (vroom !== kroom) return false;
    for (const id of Object.keys(assignment)) {
      if (id === victimId || id === killerId) continue;
      const r = roomOfCell(lvl, assignment[id]);
      if (r === vroom) return false;
    }
    return true;
  };
}

const code = process.argv[2] || 'm10';
const sample = SAMPLES.find((s) => s.code === code);
if (!sample) {
  console.error(`Unknown code ${code}`);
  process.exit(1);
}
const lvl = buildSampleLevel(sample.key);
lvl.code = sample.code;
lvl.name = sample.name;
const predsByCode = { m10: m10Preds };
const preds = predsByCode[code];
if (!preds) {
  console.error(`No predicate set defined for ${code} yet.`);
  process.exit(1);
}
solveLevel(lvl, preds, killerRoomConstraint(lvl.victim, lvl.killerSolution));
