// v27 café garden: a visible stepping-stone + gravel path from the office's south door to the café patio, warm path lanterns,
// a low hedge + gate pots round the patio, flower beds, a little koi pond with a bench (and a lounging cat), a chalkboard
// A-frame and climbing vines on the café walls. Everything static is baked into ONE fill + ONE outline batch; the lantern
// heads share one glow mesh, their halos one points draw, the pond reuses the lawn-pool water shader (≈ +4 draw calls).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { dayUniforms, glowPoints } from './daycycle.js';
import { CAFE_GARDEN as G, CAFE } from './layout.js';

export function makeGarden(scene, waterMat) {
  const g = new THREE.Group(); g.name = 'garden'; let seed = 271; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const M = (geo, col, x, y, z, o = {}) => { const m = toonMesh(geo, col, { outline: o.outline ?? true }); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.r) m.rotation.set(...o.r); if (o.s) m.scale.set(...o.s); g.add(m); return m; };
  const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), BX = (w, h, d) => { const q = B(w, h, d); q.userData.soft = true; return q; };
  const GLOW = [], halos = [];
  // ---- gravel ribbon + stepping stones along a smooth curve through the path points ----
  const curve = new THREE.CatmullRomCurve3(G.path.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal'); const L = curve.getLength();
  { const n = Math.ceil(L / 0.6), pos = [], W = 0.62; for (let i = 0; i <= n; i++) { const p = curve.getPointAt(i / n), t = curve.getTangentAt(i / n), w = W * (1 + 0.08 * Math.sin(i * 1.7));
      pos.push(p.x - t.z * w, -0.022, p.z + t.x * w, p.x + t.z * w, -0.022, p.z - t.x * w); }
    const idx = []; for (let i = 0; i < n; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    const rib = new THREE.BufferGeometry(); rib.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); rib.setIndex(idx); rib.computeVertexNormals();
    if (rib.attributes.normal.getY(0) < 0) { rib.setIndex(idx.map((_, k) => idx[k - (k % 3) + [0, 2, 1][k % 3]])); rib.computeVertexNormals(); }
    M(rib, 0xe2d2b0, 0, 0, 0, { outline: false }); }
  const stoneGeo = new THREE.CircleGeometry(0.29, 7).rotateX(-Math.PI / 2); /* flat caps on the gravel: 7 tris each */ const SC = [0xcfc6b6, 0xd8cfbd, 0xc4bba9];
  for (let d = 0.35, i = 0; d < L - 0.2; d += 0.8, i++) { const u = d / L, p = curve.getPointAt(u), t = curve.getTangentAt(u), o = (i % 2 ? 1 : -1) * 0.14;
    M(stoneGeo, SC[i % 3], p.x - t.z * o, -0.004, p.z + t.x * o, { outline: false, ry: rnd() * 3, s: [0.9 + rnd() * 0.25, 1, 0.8 + rnd() * 0.2] }); }
  // ---- path lanterns (post + glowing head + little roof) ----
  const lantern = (x, z) => { M(BX(0.2, 0.08, 0.2), 0x3a3340, x, 0.04, z, { outline: false }); M(BX(0.07, 1.0, 0.07), 0x4a3a34, x, 0.55, z);
    M(BX(0.27, 0.035, 0.27), 0x3a3340, x, 1.06, z, { outline: false }); M(new THREE.ConeGeometry(0.22, 0.16, 4), 0x3a3340, x, 1.38, z, { outline: false, ry: Math.PI / 4 });
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(([a, b]) => M(BX(0.025, 0.26, 0.025), 0x3a3340, x + a * 0.1, 1.2, z + b * 0.1, { outline: false }));
    GLOW.push([x, 1.2, z, 0.18, 0.24]); halos.push([x, 1.2, z, 1.6]); };
  G.lanterns.forEach(([x, z]) => lantern(x, z));
  // ---- patio hedge (low, rounded) with tiny blossoms, and two gate pots ----
  G.hedges.forEach(([x0, z0, x1, z1], k) => { const w = x1 - x0, d = z1 - z0; M(B(w, 0.5, d), k % 2 ? 0x5fae52 : 0x67b65a, (x0 + x1) / 2, 0.25, (z0 + z1) / 2);
    const n = Math.round(Math.max(w, d) / 0.45); for (let i = 0; i < n; i++) { const t = (i + 0.3 + rnd() * 0.4) / n; M(new THREE.OctahedronGeometry(0.06, 0), [0xffffff, 0xffc6d9, 0xffe08a][i % 3], w > d ? x0 + t * w : (x0 + x1) / 2 + (rnd() - 0.5) * 0.2, 0.51, w > d ? (z0 + z1) / 2 + (rnd() - 0.5) * 0.2 : z0 + t * d, { outline: false }); } });
  G.pots.forEach(([x, z], k) => { M(new THREE.CylinderGeometry(0.28, 0.2, 0.46, 8), 0xc9744e, x, 0.23, z); M(new THREE.CylinderGeometry(0.29, 0.29, 0.06, 8), 0xb4633f, x, 0.47, z, { outline: false });
    M(new THREE.IcosahedronGeometry(0.34, 1), 0x5fae5a, x, 0.78, z); M(new THREE.IcosahedronGeometry(0.22, 0), 0x74c062, x + 0.12, 1.02, z - 0.06, { outline: false });
    [0, 2.1, 4.2].forEach(a => M(new THREE.SphereGeometry(0.07, 5, 3), k ? 0xffd36a : 0xff9bb8, x + Math.cos(a + k) * 0.3, 0.86, z + Math.sin(a + k) * 0.3, { outline: false })); });
  // ---- flower beds (wooden edge, soil, leafy clumps, blooms) ----
  const FC = [0xff9bb8, 0xffd36a, 0xffffff, 0xb7a2ff, 0xff7a59];
  G.beds.forEach(([x, z, w, d]) => { M(new THREE.CylinderGeometry(1, 1, 0.2, 12), 0x9a6a44, x, 0.03, z, { s: [w, 1, d] }); M(new THREE.CylinderGeometry(0.92, 0.92, 0.04, 12), 0x6b4a33, x, 0.14, z, { outline: false, s: [w, 1, d] });
    for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + rnd() * 0.4, rr = 0.25 + rnd() * 0.5, fx = x + Math.cos(a) * rr * w, fz = z + Math.sin(a) * rr * d;
      M(new THREE.IcosahedronGeometry(0.17, 0), i % 2 ? 0x5fb550 : 0x6cc45a, fx, 0.27, fz, { outline: false, s: [1, 0.8, 1] }); M(new THREE.OctahedronGeometry(0.1, 0), FC[i % 5], fx, 0.44, fz, { outline: false }); } });
  // ---- koi pond: stone ring, water, lily pads, koi ----
  { const P = G.pond; for (let i = 0; i < 13; i++) { const a = i / 13 * 6.28; M(new THREE.IcosahedronGeometry(0.2 + (i % 3) * 0.03, 0), i % 2 ? 0xcfc8b8 : 0xbfb6a4, P.x + Math.cos(a) * (P.r + 0.08), 0.04, P.z + Math.sin(a) * (P.r + 0.08), { outline: false, s: [1, 0.6, 1], ry: i }); }
    M(new THREE.CylinderGeometry(P.r, P.r * 0.9, 0.04, 14), 0x4a7a86, P.x, -0.03, P.z, { outline: false });
    const w = new THREE.Mesh(new THREE.CircleGeometry(P.r + 0.02, 18), waterMat); w.rotation.x = -Math.PI / 2; w.position.set(P.x, 0.035, P.z); w.userData.dynamic = true; w.name = 'koiWater'; g.add(w);
    [[0.4, 0.3], [-0.35, -0.4], [-0.5, 0.25]].forEach(([dx, dz], i) => { M(new THREE.CylinderGeometry(0.15, 0.15, 0.012, 8), 0x6cbf5a, P.x + dx, 0.045, P.z + dz, { outline: false }); if (i === 0) M(new THREE.SphereGeometry(0.05, 5, 3), 0xffc6d9, P.x + dx, 0.08, P.z + dz, { outline: false }); });
    [[0.05, 0.1, 0.5, 0xff8a3a], [-0.2, -0.05, 2.4, 0xffffff], [0.25, -0.3, 4.0, 0xff6a3a]].forEach(([dx, dz, a, c]) => M(new THREE.SphereGeometry(0.1, 6, 4), c, P.x + dx, 0.05, P.z + dz, { outline: false, s: [1.6, 0.35, 0.6], ry: a })); }
  // ---- bench by the pond (faces the water) + a lounging cat ----
  { const { x, z } = G.bench, bg = new THREE.Group(); bg.position.set(x, 0, z); bg.rotation.y = Math.PI; g.add(bg); const A = (geo, c, px, py, pz, o = {}) => { const m = toonMesh(geo, c, { outline: o.outline ?? true }); m.position.set(px, py, pz); if (o.s) m.scale.set(...o.s); if (o.r) m.rotation.set(...o.r); bg.add(m); };
    A(B(1.7, 0.09, 0.5), 0xc98d55, 0, 0.46, 0); A(B(1.7, 0.42, 0.07), 0xc98d55, 0, 0.78, -0.24); [-0.7, 0.7].forEach(k => A(BX(0.09, 0.46, 0.46), 0x3f6f6a, k, 0.23, 0, { outline: false }));
    const ginger = 0xf0a050; A(new THREE.SphereGeometry(0.2, 8, 6), ginger, 0.45, 0.6, 0.02, { s: [1.3, 0.62, 0.95] }); A(new THREE.SphereGeometry(0.13, 8, 6), ginger, 0.2, 0.62, 0.1);
    [-1, 1].forEach(k => A(new THREE.ConeGeometry(0.045, 0.09, 4), 0xe08a3a, 0.18, 0.75, 0.1 + k * 0.065, { outline: false }));
    A(new THREE.SphereGeometry(0.03, 4, 3), 0x2b2d42, 0.08, 0.64, 0.14, { outline: false }); A(new THREE.SphereGeometry(0.03, 4, 3), 0x2b2d42, 0.1, 0.64, 0.04, { outline: false });
    A(new THREE.CylinderGeometry(0.04, 0.035, 0.42, 6), ginger, 0.62, 0.53, 0.22, { r: [Math.PI / 2, 0, 0.5], outline: false });
    [0.32, 0.5].forEach(px => A(new THREE.BoxGeometry(0.03, 0.02, 0.24), 0xd8843a, px, 0.6, 0.02, { outline: false })); }
  // ---- chalkboard A-frame ----
  { const [x, z] = G.sign, sg = new THREE.Group(); sg.position.set(x, 0, z); sg.rotation.y = 0.5; g.add(sg); [-1, 1].forEach(k => { const f = new THREE.Group(); f.position.set(0, 0, k * 0.17); f.rotation.x = k * 0.2; sg.add(f);
      const a = toonMesh(BX(0.62, 0.86, 0.04), 0x9a6a44); a.position.y = 0.45; f.add(a); const b = toonMesh(BX(0.52, 0.66, 0.02), 0x2e4a3e, { outline: false }); b.position.set(0, 0.48, k * 0.025); f.add(b);
      [[0.22, 0.03, 0.66, 0xfff6e0], [0.13, 0.025, 0.56, 0xffd36a], [0.3, 0.02, 0.44, 0xfff6e0], [0.2, 0.02, 0.36, 0xff9bb8]].forEach(([w, h, y, c]) => { const l = toonMesh(BX(w, h, 0.01), c, { outline: false }); l.position.set(0, y, k * 0.038); f.add(l); });
      const cup = toonMesh(BX(0.08, 0.07, 0.01), 0xfff6e0, { outline: false }); cup.position.set(0.14, 0.24, k * 0.038); f.add(cup); }); }
  // ---- climbing vines on the café's side walls + façade corners ----
  { const VC = [0x4f9a48, 0x5fae52, 0x6cbf5a]; const vine = (x, z, nx, h0, h1, spread) => { for (let y = h0; y < h1; y += 0.4) { const n = 1 + (rnd() > 0.5 ? 1 : 0);
        for (let k = 0; k < n; k++) { const off = (rnd() - 0.5) * spread * (1 - (y - h0) / (h1 - h0) * 0.6); M(new THREE.OctahedronGeometry(0.24 + rnd() * 0.08, 0), VC[(k + Math.round(y * 3)) % 3], x + (nx ? 0.04 * nx : off), y, z + (nx ? off : 0.05), { outline: false, s: nx ? [0.4, 1, 1] : [1, 1, 0.4] }); }
        if (rnd() > 0.72) M(new THREE.OctahedronGeometry(0.06, 0), 0xffffff, x + (nx ? 0.1 * nx : 0), y + 0.1, z + (nx ? (rnd() - 0.5) * spread * 0.6 : 0.12), { outline: false }); } };
    vine(CAFE.x0 - 0.05, -21.3, -1, 0.2, 3.1, 1.3); vine(CAFE.x0 - 0.05, -24.6, -1, 0.2, 2.6, 1.1); vine(CAFE.x1 + 0.05, -22.0, 1, 0.2, 3.0, 1.3); vine(CAFE.x1 + 0.05, -25.0, 1, 0.2, 2.4, 1.0);
    vine(CAFE.x0 + 0.35, CAFE.z1 + 0.02, 0, 0.2, 3.2, 0.5); vine(CAFE.x1 - 0.35, CAFE.z1 + 0.02, 0, 0.2, 3.2, 0.5); }
  scene.add(g); bake(g);
  // lantern heads: one warm glow mesh (brighter at night) + soft halos
  const lamps = new THREE.Mesh(mergeGeometries(GLOW.map(([x, y, z, w, h]) => { const q = B(w, h, w); q.translate(x, y, z); return q; })), new THREE.ShaderMaterial({ uniforms: { uGlow: dayUniforms.uGlow, uNight: dayUniforms.uNight },
    vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uGlow, uNight; void main(){ vec3 day = mix(vec3(1.0,0.93,0.76), vec3(0.5,0.44,0.36), uNight); gl_FragColor = vec4(mix(day, vec3(1.4,1.0,0.5), uGlow), 1.0); }' }));
  lamps.name = 'gardenLamps'; scene.add(lamps); const glow = glowPoints(scene, halos, { size: 60, color: 0xffb860 }); glow.name = 'gardenHalos';
  g.userData = { lamps, glow, pathLen: L }; return g;
}
