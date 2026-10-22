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
};
const vs = `varying vec3 vN; varying vec3 vW; varying vec3 vC;
void main(){ vC = vec3(1.0);
#ifdef USE_COLOR
 vC = color;
#endif
 vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const fs = `uniform vec3 uColor; uniform vec3 uKeyDir; uniform vec3 uKeyColor; uniform vec3 uShadeColor; uniform vec3 uEmissive; uniform vec3 uFogColor; uniform vec2 uFogRange; uniform vec3 uSkyAmb; uniform vec3 uGroundAmb;
varying vec3 vN; varying vec3 vW; varying vec3 vC;
void main(){ vec3 n=normalize(vN); float d=dot(n,uKeyDir);
 // softer 3 bands: smoothstep edges instead of hard steps
 float b = 0.38 + 0.3*smoothstep(-0.08,0.06,d) + 0.32*smoothstep(0.38,0.52,d);
 vec3 light = mix(uShadeColor, uKeyColor, b);
 // warm saturated terminator band (anime look) + hemisphere sky/ground bounce
 float term = smoothstep(-0.12,0.0,d)*(1.0-smoothstep(0.0,0.14,d)); light += vec3(0.10,0.03,-0.02)*term;
 light += mix(uGroundAmb, uSkyAmb, n.y*0.5+0.5);
 // cheap contact AO on vertical faces near the floor
 float ao = 1.0 - 0.18*(1.0-smoothstep(0.0,0.55,vW.y))*step(-0.25,vW.y)*(1.0-abs(n.y)); light *= ao;
 vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0-max(dot(n,v),0.0),3.0);
 rim = smoothstep(0.5,0.62, rim)*0.14;
 vec3 h = normalize(uKeyDir + v); float spec = smoothstep(0.965,0.985,max(dot(n,h),0.0))*0.12;
 vec3 c = uColor*vC*light + (rim + spec)*vec3(1.0,0.97,0.9) + uEmissive;
 float fd = length(cameraPosition - vW); c = mix(c, uFogColor, smoothstep(uFogRange.x, uFogRange.y, fd)*0.85);
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
  uniforms: { uW: { value: 0.012 } }, side: THREE.BackSide,
  vertexShader: `uniform float uW; void main(){ vec3 p = position + normal*uW; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader: `void main(){ gl_FragColor=vec4(0.30,0.24,0.24,1.0);}`,
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
