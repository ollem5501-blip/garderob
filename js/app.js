// Гардероб — экраны и управление.
import * as D from './data.js';
import * as E from './engine.js';
import * as DB from './db.js';
import * as WX from './weather.js';
import { DEMO } from './demo.js';

const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);

const THEMES = [
  { id: 't1', name: 'Беж и зеленый', c: ['#EFE7D8', '#4F6340', '#B65A38', '#E9C46A'], meta: '#EFE7D8' },
  { id: 't2', name: 'Темно-зеленый и желтый', c: ['#1F2E25', '#E3B54A', '#C8714C', '#EFE6D6'], meta: '#1F2E25' },
  { id: 't3', name: 'Беж и терракота', c: ['#F2EADC', '#B65A38', '#4F6340', '#F0D58C'], meta: '#F2EADC' },
  { id: 't4', name: 'Беж с зеленым верхом', c: ['#2E4033', '#B65A38', '#E3B54A', '#EEE6D6'], meta: '#2E4033' },
  { id: 't5', name: 'Темно-зеленый и терракота', c: ['#22332A', '#C8693F', '#E9C46A', '#F1E8D8'], meta: '#22332A' },
  { id: 't6', name: 'Светлый беж', c: ['#F3ECDF', '#4F6340', '#C8714C', '#E3B54A'], meta: '#F3ECDF' },
];

const S = {
  prof: DB.load('profile', {}),
  set: DB.load('settings', { theme: 't1' }),
  items: [],
  tab: 'today',
  occ: guessOcc(),
  day: 0,
  manual: null,
  days: null,
  outfits: [], oi: 0,
  filter: 'all',
  shop: null,
  step: 0,
  draft: null,
  queue: [],
  sheet: null,
};

function guessOcc() {
  const d = new Date(), wd = d.getDay(), h = d.getHours();
  return wd > 0 && wd < 6 && h < 17 ? 'work' : 'walk';
}

// ---------- фото ----------
const urls = new Map();
function photoUrl(it) {
  if (!it.photo) return null;
  const k = it.id + ':' + (it.v || 0);
  if (!urls.has(k)) urls.set(k, URL.createObjectURL(it.photo));
  return urls.get(k);
}
function shapeOf(type) {
  const t = D.TYPE[type];
  if (!t) return 's-top';
  if (t.cat === 'bottom') return type.startsWith('skirt') ? 's-skirt' : 's-pants';
  if (t.cat === 'shoes') return ['sneakers', 'keds'].includes(type) ? 's-sneaker' : ['boots', 'ankleboots', 'winterboots'].includes(type) ? 's-boot' : 's-heel';
  if (t.cat === 'acc') return type === 'hat' ? 's-hat' : type === 'belt' ? 's-belt' : 's-scarf';
  return { top: 's-top', dress: 's-dress', layer: 's-blazer', outer: 's-coat', bag: 's-bag' }[t.cat];
}
// Силуэты рисуем один раз в картинку (растр): так список вещей листается без рывков
const SHAPES = {
  's-top': [['M30 16 L42 10 Q50 20 58 10 L70 16 L88 34 L77 45 L70 38 L70 90 H30 V38 L23 45 L12 34 Z']],
  's-pants': [['M30 6 H70 L76 94 H57 L50 34 L43 94 H24 Z']],
  's-skirt': [['M34 12 H66 L80 88 H20 Z']],
  's-dress': [['M38 6 H44 Q50 14 56 6 H62 L64 30 L58 40 L80 94 H20 L42 40 L36 30 Z']],
  's-blazer': [['M30 10 L44 7 L50 36 L56 7 L70 10 L86 28 L84 84 H16 L14 28 Z'], ['M50 36 V84', 'line']],
  's-coat': [['M32 6 L44 3 L50 28 L56 3 L68 6 L84 26 L86 96 H14 L16 26 Z'], ['M50 28 V96', 'line']],
  's-boot': [['M26 14 H50 V58 Q50 66 60 68 L82 73 Q90 75 90 84 V90 H26 Z'], ['M26 88 H90 V93 H26 Z', 'shade']],
  's-sneaker': [['M8 56 Q10 40 26 40 L42 42 Q56 54 76 56 Q92 58 92 72 V78 H8 Z'], ['M8 76 H92 V82 H8 Z', 'shade']],
  's-heel': [['M10 58 Q28 54 44 64 L72 46 Q86 40 90 54 L88 60 H82 L80 84 H75 L73 64 L50 78 H10 Z']],
  's-bag': [['M34 40 Q34 16 50 16 Q66 16 66 40', 'handle'], ['M18 38 H82 L86 88 H14 Z']],
  's-scarf': [['M28 10 H72 V30 Q50 42 28 30 Z M38 30 H54 V92 H38 Z']],
  's-hat': [['M24 64 Q24 22 50 22 Q76 22 76 64 Z M18 62 H82 V76 H18 Z']],
  's-belt': [['M6 44 H94 V56 H6 Z'], ['M40 38 H58 V62 H40 Z', 'buckle']],
};
const shapeCache = new Map();
function shapeImg(type, color) {
  const key = shapeOf(type) + ':' + color;
  if (shapeCache.has(key)) return shapeCache.get(key);
  const c = D.COL[color] || D.COL.grey;
  const cv = document.createElement('canvas');
  cv.width = 300; cv.height = 300;
  const x = cv.getContext('2d');
  x.scale(3, 3);
  let fill = c.hex;
  if (c.print) {
    const pc = document.createElement('canvas'); pc.width = pc.height = 8;
    const px = pc.getContext('2d'); px.fillStyle = '#F1EBDD'; px.fillRect(0, 0, 8, 8);
    px.fillStyle = '#3A3C42'; px.fillRect(0, 0, 4, 8);
    fill = x.createPattern(pc, 'repeat');
  }
  const light = D.LIGHT.has(c.id) || c.id === 'white';
  for (const [d, kind] of SHAPES[shapeOf(type)]) {
    const p = new Path2D(d);
    if (kind === 'line' || kind === 'handle' || kind === 'buckle') {
      x.strokeStyle = kind === 'handle' ? (c.print ? '#3A3C42' : c.hex) : 'rgba(0,0,0,.3)';
      x.lineWidth = kind === 'handle' ? 5 : kind === 'buckle' ? 4 : 2;
      x.stroke(p);
    } else if (kind === 'shade') {
      x.fillStyle = 'rgba(0,0,0,.25)'; x.fill(p);
    } else {
      x.fillStyle = fill; x.fill(p);
      if (light) { x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 1.5; x.stroke(p); }
    }
  }
  const url = cv.toDataURL('image/png');
  shapeCache.set(key, url);
  return url;
}
function shape(type, color) {
  return `<img class="sil" src="${shapeImg(type, color)}" alt="">`;
}
const tile = it => `<div class="tile">${photoUrl(it) ? `<img src="${photoUrl(it)}" alt="" loading="lazy" decoding="async">` : shape(it.type, it.color)}</div>`;

// ---------- погода и контекст ----------
const SEASON_TEMP = { winter: -3, spring: 10, summer: 22, autumn: 8 };
function dayDate() { const d = new Date(); d.setDate(d.getDate() + S.day); return d; }
function wxNow() {
  if (S.manual) return { ...S.manual, text: S.manual.snow ? 'снег' : S.manual.rain ? 'дождь' : 'без осадков', manual: 1 };
  const d = S.days?.[S.day];
  if (d) return d;
  const season = D.seasonOf(dayDate());
  return { temp: SEASON_TEMP[season], rain: false, snow: false, wind: 0, text: 'погода не задана', guess: 1 };
}
function ctx() {
  const w = wxNow();
  return E.makeCtx({ occ: S.occ, temp: w.temp, rain: w.rain, snow: w.snow, wind: w.wind || 0, season: D.seasonOf(dayDate()) });
}
async function loadWeather() {
  if (!S.prof.city) return;
  const days = await WX.forecast(S.prof.city);
  if (days && JSON.stringify(days) !== JSON.stringify(S.days)) {
    S.days = days;
    recompute();
    if (S.prof.done && S.tab === 'today' && !S.sheet) renderToday(false);
  }
}

// ---------- общий показ ----------
function setTheme() {
  const th = THEMES.find(t => t.id === S.set.theme) || THEMES[0];
  document.documentElement.dataset.theme = th.id;
  $('meta[name=theme-color]').content = th.meta;
}
function show(html, anim = true) {
  const v = $('#view');
  v.innerHTML = html;
  v.classList.remove('in');
  if (anim && !S.quiet) { void v.offsetWidth; v.classList.add('in'); }
}
function render() {
  setTheme();
  const nav = $('#nav');
  if (!S.prof.done) { nav.hidden = true; return renderOnboarding(); }
  nav.hidden = false;
  nav.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.tab === S.tab));
  ({ today: renderToday, wardrobe: renderWardrobe, shop: renderShop, me: renderMe })[S.tab]();
}
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}

// ---------- образы ----------
function recompute() {
  S.outfits = E.suggest(S.items, ctx(), S.prof, 12);
  S.oi = 0;
}
function wxLabel() {
  const w = wxNow();
  const t = (w.temp > 0 ? '+' : '') + w.temp + '°';
  return w.guess ? 'Указать погоду' : `${t} · ${w.text}`;
}
function renderToday(anim = true) {
  const d = dayDate();
  const ct = D.CTM[S.prof.colortype];
  const occ = D.OCCASIONS.map(o => `<button class="pill${o.id === S.occ ? ' on' : ''}" data-act="occ" data-id="${o.id}">${o.name}</button>`).join('');
  show(`
    <header class="top">
      <div class="date">${cap(d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
      <h1 class="ttl">Образ<br>на ${S.day ? 'завтра' : 'сегодня'}</h1>
      <div class="chips">
        <button class="chip" data-act="weather">${esc(wxLabel())}</button>
        <button class="chip" data-act="day">${S.day ? 'Завтра' : 'Сегодня'} ⇄</button>
        ${ct ? `<button class="chip" data-act="tab" data-tab="me">Вы: ${ct.name}</button>` : ''}
      </div>
    </header>
    <div class="occ">${occ}</div>
    <div id="look" class="fade">${lookHtml()}</div>
    <div id="teaser"></div>`, anim);
  teaser();
}
const ORDER = ['outer', 'layer', 'top', 'dress', 'bottom', 'shoes', 'bag', 'acc'];
function lookHtml() {
  if (!S.items.length) return `
    <div class="card empty">
      <div class="ttl">Гардероб пока пуст</div>
      <p>Сфотографируйте свои вещи — и я буду собирать из них образы под погоду и повод.</p>
      <button class="btn main" data-act="add">Добавить вещь</button>
      <button class="btn" data-act="demo">Посмотреть на примере</button>
    </div>`;
  const o = S.outfits[S.oi];
  if (!o) return `
    <div class="card empty">
      <div class="ttl">Не из чего собрать</div>
      <p>Для повода «${D.OCC[S.occ].name}»${wxNow().guess ? '' : ` при погоде ${esc(wxLabel())}`} пока не хватает подходящих вещей. Загляните во вкладку «Докупить» или добавьте вещи.</p>
      <button class="btn main" data-act="tab" data-tab="shop">Что докупить</button>
    </div>`;
  const its = [...o.items].sort((a, b) => ORDER.indexOf(E.catOf(a)) - ORDER.indexOf(E.catOf(b)));
  const n = its.length <= 2 ? 2 : its.length === 3 || its.length === 5 || its.length === 6 ? 3 : 4;
  const tiles = its.map(it => `<button data-act="edit" data-id="${it.id}">${tile(it)}<div class="nm">${esc(E.itemName(it, true))}</div></button>`).join('');
  const why = o.plus.slice(0, 2);
  const c = ctx();
  const sh = E.shoesAdvice(o, c, S.prof), hr = E.hairAdvice(S.prof, c, o), mk = E.makeupAdvice(S.prof, c, o);
  const row = (icon, cap, a) => `<div class="row"><span class="ic"><svg><use href="#${icon}"/></svg></span><div class="tx"><small>${cap}</small>${esc(a.text)}${a.note ? `<span class="note">${esc(a.note)}</span>` : ''}</div></div>`;
  return `
    <div class="card">
      <div class="og n${n}">${tiles}</div>
      ${why.length ? `<p class="why">Почему так: <b>${esc(why[0])}</b>${why[1] ? `; ${esc(why[1])}` : ''}.</p>` : ''}
      ${o.minus[0] ? `<p class="warn">Обратите внимание: ${esc(o.minus[0])}.</p>` : ''}
      <div class="obar">
        <span class="cnt">${S.oi + 1} из ${S.outfits.length}</span>
        <button class="btn" data-act="next">Другой</button>
        <button class="btn main" data-act="wear">Надену</button>
      </div>
    </div>
    <div class="acc">
      ${row('i-shoe', 'Обувь', sh)}${row('i-hair', 'Прическа', hr)}${row('i-lips', 'Макияж', mk)}
    </div>`;
}
function swapLook() {
  const el = $('#look');
  if (!el) return;
  // новый образ сразу на месте и плавно проявляется; пауза на подсчет — до начала движения, а не посередине
  el.innerHTML = lookHtml();
  el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
}
function teaser() {
  const el = $('#teaser');
  if (!el || S.items.length < 3) return;
  withShop(sh => {
    const i = sh.ideas[0];
    if (!i || !$('#teaser')) return;
    $('#teaser').innerHTML = `<button class="buy" data-act="tab" data-tab="shop"><b>Докупить</b>${esc(D.TYPE[i.type].name)} · ${esc(D.COL[i.color].name)} — ${esc(i.why)}</button>`;
  });
}
function withShop(fn) {
  if (S.shop) return fn(S.shop);
  const run = () => { S.shop = E.shopping(S.items, S.prof); fn(S.shop); };
  (window.requestIdleCallback || (f => setTimeout(f, 30)))(run);
}

// ---------- гардероб ----------
function renderWardrobe(anim = true) {
  const cnt = c => S.items.filter(it => E.catOf(it) === c).length;
  const f = ['all', ...D.CATEGORIES.map(c => c.id).filter(cnt)];
  if (!f.includes(S.filter)) S.filter = 'all';
  const list = S.items.filter(it => S.filter === 'all' || E.catOf(it) === S.filter)
    .sort((a, b) => ORDER.indexOf(E.catOf(a)) - ORDER.indexOf(E.catOf(b)));
  show(`
    <header class="top"><h1 class="ttl">Гардероб</h1>
      <div class="sub">${S.items.length} ${E.plural(S.items.length, 'вещь', 'вещи', 'вещей')}${S.items.some(i => i.demo) ? ' · есть пример' : ''}</div></header>
    ${S.items.length ? `<div class="occ">${f.map(c => `<button class="pill${S.filter === c ? ' on' : ''}" data-act="filter" data-id="${c}">${c === 'all' ? 'Все' : D.CAT[c].name}<span class="n">${c === 'all' ? S.items.length : cnt(c)}</span></button>`).join('')}</div>
    <div class="wg">${list.map(it => `<button data-act="edit" data-id="${it.id}">${tile(it)}<div class="nm">${esc(E.itemName(it, true))}</div></button>`).join('')}</div>`
    : `<div class="card empty"><div class="ttl">Начнем с фото</div>
        <p>Положите вещь на ровный светлый фон или повесьте на дверь и сфотографируйте целиком. Цвет я определю сама, тип и повод — в пару касаний.</p>
        <button class="btn main" data-act="add">Добавить вещь</button> <button class="btn" data-act="demo">Пример гардероба</button></div>`}
    <button class="fab" data-act="add">+ Добавить</button>`, anim);
}

function addSheet() {
  openSheet(`
    <div class="sh">Новая вещь</div>
    <p class="p">Совет: вещь целиком, ровный светлый фон, дневной свет.</p>
    <div class="list">
      <button class="row" data-act="pick" data-in="inCam"><span class="ic"><svg><use href="#n-looks"/></svg></span><div class="tx"><b>Сфотографировать</b></div></button>
      <button class="row" data-act="pick" data-in="inGal"><span class="ic"><svg><use href="#n-wardrobe"/></svg></span><div class="tx"><b>Выбрать из галереи</b><span class="note">можно сразу несколько фото</span></div></button>
      <button class="row" data-act="nophoto"><span class="ic"><svg><use href="#n-shop"/></svg></span><div class="tx"><b>Без фото</b><span class="note">выберу тип и цвет вручную</span></div></button>
    </div>`);
}

async function takeFiles(files) {
  if (!files.length) return;
  $('#sheetBody').innerHTML = '<div class="spin">Обрабатываю фото…</div>';
  for (const f of files) {
    try {
      const { blob, colors } = await DB.processPhoto(f);
      S.queue.push({ photo: blob, colors });
    } catch { toast('Не получилось открыть одно из фото'); }
  }
  nextDraft();
}
function nextDraft() {
  const q = S.queue.shift();
  if (!q) return;
  S.draft = { id: DB.uid(), photo: q.photo, colors: q.colors, color: q.colors[0] || '', type: '', seasons: [], occ: [], isNew: 1 };
  editorOpen();
}
function editorOpen() {
  openSheet('<div id="ed"></div>', true);
  editorRender();
}
function editorRender() {
  const d = S.draft, el = $('#ed');
  if (!el) return;
  const t = D.TYPE[d.type];
  const cat = d.cat || t?.cat || '';
  const purl = d.photo ? (d._url ||= URL.createObjectURL(d.photo)) : null;
  const hint = (d.colors || []).filter(c => D.COL[c]);
  el.innerHTML = `
    <div class="sh">${d.isNew ? 'Новая вещь' : 'Вещь'}${S.queue.length ? ` <span class="sub">еще ${S.queue.length} фото</span>` : ''}</div>
    <div class="edph">${purl ? `<img src="${purl}" alt="">` : d.type ? shape(d.type, d.color || 'grey') : shape('tshirt', d.color || 'grey')}</div>
    <div class="lbl">Что это</div>
    <div class="opts">${D.CATEGORIES.map(c => `<button class="opt${cat === c.id ? ' on' : ''}" data-act="dcat" data-id="${c.id}">${c.name}</button>`).join('')}</div>
    ${cat ? `<div class="lbl">Точнее</div><div class="opts">${D.TYPES.filter(x => x.cat === cat).map(x => `<button class="opt${d.type === x.id ? ' on' : ''}" data-act="dtype" data-id="${x.id}">${x.name}</button>`).join('')}</div>` : ''}
    <div class="lbl">Цвет${hint.length ? ` · похоже на: ${hint.map(c => D.COL[c].name).join(', ')}` : ''}</div>
    <div class="cols">${D.COLORS.map(c => `<button class="col${d.color === c.id ? ' on' : ''}" data-act="dcolor" data-id="${c.id}"><i style="background:${c.hex}"></i>${c.short || c.name}</button>`).join('')}</div>
    <div class="lbl">Сезон</div>
    <div class="opts">${D.SEASONS.map(s => `<button class="opt${d.seasons.includes(s.id) ? ' on' : ''}" data-act="dseason" data-id="${s.id}">${s.name}</button>`).join('')}</div>
    <div class="lbl">Куда носить</div>
    <div class="opts">${D.OCCASIONS.map(o => `<button class="opt${d.occ.includes(o.id) ? ' on' : ''}" data-act="docc" data-id="${o.id}">${o.name}</button>`).join('')}</div>
    <div class="lbl">Название, если хочется</div>
    <input class="field" id="dname" value="${esc(d.name || '')}" placeholder="${t ? esc(t.name + ' · ' + (D.COL[d.color]?.name || '')) : 'например, любимая блузка'}" maxlength="40">
    <div class="bar">
      ${d.isNew ? '' : '<button class="btn danger" data-act="ddel">Удалить</button>'}
      <button class="btn main" data-act="dsave">${S.queue.length ? 'Сохранить и дальше' : 'Сохранить'}</button>
    </div>`;
}
function editItem(id) {
  const it = S.items.find(i => i.id === id);
  if (!it) return;
  S.draft = { ...it, seasons: [...(it.seasons || [])], occ: [...(it.occ || [])], _touchS: 1, _touchO: 1 };
  editorOpen();
}
function setDraftType(id) {
  const d = S.draft, t = D.TYPE[id];
  d.type = id; d.cat = t.cat;
  if (!d._touchS) d.seasons = [...t.s];
  if (!d._touchO) d.occ = [...t.occ];
}
async function saveDraft() {
  const d = S.draft;
  if (!d.type) return toast('Выберите, что это за вещь');
  if (!d.color) return toast('Выберите цвет');
  d.name = $('#dname')?.value.trim() || '';
  const it = { id: d.id, type: d.type, color: d.color, seasons: d.seasons, occ: d.occ, name: d.name, photo: d.photo || null, worn: d.worn || 0, demo: d.demo || 0, v: (d.v || 0) + 1, added: d.added || Date.now() };
  if (d._url) URL.revokeObjectURL(d._url);
  await DB.putItem(it);
  const i = S.items.findIndex(x => x.id === it.id);
  if (i >= 0) S.items[i] = it; else S.items.push(it);
  changed();
  if (S.queue.length) { nextDraft(); return; }
  closeSheet();
  toast(d.isNew ? 'Вещь добавлена' : 'Сохранено');
}
async function deleteDraft() {
  if (!confirm('Удалить эту вещь из гардероба?')) return;
  await DB.delItem(S.draft.id);
  S.items = S.items.filter(i => i.id !== S.draft.id);
  changed();
  closeSheet();
  toast('Вещь удалена');
}
function changed() { S.shop = null; S.dirty = true; recompute(); }

// ---------- докупить ----------
function renderShop() {
  const ct = D.CTM[S.prof.colortype], body = D.BODYM[S.prof.body];
  const palette = ct ? `
    <div class="h2">Ваши цвета · ${ct.name}</div>
    <div class="sw">${ct.good.map(c => `<span><i class="dot" style="background:${D.COL[c].hex}"></i>${D.COL[c].name}</span>`).join('')}</div>
    <p class="p" style="margin-top:12px">У лица лучше не носить: ${ct.bad.map(c => D.COL[c].name).join(', ')}.</p>` : '';
  const tips = body ? `<div class="h2">Фигура «${body.name}»</div><ul class="tips">${body.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : '';
  show(`
    <header class="top"><h1 class="ttl">Докупить</h1><div class="sub" id="shopSub">Считаю по вашим вещам…</div></header>
    <div id="shopBody"><div class="spin">Перебираю сочетания…</div></div>
    ${palette}${tips}<div style="height:12px"></div>`);
  withShop(sh => {
    if (S.tab !== 'shop' || !$('#shopBody')) return;
    $('#shopSub').textContent = S.items.length
      ? `${S.items.length} ${E.plural(S.items.length, 'вещь', 'вещи', 'вещей')} · ${sh.total} ${E.plural(sh.total, 'удачное сочетание', 'удачных сочетания', 'удачных сочетаний')} на все поводы и погоду`
      : 'Гардероб пуст — вот с чего начать';
    const idea = (type, color, why) => `<div class="card"><div class="idea">${`<div class="tile">${shape(type, color)}</div>`}<div class="tx"><b>${esc(D.TYPE[type].name)} · ${esc(D.COL[color].name)}</b>${esc(why)}</div></div>${shopBtns(type, color)}</div>`;
    let html = '';
    if (sh.emptyOcc.length) html += `<div class="h2">Поводы без образа</div><p class="p">Пока не собрать ни одного образа: ${sh.emptyOcc.map(o => '«' + D.OCC[o].name + '»').join(', ')}. Покупки ниже это исправят.</p>`;
    html += `<div class="h2">Лучшие покупки</div>`;
    html += sh.ideas.length ? sh.ideas.map(i => idea(i.type, i.color, i.why)).join('')
      : '<p class="p">Гардероб хорошо собран: ни одна базовая вещь не добавит заметно новых сочетаний.</p>';
    if (sh.orphans.length) html += `<div class="h2">Вещи без пары</div><p class="p">С этими вещами пока не собрать удачный образ. Подойдет:</p>` +
      sh.orphans.map(o => `<div class="card"><div class="idea">${tile(o.item)}<div class="tx"><b>${esc(E.itemName(o.item))}</b>${o.type ? `подойдет: ${esc(D.TYPE[o.type].name.toLowerCase())}, цвет «${esc(D.COL[o.color].name)}»` : ''}</div></div>${o.type ? shopBtns(o.type, o.color) : ''}</div>`).join('');
    $('#shopBody').innerHTML = html;
  });
}

function shopBtns(type, color) {
  const l = D.shopLinks(type, color);
  return `<div class="shop"><a class="btn" href="${l.wb}" target="_blank" rel="noopener">Wildberries</a><a class="btn" href="${l.ozon}" target="_blank" rel="noopener">Озон</a></div>`;
}

// ---------- я ----------
function renderMe() {
  const p = S.prof;
  const r = (act, cap, val) => `<button class="row" data-act="${act}"><div class="tx"><small>${cap}</small>${esc(val)}</div><span class="go">›</span></button>`;
  show(`
    <header class="top"><h1 class="ttl">Я</h1><div class="sub">Подбор учитывает все это</div></header>
    <div class="list">
      ${r('pf-body', 'Рост и волосы', `${p.height ? p.height + ' см' : 'рост не указан'} · ${D.HAIR_LEN.find(h => h.id === p.hair)?.name.toLowerCase() || 'средние'} волосы`)}
      ${r('pf-shape', 'Тип фигуры', D.BODYM[p.body]?.name || 'не указан')}
      ${r('pf-color', 'Цветотип', D.CTM[p.colortype] ? `${D.CTM[p.colortype].name} (${D.CTM[p.colortype].note})` : 'не указан')}
      ${r('pf-city', 'Город для погоды', p.city?.name || 'не указан')}
    </div>
    <div class="h2">Оформление</div>
    <div class="themes">${THEMES.map(t => `<button class="th${S.set.theme === t.id ? ' on' : ''}" style="background:${t.c[0]};color:${['t2', 't4', 't5'].includes(t.id) ? '#F1E8D8' : '#2C3324'}" data-act="theme" data-id="${t.id}"><i>${t.c.slice(1).map(c => `<u style="background:${c}"></u>`).join('')}</i>${t.name}</button>`).join('')}</div>
    <div class="h2">Копия гардероба</div>
    <p class="p">Все вещи и фото хранятся только в этом телефоне. Сохраните копию в файл, чтобы не потерять при смене телефона.</p>
    <div class="list">
      <button class="row" data-act="export"><div class="tx"><b>Сохранить копию в файл</b></div><span class="go">›</span></button>
      <button class="row" data-act="import"><div class="tx"><b>Восстановить из файла</b></div><span class="go">›</span></button>
      ${S.items.some(i => i.demo) ? '<button class="row" data-act="undemo"><div class="tx"><b>Убрать пример гардероба</b><span class="note">ваши вещи останутся</span></div><span class="go">›</span></button>'
        : '<button class="row" data-act="demo"><div class="tx"><b>Добавить пример гардероба</b><span class="note">${DEMO.length} вещей, чтобы посмотреть подбор</span></div><span class="go">›</span></button>'}
    </div>
    <p class="p" style="margin-top:18px;opacity:.6">Погода — сервис Open-Meteo: туда уходят только координаты города. Больше ничего из приложения не отправляется.</p>`);
}

// ---------- анкета (первый запуск и правки) ----------
const STEPS = ['hello', 'body', 'shape', 'color', 'city'];
function renderOnboarding() {
  const name = STEPS[S.step];
  if (name === 'hello') return show(`
    <div class="ob">
      <div class="hero grow">
        <h1 class="ttl">Ваш личный<br>стилист</h1>
        <p>Соберу образы из ваших вещей — под повод, погоду и вашу внешность.</p>
        <ul><li>фото вещи — и она в гардеробе</li><li>образ на работу, свидание, праздник</li><li>обувь, прическа и макияж к образу</li><li>что докупить, чтобы вещи сочетались</li></ul>
        <p style="margin-top:20px;opacity:.65;font-size:13px">Сначала 4 коротких вопроса о вас — это 1 минута.</p>
      </div>
      <div class="bar"><button class="btn main" data-act="ob-next">Начать</button></div>
    </div>`);
  show(`<div class="ob"><div class="steps">${STEPS.slice(1).map((_, i) => `<i class="${i < S.step ? 'on' : ''}"></i>`).join('')}</div>
    <div class="grow" id="pf">${stepHtml(name)}</div>
    <div class="bar"><button class="btn" data-act="ob-back">Назад</button><button class="btn main" data-act="ob-next">${S.step === STEPS.length - 1 ? 'Готово' : 'Дальше'}</button></div></div>`);
}
function stepHtml(name) {
  const p = S.prof;
  if (name === 'body') return `
    <div class="sh" style="margin-top:20px">Рост и волосы</div>
    <p class="p">Рост нужен для пропорций: например, при росте до 160 см советую обувь в тон низа. Можно пропустить.</p>
    <div class="lbl">Рост, см</div>
    <input class="field" id="pHeight" type="number" inputmode="numeric" min="130" max="210" value="${p.height || ''}" placeholder="например, 165">
    <div class="lbl">Длина волос — для причесок</div>
    <div class="opts">${D.HAIR_LEN.map(h => `<button class="opt${(p.hair || '') === h.id ? ' on' : ''}" data-act="pf-hair" data-id="${h.id}">${h.name}</button>`).join('')}</div>`;
  if (name === 'shape') return `
    <div class="sh" style="margin-top:20px">Тип фигуры</div>
    <p class="p">Выберите похожий или посчитайте по меркам ниже.</p>
    <div class="cards">${D.BODY.map(b => `<button class="pick${p.body === b.id ? ' on' : ''}" data-act="pf-shapeset" data-id="${b.id}">${bodySvg(b.id)}<div><b>${b.name}</b><span>${b.hint}</span></div></button>`).join('')}</div>
    <div class="lbl">Не знаю — посчитать по меркам, см</div>
    <div class="meas">
      <label>Грудь<input class="field" id="mB" type="number" inputmode="numeric" value="${S.meas?.[0] || ''}"></label>
      <label>Талия<input class="field" id="mW" type="number" inputmode="numeric" value="${S.meas?.[1] || ''}"></label>
      <label>Бедра<input class="field" id="mH" type="number" inputmode="numeric" value="${S.meas?.[2] || ''}"></label>
    </div>
    <div class="bar" style="margin-top:10px"><button class="btn" data-act="pf-calc">Посчитать</button></div>
    <div id="calcRes"></div>`;
  if (name === 'color') return `
    <div class="sh" style="margin-top:20px">Цветотип</div>
    <p class="p">По нему подбираю цвета у лица и оттенки макияжа.</p>
    <div class="cards">${D.COLORTYPES.map(c => `<button class="pick${p.colortype === c.id ? ' on' : ''}" data-act="pf-ctset" data-id="${c.id}"><div><b>${c.name}</b><span>${c.note}</span><div class="dots">${c.swatch.map(s => `<u style="background:${s}"></u>`).join('')}</div></div></button>`).join('')}</div>
    <div class="lbl">Не знаю — 3 вопроса</div>
    <div class="p" style="margin-bottom:6px">1. Вены на запястье при дневном свете:</div>
    <div class="opts" data-q="veins">${qOpt('veins', 'warm', 'зеленоватые')}${qOpt('veins', 'cool', 'синие, фиолетовые')}</div>
    <div class="p" style="margin:12px 20px 6px">2. Что больше освежает лицо:</div>
    <div class="opts">${qOpt('metal', 'warm', 'золото')}${qOpt('metal', 'cool', 'серебро')}</div>
    <div class="p" style="margin:12px 20px 6px">3. Волосы (натуральный цвет) и кожа:</div>
    <div class="opts">${qOpt('depth', 'light', 'светлые волосы, мягкий контраст')}${qOpt('depth', 'deep', 'темные волосы, яркий контраст')}</div>
    <div id="ctRes"></div>`;
  if (name === 'city') return `
    <div class="sh" style="margin-top:20px">Город для погоды</div>
    <p class="p">Образы учитывают температуру, дождь и ветер. Без интернета беру последний прогноз или погоду, которую вы укажете сами.</p>
    ${p.city ? `<div class="result">Сейчас: <b>${esc(p.city.name)}</b> ${esc(p.city.region || '')}</div>` : ''}
    <div class="lbl">Найти город</div>
    <input class="field" id="cityQ" placeholder="например, Новополоцк" autocomplete="off">
    <div class="bar" style="margin-top:10px"><button class="btn" data-act="pf-find">Найти</button><button class="btn" data-act="pf-geo">Где я сейчас</button></div>
    <div class="list" id="cityRes" style="margin-top:12px"></div>`;
  return '';
}
const quiz = {};
function qOpt(q, v, label) { return `<button class="opt${quiz[q] === v ? ' on' : ''}" data-act="pf-quiz" data-q="${q}" data-v="${v}">${label}</button>`; }
function bodySvg(id) {
  const P = {
    hourglass: 'M10 6 H34 L28 30 L36 56 H8 L16 30 Z', pear: 'M14 6 H30 L28 28 L38 58 H6 L16 28 Z',
    triangle: 'M6 6 H38 L28 30 L30 58 H14 L16 30 Z', rectangle: 'M12 6 H32 L31 30 L32 58 H12 L13 30 Z', apple: 'M12 6 H32 Q40 30 32 58 H12 Q4 30 12 6 Z',
  };
  return `<svg viewBox="0 0 44 64" fill="currentColor"><path d="${P[id]}"/></svg>`;
}
function readStep() {
  const h = $('#pHeight');
  if (h) S.prof.height = h.value ? Math.max(120, Math.min(220, +h.value)) : '';
}
function saveProf() { DB.save('profile', S.prof); S.shop = null; S.dirty = true; recompute(); }

function profSheet(name) {
  openSheet(`<div id="pf" data-step="${name}">${stepHtml(name)}</div><div class="bar"><button class="btn main wide" data-act="pf-done">Готово</button></div>`, true);
}

// ---------- погода (лист) ----------
function weatherSheet() {
  const w = wxNow();
  const t = S.manual?.temp ?? w.temp;
  openSheet(`
    <div class="sh">Погода</div>
    ${S.days && !S.manual ? `<p class="p">${esc(S.prof.city?.name || '')}: днем ${w.temp > 0 ? '+' : ''}${w.temp}° (от ${S.days[S.day].tmin}° до ${S.days[S.day].tmax}°), ${esc(w.text)}, ветер ${w.wind} м/с.</p>` : ''}
    ${!S.prof.city ? '<p class="p">Город не указан — укажите его во вкладке «Я» или задайте погоду вручную.</p>' : ''}
    <div class="lbl">Задать вручную: <b id="tv">${t > 0 ? '+' : ''}${t}°</b></div>
    <input id="tr" type="range" min="-25" max="35" value="${t}" style="width:calc(100% - 40px);margin:0 20px;accent-color:var(--ac)">
    <div class="opts" style="margin-top:12px">
      <button class="opt${S.manual?.rain ? ' on' : ''}" data-act="wx-rain">Дождь</button>
      <button class="opt${S.manual?.snow ? ' on' : ''}" data-act="wx-snow">Снег</button>
    </div>
    <div class="bar">
      ${S.manual && S.days ? '<button class="btn" data-act="wx-auto">По прогнозу</button>' : ''}
      <button class="btn main" data-act="wx-set">Применить</button>
    </div>`);
  S.wxDraft = { temp: t, rain: !!S.manual?.rain, snow: !!S.manual?.snow, wind: 0 };
  $('#tr').addEventListener('input', e => { S.wxDraft.temp = +e.target.value; $('#tv').textContent = (S.wxDraft.temp > 0 ? '+' : '') + S.wxDraft.temp + '°'; });
}

// ---------- лист снизу и кнопка «Назад» ----------
function openSheet(html, full = false) {
  const sh = $('#sheet');
  $('#sheetBody').innerHTML = html;
  $('#sheetBody').scrollTop = 0;
  sh.classList.toggle('full', full);
  if (!S.sheet) history.pushState({ sheet: 1 }, '');
  if (S.sheet) return;
  S.sheet = true;
  // сначала лист рисуется за краем экрана, и только следующим кадром выезжает — без рывка в начале
  clearTimeout(sheetT);
  sh.classList.add('ready');
  void sh.offsetHeight;
  const imgs = [...sh.querySelectorAll('img')].map(i => i.decode().catch(() => {}));
  Promise.race([Promise.all(imgs), new Promise(r => setTimeout(r, 200))]).then(() =>
    requestAnimationFrame(() => requestAnimationFrame(() => { if (S.sheet) { sh.classList.add('on'); $('#scrim').classList.add('on'); } })));
}
let sheetT;
function closeSheetNow() {
  const sh = $('#sheet');
  sh.classList.remove('on'); $('#scrim').classList.remove('on');
  clearTimeout(sheetT);
  sheetT = setTimeout(() => { if (!S.sheet) sh.classList.remove('ready'); }, 300);
  S.sheet = null;
}
function closeSheet() { if (S.sheet) history.back(); }
addEventListener('popstate', () => {
  if (S.sheet) {
    closeSheetNow();
    S.queue = [];
    if (S.draft?._url) URL.revokeObjectURL(S.draft._url);
    S.draft = null;
    // экран под листом перерисовываем, когда лист уже уехал, и только если что-то поменялось
    if (S.dirty) setTimeout(() => { S.dirty = false; S.quiet = true; render(); S.quiet = false; }, 340);
  }
});

// ---------- действия ----------
document.addEventListener('click', async e => {
  const b = e.target.closest('[data-act]');
  if (!b) return;
  const id = b.dataset.id;
  switch (b.dataset.act) {
    case 'tab': if (S.sheet) closeSheet(); S.tab = b.dataset.tab; render(); scrollTo(0, 0); break;
    case 'occ': S.occ = id; recompute(); renderToday(false); break;
    case 'day': S.day = S.day ? 0 : 1; S.manual = null; recompute(); renderToday(false); break;
    case 'next': S.oi = (S.oi + 1) % S.outfits.length; swapLook(); break;
    case 'wear': {
      const o = S.outfits[S.oi], now = Date.now();
      for (const it of o.items) { it.worn = now; await DB.putItem(it); }
      toast('Отлично! Эти вещи пару дней буду предлагать реже');
      break;
    }
    case 'weather': weatherSheet(); break;
    case 'wx-rain': S.wxDraft.rain = !S.wxDraft.rain; b.classList.toggle('on'); break;
    case 'wx-snow': S.wxDraft.snow = !S.wxDraft.snow; b.classList.toggle('on'); break;
    case 'wx-set': S.manual = { ...S.wxDraft }; S.dirty = true; closeSheet(); recompute(); break;
    case 'wx-auto': S.manual = null; S.dirty = true; closeSheet(); recompute(); break;
    case 'filter': S.filter = id; renderWardrobe(false); break;
    case 'add': addSheet(); break;
    case 'pick': $('#' + b.dataset.in).click(); break;
    case 'nophoto': S.draft = { id: DB.uid(), type: '', color: '', seasons: [], occ: [], isNew: 1 }; editorOpen(); break;
    case 'edit': editItem(id); break;
    case 'dcat': S.draft.cat = id; if (D.TYPE[S.draft.type]?.cat !== id) S.draft.type = ''; editorRender(); break;
    case 'dtype': setDraftType(id); editorRender(); break;
    case 'dcolor': S.draft.color = id; editorRender(); break;
    case 'dseason': toggle(S.draft.seasons, id); S.draft._touchS = 1; editorRender(); break;
    case 'docc': toggle(S.draft.occ, id); S.draft._touchO = 1; editorRender(); break;
    case 'dsave': saveDraft(); break;
    case 'ddel': deleteDraft(); break;
    case 'demo': await addDemo(); break;
    case 'undemo': await removeDemo(); break;
    case 'theme': S.set.theme = id; DB.save('settings', S.set); render(); break;
    case 'export': exportBackup(); break;
    case 'import': $('#inBackup').click(); break;
    // анкета
    case 'ob-next': {
      readStep();
      const name = STEPS[S.step];
      if (S.step < STEPS.length - 1) S.step++;
      else { S.prof.done = 1; S.tab = S.items.length ? 'today' : 'wardrobe'; loadWeather(); }
      saveProf(); render(); scrollTo(0, 0);
      break;
    }
    case 'ob-back': readStep(); S.step = Math.max(0, S.step - 1); render(); break;
    case 'pf-body': profSheet('body'); break;
    case 'pf-shape': profSheet('shape'); break;
    case 'pf-color': profSheet('color'); break;
    case 'pf-city': profSheet('city'); break;
    case 'pf-done': readStep(); saveProf(); closeSheet(); break;
    case 'pf-hair': S.prof.hair = id; refreshStep(b); break;
    case 'pf-shapeset': S.prof.body = id; refreshStep(b); break;
    case 'pf-ctset': S.prof.colortype = id; refreshStep(b); break;
    case 'pf-calc': calcShape(); break;
    case 'pf-quiz': quiz[b.dataset.q] = b.dataset.v; calcCt(); refreshStep(b); break;
    case 'pf-find': findCity(); break;
    case 'pf-geo': geoCity(b); break;
    case 'pf-cityset': {
      S.prof.city = S.cities[+id]; S.days = null; S.manual = null;
      DB.save('wx', null); saveProf(); refreshStep(b);
      toast('Город сохранен: ' + S.prof.city.name);
      loadWeather();
      break;
    }
  }
});
function toggle(arr, v) { const i = arr.indexOf(v); i >= 0 ? arr.splice(i, 1) : arr.push(v); }
function refreshStep() {
  readStep();
  const pf = $('#pf');
  pf.innerHTML = stepHtml(pf.dataset.step || STEPS[S.step]);
  const res = S.ctMsg && $('#ctRes'); if (res) res.innerHTML = S.ctMsg;
}
function calcShape() {
  const b = +$('#mB').value, w = +$('#mW').value, h = +$('#mH').value;
  if (!b || !w || !h) return toast('Заполните все три мерки');
  S.meas = [b, w, h];
  let id;
  if (w >= b * 0.9 && w >= h * 0.85) id = 'apple';
  else if (h > b * 1.05) id = 'pear';
  else if (b > h * 1.05) id = 'triangle';
  else if (w <= Math.min(b, h) * 0.75) id = 'hourglass';
  else id = 'rectangle';
  S.prof.body = id;
  const pf = $('#pf');
  pf.innerHTML = stepHtml('shape');
  $('#calcRes').innerHTML = `<div class="result">По меркам: <b>${D.BODYM[id].name}</b>. ${D.BODYM[id].hint}.</div>`;
}
function calcCt() {
  const warm = (quiz.veins === 'warm') + (quiz.metal === 'warm');
  const cool = (quiz.veins === 'cool') + (quiz.metal === 'cool');
  if (!quiz.depth || warm + cool < 2) { S.ctMsg = ''; return; }
  if (warm === cool) { S.ctMsg = '<div class="result">Ответы разошлись: оттенок кожи нейтральный. Выберите карточку, которая ближе, — по ней видно, какие цвета вам нравятся у лица.</div>'; return; }
  const id = warm > cool ? (quiz.depth === 'light' ? 'spring' : 'autumn') : (quiz.depth === 'light' ? 'summer' : 'winter');
  S.prof.colortype = id;
  S.ctMsg = `<div class="result">Похоже, вы — <b>${D.CTM[id].name}</b> (${D.CTM[id].note}). Можно поменять в любой момент.</div>`;
}
async function findCity() {
  const q = $('#cityQ').value.trim();
  if (!q) return;
  $('#cityRes').innerHTML = '<div class="spin">Ищу…</div>';
  try {
    S.cities = await WX.findCity(q);
    if (!$('#cityRes')) return;
    $('#cityRes').innerHTML = S.cities.length ? S.cities.map((c, i) => `<button class="row" data-act="pf-cityset" data-id="${i}"><div class="tx"><b>${esc(c.name)}</b><span class="note">${esc(c.region)}</span></div></button>`).join('')
      : '<p class="p">Не нашла. Попробуйте написать иначе.</p>';
  } catch { if ($('#cityRes')) $('#cityRes').innerHTML = '<p class="p">Не получилось: нет интернета или сервис не ответил. Город можно указать позже.</p>'; }
}
async function geoCity(b) {
  try {
    const pl = await WX.myPlace();
    S.cities = [pl];
    S.prof.city = pl; S.days = null; DB.save('wx', null); saveProf(); refreshStep(b);
    toast('Погода будет по вашему месту'); loadWeather();
  } catch { toast('Не удалось узнать место — найдите город по названию'); }
}

// ---------- пример, копия ----------
async function addDemo() {
  const have = new Set(S.items.map(i => i.id));
  for (const d of DEMO) {
    if (have.has(d.id)) continue;
    const it = { ...d, seasons: [...D.TYPE[d.type].s], occ: [...D.TYPE[d.type].occ], added: Date.now() };
    await DB.putItem(it); S.items.push(it);
  }
  changed(); closeSheetNow();
  toast('Пример гардероба добавлен');
  S.tab = 'today'; render();
}
async function removeDemo() {
  for (const it of S.items.filter(i => i.demo)) await DB.delItem(it.id);
  S.items = S.items.filter(i => !i.demo);
  changed(); render(); toast('Пример убран');
}
async function exportBackup() {
  toast('Готовлю файл…');
  const blob = await DB.exportAll(S.prof);
  const name = `garderob-${new Date().toISOString().slice(0, 10)}.json`;
  const file = new File([blob], name, { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: 'Копия гардероба' }); return; } catch { /* отменила — сохраним файлом */ }
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

$('#inCam').addEventListener('change', e => { takeFiles([...e.target.files]); e.target.value = ''; });
$('#inGal').addEventListener('change', e => { takeFiles([...e.target.files]); e.target.value = ''; });
$('#inBackup').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = '';
  if (!f) return;
  try {
    const prof = await DB.importAll(f);
    if (prof?.done && confirm('Взять из копии и анкету (рост, фигура, цветотип, город)?')) { S.prof = prof; S.days = null; loadWeather(); }
    S.items = await DB.allItems(); saveProf(); render(); toast('Гардероб восстановлен');
  } catch (err) { toast('Не получилось: ' + err.message); }
});
$('#scrim').addEventListener('click', closeSheet);

// ---------- запуск ----------
(async () => {
  setTheme();
  try { S.items = await DB.allItems(); } catch { toast('Память телефона недоступна — вещи не сохранятся'); }
  DB.persist();
  recompute();
  render();
  loadWeather();
  const dev = location.hostname === '127.0.0.1' && !location.search.includes('sw');
  if ('serviceWorker' in navigator && location.protocol !== 'file:' && !dev) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
    if (navigator.serviceWorker.controller) warmFonts();
    else navigator.serviceWorker.addEventListener('controllerchange', warmFonts, { once: true });
  }
})();

// Шрифты (кириллица и латиница) кладем в память телефона, чтобы без интернета вид не менялся
async function warmFonts() {
  try {
    const href = document.querySelector('link[href*="fonts.googleapis"]').href;
    const css = await (await fetch(href)).text();
    const urls = [...css.matchAll(/\/\* (cyrillic|latin) \*\/[^}]*?url\((https:[^)]+)\)/g)].map(m => m[2]);
    await Promise.all(urls.map(u => fetch(u, { mode: 'cors' }).catch(() => {})));
  } catch { /* без интернета — в следующий раз */ }
}

// для проверок
window.__S = S;
