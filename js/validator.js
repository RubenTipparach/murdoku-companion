// Canonical Murdoku level validator. Pure: no DOM, no state imports,
// no localStorage. Same module is consumed by:
//
//   - the browser's Share button (refuse to share invalid levels)
//   - the companion API (refuse to ingest invalid levels)
//
// Both callers pass a level object shaped like state.emptyLevel().
//
// `validateLevel(level)` returns { ok: boolean, errors: string[] }.
// Errors are short, human-readable strings the Share UI can list.

// Furniture cells the suspect IS allowed to share (sit / lie / soak,
// or wall-mounted decoration that lives in front of the cell, not on
// it).
const NON_BLOCKING_FURNITURE = new Set([
  'chair', 'armchair', 'sofa', 'bed', 'rug',
  'painting', 'mirror',
]);

// Furniture cells the suspect must NOT occupy. Drawn from CLAUDE.md
// game-rule 3. Anything not in NON_BLOCKING is treated as blocking
// (safer default for future furniture ids).
const BLOCKING_FURNITURE = new Set([
  'table', 'dresser', 'bookshelf', 'piano', 'lamp', 'plant',
  'fireplace', 'clock', 'gramophone', 'typewriter', 'safe',
]);

// Minimum number of suspects required for a level to feel like a
// puzzle. 3 is the smallest cast that still has logic.
const MIN_SUSPECTS = 3;

function isFurnitureBlocking(id) {
  if (!id) return false;
  if (NON_BLOCKING_FURNITURE.has(id)) return false;
  return true; // unknown ids treated as blocking
}

// Given a level and a "x,y" key, return the room id whose cells
// contain that coordinate. Null if the cell is not in any room.
function roomIdForCell(level, k) {
  const [x, y] = k.split(',').map(Number);
  for (const room of level.rooms || []) {
    for (const [rx, ry] of room.cells || []) {
      if (rx === x && ry === y) return room.id;
    }
  }
  return null;
}

export function validateLevel(level) {
  const errors = [];

  if (!level || typeof level !== 'object') {
    return { ok: false, errors: ['Level is empty.'] };
  }

  // ----- Basic shape -----
  if (typeof level.name !== 'string' || !level.name.trim()) {
    errors.push('Level needs a name.');
  }
  const size = Number(level.size);
  if (!Number.isInteger(size) || size < 4 || size > 14) {
    errors.push('Grid size must be between 4 and 14.');
  }
  if (!Array.isArray(level.rooms) || level.rooms.length === 0) {
    errors.push('Level needs at least one room.');
  }
  const solution = level.solution || {};
  const solKeys = Object.keys(solution);
  if (solKeys.length < MIN_SUSPECTS) {
    errors.push(`Level needs at least ${MIN_SUSPECTS} suspects placed in the solution.`);
  }

  // ----- Victim + killer assignment -----
  const victim = level.victim || null;
  const killer = level.killerSolution || null;
  if (!victim) errors.push('Pick a victim before sharing.');
  if (!killer) errors.push('Pick the killer (author-truth) before sharing.');
  if (victim && killer && victim === killer) {
    errors.push('The victim cannot also be the killer.');
  }

  // Every suspect referenced by the solution must have a cell, and the
  // victim + killer must both appear in the solution.
  const placedSuspectIds = new Set(Object.values(solution));
  if (victim && !placedSuspectIds.has(victim)) {
    errors.push('Victim is not placed on the grid.');
  }
  if (killer && !placedSuspectIds.has(killer)) {
    errors.push('Killer is not placed on the grid.');
  }

  // ----- Unique row AND column per suspect (canonical rule 1) -----
  const rowsSeen = new Map(); // y -> suspectId
  const colsSeen = new Map(); // x -> suspectId
  for (const k of solKeys) {
    const [x, y] = k.split(',').map(Number);
    const suspect = solution[k];
    if (rowsSeen.has(y) && rowsSeen.get(y) !== suspect) {
      errors.push(`Two suspects share row ${y + 1}. Every suspect needs a unique row.`);
    } else {
      rowsSeen.set(y, suspect);
    }
    if (colsSeen.has(x) && colsSeen.get(x) !== suspect) {
      errors.push(`Two suspects share column ${x + 1}. Every suspect needs a unique column.`);
    } else {
      colsSeen.set(x, suspect);
    }
  }

  // ----- No suspect on blocking furniture (canonical rule 3) -----
  const decorations = level.decorations || {};
  for (const k of solKeys) {
    const furnId = decorations[k];
    if (isFurnitureBlocking(furnId)) {
      errors.push(`A suspect is placed on a ${furnId}, which they would have to stand on top of. Move them to an adjacent cell.`);
    }
  }

  // ----- Killer alone with victim (canonical rule 2) -----
  // Find victim's cell + room, then assert every non-killer suspect
  // is in a different room.
  if (victim && killer) {
    let victimKey = null;
    let killerKey = null;
    for (const k of solKeys) {
      if (solution[k] === victim) victimKey = k;
      if (solution[k] === killer) killerKey = k;
    }
    const victimRoom = victimKey ? roomIdForCell(level, victimKey) : null;
    const killerRoom = killerKey ? roomIdForCell(level, killerKey) : null;
    if (!victimRoom) {
      errors.push('Victim is not placed inside any room.');
    }
    if (!killerRoom) {
      errors.push('Killer is not placed inside any room.');
    }
    if (victimRoom && killerRoom && victimRoom !== killerRoom) {
      errors.push('The killer must be in the same room as the victim.');
    }
    for (const k of solKeys) {
      const suspect = solution[k];
      if (suspect === victim || suspect === killer) continue;
      const room = roomIdForCell(level, k);
      if (!room) {
        errors.push('A suspect is placed outside any room.');
        continue;
      }
      if (victimRoom && room === victimRoom) {
        errors.push('Only the killer can share the victim\'s room. Move other suspects to different rooms.');
      }
    }
  }

  // ----- Every suspect has a clue -----
  const clues = level.clues || {};
  for (const suspectId of placedSuspectIds) {
    const c = clues[suspectId];
    if (typeof c !== 'string' || !c.trim()) {
      errors.push('Every suspect needs a clue.');
      break; // one error message is enough
    }
  }

  // Victim's clue should remind the player of the "alone with the
  // killer" rule. Lenient check: just look for the word "alone" or
  // "killer". The authoring rules say it's mandatory per CLAUDE.md.
  if (victim && typeof clues[victim] === 'string') {
    const v = clues[victim].toLowerCase();
    if (!v.includes('alone') && !v.includes('killer')) {
      errors.push('The victim\'s clue should say they were alone in the room with the killer.');
    }
  }

  return { ok: errors.length === 0, errors };
}

// Convenience: a single-string summary suitable for an alert() or a
// share-modal banner. Returns null when the level is valid.
export function validateLevelSummary(level) {
  const r = validateLevel(level);
  if (r.ok) return null;
  return r.errors.join('\n');
}
