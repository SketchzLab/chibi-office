// v19 mobile emulation: floating joystick, auto-run, card hides joystick, card fully visible/tappable. usage: node mobiletest.mjs <outdir> [tag]
import puppeteer from 'puppeteer-core';
const [out = 'screenshots/v19', tag = 'after'] = process.argv.slice(2), W = ms => new Promise(r => setTimeout(r, ms));
const SIZES = [[390, 844], [360, 640], [344, 882], [844, 390], [640, 360], [882, 344]];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let fail = 0; const ok = (c, m) => { console.log((c ? 'OK   ' : 'FAIL ') + m); if (!c) fail++; };
for (const [w, h] of SIZES) {
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
  await p.close();
}
await b.close(); console.log(fail ? `${fail} mobile check(s) failed` : 'mobile: all checks pass'); process.exit(fail ? 1 : 0);
