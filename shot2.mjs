import puppeteer from 'puppeteer-core';
const [url, out, wh = '1280x800', ms = '5000'] = process.argv.slice(2), [w, h] = wh.split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('CERR', m.text()); });
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, +ms));
console.log(JSON.stringify(await p.evaluate(() => ({ info: window.__info, npc: window.__npcs?.group.visible, cam: window.__cam.position.toArray().map(v => +v.toFixed(2)) }))));
await p.screenshot({ path: out }); await b.close();
