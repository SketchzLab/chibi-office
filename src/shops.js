// Shopping island (v12): small floating lawn + cliff, plank bridge from the park, three clothing boutiques (awnings, display
// windows, mannequins, rack outside), lamp posts. Built in the shared soft-block toon style and baked to one fill + one outline mesh.
import * as THREE from 'three';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { SHOP, BRIDGE2, SHOP_BLDG, bridge2Y, shopFront } from './layout.js';
import { SHOPS, SHOP_STOCK } from './chibi.js';
import { glowPoints } from './daycycle.js';
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export function makeShops(scene) {
  let seed = 77; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const g = new THREE.Group(); const add = (m, x, y, z, ry = 0, par = g) => { m.position.set(x, y, z); m.rotation.y = ry; par.add(m); return m; };
  const R = SHOP.r, cx = SHOP.cx, cz = SHOP.cz;
  const gg = new THREE.CylinderGeometry(R, R - 0.4, 0.7, 36, 1); add(toonMesh(gg, 0x86cf5e), cx, -0.4, cz);
  let y = -0.75; [[R * 0.96, 1.5, 0xc9bca6], [R * 0.78, 1.9, 0xb5a690], [R * 0.5, 2.2, 0xc3b49c], [R * 0.24, 2.3, 0xa99a86]].forEach(([r, h, c], i, A) => {
    const geo = new THREE.CylinderGeometry(r, A[i + 1] ? A[i + 1][0] : 0.5, h, 18, 1); const p = geo.attributes.position; for (let j = 0; j < p.count; j++) { const k = 0.9 + rnd() * 0.18; p.setX(j, p.getX(j) * k); p.setZ(j, p.getZ(j) * k); } geo.computeVertexNormals();
    add(toonMesh(geo, c), cx, y - h / 2, cz); y -= h * 0.92; });
  // plaza: paved circle + stepping path from the bridge
  add(toonMesh(new THREE.CylinderGeometry(4.6, 4.6, 0.06, 28), 0xe2d6bf, { outline: false }), cx + 1.0, 0.02, cz);
  // bridge: planks along x following the sag, posts + rope rails
  const N = 28; for (let i = 0; i < N; i++) { const x = BRIDGE2.x0 + 0.35 + i * (BRIDGE2.x1 - BRIDGE2.x0 - 0.7) / (N - 1), yy = bridge2Y(x) - 0.06;
    const pl = add(toonMesh(B3(0.3, 0.075, BRIDGE2.half * 2 + 0.1 - rnd() * 0.12), i % 2 ? 0xc48f5c : 0xb98250), x, yy, BRIDGE2.z + (rnd() - 0.5) * 0.06); pl.rotation.z = Math.atan2(bridge2Y(x + 0.2) - bridge2Y(x - 0.2), 0.4); }
  [-1, 1].forEach(sd => { const z = BRIDGE2.z + sd * BRIDGE2.half, pts = [];
    for (let i = 0; i <= 6; i++) { const x = BRIDGE2.s0 - 0.6 + i * (BRIDGE2.s1 - BRIDGE2.s0 + 1.2) / 6, yy = bridge2Y(x); add(toonMesh(B3(0.12, 1.05, 0.12), 0x8a5a36), x, yy + 0.47, z); pts.push(new THREE.Vector3(x, yy + 0.98, z)); }
    g.add(toonMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.04, 4), 0xe0c48a, { outline: false })); });
  // boutiques
  const wallC = [0xf4e6cf, 0xeee4d8, 0xe9e4ee];
  SHOP_BLDG.forEach(b => { const S = SHOPS[b.i], sg = new THREE.Group(); add(sg, b.x, 0, b.z, b.ry);
    const W = b.d, D = b.w, H = b.h; // local: x = width along the front, z = depth (front at +D/2)
    add(toonMesh(B3(W, H, D), wallC[b.i]), 0, H / 2, 0, 0, sg);
    add(toonMesh(B3(W + 0.3, 0.22, D + 0.3), 0x9c6b45), 0, H + 0.11, 0, 0, sg); // roof cap
    add(toonMesh(B3(W + 0.1, 0.12, 0.2), 0x9c6b45), 0, 0.06, D / 2 + 0.05, 0, sg); // step
    // striped awning: alternating soft slats
    for (let k = 0; k < 6; k++) { const a = add(toonMesh(B3(W / 6 + 0.01, 0.07, 0.9), k % 2 ? 0xf6f0e4 : S.c), -W / 2 + W / 12 + k * W / 6, H - 0.35, D / 2 + 0.4, 0, sg); a.rotation.x = 0.35; }
    // sign board + colour swatch
    add(toonMesh(B3(1.7, 0.42, 0.1), 0x3a3d5c), 0, H + 0.48, D / 2 - 0.1, 0, sg); add(toonMesh(B3(1.4, 0.16, 0.04), S.c), 0, H + 0.48, D / 2 - 0.03, 0, sg);
    // door + display window with a mannequin wearing shop stock
    add(toonMesh(B3(0.8, 1.6, 0.06), 0x8a5a36), -0.8, 0.8, D / 2 + 0.02, 0, sg); add(toonMesh(B3(0.12, 0.12, 0.06), 0xe8c45a), -0.55, 0.85, D / 2 + 0.06, 0, sg);
    add(toonMesh(B3(1.3, 1.2, 0.04), 0xcdeefc, { outline: false }), 0.6, 1.2, D / 2 + 0.02, 0, sg); add(toonMesh(B3(1.45, 0.12, 0.1), 0x9c6b45), 0.6, 0.55, D / 2 + 0.05, 0, sg);
    const stock = SHOP_STOCK.filter(s => s[3] === b.i); const mc = stock[0][2].c;
    add(toonMesh(B3(0.42, 0.5, 0.26), mc), 0.6, 1.25, D / 2 - 0.2, 0, sg); add(toonMesh(B3(0.24, 0.24, 0.24), 0xe8e2d8), 0.6, 1.64, D / 2 - 0.2, 0, sg); add(toonMesh(B3(0.05, 0.55, 0.05), 0x5a4a40), 0.6, 0.78, D / 2 - 0.2, 0, sg);
    // clothes rack outside (front-right): rail + 3 hanging tops in the shop's stock colours
    const [rx, rz] = shopFront(b, 2.1, 1.0), rack = new THREE.Group(); add(rack, rx, 0, rz, b.ry);
    [-0.6, 0.6].forEach(s => add(toonMesh(B3(0.08, 1.5, 0.08), 0x5a4a40), s, 0.75, 0, 0, rack)); add(toonMesh(B3(1.36, 0.08, 0.08), 0x5a4a40), 0, 1.48, 0, 0, rack); add(toonMesh(B3(1.4, 0.08, 0.5), 0x8a5a36), 0, 0.04, 0, 0, rack);
    stock.forEach((st, k) => { add(toonMesh(B3(0.34, 0.5, 0.07), st[2].c), -0.4 + k * 0.4, 1.12, 0, 0, rack); add(toonMesh(B3(0.36, 0.08, 0.14), (st[2].c2 ?? st[2].patch ?? 0xf2efe6)), -0.4 + k * 0.4, 0.9, 0, 0, rack); });
    cast(b.x, b.z, W + 0.6, D + 0.6, b.ry); cast(rx, rz, 1.6, 0.7, b.ry); });
  // lamp posts + planters around the plaza
  const lamps = [[cx - 3.6, cz - 2.4], [cx - 3.6, cz + 2.4], [cx + 1.2, cz - 4.3], [cx + 1.2, cz + 4.3]];
  lamps.forEach(([x, z]) => { add(toonMesh(B3(0.12, 2.0, 0.12), 0x3a3d5c), x, 1.0, z); add(toonMesh(B3(0.3, 0.3, 0.3), 0xffe2a8), x, 2.1, z); cast(x, z, 0.4, 0.4); });
  [[cx - 2.2, cz - 5.0], [cx - 2.2, cz + 5.0], [cx - 5.6, cz - 0.4 - 3.0]].forEach(([x, z]) => { add(toonMesh(B3(0.9, 0.45, 0.9), 0xc98a5a), x, 0.22, z); add(toonMesh(new THREE.DodecahedronGeometry(0.42, 0), 0x6fae5a), x, 0.72, z); cast(x, z, 1.0, 1.0); });
  scene.add(g); bake(g);
  glowPoints(scene, lamps.map(([x, z]) => [x, 2.1, z]), { size: 50 });
  return g;
}
