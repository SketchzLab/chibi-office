import * as THREE from 'three';
// Soft blob shadows: ONE merged mesh of radial-gradient quads for all static props (1 draw call),
// plus a tiny per-chibi blob that follows them. Offset slightly away from the key light.
const tex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 2, 32, 32, 32); r.addColorStop(0, 'rgba(0,0,0,1)'); r.addColorStop(0.55, 'rgba(0,0,0,0.6)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 64, 64); const t = new THREE.CanvasTexture(c); return t; })();
const mat = new THREE.MeshBasicMaterial({ map: tex, color: 0x2e3f66, transparent: true, opacity: 0.32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });
const OFF = new THREE.Vector2(0.35, -0.3); // away from key light (-0.6, *, 0.5)
export const casters = [];
export function cast(x, z, w, d, ry = 0, y = 0.015, s = 1) { casters.push([x, z, w, d, ry, y, s]); }
export function buildShadows(scene) {
  const pos = [], uv = [], idx = [];
  casters.forEach(([x, z, w, d, ry, y, s], i) => { const c = Math.cos(ry), sn = Math.sin(ry); const cx = x + OFF.x * s, cz = z + OFF.y * s;
    [[-1, -1, 0, 0], [1, -1, 1, 0], [1, 1, 1, 1], [-1, 1, 0, 1]].forEach(([a, b, u, v]) => { const lx = a * w / 2, lz = b * d / 2; pos.push(cx + lx * c + lz * sn, y, cz - lx * sn + lz * c); uv.push(u, v); });
    const o = i * 4; idx.push(o, o + 2, o + 1, o, o + 3, o + 2); });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const m = new THREE.Mesh(g, mat); m.renderOrder = 1; scene.add(m); return m;
}
export function chibiShadow(scene) { const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat.clone()); m.material.opacity = 0.38; m.rotation.x = -Math.PI / 2; m.scale.set(1.9, 1.5, 1); m.renderOrder = 1; scene.add(m); return m; }
