// v19/v21 mobile emulation (v21: multi-touch stick + camera, pinch, tap-select): floating joystick, auto-run, card hides joystick, card fully visible/tappable. usage: node mobiletest.mjs <outdir> [tag]
import puppeteer from 'puppeteer-core';
const [out = 'screenshots/v19', tag = 'after'] = process.argv.slice(2), W = ms => new Promise(r => setTimeout(r, ms));
const SIZES = [[390, 844], [360, 640], [344, 882], [844, 390], [640, 360], [882, 344]];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
for (const [w, h] of SIZES.filter(([w, h]) => !process.env.SIZE || process.env.SIZE === `${w}x${h}`)) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true }); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('http://localhost:5179/?t=12:00&joy', { waitUntil: 'networkidle0' }); await W(2500); const nm = `${w}x${h}`;
  if (tag === 'after') {
    ok(!(await p.$('#runb')) || await p.$eval('#runb', e => getComputedStyle(e).display === 'none'), `${nm} no run toggle on touch`);
    ok(await p.evaluate(() => { const j = document.getElementById('joy'); return !j || getComputedStyle(j).display === 'none' || getComputedStyle(j).opacity === '0'; }), `${nm} no fixed stick at rest`);
    const sx = w * 0.22, sy = h * 0.7; const t = await p.touchscreen.touchStart(sx, sy); await W(150);
    const base = await p.evaluate(() => { const j = document.getElementById('joy'), r = j.getBoundingClientRect(); return { vis: getComputedStyle(j).opacity !== '0' && getComputedStyle(j).display !== 'none', cx: r.left + r.width / 2, cy: r.top + r.height / 2, rad: r.width / 2 }; });
    ok(base.vis && Math.hypot(base.cx - sx, base.cy - sy) < 4, `${nm} stick base appears under thumb (${base.cx.toFixed(0)},${base.cy.toFixed(0)} vs ${sx.toFixed(0)},${sy.toFixed(0)})`);
    await p.touchscreen.touchMove(sx, sy - base.rad * 0.5); await W(600); const walk = await p.evaluate(() => window.__player.speed);
    await p.touchscreen.touchMove(sx, sy - base.rad * 0.95); await W(600); const run = await p.evaluate(() => window.__player.speed);
    if (w === 390) await p.screenshot({ path: `${out}/mobile-${nm}-stick-${tag}.png` });
    ok(walk > 0.5 && walk < 4.6 && run >= 4.6, `${nm} auto-run: 50% → ${walk.toFixed(2)} u/s (walk), 95% → ${run.toFixed(2)} u/s (run)`);
    await p.touchscreen.touchEnd(); await W(300);
    ok(await p.evaluate(() => getComputedStyle(document.getElementById('joy')).opacity === '0' && window.__player.joy.x === 0 && window.__player.joy.y === 0), `${nm} stick disappears + stops on release`);
  }
  await p.evaluate(() => window.__select('Pixel')); await W(600);
  const cr = await p.evaluate(() => { const c = document.getElementById('card'), r = c.getBoundingClientRect(), x = c.querySelector('.x'), ch = c.querySelector('.chat'); const hit = el => { if (!el || el.hidden) return true; const q = el.getBoundingClientRect(), t = document.elementFromPoint(q.left + q.width / 2, q.top + q.height / 2); return !!t && (t === el || el.contains(t)); };
    return { l: r.left, t: r.top, r: r.right, b: r.bottom, xHit: hit(x), chatHit: hit(ch), runb: !!document.getElementById('runb') && getComputedStyle(document.getElementById('runb')).display !== 'none' && document.getElementById('runb').getBoundingClientRect().width > 0 }; });
  await p.screenshot({ path: `${out}/mobile-${nm}-card-${tag}.png` });
  ok(cr.l >= 0 && cr.t >= 0 && cr.r <= w && cr.b <= h, `${nm} card fully on screen [${cr.l | 0},${cr.t | 0} → ${cr.r | 0},${cr.b | 0}]`);
  ok(cr.xHit && cr.chatHit && !cr.runb, `${nm} card close + chat tappable, nothing covering (run toggle visible: ${cr.runb})`);
  if (tag === 'after') {
    await p.touchscreen.touchStart(w * 0.2, h * 0.5); await W(150); await p.touchscreen.touchMove(w * 0.2, h * 0.5 - 60); await W(400);
    const jv = await p.evaluate(() => ({ op: getComputedStyle(document.getElementById('joy')).opacity, sp: window.__player.speed })); await p.touchscreen.touchEnd();
    ok(jv.op === '0' && jv.sp === 0, `${nm} joystick disabled while card open (opacity ${jv.op}, speed ${jv.sp})`);
    await p.tap('#card .x'); await W(400); const st = await p.evaluate(() => document.body.classList.contains('cardon'));
    await p.touchscreen.touchStart(w * 0.2, h * 0.7); await W(150); await p.touchscreen.touchMove(w * 0.2, h * 0.7 - 60); await W(400);
    const back = await p.evaluate(() => window.__player.speed); await p.touchscreen.touchEnd();
    ok(!st && back > 0, `${nm} card closes via ✕ and joystick works again (speed ${back.toFixed(2)})`);
  }
  if (tag === 'after') { // v21 multi-touch: pinch at overview; then stick finger (left) + camera finger (right) at the same time
    const cdp = await p.target().createCDPSession(), T = (id, x, y) => ({ x, y, id, radiusX: 5, radiusY: 5, force: 1 }), touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
    const yaw = () => p.evaluate(() => window.__player.camYaw), dist = () => p.evaluate(() => window.__camera.position.distanceTo(window.__controls.target)), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
    let [cx, cy] = await p.evaluate((w, h) => { for (const fy of [0.4, 0.3, 0.5, 0.25, 0.6]) for (const fx of [0.75, 0.7, 0.8]) { const ok = [-90, -30, 0, 30].every(d => document.elementFromPoint(w * fx + d, h * fy)?.tagName === 'CANVAS'); if (ok) return [w * fx, h * fy]; } return [w * 0.75, h * 0.4]; }, w, h), d0 = await dist(), py0 = await yaw();
    await touch('touchStart', [T(5, cx - 20, cy)]); await touch('touchStart', [T(5, cx - 20, cy), T(6, cx + 20, cy)]); await W(60);
    for (let i = 1; i <= 6; i++) { await touch('touchMove', [T(5, cx - 20 - 8 * i, cy), T(6, cx + 20 + 8 * i, cy)]); await W(40); } await touch('touchEnd', []); await W(500);
    const d1 = await dist(), py1 = await yaw(); ok(d1 < d0 - 0.5 && Math.abs(wrap(py1 - py0)) < 0.02, `${nm} pinch zoom still works (dist ${d0.toFixed(1)} → ${d1.toFixed(1)}, yaw drift ${wrap(py1 - py0).toFixed(3)})`);
    const sx = w * 0.22, sy = h * 0.75, rad = Math.max(44, Math.min(74, Math.min(w, h) * 0.15));
    await touch('touchStart', [T(1, sx, sy)]); await W(60); await touch('touchMove', [T(1, sx, sy - rad * 0.6)]); await W(500);
    const p0 = await p.evaluate(() => [window.__player.chibi.position.x, window.__player.chibi.position.z]), y0 = await yaw();
    [cx, cy] = await p.evaluate((w, h) => { for (const fy of [0.4, 0.3, 0.5, 0.25, 0.6]) for (const fx of [0.75, 0.7, 0.8]) { const ok = [-90, -30, 0, 30].every(d => document.elementFromPoint(w * fx + d, h * fy)?.tagName === 'CANVAS'); if (ok) return [w * fx, h * fy]; } return [w * 0.75, h * 0.4]; }, w, h);
    await touch('touchStart', [T(1, sx, sy - rad * 0.6), T(2, cx, cy)]); await W(60);
    for (let i = 1; i <= 10; i++) { await touch('touchMove', [T(1, sx + (i % 2), sy - rad * 0.6), T(2, cx - 9 * i, cy)]); await W(40); }
    await W(150); const y1 = await yaw(), mid = await p.evaluate(() => ({ sp: window.__player.speed, joy: Math.hypot(window.__player.joy.x, window.__player.joy.y), held: window.__player.cam.held, pos: [window.__player.chibi.position.x, window.__player.chibi.position.z] }));
    const want = 2 * Math.PI * 90 / h, dy = wrap(y1 - y0); if (w === 344) await p.screenshot({ path: `${out}/mobile-multitouch-${tag}.png` });
    ok(mid.sp > 0 && mid.joy > 0.3 && Math.hypot(mid.pos[0] - p0[0], mid.pos[1] - p0[1]) > 0.3, `${nm} two fingers: stick keeps walking while the other finger drags (speed ${mid.sp.toFixed(2)})`);
    ok(mid.held && Math.abs(Math.abs(dy) - want) < 0.06, `${nm} two fingers: camera yaw one-to-one (${dy.toFixed(3)} vs ${want.toFixed(3)} rad)`);
    await touch('touchEnd', [T(2, cx - 90, cy)]); await W(200); const y2 = await yaw(); // camera finger lifted, stick still down
    ok(Math.abs(wrap(y2 - y1)) < 0.05 && await p.evaluate(() => window.__player.speed > 0), `${nm} short beat after release, stick unaffected (moved ${wrap(y2 - y1).toFixed(3)} rad)`);
    for (let i = 0; i < 40 && await p.evaluate(() => window.__player.cam.back); i++) await W(200); const y3 = await yaw();
    ok(Math.abs(wrap(y3 - y2)) < 0.06 && !(await p.evaluate(() => window.__player.cam.back)), `${nm} v24 manual cam keeps the user's angle after release (moved ${wrap(y3 - y2).toFixed(3)} rad)`);
    await touch('touchEnd', []); await W(300);
    ok(await p.evaluate(() => window.__player.speed === 0 && !window.__player.cam.held), `${nm} all fingers up: stopped, camera free`);
    await p.evaluate(() => { if (window.__player.follow) window.__player.setFollow(false); }); await W(2500); // overview: bots in view
    const [bx, by] = await p.evaluate((w, h) => ['Pixel', 'Jun', 'Sage', 'Mika', 'Nova', 'Remy'].map(n => { try { return window.__screenPos(n); } catch (e) { return [-1, -1]; } }).find(([x, y]) => x > 20 && x < w - 20 && y > 60 && y < h - 60 && document.elementFromPoint(x, y + 12)?.tagName === 'CANVAS') || [0, 0], w, h); await touch('touchStart', [T(9, bx, by + 12)]); await W(60); await touch('touchEnd', []); await W(500);
    ok(await p.evaluate(() => document.body.classList.contains('cardon')), `${nm} tap still selects a bot (tap at ${bx | 0},${by | 0})`);
  }
  await p.close();
}
await b.close(); console.log(fail ? `${fail} mobile check(s) failed` : 'mobile: all checks pass'); process.exit(fail ? 1 : 0);
