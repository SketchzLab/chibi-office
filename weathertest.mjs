// v23 weather: preview params set the state, rain particles exist (1 draw), bots skip outdoor seats in rain, plan is deterministic.
import puppeteer from 'puppeteer-core';
import { dayPlan, weatherAt } from './src/weatherplan.js';
const BASE = process.argv[2] || 'http://localhost:5179/';
let fails = 0; const rep = (ok, m) => { console.log((ok ? 'OK   ' : 'FAIL ') + m); if (!ok) fails++; };
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const W = ms => new Promise(r => setTimeout(r, ms));
async function open(q, wait = 3500) { const p = await b.newPage(); await p.setViewport({ width: 1024, height: 640 }); p.on('pageerror', e => { rep(false, 'page error ' + e.message); }); await p.goto(BASE + q, { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__weather, { timeout: 60000 }); await W(wait); return p; }
// 1) each preview state
for (const k of ['clear', 'cloudy', 'rain', 'storm', 'fog']) { const p = await open(`?q=low&t=15:00&sky=none&weather=${k}`); const w = await p.evaluate(() => window.__weather());
  rep(w.kind === k, `?weather=${k} -> kind ${w.kind}`); const wet = k === 'rain' || k === 'storm'; rep(w.rainVisible === wet && (!wet || w.drops > 300), `${k}: rain particles ${w.rainVisible ? w.drops + '/' + w.count : 'off'}`);
  if (wet) { const fire = await p.evaluate(() => window.__home.flames.visible); rep(!fire, `${k}: campfire out`); } await p.close(); }
// 2) low tier keeps the rain cheap
{ const p = await open('?q=low&t=15:00&sky=none&weather=rain'); const w = await p.evaluate(() => window.__weather()); rep(w.count <= 1200, `low quality: ${w.count} streaks max (1 draw call)`); await p.close(); }
// 3) bots skip outdoor seats while raining: invite everyone to Calvin's island, roof/park/view acts swap indoors
{ const p = await open('?q=low&t=15:00&sky=none&weather=rain&tspeed=1'); await p.evaluate(() => ['Pixel', 'Jun', 'Sage', 'Mika'].map(n => window.__invite(n))); await W(46000);
  const bs = await p.evaluate(() => window.__scene.children.filter(o => o.userData?.brain).map(o => ({ n: o.userData.name, act: o.userData.brain.state.act, spot: o.userData.brain.state.spot, seated: o.userData.brain.state.seated, walking: o.userData.brain.state.walking })));
  rep(bs.length >= 4, `${bs.length} bots found`); for (const s of bs) rep(!(s.seated && ['swing', 'campfire', 'pool', 'coffee'].includes(s.spot)) && !['roof', 'park', 'view'].includes(s.act), `${s.n}: ${s.act}${s.spot ? ' @' + s.spot : ''}${s.seated ? ' (seated)' : ''} - no outdoor seat in rain`);
  const um = await p.evaluate(() => window.__scene.children.filter(o => o.userData?.dynamic && o.isGroup && o.visible && o.children.length === 2 && o.children[0].geometry?.type === 'ConeGeometry').length); rep(um >= 1, `${um} umbrella(s) up outdoors`); await p.close(); }
// 4) determinism: the plan is a pure function of the day; two page loads agree
{ const d = 20753; rep(JSON.stringify(dayPlan(d)) === JSON.stringify(dayPlan(d)), 'dayPlan is pure');
  const a = await open(`?q=low&ootd=${d}&t=14:40`), A = await a.evaluate(() => window.__weather()); await a.close(); const c = await open(`?q=low&ootd=${d}&t=14:40`), C = await c.evaluate(() => window.__weather()); await c.close();
  rep(A.kind === C.kind && A.kind === 'rain' && Math.abs(A.rain - C.rain) < 1e-6, `two loads agree on ootd ${d} 14:40: ${A.kind}/${C.kind}`);
  const w = weatherAt(15.2 * 3600, d); rep(!w.wet && w.rain === 0, 'shower over before the rainbow window (15:12)');
  let n = 0, wet = 0; for (let x = 20700; x < 21065; x++) { n++; if (dayPlan(x).some(s => s[2] === 'rain' || s[2] === 'storm')) wet++; } rep(wet / n > 0.2 && wet / n < 0.5, `rain on ${(100 * wet / n).toFixed(0)}% of days (tropical, mostly clear hours)`); }
await b.close(); console.log(fails ? `${fails} FAILED` : 'ALL OK'); process.exit(fails ? 1 : 0);
