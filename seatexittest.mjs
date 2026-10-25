// v24: every Calvin seat -> stand up onto a free spot, then walk away (4 directions) without getting stuck.
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'http://localhost:5179/';
let fails = 0; const rep = (ok, m) => { console.log((ok ? 'OK   ' : 'FAIL ') + m); if (!ok) fails++; };
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1024, height: 640 }); p.on('pageerror', e => rep(false, 'page error ' + e.message));
await p.goto(BASE + '?q=low&t=11:00&weather=clear&sky=none', { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__objs && window.__player, { timeout: 60000 }); await new Promise(r => setTimeout(r, 2500));
await p.evaluate(async () => { const P = await import('/src/player.js'); window.__isFree = P.isFree; });
const W = ms => new Promise(r => setTimeout(r, ms));
const seats = await p.evaluate(() => window.__objs.map((o, i) => [i, typeof o.label === 'function' ? o.label() : o.label]).filter(([i]) => { const o = window.__objs[i]; return o.seatDef || /Lean|Sit|Relax|Picnic|Swing|swing|hammock|Lie|Nap|bed|bench/i.test(String(window.__objs[i].label)); }));
console.log(seats.length + ' seats');
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
for (const [i, label] of seats) {
  const sit = () => p.evaluate(i => { const o = window.__objs[i], P = window.__player, c = P.chibi; if (P.seat) P.stand(); P.debugDir = null; c.position.set(o.x, o.y || c.position.y, o.z); o.run(); return !!P.seat; }, i);
  if (!(await sit())) { console.log(`skip ${label} (not a seat)`); continue; }
  await W(400); const res = [];
  for (const [dx, dz] of DIRS) { await sit(); await W(250);
    const s0 = await p.evaluate(() => { const P = window.__player; P.stand(); const c = P.chibi.position; return { x: c.x, z: c.z, free: window.__isFree(c.x, c.z) }; });
    await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 0.6]; }, dx, dz); await W(1100);
    const s1 = await p.evaluate(() => { const P = window.__player; P.debugDir = null; const c = P.chibi.position; return { x: c.x, z: c.z, free: window.__isFree(c.x, c.z), seat: !!P.seat }; });
    res.push({ d: Math.hypot(s1.x - s0.x, s1.z - s0.z), free0: s0.free, free1: s1.free }); }
  const moved = res.filter(r => r.d > 0.5).length, free = res.every(r => r.free0 && r.free1);
  rep(free && moved >= 2, `${label}: stand spot free=${res.every(r => r.free0)}, walks away in ${moved}/4 directions (${res.map(r => r.d.toFixed(1)).join(' ')} m)`); }
await p.evaluate(() => { const P = window.__player; if (P.seat) P.stand(); });
// collider overlap rescue: drop Calvin inside the CEO desk -> pushed to a free spot within a second
const r = await p.evaluate(async () => { const P = window.__player, c = P.chibi; c.position.set(17.6, 0, -24.4); await new Promise(r => setTimeout(r, 1500)); return { x: c.position.x, z: c.position.z, free: window.__isFree(c.position.x, c.position.z) }; });
rep(r.free, `dropped inside the CEO desk -> rescued to (${r.x.toFixed(2)}, ${r.z.toFixed(2)})`);
await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
