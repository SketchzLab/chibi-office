// awning clearance shot: stand Calvin (tallest chibi) at the closest visit spot in front of Gizmo Hub, then frame him side-on. node awnshot.mjs URL out.png
import puppeteer from 'puppeteer-core';
const W = ms => new Promise(r => setTimeout(r, ms)), [url, out] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); await p.goto(url, { waitUntil: 'networkidle0' }); await W(1500);
await p.evaluate((pos) => { const c = window.__player.chibi; c.position.set(...pos); c.rotation.y = Math.PI; }, (process.env.POS || "37.4,0,5.5").split(",").map(Number)); await W(1200); // the closest spot a visiting bot stands (body collider edge)
console.log(await p.evaluate(() => { const c = window.__player.chibi, bx = new window.__Box3().setFromObject(c.userData.parts.head); return JSON.stringify({ pos: c.position.toArray().map(v => +v.toFixed(2)), headTop: +bx.max.y.toFixed(2), awningLow: Math.min(...window.__awnings.map(a => a.min[1])).toFixed(2) }); }));
await W(1500); await p.screenshot({ path: out }); await b.close();
