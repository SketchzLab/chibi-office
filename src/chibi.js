import * as THREE from 'three';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
// Procedural big-head chibi (~2.3 units tall; head ~45% of height).
export function makeChibi({ name, role, skin = 0xffe0c8, hair, shirt, pants, hairStyle }) {
  const root = new THREE.Group(); root.userData = { name, role, activity: 'Working at desk' };
  const body = new THREE.Group(); root.add(body);
  const torsoGeo = new THREE.SphereGeometry(0.4, 18, 14); const torso = toonMesh(torsoGeo, shirt); torso.scale.set(1, 1.08, 0.9); torso.position.y = 0.82; body.add(torso);
  const head = new THREE.Group(); head.position.y = 1.72; body.add(head);
  const face = toonMesh(new THREE.SphereGeometry(0.66, 28, 22), skin); face.scale.set(1.06, 0.96, 1); head.add(face);
  // eyes
  [-0.22, 0.22].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshBasicMaterial({ color: 0x2a1f3a }));
    e.scale.set(0.95, 1.4, 0.5); e.position.set(x, -0.04, 0.6); head.add(e);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); sh.position.set(x + 0.03, 0.03, 0.66); head.add(sh);
    const bl = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), new THREE.MeshBasicMaterial({ color: 0xff8fa0, transparent: true, opacity: 0.5 })); bl.position.set(x * 1.5, -0.2, 0.58); bl.rotation.y = x > 0 ? 0.45 : -0.45; head.add(bl); });
  // hair cap
  const cap = toonMesh(new THREE.SphereGeometry(0.72, 28, 16, 0, Math.PI * 2, 0, Math.PI * 0.56), hair); cap.scale.set(1.06, 1, 1.02); cap.position.y = 0.04; cap.rotation.x = -0.28; head.add(cap);
  // soft fringe bangs
  [-0.32, 0, 0.32].forEach((x, i) => { const b = toonMesh(new THREE.SphereGeometry(0.22, 12, 10), hair); b.scale.set(1.1, 0.75, 0.6); b.position.set(x, 0.36 - Math.abs(x) * 0.25, 0.52); head.add(b); });
  // little rounded ears/nose and a smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8a3b3b })); smile.rotation.z = Math.PI; smile.position.set(0, -0.24, 0.62); head.add(smile);
  if (hairStyle === 'twintails') { [-1, 1].forEach(s => { const t = toonMesh(new THREE.CapsuleGeometry(0.17, 0.55, 4, 8), hair); t.position.set(0.74 * s, -0.25, -0.1); t.rotation.z = 0.35 * s; head.add(t);
      const bow = toonMesh(new THREE.BoxGeometry(0.22, 0.14, 0.1), 0xffe066); bow.position.set(0.66 * s, 0.25, -0.05); head.add(bow); }); }
  if (hairStyle === 'spiky') { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const sp = toonMesh(new THREE.ConeGeometry(0.17, 0.45, 6), hair);
      sp.position.set(Math.cos(a) * 0.42, 0.56, Math.sin(a) * 0.42 - 0.08); sp.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); head.add(sp); }
    const gl = toonMesh(new THREE.TorusGeometry(0.13, 0.025, 6, 14), 0x333344, { outline: false }); [-0.22, 0.22].forEach(x => { const g = gl.clone(); g.position.set(x, -0.04, 0.66); head.add(g); }); }
  const limb = (c, len, r, end, endR) => { const p = new THREE.Group(); const m = toonMesh(new THREE.CapsuleGeometry(r, len, 6, 12), c); m.position.y = -len / 2 - r * 0.5; p.add(m);
    if (end !== undefined) { const e = toonMesh(new THREE.SphereGeometry(endR, 12, 10), end); e.position.y = -len - r; if (endR > 0.14) { e.scale.set(1, 0.7, 1.35); e.position.z = 0.05; } p.add(e); } return p; };
  const armL = limb(shirt, 0.28, 0.12, skin, 0.12), armR = limb(shirt, 0.28, 0.12, skin, 0.12); armL.position.set(-0.44, 1.08, 0); armR.position.set(0.44, 1.08, 0); body.add(armL, armR);
  const legL = limb(pants, 0.24, 0.15, 0x4a3b3f, 0.16), legR = limb(pants, 0.24, 0.15, 0x4a3b3f, 0.16); legL.position.set(-0.16, 0.5, 0); legR.position.set(0.16, 0.5, 0); root.add(legL, legR);
  // invisible fat hit-box for easy tapping
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.3; hit.userData.chibi = root; root.add(hit);
  // merge each rigid part into one fill + one outline batch
  [head, armL, armR, legL, legR].forEach(bake); head.userData.dynamic = true; bake(body);
  root.userData.parts = { body, head, armL, armR, legL, legR }; root.userData.hit = hit;
  return root;
}
// Loop: idle at desk -> walk path -> idle at pantry -> walk back
export function makeWalker(chibi, path, { deskTime = 5, pantryTime = 3.5, speed = 1.4, offset = 0 } = {}) {
  const pts = path.map(p => new THREE.Vector3(p[0], 0, p[1]));
  const segs = []; let total = 0; for (let i = 0; i < pts.length - 1; i++) { const l = pts[i].distanceTo(pts[i + 1]); segs.push(l); total += l; }
  const walkT = total / speed, cycle = deskTime + walkT + pantryTime + walkT;
  const at = d => { for (let i = 0; i < segs.length; i++) { if (d <= segs[i]) return [pts[i].clone().lerp(pts[i + 1], d / segs[i]), pts[i + 1].clone().sub(pts[i])]; d -= segs[i]; } return [pts.at(-1).clone(), pts.at(-1).clone().sub(pts.at(-2))]; };
  const faceDesk = chibi.userData.faceDesk ?? 0, facePantry = chibi.userData.facePantry ?? 0;
  return function update(t, dt) {
    const c = (t + offset) % cycle; const P = chibi.userData.parts; let walking = false, pos, dir, face;
    if (c < deskTime) { [pos] = at(0); face = faceDesk; chibi.userData.activity = chibi.userData.deskActivity; }
    else if (c < deskTime + walkT) { [pos, dir] = at((c - deskTime) * speed); walking = true; chibi.userData.activity = 'Heading to the pantry'; }
    else if (c < deskTime + walkT + pantryTime) { [pos] = at(total); face = facePantry; chibi.userData.activity = chibi.userData.pantryActivity; }
    else { [pos, dir] = at(total - (c - deskTime - walkT - pantryTime) * speed); dir.negate(); walking = true; chibi.userData.activity = 'Walking back to desk'; }
    chibi.position.copy(pos);
    const target = walking ? Math.atan2(dir.x, dir.z) : face;
    let d = target - chibi.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); chibi.rotation.y += d * Math.min(1, dt * 8);
    if (walking) { const s = Math.sin(t * 9); P.legL.rotation.x = s * 0.7; P.legR.rotation.x = -s * 0.7; P.armL.rotation.x = -s * 0.6; P.armR.rotation.x = s * 0.6;
      P.body.position.y = Math.abs(Math.cos(t * 9)) * 0.08; P.head.rotation.z = s * 0.05; }
    else { const s = Math.sin(t * 2.2); const k = Math.min(1, dt * 8);
      ['legL', 'legR', 'armL', 'armR'].forEach(n => P[n].rotation.x *= 1 - k); P.armL.rotation.z = -0.1 - s * 0.04; P.armR.rotation.z = 0.1 + s * 0.04;
      P.body.position.y = s * 0.025; P.head.rotation.z = Math.sin(t * 1.1) * 0.06; }
  };
}
