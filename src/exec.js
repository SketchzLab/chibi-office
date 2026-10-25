// v23 executive wing: Sage's manager office + Calvin's founder/CEO corner office on the north-east lobe.
// Everything static is baked (1 toon fill + 1 outline + 1 basic mesh); all glass panes share ONE merged transparent mesh and
// both name signs ONE merged textured mesh, so the whole wing costs ~5 draw calls (+3 for the glow sprites of Sage's desk).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toonMesh, occPatch } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { glowPoints, dayUniforms } from './daycycle.js';
import { desk, plant, bookshelf } from './props.js';
import { TERRACE, EXEC, SAGE_OFF, CEO_OFF, ROOM_H, CORR, BACK_Z } from './layout.js';
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const RB = (w, h, d, r = 0.06, seg = 1) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
const FRAME = 0x3f6f6a, WALL = 0xf6f3ec, TEAL = 0x4fb3a9, WALNUT = 0x9a6a45, GOLD = 0xe8b84a;
function signTexture() { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 256; const x = cv.getContext('2d');
  [['Sage', 'Manager', '#3f6f6a', 0], ['Calvin', 'Founder & CEO', '#7a4a2a', 128]].forEach(([n, t, c, oy]) => {
    x.fillStyle = '#fbf6ea'; x.fillRect(0, oy, 1024, 128); x.strokeStyle = c; x.lineWidth = 10; x.strokeRect(8, oy + 8, 1008, 112);
    x.fillStyle = c; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 58px system-ui, sans-serif'; x.fillText(`${n} — ${t}`, 512, oy + 66, 960); });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function makeExec(scene) {
  const g = new THREE.Group(); g.name = 'exec'; const panes = [], signs = [], roofs = [];
  const M = (geo, col, x, y, z, o = {}) => { geo.computeBoundingBox(); const bs = geo.boundingBox.getSize(new THREE.Vector3()).multiply(new THREE.Vector3(...(o.s || [1, 1, 1]))); const m = toonMesh(geo, col, { outline: (o.outline ?? true) && Math.max(bs.x, bs.y, bs.z) > 0.4 }); /* perf: no outline shell on small props */ m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.r) m.rotation.set(...o.r); if (o.s) m.scale.set(...o.s); g.add(m); return m; };
  const pane = (w, h, x, y, z, ry = 0) => { const q = new THREE.PlaneGeometry(w, h); if (ry) q.rotateY(ry); q.translate(x, y, z); panes.push(q); };
  // ---- shared floor details: plank seams + a light runner from the lawn to both doors ----
  const ew = EXEC.x1 - EXEC.x0, ecx = (EXEC.x0 + EXEC.x1) / 2, ecz = (EXEC.z0 + EXEC.z1) / 2, ed = EXEC.z1 - EXEC.z0;
  for (let x = EXEC.x0 + 1; x < EXEC.x1; x += 1.0) M(B(0.03, 0.01, ed), 0xb98250, x, 0.006, ecz, { outline: false });
  M(B(ew - 0.4, 0.012, 1.3), 0xf0c995, ecx, 0.01, -18.6, { outline: false });
  M(B(CORR.x1 - CORR.x0 - 0.3, 0.012, 6.0), 0xf0c995, (CORR.x0 + CORR.x1) / 2, 0.011, EXEC.z1 - 3.0, { outline: false }); // runner: corridor -> deck runner
  // ---- one room: frame posts + top beam + baseboard + glass, door gap in the south wall ----
  // solid = [[side, from, to, height]] lower wall panels (wainscot) instead of glass-to-floor
  function room(R, { wains = 0 } = {}) { const { x0, x1, z0, z1, door } = R, H = ROOM_H, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    const segs = [['n', x0, x1], ['w', z0, z1], ['e', z0, z1], ['s', x0, door[0]], ['s', door[1], x1]];
    for (const [side, a, b] of segs) { const L = b - a, m = (a + b) / 2, along = side === 'n' || side === 's', z = side === 'n' ? z0 : z1, x = side === 'w' ? x0 : x1;
      const px = along ? m : x, pz = along ? z : m, ry = along ? 0 : Math.PI / 2, sx = along ? L : 0.12, sz = along ? 0.12 : L;
      M(B(sx + 0.02, 0.14, sz + 0.02), FRAME, px, 0.07, pz, { outline: false }); // baseboard
      const wh = wains && side !== 'n' && side !== 'e' ? wains : 0; // sea-facing walls (north, east) are floor-to-ceiling windows
      if (wh) { M(B(sx, wh, sz), WALL, px, wh / 2, pz); M(B(sx + 0.06, 0.08, sz + 0.06), TEAL, px, wh + 0.04, pz, { outline: false }); }
      pane(L, H - 0.14 - wh, px, wh + 0.14 + (H - 0.14 - wh) / 2, pz, ry);
      const n = Math.max(1, Math.round(L / 1.6)); for (let i = 0; i <= n; i++) { const t = a + L * i / n; M(B(0.08, H, 0.08), FRAME, along ? t : x, H / 2, along ? z : t, { outline: false }); } // mullions
      M(B(along ? L + 0.08 : 0.1, 0.1, along ? 0.1 : L + 0.08), FRAME, px, H, pz); } // top beam
    M(B(door[1] - door[0] + 0.08, 0.1, 0.1), FRAME, (door[0] + door[1]) / 2, H, z1); // beam over the door gap (H 3.4 clears every crown)
    M(B(door[1] - door[0] - 0.2, 0.02, 0.7), FRAME, (door[0] + door[1]) / 2, 0.012, z1 + 0.45, { outline: false }); // door mat
    // v23d skylight roof (matches the corridor): white eave ring with teal edging, glass in the middle with mullions (fades like the walls)
    { const w = x1 - x0, d = z1 - z0, e = 0.55, y = H + 0.1;
      [[cx, z0 + e / 2 - 0.1, w + 0.3, e + 0.2], [cx, z1 - e / 2 + 0.1, w + 0.3, e + 0.2]].forEach(([x, z, a, b]) => M(B(a, 0.12, b), WALL, x, y, z));
      [[x0 + e / 2 - 0.1, cz], [x1 - e / 2 + 0.1, cz]].forEach(([x, z]) => M(B(e + 0.2, 0.12, d - 2 * e + 0.2), WALL, x, y, z));
      [[cx, z0 - 0.15, w + 0.36, 0.08], [cx, z1 + 0.15, w + 0.36, 0.08]].forEach(([x, z, a, b]) => M(B(a, 0.2, b), TEAL, x, y - 0.02, z, { outline: false }));
      [x0 - 0.15, x1 + 0.15].forEach(x => M(B(0.08, 0.2, d + 0.36), TEAL, x, y - 0.02, cz, { outline: false }));
      const sk = new THREE.PlaneGeometry(w - 2 * e + 0.2, d - 2 * e + 0.2); sk.rotateX(-Math.PI / 2); sk.translate(cx, y + 0.02, cz); panes.push(sk); roofs.push(sk.clone());
      const n = Math.max(1, Math.round((w - 2 * e) / 1.6)); for (let i = 1; i < n; i++) M(B(0.07, 0.07, d - 2 * e + 0.2), FRAME, x0 + e + (w - 2 * e) * i / n, y + 0.02, cz, { outline: false });
      M(B(w - 2 * e + 0.2, 0.07, 0.07), FRAME, cx, y + 0.02, cz, { outline: false }); } }
  room(SAGE_OFF); room(CEO_OFF, { wains: 0.95 });
  // ---- v23b glass corridor from the office's back-right corner to the deck: same frame/glass/wainscot as the rooms, teal trim like the office ----
  { const H = ROOM_H, wh = 0.95, C = CORR;
    const side = (x, a, b) => { const L = b - a, m = (a + b) / 2;
      M(B(0.14, 0.14, L + 0.02), FRAME, x, 0.07, m, { outline: false }); M(B(0.12, wh, L), WALL, x, wh / 2, m); M(B(0.18, 0.08, L + 0.06), TEAL, x, wh + 0.04, m, { outline: false });
      pane(L, H - wh, x, wh + (H - wh) / 2, m, Math.PI / 2);
      const n = Math.max(1, Math.round(L / 1.6)); for (let i = 0; i <= n; i++) M(B(0.08, H, 0.08), FRAME, x, H / 2, a + L * i / n, { outline: false });
      M(B(0.1, 0.1, L + 0.08), FRAME, x, H, m); };
    side(C.x0, C.z0, C.wN); M(B(0.1, 0.1, BACK_Z - C.wN + 0.08), FRAME, C.x0, H, (C.wN + BACK_Z) / 2); // doorway to the roof stairs
    side(C.x1, C.z0, C.z1 - 0.5); // east (exterior) wall: continuous glass, closed down to the lawn mouth
    // roof: solid white eaves with teal fascia along both sides + a glass skylight between (fades like the walls so Calvin stays visible)
    { const L = C.z1 - C.z0, m = (C.z0 + C.z1) / 2, w = C.x1 - C.x0, eave = 0.5;
      [[C.x0, 1], [C.x1, -1]].forEach(([x, k]) => { M(B(eave + 0.2, 0.12, L + 0.3), WALL, x + k * (eave / 2 - 0.1), H + 0.1, m); M(B(0.1, 0.22, L + 0.3), TEAL, x - k * 0.15, H + 0.08, m, { outline: false }); });
      [C.z0, C.z1].forEach(z => M(B(w + 0.3, 0.12, 0.3), WALL, (C.x0 + C.x1) / 2, H + 0.1, z)); // end caps
      const sk = new THREE.PlaneGeometry(w - 2 * eave + 0.2, L - 0.3); sk.rotateX(-Math.PI / 2); sk.translate((C.x0 + C.x1) / 2, H + 0.12, m); panes.push(sk); roofs.push(sk.clone());
      // ceiling light strip: pale by day, warm glow at night
      const strip = new THREE.Mesh(B(0.16, 0.05, L - 1.0), new THREE.ShaderMaterial({ uniforms: { uGlow: dayUniforms.uGlow, uNight: dayUniforms.uNight },
        vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float uGlow, uNight; void main(){ vec3 day = mix(vec3(0.97,0.95,0.88), vec3(0.55,0.5,0.42), uNight); gl_FragColor = vec4(mix(day, vec3(1.25,1.02,0.7), uGlow), 1.0); }' }));
      strip.position.set((C.x0 + C.x1) / 2, H - 0.02, m); strip.userData.dynamic = true; scene.add(strip);
      M(B(0.26, 0.04, L - 0.9), FRAME, (C.x0 + C.x1) / 2, H + 0.02, m, { outline: false });
      const halos = []; for (let z = C.z0 + 1.0; z < C.z1 - 0.5; z += 2.0) halos.push([(C.x0 + C.x1) / 2, H - 0.25, z, 1.3]); glowPoints(scene, halos, { size: 60, color: 0xffd08a });
      // 'Executive Suite' sign hung under the north opening, facing the corridor
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 96; const x = cv.getContext('2d'); x.fillStyle = '#2f5a55'; x.fillRect(0, 0, 512, 96); x.strokeStyle = '#e8b84a'; x.lineWidth = 6; x.strokeRect(6, 6, 500, 84);
      x.fillStyle = '#fbf6ea'; x.font = '700 46px system-ui, sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('Executive Suite', 256, 50, 480);
      const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4;
      const sgn = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.39), occPatch(new THREE.MeshBasicMaterial({ map: tx, side: THREE.DoubleSide }))); sgn.position.set((C.x0 + C.x1) / 2, H - 0.42, C.z0 + 0.12); sgn.userData.dynamic = true; g.add(sgn);
      [-0.8, 0.8].forEach(o => M(B(0.03, 0.2, 0.03), 0x3a3340, (C.x0 + C.x1) / 2 + o, H - 0.12, C.z0 + 0.12, { outline: false })); }
    M(B(0.14, H, 0.14), FRAME, C.x0, H / 2, BACK_Z); // corner post where the office back wall turns north
    for (let z = C.z0; z <= C.z1 - 0.4; z += 1.9) M(B(C.x1 - C.x0 + 0.1, 0.1, 0.12), FRAME, (C.x0 + C.x1) / 2, H, z); // roof ties
    M(B(C.x1 - C.x0 - 0.3, 0.012, C.z1 - C.z0 - 0.6), 0xf0c995, (C.x0 + C.x1) / 2, 0.012, (C.z0 + C.z1) / 2 + 0.2, { outline: false }); // runner (continues to the deck)
    cast((C.x0 + C.x1) / 2, (C.z0 + C.z1) / 2, C.x1 - C.x0 + 0.6, C.z1 - C.z0, 0, 0.015, 0.2); }
  // ---- v23c terrace dressing: planters with hedges, loungers + side table + parasol, potted trees, glowing lamps, stepping stones ----
  { const T = TERRACE, HEDGE = 0x6f9f6a, BOX = 0xb58a5e, GLOW = [];
    T.planters.forEach(([x0, z0, x1, z1]) => { const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2; M(B(w, 0.42, d), BOX, cx, 0.21, cz); M(B(w + 0.06, 0.06, d + 0.06), 0x8a6444, cx, 0.43, cz, { outline: false });
      const n = Math.max(1, Math.round(Math.max(w, d) / 0.7)); for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; M(new THREE.IcosahedronGeometry(0.32 + (i % 2) * 0.05, 0), HEDGE + (i % 2) * 0x050a05, w > d ? x0 + w * t : cx, 0.62, w > d ? cz : z0 + d * t, { r: [i, i * 0.7, 0] }); }
      cast(cx, cz, w + 0.3, d + 0.3); });
    T.loungers.forEach(([x, z]) => { M(RB(0.7, 0.14, 1.75, 0.05), 0xf3ead8, x, 0.36, z + 0.05); M(RB(0.7, 0.12, 0.7, 0.05), 0xf3ead8, x, 0.55, z - 0.72, { r: [0.55, 0, 0] }); M(B(0.76, 0.06, 1.85), WALNUT, x, 0.27, z, { outline: false });
      [[-0.33, -0.85], [0.33, -0.85], [-0.33, 0.85], [0.33, 0.85]].forEach(([a, b]) => M(B(0.06, 0.26, 0.06), WALNUT, x + a, 0.13, z + b, { outline: false })); M(B(0.5, 0.14, 0.3), TEAL, x, 0.72, z - 0.86, { outline: false, r: [0.55, 0, 0] }); cast(x, z, 0.9, 2.0); });
    { const [x, z] = T.table; M(new THREE.CylinderGeometry(0.3, 0.3, 0.05, 12), WALNUT, x, 0.5, z); M(new THREE.CylinderGeometry(0.04, 0.06, 0.48, 6), 0x3a3340, x, 0.25, z, { outline: false }); M(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 8), 0xf6f3ec, x + 0.08, 0.6, z, { outline: false }); cast(x, z, 0.7, 0.7); }
    { const [x, z] = T.parasol; M(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 6), 0xf6f3ec, x, 1.25, z, { outline: false }); M(new THREE.CylinderGeometry(0.28, 0.3, 0.08, 10), 0x3a3340, x, 0.04, z, { outline: false }); M(new THREE.ConeGeometry(1.3, 0.5, 8), 0xe9b9a2, x, 2.55, z); cast(x, z - 0.5, 2.6, 2.6, 0, 0.02, 0.6); }
    T.pots.forEach(([x, z, k]) => { const p = plant(k); p.position.set(x, 0, z); g.add(p); cast(x, z, 1.1, 1.1); });
    T.posts.forEach(([x, z]) => { M(new THREE.CylinderGeometry(0.05, 0.06, 2.0, 6), 0x3a3340, x, 1.0, z, { outline: false }); M(new THREE.CylinderGeometry(0.16, 0.16, 0.06, 8), 0x3a3340, x, 2.32, z, { outline: false }); GLOW.push([x, 2.14, z, 0.26, 0.3]); });
    T.wall.forEach(([x, z]) => { M(B(0.06, 0.06, 0.2), 0x3a3340, x, 2.3, z + 0.1, { outline: false }); GLOW.push([x, 2.3, z + 0.24, 0.16, 0.22]); });
    T.stones.forEach(([x, z], i) => M(new THREE.CylinderGeometry(0.3 + (i % 2) * 0.04, 0.32, 0.04, 9), 0xd8cfbd, x, 0.02, z, { outline: false, ry: i }));
    const lg = mergeGeometries(GLOW.map(([x, y, z, w, h]) => { const q = new THREE.BoxGeometry(w, h, w); q.translate(x, y, z); return q; }));
    const lamps = new THREE.Mesh(lg, new THREE.ShaderMaterial({ uniforms: { uGlow: dayUniforms.uGlow, uNight: dayUniforms.uNight },
      vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform float uGlow, uNight; void main(){ vec3 day = mix(vec3(0.96,0.92,0.8), vec3(0.5,0.46,0.4), uNight); gl_FragColor = vec4(mix(day, vec3(1.3,1.0,0.62), uGlow), 1.0); }' }));
    lamps.userData.dynamic = true; scene.add(lamps); glowPoints(scene, GLOW.map(([x, y, z]) => [x, y, z, 1.5]), { size: 70, color: 0xffc070 }); }
  // ================= Sage's manager office =================
  { const S = SAGE_OFF, [dx, dz] = S.desk;
    M(B(4.2, 0.02, 3.0), 0xdfe9ee, (S.x0 + S.x1) / 2 + 0.4, 0.012, -24.0, { outline: false }); M(B(3.9, 0.02, 2.7), 0xeef3f0, (S.x0 + S.x1) / 2 + 0.4, 0.016, -24.0, { outline: false });
    const d = desk(); d.position.set(dx, 0, dz); d.rotation.y = Math.PI; g.add(d); cast(dx, dz - 0.3, 3.0, 2.6);
    const top = toonMesh(B(2.5, 0.06, 1.25), 0xb07a52, { outline: false }); top.position.y = 0.97; d.add(top);
    const plate = toonMesh(B(0.55, 0.12, 0.08), 0xcfe3dc, { outline: false }); plate.position.set(0.55, 1.06, 0.45); plate.rotation.x = -0.3; d.add(plate);
    const books = [[0x8fbf9a, 0], [0xcdb89a, 0.3], [0x9aa8ff, -0.2]]; books.forEach(([c, r], i) => { const b = toonMesh(B(0.34, 0.05, 0.24), c, { outline: false }); b.position.set(-0.75, 0.99 + i * 0.05, 0.25); b.rotation.y = r; d.add(b); });
    const sh = bookshelf(1.6, 2.2); sh.position.set(S.shelf[0], 0, S.shelf[1]); sh.rotation.y = Math.PI / 2; g.add(sh); cast(S.shelf[0] + 0.3, S.shelf[1], 1.2, 2.0, 0, 0.015, 0.4);
    const pl = plant(1.15); pl.position.set(S.plant[0], 0, S.plant[1]); g.add(pl); cast(S.plant[0], S.plant[1], 1.2, 1.2);
    // guest chair (faces her desk)
    { const [gx, gz] = S.guest, c = new THREE.Group(); c.position.set(gx, 0, gz); c.rotation.y = Math.PI - 0.5;
      const st = toonMesh(RB(0.7, 0.16, 0.66, 0.06), 0x8fbf9a); st.position.y = 0.48; c.add(st); const bk = toonMesh(RB(0.7, 0.6, 0.14, 0.06), 0x7aa886); bk.position.set(0, 0.82, -0.28); c.add(bk);
      [[-0.28, -0.25], [0.28, -0.25], [-0.28, 0.25], [0.28, 0.25]].forEach(([x, z]) => { const l = toonMesh(B(0.06, 0.42, 0.06), 0x8b6b4a, { outline: false }); l.position.set(x, 0.21, z); c.add(l); }); g.add(c); cast(gx, gz, 1.0, 1.0); }
    // wall art + chess set on a side table (her hobby)
    M(B(1.1, 0.7, 0.05), 0xc98d55, 7.4, 2.35, S.z0 + 0.1); M(B(0.95, 0.55, 0.02), 0xbfe0d0, 7.4, 2.35, S.z0 + 0.14, { outline: false });
    M(new THREE.ConeGeometry(0.3, 0.3, 3), 0x7aa886, 7.25, 2.3, S.z0 + 0.16, { outline: false, s: [1, 1, 0.1] });
    { const [qx, qz] = S.chess; M(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 12), WALNUT, qx, 0.62, qz); M(new THREE.CylinderGeometry(0.05, 0.08, 0.6, 6), 0x3a3340, qx, 0.3, qz, { outline: false });
    M(B(0.36, 0.02, 0.36), 0xf4f1ea, qx, 0.66, qz, { outline: false }); [[-0.1, 0x2b2d42], [0.1, 0xf4f1ea]].forEach(([o, c]) => M(new THREE.ConeGeometry(0.04, 0.12, 6), c, qx + o, 0.73, qz + o, { outline: false })); }
    // name sign beside the door (outside face)
    signs.push([0, (S.x0 + S.door[0]) / 2, 2.35, S.z1 + 0.09, 2.1]); M(B(2.24, 0.42, 0.06), 0xc98d55, (S.x0 + S.door[0]) / 2, 2.35, S.z1 + 0.04); }
  // ================= Calvin's founder/CEO corner office =================
  { const C = CEO_OFF, [dx, dz] = C.desk, rc = [(C.x0 + C.x1) / 2, (C.z0 + C.z1) / 2];
    // big rug + executive desk (walnut slab, modesty panel, two monitors, gold nameplate, globe, trophy)
    M(new THREE.CylinderGeometry(2.0, 2.0, 0.02, 20), 0xb85a50, dx, 0.012, dz + 0.1, { outline: false, s: [1.25, 1, 0.9] }); M(new THREE.CylinderGeometry(1.8, 1.8, 0.02, 20), 0xd98a6a, dx, 0.016, dz + 0.1, { outline: false, s: [1.25, 1, 0.9] });
    M(RB(3.0, 0.1, 1.35, 0.04), WALNUT, dx, 0.92, dz); [-1.35, 1.35].forEach(o => M(B(0.14, 0.87, 1.2), 0x7a5236, dx + o, 0.435, dz)); M(B(2.6, 0.6, 0.08), 0x7a5236, dx, 0.52, dz + 0.5, { outline: false });
    [[-0.55, 0], [0.55, -0.25]].forEach(([o, r]) => { M(B(0.95, 0.58, 0.06), 0x2b2d42, dx + o, 1.45, dz + 0.3, { ry: r }); const s = new THREE.Mesh(B(0.86, 0.5, 0.01), new THREE.MeshBasicMaterial({ color: 0xa8ecff })); s.position.set(dx + o - Math.sin(r) * 0.04, 1.45, dz + 0.26 - Math.cos(r) * 0.01); s.rotation.y = r; g.add(s); M(B(0.07, 0.4, 0.07), 0x2b2d42, dx + o, 1.08, dz + 0.32, { outline: false }); });
    M(B(0.7, 0.04, 0.22), 0xdddde8, dx, 0.99, dz - 0.15, { outline: false }); M(B(0.6, 0.13, 0.08), GOLD, dx - 0.9, 1.04, dz - 0.55, { r: [-0.3, 0, 0], outline: false });
    M(new THREE.CylinderGeometry(0.06, 0.1, 0.12, 8), 0x7a5236, dx + 1.15, 1.03, dz - 0.1); M(new THREE.SphereGeometry(0.17, 8, 6), 0x7ac8e0, dx + 1.15, 1.25, dz - 0.1); M(new THREE.TorusGeometry(0.19, 0.012, 4, 14), GOLD, dx + 1.15, 1.25, dz - 0.1, { outline: false, r: [0, 0.4, 0.4] });
    M(new THREE.CylinderGeometry(0.11, 0.05, 0.18, 8), GOLD, dx - 1.25, 1.07, dz + 0.3); cast(dx, dz, 3.6, 2.4);
    // executive chair (high back, warm leather)
    { const c = new THREE.Group(); c.position.set(dx, 0, dz - 1.15); const L = 0x6a4a58;
      const st = toonMesh(RB(0.82, 0.18, 0.78, 0.07), L); st.position.y = 0.55; c.add(st); const bk = toonMesh(RB(0.84, 1.15, 0.16, 0.08), 0x5a3e4a); bk.position.set(0, 1.2, -0.36); c.add(bk);
      [-1, 1].forEach(k => { const a = toonMesh(B(0.12, 0.08, 0.6), 0x3a3340, { outline: false }); a.position.set(k * 0.45, 0.82, 0); c.add(a); });
      const pole = toonMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 6), 0x333344, { outline: false }); pole.position.y = 0.27; c.add(pole); const base = toonMesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 10), 0x333344, { outline: false }); base.position.y = 0.03; c.add(base); g.add(c); }
    // lounge corner: sofa against the west wall, coffee table, armchair
    { const [sx, sz] = C.sofa, s = new THREE.Group(); s.position.set(sx, 0, sz); s.rotation.y = Math.PI / 2; const S1 = 0x8a7aa8, S2 = 0x76689a; const w = 2.6;
      const base = toonMesh(RB(w, 0.45, 0.9, 0.1), S1); base.position.y = 0.25; s.add(base); const back = toonMesh(RB(w, 0.62, 0.25, 0.1), S2); back.position.set(0, 0.7, -0.35); s.add(back);
      [-1, 1].forEach(k => { const arm = toonMesh(RB(0.24, 0.55, 0.9, 0.1), S2); arm.position.set(k * (w / 2 - 0.05), 0.4, 0); s.add(arm); });
      [[-0.6, 0xfff1d8], [0.65, 0xffc98a]].forEach(([x, c]) => { const cu = toonMesh(B(0.48, 0.42, 0.15), c); cu.position.set(x, 0.75, -0.18); cu.rotation.x = 0.25; s.add(cu); }); g.add(s); cast(sx, sz, 1.6, 3.0); }
    { const [tx, tz] = C.table; M(B(3.0, 0.02, 2.4), 0xe9dcc0, tx - 0.3, 0.012, tz, { outline: false }); M(B(1.2, 0.08, 0.75), WALNUT, tx, 0.44, tz); [[-0.5, -0.28], [0.5, -0.28], [-0.5, 0.28], [0.5, 0.28]].forEach(([a, b]) => M(B(0.06, 0.4, 0.06), 0x3a3340, tx + a, 0.2, tz + b, { outline: false }));
      M(B(0.32, 0.05, 0.24), 0xff8a7a, tx - 0.2, 0.505, tz, { outline: false }); M(new THREE.CylinderGeometry(0.07, 0.06, 0.12, 8), 0xffffff, tx + 0.3, 0.54, tz + 0.1, { outline: false }); cast(tx, tz, 1.6, 1.1); }
    { const [ax, az] = C.arm, a = new THREE.Group(); a.position.set(ax, 0, az); a.rotation.y = Math.PI - 0.6;
      const ab = toonMesh(RB(0.9, 0.45, 0.85, 0.12), 0xd9a46a); ab.position.y = 0.25; a.add(ab); const abk = toonMesh(RB(0.9, 0.6, 0.22, 0.1), 0xc98d55); abk.position.set(0, 0.7, -0.33); a.add(abk); g.add(a); cast(ax, az, 1.1, 1.1); }
    // bookshelves on the north wall, plants, wall art, floor lamp
    [[C.shelf[0], C.shelf[1]]].forEach(([x, z]) => { const b = bookshelf(1.6, 2.2); b.position.set(x, 0, z); g.add(b); cast(x, z + 0.3, 1.9, 1.0, 0, 0.015, 0.4); });
    C.plants.forEach(([x, z], i) => { const p = plant(i ? 1.0 : 1.35); p.position.set(x, 0, z); g.add(p); cast(x, z, 1.2, 1.2); });
    M(B(1.4, 0.9, 0.05), 0xc98d55, rc[0] + 3.2, 2.45, C.z0 + 0.1); M(B(1.25, 0.75, 0.02), 0xffd8a8, rc[0] + 3.2, 2.45, C.z0 + 0.14, { outline: false }); M(new THREE.CircleGeometry(0.16, 12), 0xff9b7a, rc[0] + 3.55, 2.6, C.z0 + 0.16, { outline: false });
    M(new THREE.ConeGeometry(0.42, 0.45, 3), 0x7aa886, rc[0] + 2.95, 2.3, C.z0 + 0.16, { outline: false, s: [1, 1, 0.1] });
    { const [lx, lz] = C.lamp; M(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 6), 0x3a3340, lx, 1.0, lz, { outline: false }); M(new THREE.CylinderGeometry(0.22, 0.26, 0.05, 10), 0x3a3340, lx, 0.03, lz);
    M(new THREE.ConeGeometry(0.34, 0.4, 12, 1, true), 0xffe2b0, lx, 2.05, lz, { emissive: 0x553311 }); }
    // name sign on the wainscot glass beside the door (outside face)
    const sx = (C.door[1] + C.x1) / 2; signs.push([1, sx, 1.65, C.z1 + 0.1, 2.6]); M(B(2.76, 0.52, 0.06), 0x7a5236, sx, 1.65, C.z1 + 0.05); }
  // ---- glass (one merged transparent mesh) + signs (one merged textured mesh) ----
  const glass = new THREE.Mesh(mergeGeometries(panes), occPatch(new THREE.MeshBasicMaterial({ color: 0xbfe9f2, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide }))); glass.name = 'execGlass'; glass.userData.dynamic = true; g.add(glass);
  const sg = signs.map(([row, x, y, z, w]) => { const q = new THREE.PlaneGeometry(w, w / 8 * 1.6); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, (1 - row) * 0.5 + uv.getY(i) * 0.5); q.translate(x, y, z); return q; });
  const sm = new THREE.Mesh(mergeGeometries(sg), occPatch(new THREE.MeshBasicMaterial({ map: signTexture() }))); sm.name = 'execSigns'; sm.userData.dynamic = true; g.add(sm);
  g.userData.roofGeo = mergeGeometries(roofs); scene.add(g); bake(g); return g;
}
