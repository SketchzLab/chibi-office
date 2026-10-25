// Single source of truth for the spacious layout (units ~ metres).
export const ISLAND_R = 18; // expanded island (was 15)
export const FLOOR = { x0: -11, x1: 11, z0: -8, z1: 8 };
export const BACK_Z = -7.9, LEFT_X = -10.9;
export const GLASS = { x0: -10.6, x1: -5.2, z0: -7.7, z1: -2.6, door0: -7.5 } /* doorway wide enough for the head radius */;
export const LOUNGE = { cx: -7.8, cz: 4.6 };
export const DESKS = [[-2.4, -2.6], [1.0, -2.6], [4.4, -2.6], [-2.4, 2.6], [1.0, 2.6]];
export const PANTRY = { x: 8.2, z: -6.2, ry: -0.35 };
export const POOL = { x: -4.5, z: 11.3, rx: 2.4, rz: 1.7 };
export const WALKWAY = { z: 0, half: 0.7, x0: -4.6, x1: 9.2 };
export const BOSS_DESK = [5.2, 2.6]; // Calvin's desk (front row, right)
export const BOT_S = 1.12, CALVIN_S = 1.16; // chibi scales (~0.75x of the old 1.5 / 1.55) -> ~2.9 units tall
export const GLASS_H = 3.4; // glass meeting-room frame height (clears the tallest chibi)
// ---- expansion: rooftop (on the back annex), stairs, balcony deck, mini park ----
export const ROOF = { x0: -7.0, x1: 5.0, z0: -11.6, z1: -8.0, y: 3.34 };
export const STAIRS = { x0: 5.0, x1: 9.8, z0: -10.0, z1: -8.6, y: 3.34 }; // top at x0 (roof), bottom at x1
export const BALCONY = { x0: 15.2, x1: 19.2, z0: -1.8, z1: 2.2, y: 0.12 };
export const PARK = { cx: 7.4, cz: 10.8, r: 2.7 };
{ const b = (a, r) => [PARK.cx + Math.cos(a) * r, PARK.cz + Math.sin(a) * r, Math.atan2(-Math.cos(a), -Math.sin(a))]; PARK.benches = [b(2.6, 3.5), b(-0.55, 3.5)]; PARK.blanket = [PARK.cx + Math.cos(0.75) * 3.6, PARK.cz + Math.sin(0.75) * 3.6]; }
export const WALK_R = ISLAND_R - 1.4; // walkable lawn radius
// ---- v23 executive wing: a second land lobe north-east of the office (merged into the main island) holding Sage's manager
// office and Calvin's founder/CEO corner office on a shared wooden floor. Doors face south (+z) toward the office. ----
export const LOBE = { cx: 12, cz: -19, r: 12 }; LOBE.walk = LOBE.r - 1.4;
export const EXEC = { x0: 4.5, x1: 20.5, z0: -27.3, z1: -12.0, y: 0 }; // shared floor deck (v23b: reaches south to the corridor)
// v23b glass corridor joining the office's back-right corner to the wing deck: west wall continues the office back wall line north,
// open to the office floor on its west side (z -7.9..-4) and to the deck at its north end; the bot/Calvin path x≈12.2 runs through it
export const CORR = { x0: 11.0, x1: 13.8, z0: -12.0, z1: -4.0, wN: -10.45 }; // west wall only z0..wN: the gap wN..BACK_Z is the doorway to the roof stairs
export const ROOM_H = 3.4, ROOM_T = 0.1; // wall height (clears the tallest chibi), wall half-thickness for colliders
export const SAGE_OFF = { x0: 4.5, x1: 10.5, z0: -27.3, z1: -21.4, door: [6.9, 9.3], name: 'Sage', title: 'Manager' };
export const CEO_OFF = { x0: 11.6, x1: 20.5, z0: -27.3, z1: -20.0, door: [12.7, 15.3], name: 'Calvin', title: 'Founder & CEO' }; // ~1.9x Sage's floor area
SAGE_OFF.desk = [8.4, -24.3]; SAGE_OFF.shelf = [5.1, -24.4]; SAGE_OFF.plant = [9.8, -26.5]; /* v24: rooms 0.8 deeper (north) so there is a walkable aisle behind both desks */ SAGE_OFF.guest = [8.7, -22.85]; SAGE_OFF.chess = [9.85, -22.2];
CEO_OFF.desk = [17.6, -24.4]; CEO_OFF.sofa = [12.55, -24.0]; CEO_OFF.table = [14.0, -23.9]; CEO_OFF.shelf = [13.75, -26.85]; CEO_OFF.plants = [[19.9, -26.7], [11.95, -21.0]]; CEO_OFF.arm = [16.2, -21.4]; CEO_OFF.lamp = [12.15, -26.75];
// colliders (player.js): body boxes/circles + head-high boxes (walls, shelves)
// v23c exec terrace dressing on the deck (kept clear of door approaches, the deck runner z -17.9..-19.3 and the corridor -> Sage door diagonal)
export const TERRACE = { planters: [[4.8, -21.3, 6.5, -20.8], [15.8, -19.95, 20.2, -19.45], [4.7, -19.6, 5.2, -13.4]],
  loungers: [[17.4, -14.6], [19.4, -14.6]], table: [18.4, -15.1], parasol: [18.4, -13.3], pots: [[5.6, -12.7, 1.2], [9.9, -12.7, 1.0], [20.0, -12.7, 1.1]],
  posts: [[10.6, -12.4], [14.2, -12.4], [5.3, -17.2], [20.0, -17.4]], wall: [[6.6, -21.32], [9.6, -21.32], [12.4, -19.92], [15.6, -19.92]],
  stones: [[8.1, -19.75], [8.1, -20.45], [14.0, -19.6], [16.4, -17.4], [17.0, -16.6], [17.6, -15.9]] };
export const EXEC_BOXES = [...TERRACE.planters, ...TERRACE.loungers.map(([x, z]) => [x - 0.38, z - 0.95, x + 0.38, z + 0.95]), [SAGE_OFF.desk[0] - 1.15, SAGE_OFF.desk[1] - 0.6, SAGE_OFF.desk[0] + 1.15, SAGE_OFF.desk[1] + 0.6], [CEO_OFF.desk[0] - 1.5, CEO_OFF.desk[1] - 0.68, CEO_OFF.desk[0] + 1.5, CEO_OFF.desk[1] + 0.68],
  [CEO_OFF.sofa[0] - 0.47, CEO_OFF.sofa[1] - 1.3, CEO_OFF.sofa[0] + 0.45, CEO_OFF.sofa[1] + 1.3], [CEO_OFF.table[0] - 0.6, CEO_OFF.table[1] - 0.38, CEO_OFF.table[0] + 0.6, CEO_OFF.table[1] + 0.38]];
export const EXEC_CIRCLES = [[...TERRACE.table, 0.32], [...TERRACE.parasol, 0.15], ...TERRACE.pots.map(([x, z]) => [x, z, 0.4]), ...TERRACE.posts.map(([x, z]) => [x, z, 0.15]), [...SAGE_OFF.guest, 0.42], [...SAGE_OFF.chess, 0.34], [...SAGE_OFF.plant, 0.4], [...CEO_OFF.arm, 0.5], ...CEO_OFF.plants.map(([x, z]) => [x, z, 0.4]), [...CEO_OFF.lamp, 0.26]];
export const corrWalls = (t = ROOM_T) => [[CORR.x0 - t, CORR.z0, CORR.x0 + t, CORR.wN], [CORR.x1 - t, CORR.z0, CORR.x1 + t, CORR.z1 - 0.5]];
export const EXEC_TALL = [...roomWalls(SAGE_OFF), ...roomWalls(CEO_OFF), ...corrWalls(), [SAGE_OFF.shelf[0] - 0.24, SAGE_OFF.shelf[1] - 0.8, SAGE_OFF.shelf[0] + 0.24, SAGE_OFF.shelf[1] + 0.8], [CEO_OFF.shelf[0] - 0.85, CEO_OFF.shelf[1] - 0.24, CEO_OFF.shelf[0] + 0.8, CEO_OFF.shelf[1] + 0.24]];
// ---- v26 cozy café: a third lobe north-west of the office (merged into the main island). Wooden café with a serving
// counter + barista on the north wall, tables inside, a string-lit patio facing south toward the office. ----
export const CAFE_LOBE = { cx: -12.5, cz: -19.5, r: 10 }; CAFE_LOBE.walk = CAFE_LOBE.r - 1.4;
export const CAFE = { x0: -18.4, x1: -8.4, z0: -26.2, z1: -19.6, door: [-14.6, -12.2], h: 3.45, t: 0.12,
  counter: [-17.6, -25.0, -12.6, -24.3], counterH: 1.05, barista: [-15.4, -25.6], shelf: [-17.9, -26.15, -12.9, -25.85],
  t4: [-11.0, -22.6], booth: { table: [-17.05, -22.7], bench: [-17.95, -22.7], chair: [-16.15, -22.7] }, t2: [-15.7, -20.75],
  plants: [[-9.0, -25.6], [-9.0, -20.2], [-18.0, -20.15]],
  patio: { z0: -19.45, z1: -15.6, x0: -18.0, x1: -9.0, tables: [[-16.4, -17.4], [-10.6, -17.4]], posts: [[-18.0, -19.3], [-9.0, -19.3], [-18.0, -15.7], [-9.0, -15.7]],
    canopy: { y: 3.72, h: 0.42, r: 1.65 }, postH: 3.6 } }; // v26.1: canopy rim (y - h/2) clears seated heads; seated chibi hair tops reach ~3.05 m
// seats: [x, z, rotY (facing), kind]; kind: chair | bench; patio flags outdoor
CAFE.seats = [
  { id: 't4w', x: CAFE.t4[0] - 0.85, z: CAFE.t4[1], rot: Math.PI / 2, kind: 'chair' }, { id: 't4e', x: CAFE.t4[0] + 0.85, z: CAFE.t4[1], rot: -Math.PI / 2, kind: 'chair' },
  { id: 't4n', x: CAFE.t4[0], z: CAFE.t4[1] - 0.85, rot: 0, kind: 'chair' }, { id: 't4s', x: CAFE.t4[0], z: CAFE.t4[1] + 0.85, rot: Math.PI, kind: 'chair' },
  { id: 'booth', x: CAFE.booth.bench[0], z: CAFE.booth.bench[1], rot: Math.PI / 2, kind: 'bench' }, { id: 'boothc', x: CAFE.booth.chair[0], z: CAFE.booth.chair[1], rot: -Math.PI / 2, kind: 'chair' },
  { id: 't2w', x: CAFE.t2[0] - 0.8, z: CAFE.t2[1], rot: Math.PI / 2, kind: 'chair' }, { id: 't2e', x: CAFE.t2[0] + 0.8, z: CAFE.t2[1], rot: -Math.PI / 2, kind: 'chair' },
  ...CAFE.patio.tables.flatMap(([x, z], i) => [{ id: 'p' + i + 'w', x: x - 0.8, z, rot: Math.PI / 2, kind: 'chair', out: true }, { id: 'p' + i + 'e', x: x + 0.8, z, rot: -Math.PI / 2, kind: 'chair', out: true }])];
export const onCafeLobe = (x, z, m = 0) => Math.hypot(x - CAFE_LOBE.cx, z - CAFE_LOBE.cz) < CAFE_LOBE.r + m;
export const CAFE_TALL = roomWallsT(CAFE).concat([CAFE.shelf]);
function roomWallsT(R) { return roomWalls(R, R.t); }
const _cs = (s, w, d) => (Math.abs(Math.sin(s.rot)) > 0.5 ? [s.x - d, s.z - w, s.x + d, s.z + w] : [s.x - w, s.z - d, s.x + w, s.z + d]);
export const CAFE_BOXES = [CAFE.counter, [CAFE.booth.bench[0] - 0.35, CAFE.booth.bench[1] - 0.75, CAFE.booth.bench[0] + 0.3, CAFE.booth.bench[1] + 0.75],
  ...CAFE.seats.filter(s => s.kind === 'chair').map(s => _cs(s, 0.24, 0.22)),
  [CAFE.t4[0] - 0.55, CAFE.t4[1] - 0.55, CAFE.t4[0] + 0.55, CAFE.t4[1] + 0.55], [CAFE.booth.table[0] - 0.35, CAFE.booth.table[1] - 0.45, CAFE.booth.table[0] + 0.35, CAFE.booth.table[1] + 0.45]];
export const CAFE_CIRCLES = [[...CAFE.t2, 0.4], ...CAFE.patio.tables.map(([x, z]) => [x, z, 0.4]), ...CAFE.plants.map(([x, z]) => [x, z, 0.32]), ...CAFE.patio.posts.map(([x, z]) => [x, z, 0.1])];
export const onLobe = (x, z, m = 0) => Math.hypot(x - LOBE.cx, z - LOBE.cz) < LOBE.r + m;
// rooms' walls as [x0,z0,x1,z1] boxes (door gap in the south wall)
export function roomWalls(R, t = ROOM_T) { return [[R.x0, R.z0 - t, R.x1, R.z0 + t], [R.x0 - t, R.z0, R.x0 + t, R.z1], [R.x1 - t, R.z0, R.x1 + t, R.z1],
  [R.x0, R.z1 - t, R.door[0], R.z1 + t], [R.door[1], R.z1 - t, R.x1, R.z1 + t]]; }
// v23 trees 4 + 8 moved off the new path to the executive wing (were (10.3,-12.7) and (14.2,-9.1))
export const TREES = [[-15.6, -4.2, 1.5], [-15.1, 4.6, 1.3], [-6.8, -14.6, 1.4], [-2.4, -15.5, 1.1], [1.6, -20.6, 1.4], [16.6, -6.0, 1.3], [-13.9, 10.7, 1.2], [-11.0, 13.2, 0.9], [21.6, -14.6, 1.0],
  [12.9, 3.6, 0.9], [14.0, 5.8, 1.0], [12.3, 7.4, 0.8], // park grove
  [9.6, 29.4, 0.85], [-4.6, 28.6, 0.8]]; // home island (last two)
// ---- home island (+z), joined by a rope-and-plank bridge ----
export const HOME = { cx: 2, cz: 33, r: 10.5 }; HOME.walk = HOME.r - 1.3;
export const BRIDGE = { x: 2, half: 1.0, z0: 15.6, z1: 24.4, s0: 16.4, s1: 23.4 }; // corridor z0..z1, rope span s0..s1
BRIDGE.walkHalf = BRIDGE.half - 0.53; // body radius inside the rails
export const HOUSE = { x0: HOME.cx - 7.6, x1: HOME.cx + 7.6, z0: HOME.cz + 2.6, z1: HOME.cz + 6.4, h: 3.55, y: 0.12, porch: 1.0 };
HOUSE.rooms = [['Pixel', -5.7], ['Jun', -1.9], ['Sage', 1.9], ['Mika', 5.7]].map(([who, dx]) => ({ who, cx: HOME.cx + dx, x0: HOME.cx + dx - 1.9, x1: HOME.cx + dx + 1.9 }));
HOUSE.walls = [HOUSE.x0, ...HOUSE.rooms.slice(1).map(r => r.x0), HOUSE.x1]; // side walls + partitions (x)
export const FIRE = { x: HOME.cx, z: HOME.cz - 2.2 };
FIRE.logs = [Math.PI * 0.5 + 0.0, Math.PI * 1.15, Math.PI * 1.85].map(a => ({ a, x: FIRE.x + Math.cos(a + Math.PI / 2) * 2.0, z: FIRE.z + Math.sin(a + Math.PI / 2) * 2.0 }));
export const GARDEN = { x: HOME.cx - 6.0, z: HOME.cz - 1.6, w: 2.6, d: 1.6 };
// ---- shopping island (+x, south-east), joined by a second plank bridge along z = 11 from the park ----
export const SHOP = { cx: 38, cz: 11, r: 18 }; SHOP.walk = SHOP.r - 1.3; // v17: island r 18 (v16 r 13 at x 32) for the 2x-wide street + bigger shops
// v18: corridor runs on to x1 22.6, well inside the shop island's walk circle (edge x 21.3) — v17 left a 0.3 gap between the corridor end
// (21.0) and the island walk area that the walk clamp snapped you around; deck 2.8 wide (walk lane 1.74, was 0.94). Planks stop at deck1.
export const BRIDGE2 = { z: 11, half: 1.4, x0: 11.6, x1: 22.6, deck1: 21.0, s0: 13.6, s1: 19.8 }; BRIDGE2.walkHalf = BRIDGE2.half - 0.53;
BRIDGE2.mouths = [[11.5, 11, 1.9], [21.7, 11, 1.9]]; // v18: walkable funnel circles at both bridge ends so a player steering in at an angle is guided onto the deck
// v17 high street: a broad paved street along z = 11 (carriageway 10.4 wide, facades 14 apart = 2x v16), three big two-storey
// shops each side with 3.5-unit gaps (north fronts face +z, south fronts face -z). Shop meshes are built in local units and
// scaled by SHOP_S; the ground-floor details (door, shop window, counter, awning height) stay chibi-sized because the local
// frontage/height grew instead (local W 4.8 x D 3.6, + a second storey), so w/d/h below are WORLD units.
export const SHOP_S = 1.3, SHOP_L = { W: 4.8, D: 3.6 }, STREET = { x0: 20.2, x1: 53.0, z: 11, half: 5.2, front: 7.0 }; // front = street centre -> shop facade
export const AWN = { y: 2.75 * SHOP_S - 0.2, out: 0.78 * SHOP_S }; // lowest awning edge (world) and how far awnings/counters project from the facade
export const SHOP_X = [28.2, 38.0, 47.8], GAPS = [33.1, 42.9];
export const SHOP_BLDG = [['clothes', 'Thread & Co.', 0, 0, 6.2], ['gadgets', 'Gizmo Hub', 1, 0, 5.8], ['computers', 'Byte Works', 2, 0, 6.0],
  ['cafe', 'Bean There', 0, 1, 5.8], ['stationery', 'Paper Plane', 1, 1, 6.6], ['bistro', 'Little Bistro', 2, 1, 5.9]]
  .map(([kind, name, xi, south, h], i) => { const d = SHOP_L.D * SHOP_S; return { i, kind, name, x: SHOP_X[xi], z: STREET.z + (south ? 1 : -1) * (STREET.front + d / 2), w: SHOP_L.W * SHOP_S, d, h: h * SHOP_S, lh: h, ry: south ? Math.PI : 0 }; });
// collider: the block plus everything that projects from the facade (awning, counter, keeper) — nobody walks under an awning
export const shopBox = (b, out = AWN.out + 0.05) => { const f = b.ry ? -1 : 1; return [b.x - b.w / 2, Math.min(b.z - b.d / 2, b.z + f * (b.d / 2 + out)), b.x + b.w / 2, Math.max(b.z + b.d / 2, b.z + f * (b.d / 2 + out))]; };
// side props beside a shop (clothes rack east of Thread & Co., bistro chalkboard west of Little Bistro): boxes [x0,z0,x1,z1]
const NF = STREET.z - STREET.front, SF = STREET.z + STREET.front, HW = SHOP_L.W * SHOP_S / 2;
export const SHOP_SIDE = [[SHOP_X[0] + HW + 0.05, NF - 1.5, SHOP_X[0] + HW + 0.6, NF - 0.1], [SHOP_X[2] - HW - 0.75, SF + 0.1, SHOP_X[2] - HW - 0.05, SF + 0.7]];
// street furniture shared by the builder (shops.js) and the colliders (player.js): [x, z, collider r, kind]
export const TERRACE_Z = SF - AWN.out - 1.9; // café / bistro terrace tables in front of the south row
export const STREET_PROPS = [...[SHOP_X[0], SHOP_X[2]].flatMap(x => [[x - 1.6, TERRACE_Z, 0.8, 'table'], [x + 1.6, TERRACE_Z, 0.8, 'table']]),
  ...[21.4, ...GAPS, 51.8].flatMap(x => [[x, STREET.z - STREET.half - 0.4, 0.2, 'lamp'], [x, STREET.z + STREET.half + 0.4, 0.2, 'lamp']]),
  ...GAPS.flatMap(x => [[x, NF - 0.4, 0.75, 'bench'], [x, SF + 0.4, 0.75, 'bench'], [x, NF - 3.4, 0.6, 'tree'], [x, SF + 3.4, 0.6, 'tree'], [x, STREET.z, 0.55, 'planter']]),
  [21.6, NF + 0.6, 0.4, 'planter'], [21.6, SF - 0.6, 0.4, 'planter'], [51.6, NF + 0.6, 0.4, 'planter'], [51.6, SF - 0.6, 0.4, 'planter'], [54.4, 11, 0.75, 'tree'], [53.4, 7.4, 0.75, 'bench'], [53.4, 14.6, 0.75, 'bench']];
export const STREET_TREE = { canopyY: 3.55, canopyR: 1.0 }; // street trees: canopy centre/radius (world) — head collider in player.js
export const LAMP_H = 3.7; // lamp globe height (above any head)
export const shopFront = (b, f, s = 0) => [b.x + Math.sin(b.ry) * f + Math.cos(b.ry) * s, b.z + Math.cos(b.ry) * f - Math.sin(b.ry) * s];
// ---- v20 Calvin's private island (west, -x), joined by a third plank bridge along z = CAL.cz. Strictly Calvin's: bot routes only lead
// here through the 'calvin' act (an explicit invite from his card), NPC loops never do.
export const CAL = { cx: -35, cz: 0.3, r: 11 }; CAL.walk = 8.5; CAL.hedge = 9.7; // walk circle sits inside the hedge ring
export const BRIDGE3 = { z: CAL.cz, half: 1.4, x0: -26.6, x1: -16.0, s0: -24.4, s1: -17.4 }; BRIDGE3.walkHalf = BRIDGE3.half - 0.53;
BRIDGE3.mouths = [[-16.4, CAL.cz, 1.9], [-25.9, CAL.cz, 1.9]];
const cl = (x, z) => [CAL.cx + x, CAL.cz + z];
// features (world coords). Tree trunk at the centre, swing on its east branch, campfire SW of the trunk, house NW, pool NE, coffee deck W (through a hedge gap).
export const CAL_TREE = { x: CAL.cx, z: CAL.cz - 0.8, s: 2.4 };
export const CAL_SWING = { x: CAL_TREE.x + 2.3, z: CAL_TREE.z, py: 3.6, y: 0.55, amp: 0.3 }; // pivot height, seat height; swings along z
export const CAL_FIRE = { x: CAL.cx - 1.2, z: CAL.cz + 2.4 };
CAL_FIRE.logs = [{ x: CAL_FIRE.x, z: CAL_FIRE.z + 1.45, ry: 0 }, { x: CAL_FIRE.x - 1.45, z: CAL_FIRE.z - 0.2, ry: Math.PI / 2 }]; // log axis along local x
export const CAL_HOUSE = { cx: CAL.cx - 4.4, cz: CAL.cz - 3.6, w: 5.0, d: 4.0, h: 3.1, t: 0.16, door: [-0.9, 1.9] }; // door gap (local x) in the +z wall
{ const H = CAL_HOUSE; H.x0 = H.cx - H.w / 2; H.x1 = H.cx + H.w / 2; H.z0 = H.cz - H.d / 2; H.z1 = H.cz + H.d / 2;
  H.bed = [H.x0 + 0.1, H.z0 + 0.08, H.x0 + 3.1, H.z0 + 1.43]; H.closet = [H.x1 - 1.15, H.z0 + 0.08, H.x1 - 0.08, H.z0 + 0.7]; }
export const CAL_POOL = { x: CAL.cx + 5.0, z: CAL.cz - 4.4, rx: 2.1, rz: 1.4, depth: 0.55 };
export const CAL_DECK = { x0: CAL.cx - 11.9, x1: CAL.cx - 8.4, z0: CAL.cz - 1.6, z1: CAL.cz + 1.6, y: 0.15, gap: 1.75 }; // gap: hedge opening half-width (z)
CAL_DECK.bench = { x: CAL.cx - 10.3, z: CAL.cz, ry: -Math.PI / 2 }; CAL_DECK.table = { x: CAL.cx - 10.35, z: CAL.cz + 1.2 };
export const CAL_SIGN = [CAL.cx + 7.4, CAL.cz + 2.6], CAL_LANTERNS = [[-26.6, CAL.cz - 2.1], [-26.6, CAL.cz + 2.1]];
export const onCal = (x, z, m = 0) => Math.hypot(x - CAL.cx, z - CAL.cz) < CAL.r + m;
export const inBridge3 = (x, z, m = 0) => Math.abs(z - BRIDGE3.z) < BRIDGE3.half + m && x > BRIDGE3.x0 && x < BRIDGE3.x1;
export const inCalDeck = (x, z, m = 0) => x > CAL_DECK.x0 - m && x < CAL_DECK.x1 + m && z > CAL_DECK.z0 - m && z < CAL_DECK.z1 + m;
export const calPoolQ = (x, z) => Math.hypot((x - CAL_POOL.x) / CAL_POOL.rx, (z - CAL_POOL.z) / CAL_POOL.rz); // <1 inside the water
export function bridge3Y(x) { const B = BRIDGE3, u = Math.max(0, Math.min(1, (x - B.s0) / (B.s1 - B.s0))); return 0.1 - 0.3 * Math.sin(Math.PI * u); }
/* the private island as a set of walkable shapes (walk circle, bridge corridor + funnel mouths, coffee deck inset by the body radius) */
export function inCalWalk(x, z) { const B = BRIDGE3; return Math.hypot(x - CAL.cx, z - CAL.cz) <= CAL.walk || (Math.abs(z - B.z) <= B.walkHalf && x >= B.x0 && x <= B.x1) || B.mouths.some(([mx, mz, mr]) => Math.hypot(x - mx, z - mz) <= mr)
  || (x >= CAL_DECK.x0 + 0.5 && x <= CAL_DECK.x1 && z >= CAL_DECK.z0 + 0.45 && z <= CAL_DECK.z1 - 0.45); }
function calNearest(x, z) { const B = BRIDGE3, dx = x - CAL.cx, dz = z - CAL.cz, r = Math.hypot(dx, dz) || 1;
  return [[CAL.cx + dx * CAL.walk / r, CAL.cz + dz * CAL.walk / r], [Math.max(B.x0, Math.min(B.x1, x)), Math.max(B.z - B.walkHalf, Math.min(B.z + B.walkHalf, z))],
    [Math.max(CAL_DECK.x0 + 0.5, Math.min(CAL_DECK.x1, x)), Math.max(CAL_DECK.z0 + 0.45, Math.min(CAL_DECK.z1 - 0.45, z))]]; }
export const inBridge2 = (x, z, m = 0) => Math.abs(z - BRIDGE2.z) < BRIDGE2.half + m && x > BRIDGE2.x0 && x < BRIDGE2.x1;
export const onShop = (x, z, m = 0) => Math.hypot(x - SHOP.cx, z - SHOP.cz) < SHOP.r + m;
export function bridge2Y(x) { const B = BRIDGE2, u = Math.max(0, Math.min(1, (x - B.s0) / (B.s1 - B.s0))); return 0.1 - 0.3 * Math.sin(Math.PI * u); }
export const inBridge = (x, z, m = 0) => Math.abs(x - BRIDGE.x) < BRIDGE.half + m && z > BRIDGE.z0 && z < BRIDGE.z1;
export const onHome = (x, z, m = 0) => Math.hypot(x - HOME.cx, z - HOME.cz) < HOME.r + m;
// walkable regions: main lawn circle OR bridge corridor OR home lawn circle; anything else snaps to the nearest one
export function walkClamp(p, W) { const B = BRIDGE, hx = p.x - HOME.cx, hz = p.z - HOME.cz, r = Math.hypot(p.x, p.z), rh = Math.hypot(hx, hz);
  const B2 = BRIDGE2, sx = p.x - SHOP.cx, sz = p.z - SHOP.cz, rs = Math.hypot(sx, sz);
  const lx = p.x - LOBE.cx, lz = p.z - LOBE.cz, rl = Math.hypot(lx, lz), cx = p.x - CAFE_LOBE.cx, cz = p.z - CAFE_LOBE.cz, rc = Math.hypot(cx, cz);
  if (r <= W || rl <= LOBE.walk || rc <= CAFE_LOBE.walk || rh <= HOME.walk || rs <= SHOP.walk || (Math.abs(p.x - B.x) <= B.walkHalf && p.z >= B.z0 && p.z <= B.z1) || (Math.abs(p.z - B2.z) <= B2.walkHalf && p.x >= B2.x0 && p.x <= B2.x1) || B2.mouths.some(([mx, mz, mr]) => Math.hypot(p.x - mx, p.z - mz) <= mr) || inCalWalk(p.x, p.z)) return p;
  const c = [[LOBE.cx + lx * LOBE.walk / rl, LOBE.cz + lz * LOBE.walk / rl], [CAFE_LOBE.cx + cx * CAFE_LOBE.walk / rc, CAFE_LOBE.cz + cz * CAFE_LOBE.walk / rc], [SHOP.cx + sx * SHOP.walk / rs, SHOP.cz + sz * SHOP.walk / rs], [Math.max(B2.x0, Math.min(B2.x1, p.x)), Math.max(B2.z - B2.walkHalf, Math.min(B2.z + B2.walkHalf, p.z))], [p.x * W / r, p.z * W / r], [HOME.cx + hx * HOME.walk / rh, HOME.cz + hz * HOME.walk / rh], [Math.max(B.x - B.walkHalf, Math.min(B.x + B.walkHalf, p.x)), Math.max(B.z0, Math.min(B.z1, p.z))], ...calNearest(p.x, p.z)];
  let best = c[0], bd = Infinity; for (const q of c) { const d = Math.hypot(q[0] - p.x, q[1] - p.z); if (d < bd) { bd = d; best = q; } } p.x = best[0]; p.z = best[1]; return p; }
// bridge deck height: sags in the middle of the rope span
export function bridgeY(z) { const B = BRIDGE, u = Math.max(0, Math.min(1, (z - B.s0) / (B.s1 - B.s0))); return 0.1 - 0.3 * Math.sin(Math.PI * u); }
const inR = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
export { inR };
// ground height for any (x,z): stairs ramp, rooftop, balcony deck, else lawn/floor 0
export function heightAt(x, z) {
  if (inR(STAIRS, x, z)) return STAIRS.y * Math.min(1, Math.max(0, (STAIRS.x1 - x) / (STAIRS.x1 - STAIRS.x0)));
  if (inR(ROOF, x, z)) return ROOF.y;
  if (inR(BALCONY, x, z)) return BALCONY.y;
  if (inBridge(x, z, 0.1) && Math.hypot(x, z) > ISLAND_R - 2.2 && Math.hypot(x - HOME.cx, z - HOME.cz) > HOME.r - 2.2) return bridgeY(z);
  if (inBridge2(x, z, 0.1) && Math.hypot(x, z) > ISLAND_R - 2.2 && Math.hypot(x - SHOP.cx, z - SHOP.cz) > SHOP.r - 1.6) return bridge2Y(x);
  if (x > HOUSE.x0 && x < HOUSE.x1 && z > HOUSE.z0 - HOUSE.porch && z < HOUSE.z1) return HOUSE.y;
  if (x < -15) { // v20 Calvin's island: bridge sag, coffee deck, house floor, pool basin (he wades in)
    if (inBridge3(x, z, 0.1) && Math.hypot(x, z) > ISLAND_R - 2.2 && Math.hypot(x - CAL.cx, z - CAL.cz) > CAL.r - 1.6) return bridge3Y(x);
    if (inCalDeck(x, z) && x < CAL.cx - 8.6) return CAL_DECK.y;
    if (x > CAL_HOUSE.x0 && x < CAL_HOUSE.x1 && z > CAL_HOUSE.z0 && z < CAL_HOUSE.z1 + 0.1) return 0.1;
    const q = calPoolQ(x, z); if (q < 1) return -CAL_POOL.depth * Math.min(1, (1 - q) / 0.35); }
  return 0;
}

// ---- trees: canopy geometry shared by nature.js (mesh) and player.js (collision) ----
export const TREE_LIFT = 0.35;
export const TREE_SPHERES = [[0, 2.1, 0, 1.0], [0.6, 1.8, 0.2, 0.7], [-0.55, 1.85, -0.1, 0.72], [0.1, 2.7, -0.1, 0.7]].map(([x, y, z, r]) => [x, y + TREE_LIFT, z, r]);
// head sphere of the tallest chibi (standing, ground level): centre height + radius (incl. hair), world units
export const HEAD_C = 2.12, HEAD_R = 0.92; // measured: head + hair half-width of the tallest chibi
// 3D head-vs-foliage clearance -> horizontal radius the head's CENTRE must stay outside of (any tree rotation)
export const HEAD_M = 0.06; // margin (walk bob, hair)
export function headReach(spheres, s = 1, hc = HEAD_C) { const hr = HEAD_R + HEAD_M; let m = 0; for (const [x, y, z, r] of spheres) { const dy = y * s - hc, rr = r * s + hr;
  if (Math.abs(dy) < rr) m = Math.max(m, Math.hypot(x, z) * s + Math.sqrt(rr * rr - dy * dy)); } return m; }
export const canopyRadius = s => Math.max(headReach(TREE_SPHERES, s), 0.24 * s + 0.45);
export const PLANT_SPHERES = [[0, 0.75, 0, 0.42], [0.2, 0.95, 0.1, 0.3], [-0.18, 1.05, -0.05, 0.28]];
export const PLANTS = [[-4.6, -7.2, 1.1], [7.4, 2.6, 1.5], [-2.4, 7.2, 1.1], [6.6, 6.9, 1.5], [10.2, -1.2, 1.1]]; // office potted plants [x, z, scale]

export const treeRot = i => (i * 2.399) % 6.283; // fixed per-tree yaw (mesh + obstacle test agree)
