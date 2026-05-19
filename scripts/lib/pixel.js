// Shared pixel-art helpers: a tiny Canvas, a PNG encoder, and a seeded RNG.
// Used by generate-portraits.js and generate-furniture.js.

'use strict';

const zlib = require('zlib');

// ---------- CRC32 ----------

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

// ---------- PNG ----------

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
  ihdr[9] = 6;   // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const rowBytes = width * 4;
  const raw = Buffer.alloc((rowBytes + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (rowBytes + 1)] = 0;
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

// ---------- Canvas ----------

class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = Buffer.alloc(w * h * 4);
  }
  set(x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0]; this.data[i + 1] = c[1]; this.data[i + 2] = c[2];
    this.data[i + 3] = c.length === 4 ? c[3] : 255;
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
  hLine(x, y, w, color) { for (let i = 0; i < w; i++) this.set(x + i, y, color); }
  vLine(x, y, h, color) { for (let i = 0; i < h; i++) this.set(x, y + i, color); }
  rect(x, y, w, h, color) {
    this.hLine(x, y, w, color);
    this.hLine(x, y + h - 1, w, color);
    this.vLine(x, y, h, color);
    this.vLine(x + w - 1, y, h, color);
  }
}

// ---------- RNG ----------

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

// ---------- Color helpers ----------

function darken(c, k = 0.6) {
  return [Math.round(c[0] * k), Math.round(c[1] * k), Math.round(c[2] * k), c.length === 4 ? c[3] : 255];
}
function lighten(c, k = 0.3) {
  return [
    Math.min(255, Math.round(c[0] + (255 - c[0]) * k)),
    Math.min(255, Math.round(c[1] + (255 - c[1]) * k)),
    Math.min(255, Math.round(c[2] + (255 - c[2]) * k)),
    c.length === 4 ? c[3] : 255,
  ];
}
function rgba(c) { return c.length === 4 ? c : [c[0], c[1], c[2], 255]; }

module.exports = {
  encodePNG,
  Canvas,
  mulberry32,
  pick,
  darken,
  lighten,
  rgba,
};
