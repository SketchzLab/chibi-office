// Obstacle walk test: walk Calvin (tallest chibi) straight into every wall / glass pane / annex wall / corner, and into
// every tree and potted plant from several directions. Pass = his head sphere (from the real head mesh bounds) never
// overlaps the obstacle: walls are full-height slabs (2D distance), foliage is the real canopy spheres (3D distance).
import puppeteer from 'puppeteer-core';
import { BACK_Z, LEFT_X, GLASS as G, ROOF, TREES, TREE_SPHERES, treeRot, PLANTS, PLANT_SPHERES, HOUSE as H, BRIDGE as BR } from './src/layout.js';
const TOL = 0.03, W = ms => new Promise(r => setTimeout(r, ms));
const walls = { 'back wall': [-11, BACK_Z - 0.1, 11, BACK_Z + 0.1], 'left wall': [LEFT_X - 0.1, -8, LEFT_X + 0.1, 8], 'glass front pane': [G.x0, G.z1 - 0.03, G.door0, G.z1 + 0.03],
  'glass side pane': [G.x1 - 0.03, G.z0, G.x1 + 0.03, G.z1], 'annex block': [ROOF.x0, ROOF.z0, ROOF.x1, ROOF.z1],
  'house back wall': [H.x0, H.z1 - 0.08, H.x1, H.z1 + 0.08], 'bridge rail L': [BR.x - BR.half - 0.03, BR.z0, BR.x - BR.half + 0.03, BR.z1], 'bridge rail R': [BR.x + BR.half - 0.03, BR.z0, BR.x + BR.half + 0.03, BR.z1],
  ...Object.fromEntries(H.walls.map((x, i) => ['house wall ' + i, [x - 0.08, H.z0, x + 0.08, H.z1]])) };
const runs = [ // [label, obstacle, start x, z, dir x, z]
  ['back wall (inside, x 1)', 'back wall', 1, -5.5, 0, -1], ['back wall (inside, x 8)', 'back wall', 8.5, -5.5, 0, -1], ['left wall (inside)', 'left wall', -8.5, 1, -1, 0],
  ['left wall (outside)', 'left wall', -13.5, 0, 1, 0], ['back-left corner (inside, diagonal)', 'left wall', -8.8, 1.8, -0.6, -1],
  ['glass front (outside)', 'glass front pane', -9, 0.2, 0, -1], ['glass front (inside)', 'glass front pane', -8.2, -4.2, 0, 1], ['glass side (outside)', 'glass side pane', -3.2, -5, -1, 0],
  ['glass side (inside)', 'glass side pane', -6.8, -5.8, 1, 0], ['glass door jamb (diagonal)', 'glass front pane', -6.0, -0.6, -0.7, -1],
  ['annex back (outside)', 'annex block', -2, -14.3, 0, 1], ['annex left (outside)', 'annex block', -9.8, -10.2, 1, 0], ['annex right (outside)', 'annex block', 7.5, -12.5, -1, 0.3],
  ['bridge rail L (on bridge)', 'bridge rail L', BR.x, 18, -1, 0], ['bridge rail R (on bridge)', 'bridge rail R', BR.x, 21, 1, 0], ['bridge rail L (diagonal)', 'bridge rail L', BR.x + 0.3, 17, -0.6, 1],
  ['house back wall (outside)', 'house back wall', H.rooms[2].cx, H.z1 + 2.2, 0, -1], ['house back wall (inside, Jun)', 'house back wall', H.rooms[1].cx - 0.9, H.z0 + 0.6, 0, 1],
  ['house left wall (outside)', 'house wall 0', H.x0 - 1.8, H.z0 + 1.9, 1, 0], ['house right wall (outside)', 'house wall 4', H.x1 + 1.8, H.z0 + 1.9, -1, 0],
  ...H.walls.slice(1, 4).flatMap((x, i) => [[`partition ${i + 1} (from left room)`, 'house wall ' + (i + 1), x - 1.2, H.z0 + 0.9, 1, 0], [`partition ${i + 1} (from right room)`, 'house wall ' + (i + 1), x + 1.2, H.z0 + 0.9, -1, 0]])];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.goto(process.argv[2] || 'http://localhost:5179/?at=40&q=low', { waitUntil: 'networkidle0' });
let HR = 0; const head = () => p.evaluate(HR => { window.__player.chibi.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(window.__player.chibi.userData.parts.head);
  const q = window.__player.chibi.position; return { p: [q.x, q.y, q.z], c: [(bx.min.x + bx.max.x) / 2, (bx.min.y + bx.max.y) / 2, (bx.min.z + bx.max.z) / 2], r: HR }; }, HR);
async function walk(sx, sz, dx, dz, measure, ms = 3200, y0 = 0) { await p.evaluate((x, z, y0) => { const c = window.__player.chibi; window.__player.stand?.(); c.position.set(x, y0, z); window.__player.setFollow(true); }, sx, sz, y0); await W(300);
  await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 0.9]; }, dx, dz); let worst = 1e9; const t0 = Date.now();
  while (Date.now() - t0 < ms) { await W(150); const h = await head(); worst = Math.min(worst, measure(h)); }
  await p.evaluate(() => { window.__player.debugDir = null; }); return worst; }
// head radius calibrated once facing +z (an AABB of a turned head over-reports its radius); centre from the live AABB
HR = await p.evaluate(() => { const c = window.__player.chibi, h = c.userData.parts.head; const q = c.quaternion.clone(); c.rotation.set(0, 0, 0); c.updateMatrixWorld(true);
  const bx = new window.__Box3().setFromObject(h); c.quaternion.copy(q); c.updateMatrixWorld(true); return Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2; }); console.log('head radius (calibrated, incl. hair)', HR.toFixed(2));
let bad = 0; const rep = (ok, s) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + s); };
const boxGap = ([x0, z0, x1, z1], h) => Math.hypot(Math.max(x0 - h.c[0], 0, h.c[0] - x1), Math.max(z0 - h.c[2], 0, h.c[2] - z1)) - h.r;
// bridge rails are knee-high ropes (y = deck + 0.98), far below the head: check the head sphere vs the rope line in 3D AND the body (r 0.45) vs the rail posts
const railGap = (ob, h) => { const rx = BR.x + (ob.endsWith('L') ? -BR.half : BR.half), ry = h.p[1] + 0.98; return Math.min(Math.hypot(h.c[0] - rx, h.c[1] - ry) - h.r - 0.04, h.p[2] < BR.s0 - 0.6 || h.p[2] > BR.s1 + 0.6 ? Math.hypot(h.p[0] - rx, h.p[2] - (h.p[2] < BR.z0 + 2 ? BR.s0 - 0.6 : BR.s1 + 0.6)) - 0.08 - 0.45 : Math.abs(h.p[0] - rx) - 0.06 - 0.45); }; // past the rope span: just the end post
for (const [lab, ob, sx, sz, dx, dz] of runs.filter(r => !process.env.ONLY || r[0].includes(process.env.ONLY))) { const g = await walk(sx, sz, dx, dz, h => { const v = ob.startsWith('bridge') ? railGap(ob, h) : boxGap(walls[ob], h); if (v < -0.03 && process.env.DBG) console.log('  dbg', h.p.map(q => q.toFixed(2)).join(','), h.c.map(q => q.toFixed(2)).join(','), v.toFixed(2)); return v; }); rep(g > -TOL, `${lab.padEnd(38)} closest head-to-wall gap ${g.toFixed(2)}${g > 0.25 ? '  (did not reach — blocked earlier)' : ''}`); }
const foliage = [['rooftop tree (-5.3,-9.7) s0.7', -5.3, -9.7, TREE_SPHERES.map(([a, y, c, r]) => [-5.3 + a * 0.7, 3.34 + y * 0.7, -9.7 + c * 0.7, r * 0.7]), 3.34],...TREES.map(([x, z, s], i) => ['tree ' + i + ` (${x},${z}) s${s}`, x, z, TREE_SPHERES.map(([a, y, c, r]) => { const t = treeRot(i); return [x + (a * Math.cos(t) + c * Math.sin(t)) * s, y * s, z + (-a * Math.sin(t) + c * Math.cos(t)) * s, r * s]; })]),
  ...PLANTS.map(([x, z, s]) => [`potted plant (${x},${z})`, x, z, PLANT_SPHERES.map(([a, y, c, r]) => [x + a * s, y * s, z + c * s, r * s])])];
for (const [lab, x, z, sph, y0 = 0] of foliage.filter(f => !process.env.ONLY || f[0].includes(process.env.ONLY))) { let w = 1e9; const n = y0 ? 4 : Math.hypot(x, z) > 8 ? 3 : 5;
  for (let k = 0; k < n; k++) { const a = y0 ? [Math.PI / 2, 0.6, 2.4, 1.5][k] : Math.atan2(-x, -z) + (k - (n - 1) / 2) * (n === 3 ? 0.6 : 1.1); const L = y0 ? 2.6 : 3.4; const sx = x + Math.sin(a) * L, sz = z + Math.cos(a) * L;
    const g = await walk(sx, sz, x - sx, z - sz, h => { const v = Math.min(...sph.map(([a, y, c, r]) => Math.hypot(h.c[0] - a, h.c[1] - y, h.c[2] - c) - r - h.r)); if (v < -0.03 && process.env.DBG) console.log('  dbg', h.p.map(q => q.toFixed(2)).join(','), h.c.map(q => q.toFixed(2)).join(','), h.r.toFixed(2), v.toFixed(2)); return v; }, 2400, y0); w = Math.min(w, g); }
  rep(w > -TOL, `${lab.padEnd(38)} closest head-to-foliage gap ${w.toFixed(2)} (${n} approaches)`); }
await b.close(); console.log(bad ? `${bad} obstacle(s) the head enters` : 'head never enters a wall or foliage'); process.exit(bad ? 1 : 0);
