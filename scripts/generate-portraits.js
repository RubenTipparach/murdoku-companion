#!/usr/bin/env node
// Procedural pixel-art portrait generator for Murdoku.
// Writes 20 PNGs into assets/portraits/ plus a manifest.json roster.
//
// Pure Node (no deps): built-in zlib for DEFLATE, hand-rolled PNG encoder.

'use strict';

const fs = require('fs');
const path = require('path');
const { encodePNG, Canvas, mulberry32, pick, darken, lighten, rgba } = require('./lib/pixel');

// ---------- Palettes ----------

const SKIN_TONES = [
  [255, 224, 196], [255, 205, 168], [241, 194, 155], [224, 172, 130],
  [198, 134, 96], [161, 102, 70], [122, 79, 51],  [86, 50, 32],
];

const HAIR_COLORS = [
  [30, 22, 18], [70, 40, 25], [120, 70, 30], [160, 100, 40],
  [200, 150, 70], [220, 200, 130], [180, 180, 180], [230, 230, 230],
  [120, 30, 30], [60, 60, 90], [40, 30, 60], [60, 40, 60],
];

const EYE_COLORS = [
  [60, 40, 25], [50, 80, 120], [70, 110, 90], [120, 80, 40], [30, 30, 30], [90, 60, 110],
];

const SHIRT_COLORS = [
  [85, 110, 160], [160, 70, 70], [70, 140, 90], [180, 130, 60], [120, 80, 140],
  [60, 90, 100], [180, 90, 110], [50, 60, 70], [200, 170, 100], [90, 130, 130],
];

const BG_COLORS = [
  [44, 52, 76], [60, 48, 70], [40, 60, 56], [70, 56, 48], [50, 50, 64],
  [76, 60, 60], [48, 64, 72], [64, 56, 76], [56, 72, 56], [72, 64, 56],
];

// ---------- Portrait drawing ----------

function drawPortrait(seed) {
  const W = 32, H = 32;
  const cv = new Canvas(W, H);
  const rng = mulberry32(seed);

  const bg = rgba(pick(rng, BG_COLORS));
  const skin = rgba(pick(rng, SKIN_TONES));
  const hair = rgba(pick(rng, HAIR_COLORS));
  const eye = rgba(pick(rng, EYE_COLORS));
  const shirt = rgba(pick(rng, SHIRT_COLORS));
  const skinShadow = darken(skin, 0.85);

  // Background, solid + a horizon line for a portrait frame feel.
  cv.fillRect(0, 0, W, H, bg);
  cv.fillRect(0, 22, W, H - 22, darken(bg, 0.85));

  // Neck.
  cv.fillRect(13, 20, 6, 4, skin);
  cv.fillRect(13, 22, 6, 1, skinShadow);

  // Shoulders / shirt.
  cv.fillRect(4, 24, 24, 8, shirt);
  // Shirt shadow ridge.
  cv.fillRect(4, 24, 24, 1, darken(shirt, 0.8));
  // Collar variations.
  const collarStyle = Math.floor(rng() * 3);
  if (collarStyle === 0) {
    cv.fillRect(14, 24, 4, 3, skin);             // V-neck
    cv.set(15, 26, skinShadow);
    cv.set(16, 26, skinShadow);
  } else if (collarStyle === 1) {
    cv.fillRect(11, 24, 10, 2, darken(shirt, 0.7)); // High collar band
  } else {
    cv.fillRect(13, 24, 6, 2, lighten(shirt, 0.4)); // Buttoned placket
    cv.set(15, 25, darken(shirt, 0.6));
    cv.set(15, 27, darken(shirt, 0.6));
  }

  // Head, an oval, slightly tall.
  cv.fillEllipse(16, 13, 7, 8, skin);
  // Face shading on the right side.
  for (let y = 7; y <= 20; y++)
    for (let x = 19; x <= 22; x++) {
      const dx = x - 16, dy = y - 13;
      if ((dx * dx) / 49 + (dy * dy) / 64 <= 1) cv.set(x, y, skinShadow);
    }

  // Hair / headgear, pick a style. Medieval-themed roster: short
  // hair, long hair, bald + circlet, hood, knight's helm, wizard's
  // pointy hat, gold crown.
  const style = Math.floor(rng() * 7);
  const drawHairCap = () => {
    for (let y = 5; y <= 11; y++)
      for (let x = 9; x <= 23; x++) {
        const dx = x - 16, dy = y - 13;
        if ((dx * dx) / 49 + (dy * dy) / 64 <= 1 && y <= 10) cv.set(x, y, hair);
      }
    // Bangs / fringe.
    cv.fillRect(10, 10, 12, 2, hair);
  };
  if (style === 0) {
    drawHairCap(); // Short.
  } else if (style === 1) {
    drawHairCap();
    cv.fillRect(8, 10, 2, 8, hair);   // Long sides.
    cv.fillRect(22, 10, 2, 8, hair);
  } else if (style === 2) {
    drawHairCap();
    cv.fillRect(8, 10, 2, 14, hair);  // Long, down past the shoulders.
    cv.fillRect(22, 10, 2, 14, hair);
    // No chin-level connector, that horizontal bar at y=21 read as
    // a beard rather than as hair falling behind the head.
  } else if (style === 3) {
    // Hood: dark cloth pulled over the head and shoulders.
    const cloth = darken(rgba(pick(rng, BG_COLORS)), 0.6);
    cv.fillRect(7, 7, 18, 4, cloth);
    cv.fillRect(6, 9, 3, 12, cloth);
    cv.fillRect(23, 9, 3, 12, cloth);
    cv.fillRect(8, 8, 16, 1, lighten(cloth, 0.2));
    // Face peeks through, restore skin under the hood mouth.
    cv.fillEllipse(16, 13, 6, 6, skin);
  } else if (style === 4) {
    // Knight's helm: steel-grey skull cap with a slit visor.
    const steel = [150, 150, 165, 255];
    const steelDk = [80, 80, 95, 255];
    cv.fillRect(8, 4, 16, 8, steel);
    cv.fillRect(8, 4, 16, 1, steelDk);
    cv.fillRect(8, 11, 16, 1, steelDk);
    cv.fillRect(8, 4, 1, 8, steelDk);
    cv.fillRect(23, 4, 1, 8, steelDk);
    // Visor slit.
    cv.fillRect(11, 8, 10, 1, steelDk);
    cv.fillRect(11, 9, 10, 1, [40, 40, 50, 255]);
    // Cheek guards over the sides.
    cv.fillRect(9, 12, 2, 6, steel);
    cv.fillRect(21, 12, 2, 6, steel);
  } else if (style === 5) {
    // Wizard's pointy hat with a brim.
    const cloth = rgba(pick(rng, [
      [70, 50, 110, 255], [40, 60, 110, 255], [110, 60, 50, 255], [40, 40, 60, 255],
    ]));
    // Brim.
    cv.fillRect(6, 9, 20, 2, darken(cloth, 0.7));
    cv.fillRect(6, 10, 20, 1, darken(cloth, 0.5));
    // Tapered cone.
    cv.fillRect(10, 7, 12, 2, cloth);
    cv.fillRect(12, 5, 8, 2, cloth);
    cv.fillRect(14, 3, 4, 2, cloth);
    cv.fillRect(15, 1, 2, 2, cloth);
    // Star or buckle.
    cv.set(16, 8, [240, 220, 120, 255]);
  } else if (style === 6) {
    // Gold crown over short hair.
    drawHairCap();
    const gold = [220, 190, 80, 255];
    const goldDk = [160, 130, 50, 255];
    cv.fillRect(8, 7, 16, 2, gold);
    cv.fillRect(8, 7, 16, 1, goldDk);
    // Spikes.
    cv.fillRect(9, 5, 1, 2, gold);
    cv.fillRect(12, 4, 1, 3, gold);
    cv.fillRect(15, 3, 2, 4, gold);
    cv.fillRect(19, 4, 1, 3, gold);
    cv.fillRect(22, 5, 1, 2, gold);
    // Jewel at the centre.
    cv.set(16, 6, [200, 80, 100, 255]);
  }

  // Eyes.
  cv.set(13, 13, eye); cv.set(13, 14, eye);
  cv.set(19, 13, eye); cv.set(19, 14, eye);
  // Catchlights.
  cv.set(14, 13, [255, 255, 255, 255]);
  cv.set(20, 13, [255, 255, 255, 255]);

  // Eyebrows.
  cv.fillRect(12, 11, 3, 1, darken(hair, 0.6));
  cv.fillRect(18, 11, 3, 1, darken(hair, 0.6));

  // Nose.
  cv.set(16, 15, skinShadow);
  cv.set(16, 16, skinShadow);

  // Mouth, random expression.
  const mouth = Math.floor(rng() * 3);
  const lip = darken(skin, 0.6);
  if (mouth === 0) {
    cv.fillRect(14, 18, 4, 1, lip); // Neutral.
  } else if (mouth === 1) {
    cv.fillRect(14, 18, 4, 1, lip); // Smile.
    cv.set(13, 17, lip);
    cv.set(18, 17, lip);
  } else {
    cv.fillRect(14, 18, 4, 1, lip); // Frown.
    cv.set(13, 19, lip);
    cv.set(18, 19, lip);
  }

  // Facial hair intentionally disabled, the box-jawline beard read
  // as a tofu-glyph at portrait size and confused the silhouette
  // with long hair. Mediaeval-styled headgear (helm, hood, crown,
  // wizard hat) is enough character signal on its own.

  // Optional glasses.
  if (rng() < 0.3) {
    const gc = [30, 30, 30, 255];
    cv.fillRect(11, 12, 4, 4, gc);
    cv.fillRect(17, 12, 4, 4, gc);
    cv.fillRect(12, 13, 2, 2, bg); // Lens cut-outs.
    cv.fillRect(18, 13, 2, 2, bg);
    cv.set(15, 13, gc);
    cv.set(16, 13, gc);
  }

  // Optional earring.
  if (rng() < 0.25) {
    cv.set(9, 15, [230, 200, 80, 255]);
  }

  return encodePNG(W, H, cv.data);
}

// ---------- Roster ----------

const NAMES = [
  'Lady Eveline Wraithmoor',
  'Inspector Cassius Brand',
  'Dr. Marisol Quint',
  'Reverend Aldous Penn',
  'Madame Octavia Sable',
  'Mr. Thaddeus Glover',
  'Beatrice Halloran',
  'Captain Rhys Ardent',
  'Vivienne Marchand',
  'Professor Edmund Crowe',
  'Sister Adelheid Voss',
  'Colonel Percival Hask',
  'Ottilie Bramwell',
  'Mortimer Finch',
  'Constance Yew',
  'Silas Roe',
  'Dame Genevieve Pell',
  'Bartholomew Knox',
  'Imogen Sarsfield',
  'Felix Drummond',
];

const DESCRIPTIONS = [
  'Heiress to the Wraithmoor estate; allergic to chrysanthemums.',
  'A retired detective who insists he came for the hors d\'oeuvres.',
  'The household physician, knows whose pills are whose.',
  'A travelling preacher whose sermons keep mentioning the host.',
  'A medium claiming the victim consulted her last Tuesday.',
  'The butler. Yes, really. Don\'t make it weird.',
  'Cook, gossip, and the only one who saw the kitchen at midnight.',
  'Old navy friend of the victim, recently returned from sea.',
  'A perfumer; her scents linger in rooms she swears she never entered.',
  'Lecturer in entomology. Carries a jar. Of something.',
  'A novice nun on retreat, quieter than the wallpaper.',
  'Distinguished veteran whose pension does not match his shoes.',
  'A clockmaker. Knows exactly when the lights went out.',
  'Estate solicitor, holding three wills and one secret.',
  'The gardener. Knows what soil the rose bed has been disturbed with.',
  'A jazz pianist booked for the evening\'s entertainment.',
  'Patroness of the arts and the victim\'s longtime rival.',
  'A locksmith hired the morning of the party. Why?',
  'Photographer covering the soirée, every flash is alibi or evidence.',
  'A childhood friend of the victim. Or so the cards say.',
];

function main() {
  const outDir = path.resolve(__dirname, '..', 'assets', 'portraits');
  fs.mkdirSync(outDir, { recursive: true });

  const manifest = [];
  for (let i = 0; i < 20; i++) {
    const id = `char-${String(i + 1).padStart(2, '0')}`;
    const png = drawPortrait(0xC0FFEE ^ ((i + 1) * 2654435761));
    const file = `${id}.png`;
    fs.writeFileSync(path.join(outDir, file), png);
    manifest.push({
      id,
      name: NAMES[i],
      description: DESCRIPTIONS[i],
      portrait: `assets/portraits/${file}`,
    });
    process.stdout.write(`wrote ${file}\n`);
  }

  fs.writeFileSync(
    path.join(outDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2) + '\n',
  );
  process.stdout.write(`wrote manifest.json (${manifest.length} characters)\n`);
}

main();
