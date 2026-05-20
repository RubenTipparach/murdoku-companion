#!/usr/bin/env node
// Procedural pixel-art furniture generator for Murdoku.
// Writes 12 transparent-background PNGs into assets/furniture/ plus a
// manifest.json. Each sprite is 32x32, drawn from a hand-written routine
// that uses the shared pixel/canvas helpers.

'use strict';

const fs = require('fs');
const path = require('path');
const { encodePNG, Canvas, mulberry32, darken, lighten } = require('./lib/pixel');

const W = 32, H = 32;

// ---------- Palettes ----------

const WOOD       = [128, 78, 42, 255];
const WOOD_DARK  = [88, 50, 26, 255];
const WOOD_LIGHT = [170, 116, 70, 255];

const METAL      = [120, 120, 134, 255];
const METAL_DARK = [70, 70, 84, 255];

const SHADOW     = [0, 0, 0, 80];

const PASTELS = [
  [200, 130, 150, 255], [140, 170, 200, 255], [180, 200, 140, 255],
  [220, 200, 130, 255], [200, 170, 200, 255], [150, 200, 190, 255],
];

// ---------- Draw helpers ----------

function pickColor(rng, list) { return list[Math.floor(rng() * list.length)]; }

function shadowAt(cv, x, y, w, h) {
  cv.fillRect(x, y, w, h, SHADOW);
}

// ---------- Sprite routines ----------

function drawChair(cv, rng) {
  const fabric = pickColor(rng, PASTELS);
  // Floor shadow.
  cv.fillEllipse(16, 28, 10, 2, SHADOW);
  // Back.
  cv.fillRect(11, 6, 10, 14, WOOD);
  cv.fillRect(11, 6, 10, 2, WOOD_DARK);
  // Back cushion strip.
  cv.fillRect(13, 10, 6, 8, fabric);
  cv.fillRect(13, 10, 6, 1, lighten(fabric, 0.3));
  // Seat.
  cv.fillRect(9, 18, 14, 5, WOOD);
  cv.fillRect(9, 18, 14, 1, WOOD_LIGHT);
  cv.fillRect(10, 19, 12, 3, fabric);
  // Legs.
  cv.fillRect(10, 23, 2, 5, WOOD_DARK);
  cv.fillRect(20, 23, 2, 5, WOOD_DARK);
}

function drawArmchair(cv, rng) {
  const fabric = pickColor(rng, PASTELS);
  cv.fillEllipse(16, 28, 12, 2, SHADOW);
  // Backrest hump.
  cv.fillRect(7, 6, 18, 12, fabric);
  cv.fillEllipse(16, 6, 9, 4, fabric);
  cv.fillRect(7, 6, 18, 2, darken(fabric, 0.7));
  // Arms.
  cv.fillRect(5, 12, 4, 12, darken(fabric, 0.8));
  cv.fillRect(23, 12, 4, 12, darken(fabric, 0.8));
  // Seat cushion.
  cv.fillRect(9, 16, 14, 8, fabric);
  cv.fillRect(9, 16, 14, 1, lighten(fabric, 0.3));
  // Legs.
  cv.fillRect(6, 24, 2, 4, WOOD_DARK);
  cv.fillRect(24, 24, 2, 4, WOOD_DARK);
}

function drawSofa(cv, rng) {
  const fabric = pickColor(rng, PASTELS);
  cv.fillEllipse(16, 29, 14, 2, SHADOW);
  cv.fillRect(3, 10, 26, 14, fabric);
  cv.fillRect(3, 10, 26, 2, darken(fabric, 0.7));
  // Back cushions.
  cv.fillRect(5, 12, 7, 6, lighten(fabric, 0.15));
  cv.fillRect(13, 12, 7, 6, lighten(fabric, 0.15));
  cv.fillRect(21, 12, 6, 6, lighten(fabric, 0.15));
  // Seat cushions.
  cv.fillRect(4, 18, 9, 6, lighten(fabric, 0.1));
  cv.fillRect(14, 18, 9, 6, lighten(fabric, 0.1));
  // Arms.
  cv.fillRect(2, 14, 2, 10, darken(fabric, 0.8));
  cv.fillRect(28, 14, 2, 10, darken(fabric, 0.8));
  // Legs.
  cv.fillRect(4, 24, 2, 3, WOOD_DARK);
  cv.fillRect(26, 24, 2, 3, WOOD_DARK);
}

function drawBed(cv, rng) {
  const sheet = pickColor(rng, PASTELS);
  cv.fillEllipse(16, 29, 14, 2, SHADOW);
  // Frame.
  cv.fillRect(3, 11, 26, 14, WOOD);
  cv.fillRect(3, 11, 26, 2, WOOD_LIGHT);
  cv.fillRect(3, 23, 26, 2, WOOD_DARK);
  // Mattress.
  cv.fillRect(5, 13, 22, 10, sheet);
  cv.fillRect(5, 13, 22, 1, lighten(sheet, 0.3));
  // Pillow.
  cv.fillRect(7, 14, 8, 5, [240, 240, 240, 255]);
  cv.fillRect(7, 14, 8, 1, [200, 200, 200, 255]);
  // Blanket fold.
  cv.fillRect(15, 19, 12, 4, darken(sheet, 0.7));
  // Legs / posts.
  cv.fillRect(3, 25, 2, 3, WOOD_DARK);
  cv.fillRect(27, 25, 2, 3, WOOD_DARK);
}

function drawTable(cv, _rng) {
  cv.fillEllipse(16, 28, 12, 2, SHADOW);
  cv.fillRect(4, 12, 24, 5, WOOD);
  cv.fillRect(4, 12, 24, 1, WOOD_LIGHT);
  cv.fillRect(4, 16, 24, 1, WOOD_DARK);
  // Legs.
  cv.fillRect(5, 17, 2, 11, WOOD_DARK);
  cv.fillRect(25, 17, 2, 11, WOOD_DARK);
  cv.fillRect(14, 17, 2, 8, WOOD_DARK);
}

function drawDresser(cv, _rng) {
  cv.fillEllipse(16, 29, 12, 2, SHADOW);
  cv.fillRect(5, 6, 22, 22, WOOD);
  cv.fillRect(5, 6, 22, 1, WOOD_LIGHT);
  // Drawers.
  for (let i = 0; i < 3; i++) {
    const y = 9 + i * 6;
    cv.fillRect(7, y, 18, 5, lighten(WOOD, 0.2));
    cv.fillRect(7, y, 18, 1, WOOD_DARK);
    // Handles.
    cv.fillRect(14, y + 2, 4, 1, METAL);
  }
  // Feet.
  cv.fillRect(5, 28, 3, 2, WOOD_DARK);
  cv.fillRect(24, 28, 3, 2, WOOD_DARK);
}

function drawBookshelf(cv, rng) {
  cv.fillEllipse(16, 29, 10, 2, SHADOW);
  cv.fillRect(6, 3, 20, 26, WOOD_DARK);
  cv.fillRect(8, 5, 16, 22, [60, 40, 24, 255]); // interior dark
  // Shelves.
  for (let row = 0; row < 4; row++) {
    const y = 5 + row * 6;
    cv.fillRect(6, y + 5, 20, 1, WOOD_DARK);
    // Books on each shelf.
    let x = 8;
    while (x < 23) {
      const w = 1 + Math.floor(rng() * 3);
      const h = 3 + Math.floor(rng() * 2);
      const c = pickColor(rng, PASTELS);
      cv.fillRect(x, y + 5 - h, w, h, c);
      cv.fillRect(x, y + 5 - h, w, 1, lighten(c, 0.3));
      x += w + 1;
    }
  }
}

function drawPiano(cv, _rng) {
  cv.fillEllipse(16, 29, 12, 2, SHADOW);
  // Body.
  cv.fillRect(3, 6, 26, 16, [30, 26, 32, 255]);
  cv.fillRect(3, 6, 26, 1, [80, 76, 86, 255]);
  // Music stand top.
  cv.fillRect(7, 4, 18, 3, [40, 36, 42, 255]);
  // Keys.
  cv.fillRect(4, 22, 24, 5, [240, 240, 240, 255]);
  for (let i = 1; i < 8; i++) cv.fillRect(4 + i * 3, 22, 1, 5, [40, 40, 40, 255]);
  // Black keys.
  const blackKeyXs = [6, 9, 15, 18, 21];
  for (const x of blackKeyXs) cv.fillRect(x, 22, 2, 3, [30, 26, 32, 255]);
  // Pedals.
  cv.fillRect(14, 27, 4, 1, METAL);
}

function drawLamp(cv, rng) {
  cv.fillEllipse(16, 28, 8, 2, SHADOW);
  const shade = pickColor(rng, PASTELS);
  // Shade, trapezoid via stacked rows.
  for (let y = 0; y < 8; y++) {
    const w = 6 + y * 1;
    cv.fillRect(16 - Math.floor(w / 2), 4 + y, w, 1, shade);
  }
  cv.fillRect(10, 12, 12, 1, darken(shade, 0.6));
  // Stem.
  cv.fillRect(15, 13, 2, 12, METAL_DARK);
  // Base.
  cv.fillEllipse(16, 26, 5, 2, METAL);
  cv.fillEllipse(16, 26, 5, 1, METAL_DARK);
}

function drawPlant(cv, rng) {
  cv.fillEllipse(16, 29, 8, 2, SHADOW);
  // Pot.
  cv.fillRect(10, 22, 12, 6, [160, 90, 60, 255]);
  cv.fillRect(10, 22, 12, 1, [200, 130, 100, 255]);
  cv.fillRect(9, 21, 14, 2, [120, 70, 50, 255]);
  // Leaves, clusters of green pixels.
  const green = [60, 130, 70, 255];
  const greenL = [100, 170, 90, 255];
  const greenD = [40, 90, 50, 255];
  const cx = 16, cy = 14;
  for (let i = 0; i < 60; i++) {
    const angle = rng() * Math.PI * 2;
    const r = rng() * 8;
    const x = cx + Math.round(Math.cos(angle) * r);
    const y = cy + Math.round(Math.sin(angle) * (r * 0.8)) - 2;
    const c = rng() < 0.25 ? greenL : rng() < 0.4 ? greenD : green;
    cv.set(x, y, c);
    cv.set(x + 1, y, c);
  }
  // A few longer fronds.
  for (let i = 0; i < 4; i++) {
    const x = 12 + i * 3;
    cv.set(x, 21, greenD);
    cv.set(x, 20, green);
    cv.set(x, 19, greenL);
  }
}

function drawPainting(cv, rng) {
  cv.fillEllipse(16, 29, 8, 2, SHADOW);
  // Outer frame.
  cv.fillRect(5, 5, 22, 18, [180, 140, 60, 255]);
  cv.fillRect(5, 5, 22, 1, [220, 180, 100, 255]);
  cv.fillRect(5, 22, 22, 1, [120, 90, 30, 255]);
  // Canvas.
  cv.fillRect(8, 8, 16, 12, [230, 220, 200, 255]);
  // Random "abstract" content.
  const ink = [60, 50, 120, 255];
  for (let i = 0; i < 25; i++) {
    const x = 8 + Math.floor(rng() * 16);
    const y = 8 + Math.floor(rng() * 12);
    cv.set(x, y, rng() < 0.4 ? pickColor(rng, PASTELS) : ink);
  }
  // Hanging cord.
  cv.set(16, 4, METAL_DARK);
  cv.set(15, 3, METAL_DARK);
  cv.set(17, 3, METAL_DARK);
}

function drawRug(cv, rng) {
  const a = pickColor(rng, PASTELS);
  const b = darken(a, 0.6);
  // Oval rug.
  cv.fillEllipse(16, 18, 13, 6, a);
  cv.fillEllipse(16, 18, 13, 6, a); // ensure fill
  // Concentric ring.
  for (let y = 12; y <= 24; y++)
    for (let x = 3; x <= 29; x++) {
      const dx = x - 16, dy = y - 18;
      const r2 = (dx * dx) / 169 + (dy * dy) / 36;
      if (r2 > 0.75 && r2 <= 1) cv.set(x, y, b);
    }
  // Center motif.
  cv.fillRect(13, 16, 6, 4, b);
  cv.fillRect(15, 17, 2, 2, a);
}

function drawFireplace(cv, _rng) {
  cv.fillEllipse(16, 29, 13, 2, SHADOW);
  // Mantle (top shelf).
  cv.fillRect(3, 6, 26, 2, WOOD);
  cv.fillRect(3, 6, 26, 1, WOOD_LIGHT);
  // Surround (stone).
  const stone = [170, 165, 150, 255];
  const stoneDk = [110, 105, 92, 255];
  cv.fillRect(4, 8, 24, 20, stone);
  // Brick interior opening.
  cv.fillRect(8, 12, 16, 16, [40, 24, 18, 255]);
  // Brick pattern lines.
  for (let y = 14; y < 28; y += 2) cv.fillRect(8, y, 16, 1, [80, 44, 32, 255]);
  for (let x = 9; x < 24; x += 4) {
    for (let y = 12; y < 28; y += 4) cv.set(x, y, [80, 44, 32, 255]);
  }
  // Fire glow.
  cv.fillEllipse(16, 22, 5, 4, [240, 140, 40, 255]);
  cv.fillEllipse(16, 22, 3, 2, [255, 220, 80, 255]);
  cv.set(13, 22, [240, 60, 30, 255]);
  cv.set(19, 22, [240, 60, 30, 255]);
  // Logs at the base.
  cv.fillRect(10, 25, 12, 2, [110, 60, 30, 255]);
  cv.fillRect(11, 26, 10, 1, [70, 36, 20, 255]);
  // Stone outline.
  cv.fillRect(4, 8, 24, 1, stoneDk);
  cv.fillRect(4, 27, 24, 1, stoneDk);
  cv.fillRect(4, 8, 1, 20, stoneDk);
  cv.fillRect(27, 8, 1, 20, stoneDk);
}

function drawClock(cv, _rng) {
  // Tall grandfather clock.
  cv.fillEllipse(16, 29, 7, 2, SHADOW);
  // Cabinet body.
  cv.fillRect(11, 4, 10, 24, WOOD);
  cv.fillRect(11, 4, 10, 2, WOOD_DARK);
  cv.fillRect(11, 26, 10, 2, WOOD_DARK);
  // Face circle.
  cv.fillEllipse(16, 9, 4, 4, [240, 230, 200, 255]);
  cv.fillEllipse(16, 9, 4, 4, [240, 230, 200, 255]);
  // Hands.
  cv.fillRect(16, 7, 1, 3, [40, 30, 24, 255]);
  cv.fillRect(16, 9, 3, 1, [40, 30, 24, 255]);
  // Cabinet shadow on right.
  for (let y = 6; y <= 26; y++) cv.set(20, y, WOOD_DARK);
  // Pendulum window.
  cv.fillRect(13, 15, 6, 10, [50, 40, 30, 255]);
  // Pendulum rod + bob.
  cv.fillRect(15, 15, 1, 6, METAL);
  cv.fillEllipse(16, 22, 2, 2, POMMEL_CLR());
  // Feet.
  cv.fillRect(11, 28, 2, 2, WOOD_DARK);
  cv.fillRect(19, 28, 2, 2, WOOD_DARK);
}
// Tiny helper for the clock's pendulum bob, a single warm yellow.
function POMMEL_CLR() { return [205, 168, 88, 255]; }

function drawMirror(cv, _rng) {
  cv.fillEllipse(16, 29, 9, 2, SHADOW);
  // Outer frame.
  cv.fillRect(8, 3, 16, 24, [180, 140, 60, 255]);
  cv.fillRect(8, 3, 16, 1, [220, 180, 100, 255]);
  cv.fillRect(8, 26, 16, 1, [120, 90, 30, 255]);
  // Glass.
  cv.fillRect(10, 5, 12, 20, [180, 210, 220, 255]);
  // Reflection sheen, diagonal lighter band.
  for (let i = 0; i < 14; i++) {
    if (10 + i < 22 && 6 + i < 25) cv.set(10 + i, 6 + i, [220, 235, 240, 255]);
  }
  // Frame ornament at the top.
  cv.fillRect(13, 2, 6, 1, [220, 180, 100, 255]);
  cv.set(14, 1, [220, 180, 100, 255]);
  cv.set(17, 1, [220, 180, 100, 255]);
}

function drawGramophone(cv, _rng) {
  cv.fillEllipse(16, 29, 11, 2, SHADOW);
  // Base box (wooden).
  cv.fillRect(8, 20, 16, 8, WOOD);
  cv.fillRect(8, 20, 16, 1, WOOD_LIGHT);
  cv.fillRect(8, 27, 16, 1, WOOD_DARK);
  // Turntable.
  cv.fillEllipse(16, 21, 5, 1, [30, 30, 30, 255]);
  // Tonearm.
  cv.fillRect(16, 17, 1, 4, METAL);
  cv.set(17, 17, METAL_DARK);
  // Horn (cone widening upward and to the right).
  const horn = [180, 130, 60, 255];
  const hornL = [220, 170, 90, 255];
  // Build the cone with stacked rows.
  cv.fillRect(15, 16, 3, 1, horn);
  cv.fillRect(14, 14, 6, 2, horn);
  cv.fillRect(12, 11, 10, 3, horn);
  cv.fillRect(10, 7, 14, 4, horn);
  // Highlight along the left edge of the horn.
  for (let y = 7; y <= 16; y++) cv.set(10 + Math.floor((y - 7) * 0.5), y, hornL);
  // Inner horn shadow.
  cv.fillRect(13, 9, 10, 1, darken(horn, 0.7));
}

function drawTypewriter(cv, _rng) {
  cv.fillEllipse(16, 29, 11, 2, SHADOW);
  // Body.
  cv.fillRect(7, 14, 18, 11, [40, 36, 42, 255]);
  cv.fillRect(7, 14, 18, 1, [80, 76, 86, 255]);
  // Keys grid.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 7; col++) {
      cv.set(9 + col * 2, 19 + row * 2, [220, 220, 220, 255]);
    }
  }
  // Carriage return / paper roll on top.
  cv.fillRect(6, 11, 20, 3, [60, 56, 64, 255]);
  // Paper coming out.
  cv.fillRect(12, 7, 8, 5, [240, 240, 230, 255]);
  cv.fillRect(13, 8, 6, 1, [120, 120, 110, 255]);
  cv.fillRect(13, 10, 6, 1, [120, 120, 110, 255]);
  // Side knob.
  cv.fillEllipse(5, 12, 1, 1, METAL);
  cv.fillEllipse(26, 12, 1, 1, METAL);
}

function drawSafe(cv, _rng) {
  cv.fillEllipse(16, 29, 10, 2, SHADOW);
  // Body.
  cv.fillRect(5, 6, 22, 22, [40, 38, 44, 255]);
  cv.fillRect(5, 6, 22, 1, [80, 76, 84, 255]);
  cv.fillRect(5, 27, 22, 1, [20, 18, 22, 255]);
  // Door inset.
  cv.fillRect(7, 8, 18, 18, [60, 56, 64, 255]);
  cv.fillRect(7, 8, 18, 1, [30, 28, 32, 255]);
  // Dial.
  cv.fillEllipse(13, 17, 4, 4, [200, 196, 188, 255]);
  cv.fillEllipse(13, 17, 4, 4, [200, 196, 188, 255]);
  cv.fillEllipse(13, 17, 1, 1, [30, 28, 32, 255]);
  // Dial pointer.
  cv.fillRect(13, 14, 1, 2, [30, 28, 32, 255]);
  // Handle.
  cv.fillRect(19, 16, 4, 2, [200, 196, 188, 255]);
  cv.fillRect(20, 18, 2, 2, [200, 196, 188, 255]);
  // Bolt markings.
  for (let i = 0; i < 4; i++) cv.set(8 + i, 25, [200, 196, 188, 255]);
}

// ---------- Roster ----------

// Medieval / fantasy items, used by the medium-tier samples. These
// are blocking furniture (the player can't stand on a hot brazier),
// the validator categorises any unknown id as blocking by default.

function drawAnvil(cv, _rng) {
  cv.fillEllipse(16, 29, 11, 2, SHADOW);
  const iron     = [70, 70, 84, 255];
  const ironDk   = [40, 40, 52, 255];
  const ironLt   = [110, 110, 124, 255];
  // Wooden stump under the anvil.
  cv.fillRect(10, 21, 12, 7, WOOD);
  cv.fillRect(10, 21, 12, 1, WOOD_LIGHT);
  cv.fillRect(10, 27, 12, 1, WOOD_DARK);
  // Anvil body, hourglass profile.
  cv.fillRect(8, 13, 16, 4, iron);
  cv.fillRect(11, 17, 10, 3, iron);
  cv.fillRect(8, 13, 16, 1, ironLt);
  cv.fillRect(8, 16, 16, 1, ironDk);
  // Pointed horn on the left.
  cv.fillRect(5, 14, 4, 2, iron);
  cv.set(4, 14, iron);
  cv.set(4, 15, iron);
  // Top hammer-face highlight.
  cv.fillRect(9, 13, 14, 1, ironLt);
}

function drawCauldron(cv, _rng) {
  cv.fillEllipse(16, 29, 11, 2, SHADOW);
  const iron     = [42, 42, 50, 255];
  const ironDk   = [22, 22, 28, 255];
  const brew     = [70, 180, 110, 255];
  const brewLt   = [140, 220, 170, 255];
  // Belly of the pot.
  cv.fillEllipse(16, 20, 11, 8, iron);
  // Rim.
  cv.fillRect(7, 11, 18, 2, ironDk);
  cv.fillRect(8, 11, 16, 1, iron);
  // Brew at the top.
  cv.fillRect(9, 12, 14, 2, brew);
  cv.fillRect(11, 12, 3, 1, brewLt);
  cv.fillRect(17, 13, 3, 1, brewLt);
  // Three squat legs.
  cv.fillRect(8, 26, 2, 4, ironDk);
  cv.fillRect(15, 26, 2, 4, ironDk);
  cv.fillRect(22, 26, 2, 4, ironDk);
  // Steam.
  cv.set(12, 9, [230, 230, 230, 180]);
  cv.set(16, 8, [230, 230, 230, 180]);
  cv.set(20, 9, [230, 230, 230, 180]);
}

function drawBrazier(cv, _rng) {
  cv.fillEllipse(16, 29, 10, 2, SHADOW);
  const iron     = [80, 60, 40, 255];
  const ironDk   = [40, 30, 20, 255];
  const ember    = [240, 100, 30, 255];
  const flame    = [255, 200, 60, 255];
  // Three iron legs splaying down.
  cv.fillRect(8, 18, 2, 10, ironDk);
  cv.fillRect(22, 18, 2, 10, ironDk);
  cv.fillRect(15, 19, 2, 10, ironDk);
  // The bowl.
  cv.fillEllipse(16, 16, 11, 4, iron);
  cv.fillEllipse(16, 14, 10, 2, ironDk);
  // Coals at the rim.
  for (let x = 8; x <= 24; x += 2) cv.set(x, 13, ember);
  // Flames above.
  cv.fillRect(14, 9, 4, 4, flame);
  cv.set(13, 11, ember);
  cv.set(18, 11, ember);
  cv.set(16, 7, ember);
}

function drawBanner(cv, _rng) {
  // Wall-hanging, lives in front of the cell, non-blocking.
  const pole     = [90, 70, 50, 255];
  const cloth    = [140, 30, 40, 255];
  const clothDk  = [90, 18, 26, 255];
  const sigil    = [230, 200, 90, 255];
  // Horizontal pole at the top.
  cv.fillRect(4, 5, 24, 2, pole);
  cv.fillEllipse(4, 6, 2, 1, pole);
  cv.fillEllipse(28, 6, 2, 1, pole);
  // The hanging cloth, slightly tapered at the bottom.
  cv.fillRect(8, 7, 16, 18, cloth);
  cv.fillRect(9, 25, 14, 1, clothDk);
  cv.fillRect(10, 26, 12, 1, clothDk);
  // Folds at the edges.
  cv.fillRect(8, 7, 1, 19, clothDk);
  cv.fillRect(23, 7, 1, 19, clothDk);
  // A simple sigil at the centre, a sunburst.
  cv.fillEllipse(16, 15, 3, 3, sigil);
  cv.set(16, 11, sigil);
  cv.set(16, 19, sigil);
  cv.set(12, 15, sigil);
  cv.set(20, 15, sigil);
}

function drawChest(cv, _rng) {
  cv.fillEllipse(16, 28, 10, 2, SHADOW);
  const wood     = WOOD;
  const woodDk   = WOOD_DARK;
  const woodLt   = WOOD_LIGHT;
  const iron     = [60, 60, 70, 255];
  // Base box.
  cv.fillRect(6, 14, 20, 14, wood);
  cv.fillRect(6, 14, 20, 1, woodLt);
  cv.fillRect(6, 27, 20, 1, woodDk);
  // Curved domed lid.
  cv.fillEllipse(16, 13, 10, 5, wood);
  cv.fillEllipse(16, 12, 9, 4, woodLt);
  // Iron strap bands.
  cv.fillRect(6, 18, 20, 1, iron);
  cv.fillRect(15, 9, 2, 19, iron);
  // The lock.
  cv.fillRect(14, 19, 4, 4, iron);
  cv.set(16, 21, [220, 200, 80, 255]);
}

const SPRITES = [
  { id: 'chair',      name: 'Chair',                 draw: drawChair },
  { id: 'armchair',   name: 'Armchair',              draw: drawArmchair },
  { id: 'sofa',       name: 'Sofa',                  draw: drawSofa },
  { id: 'bed',        name: 'Bed',                   draw: drawBed },
  { id: 'table',      name: 'Table',                 draw: drawTable },
  { id: 'dresser',    name: 'Dresser',               draw: drawDresser },
  { id: 'bookshelf',  name: 'Bookshelf',             draw: drawBookshelf },
  { id: 'piano',      name: 'Piano',                 draw: drawPiano },
  { id: 'lamp',       name: 'Floor lamp',            draw: drawLamp },
  { id: 'plant',      name: 'Potted plant',          draw: drawPlant },
  { id: 'painting',   name: 'Wall painting',         draw: drawPainting },
  { id: 'rug',        name: 'Patterned rug',         draw: drawRug },
  { id: 'fireplace',  name: 'Fireplace',             draw: drawFireplace },
  { id: 'clock',      name: 'Grandfather clock',     draw: drawClock },
  { id: 'mirror',     name: 'Mirror',                draw: drawMirror },
  { id: 'gramophone', name: 'Gramophone',            draw: drawGramophone },
  { id: 'typewriter', name: 'Typewriter',            draw: drawTypewriter },
  { id: 'safe',       name: 'Safe',                  draw: drawSafe },
  // Medieval / fantasy. Used by medium-tier samples.
  { id: 'anvil',      name: 'Anvil',                 draw: drawAnvil },
  { id: 'cauldron',   name: 'Cauldron',              draw: drawCauldron },
  { id: 'brazier',    name: 'Brazier',               draw: drawBrazier },
  { id: 'banner',     name: 'Hanging banner',        draw: drawBanner },
  { id: 'chest',      name: 'Iron-bound chest',      draw: drawChest },
];

function main() {
  const outDir = path.resolve(__dirname, '..', 'assets', 'furniture');
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = [];
  for (let i = 0; i < SPRITES.length; i++) {
    const s = SPRITES[i];
    const cv = new Canvas(W, H);
    const rng = mulberry32(0xC0FFEE ^ ((i + 1) * 0x9E3779B1));
    s.draw(cv, rng);
    const png = encodePNG(W, H, cv.data);
    const file = `${s.id}.png`;
    fs.writeFileSync(path.join(outDir, file), png);
    manifest.push({ id: s.id, name: s.name, sprite: `assets/furniture/${file}` });
    process.stdout.write(`wrote ${file}\n`);
  }

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  process.stdout.write(`wrote manifest.json (${manifest.length} sprites)\n`);
}

main();
