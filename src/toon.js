import * as THREE from 'three';
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
  uGrade: { value: new THREE.Vector3(1.08, 0.96, 0.025) }, // saturation, tone-curve gamma, warm lift (in-shader colour grade, no post pass)
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
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f); return mix(mix(h21(i), h21(i+vec2(1,0)), f.x), mix(h21(i+vec2(0,1)), h21(i+vec2(1,1)), f.x), f.y); }
void main(){ vec3 n=normalize(vN); float d=dot(n,uKeyDir); vec3 alb = uColor*vC;
 // painterly: world-space noise wobbles the band edges + brightness a touch
 vec2 np = vW.xz*1.3 + vW.y*0.9; float nz = (vnoise(np) + 0.5*vnoise(np*2.7)) / 1.5 - 0.5; nz *= uDetail;
 float dd = d + nz*0.09;
 // smoother 3-band ramp
 // matte cel ramp: 3 flat tones (shadow / mid / lit) with soft painted edges; shadows tinted warm (rose-violet), not grey-blue
 // pixel-art cel: world-space 'texel' cells (~12/unit) give square pixel clusters; band edges are dithered per cell
 vec3 cell = floor(vW*7.0 + 0.001); float px = mix(0.5, h21(cell.xy + cell.z*7.13), uDetail);
 float dq = dd + (px-0.5)*0.3;
 float b = 0.24 + 0.4*step(0.0, dq) + 0.36*step(0.5, dq); // stronger 3-tone pixel bands
 vec3 shade = uShadeColor*vec3(1.08,0.9,0.92) + vec3(0.03,0.01,0.0);
 vec3 light = mix(shade, uKeyColor, b);
 float term = smoothstep(-0.14,0.0,dd)*(1.0-smoothstep(0.0,0.18,dd)); light += vec3(0.11,0.035,-0.02)*term;
 light += mix(uGroundAmb, uSkyAmb, n.y*0.5+0.5);
 // contact AO near floor (stronger, softer) + soft hatching in the shade band
 float ao = 1.0 - 0.22*(1.0-smoothstep(0.0,0.7,vW.y))*step(-0.25,vW.y)*(1.0-abs(n.y)); light *= ao;
 float hatch = smoothstep(0.55,0.95, sin((vW.x+vW.z+vW.y)*26.0)*0.5+0.5) * (1.0-smoothstep(-0.1,0.15,dd)) * 0.035 * uDetail; light *= 1.0 - hatch;
 light *= 1.0 + nz*0.07;
 // wood: warm horizontal surfaces (floor, desk tops) get planks + grain
 float wood = smoothstep(0.22,0.4, alb.r - alb.b) * step(alb.g, alb.r) * smoothstep(0.85,0.95,abs(n.y)) * uDetail;
 if (wood > 0.0) { float grain = sin(vW.z*7.0 + vnoise(vec2(vW.x*3.0, vW.z*0.8))*5.0)*0.5+0.5; float knot = smoothstep(0.78,0.9, vnoise(vW.xz*vec2(2.2,0.7)));
   alb *= mix(1.0, (0.965 + 0.05*grain) * (1.0 - 0.07*knot), wood); }
 vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0-max(dot(n,v),0.0),3.0);
 rim = smoothstep(0.55,0.8, rim)*0.035*smoothstep(0.0,0.4,d); // barely-there warm edge, no plastic sheen
 // painted paper grain: low-contrast albedo mottling instead of specular highlights
 float paper = (px-0.5)*0.1; // blocky pixel mottling, no gloss
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
  uniforms: { uW: { value: 0.022 } }, side: THREE.BackSide,
  // depth-aware: hull grows with view distance so lines keep a steady screen width (thin up close, not vanishing far away)
  vertexShader: `uniform float uW; void main(){ vec4 mv0 = modelViewMatrix*vec4(position,1.0); float k = clamp(-mv0.z/22.0, 0.55, 1.7); vec3 p = position + normal*uW*k; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader: `void main(){ gl_FragColor=vec4(0.25,0.16,0.17,1.0);}`,
});
export function toonMesh(geo, color, { outline = true, emissive } = {}) {
  const m = new THREE.Mesh(geo, toonMat(color, emissive));
  if (outline) {
    const g = geo.index ? geo : geo; // smooth normals help hulls; boxes get mergeVertices-like look via slight scale
    const o = new THREE.Mesh(g, outlineMat); o.raycast = () => {}; m.add(o);
  }
  return m;
}

export function getOutlineMat() { return outlineMat; }
export function vcolToonMat() { const m = toonMat(0xffffff); m.vertexColors = true; return m; }
