import * as THREE from 'three';
import { toonMesh, toonMat } from './toon.js';
import { bake } from './bake.js';
export function makeSky(scene) {
  // uniform-driven gradient (daycycle.js lerps the colours): sun disc + glow, moon, procedural stars, cirrus
  const C = (r, g, b) => ({ value: new THREE.Color(r, g, b) });
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    uniforms: { uBelow: C(0.55, 0.82, 0.86), uHor: C(0.78, 0.92, 1.0), uMid: C(0.5, 0.76, 0.97), uTop: C(0.24, 0.52, 0.9), uSunCol: C(1.0, 0.95, 0.8), uSunK: { value: 0.35 },
      uSunDir: { value: new THREE.Vector3(-0.6, 0.5, 0.45).normalize() }, uMoonDir: { value: new THREE.Vector3(-0.64, 0.12, -0.76).normalize() }, uStars: { value: 0 }, uTime: { value: 0 }, uRainbow: { value: 0 }, uAurora: { value: 0 } },
    vertexShader: `varying vec3 vPi; void main(){ vPi=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `varying vec3 vPi; uniform vec3 uBelow, uHor, uMid, uTop, uSunCol, uSunDir, uMoonDir; uniform float uSunK, uStars, uTime, uRainbow, uAurora;
    float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
    void main(){ vec3 vP = normalize(vPi); float y=vP.y;
      vec3 c = y<0.0? mix(uHor, uBelow, smoothstep(0.0,-0.5,y)) : y<0.25? mix(uHor,uMid,smoothstep(0.0,0.25,y)) : mix(uMid,uTop,smoothstep(0.25,0.9,y));
      float s = max(dot(vP, uSunDir),0.0);
      // wide warm horizon bloom toward the sun (sunrise/sunset), then glow + disc
      c += uSunCol*pow(s,4.0)*smoothstep(0.5,-0.05,y)*uSunK*0.55;
      c += uSunCol*pow(s,24.0)*uSunK + vec3(1.0,0.98,0.9)*smoothstep(0.9985,0.9992,s)*0.9*min(1.0,uSunK*3.0) + uSunCol*pow(s,300.0)*0.4*min(1.0,uSunK*3.0);
      float ci = sin(vP.x*9.0+vP.z*3.0)*sin(vP.z*7.0-vP.x*2.0); c = mix(c, mix(uHor, vec3(0.92,0.97,1.0), 0.6), smoothstep(0.55,0.95,ci)*smoothstep(0.25,0.6,y)*0.25*(1.0-uStars*0.7));
      if (uStars > 0.001) {
        vec2 g = vec2(atan(vP.z, vP.x)*58.0, vP.y*92.0); vec2 id = floor(g), f = fract(g)-0.5; float h = h21(id);
        float st = step(0.93, h) * smoothstep(0.24, 0.0, length(f + (vec2(h21(id+3.1), h21(id+7.7))-0.5)*0.5)) * (0.55+0.45*sin(uTime*(1.5+h*3.0)+h*40.0));
        c += vec3(0.95,0.95,1.0)*st*uStars*smoothstep(0.0,0.2,y)*2.2;
        // v20 starry night: a finer second layer, a faint milky-way band with extra dust stars, warm/cool tints
        vec2 g2 = vec2(atan(vP.z, vP.x)*130.0, vP.y*205.0); vec2 id2 = floor(g2), f2 = fract(g2)-0.5; float h2 = h21(id2+19.3);
        vec3 mwN = normalize(vec3(0.35, 0.55, 0.76)); float mw = exp(-pow(dot(vP, mwN)/0.16, 2.0)) * (0.6 + 0.4*sin(vP.x*23.0+vP.z*17.0)*sin(vP.y*31.0-vP.x*11.0));
        float st2 = step(0.965 - mw*0.05, h2) * smoothstep(0.3, 0.0, length(f2)) * (0.45+0.55*sin(uTime*(2.0+h2*4.0)+h2*70.0));
        vec3 tint = mix(vec3(0.8,0.88,1.0), vec3(1.0,0.9,0.75), step(0.5, h21(id2+4.0)));
        float up = smoothstep(0.02,0.25,y);
        c += tint*st2*uStars*up*1.3 + vec3(0.55,0.6,0.85)*mw*0.11*uStars*up;
        float m = dot(vP, uMoonDir); float disc = smoothstep(0.99955, 0.99972, m);
        float crater = 0.85 + 0.15*h21(floor(vP.xz*900.0)); c = mix(c, vec3(1.0,0.97,0.84)*crater, disc*uStars);
        c += vec3(0.6,0.7,1.0)*(pow(max(m,0.0),60.0)*0.35 + pow(max(m,0.0),8.0)*0.08)*uStars;
      }
      // v20 rainbow: soft arc over the western sea, soft bands, fades into the horizon
      if (uRainbow > 0.001) { vec3 D = normalize(vec3(-0.72, -0.12, -0.66)); float ang = acos(clamp(dot(vP, D), -1.0, 1.0)); float u = (ang - 0.440) / 0.045; // stylised: a 25 deg bow so it fits the cozy camera // 0 inner (violet) .. 1 outer (red)
        if (u > -0.3 && u < 1.3) { vec3 rb = clamp(vec3(abs(u*6.0-4.5)-1.5, 2.0-abs(u*6.0-3.0), 2.0-abs(u*6.0-1.5)), 0.0, 1.0); rb = mix(vec3(1.0), rb, 0.75);
          float a = smoothstep(-0.3, 0.1, u) * smoothstep(1.3, 0.9, u) * smoothstep(-0.01, 0.12, y) * (0.7 + 0.3*smoothstep(0.45, 0.1, y));
          c = mix(c, c*0.6 + rb*0.65, a*0.55*uRainbow); }
        c += vec3(1.0)*0.05*uRainbow*smoothstep(0.440, 0.36, ang)*smoothstep(-0.01, 0.12, y); } // brighter sky inside the bow
      // v20 aurora: ribbon curtains low over the north (-z) sky, green -> teal -> violet tops, slow drift
      if (uAurora > 0.001) { float az = atan(vP.x, -vP.z); float wA = smoothstep(1.35, 0.6, abs(az + 0.2));
        float base = 0.07 + 0.045*sin(az*2.3 + uTime*0.07) + 0.02*sin(az*7.0 - uTime*0.13);
        float rise = y - base; float body = smoothstep(-0.015, 0.02, rise) * exp(-max(rise, 0.0)*4.2);
        float cur = 0.45 + 0.55*pow(0.5+0.5*sin(az*38.0 + sin(az*5.0+uTime*0.2)*3.0 + uTime*0.35), 2.0) * (0.6+0.4*sin(az*11.0 - uTime*0.25));
        vec3 col = mix(vec3(0.25,1.0,0.55), vec3(0.2,0.85,0.8), smoothstep(0.0, 0.12, rise)); col = mix(col, vec3(0.65,0.4,1.0), smoothstep(0.1, 0.32, rise));
        float a2 = body * cur * wA * (0.8 + 0.2*sin(uTime*0.6 + az*3.0));
        float b2 = smoothstep(0.0, 0.015, y - base - 0.13) * exp(-max(y - base - 0.13, 0.0)*6.0) * wA * 0.35 * (0.5+0.5*sin(az*24.0 + uTime*0.3)); // faint second band
        c += (col*a2*0.9 + vec3(0.4,0.95,0.7)*b2*0.6)*uAurora; c += vec3(0.05,0.18,0.12)*wA*smoothstep(0.35, 0.0, y)*smoothstep(-0.02, 0.05, y)*uAurora; }
      gl_FragColor=vec4(c,1.0);} `});
  const dome = new THREE.Mesh(new THREE.SphereGeometry(400, 20, 10), mat); dome.renderOrder = -1; scene.add(dome);
  // puffy 3D clouds: clusters of soft-toon spheres, no outline
  const cloudMat = toonMat(0xffffff); const sph = new THREE.SphereGeometry(1, 10, 7);
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
  scene.add(isl); bake(isl); clouds.children.forEach(c => bake(c));
  // depth layers: far horizon cloud bank + soft cloud sea far below the island (each baked to 1 fill + 1 outline-free batch)
  const bank = new THREE.Group(), sea = new THREE.Group(); const bankMat = toonMat(0xf3f8ff); const sphLo = new THREE.SphereGeometry(1, 8, 4); // v23 perf: flat, far blobs need few segments
  for (let i = 0; i < 46; i++) { const a = i / 46 * 6.28 + rnd() * 0.1, r = 230 + rnd() * 30; const m = new THREE.Mesh(sphLo, bankMat); const s = 12 + rnd() * 12;
    m.scale.set(s * 1.7, s * 0.4, s); m.position.set(Math.cos(a) * r, -34 + rnd() * 10, Math.sin(a) * r); bank.add(m); }
  for (let i = 0; i < 34; i++) { const a = rnd() * 6.28, r = 70 + rnd() * 150; const m = new THREE.Mesh(sphLo, bankMat); const s = 8 + rnd() * 10;
    m.scale.set(s * 1.5, s * 0.4, s * 1.2); m.position.set(Math.cos(a) * r, -95 - rnd() * 14, Math.sin(a) * r); sea.add(m); }
  scene.add(bank, sea); bake(bank); bake(sea);
  return { clouds, mat };
}
