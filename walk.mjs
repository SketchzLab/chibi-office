// node walk.mjs url out WxH "dx,dz,ms;dx,dz,ms;..." [mobile]  -> walks Calvin in world directions, logs y, screenshot
import puppeteer from 'puppeteer-core';
const [url, out, wh, plan, mobile] = process.argv.slice(2); const [w, h] = (wh || '1280x800').split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: !!mobile, hasTouch: !!mobile }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
for (const st of plan.split(';')) { const [a, bb, ms, mg] = st.split(','); if (a === 'tp') { await p.evaluate((x, z) => { const c = window.__player.chibi; c.position.x = x; c.position.z = z; if (!window.__nofollow) window.__player.setFollow(true); }, +bb, +ms); await new Promise(r => setTimeout(r, 1500)); continue; }
  if (a === 'act') { await p.evaluate(() => document.getElementById('actb').click()); await new Promise(r => setTimeout(r, +bb)); continue; }
  if (a === 'pick') { await p.evaluate(i => window.__choose(+i), bb); await new Promise(r => setTimeout(r, +ms || 2500)); continue; }
  if (a === 'wait') { await new Promise(r => setTimeout(r, +bb)); continue; }
  await p.evaluate((dx, dz, m) => { window.__player.debugDir = [dx, dz, m]; }, +a, +bb, mg ? +mg : 0.6); await new Promise(r => setTimeout(r, +ms)); await p.evaluate(() => { window.__player.debugDir = null; }); await new Promise(r => setTimeout(r, 300));
  console.log('pos', await p.evaluate(() => { const c = window.__player.chibi.position; return [c.x.toFixed(2), c.y.toFixed(2), c.z.toFixed(2)].join(','); }), 'target', await p.evaluate(() => window.__near())); }
await p.screenshot({ path: out }); await b.close();
