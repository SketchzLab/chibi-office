// v23 weather schedule (pure, no three): deterministic per UTC+8 calendar day, same on every device (seeded like skyevents).
// Tropical (Malaysia): mostly clear; some hazy/cloudy days; afternoon convective showers (~3 in 10 days, 1 in 4 of them a
// thunderstorm); misty mornings (~1 in 4); the odd small-hours shower. Rainbow days get a shower that ends right as the bow
// appears. ?weather=clear|cloudy|rain|storm|fog forces a state all day (combine with ?t= and ?sky=).
const H = 3600, FADE = 25; // seconds of crossfade at each change
const hash = (d, k) => { let x = (Math.imul(d + 7919 * k, 2654435761) ^ Math.imul(k + 17, 40503)) >>> 0; x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0; return (x ^ (x >>> 16)) >>> 0; };
const P = k => (typeof location !== 'undefined' ? new URLSearchParams(location.search).get(k) : null);
export const WX_KINDS = ['clear', 'cloudy', 'rain', 'storm', 'fog'];
export const forcedWeather = () => { const q = P('weather'); return WX_KINDS.includes(q) ? q : null; };
const rainbowDay = d => P('sky') !== 'none' && hash(d, 1) % 10 === 0; // same rule as skyevents (no import cycle)
const auroraDay = d => hash(d, 2) % 12 === 0;
/* segments [start, end, kind] in UTC+8 seconds of day */
export function dayPlan(d) { const seg = [];
  if (hash(d, 11) % 4 === 0) seg.push([5.5 * H, 9.25 * H, 'fog']);
  if (rainbowDay(d)) { const a = 14 * H + (hash(d, 3) % 5) * 1800; seg.push([a - 2 * H, a, 'cloudy'], [a - 50 * 60, a, 'rain']); } // rain ends as the rainbow fades in
  else { const r = hash(d, 12) % 10;
    if (r < 3) { const s = 13.5 * H + (hash(d, 13) % 8) * 900, e = s + (40 + hash(d, 14) % 50) * 60; seg.push([s - 1.5 * H, e, 'cloudy'], [s, e, hash(d, 15) % 4 === 0 ? 'storm' : 'rain']); }
    else if (r < 4) seg.push([10 * H, 17 * H, 'cloudy']); }
  if (hash(d, 16) % 9 === 0 && !auroraDay(d) && !auroraDay(d - 1)) seg.push([1.5 * H, 4 * H, 'cloudy'], [1.5 * H, 4 * H, 'rain']);
  return seg; }
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* intensities 0..1 at `sec` + wet flag and seconds since the last wet/dry change (bots walk in/out from then) */
export function weatherAt(sec, d) {
  const f = forcedWeather(); if (f) { const v = { cloud: f !== 'clear' && f !== 'fog' ? 1 : 0, rain: f === 'rain' || f === 'storm' ? 1 : 0, storm: f === 'storm' ? 1 : 0, fog: f === 'fog' ? 1 : 0 }; return { ...v, kind: f, wet: v.rain > 0.5, since: 1e6, start: 0 }; }
  const o = { cloud: 0, rain: 0, storm: 0, fog: 0 }; let since = 1e6, start = 0, wet = false;
  for (const [s, e, k] of dayPlan(d)) { const a = ss(s, s + FADE, sec) * (1 - ss(e - FADE, e, sec));
    if (k === 'fog') o.fog = Math.max(o.fog, a); else o.cloud = Math.max(o.cloud, a);
    if (k === 'rain' || k === 'storm') { o.rain = Math.max(o.rain, a); if (k === 'storm') o.storm = Math.max(o.storm, a);
      if (sec >= s + FADE / 2 && sec < e - FADE / 2) { wet = true; since = sec - s - FADE / 2; start = s; } else if (sec >= e - FADE / 2) since = Math.min(since, sec - e + FADE / 2); } }
  const kind = o.storm > 0.5 ? 'storm' : o.rain > 0.5 ? 'rain' : o.fog > 0.5 ? 'fog' : o.cloud > 0.5 ? 'cloudy' : 'clear';
  return { ...o, kind, wet, since, start };
}
/* next N days of plans (tests / report) */
export function upcomingWeather(d, n = 30) { const r = []; for (let i = d; i < d + n; i++) r.push([i, dayPlan(i).map(([s, e, k]) => `${k} ${(s / H).toFixed(2)}-${(e / H).toFixed(2)}`)]); return r; }
