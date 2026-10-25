// v26 cozy café on the north-west lobe: warm wood, a serving counter (coffee machine, pastry case, menu board), tables + a booth,
// pendant lamps that glow at night and a string-lit patio with parasols. Like exec.js everything static is baked; glass panes,
// signs, lamp bulbs and glow sprites are one merged mesh each, so the café costs only a handful of draw calls.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toonMesh, occPatch } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { glowPoints, dayUniforms } from './daycycle.js';
import { CAFE } from './layout.js';
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d), CY = (rt, rb, h, s = 10) => new THREE.CylinderGeometry(rt, rb, h, s);
const WOOD = 0xb9784a, DARK = 0x6e4129, HONEY = 0xd9a066, CREAM = 0xf5e6cc, PLASTER = 0xf0dcbc, LEATHER = 0xb5523b, TERRA = 0xd9744a, SAGEG = 0x8fb98a;
function signTexture() { const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const x = cv.getContext('2d');
  // top half: outdoor sign; bottom half: chalk menu board
  x.fillStyle = '#6e4129'; x.fillRect(0, 0, 1024, 256); x.strokeStyle = '#f5d9a8'; x.lineWidth = 10; x.strokeRect(10, 10, 1004, 236);
  x.fillStyle = '#ffe9c2'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.font = '700 92px Georgia, serif'; x.fillText('☕ Cozy Corner Café', 512, 132, 960);
  x.fillStyle = '#2f3a33'; x.fillRect(0, 256, 1024, 256); x.strokeStyle = '#b9784a'; x.lineWidth = 14; x.strokeRect(7, 263, 1010, 242);
  x.fillStyle = '#f4efe2'; x.font = '700 50px Georgia, serif'; x.fillText('MENU', 512, 300); x.font = '34px Georgia, serif'; x.textAlign = 'left';
  [['Latte', '4.5'], ['Flat white', '4.0'], ['Matcha', '4.8'], ['Croissant', '3.2']].forEach(([n, p], i) => { x.fillText(n, 70 + (i % 2) * 480, 370 + (i >> 1) * 64); x.fillText(p, 380 + (i % 2) * 480, 370 + (i >> 1) * 64); });
  x.textAlign = 'center'; x.fillStyle = '#f5c26b'; x.font = 'italic 30px Georgia, serif'; x.fillText('Soup of the day · Lunch set 11:30–14:00', 512, 480);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function makeCafe(scene) {
  const g = new THREE.Group(); g.name = 'cafe'; const gi = new THREE.Group(); gi.name = 'cafeInterior'; let cur = g; const panes = [], roofs = [], GLOW = [], halos = [], WIRE = [];
  const M = (geo, col, x, y, z, o = {}) => { geo.computeBoundingBox(); const bs = geo.boundingBox.getSize(new THREE.Vector3()); const m = toonMesh(geo, col, { outline: (o.outline ?? true) && Math.max(bs.x, bs.y, bs.z) > 0.4 }); m.position.set(x, y, z); if (o.ry) m.rotation.y = o.ry; if (o.r) m.rotation.set(...o.r); cur.add(m); return m; };
  const pane = (w, h, x, y, z, ry = 0) => { const q = new THREE.PlaneGeometry(w, h); if (ry) q.rotateY(ry); q.translate(x, y, z); panes.push(q); };
  const C = CAFE, { x0, x1, z0, z1, door } = C, H = C.h, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, W = x1 - x0, D = z1 - z0;
  // ---- floor: honey deck + plank seams + rug under the big table ----
  M(B(W + 0.3, 0.16, D + 0.3), HONEY, cx, -0.075, cz, { outline: false });
  for (let x = x0 + 0.9; x < x1 - 0.3; x += 0.9) M(B(0.03, 0.01, D + 0.2), 0xb07a45, x, 0.006, cz, { outline: false });
  M(B(2.6, 0.012, 2.6), 0xc8603f, C.t4[0], 0.01, C.t4[1], { outline: false }); M(B(2.3, 0.014, 2.3), 0xe8c48e, C.t4[0], 0.012, C.t4[1], { outline: false });
  // ---- walls: wood wainscot all round, glass above (south/west/east), solid plaster north wall behind the counter ----
  const wh = 1.0;
  for (const [side, a, b] of [['n', x0, x1], ['w', z0, z1], ['e', z0, z1], ['s', x0, door[0]], ['s', door[1], x1]]) { const L = b - a, m = (a + b) / 2, along = side === 'n' || side === 's', z = side === 'n' ? z0 : z1, x = side === 'w' ? x0 : x1;
    const px = along ? m : x, pz = along ? z : m, ry = along ? 0 : Math.PI / 2, sx = along ? L : 0.14, sz = along ? 0.14 : L;
    if (side === 'n') { M(B(sx, H, sz), PLASTER, px, H / 2, pz); M(B(sx + 0.04, wh, sz + 0.04), WOOD, px, wh / 2, pz, { outline: false }); }
    else { M(B(sx, wh, sz), WOOD, px, wh / 2, pz); pane(L, H - wh, px, wh + (H - wh) / 2, pz, ry);
      const n = Math.max(1, Math.round(L / 1.4)); for (let i = 0; i <= n; i++) { const t = a + L * i / n; M(B(0.1, H, 0.1), DARK, along ? t : x, H / 2, along ? z : t, { outline: false }); } }
    M(B(sx + 0.1, 0.08, sz + 0.1), DARK, px, wh + 0.04, pz, { outline: false }); M(B(along ? L + 0.1 : 0.14, 0.12, along ? 0.14 : L + 0.1), DARK, px, H, pz); }
  M(B(door[1] - door[0] + 0.1, 0.12, 0.14), DARK, (door[0] + door[1]) / 2, H, z1);
  M(B(door[1] - door[0] - 0.3, 0.02, 0.8), 0x8a4a32, (door[0] + door[1]) / 2, 0.012, z1 + 0.5, { outline: false }); // door mat
  // ---- roof: warm wood eave ring + a big skylight (rain streaks on it, fades with the walls) ----
  { const e = 1.0, y = H + 0.1;
    [[cx, z0 + e / 2 - 0.15, W + 0.5, e + 0.3], [cx, z1 - e / 2 + 0.15, W + 0.5, e + 0.3]].forEach(([x, z, a, b]) => M(B(a, 0.14, b), WOOD, x, y, z));
    [[x0 + e / 2 - 0.15, cz], [x1 - e / 2 + 0.15, cz]].forEach(([x, z]) => M(B(e + 0.3, 0.14, D - 2 * e + 0.3), WOOD, x, y, z));
    const sk = new THREE.PlaneGeometry(W - 2 * e + 0.3, D - 2 * e + 0.3); sk.rotateX(-Math.PI / 2); sk.translate(cx, y + 0.02, cz); panes.push(sk); roofs.push(sk.clone());
    for (let i = 1; i < 4; i++) M(B(0.08, 0.08, D - 2 * e + 0.3), DARK, x0 + e + (W - 2 * e) * i / 4, y + 0.03, cz, { outline: false }); }
  // striped awning over the south windows + door
  for (let i = 0; i < 10; i++) { const w = W / 10; M(B(w + 0.01, 0.05, 1.0), i % 2 ? CREAM : TERRA, x0 + w * (i + 0.5), H - 0.35, z1 + 0.45, { outline: false, r: [0.38, 0, 0] }); }
  cur = gi; // ---- interior LOD group (furniture, counter, wares): hidden from far away (overview) where it is a few pixels through the skylight
  // ---- serving counter: wood base + light top, coffee machine, pastry case, register; back shelf + menu board ----
  { const [a, b, c, d] = C.counter, w = c - a, dp = d - b, mx = (a + c) / 2, mz = (b + d) / 2, h = C.counterH;
    M(B(w, h - 0.06, dp), WOOD, mx, (h - 0.06) / 2, mz); M(B(w + 0.1, 0.06, dp + 0.12), CREAM, mx, h - 0.03, mz);
    for (let x = a + 0.5; x < c - 0.2; x += 0.6) M(B(0.05, h - 0.2, 0.02), DARK, x, (h - 0.06) / 2, d + 0.005, { outline: false }); // panel grooves
    const cmx = a + 1.0; M(B(0.62, 0.5, 0.42), 0xc9ced6, cmx, h + 0.25, mz - 0.05); M(B(0.66, 0.08, 0.46), 0x3a3340, cmx, h + 0.54, mz - 0.05, { outline: false }); // espresso machine
    M(B(0.5, 0.06, 0.12), 0x3a3340, cmx, h + 0.16, mz + 0.18, { outline: false }); [-0.12, 0.12].forEach(k => M(CY(0.045, 0.035, 0.08, 8), 0xffffff, cmx + k, h + 0.05, mz + 0.12, { outline: false }));
    M(CY(0.07, 0.07, 0.12, 8), 0xd94a3a, cmx + 0.45, h + 0.06, mz, { outline: false }); // grinder cup
    const pc = c - 1.3; M(B(1.1, 0.05, 0.5), WOOD, pc, h + 0.03, mz); pane(1.1, 0.45, pc, h + 0.28, mz + 0.25); pane(0.5, 0.45, pc - 0.55, h + 0.28, mz, Math.PI / 2); pane(0.5, 0.45, pc + 0.55, h + 0.28, mz, Math.PI / 2);
    { const q = new THREE.PlaneGeometry(1.1, 0.5); q.rotateX(-Math.PI / 2); q.translate(pc, h + 0.5, mz); panes.push(q); }
    [[-0.35, 0xe0a050], [-0.12, 0xf2c6d0], [0.12, 0x8a5233], [0.35, 0xf0d070]].forEach(([k, col]) => M(new THREE.SphereGeometry(0.09, 7, 5), col, pc + k, h + 0.13, mz, { outline: false })); // pastries
    M(B(0.3, 0.22, 0.26), 0x3a3340, c - 0.35, h + 0.11, mz, { outline: false }); // register
    const [s0, s1, s2, s3] = C.shelf; M(B(s2 - s0, 0.9, s3 - s1), DARK, (s0 + s2) / 2, h + 0.55, (s1 + s3) / 2); M(B(s2 - s0, 0.05, 0.36), WOOD, (s0 + s2) / 2, h + 1.05, (s1 + s3) / 2 + 0.1, { outline: false });
    for (let i = 0; i < 7; i++) M(CY(0.08, 0.08, 0.22, 6), [0xe8d6c0, 0x8a5233, 0x5fae5a][i % 3], s0 + 0.5 + i * 0.66, h + 1.19, (s1 + s3) / 2 + 0.12, { outline: false }); }
  // ---- tables + chairs ----
  const chair = s => { const f = [Math.sin(s.rot), Math.cos(s.rot)]; M(B(0.44, 0.07, 0.44), WOOD, s.x, 0.44, s.z, { ry: s.rot, outline: false }); M(B(0.08, 0.42, 0.08), DARK, s.x, 0.21, s.z, { outline: false });
    M(B(0.44, 0.5, 0.07), WOOD, s.x - f[0] * 0.2, 0.72, s.z - f[1] * 0.2, { ry: s.rot, outline: false }); cast(s.x, s.z, 0.5, 0.5); };
  const round = (x, z, r = 0.42) => { M(CY(r, r, 0.06, 10), CREAM, x, 0.76, z); M(B(0.08, 0.72, 0.08), DARK, x, 0.37, z, { outline: false }); M(CY(0.25, 0.28, 0.04, 8), DARK, x, 0.02, z, { outline: false }); cast(x, z, r * 2.2, r * 2.2); };
  const ware = (x, z, kind) => { if (kind === 'plate') { M(CY(0.15, 0.12, 0.025, 10), 0xffffff, x, 0.8, z, { outline: false }); M(new THREE.SphereGeometry(0.07, 6, 4), 0xe0a050, x, 0.83, z, { outline: false }); }
    else { M(CY(0.05, 0.04, 0.09, 8), 0xffffff, x, 0.83, z, { outline: false }); } };
  // big 4-top (lunch table): square wooden top, a plate in front of every seat
  M(B(1.15, 0.07, 1.15), WOOD, C.t4[0], 0.76, C.t4[1]); M(B(0.12, 0.72, 0.12), DARK, C.t4[0], 0.37, C.t4[1], { outline: false }); cast(C.t4[0], C.t4[1], 1.3, 1.3);
  // booth: leather bench against the west wall + wood table + one chair
  { const [bx, bz] = C.booth.bench; M(B(0.6, 0.44, 1.5), DARK, bx, 0.22, bz); M(B(0.56, 0.12, 1.44), LEATHER, bx + 0.02, 0.48, bz, { outline: false }); M(B(0.16, 0.6, 1.5), LEATHER, bx - 0.24, 0.84, bz); cast(bx, bz, 0.7, 1.6);
    M(B(0.7, 0.07, 0.9), WOOD, C.booth.table[0], 0.76, C.booth.table[1]); M(B(0.1, 0.72, 0.1), DARK, C.booth.table[0], 0.37, C.booth.table[1], { outline: false }); cast(...C.booth.table, 0.8, 1.0); }
  round(...C.t2); C.patio.tables.forEach(([x, z]) => round(x, z));
  for (const s of C.seats) { if (s.kind === 'chair') chair(s); const f = [Math.sin(s.rot), Math.cos(s.rot)]; ware(s.x + f[0] * 0.58, s.z + f[1] * 0.58, s.id.startsWith('t4') ? 'plate' : 'cup'); }
  // ---- pendant lamps: cord + warm shade; the bulbs glow at night ----
  for (const [x, z] of [C.t4, C.booth.table, C.t2, [C.counter[0] + 1.3, C.counter[1] + 0.35], [C.counter[2] - 1.3, C.counter[1] + 0.35]]) {
    M(B(0.02, H - 2.2, 0.02), 0x3a3340, x, (H + 2.2) / 2, z, { outline: false }); M(CY(0.08, 0.3, 0.26, 10), 0xd98a3a, x, 2.15, z, { outline: false }); GLOW.push([x, 2.0, z, 0.16, 0.08]); halos.push([x, 1.95, z, 2.1]); }
  // ---- plants ----
  C.plants.forEach(([x, z], i) => { const k = i === 2 ? 0.9 : 1.05; M(CY(0.28 * k, 0.2 * k, 0.42 * k, 8), 0xe8d6c0, x, 0.21 * k, z); // low-poly potted plant (perf: icosa detail 0)
    [[0, 0.75, 0, 0.36], [0.16, 1.0, 0.08, 0.28], [-0.14, 1.05, -0.06, 0.26]].forEach(([a, y, b, r], j) => M(new THREE.IcosahedronGeometry(r * k, 0), j ? 0x6cbf5e : 0x5fae5a, x + a * k, y * k, z + b * k, { outline: j === 0 })); cast(x, z, 1.0, 1.0); });
  cur = g;
  // ---- patio: paver pad, parasols, string lights between four posts ----
  { const P = C.patio; M(B(P.x1 - P.x0 + 0.6, 0.02, P.z1 - P.z0), 0xe6d3b3, (P.x0 + P.x1) / 2, 0.01, (P.z0 + P.z1) / 2, { outline: false });
    const K = P.canopy; P.tables.forEach(([x, z], i) => { M(CY(0.03, 0.03, K.y + 0.2 - 0.76, 6), DARK, x, (K.y + 0.2 + 0.76) / 2, z, { outline: false }); M(new THREE.ConeGeometry(K.r, K.h, 8), i ? SAGEG : TERRA, x, K.y, z); M(B(0.1, 0.1, 0.1), CREAM, x, K.y + K.h / 2 + 0.04, z, { outline: false }); });
    P.posts.forEach(([x, z]) => M(B(0.1, P.postH, 0.1), DARK, x, P.postH / 2, z, { outline: false }));
    // string-light runs: perimeter (two sides + front) and one centre run from the eave, all clear of the canopies; each a sagging catenary
    const [p0, p1, p2, p3] = P.posts, top = P.postH - 0.08, eave = [(door[0] + door[1]) / 2 - 0.2, z1 + 0.1];
    for (const [a, b, ya, yb, sag] of [[p0, p2, top, top, 0.4], [p1, p3, top, top, 0.4], [p2, p3, top, top, 0.55], [eave, [(p2[0] + p3[0]) / 2, p2[1]], H - 0.05, top - 0.55 + 0.02, 0.3]]) {
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(6, Math.round(L / 0.35)); let prev = null;
      for (let i = 0; i <= n; i++) { const u = i / n, x = a[0] + (b[0] - a[0]) * u, z = a[1] + (b[1] - a[1]) * u, y = ya + (yb - ya) * u - sag * 4 * u * (1 - u);
        if (prev) WIRE.push(...prev, x, y, z); prev = [x, y, z]; if (i > 0 && i < n && i % 3 === 0) { GLOW.push([x, y - 0.07, z, 0.08, 0.1]); if (i % 6 === 0) halos.push([x, y - 0.07, z, 0.55]); } } } }
  // ---- merged dynamic bits ----
  const glass = new THREE.Mesh(mergeGeometries(panes), occPatch(new THREE.MeshBasicMaterial({ color: 0xf6e2c0, transparent: true, opacity: 0.2, depthWrite: false, side: THREE.DoubleSide }))); glass.name = 'cafeGlass'; glass.userData.dynamic = true; g.add(glass);
  const sg = []; { const q = new THREE.PlaneGeometry(3.6, 0.9); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 0.5 + uv.getY(i) * 0.5); q.translate((door[0] + door[1]) / 2, H + 0.62, z1 - 0.02); sg.push(q); M(B(3.7, 0.12, 0.1), DARK, (door[0] + door[1]) / 2, H + 0.14, z1 - 0.06, { outline: false }); [-1.6, 1.6].forEach(k => M(B(0.08, 0.5, 0.08), DARK, (door[0] + door[1]) / 2 + k, H + 0.4, z1 - 0.06, { outline: false })); }
  { const q = new THREE.PlaneGeometry(2.4, 0.6); const uv = q.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * 0.5); q.translate((C.shelf[0] + C.shelf[2]) / 2, 2.75, z0 + 0.08); sg.push(q); }
  const sm = new THREE.Mesh(mergeGeometries(sg), occPatch(new THREE.MeshBasicMaterial({ map: signTexture() }))); sm.name = 'cafeSigns'; sm.userData.dynamic = true; g.add(sm);
  const lamps = new THREE.Mesh(mergeGeometries(GLOW.map(([x, y, z, w, h]) => { const q = B(w, h, w); q.translate(x, y, z); return q; })), new THREE.ShaderMaterial({ uniforms: { uGlow: dayUniforms.uGlow, uNight: dayUniforms.uNight },
    vertexShader: 'void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'uniform float uGlow, uNight; void main(){ vec3 day = mix(vec3(0.98,0.9,0.72), vec3(0.5,0.44,0.36), uNight); gl_FragColor = vec4(mix(day, vec3(1.35,1.0,0.55), uGlow), 1.0); }' }));
  lamps.name = 'cafeLamps'; lamps.userData.dynamic = true; scene.add(lamps); const glow = glowPoints(scene, halos, { size: 62, color: 0xffc070 });
  const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(WIRE, 3)); const wire = new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x2a2228 })); wire.name = 'cafeWire'; wire.userData.dynamic = true; scene.add(wire);
  // tight frustum cull (the baked group's bounding sphere pokes into the overview frustum while the café itself sits just past its top edge)
  const box = new THREE.Box3(new THREE.Vector3(x0 - 0.6, -0.2, z0 - 0.4), new THREE.Vector3(x1 + 0.6, H + 0.5, C.patio.z1 + 1.4)), fr = new THREE.Frustum(), pm = new THREE.Matrix4();
  g.userData.cull = cam => { cam.updateMatrixWorld(); pm.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); fr.setFromProjectionMatrix(pm); const v = fr.intersectsBox(box); g.visible = lamps.visible = glow.visible = wire.visible = v; gi.visible = v && cam.position.distanceTo(ctr) < 40; return v; };
  const ctr = new THREE.Vector3(cx, 1, cz);
  g.userData.roofGeo = mergeGeometries(roofs); g.userData.interior = gi; scene.add(g); bake(g); scene.add(gi); bake(gi); return g; }
