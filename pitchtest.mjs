// v25 pitch / FP fov test: follow camera can tilt up at the sky (forward.y > 0.6) and never dips below the floor;
// FP looks ~85 deg up/down, FP fov is ~90 deg horizontal at Fold sizes; free camera can look above the horizon. usage: node pitchtest.mjs [outdir]
import puppeteer from 'puppeteer-core';
const out = process.argv[2] || 'screenshots/v25', W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
const st = p => p.evaluate(() => { const C = window.__camera, d = C.getWorldDirection(C.position.clone()), P = window.__player; return { fy: d.y, cy: C.position.y, me: P.chibi.position.y, minY: window.__minCamY, fov: C.fov, asp: C.aspect, fp: P.fp, free: P.free, dist: C.position.distanceTo(window.__controls.target) }; });
const track = p => p.evaluate(() => { window.__minCamY = 99; const f = () => { const C = window.__camera; if (!window.__player.fp) window.__minCamY = Math.min(window.__minCamY, C.position.y - window.__player.chibi.position.y); requestAnimationFrame(f); }; f(); });
async function drag(p, x, y0, y1, n = 20) { await p.mouse.move(x, y0); await p.mouse.down(); for (let i = 1; i <= n; i++) { await p.mouse.move(x, y0 + (y1 - y0) * i / n); await W(30); } await p.mouse.up(); await W(1200); }
{ // desktop follow + FP + free
  const p = await b.newPage(); await p.setViewport({ width: 1000, height: 650 }); p.on('pageerror', e => { console.log('ERR', e.message); fail++; });
  await p.goto('http://localhost:5179/?t=22:00&sky=aurora', { waitUntil: 'networkidle0' }); await W(2500);
  await p.keyboard.down('w'); await W(700); await p.keyboard.up('w'); await p.evaluate(() => window.__player.chibi.position.set(0, 0, 12)); await W(2500); await p.evaluate(() => { const T = window.__controls.target; window.__camera.position.set(T.x, T.y + 6, T.z + 12); }); await W(800); await track(p);
  await drag(p, 500, 600, 260); let s = await st(p);
  ok(s.fy > 0.6, `follow: drag up looks at the sky (forward.y ${s.fy.toFixed(2)})`);
  ok(s.cy - s.me >= 0.3 && s.minY >= 0.3, `follow: camera stays above the floor (now ${(s.cy - s.me).toFixed(2)} m, min ${s.minY.toFixed(2)} m, dist ${s.dist.toFixed(1)})`);
  await p.keyboard.down('w'); await W(1200); await p.keyboard.up('w'); await W(800); s = await st(p); ok(s.fy > 0.5 && s.minY >= 0.3, `follow: walking keeps the upward view (forward.y ${s.fy.toFixed(2)}, min ${s.minY.toFixed(2)} m)`);
  await p.screenshot({ path: `${out}/follow-sky-aurora.png` });
  await drag(p, 500, 150, 600); await W(1500); s = await st(p); ok(s.fy < -0.3 && s.dist > 8, `follow: drag back down returns to a normal follow view (forward.y ${s.fy.toFixed(2)}, dist ${s.dist.toFixed(1)})`);
  await p.keyboard.press('v'); await W(600); await drag(p, 500, 600, 50, 25); s = await st(p); ok(s.fp && s.fy > 0.95, `FP: looks nearly straight up (forward.y ${s.fy.toFixed(3)})`);
  await drag(p, 150, 110, 640, 25); await drag(p, 150, 110, 640, 25); s = await st(p); ok(s.fp && s.fy < -0.95, `FP: looks nearly straight down (forward.y ${s.fy.toFixed(3)})`);
  const hf = 2 * Math.atan(Math.tan(s.fov * Math.PI / 360) * s.asp) * 180 / Math.PI; ok(Math.abs(hf - 90) < 2, `FP: ~90 deg horizontal fov on 1000x650 (${hf.toFixed(1)} h / ${s.fov.toFixed(1)} v)`);
  await p.keyboard.press('v'); await W(600); s = await st(p); ok(!s.fp && Math.abs(s.fov - 40) < 0.01, `FP off restores the 40 deg fov (${s.fov})`);
  await p.keyboard.press('c'); await W(800); await track(p); await drag(p, 500, 600, 150, 25); await W(1500); s = await st(p);
  ok(s.free && s.fy > 0.3 && s.cy >= 0.55, `free: tilts above the horizon (forward.y ${s.fy.toFixed(2)}, camera y ${s.cy.toFixed(2)})`);
  await p.close(); }
for (const [w, h] of [[344, 882], [882, 1000], [1000, 882]]) { // Fold sizes: FP fov
  const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true }); await p.goto('http://localhost:5179/?t=12:00', { waitUntil: 'networkidle0' }); await W(2000);
  await p.evaluate(() => window.__player.setFp(true)); await W(500); const s = await st(p); const hf = 2 * Math.atan(Math.tan(s.fov * Math.PI / 360) * s.asp) * 180 / Math.PI;
  ok(s.fov >= 55 && s.fov <= 100 && hf >= 49 && hf <= 91, `${w}x${h} FP fov ${s.fov.toFixed(1)} v / ${hf.toFixed(1)} h`);
  await p.close(); }
console.log(fail ? `${fail} FAILED` : 'ALL OK'); await b.close(); process.exit(fail ? 1 : 0);
