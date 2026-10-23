// usage: node hairsheet.mjs out.png -> hair check: each row = bot/day, cols = front 3/4, side, back
import puppeteer from 'puppeteer-core'; import { execFileSync } from 'child_process';
const out = process.argv[2] || 'screenshots/hair-check.png';
const rows = [['Pixel', 20758], ['Pixel', 20749], ['Pixel', 20750], ['Jun', 20750], ['Jun', 20749], ['Sage', 20752], ['Sage', 20749], ['Mika', 20749], ['Mika', 20754], ['Mika', 20753], ['Calvin', 20749]], yaws = [0.75, 1.75, 3.6];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.setViewport({ width: 240, height: 240 }); const files = [];
for (const [n, d] of rows) for (const y of yaws) { const f = `/workspace/w/hs_${n}_${d}_${y}.png`;
  await p.goto(`http://localhost:5179/proto.html?only=${n}&ootd=${d}&h=1.8&cy=2.0&yaw=${y}`, { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__ready, { timeout: 20000 }).catch(() => {}); await p.screenshot({ path: f }); files.push(f); }
await b.close();
execFileSync('python3', ['-c', `import sys\nfrom PIL import Image\nfs=sys.argv[2:];W=240;n=len(fs)//3;im=Image.new('RGB',(W*6,W*((n+1)//2)),'white')\nfor i,f in enumerate(fs): r=i//3; im.paste(Image.open(f).convert('RGB'),((r%2)*3*W+(i%3)*W,(r//2)*W))\nim.save(sys.argv[1])`, out, ...files]);
