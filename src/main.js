import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSky } from './sky.js';
import { makeIsland } from './island.js';
import { toonMesh } from './toon.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
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
// placeholder test props to preview toon shading (desks come in M1-50%)
const box = toonMesh(new THREE.BoxGeometry(2, 1, 1), 0xf2e6d8); box.position.set(-2, 0.5, 0); scene.add(box);
const ball = toonMesh(new THREE.SphereGeometry(0.9, 24, 16), 0xff9bb0); ball.position.set(2, 0.9, 1); scene.add(ball);
const clock = new THREE.Clock();
function loop() { const t = clock.getElapsedTime();
  island.children.forEach(c => { if (c.userData.float !== undefined) c.position.y += Math.sin(t + c.userData.float) * 0.003; });
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
loop();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
