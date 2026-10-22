import * as THREE from 'three';
// Custom 3-band toon shader: warm key light vs cool shade.
const keyDir = new THREE.Vector3(-0.6, 1.0, 0.5).normalize();
export const toonUniforms = {
  uKeyDir: { value: keyDir },
  uKeyColor: { value: new THREE.Color(1.1, 1.0, 0.86) },
  uShadeColor: { value: new THREE.Color(0.6, 0.67, 0.86) },
  uFogColor: { value: new THREE.Color(0.72, 0.87, 0.98) },
  uFogRange: { value: new THREE.Vector2(50, 220) },
};
const vs = `varying vec3 vN; varying vec3 vW;
void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const fs = `uniform vec3 uColor; uniform vec3 uKeyDir; uniform vec3 uKeyColor; uniform vec3 uShadeColor; uniform vec3 uEmissive; uniform vec3 uFogColor; uniform vec2 uFogRange;
varying vec3 vN; varying vec3 vW;
void main(){ vec3 n=normalize(vN); float d=dot(n,uKeyDir);
 // softer 3 bands: smoothstep edges instead of hard steps
 float b = 0.38 + 0.3*smoothstep(-0.08,0.06,d) + 0.32*smoothstep(0.38,0.52,d);
 vec3 light = mix(uShadeColor, uKeyColor, b);
 vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0-max(dot(n,v),0.0),3.0);
 rim = smoothstep(0.5,0.62, rim)*0.14;
 vec3 c = uColor*light + rim*vec3(1.0,0.97,0.9) + uEmissive;
 float fd = length(cameraPosition - vW); c = mix(c, uFogColor, smoothstep(uFogRange.x, uFogRange.y, fd)*0.85);
 gl_FragColor = vec4(c,1.0);
 #include <colorspace_fragment>
}`;
export function toonMat(color, emissive = 0x000000) {
  return new THREE.ShaderMaterial({
    uniforms: { ...toonUniforms, uColor: { value: new THREE.Color(color) }, uEmissive: { value: new THREE.Color(emissive) } },
    vertexShader: vs, fragmentShader: fs,
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
