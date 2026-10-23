// usage: node shotproto.mjs '<query>' out.png [WxH]
import puppeteer from 'puppeteer-core';
const [q, out, sz = '1600x900'] = process.argv.slice(2), [w, h] = sz.split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.setViewport({ width: w, height: h });
await p.goto('http://localhost:5179/proto.html?' + q, { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__ready, { timeout: 20000 }).catch(() => {});
console.log(JSON.stringify(await p.evaluate(() => ({ ...window.__info(), labels: window.__labels })), null, 1)); await p.screenshot({ path: out }); await b.close();
