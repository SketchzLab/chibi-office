import * as THREE from 'three';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
// Phone-friendly glow: emissive screen + additive soft halo quad (no post-process bloom).
const haloTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
function halo(color, size, opacity = 0.6) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, color, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity }));
  s.scale.set(size, size, 1); return s;
}
const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const glows = [];
function desk() {
  const g = new THREE.Group();
  const top = toonMesh(B(2.2, 0.1, 1.1), 0xe9c38e); top.position.y = 0.9; g.add(top);
  [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]].forEach(([x, z]) => { const l = toonMesh(B(0.08, 0.9, 0.08), 0xf4f1ea, { outline: false }); l.position.set(x, 0.45, z); g.add(l); });
  const mon = toonMesh(B(1.1, 0.65, 0.07), 0xe8eef2); mon.position.set(0, 1.45, -0.3); g.add(mon);
  const scr = new THREE.Mesh(B(1.0, 0.55, 0.01), new THREE.MeshBasicMaterial({ color: 0x7fd8ff })); scr.position.set(0, 1.45, -0.26); g.add(scr);
  const st = toonMesh(B(0.08, 0.4, 0.08), 0x2b2d42, { outline: false }); st.position.set(0, 1.1, -0.32); g.add(st);
  const h = halo(0x5cc8ff, 2.4, 0.55); h.position.set(0, 1.45, -0.15); g.add(h); glows.push(h);
  const kb = toonMesh(B(0.7, 0.04, 0.22), 0xdddde8, { outline: false }); kb.position.set(0, 0.98, 0.15); g.add(kb);
  // chair
  const ch = new THREE.Group(); ch.position.set(0, 0, 0.95);
  const seat = toonMesh(B(0.7, 0.12, 0.7), 0x4fb3a9); seat.position.y = 0.55; ch.add(seat);
  const back = toonMesh(B(0.7, 0.75, 0.1), 0x4fb3a9); back.position.set(0, 0.95, 0.32); ch.add(back);
  const pole = toonMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5), 0x333344, { outline: false }); pole.position.y = 0.27; ch.add(pole);
  const base = toonMesh(new THREE.CylinderGeometry(0.35, 0.35, 0.05, 10), 0x333344, { outline: false }); base.position.y = 0.03; ch.add(base);
  g.add(ch);
  return g;
}
function plant(scale = 1) {
  const g = new THREE.Group();
  const pot = toonMesh(new THREE.CylinderGeometry(0.3, 0.22, 0.45, 10), 0xe8d6c0); pot.position.y = 0.22; g.add(pot);
  [[0, 0.75, 0, 0.42], [0.2, 0.95, 0.1, 0.3], [-0.18, 1.05, -0.05, 0.28]].forEach(([x, y, z, r]) => { const f = toonMesh(new THREE.IcosahedronGeometry(r, 1), 0x5fae5a); f.position.set(x, y, z); g.add(f); });
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
  const counter = toonMesh(B(3.2, 1.0, 0.8), 0xf6f0e6); counter.position.set(0, 0.5, 0); g.add(counter);
  const ctop = toonMesh(B(3.3, 0.08, 0.9), 0x8b6b4a); ctop.position.set(0, 1.04, 0); g.add(ctop);
  const fridge = toonMesh(B(0.9, 2.0, 0.8), 0xdfe8f0); fridge.position.set(2.15, 1.0, 0); g.add(fridge);
  const handle = toonMesh(B(0.05, 0.6, 0.05), 0x777788, { outline: false }); handle.position.set(1.8, 1.3, 0.42); g.add(handle);
  const cm = toonMesh(B(0.45, 0.55, 0.4), 0x3a3340); cm.position.set(-1.0, 1.35, 0); g.add(cm);
  const cup = toonMesh(new THREE.CylinderGeometry(0.08, 0.07, 0.14, 8), 0xffffff); cup.position.set(-0.5, 1.15, 0.1); g.add(cup);
  const shelf = toonMesh(B(2.4, 0.08, 0.35), 0x8b6b4a); shelf.position.set(0, 2.1, -0.25); g.add(shelf);
  [[-0.8, 0xff8a7a], [-0.3, 0xffd36a], [0.3, 0x7ac8a0], [0.8, 0x9aa8ff]].forEach(([x, c]) => { const j = toonMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.3, 8), c); j.position.set(x, 2.29, -0.25); g.add(j); });
  const stool = toonMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 10), 0xf08a5a); stool.position.set(-0.6, 0.35, 1.0); g.add(stool);
  const rug = toonMesh(B(4.4, 0.02, 2.6), 0xe9c7a2, { outline: false }); rug.position.set(0.4, 0.01, 0.6); g.add(rug);
  return g;
}
const WALL = 0xf6f3ec, TEAL = 0x4fb3a9;
function shell(g) {
  // back wall (z=-5) full height, left wall (x=-6.5) stepping down toward the front = cut-away look
  const bw = toonMesh(B(13, 2.4, 0.2), WALL); bw.position.set(0, 1.2, -4.9); g.add(bw);
  const bt = toonMesh(B(13.1, 0.18, 0.3), TEAL); bt.position.set(0, 2.45, -4.9); g.add(bt);
  const bb = toonMesh(B(13, 0.14, 0.24), TEAL, { outline: false }); bb.position.set(0, 0.07, -4.78); g.add(bb);
  const segs = [[-4.95, -1.0, 2.4], [-1.0, 1.6, 1.5], [1.6, 4.95, 0.7]];
  segs.forEach(([a, b, h]) => { const w = toonMesh(B(0.2, h, b - a), WALL); w.position.set(-6.4, h / 2, (a + b) / 2); g.add(w);
    const t = toonMesh(B(0.3, 0.16, b - a + 0.02), TEAL); t.position.set(-6.4, h + 0.04, (a + b) / 2); g.add(t); });
  // wall art + whiteboard on back wall
  const wb = toonMesh(B(2.0, 1.0, 0.05), 0xffffff); wb.position.set(-1.2, 1.55, -4.77); g.add(wb);
  [[-1.7, 1.7, 0xff9b7a], [-1.0, 1.45, 0x7ac8a0], [-0.6, 1.75, 0x9aa8ff]].forEach(([x, y, c]) => { const n = toonMesh(B(0.3, 0.3, 0.02), c, { outline: false }); n.position.set(x, y, -4.73); g.add(n); });
  const art = toonMesh(B(0.8, 0.6, 0.05), 0xffd36a); art.position.set(1.4, 1.6, -4.77); g.add(art);
}
function bookshelf(w = 1.6, h = 2.0) {
  const g = new THREE.Group(); const fr = toonMesh(B(w, h, 0.45), 0xc98d55); fr.position.y = h / 2; g.add(fr);
  const cols = [0xff8a7a, 0xffd36a, 0x7ac8a0, 0x9aa8ff, 0xf4f1ea, 0x4fb3a9];
  for (let r = 0; r < 4; r++) { let x = -w / 2 + 0.12; let k = r * 3;
    while (x < w / 2 - 0.2) { const bw = 0.1 + ((k * 37) % 5) * 0.025, bh = 0.3 + ((k * 13) % 4) * 0.04; const b = toonMesh(B(bw, bh, 0.3), cols[k % cols.length], { outline: false });
      b.position.set(x + bw / 2, 0.15 + r * (h / 4) + bh / 2, 0.1); g.add(b); x += bw + 0.02; k++; } }
  return g;
}
function glassRoom(g) {
  // back-left: x -6.3..-3.3, z -4.8..-1.2
  const x0 = -6.3, x1 = -3.3, z0 = -4.8, z1 = -1.2, H = 2.2;
  const glass = new THREE.MeshBasicMaterial({ color: 0xbfe9f2, transparent: true, opacity: 0.28, depthWrite: false });
  const pane = (w, cx, cz, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, H), glass); m.position.set(cx, H / 2, cz); m.rotation.y = ry; g.add(m); };
  pane(x1 - x0, (x0 + x1) / 2, z1, 0); pane(z1 - z0, x1, (z0 + z1) / 2, Math.PI / 2);
  const F = 0x3f6f6a; const fr = (w, h, d, x, y, z) => { const m = toonMesh(B(w, h, d), F, { outline: false }); m.position.set(x, y, z); g.add(m); };
  fr(x1 - x0, 0.08, 0.08, (x0 + x1) / 2, H, z1); fr(0.08, 0.08, z1 - z0, x1, H, (z0 + z1) / 2);
  [x0 + 0.05, (x0 + x1) / 2, x1].forEach(x => fr(0.07, H, 0.07, x, H / 2, z1)); [z0 + 0.1, (z0 + z1) / 2].forEach(z => fr(0.07, H, 0.07, x1, H / 2, z));
  // door gap: leave open by not adding a pane on part? (kept simple)
  const tbl = toonMesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 20), 0xe9c38e); tbl.position.set(-4.8, 0.78, -3.0); tbl.scale.z = 1.3; g.add(tbl);
  const leg = toonMesh(new THREE.CylinderGeometry(0.08, 0.2, 0.75, 8), 0xf4f1ea); leg.position.set(-4.8, 0.38, -3.0); g.add(leg);
  [[-5.8, -3.0], [-3.8, -3.0], [-4.8, -4.2], [-4.8, -1.8]].forEach(([x, z]) => { const c = toonMesh(B(0.5, 0.5, 0.5), 0xf0ece4); c.position.set(x, 0.25, z); g.add(c); });
  const tv = toonMesh(B(0.08, 0.8, 1.4), 0x2b2d42); tv.position.set(-6.2, 1.4, -3.0); g.add(tv);
  const tvs = new THREE.Mesh(B(0.01, 0.7, 1.3), new THREE.MeshBasicMaterial({ color: 0x9fe3ff })); tvs.position.set(-6.15, 1.4, -3.0); g.add(tvs);
}
function lounge(g) {
  // front-left: green L sofa, rug, coffee table, orange armchair
  const rug = toonMesh(B(3.4, 0.02, 3.0), 0xf2e2c4, { outline: false }); rug.position.set(-4.6, 0.01, 3.1); g.add(rug);
  const S = 0x6fb36a, SD = 0x5a9e57;
  const sofa = (w, x, z, ry) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = ry;
    const base = toonMesh(new THREE.BoxGeometry(w, 0.45, 0.9, 1, 1, 1), S); base.position.y = 0.25; s.add(base);
    const back = toonMesh(B(w, 0.6, 0.25), SD); back.position.set(0, 0.7, -0.35); s.add(back);
    for (let i = 0; i < Math.round(w / 0.9); i++) { const cu = toonMesh(new THREE.CapsuleGeometry(0.18, w / Math.round(w / 0.9) - 0.45, 3, 8), 0x86c97f); cu.rotation.z = Math.PI / 2; cu.position.set(-w / 2 + (i + 0.5) * w / Math.round(w / 0.9), 0.55, 0.05); s.add(cu); }
    [-1, 1].forEach(k => { const arm = toonMesh(B(0.22, 0.55, 0.9), SD); arm.position.set(k * (w / 2 - 0.05), 0.4, 0); s.add(arm); });
    g.add(s); };
  sofa(2.6, -4.6, 4.5, Math.PI); sofa(2.0, -5.9, 2.7, Math.PI / 2);
  const ct = toonMesh(new THREE.CylinderGeometry(0.55, 0.55, 0.1, 16), 0xe9c38e); ct.position.set(-4.4, 0.42, 3.0); g.add(ct);
  const cl = toonMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4), 0xf4f1ea, { outline: false }); cl.position.set(-4.4, 0.2, 3.0); g.add(cl);
  const book = toonMesh(B(0.3, 0.05, 0.22), 0xff8a7a, { outline: false }); book.position.set(-4.3, 0.5, 3.0); g.add(book);
  const ac = new THREE.Group(); ac.position.set(-3.1, 0, 2.4); ac.rotation.y = -1.2;
  const ab = toonMesh(B(0.9, 0.45, 0.85), 0xf08a5a); ab.position.y = 0.25; ac.add(ab);
  const abk = toonMesh(B(0.9, 0.6, 0.22), 0xe07848); abk.position.set(0, 0.7, -0.33); ac.add(abk); g.add(ac);
}
export function makeOffice(scene) {
  const g = new THREE.Group();
  shell(g); glassRoom(g); lounge(g);
  [[-2.3, -4.55], [-0.6, -4.55]].forEach(([x, z]) => { const b = bookshelf(); b.position.set(x, 0, z); g.add(b); });
  // kitchen cabinets next to pantry along back wall
  const cab = toonMesh(B(2.2, 1.0, 0.7), 0xf4f1ea); cab.position.set(3.0, 0.5, -4.4); g.add(cab);
  const cabTop = toonMesh(B(2.3, 0.08, 0.8), 0x8b6b4a); cabTop.position.set(3.0, 1.04, -4.4); g.add(cabTop);
  const up = toonMesh(B(2.2, 0.7, 0.4), TEAL); up.position.set(3.0, 1.95, -4.6); g.add(up);
  const sink = toonMesh(B(0.6, 0.05, 0.4), 0xc8d3dc, { outline: false }); sink.position.set(2.6, 1.09, -4.35); g.add(sink);
  // open desks: 2 rows, aisle at z~0 (walk paths use it) + spare
  const spots = [[-1.6, -1.8], [1.0, -1.8], [-1.6, 1.8], [1.0, 1.8], [3.6, 1.8]];
  spots.forEach(([x, z], i) => { const d = desk(); d.position.set(x, 0, z); if (z > 0) d.rotation.y = Math.PI; g.add(d); });
  const p = pantry(); p.position.set(4.8, 0, -3.4); p.rotation.y = -Math.PI / 4 - Math.PI / 2 + Math.PI; g.add(p);
  p.rotation.y = -0.53; // face island centre
  [[-3.0, -1.0], [5.9, 0.4], [-2.6, 4.6], [5.6, 4.6]].forEach(([x, z], i) => { const pl = plant(1 + (i % 2) * 0.4); pl.position.set(x, 0, z); g.add(pl); });
  [[-3.0, 0.0], [5.9, 3.0]].forEach(([x, z]) => { const l = lamp(); l.position.set(x, 0, z); g.add(l); });
  scene.add(g); bake(g);
  return g;
}
