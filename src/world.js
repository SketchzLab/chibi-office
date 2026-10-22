// Expansion: rooftop break area (on the back annex), real staircase, scenic balcony deck, mini park.
// Everything static is baked (2-3 draw calls total); water reuses the pool shader.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { tree } from './nature.js';
import { ROOF, STAIRS, BALCONY, PARK } from './layout.js';
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const RB = (w, h, d, r = 0.06) => new RoundedBoxGeometry(w, h, d, 1, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
const RAIL = 0x3f6f6a, WOOD = 0xc98d55, WOOD2 = 0xb98250, WALLC = 0xf4f1ea, TEAL = 0x4fb3a9;

export function bench(g, x, y, z, ry, col = WOOD) { const b = new THREE.Group(); b.position.set(x, y, z); b.rotation.y = ry;
  const s = toonMesh(B(1.8, 0.1, 0.55), col); s.position.y = 0.48; b.add(s); const bk = toonMesh(B(1.8, 0.45, 0.08), col); bk.position.set(0, 0.8, -0.26); b.add(bk);
  [-0.75, 0.75].forEach(px => { const l = toonMesh(B(0.1, 0.48, 0.5), RAIL, { outline: false }); l.position.set(px, 0.24, 0); b.add(l); }); g.add(b); return b; }
function railing(g, ax, az, bx, bz, y, gap) { const L = Math.hypot(bx - ax, bz - az), n = Math.max(2, Math.round(L / 0.6)); const ry = Math.atan2(bx - ax, bz - az);
  for (let i = 0; i <= n; i++) { const k = i / n, x = ax + (bx - ax) * k, z = az + (bz - az) * k; if (gap && gap(x, z)) continue; const p = toonMesh(B(0.06, 0.9, 0.06), RAIL, { outline: false }); p.position.set(x, y + 0.45, z); g.add(p); }
  const r = toonMesh(B(0.09, 0.08, L), RAIL); r.position.set((ax + bx) / 2, y + 0.92, (az + bz) / 2); r.rotation.y = ry; g.add(r); }

export function makeWorld(scene, waterMat) {
  const g = new THREE.Group(); const Y = ROOF.y;
  // ---- annex block + rooftop ----
  const W = ROOF.x1 - ROOF.x0, D = ROOF.z1 - ROOF.z0, cx = (ROOF.x0 + ROOF.x1) / 2, cz = (ROOF.z0 + ROOF.z1) / 2;
  const block = toonMesh(B(W, Y - 0.3, D), WALLC); block.position.set(cx, (Y - 0.3) / 2, cz); g.add(block);
  const trim = toonMesh(B(W + 0.2, 0.25, D + 0.2), TEAL); trim.position.set(cx, Y - 0.2, cz); g.add(trim);
  const grass = toonMesh(B(W - 0.2, 0.1, D - 0.2), 0x86cf5e, { outline: false }); grass.position.set(cx, Y - 0.05, cz); g.add(grass);
  const deck = toonMesh(B(6.2, 0.04, 2.8), 0xd9a46a, { outline: false }); deck.position.set(-1.6, Y + 0.01, -10.1); g.add(deck);
  for (let x = -4.6; x < 1.5; x += 0.5) { const l = toonMesh(B(0.03, 0.01, 2.8), WOOD2, { outline: false }); l.position.set(x, Y + 0.035, -10.1); g.add(l); }
  [[0.3, -11.0], [-3.4, -9.2], [-6.3, -10.8], [-0.6, -8.4]].forEach(([x, z]) => { const w = toonMesh(new THREE.BoxGeometry(1.0, 1.4, 0.04), 0xcdeefc, { outline: false }); w.position.set(x, Y - 1.6, ROOF.z0 - 0.02); if (z < -10) g.add(w); });
  const gapStairs = (x, z) => x > ROOF.x1 - 0.1 && z > STAIRS.z0 - 0.05 && z < STAIRS.z1 + 0.05;
  railing(g, ROOF.x0, ROOF.z0, ROOF.x1, ROOF.z0, Y); railing(g, ROOF.x0, ROOF.z0, ROOF.x0, ROOF.z1, Y); railing(g, ROOF.x0, ROOF.z1, ROOF.x1, ROOF.z1, Y);
  railing(g, ROOF.x1, ROOF.z0, ROOF.x1, STAIRS.z0, Y); railing(g, ROOF.x1, STAIRS.z1, ROOF.x1, ROOF.z1, Y);
  // pergola + bench (faces the office)
  // overhead heights: lowest beam / canopy rim clear the tallest chibi's crown (HEAD_C + HEAD_R ≈ 2.96) — see cleartest.mjs
  const PG_H = 3.6, PS_H = 3.9;
  const px = -3.0, pz = -10.7; [[-1.4, -0.75], [1.4, -0.75], [-1.4, 0.75], [1.4, 0.75]].forEach(([dx, dz]) => { const p = toonMesh(B(0.14, PG_H, 0.14), WOOD); p.position.set(px + dx, Y + PG_H / 2, pz + dz); g.add(p); });
  [-0.75, 0.75].forEach(dz => { const b = toonMesh(B(3.2, 0.14, 0.14), WOOD); b.position.set(px, Y + PG_H, pz + dz); g.add(b); });
  for (let i = -5; i <= 5; i++) { const s = toonMesh(B(0.08, 0.08, 1.9), WOOD2, { outline: false }); s.position.set(px + i * 0.28, Y + PG_H + 0.1, pz); g.add(s); }
  for (let i = 0; i < 9; i++) { const v = toonMesh(new THREE.IcosahedronGeometry(0.22, 0), i % 2 ? 0x6cc45a : 0x57ad4b, { outline: false }); v.position.set(px - 1.3 + i * 0.33, Y + PG_H + 0.24, pz + (i % 3 - 1) * 0.5); g.add(v); }
  bench(g, px, Y, pz - 0.35, 0); [[-0.5, 0xff9b7a], [0.5, 0xfff1d8]].forEach(([dx, c]) => { const cu = toonMesh(RB(0.45, 0.4, 0.14, 0.07), c); cu.position.set(px + dx, Y + 0.75, pz - 0.55); cu.rotation.x = 0.2; g.add(cu); });
  // parasol table + stools
  const tx = 0.2, tz = -10.0; const pole = toonMesh(new THREE.CylinderGeometry(0.04, 0.04, PS_H), 0xf4f1ea, { outline: false }); pole.position.set(tx, Y + PS_H / 2, tz); g.add(pole);
  const can = toonMesh(new THREE.ConeGeometry(1.4, 0.55, 12, 1, true), 0xff8a7a); can.position.set(tx, Y + PS_H - 0.05, tz); g.add(can);
  const can2 = toonMesh(new THREE.ConeGeometry(1.41, 0.55, 12, 1, true, 0, Math.PI / 6), 0xfff1d8, { outline: false }); for (let k = 0; k < 6; k++) { const c2 = can2.clone(); c2.rotation.y = k * Math.PI / 3; c2.position.set(tx, Y + PS_H - 0.049, tz); g.add(c2); }
  const top = toonMesh(new THREE.CylinderGeometry(0.6, 0.6, 0.06, 16), WOOD); top.position.set(tx, Y + 0.75, tz); g.add(top);
  const tl = toonMesh(new THREE.CylinderGeometry(0.06, 0.2, 0.72, 8), 0xf4f1ea); tl.position.set(tx, Y + 0.36, tz); g.add(tl);
  [-1, 1].forEach(k => { const st = toonMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.48, 12), 0xf0ece4); st.position.set(tx + k * 1.0, Y + 0.24, tz); g.add(st); });
  const jug = toonMesh(new THREE.CylinderGeometry(0.08, 0.1, 0.22, 8), 0x9fd6ff); jug.position.set(tx + 0.2, Y + 0.89, tz + 0.1); g.add(jug);
  // planters + mini tree + telescope + flag
  [[-6.3, -8.5], [-6.3, -11.0], [4.3, -11.0], [2.0, -8.5]].forEach(([x, z]) => { const pl = toonMesh(RB(0.9, 0.4, 0.6, 0.05), WOOD2); pl.position.set(x, Y + 0.2, z); g.add(pl);
    const b = toonMesh(new THREE.SphereGeometry(0.42, 8, 6), 0x6cc45a); b.position.set(x, Y + 0.6, z); g.add(b); [0xff9bb8, 0xffd36a].forEach((c, i) => { const f = toonMesh(new THREE.SphereGeometry(0.1, 6, 4), c, { outline: false }); f.position.set(x - 0.2 + i * 0.4, Y + 0.85, z + 0.1); g.add(f); }); });
  const rt = tree(0.7, 0); rt.position.set(-5.3, Y, -9.7); g.add(rt);
  const tel = new THREE.Group(); tel.position.set(2.6, Y, -11.0);
  [0, 2.1, 4.2].forEach(a => { const l = toonMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.3), 0x8b5a3c, { outline: false }); l.position.set(Math.cos(a) * 0.25, 0.6, Math.sin(a) * 0.25); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); tel.add(l); });
  const tube = toonMesh(new THREE.CylinderGeometry(0.1, 0.15, 1.2, 12), 0xd9b35a); tube.rotation.x = -1.1; tube.position.set(0, 1.4, -0.15); tel.add(tube); g.add(tel);
  const fp = toonMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8), 0x8b5a3c, { outline: false }); fp.position.set(4.4, Y + 0.9, -8.5); g.add(fp);
  // ---- staircase (12 solid steps) + side rails ----
  const N = 12, run = (STAIRS.x1 - STAIRS.x0) / N, sz = (STAIRS.z0 + STAIRS.z1) / 2, sw = STAIRS.z1 - STAIRS.z0;
  for (let i = 0; i < N; i++) { const h = Y * (i + 1) / N, x = STAIRS.x1 - (i + 0.5) * run; const st = toonMesh(B(run + 0.02, h, sw), i % 2 ? 0xd9a46a : 0xe2b07a); st.position.set(x, h / 2, sz); g.add(st);
    const nose = toonMesh(B(0.06, 0.03, sw), 0xf4f1ea, { outline: false }); nose.position.set(x + run / 2 - 0.03, h + 0.01, sz); g.add(nose); }
  [STAIRS.z0, STAIRS.z1].forEach(z => { for (let i = 0; i <= N; i += 2) { const x = STAIRS.x1 - i * run, y = Y * i / N; const p = toonMesh(B(0.06, 0.9, 0.06), RAIL, { outline: false }); p.position.set(x, y + 0.45, z); g.add(p); }
    const L = Math.hypot(STAIRS.x1 - STAIRS.x0, Y), r = toonMesh(B(L, 0.08, 0.09), RAIL); r.position.set((STAIRS.x0 + STAIRS.x1) / 2, Y / 2 + 0.92, z); r.rotation.z = -Math.atan2(Y, STAIRS.x1 - STAIRS.x0); g.add(r); });
  cast(sz, sz, 0.1, 0.1);
  // ---- balcony deck over the cliff edge (scenic view) ----
  const bw = BALCONY.x1 - BALCONY.x0, bd = BALCONY.z1 - BALCONY.z0, bx = (BALCONY.x0 + BALCONY.x1) / 2, bz = (BALCONY.z0 + BALCONY.z1) / 2;
  const bdk = toonMesh(B(bw, 0.2, bd), 0xd9a46a); bdk.position.set(bx, BALCONY.y - 0.1, bz); g.add(bdk);
  for (let z = BALCONY.z0 + 0.4; z < BALCONY.z1; z += 0.45) { const l = toonMesh(B(bw, 0.01, 0.03), WOOD2, { outline: false }); l.position.set(bx, BALCONY.y + 0.005, z); g.add(l); }
  [[BALCONY.x1 - 0.3, BALCONY.z0 + 0.3], [BALCONY.x1 - 0.3, BALCONY.z1 - 0.3]].forEach(([x, z]) => { const s = toonMesh(B(0.2, 2.6, 0.2), WOOD2); s.position.set(x, BALCONY.y - 1.4, z); s.rotation.z = 0.5; g.add(s); });
  railing(g, BALCONY.x1, BALCONY.z0, BALCONY.x1, BALCONY.z1, BALCONY.y); railing(g, BALCONY.x0 + 0.6, BALCONY.z0, BALCONY.x1, BALCONY.z0, BALCONY.y); railing(g, BALCONY.x0 + 0.6, BALCONY.z1, BALCONY.x1, BALCONY.z1, BALCONY.y);
  [[BALCONY.x0 + 0.9, BALCONY.z1 - 0.35], [BALCONY.x0 + 0.9, BALCONY.z0 + 0.35]].forEach(([x, z]) => { const p = toonMesh(new THREE.CylinderGeometry(0.28, 0.22, 0.4, 10), 0xff9b7a); p.position.set(x, BALCONY.y + 0.2, z); g.add(p);
    const f = toonMesh(new THREE.IcosahedronGeometry(0.34, 1), 0x5fae5a); f.position.set(x, BALCONY.y + 0.65, z); g.add(f); });
  // ---- mini park: stone loop, fountain, benches, flower beds, picnic blanket (grove trees come from TREES) ----
  const { cx: qx, cz: qz, r: qr } = PARK;
  for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2; const st = toonMesh(new THREE.CylinderGeometry(0.36, 0.4, 0.1, 8), 0xe6dccb, { outline: false }); st.position.set(qx + Math.cos(a) * qr, -0.02, qz + Math.sin(a) * qr); st.rotation.y = a; st.scale.set(1, 1, 0.8); g.add(st); }
  const basin = toonMesh(new THREE.CylinderGeometry(1.0, 1.1, 0.4, 20), 0xe6dccb); basin.position.set(qx, 0.1, qz); g.add(basin);
  const col = toonMesh(new THREE.CylinderGeometry(0.14, 0.2, 0.9, 10), 0xe6dccb); col.position.set(qx, 0.6, qz); g.add(col);
  const bowl = toonMesh(new THREE.CylinderGeometry(0.45, 0.25, 0.18, 14), 0xe6dccb); bowl.position.set(qx, 1.05, qz); g.add(bowl);
  const water = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), waterMat); water.rotation.x = -Math.PI / 2; water.position.set(qx, 0.31, qz); g.add(water); water.userData.dynamic = true;
  const w2 = new THREE.Mesh(new THREE.CircleGeometry(0.4, 14), waterMat); w2.rotation.x = -Math.PI / 2; w2.position.set(qx, 1.15, qz); g.add(w2); w2.userData.dynamic = true;
  [0, 2.1, 4.2].forEach(a => { const x = qx + Math.cos(a + 0.5) * 1.75, z = qz + Math.sin(a + 0.5) * 1.75; const bd2 = toonMesh(new THREE.CylinderGeometry(0.5, 0.55, 0.2, 12), 0x9a6a44); bd2.position.set(x, 0.0, z); g.add(bd2);
    for (let k = 0; k < 4; k++) { const f = toonMesh(new THREE.SphereGeometry(0.12, 6, 4), [0xff9bb8, 0xffd36a, 0xffffff, 0xb7a2ff][k], { outline: false }); f.position.set(x + Math.cos(k * 1.6) * 0.25, 0.22, z + Math.sin(k * 1.6) * 0.25); g.add(f); } });
  PARK.benches.forEach(([x, z, ry]) => bench(g, x, 0, z, ry));
  const [bkx, bkz] = PARK.blanket; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const t = toonMesh(B(0.4, 0.012, 0.4), (i + j) % 2 ? 0xffffff : 0xe86a6a, { outline: false }); t.position.set(bkx - 0.6 + i * 0.4, 0.02, bkz - 0.6 + j * 0.4); g.add(t); }
  const basket = toonMesh(RB(0.4, 0.28, 0.3, 0.05), 0xc98d55); basket.position.set(bkx + 0.45, 0.16, bkz - 0.45); g.add(basket);
  scene.add(g); bake(g);
  return g;
}
