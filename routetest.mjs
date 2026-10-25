// v21 route test: on the PRODUCTION build (vite build + vite preview), walk Calvin from the default spawn to his island house and back
// with real input only: keyboard (desktop) and the floating joystick driven by synthetic CDP touches (Fold cover, phone, landscape).
// Desktop pass also drags the camera with the mouse mid-walk (manual orbit while walking, then ease back to follow).
// usage: node routetest.mjs [--no-build]
import puppeteer from 'puppeteer-core'; import { spawn, execSync } from 'node:child_process';
const W = ms => new Promise(r => setTimeout(r, ms)), PORT = 4179, URL = `http://localhost:${PORT}/chibi-office/?q=low&t=12:00`;
if (!process.argv.includes('--no-build')) execSync('npx vite build', { stdio: 'ignore' });
const srv = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore', detached: true }); await W(2500);
// out the open office front, west along the front wall, round the left-wall corner (flower bed / tree 6 canopy), down the west lawn to the bridge
const THERE = [[0, 8.3], [-9.4, 8.3], [-10.4, 9.0], [-11.8, 8.9], [-12.8, 6], [-13.6, 2.2], [-15.6, 0.3], [-20, 0.3], [-29, 0.6], [-34.5, 3.0], [-38.4, -0.6], [-38.4, -3.0]];
const BACK = [...THERE].reverse().slice(1).concat([[3.6, 1.1]]);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
const pos = p => p.evaluate(() => { const c = window.__player.chibi.position, f = new window.__V3(); window.__camera.getWorldDirection(f); return [c.x, c.z, f.x, f.z]; });
async function walk(p, wps, steer, tag) { for (const [tx, tz] of wps) { let best = 1e9, bestT = Date.now();
    while (true) { const [x, z, fx, fz] = await pos(p); const dx = tx - x, dz = tz - z, d = Math.hypot(dx, dz); if (d < 0.6) break;
      if (d < best - 0.1) { best = d; bestT = Date.now(); } if (Date.now() - bestT > 5000) { ok(false, `${tag}: stuck heading to (${tx}, ${tz}) at (${x.toFixed(2)}, ${z.toFixed(2)})`); return false; }
      const fl = Math.hypot(fx, fz), F = [fx / fl, fz / fl], R = [-F[1], F[0]]; await steer((dx * F[0] + dz * F[1]) / d, (dx * R[0] + dz * R[1]) / d); await W(80); } }
  return true; }
async function run(tag, vp, mode) { if (process.env.ONLY && !tag.includes(process.env.ONLY)) return;
  const p = await b.newPage(); p.on('pageerror', e => { console.log('ERR', e.message); fail++; });
  if (mode === 'touch') await p.emulate({ viewport: { ...vp, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
  else await p.setViewport(vp);
  await p.goto(URL, { waitUntil: 'networkidle0' }); await W(2500); const [sx, sz] = await pos(p); ok(Math.hypot(sx - 3.6, sz - 1.1) < 0.3, `${tag}: default spawn (${sx.toFixed(2)}, ${sz.toFixed(2)})`);
  let steer, stop;
  if (mode === 'keys') { let held = new Set(); const setKeys = async ks => { for (const k of held) if (!ks.includes(k)) await p.keyboard.up(k); for (const k of ks) if (!held.has(k)) await p.keyboard.down(k); held = new Set(ks); };
    steer = (f, r) => { const ks = []; if (f > 0.38) ks.push('w'); if (f < -0.38) ks.push('s'); if (r > 0.38) ks.push('d'); if (r < -0.38) ks.push('a'); ks.push('Shift'); return setKeys(ks); }; stop = () => setKeys([]); }
  else { const cdp = await p.target().createCDPSession(), BX = vp.width * 0.22, BY = vp.height * 0.75, R = 60; const tp = (x, y) => [{ x, y, id: 1, radiusX: 5, radiusY: 5, force: 1 }];
    let down = false; // the thumb lands, steers, and lifts like a real one (re-lands for the walk back)
    steer = async (f, r) => { if (!down) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: tp(BX, BY) }); down = true; await W(50); }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: tp(BX + r * R, BY - f * R) }); };
    stop = async () => { if (down) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: tp(BX, BY) }); down = false; }; }
  const t0 = Date.now(); let good = await walk(p, THERE, steer, `${tag} there`);
  if (good) { await stop(); const atIsland = await p.evaluate(() => Math.hypot(window.__player.chibi.position.x + 35, window.__player.chibi.position.z - 0.3) < 8.5);
    ok(atIsland, `${tag}: reached Calvin's island house in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
    if (mode === 'keys') { // desktop: hold W and drag the camera with the mouse at the same time; angle is the user's while held, then eases back
      const yaw = () => p.evaluate(() => window.__player.camYaw), y0 = await yaw(); await p.keyboard.down('w'); await p.mouse.move(700, 300); await p.mouse.down();
      for (let i = 1; i <= 10; i++) { await p.mouse.move(700 - 12 * i, 300); await W(30); } await W(300); const y1 = await yaw(), want = 2 * Math.PI * 120 / vp.height, d1 = Math.atan2(Math.sin(y1 - y0), Math.cos(y1 - y0));
      ok(Math.abs(Math.abs(d1) - want) < 0.12, `${tag}: mouse drag orbits one-to-one while walking (${d1.toFixed(3)} vs ${want.toFixed(3)} rad)`);
      await p.mouse.up(); await p.keyboard.up('w'); let y2 = await yaw(); for (let i = 0; i < 40 && await p.evaluate(() => !!window.__player.cam.back); i++) { await W(200); } y2 = await yaw(); // swiftshader frame rate varies: poll up to 8 s
      ok(Math.abs(Math.atan2(Math.sin(y2 - y1), Math.cos(y2 - y1))) < 0.08 && !(await p.evaluate(() => window.__player.cam.back)), `${tag}: v24 manual cam keeps the user's angle after release (moved ${Math.atan2(Math.sin(y2 - y1), Math.cos(y2 - y1)).toFixed(3)} rad)`);
      await walk(p, [[-38.4, -3.0]], steer, `${tag} re-centre`); }
    await W(500); good = await walk(p, BACK, steer, `${tag} back`);
    if (good) ok(true, `${tag}: walked back to the office desk`); }
  await stop().catch(() => {}); await p.close(); }
try {
  await run('desktop keys 1000x650', { width: 1000, height: 650 }, 'keys');
  await run('joystick 344x882 (Fold cover)', { width: 344, height: 882 }, 'touch');
  await run('joystick 390x844', { width: 390, height: 844 }, 'touch');
  await run('joystick 882x344 (landscape)', { width: 882, height: 344 }, 'touch');
} finally { await b.close(); try { process.kill(-srv.pid); } catch (e) {} }
console.log(fail ? `${fail} route check(s) failed` : 'route: all checks pass'); process.exit(fail ? 1 : 0);
