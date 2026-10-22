// Calvin walks into Pixel's room from the porch (follow cam), screenshot when he's by the bed
import puppeteer from 'puppeteer-core';
const [url, out, wx, wz] = process.argv.slice(2), W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); await p.goto(url, { waitUntil: 'networkidle0' });
await p.evaluate((x, z) => { const c = window.__player.chibi; c.position.set(x, 0, z); c.rotation.y = 0; window.__player.setFollow(true); }, +wx, +wz); await W(1500);
await p.evaluate(() => { window.__player.debugDir = [0.15, 1, 0.6]; }); await W(2600); await p.evaluate(() => { window.__player.debugDir = null; }); await W(2500);
console.log('pos', await p.evaluate(() => window.__player.chibi.position.toArray().map(v => v.toFixed(2)).join(',')));
await p.screenshot({ path: out }); await b.close();
