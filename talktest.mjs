// walk Calvin with keys: steps "key:ms,key:ms", then click action, then optional choice index, screenshot
import puppeteer from 'puppeteer-core';
const [url, out, wh, steps, choice, mobile] = process.argv.slice(2); const [w, h] = (wh || '1280x800').split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: !!mobile, hasTouch: !!mobile }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CERR', m.text()); });
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
if (steps) for (const s of steps.split(',')) { const [k, ms] = s.split(':'); if (k === 'wait') { await new Promise(r => setTimeout(r, +ms)); continue; } if (k === 'act') { await p.evaluate(() => document.getElementById('actb').click()); await new Promise(r => setTimeout(r, +ms)); continue; }
  if (k === 'tp') { const [x, z] = ms.split('/').map(Number); await p.evaluate((x, z) => { window.__player.chibi.position.x = x; window.__player.chibi.position.z = z; }, x, z); await new Promise(r => setTimeout(r, 1500)); continue; }
  if (k === 'follow') { await p.evaluate(() => window.__player.setFollow(true)); await new Promise(r => setTimeout(r, +ms)); continue; }
  if (k === 'pick') { await p.evaluate(i => window.__choose(+i), ms); await new Promise(r => setTimeout(r, 2600)); continue; }
  await p.keyboard.down(k); await new Promise(r => setTimeout(r, +ms)); await p.keyboard.up(k); await new Promise(r => setTimeout(r, 400)); }
console.log('target', await p.evaluate(() => window.__near()), 'pos', await p.evaluate(() => [window.__player.chibi.position.x.toFixed(2), window.__player.chibi.position.z.toFixed(2)]), 'menu', await p.evaluate(() => [...document.querySelectorAll('#imenu.on button')].map(b => b.textContent).join(' | ')));
await p.screenshot({ path: out }); await b.close();
