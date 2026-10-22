// style-<tag>-{close,overview,night}.png
import { execFileSync } from 'node:child_process';
const tag = process.argv[2], U = 'http://localhost:5179/?at=40&q=high';
const shots = [['close', '&t=11:00&cam=5,5.5,9.5&tgt=-0.5,1.3,-1.4'], ['overview', '&t=12:00'], ['night', '&t=22:30&cam=38,13,38&tgt=0,4,0']];
for (const [k, q] of shots) execFileSync('node', ['shot.mjs', U + q, `screenshots/style-${tag}-${k}.png`, '1280x800'], { stdio: 'inherit' });
