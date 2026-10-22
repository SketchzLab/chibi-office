import * as THREE from 'three';
import { DESKS, PANTRY, LOUNGE, GLASS } from './layout.js';
// ---------- Places ----------
// Each place: pos [x,z], rot (facing), seat (root y when seated, null = standing), approach: waypoints from the main aisle (z≈0).
const SEAT_CHAIR = 0.07, SEAT_SOFA = -0.06, SEAT_STOOL = -0.05;
export function deskPlace(i) { const [x, z] = DESKS[i]; const back = z < 0, sz = back ? z + 1.0 : z - 1.0, side = back ? 0.95 : -0.95, az = back ? -0.25 : 0.25;
  return { pos: [x, sz], rot: back ? Math.PI : 0, seat: SEAT_CHAIR, approach: [[x + side, az], [x + side, sz], [x, sz]] }; }
export function deskAisle(i) { const [x, z] = DESKS[i]; const back = z < 0, side = back ? 0.95 : -0.95, az = back ? -0.25 : 0.25;
  return { pos: [x + side, back ? -0.7 : 0.7], rot: back ? Math.PI : 0, seat: null, approach: [[x + side, az], [x + side, back ? -0.7 : 0.7]] }; }
function pantryPlace(slot) { const dx = Math.sin(PANTRY.ry), dz = Math.cos(PANTRY.ry), lx = Math.cos(PANTRY.ry), lz = -Math.sin(PANTRY.ry); const o = [-1.2, -0.4, 0.4, 1.2][slot];
  const p = [PANTRY.x + dx * 1.55 + lx * o, PANTRY.z + dz * 1.55 + lz * o];
  return { pos: p, rot: Math.atan2(-dx, -dz), seat: null, approach: [[7.6, -0.25], [7.6, -2.4], p] }; }
const L = LOUNGE;
const loungeSeats = [
  { pos: [L.cx + 0.8, L.cz + 1.75], rot: Math.PI, via: [[L.cx + 2.6, L.cz - 2.0], [L.cx + 0.8, L.cz - 1.4]] },
  { pos: [L.cx - 0.8, L.cz + 1.75], rot: Math.PI, via: [[L.cx + 2.6, L.cz - 2.0], [L.cx - 0.8, L.cz - 1.4]] },
  { pos: [L.cx - 1.95, L.cz - 0.5], rot: Math.PI / 2, via: [[L.cx + 2.6, L.cz - 2.0], [L.cx - 1.2, L.cz - 1.5]] },
  { pos: [L.cx - 1.95, L.cz + 0.5], rot: Math.PI / 2, via: [[L.cx + 2.6, L.cz - 2.0], [L.cx - 1.2, L.cz - 1.5], [L.cx - 1.2, L.cz + 0.5]] },
];
function loungePlace(i) { const s = loungeSeats[i]; return { pos: s.pos, rot: s.rot, seat: SEAT_SOFA, approach: [[-4.6, 0.25], ...s.via, s.pos] }; }
const doorX = (GLASS.door0 + GLASS.x1) / 2, tcx = (GLASS.x0 + GLASS.x1) / 2, tcz = (GLASS.z0 + GLASS.z1) / 2;
const stools = [[tcx + 0.8, tcz + 1.3, Math.PI], [tcx + 2.1, tcz, -Math.PI / 2], [tcx - 0.8, tcz + 1.3, Math.PI], [tcx + 0.8, tcz - 1.3, 0]];
function meetingPlace(i) { const [x, z, r] = stools[i]; const via = [[-4.6, -0.25], [doorX, GLASS.z1 + 1.0], [doorX, GLASS.z1 - 0.5]];
  if (i === 3) via.push([tcx + 2.6, tcz - 1.3]); if (i === 2) via.push([tcx - 0.8, GLASS.z1 - 0.5]);
  return { pos: [x, z], rot: r, seat: SEAT_STOOL, approach: [...via, [x, z]] }; }
function pacePlace() { return { pos: [-3.4, -6.5], rot: Math.PI, seat: null, pace: [[-3.4, -6.5], [-0.6, -6.5]], approach: [[-4.0, -0.25], [-4.0, -5.0], [-3.4, -6.5]] }; }
// ---------- Activities ----------
// pose: what the body does once arrived. emoji for the status bubble.
const ACTS = {
  work: { place: b => deskPlace(b.desk), pose: b => b.deskStyle, emoji: '💻' },
  fidget: { place: b => deskPlace(b.desk), pose: () => 'fidget', emoji: '🌀' },
  bob: { place: b => deskPlace(b.desk), pose: () => 'bobListen', emoji: '🎧' },
  pantry: { place: b => pantryPlace(b.slot), pose: () => 'sip', emoji: '☕' },
  game: { place: () => loungePlace(0), pose: () => 'game', emoji: '🎮' },
  read: { place: () => loungePlace(1), pose: () => 'read', emoji: '📖' },
  sketch: { place: () => loungePlace(2), pose: () => 'sketch', emoji: '✏️' },
  stretch: { place: b => deskAisle(b.desk), pose: () => 'stretch', emoji: '🙆' },
  meeting: { place: b => meetingPlace(b.slot), pose: () => 'talk', emoji: '🗣️' },
  pace: { place: () => pacePlace(), pose: () => 'pace', emoji: '🤔' },
};
export const actEmoji = a => ACTS[a]?.emoji ?? '💻';
const SPEED = 1.9;
function pathLen(pts) { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return l; }
function route(a, b) { if (a && b && a.pos[0] === b.pos[0] && a.pos[1] === b.pos[1]) return [b.pos];
  const out = a ? [...a.approach].reverse() : []; return [...out, ...b.approach]; }
function along(pts, d) { for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (d <= l || i === pts.length - 1) { const k = l ? Math.min(1, d / l) : 1; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k, Math.atan2(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])]; } d -= l; }
  const p = pts.at(-1); return [p[0], p[1], 0]; }
// ---------- Brain ----------
// Decides, from the shared UTC clock (or a fresh status.json override), where the bot is and what it's doing.
export function makeBrain(chibi, persona) {
  const b = persona; const sched = b.schedule; const cycle = sched.reduce((s, x) => s + x[1], 0);
  const st = { act: 'work', label: '', walking: false, seated: false, override: null };
  function segmentAt(t) { let c = ((t % cycle) + cycle) % cycle, i = 0; while (c >= sched[i][1]) { c -= sched[i][1]; i++; } return { i, elapsed: c }; }
  function resolve(t) {
    const o = st.override;
    if (o) { const map = { working: 'work', break: b.breakAct, meeting: 'meeting' }; const act = map[o.state] || 'work'; const elapsed = Math.max(0, t - o.since);
      return { act, from: deskPlace(b.desk), elapsed, fromAct: 'work' }; }
    const { i, elapsed } = segmentAt(t); const prev = sched[(i - 1 + sched.length) % sched.length][0], act = sched[i][0];
    return { act, fromAct: prev, from: ACTS[prev].place(b), elapsed };
  }
  return {
    state: st, cycle,
    setOverride(o) { st.override = o; },
    update(t, dt, time) {
      const r = resolve(t); const A = ACTS[r.act]; const to = A.place(b); const pts = route(r.fromAct === r.act ? null : r.from, to);
      const travel = r.fromAct === r.act ? 0 : pathLen(pts) / SPEED + 0.6; // +stand-up/sit-down
      let x, z, rot, pose, walking = false;
      if (r.elapsed < travel) { const d = Math.max(0, (r.elapsed - 0.3) * SPEED); [x, z, rot] = along(pts, d); walking = r.elapsed > 0.3 && d < pathLen(pts); pose = walking ? 'walk' : 'stand'; if (!walking) rot = chibi.rotation.y; }
      else { [x, z] = to.pos; rot = to.rot; pose = A.pose(b);
        if (to.pace) { const L2 = pathLen(to.pace), u = ((r.elapsed - travel) * 1.1) % (2 * L2), d = u < L2 ? u : 2 * L2 - u; const pp = along(u < L2 ? to.pace : [...to.pace].reverse(), u < L2 ? d : u - L2); [x, z] = pp; rot = pp[2]; walking = true; pose = 'walk'; } }
      st.act = r.act; st.walking = walking; st.label = walking && pose === 'walk' && !to.pace ? (r.act === 'work' ? 'Heading back to the desk' : 'On the way: ' + (b.labels[r.act] || r.act).toLowerCase()) : (b.labels[r.act] || r.act);
      st.seated = !walking && pose !== 'stand' && to.seat !== null;
      chibi.position.x = x; chibi.position.z = z;
      const ty = st.seated ? to.seat : 0; chibi.position.y += (ty - chibi.position.y) * Math.min(1, dt * 7);
      let dr = rot - chibi.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); chibi.rotation.y += dr * Math.min(1, dt * 8);
      applyPose(chibi, pose, time, dt, st.seated, b);
    },
  };
}
// ---------- Poses ----------
function applyPose(c, pose, t, dt, seated, b) {
  const P = c.userData.parts, pr = c.userData.props, k = Math.min(1, dt * 9);
  const tgt = { legL: [0, 0], legR: [0, 0], armL: [0, -0.1], armR: [0, 0.1], bodyY: 0, headX: 0, headZ: Math.sin(t * 1.1) * 0.05, headY: 0 };
  const s = Math.sin(t * 2.2);
  if (seated) { tgt.legL = [-1.25, -0.06]; tgt.legR = [-1.25, 0.06]; }
  pr.cup.visible = pose === 'sip'; pr.spinner.visible = pose === 'fidget'; pr.pencil.visible = pose === 'sketch'; pr.pad.visible = pose === 'sketch'; pr.book.visible = pose === 'read'; pr.ctrl.visible = pose === 'game';
  if (pose === 'sip') pr.liq.material.uniforms.uColor.value.set(b.cup);
  switch (pose) {
    case 'walk': { const w = Math.sin(t * 9); tgt.legL = [w * 0.7, 0]; tgt.legR = [-w * 0.7, 0]; tgt.armL = [-w * 0.6, -0.1]; tgt.armR = [w * 0.6, 0.1]; tgt.bodyY = Math.abs(Math.cos(t * 9)) * 0.08; tgt.headZ = w * 0.05; break; }
    case 'type': case 'bob': { const a = Math.sin(t * 14), c2 = Math.sin(t * 13 + 1.3); tgt.armL = [-1.05 + a * 0.06, 0.25]; tgt.armR = [-1.05 + c2 * 0.06, -0.25]; tgt.headX = 0.12;
      if (pose === 'bob') { tgt.headX = 0.1 + Math.max(0, Math.sin(t * 7.6)) * 0.14; tgt.headZ = Math.sin(t * 3.8) * 0.06; } break; }
    case 'bobListen': { tgt.armL = [-0.3, -0.1]; tgt.armR = [-1.9, -0.55]; tgt.headX = Math.max(0, Math.sin(t * 7.6)) * 0.2; tgt.headZ = Math.sin(t * 3.8) * 0.12; tgt.bodyY = Math.max(0, Math.sin(t * 7.6)) * 0.03; break; }
    case 'think': { const a = Math.sin(t * 14); tgt.armL = [-1.05 + a * 0.05, 0.25]; tgt.armR = [-2.15, -0.6]; tgt.headX = 0.05; tgt.headZ = 0.12 + Math.sin(t * 0.7) * 0.04; break; }
    case 'fidget': { tgt.armL = [-1.0, 0.25]; tgt.armR = [-1.55, -0.3]; pr.spinner.rotation.y += dt * 25; tgt.headX = 0.15; tgt.headZ = Math.sin(t * 5) * 0.05; break; }
    case 'sip': { const lift = (Math.sin(t * 1.2) > 0.55) ? 1 : 0; tgt.armR = [lift ? -2.35 : -1.2, lift ? -0.55 : -0.25]; tgt.armL = [0, -0.12]; tgt.headX = lift ? -0.15 : 0; tgt.bodyY = s * 0.02; break; }
    case 'read': { tgt.armL = [-1.15, 0.35]; tgt.armR = [-1.15, -0.35]; tgt.headX = 0.22; tgt.headZ = Math.sin(t * 0.5) * 0.04; break; }
    case 'game': { const a = Math.sin(t * 18) * 0.05; tgt.armL = [-1.15 + a, 0.35]; tgt.armR = [-1.15 - a, -0.35]; tgt.headX = 0.12; tgt.bodyY = Math.abs(Math.sin(t * 3)) * 0.02; tgt.headZ = Math.sin(t * 2.6) * 0.08; break; }
    case 'sketch': { tgt.armL = [-1.1, 0.35]; tgt.armR = [-1.2 + Math.sin(t * 6) * 0.08, -0.3 + Math.cos(t * 6) * 0.08]; tgt.headX = 0.25; break; }
    case 'stretch': { const u = Math.sin(t * 1.4); tgt.armL = [-2.9, 0.15 + u * 0.1]; tgt.armR = [-2.9, -0.15 - u * 0.1]; tgt.bodyY = 0.03 + u * 0.03; tgt.headX = -0.15; break; }
    case 'talk': { const a = Math.sin(t * 3.2), c2 = Math.sin(t * 2.3 + 1); tgt.armL = [-0.9 + a * 0.3, 0.3]; tgt.armR = [-0.7 + c2 * 0.35, -0.3]; tgt.headZ = Math.sin(t * 1.6) * 0.08; tgt.headY = Math.sin(t * 0.9) * 0.2; break; }
    default: { tgt.armL = [0, -0.1 - s * 0.04]; tgt.armR = [0, 0.1 + s * 0.04]; tgt.bodyY = s * 0.025; }
  }
  ['legL', 'legR', 'armL', 'armR'].forEach(n => { P[n].rotation.x += (tgt[n][0] - P[n].rotation.x) * k; P[n].rotation.z += (tgt[n][1] - P[n].rotation.z) * k; });
  P.body.position.y += (tgt.bodyY - P.body.position.y) * k; P.head.rotation.x += (tgt.headX - P.head.rotation.x) * k; P.head.rotation.z += (tgt.headZ - P.head.rotation.z) * k; P.head.rotation.y += (tgt.headY - P.head.rotation.y) * k;
}
