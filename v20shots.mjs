// v20 screenshots -> screenshots/v20/. node v20shots.mjs [only]
import puppeteer from 'puppeteer-core';
const W = ms => new Promise(r => setTimeout(r, ms)), B = 'http://localhost:5179/', O = 'screenshots/v20/', only = process.argv[2];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
async function shot(name, url, fn, wait = 3000, vp = [1280, 800]) { if (only && !name.includes(only)) return; const p = await b.newPage(); await p.setViewport({ width: vp[0], height: vp[1] }); p.on('pageerror', e => console.log('ERR', name, e.message));
  await p.goto(B + url, { waitUntil: 'networkidle0' }); await p.evaluate(() => { localStorage.removeItem('calvinGuests'); localStorage.removeItem('calvinFit'); }); await p.reload({ waitUntil: 'networkidle0' }); await W(1500);
  if (fn) await fn(p); await W(wait); await p.screenshot({ path: O + name + '.png' }); console.log('shot', name, JSON.stringify(await p.evaluate(() => ({ ...window.__info, sky: window.__sky(), feed: window.__feed() }))).slice(0, 220)); await p.close(); }
const inviteAll = p => p.evaluate(() => ['Pixel', 'Jun', 'Sage', 'Mika'].map(n => window.__invite(n)));
const calvinAt = (p, x, z, follow = true) => p.evaluate((x, z, f) => { const c = window.__player.chibi; c.position.set(x, 0, z); window.__player.setFollow(f); }, x, z, follow);
const runObj = (p, lab, k = 0) => p.evaluate((l, k) => { const o = window.__objs.filter(o => (typeof o.label === 'function' ? o.label() : o.label).includes(l))[k]; const c = window.__player.chibi; c.position.set(o.x, 0, o.z); window.__player.setFollow(true); o.run(); return !!o; }, lab, k);
const look = (p, pos, tgt) => p.evaluate((a, b) => { window.__player.look = { pos: new window.__V3(...a), tgt: new window.__V3(...b) }; }, pos, tgt);
await shot('01-island-day-overview', '?t=12:00&q=high&cam=-17,18,18&tgt=-35,0,-0.5', async p => { await inviteAll(p); await W(46000); await calvinAt(p, -33.5, 4.5, false); });
await shot('02-house-interior', '?t=12:00&q=high&occ=1', async p => { await calvinAt(p, -39.9, -2.7); await p.evaluate(() => { window.__player.chibi.rotation.y = -2.2; }); await W(500); await look(p, [-43.6, 5.6, 4.6], [-39.6, 0.7, -3.4]); });
await shot('03-wardrobe-ui', '?t=12:00&q=high&occ=1', async p => { await calvinAt(p, -38.0, -3.3); await p.evaluate(() => { window.__player.chibi.rotation.y = Math.PI; window.__wardrobe.open(); const w = window.__wardrobe; const c = w.closet; const f = { top: c.top.find(x => /tee/i.test(x)) || c.top[1], bottom: c.bottom.find(x => /short/i.test(x)) || c.bottom[0], shoes: c.shoes.find(x => /sneaker/i.test(x)) || c.shoes[0], acc: '' };
  w.set(f); document.querySelectorAll('#wardrobe select').forEach(s => { s.value = f[s.dataset.k]; }); window.__wardrobe._f = f; }); await look(p, [-41.6, 4.6, 4.2], [-37.8, 1.3, -4.0]); });
await shot('04-pool', '?t=12:30&q=high', async p => { await calvinAt(p, -30.0, -4.1); await W(1500); await look(p, [-25.8, 4.2, 1.6], [-30.2, 0.2, -4.2]); });
await shot('05-coffee-view', '?t=16:30&q=high', async p => { await runObj(p, 'Coffee with a view'); await W(2500); await look(p, [-39.6, 4.3, 5.8], [-54, 0.2, -4.5]); }, 5000);
await shot('06-campfire-night', '?t=21:00&q=high&sky=none', async p => { await p.evaluate(() => ['Sage', 'Pixel'].forEach(n => window.__invite(n))); await W(44000); await runObj(p, 'campfire', 1); await W(2500); await look(p, [-31.5, 3.0, 10.5], [-36.8, 0.9, 2.6]); }, 4000);
await shot('07-rainbow-bots-delighted', '?t=15:00&q=high&sky=rainbow', async p => { await inviteAll(p); await W(46000); await calvinAt(p, -31.5, 4.0, false); await look(p, [-18.5, 5.6, 15.5], [-37.0, 5.0, -5.0]); }, 6000);
await shot('08-aurora-gathering', '?t=21:45&q=high&sky=aurora', async p => { await runObj(p, 'Lean on railing'); await W(3000); await look(p, [12.5, 3.8, 13.0], [18.0, 2.4, -4.0]); }, 5000);
await shot('09-sage-headsup', '?t=10:00&q=high&sky=aurora', async p => { await W(1500); }, 4000);
await shot('10-grand-tree-closeup', '?t=16:00&q=high', async p => { await p.evaluate(() => window.__invite('Jun')); await W(46000); await calvinAt(p, -36.6, 3.4, false); await look(p, [-28.6, 2.2, 11.0], [-35.0, 3.6, -0.8]); }, 4000);
await shot('11-under-canopy', '?t=11:00&q=high&occ=1', async p => { await calvinAt(p, -33.6, 1.8); await W(2500); }, 4000);
await shot('12-sun-rays', '?t=10:30&q=high', async p => { await calvinAt(p, -32.4, 4.6, false); await look(p, [-24.5, 3.2, 13.0], [-35.0, 4.2, -0.5]); }, 4000);
await b.close();
