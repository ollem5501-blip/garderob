// Хранение внутри телефона: вещи с фото — IndexedDB, анкета и настройки — localStorage.
import { COLORS } from './data.js';

let dbp;
function db() {
  return dbp ||= new Promise((res, rej) => {
    const r = indexedDB.open('wardrobe', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('items', { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((res, rej) => {
    const t = d.transaction('items', mode);
    const out = fn(t.objectStore('items'));
    t.oncomplete = () => res(out?.result ?? out);
    t.onerror = () => rej(t.error);
  });
}
export const allItems = () => tx('readonly', s => s.getAll());
export const putItem = it => tx('readwrite', s => s.put(it));
export const delItem = id => tx('readwrite', s => s.delete(id));
export const clearItems = () => tx('readwrite', s => s.clear());

export function load(key, def) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : def; } catch { return def; }
}
export function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* память браузера недоступна */ }
}

export async function persist() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* не критично */ }
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

// ---------- фото: уменьшить и найти основной цвет ----------
export async function processPhoto(file) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }).catch(() => loadImg(file));
  const max = 900, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const cx = cv.getContext('2d');
  cx.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise(r => cv.toBlob(r, 'image/webp', 0.86));
  return { blob: blob || file, colors: dominant(cx, w, h) };
}
function loadImg(file) {
  return new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i); i.onerror = rej;
    i.src = URL.createObjectURL(file);
  });
}

const toLab = (r, g, b) => {
  const f = c => { c /= 255; return c > 0.04045 ? ((c + 0.055) / 1.055) ** 2.4 : c / 12.92; };
  const R = f(r), G = f(g), B = f(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const g3 = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * g3(y) - 16, 500 * (g3(x) - g3(y)), 200 * (g3(y) - g3(z))];
};
const PAL = COLORS.filter(c => c.hex[0] === '#').map(c => {
  const n = parseInt(c.hex.slice(1), 16);
  return { id: c.id, lab: toLab(n >> 16, (n >> 8) & 255, n & 255) };
});
const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

// Основной цвет вещи: середина кадра, без цвета фона (фон берем по краям)
function dominant(cx, w, h) {
  const S = 48, cv = document.createElement('canvas');
  cv.width = cv.height = S;
  const c2 = cv.getContext('2d');
  c2.drawImage(cx.canvas, 0, 0, w, h, 0, 0, S, S);
  const d = c2.getImageData(0, 0, S, S).data;
  const px = (x, y) => { const i = (y * S + x) * 4; return toLab(d[i], d[i + 1], d[i + 2]); };
  const edge = [];
  for (let i = 0; i < S; i += 3) edge.push(px(i, 0), px(i, S - 1), px(0, i), px(S - 1, i));
  const bg = edge.reduce((a, l) => [a[0] + l[0] / edge.length, a[1] + l[1] / edge.length, a[2] + l[2] / edge.length], [0, 0, 0]);
  const votes = new Map();
  for (let y = Math.floor(S * 0.2); y < S * 0.8; y++) for (let x = Math.floor(S * 0.2); x < S * 0.8; x++) {
    const l = px(x, y);
    if (dist(l, bg) < 120) continue;
    let best = PAL[0], bd = Infinity;
    for (const p of PAL) { const dd = dist(l, p.lab); if (dd < bd) { bd = dd; best = p; } }
    votes.set(best.id, (votes.get(best.id) || 0) + 1);
  }
  const top = [...votes.entries()].sort((a, b) => b[1] - a[1]);
  // второй и третий цвет — только если их заметно много (узор, отделка)
  return top.filter((v, i) => i === 0 || v[1] >= top[0][1] * 0.35).slice(0, 3).map(v => v[0]);
}

// ---------- копия гардероба в файл ----------
export async function exportAll(profile) {
  const items = await allItems();
  const enc = b => new Promise(r => { const f = new FileReader(); f.onload = () => r(f.result); f.readAsDataURL(b); });
  const out = [];
  for (const it of items) out.push({ ...it, photo: it.photo ? await enc(it.photo) : null });
  return new Blob([JSON.stringify({ app: 'wardrobe', v: 1, profile, items: out })], { type: 'application/json' });
}
export async function importAll(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== 'wardrobe') throw new Error('Это не копия гардероба');
  for (const it of data.items) {
    if (it.photo) it.photo = await (await fetch(it.photo)).blob();
    await putItem(it);
  }
  return data.profile;
}
