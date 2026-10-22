import puppeteer from 'puppeteer-core';
const [url, out, wh, holdMs, act] = process.argv.slice(2); const [w, h] = (wh||'1280x800').split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2500));
await p.keyboard.down('w'); await new Promise(r => setTimeout(r, +holdMs)); await p.keyboard.up('w'); await new Promise(r => setTimeout(r, 2500));
console.log('near', await p.evaluate(() => window.__near()), 'calvin', await p.evaluate(() => [window.__player.chibi.position.x.toFixed(2), window.__player.chibi.position.z.toFixed(2)]));
if (act) { await p.click('#actb'); await new Promise(r => setTimeout(r, 300)); await p.click(`#imenu [data-a="${act}"]`); await new Promise(r => setTimeout(r, 2200)); }
await p.screenshot({ path: out }); await b.close();
