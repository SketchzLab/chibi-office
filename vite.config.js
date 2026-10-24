import { defineConfig } from 'vite'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { join, relative } from 'node:path'

// Project Pages site: https://sketchzlab.github.io/chibi-office/
// Set BASE_PATH to override (use BASE_PATH=/ for a local root preview).
const base = process.env.BASE_PATH ?? '/chibi-office/'

// v22 PWA: emit sw.js with the precache list (every bundle file + public/ files except status.json) and a content hash version
const walk = d => readdirSync(d).flatMap(f => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p]; });
const chibiSW = () => ({ name: 'chibi-sw', apply: 'build', generateBundle(_, bundle) {
  const pub = walk('public').map(p => relative('public', p).split('\\').join('/')).filter(f => f !== 'status.json');
  const files = ['./', ...Object.keys(bundle).filter(f => f !== 'index.html'), ...pub];
  const h = createHash('sha256'); for (const f of Object.keys(bundle).sort()) { const b = bundle[f]; h.update(f); h.update(b.type === 'chunk' ? b.code : b.source); } for (const f of pub) h.update(readFileSync(join('public', f)));
  const src = readFileSync('sw-template.js', 'utf8').replace("'__VERSION__'", `'${h.digest('hex').slice(0, 12)}'`).replace('__PRECACHE__.map', JSON.stringify(files) + '.map');
  this.emitFile({ type: 'asset', fileName: 'sw.js', source: src }); } })

export default defineConfig({
  base,
  plugins: [chibiSW()],
})
