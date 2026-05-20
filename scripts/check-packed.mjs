#!/usr/bin/env node
// Verifies every shipped sample is "packed", per the user's
// definition: every room must share at least one orthogonal wall
// with another room (no floating-island rooms). Also reports the
// room-cells-to-bounding-box density as informational.
//
// Run from repo root:    node scripts/check-packed.mjs
// Exits non-zero if any sample has an isolated or disconnected room.
//
// Both easy and medium tiers must pass: a corridor between two
// rooms is itself a room (a tiny "Hallway" cell sequence), so the
// adjacency rule still holds.

import { SAMPLES } from '../js/sample.js';

let bad = 0;
for (const s of SAMPLES) {
  const lvl = s.build();
  const cellRoom = new Map();
  for (const r of lvl.rooms) for (const [x, y] of r.cells) cellRoom.set(`${x},${y}`, r.id);

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k of cellRoom.keys()) {
    const [x, y] = k.split(',').map(Number);
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  const bboxArea = (maxX - minX + 1) * (maxY - minY + 1);
  const roomCells = cellRoom.size;
  const density = ((roomCells / bboxArea) * 100).toFixed(0) + '%';

  // Build the room-adjacency graph.
  const adj = new Map();
  for (const r of lvl.rooms) adj.set(r.id, new Set());
  for (const k of cellRoom.keys()) {
    const [x, y] = k.split(',').map(Number);
    const mine = cellRoom.get(k);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const theirs = cellRoom.get(`${x + dx},${y + dy}`);
      if (theirs && theirs !== mine) {
        adj.get(mine).add(theirs);
        adj.get(theirs).add(mine);
      }
    }
  }
  const isolated = [...adj.entries()].filter(([, n]) => n.size === 0).map(([id]) => id);

  // Enumerate every connected component of the room-adjacency
  // graph so we can report how many disjoint clusters there are,
  // not just "everything that isn't in the first cluster".
  const remaining = new Set(lvl.rooms.map((r) => r.id));
  const clusters = [];
  while (remaining.size > 0) {
    const seed = remaining.values().next().value;
    const seen = new Set([seed]);
    const stack = [seed];
    while (stack.length) {
      const cur = stack.pop();
      for (const n of adj.get(cur)) if (!seen.has(n)) { seen.add(n); stack.push(n); }
    }
    clusters.push([...seen]);
    for (const id of seen) remaining.delete(id);
  }

  // Minimum room-cell-count target per difficulty tier. Easy levels
  // need to feel like a real house; medium levels need more space
  // to host the harder puzzles. Below threshold is a validator fail.
  const minCells = s.difficulty === 'medium' ? 80 : 50;
  const sizeOk = roomCells >= minCells;

  const ok = isolated.length === 0 && clusters.length === 1 && sizeOk;
  console.log(`${ok ? 'PACKED' : 'SPREAD'} ${s.code} ${s.name}  (${roomCells} room cells, target >= ${minCells}; ${clusters.length} cluster${clusters.length === 1 ? '' : 's'}, ${density} dense)`);
  if (!sizeOk) console.log(`  TOO SMALL: ${roomCells} < ${minCells} room cells for tier "${s.difficulty}"`);
  if (isolated.length) console.log(`  ISOLATED rooms: ${isolated.join(', ')}`);
  if (clusters.length > 1) {
    for (let i = 0; i < clusters.length; i++) {
      console.log(`  cluster ${i + 1}: ${clusters[i].join(', ')}`);
    }
  }
  if (!ok) bad++;
}
process.exit(bad === 0 ? 0 : 1);
