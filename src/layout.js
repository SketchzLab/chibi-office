// Single source of truth for the spacious layout (units ~ metres).
export const ISLAND_R = 15;
export const FLOOR = { x0: -11, x1: 11, z0: -8, z1: 8 };
export const BACK_Z = -7.9, LEFT_X = -10.9;
export const GLASS = { x0: -10.6, x1: -5.2, z0: -7.7, z1: -2.6, door0: -6.7 };
export const LOUNGE = { cx: -7.8, cz: 4.6 };
export const DESKS = [[-2.4, -2.6], [1.0, -2.6], [4.4, -2.6], [-2.4, 2.6], [1.0, 2.6]];
export const PANTRY = { x: 8.2, z: -6.2, ry: -0.35 };
export const POOL = { x: -4.5, z: 11.3, rx: 2.4, rz: 1.7 };
export const WALKWAY = { z: 0, half: 0.7, x0: -4.6, x1: 9.2 };
export const BOSS_DESK = [5.2, 2.6]; // Calvin's desk (front row, right)
export const BOT_S = 1.12, CALVIN_S = 1.16; // chibi scales (~0.75x of the old 1.5 / 1.55) -> ~2.9 units tall
export const GLASS_H = 3.4; // glass meeting-room frame height (clears the tallest chibi)
