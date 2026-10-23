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
export const TREES = [[-15.6, -4.2, 1.5], [-15.1, 4.6, 1.3], [-11.4, -12.2, 1.4], [-2.4, -15.5, 1.1], [10.3, -12.7, 1.5], [15.4, -5.3, 1.3], [-13.2, 10.3, 1.2], [-11.0, 13.2, 0.9], [14.2, -9.1, 1.0],
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
export const SHOP = { cx: 32, cz: 11, r: 13 }; SHOP.walk = SHOP.r - 1.3; // v16: bigger island (was r 8 at x 27)
export const BRIDGE2 = { z: 11, half: 1.0, x0: 11.6, x1: 21.0, s0: 13.6, s1: 19.8 }; BRIDGE2.walkHalf = BRIDGE2.half - 0.53;
// v16 high street: a wide paved street along z = 11 from the bridge, three bigger shops each side with ~2.9-unit gaps
// (north fronts face +z, south fronts face -z). Shop meshes are built at local scale SHOP_S; w/d/h below are WORLD units.
export const SHOP_S = 1.3, STREET = { x0: 19.6, x1: 43.6, z: 11, half: 2.6, front: 3.9 }; // front = street centre -> shop facade
export const AWN = { y: 2.75 * SHOP_S - 0.2, out: 0.78 * SHOP_S }; // lowest awning edge (world) and how far awnings/counters project from the facade
export const SHOP_BLDG = [['clothes', 'Thread & Co.', 24.2, 0, 4.2], ['gadgets', 'Gizmo Hub', 31.0, 0, 3.8], ['computers', 'Byte Works', 37.8, 0, 4.0],
  ['cafe', 'Bean There', 24.2, 1, 3.8], ['stationery', 'Paper Plane', 31.0, 1, 4.6], ['bistro', 'Little Bistro', 37.8, 1, 3.9]]
  .map(([kind, name, x, south, h], i) => { const d = 2.4 * SHOP_S; return { i, kind, name, x, z: STREET.z + (south ? 1 : -1) * (STREET.front + d / 2), w: 3.0 * SHOP_S, d, h: h * SHOP_S, lh: h, ry: south ? Math.PI : 0 }; });
// collider: the block plus everything that projects from the facade (awning, counter, keeper) — nobody walks under an awning
export const shopBox = (b, out = AWN.out + 0.05) => { const f = b.ry ? -1 : 1; return [b.x - b.w / 2, Math.min(b.z - b.d / 2, b.z + f * (b.d / 2 + out)), b.x + b.w / 2, Math.max(b.z + b.d / 2, b.z + f * (b.d / 2 + out))]; };
// side props beside a shop (clothes rack, bistro chalkboard): boxes [x0,z0,x1,z1]
export const SHOP_SIDE = [[24.2 + 1.95 + 0.05, 5.6, 24.2 + 1.95 + 0.6, 7.0], [37.8 - 1.95 - 0.75, 14.75, 37.8 - 1.95 - 0.05, 15.35]];
// street furniture shared by the builder (shops.js) and the colliders (player.js): [x, z, collider r, kind]
const GAPS = [27.6, 34.4];
export const STREET_PROPS = [[22.6, 13.05, 0.8, 'table'], [25.8, 13.05, 0.8, 'table'], [36.2, 13.05, 0.8, 'table'], [39.4, 13.05, 0.8, 'table'],
  ...[20.6, ...GAPS, 41.4].flatMap(x => [[x, 8.55, 0.2, 'lamp'], [x, 13.45, 0.2, 'lamp']]),
  ...GAPS.flatMap(x => [[x, 6.6, 0.75, 'bench'], [x, 15.4, 0.75, 'bench'], [x, 4.6, 0.6, 'tree'], [x, 17.4, 0.6, 'tree']]),
  [21.2, 6.2, 0.4, 'planter'], [21.2, 15.8, 0.4, 'planter'], [41.6, 6.4, 0.4, 'planter'], [41.6, 15.6, 0.4, 'planter'], [43.4, 11, 0.75, 'tree'], [42.2, 8.0, 0.75, 'bench'], [42.2, 14.0, 0.75, 'bench']];
export const STREET_TREE = { canopyY: 3.55, canopyR: 1.0 }; // street trees: canopy centre/radius (world) — head collider in player.js
export const LAMP_H = 3.7; // lamp globe height (above any head)
export const shopFront = (b, f, s = 0) => [b.x + Math.sin(b.ry) * f + Math.cos(b.ry) * s, b.z + Math.cos(b.ry) * f - Math.sin(b.ry) * s];
export const inBridge2 = (x, z, m = 0) => Math.abs(z - BRIDGE2.z) < BRIDGE2.half + m && x > BRIDGE2.x0 && x < BRIDGE2.x1;
export const onShop = (x, z, m = 0) => Math.hypot(x - SHOP.cx, z - SHOP.cz) < SHOP.r + m;
export function bridge2Y(x) { const B = BRIDGE2, u = Math.max(0, Math.min(1, (x - B.s0) / (B.s1 - B.s0))); return 0.1 - 0.3 * Math.sin(Math.PI * u); }
export const inBridge = (x, z, m = 0) => Math.abs(x - BRIDGE.x) < BRIDGE.half + m && z > BRIDGE.z0 && z < BRIDGE.z1;
export const onHome = (x, z, m = 0) => Math.hypot(x - HOME.cx, z - HOME.cz) < HOME.r + m;
// walkable regions: main lawn circle OR bridge corridor OR home lawn circle; anything else snaps to the nearest one
export function walkClamp(p, W) { const B = BRIDGE, hx = p.x - HOME.cx, hz = p.z - HOME.cz, r = Math.hypot(p.x, p.z), rh = Math.hypot(hx, hz);
  const B2 = BRIDGE2, sx = p.x - SHOP.cx, sz = p.z - SHOP.cz, rs = Math.hypot(sx, sz);
  if (r <= W || rh <= HOME.walk || rs <= SHOP.walk || (Math.abs(p.x - B.x) <= B.walkHalf && p.z >= B.z0 && p.z <= B.z1) || (Math.abs(p.z - B2.z) <= B2.walkHalf && p.x >= B2.x0 && p.x <= B2.x1)) return p;
  const c = [[SHOP.cx + sx * SHOP.walk / rs, SHOP.cz + sz * SHOP.walk / rs], [Math.max(B2.x0, Math.min(B2.x1, p.x)), Math.max(B2.z - B2.walkHalf, Math.min(B2.z + B2.walkHalf, p.z))], [p.x * W / r, p.z * W / r], [HOME.cx + hx * HOME.walk / rh, HOME.cz + hz * HOME.walk / rh], [Math.max(B.x - B.walkHalf, Math.min(B.x + B.walkHalf, p.x)), Math.max(B.z0, Math.min(B.z1, p.z))]];
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
