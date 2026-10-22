import * as THREE from 'three';
// Custom 3-band toon shader: warm key light vs cool shade.
const keyDir = new THREE.Vector3(-0.6, 1.0, 0.5).normalize();
export const toonUniforms = {
  uKeyDir: { value: keyDir },
  uKeyColor: { value: new THREE.Color(1.0, 0.86, 0.68) },
  uShadeColor: { value: new THREE.Color(0.42, 0.45, 0.75) },
};
const vs = `varying vec3 vN; varying vec3 vW;
void main(){ vN = normalize(mat3(modelMatrix)*normal); vec4 w = modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`;
const fs = `uniform vec3 uColor; uniform vec3 uKeyDir; uniform vec3 uKeyColor; uniform vec3 uShadeColor; uniform vec3 uEmissive;
varying vec3 vN; varying vec3 vW;
void main(){ vec3 n=normalize(vN); float d=dot(n,uKeyDir);
 float b = d>0.45?1.0:(d>0.0?0.62:0.32);
 vec3 light = mix(uShadeColor, uKeyColor, b);
 vec3 v = normalize(cameraPosition - vW); float rim = pow(1.0-max(dot(n,v),0.0),3.0);
 rim = step(0.55, rim)*0.18*step(0.0,d);
 vec3 c = uColor*light + rim*uKeyColor + uEmissive;
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
  uniforms: { uW: { value: 0.025 } }, side: THREE.BackSide,
  vertexShader: `uniform float uW; void main(){ vec3 p = position + normal*uW; gl_Position = projectionMatrix*modelViewMatrix*vec4(p,1.0);}`,
  fragmentShader: `void main(){ gl_FragColor=vec4(0.08,0.06,0.12,1.0);}`,
});
export function toonMesh(geo, color, { outline = true, emissive } = {}) {
  const m = new THREE.Mesh(geo, toonMat(color, emissive));
  if (outline) {
    const g = geo.index ? geo : geo; // smooth normals help hulls; boxes get mergeVertices-like look via slight scale
    const o = new THREE.Mesh(g, outlineMat); o.raycast = () => {}; m.add(o);
  }
  return m;
}
