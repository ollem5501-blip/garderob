// Примерка коллажом: ваше фото во весь рост, вещи поверх. Все считается в телефоне, без интернета.
import * as E from './engine.js';
import * as DB from './db.js';

let A; // помощники из app.js: S, openSheet, toast, tile, shapeImg
export function initTryon(deps) { A = deps; }

// Где вещь обычно сидит на фигуре: [центр x, центр y, ширина] — доли от рамки фото
const PLACE = {
  hat: [0.5, 0.07, 0.26], scarf: [0.5, 0.25, 0.3], top: [0.5, 0.34, 0.5], layer: [0.5, 0.4, 0.56],
  outer: [0.5, 0.44, 0.62], dress: [0.5, 0.47, 0.52], bottom: [0.5, 0.66, 0.42], belt: [0.5, 0.47, 0.42],
  shoes: [0.5, 0.94, 0.32], bag: [0.8, 0.56, 0.26],
};
const ZORD = ['bottom', 'shoes', 'top', 'dress', 'belt', 'layer', 'outer', 'scarf', 'bag', 'hat'];
const TOL = [22, 34, 48]; // насколько смело вырезать фон
const placeKey = it => (['hat', 'scarf', 'belt'].includes(it.type) ? it.type : E.catOf(it));
const canWear = it => E.catOf(it) !== 'acc' || ['hat', 'scarf', 'belt'].includes(it.type);

const T = { meUrl: null, meImg: null, layers: [], sel: null, ptr: new Map(), start: null, raf: 0, urls: new Map() };
const fits = () => DB.load('fit', {});
function remember(L) {
  const f = fits();
  f[L.it.id] = { x: L.x, y: L.y, w: L.w, r: L.r, z: L.z, bg: L.bg, tol: L.tol };
  DB.save('fit', f);
}
const rememberSet = () => DB.save('fitSet', T.layers.map(L => L.it.id));

// ---------- открыть ----------
export async function openTryon(items) {
  const blob = await DB.getBlob('me').catch(() => null);
  if (T.meUrl) URL.revokeObjectURL(T.meUrl);
  T.meUrl = blob ? URL.createObjectURL(blob) : null;
  const list = items || DB.load('fitSet', []).map(id => A.S.items.find(i => i.id === id)).filter(Boolean);
  T.layers = []; T.sel = null; T.ptr.clear();
  A.openSheet('<div id="fit"></div>', true);
  render();
  if (T.meImg) await T.meImg.decode().catch(() => {});
  for (const it of list.filter(canWear)) await addLayer(it);
  rememberSet();
  strip();
}

function render() {
  const el = document.getElementById('fit');
  el.innerHTML = `
    <div class="fit-head"><div class="sh">Примерка</div>${T.meUrl ? '<button class="btn" data-act="fit-save">Сохранить картинку</button>' : ''}</div>
    <div class="stage" id="stage">${T.meUrl ? `<img class="me" id="meImg" src="${T.meUrl}" alt="Ваше фото">` : `
      <div class="stage-empty">
        <b>Загрузите свое фото во весь рост</b>
        <p>Стоя прямо, руки чуть в стороны, на светлом фоне, в облегающей одежде. Фото останется только в этом телефоне.</p>
        <button class="btn main" data-act="fit-photo">Выбрать фото</button>
      </div>`}</div>
    <div class="fit-tools" id="fitTools"></div>
    <div class="lbl">Вещи — нажмите, чтобы надеть или снять</div>
    <div class="strip" id="fitStrip"></div>`;
  T.meImg = document.getElementById('meImg');
  const st = document.getElementById('stage');
  st.addEventListener('pointerdown', down);
  st.addEventListener('pointermove', move);
  st.addEventListener('pointerup', up);
  st.addEventListener('pointercancel', up);
  tools();
}

function strip() {
  const el = document.getElementById('fitStrip');
  if (!el) return;
  const on = new Set(T.layers.map(L => L.it.id));
  const order = ['outer', 'layer', 'top', 'dress', 'bottom', 'shoes', 'bag', 'acc'];
  const list = A.S.items.filter(canWear).sort((a, b) => order.indexOf(E.catOf(a)) - order.indexOf(E.catOf(b)));
  el.innerHTML = list.map(it => `<button class="${on.has(it.id) ? 'on' : ''}" data-act="fit-toggle" data-id="${it.id}" aria-label="${E.itemName(it)}">${A.tile(it)}</button>`).join('');
}

function tools() {
  const el = document.getElementById('fitTools');
  if (!el) return;
  const L = T.sel;
  if (!L) {
    el.innerHTML = T.meUrl
      ? `<p>Нажмите на вещь на фото и двигайте пальцем. Двумя пальцами — размер и поворот.</p>
         <button class="btn" data-act="fit-photo">Сменить фото</button>${T.layers.length ? '<button class="btn" data-act="fit-clear">Снять все</button>' : ''}`
      : '';
    return;
  }
  const photo = !!L.it.photo;
  el.innerHTML = `
    <button class="btn" data-act="fit-minus" aria-label="Меньше">−</button>
    <button class="btn" data-act="fit-plus" aria-label="Больше">+</button>
    <button class="btn" data-act="fit-rotl" aria-label="Повернуть влево">↺</button>
    <button class="btn" data-act="fit-rotr" aria-label="Повернуть вправо">↻</button>
    <button class="btn" data-act="fit-down">Под низ</button>
    <button class="btn" data-act="fit-up">Наверх</button>
    ${photo ? `<button class="btn" data-act="fit-bg">${L.bg ? 'Убрать фон' : 'Вернуть фон'}</button>` : ''}
    ${photo && !L.bg ? `<button class="btn" data-act="fit-tol">${['Вырезать смелее', 'Вырезать смелее', 'Вырезать бережнее'][L.tol]}</button>` : ''}
    <button class="btn danger" data-act="fit-del">Снять</button>`;
}

// ---------- рамка фото внутри сцены ----------
function box() {
  const st = document.getElementById('stage');
  const sw = st.clientWidth, sh = st.clientHeight;
  const img = T.meImg;
  const nw = img?.naturalWidth || 9, nh = img?.naturalHeight || 20;
  const k = Math.min(sw / nw, sh / nh);
  const w = nw * k, h = nh * k;
  return { x: (sw - w) / 2, y: (sh - h) / 2, w, h, nw, nh };
}
function apply(L, b = box()) {
  const w = L.w * b.w, h = w * L.ratio;
  L.el.style.width = w + 'px';
  L.el.style.transform = `translate(${b.x + L.x * b.w - w / 2}px,${b.y + L.y * b.h - h / 2}px) rotate(${L.r}deg)`;
  L.el.style.zIndex = L.z;
}
function layoutAll() { const b = box(); T.layers.forEach(L => apply(L, b)); }
addEventListener('resize', () => { if (document.getElementById('stage')) layoutAll(); });

// ---------- слои ----------
async function srcFor(L) {
  const it = L.it;
  if (!it.photo) return A.shapeImg(it.type, it.color);
  if (L.bg) return A.photoUrl(it);
  const key = `cut:${it.id}:${it.v || 0}:${L.tol}`;
  if (T.urls.has(key)) return T.urls.get(key);
  let blob = await DB.getBlob(key).catch(() => null);
  if (!blob) {
    blob = await cutout(it.photo, TOL[L.tol]);
    if (!blob) { A.toast('Фон не вырезался: снимите вещь на ровном светлом фоне'); L.bg = true; return A.photoUrl(it); }
    DB.putBlob(key, blob).catch(() => {});
  }
  const url = URL.createObjectURL(blob);
  T.urls.set(key, url);
  return url;
}
async function addLayer(it) {
  if (!document.getElementById('stage')) return;
  const saved = fits()[it.id];
  const p = PLACE[placeKey(it)] || [0.5, 0.5, 0.4];
  const L = saved ? { it, ...saved } : { it, x: p[0], y: p[1], w: p[2], r: 0, z: 10 + ZORD.indexOf(placeKey(it)) * 10, bg: false, tol: 1 };
  L.it = it;
  L.el = new Image();
  L.el.className = 'layer';
  L.el.alt = E.itemName(it);
  L.el.draggable = false;
  L.el.src = await srcFor(L);
  await L.el.decode().catch(() => {});
  L.ratio = (L.el.naturalHeight || 1) / (L.el.naturalWidth || 1);
  const st = document.getElementById('stage');
  if (!st) return;
  st.appendChild(L.el);
  T.layers.push(L);
  apply(L);
}
async function refreshSrc(L) {
  L.el.src = await srcFor(L);
  await L.el.decode().catch(() => {});
  L.ratio = (L.el.naturalHeight || 1) / (L.el.naturalWidth || 1);
  apply(L);
}
function select(L) {
  T.layers.forEach(x => x.el.classList.toggle('sel', x === L));
  T.sel = L;
  tools();
}
function removeLayer(L) {
  L.el.remove();
  T.layers = T.layers.filter(x => x !== L);
  if (T.sel === L) T.sel = null;
  rememberSet(); tools(); strip();
}

// ---------- пальцы: двигать, размер, поворот ----------
function down(e) {
  const L = T.layers.find(x => x.el === e.target);
  if (!L) { if (T.ptr.size === 0) select(null); if (!T.sel) return; }
  if (L && L !== T.sel) select(L);
  try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* синтетическое касание */ }
  T.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  begin();
}
function begin() {
  const L = T.sel;
  if (!L) return;
  const ps = [...T.ptr.values()];
  T.start = { x: L.x, y: L.y, w: L.w, r: L.r, p: ps.map(p => ({ ...p })) };
}
function move(e) {
  if (!T.ptr.has(e.pointerId) || !T.sel) return;
  T.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (!T.raf) T.raf = requestAnimationFrame(step);
}
function step() {
  T.raf = 0;
  const L = T.sel, s = T.start;
  if (!L || !s) return;
  const b = box();
  const ps = [...T.ptr.values()];
  if (ps.length === 1 && s.p.length === 1) {
    L.x = s.x + (ps[0].x - s.p[0].x) / b.w;
    L.y = s.y + (ps[0].y - s.p[0].y) / b.h;
  } else if (ps.length >= 2 && s.p.length >= 2) {
    const d = (a, c) => Math.hypot(c.x - a.x, c.y - a.y);
    const ang = (a, c) => Math.atan2(c.y - a.y, c.x - a.x) * 180 / Math.PI;
    const m0 = { x: (s.p[0].x + s.p[1].x) / 2, y: (s.p[0].y + s.p[1].y) / 2 };
    const m1 = { x: (ps[0].x + ps[1].x) / 2, y: (ps[0].y + ps[1].y) / 2 };
    L.w = Math.max(0.05, Math.min(1.6, s.w * d(ps[0], ps[1]) / Math.max(10, d(s.p[0], s.p[1]))));
    L.r = s.r + ang(ps[0], ps[1]) - ang(s.p[0], s.p[1]);
    L.x = s.x + (m1.x - m0.x) / b.w;
    L.y = s.y + (m1.y - m0.y) / b.h;
  }
  apply(L, b);
}
function up(e) {
  if (!T.ptr.has(e.pointerId)) return;
  T.ptr.delete(e.pointerId);
  if (T.sel) { remember(T.sel); begin(); }
}

// ---------- кнопки ----------
export async function fitAction(act, el) {
  const L = T.sel;
  switch (act) {
    case 'fit-photo': document.getElementById('inMe').click(); return true;
    case 'fit-toggle': {
      const on = T.layers.find(x => x.it.id === el.dataset.id);
      if (on) removeLayer(on);
      else {
        const it = A.S.items.find(i => i.id === el.dataset.id);
        if (it) { await addLayer(it); rememberSet(); select(T.layers[T.layers.length - 1]); strip(); }
      }
      return true;
    }
    case 'fit-clear': [...T.layers].forEach(removeLayer); return true;
    case 'fit-save': saveImage(); return true;
  }
  if (!L) return false;
  switch (act) {
    case 'fit-minus': L.w = Math.max(0.05, L.w * 0.92); break;
    case 'fit-plus': L.w = Math.min(1.6, L.w * 1.08); break;
    case 'fit-rotl': L.r -= 5; break;
    case 'fit-rotr': L.r += 5; break;
    case 'fit-down': L.z = Math.min(...T.layers.map(x => x.z)) - 1; break;
    case 'fit-up': L.z = Math.max(...T.layers.map(x => x.z)) + 1; break;
    case 'fit-bg': L.bg = !L.bg; await refreshSrc(L); tools(); break;
    case 'fit-tol': L.tol = (L.tol + 1) % 3; await refreshSrc(L); tools(); break;
    case 'fit-del': removeLayer(L); return true;
    default: return false;
  }
  apply(L); remember(L);
  return true;
}

// Новое фото во весь рост
export async function setMyPhoto(file) {
  A.toast('Обрабатываю фото…');
  try {
    const { blob } = await DB.processPhoto(file, 1600, false);
    await DB.putBlob('me', blob);
    const keep = T.layers.map(L => L.it);
    await openTryon(keep);
  } catch { A.toast('Не получилось открыть фото'); }
}

// ---------- сохранить картинку ----------
async function saveImage() {
  const b = box();
  const k = Math.min(1, 1600 / b.nh);
  const W = Math.round(b.nw * k), H = Math.round(b.nh * k);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const x = cv.getContext('2d');
  x.drawImage(T.meImg, 0, 0, W, H);
  for (const L of [...T.layers].sort((a, c) => a.z - c.z)) {
    const w = L.w * W, h = w * L.ratio;
    x.save();
    x.translate(L.x * W, L.y * H);
    x.rotate(L.r * Math.PI / 180);
    x.drawImage(L.el, -w / 2, -h / 2, w, h);
    x.restore();
  }
  const blob = await new Promise(r => cv.toBlob(r, 'image/jpeg', 0.92));
  const name = `primerka-${new Date().toISOString().slice(0, 10)}.jpg`;
  const file = new File([blob], name, { type: 'image/jpeg' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Примерка' }); return; } catch { /* отменила — сохраним файлом */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  A.toast('Картинка сохранена в «Загрузки»');
}

// ---------- вырезать фон у вещи ----------
// Фон — то, что связано с краями кадра и похоже по цвету на края. Мелкие пятна убираем, край смягчаем.
export async function cutout(blob, tol) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, 640 / Math.max(bmp.width, bmp.height));
  const W = Math.round(bmp.width * k), H = Math.round(bmp.height * k);
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.drawImage(bmp, 0, 0, W, H);
  const img = cx.getImageData(0, 0, W, H), d = img.data, N = W * H;

  // цвета фона по краям (несколько групп: тень, складка простыни)
  const refs = [];
  const sample = i => {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const f = refs.find(c => (c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2 < 900);
    if (f) f[3]++; else if (refs.length < 8) refs.push([r, g, b, 1]);
  };
  for (let x = 0; x < W; x += 2) { sample(x); sample((H - 1) * W + x); }
  for (let y = 0; y < H; y += 2) { sample(y * W); sample(y * W + W - 1); }
  const total = refs.reduce((s, c) => s + c[3], 0);
  const bg = refs.filter(c => c[3] >= total * 0.04);
  const t2 = tol * tol;
  const like = i => {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    for (const c of bg) if ((c[0] - r) ** 2 + (c[1] - g) ** 2 + (c[2] - b) ** 2 < t2) return true;
    return false;
  };

  const mask = new Uint8Array(N); // 1 — фон
  const q = new Int32Array(N);
  let qh = 0, qt = 0;
  const seed = i => { if (!mask[i] && like(i)) { mask[i] = 1; q[qt++] = i; } };
  for (let x = 0; x < W; x++) { seed(x); seed((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { seed(y * W); seed(y * W + W - 1); }
  while (qh < qt) {
    const i = q[qh++], x = i % W;
    if (x > 0) seed(i - 1);
    if (x < W - 1) seed(i + 1);
    if (i >= W) seed(i - W);
    if (i < N - W) seed(i + W);
  }

  // мелкие пятна вещи (шум, пылинки) — в фон; оставляем крупные куски
  const lab = new Int32Array(N);
  let id = 0, keepMin = N * 0.004, fg = 0;
  for (let s = 0; s < N; s++) {
    if (mask[s] || lab[s]) continue;
    id++; qh = 0; qt = 0; q[qt++] = s; lab[s] = id;
    while (qh < qt) {
      const i = q[qh++], x = i % W;
      const nb = [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i >= W ? i - W : -1, i < N - W ? i + W : -1];
      for (const n of nb) if (n >= 0 && !mask[n] && !lab[n]) { lab[n] = id; q[qt++] = n; }
    }
    if (qt < keepMin) for (let j = 0; j < qt; j++) mask[q[j]] = 1;
    else fg += qt;
  }
  if (fg < N * 0.03 || fg > N * 0.97) return null;

  // прозрачность, мягкий край и рамка по вещи
  let x0 = W, y0 = H, x1 = 0, y1 = 0;
  for (let i = 0; i < N; i++) {
    const x = i % W, y = (i / W) | 0;
    if (mask[i]) { d[i * 4 + 3] = 0; continue; }
    const edge = (x > 0 && mask[i - 1]) || (x < W - 1 && mask[i + 1]) || (i >= W && mask[i - W]) || (i < N - W && mask[i + W]);
    if (edge) d[i * 4 + 3] = 150;
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  cx.putImageData(img, 0, 0);
  const out = document.createElement('canvas');
  out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return new Promise(r => out.toBlob(r, 'image/webp', 0.9));
}
