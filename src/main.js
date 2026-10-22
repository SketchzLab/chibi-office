import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSky } from './sky.js';
import { toonUniforms } from './toon.js';
import { chatLink } from './agents.js';
import { PERSONAS } from './personas.js';
import { makeBrain, actEmoji } from './behavior.js';
import { buildShadows, chibiShadow } from './shadows.js';
import { makeIsland } from './island.js';
import { makeNature } from './nature.js';
import { makeOffice, glows } from './props.js';
import { makeChibi } from './chibi.js';

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
const atmo = document.createElement('div'); atmo.style.cssText = 'position:fixed;inset:0;pointer-events:none;background:radial-gradient(ellipse at 18% 8%, rgba(255,246,214,.38), rgba(255,246,214,0) 45%), radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0) 60%, rgba(30,60,110,.18) 100%)';
document.body.appendChild(atmo);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.3, 900);
const CAM_DIR = new THREE.Vector3(1, 0.56, 1).normalize();
// Fit the whole island (radius ~R plus clouds of breathing room) for any aspect, incl. Fold cover (≈0.43) and inner (≈0.84) screens.
function fitDistance() { const vf = THREE.MathUtils.degToRad(camera.fov) / 2, hf = Math.atan(Math.tan(vf) * camera.aspect);
  return Math.max(13.5 / Math.tan(vf), 18.5 / Math.tan(hf)); }
camera.position.copy(CAM_DIR).multiplyScalar(fitDistance()).add(new THREE.Vector3(0, -2.5, 0));
const camP = new URLSearchParams(location.search).get('cam'); if (camP) camera.position.set(...camP.split(',').map(Number));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -2.5, 0); const tgtP = new URLSearchParams(location.search).get('tgt'); if (tgtP) { controls.target.set(...tgtP.split(',').map(Number)); controls.minDistance = 3; } controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 12; controls.maxDistance = 110; controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.35;
const sky = makeSky(scene);
const island = makeIsland(scene);
const nature = makeNature(scene);
makeOffice(scene);
// ---- Bots: look + persona + clock-driven brain ----
const chibis = [], brains = [];
for (const [name, per] of Object.entries(PERSONAS)) {
  const c = makeChibi({ name, role: per.role, ...per.look }); c.scale.setScalar(1.5); c.userData.persona = per;
  const brain = makeBrain(c, per); c.userData.brain = brain; scene.add(c); chibis.push(c); brains.push(brain);
}
export { chibis }; window.__scene = scene;
buildShadows(scene); const blobs = chibis.map(c => [c, chibiShadow(scene)]);
// ---- Live status (public/status.json, cache-busted every 60 s) ----
const STATUS_URL = import.meta.env.BASE_URL + 'status.json'; const FRESH_MS = 2 * 3600 * 1000; let status = { bots: {} };
async function loadStatus() { try { const r = await fetch(STATUS_URL + '?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; status = await r.json(); applyStatus(); } catch (e) { /* offline: keep last */ } }
function applyStatus() { const up = Date.parse(status.updatedAt || 0); const fresh = Date.now() - up < FRESH_MS;
  chibis.forEach(c => { const s = status.bots?.[c.userData.name] || {}; c.userData.task = s.task || '';
    c.userData.brain.setOverride(fresh && s.state ? { state: s.state, since: Date.parse(s.since || status.updatedAt) / 1000 } : null); c.userData.bubbleDirty = true; }); }
loadStatus(); setInterval(loadStatus, 60000);
window.__setStatus = j => { status = j; applyStatus(); };
// ---- Floating status bubbles (one small sprite per bot, redrawn only when text changes) ----
function makeBubble() { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 112; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sp.scale.set(5.2, 1.14, 1); sp.renderOrder = 5; scene.add(sp); return { sp, cv, tex, text: '' }; }
function drawBubble(bb, emoji, text) { const key = emoji + text; if (bb.text === key) return; bb.text = key; const g = bb.cv.getContext('2d'); g.clearRect(0, 0, 512, 112);
  g.font = '600 34px system-ui, "Noto Color Emoji", sans-serif'; const t = text.length > 22 ? text.slice(0, 21) + '…' : text; const w = Math.min(500, g.measureText(t).width + 96);
  const x0 = (512 - w) / 2; g.fillStyle = 'rgba(255,250,242,0.95)'; g.strokeStyle = '#2a1f35'; g.lineWidth = 5;
  g.beginPath(); g.roundRect(x0, 6, w, 76, 36); g.fill(); g.stroke(); g.beginPath(); g.moveTo(246, 82); g.lineTo(256, 104); g.lineTo(268, 82); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#2a1f35'; g.fillText(t, x0 + 70, 57); g.font = '36px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.fillText(emoji, x0 + 16, 58); bb.tex.needsUpdate = true; }
const bubbles = chibis.map(() => makeBubble());
let prevT = 0;
// --- Name card ---
const card = document.createElement('div'); card.id = 'card';
card.innerHTML = '<button class="x" type="button" aria-label="Close">✕</button><div class="hd"><div class="n"></div><div class="r"></div></div><div class="a"><span class="dot"></span><span class="t"></span></div><div class="w"><b>Currently working on</b><span class="wt"></span></div>'
  + '<div class="sc"><div class="sec"><h4>Personality</h4><div class="chips tr"></div></div><div class="sec"><h4>Hobbies</h4><ul class="hb"></ul></div><div class="sec"><h4>Habits</h4><ul class="ht"></ul></div></div>'
  + '<button class="chat" type="button">💬 Open chat</button><div class="note"></div>';
document.body.appendChild(card);
const css = document.createElement('style'); css.textContent = `#card{position:fixed;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translate(-50%,20px);opacity:0;pointer-events:none;transition:.2s;
 width:min(360px,92vw);box-sizing:border-box;max-height:min(70vh,560px);display:flex;flex-direction:column;padding:12px 16px;border-radius:18px;background:rgba(255,248,240,.94);border:3px solid #2a1f35;box-shadow:0 6px 0 #2a1f35;font-family:system-ui,sans-serif;color:#2a1f35}
 #card.on{opacity:1;transform:translate(-50%,0);pointer-events:auto}
 #card .chat{margin-top:10px;width:100%;min-height:44px;border:2px solid #2a1f35;border-radius:12px;background:#4fb3a9;color:#fff;font:700 16px system-ui,sans-serif;box-shadow:0 3px 0 #2a1f35;cursor:pointer}
 #card .chat:active{transform:translateY(2px);box-shadow:0 1px 0 #2a1f35} #card .chat[hidden]{display:none} #card .note{font-size:12px;opacity:.75;margin-top:6px;max-width:260px} #card .note:empty{display:none} #card .n{font-size:22px;font-weight:800} #card .r{font-size:14px;opacity:.75;margin-bottom:6px}
 #card .a{font-size:15px;display:flex;align-items:center;gap:8px}
 #card .w{margin-top:8px;padding:8px 10px;border-radius:10px;background:#e7f5f2;font-size:14px;line-height:1.3} #card .w b{display:block;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#2f7f76;margin-bottom:2px}
 #card .sc{overflow-y:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;margin-top:8px;min-height:0;flex:1 1 auto;padding-right:4px}
 #card .sec{margin-bottom:8px} #card h4{margin:0 0 4px;font-size:11px;letter-spacing:.06em;text-transform:uppercase;opacity:.6}
 #card .chips{display:flex;flex-wrap:wrap;gap:6px} #card .chips span{padding:3px 10px;border-radius:999px;background:#fff1d6;border:1.5px solid #2a1f35;font-size:13px;font-weight:600}
 #card ul{margin:0;padding-left:18px;font-size:13.5px;line-height:1.35} #card .chat{flex:0 0 auto}
 @media (max-height:700px){#card{max-height:62vh}} @media (max-width:480px){#card{max-height:50vh;padding:10px 12px} #card .n{font-size:19px}}
 #card{position:fixed} #card .x{position:absolute;top:6px;right:8px;width:36px;height:36px;border:0;background:transparent;font-size:18px;color:#2a1f35;cursor:pointer} #card .dot{width:10px;height:10px;border-radius:50%;background:#3ccf7a;box-shadow:0 0 6px #3ccf7a}`;
document.head.appendChild(css);
let selected = null;
const ring = new THREE.Mesh(new THREE.RingGeometry(1.15, 1.4, 32), new THREE.MeshBasicMaterial({ color: 0xfff1a8, transparent: true, opacity: 0.85, depthWrite: false }));
ring.rotation.x = -Math.PI / 2; ring.visible = false; scene.add(ring);
function select(c) { selected = c; card.classList.toggle('on', !!c); ring.visible = !!c;
  card.querySelector('.note').textContent = '';
  if (c) { const per = c.userData.persona; card.querySelector('.n').textContent = c.userData.name; card.querySelector('.r').textContent = c.userData.role; card.querySelector('.chat').hidden = !chatLink(c.userData.name);
    const fill = (sel, arr, tag) => { const el = card.querySelector(sel); el.replaceChildren(...arr.map(x => { const e = document.createElement(tag); e.textContent = x; return e; })); };
    fill('.tr', per.traits, 'span'); fill('.hb', per.hobbies, 'li'); fill('.ht', per.habits, 'li'); card.querySelector('.sc').scrollTop = 0; } }
// 'Open chat' -> Grok Bot deep link; if the page is still visible shortly after, the app probably isn't installed.
let chatTimer = 0;
card.querySelector('.x').addEventListener('click', e => { e.stopPropagation(); select(null); });
card.querySelector('.chat').addEventListener('click', e => { e.stopPropagation(); if (!selected) return; const url = chatLink(selected.userData.name); if (!url) return;
  const note = card.querySelector('.note'); note.textContent = ''; clearTimeout(chatTimer);
  window.__lastChatLink = url; window.location.href = url;
  chatTimer = setTimeout(() => { if (document.visibilityState === 'visible') note.textContent = "Nothing opened? The Grok Bot app may not be installed on this device. Open it there and find " + selected?.userData.name + " in your agents."; }, 1600); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') clearTimeout(chatTimer); });
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
function loop() { const t = clock.getElapsedTime(); const dt = Math.min(0.1, t - prevT); prevT = t; const wt = wallTime(); brains.forEach(b => b.update(wt, dt, t));
  island.children.forEach(c => { if (c.userData.float !== undefined) c.position.y += Math.sin(t + c.userData.float) * 0.003; });
  glows.forEach((h,i)=>h.material.opacity=0.5+0.06*Math.sin(t*2+i));
  frames++; const now=performance.now(); if(now-last>1000){window.__info=renderer.info.render; window.__fps=frames*1000/(now-last); fpsEl.textContent=window.__fps.toFixed(0)+' fps'; frames=0; last=now;}
  chibis.forEach((c, i) => { const bs = c.userData.brain.state; drawBubble(bubbles[i], bs.walking ? '🚶' : actEmoji(bs.act), bs.act === 'work' || bs.walking ? (c.userData.task || bs.label) : bs.label); bubbles[i].sp.position.set(c.position.x, c.position.y + 4.9 + (i % 2) * 1.1, c.position.z); });
  blobs.forEach(([c, m]) => m.position.set(c.position.x + 0.2, 0.02, c.position.z - 0.15));
  if (selected) { const bs = selected.userData.brain.state; card.querySelector('.t').textContent = bs.label + (bs.override ? ' (live)' : ''); card.querySelector('.wt').textContent = selected.userData.task || '—'; ring.position.set(selected.position.x, 0.04, selected.position.z); }
  sky.clouds.children.forEach(c => { c.position.y += Math.sin(t * 0.3 + c.userData.drift * 6) * 0.004; });
  nature.update(t);
  { const d = camera.position.distanceTo(controls.target); toonUniforms.uFogRange.value.set(d + 15, d + 170); }
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
loop();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (!camP) { const off = camera.position.clone().sub(controls.target).setLength(fitDistance()); camera.position.copy(controls.target).add(off); } renderer.setSize(innerWidth, innerHeight); });
