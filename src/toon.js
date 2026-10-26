import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
// v11: every world box becomes a chunky soft-cornered block (same 0.2 x min-side bevel as the chibis)
const SOFTC = new WeakMap();
export function soften(geo) { if (!geo || geo.type !== 'BoxGeometry' || geo.userData.soft) return geo; if (SOFTC.has(geo)) return SOFTC.get(geo);
  geo.computeBoundingBox(); const bb = geo.boundingBox, sz = bb.getSize(new THREE.Vector3()), ce = bb.getCenter(new THREE.Vector3()), p = geo.attributes.position; let out = geo;
  let axisAligned = true; for (let i = 0; i < p.count && axisAligned; i++) for (const [ax, lo, hi] of [['getX', bb.min.x, bb.max.x], ['getY', bb.min.y, bb.max.y], ['getZ', bb.min.z, bb.max.z]]) { const v = p[ax](i); if (Math.abs(v - lo) > 1e-4 && Math.abs(v - hi) > 1e-4) { axisAligned = false; break; } }
  const mn = Math.min(sz.x, sz.y, sz.z); if (axisAligned && mn >= 0.2 && sz.x * sz.y * sz.z >= 0.05) { out = new RoundedBoxGeometry(sz.x, sz.y, sz.z, 1, mn * 0.2); out.translate(ce.x, ce.y, ce.z); out.userData.soft = true; }
  SOFTC.set(geo, out); return out; }
// v17 camera-occlusion see-through: any world fragment that sits between the camera and the player (inside a soft cone around
// the camera->player ray, in front of the player, above the ground) is ordered-dithered down to ~25% coverage. Shared by the
// toon fill, the outline hulls and the merged basic (glass/sign) materials, so a baked building fades as one piece and its
// outline goes with it. uOccK (0..1) is eased in main.js (on in follow mode, off in the overview).
export const OCC_U = { uOccP: { value: new THREE.Vector3(0, -999, 0) }, uOccK: { value: 0 }, uOccR: { value: 2.3 } };
export const OCC_GLSL = `uniform vec3 uOccP; uniform float uOccK; uniform float uOccR;
float occB2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float occBayer(vec2 p){ return occB2(0.5 * p) * 0.25 + occB2(p); }
float occFade(vec3 w){ if (uOccK < 0.002 || w.y < 0.35) return 0.0; vec3 a = uOccP - cameraPosition; float L = length(a); vec3 u = a / max(L, 1e-4);
  float s = dot(w - cameraPosition, u); if (s <= 0.0) return 0.0; float d = length(w - cameraPosition - u * s), r = uOccR * (0.45 + 0.55 * clamp(s / L, 0.0, 1.0));
  return uOccK * (1.0 - smoothstep(0.55 * r, r, d)) * (1.0 - smoothstep(L - 1.4, L - 0.6, s)); }
#define OCC_CLIP(w) if (occBayer(gl_FragCoord.xy) < occFade(w) * 0.75) discard;
`;
export function occPatch(mat) { mat.onBeforeCompile = sh => { Object.assign(sh.uniforms, OCC_U);
  sh.vertexShader = 'varying vec3 vOccW;\n' + sh.vertexShader.replace('#include <project_vertex>', '#include <project_vertex>\n vOccW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  sh.fragmentShader = 'varying vec3 vOccW;\n' + OCC_GLSL + sh.fragmentShader.replace('void main() {', 'void main() {\n OCC_CLIP(vOccW)'); }; return mat; }
// Custom 3-band toon shader: warm key light vs cool shade.
const keyDir = new THREE.Vector3(-0.6, 1.0, 0.5).normalize();
export const toonUniforms = {
  uKeyDir: { value: keyDir },
  uKeyColor: { value: new THREE.Color(1.14, 1.03, 0.88) },
  uShadeColor: { value: new THREE.Color(0.58, 0.64, 0.86) },
  uSkyAmb: { value: new THREE.Color(0.16, 0.2, 0.28) },
  uGroundAmb: { value: new THREE.Color(0.12, 0.14, 0.06) },
  uFogColor: { value: new THREE.Color(0.72, 0.87, 0.98) },
  uFogRange: { value: new THREE.Vector2(50, 220) },
  uTime: { value: 0 },        // animated sway (instanced grass/flowers)
  uDetail: { value: 1 },      // quality tier: 1 = painterly noise + wood grain + hatching, 0 = off (low-end)
  uRimColor: { value: new THREE.Color(1.0, 0.82, 0.58) }, // warm rim light
  uGrade: { value: new THREE.Vector3(0.9, 0.97, 0.03) }, // saturation, tone-curve gamma, warm lift (in-shader colour grade, no post pass)
  ...OCC_U,
};
const vs = `uniform float uTime; varying vec3 vN; varying vec3 vW; varying vec3 vC;
void main(){ vC = vec3(1.0);
#ifdef USE_COLOR
 vC = color;
#endif
 mat4 mm = modelMatrix;
#ifdef USE_INSTANCING
 mm = modelMatrix * instanceMatrix;
#endif
#ifdef USE_INSTANCING_COLOR
 vC *= instanceColor;
#endif
 vN = normalize(mat3(mm)*normal); vec4 w = mm*vec4(position,1.0);
#ifdef USE_INSTANCING
 w.x += sin(uTime*1.7 + w.x*0.8 + w.z*0.6)*0.09*max(position.y,0.0); w.z += cos(uTime*1.3 + w.z*0.7)*0.05*max(position.y,0.0);
#endif
 vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const fs = `uniform vec3 uColor; uniform vec3 uKeyDir; uniform vec3 uKeyColor; uniform vec3 uShadeColor; uniform vec3 uEmissive; uniform vec3 uFogColor; uniform vec2 uFogRange; uniform vec3 uSkyAmb; uniform vec3 uGroundAmb;
uniform float uDetail; uniform vec3 uRimColor; uniform vec3 uGrade;
varying vec3 vN; varying vec3 vW; varying vec3 vC;
${OCC_GLSL}
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
void main(){ OCC_CLIP(vW) vec3 n=normalize(vN); float d=dot(n,uKeyDir); vec3 alb = uColor*vC;
 // painterly: world-space noise wobbles the band edges + brightness a touch
 // v11 'hand-painted pixel' surface (matches the chibi atlases): triplanar 2x2-cluster texels (8/unit), 3-tone hue-shifted values, plank / brick / tuft details. Flat bands, no dither.
 vec3 an = abs(n); bool top = an.y > max(an.x, an.z); vec2 uvp = top ? vW.xz : (an.x > an.z ? vW.zy : vW.xy);
 vec2 tc = floor(uvp*8.0 + 0.001); float r = h21(tc + vec2(floor(vW.y*0.0), 0.0)); float r2 = h21(floor(tc*0.5) + 17.3);
 float tv = (r2 < 0.22 ? -1.0 : (r2 > 0.8 ? 1.0 : 0.0)) + (r < 0.1 ? -0.5 : (r > 0.93 ? 0.5 : 0.0));
 float lumA = dot(alb, vec3(0.3,0.59,0.11));
 bool isWood = alb.r - alb.b > 0.2 && alb.g < alb.r && alb.g > alb.b;
 bool isGrass = alb.g > alb.r*1.08 && alb.g > alb.b*1.1;
 if (isWood) { vec2 q = top ? (abs(fract(vW.x*0.0)) > 2.0 ? tc.yx : tc) : vec2(tc.x, tc.y); float pi = floor(q.y/4.0);
   if (mod(q.y, 4.0) < 1.0) tv = -2.2; else if (mod(q.x + pi*7.0, 18.0) < 1.0) tv = -1.8; // plank seams + staggered butt joints
   else if (h21(vec2(floor(q.x/3.0), q.y)) > 0.78) tv = -0.9; else if (mod(q.y, 4.0) > 2.5 && r > 0.6) tv = 0.8; }  // grain streaks + top-edge sheen
 else if (isGrass && top) { if (r2 > 0.72) tv = 1.2; if (r < 0.12) tv = -1.2; }  // tufts
 else if (!top && lumA > 0.68) { float row = floor(tc.y/2.0); if (mod(tc.y,2.0) < 1.0 && r > 0.25) tv = -1.0; else if (mod(tc.x + row*3.0, 6.0) < 1.0) tv = -0.8; } // brick / tile courses
 else if (!top && !isGrass) { if (mod(tc.y, 6.0) < 1.0 && mod(tc.x, 2.0) < 1.0) tv = min(tv, -0.6); } // stitch / seam dashes on fabric & panels
 tv *= uDetail;
 vec3 hue = tv < 0.0 ? vec3(0.9, 0.92, 1.06) : vec3(1.05, 1.0, 0.9); alb *= (1.0 + 0.075*tv) * mix(vec3(1.0), hue, min(abs(tv), 1.0)*0.6);
 float dd = d; float nz = 0.0; float px = 0.5;
 float b = dd < -0.05 ? 0.0 : (dd < 0.42 ? 0.62 : 1.0);          // 3 flat tones
 vec3 shade = uShadeColor*vec3(0.98,0.96,1.08);                       // cool shadow
 vec3 light = mix(shade, uKeyColor*vec3(1.03,1.0,0.94), b);           // warm highlight
 float bev = smoothstep(0.25,0.45,n.y)*(1.0-smoothstep(0.8,0.95,n.y)); light += vec3(0.16,0.12,0.06)*bev*uDetail; // warm bevel edge highlight
 light += mix(uGroundAmb, uSkyAmb, n.y*0.5+0.5);
 float ao = 1.0 - 0.2*(1.0-smoothstep(0.0,0.6,vW.y))*step(-0.25,vW.y)*(1.0-abs(n.y)); light *= ao;
 vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0-max(dot(n,v),0.0),3.0);
 rim = smoothstep(0.55,0.8, rim)*0.0*smoothstep(0.0,0.4,d); // barely-there warm edge, no plastic sheen
 // painted paper grain: low-contrast albedo mottling instead of specular highlights
 float paper = 0.0; // matte: texture lives in the texels above
 vec3 c = 0.92*alb*(1.0 + paper)*light + rim*uRimColor + uEmissive;
 float fd = length(cameraPosition - vW); c = mix(c, uFogColor, smoothstep(uFogRange.x, uFogRange.y, fd)*0.85);
 // colour grade: saturation, gentle tone curve, warm lift in the mids
 float lum = dot(c, vec3(0.299,0.587,0.114)); c = mix(vec3(lum), c, uGrade.x); c = pow(max(c, 0.0), vec3(uGrade.y)); c += uGrade.z*vec3(1.0,0.6,0.2)*(1.0-abs(lum*2.0-1.0));
 gl_FragColor = vec4(c,1.0);
 #include <colorspace_fragment>
}`;
export function toonMat(color, emissive = 0x000000) {
  return new THREE.ShaderMaterial({
    uniforms: { ...toonUniforms, uColor: { value: new THREE.Color(color) }, uEmissive: { value: new THREE.Color(emissive) } },
    vertexShader: vs, fragmentShader: fs,
    userData: { toon: true },
  });
}

// Inverted-hull outline
const outlineMat = new THREE.ShaderMaterial({
  uniforms: { uW: { value: 0.022 }, ...OCC_U }, side: THREE.BackSide,
  // depth-aware: hull grows with view distance so lines keep a steady screen width (thin up close, not vanishing far away)
  vertexShader: `uniform float uW; varying vec3 vOW; void main(){ vec4 mv0 = modelViewMatrix*vec4(position,1.0); float k = clamp(-mv0.z/22.0, 0.55, 1.7); vec3 p = position + normal*uW*k; vOW = (modelMatrix*vec4(p,1.0)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader: `varying vec3 vOW; ${OCC_GLSL} void main(){ OCC_CLIP(vOW) gl_FragColor=vec4(0.11,0.12,0.29,1.0);}`,
});
export function toonMesh(geo, color, { outline = true, emissive } = {}) {
  geo = soften(geo); const m = new THREE.Mesh(geo, toonMat(color, emissive));
  if (outline) {
    const g = geo.index ? geo : geo; // smooth normals help hulls; boxes get mergeVertices-like look via slight scale
    const o = new THREE.Mesh(g, outlineMat); o.raycast = () => {}; m.add(o);
  }
  return m;
}

export function getOutlineMat() { return outlineMat; }
export function vcolToonMat() { const m = toonMat(0xffffff); m.vertexColors = true; return m; }
