// v23 weather visuals: one-draw-call rain streaks around the camera target, overcast grading of the shared toon + sky uniforms,
// scene-wide fog via the toon fog range, lightning flashes (+ a distant bolt) for storms, and rain ripples on the glass roofs.
// The schedule (deterministic per day) lives in weatherplan.js. Call update() right AFTER the day cycle each frame.
import * as THREE from 'three';
import { toonUniforms } from './toon.js';
const lum = c => c.r * 0.3 + c.g * 0.55 + c.b * 0.15, _c = new THREE.Color();
function overcast(col, k, tint = [0.92, 0.97, 1.05], dark = 0.78) { if (k <= 0) return; const l = lum(col) * dark; _c.setRGB(l * tint[0], l * tint[1], l * tint[2]); col.lerp(_c, k); }
export function makeWeather(scene, { tier = 'high', roofGeo = null, rays = null } = {}) {
  const N = tier === 'low' ? 1100 : tier === 'mid' ? 2400 : 4200, R = 26, HH = 22;
  // ---- rain: N streaks (2 verts each), positions wrapped in the vertex shader -> static buffers, 1 draw call
  const seed = new Float32Array(N * 2 * 3), end = new Float32Array(N * 2); for (let i = 0; i < N; i++) { const a = Math.random(), b = Math.random(), c = Math.random(); for (let k = 0; k < 2; k++) { seed.set([a, b, c], (i * 2 + k) * 3); end[i * 2 + k] = k; } }
  const rg = new THREE.BufferGeometry(); rg.setAttribute('position', new THREE.BufferAttribute(seed, 3)); rg.setAttribute('aEnd', new THREE.BufferAttribute(end, 1));
  const rU = { uTime: { value: 0 }, uC: { value: new THREE.Vector3() }, uAmt: { value: 0 }, uNight: { value: 0 }, uStorm: { value: 0 } };
  const rain = new THREE.LineSegments(rg, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: rU,
    vertexShader: `uniform float uTime, uStorm; uniform vec3 uC; attribute float aEnd; varying float vA; const float R = ${R.toFixed(1)}, HH = ${HH.toFixed(1)};
      void main(){ vec3 s = position; float sp = 17.0 + s.z * 6.0 + uStorm * 6.0, len = 0.55 + s.z * 0.35 + uStorm * 0.3;
        vec3 p; p.x = uC.x - R + mod(s.x * 2.0 * R - (uC.x - R), 2.0 * R); p.z = uC.z - R + mod(s.y * 2.0 * R - (uC.z - R), 2.0 * R);
        p.y = uC.y - 4.0 + mod(fract(s.x * 7.13 + s.y * 3.7) * HH - uTime * sp, HH); float w = 0.12 + uStorm * 0.25; p += aEnd * vec3(-w * len, len, -w * 0.4 * len);
        float r2 = length(p.xz - uC.xz) / R; vA = (1.0 - aEnd * 0.85) * (1.0 - smoothstep(0.75, 1.0, r2)) * smoothstep(-4.5, -1.0, p.y - uC.y + 4.0);
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0); }`,
    fragmentShader: `uniform float uAmt, uNight; varying float vA; void main(){ gl_FragColor = vec4(mix(vec3(0.82,0.88,0.95), vec3(0.42,0.48,0.62), uNight), vA * 0.85 * uAmt); }` }));
  rain.frustumCulled = false; rain.renderOrder = 5; rain.visible = false; rain.userData.dynamic = true; scene.add(rain);
  // ---- ripples on the glass skylights / corridor roof (only drawn while raining)
  let ripple = null; if (roofGeo) { const rpU = { uTime: rU.uTime, uAmt: rU.uAmt };
    ripple = new THREE.Mesh(roofGeo, new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: rpU, side: THREE.DoubleSide,
      vertexShader: 'varying vec2 vW; void main(){ vW = position.xz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position + vec3(0.0,0.015,0.0),1.0); }',
      fragmentShader: `uniform float uTime, uAmt; varying vec2 vW; float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        void main(){ float a = 0.0; for (int k = 0; k < 2; k++) { vec2 q = vW * (k == 0 ? 1.7 : 2.6) + float(k) * 3.1; vec2 c = floor(q); float ph = h(c), f = fract(uTime * 0.9 + ph);
          float d = length(fract(q) - 0.5 - (vec2(h(c + 1.3), h(c + 2.7)) - 0.5) * 0.4); a += smoothstep(0.035, 0.0, abs(d - f * 0.42)) * (1.0 - f); }
          gl_FragColor = vec4(vec3(0.9,0.95,1.0), (a * 0.55 + 0.08) * uAmt); }` }));
    ripple.visible = false; ripple.renderOrder = 4; ripple.userData.dynamic = true; scene.add(ripple); }
  // ---- lightning: a full-scene flash + a jagged bolt far out over the sea
  const boltG = new THREE.BufferGeometry(); boltG.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9 * 2 * 3), 3));
  { const ix = []; for (let i = 0; i < 8; i++) { const a = i * 2; ix.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } boltG.setIndex(ix); }
  const bolt = new THREE.Mesh(boltG, new THREE.MeshBasicMaterial({ color: 0xf4f6ff, transparent: true, fog: false, side: THREE.DoubleSide })); bolt.visible = false; bolt.frustumCulled = false; bolt.renderOrder = 6; scene.add(bolt);
  let boltSeg = -1;
  const flashAt = t => { const seg = Math.floor(t / 7.0), r = Math.abs(Math.sin(seg * 91.7)) * 1e4 % 1; if (r > 0.55) return [0, seg]; const t0 = seg * 7 + r * 4.5, u = t - t0; if (u < 0 || u > 0.9) return [0, seg];
    return [Math.max(Math.exp(-u * 14) * (u >= 0 ? 1 : 0), u > 0.18 ? 0.8 * Math.exp(-(u - 0.18) * 10) : 0), seg]; };
  function setBolt(seg, cx, cz, cam) { const r = k => (Math.abs(Math.sin(seg * 12.9898 + k * 78.233)) * 43758.5453) % 1; const a = (cam ? Math.atan2(cz - cam.z, cx - cam.x) : -2.3) + (r(1) - 0.5) * 0.8, d = 58, p = boltG.attributes.position, wx = -Math.sin(a) * 0.8, wz = Math.cos(a) * 0.8;
    let x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y = 20; for (let i = 0; i <= 8; i++) { const k = 1 - i / 10; p.setXYZ(i * 2, x - wx * k, y, z - wz * k); p.setXYZ(i * 2 + 1, x + wx * k, y, z + wz * k); x += (r(i + 2) - 0.5) * 7; y -= 6.0; z += (r(i + 9) - 0.5) * 3; } p.needsUpdate = true; }
  const S = { flash: 0, w: null };
  function update(t, w, { center, skyMat, cam = null }) { S.w = w; const U = toonUniforms, su = skyMat.uniforms;
    const c = Math.min(1, w.cloud * 0.8 + w.rain * 0.2), st = w.storm;
    // overcast: grey, darker, flatter light; the sun disc hides
    if (c > 0.001) { const kd = 1 - 0.5 * c - 0.3 * st; U.uKeyColor.value.multiplyScalar(kd); overcast(U.uKeyColor.value, 0.5 * c, [1, 1, 1.02], 1);
      overcast(U.uShadeColor.value, 0.45 * c, [0.95, 1, 1.05], 1.05); overcast(U.uRimColor.value, 0.6 * c, [1, 1, 1], 0.7);
      [su.uBelow, su.uHor, su.uMid, su.uTop].forEach((u, i) => overcast(u.value, 0.85 * c, [0.93, 0.98, 1.04], [0.78, 0.82, 0.7, 0.6][i] * (1 - 0.25 * st)));
      su.uSunK.value *= 1 - c; su.uStars.value *= 1 - 0.92 * c; overcast(U.uFogColor.value, 0.8 * c, [0.95, 0.98, 1.02], 0.85); }
    // fog / mist: pull the toon fog in (rain thickens it a little too)
    if (w.fog > 0.001) { overcast(U.uFogColor.value, 0.6 * w.fog, [0.98, 0.99, 1.02], 1.15); [su.uBelow, su.uHor, su.uMid, su.uTop].forEach((u, i) => u.value.lerp(U.uFogColor.value, w.fog * [0.9, 0.85, 0.7, 0.5][i])); su.uSunK.value *= 1 - 0.7 * w.fog; }
    if (rays) rays.style.display = c > 0.5 || w.fog > 0.5 ? 'none' : '';
    // lightning
    let fl = 0; if (st > 0.05) { let [f, seg] = flashAt(t); if (S.force && t - S.force < 0.9) { const u = t - S.force; f = Math.max(Math.exp(-u * 14), u > 0.18 ? 0.8 * Math.exp(-(u - 0.18) * 10) : 0); seg = -2 - Math.floor(S.force); } if (S.hold) { f = Math.max(f, S.hold); seg = 77; } fl = f * st; if (seg !== boltSeg && f > 0) { boltSeg = seg; setBolt(seg, center.x, center.z, cam); } }
    S.flash = fl; bolt.visible = fl > 0.25; bolt.material.opacity = Math.min(1, fl * 1.3);
    if (fl > 0.001) { U.uSkyAmb.value.addScalar(0.5 * fl); U.uKeyColor.value.addScalar(0.35 * fl); [su.uHor, su.uMid, su.uTop].forEach(u => u.value.addScalar(0.45 * fl)); }
    // rain particles + roof ripples
    rU.uTime.value = t; rU.uAmt.value = w.rain; rU.uStorm.value = st; rU.uNight.value = 0; rU.uC.value.copy(center);
    rain.visible = w.rain > 0.01; rain.geometry.setDrawRange(0, 2 * Math.round(N * Math.min(1, 0.45 + 0.55 * w.rain + 0.3 * st) * Math.min(1, w.rain * 3)));
    if (ripple) ripple.visible = w.rain > 0.05;
    return S; }
  // fog range for a camera distance d (main sets the toon fog each frame from this): mist pulls it right in, rain a little
  function fog(d) { const w = S.w || { fog: 0, rain: 0, storm: 0 }, n0 = d + 15, f0 = d + 170, k = Math.min(1, 0.4 * w.rain + 0.2 * w.storm);
    let n = n0 + (d * 0.35 - n0) * w.fog, f = f0 + (d + 38 - f0) * w.fog; n += (d * 0.7 - n) * k * (1 - w.fog); f += (d + 85 - f) * k * (1 - w.fog); return [n, f]; }
  return { update, fog, rain, ripple, bolt, state: S, count: N };
}
