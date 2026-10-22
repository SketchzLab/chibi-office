import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 904, height: 1078, deviceScaleFactor: 2.33 });
await p.goto(process.argv[2], { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 6000));
console.log('fps', await p.evaluate(() => window.__fps), JSON.stringify(await p.evaluate(() => window.__info))); await b.close();
