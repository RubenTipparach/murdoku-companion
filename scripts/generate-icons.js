#!/usr/bin/env node
// Pixel-art badge icons for the in-game UI. Renders a gravestone for the
// victim and a bloody dagger for the killer, both 32×32 PNGs with
// transparent backgrounds. Output goes to assets/icons/.

'use strict';

const fs = require('fs');
const path = require('path');
const { encodePNG, Canvas } = require('./lib/pixel');

const W = 32, H = 32;

// ---------- palette ----------
const STONE       = [205, 198, 184, 255];
const STONE_DK    = [120, 110, 92, 255];
const STONE_SHADE = [160, 152, 138, 255];
const CARVE       = [54, 46, 36, 255];
const GRASS       = [80, 130, 60, 255];
const GRASS_DK    = [55, 92, 40, 255];
const SHADOW      = [0, 0, 0, 80];

const BLADE       = [228, 230, 234, 255];
const BLADE_DK    = [120, 124, 132, 255];
const BLADE_LT    = [255, 255, 255, 255];
const HANDLE      = [120, 70, 30, 255];
const HANDLE_DK   = [70, 40, 18, 255];
const HANDLE_LT   = [170, 110, 60, 255];
const POMMEL      = [205, 168, 88, 255];
const BLOOD       = [200, 30, 30, 255];
const BLOOD_DK    = [140, 18, 18, 255];

// ---------- shared helpers ----------
function setHLine(cv, x0, x1, y, c) {
  for (let x = x0; x <= x1; x++) cv.set(x, y, c);
}

// ---------- gravestone ----------
function drawGravestone(cv) {
  // ground shadow
  for (let x = 4; x <= 27; x++) cv.set(x, 29, SHADOW);
  for (let x = 6; x <= 25; x++) cv.set(x, 28, SHADOW);

  // The stone: rectangle 9..22 wide, 5..26 tall, with a rounded arch on top.
  // Arch rows (top of stone):
  const archRows = [
    [13, 18], // y=3 (narrowest)
    [11, 20], // y=4
    [10, 21], // y=5
    [ 9, 22], // y=6
  ];
  archRows.forEach(([x0, x1], i) => setHLine(cv, x0, x1, 3 + i, STONE));
  // Body rows
  for (let y = 7; y <= 25; y++) setHLine(cv, 9, 22, y, STONE);

  // Right-side shading band so the stone reads as 3D.
  for (let y = 6; y <= 25; y++) cv.set(22, y, STONE_DK);
  for (let y = 7; y <= 25; y++) cv.set(21, y, STONE_SHADE);

  // Top arch outline (dark pixels around the edge).
  cv.set(13, 3, STONE_DK); cv.set(18, 3, STONE_DK);
  cv.set(11, 4, STONE_DK); cv.set(20, 4, STONE_DK);
  cv.set(10, 5, STONE_DK); cv.set(21, 5, STONE_DK);
  cv.set( 9, 6, STONE_DK); cv.set(22, 6, STONE_DK);
  // Sides + bottom
  for (let y = 7; y <= 25; y++) cv.set(9, y, STONE_DK);
  setHLine(cv, 9, 22, 26, STONE_DK);

  // Highlight along the left edge.
  for (let y = 7; y <= 24; y++) cv.set(10, y, [232, 226, 212, 255]);
  cv.set(11, 6, [232, 226, 212, 255]);
  cv.set(12, 5, [232, 226, 212, 255]);

  // Carved cross.
  for (let y = 9; y <= 19; y++) { cv.set(15, y, CARVE); cv.set(16, y, CARVE); }
  setHLine(cv, 12, 19, 12, CARVE);
  setHLine(cv, 12, 19, 13, CARVE);

  // Ground / grass
  for (let x = 1; x <= 30; x++) cv.set(x, 27, GRASS);
  for (let x = 1; x <= 30; x++) cv.set(x, 28, GRASS_DK);
  // Grass tufts
  const tufts = [[3, 26], [7, 26], [25, 26], [29, 26]];
  for (const [x, y] of tufts) {
    cv.set(x, y, GRASS);
    cv.set(x, y - 1, GRASS_DK);
    cv.set(x + 1, y, GRASS_DK);
  }
}

// ---------- dagger ----------
function drawDagger(cv) {
  // Soft shadow under the blade.
  for (let i = 0; i < 14; i++) cv.set(3 + i, 28, SHADOW);

  // Blade: diagonal from (3,26) tip up to (18,11) base.
  // We draw two parallel diagonals and fill between.
  function bladeAt(x, y) {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    cv.set(x, y, BLADE);
  }
  for (let t = 0; t <= 15; t++) {
    const x = 4 + t;
    const y = 26 - t;
    bladeAt(x,    y);
    bladeAt(x + 1, y);
    bladeAt(x,    y - 1);
    bladeAt(x + 1, y - 1);
  }
  // Bevel highlight (lighter line down the spine of the blade).
  for (let t = 1; t <= 13; t++) cv.set(5 + t, 25 - t, BLADE_LT);
  // Darker edge along the cutting side.
  for (let t = 0; t <= 14; t++) cv.set(4 + t, 27 - t, BLADE_DK);
  // Tip
  cv.set(3, 27, BLADE_DK);
  cv.set(4, 26, BLADE_DK);

  // Guard / cross-bar (perpendicular to blade, near base).
  // Diagonal rectangle from roughly (17,12) to (21,8).
  const guardPts = [
    [16, 13], [17, 12], [18, 11], [19, 10], [20, 9],
    [17, 14], [18, 13], [19, 12], [20, 11], [21, 10],
  ];
  for (const [x, y] of guardPts) cv.set(x, y, HANDLE_DK);
  cv.set(16, 14, HANDLE_DK); cv.set(21, 9, HANDLE_DK);

  // Handle (continuation past the guard, brown).
  const handlePts = [
    [19, 9], [20, 8], [21, 7], [22, 6], [23, 5],
    [20, 10], [21, 9], [22, 8], [23, 7], [24, 6],
  ];
  for (const [x, y] of handlePts) cv.set(x, y, HANDLE);
  // Handle highlight
  cv.set(20, 9, HANDLE_LT);
  cv.set(21, 8, HANDLE_LT);
  cv.set(22, 7, HANDLE_LT);

  // Pommel (round cap at the end).
  cv.set(24, 5, POMMEL); cv.set(25, 4, POMMEL);
  cv.set(25, 5, POMMEL); cv.set(24, 4, POMMEL);
  cv.set(25, 3, POMMEL); cv.set(26, 4, POMMEL);
  cv.set(24, 3, HANDLE_DK); cv.set(26, 5, HANDLE_DK);

  // Blood drops at the tip.
  cv.set(2, 28, BLOOD);
  cv.set(3, 29, BLOOD);
  cv.set(4, 30, BLOOD_DK);
  cv.set(1, 29, BLOOD_DK);
}

function main() {
  const outDir = path.resolve(__dirname, '..', 'assets', 'icons');
  fs.mkdirSync(outDir, { recursive: true });

  const stone = new Canvas(W, H);
  drawGravestone(stone);
  fs.writeFileSync(path.join(outDir, 'victim.png'), encodePNG(W, H, stone.data));

  const knife = new Canvas(W, H);
  drawDagger(knife);
  fs.writeFileSync(path.join(outDir, 'killer.png'), encodePNG(W, H, knife.data));

  process.stdout.write('wrote assets/icons/victim.png and killer.png\n');
}

main();
