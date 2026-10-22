import * as THREE from 'three';
import { toonMesh, toonMat } from './toon.js';
import { bake } from './bake.js';
// Procedural big-head chibi (~2.3 units tall; head ~45% of height).
export function makeChibi({ name, role, skin = 0xffe0c8, hair, shirt, pants, hairStyle, headphones }) {
  const root = new THREE.Group(); root.userData = { name, role, activity: 'Working at desk' };
  const body = new THREE.Group(); root.add(body);
  const torsoGeo = new THREE.SphereGeometry(0.4, 14, 10); const torso = toonMesh(torsoGeo, shirt); torso.scale.set(1, 1.08, 0.9); torso.position.y = 0.82; body.add(torso);
  const head = new THREE.Group(); head.position.y = 1.72; body.add(head);
  const face = toonMesh(new THREE.SphereGeometry(0.66, 18, 14), skin); face.scale.set(1.06, 0.96, 1); head.add(face);
  // eyes
  [-0.22, 0.22].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshBasicMaterial({ color: 0x2a1f3a }));
    e.scale.set(0.95, 1.4, 0.5); e.position.set(x, -0.04, 0.6); head.add(e);
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); sh.position.set(x + 0.03, 0.03, 0.66); head.add(sh);
    const bl = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), new THREE.MeshBasicMaterial({ color: 0xffb8bc })); bl.position.set(x * 1.5, -0.2, 0.58); bl.rotation.y = x > 0 ? 0.45 : -0.45; head.add(bl); });
  // hair cap
  const cap = toonMesh(new THREE.SphereGeometry(0.72, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.56), hair); cap.scale.set(1.06, 1, 1.02); cap.position.y = 0.04; cap.rotation.x = -0.28; head.add(cap);
  // soft fringe bangs
  [-0.32, 0, 0.32].forEach((x, i) => { const b = toonMesh(new THREE.SphereGeometry(0.22, 12, 10), hair); b.scale.set(1.1, 0.75, 0.6); b.position.set(x, 0.36 - Math.abs(x) * 0.25, 0.52); head.add(b); });
  // little rounded ears/nose and a smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.016, 6, 12, Math.PI), new THREE.MeshBasicMaterial({ color: 0x8a3b3b })); smile.rotation.z = Math.PI; smile.position.set(0, -0.24, 0.62); head.add(smile);
  if (hairStyle === 'twintails') { [-1, 1].forEach(s => { const t = toonMesh(new THREE.CapsuleGeometry(0.17, 0.55, 4, 8), hair); t.position.set(0.74 * s, -0.25, -0.1); t.rotation.z = 0.35 * s; head.add(t);
      const bow = toonMesh(new THREE.BoxGeometry(0.22, 0.14, 0.1), 0xffe066); bow.position.set(0.66 * s, 0.25, -0.05); head.add(bow); }); }
  if (hairStyle === 'spiky') { for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2; const sp = toonMesh(new THREE.ConeGeometry(0.17, 0.45, 6), hair);
      sp.position.set(Math.cos(a) * 0.42, 0.56, Math.sin(a) * 0.42 - 0.08); sp.rotation.set(Math.sin(a) * 0.7, 0, -Math.cos(a) * 0.7); head.add(sp); }
    const gl = toonMesh(new THREE.TorusGeometry(0.13, 0.025, 6, 14), 0x333344, { outline: false }); [-0.22, 0.22].forEach(x => { const g = gl.clone(); g.position.set(x, -0.04, 0.66); head.add(g); }); }
  if (hairStyle === 'bun') { const bun = toonMesh(new THREE.SphereGeometry(0.3, 14, 10), hair); bun.position.set(0, 0.62, -0.38); head.add(bun);
    const pin = toonMesh(new THREE.CylinderGeometry(0.025, 0.025, 0.7, 6), 0x8b5a3c, { outline: false }); pin.rotation.z = 1.1; pin.position.set(0, 0.66, -0.4); head.add(pin);
    const back = toonMesh(new THREE.SphereGeometry(0.68, 16, 10), hair); back.scale.set(1.04, 0.9, 0.7); back.position.set(0, -0.05, -0.28); head.add(back);
    const glasses = toonMesh(new THREE.TorusGeometry(0.15, 0.02, 6, 16), 0xb08a4a, { outline: false }); [-0.22, 0.22].forEach(x => { const g = glasses.clone(); g.position.set(x, -0.04, 0.66); head.add(g); }); }
  if (hairStyle === 'bob') { [-1, 1].forEach(s => { const sd = toonMesh(new THREE.SphereGeometry(0.34, 14, 10), hair); sd.scale.set(0.7, 1.15, 0.9); sd.position.set(0.6 * s, -0.22, 0.05); head.add(sd); });
    const back = toonMesh(new THREE.SphereGeometry(0.7, 16, 10), hair); back.scale.set(1.05, 1.0, 0.75); back.position.set(0, -0.12, -0.25); head.add(back); }
  if (headphones) { const band = toonMesh(new THREE.TorusGeometry(0.78, 0.07, 6, 20, Math.PI), 0x2b2d42); band.position.set(0, 0.05, -0.05); head.add(band);
    [-1, 1].forEach(s => { const cup = toonMesh(new THREE.CylinderGeometry(0.22, 0.22, 0.16, 14), 0xff5d8f); cup.rotation.z = Math.PI / 2; cup.position.set(0.78 * s, 0.0, -0.05); head.add(cup); }); }
  const limb = (c, len, r, end, endR) => { const p = new THREE.Group(); const m = toonMesh(new THREE.CapsuleGeometry(r, len, 4, 10), c); m.position.y = -len / 2 - r * 0.5; p.add(m);
    if (end !== undefined) { const e = toonMesh(new THREE.SphereGeometry(endR, 12, 10), end); e.position.y = -len - r; if (endR > 0.14) { e.scale.set(1, 0.7, 1.35); e.position.z = 0.05; } p.add(e); } return p; };
  const armL = limb(shirt, 0.28, 0.12, skin, 0.12), armR = limb(shirt, 0.28, 0.12, skin, 0.12); armL.position.set(-0.44, 1.08, 0); armR.position.set(0.44, 1.08, 0); body.add(armL, armR);
  const legL = limb(pants, 0.24, 0.15, 0x4a3b3f, 0.16), legR = limb(pants, 0.24, 0.15, 0x4a3b3f, 0.16); legL.position.set(-0.16, 0.5, 0); legR.position.set(0.16, 0.5, 0); root.add(legL, legR);
  // invisible fat hit-box for easy tapping
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.3; hit.userData.chibi = root; root.add(hit);
  // merge each rigid part into one fill + one outline batch
  [head, armL, armR, legL, legR].forEach(bake); head.userData.dynamic = true; bake(body);
  // held props (toggled by the behaviour system; not baked so they can show/hide)
  const P = (geo, c) => { const m = new THREE.Mesh(geo, toonMat(c)); return m; };
  const handY = -0.52;
  const cup = new THREE.Group(); cup.add(P(new THREE.CylinderGeometry(0.11, 0.09, 0.22, 10), 0xffffff)); const liq = P(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 10), 0x6b4226); liq.position.y = 0.1; cup.add(liq); cup.position.set(0, handY, 0.1); armR.add(cup);
  const spinner = new THREE.Group(); for (let i = 0; i < 3; i++) { const lobe = P(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), 0xff5d8f); const a = i / 3 * 6.28; lobe.position.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12); spinner.add(lobe); }
  spinner.add(P(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), 0x2b2d42)); spinner.position.set(0, handY - 0.05, 0.08); armR.add(spinner);
  const pencil = P(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), 0xffd36a); pencil.rotation.x = 1.2; pencil.position.set(0, handY, 0.12); armR.add(pencil);
  const book = new THREE.Group(); const cov = P(new THREE.BoxGeometry(0.7, 0.06, 0.5), 0x4f6fb3); book.add(cov); const pg = P(new THREE.BoxGeometry(0.64, 0.07, 0.46), 0xfdf7ea); pg.position.y = 0.01; book.add(pg); book.rotation.x = -0.9; book.position.set(0, 0.95, 0.6); body.add(book);
  const pad = P(new THREE.BoxGeometry(0.6, 0.04, 0.45), 0xfdf7ea); pad.rotation.x = -0.6; pad.position.set(0, 0.85, 0.62); body.add(pad);
  const ctrl = new THREE.Group(); ctrl.add(P(new THREE.BoxGeometry(0.5, 0.1, 0.24), 0x5a5f7a)); [-0.18, 0.18].forEach(x => { const g = P(new THREE.SphereGeometry(0.1, 8, 6), 0x5a5f7a); g.position.set(x, 0, 0.06); ctrl.add(g); }); const btn = P(new THREE.SphereGeometry(0.04, 6, 4), 0xff5d8f); btn.position.set(0.15, 0.06, -0.02); ctrl.add(btn);
  ctrl.rotation.x = -0.5; ctrl.position.set(0, 0.8, 0.62); body.add(ctrl);
  const props = { cup, liq, spinner, pencil, book, pad, ctrl }; Object.values(props).forEach(o => { if (o !== liq) o.visible = false; });
  root.userData.parts = { body, head, armL, armR, legL, legR }; root.userData.hit = hit; root.userData.props = props;
  return root;
}
