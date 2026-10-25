// v25 shot helper: node vshot.mjs url out W H [x z evalExpr]  (touch device, dpr 1)
import puppeteer from 'puppeteer-core';
const [url, out, Wd, Ht, sx, sz, ex] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: +Wd, height: +Ht, deviceScaleFactor: 1, isMobile: true, hasTouch: true }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
if (sx) await p.evaluate((x, z, ex) => { const c = window.__player.chibi; if (x !== "-") { c.position.set(+x, 0, +z); c.rotation.y = Math.PI; } if (ex) eval(ex); }, sx, sz, ex || '');
await new Promise(r => setTimeout(r, 3000));
console.log(JSON.stringify(await p.evaluate(() => { const C = window.__camera, d = C.getWorldDirection(new C.position.constructor()); return { calls: window.__info?.calls, tris: window.__info?.triangles, fov: C.fov, camY: +C.position.y.toFixed(2), fwdY: +d.y.toFixed(2) }; })));
await p.screenshot({ path: out }); await b.close();
