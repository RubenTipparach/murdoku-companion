#!/usr/bin/env node
// Procedural pixel-art portrait generator for Murdoku.
// Writes 20 PNGs into assets/portraits/ plus a manifest.json roster.
//
// Pure Node (no deps): built-in zlib for DEFLATE, hand-rolled PNG encoder.

'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ---------- PNG encoder ----------

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowBytes + 1)] = 0; // filter type: None
    rgba.copy(raw, y * (rowBytes + 1) + 1, y * rowBytes, (y + 1) * rowBytes);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------- Pixel canvas ----------

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4); // all transparent
  }
  set(x, y, [r, g, b, a = 255]) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = r; this.data[i + 1] = g; this.data[i + 2] = b; this.data[i + 3] = a;
  }
  fillRect(x, y, w, h, color) {
    for (let yy = y; yy < y + h; yy++)
      for (let xx = x; xx < x + w; xx++) this.set(xx, yy, color);
  }
  fillEllipse(cx, cy, rx, ry, color) {
    for (let y = -ry; y <= ry; y++)
      for (let x = -rx; x <= rx; x++)
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1)
          this.set(cx + x, cy + y, color);
  }
  // Filled rounded rectangle (jagged-pixel style)
  fillRoundRect(x, y, w, h, color) {
    for (let yy = 0; yy < h; yy++) {
      for (let xx = 0; xx < w; xx++) {
        const corner = (xx === 0 || xx === w - 1) && (yy === 0 || yy === h - 1);
        if (!corner) this.set(x + xx, y + yy, color);
      }
    }
  }
}

// ---------- Deterministic RNG ----------

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

// ---------- Palettes ----------

const SKIN_TONES = [
  [255, 224, 196], [255, 205, 168], [241, 194, 155], [224, 172, 130],
  [198, 134, 96],  [161, 102, 70],  [122, 79, 51],   [86, 50, 32],
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

function darken(c, k = 0.6) { return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k), 255]; }
function lighten(c, k = 0.3) {
  return [
    Math.min(255, Math.round(c[0] + (255 - c[0]) * k)),
    Math.min(255, Math.round(c[1] + (255 - c[1]) * k)),
    Math.min(255, Math.round(c[2] + (255 - c[2]) * k)),
    255,
  ];
}
function rgba(c) { return c.length === 4 ? c : [c[0], c[1], c[2], 255]; }

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

  // Background — solid + a horizon line for a portrait frame feel.
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

  // Head — an oval, slightly tall.
  cv.fillEllipse(16, 13, 7, 8, skin);
  // Face shading on the right side.
  for (let y = 7; y <= 20; y++)
    for (let x = 19; x <= 22; x++) {
      const dx = x - 16, dy = y - 13;
      if ((dx * dx) / 49 + (dy * dy) / 64 <= 1) cv.set(x, y, skinShadow);
    }

  // Hair — pick a style.
  const style = Math.floor(rng() * 6);
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
    cv.fillRect(8, 10, 2, 12, hair);  // Long, past shoulders.
    cv.fillRect(22, 10, 2, 12, hair);
    cv.fillRect(9, 21, 14, 2, hair);
  } else if (style === 3) {
    // Bald-ish: just a ring of hair.
    cv.fillRect(9, 11, 14, 1, hair);
  } else if (style === 4) {
    // Hat: solid block over the scalp.
    cv.fillRect(9, 5, 14, 4, darken(hair, 0.5));
    cv.fillRect(8, 8, 16, 2, darken(hair, 0.4));
  } else {
    // Curly: dotted hair cap.
    for (let y = 5; y <= 11; y++)
      for (let x = 9; x <= 23; x++) {
        const dx = x - 16, dy = y - 13;
        if ((dx * dx) / 49 + (dy * dy) / 64 <= 1 && y <= 10 && (x + y) % 2 === 0)
          cv.set(x, y, hair);
      }
    cv.fillRect(10, 10, 12, 2, hair);
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

  // Mouth — random expression.
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

  // Optional facial hair.
  if (rng() < 0.25) {
    cv.fillRect(13, 17, 6, 1, hair); // Mustache.
  }
  if (rng() < 0.2) {
    cv.fillRect(12, 18, 8, 3, hair); // Beard.
    cv.fillRect(14, 18, 4, 1, lip);  // Restore mouth on top of beard.
  }

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
  'The household physician — knows whose pills are whose.',
  'A travelling preacher whose sermons keep mentioning the host.',
  'A medium claiming the victim consulted her last Tuesday.',
  'The butler. Yes, really. Don\'t make it weird.',
  'Cook, gossip, and the only one who saw the kitchen at midnight.',
  'Old navy friend of the victim, recently returned from sea.',
  'A perfumer; her scents linger in rooms she swears she never entered.',
  'Lecturer in entomology. Carries a jar. Of something.',
  'A novice nun on retreat — quieter than the wallpaper.',
  'Distinguished veteran whose pension does not match his shoes.',
  'A clockmaker. Knows exactly when the lights went out.',
  'Estate solicitor, holding three wills and one secret.',
  'The gardener. Knows what soil the rose bed has been disturbed with.',
  'A jazz pianist booked for the evening\'s entertainment.',
  'Patroness of the arts and the victim\'s longtime rival.',
  'A locksmith hired the morning of the party. Why?',
  'Photographer covering the soirée — every flash is alibi or evidence.',
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
