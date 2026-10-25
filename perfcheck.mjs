// overview perf: default camera, renderer.info calls/triangles (budget <220 calls / <200k tris). node perfcheck.mjs [query]
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); await p.goto('http://localhost:5179/?' + (process.argv[2] || ''), { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 5000));
const out = []; for (let i = 0; i < 3; i++) { out.push(await p.evaluate(() => ({ calls: window.__info?.calls, tris: window.__info?.triangles }))); await new Promise(r => setTimeout(r, 700)); }
console.log(JSON.stringify(out)); await b.close();
