import * as THREE from 'three';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { ISLAND_R as R, FLOOR, LOBE, EXEC, CORR } from './layout.js';
function tint(geo, f) { if (geo.index) { const ng = geo.toNonIndexed(); geo.copy(ng); } const p = geo.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = f(p.getX(i), p.getY(i), p.getZ(i), i); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
export function makeIsland(scene) {
  const g = new THREE.Group();
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // lush grass top (rounded, slightly irregular)
  const grassGeo = new THREE.CylinderGeometry(R, R - 0.4, 0.7, 64, 1);
  const gp = grassGeo.attributes.position; for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i); const k = 1 + 0.05 * Math.sin(Math.atan2(z, x) * 5); gp.setX(i, x * k); gp.setZ(i, z * k); }
  grassGeo.computeVertexNormals();
  tint(grassGeo, (x, y, z) => { const r = Math.hypot(x, z) / R; const nz = 0.5 + 0.5 * Math.sin(x * 0.55 + Math.sin(z * 0.4) * 2) * Math.cos(z * 0.5 - x * 0.2);
    const base = y > 0 ? 1.0 - 0.12 * nz : 0.78; return [base * (1.02 - 0.1 * r), base * (1.0 + 0.04 * nz), base * (0.95 - 0.08 * nz)]; });
  const grass = toonMesh(grassGeo, 0x86cf5e); grass.position.y = -0.4; g.add(grass);
  // wood office floor platform
  const FW = FLOOR.x1 - FLOOR.x0, FD = FLOOR.z1 - FLOOR.z0; const floor = toonMesh(new THREE.BoxGeometry(FW, 0.16, FD), 0xd9a46a); floor.position.y = -0.08; g.add(floor);
  for (let x = FLOOR.x0 + 1; x < FLOOR.x1; x += 1.0) { const l = toonMesh(new THREE.BoxGeometry(0.03, 0.01, FD), 0xb98250, { outline: false }); l.position.set(x, 0.005, 0); g.add(l); }
  // rocky cliff underside: stacked jittered tiers, warm grey with strata
  const k = R / 10; const tiers = [[9.7 * k, 1.8, 0xc9bca6], [9.0 * k, 2.2, 0xb5a690], [7.6 * k, 2.6, 0xc3b49c], [5.6 * k, 2.8, 0xa99a86], [3.2 * k, 3.0, 0xb8a990]];
  let y = -0.75;
  tiers.forEach(([r, h, c], ti) => {
    const geo = new THREE.CylinderGeometry(r, tiers[ti + 1] ? tiers[ti + 1][0] : 0.8, h, 30, 2);
    const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.9 + rnd() * 0.18; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    geo.computeVertexNormals(); const top = y; 
    tint(geo, (x, yy, z) => { const wy = top - h / 2 + yy; const band = 0.9 + 0.1 * Math.sin(wy * 3.1 + Math.sin(Math.atan2(z, x) * 4) * 0.8);
      const moss = ti === 0 && yy > h * 0.15 ? 1 : 0; return moss ? [0.62, 0.95, 0.55] : [band * 1.02, band, band * 0.96]; });
    const m = toonMesh(geo, c); m.position.y = y - h / 2; g.add(m); y -= h * 0.92;
  });
  // boulders on the cliff rim
  for (let i = 0; i < 18; i++) { const a = rnd() * 6.28, b = toonMesh(new THREE.DodecahedronGeometry(0.8 + rnd() * 1.2, 0), 0xbdb09a);
    b.position.set(Math.cos(a) * (R - 0.4), -1.2 - rnd() * 1.5, Math.sin(a) * 9.6); b.rotation.set(rnd(), rnd(), rnd()); g.add(b); }
  // small floating rocks with grass caps
  [[-21, -4, 7], [19, -7, -10], [10, -10, 19]].forEach(([x, yy, z], i) => { const r = new THREE.Group(); r.position.set(x, yy, z); r.userData.float = i; r.userData.dynamic = true;
    const s = 0.8 + i * 0.3; const rock = toonMesh(new THREE.ConeGeometry(s, s * 1.8, 7), 0xb5a690); rock.rotation.x = Math.PI; rock.position.y = -s * 0.9; r.add(rock);
    const cap = toonMesh(new THREE.CylinderGeometry(s * 1.05, s, 0.3, 9), 0x86cf5e); r.add(cap); g.add(r); });
  // ---- v23 executive-wing lobe: a second grass disc + cliff merged into the main island (own seed, so the main island is unchanged) ----
  { let sd = 29; const rn = () => (sd = (sd * 16807) % 2147483647) / 2147483647; const LR = LOBE.r, ox = LOBE.cx, oz = LOBE.cz;
    const lg = new THREE.CylinderGeometry(LR, LR - 0.4, 0.7, 40, 1); const lp = lg.attributes.position;
    for (let i = 0; i < lp.count; i++) { const x = lp.getX(i), z = lp.getZ(i); const k = 1 + 0.04 * Math.sin(Math.atan2(z, x) * 4 + 1.0); lp.setX(i, x * k); lp.setZ(i, z * k); } lg.computeVertexNormals();
    tint(lg, (x, y, z) => { const wx = x + ox, wz = z + oz, r = Math.min(1, Math.hypot(wx, wz) / R); const nz = 0.5 + 0.5 * Math.sin(wx * 0.55 + Math.sin(wz * 0.4) * 2) * Math.cos(wz * 0.5 - wx * 0.2);
      const base = y > 0 ? 1.0 - 0.12 * nz : 0.78; return [base * (1.02 - 0.1 * r), base * (1.0 + 0.04 * nz), base * (0.95 - 0.08 * nz)]; });
    const lgm = toonMesh(lg, 0x86cf5e); lgm.position.set(ox, -0.418, oz); g.add(lgm); // 1.8 cm under the main lawn: no z-fight where the discs overlap
    const ew = EXEC.x1 - EXEC.x0, ed = EXEC.z1 - EXEC.z0; const ef = toonMesh(new THREE.BoxGeometry(ew, 0.16, ed), 0xd9a46a, { outline: false }); ef.position.set((EXEC.x0 + EXEC.x1) / 2, -0.075, (EXEC.z0 + EXEC.z1) / 2); g.add(ef);
    { const cw = CORR.x1 - CORR.x0 + 0.02, cd = CORR.z1 - CORR.z0; const cf = toonMesh(new THREE.BoxGeometry(cw, 0.16, cd), 0xd9a46a, { outline: false }); cf.position.set((CORR.x0 + CORR.x1) / 2 - 0.01, -0.08, (CORR.z0 + CORR.z1) / 2); g.add(cf); // corridor floor, flush with the office floor
      for (let x = CORR.x0 + 1; x < CORR.x1; x += 1.0) { const l = toonMesh(new THREE.BoxGeometry(0.03, 0.01, cd), 0xb98250, { outline: false }); l.position.set(x, 0.005, (CORR.z0 + CORR.z1) / 2); g.add(l); } }
    const kk = LR / 10; const lt = [[9.7 * kk, 1.8, 0xc9bca6], [8.6 * kk, 2.2, 0xb5a690], [6.6 * kk, 2.6, 0xc3b49c], [4.0 * kk, 2.6, 0xa99a86]]; let yy = -0.75;
    lt.forEach(([r, h, c], ti) => { const geo = new THREE.CylinderGeometry(r, lt[ti + 1] ? lt[ti + 1][0] : 0.8, h, 18, 2); const p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) { const k = 0.9 + rn() * 0.18; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } geo.computeVertexNormals(); const top = yy;
      tint(geo, (x, y2, z) => { const wy = top - h / 2 + y2; const band = 0.9 + 0.1 * Math.sin(wy * 3.1 + Math.sin(Math.atan2(z, x) * 4) * 0.8); const moss = ti === 0 && y2 > h * 0.15 ? 1 : 0; return moss ? [0.62, 0.95, 0.55] : [band * 1.02, band, band * 0.96]; });
      const m = toonMesh(geo, c); m.position.set(ox, yy - h / 2, oz); g.add(m); yy -= h * 0.92; });
    for (let i = 0; i < 8; i++) { const a = -2.6 + rn() * 3.2, b = toonMesh(new THREE.DodecahedronGeometry(0.8 + rn() * 1.0, 0), 0xbdb09a); b.position.set(ox + Math.cos(a) * (LR - 0.5), -1.2 - rn() * 1.5, oz + Math.sin(a) * (LR - 0.5)); b.rotation.set(rn(), rn(), rn()); g.add(b); } }
  scene.add(g); bake(g);
  return g;
}
