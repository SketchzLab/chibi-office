// v18 bridge test: Calvin walks (0.6) and runs (1.0) across the park -> shop-street plank bridge both ways, on the centre line and
// off-centre, and must reach the far side without stalling. Also checks bot route (TO_SHOP) + NPC loop waypoints are walkable.
import puppeteer from 'puppeteer-core';
import { BRIDGE2, walkClamp, WALK_R } from './src/layout.js';
const W = ms => new Promise(r => setTimeout(r, ms)); let bad = 0; const rep = (ok, s) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + s); };
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto(process.argv[2] || 'http://localhost:5179/?t=12:00&q=low', { waitUntil: 'networkidle0' }); await W(1500);
const off = BRIDGE2.walkHalf - 0.05;
// lanes: straight along the centre / near either rail, plus a diagonal approach (player steering in from the side, as on a joystick)
for (const [lab, sx, ex, dir] of [['park -> street', 8.5, 24.5, 1], ['street -> park', 25.0, 9.0, -1]]) for (const mag of [0.6, 1.0]) for (const [dz, dd] of [[0, 0], [off, 0], [-off, 0], [2.2, -0.14], [-2.2, 0.14]]) {
  await p.evaluate((x, z) => { const P = window.__player; P.stand?.(); P.chibi.position.set(x, 0, z); P.setFollow(true); }, sx, BRIDGE2.z + dz); await W(200);
  await p.evaluate((d, m, dd) => { window.__player.debugDir = [d, dd, m]; }, dir, mag, dd);
  const t0 = Date.now(); let x = sx, stall = 0, last = sx, lastT = t0; while (Date.now() - t0 < 22000) { await W(150); x = await p.evaluate(() => window.__player.chibi.position.x);
    if ((ex - x) * dir <= 0) break; if (Math.abs(x - last) > 0.15) { last = x; lastT = Date.now(); } else if (Date.now() - lastT > 1500) { stall = 1; break; } }
  await p.evaluate(() => { window.__player.debugDir = null; });
  const secs = (Date.now() - t0) / 1000, ideal = Math.abs(ex - sx) / (mag > 0.72 ? 4.6 : 1.2 + mag * 2.2);
  rep(!stall && (ex - x) * dir <= 0 && secs < ideal * 1.6 + 1.0, `${lab} ${mag > 0.72 ? 'run ' : 'walk'} ${dd ? 'diagonal' : 'lane'} ${dz >= 0 ? '+' : ''}${dz.toFixed(2)}: reached x ${x.toFixed(2)} in ${secs.toFixed(1)}s (ideal ${ideal.toFixed(1)}s)${stall ? ' (STALLED)' : ''}`); }
// routes: every point along the bot approach to the shops and every NPC waypoint must already be walkable (walkClamp leaves it alone)
const route = await p.evaluate(() => window.__npcs.npcs.filter(o => o.loop).flatMap(o => o.loop));
const TO = [[12.0, 11.0], [21.2, 11.0], [22.6, 11.0], [26, 11]]; let worst = 0;
for (let k = 0; k + 1 < TO.length; k++) for (let u = 0; u <= 1; u += 0.02) { const q = { x: TO[k][0] + (TO[k + 1][0] - TO[k][0]) * u, z: 11 }; const x0 = q.x; walkClamp(q, WALK_R); worst = Math.max(worst, Math.abs(q.x - x0) + Math.abs(q.z - 11)); }
rep(worst < 1e-6, `bot route across the bridge stays walkable (max snap ${worst.toFixed(3)})`);
const sn = route.map(([x, z]) => { const q = { x, z }; walkClamp(q, WALK_R); return Math.hypot(q.x - x, q.z - z); }); rep(Math.max(...sn) < 1e-6, `NPC waypoints walkable (max snap ${Math.max(...sn).toFixed(3)})`);
await b.close(); console.log(bad ? `${bad} bridge check(s) failed` : 'bridge: crossable both ways, walk + run, centre + both rails'); process.exit(bad ? 1 : 0);
