// Справочники: цвета, вещи, поводы, фигуры, цветотипы, прически, макияж.

export const OCCASIONS = [
  { id: 'work', name: 'Работа', form: [2, 3] },
  { id: 'walk', name: 'Прогулка', form: [0, 2] },
  { id: 'date', name: 'Свидание', form: [1, 3] },
  { id: 'party', name: 'Праздник', form: [2, 3] },
  { id: 'sport', name: 'Спорт', form: [0, 0] },
  { id: 'home', name: 'Дома', form: [0, 1] },
];
export const OCC = Object.fromEntries(OCCASIONS.map(o => [o.id, o]));

export const SEASONS = [
  { id: 'winter', name: 'Зима' }, { id: 'spring', name: 'Весна' },
  { id: 'summer', name: 'Лето' }, { id: 'autumn', name: 'Осень' },
];
export function seasonOf(date = new Date()) {
  const m = date.getMonth();
  return m < 2 || m === 11 ? 'winter' : m < 5 ? 'spring' : m < 8 ? 'summer' : 'autumn';
}

// n — нейтральный (сочетается со всем), h — оттенок по кругу для правил гармонии
export const COLORS = [
  { id: 'white', name: 'белый', hex: '#FFFFFF', n: 1 },
  { id: 'milk', name: 'молочный', hex: '#F1EBDD', n: 1 },
  { id: 'beige', name: 'бежевый', hex: '#D8C29F', n: 1 },
  { id: 'camel', name: 'кэмел', hex: '#B88A5A', n: 1 },
  { id: 'brown', name: 'коричневый', hex: '#6B4A33', n: 1 },
  { id: 'grey', name: 'серый', hex: '#9C9C9C', n: 1 },
  { id: 'graphite', name: 'графит', hex: '#3A3C42', n: 1 },
  { id: 'black', name: 'черный', hex: '#151515', n: 1 },
  { id: 'navy', name: 'темно-синий', hex: '#1F2A4A', n: 1 },
  { id: 'denim', name: 'джинсовый', hex: '#4A6A95', n: 1 },
  { id: 'lightblue', name: 'голубой', hex: '#9DC0E2', h: 210 },
  { id: 'blue', name: 'синий', hex: '#2D5DA8', h: 220 },
  { id: 'teal', name: 'бирюзовый', hex: '#2A9D8F', h: 175 },
  { id: 'green', name: 'зеленый', hex: '#4F7A45', h: 110 },
  { id: 'olive', name: 'оливковый', hex: '#6B7040', h: 70 },
  { id: 'yellow', name: 'желтый', hex: '#EBC55C', h: 48 },
  { id: 'mustard', name: 'горчичный', hex: '#C49A22', h: 45 },
  { id: 'orange', name: 'оранжевый', hex: '#E07A3A', h: 25 },
  { id: 'terracotta', name: 'терракотовый', short: 'терракота', hex: '#B65A38', h: 18 },
  { id: 'red', name: 'красный', hex: '#C62D2D', h: 0 },
  { id: 'burgundy', name: 'бордовый', hex: '#7A2230', h: 350 },
  { id: 'pink', name: 'розовый', hex: '#E8A3B5', h: 340 },
  { id: 'powder', name: 'пудровый', hex: '#E5C4BE', h: 12 },
  { id: 'fuchsia', name: 'фуксия', hex: '#C2297A', h: 325 },
  { id: 'lilac', name: 'сиреневый', hex: '#B39DD0', h: 270 },
  { id: 'purple', name: 'фиолетовый', hex: '#5E3C8C', h: 275 },
  { id: 'print', name: 'с узором', hex: 'repeating-linear-gradient(45deg,#3A3C42 0 4px,#F1EBDD 4px 8px)', print: 1 },
];
export const COL = Object.fromEntries(COLORS.map(c => [c.id, c]));
export const LIGHT = new Set(['white', 'milk', 'beige', 'lightblue', 'yellow', 'pink', 'powder', 'lilac', 'grey']);

export const CATEGORIES = [
  { id: 'top', name: 'Верх' }, { id: 'bottom', name: 'Низ' }, { id: 'dress', name: 'Платья' },
  { id: 'layer', name: 'Жакеты' }, { id: 'outer', name: 'Верхняя' }, { id: 'shoes', name: 'Обувь' },
  { id: 'bag', name: 'Сумки' }, { id: 'acc', name: 'Аксессуары' },
];
export const CAT = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));

// warm: 0 легкое … 3 очень теплое; form: 0 спорт … 3 нарядно; t: [мин, макс] температура, при которой уместно
const ALL = ['winter', 'spring', 'summer', 'autumn'];
const MID = ['spring', 'autumn'];
const NOSUM = ['winter', 'spring', 'autumn'];
const WARMS = ['spring', 'summer', 'autumn'];
export const TYPES = [
  // верх
  { id: 'tshirt', g: 'f', name: 'Футболка', cat: 'top', form: 1, occ: ['walk', 'home', 'sport'], s: ALL },
  { id: 'top', g: 'm', name: 'Топ', cat: 'top', form: 1, occ: ['walk', 'date', 'party'], s: WARMS, t: [16, 40] },
  { id: 'blouse', g: 'f', name: 'Блузка', cat: 'top', form: 2, occ: ['work', 'date', 'party', 'walk'], s: ALL },
  { id: 'shirt', g: 'f', name: 'Рубашка', cat: 'top', form: 2, occ: ['work', 'walk', 'date'], s: ALL },
  { id: 'longsleeve', g: 'm', name: 'Лонгслив', cat: 'top', form: 1, occ: ['walk', 'home', 'sport'], s: NOSUM },
  { id: 'turtleneck', g: 'f', name: 'Водолазка', cat: 'top', form: 2, occ: ['work', 'walk', 'date'], s: NOSUM, t: [-40, 16] },
  { id: 'sweater', g: 'm', name: 'Свитер', cat: 'top', form: 1, occ: ['walk', 'work', 'home'], s: NOSUM, t: [-40, 15] },
  { id: 'hoodie', g: 'm', name: 'Худи', cat: 'top', form: 0, occ: ['walk', 'sport', 'home'], s: NOSUM, t: [-40, 18] },
  { id: 'sporttop', g: 'm', name: 'Спортивный топ', cat: 'top', form: 0, occ: ['sport'], s: ALL },
  // низ
  { id: 'trousers', g: 'p', name: 'Брюки', cat: 'bottom', form: 2, occ: ['work', 'walk', 'date'], s: ALL },
  { id: 'jeans', g: 'p', name: 'Джинсы', cat: 'bottom', form: 1, occ: ['walk', 'date', 'home'], s: ALL },
  { id: 'skirtmidi', g: 'f', name: 'Юбка миди', cat: 'bottom', form: 2, occ: ['work', 'date', 'party', 'walk'], s: ALL },
  { id: 'skirtmini', g: 'f', name: 'Юбка мини', cat: 'bottom', form: 1, occ: ['date', 'party', 'walk'], s: WARMS, t: [14, 40] },
  { id: 'skirtmaxi', g: 'f', name: 'Юбка макси', cat: 'bottom', form: 1, occ: ['walk', 'date'], s: ALL },
  { id: 'shorts', g: 'p', name: 'Шорты', cat: 'bottom', form: 1, occ: ['walk', 'home'], s: ['summer'], t: [20, 40] },
  { id: 'leggings', g: 'p', name: 'Леггинсы', cat: 'bottom', form: 0, occ: ['sport', 'home'], s: ALL },
  { id: 'joggers', g: 'p', name: 'Спортивные брюки', cat: 'bottom', form: 0, occ: ['sport', 'home', 'walk'], s: ALL },
  // платья
  { id: 'dress', g: 'n', name: 'Платье', cat: 'dress', form: 1, occ: ['walk', 'date', 'work'], s: ALL },
  { id: 'cocktail', g: 'n', name: 'Платье нарядное', cat: 'dress', form: 3, occ: ['party', 'date'], s: ALL },
  { id: 'sheath', g: 'n', name: 'Платье-футляр', cat: 'dress', form: 3, occ: ['work', 'party', 'date'], s: ALL },
  { id: 'sundress', g: 'm', name: 'Сарафан', cat: 'dress', form: 1, occ: ['walk', 'date'], s: ['summer'], t: [18, 40] },
  { id: 'knitdress', g: 'n', name: 'Платье трикотажное', cat: 'dress', form: 2, occ: ['work', 'walk', 'date'], s: NOSUM, t: [-40, 16] },
  { id: 'jumpsuit', g: 'm', name: 'Комбинезон', cat: 'dress', form: 2, occ: ['walk', 'date', 'party'], s: ALL },
  // жакеты (средний слой)
  { id: 'cardigan', g: 'm', name: 'Кардиган', cat: 'layer', form: 1, occ: ['walk', 'work', 'home'], s: NOSUM, t: [-40, 20] },
  { id: 'blazer', g: 'm', name: 'Жакет', cat: 'layer', form: 3, occ: ['work', 'date', 'party', 'walk'], s: ALL, t: [-40, 24] },
  { id: 'vest', g: 'm', name: 'Жилет', cat: 'layer', form: 2, occ: ['work', 'walk'], s: NOSUM, t: [-40, 20] },
  // верхняя одежда; warm — насколько теплая
  { id: 'trench', g: 'm', name: 'Тренч', cat: 'outer', form: 2, warm: 1, occ: ['work', 'walk', 'date'], s: MID },
  { id: 'leather', g: 'f', name: 'Кожаная куртка', cat: 'outer', form: 1, warm: 1, occ: ['walk', 'date', 'party'], s: MID },
  { id: 'denimjacket', g: 'f', name: 'Джинсовая куртка', cat: 'outer', form: 1, warm: 1, occ: ['walk', 'date'], s: WARMS },
  { id: 'windbreaker', g: 'f', name: 'Ветровка', cat: 'outer', form: 0, warm: 1, occ: ['walk', 'sport'], s: WARMS },
  { id: 'coat', g: 'n', name: 'Пальто', cat: 'outer', form: 2, warm: 2, occ: ['work', 'walk', 'date', 'party'], s: NOSUM },
  { id: 'puffer', g: 'm', name: 'Пуховик', cat: 'outer', form: 1, warm: 3, occ: ['walk', 'work', 'sport', 'date'], s: ['winter'] },
  { id: 'parka', g: 'f', name: 'Парка', cat: 'outer', form: 1, warm: 3, occ: ['walk', 'work'], s: ['winter', 'autumn'] },
  { id: 'fur', g: 'f', name: 'Шуба', cat: 'outer', form: 2, warm: 3, occ: ['work', 'walk', 'date', 'party'], s: ['winter'] },
  // обувь; closed — не промокает, warm — для холода
  { id: 'sneakers', g: 'p', name: 'Кроссовки', cat: 'shoes', form: 0, closed: 1, occ: ['walk', 'sport', 'home'], s: WARMS, t: [3, 40] },
  { id: 'keds', g: 'p', name: 'Кеды', cat: 'shoes', form: 1, closed: 1, occ: ['walk', 'date'], s: WARMS, t: [8, 40] },
  { id: 'loafers', g: 'p', name: 'Лоферы', cat: 'shoes', form: 2, closed: 1, occ: ['work', 'walk', 'date'], s: WARMS, t: [8, 40] },
  { id: 'flats', g: 'p', name: 'Балетки', cat: 'shoes', form: 2, occ: ['work', 'walk', 'date'], s: ['spring', 'summer'], t: [14, 40] },
  { id: 'heels', g: 'p', name: 'Туфли на каблуке', cat: 'shoes', form: 3, closed: 1, occ: ['work', 'date', 'party'], s: WARMS, t: [10, 40] },
  { id: 'sandals', g: 'p', name: 'Босоножки', cat: 'shoes', form: 2, occ: ['date', 'party', 'walk'], s: ['summer'], t: [19, 40] },
  { id: 'flipflops', g: 'p', name: 'Шлепанцы', cat: 'shoes', form: 1, occ: ['walk', 'home'], s: ['summer'], t: [20, 40] },
  { id: 'ankleboots', g: 'p', name: 'Ботильоны', cat: 'shoes', form: 2, closed: 1, occ: ['work', 'walk', 'date', 'party'], s: NOSUM, t: [-8, 17] },
  { id: 'boots', g: 'p', name: 'Сапоги', cat: 'shoes', form: 2, closed: 1, warm: 1, occ: ['work', 'walk', 'date', 'party'], s: NOSUM, t: [-30, 12] },
  { id: 'winterboots', g: 'p', name: 'Зимние ботинки', cat: 'shoes', form: 1, closed: 1, warm: 1, occ: ['walk', 'work', 'sport'], s: ['winter'], t: [-40, 5] },
  // сумки и аксессуары
  { id: 'bag', g: 'f', name: 'Сумка', cat: 'bag', form: 2, occ: ['work', 'walk', 'date'], s: ALL },
  { id: 'clutch', g: 'm', name: 'Клатч', cat: 'bag', form: 3, occ: ['party', 'date'], s: ALL },
  { id: 'backpack', g: 'm', name: 'Рюкзак', cat: 'bag', form: 0, occ: ['walk', 'sport'], s: ALL },
  { id: 'shopper', g: 'm', name: 'Шопер', cat: 'bag', form: 1, occ: ['walk', 'home', 'work'], s: ALL },
  { id: 'scarf', g: 'm', name: 'Шарф', cat: 'acc', form: 1, occ: ['walk', 'work', 'date'], s: NOSUM, t: [-40, 12] },
  { id: 'hat', g: 'f', name: 'Шапка', cat: 'acc', form: 1, occ: ['walk', 'work', 'sport'], s: ['winter', 'autumn'], t: [-40, 6] },
  { id: 'belt', g: 'm', name: 'Ремень', cat: 'acc', form: 2, occ: ['work', 'walk', 'date', 'party'], s: ALL },
];
export const TYPE = Object.fromEntries(TYPES.map(t => [t.id, t]));

export const BODY = [
  { id: 'hourglass', name: 'Песочные часы', hint: 'Плечи и бедра примерно равны, талия заметно уже',
    tips: ['Подчеркивайте талию: ремень, запах, приталенный жакет', 'Платья по фигуре и с запахом — ваш лучший выбор'] },
  { id: 'pear', name: 'Груша', hint: 'Бедра шире плеч',
    tips: ['Светлый или яркий верх, темный спокойный низ', 'Юбки А-силуэта и прямые брюки, акцент на плечи и лицо'] },
  { id: 'triangle', name: 'Перевернутый треугольник', hint: 'Плечи шире бедер',
    tips: ['Спокойный темный верх, светлый или яркий низ', 'Объем внизу: широкие брюки, юбки клеш, V-вырез вверху'] },
  { id: 'rectangle', name: 'Прямоугольник', hint: 'Плечи, талия и бедра почти на одной линии',
    tips: ['Слои и контраст верха и низа создают силуэт', 'Ремень на талии, жакеты, фактуры и детали'] },
  { id: 'apple', name: 'Яблоко', hint: 'Объем в середине, ноги и руки стройнее',
    tips: ['Вертикали: открытый жакет или кардиган поверх', 'Один цвет в центре, акценты у лица и на обуви'] },
];
export const BODYM = Object.fromEntries(BODY.map(b => [b.id, b]));

// Цветотипы: good — цвета к лицу, bad — у лица лучше не носить
export const COLORTYPES = [
  { id: 'spring', name: 'Весна', note: 'теплая, светлая', swatch: ['#F1EBDD', '#EBC55C', '#E07A3A', '#2A9D8F', '#E5C4BE'],
    good: ['milk', 'beige', 'camel', 'yellow', 'orange', 'teal', 'green', 'lightblue', 'powder', 'terracotta'],
    bad: ['black', 'graphite', 'fuchsia', 'burgundy', 'purple'], basics: ['milk', 'camel', 'beige', 'navy'],
    lips: 'персиковая или коралловая помада', eyes: 'золотисто-бежевые тени, теплая коричневая тушь', blush: 'персиковые румяна' },
  { id: 'summer', name: 'Лето', note: 'холодная, мягкая', swatch: ['#9C9C9C', '#9DC0E2', '#E8A3B5', '#B39DD0', '#1F2A4A'],
    good: ['grey', 'lightblue', 'navy', 'pink', 'powder', 'lilac', 'teal', 'blue', 'white', 'denim'],
    bad: ['orange', 'mustard', 'black', 'camel', 'terracotta'], basics: ['grey', 'navy', 'white', 'powder'],
    lips: 'приглушенная розово-ягодная помада', eyes: 'серо-коричневые и сливовые тени', blush: 'холодные розовые румяна' },
  { id: 'autumn', name: 'Осень', note: 'теплая, глубокая', swatch: ['#B88A5A', '#6B7040', '#C49A22', '#B65A38', '#7A2230'],
    good: ['milk', 'beige', 'camel', 'brown', 'olive', 'mustard', 'terracotta', 'orange', 'burgundy', 'green'],
    bad: ['white', 'fuchsia', 'pink', 'lightblue', 'grey'], basics: ['milk', 'camel', 'brown', 'olive'],
    lips: 'терракотовая, кирпичная или карамельная помада', eyes: 'бронзовые, медные, оливковые тени', blush: 'теплые терракотовые румяна' },
  { id: 'winter', name: 'Зима', note: 'холодная, контрастная', swatch: ['#FFFFFF', '#151515', '#C62D2D', '#2D5DA8', '#C2297A'],
    good: ['white', 'black', 'graphite', 'navy', 'blue', 'red', 'burgundy', 'fuchsia', 'purple', 'teal', 'grey'],
    bad: ['beige', 'camel', 'orange', 'mustard', 'terracotta', 'powder'], basics: ['white', 'black', 'graphite', 'navy'],
    lips: 'ягодная, винная или холодная красная помада', eyes: 'графитовые и серебристые тени, четкая черная подводка', blush: 'холодные розовые румяна' },
];
export const CTM = Object.fromEntries(COLORTYPES.map(c => [c.id, c]));
export const NEUTRAL_BASICS = ['milk', 'graphite', 'beige', 'navy'];

export const HAIR = {
  long: {
    work: 'Гладкий низкий пучок или хвост на уровне шеи', walk: 'Свободная коса или распущенные легкие волны',
    date: 'Мягкие локоны и пробор сбоку', party: 'Голливудская волна или высокий гладкий хвост',
    sport: 'Высокий хвост или две косы-колоска', home: 'Небрежный пучок на макушке',
  },
  medium: {
    work: 'Гладкая укладка, концы внутрь, четкий пробор', walk: 'Легкие небрежные волны',
    date: 'Объем у корней и мягкие пряди у лица', party: 'Гладкая укладка с блеском и заколка-акцент',
    sport: 'Низкий хвост или две маленькие косички', home: 'Полухвост или ободок',
  },
  short: {
    work: 'Гладкая укладка с четким пробором', walk: 'Текстурная небрежная укладка',
    date: 'Объем у корней, невидимки сбоку', party: 'Гладкая укладка гелем назад или блестящая заколка',
    sport: 'Ободок или повязка', home: 'Без укладки, ободок',
  },
};
export const HAIR_LEN = [{ id: 'short', name: 'Короткие' }, { id: 'medium', name: 'Средние' }, { id: 'long', name: 'Длинные' }];

export const MAKEUP = {
  work: 'Ровный тон, аккуратные брови, тушь',
  walk: 'Легкий тон, тушь, бальзам для губ',
  date: 'Один акцент: выразительные губы или глаза',
  party: 'Стрелки или дымчатые глаза и стойкая помада',
  sport: 'Только уход: солнцезащитный крем и бальзам',
  home: 'Без макияжа, уход за кожей',
};

// Ссылки на поиск в магазинах (Беларусь). Цвет согласуем с родом вещи: «брюки коричневые женские».
const ADJ = { graphite: 'графитовый' };
const NOUNCOLOR = { camel: 'цвета кэмел', fuchsia: 'цвета фуксия', print: 'с принтом' };
function agree(word, g) {
  if (g === 'm') return word;
  const velar = /[кгх]ий$/.test(word);
  const soft = word.endsWith('ий') && !velar;
  const stem = word.slice(0, -2);
  if (g === 'f') return stem + (soft ? 'яя' : 'ая');
  if (g === 'n') return stem + (soft ? 'ее' : 'ое');
  return stem + (soft || velar ? 'ие' : 'ые');
}
export function shopQuery(typeId, colorId) {
  const t = TYPE[typeId], c = COL[colorId];
  if (!t) return '';
  const g = t.g || 'm';
  const color = !c ? '' : typeId === 'jeans' && c.id === 'denim' ? 'синие' : NOUNCOLOR[c.id] || agree(ADJ[c.id] || c.name, g);
  const woman = agree('женский', g);
  return [t.name.toLowerCase(), color, woman].filter(Boolean).join(' ');
}
export function shopLinks(typeId, colorId) {
  const q = encodeURIComponent(shopQuery(typeId, colorId));
  return {
    wb: `https://www.wildberries.by/catalog/0/search.aspx?search=${q}`,
    ozon: `https://ozon.by/search/?text=${q}`,
  };
}

// Размер одежды по типовой таблице РФ: [размер, грудь, талия, бедра], см. У марок таблицы отличаются.
export const RU_SIZES = [
  [40, 80, 62, 88], [42, 84, 66, 92], [44, 88, 70, 96], [46, 92, 74, 100], [48, 96, 78, 104],
  [50, 100, 82, 108], [52, 104, 86, 112], [54, 108, 90, 116], [56, 112, 94, 120],
];
const pickSize = (col, v) => (RU_SIZES.find(r => v <= r[col] + 1) || RU_SIZES[RU_SIZES.length - 1])[0];

export function sizeFor(prof, typeId) {
  const t = TYPE[typeId], m = prof.meas || {};
  if (!t || t.cat === 'bag' || t.cat === 'acc') return null;
  if (t.cat === 'shoes') return prof.shoe ? { size: String(prof.shoe), note: 'ваш размер обуви' } : null;
  const sb = m.b ? pickSize(1, m.b) : 0, sw = m.w ? pickSize(2, m.w) : 0, sh = m.h ? pickSize(3, m.h) : 0;
  if (!sb && !sw && !sh) return null;
  let size, note;
  if (t.cat === 'top' || t.cat === 'layer') {
    size = sb || Math.max(sw, sh); note = m.b ? `по груди ${m.b} см` : 'по талии и бедрам';
    if (t.cat === 'layer' && sb && sh - sb >= 4) note += `; если длиной до бедер — проверьте бедра, может понадобиться ${sh}`;
  } else if (t.cat === 'bottom') {
    size = Math.max(sh, sw) || sb; note = sw > sh ? `по талии ${m.w} см` : m.h ? `по бедрам ${m.h} см` : 'по груди';
  } else {
    size = Math.max(sb, sw, sh);
    note = size === sh && m.h ? `по бедрам ${m.h} см` : size === sb && m.b ? `по груди ${m.b} см` : `по талии ${m.w} см`;
    if (t.cat === 'dress' && sb && size - sb >= 4) note += '; в груди может быть свободно — подойдет трикотаж или запах';
    if (t.cat === 'outer' && (t.warm || 1) >= 2) note += '; под толстый свитер — на размер больше';
  }
  return { size: String(size), note };
}
