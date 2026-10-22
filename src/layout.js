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
  [12.9, 3.6, 0.9], [14.0, 5.8, 1.0], [12.3, 7.4, 0.8]]; // last three = park grove
const inR = (r, x, z, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
export { inR };
// ground height for any (x,z): stairs ramp, rooftop, balcony deck, else lawn/floor 0
export function heightAt(x, z) {
  if (inR(STAIRS, x, z)) return STAIRS.y * Math.min(1, Math.max(0, (STAIRS.x1 - x) / (STAIRS.x1 - STAIRS.x0)));
  if (inR(ROOF, x, z)) return ROOF.y;
  if (inR(BALCONY, x, z)) return BALCONY.y;
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
