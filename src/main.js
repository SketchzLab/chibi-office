import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSky } from './sky.js';
import { makeIsland } from './island.js';
import { makeOffice, glows } from './props.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 500);
camera.position.set(17, 9, 17).multiplyScalar(Math.max(1, 1.3 / camera.aspect));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -1.2, 0); controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 10; controls.maxDistance = 60; controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.35;
makeSky(scene);
const island = makeIsland(scene);
makeOffice(scene);
// FPS meter (?fps)
const fpsEl = document.createElement('div'); fpsEl.style.cssText='position:fixed;top:6px;left:6px;color:#fff;font:12px monospace;background:#0006;padding:2px 6px;border-radius:4px';
if (location.search.includes('fps')) document.body.appendChild(fpsEl);
let frames = 0, last = performance.now(); window.__fps = 0;
const clock = new THREE.Clock();
function loop() { const t = clock.getElapsedTime();
  island.children.forEach(c => { if (c.userData.float !== undefined) c.position.y += Math.sin(t + c.userData.float) * 0.003; });
  glows.forEach((h,i)=>h.material.opacity=0.5+0.06*Math.sin(t*2+i));
  frames++; const now=performance.now(); if(now-last>1000){window.__info=renderer.info.render; window.__fps=frames*1000/(now-last); fpsEl.textContent=window.__fps.toFixed(0)+' fps'; frames=0; last=now;}
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
loop();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
