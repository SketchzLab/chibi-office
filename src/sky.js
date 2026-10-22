import * as THREE from 'three';
import { toonMesh, toonMat } from './toon.js';
export function makeSky(scene) {
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `varying vec3 vP;
    void main(){ float y=vP.y;
      vec3 below=vec3(0.55,0.82,0.86), hor=vec3(0.78,0.92,1.0), mid=vec3(0.5,0.76,0.97), top=vec3(0.24,0.52,0.9);
      vec3 c = y<0.0? mix(hor, below, smoothstep(0.0,-0.5,y)) : y<0.25? mix(hor,mid,smoothstep(0.0,0.25,y)) : mix(mid,top,smoothstep(0.25,0.9,y));
      // sun glow
      float s = max(dot(vP, normalize(vec3(-0.6,0.5,0.45))),0.0); c += vec3(1.0,0.95,0.8)*pow(s,24.0)*0.35;
      gl_FragColor=vec4(c,1.0);} `});
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(300, 32, 16), mat));
  // puffy 3D clouds: clusters of soft-toon spheres, no outline
  const cloudMat = toonMat(0xffffff); const sph = new THREE.IcosahedronGeometry(1, 3);
  const clouds = new THREE.Group(); let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group(); const a = i / 14 * Math.PI * 2 + rnd() * 0.3, r = 75 + rnd() * 60;
    c.position.set(Math.cos(a) * r, -25 + rnd() * 45, Math.sin(a) * r);
    const n = 4 + Math.floor(rnd() * 4);
    for (let j = 0; j < n; j++) { const m = new THREE.Mesh(sph, cloudMat); const s = 4 + rnd() * 5; m.scale.set(s, s * 0.8, s);
      m.position.set((j - n / 2) * 5 + rnd() * 2, rnd() * 2 + (j % 2) * 1.5, rnd() * 3); c.add(m); }
    c.lookAt(0, c.position.y, 0); c.userData.drift = rnd(); clouds.add(c);
  }
  scene.add(clouds);
  // distant green islands
  const isl = new THREE.Group();
  for (let i = 0; i < 7; i++) {
    const g = new THREE.Group(); const a = i / 7 * Math.PI * 2 + 0.4 + rnd() * 0.4, r = 90 + rnd() * 60, R = 7 + rnd() * 9;
    g.position.set(Math.cos(a) * r, -30 + rnd() * 20, Math.sin(a) * r);
    const rock = new THREE.Mesh(new THREE.ConeGeometry(R, R * 1.6, 9), toonMat(0xb5a894)); rock.rotation.x = Math.PI; rock.position.y = -R * 0.8; g.add(rock);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.02, R, R * 0.25, 12), toonMat(0x78c35a)); g.add(top);
    for (let k = 0; k < 4 + R / 2; k++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 7), toonMat(0x4f9e4a));
      const aa = rnd() * 6.28, rr = rnd() * R * 0.8; t.position.set(Math.cos(aa) * rr, 1.4, Math.sin(aa) * rr); g.add(t); }
    isl.add(g);
  }
  scene.add(isl);
  return { clouds };
}
