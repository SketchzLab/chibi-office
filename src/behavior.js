import * as THREE from 'three';
import { DESKS, PANTRY, LOUNGE, GLASS, ROOF, STAIRS, BALCONY, PARK, HOUSE, FIRE, GARDEN, heightAt, SAGE_OFF } from './layout.js';
// ---------- Places ----------
// Each place: pos [x,z], rot (facing), seat (root y when seated, null = standing), approach: waypoints from the main aisle (z≈0).
import { BOT_S, SHOP_BLDG, SHOP_X, STREET, STREET_PROPS, TERRACE_Z, AWN, shopFront } from './layout.js';
import { shopsOn, ootdDay } from './chibi.js';
import { CAL, CAL_SWING, CAL_FIRE, CAL_DECK, CAL_POOL } from './layout.js';
import { isAuroraDay, AURORA } from './skyevents.js';
import { weatherAt } from './weatherplan.js';
// seat root heights scale with chibi size (hip ~0.37 local units)
const HIP = 0.37 * (1.5 - BOT_S); export const SEAT_CHAIR = 0.07 + HIP, SEAT_SOFA = -0.06 + HIP, SEAT_STOOL = -0.05 + HIP;
// v23 Sage's manager office (desk: 'office'): leave the office on the open east side, up the lawn to the executive wing, through
// her door and round the west end of her desk to the chair behind it (faces the door, +z)
const S_OFF = SAGE_OFF, SAX = 6.6, sdx = (S_OFF.door[0] + S_OFF.door[1]) / 2, [sDx, sDz] = S_OFF.desk;
export const TO_SAGE_OFF = [[9.2, -0.25], [12.2, -0.25], [12.2, -9.3], [12.3, -15.2], [sdx, -19.4], [sdx, S_OFF.z1 - 0.9], [SAX, S_OFF.z1 - 1.6], [SAX, S_OFF.z0 + 1.55], [sDx, S_OFF.z0 + 1.55]]; // v24: west aisle past the shelf, then the aisle behind the desk (all collider-free for Calvin's head/body radii)
function sageDesk() { return { pos: [sDx, sDz - 1.0], rot: 0, seat: SEAT_CHAIR, approach: [...TO_SAGE_OFF, [sDx, sDz - 1.0]] }; }
export function deskPlace(i) { if (i === 'office') return sageDesk(); const [x, z] = DESKS[i]; const back = z < 0, sz = back ? z + 1.0 : z - 1.0, side = back ? 0.95 : -0.95, az = back ? -0.25 : 0.25;
  return { pos: [x, sz], rot: back ? Math.PI : 0, seat: SEAT_CHAIR, approach: [[x + side, az], [x + side, sz], [x, sz]] }; }
export function deskAisle(i) { if (i === 'office') return { pos: [SAX, sDz - 0.2], rot: Math.PI / 2, seat: null, approach: [...TO_SAGE_OFF.slice(0, -2), [SAX, sDz - 0.2]] }; const [x, z] = DESKS[i]; const back = z < 0, side = back ? 0.95 : -0.95, az = back ? -0.25 : 0.25;
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
const stools = [[tcx + 0.8, tcz + 1.3], [tcx + 1.7, tcz] /* head clears the glass side pane */, [tcx - 0.8, tcz + 1.3], [tcx + 0.8, tcz - 1.3]].map(([x, z]) => [x, z, Math.atan2(tcx - x, tcz - z)]); // face the table centre
function meetingPlace(i) { const [x, z, r] = stools[i]; const via = [[-4.6, -0.25], [doorX, GLASS.z1 + 1.0], [doorX, GLASS.z1 - 0.5]];
  if (i === 3) via.push([tcx + 1.65, tcz - 1.3]); if (i === 2) via.push([doorX, GLASS.z1 - 1.05], [tcx - 0.8, GLASS.z1 - 1.05]); // keep heads ≥ head radius off the panes
  return { pos: [x, z], rot: r, seat: SEAT_STOOL, approach: [...via, [x, z]] }; }
function pacePlace() { return { pos: [-3.4, -6.5], rot: Math.PI, seat: null, pace: [[-3.4, -6.5], [-0.6, -6.5]], approach: [[-4.0, -0.25], [-4.0, -5.0], [-3.4, -6.5]] }; }
// ---- expansion places (routes leave the office on the open right side / front) ----
const SZ = (STAIRS.z0 + STAIRS.z1) / 2;
const TO_ROOF = [[9.2, -0.25], [12.2, -0.25], [12.2, SZ], [STAIRS.x1 + 0.4, SZ], [STAIRS.x0 - 0.4, SZ]];
const roofSpots = [ // [x, z, rot, seat?, pose]
  [-3.5, -10.75, 0, true, null], [-2.5, -10.75, 0, true, null], [-0.8, -10.0, Math.PI / 2, true, null], [2.6, -10.35, Math.PI, false, 'look']];
function roofPlace(i) { const [x, z, r, seated, pose] = roofSpots[i % 4]; return { pos: [x, z], rot: r, seat: seated ? SEAT_STOOL + 0.0 : null, pose, approach: [...TO_ROOF, [x, -9.3], [x, z]] }; }
const parkSpots = () => [[...PARK.benches[0], true], [...PARK.benches[1], true], [PARK.blanket[0] - 0.3, PARK.blanket[1], -2.4, 'blanket'], [PARK.blanket[0] + 0.4, PARK.blanket[1] + 0.3, -2.4, 'blanket']];
function parkPlace(i) { const [x, z, r, kind] = parkSpots()[i % 4]; const fx = x - Math.sin(r) * 0.0; return { pos: [fx, z], rot: r, seat: kind === 'blanket' ? -0.32 : SEAT_STOOL, approach: [[1.0, 0.25], [2.2, 7.0], [4.6, 8.4], [x + Math.sin(r) * 1.0, z + Math.cos(r) * 1.0], [fx, z]] }; }
function viewPlace(i) { const x = [BALCONY.x1 - 0.6, BALCONY.x1 - 2.3][i % 2], z = BALCONY.z0 + 0.5; return { pos: [x, z], rot: Math.PI, seat: null, pose: 'lean', approach: [[9.2, 0.25], [12.2, 0.25], [BALCONY.x0 + 0.4, 0.2], [x, 0.2], [x, z]] }; } // v18: lean on the north rail (open sea), not the east one (shop street)
// every seated spot a bot can use (for the facing audit)
export function seatPlaces() { const out = [];
  DESKS.forEach((_, i) => out.push({ name: 'desk ' + i, ...deskPlace(i) })); out.push({ name: 'sage office desk', ...deskPlace('office') }); loungeSeats.forEach((_, i) => out.push({ name: 'lounge ' + i, ...loungePlace(i) }));
  stools.forEach((_, i) => out.push({ name: 'meeting stool ' + i, ...meetingPlace(i) })); roofSpots.forEach((r, i) => r[3] && out.push({ name: 'roof ' + i, ...roofPlace(i) }));
  parkSpots().forEach((_, i) => out.push({ name: 'park ' + i, ...parkPlace(i) })); return out; }
// ---------- Activities ----------
// pose: what the body does once arrived. emoji for the status bubble.
// ---------- Home island: evening by the campfire, bed at night ----------
const TO_HOME = [[2.7, 0.25], [2.7, 8.4], [2.2, 13.6], [2.0, 16.0], [2.0, 24.6], [2.0, 27.8]];
const homeSpot = { Pixel: 0, Jun: 1, Sage: 2, Mika: 3 };
function homePlace(b) { const i = homeSpot[b.name] ?? b.slot;
  if (i < 3) { const L = FIRE.logs[i], x = L.x, z = L.z, rot = Math.atan2(FIRE.x - x, FIRE.z - z), ox = x - Math.sin(rot) * 1.0, oz = z - Math.cos(rot) * 1.0;
    const via = oz > FIRE.z ? [[ox < FIRE.x ? FIRE.x - 2.9 : FIRE.x + 2.9, FIRE.z - 0.6]] : [];
    return { pos: [x, z], rot, seat: SEAT_STOOL + 0.06, approach: [...TO_HOME, ...via, [ox, oz], [x, z]] }; }
  return { pos: [GARDEN.x + 1.6, GARDEN.z - 1.1], rot: Math.atan2(-1.0, 0.9), seat: null, approach: [...TO_HOME, [GARDEN.x + 1.6, GARDEN.z - 1.1]] }; }
export const SLEEP_Y = 0.86; // flat on the back: torso on the mattress, head on the pillow
function bedPlace(b) { const r = HOUSE.rooms.find(r => r.who === b.name) || HOUSE.rooms[b.slot % 4]; const bz = HOUSE.z1 - 0.85;
  return { pos: [r.cx + 0.95, bz], rot: Math.PI / 2, seat: SLEEP_Y, lie: true, approach: [...TO_HOME, [r.cx + 0.4, HOUSE.z0 - 1.2], [r.cx + 0.4, HOUSE.z0 + 1.4], [r.cx + 0.95, bz - 0.2], [r.cx + 0.95, bz]] }; }
// ---------- Shopping island (v12): browse in front of a boutique; purchases are the deterministic chibi.js buyOn() rule ----------
const TO_SHOP = [[2.7, 0.25], [2.7, 8.4], [3.4, 13.9], [6.4, 14.6], [9.2, 13.9], [12.0, 11.0], [21.2, 11.0], [22.6, 11.0]];
// v15 high street: on a shopping day (chibi.js shopsOn — the same rule that adds the bought top to the wardrobe) a bot goes to
// Thread & Co.; otherwise it drops by the café, bistro, gadget, computer or stationery shop (rotates by day + slot).
const VENUE_LABEL = { clothes: 'Shopping for a new top at Thread & Co.', cafe: 'Coffee break at Bean There café', bistro: 'Grabbing a bite at Little Bistro', gadgets: 'Window-shopping gadgets at Gizmo Hub', stationery: 'Picking up pens at Paper Plane', computers: 'Browsing PC parts at Byte Works' };
const actLabel = (b, a) => a === 'shop' ? VENUE_LABEL[shopVenue(b)] : (b.labels[a] || EXTRA_LABEL[a] || a);
const EXTRA_LABEL = { calvin: "Hanging out on Calvin's island (invited)", aurora: 'Watching the aurora from the balcony 🌌' };
export function shopVenue(b, day = ootdDay()) { return shopsOn(b.name, day) ? 'clothes' : ['cafe', 'gadgets', 'bistro', 'stationery', 'computers'][(day + b.slot * 2) % 5]; }
function shopPlace(b) { const v = shopVenue(b), sb = SHOP_BLDG.find(s => s.kind === v);
  if (v === 'cafe' || v === 'bistro') { const T = STREET_PROPS.filter(p => p[3] === 'table' && (v === 'cafe' ? p[0] < SHOP_X[1] : p[0] > SHOP_X[1]))[b.slot % 2], x = T[0] + (b.slot >= 2 ? 0.3 : -0.3), z = TERRACE_Z - 1.1; // stands by a terrace table (NPC townsfolk sit at them)
    return { pos: [x, z], rot: 0, seat: null, pose: 'sip', approach: [...TO_SHOP, [x, STREET.z - 0.2], [x, z]] }; }
  const o = [-0.3, 0.6, -0.75, 0.3][b.slot % 4], [x, z] = shopFront(sb, sb.d / 2 + AWN.out + 0.55, o), sx = x; // clear of the awning/counter collider
  return { pos: [x, z], rot: sb.ry + Math.PI, seat: null, approach: [...TO_SHOP, [sx, STREET.z], [x, z]] }; }
// ---------- v20 Calvin's private island: only reachable through the 'calvin' act (his explicit invite) ----------
const CX = CAL.cx, CZ = CAL.cz; export const TO_CAL = [[-4.65, 0.25], [-4.65, 8.6], [-11.9, 8.2], [-12.3, CZ], [-16.0, CZ], [-26.6, CZ], [CX + 6.2, CZ + 1.4]];
export const CAL_SPOTS = { // per-bot hangout spot: [x, z, rot, seat y, pose(night?)]
  Pixel: { name: 'swing', pos: [CAL_SWING.x, CAL_SWING.z], rot: 0, seat: SEAT_STOOL + 0.06, pose: () => 'swing', via: [[CAL_SWING.x + 0.2, CAL_SWING.z + 1.1]] },
  Sage: { name: 'campfire', pos: [CAL_FIRE.x + 0.6, CAL_FIRE.z + 1.45], rot: Math.PI, seat: SEAT_STOOL + 0.06, pose: n => n ? 'warm' : 'read', via: [[CX + 3.0, CZ + 4.9], [CAL_FIRE.x + 0.6, CAL_FIRE.z + 2.35]] },
  Jun: { name: 'coffee', pos: [CAL_DECK.bench.x - 0.05, CAL_DECK.bench.z + 0.45], rot: -Math.PI / 2, seat: SEAT_STOOL, pose: () => 'sip', via: [[CX + 3.0, CZ + 4.9], [CX - 3.6, CZ + 5.6], [CX - 8.0, CZ + 1.0], [CAL_DECK.bench.x + 0.9, CAL_DECK.bench.z + 0.45]] },
  Mika: { name: 'pool', pos: [CAL_POOL.x, CAL_POOL.z + CAL_POOL.rz + 0.32], rot: Math.PI, seat: -0.28, pose: () => 'dangle', via: [[CAL_POOL.x, CAL_POOL.z + CAL_POOL.rz + 1.4]] } };
// v23 weather: while it rains the outdoor seats (swing, campfire, pool edge, bench) are skipped - they wait under an umbrella at the last waypoint
let wetNow = false;
function calvinPlace(b) { const s = CAL_SPOTS[b.name] || CAL_SPOTS[['Pixel', 'Jun', 'Sage', 'Mika'][b.slot % 4]];
  if (wetNow) { const p = s.via.at(-1); return { pos: p, rot: s.rot, seat: null, spot: 'rain', approach: [...TO_CAL, ...s.via.slice(0, -1), p] }; } return { pos: s.pos, rot: s.rot, seat: s.seat, spot: s.name, approach: [...TO_CAL, ...s.via, s.pos] }; }
// aurora night: everyone on the balcony deck facing the north sky (Calvin's lean spot at x1-1.4 stays free)
const AUR_SPOTS = { Pixel: [BALCONY.x1 - 2.3, BALCONY.z0 + 0.5], Jun: [BALCONY.x1 - 0.6, BALCONY.z0 + 0.5], Sage: [BALCONY.x1 - 1.9, BALCONY.z0 + 1.6], Mika: [BALCONY.x1 - 0.7, BALCONY.z0 + 1.6] };
function auroraPlace(b) { const [x, z] = AUR_SPOTS[b.name] || AUR_SPOTS.Pixel; return { pos: [x, z], rot: Math.PI, seat: null, approach: [[9.2, 0.25], [12.2, 0.25], [BALCONY.x0 + 0.4, 0.2], [x, 0.2], [x, z]] }; }
const isNight = () => { const d = dayOf ? dayOf(Date.now() / 1000) : 12 * H; return d >= 18.5 * H || d < 6.5 * H; };
const ACTS = {
  calvin: { place: b => calvinPlace(b), pose: b => wetNow ? 'stand' : (CAL_SPOTS[b.name] || CAL_SPOTS.Pixel).pose(isNight()), emoji: '🏝️' },
  aurora: { place: b => auroraPlace(b), pose: () => 'skywatch', emoji: '🌌' },
  shop: { place: b => shopPlace(b), pose: b => { const v = shopVenue(b); return v === 'cafe' || v === 'bistro' ? 'sip' : 'stand'; }, emoji: '🛍️' },
  home: { place: b => homePlace(b), pose: b => (homeSpot[b.name] ?? b.slot) < 3 ? 'warm' : 'water', emoji: '🔥' },
  sleep: { place: b => bedPlace(b), pose: () => 'sleep', emoji: '💤' },
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
  roof: { place: b => roofPlace(b.roofSpot ?? b.slot), pose: b => roofSpots[(b.roofSpot ?? b.slot) % 4][4] || (b.roofPose || 'read'), emoji: '☁️' },
  park: { place: b => parkPlace(b.slot), pose: b => b.parkPose || 'stand', emoji: '🌳' },
  view: { place: b => viewPlace(b.slot), pose: b => b.viewPose || 'lean', emoji: '🌅' },
};
export const actEmoji = a => ACTS[a]?.emoji ?? '💻';
const SPEED = 1.9; export const SWING_W = 2 * Math.PI / 2.9; // swing period ~2.9 s (rope ~3 m)
// local day clock (UTC+8 seconds-of-day for a wall time) injected by main; null = no day cycle (pure schedule)
let dayOf = null; export function setDayClock(f) { dayOf = f; }
const H = 3600;
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
  chibi.rotation.order = 'YXZ';
  const st = { act: 'work', label: '', walking: false, seated: false, override: null };
  function segmentAt(t) { let c = ((t % cycle) + cycle) % cycle, i = 0; while (c >= sched[i][1]) { c -= sched[i][1]; i++; } return { i, elapsed: c }; }
  // v23 rain: outdoor activities swap to an indoor one (walking in from where they were when it started, and back out after)
  const RAIN_SWAP = { roof: 'pantry', park: 'pantry', view: 'pantry', home: 'sleep' };
  function resolve(t) { wetNow = false; if (!dayOf) return resolve0(t); const w = weatherAt(dayOf(t), ootdDay()); wetNow = w.wet; const r = resolve0(t); st.wet = w.wet;
    if (w.wet) { if (RAIN_SWAP[r.act]) { const sw = RAIN_SWAP[r.act]; return w.since < r.elapsed ? { act: sw, fromAct: r.act, from: ACTS[r.act].place(b), elapsed: w.since } : { act: sw, fromAct: RAIN_SWAP[r.fromAct] || r.fromAct, from: ACTS[RAIN_SWAP[r.fromAct] || r.fromAct].place(b), elapsed: r.elapsed }; }
      if (RAIN_SWAP[r.fromAct]) return { ...r, fromAct: RAIN_SWAP[r.fromAct], from: ACTS[RAIN_SWAP[r.fromAct]].place(b) }; return r; }
    if (RAIN_SWAP[r.act] && w.since < r.elapsed && w.since < 600) return { act: r.act, fromAct: RAIN_SWAP[r.act], from: ACTS[RAIN_SWAP[r.act]].place(b), elapsed: w.since }; // shower over: back out
    return r; }
  function resolve0(t) {
    const lo = st.local; // device-local activity (e.g. Calvin invited them for coffee); wins while active
    if (lo && t < lo.until) { const fromAct = lo.fromAct || 'work'; return { act: lo.act, fromAct, from: ACTS[fromAct].place(b), elapsed: Math.max(0, t - lo.since) }; }
    if (lo && t >= lo.until && t < lo.until + 0.05) st.local = null;
    // fresh live status (status.json < 30 min) beats the clock; 'sleeping' (or unknown) defers to the clock's night routine
    const o = st.override, map = { working: 'work', chatting: 'meeting', idle: 'pantry', away: 'home', break: b.breakAct, meeting: 'meeting' };
    if (o && map[o.state]) return { act: map[o.state], from: deskPlace(b.desk), elapsed: Math.max(0, t - o.since), fromAct: 'work' };
    if (dayOf) { const d = dayOf(t), stg = (homeSpot[b.name] ?? b.slot) * 150; // stagger so they don't walk in a clump
      const aur = isAuroraDay(ootdDay()), g0 = AURORA.gather[0] + stg / 3, g1 = AURORA.gather[1];
      if (aur && d >= g0 && d < g1) return { act: 'aurora', fromAct: 'home', from: homePlace(b), elapsed: d - g0 };
      if (aur && d >= g1) return { act: 'sleep', fromAct: 'aurora', from: auroraPlace(b), elapsed: d - g1 };
      if (d >= 18 * H + stg && d < 22 * H) return { act: 'home', fromAct: 'work', from: deskPlace(b.desk), elapsed: d - 18 * H - stg };
      if (d >= 22 * H || d < 7 * H + stg) return { act: 'sleep', fromAct: 'home', from: homePlace(b), elapsed: (d - 22 * H + 86400) % 86400 };
      if (d < 9 * H) return { act: 'work', fromAct: 'sleep', from: bedPlace(b), elapsed: d - 7 * H - stg }; }
    const { i, elapsed } = segmentAt(t); const prev = sched[(i - 1 + sched.length) % sched.length][0], act = sched[i][0];
    return { act, fromAct: prev, from: ACTS[prev].place(b), elapsed };
  }
  return {
    state: st, cycle,
    setOverride(o) { st.override = o; },
    setLocal(act, t, dur) { st.local = { act, since: t, until: t + dur, fromAct: st.act || 'work' }; },
    clearLocal() { st.local = null; },
    /* v20 invites: walk to Calvin's island and hang out until `until`; sendHome walks back to whatever the routine says now */
    invite(t, until) { st.local = { act: 'calvin', since: t, until, fromAct: st.act && st.act !== 'calvin' ? st.act : 'work' }; },
    restoreInvite(until) { st.local = { act: 'calvin', since: -1e9, until, fromAct: 'work' }; },
    invited(t) { return !!(st.local && st.local.act === 'calvin' && t < st.local.until); },
    baseAct(t) { const lo = st.local; st.local = null; const a = resolve(t).act; st.local = lo; return a; },
    sendHome(t) { const a = this.baseAct(t); st.local = { act: a, since: t, until: t + 75, fromAct: 'calvin' }; return a; },
    actAt(t) { return resolve(t).act; }, // pure: used by the dialogue scheduler (same answer on every device)
    update(t, dt, time) {
      const r = resolve(t); const A = ACTS[r.act]; const to = A.place(b); const pts = route(r.fromAct === r.act ? null : r.from, to);
      const travel = r.fromAct === r.act ? 0 : pathLen(pts) / SPEED + 0.6; // +stand-up/sit-down
      let x, z, rot, pose, walking = false;
      if (r.elapsed < travel) { const d = Math.max(0, (r.elapsed - 0.3) * SPEED); [x, z, rot] = along(pts, d); walking = r.elapsed > 0.3 && d < pathLen(pts); pose = walking ? 'walk' : 'stand'; if (!walking) rot = chibi.rotation.y; }
      else { [x, z] = to.pos; rot = to.rot; pose = A.pose(b);
        if (to.pace) { const L2 = pathLen(to.pace), u = ((r.elapsed - travel) * 1.1) % (2 * L2), d = u < L2 ? u : 2 * L2 - u; const pp = along(u < L2 ? to.pace : [...to.pace].reverse(), u < L2 ? d : u - L2); [x, z] = pp; rot = pp[2]; walking = true; pose = 'walk'; } }
      st.act = r.act; st.walking = walking; st.label = walking && pose === 'walk' && !to.pace ? (r.act === 'work' ? 'Heading back to the desk' : 'On the way: ' + actLabel(b, r.act).toLowerCase()) : actLabel(b, r.act);
      st.seated = !walking && pose !== 'stand' && to.seat !== null; st.spot = walking ? null : to.spot || null; st.asleep = !walking && pose === 'sleep';
      chibi.userData.setSleepFace?.(!!st.asleep);
      if (st.asleep) { const k = Math.min(1, dt * 4); chibi.rotation.x += (-1.57 - chibi.rotation.x) * k; } else chibi.rotation.x += (0 - chibi.rotation.x) * Math.min(1, dt * 6);
      chibi.position.x = x; chibi.position.z = z;
      const ty = st.seated ? to.seat : 0; st.sy = (st.sy || 0) + (ty - (st.sy || 0)) * Math.min(1, dt * 7); chibi.position.y = heightAt(x, z) + st.sy + (st.asleep ? (breath(chibi, time) * 0.5 + 0.5) * 0.03 : 0); if (st.asleep) chibi.userData.sleepAnim?.(time, sleepPhase(chibi));
      if (st.seated) chibi.rotation.y = rot; // snap to the seat's defined facing
      else { let dr = rot - chibi.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); chibi.rotation.y += dr * Math.min(1, dt * 8); }
      applyPose(chibi, pose, time, dt, st.seated && !st.asleep, b);
    },
  };
}
// ---------- Poses ----------
export const sleepPhase = c => c.userData.sleepPh ??= ((c.userData.name || '').split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7) % 1000) / 1000 * 6.283;
export const breath = (c, t) => Math.sin(t * Math.PI / 2 + sleepPhase(c)); // ~4s cycle, per-bot phase
const _tq = new THREE.Quaternion(), _ax = new THREE.Vector3(1, 0, 0);
export function applyPose(c, pose, t, dt, seated, b) {
  const P = c.userData.parts, pr = c.userData.props, k = Math.min(1, dt * 9);
  const tgt = { legL: [0, 0], legR: [0, 0], armL: [0, -0.1], armR: [0, 0.1], bodyY: 0, bodyX: 0, bodyZ: 0, headX: 0, headZ: Math.sin(t * 1.1) * 0.05, headY: 0 };
  const s = Math.sin(t * 2.2);
  if (seated) { tgt.legL = [-1.25, -0.06]; tgt.legR = [-1.25, 0.06]; }
  pr.cup.visible = pose === 'sip'; pr.spinner.visible = pose === 'fidget'; pr.pencil.visible = pose === 'sketch'; pr.pad.visible = pose === 'sketch'; pr.book.visible = pose === 'read'; pr.ctrl.visible = pose === 'game';
  if (pose === 'sip') pr.liq.material.uniforms.uColor.value.set(b.cup);
  switch (pose) {
    case 'sleep': { const ph = sleepPhase(c), P = 20 + (ph * 977 % 40), seg = Math.floor((t + ph * P) / P), turn = Math.floor(Math.abs(Math.sin(seg * 12.9898 + ph * 78.233)) * 43758.5) % 3; // shift / turn every 20–60s
      tgt.armL = [0.05, turn === 1 ? -0.5 : -0.12]; tgt.armR = [turn === 2 ? -0.6 : 0.05, 0.12]; tgt.legL = [0, 0]; tgt.legR = [turn === 2 ? 0.2 : 0, 0]; tgt.bodyY = 0; tgt.headX = -0.12;
      tgt.headY = [0.55, 0.15, 0.8][turn]; tgt.headZ = [0, 0.12, -0.1][turn]; break; } // lying face-up, head turned a little toward the room
    case 'warm': { tgt.armL = [-1.3, 0.3 + Math.sin(t * 0.8) * 0.05]; tgt.armR = [-1.3, -0.3 - Math.sin(t * 0.8) * 0.05]; tgt.headX = 0.08; tgt.headZ = Math.sin(t * 0.5) * 0.08; tgt.bodyY = Math.sin(t * 1.2) * 0.01; break; }
    case 'run': { const w = Math.sin(t * 9); tgt.legL = [w * 1.05, 0]; tgt.legR = [-w * 1.05, 0]; tgt.armL = [-w * 1.0 - 0.25, -0.16]; tgt.armR = [w * 1.0 - 0.25, 0.16]; tgt.bodyY = Math.abs(Math.cos(t * 9)) * 0.13; tgt.bodyX = 0.2; tgt.headX = -0.1; tgt.headZ = w * 0.04; break; } // v15 run: bigger swing, bent arms, forward lean
    case 'walk': { const w = Math.sin(t * 9); tgt.legL = [w * 0.7, 0]; tgt.legR = [-w * 0.7, 0]; tgt.armL = [-w * 0.6, -0.1]; tgt.armR = [w * 0.6, 0.1]; tgt.bodyY = Math.abs(Math.cos(t * 9)) * 0.08; tgt.headZ = w * 0.05; break; }
    case 'type': case 'bob': { const a = Math.sin(t * 14), c2 = Math.sin(t * 13 + 1.3); tgt.armL = [-1.05 + a * 0.06, 0.25]; tgt.armR = [-1.05 + c2 * 0.06, -0.25]; tgt.headX = 0.12;
      if (pose === 'bob') { tgt.headX = 0.1 + Math.max(0, Math.sin(t * 7.6)) * 0.14; tgt.headZ = Math.sin(t * 3.8) * 0.06; } break; }
    case 'bobListen': { tgt.armL = [-0.3, -0.1]; tgt.armR = [-1.9, -0.55]; tgt.headX = Math.max(0, Math.sin(t * 7.6)) * 0.2; tgt.headZ = Math.sin(t * 3.8) * 0.12; tgt.bodyY = Math.max(0, Math.sin(t * 7.6)) * 0.03; break; }
    case 'think': { const a = Math.sin(t * 14); tgt.armL = [-1.05 + a * 0.05, 0.25]; tgt.armR = [-2.15, -0.6]; tgt.headX = 0.05; tgt.headZ = 0.12 + Math.sin(t * 0.7) * 0.04; break; }
    case 'fidget': { tgt.armL = [-1.0, 0.25]; tgt.armR = [-1.55, -0.3]; pr.spinner.rotation.y += dt * 25; tgt.headX = 0.15; tgt.headZ = Math.sin(t * 5) * 0.05; break; }
    case 'sip': { const ph = ((t + sleepPhase(c) * 3) % 7) / 7, sm = THREE.MathUtils.smoothstep; // hold at chest, every ~7s raise to the mouth, tilt, lower
      const l = c.userData.mask ? 0 : c.userData.forceSip ?? sm(ph, 0.5, 0.62) * (1 - sm(ph, 0.8, 0.92)); c.userData.sipL = l; // masked bots skip the sip (cup stays at chest)
      tgt.armR = [-1.15 - l * 1.0, -0.22 - l * 0.36]; tgt.armL = [0, -0.12]; tgt.headX = -0.1 * l; tgt.bodyY = s * 0.02; break; }
    case 'read': { tgt.armL = [-1.15, 0.35]; tgt.armR = [-1.15, -0.35]; tgt.headX = 0.22; tgt.headZ = Math.sin(t * 0.5) * 0.04; break; }
    case 'game': { const a = Math.sin(t * 18) * 0.05; tgt.armL = [-1.15 + a, 0.35]; tgt.armR = [-1.15 - a, -0.35]; tgt.headX = 0.12; tgt.bodyY = Math.abs(Math.sin(t * 3)) * 0.02; tgt.headZ = Math.sin(t * 2.6) * 0.08; break; }
    case 'sketch': { tgt.armL = [-1.1, 0.35]; tgt.armR = [-1.2 + Math.sin(t * 6) * 0.08, -0.3 + Math.cos(t * 6) * 0.08]; tgt.headX = 0.25; break; }
    case 'stretch': { const u = Math.sin(t * 1.4); tgt.armL = [-2.9, 0.15 + u * 0.1]; tgt.armR = [-2.9, -0.15 - u * 0.1]; tgt.bodyY = 0.03 + u * 0.03; tgt.headX = -0.15; break; }
    case 'laugh': { const b2 = Math.abs(Math.sin(t * 11)); tgt.bodyY = b2 * 0.06; tgt.headX = -0.25 - b2 * 0.1; tgt.armL = [-0.5, 0.5 + b2 * 0.2]; tgt.armR = [-0.5, -0.5 - b2 * 0.2]; break; }
    case 'nod': { tgt.headX = 0.1 + Math.max(0, Math.sin(t * 8)) * 0.3; break; }
    case 'highfive': { tgt.armR = [-3.0, -0.15]; tgt.bodyY = 0.04; tgt.headX = -0.2; break; }
    case 'thumbs': { tgt.armR = [-1.6, -0.2]; tgt.headZ = 0.12; tgt.bodyY = Math.abs(Math.sin(t * 6)) * 0.03; break; }
    case 'shywave': { tgt.armR = [-2.3, -0.2 + Math.sin(t * 10) * 0.2]; tgt.headX = 0.25; tgt.headZ = 0.2; tgt.armL = [-0.3, 0.3]; break; }
    case 'jump': { const j = Math.max(0, Math.sin(t * 9)); tgt.bodyY = j * 0.35; tgt.armL = [-2.6, 0.5]; tgt.armR = [-2.6, -0.5]; tgt.headX = -0.2; break; }
    case 'pet': { tgt.armR = [-1.2 + Math.sin(t * 6) * 0.15, -0.2]; tgt.headX = 0.35; tgt.headZ = 0.1; break; }
    case 'look': { tgt.armR = [-2.4, -0.7]; tgt.armL = [-1.6, 0.4]; tgt.headX = -0.35; break; }
    case 'water': { tgt.armR = [-1.4, -0.2]; tgt.headX = 0.3; tgt.bodyY = Math.sin(t * 3) * 0.02; break; }
    case 'lean': { tgt.armL = [-1.15, 0.42]; tgt.armR = [-1.15, -0.42]; tgt.bodyX = 0.16 + Math.sin(t * 0.7) * 0.02; tgt.bodyZ = Math.sin(t * 0.45) * 0.03; tgt.headX = -0.12 + Math.sin(t * 0.6) * 0.04; tgt.headZ = Math.sin(t * 0.35) * 0.12; tgt.headY = Math.sin(t * 0.23) * 0.25; break; }
    case 'leanBob': { tgt.armL = [-1.15, 0.42]; tgt.armR = [-1.15, -0.42]; tgt.bodyX = 0.16; tgt.headX = -0.05 + Math.max(0, Math.sin(t * 7.6)) * 0.16; tgt.headZ = Math.sin(t * 3.8) * 0.1; break; }
    case 'wave': { tgt.armR = [-2.9, -0.4 + Math.sin(t * 12) * 0.35]; tgt.headX = -0.1; break; }
    case 'talk': { const a = Math.sin(t * 3.2), c2 = Math.sin(t * 2.3 + 1); tgt.armL = [-0.9 + a * 0.3, 0.3]; tgt.armR = [-0.7 + c2 * 0.35, -0.3]; tgt.headZ = Math.sin(t * 1.6) * 0.08; tgt.headY = Math.sin(t * 0.9) * 0.2; break; }
    // v20 island + sky poses
    case 'swing': { const w = Math.sin(t * SWING_W); tgt.armL = [-2.45, 0.12]; tgt.armR = [-2.45, -0.12]; tgt.legL = [-1.25 + w * 0.45, -0.06]; tgt.legR = [-1.25 + w * 0.45, 0.06]; tgt.headX = -0.1 - w * 0.12; tgt.bodyX = -w * 0.08; break; }
    case 'dangle': { const a = Math.sin(t * 2.4); tgt.legL = [-1.0 + a * 0.3, -0.06]; tgt.legR = [-1.0 - a * 0.3, 0.06]; tgt.armL = [0.35, 0.45]; tgt.armR = [0.35, -0.45]; tgt.bodyX = -0.12; tgt.headX = -0.05; tgt.headZ = Math.sin(t * 0.7) * 0.1; break; }
    case 'skywatch': { const p = (t * 0.13 + sleepPhase(c)) % 1; tgt.headX = -0.42 + Math.sin(t * 0.4) * 0.05; tgt.headY = Math.sin(t * 0.21 + sleepPhase(c)) * 0.35; tgt.bodyX = -0.06;
      if (p < 0.22) { tgt.armR = [-2.6, -0.35]; tgt.armL = [-0.2, 0.2]; } else { tgt.armL = [-0.55, 0.55]; tgt.armR = [-0.55, -0.55]; } break; } // hands clasped, now and then pointing up
    case 'wade': { const a = Math.sin(t * 1.6); tgt.armL = [-0.25, 0.9 + a * 0.1]; tgt.armR = [-0.25, -0.9 - a * 0.1]; tgt.bodyY = a * 0.03; tgt.headZ = Math.sin(t * 0.8) * 0.08; break; }
    case 'swim': { const a = Math.sin(t * 5); tgt.armL = [-2.0 + a * 0.6, 0.6 + a * 0.4]; tgt.armR = [-2.0 + a * 0.6, -0.6 - a * 0.4]; tgt.legL = [a * 0.5, 0]; tgt.legR = [-a * 0.5, 0]; tgt.bodyX = 0.45; tgt.headX = -0.4; tgt.bodyY = -0.05 + Math.abs(a) * 0.03; break; }
    case 'delight': { const j = Math.max(0, Math.sin(t * 7)); tgt.bodyY = j * 0.22; tgt.armL = [-2.7, 0.55]; tgt.armR = [-2.7, -0.55]; tgt.headX = -0.38; break; } // look up + hop: rainbow!
    default: { tgt.armL = [0, -0.1 - s * 0.04]; tgt.armR = [0, 0.1 + s * 0.04]; tgt.bodyY = s * 0.025; }
  }
  // look-at offset from main (smoothed/clamped there); added to the pose's head yaw so they never fight
  if (c.userData.lookYaw) tgt.headY = THREE.MathUtils.clamp(tgt.headY * 0.3 + c.userData.lookYaw, -0.95, 0.95);
  ['legL', 'legR', 'armL', 'armR'].forEach(n => { P[n].rotation.x += (tgt[n][0] - P[n].rotation.x) * k; P[n].rotation.z += (tgt[n][1] - P[n].rotation.z) * k; });
  if (pose === 'sip') { const l = c.userData.sipL || 0; // keep the cup upright in world space (counter the arm), tilt toward the lips while sipping
    pr.cup.quaternion.copy(P.armR.quaternion).invert().multiply(_tq.setFromAxisAngle(_ax, -0.45 * l)); }
  P.body.position.y += (tgt.bodyY - P.body.position.y) * k; P.body.rotation.x += (tgt.bodyX - P.body.rotation.x) * k; P.body.rotation.z += (tgt.bodyZ - P.body.rotation.z) * k; P.head.rotation.x += (tgt.headX - P.head.rotation.x) * k; P.head.rotation.z += (tgt.headZ - P.head.rotation.z) * k; P.head.rotation.y += (tgt.headY - P.head.rotation.y) * k;
}
