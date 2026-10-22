// close-up of each sleeping bot's face via the __camLock test hook (bypasses orbit min distance)
import puppeteer from 'puppeteer-core';
const [url, out] = process.argv.slice(2), W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 600, height: 420 }); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto(url, { waitUntil: 'networkidle0' }); await W(3000);
for (const n of ['Pixel', 'Jun', 'Sage', 'Mika', 'Calvin']) {
  await p.evaluate(n => { const c = window.__scene.children.find(c => c.userData.name === n); c.updateMatrixWorld(true); const h = new window.__Box3().setFromObject(c.userData.parts.head); const x = (h.min.x + h.max.x) / 2, y = (h.min.y + h.max.y) / 2, z = (h.min.z + h.max.z) / 2;
    const f = new c.userData.parts.head.position.constructor(); c.userData.parts.head.getWorldDirection(f); const d = [f.x + 0.35, 0.45, f.z + 0.35], L = Math.hypot(...d) / 13; window.__camLock = [[x + d[0] / L, y + d[1] / L, z + d[2] / L], [x, y, z]]; window.__camera.fov = 9; window.__camera.near = 11.5; window.__camera.updateProjectionMatrix(); }, n); await W(2500); await p.screenshot({ path: out.replace('.png', `-${n}.png`) }); }
await b.close();
