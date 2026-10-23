// Calvin: the playable boss chibi. Local to this device (not synced).
// Desktop: WASD / arrows (Shift = run). Touch: analog virtual joystick (bottom-left). Camera follows with smoothing.
import * as THREE from 'three';
import { makeChibi } from './chibi.js';
import { applyPose } from './behavior.js';
import { CALVIN_S, DESKS, BOSS_DESK, GLASS, LOUNGE, PANTRY, BACK_Z, FLOOR, LEFT_X, ROOF, STAIRS, BALCONY, PARK, TREES, POOL, WALK_R, inR, heightAt, canopyRadius, headReach, HEAD_R, HEAD_M, PLANTS, PLANT_SPHERES, HOUSE, FIRE, GARDEN, BRIDGE, walkClamp, inBridge, onHome, inBridge2, onShop, SHOP_BLDG, SHOP_SIDE, STREET_TREE, shopBox, STREET_PROPS, SHOP, shopFront } from './layout.js';

const R = 0.42; // body radius (legs/torso vs low furniture, railings)
const RH = HEAD_R + HEAD_M; // head radius + margin vs anything head-high (walls, glass, panels, foliage)
let RR = R; // radius used by pushOut (switched per pass)
// furniture AABBs [x0,z0,x1,z1] (world space) + circles [x,z,r]
const L = LOUNGE;
const BOXES0 = [
  ...[...DESKS, BOSS_DESK].map(([x, z]) => [x - 1.15, z - 0.6, x + 1.15, z + 0.6]),
  [L.cx - 1.9, L.cz + 1.85, L.cx + 1.9, L.cz + 2.7], [L.cx - 2.8, L.cz - 1.6, L.cx - 2.0, L.cz + 1.6], // sofas
  [PANTRY.x - 1.9, PANTRY.z - 0.75, PANTRY.x + 2.0, PANTRY.z + 0.6], [3.5, BACK_Z, 6.3, BACK_Z + 0.95], [-4.5, BACK_Z, -1.0, BACK_Z + 0.75],
];
// home island: beds + persona corners (body), house walls + tall items (head), campfire ring + log benches + garden + lantern posts
const HB = HOUSE.rooms.flatMap(r => { const lx = r.x0 + 0.1, fz = HOUSE.z0 + 0.9, bed = [r.cx - 1.55, HOUSE.z1 - 1.55, r.cx + 1.5, HOUSE.z1];
  const corner = { Pixel: [lx, fz - 0.7, lx + 0.5, fz + 0.7], Jun: [lx + 0.3, fz - 0.45, lx + 1.2, fz + 0.45], Sage: [lx, fz - 0.65, lx + 0.45, fz + 1.05], Mika: [lx, fz - 0.7, lx + 1.1, fz + 1.4] }[r.who];
  const extra = { Pixel: [lx + 0.95, fz - 0.4, lx + 1.85, fz + 0.6], Jun: [lx + 1.25, fz + 0.25, lx + 1.75, fz + 0.75], Sage: [lx + 0.95, fz - 0.45, lx + 1.65, fz + 0.25], Mika: [lx + 1.4, HOUSE.z1 - 2.0, lx + 1.8, HOUSE.z1 - 1.5] }[r.who];
  return [bed, corner, extra, [r.x1 - 0.5, HOUSE.z0 + 0.4, r.x1 - 0.1, HOUSE.z0 + 1.3]]; }); // + wardrobe closet
const HOUSE_TALL = [[HOUSE.x0, HOUSE.z1 - 0.08, HOUSE.x1, HOUSE.z1 + 0.08], ...HOUSE.walls.map(x => [x - 0.08, HOUSE.z0 - 0.07, x + 0.08, HOUSE.z1]),
  ...HOUSE.rooms.flatMap(r => { const lx = r.x0 + 0.1, fz = HOUSE.z0 + 0.9; return { Pixel: [[lx, fz - 0.58, lx + 0.48, fz + 0.58]], Jun: [[lx + 0.35, fz - 0.4, lx + 1.15, fz + 0.4]], Sage: [[lx, fz - 0.65, lx + 0.45, fz + 1.05]], Mika: [] }[r.who]; })];
const HOME_CIRCLES = [[FIRE.x, FIRE.z, 0.82], ...FIRE.logs.flatMap(L => [-0.55, 0, 0.55].map(k => [L.x + Math.cos(L.a + Math.PI) * 0 + Math.sin(-L.a) * 0 + Math.cos(-L.a) * k, L.z + Math.sin(-L.a) * k * -1 + 0, 0.34])),
  ...[[BRIDGE.x - 1.7, 15.9], [BRIDGE.x + 1.7, 15.9], [BRIDGE.x - 1.7, 24.1], [BRIDGE.x + 1.7, 24.1], [HOUSE.rooms[1].x1 - 1.4 + 0.0, FIRE.z + 1.8], [HOUSE.rooms[2].x0 + 1.4, FIRE.z + 1.8]].map(([x, z]) => [x, z, 0.1]), ...[-1, 1].flatMap(sd => [BRIDGE.s0 - 0.6, BRIDGE.s1 + 0.6].map(z => [BRIDGE.x + sd * BRIDGE.half, z, 0.14]))];
const HOME_BOXES = [...HB, [HOUSE.x0 - 0.9, HOUSE.z0 + 1.2, HOUSE.x0, HOUSE.z1], [HOUSE.x1, HOUSE.z0 + 1.2, HOUSE.x1 + 0.9, HOUSE.z1], // rim wedges beside the side walls (rim clamp would shove the head into the wall)
  [GARDEN.x - GARDEN.w / 2, GARDEN.z - GARDEN.d / 2, GARDEN.x + GARDEN.w / 2, GARDEN.z + GARDEN.d / 2]];
const CIRCLES0 = [[L.cx, L.cz, 0.65], [(GLASS.x0 + GLASS.x1) / 2, (GLASS.z0 + GLASS.z1) / 2, 1.25], [-4.6, -7.2, 0.5], [7.4, 2.6, 0.62], [-2.4, 7.2, 0.5], [6.6, 6.9, 0.62], [10.2, -1.2, 0.5], [-3.9, 7.3, 0.3], [9.6, 3.2, 0.3], [-10.2, 7.3, 0.4], [10.1, 7.1, 0.5]];
const SHOP_CIRCLES = STREET_PROPS.map(([x, z, r]) => [x, z, r]), SHOP_BOXES = [...SHOP_BLDG.map(b => shopBox(b)), ...SHOP_SIDE]; // v16 high street: shop blocks incl. awning/counter footprint + side props + street furniture
const BOXES = [...BOXES0, ...HOME_BOXES, ...SHOP_BOXES], CIRCLES = [...CIRCLES0, ...HOME_CIRCLES, ...SHOP_CIRCLES];
// ---- two-level collision: ground (office + lawn), stairs (ramp, side-clamped), rooftop ----
const P = PARK;
// head-high thin walls/panels: pushed with the HEAD radius so the big round head never pokes through
const TALL_BOXES = [[FLOOR.x0, BACK_Z - 0.12, FLOOR.x1, BACK_Z + 0.1], [LEFT_X - 0.12, FLOOR.z0, LEFT_X + 0.12, FLOOR.z1], // back wall, left wall
  [GLASS.x0, GLASS.z1 - 0.06, GLASS.door0, GLASS.z1 + 0.06], [GLASS.x1 - 0.06, GLASS.z0, GLASS.x1 + 0.06, GLASS.z1 + 0.06], // glass room panes (door gap)
  [ROOF.x0, ROOF.z0, ROOF.x1, ROOF.z1], ...HOUSE_TALL, ...SHOP_BLDG.map(b => shopBox(b, 0)), ...SHOP_SIDE]; // annex block walls (roof only reachable from above), home longhouse
// trees: trunk is a body circle; foliage is a head circle sized from the real canopy spheres (3D head-vs-sphere clearance)
const TALL_CIRCLES = [...TREES.map(([x, z, s]) => [x, z, canopyRadius(s) - RH]), ...PLANTS.map(([x, z, s]) => [x, z, headReach(PLANT_SPHERES, s) - RH]), ...HOME_CIRCLES.filter(c => c[2] === 0.1).map(([x, z]) => [x, z, 0.16]), ...STREET_PROPS.filter(p => p[3] === 'tree').map(([x, z]) => [x, z, STREET_TREE.canopyR + HEAD_R + 0.05 - RH]), ...STREET_PROPS.filter(p => p[3] === 'lamp').map(([x, z]) => [x, z, 0.1])]; // + lamp posts (head vs pole) // + street-tree canopies (3D: canopy above the head line) // + lantern posts // pushOut adds RH back
const GROUND_BOXES = [
  [STAIRS.x0, STAIRS.z0 - 0.1, STAIRS.x1 - 0.5, STAIRS.z0 + 0.02], [STAIRS.x0, STAIRS.z1 - 0.02, STAIRS.x1 - 0.5, STAIRS.z1 + 0.1]]; // stair sides
const GROUND_CIRCLES = [...TREES.map(([x, z, s]) => [x, z, 0.24 * s]), [POOL.x, POOL.z, 2.5], [-8.6, 9.6, 1.4], [-1.2, 13.0, 0.8], [P.cx, P.cz, 1.15],
  ...[0, 2.1, 4.2].map(a => [P.cx + Math.cos(a + 0.5) * 1.75, P.cz + Math.sin(a + 0.5) * 1.75, 0.5]), ...P.benches.map(([x, z]) => [x, z, 0.75]),
  [BALCONY.x0 + 0.9, BALCONY.z1 - 0.35, 0.35], [BALCONY.x0 + 0.9, BALCONY.z0 + 0.35, 0.35]];
const ROOF_TALL = [[-5.3, -9.7, canopyRadius(0.7) - RH]]; // little rooftop tree: head vs its canopy
const ROOF_CIRCLES = [[-6.3, -8.5, 0.5], [-6.3, -11.0, 0.5], [4.3, -11.0, 0.5], [2.0, -8.5, 0.5], [-5.3, -9.7, 0.45], [0.2, -10.0, 0.62], [-0.8, -10.0, 0.3], [1.2, -10.0, 0.3], [2.6, -11.0, 0.35],
  [-4.4, -9.95, 0.12], [-1.6, -9.95, 0.12], [-4.4, -11.45, 0.12], [-1.6, -11.45, 0.12]];
const ROOF_BOXES = [[-3.9, -11.3, -2.1, -10.8]]; // bench
function pushOut(p, boxes, circles) {
  for (const [x0, z0, x1, z1] of boxes) { const cx = Math.max(x0, Math.min(p.x, x1)), cz = Math.max(z0, Math.min(p.z, z1)); const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < RR) { if (d > 1e-4) { p.x = cx + dx / d * RR; p.z = cz + dz / d * RR; } else { const m = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z], i = m.indexOf(Math.min(...m)); if (i === 0) p.x = x0 - RR; else if (i === 1) p.x = x1 + RR; else if (i === 2) p.z = z0 - RR; else p.z = z1 + RR; } } }
  for (const [x, z, r] of circles) { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz), m = r + RR; if (d < m && d > 1e-4) { p.x = x + dx / d * m; p.z = z + dz / d * m; } } }
// p = proposed {x,z}; from = current position (decides which level we're on)
// rim trees: when the island edge and a canopy circle squeeze him, slide along the rim to where the circle meets it
function rimSlide(p) { const W = WALK_R, r = Math.hypot(p.x, p.z); if (r < W - 0.02 || inR(BALCONY, p.x, p.z, -0.05) || inBridge(p.x, p.z, 0.2) || onHome(p.x, p.z, 1) || inBridge2(p.x, p.z, 0.2) || onShop(p.x, p.z, 1)) return;
  for (const [cx, cz, cr] of TALL_CIRCLES) { const m = cr + RH, d = Math.hypot(p.x - cx, p.z - cz); if (d >= m) continue; const C = Math.hypot(cx, cz), ca = (W * W + C * C - m * m) / (2 * W * C);
    if (Math.abs(ca) >= 1) continue; const al = Math.acos(ca), th = Math.atan2(p.z, p.x), tc = Math.atan2(cz, cx), wr = a => Math.atan2(Math.sin(a), Math.cos(a));
    const t = Math.abs(wr(tc + al - th)) < Math.abs(wr(tc - al - th)) ? tc + al : tc - al; const q = 1 - 0.005; p.x = Math.cos(t) * W * q; p.z = Math.sin(t) * W * q; } }
export function collide(p, others = [], from = null, small = false) { // small = pets (no head)
  const fx = from ? from.x : p.x, fz = from ? from.z : p.z;
  if (inR(STAIRS, fx, fz)) { p.z = Math.max(STAIRS.z0 + R, Math.min(STAIRS.z1 - R, p.z)); p.x = Math.min(STAIRS.x1 + 0.6, Math.max(STAIRS.x0 - 0.6, p.x)); return p; }
  if (inR(ROOF, fx, fz)) { const toStairs = p.x > ROOF.x1 - R && p.z > STAIRS.z0 + R && p.z < STAIRS.z1 - R;
    for (let it = 0; it < 3; it++) { if (!toStairs) p.x = Math.max(ROOF.x0 + R, Math.min(ROOF.x1 - R, p.x)); p.z = Math.max(ROOF.z0 + R, Math.min(ROOF.z1 - R, p.z));
      RR = R; pushOut(p, ROOF_BOXES, [...ROOF_CIRCLES, ...others]); if (!small) { RR = RH; pushOut(p, [], ROOF_TALL); RR = R; } } return p; }
  if (inR(STAIRS, p.x, p.z) && fx < STAIRS.x1 - 0.3) p.x = Math.max(p.x, STAIRS.x1 + 0.01); // no side entry onto the ramp
  for (let it = 0; it < 4; it++) {
    RR = R; pushOut(p, [...BOXES, ...GROUND_BOXES], [...CIRCLES, ...GROUND_CIRCLES, ...others]);
    if (!small) { RR = RH; pushOut(p, TALL_BOXES, TALL_CIRCLES); RR = R; } else { RR = 0.3; pushOut(p, TALL_BOXES, []); RR = R; }
    if (!inR(BALCONY, p.x, p.z, -0.05) && !inR(STAIRS, p.x, p.z)) walkClamp(p, WALK_R);
    if (inR(BALCONY, p.x, p.z, 0.4)) { p.x = Math.min(p.x, BALCONY.x1 - R); if (p.x > BALCONY.x0 - 0.2) p.z = Math.max(BALCONY.z0 + R, Math.min(BALCONY.z1 - R, p.z)); }
  }
  if (!small) rimSlide(p);
  return p;
}

export function makePlayer({ scene, camera, controls, bots }) {
  const c = makeChibi({ name: 'Calvin', role: 'Founder · Boss', hair: 0x3b2a22, shirt: 0x2f4f86, pants: 0x3a3a48, skin: 0xffdcc2 });
  c.scale.setScalar(CALVIN_S); c.position.set(BOSS_DESK[0] - 1.6, 0, BOSS_DESK[1] - 1.5); c.rotation.y = Math.PI; scene.add(c);
  // owner touch: little gold lanyard badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.03), new THREE.MeshBasicMaterial({ color: 0xffc94a })); badge.position.set(0.16, 0.95, 0.43); c.userData.parts.body.add(badge);
  const keys = new Set(); const joy = { x: 0, y: 0 };
  addEventListener('keydown', e => { if (e.target.closest?.('input,textarea')) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { keys.add(k); if (k.startsWith('arrow')) e.preventDefault(); } });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase())); addEventListener('blur', () => keys.clear());
  // ---- virtual joystick (touch devices, or ?joy for testing) ----
  const touch = matchMedia('(pointer: coarse)').matches || location.search.includes('joy');
  const st = document.createElement('style'); st.textContent = `#joy{position:fixed;left:max(18px,env(safe-area-inset-left));bottom:max(22px,env(safe-area-inset-bottom));width:clamp(104px,30vmin,148px);aspect-ratio:1;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid rgba(42,31,53,.35);touch-action:none;z-index:5;backdrop-filter:blur(2px)}
#joy .k{position:absolute;left:50%;top:50%;width:44%;aspect-ratio:1;border-radius:50%;background:rgba(255,250,242,.75);border:2px solid rgba(42,31,53,.55);transform:translate(-50%,-50%);box-shadow:0 3px 0 rgba(42,31,53,.3)}
.hudb{position:fixed;z-index:5;border:2px solid #2a1f35;border-radius:14px;background:rgba(255,250,242,.92);color:#2a1f35;font:700 14px system-ui,sans-serif;box-shadow:0 3px 0 #2a1f35;cursor:pointer;min-height:44px;padding:0 14px}
#camb{top:max(12px,env(safe-area-inset-top));right:12px} #actb{right:max(16px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));min-height:60px;min-width:60px;border-radius:30px;background:#ffd36a;font-size:15px;display:none}
#imenu{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(max(26px,env(safe-area-inset-bottom)) + 72px);z-index:6;display:none;flex-direction:column;gap:8px} #imenu.on{display:flex} #imenu button{position:static}
body.cardon #actb,body.cardon #imenu{display:none!important}`;
  document.head.appendChild(st);
  if (touch) { const j = document.createElement('div'); j.id = 'joy'; j.innerHTML = '<div class="k"></div>'; document.body.appendChild(j); const kn = j.firstChild; let id = null;
    const mv = e => { const r = j.getBoundingClientRect(), rad = r.width / 2; let dx = e.clientX - (r.left + rad), dy = e.clientY - (r.top + rad); const d = Math.hypot(dx, dy), m = Math.min(d, rad); if (d > 0) { dx = dx / d * m; dy = dy / d * m; }
      joy.x = dx / rad; joy.y = dy / rad; kn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; };
    j.addEventListener('pointerdown', e => { id = e.pointerId; j.setPointerCapture(id); mv(e); e.preventDefault(); });
    j.addEventListener('pointermove', e => { if (e.pointerId === id) mv(e); });
    const up = e => { if (e.pointerId !== id) return; id = null; joy.x = joy.y = 0; kn.style.transform = ''; }; j.addEventListener('pointerup', up); j.addEventListener('pointercancel', up); }
  // ---- run toggle (v15): Shift on keyboard; a latching 🏃 button for touch (or ?joy) ----
  const runb = document.createElement('button'); runb.id = 'runb'; runb.className = 'hudb'; runb.type = 'button'; runb.textContent = '🚶 Walk';
  runb.style.cssText = 'left:calc(max(18px,env(safe-area-inset-left)) + clamp(104px,30vmin,148px) + 12px);bottom:max(26px,env(safe-area-inset-bottom));display:' + (touch ? 'block' : 'none');
  runb.addEventListener('click', () => { api.runOn = !api.runOn; runb.textContent = api.runOn ? '🏃 Run' : '🚶 Walk'; runb.style.background = api.runOn ? '#ffd36a' : ''; }); document.body.appendChild(runb);
  // ---- camera follow toggle ----
  let follow = false; const camb = document.createElement('button'); camb.id = 'camb'; camb.className = 'hudb'; camb.type = 'button';
  const setFollow = f => { follow = f; camb.textContent = f ? '🗺️ Overview' : '🎥 Follow Calvin'; if (!f) { home.active = true; } }; document.body.appendChild(camb);
  const home = { target: controls.target.clone(), pos: camera.position.clone(), active: false };
  camb.addEventListener('click', () => setFollow(!follow)); setFollow(false);
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mvv = new THREE.Vector3(), tmp = new THREE.Vector3();
  const api = { chibi: c, speed: 0, moved: false, get follow() { return follow; }, setFollow, joy, keys };
  api.update = (dt, t) => {
    let ix = 0, iy = 0; if (keys.has('a') || keys.has('arrowleft')) ix -= 1; if (keys.has('d') || keys.has('arrowright')) ix += 1; if (keys.has('w') || keys.has('arrowup')) iy -= 1; if (keys.has('s') || keys.has('arrowdown')) iy += 1;
    let mag; if (ix || iy) { const l = Math.hypot(ix, iy); ix /= l; iy /= l; mag = keys.has('shift') || api.runOn ? 1 : 0.6; } else { ix = joy.x; iy = joy.y; mag = Math.min(1, Math.hypot(ix, iy)); if (mag < 0.12) mag = 0; else { ix /= mag; iy /= mag; if (api.runOn) mag = 1; else mag = Math.min(mag, 0.7); } } // touch: run only via the 🏃 toggle
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); right.set(-fwd.z, 0, fwd.x);
    if (api.debugDir) { const d = api.debugDir; mag = d[2] ?? 0.6; fwd.set(d[0], 0, d[1]).normalize(); right.set(-fwd.z, 0, fwd.x); ix = 0; iy = -1; } // test hook: world-space walk direction
    const run = mag > 0.72, speed = mag ? (run ? 4.6 : 1.2 + mag * 2.2) : 0; api.speed = speed;
    if (speed) { mvv.copy(right).multiplyScalar(ix).addScaledVector(fwd, -iy).normalize(); if (!api.moved) { api.moved = true; setFollow(true); }
      const p = collide({ x: c.position.x + mvv.x * speed * dt, z: c.position.z + mvv.z * speed * dt }, bots.filter(b => Math.abs(b.position.y - c.position.y) < 1).map(b => [b.position.x, b.position.z, 0.45]), c.position);
      c.position.x = p.x; c.position.z = p.z; let dr = Math.atan2(mvv.x, mvv.z) - c.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.rotation.y += dr * Math.min(1, dt * 10); }
    if (api.seat) { if (speed) api.stand(); else { const S = api.seat; c.position.set(S.pos[0], c.position.y + (S.y + heightAt(S.pos[0], S.pos[1]) - c.position.y) * Math.min(1, dt * 7), S.pos[1]); c.rotation.y = S.rot;
        applyPose(c, api.emote && api.emote.until > t ? api.emote.name : S.pose, t, dt, !S.standing, { cup: 0x6b4226 }); api.afterPose?.(t); followCam(dt, S.camDist); return; } }
    else { const gy = heightAt(c.position.x, c.position.z); c.position.y += (gy - c.position.y) * Math.min(1, dt * 14); }
    applyPose(c, api.emote && api.emote.until > t ? api.emote.name : api.waveUntil > t ? 'wave' : speed ? (run ? 'run' : 'walk') : 'stand', speed ? t * (run ? 1.6 : 0.8 + mag * 0.4) : t, dt, false, {});
    if (api.carry && !(api.emote && api.emote.until > t)) { const P = c.userData.parts; c.userData.props.cup.visible = true; P.armR.rotation.x = -1.3; P.armR.rotation.z = -0.25; }
    api.afterPose?.(t); followCam(dt);
  };
  function followCam(dt, near) {
    const CL = window.__camLock; if (CL) { camera.position.set(...CL[0]); controls.target.set(...CL[1]); return; } // test hook: fixed inspection camera
    // camera: follow with smoothing (shift target and camera by the same delta, so orbiting still works)
    const SL = api.seat?.look; if (SL && !api.look) { const k = 1 - Math.exp(-dt * 1.6); controls.target.lerp(SL.tgt.clone().sub(SL.pos).setLength(6).add(SL.pos), k); camera.position.lerp(SL.pos, k); return; }
    if (api.seat && api.seat.camYaw !== undefined && !api.look) { const S2 = api.seat, d = S2.camDist || 11, a = S2.rot + S2.camYaw; tmp.set(c.position.x, c.position.y + 1.0, c.position.z); const k = 1 - Math.exp(-dt * 2.4);
      controls.target.lerp(tmp, k); camera.position.lerp(new THREE.Vector3(tmp.x + Math.sin(a) * d * 0.78, tmp.y + d * 0.55, tmp.z + Math.cos(a) * d * 0.78), k); return; }
    if (api.look) { const L = api.look; const k = 1 - Math.exp(-dt * 2); controls.target.lerp(L.tgt, k); camera.position.lerp(L.pos, k); return; }
    if (follow) { tmp.set(c.position.x, 1.2, c.position.z); const k = 1 - Math.exp(-dt * 3.2); const delta = tmp.sub(controls.target).multiplyScalar(k); controls.target.add(delta); camera.position.add(delta);
      const off = camera.position.clone().sub(controls.target); const want = near || (innerWidth < innerHeight ? 17 : 13); off.setLength(off.length() + (want - off.length()) * Math.min(1, dt * 1.5));
      if (onHome(c.position.x, c.position.z) && c.position.z > HOUSE.z0 - 2.5) { // near the longhouse: swing round to its open (-z) front so the rooms aren't hidden behind the back wall
        const az = Math.atan2(off.x, off.z), lim = 0.55; let tgt = Math.PI - Math.sign(off.x || 1) * Math.min(lim, Math.abs(Math.atan2(Math.sin(az - Math.PI), Math.cos(az - Math.PI))));
        let d = Math.atan2(Math.sin(tgt - az), Math.cos(tgt - az)); const na = az + d * Math.min(1, dt * 1.8), h = Math.hypot(off.x, off.z); off.x = Math.sin(na) * h; off.z = Math.cos(na) * h; }
      camera.position.copy(controls.target).add(off); controls.minDistance = 8; }
    else if (home.active) { const k = 1 - Math.exp(-dt * 3); controls.target.lerp(home.target, k); camera.position.lerp(home.pos, k); if (camera.position.distanceTo(home.pos) < 0.05) home.active = false; controls.minDistance = home.minD ?? 12; }
  }
  // seats: { pos:[x,z], rot, y, pose, camDist, onStand }
  api.sitAt = s => { api.seat = s; c.position.set(s.pos[0], c.position.y, s.pos[1]); c.rotation.y = s.rot; /* snap to the seat's facing, not the walking direction */ api.carry = s.keepMug ? api.carry : api.carry; if (!follow) setFollow(true); };
  api.stand = () => { const s = api.seat; api.seat = null; if (!s) return;
    // step off on the SAME level: try behind (pull the chair back), then in front, then the sides; accept the first walkable,
    // unobstructed spot whose floor height matches the seat's floor (never re-snap to the ground from the roof)
    const lv = heightAt(s.pos[0], s.pos[1]), fx = Math.sin(s.rot), fz = Math.cos(s.rot), from = { x: s.pos[0], z: s.pos[1] };
    let P = null; for (const [a, b] of [[-0.9, 0], [0.8, 0], [0, 0.9], [0, -0.9], [-0.6, 0.6], [0.6, -0.6], [0.5, 0]]) { const q = { x: s.pos[0] + fx * a + fz * b, z: s.pos[1] + fz * a - fx * b }; const want = { ...q };
      const r = collide(q, [], from); if (Math.hypot(r.x - want.x, r.z - want.z) < 0.12 && Math.abs(heightAt(r.x, r.z) - lv) < 0.05) { P = r; break; } }
    if (!P) P = { x: s.pos[0], z: s.pos[1] };
    c.position.x = P.x; c.position.z = P.z; c.position.y = heightAt(P.x, P.z); s.onStand?.(); };
  api.setEmote = (name, dur, t) => { api.emote = { name, until: t + dur }; };
  api.setHome = (pos, tgt) => { home.pos.copy(pos); home.target.copy(tgt); home.minD = Math.min(12, controls.minDistance); }; // ?tgt= debug framing may sit closer than 12
  return api;
}
