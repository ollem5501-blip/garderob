// Погода: Open-Meteo (бесплатно, без ключа). Без интернета — последний прогноз или ручной ввод.
import { load, save } from './db.js';

const W = code =>
  code === 0 ? 'ясно' : code <= 2 ? 'облачно' : code === 3 ? 'пасмурно' : code <= 48 ? 'туман' :
  code <= 57 ? 'морось' : code <= 67 ? 'дождь' : code <= 77 ? 'снег' : code <= 82 ? 'ливень' :
  code <= 86 ? 'снегопад' : 'гроза';
const isRain = c => (c >= 51 && c <= 67) || (c >= 80 && c <= 82) || c >= 95;
const isSnow = c => (c >= 71 && c <= 77) || c === 85 || c === 86;

export async function findCity(q) {
  const r = await fetch(`https://geocoding-api.open-meteo.com/v1/search?count=6&language=ru&name=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000) });
  const j = await r.json();
  return (j.results || []).map(c => ({ name: c.name, region: [c.admin1, c.country].filter(Boolean).join(', '), lat: c.latitude, lon: c.longitude }));
}

export function myPlace() {
  return new Promise((res, rej) => navigator.geolocation
    ? navigator.geolocation.getCurrentPosition(p => res({ name: 'Мое место', lat: p.coords.latitude, lon: p.coords.longitude }), rej, { timeout: 10000, maximumAge: 36e5 })
    : rej(new Error('нет геолокации')));
}

// Прогноз на 2 дня; кэш на 1 час
export async function forecast(city) {
  const cache = load('wx', null);
  const key = `${city.lat.toFixed(2)},${city.lon.toFixed(2)}`;
  if (cache && cache.key === key && Date.now() - cache.at < 36e5) return fromToday(cache.days);
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}` +
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max&wind_speed_unit=ms&timezone=auto&forecast_days=4';
    const j = await (await fetch(url, { signal: AbortSignal.timeout(8000) })).json();
    const d = j.daily;
    const days = d.time.map((t, i) => {
      const code = d.weather_code[i];
      const tmax = Math.round(d.temperature_2m_max[i]), tmin = Math.round(d.temperature_2m_min[i]);
      return {
        date: t, code, text: W(code), tmax, tmin,
        temp: Math.round(tmax * 0.7 + tmin * 0.3), // дневная, когда человек на улице
        rain: isRain(code) || d.precipitation_probability_max[i] >= 60, snow: isSnow(code),
        wind: Math.round(d.wind_speed_10m_max[i]),
      };
    });
    save('wx', { key, at: Date.now(), days });
    return fromToday(days);
  } catch {
    return cache?.key === key ? fromToday(cache.days) : null;
  }
}

// Прогноз начиная с сегодняшней даты; устаревшие дни отбрасываем
function fromToday(days) {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const rest = days.filter(x => x.date >= today);
  return rest.length ? rest : null;
}
