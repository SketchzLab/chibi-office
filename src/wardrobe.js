// Per-bot wardrobe closets (v12): an open closet in each longhouse room, holding every top the bot owns — its base wardrobe
// plus whatever it has bought on the shopping island (deterministic, see chibi.js purchases()). Frames bake to 1 fill + 1 outline;
// all hanging tops are ONE InstancedMesh (per-instance colour), so the closets cost ~3 draw calls total.
import * as THREE from 'three';
import { toonMesh, toonMat } from './toon.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { bake } from './bake.js';
import { HOUSE } from './layout.js';
import { PERSONAS } from './personas.js';
import { wardrobeTops, ootdDay } from './chibi.js';
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export function makeClosets(scene, day = ootdDay()) {
  const g = new THREE.Group(), add = (m, x, y, z) => { m.position.set(x, y, z); g.add(m); return m; }, items = [];
  HOUSE.rooms.forEach(r => { const x0 = r.x1 - 0.5, x1 = r.x1 - 0.1, z0 = HOUSE.z0 + 0.4, z1 = HOUSE.z0 + 1.3, xc = (x0 + x1) / 2, zc = (z0 + z1) / 2, y0 = HOUSE.y, wood = 0xb07a4e;
    add(toonMesh(B3(0.08, 1.9, z1 - z0), wood), x1 - 0.04, y0 + 0.95, zc); // back panel
    [z0, z1].forEach(z => add(toonMesh(B3(x1 - x0, 1.9, 0.08), wood), xc, y0 + 0.95, z)); // sides
    add(toonMesh(B3(x1 - x0 + 0.06, 0.1, z1 - z0 + 0.08), 0x8a5a36), xc, y0 + 1.95, zc); add(toonMesh(B3(x1 - x0, 0.24, z1 - z0), 0x8a5a36), xc, y0 + 0.12, zc); // top + drawer plinth
    add(toonMesh(B3(0.03, 0.03, z1 - z0 - 0.1), 0xd8d2c4, { outline: false }), xc, y0 + 1.68, zc); // rail
    const L = PERSONAS[r.who]?.look; if (!L) return; const tops = wardrobeTops(r.who, L, day), n = tops.length, sp = Math.min(0.13, (z1 - z0 - 0.16) / Math.max(1, n - 1));
    tops.forEach((t, i) => items.push([xc - 0.02, y0 + 1.38, zc - sp * (n - 1) / 2 + i * sp, t[2].c ?? t[2].s ?? 0xcccccc])); });
  scene.add(g); bake(g);
  const geo = new RoundedBoxGeometry(0.3, 0.52, 0.07, 1, 0.02), im = new THREE.InstancedMesh(geo, toonMat(0xffffff), Math.max(1, items.length)), m4 = new THREE.Matrix4(), col = new THREE.Color();
  items.forEach(([x, y, z, c], i) => { im.setMatrixAt(i, m4.makeTranslation(x, y, z)); im.setColorAt(i, col.set(c)); }); im.count = items.length; scene.add(im);
  return { group: g, hangers: im, count: items.length };
}
