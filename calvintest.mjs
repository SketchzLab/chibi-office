// v20 Calvin's private island test. Pass =
//  1. walkability: Calvin walks main lawn -> bridge -> island, into the house, onto the coffee deck, into the pool, and
//     straight at the hedge ring / house walls / tree from many angles: stays on the walk area, head never enters a wall;
//  2. privacy: over a simulated 24 h (normal + forced aurora day) no uninvited bot ever sets foot on the bridge or island;
//     NPC stroller loops / spots and the pets never do either;
//  3. invite: "Invite over" sends Pixel to the swing, survives a reload (localStorage), "Send home" walks him back off.
import puppeteer from 'puppeteer-core';
import { CAL, CAL_HOUSE as H, CAL_DECK as DK, CAL_POOL as PO, BRIDGE3, onCal, inBridge3 } from './src/layout.js';
const W = ms => new Promise(r => setTimeout(r, ms)); let bad = 0; const rep = (ok, s) => { if (!ok) bad++; console.log((ok ? 'OK   ' : 'FAIL ') + s); };
const BASE = process.argv[2] || 'http://localhost:5179/';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 900, height: 600 }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(BASE + '?t=12:00&q=low', { waitUntil: 'networkidle0' }); await p.evaluate(() => { localStorage.removeItem('calvinGuests'); localStorage.removeItem('calvinFit'); }); await p.reload({ waitUntil: 'networkidle0' }); await W(1500);
// ---------- 1. walk ----------
const HR = await p.evaluate(() => { const c = window.__player.chibi; c.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(c.userData.parts.head); return Math.max(bx.max.x - bx.min.x, bx.max.z - bx.min.z) / 2; });
const walls = [[H.x0, H.z0 - 0.08, H.x1, H.z0 + 0.08], [H.x0 - 0.08, H.z0, H.x0 + 0.08, H.z1], [H.x1 - 0.08, H.z0, H.x1 + 0.08, H.z1], [H.x0, H.z1 - 0.08, H.cx + H.door[0], H.z1 + 0.08], [H.cx + H.door[1], H.z1 - 0.08, H.x1, H.z1 + 0.08]];
const wallGap = (x, z) => Math.min(...walls.map(([x0, z0, x1, z1]) => Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1)))) - HR;
const st = () => p.evaluate(() => { const c = window.__player.chibi; c.updateMatrixWorld(true); const bx = new window.__Box3().setFromObject(c.userData.parts.head); return { x: c.position.x, y: c.position.y, z: c.position.z, hx: (bx.min.x + bx.max.x) / 2, hz: (bx.min.z + bx.max.z) / 2, pool: !!window.__player.inPool }; });
async function walk(sx, sz, dx, dz, ms) { await p.evaluate((x, z) => { const c = window.__player.chibi; window.__player.stand?.(); c.position.set(x, 0, z); window.__player.setFollow(true); }, sx, sz); await W(300);
  await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 1.0]; }, dx, dz); const tr = []; const t0 = Date.now(); while (Date.now() - t0 < ms) { await W(150); tr.push(await st()); } await p.evaluate(() => { window.__player.debugDir = null; }); return tr; }
const rC = s => Math.hypot(s.x - CAL.cx, s.z - CAL.cz);
{ const tr = await walk(-12.5, BRIDGE3.z, -1, 0, 16000); const end = tr.at(-1), maxDrop = Math.min(...tr.map(s => s.y)); const offBridge = tr.filter(s => s.x < -16.5 && s.x > -26.4 && Math.abs(s.z - BRIDGE3.z) > BRIDGE3.walkHalf + 0.02).length;
  rep(end.x < -28 && onCal(end.x, end.z, 0), `bridge crossing: main lawn (-12.5) -> island, ended at (${end.x.toFixed(1)}, ${end.z.toFixed(2)})`); rep(offBridge === 0 && maxDrop > -0.4, `bridge crossing stays on the planks (lowest y ${maxDrop.toFixed(2)}, ${offBridge} off-deck samples)`); }
{ const tr = await walk(-30, BRIDGE3.z, 1, 0, 16000); const end = tr.at(-1); rep(end.x > -15.5, `bridge back to the office island, ended at x ${end.x.toFixed(1)}`); }
// radial runs at the hedge ring (skip the deck/bridge openings), max distance from centre must stay inside the walk ring
for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2 + 0.1, dx = Math.cos(a), dz = Math.sin(a); if (Math.abs(dz) < 0.25) continue;
  const sx = CAL.cx + dx * 3.2, sz = CAL.cz + dz * 3.2; if (sx > H.x0 - 0.6 && sx < H.x1 + 0.6 && sz > H.z0 - 0.6 && sz < H.z1 + 0.6) continue; /* start inside/straddling the house walls: house runs cover it */ const tr = await walk(sx, sz, dx, dz, 5000); const mr = Math.max(...tr.map(rC)), wg = Math.min(...tr.map(s => wallGap(s.hx, s.hz)));
  rep(mr <= CAL.walk + 0.05 && wg > -0.03, `hedge run ${(a * 57.3).toFixed(0).padStart(3)}°: max r ${mr.toFixed(2)} (walk ${CAL.walk}) head-wall gap ${wg.toFixed(2)}`); }
// house: through the door, into the walls from inside, around the outside
{ const tr = await walk(H.cx + 0.5, H.z1 + 2.6, 0, -1, 7000); const end = tr.at(-1), wg = Math.min(...tr.map(s => wallGap(s.hx, s.hz)));
  rep(end.z < H.z1 - 1.0 && end.x > H.x0 && end.x < H.x1, `house: walks in through the door, ended inside at (${end.x.toFixed(1)}, ${end.z.toFixed(1)})`); rep(wg > -0.03, `house: door entry head-wall gap ${wg.toFixed(2)}`); }
for (const [lab, sx, sz, dx, dz] of [['inside -> west wall', H.cx, H.z0 + 2.4, -1, 0], ['inside -> east wall', H.cx, H.z0 + 2.4, 1, 0], ['inside -> back wall (bed side)', H.cx - 0.6, H.z0 + 2.4, 0, -1], ['inside -> wardrobe', H.x1 - 1.1, H.z0 + 2.4, 0.3, -1],
  ['outside -> back wall', H.cx, H.z0 - 2.0, 0, 1], ['outside -> west wall', H.x0 - 2.0, H.cz, 1, 0], ['outside -> east wall', H.x1 + 2.0, H.cz, -1, 0], ['outside -> front wall left', H.x0 + 0.8, H.z1 + 2.0, 0, -1], ['outside -> front corner diag', H.x1 + 1.2, H.z1 + 2.2, -0.48, -0.88]]) {
  const tr = await walk(sx, sz, dx, dz, 4500); const wg = Math.min(...tr.map(s => wallGap(s.hx, s.hz))); const inside0 = sz < H.z1 && sz > H.z0 && sx > H.x0 && sx < H.x1, end = tr.at(-1); const stayed = inside0 === (end.z < H.z1 && end.z > H.z0 && end.x > H.x0 && end.x < H.x1);
  rep(wg > -0.03 && stayed, `house: ${lab.padEnd(30)} head-wall gap ${wg.toFixed(2)}${stayed ? '' : ' (passed through a wall!)'}`); }
{ const tr = await walk(CAL.cx - 4, CAL.cz + 0.3, -1, 0, 9000); const end = tr.at(-1); rep(end.x < DK.x1 - 0.3 && Math.abs(end.y - DK.y) < 0.06, `coffee deck: walks out onto the deck (x ${end.x.toFixed(1)}, y ${end.y.toFixed(2)})`);
  rep(end.x > DK.x0 + 0.3, `coffee deck: bench + railing keep him on the deck, x ${end.x.toFixed(2)} (deck edge ${DK.x0})`); }
{ const tr = await walk(PO.x, PO.z + 3.2, 0, -1, 7000); const lo = Math.min(...tr.filter(q => q.pool).map(q => q.y)); rep(tr.some(q => q.pool) && lo < -0.3, `pool: walks in and wades/swims (lowest y ${lo.toFixed(2)}), walks out the far side (end y ${tr.at(-1).y.toFixed(2)})`); }
// ---------- 2. privacy ----------
async function sim(url) { await p.goto(url, { waitUntil: 'networkidle0' }); await W(1200);
  return p.evaluate(() => { const B = window.__chibisBrains(), out = { bad: [], n: 0, minX: 1e9 }; const now = Date.now() / 1000; window.__pauseBots = true;
    for (let t = now; t < now + 86400 + 3600; t += 15) for (const [c, br] of B) { br.update(t, 0.05, t); out.n++; const x = c.position.x, z = c.position.z; out.minX = Math.min(out.minX, x); if (x < -16.1 || window.__onCal(x, z)) { if (out.bad.length < 5) out.bad.push([c.userData.name, new Date(t * 1000).toISOString(), +x.toFixed(1), +z.toFixed(1)]); } }
    window.__pauseBots = false; return out; }); }
for (const [lab, url] of [['normal day', BASE + '?q=low&sky=none'], ['aurora day', BASE + '?q=low&sky=aurora'], ['rainbow day', BASE + '?q=low&sky=rainbow']]) { const r = await sim(url);
  rep(r.bad.length === 0, `privacy (${lab}): ${r.n} bot samples over 25 h, westmost x ${r.minX.toFixed(1)}, never on bridge/island ${r.bad.length ? JSON.stringify(r.bad) : ''}`); }
{ await p.goto(BASE + '?q=low&t=19:30', { waitUntil: 'networkidle0' }); await W(1000);
  const n = await p.evaluate(() => { const L = window.__npcs.npcs.filter(o => o.role !== 'barista'); /* v26: café barista stays behind its own counter */ const pts = L.flatMap(o => [...(o.loop || []), ...(o.pos ? [o.pos] : [])]); return { pts, n: L.length }; });
  const badP = n.pts.filter(([x, z]) => x < -16.1 || onCal(x, z) || inBridge3(x, z, 0.5)); rep(badP.length === 0, `NPCs: ${n.n} NPCs, ${n.pts.length} loop/spot points, none on the bridge/island`);
  let worst = 1e9; for (let i = 0; i < 25; i++) { await W(400); const xs = await p.evaluate(() => [...window.__npcs.npcs.filter(o => o.role !== 'barista').map(o => o.c.position.x), ...window.__pets.pets.map(q => q.x)]); worst = Math.min(worst, ...xs); }
  rep(worst > -16.1, `NPCs + pets live for 10 s: westmost x ${worst.toFixed(1)}`); }
// ---------- 3. invite ----------
await p.goto(BASE + '?q=low&t=12:00', { waitUntil: 'networkidle0' }); await p.evaluate(() => localStorage.removeItem('calvinGuests')); await p.reload({ waitUntil: 'networkidle0' }); await W(1200);
await p.evaluate(() => window.__select('Pixel')); await W(300);
const btn = await p.evaluate(() => { const c = document.querySelector('#card'); return { inv: !c.querySelector('.invb').hidden && !c.querySelector('.invb').disabled, home: !c.querySelector('.homeb').hidden }; });
rep(btn.inv && !btn.home, `card: "Invite over" shown + enabled, "Send home" hidden before inviting`);
await p.click('#card .invb'); await W(400);
const btn2 = await p.evaluate(() => { const c = document.querySelector('#card'); return { inv: !c.querySelector('.invb').hidden, home: !c.querySelector('.homeb').hidden, g: window.__guests() }; });
rep(!btn2.inv && btn2.home && btn2.g.Pixel, `card: after invite "Send home" shows, guest saved (${JSON.stringify(Object.keys(btn2.g))})`);
let arrived = null; for (let i = 0; i < 70 && !arrived; i++) { await W(1000); const s = await p.evaluate(() => { const c = window.__player && window.__chibisBrains().find(([c]) => c.userData.name === 'Pixel'); return { x: c[0].position.x, z: c[0].position.z, spot: c[0].userData.brain.state.spot, walking: c[0].userData.brain.state.walking }; }); if (s.spot === 'swing') arrived = { ...s, sec: i + 1 }; }
rep(!!arrived && onCal(arrived.x, arrived.z, 0), `invite: Pixel walked over and is on the swing ${arrived ? `after ~${arrived.sec}s at (${arrived.x.toFixed(1)}, ${arrived.z.toFixed(1)})` : '(never arrived)'}`);
await p.reload({ waitUntil: 'networkidle0' }); await W(1500);
const after = await p.evaluate(() => { const c = window.__chibisBrains().find(([c]) => c.userData.name === 'Pixel')[0]; return { x: c.position.x, z: c.position.z, spot: c.userData.brain.state.spot }; });
rep(after.spot === 'swing' && onCal(after.x, after.z, 0), `invite persists across reload (spot ${after.spot})`);
const others = await p.evaluate(() => window.__chibisBrains().filter(([c]) => c.userData.name !== 'Pixel').map(([c]) => [c.userData.name, c.position.x]));
rep(others.every(([, x]) => x > -16.1), `others stay off the island: ${others.map(([n, x]) => n + ' ' + x.toFixed(1)).join(', ')}`);
await p.evaluate(() => window.__sendHome('Pixel')); let gone = null; for (let i = 0; i < 70 && !gone; i++) { await W(1000); const x = await p.evaluate(() => window.__chibisBrains().find(([c]) => c.userData.name === 'Pixel')[0].position.x); if (x > -12) gone = { x, sec: i + 1 }; }
rep(!!gone, `send home: Pixel walked back to the office island ${gone ? `after ~${gone.sec}s (x ${gone.x.toFixed(1)})` : '(still out)'}`);
rep(await p.evaluate(() => !Object.keys(window.__guests()).length && !JSON.parse(localStorage.getItem('calvinGuests') || '{}').Pixel), 'send home: guest list cleared');
await p.goto(BASE + '?q=low&t=23:30', { waitUntil: 'networkidle0' }); await W(1200);
rep(await p.evaluate(() => window.__invite('Jun') === false), 'invite refused late at night / while asleep');
await p.evaluate(() => localStorage.removeItem('calvinGuests'));
await b.close(); console.log(bad ? `${bad} Calvin-island check(s) failed` : "Calvin's island: walkable, private, invites work"); process.exit(bad ? 1 : 0);
