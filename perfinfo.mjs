// draw calls / triangles / fps at a given URL (default overview). node perfinfo.mjs [url] [WxH]
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:5179/?at=40', [w, h] = (process.argv[3] || '1280x800').split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h }); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 4000));
console.log(JSON.stringify(await p.evaluate(() => ({ calls: window.__info?.calls, tris: window.__info?.triangles, fps: +window.__fps.toFixed(1), q: window.__quality() }))));
await b.close();
