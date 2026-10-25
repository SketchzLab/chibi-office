// v24: manual camera by default (follows position, never auto-rotates), opt-in auto setting, first-person toggle.
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'http://localhost:5179/';
let fails = 0; const rep = (ok, m) => { console.log((ok ? 'OK   ' : 'FAIL ') + m); if (!ok) fails++; };
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const W = ms => new Promise(r => setTimeout(r, ms));
const p = await b.newPage(); await p.setViewport({ width: 1024, height: 640 }); p.on('pageerror', e => rep(false, 'page error ' + e.message));
await p.goto(BASE + '?q=low&t=11:00&weather=clear&sky=none', { waitUntil: 'networkidle0' }); await p.evaluate(() => localStorage.removeItem('camAuto')); await p.reload({ waitUntil: 'networkidle0' });
await p.waitForFunction(() => window.__player, { timeout: 60000 }); await W(2000);
const camS = () => p.evaluate(() => { const c = window.__cam.position, t = window.__controls.target, P = window.__player.chibi.position; return { yaw: Math.atan2(c.x - t.x, c.z - t.z), pol: Math.acos((c.y - t.y) / c.distanceTo(t)), d: c.distanceTo(t), tx: t.x, tz: t.z, px: P.x, pz: P.z, near: window.__cam.near, vis: window.__player.chibi.visible, fp: window.__player.fp, occ: window.__toonU.uOccK.value, cx: c.x, cy: c.y, cz: c.z, py: P.y }; });
rep(await p.evaluate(() => window.__player.autoCam === false), 'auto-rotate camera is OFF by default');
// 1) walk a zig-zag in follow mode: camera follows position, yaw/pitch untouched
const walk = async (dirs, ms) => { for (const [dx, dz] of dirs) { await p.evaluate((dx, dz) => { window.__player.debugDir = [dx, dz, 0.6]; }, dx, dz); await W(ms); } await p.evaluate(() => { window.__player.debugDir = null; }); };
await walk([[0, 1]], 400); await W(1500); let a = await camS();
await walk([[1, 0], [0, -1], [-1, 0], [0.7, 0.7], [1, 0]], 900); await W(1500); let c = await camS();
const dyaw = Math.abs(Math.atan2(Math.sin(c.yaw - a.yaw), Math.cos(c.yaw - a.yaw)));
rep(dyaw < 0.02 && Math.abs(c.pol - a.pol) < 0.02, `walking in 5 directions keeps the camera angle (yaw drift ${dyaw.toFixed(3)}, pitch drift ${Math.abs(c.pol - a.pol).toFixed(3)})`);
rep(Math.hypot(c.tx - c.px, c.tz - c.pz) < 0.6 && Math.hypot(c.px - a.px, c.pz - a.pz) > 1, `camera keeps following him (target ${Math.hypot(c.tx - c.px, c.tz - c.pz).toFixed(2)} m from Calvin after walking ${Math.hypot(c.px - a.px, c.pz - a.pz).toFixed(1)} m)`);
// 2) manual drag sticks (no ease-back after release)
await p.mouse.move(700, 300); await p.mouse.down(); for (let i = 1; i <= 10; i++) { await p.mouse.move(700 + i * 15, 300 + i * 3); await W(20); } await p.mouse.up(); await W(200); const d0 = await camS(); await W(2500); const d1 = await camS();
const turned = Math.abs(Math.atan2(Math.sin(d0.yaw - c.yaw), Math.cos(d0.yaw - c.yaw))), back = Math.abs(Math.atan2(Math.sin(d1.yaw - d0.yaw), Math.cos(d1.yaw - d0.yaw)));
rep(turned > 0.3 && back < 0.02, `drag rotates (${turned.toFixed(2)} rad) and the angle stays after release (drift ${back.toFixed(3)})`);
await walk([[0, 1], [1, 0]], 900); await W(1200); const d2 = await camS(); rep(Math.abs(Math.atan2(Math.sin(d2.yaw - d1.yaw), Math.cos(d2.yaw - d1.yaw))) < 0.02, 'still no auto-rotate while walking after a drag');
// joystick-relative: "forward" (W) walks away from the camera
{ const s0 = await camS(); await p.keyboard.down('w'); await W(900); await p.keyboard.up('w'); await W(200); const s1 = await camS();
  const mv = [s1.px - s0.px, s1.pz - s0.pz], fw = [-(s0.cx - s0.tx), -(s0.cz - s0.tz)], cos = (mv[0] * fw[0] + mv[1] * fw[1]) / (Math.hypot(...mv) * Math.hypot(...fw) || 1);
  rep(Math.hypot(...mv) > 0.5 && cos > 0.95, `W walks along the camera's current view direction (cos ${cos.toFixed(3)})`); }
// 3) opt-in auto setting persists
await p.click('#autob'); rep(await p.evaluate(() => window.__player.autoCam && localStorage.getItem('camAuto') === '1'), '🧭 turns auto-rotate on and persists it'); await p.click('#autob');
rep(await p.evaluate(() => !window.__player.autoCam && localStorage.getItem('camAuto') === '0'), '🧭 again turns it back off');
// 4) first person
const before = await camS(); await p.keyboard.press('v'); await W(1800); let f = await camS();
rep(f.fp && !f.vis && f.near <= 0.05 && Math.hypot(f.cx - f.px, f.cz - f.pz) < 0.3 && f.cy - f.py > 1.2 && f.cy - f.py < 2.6, `V enters first person: body hidden, eye ${(f.cy - f.py).toFixed(2)} m up, near ${f.near}`);
rep(f.occ < 0.15, `see-through occlusion fade is off in first person (uOccK ${f.occ.toFixed(2)})`);
{ const yaw0 = await p.evaluate(() => window.__player.fpState.yaw); await p.mouse.move(700, 300); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(700 - i * 20, 300); await W(20); } await p.mouse.up(); await W(150); const g = await camS();
  const look = await p.evaluate(() => window.__player.fpState.yaw); rep(Math.abs(look - yaw0) > 0.2 && Math.hypot(g.cx - f.cx, g.cz - f.cz) < 0.3, `drag looks around in first person (yaw ${yaw0.toFixed(2)} -> ${look.toFixed(2)}, eye stays put)`);
  const s0 = await camS(); const yaw = await p.evaluate(() => window.__player.fpState.yaw); await p.keyboard.down('w'); await W(900); await p.keyboard.up('w'); await W(150); const s1 = await camS();
  const mv = [s1.px - s0.px, s1.pz - s0.pz], cos = (mv[0] * Math.sin(yaw) + mv[1] * Math.cos(yaw)) / (Math.hypot(...mv) || 1);
  rep(Math.hypot(...mv) > 0.4 && cos > 0.9, `W walks where he looks in first person (cos ${cos.toFixed(2)})`); }
await p.keyboard.press('v'); await W(1200); f = await camS();
rep(!f.fp && f.vis && f.d > 5 && Math.abs(f.d - before.d) < 3, `V again returns to third person (camera ${f.d.toFixed(1)} m out, was ${before.d.toFixed(1)})`);
// FP and free camera are mutually exclusive
await p.click('#fpb'); await W(300); await p.click('#freeb'); await W(300); let m = await p.evaluate(() => ({ fp: window.__player.fp, free: window.__player.free, vis: window.__player.chibi.visible }));
rep(!m.fp && m.free && m.vis, 'free camera turns first person off');
await p.click('#fpb'); await W(300); m = await p.evaluate(() => ({ fp: window.__player.fp, free: window.__player.free })); rep(m.fp && !m.free, 'first person turns the free camera off');
// sitting in first person views from the seat
{ const r = await p.evaluate(async () => { const o = window.__objs.find(o => o.seatDef?.kind === 'ceo'); const P = window.__player; P.chibi.position.set(o.x, 0, o.z); o.run(); await new Promise(r => setTimeout(r, 1200)); const c = window.__cam.position, q = P.chibi.position;
    return { fp: P.fp, seat: !!P.seat, d: Math.hypot(c.x - q.x, c.z - q.z), yaw: P.fpState.yaw, rot: P.seat?.rot }; });
  rep(r.fp && r.seat && r.d < 0.3 && Math.abs(r.yaw - r.rot) < 0.01, `sitting in the CEO chair in first person: eye on the seat, facing the desk`); }
// perf: look across the island in FP
{ await p.evaluate(() => { const P = window.__player; P.stand(); P.chibi.position.set(-9, 0, 9); P.fpState.yaw = -Math.PI * 0.75; P.fpState.pitch = -0.05; }); await W(1500);
  const i = await p.evaluate(() => ({ calls: window.__info?.calls, tris: window.__info?.triangles })); console.log('     FP island view perf', JSON.stringify(i));
  rep(i.calls < 220 && i.tris < 200000, `first-person view across the island stays within budget (${i.calls} calls, ${i.tris} tris)`); }
await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
