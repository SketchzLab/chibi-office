// v17 occlusion see-through shot: Calvin placed at (x,z), follow camera orbited to azimuth/elevation so a building sits between.
// node occshot.mjs url out x z az elev [dist]   (add &occ=0 to the url for the 'before' frame). Prints how many baked pixels are dithered.
import puppeteer from 'puppeteer-core';
const [url, out, x, z, az, el, dist = '13'] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error' && !/404/.test(m.text())) console.log('CERR', m.text()); });
await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 1500));
const pose = () => p.evaluate((x, z, az, el, d) => { const P = window.__player, c = P.chibi, C = window.__controls; c.position.set(x, 0, z); c.rotation.y = az + Math.PI; P.setFollow(true);
  C.target.set(x, 1.2, z); window.__cam.position.set(x + Math.sin(az) * Math.cos(el) * d, 1.2 + Math.sin(el) * d, z + Math.cos(az) * Math.cos(el) * d); }, +x, +z, +az, +el, +dist);
await pose(); await new Promise(r => setTimeout(r, 2500)); await pose(); await new Promise(r => setTimeout(r, 400));
console.log(JSON.stringify(await p.evaluate(() => ({ k: +window.__toonU?.uOccK.value.toFixed(2), info: window.__info, cam: window.__cam.position.toArray().map(v => +v.toFixed(1)) }))));
await p.screenshot({ path: out }); await b.close();
