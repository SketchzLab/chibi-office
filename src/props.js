import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { FLOOR, BACK_Z, LEFT_X, GLASS, LOUNGE, DESKS, PANTRY, WALKWAY, BOSS_DESK, GLASS_H , PLANT_SPHERES, PLANTS } from './layout.js';
// Phone-friendly glow: emissive screen + additive soft halo quad (no post-process bloom).
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function halo(color, size, opacity = 0.6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity }));
  s.scale.set(size, size, 1); return s;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
// soft rounded boxes for hero furniture (2 segments keeps triangles low)
const RB = (w, h, d, r = 0.06, seg = 1) => new RoundedBoxGeometry(w, h, d, seg, Math.min(r, w / 2.1, h / 2.1, d / 2.1));
export const glows = [];
function desk() {
  const g = new THREE.Group();
  const top = toonMesh(RB(2.2, 0.1, 1.1, 0.04), 0xe9c38e); top.position.y = 0.9; g.add(top);
  [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]].forEach(([x, z]) => { const l = toonMesh(B(0.08, 0.9, 0.08), 0xf4f1ea, { outline: false }); l.position.set(x, 0.45, z); g.add(l); });
  const mon = toonMesh(RB(1.1, 0.65, 0.07, 0.03), 0xe8eef2); mon.position.set(0, 1.45, -0.3); g.add(mon);
  const scr = new THREE.Mesh(B(1.0, 0.55, 0.01), new THREE.MeshBasicMaterial({ color: 0xa8ecff })); scr.position.set(0, 1.45, -0.26); g.add(scr);
  const st = toonMesh(B(0.08, 0.4, 0.08), 0x2b2d42, { outline: false }); st.position.set(0, 1.1, -0.32); g.add(st);
  const h = halo(0x5cc8ff, 2.0, 0.55); h.position.set(0, 1.45, -0.15); g.add(h); glows.push(h);
  // daylight-visible glow: normal-blended cyan halo + bright bezel rim + light spill on desk
  const h2 = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color: 0x8fe6ff, transparent: true, depthWrite: false, opacity: 0.55 })); h2.scale.set(1.7, 1.15, 1); h2.position.set(0, 1.45, -0.2); g.add(h2); glows.push(h2);
  [-1, 1].forEach(k => { const back = new THREE.Mesh(B(1.0, 0.55, 0.01), new THREE.MeshBasicMaterial({ color: 0x7fd8ff })); back.position.set(0, 1.45, -0.34); if (k > 0) g.add(back); });
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.9), new THREE.MeshBasicMaterial({ map: haloTex, color: 0x7fdcff, transparent: true, opacity: 0.6, depthWrite: false })); spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.96, 0.05); g.add(spill);
  const kb = toonMesh(B(0.7, 0.04, 0.22), 0xdddde8, { outline: false }); kb.position.set(0, 0.98, 0.15); g.add(kb);
  const mouse = toonMesh(new THREE.SphereGeometry(0.06, 6, 4), 0xdddde8, { outline: false }); mouse.scale.set(1, 0.5, 1.4); mouse.position.set(0.52, 0.97, 0.15); g.add(mouse);
  const mug = toonMesh(new THREE.CylinderGeometry(0.07, 0.06, 0.14, 8), 0xff9b7a, { outline: false }); mug.position.set(-0.8, 1.02, 0.2); g.add(mug);
  const pot = toonMesh(new THREE.CylinderGeometry(0.08, 0.06, 0.12, 6), 0xf4f1ea, { outline: false }); pot.position.set(-0.85, 1.01, -0.3); g.add(pot);
  const leaf = toonMesh(new THREE.SphereGeometry(0.13, 6, 4), 0x6cc45a, { outline: false }); leaf.position.set(-0.85, 1.16, -0.3); g.add(leaf);
  // chair
  const ch = new THREE.Group(); ch.position.set(0, 0, 1.2);
  const seat = toonMesh(RB(0.7, 0.14, 0.7, 0.06), 0x4fb3a9); seat.position.y = 0.55; ch.add(seat);
  const back = toonMesh(RB(0.7, 0.72, 0.12, 0.06), 0x4fb3a9); back.position.set(0, 0.95, 0.32); ch.add(back);
  const pole = toonMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), 0x333344, { outline: false }); pole.position.y = 0.27; ch.add(pole);
  const base = toonMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 10), 0x333344, { outline: false }); base.position.y = 0.03; ch.add(base);
  g.add(ch);
  return g;
}
function plant(scale = 1) {
  const g = new THREE.Group();
  const pot = toonMesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 10), 0xe8d6c0); pot.position.y = 0.22; g.add(pot);
  PLANT_SPHERES.forEach(([x, y, z, r]) => { const f = toonMesh(new THREE.IcosahedronGeometry(r, 1), 0x5fae5a); f.position.set(x, y, z); g.add(f); });
  g.scale.setScalar(scale); return g;
}
function lamp() {
  const g = new THREE.Group();
  const pole = toonMesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2), 0x3a3340, { outline: false }); pole.position.y = 1.1; g.add(pole);
  const base = toonMesh(new THREE.CylinderGeometry(0.25, 0.3, 0.08, 10), 0x3a3340); g.add(base);
  const shade = toonMesh(new THREE.ConeGeometry(0.4, 0.45, 12, 1, true), 0xffe2b0, { emissive: 0x553311 }); shade.position.y = 2.25; g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), new THREE.MeshBasicMaterial({ color: 0xfff0c0 })); bulb.position.y = 2.1; g.add(bulb);
  const h = halo(0xffd08a, 2.2, 0.22); h.position.y = 2.1; g.add(h); glows.push(h);
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshBasicMaterial({ map: haloTex, color: 0xffa050, transparent: true, opacity: 0.15, blending: THREE.AdditiveBlending, depthWrite: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = 0.03; g.add(pool);
  return g;
}
function pantry() {
  const g = new THREE.Group();
  const counter = toonMesh(RB(3.2, 1.0, 0.8, 0.05), 0xf6f0e6); counter.position.set(0, 0.5, 0); g.add(counter);
  const ctop = toonMesh(RB(3.3, 0.08, 0.9, 0.03), 0x8b6b4a); ctop.position.set(0, 1.04, 0); g.add(ctop);
  const fridge = toonMesh(RB(0.9, 2.0, 0.8, 0.1), 0xdfe8f0); fridge.position.set(2.15, 1.0, 0); g.add(fridge);
  const handle = toonMesh(B(0.05, 0.6, 0.05), 0x777788, { outline: false }); handle.position.set(1.8, 1.3, 0.42); g.add(handle);
  const cm = toonMesh(RB(0.45, 0.55, 0.4, 0.06), 0x3a3340); cm.position.set(-1.0, 1.35, 0); g.add(cm);
  const cup = toonMesh(new THREE.CylinderGeometry(0.08, 0.07, 0.14, 8), 0xffffff); cup.position.set(-0.5, 1.15, 0.1); g.add(cup);
  const shelf = toonMesh(B(2.4, 0.08, 0.35), 0x8b6b4a); shelf.position.set(0, 2.1, -0.25); g.add(shelf);
  [[-0.8, 0xff8a7a], [-0.3, 0xffd36a], [0.3, 0x7ac8a0], [0.8, 0x9aa8ff]].forEach(([x, c]) => { const j = toonMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8), c); j.position.set(x, 2.29, -0.25); g.add(j); });
  const stool = toonMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 10), 0xf08a5a); stool.position.set(-0.6, 0.35, 1.0); g.add(stool);
  const rug = toonMesh(B(4.4, 0.02, 2.6), 0xe9c7a2, { outline: false }); rug.position.set(0.4, 0.01, 0.6); g.add(rug);
  return g;
}
const WALL = 0xf6f3ec, TEAL = 0x4fb3a9;
function shell(g) {
  const W = FLOOR.x1 - FLOOR.x0;
  // back wall full height, left wall stepping down toward the front = cut-away look
  cast(0, BACK_Z + 0.5, W, 1.6, 0, 0.012, 0.3); cast(LEFT_X + 0.5, 0, 1.4, FLOOR.z1 - FLOOR.z0, 0, 0.012, 0.3);
  const bw = toonMesh(B(W, 2.6, 0.2), WALL); bw.position.set(0, 1.3, BACK_Z); g.add(bw);
  const bt = toonMesh(B(W + 0.1, 0.18, 0.3), TEAL); bt.position.set(0, 2.65, BACK_Z); g.add(bt);
  const bb = toonMesh(B(W, 0.14, 0.24), TEAL, { outline: false }); bb.position.set(0, 0.07, BACK_Z + 0.12); g.add(bb);
  const segs = [[FLOOR.z0 + 0.05, -2.0, 2.6], [-2.0, 2.2, 1.5], [2.2, FLOOR.z1 - 0.05, 0.7]];
  segs.forEach(([a, b, h]) => { const w = toonMesh(B(0.2, h, b - a), WALL); w.position.set(LEFT_X, h / 2, (a + b) / 2); g.add(w);
    const t = toonMesh(B(0.3, 0.16, b - a + 0.02), TEAL); t.position.set(LEFT_X, h + 0.04, (a + b) / 2); g.add(t); });
  // big windows cut into the back wall (sky shows through as light panels)
  [-0.2, 6.2].forEach(x => { const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.2), new THREE.MeshBasicMaterial({ color: 0xcdeefc })); win.position.set(x, 1.6, BACK_Z + 0.11); g.add(win);
    const fr = toonMesh(B(2.6, 0.1, 0.08), TEAL, { outline: false }); fr.position.set(x, 2.25, BACK_Z + 0.12); g.add(fr); const fb = fr.clone(); fb.position.y = 0.95; g.add(fb); });
  const wb = toonMesh(B(2.2, 1.1, 0.05), 0xffffff); wb.position.set(2.9, 1.6, BACK_Z + 0.13); g.add(wb);
  [[2.3, 1.75, 0xff9b7a], [3.0, 1.5, 0x7ac8a0], [3.5, 1.8, 0x9aa8ff]].forEach(([x, y, c]) => { const n = toonMesh(B(0.3, 0.3, 0.02), c, { outline: false }); n.position.set(x, y, BACK_Z + 0.17); g.add(n); });
}
function bookshelf(w = 1.6, h = 2.0) {
  const g = new THREE.Group(); const fr = toonMesh(RB(w, h, 0.45, 0.05), 0xc98d55); fr.position.y = h / 2; g.add(fr);
  const cols = [0xff8a7a, 0xffd36a, 0x7ac8a0, 0x9aa8ff, 0xf4f1ea, 0x4fb3a9];
  for (let r = 0; r < 4; r++) { let x = -w / 2 + 0.12; let k = r * 3;
    while (x < w / 2 - 0.2) { const bw = 0.1 + ((k * 37) % 5) * 0.025, bh = 0.3 + ((k * 13) % 4) * 0.04; const b = toonMesh(B(bw, bh, 0.3), cols[k % cols.length], { outline: false });
      b.position.set(x + bw / 2, 0.15 + r * (h / 4) + bh / 2, 0.1); g.add(b); x += bw + 0.02; k++; } }
  return g;
}
function glassRoom(g) {
  const { x0, x1, z0, z1, door0 } = GLASS, H = GLASS_H, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const glass = new THREE.MeshBasicMaterial({ color: 0xbfe9f2, transparent: true, opacity: 0.25, depthWrite: false, side: THREE.DoubleSide });
  const pane = (w, px, pz, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), glass); m.position.set(px, H / 2, pz); m.rotation.y = ry; g.add(m); };
  pane(door0 - x0, (x0 + door0) / 2, z1, 0);            // front pane, doorway gap door0..x1
  pane(z1 - z0, x1, cz, Math.PI / 2);                   // side pane
  { const sg = []; const streak = (w, px, pz, ry) => { const q = new THREE.PlaneGeometry(w, H * 1.2); q.rotateZ(0.6); q.rotateY(ry); q.translate(px, H / 2, pz); sg.push(q); };
    streak(0.35, x0 + 1.0, z1 + 0.01, 0); streak(0.14, x0 + 1.5, z1 + 0.01, 0); streak(0.35, x1 + 0.01, z0 + 1.4, Math.PI / 2); streak(0.14, x1 + 0.01, z0 + 1.9, Math.PI / 2);
    const sm = new THREE.Mesh(mergeGeometries(sg), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending })); g.add(sm); }
  const F = 0x3f6f6a; const fr = (w, h, d, x, y, z) => { const m = toonMesh(B(w, h, d), F, { outline: false }); m.position.set(x, y, z); g.add(m); };
  fr(x1 - x0, 0.08, 0.08, cx, H, z1); fr(0.08, 0.08, z1 - z0, x1, H, cz);
  [x0 + 0.05, (x0 + door0) / 2, door0, x1].forEach(x => fr(0.07, H, 0.07, x, H / 2, z1));
  [z0 + 0.1, cz].forEach(z => fr(0.07, H, 0.07, x1, H / 2, z));
  const mat = toonMesh(B(x1 - door0 - 0.1, 0.02, 0.6), F, { outline: false }); mat.position.set((door0 + x1) / 2, 0.01, z1 + 0.4); g.add(mat);
  const rug = toonMesh(B(x1 - x0 - 0.8, 0.02, z1 - z0 - 0.8), 0xdfe9ee, { outline: false }); rug.position.set(cx, 0.012, cz); g.add(rug);
  cast(cx, cz, 4.2, 2.8); cast(x1 - 0.3, cz, 0.8, z1 - z0, 0, 0.015, 0.3);
  const tbl = toonMesh(new THREE.CylinderGeometry(1.0, 1.0, 0.08, 24), 0xe9c38e); tbl.position.set(cx, 0.78, cz); tbl.scale.x = 1.5; g.add(tbl);
  const leg = toonMesh(new THREE.CylinderGeometry(0.1, 0.25, 0.75, 10), 0xf4f1ea); leg.position.set(cx, 0.38, cz); g.add(leg);
  [[-2.1, 0], [2.1, 0], [-0.8, -1.3], [0.8, -1.3], [-0.8, 1.3], [0.8, 1.3]].forEach(([dx, dz]) => { const c = toonMesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 12), 0xf0ece4); c.position.set(cx + dx, 0.25, cz + dz); g.add(c); });
  const tv = toonMesh(B(0.08, 0.9, 1.8), 0x2b2d42); tv.position.set(x0 + 0.05, 1.45, cz); g.add(tv);
  const tvs = new THREE.Mesh(B(0.01, 0.8, 1.7), new THREE.MeshBasicMaterial({ color: 0x9fe3ff })); tvs.position.set(x0 + 0.1, 1.45, cz); g.add(tvs);
}
function lounge(g) {
  const { cx, cz } = LOUNGE;
  const rug = toonMesh(B(5.0, 0.02, 4.2), 0xf2e2c4, { outline: false }); rug.position.set(cx, 0.01, cz); g.add(rug);
  const S = 0x6fb36a, SD = 0x5a9e57;
  const sofa = (w, x, z, ry) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry;
    const base = toonMesh(RB(w, 0.45, 0.9, 0.1, 2), S); base.position.y = 0.25; s.add(base);
    const back = toonMesh(RB(w, 0.6, 0.25, 0.1, 2), SD); back.position.set(0, 0.7, -0.35); s.add(back);
    const n = Math.round(w / 0.9); for (let i = 0; i < n; i++) { const cu = toonMesh(new THREE.CapsuleGeometry(0.18, w / n - 0.45, 3, 8), 0x86c97f); cu.rotation.z = Math.PI / 2; cu.position.set(-w / 2 + (i + 0.5) * w / n, 0.55, 0.05); s.add(cu); }
    [-1, 1].forEach(k => { const arm = toonMesh(RB(0.24, 0.55, 0.9, 0.1, 2), SD); arm.position.set(k * (w / 2 - 0.05), 0.4, 0); s.add(arm); });
    g.add(s); };
  sofa(3.2, cx, cz + 2.0, Math.PI); sofa(2.4, cx - 2.2, cz - 0.1, Math.PI / 2);
  cast(cx, cz + 2.0, 4.0, 1.8); cast(cx - 2.2, cz - 0.1, 1.8, 3.2); cast(cx + 0.1, cz - 0.1, 1.8, 1.8); cast(cx + 2.1, cz - 0.9, 1.6, 1.6);
  const ct = toonMesh(new THREE.CylinderGeometry(0.65, 0.65, 0.1, 18), 0xe9c38e); ct.position.set(cx + 0.1, 0.42, cz - 0.1); g.add(ct);
  const cl = toonMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), 0xf4f1ea, { outline: false }); cl.position.set(cx + 0.1, 0.2, cz - 0.1); g.add(cl);
  const book = toonMesh(B(0.3, 0.05, 0.22), 0xff8a7a, { outline: false }); book.position.set(cx + 0.2, 0.5, cz - 0.1); g.add(book);
  const ac = new THREE.Group(); ac.position.set(cx + 2.1, 0, cz - 0.9); ac.rotation.y = -1.1;
  const ab = toonMesh(RB(0.9, 0.45, 0.85, 0.12, 2), 0xf08a5a); ab.position.y = 0.25; ac.add(ab);
  const abk = toonMesh(RB(0.9, 0.6, 0.22, 0.1, 2), 0xe07848); abk.position.set(0, 0.7, -0.33); ac.add(abk); g.add(ac);
}
function walkway(g) {
  // lighter wood runner marks the main aisle and the branch to the pantry
  const { z, half, x0, x1 } = WALKWAY; const col = 0xf0c995;
  const a = toonMesh(B(x1 - x0, 0.012, half * 2), col, { outline: false }); a.position.set((x0 + x1) / 2, 0.006, z); g.add(a);
  const b = toonMesh(B(half * 2, 0.012, 4.6), col, { outline: false }); b.position.set(7.6, 0.007, -2.3); g.add(b);
}

// ---- cozy details (all static -> baked into the shared vertex-colour meshes, ~0 extra draw calls) ----
function cozy(g) {
  const M = (geo, col, x, y, z, o = {}) => { const m = toonMesh(geo, col, { outline: o.outline ?? false }); m.position.set(x, y, z); if (o.r) m.rotation.set(...o.r); if (o.s) m.scale.set(...o.s); g.add(m); return m; };
  const Z = BACK_Z + 0.17;
  // whiteboard doodles: bar chart, arrow, smiley
  [[2.05, 0.18], [2.2, 0.32], [2.35, 0.46]].forEach(([x, h]) => M(B(0.1, h, 0.02), 0x4fb3a9, x, 1.25 + h / 2, Z));
  M(B(0.9, 0.025, 0.02), 0x2a1f35, 2.6, 1.3, Z, { r: [0, 0, 0.35] }); M(B(0.16, 0.025, 0.02), 0x2a1f35, 3.0, 1.43, Z, { r: [0, 0, -0.5] });
  M(new THREE.TorusGeometry(0.16, 0.018, 4, 16), 0xff7a6a, 3.55, 1.38, Z); M(new THREE.TorusGeometry(0.08, 0.016, 4, 10, Math.PI), 0xff7a6a, 3.55, 1.35, Z, { r: [0, 0, Math.PI] });
  // framed art above the bookshelves
  [[-3.6, 0xffb3cf, 0x7ac8a0], [-1.9, 0x9fd6ff, 0xffd36a]].forEach(([x, a, b2]) => { M(RB(0.75, 0.5, 0.05, 0.02), 0xc98d55, x, 2.3, BACK_Z + 0.13, { outline: true }); M(B(0.62, 0.38, 0.02), a, x, 2.3, BACK_Z + 0.17);
    M(new THREE.CircleGeometry(0.09, 10), b2, x + 0.12, 2.36, BACK_Z + 0.185); M(new THREE.ConeGeometry(0.16, 0.2, 3), 0x5fae5a, x - 0.12, 2.22, BACK_Z + 0.185, { s: [1, 1, 0.1] }); });
  // desk lamps + book stacks on every desk (rotated with the desk)
  [...DESKS, BOSS_DESK].forEach(([x, z]) => { const k = z > 0 ? -1 : 1; const lx = x + 0.85 * k, lz = z - 0.3 * k;
    M(new THREE.CylinderGeometry(0.1, 0.12, 0.04, 10), 0x3a3340, lx, 0.97, lz); M(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), 0x3a3340, lx, 1.18, lz, { r: [0.35 * k, 0, 0] });
    M(new THREE.ConeGeometry(0.13, 0.16, 10, 1, true), 0xffd36a, lx, 1.38, lz + 0.1 * k, { r: [Math.PI - 0.5 * k, 0, 0] });
    [0xff8a7a, 0x9aa8ff].forEach((c, i) => M(B(0.32, 0.05, 0.22), c, x - 0.55 * k, 0.98 + i * 0.05, z - 0.32 * k, { r: [0, i * 0.3, 0] })); });
  // lounge: cushions, throw, cat, patterned rug, coffee-table books + vase
  const { cx, cz } = LOUNGE;
  [[cx - 1.0, cz + 2.12, 0.25, 0xff9b7a], [cx + 0.9, cz + 2.12, -0.2, 0xfff1d8]].forEach(([x, z, rz, c]) => M(RB(0.5, 0.45, 0.16, 0.08, 2), c, x, 0.72, z, { outline: true, r: [0.25, 0, rz] }));
  M(RB(0.16, 0.45, 0.5, 0.08, 2), 0xffd36a, cx - 2.42, 0.72, cz - 0.7, { outline: true, r: [0, 0, -0.25] });
  M(RB(0.55, 0.05, 1.0, 0.02, 1), 0xe86a6a, cx + 1.5, 0.7, cz + 2.0, { outline: true }); [-0.3, 0, 0.3].forEach(dz => M(B(0.56, 0.055, 0.06), 0xfff1d8, cx + 1.5, 0.7, cz + 2.0 + dz));
  // (Mochi the cat is now a roaming pet: see pets.js)
  M(new THREE.CylinderGeometry(1.95, 1.95, 0.008, 32), 0xe4c79c, cx, 0.024, cz, { s: [1.15, 1, 0.92] }); M(new THREE.CylinderGeometry(1.75, 1.75, 0.008, 32), 0xf5e7cc, cx, 0.028, cz, { s: [1.15, 1, 0.92] });
  for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; M(new THREE.CylinderGeometry(0.08, 0.08, 0.008, 4), 0xe8a07a, cx + Math.cos(a) * 1.85 * 1.15, 0.03, cz + Math.sin(a) * 1.85 * 0.92); }
  [[0x7ac8a0, 0], [0xffd36a, 0.4]].forEach(([c, r], i) => M(B(0.32, 0.06, 0.24), c, cx - 0.15, 0.5 + i * 0.06, cz - 0.3, { r: [0, r, 0] }));
  M(new THREE.CylinderGeometry(0.06, 0.08, 0.2, 8), 0x9fd6ff, cx + 0.35, 0.57, cz + 0.1); M(new THREE.SphereGeometry(0.07, 6, 4), 0xff8fb3, cx + 0.35, 0.72, cz + 0.1);
  // plant variety: snake plant, monstera, trailing pothos on a shelf, mini cactus on the pantry counter
  M(new THREE.CylinderGeometry(0.28, 0.22, 0.4, 10), 0x4fb3a9, -10.2, 0.2, 7.3, { outline: true });
  for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; M(new THREE.ConeGeometry(0.08, 1.0 + (i % 3) * 0.2, 4), 0x3f8f45, -10.2 + Math.cos(a) * 0.1, 0.85, 7.3 + Math.sin(a) * 0.1, { outline: true, r: [Math.sin(a) * 0.15, 0, -Math.cos(a) * 0.15], s: [1, 1, 0.4] }); }
  M(new THREE.CylinderGeometry(0.32, 0.26, 0.45, 10), 0xf4f1ea, 10.1, 0.22, 7.1, { outline: true });
  [[0, 0.95, 0, 0], [0.3, 0.8, 0.1, 0.7], [-0.3, 0.85, -0.1, -0.7], [0.05, 1.15, -0.25, 2.6]].forEach(([dx, y, dz, ry]) => M(new THREE.SphereGeometry(0.34, 10, 6), 0x4f9e4a, 10.1 + dx, y, 7.1 + dz, { outline: true, s: [1, 0.25, 0.75], r: [0.4, ry, 0] }));
  M(new THREE.CylinderGeometry(0.16, 0.12, 0.2, 8), 0xff9b7a, -1.4, 2.1, BACK_Z + 0.35, { outline: true });
  for (let i = 0; i < 7; i++) M(new THREE.IcosahedronGeometry(0.09, 0), 0x6cc45a, -1.4 + (i % 2 ? 0.12 : -0.1), 2.15 - i * 0.16, BACK_Z + 0.5);
}
export function makeOffice(scene) {
  const g = new THREE.Group();
  shell(g); glassRoom(g); lounge(g); walkway(g);
  [[-3.6, BACK_Z + 0.35], [-1.9, BACK_Z + 0.35]].forEach(([x, z]) => { const b = bookshelf(); b.position.set(x, 0, z); cast(x, z + 0.4, 2.2, 1.4, 0, 0.015, 0.5); g.add(b); });
  // kitchen cabinets along back wall
  const kx = 4.9, kz = BACK_Z + 0.5;
  cast(kx, kz + 0.4, 3.4, 1.6, 0, 0.015, 0.5); const cab = toonMesh(RB(2.6, 1.0, 0.7, 0.05), 0xf4f1ea); cab.position.set(kx, 0.5, kz); g.add(cab);
  const cabTop = toonMesh(B(2.7, 0.08, 0.8), 0x8b6b4a); cabTop.position.set(kx, 1.04, kz); g.add(cabTop);
  const sink = toonMesh(B(0.6, 0.05, 0.4), 0xc8d3dc, { outline: false }); sink.position.set(kx - 0.5, 1.09, kz + 0.05); g.add(sink);
  DESKS.forEach(([x, z]) => { cast(x, z + (z > 0 ? -0.3 : 0.3), 3.0, 2.6); const d = desk(); d.position.set(x, 0, z); if (z > 0) d.rotation.y = Math.PI; g.add(d); });
  { // Calvin's (boss) desk: same base + walnut top, second monitor, gold nameplate, mini trophy, rug
    const [x, z] = BOSS_DESK; cast(x, z - 0.3, 3.2, 2.8); const d = desk(); d.position.set(x, 0, z); d.rotation.y = Math.PI; g.add(d);
    const top = toonMesh(RB(2.5, 0.06, 1.25, 0.03), 0x9a6a45); top.position.y = 0.97; d.add(top);
    const m2 = toonMesh(RB(0.7, 0.5, 0.06, 0.03), 0xe8eef2); m2.position.set(0.85, 1.4, -0.22); m2.rotation.y = -0.4; d.add(m2);
    const s2 = new THREE.Mesh(B(0.62, 0.42, 0.01), new THREE.MeshBasicMaterial({ color: 0xa8ecff })); s2.position.set(0.835, 1.4, -0.185); s2.rotation.y = -0.4; d.add(s2);
    const plate = toonMesh(RB(0.5, 0.12, 0.08, 0.02), 0xffc94a); plate.position.set(-0.5, 1.06, 0.45); plate.rotation.x = -0.3; d.add(plate);
    const cupT = toonMesh(new THREE.CylinderGeometry(0.1, 0.05, 0.16, 8), 0xffc94a); cupT.position.set(-0.95, 1.12, -0.2); d.add(cupT);
    const rug = toonMesh(new THREE.CylinderGeometry(1.9, 1.9, 0.02, 24), 0xc94f4f, { outline: false }); rug.scale.set(1, 1, 0.75); rug.position.set(x, 0.012, z - 0.3); g.add(rug); }
  cast(PANTRY.x + 0.4, PANTRY.z, 6.2, 2.4, PANTRY.ry); const p = pantry(); p.position.set(PANTRY.x, 0, PANTRY.z); p.rotation.y = PANTRY.ry; g.add(p);
  PLANTS.forEach(([x, z, sc]) => { const pl = plant(sc); pl.position.set(x, 0, z); cast(x, z, 1.4, 1.4); g.add(pl); });
  [[-3.9, 7.3], [9.6, 3.2]].forEach(([x, z]) => { const l = lamp(); l.position.set(x, 0, z); cast(x, z, 1.0, 1.0); g.add(l); });
  cozy(g);
  scene.add(g); bake(g);
  return g;
}
