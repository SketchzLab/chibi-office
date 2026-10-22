import * as THREE from 'three';
import { toonMesh, toonMat } from './toon.js';
import { bake } from './bake.js';
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const POOL = new THREE.Vector3(-2.6, 0, 7.4);
function onGrassRing(x, z) { const r = Math.hypot(x, z); return r < 9.3 && (Math.abs(x) > 6.8 || Math.abs(z) > 5.3); }
function tree(s = 1) {
  const g = new THREE.Group();
  const trunk = toonMesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 6), 0x9a6a44); trunk.position.y = 0.8; g.add(trunk);
  const greens = [0x5fb550, 0x6cc45a, 0x4fa548];
  [[0, 2.1, 0, 1.0], [0.6, 1.8, 0.2, 0.7], [-0.55, 1.85, -0.1, 0.72], [0.1, 2.7, -0.1, 0.7]].forEach(([x, y, z, r], i) => {
    const m = toonMesh(new THREE.SphereGeometry(r, 8, 6), greens[i % 3]); m.position.set(x, y, z); g.add(m); });
  g.scale.setScalar(s); g.rotation.y = rnd() * 6.28; return g;
}
export function makeNature(scene) {
  const g = new THREE.Group(); const updates = [];
  // ---- pool + stream + waterfall ----
  const rim = toonMesh(new THREE.CylinderGeometry(2.0, 2.0, 0.25, 24), 0xd8cdb8); rim.scale.z = 0.7; rim.position.set(POOL.x, -0.05, POOL.z); g.add(rim);
  const waterMat = new THREE.ShaderMaterial({ transparent: true, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec2 vU; varying vec3 vW; void main(){ vU=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uT; varying vec2 vU; varying vec3 vW;
      void main(){ float r = sin(vW.x*3.0+uT*1.5)*sin(vW.z*3.5-uT*1.2); vec3 c = mix(vec3(0.35,0.78,0.88), vec3(0.55,0.9,0.95), smoothstep(-0.2,0.6,r));
        c = mix(c, vec3(1.0), step(0.82, r)*0.7); gl_FragColor = vec4(c, 0.92);
        #include <colorspace_fragment>
      }` });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(1.75, 24), waterMat); pool.rotation.x = -Math.PI / 2; pool.scale.y = 0.7; pool.position.set(POOL.x, 0.09, POOL.z); g.add(pool);
  // stream from pool to cliff edge
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), waterMat); stream.rotation.x = -Math.PI / 2; stream.position.set(POOL.x, 0.0, 9.3); g.add(stream);
  const fallMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT; varying vec2 vU;
      float h(float x){return fract(sin(x*91.7)*437.5);}
      void main(){ float col = floor(vU.x*14.0); float streak = fract(vU.y*3.0 + uT*(1.6+h(col)*0.8) + h(col)*5.0);
        vec3 c = mix(vec3(0.55,0.85,0.95), vec3(1.0), smoothstep(0.75,0.95,streak));
        float edge = smoothstep(0.0,0.12,vU.x)*smoothstep(1.0,0.88,vU.x); float fade = smoothstep(0.0,0.25,vU.y);
        gl_FragColor = vec4(c, 0.88*edge*fade);
        #include <colorspace_fragment>
      }` });
  const fallGeo = new THREE.PlaneGeometry(1.1, 14, 1, 20); const fp = fallGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const y = fp.getY(i); const k = (7 - y) / 14; fp.setZ(i, Math.pow(k, 0.6) * 1.6); fp.setX(i, fp.getX(i) * (1 + k * 1.2)); }
  const fall = new THREE.Mesh(fallGeo, fallMat); fall.position.set(POOL.x, -7.0, 10.3); g.add(fall);
  // mist puffs at the bottom
  const mistMat = toonMat(0xf4fbff); const mist = new THREE.Group(); mist.userData.dynamic = true; mist.position.set(POOL.x, -14.2, 11.8);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + rnd() * 0.6, 2), mistMat); m.position.set((rnd() - 0.5) * 2.5, rnd() * 0.6, (rnd() - 0.5) * 1.2); mist.add(m); }
  g.add(mist);
  updates.push(t => { waterMat.uniforms.uT.value = t; fallMat.uniforms.uT.value = t; mist.children.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08)); });
  // pool-side rocks and lily pads
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; const r = toonMesh(new THREE.DodecahedronGeometry(0.28 + rnd() * 0.2, 0), 0xc9bca6); r.position.set(POOL.x + Math.cos(a) * 2.0, 0.08, POOL.z + Math.sin(a) * 1.4); if (Math.sin(a) < 0.7) g.add(r); }
  [[-0.5, 0.2], [0.7, -0.3]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), toonMat(0x5fb550)); l.rotation.x = -Math.PI / 2; l.position.set(POOL.x + x, 0.11, POOL.z + z); g.add(l); });
  // ---- trees ----
  [[-8.2, -3.5, 1.2], [-7.6, 2.5, 1.0], [8.0, -4.2, 1.1], [-4.5, -7.6, 1.0], [4.8, -7.3, 1.2], [8.6, -0.8, 0.85], [-1.0, 8.9, 0.7], [-6.6, 5.9, 0.9]].forEach(([x, z, s]) => { const t = tree(s); t.position.set(x, 0, z); g.add(t); });
  // ---- grass detail (instanced, no outlines: cheap) ----
  const tuftGeo = new THREE.ConeGeometry(0.07, 0.35, 4); tuftGeo.translate(0, 0.17, 0);
  const tufts = new THREE.InstancedMesh(tuftGeo, toonMat(0x5fb550), 700); const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let n = 0; while (n < 700) { const x = (rnd() - 0.5) * 19, z = (rnd() - 0.5) * 19; if (!onGrassRing(x, z) || Math.hypot(x - POOL.x, (z - POOL.z) / 0.7) < 2.2) continue;
    e.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5); q.setFromEuler(e); M.compose(new THREE.Vector3(x, -0.05, z), q, new THREE.Vector3(1, 0.6 + rnd() * 0.8, 1)); tufts.setMatrixAt(n++, M); }
  g.add(tufts);
  const flowerGeo = new THREE.IcosahedronGeometry(0.09, 0); const flowerCols = [0xffffff, 0xffd36a, 0xff9bb8, 0xb7a2ff];
  flowerCols.forEach(col => { const f = new THREE.InstancedMesh(flowerGeo, toonMat(col), 40); let k = 0;
    while (k < 40) { const x = (rnd() - 0.5) * 19, z = (rnd() - 0.5) * 19; if (!onGrassRing(x, z) || Math.hypot(x - POOL.x, z - POOL.z) < 2.3) continue; M.makeTranslation(x, 0.2, z); f.setMatrixAt(k++, M); } g.add(f); });
  // bushes on the rim
  for (let i = 0; i < 14; i++) { const a = rnd() * 6.28, r = 9.0 + rnd() * 0.5; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.hypot(x - POOL.x, z - 9.6) < 2) continue;
    const b = toonMesh(new THREE.SphereGeometry(0.5 + rnd() * 0.4, 7, 5), rnd() > 0.5 ? 0x6cc45a : 0x57ad4b); b.position.set(x, 0.1, z); b.scale.y = 0.8; g.add(b); }
  // hanging vines over the cliff edge
  const vineGeo = new THREE.BoxGeometry(0.12, 1, 0.12); vineGeo.translate(0, -0.5, 0);
  const vines = new THREE.InstancedMesh(vineGeo, toonMat(0x4f9e4a), 46); for (let i = 0; i < 46; i++) { const a = i / 46 * 6.28 + rnd() * 0.1; const x = Math.cos(a) * 9.75, z = Math.sin(a) * 9.75;
    if (Math.hypot(x - POOL.x, z - 10) < 1.4) { M.makeScale(0, 0, 0); } else M.compose(new THREE.Vector3(x, -0.5, z), q.identity(), new THREE.Vector3(1, 1 + rnd() * 2.8, 1)); vines.setMatrixAt(i, M); }
  g.add(vines);
  // ---- rooftop garden on a back annex (becomes the back wall block of the office at 75%) ----
  const annex = new THREE.Group(); annex.position.set(-1.5, 0, -6.3);
  const block = toonMesh(new THREE.BoxGeometry(8, 3, 2.4), 0xf4f1ea); block.position.y = 1.5; annex.add(block);
  const trim = toonMesh(new THREE.BoxGeometry(8.2, 0.25, 2.6), 0x4fb3a9); trim.position.y = 3.1; annex.add(trim);
  const roofGrass = toonMesh(new THREE.BoxGeometry(7.8, 0.12, 2.2), 0x86cf5e, { outline: false }); roofGrass.position.y = 3.28; annex.add(roofGrass);
  // railing
  for (let x = -3.9; x <= 3.95; x += 0.65) { const p = toonMesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), 0x3f6f6a, { outline: false }); p.position.set(x, 3.55, 1.2); annex.add(p); }
  const rail = toonMesh(new THREE.BoxGeometry(8, 0.07, 0.07), 0x3f6f6a, { outline: false }); rail.position.set(0, 3.8, 1.2); annex.add(rail);
  // planters + mini tree + bushes
  [[-3, 0.2], [-1.6, -0.5], [2.8, -0.5]].forEach(([x, z]) => { const pl = toonMesh(new THREE.BoxGeometry(0.9, 0.35, 0.6), 0xb98250); pl.position.set(x, 3.5, z); annex.add(pl);
    const b = toonMesh(new THREE.SphereGeometry(0.42, 7, 5), 0x6cc45a); b.position.set(x, 3.9, z); annex.add(b); });
  const rt = tree(0.75); rt.position.set(0.3, 3.3, -0.3); annex.add(rt);
  // telescope on tripod
  const tel = new THREE.Group(); tel.position.set(2.4, 3.34, 0.4);
  [0, 2.1, 4.2].forEach(a => { const l = toonMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.1), 0x8b5a3c, { outline: false }); l.position.set(Math.cos(a) * 0.22, 0.5, Math.sin(a) * 0.22); l.rotation.set(Math.sin(a) * 0.4, 0, -Math.cos(a) * 0.4); tel.add(l); });
  const tube = toonMesh(new THREE.CylinderGeometry(0.1, 0.14, 1.1, 12), 0x2f3b4f); tube.rotation.z = -1.1; tube.position.set(0.15, 1.15, 0); tel.add(tube);
  const lens = toonMesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 12), 0xd9b35a); lens.rotation.z = -1.1; lens.position.set(0.62, 1.38, 0); tel.add(lens);
  annex.add(tel);
  // flag
  const pole = toonMesh(new THREE.CylinderGeometry(0.03, 0.03, 1.6), 0x8b5a3c, { outline: false }); pole.position.set(3.5, 4.1, -0.6); annex.add(pole);
  const flag = toonMesh(new THREE.BoxGeometry(0.7, 0.42, 0.02), 0xff7a59); flag.position.set(3.85, 4.65, -0.6); flag.userData.dynamic = true; annex.add(flag);
  updates.push(t => { flag.rotation.y = Math.sin(t * 3) * 0.25; });
  g.add(annex);
  scene.add(g); bake(g);
  return { update: t => updates.forEach(u => u(t)) };
}
