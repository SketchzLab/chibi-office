import * as THREE from 'three';
import { toonMesh } from './toon.js';
// Procedural big-head chibi (~2.3 units tall; head ~45% of height).
export function makeChibi({ name, role, skin = 0xffe0c8, hair, shirt, pants, hairStyle }) {
  const root = new THREE.Group(); root.userData = { name, role, activity: 'Working at desk' };
  const body = new THREE.Group(); root.add(body);
  const torso = toonMesh(new THREE.CapsuleGeometry(0.32, 0.35, 4, 10), shirt); torso.position.y = 0.85; body.add(torso);
  const head = new THREE.Group(); head.position.y = 1.65; body.add(head);
  head.add(toonMesh(new THREE.SphereGeometry(0.62, 24, 18), skin));
  // eyes
  [-0.22, 0.22].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshBasicMaterial({ color: 0x221a2e }));
    e.scale.set(0.8, 1.3, 0.5); e.position.set(x, -0.02, 0.57); head.add(e);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); sh.position.set(x + 0.03, 0.04, 0.62); head.add(sh);
    const bl = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), new THREE.MeshBasicMaterial({ color: 0xff8fa0, transparent: true, opacity: 0.5 })); bl.position.set(x * 1.45, -0.18, 0.54); bl.rotation.y = x > 0 ? 0.45 : -0.45; head.add(bl); });
  // hair cap
  const cap = toonMesh(new THREE.SphereGeometry(0.67, 24, 14, 0, Math.PI * 2, 0, Math.PI * 0.55), hair); cap.position.y = 0.04; cap.rotation.x = -0.25; head.add(cap);
  if (hairStyle === 'twintails') { [-1, 1].forEach(s => { const t = toonMesh(new THREE.CapsuleGeometry(0.17, 0.55, 4, 8), hair); t.position.set(0.68 * s, -0.25, -0.1); t.rotation.z = 0.35 * s; head.add(t);
      const bow = toonMesh(new THREE.BoxGeometry(0.22, 0.14, 0.1), 0xffe066); bow.position.set(0.6 * s, 0.25, -0.05); head.add(bow); }); }
  if (hairStyle === 'spiky') { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const sp = toonMesh(new THREE.ConeGeometry(0.17, 0.45, 6), hair);
      sp.position.set(Math.cos(a) * 0.4, 0.5, Math.sin(a) * 0.4 - 0.05); sp.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); head.add(sp); }
    const gl = toonMesh(new THREE.TorusGeometry(0.13, 0.025, 6, 14), 0x333344, { outline: false }); [-0.22, 0.22].forEach(x => { const g = gl.clone(); g.position.set(x, -0.02, 0.6); head.add(g); }); }
  const limb = (c, len, r) => { const p = new THREE.Group(); const m = toonMesh(new THREE.CapsuleGeometry(r, len, 4, 8), c); m.position.y = -len / 2 - r * 0.5; p.add(m); return p; };
  const armL = limb(shirt, 0.35, 0.11), armR = limb(shirt, 0.35, 0.11); armL.position.set(-0.42, 1.08, 0); armR.position.set(0.42, 1.08, 0); body.add(armL, armR);
  const legL = limb(pants, 0.3, 0.13), legR = limb(pants, 0.3, 0.13); legL.position.set(-0.16, 0.5, 0); legR.position.set(0.16, 0.5, 0); root.add(legL, legR);
  // invisible fat hit-box for easy tapping
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.3; hit.userData.chibi = root; root.add(hit);
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
