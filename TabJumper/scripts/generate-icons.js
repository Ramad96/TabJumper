import { writeFileSync, mkdirSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

/** Draws the Tab Jumper mark: a white browser tab on an indigo tile, with a jump arrow cut through it. */
const iconsDir = new URL('../icons/', import.meta.url);
const SAMPLES = 4;

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const byte of buf) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length);
  head.write(type, 4, 'latin1');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])));
  return Buffer.concat([head, data, crc]);
}
function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr.set([8, 6, 0, 0, 0], 8);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const roundRect = (x, y, x0, y0, x1, y1, r) => {
  const dx = Math.max(x0 + r - x, 0, x - (x1 - r)), dy = Math.max(y0 + r - y, 0, y - (y1 - r));
  return x >= x0 && x <= x1 && y >= y0 && y <= y1 && dx * dx + dy * dy <= r * r;
};
const capsule = (x, y, [ax, ay], [bx, by], half) => {
  const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))) <= half;
};

/** Returns [r, g, b, a] for a point in unit space; `stroke` thickens the arrow for small toolbar sizes. */
function paint(x, y, stroke) {
  if (!roundRect(x, y, 0, 0, 1, 1, 0.22)) return null;
  const t = (x + y) / 2;
  const bg = [Math.round(99 + (124 - 99) * t), Math.round(102 + (58 - 102) * t), Math.round(241 + (237 - 241) * t), 255];
  const tip = [0.64, 0.45];
  const arrow = capsule(x, y, [0.36, 0.69], tip, stroke) || capsule(x, y, tip, [0.47, 0.45], stroke) || capsule(x, y, tip, [0.64, 0.62], stroke);
  const card = roundRect(x, y, 0.19, 0.33, 0.81, 0.8, 0.07) || roundRect(x, y, 0.19, 0.2, 0.5, 0.38, 0.05);
  return card && !arrow ? [255, 255, 255, 255] : bg;
}

function render(size, stroke) {
  const rgba = Buffer.alloc(size * size * 4);
  for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
    const sum = [0, 0, 0, 0];
    for (let sy = 0; sy < SAMPLES; sy++) for (let sx = 0; sx < SAMPLES; sx++) {
      const color = paint((px + (sx + 0.5) / SAMPLES) / size, (py + (sy + 0.5) / SAMPLES) / size, stroke);
      if (!color) continue;
      for (let c = 0; c < 3; c++) sum[c] += color[c] * color[3];
      sum[3] += color[3];
    }
    const o = (py * size + px) * 4;
    for (let c = 0; c < 3; c++) rgba[o + c] = sum[3] ? Math.round(sum[c] / sum[3]) : 0;
    rgba[o + 3] = Math.round(sum[3] / SAMPLES ** 2);
  }
  return encodePng(size, rgba);
}

mkdirSync(iconsDir, { recursive: true });
for (const size of [16, 32, 48, 128]) writeFileSync(new URL(`icon-${size}.png`, iconsDir), render(size, 0.045));
for (const size of [16, 32]) writeFileSync(new URL(`toolbar-${size}.png`, iconsDir), render(size, 0.06));
console.log('Icons written to icons/');
