// v20 Calvin's private island (west of the office, -x): floating lawn + cliff tiers, plank bridge, hedge ring (gaps for the bridge and
// the coffee deck), a big shady tree with a swing and a campfire under it, a cozy one-room house (bed + Calvin's wardrobe; the global
// occlusion dither makes its walls see-through in follow mode), a small wading pool and a coffee deck facing the open western sea.
// Everything static is baked (1 fill + 1 outline draw); dynamic bits: swing, flames, water, lantern + window glow, halos, fireflies, sign.
import * as THREE from 'three';
import { toonMesh, occPatch } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { tree } from './nature.js';
import { CAL_SIGN as SIGN, CAL_LANTERNS, CAL, BRIDGE3, bridge3Y, CAL_TREE, CAL_SWING, CAL_FIRE, CAL_HOUSE as H, CAL_POOL as PO, CAL_DECK as DK } from './layout.js';
import { glowMat, glowPoints, dayUniforms, fireflies } from './daycycle.js';
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function tint(geo, f) { if (geo.index) { const ng = geo.toNonIndexed(); geo.copy(ng); } const p = geo.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = f(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
function mergeAll(list) { const pos = []; list.forEach(gm => { const n = gm.index ? gm.toNonIndexed() : gm; pos.push(...n.attributes.position.array); });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); out.computeVertexNormals(); return out; }
export function makeCalvinIsland(scene, waterMat) {
  let seed = 97; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const g = new THREE.Group(); const add = (m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  const R = CAL.r, cx = CAL.cx, cz = CAL.cz;
  // ---- island: grass cap + cliff tiers (home-island recipe)
  const gg = new THREE.CylinderGeometry(R, R - 0.4, 0.7, 32, 1); { const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.035 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 5 + 2); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } gg.computeVertexNormals(); }
  tint(gg, (x, y, z) => { const nz = 0.5 + 0.5 * Math.sin(x * 0.55 + z * 0.35) * Math.cos(z * 0.45); const b = y > 0 ? 1 - 0.12 * nz : 0.78; return [b, b * 1.03, b * 0.95]; });
  add(toonMesh(gg, 0x86cf5e), cx, -0.4, cz);
  let y = -0.75; [[R * 0.97, 1.6, 0xc9bca6], [R * 0.8, 2.1, 0xb5a690], [R * 0.52, 2.5, 0xc3b49c], [R * 0.26, 2.6, 0xa99a86]].forEach(([r, h, c], i, A) => {
    const geo = new THREE.CylinderGeometry(r, A[i + 1] ? A[i + 1][0] : 0.6, h, 22, 1); const p = geo.attributes.position; for (let j = 0; j < p.count; j++) { const k = 0.9 + rnd() * 0.18; p.setX(j, p.getX(j) * k); p.setZ(j, p.getZ(j) * k); } geo.computeVertexNormals();
    tint(geo, (x, yy) => i === 0 && yy > h * 0.15 ? [0.62, 0.95, 0.55] : [1, 0.97, 0.93]); add(toonMesh(geo, c), cx, y - h / 2, cz); y -= h * 0.92; });
  // ---- bridge: planks across x following the sag, posts + rope rails
  const Bz = BRIDGE3.z, x0 = -25.3, x1 = -16.8, N = 26; for (let i = 0; i < N; i++) { const x = x0 + i * (x1 - x0) / (N - 1), yy = bridge3Y(x) - 0.06;
    const pl = add(toonMesh(B3(0.3, 0.08, BRIDGE3.half * 2 + 0.1 - rnd() * 0.12), i % 2 ? 0xc48f5c : 0xb98250), x, yy, Bz + (rnd() - 0.5) * 0.06); pl.rotation.z = Math.atan2(bridge3Y(x + 0.2) - bridge3Y(x - 0.2), 0.4); }
  [-1, 1].forEach(sd => { const z = Bz + sd * BRIDGE3.half, pts = [];
    for (let i = 0; i <= 6; i++) { const x = BRIDGE3.s0 - 0.6 + i * (BRIDGE3.s1 - BRIDGE3.s0 + 1.2) / 6, yy = bridge3Y(x); add(toonMesh(B3(0.12, 1.05, 0.12), 0x8a5a36), x, yy + 0.47, z); pts.push(new THREE.Vector3(x, yy + 0.98, z)); }
    g.add(toonMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.04, 3), 0xe0c48a, { outline: false }));
    g.add(toonMesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.clone().setY(p.y - 0.45))), 16, 0.03, 3), 0xe0c48a, { outline: false })); });
  // stepping stones: main lawn -> bridge, bridge -> tree / house / deck
  [[-14.6, 0.5], [-15.9, 0.2], [-26.4, 0.4], [-27.9, 0.6], [-29.4, 1.2], [-30.8, 1.4], [-32.2, 3.6], [-34.6, 5.7], [-37.4, 5.6], [-40.0, 3.6], [-42.2, 1.6], [-43.4, 0.9]].forEach(([x, z]) => add(toonMesh(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 9), 0xd8d2c4, { outline: false }), x, 0.02, z, rnd()));
  // ---- hedge ring (soft rounded bushes), openings at the bridge (east) and the coffee deck (west)
  const hedgeGeo = new THREE.SphereGeometry(0.66, 6, 4); const HC = [0x5f9e52, 0x68aa5a, 0x5a974f];
  for (let i = 0, n = 46; i < n; i++) { const a = i / n * Math.PI * 2 + 0.03, hx = Math.cos(a) * CAL.hedge, hz = Math.sin(a) * CAL.hedge;
    if (hx > 0 && Math.abs(hz) < 2.0) continue; if (hx < 0 && Math.abs(hz) < DK.gap) continue;
    const b = toonMesh(hedgeGeo, HC[i % 3]); b.scale.set(1.25, 0.9 + rnd() * 0.15, 1.25); b.position.set(cx + hx, 0.42, cz + hz); g.add(b);
    if (i % 2 === 0) { const t = toonMesh(hedgeGeo, HC[(i + 1) % 3], { outline: false }); t.scale.setScalar(0.62); t.position.set(cx + hx * 1.0, 0.95, cz + hz); g.add(t); } }
  // ---- v20.1 grand canopy tree (ancient banyan/oak): flared trunk + roots, sweeping limbs, wide layered blob canopy (low-poly icosa
  // clusters, baked to the shared fill/outline draws). Lobes reach S (campfire), E (swing), WSW (coffee deck); kept off the house (NW)
  // and pool (NE) so both stay readable from the overview. Canopy sits high (y>=5.2) so heads/fire never touch it; the global
  // occlusion dither fades it whenever it is between the camera and Calvin.
  tree(1, 0); // keep nature.js rnd() sequence identical to v20 (old tree consumed one draw)
  let rays = null; // v20.2 god rays (dynamic: additive, faded by daylight in update())
  { const TX = CAL_TREE.x, TZ = CAL_TREE.z, BARK = 0x8c6142, BARK2 = 0x7d573b, TH = 6.6;
    // v20.2 gentle natural lean (~10 deg toward -x near the base) that curves back up so the crown sits over the swing/campfire
    const lean = yy => -0.75 * Math.sin(Math.min(1, Math.max(0, yy / TH)) * Math.PI * 0.72);
    const trunk = new THREE.CylinderGeometry(0.6, 1.0, TH, 10, 6); { const p = trunk.attributes.position; for (let i = 0; i < p.count; i++) { const yy = p.getY(i) + TH / 2, a = Math.atan2(p.getZ(i), p.getX(i)); const fl = 1 + 0.3 * Math.max(0, 1 - yy / 1.6) ** 2 + 0.07 * Math.sin(a * 5 + yy); p.setX(i, p.getX(i) * fl + lean(yy)); p.setZ(i, p.getZ(i) * fl); } trunk.computeVertexNormals(); }
    add(toonMesh(trunk, BARK), TX, TH / 2, TZ);
    const limb = (ax, ay, az, bx, by, bz, r0, r1, c = BARK) => { const A = new THREE.Vector3(ax, ay, az), Bv = new THREE.Vector3(bx, by, bz), L = A.distanceTo(Bv);
      const m = toonMesh(new THREE.CylinderGeometry(r1, r0, L, 6), c); m.position.copy(A).add(Bv).multiplyScalar(0.5).add(new THREE.Vector3(TX, 0, TZ)); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), Bv.clone().sub(A).normalize()); g.add(m); };
    // surface roots (radiating, avoid the swing side +x and the campfire side +z/-x)
    [[-2.3, 0.6], [-1.9, -1.0], [-0.4, -2.2], [1.1, -1.9], [-1.2, -1.6], [2.0, -0.9]].forEach(([dx, dz]) => limb(dx * 0.25, 0.55, dz * 0.25, dx, 0.02, dz, 0.3, 0.1, BARK2));
    // big sweeping limbs from the (leaning) trunk top, plus the swing limb along +x at the swing pivot height (rope stays vertical)
    const TOPX = lean(TH - 0.8), LIMBS = [[2.8, 7.0, 3.4], [-3.0, 7.1, 3.0], [-5.6, 6.8, 1.5], [3.8, 7.2, 0.6], [1.0, 7.4, -2.4], [-1.8, 7.3, -1.2], [0.3, 8.4, 0.5]];
    LIMBS.forEach(([x, yy, z]) => limb(TOPX + x * 0.1, TH - 0.8, z * 0.1, x, yy, z, 0.4, 0.16));
    limb(lean(3.4) + 0.5, 3.4, 0, CAL_SWING.x - TX + 0.7, CAL_SWING.py + 0.12, 0, 0.26, 0.13); // swing limb
    limb(CAL_SWING.x - TX + 0.6, CAL_SWING.py + 0.1, 0, 3.6, 6.9, 0.4, 0.14, 0.09); // ...curving up into the canopy
    // canopy: 4 stacked tiers of fuller, thicker flattened blobs (wide low umbrella -> crown), skewed S/E/WSW, NW (house) kept short;
    // slanted gaps are carved through every tier along the sun direction so the god rays + light patches line up with real holes.
    const GR = [0x5f9e52, 0x6aac5a, 0x579449, 0x74b562], blob = new THREE.IcosahedronGeometry(1, 1);
    const SUN = new THREE.Vector3(0.3, -1, -0.24).normalize(), GY = 9.6, GAPS = [[2.0, 2.6], [-2.8, 1.6], [0.9, -0.4], [-0.6, 3.8], [3.6, 0.2]];
    const gapAt = (x, yy, z) => GAPS.some(([gx, gz]) => { const k = (GY - yy) / -SUN.y; return Math.hypot(x - (gx + SUN.x * k), z - (gz + SUN.z * k)) < 1.25; });
    const C = [], ring = (n, rad, yy, r, a0, skip) => { for (let k = 0; k < n; k++) { const a = a0 + k / n * Math.PI * 2, x = Math.cos(a) * rad, z = Math.sin(a) * rad, y2 = yy + Math.sin(k * 2.3) * 0.25; if (skip(x, z) || gapAt(x, y2, z)) continue; C.push([x, y2, z, r * (0.9 + 0.2 * ((k * 7) % 3) / 2)]); } };
    const nw = (x, z) => x < -0.6 && z < -0.6; // house side
    ring(15, 5.2, 6.8, 1.75, 0.2, (x, z) => nw(x, z) || (x > 2.5 && z < -1.5)); // tier 1: wide umbrella (also clears the pool side)
    ring(12, 3.7, 7.7, 1.85, 0.5, (x, z) => nw(x, z) && Math.hypot(x, z) > 2.4); // tier 2
    ring(8, 2.3, 8.6, 1.8, 0.1, (x, z) => nw(x, z) && Math.hypot(x, z) > 2.0); // tier 3
    ring(4, 1.0, 9.4, 1.6, 0.4, () => false); // tier 4 crown
    C.push([-6.4, 6.7, 1.6, 1.5], [-7.6, 6.6, 0.9, 1.2], [-2.4, 7.0, -1.4, 1.5], [1.2, 7.2, -2.4, 1.5], [2.2, 6.7, 5.2, 1.4], [-2.2, 6.7, 5.0, 1.4]);
    C.forEach(([x, yy, z, r], i) => { const m = toonMesh(blob, GR[i % 4]); m.position.set(TX + x, Math.max(yy, 6.2 + r * 0.5), TZ + z); m.scale.set(r * 1.2, r * 0.74, r * 1.2); m.rotation.y = i * 1.7; g.add(m); });
    // dappled shade: one soft base pool + scattered blotches following the canopy footprint
    cast(TX - 0.4, TZ + 1.0, 11.5, 10.0, 0.3, 0.011, 0.5);
    C.forEach(([x, yy, z, r], i) => { if (i % 2) return; cast(TX + x * 1.05, TZ + z * 1.05, r * 1.6, r * 1.3, i, 0.012 + (i % 3) * 0.0004, 0.6); });
    // god rays: tapered open shafts from each gap down along SUN (vertex-colour fade: dark inside the canopy, soft mid, fading at the
    // ground) + a warm light patch where each lands; one merged additive draw, depthWrite off, occlusion-dithered like everything else.
    const parts = []; GAPS.forEach(([gx, gz], i) => { const top = new THREE.Vector3(TX + gx, GY, TZ + gz).addScaledVector(SUN, (GY - 6.6) / -SUN.y), k = 6.6 / -SUN.y, bot = top.clone().addScaledVector(SUN, k), L = k;
      const sh = new THREE.CylinderGeometry(0.7, 1.05 + 0.1 * i, L, 7, 4, true); tint(sh, (x, yy) => { const u = 0.5 - yy / L; /* 0 top .. 1 ground */ const f = Math.min(1, u * 4) * (1 - u * 0.7) * 0.022; return [f, f * 0.93, f * 0.72]; });
      sh.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), SUN)); sh.translate(...top.clone().add(bot).multiplyScalar(0.5).toArray()); parts.push(sh);
      const pt = new THREE.CircleGeometry(1.15 + 0.1 * i, 12); pt.rotateX(-Math.PI / 2); pt.scale(1.25, 1, 1); tint(pt, (x, yy, z) => { const f = Math.max(0, 1 - Math.hypot(x / 1.25, z) / (1.15 + 0.1 * i)) ** 0.7 * 0.07; return [f, f * 0.95, f * 0.7]; }); pt.translate(bot.x, 0.03, bot.z); parts.push(pt); });
    const pos = [], col = []; parts.forEach(q => { const n = q.index ? q.toNonIndexed() : q; pos.push(...n.attributes.position.array); col.push(...n.attributes.color.array); });
    const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    rays = new THREE.Mesh(rg, occPatch(new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })));
    rays.userData.dynamic = true; rays.renderOrder = 3; rays.frustumCulled = true; scene.add(rays); }
  // swing (dynamic, pivots about the branch): two ropes + seat merged
  const swing = new THREE.Group(); swing.position.set(CAL_SWING.x, CAL_SWING.py, CAL_SWING.z); swing.userData.dynamic = true;
  { const L = CAL_SWING.py - CAL_SWING.y; const parts = [-0.4, 0.4].map(dx => { const r = new THREE.CylinderGeometry(0.025, 0.025, L, 4); r.translate(dx, -L / 2, 0); return r; });
    const ropes = new THREE.Mesh(mergeAll(parts), new THREE.MeshBasicMaterial({ color: 0xd9bf8a })); swing.add(ropes);
    const seat = toonMesh(B3(0.95, 0.08, 0.46), 0xc48f5c, { outline: false }); seat.position.y = -L; swing.add(seat); }
  scene.add(swing);
  // ---- campfire: stone ring, kindling, two log benches
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; add(toonMesh(new THREE.DodecahedronGeometry(0.2, 0), 0xa9a296), CAL_FIRE.x + Math.cos(a) * 0.62, 0.1, CAL_FIRE.z + Math.sin(a) * 0.62, a); }
  [0, 1.1, 2.2].forEach(a => { const l = toonMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), 0x7a4a2a); add(l, CAL_FIRE.x, 0.2, CAL_FIRE.z, a); l.rotation.set(1.2, a, 0); });
  CAL_FIRE.logs.forEach(L => { const l = toonMesh(new THREE.CylinderGeometry(0.28, 0.3, 1.7, 9), 0x9c6b45); l.rotation.z = Math.PI / 2; const w = new THREE.Group(); w.add(l); w.position.set(L.x, 0.28, L.z); w.rotation.y = L.ry; g.add(w); cast(L.x, L.z, 1.8, 0.6, L.ry, 0.015, 0.4); });
  // ---- cozy house: floor, walls (door gap in front), gable roof, windows, bed + wardrobe, rug, sconce
  const wallC = 0xf2e8d8, trim = 0x9c6b45, roofC = 0x8aa4b4, t = H.t, mx = H.cx, mz = H.cz;
  add(toonMesh(B3(H.w + 0.3, 0.12, H.d + 0.5), 0xd9a46a), mx, 0.04, mz + 0.1);
  for (let x = H.x0 + 0.4; x < H.x1; x += 0.55) add(toonMesh(B3(0.03, 0.01, H.d + 0.4), 0xb98250, { outline: false }), x, 0.105, mz + 0.1);
  add(toonMesh(B3(H.w, H.h, t), wallC), mx, H.h / 2, H.z0); // back
  [H.x0, H.x1].forEach(x => add(toonMesh(B3(t, H.h, H.d), wallC), x, H.h / 2, mz)); // sides
  const dl = mx + H.door[0], dr = mx + H.door[1]; add(toonMesh(B3(dl - H.x0, H.h, t), wallC), (H.x0 + dl) / 2, H.h / 2, H.z1); add(toonMesh(B3(H.x1 - dr, H.h, t), wallC), (dr + H.x1) / 2, H.h / 2, H.z1);
  [dl, dr].forEach(x => add(toonMesh(B3(0.2, H.h, 0.24), trim), x, H.h / 2, H.z1)); [H.x0, H.x1].forEach(x => [H.z0, H.z1].forEach(z => add(toonMesh(B3(0.24, H.h + 0.05, 0.24), trim), x, H.h / 2, z)));
  add(toonMesh(B3(H.w + 0.7, 0.16, H.d + 0.8), 0x7a93a3), mx, H.h + 0.08, mz);
  { const rg = new THREE.CylinderGeometry(1.4, 1.4, H.w + 0.75, 3, 1); rg.rotateZ(Math.PI / 2); rg.scale(1, 0.62, 1.6); add(toonMesh(rg, roofC), mx, H.h + 0.6, mz); }
  add(toonMesh(B3(0.5, 1.0, 0.5), 0xb5a690), mx + 1.4, H.h + 1.0, mz - 0.5); // chimney
  // windows: frames baked, panes glow at night (one merged mesh)
  const paneGeo = []; const win = (x, yy, z, ry, w = 1.0, h = 0.8) => { const f = new THREE.Group(); f.position.set(x, yy, z); f.rotation.y = ry; g.add(f);
    [[0, h / 2, w + 0.12, 0.08], [0, -h / 2, w + 0.12, 0.08]].forEach(([dx, dy, ww, hh]) => { const m = toonMesh(B3(ww, hh, t + 0.08), trim); m.position.set(dx, dy, 0); f.add(m); });
    [-w / 2, 0, w / 2].forEach(dx => { const m = toonMesh(B3(0.07, h, t + 0.08), trim); m.position.set(dx, 0, 0); f.add(m); });
    [-1, 1].forEach(sd => { const p = new THREE.PlaneGeometry(w, h); if (sd < 0) p.rotateY(Math.PI); p.translate(0, 0, sd * (t / 2 + 0.01)); p.rotateY(ry); p.translate(x, yy, z); paneGeo.push(p); }); };
  win(H.x0, 1.75, mz, Math.PI / 2); win(mx + 0.25, 1.85, H.z0, 0, 1.0, 0.7);
  const panes = new THREE.Mesh(mergeAll(paneGeo), glowMat(0xffc46e)); panes.userData.dynamic = true; scene.add(panes);
  // bed (pillow at -x), blanket in Calvin's navy
  { const [bx0, bz0, bx1, bz1] = H.bed, bcx = (bx0 + bx1) / 2, bcz = (bz0 + bz1) / 2; add(toonMesh(B3(bx1 - bx0, 0.38, bz1 - bz0), 0x9c6b45), bcx, 0.29, bcz); add(toonMesh(B3(bx1 - bx0 - 0.1, 0.18, bz1 - bz0 - 0.1), 0xfaf4ea), bcx, 0.56, bcz);
    add(toonMesh(B3(0.12, 0.85, bz1 - bz0 + 0.05), 0x8a5a36), bx0 + 0.06, 0.52, bcz); add(toonMesh(B3(0.6, 0.16, 0.9), 0xffffff), bx0 + 0.45, 0.72, bcz); add(toonMesh(B3(1.9, 0.08, bz1 - bz0 - 0.05), 0x5d7396), bcx + 0.45, 0.67, bcz);
    cast(bcx, bcz, bx1 - bx0, bz1 - bz0, 0, 0.12, 0.5); }
  // wardrobe: cabinet + doors + knobs; a shirt peeking out; hat box on top
  { const [wx0, wz0, wx1, wz1] = H.closet, wcx = (wx0 + wx1) / 2, wcz = (wz0 + wz1) / 2; add(toonMesh(B3(wx1 - wx0, 2.25, wz1 - wz0), 0xb07a4e), wcx, 0.1 + 1.125, wcz);
    [-1, 1].forEach(sd => { add(toonMesh(B3((wx1 - wx0) / 2 - 0.08, 1.95, 0.04), 0xc48f5c), wcx + sd * (wx1 - wx0) / 4, 1.22, wz1 + 0.01); add(toonMesh(new THREE.SphereGeometry(0.045, 6, 4), 0xe6c27a, { outline: false }), wcx + sd * 0.07, 1.25, wz1 + 0.05); });
    add(toonMesh(B3(0.5, 0.3, 0.4), 0xe9e2cf), wcx - 0.1, 2.53, wcz); add(toonMesh(B3(0.62, 0.04, 0.5), 0x2f4f86), wcx - 0.1, 2.68, wcz); }
  add(toonMesh(new THREE.CylinderGeometry(1.0, 1.0, 0.02, 18), 0xe8d2b0, { outline: false }), mx + 0.4, 0.12, mz + 0.5); // rug
  add(toonMesh(new THREE.CylinderGeometry(0.22, 0.17, 0.4, 8), 0xc9744e), H.x0 + 0.35, 0.3, H.z1 - 0.4); add(toonMesh(new THREE.SphereGeometry(0.34, 7, 5), 0x5fb550), H.x0 + 0.35, 0.72, H.z1 - 0.4); // plant
  add(toonMesh(B3(0.6, 0.45, 0.04), 0xe9e2cf), mx - 0.9, 1.75, H.z0 + 0.1); add(toonMesh(B3(0.5, 0.35, 0.02), 0x7fb0a8, { outline: false }), mx - 0.9, 1.75, H.z0 + 0.13); // little framed sea print over the bed
  add(toonMesh(B3(1.0, 0.03, 0.6), 0xc9744e, { outline: false }), mx + 0.55, 0.12, H.z1 + 0.55); // welcome mat
  cast(mx, mz, H.w + 0.7, H.d + 0.8, 0, 0.012, 0.5);
  // ---- pool: stone rim, teal floor, water surface (shared animated water shader), pink float ring
  { const ring = new THREE.RingGeometry(1.0, 1.16, 36); ring.rotateX(-Math.PI / 2); ring.scale(PO.rx, 1, PO.rz); const rim = toonMesh(ring, 0xd8d2c4, { outline: false }); add(rim, PO.x, 0.05, PO.z);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.283; add(toonMesh(new THREE.DodecahedronGeometry(0.16, 0), i % 2 ? 0xcfc8b8 : 0xbfb6a4, { outline: false }), PO.x + Math.cos(a) * PO.rx * 1.12, 0.07, PO.z + Math.sin(a) * PO.rz * 1.12, a); }
    const fl = new THREE.CircleGeometry(1, 28); fl.rotateX(-Math.PI / 2); fl.scale(PO.rx, 1, PO.rz); add(toonMesh(fl, 0x4f9fb0, { outline: false }), PO.x, -0.035, PO.z);
    add(toonMesh(new THREE.TorusGeometry(0.34, 0.12, 6, 12).rotateX(Math.PI / 2), 0xe8a0a8), PO.x + 1.0, 0.07, PO.z - 0.45); }
  const water = new THREE.Mesh(new THREE.CircleGeometry(1, 28), waterMat); water.rotation.x = -Math.PI / 2; water.scale.set(PO.rx * 1.02, PO.rz * 1.02, 1); water.position.set(PO.x, 0.045, PO.z); water.userData.dynamic = true; scene.add(water);
  // ---- coffee deck: planks, railing on three sides, bench facing the open sea, little table with a pot + mug
  { const w = DK.x1 - DK.x0 - 0.6, d = DK.z1 - DK.z0, dcx = DK.x0 + w / 2, dcz = (DK.z0 + DK.z1) / 2; add(toonMesh(B3(w, 0.16, d), 0xd9a46a), dcx, DK.y - 0.08, dcz);
    for (let z = DK.z0 + 0.3; z < DK.z1; z += 0.45) add(toonMesh(B3(w, 0.01, 0.03), 0xb98250, { outline: false }), dcx, DK.y + 0.005, z);
    [[-0.2, 0.32], [w - 0.4, -0.6]].forEach(() => {}); [[DK.x0 + 0.06, DK.z0 + 0.06], [DK.x0 + 0.06, DK.z1 - 0.06], [DK.x0 + w - 0.06, DK.z0 + 0.06], [DK.x0 + w - 0.06, DK.z1 - 0.06]].forEach(([x, z]) => add(toonMesh(B3(0.12, 1.0, 0.12), 0x8a5a36), x, DK.y + 0.5, z));
    const rail = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az); const r = toonMesh(B3(0.09, 0.08, L), 0x8a5a36); r.position.set((ax + bx) / 2, DK.y + 0.95, (az + bz) / 2); r.rotation.y = Math.atan2(bx - ax, bz - az); g.add(r);
      const n = Math.max(2, Math.round(L / 0.5)); for (let i = 1; i < n; i++) { const k = i / n; add(toonMesh(B3(0.05, 0.85, 0.05), 0xa87a50, { outline: false }), ax + (bx - ax) * k, DK.y + 0.48, az + (bz - az) * k); } };
    rail(DK.x0 + 0.06, DK.z0 + 0.06, DK.x0 + 0.06, DK.z1 - 0.06); rail(DK.x0 + 0.06, DK.z0 + 0.06, DK.x0 + w - 0.06, DK.z0 + 0.06); rail(DK.x0 + 0.06, DK.z1 - 0.06, DK.x0 + w - 0.06, DK.z1 - 0.06);
    const bn = new THREE.Group(); bn.position.set(DK.bench.x, DK.y, DK.bench.z); bn.rotation.y = DK.bench.ry; g.add(bn);
    { const s = toonMesh(B3(1.8, 0.1, 0.55), 0xc98d55); s.position.y = 0.48; bn.add(s); const bk = toonMesh(B3(1.8, 0.45, 0.08), 0xc98d55); bk.position.set(0, 0.8, -0.26); bn.add(bk);
      [-0.75, 0.75].forEach(px => { const l = toonMesh(B3(0.1, 0.48, 0.5), 0x8a5a36, { outline: false }); l.position.set(px, 0.24, 0); bn.add(l); });
      [[-0.45, 0x9fc4a8], [0.45, 0xf2efe6]].forEach(([dx, c]) => { const cu = toonMesh(B3(0.45, 0.38, 0.12), c); cu.position.set(dx, 0.74, -0.18); cu.rotation.x = 0.2; bn.add(cu); }); }
    const T2 = DK.table; add(toonMesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 6), 0x8a5a36), T2.x, DK.y + 0.28, T2.z); add(toonMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 12), 0xc98d55), T2.x, DK.y + 0.57, T2.z);
    add(toonMesh(new THREE.CylinderGeometry(0.09, 0.11, 0.24, 8), 0x3a3a48), T2.x + 0.08, DK.y + 0.72, T2.z - 0.05); add(toonMesh(new THREE.CylinderGeometry(0.06, 0.05, 0.1, 8), 0xf2efe6), T2.x - 0.12, DK.y + 0.65, T2.z + 0.08);
    cast(dcx, dcz, w, d, 0, 0.17, 0.4); }
  // flowers sprinkled on the lawn (clear of paths/features)
  for (let i = 0; i < 40; i++) { const a = rnd() * 6.28, rr = 2.6 + rnd() * 6.0, x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr;
    if (Math.hypot(x - PO.x, z - PO.z) < 2.8 || (x > H.x0 - 0.6 && x < H.x1 + 0.6 && z > H.z0 - 0.6 && z < H.z1 + 1.2) || Math.hypot(x - CAL_FIRE.x, z - CAL_FIRE.z) < 2.6 || Math.abs(z - cz) < 1.0) continue;
    add(toonMesh(new THREE.OctahedronGeometry(0.1, 0), [0xffd166, 0xf2a7b8, 0xffffff, 0xb9a0e0][i % 4], { outline: false }), x, 0.12, z); }
  // ---- lanterns (bridge end, house door, deck corners) + halos incl. the fire
  const LAN = [...CAL_LANTERNS, [dr + 0.45, H.z1 + 0.9], [DK.x0 + 0.06, DK.z0 + 0.06], [DK.x0 + 0.06, DK.z1 - 0.06]];
  const lanGeo = [], halos = [];
  LAN.forEach(([x, z], i) => { const deck = i >= 3, yb = deck ? DK.y + 1.0 : 0; if (!deck) { add(toonMesh(new THREE.CylinderGeometry(0.06, 0.08, 2.1, 6), 0x5a4030), x, 1.05, z); add(toonMesh(B3(0.36, 0.06, 0.36), 0x5a4030), x, 2.37, z); }
    const yy = deck ? yb + 0.2 : 2.18; const lg = B3(0.26, 0.3, 0.26); lg.translate(x, yy, z); lanGeo.push(lg); halos.push([x, yy, z, 1.2]); });
  { const sc = B3(0.24, 0.16, 0.12); sc.translate(H.cx - 0.9, 2.45, H.z0 + 0.14); lanGeo.push(sc); halos.push([H.cx - 0.9, 2.4, H.z0 + 0.4, 1.4]); } // sconce over the bed
  const lanterns = new THREE.Mesh(mergeAll(lanGeo), glowMat(0xffc46e)); lanterns.userData.dynamic = true; scene.add(lanterns);
  halos.push([CAL_FIRE.x, 0.7, CAL_FIRE.z, 2.6]); const halo = glowPoints(scene, halos, { size: 70, color: 0xffb860 });
  // ---- flames: same flicker shader as the home campfire, a touch brighter at night
  const flameMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uNight: dayUniforms.uNight },
    vertexShader: `uniform float uTime; varying float vY; void main(){ vY = position.y; vec3 p = position; float f = sin(uTime*9.0 + position.y*6.0)*0.06*position.y; p.x += f; p.z += cos(uTime*7.0+position.y*5.0)*0.05*position.y; p.y *= 0.85 + 0.15*sin(uTime*11.0+1.3); gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `uniform float uNight; varying float vY; void main(){ vec3 c = mix(vec3(1.0,0.75,0.25), vec3(1.0,0.35,0.1), clamp(vY*1.4,0.0,1.0)); gl_FragColor = vec4(c*(0.7+0.6*uNight), 1.0); }` });
  const flames = new THREE.Mesh(mergeAll([0, 1, 2].map(i => { const c = new THREE.ConeGeometry(0.22 - i * 0.04, 0.75 - i * 0.12, 7, 1, true); c.translate(Math.cos(i * 2.1) * 0.1, (0.75 - i * 0.12) / 2, Math.sin(i * 2.1) * 0.1); return c; })), flameMat);
  flames.position.set(CAL_FIRE.x, 0.15, CAL_FIRE.z); flames.userData.dynamic = true; scene.add(flames);
  // warm firelight pool on the grass (additive disc, night only)
  const fireLight = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uNight: dayUniforms.uNight, uTime: { value: 0 } },
    vertexShader: `varying vec2 vP; void main(){ vP = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uNight, uTime; varying vec2 vP; void main(){ float d = length(vP)/3.2; float f = 0.85 + 0.15*sin(uTime*13.0)*sin(uTime*7.3); gl_FragColor = vec4(vec3(1.0,0.55,0.2)*pow(1.0-d,2.0)*0.55*uNight*f, 1.0); }` }));
  fireLight.position.set(CAL_FIRE.x, 0.03, CAL_FIRE.z); fireLight.userData.dynamic = true; scene.add(fireLight);
  const flies = fireflies(scene, { cx: CAL_TREE.x, cz: CAL_TREE.z + 1, r: 5.5, n: 30, seed: 31 });
  // ---- private sign by the bridge
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 96; const c2 = cv.getContext('2d'); c2.fillStyle = '#c98d55'; c2.fillRect(0, 0, 256, 96); c2.strokeStyle = '#7a4a2a'; c2.lineWidth = 8; c2.strokeRect(4, 4, 248, 88);
  c2.fillStyle = '#3a2416'; c2.textAlign = 'center'; c2.font = '700 34px system-ui, sans-serif'; c2.fillText("Calvin's", 128, 44); c2.font = '600 22px system-ui, "Noto Color Emoji", sans-serif'; c2.fillText('private island 😎', 128, 76);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; const sg = new THREE.PlaneGeometry(1.3, 0.49); const sb = sg.clone().rotateY(Math.PI);
  const sign = new THREE.Group(); sign.position.set(SIGN[0], 0, SIGN[1]); sign.rotation.y = Math.PI / 2; sign.userData.dynamic = true;
  { const m = new THREE.MeshBasicMaterial({ map: tex }); const f = new THREE.Mesh(sg, m); f.position.set(0, 1.25, 0.04); const bk = new THREE.Mesh(sb, m); bk.position.set(0, 1.25, -0.04); sign.add(f, bk); } scene.add(sign);
  add(toonMesh(B3(0.1, 1.0, 0.1), 0x8a5a36), SIGN[0], 0.5, SIGN[1]);
  scene.add(g); bake(g);
  return { group: g, swing, flames, fireLight, halo, flies, panes, lanterns, water, rays,
    update(t, aur = 0) { const day = Math.max(0, Math.min(1, (0.75 - dayUniforms.uNight.value) / 0.6)) * (1 - aur); rays.visible = day > 0.01; rays.material.opacity = day * (0.85 + 0.15 * Math.sin(t * 0.7)); flameMat.uniforms.uTime.value = t; fireLight.material.uniforms.uTime.value = t; halo.material.uniforms.uTime.value = t; } };
}
