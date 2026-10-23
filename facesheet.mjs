// usage: node facesheet.mjs out.png  -> 5 bots x (5 OOTD days + sleeping) head close-ups
import puppeteer from 'puppeteer-core'; import { execFileSync } from 'child_process';
const out = process.argv[2] || 'screenshots/faces.png', days = [20749, 20750, 20751, 20752, 20753], names = ['Pixel', 'Jun', 'Sage', 'Mika', 'Calvin'];
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.setViewport({ width: 300, height: 300 }); const files = [];
for (const n of names) for (const [d, sl] of [...days.map(d => [d, 0]), [20749, 1]]) { const f = `/workspace/w/fs_${n}_${d}_${sl}.png`;
  await p.goto(`http://localhost:5179/proto.html?only=${n}&ootd=${d}&h=1.75&cy=2.08${sl ? '&sleep=1' : ''}`, { waitUntil: 'networkidle0' }); await p.waitForFunction(() => window.__ready, { timeout: 20000 }).catch(() => {});
  await p.screenshot({ path: f }); files.push(f); }
await b.close();
execFileSync('python3', ['-c', `import sys\nfrom PIL import Image\nfs=sys.argv[2:];W=300;im=Image.new('RGB',(W*6,W*5),'white')\nfor i,f in enumerate(fs): im.paste(Image.open(f).convert('RGB'),((i%6)*W,(i//6)*W))\nim.save(sys.argv[1])`, out, ...files]);
