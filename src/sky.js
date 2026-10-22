import * as THREE from 'three';
export function makeSky(scene) {
  const geo = new THREE.SphereGeometry(200, 32, 16);
  const mat = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
    vertexShader: `varying vec3 vP; void main(){ vP=normalize(position); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `,
    fragmentShader: `varying vec3 vP;
    float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
    float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}
    float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p*=2.;a*=.5;}return s;}
    void main(){ float y=vP.y;
      vec3 low=vec3(1.0,0.55,0.35), mid=vec3(0.95,0.5,0.6), high=vec3(0.28,0.25,0.6), top=vec3(0.12,0.12,0.35);
      vec3 c = y<-0.25? mix(low*0.9,low,smoothstep(-0.6,-0.25,y)) : y<-0.1? mix(low,mid,smoothstep(-0.25,-0.1,y)) : y<0.08? mix(mid,high,smoothstep(-0.1,0.08,y)) : mix(high,top,smoothstep(0.08,0.6,y));
      vec2 uv = vP.xz/(abs(vP.y)+0.35)*2.0;
      float cl = smoothstep(0.55,0.75,fbm(uv+3.0)) * smoothstep(-0.25,0.1,y)*(1.0-smoothstep(0.45,0.7,y));
      c = mix(c, vec3(1.0,0.82,0.8), cl*0.75);
      vec2 sp = floor(vP.xz*vec2(180.0)/(vP.y+1.0)); float st = step(0.997,h(sp+floor(vP.y*180.0)))*smoothstep(0.05,0.4,y);
      c += st*0.8;
      gl_FragColor=vec4(c,1.0);} `});
  scene.add(new THREE.Mesh(geo, mat));
}
