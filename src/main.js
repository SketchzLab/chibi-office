import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSky } from './sky.js';
import { makeIsland } from './island.js';
import { makeNature } from './nature.js';
import { makeOffice, glows } from './props.js';
import { makeChibi, makeWalker } from './chibi.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 500);
camera.position.set(19, 10, 19).multiplyScalar(Math.max(1, 1.3 / camera.aspect));
const camP = new URLSearchParams(location.search).get('cam'); if (camP) camera.position.set(...camP.split(',').map(Number));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -1.8, 0); controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 10; controls.maxDistance = 70; controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.35;
const sky = makeSky(scene);
const island = makeIsland(scene);
const nature = makeNature(scene);
makeOffice(scene);
const pixel = makeChibi({ name: 'Pixel', role: 'Game Developer', hair: 0xff7eb6, shirt: 0xffd36a, pants: 0x6a5acd, hairStyle: 'twintails' });
Object.assign(pixel.userData, { faceDesk: Math.PI, facePantry: Math.PI - 0.53, deskActivity: 'Coding a game build', pantryActivity: 'Grabbing coffee' });
const jun = makeChibi({ name: 'Jun', role: 'UI Designer', hair: 0x2f3b66, shirt: 0x5ec4b6, pants: 0x3a3340, hairStyle: 'spiky' });
Object.assign(jun.userData, { faceDesk: 0, facePantry: Math.PI - 0.53, deskActivity: 'Sketching UI mockups', pantryActivity: 'Making bubble tea' });
pixel.scale.setScalar(1.2); jun.scale.setScalar(1.2);
scene.add(pixel, jun);
export const chibis = [pixel, jun];
const walkers = [
  makeWalker(pixel, [[1.0, -0.55], [2.6, -0.6], [3.7, -2.15]], { offset: 0 }),
  makeWalker(jun, [[-1.6, 0.55], [0, 0.3], [3.2, 0.2], [4.9, -1.85]], { offset: 6, deskTime: 6 }),
];
let prevT = 0;
// --- Name card ---
const card = document.createElement('div'); card.id = 'card';
card.innerHTML = '<div class="n"></div><div class="r"></div><div class="a"><span class="dot"></span><span class="t"></span></div>';
document.body.appendChild(card);
const css = document.createElement('style'); css.textContent = `#card{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:.2s;
 min-width:220px;max-width:86vw;padding:14px 20px;border-radius:18px;background:rgba(255,248,240,.94);border:3px solid #2a1f35;box-shadow:0 6px 0 #2a1f35;font-family:system-ui,sans-serif;color:#2a1f35}
 #card.on{opacity:1;transform:translate(-50%,0)} #card .n{font-size:22px;font-weight:800} #card .r{font-size:14px;opacity:.75;margin-bottom:6px}
 #card .a{font-size:15px;display:flex;align-items:center;gap:8px} #card .dot{width:10px;height:10px;border-radius:50%;background:#3ccf7a;box-shadow:0 0 6px #3ccf7a}`;
document.head.appendChild(css);
let selected = null;
const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 32), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.85, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
function select(c) { selected = c; card.classList.toggle('on', !!c); ring.visible = !!c;
  if (c) { card.querySelector('.n').textContent = c.userData.name; card.querySelector('.r').textContent = c.userData.role; } }
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', e => { if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 10) return;
  ndc.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
  // pick the chibi whose body centre is closest to the tap ray (fixes overlapping hit boxes)
  const hits = ray.intersectObjects(chibis.map(c => c.userData.hit)); let best = null, bd = Infinity;
  hits.forEach(h => { const c = h.object.userData.chibi; const ctr = c.position.clone(); ctr.y += 1.3 * c.scale.y; const d = ray.ray.distanceSqToPoint(ctr); if (d < bd) { bd = d; best = c; } });
  select(best); });
window.__chibiPos = n => { const c = chibis.find(c => c.userData.name === n); return [+c.position.x.toFixed(2), +c.position.z.toFixed(2)]; };
window.__screenPos = n => { const c = chibis.find(c => c.userData.name === n); const v = c.position.clone(); v.y += 1.8; v.project(camera); return [(v.x + 1) / 2 * innerWidth, (1 - v.y) / 2 * innerHeight]; };
// FPS meter (?fps)
const fpsEl = document.createElement('div'); fpsEl.style.cssText='position:fixed;top:6px;left:6px;color:#fff;font:12px monospace;background:#0006;padding:2px 6px;border-radius:4px';
if (location.search.includes('fps')) document.body.appendChild(fpsEl);
let frames = 0, last = performance.now(); window.__fps = 0;
const clock = new THREE.Clock();
// Shared wall clock: routines are driven by UTC epoch seconds (modulo loop length inside each walker),
// so every device shows each bot at the same spot at the same moment. ?at=<sec> pins the phase for tests.
const atParam = new URLSearchParams(location.search).get('at');
const wallTime = atParam !== null ? (() => { const t0 = performance.now(); return () => +atParam + (performance.now() - t0) / 1000; })() : () => Date.now() / 1000;
function loop() { const t = clock.getElapsedTime(); const dt = Math.min(0.1, t - prevT); prevT = t; walkers.forEach(w => w(wallTime(), dt));
  island.children.forEach(c => { if (c.userData.float !== undefined) c.position.y += Math.sin(t + c.userData.float) * 0.003; });
  glows.forEach((h,i)=>h.material.opacity=0.5+0.06*Math.sin(t*2+i));
  frames++; const now=performance.now(); if(now-last>1000){window.__info=renderer.info.render; window.__fps=frames*1000/(now-last); fpsEl.textContent=window.__fps.toFixed(0)+' fps'; frames=0; last=now;}
  if (selected) { card.querySelector('.t').textContent = selected.userData.activity; ring.position.set(selected.position.x, 0.04, selected.position.z); }
  sky.clouds.children.forEach(c => { c.position.y += Math.sin(t * 0.3 + c.userData.drift * 6) * 0.004; });
  nature.update(t);
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
loop();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
