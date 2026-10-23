// balcony 'Enjoy the view' shot: run the interaction, let the look camera settle. node viewshot.mjs url out
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1500));
await p.evaluate(() => { const o = window.__objs.find(o => /Enjoy the view/.test(o.label)); window.__player.chibi.position.set(o.x, 0.12, o.z); window.__player.setFollow(true); o.run(); });
await new Promise(r => setTimeout(r, 6000)); console.log(JSON.stringify(await p.evaluate(() => ({ calvin: window.__player.chibi.position.toArray().map(v => +v.toFixed(2)), rot: +window.__player.chibi.rotation.y.toFixed(2), cam: window.__cam.position.toArray().map(v => +v.toFixed(1)) }))));
await p.screenshot({ path: out }); await b.close();
