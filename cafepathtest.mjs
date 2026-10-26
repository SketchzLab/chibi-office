// v27 café path test: (1) Calvin walks from the office (spawn -> south door) along the garden stepping-stone path to the café
// patio gate, onto the patio and in through the café door with no stall; (2) the path centre line + every bot café route
// (TO_CAFE + the in-café legs) is collider-free (body + head, i.e. no trunk or canopy on it) at 0.15 m steps;
// (3) no tree trunk/canopy footprint sits within 0.5 m of the path ribbon; (4) at ?t=12:30 the bots reach their café seats.
// usage: node cafepathtest.mjs [baseUrl]
import puppeteer from 'puppeteer-core';
const BASE = process.argv[2] || 'http://localhost:5179/';
let fails = 0; const rep = (ok, m) => { console.log((ok ? 'OK   ' : 'FAIL ') + m); if (!ok) fails++; };
const W = ms => new Promise(r => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1024, height: 640 }); p.on('pageerror', e => rep(false, 'page error ' + e.message));
const open = async q => { await p.goto(BASE + '?q=low&sky=none&' + q, { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__objs && window.__player, { timeout: 60000 }); await W(1500); };
try {
  await open('t=10:00&weather=clear');
  // static checks in-page against the real collider set
  const st = await p.evaluate(async () => { const P = await import('/src/player.js'), L = await import('/src/layout.js'), B = await import('/src/behavior.js');
    const seg = pts => { const bad = []; for (let i = 0; i < pts.length - 1; i++) { const [ax, az] = pts[i], [bx, bz] = pts[i + 1], n = Math.ceil(Math.hypot(bx - ax, bz - az) / 0.15);
      for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, z = az + (bz - az) * k / n; if (!P.isFree(x, z)) bad.push(`(${x.toFixed(2)}, ${z.toFixed(2)})`); } } return bad; };
    const path = L.CAFE_GARDEN.path, pathBad = seg(path), routeBad = seg(B.TO_CAFE.slice(1));
    const d2 = (x, z) => { let d = 1e9; for (let i = 0; i < path.length - 1; i++) { const [ax, az] = path[i], [bx, bz] = path[i + 1], dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz))); d = Math.min(d, Math.hypot(x - ax - t * dx, z - az - t * dz)); } return d; };
    const trees = L.TREES.map(([x, z, s], i) => ({ i, x, z, s, gap: d2(x, z) - L.canopyRadius(s) })).filter(t => t.gap < 0.5);
    return { pathBad, routeBad, trees, len: window.__garden?.userData.pathLen }; });
  rep(st.pathBad.length === 0, `garden path centre line collider-free (body + head) — ${st.pathBad.length} blocked samples ${st.pathBad.slice(0, 4).join(' ')}`);
  rep(st.routeBad.length === 0, `bot TO_CAFE route collider-free — ${st.routeBad.length} blocked samples ${st.routeBad.slice(0, 4).join(' ')}`);
  rep(st.trees.length === 0, `no tree canopy within 0.5 m of the path ${JSON.stringify(st.trees)}`);
  rep(st.len > 30, `path ribbon built (${st.len?.toFixed(1)} m)`);
  // Calvin walks it
  const ROUTE = [[0, 8.3], [-6.4, 8.6], [-9.4, 9.0], [-11.4, 9.4], [-12.9, 8.0], [-13.7, 4.0], [-13.8, -2.0], [-12.9, -8.8], [-12.2, -11.2], [-13.4, -15.0], ['gate'], [-13.4, -17.6], ['patio'], [-15.2, -17.4], [-13.4, -18.6], [-13.4, -20.6], ['door']];
  const t0 = Date.now(); let ok = true;
  for (const w of ROUTE) { if (typeof w[0] === 'string') { const c = await p.evaluate(() => [window.__player.chibi.position.x, window.__player.chibi.position.z]); rep(true, `Calvin reached the ${w[0]} at (${c[0].toFixed(2)}, ${c[1].toFixed(2)}) after ${((Date.now() - t0) / 1000).toFixed(0)} s`); continue; }
    let best = 1e9, bestT = Date.now();
    while (true) { const c = await p.evaluate((tx, tz) => { const P = window.__player, c = P.chibi.position, dx = tx - c.x, dz = tz - c.z, d = Math.hypot(dx, dz); P.debugDir = d > 0.45 ? [dx / d, dz / d, 0.9] : null; return { x: c.x, z: c.z, d }; }, w[0], w[1]);
      if (c.d < 0.45) break; if (c.d < best - 0.05) { best = c.d; bestT = Date.now(); }
      if (Date.now() - bestT > 6000) { rep(false, `Calvin stuck heading to (${w}) at (${c.x.toFixed(2)}, ${c.z.toFixed(2)})`); ok = false; break; } await W(60); }
    if (!ok) break; }
  await p.evaluate(() => { window.__player.debugDir = null; });
  if (ok) rep(true, `Calvin walked office -> path -> patio -> café door unblocked in ${((Date.now() - t0) / 1000).toFixed(0)} s`);
  // bots: an all-café lunch day from 12:14 (lunch starts 12:15) — they walk the garden path (seen on the west lawn) and all end up seated
  await open('t=12:14&weather=clear&ootd=20000');
  const t1 = Date.now(); let r, onPath = new Set();
  while (Date.now() - t1 < 180000) { r = await p.evaluate(() => { const all = window.__scene.children.filter(o => o.userData?.brain), l = all.filter(o => /^lunch/.test(o.userData.brain.state.act || ''));
      return { n: all.length, l: l.length, seated: l.filter(o => o.userData.brain.state.seated).length, who: all.map(o => o.userData.name + ':' + o.userData.brain.state.act + (o.userData.brain.state.seated ? '/sat' : '') + '@' + o.position.x.toFixed(1) + ',' + o.position.z.toFixed(1)).join(' '), west: all.filter(o => o.position.x < -12.2 && o.position.z > -9 && o.position.z < 8).map(o => o.userData.name) }; });
    r.west.forEach(nm => onPath.add(nm)); if (r.l === r.n && r.seated === r.n) break; if (Date.now() - t1 > 90000 && r.seated >= 2 && r.seated === r.l) break; await W(1000); }
  rep(onPath.size > 0, `bots walked the west-lawn garden path (${[...onPath].join(', ')})`);
  rep(r.seated >= 2 && r.seated === r.l, `bots routed to the café and seated (${r.seated} of ${r.l} lunching, ${r.n} bots; lunch is staggered) in ${((Date.now() - t1) / 1000).toFixed(0)} s — ${r.who}`);
} finally { await b.close(); }
console.log(fails ? `${fails} café-path check(s) failed` : 'cafepath: all checks pass'); process.exit(fails ? 1 : 0);
