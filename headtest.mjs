import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (/quality|res/.test(m.text())) console.log('C', m.text()); });
await p.goto('http://localhost:5179/?at=40', { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 2000));
await p.evaluate(() => { const q = window.__chibiPos('Jun'); const c = window.__player.chibi; c.position.x = q[0] + 2.0; c.position.z = q[1] + 1.2; window.__player.setFollow(true); });
const out = [];
for (let i = 0; i < 30; i++) { await p.evaluate(i => { const c = window.__player.chibi; c.position.x -= 0.05; }, i); out.push(await p.evaluate(() => { const j = window.__scene.children.find(c => c.userData.name === 'Jun'); return [j.userData.parts.head.rotation.y.toFixed(2), j.rotation.y.toFixed(2)]; })); await new Promise(r => setTimeout(r, 150)); }
console.log(out.map(x => x.join('/')).join(' '));
await new Promise(r => setTimeout(r, 6000)); console.log('quality', JSON.stringify(await p.evaluate(() => window.__quality())), 'fpsEl', await p.evaluate(() => document.getElementById('fps').textContent));
await p.screenshot({ path: '/workspace/chibi-office/screenshots/perf-head-look.png' }); await b.close();
