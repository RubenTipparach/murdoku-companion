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

// Generic helpers ----------------------------------------------------
const flankedHorizontal = (kind) => (x, y, l) =>
  isRug(l, x, y) && has(l, x - 1, y, kind) && has(l, x + 1, y, kind);
const flankedVertical = (kind) => (x, y, l) =>
  isRug(l, x, y) && has(l, x, y - 1, kind) && has(l, x, y + 1, kind);
const armchairWith = (dx, dy, kind) => (x, y, l) =>
  isArmchair(l, x, y) && has(l, x + dx, y + dy, kind);
const rugWith = (dx, dy, kind) => (x, y, l) =>
  isRug(l, x, y) && has(l, x + dx, y + dy, kind);

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
  const charIds = placeOrder[lvl.code] || Object.keys(preds);
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
      // Inter-suspect row/col pinches encoded per level. Each killer's
      // clue spells out a row/col relation to another suspect; we apply
      // it here so the verifier honours the same constraint a player
      // would deduce from the clue text.
      const pinch = interPinches[lvl.code];
      if (pinch && pinch[id]) {
        const ok = pinch[id](x, y, assignment);
        if (!ok) continue;
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
// m11 clue predicates
const m11Preds = {
  // Pell: rug flanked left + right by writing desks
  'char-17': flankedHorizontal('table'),
  // Finch: armchair + brazier directly to right
  'char-14': armchairWith(1, 0, 'brazier'),
  // Voss: rug + table directly to right + dresser directly below
  'char-11': (x, y, l) =>
    isRug(l, x, y) && has(l, x + 1, y, 'table') && has(l, x, y + 1, 'dresser'),
  // Quint: rug flanked left + right by bookshelves
  'char-03': flankedHorizontal('bookshelf'),
  // Marchand: armchair + chart table directly above
  'char-09': armchairWith(0, -1, 'table'),
  // Yew: rug + potted ferns above AND below
  'char-15': flankedVertical('plant'),
};

// m12 clue predicates
const m12Preds = {
  // Hask (victim): rug + war table directly to right
  'char-12': rugWith(1, 0, 'table'),
  // Knox (killer): chair + brazier left + cauldron below
  'char-18': (x, y, l) =>
    (decAt(l, x, y) === 'chair' || isArmchair(l, x, y)) &&
    has(l, x - 1, y, 'brazier') &&
    has(l, x, y + 1, 'cauldron'),
  // Imogen: armchair flanked left + right by chairs
  'char-19': (x, y, l) =>
    isArmchair(l, x, y) && has(l, x - 1, y, 'chair') && has(l, x + 1, y, 'chair'),
  // Glover (butler): rug + bookshelf above + chair below
  'char-06': (x, y, l) =>
    isRug(l, x, y) && has(l, x, y - 1, 'bookshelf') && has(l, x, y + 1, 'chair'),
  // Ardent: chair + bookshelf above + dresser right
  'char-08': (x, y, l) =>
    decAt(l, x, y) === 'chair' &&
    has(l, x, y - 1, 'bookshelf') &&
    has(l, x + 1, y, 'dresser'),
  // Beatrice: rug + hearth directly below
  'char-07': rugWith(0, 1, 'fireplace'),
  // Felix: any sofa
  'char-20': (x, y, l) => decAt(l, x, y) === 'sofa',
  // Silas: rug + anvil directly above
  'char-16': rugWith(0, -1, 'anvil'),
};

// m13 clue predicates
const m13Preds = {
  // Wraithmoor: rug + stone altar (table) directly above
  'char-01': rugWith(0, -1, 'table'),
  // Crowe (killer): armchair + cauldron left + brazier right
  'char-10': (x, y, l) =>
    isArmchair(l, x, y) &&
    has(l, x - 1, y, 'cauldron') &&
    has(l, x + 1, y, 'brazier'),
  // Yew: rug + potted fern directly above (simplified, was 4-sided)
  'char-15': rugWith(0, -1, 'plant'),
  // Penn: sofa (any sofa)
  'char-04': (x, y, l) => decAt(l, x, y) === 'sofa',
  // Voss: armchair + banner directly to left
  'char-11': armchairWith(-1, 0, 'banner'),
  // Finch: rug + chest above + dresser below
  'char-14': (x, y, l) =>
    isRug(l, x, y) && has(l, x, y - 1, 'chest') && has(l, x, y + 1, 'dresser'),
};

// m14 clue predicates
const m14Preds = {
  // Pell: rug + reliquary table directly above
  'char-17': rugWith(0, -1, 'table'),
  // Hask: armchair + brazier left + cauldron right
  'char-12': (x, y, l) =>
    isArmchair(l, x, y) &&
    has(l, x - 1, y, 'brazier') &&
    has(l, x + 1, y, 'cauldron'),
  // Bramwell: rug flanked left + right by bookshelves
  'char-13': flankedHorizontal('bookshelf'),
  // Yew: rug + anvil directly to left
  'char-15': rugWith(-1, 0, 'anvil'),
  // Crowe: sofa (any)
  'char-10': (x, y, l) => decAt(l, x, y) === 'sofa',
};

// m15 clue predicates
const m15Preds = {
  // Hask: rug + anvil directly above
  'char-12': rugWith(0, -1, 'anvil'),
  // Knox: armchair + brazier directly above
  'char-18': armchairWith(0, -1, 'brazier'),
  // Marchand: armchair flanked left + right by chairs
  'char-09': (x, y, l) =>
    isArmchair(l, x, y) && has(l, x - 1, y, 'chair') && has(l, x + 1, y, 'chair'),
  // Felix: sofa
  'char-20': (x, y, l) => decAt(l, x, y) === 'sofa',
  // Beatrice: rug + hearth directly to left
  'char-07': rugWith(-1, 0, 'fireplace'),
};

// m16 clue predicates
const m16Preds = {
  // Ardent: rug + war-banner (banner) directly above
  'char-08': rugWith(0, -1, 'banner'),
  // Glover: armchair + banner directly above
  'char-06': armchairWith(0, -1, 'banner'),
  // Imogen: rug flanked left + right by bookshelves
  'char-19': flankedHorizontal('bookshelf'),
  // Bramwell: armchair + brazier directly to right
  'char-13': armchairWith(1, 0, 'brazier'),
  // Yew: rug + banner directly to right
  'char-15': rugWith(1, 0, 'banner'),
  // Roe: rug + anvil directly to left
  'char-16': rugWith(-1, 0, 'anvil'),
};

// Row / column rules are implicit in the puzzle (every suspect on a
// unique row + column, killer alone with victim). Authors must NEVER
// spell those out in clue text, so the verifier doesn't carry any
// inter-suspect pinch constraints either. Uniqueness must fall out of
// candidate cells + unique-row/col + killer-alone-with-victim alone.
const interPinches = {};

// Order matters: pinches reference other suspects, so the referenced
// suspect must be placed first. Per-level placement order.
const placeOrder = {
  m10: ['char-05', 'char-04', 'char-13', 'char-10', 'char-15', 'char-08', 'char-16'],
  m11: ['char-09', 'char-03', 'char-11', 'char-17', 'char-14', 'char-15'],
  m12: ['char-06', 'char-20', 'char-16', 'char-18', 'char-12', 'char-19', 'char-08', 'char-07'],
  m13: ['char-14', 'char-10', 'char-01', 'char-15', 'char-04', 'char-11'],
  m14: ['char-17', 'char-12', 'char-13', 'char-15', 'char-10'],
  m15: ['char-20', 'char-18', 'char-12', 'char-09', 'char-07'],
  m16: ['char-08', 'char-06', 'char-19', 'char-13', 'char-15', 'char-16'],
};

const predsByCode = {
  m10: m10Preds,
  m11: m11Preds,
  m12: m12Preds,
  m13: m13Preds,
  m14: m14Preds,
  m15: m15Preds,
  m16: m16Preds,
};
const preds = predsByCode[code];
if (!preds) {
  console.error(`No predicate set defined for ${code} yet.`);
  process.exit(1);
}
solveLevel(lvl, preds, killerRoomConstraint(lvl.victim, lvl.killerSolution));
