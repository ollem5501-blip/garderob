// Правила стилиста: подбор образов, советы по обуви, прическе, макияжу и что докупить.
import { TYPE, COL, CTM, OCC, OCCASIONS, HAIR, MAKEUP, NEUTRAL_BASICS, LIGHT, seasonOf } from './data.js';

const MAIN = new Set(['top', 'bottom', 'dress', 'layer']);
const FACE = new Set(['top', 'dress', 'layer', 'outer', 'acc']);

export const typeOf = it => TYPE[it.type];
export const catOf = it => TYPE[it.type]?.cat;
export const colorOf = it => COL[it.color] || COL.grey;
export function itemName(it, short = false) {
  const c = COL[it.color];
  return it.name || `${TYPE[it.type]?.name || 'Вещь'} · ${(short && c?.short) || c?.name || ''}`;
}

function lum(hex) {
  if (!hex || hex[0] !== '#') return 0.5;
  const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
const tone = c => (c.print ? 'mid' : LIGHT.has(c.id) || lum(c.hex) > 0.62 ? 'light' : lum(c.hex) < 0.3 ? 'dark' : 'mid');
const isAccent = c => !c.n && !c.print;

// Отношение двух цветов: число и короткое объяснение
export function colorRel(a, b) {
  if (a.print && b.print) return [-4, 'два узора спорят друг с другом'];
  if (a.print || b.print) return (a.print ? b : a).n ? [2, 'узор держится на спокойном цвете'] : [0, ''];
  if (a.id === b.id) return [1.5, a.n ? 'тон в тон — выглядит дорого' : `тон в тон: ${a.name}`];
  if (a.n && b.n) return [2, 'спокойные базовые цвета'];
  if (a.n || b.n) return [2.5, `${(a.n ? b : a).name} на базовом ${(a.n ? a : b).name}`];
  const d = Math.min(Math.abs(a.h - b.h), 360 - Math.abs(a.h - b.h));
  if (d <= 35) return [2, `соседние оттенки: ${a.name} и ${b.name}`];
  if (d >= 150) return [1, `смелый контраст: ${a.name} и ${b.name}`];
  return [-2, `${a.name} и ${b.name} спорят`];
}

// ---------- контекст: повод, погода, сезон ----------
export function makeCtx({ occ = 'walk', temp = 15, rain = false, snow = false, wind = 0, season } = {}) {
  return { occ, temp, rain, snow, wind, season: season || seasonOf() };
}

// Сезон вещи подходит, если совпадает с календарем или с погодой (мороз в октябре — зимние вещи можно)
function okSeason(s, ctx) {
  if (s === ctx.season) return true;
  if (s === 'winter') return ctx.temp <= 2;
  if (s === 'summer') return ctx.temp >= 20;
  return ctx.temp > 2 && ctx.temp < 20;
}

export function fits(it, ctx, strictOcc = true) {
  const t = typeOf(it);
  if (!t) return false;
  if (it.seasons?.length && !it.seasons.some(s => okSeason(s, ctx))) return false;
  if (t.t && (ctx.temp < t.t[0] - 2 || ctx.temp > t.t[1] + 3)) return false;
  if (t.cat === 'outer') {
    if (ctx.temp >= 20) return false;
    if (ctx.temp < 0 && (t.warm || 1) < 2) return false;
  }
  if (t.cat === 'shoes' && (ctx.rain || ctx.snow) && !t.closed) return false;
  if (t.cat === 'shoes' && ctx.temp < -2 && !t.warm) return false;
  // повод, который она отметила у вещи, — закон; без отметок — по уровню нарядности
  if (it.occ?.length) return !strictOcc || it.occ.includes(ctx.occ);
  if (t.occ.includes(ctx.occ)) return true;
  if (!strictOcc) return true;
  if (ctx.occ === 'sport') return false;
  const [lo, hi] = OCC[ctx.occ].form;
  return t.form >= lo && t.form <= hi;
}

function wantOuter(temp) { return temp >= 17 ? 0 : temp >= 12 ? 1 : temp >= 3 ? 2 : 3; }

// ---------- оценка образа ----------
export function scoreOutfit(items, ctx, prof = {}) {
  let s = 0;
  const plus = [], minus = [];
  // pri — личные причины (фигура, рост, цветотип) показываем раньше цветовых
  const add = (v, why, pri = 0) => { s += v; if (why) (v > 0 ? plus : minus).push([v + pri, why]); };
  const cols = items.map(colorOf);

  // цвета попарно, среднее (чтобы лишняя вещь не набирала очки просто количеством); обувь и сумка весят вполовину
  let cs = 0, cw = 0;
  for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
    const w = MAIN.has(catOf(items[i])) && MAIN.has(catOf(items[j])) ? 1 : 0.5;
    const [v, why] = colorRel(cols[i], cols[j]);
    cs += v * w; cw += w;
    if (why && (w === 1 || v < 0)) (v > 0 ? plus : minus).push([v * w, why]);
  }
  s += 4 * (cw ? cs / cw : 2);
  const accents = new Set(cols.filter(isAccent).map(c => c.id));
  if (accents.size === 3) add(-2, 'три ярких цвета — многовато, лучше два');
  if (accents.size > 3) add(-5, 'слишком много ярких цветов');

  // цветотип: цвета у лица
  const ct = CTM[prof.colortype];
  if (ct) {
    let fs = 0, fn = 0;
    items.forEach((it, i) => {
      if (!FACE.has(catOf(it))) return;
      fn++;
      if (ct.good.includes(cols[i].id)) { fs += 1; plus.push([2.5, `${cols[i].name} у лица — ваш цвет (${ct.name})`]); }
      else if (ct.bad.includes(cols[i].id)) { fs -= 1.5; minus.push([-3, `${cols[i].name} у лица гасит цветотип «${ct.name}» — добавьте шарф или украшение вашего цвета`]); }
    });
    if (fn) s += 3 * fs / fn;
  }

  // повод и уровень нарядности
  const main = items.filter(it => MAIN.has(catOf(it)));
  if (main.length) s += 3 * main.filter(it => (it.occ?.length ? it.occ : typeOf(it).occ).includes(ctx.occ)).length / main.length;
  const forms = main.map(it => typeOf(it).form);
  if (forms.length > 1) {
    const spread = Math.max(...forms) - Math.min(...forms);
    if (spread <= 1) add(1, ''); else if (spread >= 3) add(-2, 'вещи разной нарядности');
  }

  // платье — готовый образ: без этой поправки оно проигрывает паре «верх + низ» по числу сочетаний цветов
  if (items.some(it => catOf(it) === 'dress')) {
    s += 1;
    if (ctx.occ === 'party' || ctx.occ === 'date') add(1.5, 'платье — самый нарядный вариант');
  }

  // фигура
  const top = items.find(it => ['top', 'dress'].includes(catOf(it)));
  const bot = items.find(it => catOf(it) === 'bottom');
  const layer = items.find(it => catOf(it) === 'layer');
  const tTop = top && tone(colorOf(top)), tBot = bot && tone(colorOf(bot));
  const accTop = top && isAccent(colorOf(top)), accBot = bot && isAccent(colorOf(bot));
  switch (prof.body) {
    case 'pear':
      if (bot && (tTop === 'light' || accTop) && tBot === 'dark' && !accBot) add(2, 'светлый или яркий верх и темный низ уравновешивают бедра', 2);
      else if (bot && (tBot === 'light' || accBot) && tTop === 'dark') add(-1.5, 'светлый низ добавит объема бедрам');
      break;
    case 'triangle':
      if (bot && (tBot === 'light' || accBot) && tTop === 'dark') add(2, 'спокойный верх и светлый или яркий низ уравновешивают плечи', 2);
      else if (bot && (tTop === 'light' || accTop) && tBot === 'dark') add(-1, 'яркий верх расширит плечи');
      break;
    case 'apple':
      if (layer) add(1.5, 'открытый жакет или кардиган дает вертикаль', 2);
      if (bot && tTop === tBot) add(1, 'один тон в центре вытягивает силуэт', 2);
      break;
    case 'rectangle':
      if (bot && tTop !== tBot) add(1, 'контраст верха и низа обозначает талию', 2);
      if (layer) add(1, 'слои добавляют силуэту форму');
      break;
    case 'hourglass':
      if (catOf(top || {}) === 'dress') add(1.5, 'платье по фигуре подчеркивает талию', 2);
      if (items.some(it => it.type === 'belt')) add(1, 'ремень подчеркивает талию');
      break;
  }

  // рост
  const shoes = items.find(it => catOf(it) === 'shoes');
  const h = +prof.height || 0;
  if (h && h < 160 && shoes) {
    const ref = bot || top;
    if (ref && (colorOf(ref).id === colorOf(shoes).id || tone(colorOf(ref)) === tone(colorOf(shoes))))
      add(1.5, bot ? 'низ и обувь одного тона визуально удлиняют ноги' : 'платье и обувь одного тона вытягивают силуэт', 2);
  }

  // нарядная обувь к нарядному поводу
  if (shoes && (ctx.occ === 'party' || ctx.occ === 'date')) s += typeOf(shoes).form >= 3 ? 1.5 : 0;

  // теплый верх в холод
  if (top && ctx.temp < 5 && ctx.occ !== 'home') {
    const warm = ['sweater', 'turtleneck', 'hoodie', 'knitdress', 'longsleeve'].includes(top.type);
    if (warm) add(2, 'теплый верх по погоде');
    else if (ctx.temp < 0 && !layer) add(-2.5, 'для мороза тонковат верх — добавьте свитер или кардиган');
  }

  // погода
  if (shoes && (ctx.rain || ctx.snow)) add(['ankleboots', 'boots', 'winterboots'].includes(shoes.type) ? 2 : 0.5, '');
  const outer = items.find(it => catOf(it) === 'outer');
  if (outer) s -= 1.5 * Math.abs((typeOf(outer).warm || 1) - wantOuter(ctx.temp));

  // недавно надевала
  const today = Date.now();
  main.forEach(it => { if (it.worn && today - it.worn < 2.5 * 864e5) add(-2, ''); });

  plus.sort((a, b) => b[0] - a[0]);
  minus.sort((a, b) => a[0] - b[0]);
  return { score: s, plus: [...new Set(plus.map(p => p[1]))], minus: [...new Set(minus.map(p => p[1]))] };
}

// ---------- подбор ----------
function bases(items, ctx, prof) {
  const el = c => items.filter(it => catOf(it) === c && fits(it, ctx));
  const tops = el('top'), bots = el('bottom'), dresses = el('dress');
  const out = [];
  for (const t of tops) for (const b of bots) out.push([t, b]);
  for (const d of dresses) out.push([d]);
  return out.map(set => ({ set, ...scoreOutfit(set, ctx, prof) }));
}

function bestAdd(set, cands, ctx, prof, required) {
  let best = null, bestS = required ? -Infinity : scoreOutfit(set, ctx, prof).score;
  for (const c of cands) {
    const sc = scoreOutfit([...set, c], ctx, prof).score;
    if (sc > bestS) { bestS = sc; best = c; }
  }
  return best ? [...set, best] : set;
}

export function suggest(items, ctx, prof = {}, limit = 12) {
  if (ctx.occ === 'home') ctx = { ...ctx, temp: Math.max(ctx.temp, 21), rain: false, snow: false, wind: 0 };
  const el = c => items.filter(it => catOf(it) === c && fits(it, ctx));
  const layers = el('layer'), outers = el('outer'), shoes = el('shoes'), bags = el('bag');
  const accs = el('acc').filter(it => it.type !== 'belt' || prof.body === 'hourglass' || prof.body === 'rectangle');
  const list = bases(items, ctx, prof).sort((a, b) => b.score - a.score).slice(0, 40);

  const full = list.map(({ set }) => {
    let s = [...set];
    const needLayer = ctx.occ === 'work' || (ctx.temp >= 8 && ctx.temp < 20);
    if (needLayer && layers.length) s = bestAdd(s, layers, ctx, prof, false);
    const wo = wantOuter(ctx.temp);
    if (wo && outers.length) s = bestAdd(s, outers, ctx, prof, wo >= 2);
    if (shoes.length && ctx.occ !== 'home') s = bestAdd(s, shoes, ctx, prof, true);
    if (bags.length && ctx.occ !== 'sport' && ctx.occ !== 'home') s = bestAdd(s, bags, ctx, prof, true);
    // шапка в холод и шарф — отдельно, иначе одно вытесняет другое
    const hats = accs.filter(it => it.type === 'hat'), rest = accs.filter(it => it.type !== 'hat');
    if (hats.length && ctx.temp < 3 && ctx.occ !== 'home') s = bestAdd(s, hats, ctx, prof, true);
    if (rest.length) s = bestAdd(s, rest, ctx, prof, ctx.temp < 3 && rest.some(it => it.type === 'scarf'));
    return { items: s, ...scoreOutfit(s, ctx, prof) };
  });

  // разнообразие: одна и та же вещь подряд — штраф
  const picked = [], used = new Map();
  const pool = full.slice();
  while (picked.length < limit && pool.length) {
    let bi = 0, bv = -Infinity;
    pool.forEach((o, i) => {
      const pen = o.items.filter(it => MAIN.has(catOf(it))).reduce((p, it) => p + 3 * (used.get(it.id) || 0), 0);
      if (o.score - pen > bv) { bv = o.score - pen; bi = i; }
    });
    const [o] = pool.splice(bi, 1);
    const sig = o.items.map(it => it.type + ':' + it.color).sort().join();
    if (picked.some(p => p.sig === sig)) continue;
    o.sig = sig;
    picked.push(o);
    o.items.forEach(it => used.set(it.id, (used.get(it.id) || 0) + 1));
  }
  return picked;
}

// ---------- обувь, прическа, макияж ----------
export function shoesAdvice(outfit, ctx, prof) {
  const sh = outfit.items.find(it => catOf(it) === 'shoes');
  if (ctx.occ === 'home') return { text: 'Мягкие тапочки или теплые носки', note: '', own: false };
  const why = [];
  if (ctx.rain || ctx.snow) why.push(ctx.snow ? 'закрытые и теплые — по снегу' : 'закрытые — не промокнут');
  const ref = outfit.items.find(it => catOf(it) === 'bottom') || outfit.items.find(it => catOf(it) === 'dress');
  if (sh && ref && +prof.height && +prof.height < 160 && (colorOf(ref).id === colorOf(sh).id || tone(colorOf(ref)) === tone(colorOf(sh))))
    why.push(catOf(ref) === 'bottom' ? 'в тон низа — ноги длиннее' : 'в тон платья — силуэт длиннее');
  if (!sh && ctx.occ !== 'sport' && +prof.height && +prof.height < 160) why.push('лучше в тон низа — ноги длиннее');
  if (sh) return { text: itemName(sh), note: why.join(', '), own: true };
  let rec;
  if (ctx.occ === 'sport') rec = ctx.temp < 0 ? 'Утепленные кроссовки на рифленой подошве' : 'Кроссовки';
  else if (ctx.temp < 0) rec = 'Теплые сапоги или зимние ботинки';
  else if (ctx.occ === 'party') rec = ctx.temp > 18 && !ctx.rain ? 'Босоножки на каблуке' : 'Туфли на каблуке или ботильоны';
  else if (ctx.occ === 'work') rec = ctx.temp < 12 ? 'Ботильоны на устойчивом каблуке' : 'Лоферы или туфли-лодочки';
  else if (ctx.occ === 'date') rec = ctx.temp < 12 ? 'Ботильоны или сапоги на каблуке' : 'Туфли или балетки';
  else rec = ctx.temp < 10 ? 'Ботильоны или кроссовки' : 'Кроссовки, кеды или лоферы';
  return { text: rec, note: ['в гардеробе нет подходящей пары', ...why].join(', '), own: false };
}

export function hairAdvice(prof, ctx, outfit) {
  const len = prof.hair || 'medium';
  const hat = outfit?.items.some(it => it.type === 'hat');
  const bad = ctx.rain || ctx.snow || ctx.wind >= 8;
  let text = HAIR[len][ctx.occ];
  let note = '';
  if (hat) { text = len === 'short' ? 'Гладкая укладка, челка набок' : 'Низкий хвост или коса — под шапкой не помнутся'; note = 'под шапку'; }
  else if (bad && ctx.occ !== 'sport' && ctx.occ !== 'home') {
    note = ctx.wind >= 8 ? 'ветрено — собранные волосы продержатся' : 'влажно — собранные волосы продержатся';
    text = len === 'short' ? 'Гладкая укладка со средством от влаги' : len === 'medium' ? 'Низкий гладкий хвост или заколка-краб' : 'Низкий пучок или объемная коса';
  }
  return { text, note };
}

export function makeupAdvice(prof, ctx, outfit) {
  const ct = CTM[prof.colortype];
  let text = MAKEUP[ctx.occ];
  let note = '';
  if (ct && ctx.occ !== 'sport' && ctx.occ !== 'home') {
    if (ctx.occ === 'date' || ctx.occ === 'party') text += `: ${ct.lips}, ${ct.eyes}`;
    else text += `, ${ct.blush}`;
  }
  const bright = outfit?.items.some(it => FACE.has(catOf(it)) && isAccent(colorOf(it)) && ['red', 'fuchsia', 'orange', 'yellow', 'terracotta', 'burgundy'].includes(it.color));
  if (bright && (ctx.occ === 'date' || ctx.occ === 'party')) note = 'одежда уже яркая — акцент лучше на глаза, губы спокойнее';
  return { text, note };
}

// ---------- что докупить ----------
const CTXS = occ => [
  makeCtx({ occ, temp: 22, season: 'summer' }),
  makeCtx({ occ, temp: 12, season: 'autumn', rain: true }),
  makeCtx({ occ, temp: -5, season: 'winter', snow: true }),
];
const ALLCTX = OCCASIONS.filter(o => o.id !== 'home').flatMap(o => CTXS(o.id));

function goodBases(items, ctx, prof) {
  return bases(items, ctx, prof).filter(b => b.score >= 6);
}
function coverage(items, prof) {
  const keys = new Set();
  const res = { bases: 0, perItem: new Map(), noShoes: [], noOuter: [], perOcc: {} };
  for (const ctx of ALLCTX) {
    const bs = goodBases(items, ctx, prof);
    bs.forEach(b => keys.add(b.set.map(it => it.id).join('+')));
    res.perOcc[ctx.occ] = (res.perOcc[ctx.occ] || 0) + bs.length;
    bs.forEach(b => b.set.forEach(it => res.perItem.set(it.id, (res.perItem.get(it.id) || 0) + 1)));
    if (!items.some(it => catOf(it) === 'shoes' && fits(it, ctx))) res.noShoes.push(ctx);
    if (wantOuter(ctx.temp) >= 2 && !items.some(it => catOf(it) === 'outer' && fits(it, ctx))) res.noOuter.push(ctx);
  }
  res.bases = keys.size; // разные сочетания, без повторов по погоде и поводам
  return res;
}

function basicsFor(prof) {
  const b = CTM[prof.colortype]?.basics || NEUTRAL_BASICS;
  const dark = b.find(c => ['navy', 'graphite', 'black', 'brown', 'olive'].includes(c)) || 'navy';
  const light = b.find(c => ['white', 'milk', 'powder', 'grey', 'beige'].includes(c)) || 'milk';
  const mid = b.find(c => c !== dark && c !== light) || 'beige';
  const good = CTM[prof.colortype]?.good || ['burgundy'];
  const accent = ['burgundy', 'terracotta', 'teal', 'green', 'red', 'blue', 'purple'].find(c => good.includes(c)) || 'burgundy';
  return [
    ['blouse', light], ['tshirt', light], ['turtleneck', dark], ['sweater', mid], ['shirt', light === 'milk' ? 'milk' : 'white'],
    ['trousers', dark], ['jeans', 'denim'], ['skirtmidi', mid], ['dress', dark], ['cocktail', accent],
    ['blazer', mid], ['cardigan', light], ['trench', mid === 'grey' ? 'beige' : mid], ['coat', dark], ['puffer', dark],
    ['sneakers', 'white'], ['loafers', dark], ['ankleboots', dark], ['boots', dark], ['heels', mid], ['bag', mid], ['leggings', dark], ['sporttop', dark],
  ];
}

const SEASONS_OF = t => TYPE[t].s;
const ctxName = c => (c.temp >= 20 ? 'летом' : c.temp >= 3 ? 'в дождь и прохладу' : 'зимой');

export function shopping(items, prof = {}) {
  const real = items.filter(it => TYPE[it.type]);
  const base = coverage(real, prof);
  const ideas = [];
  for (const [type, color] of basicsFor(prof)) {
    if (real.some(it => it.type === type && it.color === color)) continue;
    const v = { id: '_v', type, color, seasons: SEASONS_OF(type), occ: TYPE[type].occ };
    const cov = coverage([...real, v], prof);
    const gain = cov.bases - base.bases;
    const shoesFix = base.noShoes.length - cov.noShoes.length;
    const outerFix = base.noOuter.length - cov.noOuter.length;
    const value = gain + 4 * shoesFix + 4 * outerFix;
    if (value <= 0) continue;
    const why = [];
    if (gain > 0) {
      const occs = OCCASIONS.filter(o => (cov.perOcc[o.id] || 0) > (base.perOcc[o.id] || 0));
      const first = occs.filter(o => !base.perOcc[o.id]).map(o => `первый образ для «${o.name}»`);
      why.push(`добавит ${gain} ${plural(gain, 'новое сочетание', 'новых сочетания', 'новых сочетаний')} с вашими вещами (подойдет для: ${occs.map(o => o.name.toLowerCase()).join(', ')})`, ...first);
    }
    if (shoesFix > 0 || outerFix > 0) {
      const fixed = (shoesFix > 0 ? base.noShoes.filter(c => !cov.noShoes.includes(c)) : base.noOuter.filter(c => !cov.noOuter.includes(c)));
      const occs = [...new Set(fixed.map(c => OCC[c.occ].name.toLowerCase()))].join(', ');
      const when = [...new Set(fixed.map(ctxName))].join(' и ');
      why.push(`закроет пробел: ${shoesFix > 0 ? 'нет обуви' : 'нет теплой верхней одежды'} ${when} (${occs})`);
    }
    ideas.push({ type, color, value, why: why.join('; ') });
  }
  ideas.sort((a, b) => b.value - a.value);

  const orphans = real.filter(it => ['top', 'bottom'].includes(catOf(it)) && !base.perItem.get(it.id)).map(it => {
    const want = catOf(it) === 'top' ? 'bottom' : 'top';
    const pair = basicsFor(prof).filter(([t]) => TYPE[t].cat === want)
      .map(([t, c]) => [t, c, colorRel(colorOf(it), COL[c])[0]]).sort((a, b) => b[2] - a[2])[0];
    return { item: it, type: pair?.[0], color: pair?.[1] };
  });

  const emptyOcc = OCCASIONS.filter(o => o.id !== 'home' && !base.perOcc[o.id]).map(o => o.id);
  return { ideas: ideas.slice(0, 8), orphans, emptyOcc, total: base.bases };
}

export function plural(n, one, few, many) {
  const m10 = n % 10, m100 = n % 100;
  return m10 === 1 && m100 !== 11 ? one : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? few : many;
}
