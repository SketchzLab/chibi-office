import puppeteer from 'puppeteer-core';
const url = process.argv[2], out = process.argv[3], [w,h] = (process.argv[4]||'1280x800').split('x').map(Number);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: w, height: h, deviceScaleFactor: +(process.env.DPR || 1) });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log(m.text()));
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, +(process.argv[5]||2500)));
await p.screenshot({ path: out }); await b.close();
