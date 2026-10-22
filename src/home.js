// Home island: floating lawn + cliff, rope-and-plank bridge from the office lawn, longhouse with 4 open-front bedrooms
// (Pixel console, Jun easel, Sage bookshelves, Mika music corner), campfire with log benches, veggie garden, lanterns.
import * as THREE from 'three';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { HOME, BRIDGE, HOUSE, FIRE, GARDEN, bridgeY } from './layout.js';
import { glowMat, glowPoints, dayUniforms, fireflies } from './daycycle.js';
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
function tint(geo, f) { if (geo.index) { const ng = geo.toNonIndexed(); geo.copy(ng); } const p = geo.attributes.position, a = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) { const c = f(p.getX(i), p.getY(i), p.getZ(i)); a[i * 3] = c[0]; a[i * 3 + 1] = c[1]; a[i * 3 + 2] = c[2]; } geo.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
export function makeHome(scene) {
  let seed = 41; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const g = new THREE.Group(); const add = (m, x, y, z, ry = 0) => { m.position.set(x, y, z); m.rotation.y = ry; g.add(m); return m; };
  const R = HOME.r, cx = HOME.cx, cz = HOME.cz;
  // ---- island: grass cap + three cliff tiers
  const gg = new THREE.CylinderGeometry(R, R - 0.4, 0.7, 40, 1); { const p = gg.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.04 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 4 + 1); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); } gg.computeVertexNormals(); }
  tint(gg, (x, y, z) => { const nz = 0.5 + 0.5 * Math.sin(x * 0.6 + z * 0.3) * Math.cos(z * 0.5); const b = y > 0 ? 1 - 0.12 * nz : 0.78; return [b, b * 1.03, b * 0.95]; });
  add(toonMesh(gg, 0x86cf5e), cx, -0.4, cz);
  let y = -0.75; [[R * 0.97, 1.6, 0xc9bca6], [R * 0.82, 2.0, 0xb5a690], [R * 0.55, 2.4, 0xc3b49c], [R * 0.28, 2.6, 0xa99a86]].forEach(([r, h, c], i, A) => {
    const geo = new THREE.CylinderGeometry(r, A[i + 1] ? A[i + 1][0] : 0.6, h, 22, 1); const p = geo.attributes.position; for (let j = 0; j < p.count; j++) { const k = 0.9 + rnd() * 0.18; p.setX(j, p.getX(j) * k); p.setZ(j, p.getZ(j) * k); } geo.computeVertexNormals();
    tint(geo, (x, yy) => i === 0 && yy > h * 0.15 ? [0.62, 0.95, 0.55] : [1, 0.97, 0.93]); add(toonMesh(geo, c), cx, y - h / 2, cz); y -= h * 0.92; });
  // ---- bridge: planks following the sag, posts, rope rails
  const Bx = BRIDGE.x, N = 24; for (let i = 0; i < N; i++) { const z = BRIDGE.z0 + 0.35 + i * (BRIDGE.z1 - BRIDGE.z0 - 0.7) / (N - 1), yy = bridgeY(z) - 0.06;
    const pl = add(toonMesh(B3(BRIDGE.half * 2 + 0.1 - rnd() * 0.12, 0.08, 0.3), i % 2 ? 0xc48f5c : 0xb98250), Bx + (rnd() - 0.5) * 0.06, yy, z); pl.rotation.x = Math.atan2(bridgeY(z + 0.2) - bridgeY(z - 0.2), 0.4) * -1; }
  [-1, 1].forEach(sd => { const x = Bx + sd * BRIDGE.half, pts = [];
    for (let i = 0; i <= 6; i++) { const z = BRIDGE.s0 - 0.6 + i * (BRIDGE.s1 - BRIDGE.s0 + 1.2) / 6, yy = bridgeY(z); add(toonMesh(B3(0.12, 1.05, 0.12), 0x8a5a36), x, yy + 0.47, z); pts.push(new THREE.Vector3(x, yy + 0.98, z)); }
    const rope = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 30, 0.04, 4); g.add(toonMesh(rope, 0xe0c48a, { outline: false }));
    const low = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(p => p.clone().setY(p.y - 0.45))), 30, 0.03, 4); g.add(toonMesh(low, 0xe0c48a, { outline: false })); });
  // ---- stepping stones: office front -> bridge, bridge -> campfire / house
  [[3.0, 9.4], [2.6, 10.9], [2.2, 12.4], [2.0, 13.9], [2.0, 25.1], [2.2, 26.6], [2.0, 28.1], [2.3, 29.5]].forEach(([x, z]) => { const s = toonMesh(new THREE.CylinderGeometry(0.42, 0.46, 0.08, 9), 0xd8d2c4, { outline: false }); add(s, x, 0.02, z, rnd()); });
  // ---- longhouse: deck, back wall, side walls + partitions, roof with eaves, windows (glow), banners
  const H = HOUSE, W = H.x1 - H.x0, D = H.z1 - H.z0, mz = (H.z0 + H.z1) / 2;
  add(toonMesh(B3(W + 0.2, 0.24, D + H.porch), 0xd9a46a), (H.x0 + H.x1) / 2, 0.0, mz - H.porch / 2);
  for (let x = H.x0 + 0.5; x < H.x1; x += 0.6) add(toonMesh(B3(0.03, 0.01, D + H.porch), 0xb98250, { outline: false }), x, 0.125, mz - H.porch / 2);
  const wallC = 0xf4e6cf, trim = 0x9c6b45;
  add(toonMesh(B3(W, H.h, 0.16), wallC), (H.x0 + H.x1) / 2, H.h / 2, H.z1);
  H.walls.forEach(x => add(toonMesh(B3(0.16, H.h, D), wallC), x, H.h / 2, mz));
  H.walls.forEach(x => add(toonMesh(B3(0.24, H.h, 0.24), trim), x, H.h / 2, H.z0 + 0.05)); // front posts
  add(toonMesh(B3(W + 0.6, 0.2, D + 1.0), 0xc9744e), (H.x0 + H.x1) / 2, H.h + 0.1, mz - 0.3); // roof slab (eaves out front)
  const ridge = new THREE.CylinderGeometry(1.5, 1.5, W + 0.7, 3, 1); ridge.rotateZ(Math.PI / 2); ridge.scale(1, 0.5, 1.45); const rm = add(toonMesh(ridge, 0xd8845a), (H.x0 + H.x1) / 2, H.h + 0.55, mz - 0.3);
  add(toonMesh(B3(W + 0.1, 0.18, 0.1), trim), (H.x0 + H.x1) / 2, H.h - 0.1, H.z0 - 0.02); // lintel
  const PC = { Pixel: 0x5aa0ff, Jun: 0xff8fb8, Sage: 0x7fc98a, Mika: 0xb48cff };
  const windows = {}, covers = {};
  H.rooms.forEach(r => { const c = r.cx;
    // banner over the opening in the persona colour
    add(toonMesh(B3(1.6, 0.42, 0.06), PC[r.who]), c, H.h - 0.45, H.z0 - 0.08);
    // window frame on the back wall (glow panes are separate, unbaked)
    [[0, 1.95, 1.3, 0.1], [0, 1.95 - 0.5, 1.3, 0.1], [0, 1.95 + 0.5, 1.3, 0.1]].forEach(([dx, yy, w, h]) => { add(toonMesh(B3(w, h, 0.22), trim), c + dx, yy, H.z1); });
    [-0.65, 0, 0.65].forEach(dx => add(toonMesh(B3(0.1, 1.1, 0.22), trim), c + dx, 1.95, H.z1));
    const gm = glowMat(0xffc46e, true); const pg = new THREE.PlaneGeometry(1.2, 0.9); const a = pg.clone(); a.translate(0, 0, -0.09); const b = pg.clone(); b.rotateY(Math.PI); b.translate(0, 0, 0.09);
    const win = new THREE.Mesh(new THREE.BufferGeometry().copy(mergeTwo(a, b)), gm); win.position.set(c, 1.95, H.z1); win.userData.dynamic = true; scene.add(win); windows[r.who] = win;
    // bed along the back wall: frame, mattress, pillow, blanket in persona colour
    const bz = H.z1 - 0.85; add(toonMesh(B3(3.0, 0.32, 1.35), 0x9c6b45), c, 0.32, bz); add(toonMesh(B3(2.9, 0.18, 1.25), 0xfaf4ea), c, 0.56, bz);
    add(toonMesh(B3(0.12, 0.8, 1.4), 0x8a5a36), c - 1.5, 0.5, bz); add(toonMesh(B3(0.6, 0.16, 0.9), 0xffffff), c - 1.1, 0.72, bz);
    add(toonMesh(B3(1.9, 0.08, 1.3), PC[r.who]), c + 0.45, 0.67, bz);
    { const cg = new THREE.CylinderGeometry(0.62, 0.62, 2.0, 12, 1, false, 0, Math.PI); cg.rotateZ(Math.PI / 2); cg.rotateX(-Math.PI / 2); cg.scale(1, 0.62, 1.05); // tucked-in blanket over a sleeper
      const cv = toonMesh(cg, PC[r.who]); cv.position.set(c + 0.55, 0.66, bz); cv.rotation.x = Math.PI / 2; cv.visible = false; cv.userData.dynamic = true; scene.add(cv); covers[r.who] = cv; }
    add(toonMesh(new THREE.CylinderGeometry(0.6, 0.6, 0.02, 14), 0xf0d8b0, { outline: false }), c + 0.2, 0.135, H.z0 + 1.2); // rug
    cast(c, bz, 3.0, 1.35, 0, 0.14, 0.6);
    // persona corner (against the left partition, front half of the room)
    const lx = r.x0 + 0.1, fz = H.z0 + 0.9;
    if (r.who === 'Pixel') { add(toonMesh(B3(0.5, 0.55, 1.3), 0x6b4a8a), lx + 0.25, 0.4, fz); add(toonMesh(B3(0.08, 0.7, 1.15), 0x232838), lx + 0.42, 1.05, fz);
      const scr = new THREE.Mesh(B3(0.01, 0.58, 1.02), new THREE.MeshBasicMaterial({ color: 0x7fe0ff })); add(scr, lx + 0.47, 1.05, fz);
      add(toonMesh(B3(0.3, 0.08, 0.22), 0xffffff), lx + 0.3, 0.71, fz - 0.35); add(toonMesh(new THREE.SphereGeometry(0.5, 10, 8).scale(1, 0.55, 1), 0xff9a5a), lx + 1.4, 0.38, fz + 0.1);
      add(toonMesh(B3(0.22, 0.06, 0.14), 0x3a3f55), lx + 1.25, 0.67, fz + 0.05); }
    if (r.who === 'Jun') { const e = new THREE.Group(); [[-0.3, 0.22], [0.3, 0.22], [0, -0.3]].forEach(([dx, dz]) => { const l = toonMesh(B3(0.06, 1.9, 0.06), 0xb98250); l.position.set(dx, 0.95, dz); l.rotation.set(dz * 0.4, 0, -dx * 0.25); e.add(l); });
      const cv = toonMesh(B3(0.95, 1.0, 0.05), 0xfffaf0); cv.position.set(0, 1.45, 0.05); cv.rotation.x = -0.12; e.add(cv);
      [[0xff8fb8, -0.2, 1.6], [0x7fc4ff, 0.18, 1.35], [0xffd166, 0.05, 1.7], [0x7fc98a, -0.15, 1.25]].forEach(([col, dx, yy]) => { const d = toonMesh(new THREE.CircleGeometry(0.15, 8), col, { outline: false }); d.position.set(dx, yy, 0.085); d.rotation.x = -0.12; e.add(d); });
      e.position.set(lx + 0.75, 0.12, fz); e.rotation.y = Math.PI / 2 + 0.25; g.add(e); add(toonMesh(new THREE.CylinderGeometry(0.22, 0.2, 0.5, 8), 0x9c6b45), lx + 1.5, 0.37, fz + 0.5);
      add(toonMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 10), 0xf0e0c0), lx + 1.5, 0.64, fz + 0.5); }
    if (r.who === 'Sage') { add(toonMesh(B3(0.42, 2.3, 1.7), 0x8a5a36), lx + 0.22, 1.27, fz + 0.2);
      for (let sh = 0; sh < 4; sh++) for (let k = 0; k < 7; k++) { const hh = 0.3 + rnd() * 0.12; add(toonMesh(B3(0.3, hh, 0.16), [0xd9534f, 0x5aa0ff, 0xffd166, 0x7fc98a, 0xb48cff, 0xf6a05a][(sh * 7 + k) % 6], { outline: false }), lx + 0.3, 0.38 + sh * 0.55 + hh / 2, fz + 0.2 - 0.6 + k * 0.2); }
      add(toonMesh(new THREE.CylinderGeometry(0.04, 0.04, 1.4, 6), 0x6b6b6b), lx + 1.2, 0.82, fz + 0.9); add(toonMesh(new THREE.ConeGeometry(0.3, 0.3, 10, 1, true), 0xfff0c8), lx + 1.2, 1.6, fz + 0.9);
      add(toonMesh(B3(0.7, 0.42, 0.7), 0x7fc98a), lx + 1.3, 0.33, fz - 0.1); }
    if (r.who === 'Mika') { [0, 1].forEach(k => { add(toonMesh(B3(0.45, 0.8, 0.45), 0x2b2d3a), lx + 0.3, 0.52, fz - 0.45 + k * 1.3); add(toonMesh(new THREE.CylinderGeometry(0.13, 0.13, 0.05, 12).rotateZ(Math.PI / 2), 0x8a8fa8), lx + 0.53, 0.62, fz - 0.45 + k * 1.3); });
      add(toonMesh(B3(0.05, 0.75, 0.05), 0x5a5a66), lx + 0.9, 0.5, fz + 0.2); add(toonMesh(B3(0.36, 0.06, 1.05), 0x2b2d3a), lx + 0.9, 0.9, fz + 0.2); add(toonMesh(B3(0.2, 0.02, 0.95), 0xffffff, { outline: false }), lx + 0.82, 0.94, fz + 0.2);
      const gt = new THREE.Group(); const b1 = toonMesh(new THREE.SphereGeometry(0.26, 10, 8).scale(1, 1, 0.35), 0xf29b4a); b1.position.y = 0.35; gt.add(b1); const b2 = toonMesh(new THREE.SphereGeometry(0.2, 10, 8).scale(1, 1, 0.35), 0xf29b4a); b2.position.y = 0.67; gt.add(b2);
      const nk = toonMesh(B3(0.07, 0.75, 0.04), 0x6b4226); nk.position.y = 1.1; gt.add(nk); gt.position.set(lx + 1.6, 0.12, H.z1 - 1.75); gt.rotation.set(-0.2, 0.3, 0.12); g.add(gt); }
  });
  // ---- campfire: stone ring, logs, benches
  for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; add(toonMesh(new THREE.DodecahedronGeometry(0.2, 0), 0xa9a296), FIRE.x + Math.cos(a) * 0.62, 0.1, FIRE.z + Math.sin(a) * 0.62, a); }
  [0, 1.1, 2.2].forEach(a => { const l = toonMesh(new THREE.CylinderGeometry(0.08, 0.08, 0.9, 6), 0x7a4a2a); l.rotation.set(Math.PI / 2 - 0.35, a, 0); add(l, FIRE.x, 0.2, FIRE.z, a); l.rotation.set(1.2, a, 0); });
  FIRE.logs.forEach(L => { const l = toonMesh(new THREE.CylinderGeometry(0.28, 0.3, 1.7, 9), 0x9c6b45); l.rotation.z = Math.PI / 2; const w = new THREE.Group(); w.add(l); w.position.set(L.x, 0.28, L.z); w.rotation.y = -L.a; g.add(w);
    cast(L.x, L.z, 1.8, 0.6, -L.a, 0.015, 0.4); });
  // ---- garden: raised bed with veggies + flowers, little fence
  add(toonMesh(B3(GARDEN.w, 0.3, GARDEN.d), 0x9c6b45), GARDEN.x, 0.15, GARDEN.z); add(toonMesh(B3(GARDEN.w - 0.2, 0.06, GARDEN.d - 0.2), 0x6b4a32, { outline: false }), GARDEN.x, 0.31, GARDEN.z);
  for (let i = 0; i < 10; i++) { const x = GARDEN.x - GARDEN.w / 2 + 0.35 + (i % 5) * 0.48, z = GARDEN.z + (i < 5 ? -0.35 : 0.35);
    add(toonMesh(new THREE.SphereGeometry(0.17, 7, 5), [0x5fb550, 0x7fd35a][i % 2]), x, 0.45, z); if (i % 3 === 0) add(toonMesh(new THREE.SphereGeometry(0.08, 6, 4), 0xff6a4a), x + 0.08, 0.55, z); }
  for (let i = 0; i < 24; i++) { const a = rnd() * 6.28, rr = 3 + rnd() * (R - 4.5); const x = cx + Math.cos(a) * rr, z = cz + Math.sin(a) * rr; if (z > HOUSE.z0 - 1.5 || Math.abs(x - 2) < 1.0 || Math.hypot(x - FIRE.x, z - FIRE.z) < 2.8) continue;
    add(toonMesh(new THREE.SphereGeometry(0.09, 6, 4), [0xffd166, 0xff8fb8, 0xffffff, 0xb48cff][i % 4], { outline: false }), x, 0.12, z); }
  for (let i = 0; i < 12; i++) { const a = rnd() * 6.28, r2 = R - 1.0 + rnd() * 0.4; const x = cx + Math.cos(a) * r2, z = cz + Math.sin(a) * r2; if (Math.abs(x - 2) < 2.2 && z < cz) continue; if (z > HOUSE.z0 - 0.6 && Math.abs(x - cx) < 8.2) continue;
    const b = toonMesh(new THREE.SphereGeometry(0.55 + rnd() * 0.3, 8, 6), 0x5fb550); b.scale.y = 0.75; add(b, x, 0.25, z); }
  // ---- lanterns: four at the bridge ends, two by the house path, one per room under the eave
  const LAN = [[BRIDGE.x - 1.7, 15.9], [BRIDGE.x + 1.7, 15.9], [BRIDGE.x - 1.7, 24.1], [BRIDGE.x + 1.7, 24.1], [cx - 1.4, cz - 0.4], [cx + 1.4, cz - 0.4]];
  const lanMat = glowMat(0xffc46e); const lanGeo = []; const halos = [];
  LAN.forEach(([x, z]) => { add(toonMesh(new THREE.CylinderGeometry(0.06, 0.08, 2.1, 6), 0x5a4030), x, 1.05, z); add(toonMesh(B3(0.36, 0.06, 0.36), 0x5a4030), x, 2.37, z);
    const lg = B3(0.26, 0.3, 0.26); lg.translate(x, 2.18, z); lanGeo.push(lg); halos.push([x, 2.18, z, 1.2]); });
  H.rooms.forEach(r => { const lg = B3(0.22, 0.26, 0.22); lg.translate(r.cx + 1.3, H.h - 0.4, H.z0 - 0.35); lanGeo.push(lg); halos.push([r.cx + 1.3, H.h - 0.4, H.z0 - 0.35, 1.0]); add(toonMesh(B3(0.02, 0.25, 0.02), 0x333333, { outline: false }), r.cx + 1.3, H.h - 0.15, H.z0 - 0.35); });
  const lanterns = new THREE.Mesh(mergeAll(lanGeo), lanMat); lanterns.userData.dynamic = true; scene.add(lanterns);
  halos.push([FIRE.x, 0.7, FIRE.z, 2.6]);
  const halo = glowPoints(scene, halos, { size: 70, color: 0xffb860 });
  // ---- campfire flames (unbaked, flicker) + always-on soft glow
  const flameMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uNight: dayUniforms.uNight },
    vertexShader: `uniform float uTime; varying float vY; void main(){ vY = position.y; vec3 p = position; float f = sin(uTime*9.0 + position.y*6.0)*0.06*position.y; p.x += f; p.z += cos(uTime*7.0+position.y*5.0)*0.05*position.y; p.y *= 0.85 + 0.15*sin(uTime*11.0); gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0); }`,
    fragmentShader: `uniform float uNight; varying float vY; void main(){ vec3 c = mix(vec3(1.0,0.75,0.25), vec3(1.0,0.35,0.1), clamp(vY*1.4,0.0,1.0)); gl_FragColor = vec4(c*(0.75+0.5*uNight), 1.0); }` });
  const fl = mergeAll([0, 1, 2].map(i => { const c = new THREE.ConeGeometry(0.22 - i * 0.04, 0.75 - i * 0.12, 7, 1, true); c.translate(Math.cos(i * 2.1) * 0.1, (0.75 - i * 0.12) / 2, Math.sin(i * 2.1) * 0.1); return c; }));
  const flames = new THREE.Mesh(fl, flameMat); flames.position.set(FIRE.x, 0.15, FIRE.z); flames.userData.dynamic = true; scene.add(flames);
  const flies = fireflies(scene, { cx: GARDEN.x + 1, cz: GARDEN.z - 0.5, r: 3.2, n: 28, seed: 23 });
  cast(cx, mz, W + 0.6, D + 1.0, 0, 0.012, 0.5);
  scene.add(g); bake(g);
  return { group: g, windows, covers, halo, flames, flies,
    update(t) { flameMat.uniforms.uTime.value = t; halo.material.uniforms.uTime.value = t; } };
}
function mergeTwo(a, b) { return mergeAll([a, b]); }
function mergeAll(list) { const pos = [], nor = []; list.forEach(gm => { const n = gm.index ? gm.toNonIndexed() : gm; pos.push(...n.attributes.position.array); if (n.attributes.normal) nor.push(...n.attributes.normal.array); });
  const out = new THREE.BufferGeometry(); out.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); if (nor.length === pos.length) out.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); return out; }
