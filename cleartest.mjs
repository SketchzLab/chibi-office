// Overhead clearance: tallest chibi's crown vs any static mesh above it (raycast up), at every seat
// (Calvin + bot seat spots) and on a grid of walkable spots under every cover (pergola, parasol). Then stand-up level check.
import puppeteer from 'puppeteer-core';
const MIN = 0.05;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.goto(process.argv[2] || 'http://localhost:5179/?at=40&q=low', { waitUntil: 'networkidle0' });
const W = ms => new Promise(r => setTimeout(r, ms)); let bad = 0; const out = (ok, s) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + s); };
const n = await p.evaluate(() => window.__objs.length);
for (let i = 0; i < n; i++) { const lab = await p.evaluate(i => { const o = window.__objs[i]; if (!o.seatDef && !/Lean/.test(o.label)) return null; window.__player.stand?.(); o.run(); return o.label; }, i); if (!lab) continue;
  await W(1400); const r = await p.evaluate(() => window.__headClear()); out(r.gap === null || r.gap > MIN, `seat  ${lab.padEnd(34)} at (${r.pos}) crown y ${r.top}  gap ${r.gap ?? '∞'}`);
  if (r.pos[1] > 2) { const lv = r.pos[1]; await p.evaluate(() => window.__player.stand()); await W(700); const q = await p.evaluate(() => { const c = window.__player.chibi.position; return [c.x, c.y, c.z]; });
    out(Math.abs(q[1] - lv) < 0.1, `stand ${lab.padEnd(34)} seat floor ${lv} -> after stand y ${q[1].toFixed(2)} at (${q[0].toFixed(2)}, ${q[2].toFixed(2)})`); } }
await p.evaluate(() => window.__player.stand?.());
const st = await p.evaluate(() => { const c = window.__player.chibi; c.position.set(3, 0, 3); return null; }); await W(800); console.log('info  standing crown on ground', (await p.evaluate(() => window.__headClear())).top);
const bots = await p.evaluate(() => window.__seatAudit().filter(s => s.who === 'bot'));
for (const s of bots) { await p.evaluate(s => { window.__player.stand?.(); window.__player.sitAt({ kind: 'test', pos: s.pos, rot: s.rot, y: -0.05 + 0.37 * (1.5 - 1.16), pose: 'stand' }); }, s); await W(900);
  const r = await p.evaluate(() => window.__headClear()); out(r.gap === null || r.gap > MIN, `bot   ${String(s.label).padEnd(34)} at (${r.pos}) crown y ${r.top}  gap ${r.gap ?? '∞'}`); }
await p.evaluate(() => window.__player.stand?.());
const grid = []; for (let x = -4.4; x <= -1.6; x += 0.35) for (let z = -11.45; z <= -9.95; z += 0.35) if (![[-4.4, -11.45], [-1.6, -11.45], [-4.4, -9.95], [-1.6, -9.95]].some(([a, c]) => Math.hypot(x - a, z - c) < 0.55)) grid.push(['pergola', x, z]); // not inside a post (body collision)
for (let a = 0; a < 6.28; a += 0.7) for (const rr of [0.5, 1.0, 1.35]) grid.push(['parasol', 0.2 + Math.cos(a) * rr, -10 + Math.sin(a) * rr]);
let worst = { pergola: 9, parasol: 9 }, cnt = 0;
for (const [k, x, z] of grid) { const r = await p.evaluate((x, z) => { const c = window.__player.chibi; c.position.set(x, 3.34, z); return null; }, x, z);
  await W(250); const h = await p.evaluate(() => window.__headClear()); if (h.pos[1] < 3) continue; cnt++; if (h.gap !== null) worst[k] = Math.min(worst[k], h.gap); if (h.gap !== null && h.gap <= MIN) out(false, `walk  ${k} (${h.pos[0]}, ${h.pos[2]}) gap ${h.gap}`); }
out(worst.pergola > MIN && worst.parasol > MIN, `walk  ${cnt} standing roof spots under covers; min gap pergola ${worst.pergola.toFixed(2)}  parasol ${worst.parasol.toFixed(2)}`);
await b.close(); console.log(bad ? `${bad} clearance problem(s)` : 'all clear'); process.exit(bad ? 1 : 0);
