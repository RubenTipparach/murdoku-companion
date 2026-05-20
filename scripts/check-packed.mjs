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

  // BFS from the first room; flag any unreached room as a separate cluster.
  const seen = new Set([lvl.rooms[0].id]);
  const stack = [lvl.rooms[0].id];
  while (stack.length) {
    const cur = stack.pop();
    for (const n of adj.get(cur)) if (!seen.has(n)) { seen.add(n); stack.push(n); }
  }
  const disconnected = lvl.rooms.filter((r) => !seen.has(r.id)).map((r) => r.id);

  const ok = isolated.length === 0 && disconnected.length === 0;
  console.log(`${ok ? 'PACKED' : 'SPREAD'} ${s.code} ${s.name}  (${roomCells} room cells in ${bboxArea}, ${density} dense)`);
  if (isolated.length) console.log(`  ISOLATED rooms: ${isolated.join(', ')}`);
  if (disconnected.length) console.log(`  DISCONNECTED clusters: ${disconnected.join(', ')}`);
  if (!ok) bad++;
}
process.exit(bad === 0 ? 0 : 1);
