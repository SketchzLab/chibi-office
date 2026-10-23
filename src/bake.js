import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { vcolToonMat, getOutlineMat, soften, occPatch } from './toon.js';
// Merge every static toon mesh under `root` into ONE vertex-coloured toon mesh + ONE outline mesh.
// Skips subtrees flagged userData.dynamic. Returns {before, after} mesh counts.
const sharedMat = vcolToonMat(); const basicVcol = occPatch(new THREE.MeshBasicMaterial({ vertexColors: true })); // glass etc. fades with the occlusion cut-away too
function prep(geo, mat4, color) {
  geo = soften(geo); let g = geo.index ? geo.toNonIndexed() : geo.clone();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'color') g.deleteAttribute(k);
  g.applyMatrix4(mat4);
  if (color) { const n = g.attributes.position.count, a = new Float32Array(n * 3), src = g.attributes.color; // per-vertex tint (e.g. grass/cliff variation) x material colour
    for (let i = 0; i < n; i++) { const t = src ? [src.getX(i), src.getY(i), src.getZ(i)] : [1, 1, 1]; a[i * 3] = color.r * t[0]; a[i * 3 + 1] = color.g * t[1]; a[i * 3 + 2] = color.b * t[2]; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); }
  else if (g.attributes.color) g.deleteAttribute('color');
  return g;
}
export function bake(root) {
  root.updateMatrixWorld(true); const inv = root.matrixWorld.clone().invert();
  const fills = [], hulls = [], kill = [], basics = [];
  const walk = o => { if (o !== root && o.userData.dynamic) return;
    if (o.isMesh && !o.isInstancedMesh && o.material.userData?.toon && !o.material.vertexColors) {
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld);
      const col = o.material.uniforms.uColor.value.clone().add(o.material.uniforms.uEmissive.value);
      fills.push(prep(o.geometry, m, col)); kill.push(o);
      o.children.forEach(c => { if (c.material === getOutlineMat()) hulls.push(prep(c.geometry, m.clone().multiply(c.matrix), null)); });
    }
    else if (o.isMesh && !o.isInstancedMesh && o.material.type === 'MeshBasicMaterial' && !o.material.transparent && !o.material.map && !o.material.vertexColors && o.material.visible !== false) {
      const m = new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld); basics.push(prep(o.geometry, m, o.material.color.clone())); kill.push(o); }
    o.children.slice().forEach(walk); };
  walk(root);
  kill.forEach(o => { o.children.filter(c => c.material === getOutlineMat()).forEach(c => o.remove(c));
    o.children.slice().forEach(c => o.parent.attach(c)); o.parent.remove(o); });
  if (basics.length) root.add(new THREE.Mesh(mergeGeometries(basics), basicVcol));
  if (!fills.length) return;
  const fm = new THREE.Mesh(mergeGeometries(fills), sharedMat); root.add(fm);
  if (hulls.length) { const hm = new THREE.Mesh(mergeGeometries(hulls), getOutlineMat()); hm.raycast = () => {}; root.add(hm); }
}
