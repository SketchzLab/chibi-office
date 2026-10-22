// verifies status.json overrides: fresh pixel=working at desk + live; stale others = clock; injected chatting/idle map correctly
import puppeteer from 'puppeteer-core';
const W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(process.argv[2] || 'http://localhost:5179/?t=15:00', { waitUntil: 'networkidle0' }); await W(4000);
const get = () => p.evaluate(() => Object.fromEntries(window.__scene.children.filter(c => c.userData.brain && c.userData.persona).map(c => [c.userData.name, { act: c.userData.brain.state.act, ov: c.userData.brain.state.override?.state || null, live: !!c.userData.live, task: c.userData.task }])));
console.log('file', JSON.stringify(await get()));
const xy = await p.evaluate(() => { const c = window.__scene.children.find(c => c.userData.name === 'Pixel'); const v = c.position.clone(); v.y += 1.6; v.project(window.__camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; });
await p.mouse.click(...xy); await W(2500); await p.screenshot({ path: 'screenshots/status-live-card.png' });
await p.evaluate(() => { const n = new Date().toISOString(); window.__setStatus({ bots: { pixel: { state: 'working', task: 'x', updatedAt: n }, jun: { state: 'chatting', task: 'sync', updatedAt: n }, mika: { state: 'idle', task: '', updatedAt: n }, sage: { state: 'sleeping', task: '', updatedAt: n } } }); });
await W(2000); console.log('inject', JSON.stringify(await get()));
await b.close();
