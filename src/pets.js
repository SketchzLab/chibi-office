// Roaming pets: Mochi (cat) and Biscuit (puppy). Each = one baked body + a dynamic tail/head (few draw calls).
// They wander between cozy spots on a clock-seeded plan, sometimes follow Calvin, can be petted, and Biscuit plays fetch.
import * as THREE from 'three';
import { toonMesh } from './toon.js';
import { bake } from './bake.js';
import { collide } from './player.js';
import { heightAt, LOUNGE, PARK, POOL } from './layout.js';
const S = (r, c, ws = 10, hs = 8) => toonMesh(new THREE.SphereGeometry(r, ws, hs), c);
function makeCat() { const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); const O = 0xf2a05a, D = 0xe08a44;
  const torso = S(0.26, O); torso.scale.set(0.85, 0.75, 1.3); torso.position.y = 0.32; body.add(torso);
  [[-0.12, 0.2], [0.12, 0.2], [-0.12, -0.2], [0.12, -0.2]].forEach(([x, z]) => { const l = toonMesh(new THREE.CylinderGeometry(0.05, 0.05, 0.22, 6), O, { outline: false }); l.position.set(x, 0.11, z); body.add(l); });
  const head = new THREE.Group(); head.position.set(0, 0.5, 0.3); head.userData.dynamic = true; body.add(head); const hd = S(0.18, O); head.add(hd);
  [-1, 1].forEach(k => { const e = toonMesh(new THREE.ConeGeometry(0.06, 0.12, 4), D); e.position.set(k * 0.1, 0.17, 0); head.add(e); const ey = toonMesh(new THREE.SphereGeometry(0.025, 6, 4), 0x2a1f35, { outline: false }); ey.position.set(k * 0.07, 0.02, 0.16); head.add(ey); });
  const tail = new THREE.Group(); tail.position.set(0, 0.38, -0.32); tail.userData.dynamic = true; body.add(tail); const tm = toonMesh(new THREE.CylinderGeometry(0.035, 0.045, 0.45, 6), D); tm.position.y = 0.2; tm.rotation.x = -0.4; tail.add(tm);
  bake(body); bake(head); bake(tail); return { g, body, head, tail }; }
function makeDog() { const g = new THREE.Group(); const body = new THREE.Group(); g.add(body); const C = 0xf3d3a0, E = 0xa8703e;
  const torso = S(0.28, C); torso.scale.set(0.9, 0.8, 1.25); torso.position.y = 0.34; body.add(torso);
  [[-0.13, 0.2], [0.13, 0.2], [-0.13, -0.2], [0.13, -0.2]].forEach(([x, z]) => { const l = toonMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.24, 6), C, { outline: false }); l.position.set(x, 0.12, z); body.add(l); });
  const head = new THREE.Group(); head.position.set(0, 0.56, 0.3); head.userData.dynamic = true; body.add(head); head.add(S(0.21, C));
  const snout = S(0.1, 0xfff1d8); snout.scale.set(1, 0.8, 1.1); snout.position.set(0, -0.05, 0.18); head.add(snout); const nose = toonMesh(new THREE.SphereGeometry(0.035, 6, 4), 0x2a1f35, { outline: false }); nose.position.set(0, -0.02, 0.29); head.add(nose);
  [-1, 1].forEach(k => { const e = S(0.09, E); e.scale.set(0.6, 1.3, 0.4); e.position.set(k * 0.19, 0.0, -0.02); e.rotation.z = k * 0.3; head.add(e); const ey = toonMesh(new THREE.SphereGeometry(0.028, 6, 4), 0x2a1f35, { outline: false }); ey.position.set(k * 0.08, 0.06, 0.18); head.add(ey); });
  const collar = toonMesh(new THREE.TorusGeometry(0.15, 0.03, 5, 12), 0xe86a6a, { outline: false }); collar.rotation.x = Math.PI / 2; collar.position.set(0, 0.47, 0.24); body.add(collar);
  const tail = new THREE.Group(); tail.position.set(0, 0.45, -0.32); tail.userData.dynamic = true; body.add(tail); const tm = toonMesh(new THREE.CylinderGeometry(0.035, 0.05, 0.3, 6), C); tm.position.y = 0.14; tm.rotation.x = -0.6; tail.add(tm);
  bake(body); bake(head); bake(tail); return { g, body, head, tail }; }

const hash = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
export function makePets(scene, getCalvin) {
  const L = LOUNGE;
  const catSpots = [[L.cx - 1.2, L.cz + 0.6], [L.cx + 1.2, L.cz - 1.4], [-3.5, 5.5], [5.0, 5.6], [-6.0, -0.8], [PARK.cx - 1.5, PARK.cz - 3.2], [8.6, -3.8]];
  const dogSpots = [[PARK.cx + 3.2, PARK.cz - 1.0], [PARK.cx - 3.4, PARK.cz + 0.4], [2.0, 10.5], [-1.5, 11.0], [POOL.x + 3.0, POOL.z - 2.5], [12.5, 0.5], [13.0, -4.5], [6.5, 6.5]];
  const mk = (name, parts, spots, speed, seed) => { const p = { name, ...parts, spots, speed, seed, x: spots[0][0], z: spots[0][1], rot: 0, mode: 'wander', tx: spots[0][0], tz: spots[0][1], slot: -1, happyUntil: 0, moving: false };
    p.g.position.set(p.x, 0, p.z); p.g.scale.setScalar(1.0); p.g.userData.name = name; scene.add(p.g); return p; };
  const cat = mk('Mochi', makeCat(), catSpots, 1.1, 3), dog = mk('Biscuit', makeDog(), dogSpots, 1.6, 9);
  const ball = toonMesh(new THREE.SphereGeometry(0.11, 10, 8), 0xd8f25a); ball.visible = false; scene.add(ball);
  const fetch = { state: null, t0: 0, from: new THREE.Vector3(), to: new THREE.Vector3() };
  const pets = [cat, dog];
  function plan(p, wt, C) { const slot = Math.floor(wt / 11 + p.seed); if (slot === p.slot) return; if (wt < (p.holdUntil || 0) && p.mode !== 'follow') { p.tx = p.x; p.tz = p.z; return; } p.slot = slot; const h = hash(slot * 7 + p.seed);
    const near = C && C.position.y < 0.5 && Math.hypot(C.position.x - p.x, C.position.z - p.z) < 8;
    if (p.mode === 'fetch') return; if (wt < (p.followUntil || 0) && near) { p.mode = 'follow'; return; }
    if (near && h < (p === dog ? 0.55 : 0.3)) p.mode = 'follow'; else { p.mode = 'wander'; const s = p.spots[Math.floor(hash(slot + p.seed * 3) * p.spots.length)]; p.tx = s[0]; p.tz = s[1]; } }
  function step(p, dt, t, tx, tz, speed, stopAt = 0.15) { const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz); p.moving = d > stopAt;
    if (p.moving) { const s = Math.min(d, speed * dt);
      // obstacle avoidance: if blocked, slide around it (perpendicular detour) for a moment
      let ux = dx / d, uz = dz / d; if (t < (p.detourUntil || 0)) { const k = p.detourSide; ux = ux * 0.35 + -dz / d * k; uz = uz * 0.35 + dx / d * k; const m = Math.hypot(ux, uz); ux /= m; uz /= m; }
      const q = collide({ x: p.x + ux * s, z: p.z + uz * s }, [], { x: p.x, z: p.z }); const moved = Math.hypot(q.x - p.x, q.z - p.z);
      if (moved < s * 0.3) { p.stuckT = (p.stuckT || 0) + dt; if (p.stuckT > 0.35) { p.detourSide = -(p.detourSide || -1); p.detourUntil = t + 0.9; p.stuckT = 0; } } else p.stuckT = 0;
      p.x = q.x; p.z = q.z; let dr = Math.atan2(dx, dz) - p.rot; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); p.rot += dr * Math.min(1, dt * 8); }
    return d; }
  return { pets, cat, dog, ball,
    pet(p, t) { p.happyUntil = t + 3; },
    throwBall(C, t) { const dir = new THREE.Vector3(Math.sin(C.rotation.y), 0, Math.cos(C.rotation.y)); fetch.from.set(C.position.x, 1.2, C.position.z);
      const q = collide({ x: C.position.x + dir.x * 5.5, z: C.position.z + dir.z * 5.5 }, [], { x: C.position.x, z: C.position.z }); fetch.to.set(q.x, 0.11, q.z); fetch.state = 'fly'; fetch.t0 = t; ball.visible = true; dog.mode = 'fetch'; },
    get fetching() { return fetch.state; },
    update(dt, t, wt) { const C = getCalvin();
      for (const p of pets) { plan(p, wt, C); let sp = p.speed;
        if (p.mode === 'follow') { const bx = C.position.x - Math.sin(C.rotation.y) * 1.3 + (p === cat ? 0.7 : -0.7), bz = C.position.z - Math.cos(C.rotation.y) * 1.3; const d = Math.hypot(bx - p.x, bz - p.z); sp = d > 3 ? p.speed * 2.2 : p.speed * 1.2; step(p, dt, t, bx, bz, sp, 0.4); if (C.position.y > 0.5) p.mode = 'wander'; }
        else if (p.mode === 'fetch') { if (fetch.state === 'fly') { const k = Math.min(1, (t - fetch.t0) / 0.9); ball.position.lerpVectors(fetch.from, fetch.to, k); ball.position.y = 0.11 + (1 - k) * 1.1 + Math.sin(k * Math.PI) * 1.6; if (k >= 1) fetch.state = 'chase'; step(p, dt, t, fetch.to.x, fetch.to.z, p.speed * 2.6); }
          else if (fetch.state === 'chase') { if (step(p, dt, t, fetch.to.x, fetch.to.z, p.speed * 2.6, 0.3) <= 0.3 || t - fetch.t0 > 9) fetch.state = 'return'; }
          else if (fetch.state === 'return') { ball.position.set(p.x + Math.sin(p.rot) * 0.5, 0.5, p.z + Math.cos(p.rot) * 0.5); if (step(p, dt, t, C.position.x + Math.sin(C.rotation.y) * 0.9, C.position.z + Math.cos(C.rotation.y) * 0.9, p.speed * 2.4, 0.5) <= 0.5) { fetch.state = 'drop'; fetch.t0 = t; p.happyUntil = t + 2.5; } }
          else if (fetch.state === 'drop') { ball.position.set(p.x + Math.sin(p.rot) * 0.55, 0.11, p.z + Math.cos(p.rot) * 0.55); if (t - fetch.t0 > 2.5) { fetch.state = null; ball.visible = false; p.mode = 'follow'; p.followUntil = wt + 20; } } }
        else step(p, dt, t, p.tx, p.tz, sp);
        const happy = p.happyUntil > t; const run = p.moving && sp > p.speed * 1.5;
        p.g.position.set(p.x, heightAt(p.x, p.z), p.z); p.g.rotation.y = p.rot;
        p.body.position.y = p.moving ? Math.abs(Math.sin(t * (run ? 16 : 10))) * 0.06 : (happy ? Math.abs(Math.sin(t * 10)) * 0.08 : 0);
        p.tail.rotation.z = Math.sin(t * (happy || p === dog ? 14 : 3)) * (happy ? 0.7 : 0.35); p.head.rotation.x = p.moving ? 0.1 : Math.sin(t * 0.8) * 0.08; p.head.rotation.y = p.moving ? 0 : Math.sin(t * 0.5 + p.seed) * 0.4; } } };
}
