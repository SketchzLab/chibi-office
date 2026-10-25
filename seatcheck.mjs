// Seat-facing audit: every seat (Calvin + bots) vs the target it should face, derived independently
// from the furniture geometry (desk/table centres, or the front of backed furniture: back at local -z => front = group ry).
import puppeteer from 'puppeteer-core';
import { DESKS, BOSS_DESK, LOUNGE as L, GLASS, PARK, CAL_SWING, CAL_FIRE, CAL_DECK, SAGE_OFF, CEO_OFF } from './src/layout.js';
const TABLES = [ // [name, x, z] things you sit facing
  ...DESKS.map(([x, z], i) => ['desk ' + i, x, z]), ['boss desk', ...BOSS_DESK],
  ['meeting table', (GLASS.x0 + GLASS.x1) / 2, (GLASS.z0 + GLASS.z1) / 2], ['parasol table', 0.2, -10.0], ['park (blanket faces centre)', PARK.cx, PARK.cz], ['campfire', CAL_FIRE.x, CAL_FIRE.z], ['sage office desk', ...SAGE_OFF.desk], ['ceo desk', ...CEO_OFF.desk]];
const BACKED = [ // [name, x, z, ry, halfLen] furniture with a back: sit facing ry
  ['long sofa', L.cx, L.cz + 2.0, Math.PI, 1.6], ['side sofa', L.cx - 2.2, L.cz - 0.1, Math.PI / 2, 1.2], ['armchair', L.cx + 2.1, L.cz - 0.9, -1.1, 0.5],
  ['pergola bench', -3.0, -11.05, 0, 0.9], ...PARK.benches.map(([x, z, ry], i) => ['park bench ' + i, x, z, ry, 0.9]),
  ['swing seat', CAL_SWING.x, CAL_SWING.z, 0, 0.4], ['sea-view deck bench', CAL_DECK.bench.x, CAL_DECK.bench.z, CAL_DECK.bench.ry, 0.9], ['ceo office sofa', ...CEO_OFF.sofa, Math.PI / 2, 1.0]];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.goto(process.argv[2] || 'http://localhost:5179/?at=40&q=low', { waitUntil: 'networkidle0' });
const seats = await p.evaluate(() => window.__seatAudit()); await b.close();
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), deg = a => (a * 180 / Math.PI).toFixed(0).padStart(5);
let bad = 0;
for (const s of seats) { const [x, z] = s.pos; let best = null;
  for (const [n, bx, bz, ry, hl] of BACKED) { const lx = (x - bx) * Math.cos(ry) - (z - bz) * Math.sin(ry), lz = (x - bx) * Math.sin(ry) + (z - bz) * Math.cos(ry); if (Math.abs(lx) < hl + 0.3 && Math.abs(lz) < 0.7) best = { n, want: ry }; }
  if (!best) { let bd = 1e9; for (const [n, tx, tz] of TABLES) { const d = Math.hypot(tx - x, tz - z); if (d < bd && (d < 2.6 || n.startsWith('park'))) { bd = d; best = { n, want: Math.atan2(tx - x, tz - z) }; } } }
  const err = best ? wrap(s.rot - best.want) : NaN, ok = Math.abs(err) < 0.35; if (!ok) bad++;
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${s.who.padEnd(6)} ${String(typeof s.label === 'string' ? s.label : 'seat').padEnd(34)} yaw${deg(s.rot)}°  target ${(best?.n || '?').padEnd(28)} want${deg(best?.want ?? NaN)}°  err${deg(err)}°`); }
console.log(bad ? `${bad} seat(s) facing wrong` : `all ${seats.length} seats face their target`); process.exit(bad ? 1 : 0);
