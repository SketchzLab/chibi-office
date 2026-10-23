// High-street island clearance test (v16). Pass =
//  1. every awning part (real mesh bounds) sits above the tallest head (HEAD_C + HEAD_R) and inside its shop's body collider
//     (so nobody can even stand under one);
//  2. Calvin walking into every shop front (straight + diagonal), every awning corner, street tree, lamp and terrace umbrella
//     never gets his head sphere into the building, an awning, a canopy, a lamp globe or an umbrella;
//  3. NPC stroller loops + window-shopper spots and every bot shop spot keep a body radius clear of all island colliders.
import puppeteer from 'puppeteer-core';
import { SHOP_BLDG, SHOP_SIDE, STREET_PROPS, STREET_TREE, LAMP_H, AWN, HEAD_C, HEAD_R, shopBox, shopFront, SHOP } from './src/layout.js';
const W = ms => new Promise(r => setTimeout(r, ms)), TOL = 0.03, BODY = 0.42; let bad = 0; const rep = (ok, s) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + s); };
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto(process.argv[2] || 'http://localhost:5179/?t=12:00&q=low', { waitUntil: 'networkidle0' }); await W(1500);
// ---- 1. awnings ----
const aw = await p.evaluate(() => window.__awnings), TOP = HEAD_C + HEAD_R; let lo = 1e9, outside = 0;
for (const a of aw) { lo = Math.min(lo, a.min[1]); const inside = SHOP_BLDG.some(s => { const [x0, z0, x1, z1] = shopBox(s); return a.min[0] >= x0 - 0.02 && a.max[0] <= x1 + 0.02 && a.min[2] >= z0 - 0.02 && a.max[2] <= z1 + 0.02; }); if (!inside) outside++; }
rep(lo > TOP + 0.1, `awnings: ${aw.length} parts, lowest edge y ${lo.toFixed(2)} vs tallest head top ${TOP.toFixed(2)}`);
rep(outside === 0, `awnings: ${outside} part(s) project outside their shop's body collider (walk path)`);
// ---- 2. walk-into runs ----
let HR = 0; const head = () => p.evaluate(() => { const c = window.__player.chibi; c.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(c.userData.parts.head); return [(bx.min.x + bx.max.x) / 2, (bx.min.y + bx.max.y) / 2, (bx.min.z + bx.max.z) / 2]; });
HR = await p.evaluate(() => { const c = window.__player.chibi, h = c.userData.parts.head, q = c.quaternion.clone(); c.rotation.set(0, 0, 0); c.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(h); c.quaternion.copy(q); c.updateMatrixWorld(true); return Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2; });
const box3 = (h, mn, mx) => Math.hypot(Math.max(mn[0] - h[0], 0, h[0] - mx[0]), Math.max(mn[1] - h[1], 0, h[1] - mx[1]), Math.max(mn[2] - h[2], 0, h[2] - mx[2])) - HR;
const obst = [...SHOP_BLDG.map(s => { const [x0, z0, x1, z1] = shopBox(s, 0); return h => box3(h, [x0, 0, z0], [x1, 9, z1]); }), ...aw.map(a => h => box3(h, a.min, a.max)),
  ...STREET_PROPS.filter(q => q[3] === 'tree').map(([x, z]) => h => Math.hypot(h[0] - x, h[1] - STREET_TREE.canopyY, h[2] - z) - STREET_TREE.canopyR - HR),
  ...STREET_PROPS.filter(q => q[3] === 'lamp').map(([x, z]) => h => box3(h, [x - 0.25, LAMP_H - 0.35, z - 0.25], [x + 0.25, LAMP_H + 0.4, z + 0.25])),
  ...STREET_PROPS.filter(q => q[3] === 'lamp').map(([x, z]) => h => box3(h, [x - 0.07, 0, z - 0.07], [x + 0.07, LAMP_H, z + 0.07])),
  ...STREET_PROPS.filter(q => q[3] === 'table').map(([x, z]) => h => box3(h, [x - 1.0, 3.33, z - 1.0], [x + 1.0, 3.67, z + 1.0])),
  ...SHOP_SIDE.map(([x0, z0, x1, z1]) => h => box3(h, [x0, 0, z0], [x1, 1.7, z1]))];
const gap = h => Math.min(...obst.map(f => f(h)));
async function walk(sx, sz, dx, dz, ms = 2600) { await p.evaluate((x, z) => { const c = window.__player.chibi; window.__player.stand?.(); c.position.set(x, 0, z); window.__player.setFollow(true); }, sx, sz); await W(250);
  await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 1.0]; }, dx, dz); let w = 1e9; const t0 = Date.now(); while (Date.now() - t0 < ms) { await W(120); w = Math.min(w, gap(await head())); } await p.evaluate(() => { window.__player.debugDir = null; }); return w; }
const runs = [];
for (const s of SHOP_BLDG) { const f = s.ry ? -1 : 1, fz = s.z + f * s.d / 2; runs.push([`${s.name} front (straight)`, s.x, fz + f * 3.2, 0, -f], [`${s.name} awning corner (diagonal)`, s.x + s.w / 2 + 1.4, fz + f * 2.6, -0.6, -f], [`${s.name} awning (other diagonal)`, s.x - s.w / 2 - 1.2, fz + f * 2.4, 0.55, -f]); }
for (const [x, z, , k] of STREET_PROPS) if (k === 'tree' || k === 'lamp' || k === 'table') { const a = Math.atan2(11 - z, SHOP.cx - x); runs.push([`${k} (${x},${z})`, x + Math.cos(a) * 2.6, z + Math.sin(a) * 2.6, -Math.cos(a), -Math.sin(a)]); }
for (const [lab, sx, sz, dx, dz] of runs.filter(r => !process.env.ONLY || r[0].includes(process.env.ONLY))) { const g = await walk(sx, sz, dx, dz); rep(g > -TOL, `${lab.padEnd(44)} closest head gap ${g.toFixed(2)}`); }
// ---- 3. paths ----
const boxes = [...SHOP_BLDG.map(s => shopBox(s)), ...SHOP_SIDE], circles = STREET_PROPS.map(([x, z, r]) => [x, z, r]);
const clear = (x, z) => Math.min(...boxes.map(([x0, z0, x1, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1))), ...circles.map(([cx, cz, r]) => Math.hypot(x - cx, z - cz) - r), SHOP.walk - Math.hypot(x - SHOP.cx, z - SHOP.cz)) - BODY;
const npc = await p.evaluate(() => ({ loops: window.__npcs.npcs.filter(o => o.loop).map(o => o.loop), spots: window.__npcs.npcs.filter(o => o.role === 'browser').map(o => o.pos) }));
npc.loops.forEach((L, i) => { let w = 1e9; L.forEach((a, k) => { const q = L[(k + 1) % L.length]; for (let u = 0; u <= 1; u += 0.02) w = Math.min(w, clear(a[0] + (q[0] - a[0]) * u, a[1] + (q[1] - a[1]) * u)); }); rep(w > -0.001, `NPC stroller loop ${i} (${L.length} waypoints) min body clearance ${w.toFixed(2)}`); });
npc.spots.forEach(([x, z], i) => rep(clear(x, z) > -0.001, `NPC window-shopper ${i} (${x.toFixed(1)},${z.toFixed(1)}) clearance ${clear(x, z).toFixed(2)}`));
for (const s of SHOP_BLDG.filter(s => s.kind !== 'cafe' && s.kind !== 'bistro')) for (const o of [-0.3, 0.6, -0.75, 0.3]) { const [x, z] = shopFront(s, s.d / 2 + AWN.out + 0.55, o); rep(clear(x, z) > -0.001, `bot spot ${s.name} offset ${o}: clearance ${clear(x, z).toFixed(2)}`); }
await b.close(); console.log(bad ? `${bad} island check(s) failed` : 'island: awnings clear every head; paths clear every collider'); process.exit(bad ? 1 : 0);
