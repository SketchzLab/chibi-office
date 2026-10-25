// v23 executive-wing test (dev server, BASE_PATH=/). Pass =
//  1. walk: Calvin walks (steered like a player, window.__player.debugDir) from the default spawn out of the office, up the lawn
//     into Sage's manager office, then into the founder/CEO office, then all the way to his private island house; never stuck,
//     head never enters a room wall / glass pane;
//  2. walls: running straight at every room wall from inside and outside never lets the head through;
//  3. Sage: at a work-time moment she is seated at HER desk in the manager office (not at an open-plan desk);
//  4. CEO chair + office sofa are offered as seats when Calvin stands nearby.
import puppeteer from 'puppeteer-core';
import { SAGE_OFF as S, CEO_OFF as C, roomWalls, corrWalls, CORR, CAL_HOUSE as H } from './src/layout.js';
const W = ms => new Promise(r => setTimeout(r, ms)); let bad = 0; const rep = (ok, s) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + s); };
const BASE = process.argv[2] || 'http://localhost:5179/';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 900, height: 600 }); p.on('pageerror', e => { console.log('ERR', e.message); bad++; });
await p.goto(BASE + '?t=12:00&q=low', { waitUntil: 'networkidle0' }); await p.evaluate(() => { localStorage.removeItem('calvinGuests'); }); await p.reload({ waitUntil: 'networkidle0' }); await W(1500);
const HR = await p.evaluate(() => { const c = window.__player.chibi; c.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(c.userData.parts.head); return Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2; });
const walls = [...roomWalls(S, 0.06), ...roomWalls(C, 0.06), ...corrWalls(0.06)];
const wallGap = (x, z) => Math.min(...walls.map(([x0, z0, x1, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1)))) - HR;
const st = () => p.evaluate(() => { const c = window.__player.chibi; c.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(c.userData.parts.head); return { x: c.position.x, z: c.position.z, hx: (bx.min.x + bx.max.x) / 2, hz: (bx.min.z + bx.max.z) / 2 }; });
let minGap = 9;
async function go(wps, tag) { for (const [tx, tz] of wps) { let best = 1e9, bestT = Date.now();
    while (true) { const s = await st(); minGap = Math.min(minGap, wallGap(s.hx, s.hz)); const dx = tx - s.x, dz = tz - s.z, d = Math.hypot(dx, dz); if (d < 0.45) break;
      if (d < best - 0.05) { best = d; bestT = Date.now(); } if (Date.now() - bestT > 5000) { rep(false, `${tag}: stuck heading to (${tx}, ${tz}) at (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`); await p.evaluate(() => { window.__player.debugDir = null; }); return false; }
      await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 1.0]; }, dx / d, dz / d); await W(60); } }
  await p.evaluate(() => { window.__player.debugDir = null; }); return true; }
const inRoom = (s, R) => s.x > R.x0 && s.x < R.x1 && s.z > R.z0 && s.z < R.z1;
// ---------- 1. spawn -> Sage's office -> CEO office -> island house ----------
{ const s0 = await st(); rep(Math.hypot(s0.x - 3.6, s0.z - 1.1) < 0.3, `default spawn (${s0.x.toFixed(2)}, ${s0.z.toFixed(2)})`);
  const sd = (S.door[0] + S.door[1]) / 2, cd = (C.door[0] + C.door[1]) / 2;
  let ok = await go([[3.6, 0], [8.8, -0.3], [8.8, -3.6], [12.3, -5.2]], 'office -> corridor'); { const c = await st(); rep(ok && c.x > CORR.x0 && c.x < CORR.x1 && c.z < CORR.z1, `walked from the office floor into the corridor, at (${c.x.toFixed(2)}, ${c.z.toFixed(2)})`); }
  ok = await go([[12.3, -9.3], [10.3, -9.3]], 'corridor -> roof stairs doorway'); { const c = await st(); rep(ok && c.x < CORR.x0, `corridor side doorway reaches the roof stairs, at (${c.x.toFixed(2)}, ${c.z.toFixed(2)})`); }
  ok = await go([[12.3, -9.3], [12.3, -15.5], [sd, -19.8], [sd, -22.7], [6.4, -22.4]], 'to Sage office'); let s = await st();
  rep(ok && inRoom(s, S), `walked from spawn into Sage's office, at (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
  ok = await go([[sd, -22.5], [sd, -19.8], [cd, -19.4], [cd, -22.6], [16.0, -23.0], [15.6, -24.9]], 'to CEO office'); s = await st();
  rep(ok && inRoom(s, C), `walked from Sage's office into the CEO office, at (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
  const near = await p.evaluate(() => window.__nearObj?.() ?? null);
  ok = await go([[cd, -22.6], [cd, -19.4], [12.3, -15.5], [12.2, -9.3], [12.2, 0], [-4.65, 0.25], [-4.65, 8.6], [-9.4, 8.3], [-10.4, 9.0], [-11.8, 8.9], [-12.8, 6], [-13.6, 2.2], [-15.6, 0.3], [-20, 0.3], [-29, 0.6], [-34.5, 3.0], [-38.4, -0.6], [-38.4, -3.0]], 'to island house'); s = await st();
  rep(ok && s.x > H.x0 && s.x < H.x1 && s.z > H.z0 && s.z < H.z1, `walked from the CEO office to the island house, at (${s.x.toFixed(2)}, ${s.z.toFixed(2)})`);
  rep(minGap > -0.03, `head never entered a room wall on the walk (min head-wall gap ${minGap.toFixed(2)})`); }
// ---------- 2. wall runs ----------
async function run(sx, sz, dx, dz, ms = 2600) { await p.evaluate((x, z) => { const c = window.__player.chibi; window.__player.stand?.(); c.position.set(x, 0, z); }, sx, sz); await W(200);
  let g = 9; await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 1.0]; }, dx, dz); const t0 = Date.now(); while (Date.now() - t0 < ms) { await W(100); const s = await st(); g = Math.min(g, wallGap(s.hx, s.hz)); }
  await p.evaluate(() => { window.__player.debugDir = null; }); const e = await st(); return { g, e }; }
const runs = [];
for (const [R, n] of [[S, 'Sage'], [C, 'CEO']]) { const cx = (R.door[0] + R.door[1]) / 2;
  runs.push([`${n} inside -> north wall`, cx, R.z1 - 1.3, 0, -1], [`${n} inside -> west wall`, R.x0 + 1.3, R.z1 - 1.2, -1, 0], [`${n} inside -> east wall`, R.x1 - 1.3, R.z1 - 1.2, 1, 0],
    [`${n} inside -> south wall (beside door)`, R.door[0] - R.x0 > R.x1 - R.door[1] ? R.door[0] - 1.1 : R.door[1] + 1.1, R.z1 - 1.2, 0, 1], [`${n} outside -> south wall`, R.x0 + 0.9, R.z1 + 1.8, 0, -1], [`${n} outside -> north wall`, (R.x0 + R.x1) / 2, R.z0 - 1.6, 0, 1]); }
runs.push(['corridor -> west wall', 12.4, -11.7, -1, 0], ['corridor -> east wall', 12.4, -8, 1, 0], ['outside -> corridor east wall', 15.6, -8.5, -1, 0], ['stairs gap -> corridor west wall', 9.9, -11.3, 1, 0], ['outside -> CEO east wall', C.x1 + 1.6, -23, -1, 0], ['outside -> Sage west wall', S.x0 - 1.6, -24, 1, 0], ['between rooms', (S.x1 + C.x0) / 2, -19.5, 0, -1]);
for (const [tag, sx, sz, dx, dz] of runs) { const { g, e } = await run(sx, sz, dx, dz); rep(g > -0.03, `${tag.padEnd(36)} head-wall gap ${g.toFixed(2)} end (${e.x.toFixed(2)}, ${e.z.toFixed(2)})`); }
// ---------- 4. seats ----------
for (const [tag, x, z, want] of [['CEO chair', C.desk[0] - 2.1, C.desk[1] - 0.6, 'CEO chair'], ['office sofa', C.sofa[0] + 1.1, C.sofa[1] + 0.4, 'office sofa']]) {
  await p.evaluate((x, z) => { const c = window.__player.chibi; window.__player.stand?.(); c.position.set(x, 0, z); }, x, z); await W(700);
  const lbl = await p.evaluate(() => [...document.querySelectorAll('#actb, #imenu button')].map(e => e.textContent).join(' | '));
  rep(lbl.includes(want), `${tag}: prompt offered next to it ("${lbl.slice(0, 60)}")`); }
// ---------- 3. Sage at her desk during work time ----------
await p.goto(BASE + '?t=12:00&q=low', { waitUntil: 'networkidle0' }); await W(800);
const at = await p.evaluate(() => { const sage = window.__scene.children.find(o => o.userData?.name === 'Sage'), br = sage.userData.brain; const t0 = Math.floor(Date.now() / 1000);
  for (let t = t0; t < t0 + 3600; t += 1) { let ok = true; for (let k = 0; k <= 48; k += 2) if (br.actAt(t - k) !== 'work') { ok = false; break; } if (ok) return t; } return null; });
rep(at !== null, `found a work-time moment for Sage (at=${at})`);
if (at !== null) { await p.goto(BASE + `?t=12:00&q=low&at=${at}`, { waitUntil: 'networkidle0' }); await W(2500);
  const r = await p.evaluate(() => { const s = window.__scene.children.find(o => o.userData?.name === 'Sage'), st = s.userData.brain.state; return { x: s.position.x, z: s.position.z, y: s.position.y, act: st.act, seated: st.seated, ry: s.rotation.y }; });
  const want = [S.desk[0], S.desk[1] - 1.0];
  rep(r.act === 'work' && r.seated && Math.hypot(r.x - want[0], r.z - want[1]) < 0.15 && r.x > S.x0 && r.x < S.x1 && r.z > S.z0 && r.z < S.z1,
    `Sage works seated at her own desk in the manager office: act ${r.act}, seated ${r.seated}, at (${r.x.toFixed(2)}, ${r.z.toFixed(2)}) want (${want[0]}, ${want[1]}), yaw ${r.ry.toFixed(2)}`); }
await b.close(); console.log(bad ? `${bad} FAILED` : 'ALL OK'); process.exit(bad ? 1 : 0);
