// isolated lineup render at the style-ref angle (orthographic, ~34° pitch). ?only=<Name> renders a single chibi.
import * as THREE from 'three';
import { makeChibi, ootdDay } from './chibi.js';
import { PERSONAS } from './personas.js';
const r = new THREE.WebGLRenderer({ antialias: true, stencil: true }); r.setPixelRatio(1); r.setSize(innerWidth, innerHeight); r.outputColorSpace = THREE.SRGBColorSpace; document.body.appendChild(r.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xffffff);
const q = new URLSearchParams(location.search), only = q.get('only'), grid = q.get('grid'); const a = innerWidth / innerHeight, H = +(q.get('h') ?? (only ? 3.7 : grid ? 14 : 5));
const cam = new THREE.OrthographicCamera(-H * a / 2, H * a / 2, H / 2, -H / 2, 0.1, 100); const yaw = +(q.get('yaw') ?? 0.75), pitch = 0.6, cy = +(q.get('cy') ?? (only ? 1.4 : 1.25));
cam.position.set(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch)).multiplyScalar(30).add(new THREE.Vector3(0, cy, 0)); cam.lookAt(0, cy, 0);
const looks = { ...Object.fromEntries(Object.entries(PERSONAS).map(([k, p]) => [k, p.look])), Calvin: { hair: 0x3b2a22, shirt: 0x2f4f86, pants: 0x3a3a48, skin: 0xffdcc2 } };
const names = only ? [only] : ['Pixel', 'Jun', 'Sage', 'Mika', 'Calvin'], d0 = ootdDay();
const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));
const fwd = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); const slots = grid ? names.flatMap((n, i) => [0, 1, 2, 3].map(j => [n, j, i])) : names.map((n, i) => [n, 0, i]); window.__labels = [];
slots.forEach(([n, j, i]) => { const c = makeChibi({ name: n, ...looks[n], day: d0 + j * (grid ? +grid : 1) }); window.__labels.push(n + ' d' + (d0 + j) + ': ' + c.userData.ootd); c.rotation.y = 0.05; c.position.copy(right).multiplyScalar(grid ? (j - 1.5) * 1.75 : (i - (names.length - 1) / 2) * 1.75); if (grid) c.position.addScaledVector(fwd, (i - 2) * -4.3).y += 0; scene.add(c);
  const sh = new THREE.Mesh((() => { const sp = new THREE.Shape(), w = 1.0, h = 1.15, r = 0.3; sp.moveTo(-w / 2 + r, -h / 2); sp.lineTo(w / 2 - r, -h / 2); sp.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); sp.lineTo(w / 2, h / 2 - r); sp.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); sp.lineTo(-w / 2 + r, h / 2); sp.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); sp.lineTo(-w / 2, -h / 2 + r); sp.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2); return new THREE.ShapeGeometry(sp, 3); })(), new THREE.MeshBasicMaterial({ color: 0xb4c4da })); sh.rotation.x = -Math.PI / 2; sh.position.copy(c.position).add(new THREE.Vector3(0.2, 0.002, 0.15)); scene.add(sh); });
window.__info = () => ({ calls: r.info.render.calls, tris: r.info.render.triangles });
if (q.get('sleep')) scene.traverse(o => o.userData.setSleepFace && o.userData.setSleepFace(true));
r.render(scene, cam); window.__ready = true;
