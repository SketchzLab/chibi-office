// v22 PWA check: prod build served by vite preview at /chibi-office/ — manifest valid, SW registers + controls, app loads offline on a 2nd visit.
import puppeteer from 'puppeteer-core'; import { spawn, execSync } from 'node:child_process';
execSync('npx vite build', { stdio: 'ignore' });
const srv = spawn('npx', ['vite', 'preview', '--port', '4180', '--strictPort'], { stdio: 'ignore', detached: true });
const URL0 = 'http://localhost:4180/chibi-office/'; let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
await new Promise(r => setTimeout(r, 2500));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try { const p = await b.newPage(); await p.setViewport({ width: 882, height: 344 });
  await p.goto(URL0, { waitUntil: 'load' });
  const man = await p.evaluate(async () => { const l = document.querySelector('link[rel=manifest]'); const r = await fetch(l.href); return { href: l.href, ct: r.headers.get('content-type'), j: await r.json() }; });
  const j = man.j; ok(j.name === 'Chibi Office' && j.short_name && ['standalone', 'fullscreen'].includes(j.display) && j.orientation === 'any' && j.theme_color && j.background_color && j.start_url, 'manifest fields ' + JSON.stringify({ d: j.display, o: j.orientation, t: j.theme_color }));
  for (const ic of j.icons) { const r = await p.evaluate(async (s, base) => { const res = await fetch(new URL(s, base)); const bm = await createImageBitmap(await res.blob()); return [res.status, bm.width, bm.height]; }, ic.src, man.href); ok(r[0] === 200 && ic.sizes === r[1] + 'x' + r[2], `icon ${ic.src} ${ic.purpose} ${r}`); }
  ok(j.icons.some(i => i.purpose.includes('maskable')) && j.icons.some(i => i.sizes === '512x512') && j.icons.some(i => i.sizes === '192x192'), 'installability icons present');
  const cdp = await p.target().createCDPSession(); const inst = await cdp.send('Page.getInstallabilityErrors').catch(e => ({ err: e.message }));
  ok(inst.installabilityErrors && inst.installabilityErrors.length === 0, 'Chrome installability errors: ' + JSON.stringify(inst));
  const man2 = await cdp.send('Page.getAppManifest'); ok(!man2.errors.length, 'Chrome manifest parse errors: ' + JSON.stringify(man2.errors));
  await p.waitForFunction(() => navigator.serviceWorker.controller || (window.__swReg && window.__swReg.active), { timeout: 15000 });
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: r.scope, url: r.active.scriptURL }; });
  ok(sw.scope === URL0 && sw.url === URL0 + 'sw.js', 'SW registered ' + JSON.stringify(sw));
  await p.reload({ waitUntil: 'load' }); ok(await p.evaluate(() => !!navigator.serviceWorker.controller), 'SW controls page on 2nd visit');
  const cached = await p.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); return (await c.keys()).map(r => r.url.replace(location.origin, '')); });
  ok(cached.some(u => /assets\/.*\.js$/.test(u)) && cached.includes('/chibi-office/'), 'precache has shell + bundle (' + cached.length + ' entries)');
  // status.json network-first: online fetch hits network (fresh), offline falls back to cache
  await p.evaluate(() => fetch('status.json?t=' + Date.now())); await p.setOfflineMode(true);
  const st = await p.evaluate(async () => { try { const r = await fetch('status.json?t=' + Date.now()); return r.status; } catch (e) { return 'err'; } }); ok(st === 200, 'status.json served offline from cache: ' + st);
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.reload({ waitUntil: 'load' }); await new Promise(r => setTimeout(r, 4000));
  const off = await p.evaluate(() => ({ canvas: !!document.querySelector('canvas'), calls: window.__info ? window.__info.calls : -1, online: navigator.onLine }));
  ok(off.canvas && off.calls > 0, 'app loads + renders OFFLINE ' + JSON.stringify(off) + ' errors=' + errs.length);
  await p.screenshot({ path: 'screenshots/v22/pwa-offline.png' }); await p.setOfflineMode(false);
  // update flow: SW script has skipWaiting + clients.claim, page has controllerchange toast
  const src = await p.evaluate(async () => (await fetch('sw.js')).text()); ok(/skipWaiting\(\)/.test(src) && /clients\.claim\(\)/.test(src) && /VERSION = '[0-9a-f]{12}'/.test(src), 'SW auto-update wiring + content version');
} finally { await b.close(); process.kill(-srv.pid); }
console.log(fails ? `pwatest: ${fails} FAILED` : 'pwatest: all PASS'); process.exit(fails ? 1 : 0);
