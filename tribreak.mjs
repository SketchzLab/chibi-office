// triangle/draw breakdown by top-level scene child (frustum-tested like the renderer). node tribreak.mjs [url]
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:5179/?t=12:00';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 800 }); await p.goto(url, { waitUntil: 'networkidle0' }); await new Promise(r => setTimeout(r, 4000));
console.log(JSON.stringify(await p.evaluate(() => { const S = window.__scene, C = window.__camera, T = window.__THREE_F; const out = {};
  const fr = new (window.__Frustum)(), m = new (window.__Mat4)(); m.multiplyMatrices(C.projectionMatrix, C.matrixWorldInverse); fr.setFromProjectionMatrix(m);
  const vis = o => { for (let q = o; q; q = q.parent) if (!q.visible) return false; return true; };
  S.traverse(o => { if (!(o.isMesh || o.isPoints) || !vis(o)) return; if (o.frustumCulled && o.geometry) { if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const s = o.geometry.boundingSphere.clone().applyMatrix4(o.matrixWorld); if (!fr.intersectsSphere(s)) return; }
    let top = o; while (top.parent && top.parent !== S) top = top.parent; const k = (top.name || top.userData?.name || top.type) + (top.name || top.userData?.name ? '' : '#' + S.children.indexOf(top)); const g = o.geometry, n = o.isPoints ? 0 : (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.count || 1);
    const e = out[k] ||= [0, 0]; e[0] += Math.round(n); e[1]++; });
  const tot = Object.values(out).reduce((a, v) => [a[0] + v[0], a[1] + v[1]], [0, 0]); return { tot, info: window.__info, out: Object.fromEntries(Object.entries(out).sort((a, b) => b[1][0] - a[1][0])) }; })));
await b.close();
