import puppeteer from 'puppeteer-core';
const [url, out, wh, ms, dx, dy, act] = process.argv.slice(2); const [w, h] = wh.split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h, isMobile: true, hasTouch: true }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
const r = await p.evaluate(() => { const b = document.getElementById('joy').getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2, b.width]; });
await p.mouse.move(r[0], r[1]); await p.mouse.down(); await p.mouse.move(r[0] + (+dx) * r[2] / 2, r[1] + (+dy) * r[2] / 2, { steps: 4 });
await new Promise(q => setTimeout(q, +ms)); if (!act) await p.screenshot({ path: out.replace('.png', '-moving.png') }); await p.mouse.up(); await new Promise(q => setTimeout(q, 2500));
console.log('joy', r, 'near', await p.evaluate(() => window.__near()), await p.evaluate(() => [window.__player.chibi.position.x.toFixed(2), window.__player.chibi.position.z.toFixed(2)]));
if (act) { await p.tap('#actb'); await new Promise(q => setTimeout(q, 300)); await p.tap(`#imenu [data-a="${act}"]`); await new Promise(q => setTimeout(q, 300)); await p.screenshot({ path: out.replace('.png', '-menu.png') }); await new Promise(q => setTimeout(q, 2000)); }
await p.screenshot({ path: out }); await b.close();
