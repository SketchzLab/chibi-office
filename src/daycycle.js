// Day/night cycle on Calvin's local clock (Asia/Kuala_Lumpur, UTC+8) so every device shows the same sky.
// ?t=HH:MM previews any time (keeps ticking from there; ?tspeed=60 fast-forwards), tests pinned with ?at default to noon.
// Drives the shared toon uniforms (key/shade/ambient/fog/rim/grade) + the sky shader + night glow uniforms.
import * as THREE from 'three';
import { toonUniforms } from './toon.js';
export const TZ_OFF = 8 * 3600; // Asia/Kuala_Lumpur, no DST
const Q = new URLSearchParams(location.search);
export function makeDayClock() {
  const t0 = performance.now(), sp = +(Q.get('tspeed') || 1); let fixed = null;
  const tp = Q.get('t'); if (tp) { const [h, m = 0] = tp.split(':').map(Number); fixed = (h * 3600 + m * 60) % 86400; } else if (Q.get('at') !== null) fixed = 12 * 3600;
  return () => fixed !== null ? (fixed + (performance.now() - t0) / 1000 * sp) % 86400 : ((Date.now() / 1000 + TZ_OFF) % 86400);
}
// phase of the bots' day from local seconds-of-day
export const DAY = { wake: 7 * 3600, work: 9 * 3600, home: 18 * 3600, sleep: 22 * 3600 };
export const isNight = s => s >= DAY.sleep || s < DAY.wake;
// palette keyframes [hour, {...}] (raw linear floats, noon == the original look)
const K = (key, shade, amb, gnd, fog, rim, below, hor, mid, top, sun, sunK, grade) => ({ key, shade, amb, gnd, fog, rim, below, hor, mid, top, sun, sunK, grade });
const NIGHT = K([0.13, 0.16, 0.34], [0.04, 0.05, 0.12], [0.02, 0.026, 0.06], [0.006, 0.008, 0.02], [0.03, 0.04, 0.1], [0.55, 0.66, 1.0], [0.06, 0.08, 0.19], [0.15, 0.17, 0.36], [0.07, 0.09, 0.24], [0.02, 0.03, 0.11], [0.6, 0.7, 1.0], 0.0, [0.85, 1.0, 0.0]);
const NOON = K([1.14, 1.03, 0.88], [0.58, 0.64, 0.86], [0.16, 0.2, 0.28], [0.12, 0.14, 0.06], [0.72, 0.87, 0.98], [1.0, 0.82, 0.58], [0.55, 0.82, 0.86], [0.78, 0.92, 1.0], [0.5, 0.76, 0.97], [0.24, 0.52, 0.9], [1.0, 0.95, 0.8], 0.35, [1.08, 0.96, 0.025]);
const FRAMES = [[0, NIGHT], [5.0, NIGHT],
  [6.0, K([0.72, 0.52, 0.64], [0.3, 0.27, 0.48], [0.1, 0.08, 0.15], [0.04, 0.04, 0.05], [0.5, 0.4, 0.6], [1.0, 0.6, 0.72], [0.42, 0.36, 0.58], [1.0, 0.66, 0.68], [0.6, 0.52, 0.8], [0.2, 0.22, 0.52], [1.0, 0.6, 0.6], 0.5, [1.1, 0.98, 0.03])], // dawn: pink/violet
  [6.8, K([1.25, 0.86, 0.64], [0.55, 0.5, 0.76], [0.16, 0.14, 0.2], [0.1, 0.09, 0.06], [0.98, 0.8, 0.72], [1.0, 0.7, 0.5], [0.78, 0.62, 0.64], [1.0, 0.8, 0.58], [0.86, 0.72, 0.82], [0.36, 0.46, 0.82], [1.0, 0.75, 0.45], 0.7, [1.1, 0.96, 0.04])], // sunrise: golden
  [8.6, NOON], [15.8, NOON],
  [17.4, K([1.2, 0.97, 0.76], [0.57, 0.58, 0.82], [0.17, 0.18, 0.25], [0.12, 0.12, 0.06], [0.86, 0.86, 0.9], [1.0, 0.76, 0.5], [0.62, 0.74, 0.8], [0.95, 0.88, 0.82], [0.62, 0.72, 0.92], [0.28, 0.48, 0.86], [1.0, 0.85, 0.6], 0.45, [1.09, 0.96, 0.035])],
  [18.3, K([1.3, 0.86, 0.56], [0.55, 0.48, 0.72], [0.18, 0.13, 0.16], [0.12, 0.09, 0.05], [1.0, 0.74, 0.58], [1.0, 0.62, 0.4], [0.86, 0.55, 0.5], [1.0, 0.72, 0.44], [0.95, 0.6, 0.62], [0.42, 0.4, 0.76], [1.0, 0.7, 0.35], 0.8, [1.12, 0.96, 0.045])], // golden hour
  [18.95, K([1.05, 0.6, 0.56], [0.45, 0.36, 0.62], [0.16, 0.1, 0.18], [0.08, 0.05, 0.06], [0.85, 0.52, 0.6], [1.0, 0.5, 0.56], [0.55, 0.32, 0.46], [1.0, 0.55, 0.46], [0.86, 0.45, 0.63], [0.3, 0.25, 0.6], [1.0, 0.5, 0.4], 0.75, [1.12, 0.97, 0.04])], // sunset: pink
  [19.7, K([0.46, 0.37, 0.62], [0.18, 0.16, 0.34], [0.06, 0.05, 0.11], [0.02, 0.02, 0.04], [0.16, 0.12, 0.28], [0.8, 0.56, 0.9], [0.2, 0.15, 0.32], [0.55, 0.35, 0.55], [0.3, 0.22, 0.48], [0.08, 0.08, 0.25], [0.9, 0.5, 0.7], 0.3, [1.04, 0.99, 0.015])], // dusk: violet
  [20.6, NIGHT], [24, NIGHT]];
const ss = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
function sample(h) { let i = 0; while (FRAMES[i + 1][0] <= h && i < FRAMES.length - 2) i++; const [h0, A] = FRAMES[i], [h1, B] = FRAMES[i + 1]; const k = ss(h0, h1, h); const o = {};
  for (const f in A) o[f] = Array.isArray(A[f]) ? A[f].map((v, j) => v + (B[f][j] - v) * k) : A[f] + (B[f] - A[f]) * k; return o; }
export const dayUniforms = { uGlow: { value: 0 }, uNight: { value: 0 } }; // shared: night-glow windows/lanterns, fireflies
export function makeDayCycle({ skyMat, atmoEl, raysEl }) {
  const sunDir = new THREE.Vector3(), moonDir = new THREE.Vector3(-0.64, 0.12, -0.76).normalize(), kd = new THREE.Vector3(); let lastOv = -1;
  const S = { h: 12, night: 0, glow: 0, stars: 0, fireflies: 0 };
  function update(sec) {
    const h = sec / 3600; S.h = h; const P = sample(h);
    // sun arc: rises east (+x,+z behind the default camera), sets west (-x,-z, in view)
    const th = Math.PI * (h - 6.3) / (18.9 - 6.3), el = Math.sin(th);
    sunDir.set(Math.cos(th) * 0.78 - 0.28 * Math.max(0, el), el * 1.15, Math.cos(th) * 0.62 + 0.3 * Math.max(0, el)).normalize();
    S.night = 1 - ss(5.2, 6.6, h) + ss(19.3, 20.6, h); S.night = Math.min(1, Math.max(0, h < 12 ? 1 - ss(5.2, 6.6, h) : ss(19.3, 20.6, h)));
    S.glow = h < 12 ? 1 - ss(6.2, 7.1, h) : ss(18.4, 19.2, h); // lamps + windows switch on at dusk, off after sunrise
    S.stars = h < 12 ? 1 - ss(5.0, 6.1, h) : ss(19.4, 20.5, h); S.fireflies = h < 12 ? 1 - ss(4.8, 5.6, h) : ss(19.6, 20.4, h);
    const U = toonUniforms; U.uKeyColor.value.setRGB(...P.key); U.uShadeColor.value.setRGB(...P.shade); U.uSkyAmb.value.setRGB(...P.amb); U.uGroundAmb.value.setRGB(...P.gnd);
    U.uFogColor.value.setRGB(...P.fog); U.uRimColor.value.setRGB(...P.rim); U.uGrade.value.set(...P.grade);
    // key light: the sun (kept a little above the horizon) blending to the moon at night
    kd.copy(sunDir); kd.y = Math.max(kd.y, 0.22); kd.normalize().lerp(moonDir, S.night).normalize(); U.uKeyDir.value.copy(kd);
    const su = skyMat.uniforms; su.uBelow.value.setRGB(...P.below); su.uHor.value.setRGB(...P.hor); su.uMid.value.setRGB(...P.mid); su.uTop.value.setRGB(...P.top);
    su.uSunCol.value.setRGB(...P.sun); su.uSunK.value = P.sunK * ss(-0.12, 0.02, el); su.uSunDir.value.copy(sunDir); su.uMoonDir.value.copy(moonDir); su.uStars.value = S.stars;
    dayUniforms.uGlow.value = S.glow; dayUniforms.uNight.value = S.night;
    // CSS sun-wash overlays: touched only when the value moves (no per-frame DOM writes)
    const ov = Math.round((1 - S.night) * (1 - 0.6 * S.glow) * 20) / 20; if (ov !== lastOv) { lastOv = ov; if (atmoEl) atmoEl.style.opacity = ov; if (raysEl) raysEl.style.opacity = (0.42 * ov * (h > 9 && h < 17 ? 1 : 0.6)).toFixed(2); }
    return S;
  }
  return { update, state: S, sunDir, moonDir };
}
// one-draw-call soft glow dots (lantern halos, window spill, campfire): additive points, brightness follows uGlow
export function glowPoints(scene, pts, { size = 60, color = 0xffc878, always = false } = {}) {
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap(p => p.slice(0, 3)), 3));
  g.setAttribute('aS', new THREE.Float32BufferAttribute(pts.map(p => p[3] || 1), 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uGlow: dayUniforms.uGlow, uSize: { value: size * Math.min(devicePixelRatio, 1.5) }, uColor: { value: new THREE.Color(color) }, uAlways: { value: always ? 1 : 0 }, uTime: { value: 0 } },
    vertexShader: `uniform float uSize, uTime; attribute float aS; varying float vF; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); gl_Position = projectionMatrix*mv; vF = 0.9 + 0.1*sin(uTime*7.0 + position.x*3.0); gl_PointSize = uSize*aS*(10.0 / -mv.z); }`,
    fragmentShader: `uniform float uGlow, uAlways; uniform vec3 uColor; varying float vF; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5, 0.0, d); a *= a; gl_FragColor = vec4(uColor * a * vF * max(uGlow, uAlways*0.35), 1.0); }` });
  const p = new THREE.Points(g, m); p.frustumCulled = false; p.renderOrder = 3; scene.add(p); return p;
}
// unlit "lamp/window" material: pale in daylight, warm glowing after dusk (per-mesh uniform so rooms can switch independently)
export function glowMat(color = 0xffc874, own = false) {
  return new THREE.ShaderMaterial({ uniforms: { uGlow: own ? { value: 0 } : dayUniforms.uGlow, uColor: { value: new THREE.Color(color) } },
    vertexShader: `void main(){ gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: `uniform float uGlow; uniform vec3 uColor; void main(){ vec3 day = mix(vec3(0.55,0.6,0.66), uColor, 0.35); gl_FragColor = vec4(mix(day, uColor*1.25, uGlow), 1.0); }` });
}
// fireflies: one Points draw per swarm, drift + blink in the vertex shader, fade with uNight-ish factor
export function fireflies(scene, { cx, cz, r, n = 36, y0 = 0.4, y1 = 2.2, seed = 5 }) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; const p = [], a = [];
  for (let i = 0; i < n; i++) { const an = rnd() * 6.28, rr = Math.sqrt(rnd()) * r; p.push(cx + Math.cos(an) * rr, y0 + rnd() * (y1 - y0), cz + Math.sin(an) * rr); a.push(rnd() * 100); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('aSeed', new THREE.Float32BufferAttribute(a, 1));
  const m = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uTime: { value: 0 }, uA: { value: 0 }, uSize: { value: 22 * Math.min(devicePixelRatio, 1.5) } },
    vertexShader: `uniform float uTime, uSize; attribute float aSeed; varying float vB; void main(){ vec3 q = position + vec3(sin(uTime*0.4+aSeed)*0.7, sin(uTime*0.6+aSeed*1.7)*0.35, cos(uTime*0.35+aSeed*2.3)*0.7);
      vec4 mv = modelViewMatrix*vec4(q,1.0); gl_Position = projectionMatrix*mv; vB = pow(0.5+0.5*sin(uTime*2.2+aSeed*5.0), 3.0); gl_PointSize = uSize*(0.6+0.4*vB)*(10.0 / -mv.z); }`,
    fragmentShader: `uniform float uA; varying float vB; void main(){ float d = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,d); gl_FragColor = vec4(vec3(0.85,1.0,0.45)*(a*a*0.35 + smoothstep(0.16,0.0,d))*vB*uA, 1.0); }` });
  const pts = new THREE.Points(g, m); pts.frustumCulled = false; pts.renderOrder = 4; pts.visible = false; scene.add(pts); return pts;
}
