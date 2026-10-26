// Calvin: the playable boss chibi. Local to this device (not synced).
// Desktop: WASD / arrows (Shift = run). Touch: floating analog joystick (left half, auto-run past 80%). Camera follows with smoothing.
import * as THREE from 'three';
import { makeChibi } from './chibi.js';
import { applyPose } from './behavior.js';
import { CAFE_BOXES, CAFE_CIRCLES, CAFE_TALL, onCafeLobe } from './layout.js';
import { CALVIN_S, DESKS, BOSS_DESK, GLASS, LOUNGE, PANTRY, BACK_Z, FLOOR, LEFT_X, ROOF, STAIRS, BALCONY, PARK, TREES, POOL, WALK_R, inR, heightAt, canopyRadius, headReach, HEAD_R, HEAD_M, PLANTS, PLANT_SPHERES, HOUSE, FIRE, GARDEN, BRIDGE, walkClamp, inBridge, onHome, inBridge2, onShop, SHOP_BLDG, SHOP_SIDE, STREET_TREE, shopBox, STREET_PROPS, SHOP, shopFront, CAL, CAL_TREE, CAL_SWING, CAL_FIRE, CAL_HOUSE, CAL_POOL, CAL_DECK, CAL_SIGN, CAL_LANTERNS, BRIDGE3, onCal, inBridge3, calPoolQ, EXEC_BOXES, EXEC_CIRCLES, EXEC_TALL, onLobe, LOBE } from './layout.js';

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
// v20 Calvin's island: bed / wardrobe / bench (body), house walls + wardrobe (head), trunk, fire ring, logs, posts, swing seat
const CH = CAL_HOUSE, CHd = [CH.cx + CH.door[0], CH.cx + CH.door[1]];
export const CAL_BOXES = [CH.bed, CH.closet, (() => { const b = CAL_DECK.bench; return [b.x - 0.3, b.z - 0.9, b.x + 0.32, b.z + 0.9]; })()];
export const CAL_TALL = [[CH.x0, CH.z0 - 0.08, CH.x1, CH.z0 + 0.08], [CH.x0 - 0.08, CH.z0, CH.x0 + 0.08, CH.z1], [CH.x1 - 0.08, CH.z0, CH.x1 + 0.08, CH.z1],
  [CH.x0, CH.z1 - 0.12, CHd[0] + 0.1, CH.z1 + 0.12], [CHd[1] - 0.1, CH.z1 - 0.12, CH.x1, CH.z1 + 0.12], CH.closet];
export const CAL_CIRCLES = [[CAL_TREE.x, CAL_TREE.z, 1.4], [CAL_FIRE.x, CAL_FIRE.z, 0.82], ...CAL_FIRE.logs.flatMap(L => [-0.55, 0, 0.55].map(k => [L.x + Math.cos(L.ry) * k, L.z - Math.sin(L.ry) * k, 0.34])),
  ...[...CAL_LANTERNS, [CHd[1] + 0.45, CH.z1 + 0.9], CAL_SIGN].map(([x, z]) => [x, z, 0.12]), [CAL_SWING.x, CAL_SWING.z, 0.4], [CAL_DECK.table.x, CAL_DECK.table.z, 0.34],
  ...[-1, 1].flatMap(sd => [BRIDGE3.s0 - 0.6, BRIDGE3.s1 + 0.6].map(x => [x, BRIDGE3.z + sd * BRIDGE3.half, 0.14])), [CH.x0 + 0.35, CH.z1 - 0.4, 0.3]];
const BOXES = [...BOXES0, ...HOME_BOXES, ...SHOP_BOXES, ...CAL_BOXES, ...EXEC_BOXES, ...CAFE_BOXES], CIRCLES = [...CIRCLES0, ...HOME_CIRCLES, ...SHOP_CIRCLES, ...CAL_CIRCLES, ...EXEC_CIRCLES, ...CAFE_CIRCLES];
// ---- two-level collision: ground (office + lawn), stairs (ramp, side-clamped), rooftop ----
const P = PARK;
// head-high thin walls/panels: pushed with the HEAD radius so the big round head never pokes through
const TALL_BOXES = [[FLOOR.x0, BACK_Z - 0.12, FLOOR.x1, BACK_Z + 0.1], [LEFT_X - 0.12, FLOOR.z0, LEFT_X + 0.12, FLOOR.z1], // back wall, left wall
  [GLASS.x0, GLASS.z1 - 0.06, GLASS.door0, GLASS.z1 + 0.06], [GLASS.x1 - 0.06, GLASS.z0, GLASS.x1 + 0.06, GLASS.z1 + 0.06], // glass room panes (door gap)
  [ROOF.x0, ROOF.z0, ROOF.x1, ROOF.z1], ...HOUSE_TALL, ...SHOP_BLDG.map(b => shopBox(b, 0)), ...SHOP_SIDE, ...CAL_TALL, ...EXEC_TALL, ...CAFE_TALL]; // annex block walls (roof only reachable from above), home longhouse
// trees: trunk is a body circle; foliage is a head circle sized from the real canopy spheres (3D head-vs-sphere clearance)
const TALL_CIRCLES = [...TREES.map(([x, z, s], i) => [x, z, canopyRadius(s) - RH + (i < 3 ? 0.07 : 0)]), // v27: the café-garden trees 0-2 (big crowns, open lawn on all sides) get a hair more margin
  ...PLANTS.map(([x, z, s]) => [x, z, headReach(PLANT_SPHERES, s) - RH]), ...HOME_CIRCLES.filter(c => c[2] === 0.1).map(([x, z]) => [x, z, 0.16]), ...STREET_PROPS.filter(p => p[3] === 'tree').map(([x, z]) => [x, z, STREET_TREE.canopyR + HEAD_R + 0.05 - RH]), ...STREET_PROPS.filter(p => p[3] === 'lamp').map(([x, z]) => [x, z, 0.1])]; // + lamp posts (head vs pole) // + street-tree canopies (3D: canopy above the head line) // + lantern posts // pushOut adds RH back
const GROUND_BOXES = [
  [STAIRS.x0, STAIRS.z0 - 0.1, STAIRS.x1 - 0.5, STAIRS.z0 + 0.02], [STAIRS.x0, STAIRS.z1 - 0.02, STAIRS.x1 - 0.5, STAIRS.z1 + 0.1]]; // stair sides
const GROUND_CIRCLES = [...TREES.map(([x, z, s]) => [x, z, 0.24 * s]), [POOL.x, POOL.z, 2.5], [-7.55, 10.45, 0.8], [-6.45, 10.45, 0.8], [-1.2, 13.0, 0.8], [P.cx, P.cz, 1.15],
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
function rimSlide(p) { const W = WALK_R, r = Math.hypot(p.x, p.z); if (r < W - 0.02 || inR(BALCONY, p.x, p.z, -0.05) || inBridge(p.x, p.z, 0.2) || onHome(p.x, p.z, 1) || inBridge2(p.x, p.z, 0.2) || onShop(p.x, p.z, 1) || inBridge3(p.x, p.z, 0.2) || onCal(p.x, p.z, 1) || Math.hypot(p.x - LOBE.cx, p.z - LOBE.cz) < LOBE.walk + 0.3 || onCafeLobe(p.x, p.z, -1.1)) return;
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

// v24: a spot is free when collide() leaves it where it is (body + head clear of every collider) on the wanted floor level
export function isFree(x, z, lv = null) { const q = { x, z }, r = collide({ x, z }, [], q); return Math.hypot(r.x - x, r.z - z) < 0.03 && (lv == null || Math.abs(heightAt(x, z) - lv) < 0.05); }
export function findFree(x, z, lv = null) { if (isFree(x, z, lv)) return { x, z };
  for (let rad = 0.3; rad <= 4.0; rad += 0.15) for (let k = 0; k < 24; k++) { const a = k / 24 * Math.PI * 2, q = { x: x + Math.cos(a) * rad, z: z + Math.sin(a) * rad }; if (isFree(q.x, q.z, lv)) return q; } return null; }
export function makePlayer({ scene, camera, controls, bots }) {
  const LOOK = { name: 'Calvin', role: 'Founder · Boss', hair: 0x3b2a22, shirt: 0x2f4f86, pants: 0x3a3a48, skin: 0xffdcc2 };
  const savedFit = () => { try { const f = JSON.parse(localStorage.getItem('calvinFit') || 'null'); return f && typeof f === 'object' ? f : null; } catch (e) { return null; } };
  const c = makeChibi({ ...LOOK, fitOverride: savedFit() }); c.rotation.order = 'YXZ';
  c.scale.setScalar(CALVIN_S); c.position.set(BOSS_DESK[0] - 1.6, 0, BOSS_DESK[1] - 1.5); c.rotation.y = Math.PI; scene.add(c);
  // owner touch: little gold lanyard badge
  const badge = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.03), new THREE.MeshBasicMaterial({ color: 0xffc94a })); badge.position.set(0.16, 0.95, 0.43); c.userData.parts.body.add(badge);
  const keys = new Set(); const joy = { x: 0, y: 0 };
  addEventListener('keydown', e => { if (e.target.closest?.('input,textarea')) return; const k = e.key.toLowerCase(); if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) { keys.add(k); if (k.startsWith('arrow')) e.preventDefault(); } });
  addEventListener('keyup', e => keys.delete(e.key.toLowerCase())); addEventListener('blur', () => keys.clear());
  // ---- virtual joystick (touch devices, or ?joy for testing) ----
  const touch = matchMedia('(pointer: coarse)').matches || location.search.includes('joy');
  const st = document.createElement('style'); st.textContent = `#joy{position:fixed;box-sizing:border-box;left:0;top:0;width:120px;aspect-ratio:1;opacity:0;pointer-events:none;border-radius:50%;background:rgba(255,255,255,.22);border:2px solid rgba(42,31,53,.35);touch-action:none;z-index:5;backdrop-filter:blur(2px)}
#joy.on{opacity:1} #joy.run .k{background:rgba(255,211,106,.9)} body.cardon #joy{opacity:0!important}
#joy .k{position:absolute;left:50%;top:50%;width:44%;aspect-ratio:1;border-radius:50%;background:rgba(255,250,242,.75);border:2px solid rgba(42,31,53,.55);transform:translate(-50%,-50%);box-shadow:0 3px 0 rgba(42,31,53,.3)}
.hudb{position:fixed;z-index:5;border:2px solid #2a1f35;border-radius:14px;background:rgba(255,250,242,.92);color:#2a1f35;font:700 14px system-ui,sans-serif;box-shadow:0 3px 0 #2a1f35;cursor:pointer;min-height:44px;padding:0 14px}
#camb{top:max(12px,env(safe-area-inset-top));right:max(12px,env(safe-area-inset-right))} #actb{right:max(16px,env(safe-area-inset-right));bottom:max(26px,env(safe-area-inset-bottom));min-height:60px;min-width:60px;border-radius:30px;background:#ffd36a;font-size:15px;display:none}
#imenu{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(max(26px,env(safe-area-inset-bottom)) + 72px);z-index:6;display:none;flex-direction:column;gap:8px} #imenu.on{display:flex} #imenu button{position:static}
body.cardon #actb,body.cardon #imenu{display:none!important}
#freeb{top:calc(max(12px,env(safe-area-inset-top)) + 56px);right:max(12px,env(safe-area-inset-right));width:48px;padding:0;font-size:20px} #freeb.on{background:#ffd36a} #fpb{top:calc(max(12px,env(safe-area-inset-top)) + 112px);right:max(12px,env(safe-area-inset-right));width:48px;padding:0;font-size:20px} #fpb.on{background:#ffd36a} body.freecam #fpb{opacity:.85} #autob{top:calc(max(12px,env(safe-area-inset-top)) + 168px);right:max(12px,env(safe-area-inset-right));width:48px;padding:0;font-size:20px;opacity:.85} #autob.on{background:#ffd36a;opacity:1} body.freecam #autob{display:none}
#backp{top:max(12px,env(safe-area-inset-top));left:50%;transform:translateX(-50%);border-radius:22px;display:none} body.freecam #backp{display:block} body.freecam #joy{display:none!important} body.freecam #actb,body.freecam #imenu{display:none!important}`;
  document.head.appendChild(st);
  /* v19 floating joystick: no fixed stick. A touch that starts on the 3D view in the left half spawns the base under the thumb;
     drag steers, past ~80% of the radius = auto-run; release hides it. Disabled while a bot card is open (body.cardon). */
  if (touch) { const j = document.createElement('div'); j.id = 'joy'; j.innerHTML = '<div class="k"></div>'; document.body.appendChild(j); const kn = j.firstChild; let id = null, ox = 0, oy = 0, rad = 60; joy.isStick = pid => pid === id; joy.hide = () => hide();
    const hide = () => { id = null; joy.x = joy.y = 0; joy.run = false; kn.style.transform = ''; j.classList.remove('on', 'run'); };
    const mv = e => { let dx = e.clientX - ox, dy = e.clientY - oy; const d = Math.hypot(dx, dy), m = Math.min(d, rad); if (d > 0) { dx = dx / d * m; dy = dy / d * m; }
      joy.x = dx / rad; joy.y = dy / rad; joy.run = m / rad > 0.8; kn.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`; j.classList.toggle('run', joy.run); };
    addEventListener('pointerdown', e => { if (id != null || document.body.classList.contains('cardon') || document.body.classList.contains('freecam') || e.clientX > innerWidth / 2 || e.target.tagName !== 'CANVAS') return;
      id = e.pointerId; rad = Math.max(44, Math.min(74, Math.min(innerWidth, innerHeight) * 0.15)); ox = e.clientX; oy = e.clientY; j.style.width = rad * 2 + 'px'; j.style.left = ox - rad + 'px'; j.style.top = oy - rad + 'px'; j.classList.add('on'); controls.enabled = false; setTimeout(() => { controls.enabled = true; }); mv(e); }, true); // OrbitControls never tracks the stick's finger (tap-select still sees it)
    addEventListener('pointermove', e => { if (e.pointerId === id) { e.stopImmediatePropagation(); if (document.body.classList.contains('cardon')) hide(); else mv(e); } }, true);
    const up = e => { if (e.pointerId === id) hide(); }; addEventListener('pointerup', up, true); addEventListener('pointercancel', up, true);
    new MutationObserver(() => { if (document.body.classList.contains('cardon')) hide(); }).observe(document.body, { attributes: true, attributeFilter: ['class'] }); }

  /* v21 manual camera: every non-stick pointer on the 3D view (touch finger or left mouse button) orbits the camera one-to-one,
     tracked by pointerId so it runs at the same time as the stick. OrbitControls keeps wheel + two-finger pinch zoom only.
     While held nothing auto-moves the angle; on release, after a short beat, it eases back to the pre-drag follow angle. */
  controls.enableRotate = false;
  /* v24: MANUAL camera by default. Following keeps Calvin's position but never touches the yaw/pitch the user set: no ease-back after a
     drag, no swing round the longhouse, no re-framing when he sits. The old behaviour is an opt-in setting (🧭, persisted). */
  let autoCam = localStorage.getItem('camAuto') === '1';
  const cam = { held: false, back: false, id: null, x: 0, y: 0, moved: 0, wait: 0, yaw0: 0, pol0: 0, fingers: new Set() };
  const sph = new THREE.Spherical(), offv = new THREE.Vector3();
  const getSph = () => { offv.copy(camera.position).sub(controls.target); sph.setFromVector3(offv); return sph; };
  const setSph = (th, ph) => { const S = getSph(); S.theta = th; S.phi = Math.max(controls.minPolarAngle, Math.min(controls.maxPolarAngle, ph)); offv.setFromSpherical(S); camera.position.copy(controls.target).add(offv); };
  addEventListener('pointerdown', e => { if (free || e.target !== controls.domElement || (e.pointerType === 'mouse' && e.button !== 0) || joy.isStick?.(e.pointerId)) return; cam.fingers.add(e.pointerId);
    if (cam.id != null) return; const S = getSph(); if (!cam.back) { cam.yaw0 = S.theta; cam.pol0 = S.phi; }
    cam.id = e.pointerId; cam.x = e.clientX; cam.y = e.clientY; cam.moved = 0; cam.held = true; cam.back = false; home.active = false; }, true);
  addEventListener('pointermove', e => { if (e.pointerId !== cam.id) return; const dx = e.clientX - cam.x, dy = e.clientY - cam.y; cam.x = e.clientX; cam.y = e.clientY;
    if (cam.pinch) return; // two camera fingers = pinch zoom, no orbit
    cam.moved += Math.abs(dx) + Math.abs(dy); if (fp.on) { const k = 2.2 / controls.domElement.clientHeight; fp.yaw -= dx * k; fp.pitch = Math.max(-FP_PITCH, Math.min(FP_PITCH, fp.pitch - dy * k)); return; } const S = getSph(), k = 2 * Math.PI / controls.domElement.clientHeight; setSph(S.theta - dx * k, S.phi - dy * k); }, true);
  const camUp = e => { cam.fingers.delete(e.pointerId); if (e.pointerId !== cam.id) return; cam.id = null; cam.held = false;
    if (cam.moved > 6 && autoCam) { cam.back = true; cam.wait = 0.45; } }; addEventListener('pointerup', camUp, true); addEventListener('pointercancel', camUp, true);
  Object.defineProperty(cam, 'pinch', { get: () => { let n = 0; for (const f of cam.fingers) if (f !== cam.id) n++; return n > 0; } });
  // run: Shift on keyboard; on touch the stick auto-runs past ~80% radius (the v15 Walk/Run toggle is gone)
  // ---- camera follow toggle ----
  let follow = false; const camb = document.createElement('button'); camb.id = 'camb'; camb.className = 'hudb'; camb.type = 'button';
  const setFollow = f => { follow = f; camb.textContent = f ? '🗺️ Overview' : '🎥 Follow Calvin'; if (!f) { home.active = true; } }; document.body.appendChild(camb);
  const home = { target: controls.target.clone(), pos: camera.position.clone(), active: false };
  camb.addEventListener('click', () => { if (fp.on) setFp(false); else if (free) setFree(false); else setFollow(!follow); }); setFollow(false);

  /* v22 free camera (📷 button or C): detaches from Calvin. OrbitControls does the work: mouse left = rotate, right / middle /
     Shift+left = pan on the ground plane, wheel = zoom to cursor; touch 1 finger = pan, 2 fingers = pinch zoom + drag/twist rotate.
     WASD / arrows pan the camera (Calvin stands still). Leaving (button, C, 'Back to me') eases back to the default follow. */
  let free = false; const FREE = { minD: 2.2, maxD: 125, minP: 0.12, maxP: 2.2, /* v25: past the horizon -> look up at the sky (target lifts, see postCam) */ box: [-50, 42, -24, 47] };
  const freeb = document.createElement('button'); freeb.id = 'freeb'; freeb.className = 'hudb'; freeb.type = 'button'; freeb.textContent = '📷'; freeb.title = 'Free camera (C)'; freeb.setAttribute('aria-label', 'Free camera (C)'); document.body.appendChild(freeb);
  const backp = document.createElement('button'); backp.id = 'backp'; backp.className = 'hudb'; backp.type = 'button'; backp.textContent = '↩ Back to me'; document.body.appendChild(backp);
  const saved = {};
  const autob = document.createElement('button'); autob.id = 'autob'; autob.className = 'hudb'; autob.type = 'button'; autob.textContent = '🧭'; document.body.appendChild(autob);
  const setAuto = v => { autoCam = !!v; localStorage.setItem('camAuto', autoCam ? '1' : '0'); autob.classList.toggle('on', autoCam); autob.setAttribute('aria-pressed', autoCam); const t = 'Auto-rotate camera: ' + (autoCam ? 'on' : 'off'); autob.title = t; autob.setAttribute('aria-label', t); if (!autoCam) cam.back = false; };
  autob.addEventListener('click', () => setAuto(!autoCam)); setAuto(autoCam);
  const setFree = f => { f = !!f; if (f === free) return; free = f; document.body.classList.toggle('freecam', f); freeb.classList.toggle('on', f); freeb.setAttribute('aria-pressed', f);
    if (f) { if (fp.on) setFp(false); joy.hide?.(); keys.clear(); cam.id = null; cam.held = false; cam.back = false; home.active = false; const S = getSph(); saved.yaw = S.theta; saved.pol = S.phi;
      Object.assign(controls, { enableRotate: true, enablePan: true, screenSpacePanning: false, zoomToCursor: true, minDistance: FREE.minD, maxDistance: FREE.maxD, minPolarAngle: FREE.minP, maxPolarAngle: FREE.maxP, dampingFactor: 0.12, rotateSpeed: 0.8 });
      controls.touches = { ONE: THREE.TOUCH.PAN, TWO: THREE.TOUCH.DOLLY_ROTATE }; controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.PAN, RIGHT: THREE.MOUSE.PAN }; }
    else { Object.assign(controls, { enableRotate: false, enablePan: false, zoomToCursor: false, maxDistance: 110, minPolarAngle: 0.3, maxPolarAngle: 1.35, dampingFactor: 0.05, rotateSpeed: 1 });
      controls.minDistance = Math.min(8, camera.position.distanceTo(controls.target)); controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }; controls.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
      cam.zoom = null; cam.lastLen = 0; cam.yaw0 = saved.yaw ?? Math.PI / 4; cam.pol0 = Math.min(1.35, Math.max(0.3, saved.pol ?? 1.0)); cam.back = autoCam; cam.wait = 0; if (!follow) setFollow(true); } };
  /* v24 first-person view (👁️ button or V): camera at Calvin's eyes, his body hidden; drag / right-half finger looks around,
     stick / WASD move relative to the look direction. Mutually exclusive with the free camera; leaving restores the previous view. */
  const fp = { on: false, yaw: 0, pitch: 0, eye: 1.75, bob: 0, saved: null };
  /* v25: FP field of view from a ~90 deg HORIZONTAL target (the 40 deg vertical third-person fov was ~16 deg wide on a folded phone),
     vertical derived from the aspect and clamped 55..100 deg so landscape and tall portrait both feel natural. Pitch +/-85 deg. */
  const FP_PITCH = 1.48, FP_HFOV = 90;
  const fpFov = () => { const a = camera.aspect || 1; return Math.max(55, Math.min(100, 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(FP_HFOV / 2)) / a)))); };
  addEventListener('resize', () => { if (fp.on) { camera.fov = fpFov(); camera.updateProjectionMatrix(); } });
  const fpb = document.createElement('button'); fpb.id = 'fpb'; fpb.className = 'hudb'; fpb.type = 'button'; fpb.textContent = '👁️'; fpb.title = 'First-person view (V)'; fpb.setAttribute('aria-label', 'First-person view (V)'); document.body.appendChild(fpb);
  const fpDir = new THREE.Vector3();
  const setFp = on => { on = !!on; if (on === fp.on) return; if (on && free) setFree(false);
    fp.on = on; document.body.classList.toggle('fpv', on); camb.textContent = on ? '🧍 Third person' : follow ? '🗺️ Overview' : '🎥 Follow Calvin'; fpb.classList.toggle('on', on); fpb.setAttribute('aria-pressed', on);
    if (on) { fp.saved = { off: camera.position.clone().sub(controls.target), tgtY: controls.target.y, follow, near: camera.near, fov: camera.fov };
      c.updateMatrixWorld(true); const hb = new THREE.Box3().setFromObject(c.userData.parts.head); fp.eye = Math.max(1.2, (hb.min.y + hb.max.y) / 2 - c.position.y + 0.05);
      fp.yaw = c.rotation.y; fp.pitch = -0.08; c.visible = false; controls.enabled = false; camera.near = 0.05; camera.fov = fpFov(); camera.updateProjectionMatrix(); cam.back = false; home.active = false; }
    else { const S = fp.saved || {}; c.visible = true; controls.enabled = true; camera.near = S.near ?? 0.1; camera.fov = S.fov ?? 40; camera.updateProjectionMatrix();
      controls.target.set(c.position.x, S.tgtY ?? 1.2, c.position.z); camera.position.copy(controls.target).add(S.off || new THREE.Vector3(0, 9, 12)); if (!follow) setFollow(true); } };
  fpb.addEventListener('click', () => setFp(!fp.on));
  addEventListener('keydown', e => { if (e.target.closest?.('input,textarea') || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; if (e.key.toLowerCase() === 'v') setFp(!fp.on); });
  function fpCam(dt, t) { const moving = api.speed > 0 && !api.seat; fp.bob = moving ? fp.bob + dt * (api.speed > 3 ? 13 : 8.5) : fp.bob * Math.max(0, 1 - dt * 6);
    const by = moving ? Math.abs(Math.sin(fp.bob)) * 0.045 : 0; if (moving) fp.yaw = c.rotation.y + Math.atan2(Math.sin(fp.yaw - c.rotation.y), Math.cos(fp.yaw - c.rotation.y)); // keep yaw continuous
    fpDir.set(Math.sin(fp.yaw) * Math.cos(fp.pitch), Math.sin(fp.pitch), Math.cos(fp.yaw) * Math.cos(fp.pitch));
    camera.position.set(c.position.x - Math.sin(fp.yaw) * 0.1, c.position.y + fp.eye + by, c.position.z - Math.cos(fp.yaw) * 0.1); /* v25: eye a touch behind the head centre (was 0.12 in front), so nearby things aren't right in the face */ controls.target.copy(camera.position).add(fpDir); camera.lookAt(controls.target); }
  freeb.addEventListener('click', () => setFree(!free)); backp.addEventListener('click', () => setFree(false));
  addEventListener('keydown', e => { if (e.target.closest?.('input,textarea') || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return; if (e.key.toLowerCase() === 'c') setFree(!free); });
  controls.domElement.addEventListener('contextmenu', e => e.preventDefault());
  // two-finger twist rotates (OrbitControls only rotates on a two-finger drag)
  const tw = new Map(); let twA = null; const twAng = () => { const [a, b] = [...tw.values()]; return Math.atan2(b[1] - a[1], b[0] - a[0]); };
  addEventListener('pointerdown', e => { if (free && e.pointerType === 'touch' && e.target === controls.domElement) { tw.set(e.pointerId, [e.clientX, e.clientY]); twA = tw.size === 2 ? twAng() : null; } }, true);
  addEventListener('pointermove', e => { if (!tw.has(e.pointerId)) return; tw.set(e.pointerId, [e.clientX, e.clientY]); if (free && tw.size === 2 && twA != null) { const a = twAng(), d = Math.atan2(Math.sin(a - twA), Math.cos(a - twA)); twA = a;
    const S = getSph(); setSph(S.theta + d, S.phi); } }, true);
  const twUp = e => { tw.delete(e.pointerId); twA = tw.size === 2 ? twAng() : null; }; addEventListener('pointerup', twUp, true); addEventListener('pointercancel', twUp, true);
  const fpan = new THREE.Vector3(), ff = new THREE.Vector3();
  function freeCam(dt) { let px = 0, pz = 0; if (keys.has('a') || keys.has('arrowleft')) px -= 1; if (keys.has('d') || keys.has('arrowright')) px += 1; if (keys.has('w') || keys.has('arrowup')) pz += 1; if (keys.has('s') || keys.has('arrowdown')) pz -= 1;
    if (px || pz) { camera.getWorldDirection(ff); ff.y = 0; ff.normalize(); const sp = Math.max(3, camera.position.distanceTo(controls.target) * 0.9) * (keys.has('shift') ? 2 : 1) * dt / Math.hypot(px, pz);
      fpan.set(-ff.z, 0, ff.x).multiplyScalar(px * sp).addScaledVector(ff, pz * sp); controls.target.add(fpan); camera.position.add(fpan); }
    const T = controls.target, B = FREE.box, ox = T.x, oz = T.z, oy = T.y; T.x = Math.max(B[0], Math.min(B[1], T.x)); T.z = Math.max(B[2], Math.min(B[3], T.z)); T.y = Math.max(-1, Math.min(40, T.y));
    camera.position.x += T.x - ox; camera.position.z += T.z - oz; camera.position.y += T.y - oy; if (camera.position.y < 0.6) camera.position.y = 0.6;
    if (T.y > 4 && camera.position.y > T.y) { const dd = Math.min(T.y - 4, camera.position.y - 0.6) * Math.min(1, dt * 3); T.y -= dd; camera.position.y -= dd; } } // v25: looking back down, the lifted target settles to the ground again

  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mvv = new THREE.Vector3(), tmp = new THREE.Vector3();
  const api = { chibi: c, cam, get fp() { return fp.on; }, fpState: fp, setFp, get autoCam() { return autoCam; }, setAuto, get free() { return free; }, setFree, get camYaw() { return getSph().theta; }, speed: 0, moved: false, get follow() { return follow; }, setFollow, joy, keys };
  /* v20 wardrobe: rebuild Calvin's outfit in place (same root/parts/props, so every reference stays valid) and persist it.
     fit = { top, bottom, shoes, acc } labels from calvinCloset(); null = back to the daily OOTD. */
  api.fit = savedFit();
  api.setFit = fit => { if (fit) localStorage.setItem('calvinFit', JSON.stringify(fit)); else localStorage.removeItem('calvinFit'); api.fit = fit;
    const n = makeChibi({ ...LOOK, fitOverride: fit }), P = c.userData.parts, Q = n.userData.parts;
    const oldB = P.body.children.find(m => m.userData.hull && m.onBeforeRender && m.onBeforeRender.toString().includes('sin')), base = P.head.position.y - (oldB ? (oldB.scale.y - 1) * 1.6 : 0);
    for (const k of ['body', 'head', 'armL', 'armR', 'legL', 'legR']) { P[k].children.filter(m => m.userData.hull).forEach(m => { P[k].remove(m); m.geometry.dispose(); });
      Q[k].children.filter(m => m.userData.hull).forEach(m => P[k].add(m)); }
    const nb = P.body.children.filter(m => m.userData.hull), ph = Math.random() * 6;
    if (nb.length) nb[0].onBeforeRender = () => { const sy = 1 + 0.018 * Math.sin(performance.now() / 1000 * 1.7 + ph); nb.forEach(m => m.scale.y = sy); P.head.position.y = base + (sy - 1) * 1.6; };
    nb.slice(1).forEach(m => { m.onBeforeRender = () => {}; });
    for (const k of ['ootd', 'mask', 'pocket']) c.userData[k] = n.userData[k]; return c.userData.ootd; };
  api.update = (dt, t) => {
    let ix = 0, iy = 0; if (free) { /* keys pan the free camera instead */ } else if (keys.has('a') || keys.has('arrowleft')) ix -= 1; if (keys.has('d') || keys.has('arrowright')) ix += 1; if (keys.has('w') || keys.has('arrowup')) iy -= 1; if (keys.has('s') || keys.has('arrowdown')) iy += 1;
    if (free) { ix = 0; iy = 0; } let mag; if (ix || iy) { const l = Math.hypot(ix, iy); ix /= l; iy /= l; mag = keys.has('shift') ? 1 : 0.6; } else if (free) { mag = 0; } else { ix = joy.x; iy = joy.y; mag = Math.min(1, Math.hypot(ix, iy)); if (mag < 0.12) mag = 0; else { ix /= mag; iy /= mag; if (joy.run) mag = 1; else mag = Math.min(mag, 0.7); } } // touch: auto-run past ~80% stick radius
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); right.set(-fwd.z, 0, fwd.x);
    if (api.debugDir) { const d = api.debugDir; mag = d[2] ?? 0.6; fwd.set(d[0], 0, d[1]).normalize(); right.set(-fwd.z, 0, fwd.x); ix = 0; iy = -1; } // test hook: world-space walk direction
    const inPool = !api.seat && calPoolQ(c.position.x, c.position.z) < 0.92; api.inPool = inPool;
    const run = mag > 0.72 && !inPool, speed = mag ? (inPool ? 1.3 : run ? 4.6 : 1.2 + mag * 2.2) : 0; api.speed = speed;
    if (speed) { mvv.copy(right).multiplyScalar(ix).addScaledVector(fwd, -iy).normalize(); if (!api.moved) { api.moved = true; setFollow(true); }
      const p = collide({ x: c.position.x + mvv.x * speed * dt, z: c.position.z + mvv.z * speed * dt }, bots.filter(b => Math.abs(b.position.y - c.position.y) < 1).map(b => [b.position.x, b.position.z, 0.45]), c.position);
      c.position.x = p.x; c.position.z = p.z; let dr = Math.atan2(mvv.x, mvv.z) - c.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.rotation.y += dr * Math.min(1, dt * 10); }
    if (!api.seat) { api.stuckT = !isFree(c.position.x, c.position.z) ? (api.stuckT || 0) + dt : 0;
      if (api.stuckT > 0.6) { const f = findFree(c.position.x, c.position.z, heightAt(c.position.x, c.position.z)); if (f) { c.position.x = f.x; c.position.z = f.z; } api.stuckT = 0; } } // v24 safety net: still overlapping colliders after 0.6 s -> nearest free spot
    if (api.seat) { if (speed) api.stand(); else { const S = api.seat; c.position.set(S.pos[0], c.position.y + (S.y + heightAt(S.pos[0], S.pos[1]) - c.position.y) * Math.min(1, dt * 7), S.pos[1]); c.rotation.y = S.rot;
        applyPose(c, api.emote && api.emote.until > t ? api.emote.name : S.pose, t, dt, !S.standing, { cup: 0x6b4226 }); api.afterPose?.(t); followCam(dt, S.camDist); return; } }
    else { const gy = heightAt(c.position.x, c.position.z); c.position.y += (gy - c.position.y) * Math.min(1, dt * 14); }
    applyPose(c, api.emote && api.emote.until > t ? api.emote.name : api.waveUntil > t ? 'wave' : inPool ? (speed ? 'swim' : 'wade') : speed ? (run ? 'run' : 'walk') : 'stand', speed && !inPool ? t * (run ? 1.6 : 0.8 + mag * 0.4) : t, dt, false, {});
    if (api.carry && !(api.emote && api.emote.until > t)) { const P = c.userData.parts; c.userData.props.cup.visible = true; P.armR.rotation.x = -1.3; P.armR.rotation.z = -0.25; }
    api.afterPose?.(t); followCam(dt);
  };
  /* v25: wider third-person pitch. Following, the camera may orbit below the target (phi up to 2.5 rad -> looking ~53 deg up at the sky);
     postCam() (after controls.update) keeps it above the floor by pulling it in toward Calvin, so it goes low behind him and looks up. */
  const OVP = [controls.minPolarAngle, controls.maxPolarAngle], FOLP = [0.12, 2.5], CAM_MIN_H = 0.35;
  const floorY = (x, z) => { const h = heightAt(x, z); return Number.isFinite(h) ? h : 0; };
  api.postCam = () => { if (fp.on || window.__camLock) return; const P = camera.position, T = controls.target;
    if (free) { const m = floorY(P.x, P.z) + 0.6; if (P.y < m) { const d = m - P.y; P.y += d; T.y += d; } return; } // free: lift the look-at point instead of digging in
    const m = Math.max(floorY(P.x, P.z), follow ? c.position.y : -Infinity) + CAM_MIN_H; if (P.y >= m) return;
    const off = P.clone().sub(T); if (off.y < -1e-4 && T.y > m) { const k = Math.max(0.05, Math.min(1, (m - T.y) / off.y)); P.copy(T).addScaledVector(off, k); controls.minDistance = Math.min(controls.minDistance, off.length() * k); if (cam.lastLen) cam.lastLen = off.length() * k; /* not a user zoom */ }
    else P.y = m; };
  function followCam(dt, near) { if (free) { freeCam(dt); return; }
    if (!fp.on) { controls.minPolarAngle = follow ? FOLP[0] : OVP[0]; controls.maxPolarAngle = follow ? FOLP[1] : OVP[1]; } if (fp.on) { fpCam(dt); return; }
    const CL = window.__camLock; if (CL) { camera.position.set(...CL[0]); controls.target.set(...CL[1]); return; } // test hook: fixed inspection camera
    // camera: follow with smoothing (shift target and camera by the same delta, so orbiting still works)
    if (cam.back && !cam.held) { cam.wait -= dt; if (cam.wait <= 0 && (!follow || api.seat || api.look)) { cam.back = false; if (!follow) home.active = true; } }
    const manual = cam.held || (cam.back && cam.wait > 0); // user owns the angle (held, or the short beat after release)
    if (manual && !follow) return;
    const SL = api.seat?.look; if (!manual && SL && !api.look) { const k = 1 - Math.exp(-dt * 1.6); controls.target.lerp(SL.tgt.clone().sub(SL.pos).setLength(6).add(SL.pos), k); camera.position.lerp(SL.pos, k); return; }
    if (!manual && autoCam && api.seat && api.seat.camYaw !== undefined && !api.look) { const S2 = api.seat, d = S2.camDist || 11, a = S2.rot + S2.camYaw; tmp.set(c.position.x, c.position.y + 1.0, c.position.z); const k = 1 - Math.exp(-dt * 2.4);
      controls.target.lerp(tmp, k); camera.position.lerp(new THREE.Vector3(tmp.x + Math.sin(a) * d * 0.78, tmp.y + d * 0.55, tmp.z + Math.cos(a) * d * 0.78), k); return; }
    if (!manual && api.look) { const L = api.look; const k = 1 - Math.exp(-dt * 2); controls.target.lerp(L.tgt, k); camera.position.lerp(L.pos, k); return; }
    if (follow) { const o0 = camera.position.clone().sub(controls.target), ph0 = Math.acos(Math.max(-1, Math.min(1, o0.y / (o0.length() || 1)))); tmp.set(c.position.x, 1.2 + Math.max(0, ph0 - Math.PI / 2) * 2.2, c.position.z); /* v25: looking up lifts the look-at point toward his head so he stays in frame */ const k = 1 - Math.exp(-dt * 3.2); const delta = tmp.sub(controls.target).multiplyScalar(k); controls.target.add(delta); camera.position.add(delta);
      const off = camera.position.clone().sub(controls.target); if (!near && cam.lastLen && Math.abs(off.length() - cam.lastLen) > 0.05) cam.zoom = Math.max(8, Math.min(40, off.length())); // pinch / wheel while following sticks
      const want = near || cam.zoom || (innerWidth < innerHeight ? 17 : 13); off.setLength(off.length() + (want - off.length()) * Math.min(1, dt * 1.5));
      if (cam.back && cam.wait <= 0) { const az = Math.atan2(off.x, off.z), h0 = off.length(), pol = Math.acos(Math.max(-1, Math.min(1, off.y / h0))), k2 = 1 - Math.exp(-dt * 3.2);
        const dy = Math.atan2(Math.sin(cam.yaw0 - az), Math.cos(cam.yaw0 - az)), dp = cam.pol0 - pol; // ease back to the pre-drag follow angle
        if (Math.abs(dy) < 0.004 && Math.abs(dp) < 0.004) { cam.back = false; offv.setFromSphericalCoords(h0, cam.pol0, cam.yaw0); } else offv.setFromSphericalCoords(h0, pol + dp * k2, az + dy * k2); off.copy(offv); }
      else if (!manual && autoCam && onHome(c.position.x, c.position.z) && c.position.z > HOUSE.z0 - 2.5) { // near the longhouse: swing round to its open (-z) front so the rooms aren't hidden behind the back wall
        const az = Math.atan2(off.x, off.z), lim = 0.55; let tgt = Math.PI - Math.sign(off.x || 1) * Math.min(lim, Math.abs(Math.atan2(Math.sin(az - Math.PI), Math.cos(az - Math.PI))));
        let d = Math.atan2(Math.sin(tgt - az), Math.cos(tgt - az)); const na = az + d * Math.min(1, dt * 1.8), h = Math.hypot(off.x, off.z); off.x = Math.sin(na) * h; off.z = Math.cos(na) * h; }
      camera.position.copy(controls.target).add(off); cam.lastLen = near ? 0 : off.length(); controls.minDistance = Math.min(8, off.length()); }
    else if (home.active) { const k = 1 - Math.exp(-dt * 3); controls.target.lerp(home.target, k); camera.position.lerp(home.pos, k); if (camera.position.distanceTo(home.pos) < 0.05) home.active = false; controls.minDistance = home.minD ?? 12; }
  }
  // seats: { pos:[x,z], rot, y, pose, camDist, onStand }
  api.sitAt = s => { api.seat = s; if (fp.on) { fp.yaw = s.rot; fp.pitch = -0.12; } c.position.set(s.pos[0], c.position.y, s.pos[1]); c.rotation.y = s.rot; /* snap to the seat's facing, not the walking direction */ api.carry = s.keepMug ? api.carry : api.carry; if (!follow) setFollow(true); };
  api.stand = () => { const s = api.seat; api.seat = null; if (!s) return; c.rotation.x = 0; c.userData.setSleepFace?.(false);
    // step off on the SAME level: try behind (pull the chair back), then in front, then the sides; accept the first walkable,
    // unobstructed spot whose floor height matches the seat's floor (never re-snap to the ground from the roof)
    const lv = heightAt(s.pos[0], s.pos[1]), fx = Math.sin(s.rot), fz = Math.cos(s.rot), from = { x: s.pos[0], z: s.pos[1] };
    let P = null; for (const [a, b] of [[-0.9, 0], [0.8, 0], [0, 0.9], [0, -0.9], [-0.6, 0.6], [0.6, -0.6], [0.5, 0]]) { const q = { x: s.pos[0] + fx * a + fz * b, z: s.pos[1] + fz * a - fx * b };
      if (isFree(q.x, q.z, lv)) { P = q; break; } }
    if (!P) P = findFree(s.pos[0], s.pos[1], lv) || { x: s.pos[0], z: s.pos[1] }; // v24: never stand up into furniture / walls
    c.position.x = P.x; c.position.z = P.z; c.position.y = heightAt(P.x, P.z); s.onStand?.(); };
  api.setEmote = (name, dur, t) => { api.emote = { name, until: t + dur }; };
  api.setHome = (pos, tgt) => { home.pos.copy(pos); home.target.copy(tgt); home.minD = Math.min(12, controls.minDistance); }; // ?tgt= debug framing may sit closer than 12
  return api;
}
