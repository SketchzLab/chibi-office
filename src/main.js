import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { makeSky } from './sky.js';
import { toonUniforms } from './toon.js';
import { chatLink } from './agents.js';
import { PERSONAS } from './personas.js';
import { makeBrain, actEmoji, applyPose } from './behavior.js';
import { buildShadows, chibiShadow } from './shadows.js';
import { makeIsland } from './island.js';
import { makeNature } from './nature.js';
import { makeOffice, glows } from './props.js';
import { makeWorld } from './world.js';
import { makeChibi } from './chibi.js';
import { makePlayer } from './player.js';
import { pickTier, makeAtmosphere, lightPools, steam, radial } from './fx.js';
import { DESKS, BOSS_DESK, BOT_S, CALVIN_S, LOUNGE, GLASS, PANTRY } from './layout.js';
import { speechAt, GREET, HI_BACK, ZONE } from './dialogue.js';
import { buildRoot, buildGroup, pickLine, mem } from './talk.js';

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
  return Math.max(15.5 / Math.tan(vf), 21.5 / Math.tan(hf)); }
camera.position.copy(CAM_DIR).multiplyScalar(fitDistance()).add(new THREE.Vector3(0, -2.5, 0));
const camP = new URLSearchParams(location.search).get('cam'); if (camP) camera.position.set(...camP.split(',').map(Number));
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, -2.5, 0); const tgtP = new URLSearchParams(location.search).get('tgt'); if (tgtP) { controls.target.set(...tgtP.split(',').map(Number)); controls.minDistance = 3; } controls.enableDamping = true; controls.enablePan = false;
controls.minDistance = 12; controls.maxDistance = 110; controls.minPolarAngle = 0.3; controls.maxPolarAngle = 1.35;
const sky = makeSky(scene);
const island = makeIsland(scene);
const nature = makeNature(scene);
makeOffice(scene); makeWorld(scene, nature.waterMat);
// ---- Bots: look + persona + clock-driven brain ----
const chibis = [], brains = [];
for (const [name, per] of Object.entries(PERSONAS)) {
  const c = makeChibi({ name, role: per.role, ...per.look }); c.scale.setScalar(BOT_S); c.userData.hit.scale.set(1.45, 1.2, 1.45); c.userData.persona = per;
  const brain = makeBrain(c, per); c.userData.brain = brain; scene.add(c); chibis.push(c); brains.push(brain);
}
export { chibis }; window.__scene = scene;
const player = makePlayer({ scene, camera, controls, bots: chibis }); const calvin = player.chibi; window.__player = player;
player.setHome(camera.position, controls.target);
// ---- cozy FX + quality tier ----
let tier = pickTier(); if (tier === 'low') { toonUniforms.uDetail.value = 0; renderer.setPixelRatio(1); }
const atmos = makeAtmosphere(scene, tier);
const steamFx = tier === 'low' ? null : steam(scene, [...DESKS, BOSS_DESK].map(([x, z]) => z > 0 ? [x + 0.8, 1.1, z - 0.2] : [x - 0.8, 1.1, z + 0.2])); window.__tier = () => tier;
lightPools(scene, [[-3.9, 7.3, 2.6, 0xffc070, 0.55], [9.6, 3.2, 2.6, 0xffc070, 0.55], [-7.8, 4.6, 3.4, 0xffb060, 0.28], [8.2, -5.2, 3.0, 0xffd090, 0.3], [5.2, 2.0, 2.2, 0xffc890, 0.3], [-7.9, -5.1, 3.0, 0xfff0c0, 0.22]]);
buildShadows(scene); const blobs = [...chibis, calvin].map(c => [c, chibiShadow(scene)]);
const talkers = chibis.map(c => ({ name: c.userData.name, brain: c.userData.brain }));
// ---- Live status (public/status.json, cache-busted every 60 s) ----
const STATUS_URL = import.meta.env.BASE_URL + 'status.json'; const FRESH_MS = 2 * 3600 * 1000; let status = { bots: {} };
async function loadStatus() { try { const r = await fetch(STATUS_URL + '?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return; status = await r.json(); applyStatus(); } catch (e) { /* offline: keep last */ } }
function applyStatus() { const up = Date.parse(status.updatedAt || 0); const fresh = Date.now() - up < FRESH_MS;
  chibis.forEach(c => { const s = status.bots?.[c.userData.name] || {}; c.userData.task = s.task || '';
    c.userData.brain.setOverride(fresh && s.state ? { state: s.state, since: Date.parse(s.since || status.updatedAt) / 1000 } : null); c.userData.bubbleDirty = true; }); }
loadStatus(); setInterval(loadStatus, 60000);
window.__setStatus = j => { status = j; applyStatus(); };
// ---- Floating status bubbles (one small sprite per bot, redrawn only when text changes) ----
// Speech bubbles (talk) + a tiny activity emoji when quiet. One sprite per chibi, canvas redrawn only on change.
function makeBubble() { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 176; const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, depthTest: false })); sp.renderOrder = 5; scene.add(sp); return { sp, cv, tex, text: null, big: false }; }
function wrap(g, text, max) { const words = text.split(' '), lines = ['']; for (const w of words) { const tl = (lines.at(-1) ? lines.at(-1) + ' ' : '') + w; if (g.measureText(tl).width > max && lines.at(-1)) lines.push(w); else lines[lines.length - 1] = tl; } return lines.slice(0, 3); }
function drawBubble(bb, emoji, text) { const key = emoji + '|' + (text || ''); if (bb.text === key) return; bb.text = key; bb.big = !!text; const g = bb.cv.getContext('2d'); g.clearRect(0, 0, 512, 176);
  g.fillStyle = 'rgba(255,250,242,0.96)'; g.strokeStyle = '#2a1f35'; g.lineWidth = 5;
  if (!text) { g.globalAlpha = 0.85; g.beginPath(); g.arc(256, 120, 40, 0, 7); g.fill(); g.stroke(); g.font = '44px "Noto Color Emoji", "Apple Color Emoji", "Segoe UI Emoji", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#000'; g.fillText(emoji, 256, 136); g.globalAlpha = 1; g.textAlign = 'left'; bb.tex.needsUpdate = true; return; }
  g.font = '600 32px system-ui, "Noto Color Emoji", sans-serif'; const lines = wrap(g, text, 440); const w = Math.min(500, Math.max(...lines.map(l => g.measureText(l).width)) + 48), h = lines.length * 38 + 26, y0 = 150 - h;
  const x0 = (512 - w) / 2; g.beginPath(); g.roundRect(x0, y0, w, h, 26); g.fill(); g.stroke(); g.beginPath(); g.moveTo(240, 148); g.lineTo(256, 172); g.lineTo(274, 148); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = '#2a1f35'; g.textAlign = 'center'; lines.forEach((l, i) => g.fillText(l, 256, y0 + 44 + i * 38)); g.textAlign = 'left'; bb.tex.needsUpdate = true; }
const talkersAll = [...chibis, calvin]; const catSpot = new THREE.Object3D(); catSpot.position.set(LOUNGE.cx - 2.15, -0.9, LOUNGE.cz + 0.85); catSpot.userData.name = 'Mochi'; talkersAll.push(catSpot);
const bubbles = talkersAll.map(() => makeBubble());
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
function select(c) { selected = c; document.body.classList.toggle('cardon', !!c); card.classList.toggle('on', !!c); ring.visible = !!c;
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
// ---- Interaction: branching talk with bots, group moments, objects (all local to this device) ----
const localSay = {}, face = {}, botEmote = {}; const greeted = {}; let mode = null, target = null, calvinFlag = null, flagUntil = 0;
const say = (n, text, wt, dur = 4.4) => { localSay[n] = { text, until: wt + dur }; };
const emoteBot = (n, name, dur = 1.8) => { botEmote[n] = { name, until: clock.getElapsedTime() + dur }; };
const emoteCalvin = (name, dur = 1.6) => player.setEmote(name, dur, clock.getElapsedTime());
const botBy = n => chibis.find(c => c.userData.name === n);
const zoneOf = c => ZONE[c.userData.brain.state.act] || 'desk';
const tctx = { persona: n => botBy(n).userData.persona, task: n => botBy(n).userData.task, zone: n => zoneOf(botBy(n)),
  calvinState: () => (flagUntil > wallTime() ? calvinFlag : null) || (player.carry ? 'mug' : player.seat?.kind === 'sofa' ? 'sofa' : null) };
const actb = document.createElement('button'); actb.id = 'actb'; actb.className = 'hudb'; actb.type = 'button'; document.body.appendChild(actb);
const imenu = document.createElement('div'); imenu.id = 'imenu'; document.body.appendChild(imenu);
const fcss = document.createElement('style'); fcss.textContent = `#actb{right:auto!important;bottom:auto!important;left:0;top:0;min-height:48px!important;min-width:48px;border-radius:24px!important;font-size:15px;white-space:nowrap;transition:opacity .15s}
#imenu{right:auto!important;bottom:auto!important;left:0;top:0;max-width:min(300px,78vw)} #imenu button{text-align:left;white-space:normal;min-height:46px;font-size:14px;line-height:1.2;padding:8px 12px}`; document.head.appendChild(fcss);
const strip = t => t.replace(/^[^\p{L}\p{N}"'(]+/u, '');
function showMenu(choices) { imenu.replaceChildren(...choices.map((ch, i) => { const b = document.createElement('button'); b.className = 'hudb'; b.type = 'button'; b.textContent = ch.t; b.onclick = e => { e.stopPropagation(); choose(ch); }; return b; })); imenu.classList.add('on'); }
function closeTalk() { mode = null; imenu.classList.remove('on'); }
function openTalk(c) { const n = c.userData.name, wt = wallTime(); const node = buildRoot(n, tctx); mode = { type: 'talk', bot: c, node }; face[n] = wt + 30; say(n, node.say, wt, 6); emoteBot(n, node.emote); showMenu(node.choices); }
function openGroup(names, wt) { const g = buildGroup(names); mode = { type: 'group', names, node: g }; names.forEach(n => face[n] = wt + 30); say(g.speaker, g.say, wt, 6); emoteBot(g.speaker, g.emote); showMenu(g.choices); }
function choose(ch) { const wt = wallTime(); imenu.classList.remove('on'); const m = mode; if (!m) return;
  say('Calvin', ch.say || strip(ch.t), wt, 2.6); emoteCalvin(ch.hf ? 'highfive' : 'nod', 1.4);
  if (ch.act === 'chat') { const n = m.bot?.userData.name; const url = n && chatLink(n); if (url) { window.__lastChatLink = url; window.location.href = url; } closeTalk(); return; }
  setTimeout(() => { const wt2 = wallTime();
    if (m.type === 'group') { say(ch.reactor, ch.react, wt2, 4.5); m.names.forEach(n => emoteBot(n, ch.all || ch.emote, 2.2)); if (ch.hf) emoteCalvin('highfive', 1.6); else if (ch.all === 'laugh') emoteCalvin('laugh', 1.6);
      if (ch.end) return closeTalk(); setTimeout(() => mode === m && showMenu([{ t: '🎲 Another round!', act: 'again' }, { t: '👋 Back to work, team', end: true, react: 'Aye aye, boss!', reactor: m.names[0], emote: 'thumbs' }]), 1400); return; }
    const n = m.bot.userData.name; const line = pickLine(ch.react, n); if (line) say(n, line, wt2, 5); emoteBot(n, ch.emote || 'nod', 2.0); if (ch.hf) emoteCalvin('highfive', 1.6);
    if (ch.topic) mem.set(n, ch.topic); runAct(ch.act, m.bot, wt2);
    if (ch.end) return closeTalk();
    setTimeout(() => { if (mode !== m) return; const next = buildRoot(n, tctx); m.node = next; showMenu([{ t: '💬 What else is new?', act: 'more' }, ...next.choices.filter(x => x.act && x.act !== 'chat').slice(0, 2), next.choices.at(-1)]); }, 1500);
  }, 900); }
function runAct(a, bot, wt) { const n = bot?.userData.name;
  if (a === 'more') { openTalk(bot); return; }
  if (a === 'coffee') { bot.userData.brain.setLocal('pantry', wt, 40); say('Calvin', 'To the pantry! ☕', wt + 1, 2.5); closeTalk(); }
  if (a === 'game') { bot.userData.brain.setLocal('game', wt, 60); setTimeout(() => say('Calvin', '(Sit on the sofa to play!)', wallTime(), 3.5), 1200); closeTalk(); }
  if (a === 'song') { bot.userData.brain.setLocal('bob', wt, 24); setTimeout(() => say(n, '🎵 ♪ 🎶 ♫ ♪ 🎵', wallTime(), 9), 2600); setTimeout(() => emoteCalvin('nod', 6), 2600); }
  if (a === 'sketchfb') { bot.userData.props.pad.visible = true; }
}
// interactable objects: { label, x, z, r, run }
const { cx: LX, cz: LZ } = LOUNGE; const HIPC = 0.37 * (1.5 - CALVIN_S);
const bossGlow = new THREE.Sprite(new THREE.SpriteMaterial({ map: radial, color: 0x9ff0ff, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending })); bossGlow.scale.set(2.4, 1.4, 1); bossGlow.position.set(BOSS_DESK[0], 1.45, BOSS_DESK[1] + 0.22); bossGlow.visible = false; scene.add(bossGlow);
const seat = (kind, pos, rot, y, pose, label, extra = {}) => ({ label, x: pos[0], z: pos[1], r: 1.4, run: () => { player.sitAt({ kind, pos, rot, y, pose, ...extra }); closeTalk(); onSit(kind); } });
const OBJS = [
  seat('desk', [BOSS_DESK[0], BOSS_DESK[1] - 1.0], 0, 0.07 + HIPC, 'type', '💼 Sit & work', { camDist: 9.5, onStand: () => { bossGlow.visible = false; } }),
  seat('sofa', [LX - 1.95, LZ + 0.5], Math.PI / 2, -0.06 + HIPC, 'stand', '🛋️ Sit on sofa', { camDist: 13 }),
  seat('sofa', [LX + 2.1, LZ - 0.9], -1.1 + Math.PI, -0.04 + HIPC, 'stand', '🪑 Sit in armchair', { camDist: 13 }),
  seat('meeting', [(GLASS.x0 + GLASS.x1) / 2 - 2.1, (GLASS.z0 + GLASS.z1) / 2], Math.PI / 2, -0.05 + HIPC, 'stand', '🪑 Sit at meeting table', { camDist: 12 }),
  { label: () => player.carry ? '🍵 Sip coffee' : '☕ Make coffee', x: PANTRY.x - 0.3, z: PANTRY.z + 1.4, r: 1.6, run: () => { const t = clock.getElapsedTime(); if (player.carry) { emoteCalvin('sip', 2.4); say('Calvin', pick(['Ahh, perfect.', 'Mmm. Founder fuel.', 'Best brew on the island.']), wallTime(), 2.5); return; }
    emoteCalvin('water', 2.0); say('Calvin', 'Brewing… ☕', wallTime(), 2); setTimeout(() => { player.carry = true; say('Calvin', 'Fresh brew! ☕', wallTime(), 2.5); }, 2000); } },
  { label: '🐱 Pet the cat', x: LX - 2.15, z: LZ + 0.85, r: 1.5, run: () => { emoteCalvin('pet', 2.8); const wt = wallTime(); say('Mochi', '💕 purrr… 💕', wt + 0.6, 4); calvinFlag = 'cat'; flagUntil = wt + 90; } },
  { label: '🔭 Look through telescope', x: 0.6, z: 6.9, r: 1.4, run: () => { emoteCalvin('look', 5); player.look = { pos: new THREE.Vector3(0.6, 3.0, 8.2), tgt: new THREE.Vector3(9, 6, 60) }; say('Calvin', pick(['Is that… another island? 🏝️', 'I can see the Imagine.ooo blimp!', 'Clouds shaped like a roadmap.']), wallTime() + 1, 3.5); setTimeout(() => { player.look = null; }, 5000); } },
  { label: '📚 Browse books', x: -2.75, z: -6.7, r: 1.6, run: () => { emoteCalvin('read', 2.5); say('Calvin', pick(['"Zero to One"… classic.', '"The Cozy Startup". Must read.', '"Shaders for Cats". Hmm.']), wallTime(), 3); } },
  { label: '🖍️ Doodle on whiteboard', x: 2.9, z: -6.8, r: 1.4, run: () => { emoteCalvin('sketch', 2.5); say('Calvin', pick(['Drew a tiny cat. 🐱', 'Q4 plan: ☕ → 🚀', 'Added a smiley. Morale +10.']), wallTime(), 3); } },
  ...[[-4.6, -7.2], [7.4, 2.6], [-2.4, 7.2], [6.6, 6.9], [10.2, -1.2], [-10.2, 7.3], [10.1, 7.1]].map(([x, z]) => ({ label: '💧 Water plant', x, z, r: 1.3, run: () => { emoteCalvin('water', 2.4); say('Calvin', pick(['There you go, buddy 🌱', 'Grow big and leafy!', 'Hydration is self-care 💧']), wallTime(), 3); } })),
];
function onSit(kind) { const wt = wallTime();
  if (kind === 'desk') { bossGlow.visible = true; say('Calvin', pick(['Time to build. 💻', 'Inbox zero, here I come.', 'Okay, focus mode.']), wt, 2.5); }
  if (kind === 'sofa' || kind === 'meeting') { const zone = kind === 'sofa' ? 'lounge' : 'meeting'; const here = chibis.filter(c => zoneOf(c) === zone && Math.hypot(c.position.x - calvin.position.x, c.position.z - calvin.position.z) < 6);
    if (player.seat && chibis.find(c => c.userData.name === 'Pixel')?.userData.brain.state.act === 'game' && kind === 'sofa') { player.seat.pose = 'game'; calvin.userData.props.ctrl.visible = true; say('Pixel', 'Player 2 has entered the game! 🎮', wt + 0.8, 4); emoteBot('Pixel', 'jump'); }
    if (here.length >= 2) setTimeout(() => openGroup(here.map(c => c.userData.name), wallTime()), 900); else if (here.length === 1) setTimeout(() => openTalk(here[0]), 900); } }
actb.addEventListener('click', e => { e.stopPropagation(); if (mode && imenu.classList.contains('on')) { closeTalk(); return; } if (!target) return; const wt = wallTime();
  if (target.kind === 'stand') { player.stand(); closeTalk(); return; }
  if (target.kind === 'group') return openGroup(target.names, wt);
  if (target.kind === 'bot') return openTalk(target.c);
  if (target.kind === 'obj') target.o.run(); });
const v3 = new THREE.Vector3();
function interact(wt, t, dt) {
  // pick the best target: seated -> Stand; group of 2+ bots; nearest bot; nearest object
  let tg = null; const cp = calvin.position;
  const near = chibis.map(c => [c, Math.hypot(c.position.x - cp.x, c.position.z - cp.z)]).filter(([, d]) => d < 3.2).sort((a, b) => a[1] - b[1]);
  let closeObj = null; { let bd = 0.95; OBJS.forEach(o => { const d = Math.hypot(o.x - cp.x, o.z - cp.z); if (d < bd) { bd = d; closeObj = o; } }); }
  const social = near.filter(([c]) => zoneOf(c) !== 'desk');
  if (player.seat) tg = { kind: 'stand', label: player.seat.kind === 'desk' ? '⬆️ Stand up' : '⬆️ Stand', id: 'stand' };
  else if (closeObj) tg = { kind: 'obj', o: closeObj, label: typeof closeObj.label === 'function' ? closeObj.label() : closeObj.label, id: 'o' + closeObj.x + closeObj.z };
  else if (social.length >= 2 && social[1][1] < 3.2) tg = { kind: 'group', names: social.map(([c]) => c.userData.name), label: '🎉 Join the chat', id: 'g' + social.map(([c]) => c.userData.name).join() };
  else if (near.length && near[0][1] < 2.5) tg = { kind: 'bot', c: near[0][0], label: '💬 Talk to ' + near[0][0].userData.name, id: near[0][0].userData.name };
  else { let bd = 1e9; OBJS.forEach(o => { const d = Math.hypot(o.x - cp.x, o.z - cp.z); if (d < o.r && d < bd) { bd = d; tg = { kind: 'obj', o, label: typeof o.label === 'function' ? o.label() : o.label, id: 'o' + o.x + o.z }; } }); }
  if ((tg?.id) !== (target?.id)) { if (mode && !(tg && (tg.id === mode.bot?.userData.name || tg.kind === 'group' || tg.kind === 'stand'))) closeTalk(); }
  if (player.look) tg = null; target = tg; actb.style.display = tg ? 'block' : 'none'; if (tg) actb.textContent = mode && imenu.classList.contains('on') ? '✖ Close' : tg.label;
  // greet on approach (once per 25 s), group invite when walking up to 2+ bots
  if (tg?.kind === 'bot') { const n = tg.c.userData.name; if (!greeted[n] || wt - greeted[n] > 25) { greeted[n] = wt; face[n] = wt + 5; emoteBot(n, pick(['wave', 'shywave', 'jump']), 2.0); const m = mem.get(n); say(n, m && Math.random() < 0.5 ? REMEMBER_HI(n, m.topic) : pick(GREET[n]), wt); } }
  if (tg?.kind === 'group' && (!greeted[tg.id] || wt - greeted[tg.id] > 40)) { greeted[tg.id] = wt; const a = tg.names[0]; say(a, pick(['Calvin! Come join us!', 'Boss! Pull up a chair!', 'Ooh, Calvin\'s here! 🎉']), wt); tg.names.forEach(n => { face[n] = wt + 6; emoteBot(n, 'wave', 1.8); }); }
  // floating button + menu beside Calvin's head (screen space, clamped, clear of the joystick)
  if (tg) { v3.set(cp.x, cp.y + 3.0 * CALVIN_S / 1.16, cp.z).project(camera); let x = (v3.x + 1) / 2 * innerWidth + 40, y = (1 - v3.y) / 2 * innerHeight + 24;
    const bw = actb.offsetWidth, bh = actb.offsetHeight; x = Math.min(Math.max(8, x), innerWidth - bw - 8); y = Math.min(Math.max(60, y), innerHeight - bh - 10);
    const joy = document.getElementById('joy'); if (joy) { const r = joy.getBoundingClientRect(); if (x < r.right + 8 && y + bh > r.top - 8) y = r.top - bh - 12; }
    actb.style.transform = `translate(${x | 0}px, ${y | 0}px)`;
    if (imenu.classList.contains('on')) { const mw = imenu.offsetWidth, mh = imenu.offsetHeight; let mx = Math.min(Math.max(8, x), innerWidth - mw - 8), my = y + bh + 8; if (my + mh > innerHeight - 10) my = y - mh - 8; my = Math.max(60, my);
      if (joy) { const r = joy.getBoundingClientRect(); if (mx < r.right + 8 && my + mh > r.top - 8) mx = Math.min(r.right + 10, innerWidth - mw - 8); } imenu.style.transform = `translate(${mx | 0}px, ${my | 0}px)`; } }
  else if (imenu.classList.contains('on')) closeTalk();
  // bots face Calvin; emotes layered on top of the routine pose
  chibis.forEach(c => { const n = c.userData.name, P = c.userData.parts, bs = c.userData.brain.state;
    if (face[n] > wt) { let a = Math.atan2(cp.x - c.position.x, cp.z - c.position.z) - c.rotation.y; a = Math.atan2(Math.sin(a), Math.cos(a));
      if (bs.seated || bs.walking) P.head.rotation.y = THREE.MathUtils.clamp(a, -0.9, 0.9); else c.rotation.y += a * Math.min(1, dt * 6); }
    const e = botEmote[n]; if (e && e.until > t) applyPose(c, e.name, t, dt, bs.seated, c.userData.persona); });
}
const REMEMBER_HI = (n, topic) => ({ Pixel: `Boss! Still thinking about ${topic}!`, Jun: `Hi Calvin! I sketched something about ${topic}.`, Sage: `Calvin. I've been pondering ${topic}.`, Mika: `Heyy! Our ${topic} chat inspired a new cut!` })[n];
const pick = a => a[Math.floor(Math.random() * a.length)];
window.__near = () => target?.label || null; window.__target = () => target; window.__mode = () => mode; window.__objs = OBJS; window.__choose = i => imenu.children[i]?.click();
let slow = 0; function autoTier(fps, t) { if (tier === 'low' || new URLSearchParams(location.search).get('q') || t < 4) return; slow = fps < 24 ? slow + 1 : 0;
  if (slow >= 4) { tier = 'low'; toonUniforms.uDetail.value = 0; renderer.setPixelRatio(1); atmos.demote(); if (steamFx) steamFx.visible = false; console.log('quality tier -> low'); } }
function loop() { const t = clock.getElapsedTime(); toonUniforms.uTime.value = t; atmos.update(t); if (steamFx) steamFx.material.uniforms.uTime.value = t; const dt = Math.min(0.1, t - prevT); prevT = t; const wt = wallTime(); brains.forEach(b => b.update(wt, dt, t));
  island.children.forEach(c => { if (c.userData.float !== undefined) c.position.y += Math.sin(t + c.userData.float) * 0.003; });
  glows.forEach((h,i)=>h.material.opacity=0.5+0.06*Math.sin(t*2+i));
  frames++; const now=performance.now(); if(now-last>1000){window.__info=renderer.info.render; window.__fps=frames*1000/(now-last); autoTier(window.__fps, t); fpsEl.textContent=window.__fps.toFixed(0)+' fps'; frames=0; last=now;}
  player.update(dt, t); interact(wt, t, dt);
  const sp = speechAt(wt, talkers);
  talkersAll.forEach((c, i) => { const nm = c.userData.name, bs = c.userData.brain?.state; const loc = localSay[nm]; let text = loc && loc.until > wt ? loc.text : (sp && sp.name === nm ? sp.text : '');
    drawBubble(bubbles[i], bs ? (bs.walking ? '🚶' : actEmoji(bs.act)) : '', text); const bb = bubbles[i]; bb.sp.visible = bb.big || !!bs;
    const dcam = camera.position.distanceTo(c.position), sc = (bb.big ? THREE.MathUtils.clamp(dcam * 0.16, 3.0, 7.5) : THREE.MathUtils.clamp(dcam * 0.05, 0.8, 2.6)); bb.sp.scale.set(sc, sc * 0.344, 1); bb.sp.position.set(c.position.x, c.position.y + 3.7 * BOT_S / 1.5 + sc * 0.17, c.position.z); });
  blobs.forEach(([c, m]) => m.position.set(c.position.x + 0.2, 0.02, c.position.z - 0.15));
  if (selected) { const bs = selected.userData.brain.state; card.querySelector('.t').textContent = bs.label + (bs.override ? ' (live)' : ''); card.querySelector('.wt').textContent = selected.userData.task || '—'; ring.position.set(selected.position.x, 0.04, selected.position.z); }
  sky.clouds.children.forEach(c => { c.position.y += Math.sin(t * 0.3 + c.userData.drift * 6) * 0.004; });
  nature.update(t);
  { const d = camera.position.distanceTo(controls.target); toonUniforms.uFogRange.value.set(d + 15, d + 170); }
  controls.update(); renderer.render(scene, camera); requestAnimationFrame(loop); }
loop();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); if (!camP) { const off = camera.position.clone().sub(controls.target).setLength(fitDistance()); camera.position.copy(controls.target).add(off); } renderer.setSize(innerWidth, innerHeight); });
