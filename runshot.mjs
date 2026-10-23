// v15 run check: walk vs Shift-run (speed + frames), and the touch run toggle. usage: node runshot.mjs <url> <outdir>
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2), W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 900, height: 600 }); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto(url, { waitUntil: 'networkidle0' }); await W(3000);
const pos = () => p.evaluate(() => { const c = window.__player.chibi.position; return [c.x, c.z]; });
for (const [mode, shift] of [['walk', false], ['run', true]]) {
  if (shift) await p.keyboard.down('Shift'); await p.keyboard.down('s'); await W(700); const a = await pos(), t0 = Date.now();
  for (let i = 0; i < 3; i++) { await p.screenshot({ path: `${out}/run-${mode}-f${i}.png` }); await W(150); }
  await W(600); const c = await pos(), dt = (Date.now() - t0) / 1000; const sp = await p.evaluate(() => window.__player.speed);
  console.log(mode, 'api.speed', sp.toFixed(2), 'measured', (Math.hypot(c[0] - a[0], c[1] - a[1]) / dt).toFixed(2), 'u/s');
  await p.keyboard.up('s'); if (shift) await p.keyboard.up('Shift'); await W(800); await p.keyboard.down('w'); await W(1500); await p.keyboard.up('w'); await W(600);
}
const has = await p.evaluate(() => { const r = document.getElementById('runb'); return r && getComputedStyle(r).display; }); console.log('run button display', has);
if (has === 'block') { await p.click('#runb'); await W(200); console.log('toggle', await p.evaluate(() => [window.__player.runOn, document.getElementById('runb').textContent])); await p.screenshot({ path: `${out}/run-toggle-touch.png` }); }
await b.close();
