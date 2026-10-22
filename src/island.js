import * as THREE from 'three';
import { toonMesh } from './toon.js';
export function makeIsland(scene) {
  const g = new THREE.Group();
  // top slab (wood floor) + rocky underside
  const top = toonMesh(new THREE.CylinderGeometry(9, 9, 0.6, 8), 0xc8915a); top.position.y = -0.3; g.add(top);
  const grass = toonMesh(new THREE.CylinderGeometry(9.3, 9.1, 0.3, 8), 0x7fbf6a); grass.position.y = -0.75; g.add(grass);
  const rock = toonMesh(new THREE.ConeGeometry(9, 7, 8, 3), 0x8a7a8e); rock.rotation.x = Math.PI; rock.position.y = -4.4;
  const p = rock.geometry.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < 3.4 && y > -3.4) { p.setX(i, p.getX(i) * (0.85 + Math.random() * 0.3)); p.setZ(i, p.getZ(i) * (0.85 + Math.random() * 0.3)); } }
  rock.geometry.computeVertexNormals(); g.add(rock);
  // floor planks lines
  for (let i = -7; i <= 7; i += 1.4) { const l = toonMesh(new THREE.BoxGeometry(0.04, 0.02, 2*Math.sqrt(Math.max(0,64-i*i))), 0x9c6a3e, { outline: false }); l.position.set(i, 0.01, 0); g.add(l); }
  // small floating rocks
  [[-12, -2, 4], [11, -4, -6], [6, -6, 11]].forEach(([x, y, z], i) => { const r = toonMesh(new THREE.DodecahedronGeometry(0.8 + i * 0.3), 0x8a7a8e); r.position.set(x, y, z); r.userData.float = i; g.add(r); });
  scene.add(g);
  return g;
}
