import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSky } from './sky.js';
import { makeIsland } from './island.js';
import { makeOffice, glows } from './props.js';
import { makeChibi, makeWalker } from './chibi.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 500);
camera.position.set(14.5, 8, 14.5).multiplyScalar(Math.max(1, 1.3 / camera.aspect));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -1.2, 0); controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 10; controls.maxDistance = 60; controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.35;
makeSky(scene);
const island = makeIsland(scene);
makeOffice(scene);
const pixel = makeChibi({ name: 'Pixel', role: 'Designer', hair: 0xff7eb6, shirt: 0xffd36a, pants: 0x6a5acd, hairStyle: 'twintails' });
Object.assign(pixel.userData, { faceDesk: Math.PI, facePantry: Math.PI - 0.53, deskActivity: 'Designing UI mockups', pantryActivity: 'Making bubble tea' });
const jun = makeChibi({ name: 'Jun', role: 'Engineer', hair: 0x2f3b66, shirt: 0x5ec4b6, pants: 0x3a3340, hairStyle: 'spiky' });
Object.assign(jun.userData, { faceDesk: 0, facePantry: Math.PI - 0.53, deskActivity: 'Fixing a build bug', pantryActivity: 'Brewing coffee' });
pixel.scale.setScalar(1.2); jun.scale.setScalar(1.2);
scene.add(pixel, jun);
export const chibis = [pixel, jun];
const walkers = [
  makeWalker(pixel, [[1.0, -0.55], [2.6, -0.6], [3.7, -2.15]], { offset: 0 }),
  makeWalker(jun, [[-1.6, 0.55], [0, 0.3], [3.2, 0.2], [4.9, -1.85]], { offset: 6, deskTime: 6 }),
];
let prevT = 0;
// FPS meter (?fps)
const fpsEl = document.createElement('div'); fpsEl.style.cssText='position:fixed;top:6px;left:6px;color:#fff;font:12px monospace;background:#0006;padding:2px 6px;border-radius:4px';
if (location.search.includes('fps')) document.body.appendChild(fpsEl);
let frames = 0, last = performance.now(); window.__fps = 0;
const clock = new THREE.Clock();
function loop() { const t = clock.getElapsedTime(); const dt = Math.min(0.1, t - prevT); prevT = t; walkers.forEach(w => w(t, dt));
  island.children.forEach(c => { if (c.userData.float !== undefined) c.position.y += Math.sin(t + c.userData.float) * 0.003; });
  glows.forEach((h,i)=>h.material.opacity=0.5+0.06*Math.sin(t*2+i));
  frames++; const now=performance.now(); if(now-last>1000){window.__info=renderer.info.render; window.__fps=frames*1000/(now-last); fpsEl.textContent=window.__fps.toFixed(0)+' fps'; frames=0; last=now;}
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
loop();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
