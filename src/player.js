// Calvin: the playable boss chibi. Local to this device (not synced).
// Desktop: WASD / arrows (Shift = run). Touch: analog virtual joystick (bottom-left). Camera follows with smoothing.
import * as THREE from 'three';
import { makeChibi } from './chibi.js';
import { applyPose } from './behavior.js';
import { CALVIN_S, DESKS, BOSS_DESK, GLASS, LOUNGE, PANTRY, BACK_Z, FLOOR, LEFT_X, ROOF, STAIRS, BALCONY, PARK, TREES, POOL, WALK_R, inR, heightAt } from './layout.js';

const R = 0.42; // body radius
// furniture AABBs [x0,z0,x1,z1] (world space) + circles [x,z,r]
const L = LOUNGE;
const BOXES = [
  ...[...DESKS, BOSS_DESK].map(([x, z]) => [x - 1.15, z - 0.6, x + 1.15, z + 0.6]),
  [GLASS.x0, GLASS.z1 - 0.12, GLASS.door0, GLASS.z1 + 0.12], [GLASS.x1 - 0.12, GLASS.z0, GLASS.x1 + 0.12, GLASS.z1 + 0.12], // glass walls (door gap)
  [L.cx - 1.9, L.cz + 1.85, L.cx + 1.9, L.cz + 2.7], [L.cx - 2.8, L.cz - 1.6, L.cx - 2.0, L.cz + 1.6], // sofas
  [PANTRY.x - 1.9, PANTRY.z - 0.75, PANTRY.x + 2.0, PANTRY.z + 0.6], [3.5, BACK_Z, 6.3, BACK_Z + 0.95], [-4.5, BACK_Z, -1.0, BACK_Z + 0.75],
];
const CIRCLES = [[L.cx, L.cz, 0.65], [(GLASS.x0 + GLASS.x1) / 2, (GLASS.z0 + GLASS.z1) / 2, 1.25], [-4.6, -7.2, 0.5], [7.4, 2.6, 0.5], [-2.4, 7.2, 0.5], [6.6, 6.9, 0.5], [10.2, -1.2, 0.5], [-3.9, 7.3, 0.3], [9.6, 3.2, 0.3], [-10.2, 7.3, 0.4], [10.1, 7.1, 0.5]];
// ---- two-level collision: ground (office + lawn), stairs (ramp, side-clamped), rooftop ----
const P = PARK;
const GROUND_BOXES = [[FLOOR.x0, BACK_Z - 0.12, FLOOR.x1, BACK_Z + 0.1], [LEFT_X - 0.12, FLOOR.z0, LEFT_X + 0.12, FLOOR.z1], // back wall, left wall
  [ROOF.x0, ROOF.z0, ROOF.x1, ROOF.z1], // annex block (only reachable from above)
  [STAIRS.x0, STAIRS.z0 - 0.1, STAIRS.x1 - 0.5, STAIRS.z0 + 0.02], [STAIRS.x0, STAIRS.z1 - 0.02, STAIRS.x1 - 0.5, STAIRS.z1 + 0.1]]; // stair sides
const GROUND_CIRCLES = [...TREES.map(([x, z, s]) => [x, z, 0.35 * s]), [POOL.x, POOL.z, 2.5], [-8.6, 9.6, 1.4], [-1.2, 13.0, 0.8], [P.cx, P.cz, 1.15],
  ...[0, 2.1, 4.2].map(a => [P.cx + Math.cos(a + 0.5) * 1.75, P.cz + Math.sin(a + 0.5) * 1.75, 0.5]), ...P.benches.map(([x, z]) => [x, z, 0.75]),
  [BALCONY.x0 + 0.9, BALCONY.z1 - 0.35, 0.35], [BALCONY.x0 + 0.9, BALCONY.z0 + 0.35, 0.35]];
const ROOF_CIRCLES = [[-6.3, -8.5, 0.5], [-6.3, -11.0, 0.5], [4.3, -11.0, 0.5], [2.0, -8.5, 0.5], [-5.3, -9.7, 0.45], [0.2, -10.0, 0.62], [-0.8, -10.0, 0.3], [1.2, -10.0, 0.3], [2.6, -11.0, 0.35],
  [-4.4, -9.95, 0.12], [-1.6, -9.95, 0.12], [-4.4, -11.45, 0.12], [-1.6, -11.45, 0.12]];
const ROOF_BOXES = [[-3.9, -11.3, -2.1, -10.8]]; // bench
function pushOut(p, boxes, circles) {
  for (const [x0, z0, x1, z1] of boxes) { const cx = Math.max(x0, Math.min(p.x, x1)), cz = Math.max(z0, Math.min(p.z, z1)); const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz);
    if (d < R) { if (d > 1e-4) { p.x = cx + dx / d * R; p.z = cz + dz / d * R; } else { const m = [p.x - x0, x1 - p.x, p.z - z0, z1 - p.z], i = m.indexOf(Math.min(...m)); if (i === 0) p.x = x0 - R; else if (i === 1) p.x = x1 + R; else if (i === 2) p.z = z0 - R; else p.z = z1 + R; } } }
  for (const [x, z, r] of circles) { const dx = p.x - x, dz = p.z - z, d = Math.hypot(dx, dz), m = r + R; if (d < m && d > 1e-4) { p.x = x + dx / d * m; p.z = z + dz / d * m; } } }
// p = proposed {x,z}; from = current position (decides which level we're on)
export function collide(p, others = [], from = null) {
  const fx = from ? from.x : p.x, fz = from ? from.z : p.z;
  if (inR(STAIRS, fx, fz)) { p.z = Math.max(STAIRS.z0 + R, Math.min(STAIRS.z1 - R, p.z)); p.x = Math.min(STAIRS.x1 + 0.6, Math.max(STAIRS.x0 - 0.6, p.x)); return p; }
  if (inR(ROOF, fx, fz)) { const toStairs = p.x > ROOF.x1 - R && p.z > STAIRS.z0 + R && p.z < STAIRS.z1 - R;
    if (!toStairs) p.x = Math.max(ROOF.x0 + R, Math.min(ROOF.x1 - R, p.x)); p.z = Math.max(ROOF.z0 + R, Math.min(ROOF.z1 - R, p.z));
    pushOut(p, ROOF_BOXES, [...ROOF_CIRCLES, ...others]); return p; }
  if (inR(STAIRS, p.x, p.z) && fx < STAIRS.x1 - 0.3) p.x = Math.max(p.x, STAIRS.x1 + 0.01); // no side entry onto the ramp
  for (let it = 0; it < 2; it++) {
    pushOut(p, [...BOXES, ...GROUND_BOXES], [...CIRCLES, ...GROUND_CIRCLES, ...others]);
    if (!inR(BALCONY, p.x, p.z, -0.05) && !inR(STAIRS, p.x, p.z)) { const r = Math.hypot(p.x, p.z); if (r > WALK_R) { p.x *= WALK_R / r; p.z *= WALK_R / r; } }
    if (inR(BALCONY, p.x, p.z, 0.4)) { p.x = Math.min(p.x, BALCONY.x1 - R); if (p.x > BALCONY.x0 - 0.2) p.z = Math.max(BALCONY.z0 + R, Math.min(BALCONY.z1 - R, p.z)); }
  }
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
  // ---- camera follow toggle ----
  let follow = false; const camb = document.createElement('button'); camb.id = 'camb'; camb.className = 'hudb'; camb.type = 'button';
  const setFollow = f => { follow = f; camb.textContent = f ? '🗺️ Overview' : '🎥 Follow Calvin'; if (!f) { home.active = true; } }; document.body.appendChild(camb);
  const home = { target: controls.target.clone(), pos: camera.position.clone(), active: false };
  camb.addEventListener('click', () => setFollow(!follow)); setFollow(false);
  const fwd = new THREE.Vector3(), right = new THREE.Vector3(), mvv = new THREE.Vector3(), tmp = new THREE.Vector3();
  const api = { chibi: c, speed: 0, moved: false, get follow() { return follow; }, setFollow, joy, keys };
  api.update = (dt, t) => {
    let ix = 0, iy = 0; if (keys.has('a') || keys.has('arrowleft')) ix -= 1; if (keys.has('d') || keys.has('arrowright')) ix += 1; if (keys.has('w') || keys.has('arrowup')) iy -= 1; if (keys.has('s') || keys.has('arrowdown')) iy += 1;
    let mag; if (ix || iy) { const l = Math.hypot(ix, iy); ix /= l; iy /= l; mag = keys.has('shift') ? 1 : 0.6; } else { ix = joy.x; iy = joy.y; mag = Math.min(1, Math.hypot(ix, iy)); if (mag < 0.12) mag = 0; else { ix /= mag; iy /= mag; } }
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); right.set(-fwd.z, 0, fwd.x);
    if (api.debugDir) { const d = api.debugDir; mag = d[2] ?? 0.6; fwd.set(d[0], 0, d[1]).normalize(); right.set(-fwd.z, 0, fwd.x); ix = 0; iy = -1; } // test hook: world-space walk direction
    const run = mag > 0.72, speed = mag ? (run ? 4.6 : 1.2 + mag * 2.2) : 0; api.speed = speed;
    if (speed) { mvv.copy(right).multiplyScalar(ix).addScaledVector(fwd, -iy).normalize(); if (!api.moved) { api.moved = true; setFollow(true); }
      const p = collide({ x: c.position.x + mvv.x * speed * dt, z: c.position.z + mvv.z * speed * dt }, bots.filter(b => Math.abs(b.position.y - c.position.y) < 1).map(b => [b.position.x, b.position.z, 0.45]), c.position);
      c.position.x = p.x; c.position.z = p.z; let dr = Math.atan2(mvv.x, mvv.z) - c.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); c.rotation.y += dr * Math.min(1, dt * 10); }
    if (api.seat) { if (speed) api.stand(); else { const S = api.seat; c.position.set(S.pos[0], c.position.y + (S.y + heightAt(S.pos[0], S.pos[1]) - c.position.y) * Math.min(1, dt * 7), S.pos[1]); c.rotation.y = S.rot;
        applyPose(c, api.emote && api.emote.until > t ? api.emote.name : S.pose, t, dt, true, { cup: 0x6b4226 }); api.afterPose?.(t); followCam(dt, S.camDist); return; } }
    else { const gy = heightAt(c.position.x, c.position.z); c.position.y += (gy - c.position.y) * Math.min(1, dt * 14); }
    applyPose(c, api.emote && api.emote.until > t ? api.emote.name : api.waveUntil > t ? 'wave' : speed ? 'walk' : 'stand', speed ? t * (run ? 1.45 : 0.8 + mag * 0.4) : t, dt, false, {});
    if (api.carry && !(api.emote && api.emote.until > t)) { const P = c.userData.parts; c.userData.props.cup.visible = true; P.armR.rotation.x = -1.3; P.armR.rotation.z = -0.25; }
    api.afterPose?.(t); followCam(dt);
  };
  function followCam(dt, near) {
    // camera: follow with smoothing (shift target and camera by the same delta, so orbiting still works)
    const SL = api.seat?.look; if (SL && !api.look) { const k = 1 - Math.exp(-dt * 1.6); controls.target.lerp(SL.tgt.clone().sub(SL.pos).setLength(6).add(SL.pos), k); camera.position.lerp(SL.pos, k); return; }
    if (api.seat && api.seat.camYaw !== undefined && !api.look) { const S2 = api.seat, d = S2.camDist || 11, a = S2.rot + S2.camYaw; tmp.set(c.position.x, c.position.y + 1.0, c.position.z); const k = 1 - Math.exp(-dt * 2.4);
      controls.target.lerp(tmp, k); camera.position.lerp(new THREE.Vector3(tmp.x + Math.sin(a) * d * 0.78, tmp.y + d * 0.55, tmp.z + Math.cos(a) * d * 0.78), k); return; }
    if (api.look) { const L = api.look; const k = 1 - Math.exp(-dt * 2); controls.target.lerp(L.tgt, k); camera.position.lerp(L.pos, k); return; }
    if (follow) { tmp.set(c.position.x, 1.2, c.position.z); const k = 1 - Math.exp(-dt * 3.2); const delta = tmp.sub(controls.target).multiplyScalar(k); controls.target.add(delta); camera.position.add(delta);
      const off = camera.position.clone().sub(controls.target); const want = near || (innerWidth < innerHeight ? 17 : 13); off.setLength(off.length() + (want - off.length()) * Math.min(1, dt * 1.5)); camera.position.copy(controls.target).add(off); controls.minDistance = 8; }
    else if (home.active) { const k = 1 - Math.exp(-dt * 3); controls.target.lerp(home.target, k); camera.position.lerp(home.pos, k); if (camera.position.distanceTo(home.pos) < 0.05) home.active = false; controls.minDistance = 12; }
  }
  // seats: { pos:[x,z], rot, y, pose, camDist, onStand }
  api.sitAt = s => { api.seat = s; c.position.set(s.pos[0], c.position.y, s.pos[1]); c.rotation.y = s.rot; /* snap to the seat's facing, not the walking direction */ api.carry = s.keepMug ? api.carry : api.carry; if (!follow) setFollow(true); };
  api.stand = () => { const s = api.seat; api.seat = null; if (!s) return; const P = collide({ x: s.pos[0] + Math.sin(s.rot) * -0.9, z: s.pos[1] + Math.cos(s.rot) * -0.9 }, [], { x: s.pos[0], z: s.pos[1] }); c.position.x = P.x; c.position.z = P.z; s.onStand?.(); };
  api.setEmote = (name, dur, t) => { api.emote = { name, until: t + dur }; };
  api.setHome = (pos, tgt) => { home.pos.copy(pos); home.target.copy(tgt); };
  return api;
}
