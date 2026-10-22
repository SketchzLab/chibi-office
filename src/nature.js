import * as THREE from 'three';
import { toonMesh, toonMat } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { ISLAND_R as R, FLOOR, POOL as PL, BACK_Z } from './layout.js';
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const POOL = new THREE.Vector3(PL.x, 0, PL.z);
function onGrassRing(x, z) { const r = Math.hypot(x, z); return r < R - 0.7 && (x < FLOOR.x0 - 0.3 || x > FLOOR.x1 + 0.3 || z < FLOOR.z0 - 0.3 || z > FLOOR.z1 + 0.3) && !(z < BACK_Z - 0.2 && z > BACK_Z - 3 && x > -7.2 && x < 5.2); }
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
  const rim = toonMesh(new THREE.CylinderGeometry(PL.rx + 0.35, PL.rx + 0.35, 0.25, 28), 0xd8cdb8); rim.scale.z = PL.rz / PL.rx; rim.position.set(POOL.x, -0.05, POOL.z); g.add(rim);
  const waterMat = new THREE.ShaderMaterial({ transparent: true, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec2 vU; varying vec3 vW; void main(){ vU=uv; vec4 w=modelMatrix*vec4(position,1.); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }`,
    fragmentShader: `uniform float uT; varying vec2 vU; varying vec3 vW;
      void main(){ float r = sin(vW.x*3.0+uT*1.5)*sin(vW.z*3.5-uT*1.2) + 0.35*sin(vW.x*7.0-vW.z*5.0+uT*2.3);
        float edge = length(vU-0.5)*2.0; // 0 centre .. 1 rim (circle uv)
        vec3 deep = vec3(0.16,0.58,0.78), shallow = vec3(0.45,0.88,0.92);
        vec3 c = mix(deep, shallow, smoothstep(0.2,0.95,edge)); c = mix(c, c*1.15, smoothstep(-0.2,0.7,r));
        vec3 V = normalize(cameraPosition - vW); float fr = pow(1.0-abs(V.y),3.0); c = mix(c, vec3(0.85,0.95,1.0), fr*0.5);
        c = mix(c, vec3(1.0), step(1.05, r)*0.6); c = mix(c, vec3(1.0), smoothstep(0.88,0.97,edge)*0.8);
        gl_FragColor = vec4(c, 0.94);
        #include <colorspace_fragment>
      }` });
  const pool = new THREE.Mesh(new THREE.CircleGeometry(PL.rx, 28), waterMat); pool.rotation.x = -Math.PI / 2; pool.scale.y = PL.rz / PL.rx; pool.position.set(POOL.x, 0.09, POOL.z); g.add(pool);
  // stream from pool to cliff edge
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(1.4, R - PL.z - PL.rz + 0.6), waterMat); stream.rotation.x = -Math.PI / 2; stream.position.set(POOL.x, 0.0, (PL.z + PL.rz + Math.sqrt(R * R - PL.x * PL.x)) / 2); g.add(stream);
  const fallMat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, uniforms: { uT: { value: 0 } },
    vertexShader: `varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
    fragmentShader: `uniform float uT; varying vec2 vU;
      float h(float x){return fract(sin(x*91.7)*437.5);}
      void main(){ float col = floor(vU.x*14.0); float streak = fract(vU.y*3.0 + uT*(1.6+h(col)*0.8) + h(col)*5.0);
        vec3 c = mix(vec3(0.55,0.85,0.95), vec3(1.0), smoothstep(0.75,0.95,streak));
        float edge = smoothstep(0.0,0.12,vU.x)*smoothstep(1.0,0.88,vU.x); float fade = smoothstep(0.0,0.25,vU.y);
        c = mix(c, vec3(1.0), smoothstep(0.93,1.0,vU.y)*0.9); c = mix(c, vec3(0.3,0.7,0.85), 0.25*(1.0-abs(vU.x-0.5)*2.0)*smoothstep(0.4,0.9,streak));
        gl_FragColor = vec4(c, 0.88*edge*fade);
        #include <colorspace_fragment>
      }` });
  const fallGeo = new THREE.PlaneGeometry(2.0, 20, 1, 24); const fp = fallGeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const y = fp.getY(i); const k = (10 - y) / 20; fp.setZ(i, Math.pow(k, 0.6) * 2.2); fp.setX(i, fp.getX(i) * (1 + k * 1.2)); }
  const fall = new THREE.Mesh(fallGeo, fallMat); fall.position.set(POOL.x, -10.0, Math.sqrt(R * R - PL.x * PL.x) - 0.1); g.add(fall);
  // mist puffs at the bottom
  const mistMat = toonMat(0xf4fbff); const mist = new THREE.Group(); mist.userData.dynamic = true; mist.position.set(POOL.x, -20.2, Math.sqrt(R * R - PL.x * PL.x) + 2.0);
  for (let i = 0; i < 5; i++) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.7 + rnd() * 0.6, 2), mistMat); m.position.set((rnd() - 0.5) * 2.5, rnd() * 0.6, (rnd() - 0.5) * 1.2); mist.add(m); }
  g.add(mist);
  updates.push(t => { waterMat.uniforms.uT.value = t; fallMat.uniforms.uT.value = t; mist.children.forEach((m, i) => m.scale.setScalar(1 + Math.sin(t * 2 + i) * 0.08)); });
  // foam lip where the stream tips over the edge
  const lipZ = Math.sqrt(R * R - PL.x * PL.x) - 0.15; const lip = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 1.6, 3, 8), toonMat(0xffffff)); lip.rotation.z = Math.PI / 2; lip.position.set(POOL.x, 0.02, lipZ); g.add(lip);
  // pool-side rocks and lily pads
  for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28; const r = toonMesh(new THREE.DodecahedronGeometry(0.28 + rnd() * 0.2, 0), 0xc9bca6); r.position.set(POOL.x + Math.cos(a) * (PL.rx + 0.3), 0.08, POOL.z + Math.sin(a) * (PL.rz + 0.3)); if (Math.sin(a) < 0.7) g.add(r); }
  [[-0.5, 0.2], [0.7, -0.3]].forEach(([x, z]) => { const l = new THREE.Mesh(new THREE.CircleGeometry(0.25, 10), toonMat(0x5fb550)); l.rotation.x = -Math.PI / 2; l.position.set(POOL.x + x, 0.11, POOL.z + z); g.add(l); });
  const M = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  // ---- front garden: stepping-stone paths + flower beds (fills the open lawn) ----
  const stoneGeo = new THREE.CylinderGeometry(0.42, 0.46, 0.12, 9); const stones = new THREE.InstancedMesh(stoneGeo, toonMat(0xe6dccb), 40); let si = 0;
    const addStone = (x, z) => { if (si < 40) { e.set(0, rnd() * 3, 0); q.setFromEuler(e); M.compose(new THREE.Vector3(x, -0.03, z), q, new THREE.Vector3(1, 1, 0.85)); stones.setMatrixAt(si++, M); } };
  for (let t = 0; t <= 1; t += 0.12) { addStone(0.5 - 3.0 * t, FLOOR.z1 + 0.7 + 2.9 * t); } for (let t = 0.1; t <= 1; t += 0.16) { addStone(0.6 + 2.6 * t, FLOOR.z1 + 1.9 + 2.4 * t); }
  stones.count = si; g.add(stones);
  [[4.6, 11.0, 2.2, 1.3], [8.2, 10.0, 1.9, 1.2], [-8.6, 9.6, 1.6, 1.0]].forEach(([x, z, w, d]) => {
    const bed = toonMesh(new THREE.CylinderGeometry(1, 1, 0.25, 16), 0x9a6a44); bed.scale.set(w, 1, d); bed.position.set(x, 0.0, z); g.add(bed);
    const soil = toonMesh(new THREE.CylinderGeometry(0.92, 0.92, 0.05, 16), 0x6b4a33, { outline: false }); soil.scale.set(w, 1, d); soil.position.set(x, 0.13, z); g.add(soil);
    const cols = [0xff9bb8, 0xffd36a, 0xffffff, 0xb7a2ff, 0xff7a59];
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * 0.8; const fx = x + Math.cos(a) * rr * w, fz = z + Math.sin(a) * rr * d;
      const stem = toonMesh(new THREE.SphereGeometry(0.22, 6, 4), 0x5fb550, { outline: false }); stem.position.set(fx, 0.3, fz); g.add(stem);
      const fl = toonMesh(new THREE.SphereGeometry(0.13, 6, 4), cols[i % cols.length], { outline: false }); fl.position.set(fx, 0.52, fz); g.add(fl); } });
  const bench = new THREE.Group(); bench.position.set(-1.2, 0, 13.0); bench.rotation.y = Math.PI + 0.3;
  const seat = toonMesh(new THREE.BoxGeometry(1.8, 0.1, 0.55), 0xc98d55); seat.position.y = 0.48; bench.add(seat);
  const bk = toonMesh(new THREE.BoxGeometry(1.8, 0.45, 0.08), 0xc98d55); bk.position.set(0, 0.8, -0.26); bench.add(bk);
  [-0.75, 0.75].forEach(x => { const l = toonMesh(new THREE.BoxGeometry(0.1, 0.48, 0.5), 0x3f6f6a, { outline: false }); l.position.set(x, 0.24, 0); bench.add(l); }); g.add(bench);
  // ---- trees ----
  [[-13.0, -3.5, 1.5], [-12.6, 3.8, 1.3], [-9.5, -10.2, 1.4], [-2.0, -12.4, 1.1], [8.6, -10.6, 1.5], [12.8, -4.4, 1.3], [13.4, 1.6, 1.1], [-11.0, 8.6, 1.2], [-9.2, 11.0, 0.9], [11.8, -7.6, 1.0]].forEach(([x, z, s]) => { const t = tree(s); t.position.set(x, 0, z); cast(x, z, 3.4 * s, 3.0 * s, 0, -0.03, 1.6); g.add(t); });
  // ---- grass detail (instanced, no outlines: cheap) ----
  const tuftGeo = new THREE.ConeGeometry(0.08, 0.38, 3, 1, true); tuftGeo.translate(0, 0.17, 0);
  const NT = 1500; const tufts = new THREE.InstancedMesh(tuftGeo, toonMat(0x63b852), NT); tufts.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NT * 3).map((_, i) => 0.85 + ((i * 7919) % 100) / 100 * 0.3), 3);
  let n = 0; while (n < NT) { const x = (rnd() - 0.5) * 2 * R, z = (rnd() - 0.5) * 2 * R; if (!onGrassRing(x, z) || Math.hypot((x - POOL.x) / (PL.rx + 0.6), (z - POOL.z) / (PL.rz + 0.6)) < 1 || (Math.abs(x - POOL.x) < 1 && z > POOL.z) || [[4.6, 11.0, 2.4, 1.5], [8.2, 10.0, 2.1, 1.4], [-8.6, 9.6, 1.8, 1.2]].some(([bx, bz, bw, bd]) => Math.hypot((x - bx) / bw, (z - bz) / bd) < 1)) continue;
    e.set((rnd() - 0.5) * 0.5, 0, (rnd() - 0.5) * 0.5); q.setFromEuler(e); M.compose(new THREE.Vector3(x, -0.05, z), q, new THREE.Vector3(1.3, 0.45 + rnd() * 0.5, 1.3)); tufts.setMatrixAt(n++, M); }
  g.add(tufts);
  const flowerGeo = new THREE.IcosahedronGeometry(0.09, 0); const flowerCols = [0xffffff, 0xffd36a, 0xff9bb8, 0xb7a2ff];
  flowerCols.forEach(col => { const f = new THREE.InstancedMesh(flowerGeo, toonMat(col), 90); let k = 0;
    while (k < 90) { const x = (rnd() - 0.5) * 2 * R, z = (rnd() - 0.5) * 2 * R; if (!onGrassRing(x, z) || Math.hypot(x - POOL.x, z - POOL.z) < PL.rx + 0.8) continue; M.makeTranslation(x, 0.2, z); f.setMatrixAt(k++, M); } g.add(f); });
  // bushes on the rim
  for (let i = 0; i < 26; i++) { const a = rnd() * 6.28, r = R - 1.0 + rnd() * 0.5; const x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x - POOL.x) < 2.2 && z > 0) continue;
    const b = toonMesh(new THREE.SphereGeometry(0.5 + rnd() * 0.4, 7, 5), rnd() > 0.5 ? 0x6cc45a : 0x57ad4b); b.position.set(x, 0.1, z); b.scale.y = 0.8; g.add(b); }
  // hanging vines over the cliff edge
  const vineGeo = new THREE.BoxGeometry(0.22, 1, 0.05); vineGeo.translate(0, -0.5, 0);
  const vines = new THREE.InstancedMesh(vineGeo, toonMat(0x3f8f45), 72); for (let i = 0; i < 72; i++) { const a = i / 72 * 6.28 + rnd() * 0.06; const x = Math.cos(a) * (R - 0.32), z = Math.sin(a) * (R - 0.32); e.set(0, -a + Math.PI / 2, 0.08 * (rnd() - 0.5)); q.setFromEuler(e);
    if (Math.abs(x - POOL.x) < 1.4 && z > 0) { M.makeScale(0, 0, 0); } else M.compose(new THREE.Vector3(x, -0.45, z), q, new THREE.Vector3(0.8 + rnd() * 0.6, 0.5 + rnd() * 1.4, 1)); vines.setMatrixAt(i, M); }
  g.add(vines);
  // ---- rooftop garden on a back annex (becomes the back wall block of the office at 75%) ----
  const annex = new THREE.Group(); annex.position.set(-1.0, 0, BACK_Z - 1.3);
  const block = toonMesh(new THREE.BoxGeometry(12, 3, 2.4), 0xf4f1ea); block.position.y = 1.5; annex.add(block);
  const trim = toonMesh(new THREE.BoxGeometry(12.2, 0.25, 2.6), 0x4fb3a9); trim.position.y = 3.1; annex.add(trim);
  const roofGrass = toonMesh(new THREE.BoxGeometry(11.8, 0.12, 2.2), 0x86cf5e, { outline: false }); roofGrass.position.y = 3.28; annex.add(roofGrass);
  // railing
  for (let x = -5.9; x <= 5.95; x += 0.65) { const p = toonMesh(new THREE.BoxGeometry(0.06, 0.5, 0.06), 0x3f6f6a, { outline: false }); p.position.set(x, 3.55, 1.2); annex.add(p); }
  const rail = toonMesh(new THREE.BoxGeometry(12, 0.07, 0.07), 0x3f6f6a, { outline: false }); rail.position.set(0, 3.8, 1.2); annex.add(rail);
  // planters + mini tree + bushes
  [[-5, 0.2], [-3.4, -0.5], [-1.4, 0.3], [4.6, -0.5]].forEach(([x, z]) => { const pl = toonMesh(new THREE.BoxGeometry(0.9, 0.35, 0.6), 0xb98250); pl.position.set(x, 3.5, z); annex.add(pl);
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
