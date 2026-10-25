// v26 shot helper (follow mode, so the occlusion cut-away opens walls/roof): node v26shot.mjs url out x z dx dy dz [evalExpr] [W H]
import puppeteer from 'puppeteer-core';
const [url, out, x, z, dx, dy, dz, ex, Wd, Ht] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: +(Wd || 1280), height: +(Ht || 800) }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
await p.evaluate((x, z, ex) => { const c = window.__player.chibi; if (x !== '-') { c.position.set(+x, 0, +z); } if (ex) eval(ex); }, x, z, ex || '');
await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Follow Calvin/.test(b.textContent))?.click());
for (let i = 0; i < 16; i++) { await p.evaluate((a) => { const c = window.__controls; window.__cam.position.copy(c.target).add(new window.__V3(+a[0], +a[1], +a[2])); c.update(); }, [dx, dy, dz]); await new Promise(r => setTimeout(r, 220)); }
console.log(JSON.stringify(await p.evaluate(() => ({ calls: window.__info?.calls, tris: window.__info?.triangles, cal: window.__player.chibi.position.toArray().map(v => +v.toFixed(2)) }))));
await p.screenshot({ path: out }); await b.close();
