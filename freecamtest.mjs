// v22 free camera test (dev server, BASE_PATH=/). Desktop: C toggle, left-drag rotate, right-drag ground pan, wheel zoom range,
// WASD pans (Calvin stays put), world clamp, occlusion off, tap-select, perf at max zoom-out, 'Back to me' ease back to follow.
// Touch: 📷 button, stick hidden, one-finger pan, pinch zoom, two-finger twist rotate, tap-select, ease back. usage: node freecamtest.mjs [outdir]
import puppeteer from 'puppeteer-core';
const out = process.argv[2] || 'screenshots/v22', URL = 'http://localhost:5179/?t=12:00', W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
const st = p => p.evaluate(() => { const P = window.__player, C = window.__camera, T = window.__controls.target; const o = C.position.clone().sub(T);
  return { free: P.free, back: P.cam.back, yaw: Math.atan2(o.x, o.z), d: o.length(), t: [T.x, T.y, T.z], cy: C.position.y, me: [P.chibi.position.x, P.chibi.position.z], occ: window.__toonU?.uOccK?.value ?? 0,
    body: document.body.className, joy: (() => { const j = document.getElementById('joy'); return j ? getComputedStyle(j).display : 'none'; })() }; });
const wrap = a => Math.atan2(Math.sin(a), Math.cos(a)), dist2 = (a, c) => Math.hypot(a[0] - c[0], a[2] - c[2]);
const settle = async p => { let prev = null; for (let i = 0; i < 30; i++) { await W(150); const s = await st(p); if (prev && Math.abs(s.d - prev.d) < 0.01 && Math.abs(wrap(s.yaw - prev.yaw)) < 0.002 && dist2(s.t, prev.t) < 0.01) return s; prev = s; } return st(p); };
const pickBot = (p, w, h) => p.evaluate((w, h) => ['Pixel', 'Jun', 'Sage', 'Mika'].map(n => { try { return window.__screenPos(n); } catch (e) { return [-1, -1]; } })
  .filter(([x, y]) => x > 30 && x < w - 30 && y > 80 && y < h - 80 && document.elementFromPoint(x, y + 12)?.tagName === 'CANVAS'), w, h);
async function backToMe(p, tag, click) { await click(); let s; for (let i = 0; i < 50; i++) { await W(200); s = await st(p); if (!s.free && !s.back && dist2(s.t, [s.me[0], 1.2, s.me[1]]) < 0.3) break; }
  ok(!s.free && !s.back && dist2(s.t, [s.me[0], 1.2, s.me[1]]) < 0.3 && s.d > 12 && s.d < 19 && s.occ > 0.5, `${tag}: 'Back to me' eases back to follow (target→Calvin ${dist2(s.t, [s.me[0], 1.2, s.me[1]]).toFixed(2)}, dist ${s.d.toFixed(1)}, occlusion ${s.occ.toFixed(2)})`); }
{ // ---------- desktop ----------
  const p = await b.newPage(); await p.setViewport({ width: 1000, height: 650 }); p.on('pageerror', e => { console.log('ERR', e.message); fail++; });
  await p.goto(URL, { waitUntil: 'networkidle0' }); await W(2500);
  await p.keyboard.down('w'); await W(700); await p.keyboard.up('w'); await W(1500); // start from follow mode
  const s0 = await st(p); await p.keyboard.press('c'); await W(400); let s = await st(p);
  ok(s.free && s.body.includes('freecam') && await p.$eval('#freeb', e => e.classList.contains('on')), `desktop: C enters free camera`);
  await W(1200); s = await st(p); ok(s.occ < 0.1, `desktop: occlusion fade off in free mode (${s.occ.toFixed(2)})`);
  let a = await settle(p); await p.mouse.move(600, 300); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(600 - 15 * i, 300); await W(30); } await p.mouse.up(); s = await settle(p);
  ok(Math.abs(wrap(s.yaw - a.yaw)) > 0.3 && dist2(s.t, a.t) < 0.05, `desktop: left-drag rotates (yaw ${wrap(s.yaw - a.yaw).toFixed(2)} rad, target fixed)`);
  a = s; await p.mouse.move(500, 330); await p.mouse.down({ button: 'right' }); for (let i = 1; i <= 8; i++) { await p.mouse.move(500 + 15 * i, 330 + 6 * i); await W(30); } await p.mouse.up({ button: 'right' }); s = await settle(p);
  ok(dist2(s.t, a.t) > 1 && Math.abs(s.t[1] - a.t[1]) < 0.01 && Math.abs(s.d - a.d) < 0.05, `desktop: right-drag pans on the ground plane (moved ${dist2(s.t, a.t).toFixed(2)}, dy ${(s.t[1] - a.t[1]).toFixed(3)})`);
  a = s; await p.keyboard.down('Shift'); await p.mouse.move(500, 330); await p.mouse.down(); for (let i = 1; i <= 6; i++) { await p.mouse.move(500 - 15 * i, 330); await W(30); } await p.mouse.up(); await p.keyboard.up('Shift'); s = await settle(p);
  ok(dist2(s.t, a.t) > 0.5 && Math.abs(wrap(s.yaw - a.yaw)) < 0.03, `desktop: Shift+left-drag pans (moved ${dist2(s.t, a.t).toFixed(2)}, yaw ${wrap(s.yaw - a.yaw).toFixed(3)})`);
  a = s; const me0 = s.me; await p.keyboard.down('w'); await W(800); await p.keyboard.up('w'); s = await settle(p);
  ok(dist2(s.t, a.t) > 1 && Math.hypot(s.me[0] - me0[0], s.me[1] - me0[1]) < 0.01, `desktop: W pans the camera ${dist2(s.t, a.t).toFixed(2)}, Calvin stays put (moved ${Math.hypot(s.me[0] - me0[0], s.me[1] - me0[1]).toFixed(3)})`);
  for (let i = 0; i < 40; i++) { await p.mouse.move(500, 325); await p.mouse.wheel({ deltaY: -400 }); await W(25); } s = await settle(p); const dmin = s.d;
  ok(dmin < 3 && dmin >= 2.1 && s.cy >= 0.59, `desktop: zoom in close to chibi level (dist ${dmin.toFixed(2)}, cam y ${s.cy.toFixed(2)})`);
  await p.evaluate(m => { const C = window.__controls, P = window.__camera, o = P.position.clone().sub(C.target); C.target.set(m[0], 0.9, m[1]); P.position.copy(C.target).add(o); }, s.me); await settle(p);
  await p.screenshot({ path: `${out}/freecam-close.png` });
  for (let i = 0; i < 60; i++) { await p.mouse.wheel({ deltaY: 600 }); await W(25); } s = await settle(p);
  ok(s.d > 120 && s.d <= 125.01, `desktop: zoom out wide, clamped (dist ${s.d.toFixed(1)})`);
  await p.evaluate(() => { const C = window.__controls, P = window.__camera, o = P.position.clone().sub(C.target); C.target.set(-4, 0, 10); P.position.copy(C.target).add(o); }); await W(2600);
  const perf = await p.evaluate(() => window.__info); await p.screenshot({ path: `${out}/freecam-wide.png` });
  ok(perf && perf.calls < 220 && perf.triangles < 200000, `desktop: budget at max zoom-out (${perf?.calls} calls, ${perf?.triangles} tris)`);
  await p.evaluate(() => { const C = window.__controls, P = window.__camera, o = P.position.clone().sub(C.target); C.target.set(300, 0, -300); P.position.copy(C.target).add(o); }); s = await settle(p);
  ok(s.t[0] <= 42.01 && s.t[2] >= -24.01, `desktop: target clamped to world bounds (${s.t[0].toFixed(1)}, ${s.t[2].toFixed(1)})`);
  await p.evaluate(() => { const C = window.__controls, P = window.__camera; C.target.set(0, 0, 2); P.position.set(14, 16, 18); }); await settle(p);
  const bps = await pickBot(p, 1000, 650); for (const bp of bps) { await p.mouse.click(bp[0], bp[1] + 12); await W(500); if (await p.evaluate(() => document.body.classList.contains('cardon'))) break; }
  ok(bps.length && await p.evaluate(() => document.body.classList.contains('cardon')), `desktop: click still selects a bot in free mode`);
  await p.evaluate(() => document.querySelector('#card .x')?.click()); await W(300);
  await backToMe(p, 'desktop', () => p.click('#backp'));
  await p.keyboard.press('c'); await W(300); await p.keyboard.press('c'); await W(200); ok(!(await st(p)).free, `desktop: C toggles free mode off again`);
  await p.close(); }
for (const [w, h] of [[390, 844], [344, 882], [882, 344]]) { // ---------- touch ----------
  const p = await b.newPage(); await p.emulate({ viewport: { width: w, height: h, deviceScaleFactor: 1, isMobile: true, hasTouch: true }, userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-F956B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Mobile Safari/537.36' });
  p.on('pageerror', e => { console.log('ERR', e.message); fail++; }); await p.goto(URL, { waitUntil: 'networkidle0' }); await W(2500); const nm = `${w}x${h}`;
  const cdp = await p.target().createCDPSession(), T = (id, x, y) => ({ x, y, id, radiusX: 5, radiusY: 5, force: 1 }), touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts });
  await touch('touchStart', [T(1, w * 0.22, h * 0.75)]); await touch('touchMove', [T(1, w * 0.22, h * 0.75 - 40)]); await W(800); await touch('touchEnd', [T(1, 0, 0)]); await W(1500);
  const fb = await p.$eval('#freeb', e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; });
  ok(fb[2] <= w && fb[1] >= 0 && fb[3] < h * 0.35 && fb[0] > w / 2 && fb[2] - fb[0] >= 44, `${nm}: 📷 button top-right, clear of the stick area (${fb.map(v => v | 0)})`);
  await p.tap('#freeb'); await W(400); let s = await st(p); ok(s.free && s.joy === 'none', `${nm}: 📷 enters free mode, stick hidden`);
  if (w === 390) await p.screenshot({ path: `${out}/mobile-freecam-ui.png` });
  const cx = w * 0.5, cy = h * 0.45; let a = await settle(p);
  await touch('touchStart', [T(2, cx, cy)]); for (let i = 1; i <= 8; i++) { await touch('touchMove', [T(2, cx + 10 * i, cy + 5 * i)]); await W(30); } await touch('touchEnd', [T(2, 0, 0)]); s = await settle(p);
  ok(dist2(s.t, a.t) > 0.8 && Math.abs(wrap(s.yaw - a.yaw)) < 0.01 && Math.abs(s.me[0] - a.me[0]) < 0.01, `${nm}: one-finger drag pans (moved ${dist2(s.t, a.t).toFixed(2)}), Calvin stays`);
  a = s; await touch('touchStart', [T(3, cx - 30, cy), T(4, cx + 30, cy)]); for (let i = 1; i <= 6; i++) { await touch('touchMove', [T(3, cx - 30 - 10 * i, cy), T(4, cx + 30 + 10 * i, cy)]); await W(40); } await touch('touchEnd', [T(3, 0, 0), T(4, 0, 0)]); s = await settle(p);
  ok(s.d < a.d * 0.8, `${nm}: pinch zooms (${a.d.toFixed(1)} → ${s.d.toFixed(1)})`);
  a = s; const R = 60; await touch('touchStart', [T(5, cx - R, cy), T(6, cx + R, cy)]);
  for (let i = 1; i <= 8; i++) { const an = i * 0.1; await touch('touchMove', [T(5, cx - R * Math.cos(an), cy - R * Math.sin(an)), T(6, cx + R * Math.cos(an), cy + R * Math.sin(an))]); await W(40); } await touch('touchEnd', [T(5, 0, 0), T(6, 0, 0)]); s = await settle(p);
  ok(Math.abs(wrap(s.yaw - a.yaw)) > 0.4, `${nm}: two-finger twist rotates (${wrap(s.yaw - a.yaw).toFixed(2)} rad for 0.8 rad twist)`);
  await p.evaluate(() => { const C = window.__controls, P = window.__camera; C.target.set(0, 0, 2); P.position.set(14, 18, 20); }); await settle(p);
  const bps = await pickBot(p, w, h); for (const bp of bps) { await touch('touchStart', [T(9, bp[0], bp[1] + 12)]); await W(60); await touch('touchEnd', [T(9, bp[0], bp[1] + 12)]); await W(500); if (await p.evaluate(() => document.body.classList.contains('cardon'))) break; }
  ok(bps.length && await p.evaluate(() => document.body.classList.contains('cardon')), `${nm}: tap still selects a bot in free mode`);
  await p.evaluate(() => document.querySelector('#card .x')?.click()); await W(300);
  await backToMe(p, nm, () => p.tap('#backp')); s = await st(p); ok(s.joy !== 'none' || !s.body.includes('freecam'), `${nm}: stick available again`);
  await p.close(); }
await b.close(); console.log(fail ? `${fail} freecam check(s) failed` : 'freecam: all checks pass'); process.exit(fail ? 1 : 0);
