// v26 café: bots lunch at the café at ?t=12:30 and sit facing the 4-top; coffee breaks use the patio when dry and the
// indoor booth/2-top when it rains; every bot approach waypoint is collider-free; Calvin walks there, sits, orders a latte.
import puppeteer from 'puppeteer-core';
import { CAFE } from './src/layout.js';
const BASE = process.argv[2] || 'http://localhost:5179/';
let fails = 0; const rep = (ok, m) => { console.log((ok ? 'OK   ' : 'FAIL ') + m); if (!ok) fails++; };
const W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1024, height: 640 }); p.on('pageerror', e => rep(false, 'page error ' + e.message));
const open = async q => { await p.goto(BASE + '?q=low&sky=none&' + q, { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__objs && window.__player, { timeout: 60000 }); await W(1500); };
const bots = () => p.evaluate(() => window.__scene.children.filter(o => o.userData?.brain).map(o => ({ name: o.userData.name, act: o.userData.brain.state.act, seated: !!o.userData.brain.state.seated, x: o.position.x, z: o.position.z, ry: o.rotation.y })));
const seatAt = (x, z) => CAFE.seats.find(s => Math.hypot(s.x - x, s.z - z) < 0.35);
const waitBots = async (pred, ms = 25000) => { const t0 = Date.now(); let bs; do { bs = await bots(); if (pred(bs)) break; await W(800); } while (Date.now() - t0 < ms); return bs; };

// pick ootd days: one where every bot lunches at the café, one where >=2 take a café coffee break
await open('t=11:00&weather=clear');
const days = await p.evaluate(async () => { const B = await import('/src/behavior.js'); const names = [...window.__scene.children].filter(o => o.userData?.brain).map(o => ({ name: o.userData.name }));
  let lunch = -1, brk = -1; for (let d = 20000; d < 20400 && (lunch < 0 || brk < 0); d++) { if (lunch < 0 && names.every(n => B.cafeLunch(n, d))) lunch = d; if (brk < 0 && names.filter(n => B.cafeBreak(n, d)).length >= 2) brk = d; }
  // approach waypoints of every café place must be collider-free
  const P = await import('/src/player.js'), L = await import('/src/layout.js'); const blocked = [];
  for (const s of L.CAFE.seats) for (const [x, z] of B.cafePlace(s.id).approach.slice(0, -1)) if (!P.isFree(x, z)) blocked.push(s.id + '@' + x + ',' + z);
  return { lunch, brk, blocked, n: names.length }; });
rep(days.blocked.length === 0, `café approach waypoints collider-free (${days.blocked.join(' ') || 'all clear'})`);
rep(days.lunch > 0 && days.brk > 0, `found test days: all-café-lunch ootd=${days.lunch}, café-break ootd=${days.brk}`);

// 1) lunch at 12:30
await open(`t=12:30&weather=clear&ootd=${days.lunch}`);
let bs = await waitBots(bs => bs.filter(x => x.act === 'lunch' && x.seated).length >= days.n);
const atT4 = bs.filter(x => x.act === 'lunch' && x.seated && /^t4/.test(seatAt(x.x, x.z)?.id || ''));
rep(atT4.length === days.n, `12:30 lunch: ${atT4.length}/${days.n} bots seated at the café 4-top (${bs.map(x => x.name + ':' + x.act + (x.seated ? '/sat@' + (seatAt(x.x, x.z)?.id || '?') : '')).join(' ')})`);
const facing = atT4.every(x => { const s = seatAt(x.x, x.z); return Math.abs(Math.atan2(Math.sin(x.ry - s.rot), Math.cos(x.ry - s.rot))) < 0.3; });
rep(facing, 'lunch bots face the table');
await open('t=12:30&weather=clear'); bs = await waitBots(bs => bs.filter(x => /lunch/.test(x.act)).length >= days.n);
rep(bs.every(x => /^lunch/.test(x.act)), `default day at 12:30: everyone is on lunch (${bs.map(x => x.name + ':' + x.act).join(' ')})`);

// 2) coffee break: patio when dry, indoor seats when raining
await open(`t=15:45&weather=clear&ootd=${days.brk}`);
bs = await waitBots(bs => bs.filter(x => x.act === 'cafe' && x.seated).length >= 2);
const pat = bs.filter(x => x.act === 'cafe' && x.seated && seatAt(x.x, x.z)?.out);
rep(pat.length >= 2, `dry 15:45 break: ${pat.length} bots on patio seats`);
const heads = await p.evaluate(() => { return window.__scene.children.filter(o => o.userData?.brain && o.userData.brain.state.act === 'cafe' && o.userData.brain.state.seated).map(o => { o.updateMatrixWorld(true); let m = 0; o.traverse(k => { if (k.isMesh && k.visible && k.geometry && k.material.visible !== false && k.material.colorWrite !== false && k.material.opacity > 0.05) { const g = k.geometry; if (!g.boundingBox) g.computeBoundingBox(); m = Math.max(m, g.boundingBox.clone().applyMatrix4(k.matrixWorld).max.y); } }); return +m.toFixed(2); }); });
const rim = CAFE.patio.canopy.y - CAFE.patio.canopy.h / 2;
rep(heads.length >= 2 && Math.max(...heads) < rim - 0.25, `parasol canopy rim ${rim.toFixed(2)} m clears seated patio heads (max ${Math.max(...heads)} m, margin ${(rim - Math.max(...heads)).toFixed(2)})`);
await open(`t=15:45&weather=rain&ootd=${days.brk}`);
bs = await waitBots(bs => bs.filter(x => x.act === 'cafeIn' && x.seated).length >= 2);
const inn = bs.filter(x => x.act === 'cafeIn' && x.seated && seatAt(x.x, x.z) && !seatAt(x.x, x.z).out), onPatio = bs.filter(x => seatAt(x.x, x.z)?.out || (x.z > CAFE.patio.z0 && x.z < CAFE.patio.z1 && x.x > CAFE.patio.x0 && x.x < CAFE.patio.x1));
rep(inn.length >= 2 && onPatio.length === 0 && !bs.some(x => x.act === 'cafe'), `rain 15:45: ${inn.length} bots on indoor café seats, ${onPatio.length} on the patio`);

// 3) Calvin walks from the office to the café along the lawn, sits, and orders a latte
await open('t=11:00&weather=clear');
const route = [[-4.65, 0.25], [-4.65, 8.0], [-9.8, 8.0], [-10.5, 9.1], [-11.9, 9.0], [-12.1, 8.0], [-12.3, 0.3], [-12.6, -8.5], [-13.2, -13.5], [-13.4, -16.2], [-13.4, -19.0], [-13.4, -21.5]];
await p.evaluate(() => { const c = window.__player.chibi; c.position.set(-4.65, 0, -1.0); });
let stuck = null;
for (const [tx, tz] of route) { const t0 = Date.now(); let last = null, still = 0;
  while (Date.now() - t0 < 25000) { const c = await p.evaluate((tx, tz) => { const P = window.__player, c = P.chibi.position, dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz); P.debugDir = d > 0.35 ? [dx / d, dz / d, 0.9] : null; return { x: c.x, z: c.z, d }; }, tx, tz);
    if (c.d <= 0.35) break; if (last && Math.hypot(c.x - last.x, c.z - last.z) < 0.02) still++; else still = 0; if (still > 15) { stuck = `(${c.x.toFixed(1)},${c.z.toFixed(1)}) -> (${tx},${tz})`; break; } last = c; await W(120); }
  if (stuck) break; }
await p.evaluate(() => { window.__player.debugDir = null; });
const pos = await p.evaluate(() => [window.__player.chibi.position.x, window.__player.chibi.position.z]);
rep(!stuck && pos[1] < CAFE.z1 && pos[1] > CAFE.z0, `Calvin walked office -> café interior (${stuck ? 'stuck ' + stuck : pos.map(v => v.toFixed(1)).join(', ')})`);
const sat = await p.evaluate(() => { const P = window.__player, c = P.chibi.position; const o = window.__objs.filter(o => o.seatDef && /café/.test(String(o.label))).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; o.run(); return { seat: !!P.seat, label: String(o.label) }; });
rep(sat.seat, `Calvin sits: ${sat.label}`);
const latte = await p.evaluate(async () => { const P = window.__player; P.stand(); P.carry = false; const o = window.__objs.find(o => typeof o.label === 'function' && /latte/.test(o.label())); P.chibi.position.set(o.x, 0, o.z); o.run(); await new Promise(r => setTimeout(r, 2200)); return { carry: P.carry, free: (await import('/src/player.js')).isFree(o.x, o.z) }; });
rep(latte.carry && latte.free, `barista: "Order a latte" spot free=${latte.free}, Calvin carries a cup=${latte.carry}`);
await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
