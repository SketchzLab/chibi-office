// Cozy atmosphere FX: warm light pools, dust motes, drifting petals, sun-ray overlay, quality tier.
// Each system is ONE draw call. All animation happens in vertex shaders (no per-frame CPU work).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const radial = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.45, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); return t; })();

// Quality tier: ?q=low|high overrides; otherwise guess from the device, then demote at runtime if fps stays low.
export function pickTier() { const q = new URLSearchParams(location.search).get('q'); if (q === 'low' || q === 'high') return q;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 8; return mem <= 3 || cores <= 4 ? 'low' : 'high'; }

// pools: [[x, z, radius, colorHex, strength]]
export function lightPools(scene, pools) {
  const geos = pools.map(([x, z, r]) => { const g = new THREE.PlaneGeometry(r * 2, r * 2); g.rotateX(-Math.PI / 2); g.translate(x, 0.025, z); return g; });
  const cols = []; pools.forEach(([, , , col, s = 0.5]) => { const c = new THREE.Color(col).multiplyScalar(s); for (let i = 0; i < 4; i++) cols.push(c.r, c.g, c.b); });
  const geo = mergeGeometries(geos); geo.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
  const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: radial, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  m.renderOrder = 2; scene.add(m); return m;
}

function particles({ n, box, size, color, petals = false, seed = 7 }) {
  let s = seed; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const p = new Float32Array(n * 3), a = new Float32Array(n);
  for (let i = 0; i < n; i++) { p[i * 3] = box[0] + r() * (box[1] - box[0]); p[i * 3 + 1] = box[2] + r() * (box[3] - box[2]); p[i * 3 + 2] = box[4] + r() * (box[5] - box[4]); a[i] = r() * 100; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(a, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: petals ? THREE.NormalBlending : THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uSize: { value: size * Math.min(devicePixelRatio, 1.75) }, uColor: { value: new THREE.Color(color) }, uBox: { value: new THREE.Vector3(box[1] - box[0], box[3] - box[2], box[5] - box[4]) }, uMin: { value: new THREE.Vector3(box[0], box[2], box[4]) } },
    vertexShader: `uniform float uTime, uSize; uniform vec3 uBox, uMin; attribute float aSeed; varying float vA; varying float vR;
      void main(){ vec3 p = position;
        ${petals ? 'p.x += uTime*0.55 + sin(uTime*0.7+aSeed)*0.8; p.y -= uTime*0.22; p.z += sin(uTime*0.5+aSeed*1.3)*0.9;' : 'p.x += sin(uTime*0.23+aSeed)*0.6; p.y += sin(uTime*0.31+aSeed*2.1)*0.35 + uTime*0.04; p.z += cos(uTime*0.19+aSeed)*0.6;'}
        p = uMin + mod(p - uMin, uBox);
        vec4 mv = modelViewMatrix*vec4(p,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uSize * (18.0 / -mv.z);
        vA = ${petals ? '1.0' : '0.5+0.5*sin(uTime*1.3+aSeed*7.0)'}; vR = uTime*1.7 + aSeed; }`,
    fragmentShader: `uniform vec3 uColor; varying float vA; varying float vR;
      void main(){ vec2 q = gl_PointCoord - 0.5;
        ${petals ? 'float c = cos(vR), s = sin(vR); q = mat2(c,-s,s,c)*q; q.y *= 2.1; float d = length(q); if (d > 0.5) discard; vec3 col = mix(uColor, vec3(1.0), 0.35*smoothstep(0.5,0.0,d)); gl_FragColor = vec4(col, 0.92);' : 'float d = length(q); float al = smoothstep(0.5,0.0,d)*vA*0.6; gl_FragColor = vec4(uColor*al, al);'}
        #include <colorspace_fragment>
      }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 4; return pts;
}

export function makeAtmosphere(scene, tier) {
  const sys = [];
  if (tier !== 'low') {
    sys.push(particles({ n: 140, box: [-11, 11, 0.3, 4.5, -8, 8], size: 3.2, color: 0xfff0c8 }));              // indoor dust motes catching the light
    sys.push(particles({ n: 60, box: [-18, 18, 0.5, 9, -18, 18], size: 11, color: 0xffb3cf, petals: true, seed: 3 })); // drifting sakura petals
    sys.forEach(s => scene.add(s));
  }
  // sun rays: static CSS overlay (no blend mode / animation -> no per-frame full-screen recomposite)
  const rays = document.createElement('div'); rays.id = 'rays';
  rays.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;opacity:.42;contain:strict;background:repeating-conic-gradient(from 200deg at 12% -6%, rgba(255,240,200,.0) 0deg, rgba(255,240,200,.24) 3deg, rgba(255,240,200,0) 7deg, rgba(255,240,200,0) 13deg);-webkit-mask-image:radial-gradient(ellipse at 12% 0%, #000 0%, transparent 70%);mask-image:radial-gradient(ellipse at 12% 0%, #000 0%, transparent 70%)';
  const st = document.createElement('style'); st.textContent = '@keyframes rays{from{opacity:.35;transform:rotate(-1deg)}to{opacity:.6;transform:rotate(1.2deg)}}'; document.head.appendChild(st);
  if (tier !== 'low') document.body.appendChild(rays);
  return { update(t) { sys.forEach(s => s.material.uniforms.uTime.value = t); }, systems: sys, rays,
    demote() { sys.forEach(s => s.visible = false); rays.remove(); } };
}

// Steam curling up from mugs: one Points draw for all mugs, animated in the vertex shader.
export function steam(scene, spots, per = 7) {
  const n = spots.length * per, p = new Float32Array(n * 3), a = new Float32Array(n);
  spots.forEach(([x, y, z], i) => { for (let k = 0; k < per; k++) { const j = i * per + k; p.set([x, y, z], j * 3); a[j] = k / per + i * 0.37; } });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.BufferAttribute(a, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uTime: { value: 0 }, uSize: { value: 10 * Math.min(devicePixelRatio, 1.75) } },
    vertexShader: `uniform float uTime, uSize; attribute float aSeed; varying float vA;
      void main(){ float ph = fract(uTime*0.32 + aSeed); vec3 q = position + vec3(sin(ph*7.0+aSeed*9.0)*0.06, ph*0.65, cos(ph*5.0+aSeed*4.0)*0.04);
        vec4 mv = modelViewMatrix*vec4(q,1.0); gl_Position = projectionMatrix*mv; gl_PointSize = uSize*(0.5+ph)*(18.0 / -mv.z); vA = sin(ph*3.14159)*0.55; }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord-0.5); float al = smoothstep(0.5,0.1,d)*vA; gl_FragColor = vec4(vec3(1.0), al); }` });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 4; scene.add(pts); return pts;
}
