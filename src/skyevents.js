// v20 rare sky events, deterministic by the UTC+8 calendar day (same on every device, like the OOTD / shopping rules):
//  - rainbow: ~1 in 10 days, a 90-min afternoon window starting 14:00–16:00 (bots outdoors / by the windows react)
//  - aurora:  ~1 in 12 nights, glows 20:30–01:00 (peak ~21:00–23:00); Sage posts a heads-up in the office feed during the day and
//             everyone gathers on the balcony deck 21:00–22:30 to watch.
// ?sky=rainbow / ?sky=aurora force today's event (combine with ?t=HH:MM); ?sky=none suppresses both.
import { ootdDay } from './chibi.js';
const H = 3600;
const hash = (d, k) => { let x = (Math.imul(d + 7919 * k, 2654435761) ^ Math.imul(k + 17, 40503)) >>> 0; x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0; return (x ^ (x >>> 16)) >>> 0; };
const Q = () => (typeof location !== 'undefined' ? new URLSearchParams(location.search).get('sky') : null);
export const isRainbowDay = d => Q() === 'rainbow' || (Q() !== 'none' && hash(d, 1) % 10 === 0);
export const isAuroraDay = d => Q() === 'aurora' || (Q() !== 'none' && hash(d, 2) % 12 === 0);
export function rainbowWindow(d) { const s = 14 * H + (hash(d, 3) % 5) * 1800; return [s, s + 1.5 * H]; }
export const AURORA = { on: 20.5 * H, off: 25 * H, gather: [21 * H, 22.5 * H], post: 9 * H, spot: 'the balcony deck' };
const ss = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
/* sec = UTC+8 seconds of day. Returns intensities 0..1 + flags. */
export function skyEvents(sec, day = ootdDay()) {
  let rainbow = 0; if (isRainbowDay(day)) { if (Q() === 'rainbow') rainbow = ss(7 * H, 8 * H, sec) * (1 - ss(17.5 * H, 18.2 * H, sec)); // forced: all daylight
    else { const [a, b] = rainbowWindow(day); rainbow = ss(a, a + 600, sec) * (1 - ss(b - 600, b, sec)); } }
  const today = isAuroraDay(day), late = sec < 1 * H && isAuroraDay(day - 1); // after midnight it belongs to last night
  let aurora = 0; if (today && sec >= AURORA.on) aurora = ss(AURORA.on, 21 * H, sec) * (0.75 + 0.25 * (1 - ss(23 * H, 24 * H, sec)));
  if (late) aurora = 0.75 * (1 - ss(0, 1 * H, sec));
  return { rainbow, aurora, auroraDay: today, rainbowDay: isRainbowDay(day), gather: today && sec >= AURORA.gather[0] && sec < AURORA.gather[1], headsUp: today && sec >= AURORA.post && sec < AURORA.gather[1] };
}
/* next N event days from `day` (report / tests) */
export function upcoming(day = ootdDay(), n = 60) { const r = [], a = []; for (let d = day; d < day + n; d++) { if (hash(d, 1) % 10 === 0) r.push(d); if (hash(d, 2) % 12 === 0) a.push(d); } return { rainbow: r, aurora: a }; }
