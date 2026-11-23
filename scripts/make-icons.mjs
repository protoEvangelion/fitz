import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [0x0d, 0x0f, 0x0b];
const LIME = [0xd8, 0xf2, 0x6b];
const SS = 4;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function roundedRect(px, py, x, y, w, h, r) {
  const cx = Math.max(x + r, Math.min(px, x + w - r));
  const cy = Math.max(y + r, Math.min(py, y + h - r));
  const dx = px - cx;
  const dy = py - cy;
  if (px < x || px > x + w || py < y || py > y + h) return false;
  return dx * dx + dy * dy <= r * r;
}

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/** Dumbbell mark: bar, inner plates, outer collars. Coordinates in 0..1. */
function shape(u, v) {
  const cx = 0.5;
  const cy = 0.5;
  const bar = v > cy - 0.028 && v < cy + 0.028 && u > 0.235 && u < 0.765;
  const plateL = roundedRect(u, v, 0.3, cy - 0.155, 0.072, 0.31, 0.026);
  const plateR = roundedRect(u, v, 0.628, cy - 0.155, 0.072, 0.31, 0.026);
  const collarL = roundedRect(u, v, 0.232, cy - 0.08, 0.045, 0.16, 0.016);
  const collarR = roundedRect(u, v, 0.723, cy - 0.08, 0.045, 0.16, 0.016);
  return bar || plateL || plateR || collarL || collarR;
}

function icon(size, { maskable = false } = {}) {
  const out = Buffer.alloc(size * size * 4);
  // Full bleed square: the platform applies its own squircle mask. A pre-rounded
  // PNG gets masked twice and reads as a smaller tile with dark corners.
  const radius = 0;
  const scale = maskable ? 0.86 : 1; // maskable stays inside the 80% safe circle
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bgHits = 0;
      let fgHits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS;
          const py = y + (sy + 0.5) / SS;
          const insideBg = roundedRect(px, py, 0, 0, size, size, radius);
          if (insideBg) bgHits++;
          const u = (px - size / 2) / (size * scale) + 0.5;
          const v = (py - size / 2) / (size * scale) + 0.5;
          if (insideBg && shape(u, v)) fgHits++;
        }
      }
      const total = SS * SS;
      const bgA = bgHits / total;
      const fgA = fgHits / total;
      const i = (y * size + x) * 4;
      const color = mix(BG, LIME, bgA > 0 ? fgA / bgA : 0);
      out[i] = color[0];
      out[i + 1] = color[1];
      out[i + 2] = color[2];
      out[i + 3] = Math.round(bgA * 255);
    }
  }
  return png(size, size, out);
}

/** Launch screen: flat field, mark above centre. No text, no gradient. */
function splash(w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      out[i] = BG[0];
      out[i + 1] = BG[1];
      out[i + 2] = BG[2];
      out[i + 3] = 255;
    }
  }
  const s = Math.round(Math.min(w, h) * 0.22);
  const ox = Math.round((w - s) / 2);
  const oy = Math.round((h - s) / 2 - h * 0.03);
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      if (!shape(x / s, y / s)) continue;
      const i = ((oy + y) * w + (ox + x)) * 4;
      out[i] = LIME[0];
      out[i + 1] = LIME[1];
      out[i + 2] = LIME[2];
      out[i + 3] = 255;
    }
  }
  return png(w, h, out);
}

mkdirSync(new URL("../public/icons", import.meta.url), { recursive: true });
mkdirSync(new URL("../public/splash", import.meta.url), { recursive: true });
const write = (name, buf) =>
  writeFileSync(new URL(`../public/icons/${name}`, import.meta.url), buf);

write("icon-180.png", icon(180));
write("icon-192.png", icon(192));
write("icon-512.png", icon(512));
write("icon-maskable-512.png", icon(512, { maskable: true }));
write("favicon-64.png", icon(64));

for (const [w, h] of [
  [1320, 2868],
  [1290, 2796],
  [1284, 2778],
  [1242, 2688],
  [1206, 2622],
  [1179, 2556],
  [1170, 2532],
  [1125, 2436],
  [828, 1792],
  [750, 1334],
]) {
  writeFileSync(new URL(`../public/splash/${w}x${h}.png`, import.meta.url), splash(w, h));
}

writeFileSync(
  new URL("../public/icons/mask.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><g fill="#d8f26b"><rect x="23.5" y="47.2" width="53" height="5.6"/><rect x="30" y="34.5" width="7.2" height="31" rx="2.6"/><rect x="62.8" y="34.5" width="7.2" height="31" rx="2.6"/><rect x="23.2" y="42" width="4.5" height="16" rx="1.6"/><rect x="72.3" y="42" width="4.5" height="16" rx="1.6"/></g></svg>`,
);

console.log("icons written");
