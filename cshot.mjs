// v26 shot helper: node cshot.mjs url out px py pz tx ty tz [evalExpr] [W H] — places the overview camera directly
import puppeteer from 'puppeteer-core';
const [url, out, px, py, pz, tx, ty, tz, ex, Wd, Ht] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: +(Wd || 1280), height: +(Ht || 800) }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
await p.evaluate(ex => { if (ex) eval(ex); }, ex || '');
for (let i = 0; i < 12; i++) { await p.evaluate((a) => { const c = window.__controls; window.__cam.position.set(+a[0], +a[1], +a[2]); c.target.set(+a[3], +a[4], +a[5]); c.update(); }, [px, py, pz, tx, ty, tz]); await new Promise(r => setTimeout(r, 250)); }
console.log(JSON.stringify(await p.evaluate(() => ({ calls: window.__info?.calls, tris: window.__info?.triangles }))));
await p.screenshot({ path: out }); await b.close();
