import * as THREE from 'three';
import { toonMesh } from './toon.js';
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
  const top = toonMesh(B(2.2, 0.12, 1.1), 0xf3e2c8); top.position.y = 0.9; g.add(top);
  [[-1, -0.45], [1, -0.45], [-1, 0.45], [1, 0.45]].forEach(([x, z]) => { const l = toonMesh(B(0.08, 0.9, 0.08), 0x6b5a5a, { outline: false }); l.position.set(x, 0.45, z); g.add(l); });
  const mon = toonMesh(B(1.1, 0.65, 0.07), 0x2b2d42); mon.position.set(0, 1.45, -0.3); g.add(mon);
  const scr = new THREE.Mesh(B(1.0, 0.55, 0.01), new THREE.MeshBasicMaterial({ color: 0x7fd8ff })); scr.position.set(0, 1.45, -0.26); g.add(scr);
  const st = toonMesh(B(0.08, 0.4, 0.08), 0x2b2d42, { outline: false }); st.position.set(0, 1.1, -0.32); g.add(st);
  const h = halo(0x5cc8ff, 2.4, 0.55); h.position.set(0, 1.45, -0.15); g.add(h); glows.push(h);
  const kb = toonMesh(B(0.7, 0.04, 0.22), 0xdddde8, { outline: false }); kb.position.set(0, 0.98, 0.15); g.add(kb);
  // chair
  const ch = new THREE.Group(); ch.position.set(0, 0, 0.95);
  const seat = toonMesh(B(0.7, 0.12, 0.7), 0x5560a0); seat.position.y = 0.55; ch.add(seat);
  const back = toonMesh(B(0.7, 0.75, 0.1), 0x5560a0); back.position.set(0, 0.95, 0.32); ch.add(back);
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
export function makeOffice(scene) {
  const g = new THREE.Group();
  // open desks: 2 rows x 2, facing camera-ish, plus a spare
  const spots = [[-4.2, -1.8], [-1.6, -1.8], [1.0, -1.8], [-4.2, 1.8], [-1.6, 1.8]];
  spots.forEach(([x, z], i) => { const d = desk(); d.position.set(x, 0, z); if (z > 0) d.rotation.y = Math.PI; g.add(d); });
  const p = pantry(); p.position.set(4.8, 0, -3.4); p.rotation.y = -Math.PI / 4 - Math.PI / 2 + Math.PI; g.add(p);
  p.rotation.y = -0.53; // face island centre
  [[-6.8, -3.2], [1.6, -5.6], [-6.5, 3.6], [5.6, 4.6]].forEach(([x, z], i) => { const pl = plant(1 + (i % 2) * 0.4); pl.position.set(x, 0, z); g.add(pl); });
  [[-6.4, 0], [-2.8, 4.6], [5.8, 3.8]].forEach(([x, z]) => { const l = lamp(); l.position.set(x, 0, z); g.add(l); });
  scene.add(g);
  return g;
}
