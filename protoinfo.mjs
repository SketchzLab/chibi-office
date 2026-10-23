import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.goto('http://localhost:5179/proto.html', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1500));
console.log(JSON.stringify(await p.evaluate(() => window.__info()))); await b.close();
