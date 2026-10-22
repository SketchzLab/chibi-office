import * as THREE from 'three';
import { toonMesh } from './toon.js';
export function makeIsland(scene) {
  const g = new THREE.Group();
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // lush grass top (rounded, slightly irregular)
  const grassGeo = new THREE.CylinderGeometry(10, 9.6, 0.7, 28, 1);
  const gp = grassGeo.attributes.position; for (let i = 0; i < gp.count; i++) { const x = gp.getX(i), z = gp.getZ(i); const k = 1 + 0.05 * Math.sin(Math.atan2(z, x) * 5); gp.setX(i, x * k); gp.setZ(i, z * k); }
  grassGeo.computeVertexNormals();
  const grass = toonMesh(grassGeo, 0x86cf5e); grass.position.y = -0.4; g.add(grass);
  // wood office floor platform
  const floor = toonMesh(new THREE.BoxGeometry(13, 0.16, 10), 0xd9a46a); floor.position.y = -0.08; g.add(floor);
  for (let x = -6; x <= 6; x += 1.0) { const l = toonMesh(new THREE.BoxGeometry(0.03, 0.01, 10), 0xb98250, { outline: false }); l.position.set(x, 0.005, 0); g.add(l); }
  // rocky cliff underside: stacked jittered tiers, warm grey with strata
  const tiers = [[9.7, 1.6, 0xc9bca6], [9.0, 1.8, 0xb5a690], [7.6, 2.0, 0xc3b49c], [5.6, 2.2, 0xa99a86], [3.2, 2.4, 0xb8a990]];
  let y = -0.75;
  tiers.forEach(([r, h, c], ti) => {
    const geo = new THREE.CylinderGeometry(r, tiers[ti + 1] ? tiers[ti + 1][0] : 0.8, h, 22, 2);
    const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 0.9 + rnd() * 0.18; p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    geo.computeVertexNormals(); const m = toonMesh(geo, c); m.position.y = y - h / 2; g.add(m); y -= h * 0.92;
  });
  // boulders on the cliff rim
  for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, b = toonMesh(new THREE.DodecahedronGeometry(0.6 + rnd() * 0.9, 0), 0xbdb09a);
    b.position.set(Math.cos(a) * 9.6, -1.2 - rnd() * 1.5, Math.sin(a) * 9.6); b.rotation.set(rnd(), rnd(), rnd()); g.add(b); }
  // small floating rocks with grass caps
  [[-14, -3, 5], [13, -5, -7], [7, -7, 13]].forEach(([x, yy, z], i) => { const r = new THREE.Group(); r.position.set(x, yy, z); r.userData.float = i;
    const s = 0.8 + i * 0.3; const rock = toonMesh(new THREE.ConeGeometry(s, s * 1.8, 7), 0xb5a690); rock.rotation.x = Math.PI; rock.position.y = -s * 0.9; r.add(rock);
    const cap = toonMesh(new THREE.CylinderGeometry(s * 1.05, s, 0.3, 9), 0x86cf5e); r.add(cap); g.add(r); });
  scene.add(g);
  return g;
}
