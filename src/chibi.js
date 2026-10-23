import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toonMat } from './toon.js';
// Chibi v2 (style-ref ART STYLE, per-persona outfits): every part is many small chamfered blocks merged per pivot
// (body, head, armL, armR, legL, legR) = 1 textured fill + 1 navy outline each. Textures are a per-chibi 64x64 atlas of
// 16px tiles hand-pixel-painted in 2x2 clusters with hue-shifted 3-tone shading (cool shadows, warm lights), nearest-filtered.

const T = 16, N = 4, COOL = new THREE.Color(0x2c2f6e), WARM = new THREE.Color(0xfff0d4), DUST = new THREE.Color(0x8c90a6);
const mute = (hex, k = 0.22) => new THREE.Color(hex).lerp(DUST, k);
const tone = (c, k) => { c = new THREE.Color(c); return k < 0 ? c.lerp(COOL, -k) : c.lerp(WARM, k); };
const css = c => '#' + c.getHexString();
const B4 = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// painters work on an 8x8 grid of 2x2-px clusters so the pixels read as hand-placed blocks
const PAINT = {
  cel(px, b, o) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const v = 1 - y / 7 + (B4[y & 3][x & 3] / 16 - 0.5) * 0.45; px(x, y, tone(b, v > 0.74 ? (o.hi ?? 0.2) : v > 0.28 ? 0 : (o.lo ?? -0.3))); }
    for (let i = 0; i < (o.specks ?? 2); i++) px((rnd() * 8) | 0, (rnd() * 6) | 0, tone(b, rnd() > 0.5 ? 0.28 : -0.22)); },
  knit(px, b) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, tone(b, (x & 1 ? -0.14 : 0.1) - (y === 7 ? 0.2 : 0) - ((y & 3) === 3 ? 0.08 : 0))); },
  seam(px, b) { PAINT.cel(px, b, { specks: 1 }); for (let y = 0; y < 8; y++) { px(3, y, tone(b, -0.4)); px(4, y, tone(b, 0.18)); } },
  stripe(px, b, o) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, tone((y >> 1) & 1 ? o.b2 : b, y > 5 ? -0.25 : y < 1 ? 0.18 : 0)); },
  shoe(px, b, o) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, y >= 6 ? tone(o.sole, y === 7 ? -0.3 : 0.05) : y >= 3 && y < 5 ? tone(o.strap, y === 3 ? 0.15 : -0.2) : y < 3 && x > 1 && x < 6 && (x + y) % 2 === 0 ? tone(0xf6f2ea, 0.1) : tone(b, y < 2 ? 0.18 : -0.08)); }, // laces / strap / sole
  skin(px, b) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, tone(b, 0.04)); }, // clean flat skin: no dither/speckle (read as stubble)
  flat(px, b) { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, new THREE.Color(b)); },
  patch(px, b, o) { PAINT.cel(px, b, { specks: 1 }); [[2, 2], [5, 2], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [2, 4], [3, 4], [4, 4], [5, 4], [3, 5], [4, 5]].forEach(([x, y]) => px(x, y, tone(o.c, y < 3 ? 0.2 : 0))); }, // pixel heart
};

PAINT.hair = (px, b) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) { const st = (x + (y >> 2)) % 3; px(x, y, tone(b, y === 0 ? 0.16 : y >= 6 ? -0.24 : st === 0 ? 0.2 : st === 1 ? -0.14 : 0.02)); } }; // 3-tone + highlight streaks
PAINT.mask = (px, b) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, tone(b, y === 3 || y === 6 ? -0.2 : y === 2 || y === 5 ? 0.12 : (x * 7 + y * 3) % 11 === 0 ? -0.06 : 0)); }; // soft pleats
PAINT.quilt = (px, b) => { for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) px(x, y, tone(b, (y & 3) === 3 ? -0.32 : (y & 3) === 0 ? 0.22 : 0.02)); };

/* ---- OOTD: interchangeable wardrobe parts. Rig (part-local): legs pivot y0.5 (ground -0.5), arms pivot (±0.44,1.08) hand ~-0.5, head pivot y1.72.
   b(part, w, h, d, x, y, z, tileKey, opts) where opts = { rx, ry, rz, r: bevel fraction of min dim, tp/bt: taper at top/bottom } and t(painter, colour, o) -> tileKey */
const SOFT = { r: 0.45 }, LIFT = 0.18; export const GIRLS = new Set(['Pixel', 'Sage', 'Mika']);
const SLEEVE = (b, k, cuff, len = 0.48, w = 0.32) => ['armL', 'armR'].forEach(a => { b(a, w, len, w + 0.02, 0, -0.39 + len / 2, 0, k, { r: 0.48, bt: -0.14, puff: 0.08, round: 0.7 }); if (cuff) b(a, w - 0.02, 0.09, w, 0, -0.4, 0, cuff, SOFT); });
const TOPS = {
  tee(b, t, o) { const k = t('cel', o.c), rib = t('knit', tone(o.c, -0.18)); b('body', 0.88, 0.66, 0.6, 0, 0.98, 0, k, { r: 0.42, tp: -0.14, bt: -0.05 }); b('body', 0.8, 0.12, 0.62, 0, 0.64, 0, rib, SOFT); b('body', 0.48, 0.1, 0.46, 0, 1.33, 0, rib, SOFT);
    if (o.patch) b('body', 0.36, 0.28, 0.04, 0.14, 1.02, 0.3, t('patch', o.c, { c: o.patch }), { r: 0.3 });
    ['armL', 'armR'].forEach(a => { b(a, 0.31, 0.32, 0.33, 0, -0.07, 0, k, { r: 0.48 }); b(a, 0.19, 0.44, 0.21, 0, -0.3, 0.01, 'skin', { bt: -0.12, round: 0.75 }); }); },
  turtleneck(b, t, o) { const k = t('knit', o.c), n = t('knit', tone(o.c, -0.15)); b('body', 0.82, 0.72, 0.58, 0, 0.98, 0, k, { r: 0.42, tp: -0.14, bt: -0.05 }); b('body', 0.46, 0.18, 0.46, 0, 1.36, 0, n, SOFT); SLEEVE(b, k, n, 0.48, 0.28); },
  sweater(b, t, o) { const k = t('knit', o.c), s = t('stripe', o.c, { b2: o.c2 }), rib = t('knit', tone(o.c, -0.2)); b('body', 0.9, 0.7, 0.62, 0, 0.98, 0, s, { r: 0.42, tp: -0.14, bt: -0.05 });
    b('body', 0.82, 0.12, 0.64, 0, 0.64, 0, rib, SOFT); b('body', 0.5, 0.1, 0.48, 0, 1.34, 0, rib, SOFT); SLEEVE(b, k, rib, 0.48, 0.31); },
  hoodie(b, t, o) { const k = t('cel', o.c, { specks: 3 }), rib = t('knit', tone(o.c, -0.2)), st = t('flat', 0xf2ede4); b('body', 0.9, 0.72, 0.66, 0, 0.98, 0, k, { r: 0.44, tp: -0.12, bt: -0.05 }); b('body', 0.8, 0.12, 0.66, 0, 0.62, 0, rib, SOFT);
    b('body', 0.52, 0.2, 0.08, 0, 0.8, 0.33, rib, SOFT); { const it = t('cel', o.c2 ?? 0xf0ece2, { specks: 0 }); b('body', 0.82, 0.08, 0.6, 0, 0.55, 0, it, SOFT); } [-1, 1].forEach(s => b('body', 0.04, 0.26, 0.04, s * 0.1, 1.12, 0.35, st));
    if (!o.up) b('body', 0.8, 0.28, 0.32, 0, 1.3, -0.26, k, { rx: 0.3, r: 0.5 });
    else { /* one soft shell sagging over the face (front carved open), peaked tip falling back */
      b('head', 1.1, 1.04, 1.04, 0, 0.1, -0.12, k, { round: 0.9, tp: -0.12, lean: 0.08, sag: 0.14, carve: { x: 0.43, y0: -0.6, y1: 0.33, z: 0.18 } });
      b('head', 0.34, 0.56, 0.3, 0, -0.12, -0.62, k, { rx: -2.6, tp: -0.65, round: 0.9 }); b('body', 0.84, 0.22, 0.56, 0, 1.36, -0.04, k, { round: 0.9 }); }
    SLEEVE(b, k, rib, 0.48, 0.32); },
  cardigan(b, t, o) { const k = t('knit', o.c), sh = t('cel', o.c2 ?? 0xe9e2cf, { specks: 0 }), pk = t('knit', tone(o.c, -0.2)); b('body', 0.52, 0.7, 0.5, 0, 1.0, 0.06, sh, SOFT);
    [-1, 1].forEach(s => { b('body', 0.32, 0.86, 0.62, s * 0.27, 0.92, 0, k, { r: 0.45, tp: -0.12 }); b('body', 0.2, 0.16, 0.06, s * 0.26, 0.72, 0.32, pk, SOFT); }); b('body', 0.88, 0.24, 0.6, 0, 0.5, -0.02, k, SOFT); SLEEVE(b, k, pk, 0.5, 0.31); },
  shirt(b, t, o) { const k = t('cel', o.c, { specks: 1 }), dk = t('flat', tone(o.c, -0.25)); b('body', 0.84, 0.72, 0.58, 0, 0.98, 0, k, { r: 0.42, tp: -0.14, bt: -0.05 }); b('body', 0.05, 0.56, 0.04, 0, 1.0, 0.3, dk);
    [-1, 1].forEach(s => b('body', 0.22, 0.08, 0.12, s * 0.12, 1.33, 0.2, k, { rz: s * -0.3, r: 0.3 })); if (o.tie) b('body', 0.1, 0.4, 0.06, 0, 1.06, 0.31, t('cel', o.tie), { r: 0.3 });
    ['armL', 'armR'].forEach(a => { b(a, 0.29, 0.32, 0.31, 0, -0.06, 0, k, { r: 0.48 }); b(a, 0.3, 0.08, 0.32, 0, -0.24, 0, k, SOFT); b(a, 0.19, 0.36, 0.21, 0, -0.34, 0.01, 'skin', { bt: -0.12, round: 0.75 }); }); },
  blazer(b, t, o) { const k = t('cel', o.c, { specks: 2 }), lp = t('flat', tone(o.c, -0.28)), sh = t('flat', 0xeeeae2); b('body', 0.9, 0.74, 0.62, 0, 0.98, 0, k, { r: 0.4, tp: -0.1, bt: -0.05 }); b('body', 0.3, 0.5, 0.06, 0, 1.1, 0.3, sh, { r: 0.3 });
    if (o.tie) b('body', 0.1, 0.4, 0.06, 0, 1.06, 0.33, t('cel', o.tie), { r: 0.3 }); [-1, 1].forEach(s => b('body', 0.1, 0.42, 0.05, s * 0.17, 1.14, 0.32, lp, { rz: s * -0.3 })); b('body', 0.5, 0.1, 0.46, 0, 1.36, 0, sh, SOFT);
    SLEEVE(b, k, sh, 0.48, 0.31); },
  jacket(b, t, o) { const k = t('quilt', o.c), rib = t('knit', o.c2), z = t('flat', tone(o.c, 0.35)); if (o.crop) { b('body', 0.84, 0.3, 0.6, 0, 0.68, 0, t('cel', o.c2, { specks: 0 }), SOFT); } b('body', 0.92, o.crop ? 0.6 : 0.78, 0.7, 0, o.crop ? 1.06 : 0.97, 0, k, { tp: -0.16, bt: -0.08, quilt: 0.05, qn: 2.5, puff: 0.06, round: 0.7, sy: 8 }); b('body', 0.05, 0.6, 0.04, 0, 0.98, 0.36, z);
    { const sc = t('stripe', o.s ?? 0xd98aa0, { b2: tone(o.s ?? 0xd98aa0, 0.25) }); b('body', 0.7, 0.2, 0.6, 0, 1.36, 0.02, sc, { round: 0.85 }); b('body', 0.16, 0.42, 0.07, 0.16, 1.08, 0.37, sc, { rz: 0.1, r: 0.4 }); } b('body', 0.8, 0.12, 0.68, 0, o.crop ? 0.78 : 0.6, 0, rib, SOFT); SLEEVE(b, k, rib, 0.5, 0.34); },
};
const BOTTOMS = {
  trousers(b, t, o) { const k = t('seam', o.c); ['legL', 'legR'].forEach(l => b(l, 0.3, 0.36, 0.32, 0, -0.13, 0, k, { r: 0.4 })); },
  jeans(b, t, o) { const k = t('seam', o.c), cf = t('cel', tone(o.c, 0.2), { specks: 0 }); ['legL', 'legR'].forEach(l => { b(l, 0.31, 0.34, 0.33, 0, -0.12, 0, k, { r: 0.4 }); b(l, 0.32, 0.07, 0.34, 0, -0.28, 0, cf, SOFT); b(l, 0.14, 0.12, 0.03, 0, -0.02, -0.17, cf); }); },
  joggers(b, t, o) { const k = t('seam', o.c), rib = t('knit', tone(o.c, -0.2)); ['legL', 'legR'].forEach(l => { b(l, 0.32, 0.28, 0.34, 0, -0.1, 0, k, { r: 0.46, bt: -0.1 }); b(l, 0.28, 0.08, 0.3, 0, -0.26, 0, rib, SOFT); }); },
  shorts(b, t, o) { const k = t('seam', o.c), so = t('stripe', 0xf2efe6, { b2: o.sock ?? o.c }); ['legL', 'legR'].forEach(l => { b(l, 0.34, 0.22, 0.35, 0, -0.06, 0, k, { r: 0.42, bt: -0.05 }); b(l, 0.2, 0.1, 0.2, 0, -0.2, 0, 'skin', SOFT); b(l, 0.21, 0.1, 0.21, 0, -0.27, 0, so, SOFT); }); },
};
BOTTOMS.skirt = (b, t, o) => { const k = t('seam', o.c), ti = t('cel', o.t ?? 0x3a3d5c, { specks: 0 }); b('body', 0.86, o.long ? 0.5 : 0.36, 0.66, 0, o.long ? 0.4 : 0.47, 0, k, { bt: 0.3, round: 0.6, quilt: 0.03, qn: 4 });
  ['legL', 'legR'].forEach(l => b(l, 0.24, 0.36, 0.26, 0, -0.13, 0, ti, { r: 0.4 })); };
const SHOES = { /* [w, h, d, y] */ sneaker: [0.32, 0.2, 0.46, -0.39], hightop: [0.33, 0.26, 0.46, -0.36], loafer: [0.28, 0.15, 0.44, -0.415], boot: [0.3, 0.26, 0.42, -0.37], platform: [0.33, 0.24, 0.46, -0.38], brogue: [0.28, 0.16, 0.44, -0.41] };
const shoes = (b, t, o) => { const [w, h, d, y] = SHOES[o.kind], k = t('shoe', o.c, { strap: o.strap ?? tone(o.c, -0.2), sole: o.sole ?? 0x2a2026 }); const so = t('cel', o.sole ?? 0x2a2026, { specks: 0, hi: 0.15 }); ['legL', 'legR'].forEach(l => { b(l, w, h, d, 0, y + 0.02, 0.06, k, { tp: -0.1 }); b(l, w + 0.04, 0.07, d + 0.05, 0, y - h / 2 + 0.02, 0.07, so); b(l, w - 0.04, h * 0.55, 0.08, 0, y - 0.01, 0.06 + d / 2, so); }); };
const HATS = {
  snapback(b, t, o) { const k = t('cel', o.c, { hi: 0.25 }), br = t('flat', o.c2 ?? tone(o.c, -0.45)); b('head', 0.9, 0.42, 0.86, 0, 0.46, -0.04, k, { r: 0.5, tp: -0.34 }); b('head', 0.1, 0.06, 0.1, 0, 0.68, -0.04, br, SOFT);
    if (o.back) { b('head', 0.62, 0.07, 0.42, 0, 0.33, -0.6, br, { rx: -0.3, blob: true, round: 0.75 }); b('head', 0.22, 0.12, 0.06, 0, 0.42, 0.42, br, { r: 0.3 }); } else b('head', 0.62, 0.07, 0.4, 0, 0.36, 0.5, br, { rx: -0.3, blob: true, round: 0.75 }); },
  beanie(b, t, o) { const k = t('knit', o.c), cf = t('knit', tone(o.c, -0.22)); b('head', 1.0, 0.42, 0.94, 0, 0.53, -0.03, k, { r: 0.5, tp: -0.38 }); b('head', 1.02, 0.14, 0.96, 0, 0.36, -0.03, cf, { r: 0.4 }); if (o.pom) b('head', 0.2, 0.18, 0.2, 0, 0.79, -0.03, t('knit', o.pom), { r: 0.5 }); },
  bucket(b, t, o) { const k = t('cel', o.c, { specks: 1 }); b('head', 0.86, 0.3, 0.82, 0, 0.53, -0.03, k, { r: 0.5, tp: -0.15 }); b('head', 1.14, 0.06, 1.08, 0, 0.37, -0.02, t('cel', tone(o.c, -0.12), { specks: 0 }), { blob: true, round: 0.92, rx: -0.14 }); },
};
const ACC = {
  glasses(b, t, o) { const k = t('flat', o.c ?? 0x2a2c4a), rr = o.round ? 0.5 : 0.2, W = 0.17, H = 0.15, y = -0.05, z = 0.36, f = 0.02; /* thin frame around each eye, open (clear) lens */
    [-1, 1].forEach(s => { const cx = s * 0.15; b('head', W, f, f, cx, y + H / 2, z, k, { r: rr }); b('head', W, f, f, cx, y - H / 2, z, k, { r: rr }); b('head', f, H, f, cx - W / 2, y, z, k, { r: rr }); b('head', f, H, f, cx + W / 2, y, z, k, { r: rr }); }); b('head', 0.07, f, f, 0, y + 0.03, z, k); },
  mask(b, t, o) { const k = t('mask', o.m ?? 0xe8eaf0), lp = t('flat', tone(o.m ?? 0xe8eaf0, -0.25)); /* nose + mouth only, pleated, ear loops */
    b('head', 0.34, 0.14, 0.06, 0, -0.255, 0.35, k, { r: 0.45, tp: -0.1 }); b('head', 0.26, 0.05, 0.05, 0, -0.19, 0.36, k, { r: 0.45 });
    [-1, 1].forEach(s => { b('head', 0.02, 0.02, 0.16, s * 0.3, -0.2, 0.28, lp, { ry: s * 0.6 }); b('head', 0.02, 0.02, 0.16, s * 0.3, -0.29, 0.28, lp, { ry: s * 0.6 }); }); },
  headphones(b, t, o, hat) { const k = t('cel', 0x2b2d42, { hi: 0.15 }), cp = t('cel', o.c); b('head', 1.08, 0.1, 0.18, 0, hat ? 0.66 : 0.57, -0.06, k, { r: 0.5 }); [-1, 1].forEach(s => { b('head', 0.12, hat ? 0.46 : 0.38, 0.18, s * 0.54, hat ? 0.42 : 0.38, -0.06, k, SOFT); b('head', 0.18, 0.36, 0.36, s * (hat ? 0.6 : 0.56), 0.02, -0.04, cp, { r: 0.5 }); }); },
  bag(b, t, o) { b('body', 0.1, 0.82, 0.64, 0, 1.0, 0, t('flat', tone(o.c, -0.25)), { rz: 0.75, r: 0.3 }); b('body', 0.34, 0.28, 0.14, 0.3, 0.7, 0.31, t('cel', o.c, { specks: 1 }), { rz: 0.1, r: 0.4 }); },
};
/* hair stays with the person (identity); hats and hoods hide the crown */
/* v2 hair (full + clean): top cap, sides, back, fringe; hats/hoods only hide the top cap & crown details, sides + back always stay */
const HAIRBASE = (b, k, cov, o = {}) => { if (!cov) b('head', o.tw ?? 0.94, 0.3, 0.88, 0, 0.36, -0.04, k, { tp: -0.1 });
  [-1, 1].forEach(s => b('head', o.sw ?? 0.16, o.sh ?? 0.46, 0.7, s * 0.43, o.sy ?? 0.03, -0.1, k)); b('head', 0.86, o.bh ?? 0.52, 0.22, 0, o.by ?? 0.04, -0.37, k);
  b('head', o.fw ?? 0.84, 0.14, 0.2, 0, 0.24, 0.32, k, { rz: o.frz ?? 0 }); };
const HAIR = {
  Pixel(b, k, kd, cov, bw) { HAIRBASE(b, k, cov); [-1, 1].forEach(s => { b('head', 0.22, 0.5, 0.22, s * 0.54, -0.14, -0.14, k, { rz: s * 0.14, bt: -0.25 }); b('head', 0.2, 0.13, 0.2, s * 0.5, 0.15, -0.12, bw); }); },
  Jun(b, k, kd, cov) { HAIRBASE(b, k, cov, { sh: 0.38, sy: 0.08, bh: 0.44, by: 0.08, fw: 0.5 }); b('head', 0.6, 0.16, 0.24, -0.16, 0.25, 0.32, k, { rz: 0.18 }); if (!cov) b('head', 0.3, 0.14, 0.26, 0.28, 0.42, 0.2, k, { rz: -0.3 }); },
  Sage(b, k, kd, cov) { HAIRBASE(b, k, cov, { sh: 0.5, sy: 0.0, bh: 0.62, by: -0.02, frz: 0.06 }); [-1, 1].forEach(s => b('head', 0.12, 0.44, 0.14, s * 0.45, -0.2, 0.18, k, { bt: -0.3 }));
    if (!cov) { b('head', 0.44, 0.38, 0.4, 0, 0.6, -0.34, k); b('head', 0.7, 0.05, 0.05, 0, 0.66, -0.34, kd, { rz: 0.5 }); } else b('head', 0.36, 0.32, 0.3, 0, -0.08, -0.52, k); },
  Mika(b, k, kd, cov, bw) { HAIRBASE(b, k, cov, { tw: 0.96, sw: 0.2, sh: 0.66, sy: -0.1, bh: 0.7, by: -0.06 }); if (!cov) b('head', 0.14, 0.07, 0.05, 0.24, 0.26, 0.42, bw); },
  Calvin(b, k, kd, cov) { HAIRBASE(b, k, cov, { tw: 0.92, sw: 0.14, sh: 0.36, sy: 0.1, bh: 0.46, by: 0.1, fw: 0.8 }); if (!cov) b('head', 0.56, 0.2, 0.36, 0.08, 0.5, 0.18, k, { rx: 0.2, rz: -0.1 }); },
};
/* wardrobes biased to persona + identity colours (L = muted look). Entries: [label, kind, opts] */
const NONE = [['', null, {}]];
const WARDROBE = {
  Pixel: L => ({ top: [['pixel-heart tee', 'tee', { c: L.shirt, patch: 0xe0577f }], ['zip hoodie', 'hoodie', { c: L.hair, c2: L.shirt }], ['puffer jacket', 'jacket', { s: L.hair, c: L.shirt, c2: L.pants }], ['striped sweater', 'sweater', { c: L.pants, c2: L.shirt }], ['oversized tee', 'tee', { c: L.hair }]],
    bottom: [['cargo shorts', 'shorts', { c: L.pants, sock: L.hair }], ['pleated skirt', 'skirt', { c: L.pants, t: 0xf2efe6 }], ['joggers', 'joggers', { c: L.pants }], ['jeans', 'jeans', { c: 0x5a6a9a }]],
    shoes: [['high-tops', 'hightop', { c: 0xf4f2ee, strap: L.hair, sole: 0xd8dcea }], ['sneakers', 'sneaker', { c: L.shirt, strap: 0xf4f2ee, sole: 0xd8dcea }]],
    head: [['snapback', 'snapback', { c: L.hair, c2: L.shirt }], ['backwards snapback', 'snapback', { c: L.hair, c2: L.shirt, back: true }], ...NONE, ['beanie', 'beanie', { c: L.shirt, pom: L.hair }]],
    acc: [NONE[0], ['headphones', 'headphones', { c: L.hair }], ['mask', 'mask', { m: 0xf0d8e4 }]] }),
  Jun: L => ({ top: [['turtleneck', 'turtleneck', { c: L.shirt }], ['oxford shirt', 'shirt', { c: 0xdfe6ee }], ['cable sweater', 'sweater', { c: L.shirt, c2: 0xe9e2cf }], ['bomber', 'jacket', { s: 0xe9e2cf, c: L.hair, c2: L.shirt }], ['hoodie', 'hoodie', { c: 0x8c96a8 }]],
    bottom: [['slim trousers', 'trousers', { c: L.pants }], ['dark jeans', 'jeans', { c: 0x3c4a78 }]],
    shoes: [['loafers', 'loafer', { c: 0x4a3434, strap: 0x2e2222 }], ['white sneakers', 'sneaker', { c: 0xf0eeea, strap: L.shirt, sole: 0xd8dcea }]],
    head: [...NONE, ...NONE, ['beanie', 'beanie', { c: 0xc9a35a }]],
    acc: [['square specs + sketch bag', ['glasses', 'bag'], { c: 0x8a6248 }], ['square specs', 'glasses', {}], ['specs + mask', ['glasses', 'mask'], {}]] }),
  Sage: L => ({ top: [['long cardigan', 'cardigan', { c: L.shirt }], ['turtleneck', 'turtleneck', { c: 0xe2d8c2 }], ['fair-isle sweater', 'sweater', { c: L.shirt, c2: 0xe9e2cf }], ['quilted jacket', 'jacket', { s: 0xc98a4a, c: L.shirt, c2: 0x8a5e44 }]],
    bottom: [['cream trousers', 'trousers', { c: L.pants }], ['midi skirt', 'skirt', { c: 0x8a6a52, long: true, t: 0x5a3a2e }], ['corduroys', 'trousers', { c: 0x8a6a52 }]],
    shoes: [['suede boots', 'boot', { c: 0x8a5e44, strap: 0x6a4432 }], ['loafers', 'loafer', { c: 0x5a3a2e }]],
    head: [...NONE, ...NONE, ['bucket hat', 'bucket', { c: 0xc8bc98 }]],
    acc: [['gold specs', 'glasses', { c: 0x9a7a3a, round: true }], ['gold specs', 'glasses', { c: 0x9a7a3a, round: true }], ['gold specs + mask', ['glasses', 'mask'], { c: 0x9a7a3a, round: true }]] }),
  Mika: L => ({ top: [['oversized hoodie', 'hoodie', { c: L.shirt }], ['cosy hoodie', 'hoodie', { c: tone(L.shirt, 0.15), c2: 0x3a3d5c }], ['band tee', 'tee', { c: 0x3a3d5c }], ['cropped puffer', 'jacket', { s: 0xe9e2cf, c: L.hair, c2: L.shirt, crop: true }], ['chunky sweater', 'sweater', { c: L.hair, c2: L.shirt }]],
    bottom: [['joggers', 'joggers', { c: L.pants }], ['plaid skirt', 'skirt', { c: 0x3a3d5c, t: 0x2a2c40 }], ['jeans', 'jeans', { c: 0x4a5a8a }], ['shorts', 'shorts', { c: L.pants, sock: L.shirt }]],
    shoes: [['platform sneakers', 'platform', { c: 0xece6f2, strap: L.hair, sole: 0x34406a }], ['sneakers', 'sneaker', { c: L.shirt, strap: 0xf4f2ee }]],
    head: [...NONE, ...NONE, ['beanie', 'beanie', { c: L.hair }]],
    acc: [['headphones', 'headphones', { c: 0xd9607e }], ['headphones', 'headphones', { c: L.hair }], ['mask', 'mask', { m: 0x7a80aa }]] }),
  Calvin: L => ({ top: [['navy blazer + tie', 'blazer', { c: L.shirt, tie: 0xb8454e }], ['oxford shirt', 'shirt', { c: 0xe6eaf0 }], ['knit sweater', 'sweater', { c: L.shirt, c2: 0xe9e2cf }], ['hoodie', 'hoodie', { c: 0x5a6070 }], ['blazer, no tie', 'blazer', { c: 0x5a5048 }]],
    bottom: [['charcoal trousers', 'trousers', { c: L.pants }], ['jeans', 'jeans', { c: 0x3c4a78 }]],
    shoes: [['brogues', 'brogue', { c: 0x6b4632, strap: 0x5a3a28 }], ['white sneakers', 'sneaker', { c: 0xf0eeea, strap: L.shirt, sole: 0xd8dcea }]],
    head: [...NONE], acc: [NONE[0], NONE[0], ['glasses', 'glasses', {}], ['mask', 'mask', {}]] }),
};
/* outfit day: UTC+8 calendar day (stable all day), ?ootd=N overrides */
export function ootdDay() { const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('ootd') : null; return q != null && q !== '' ? +q : Math.floor((Date.now() / 1000 + 8 * 3600) / 86400); }
const hashN = s => [...s].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7);
export function pickOOTD(name, L, day = ootdDay()) { const W = (WARDROBE[name] || WARDROBE.Calvin)(L), h = hashN(name), pk = (arr, m, a) => { let x = (day * 2654435761 + h * a + m * 40503) >>> 0; x = Math.imul(x ^ (x >>> 15), 2246822519) >>> 0; x = Math.imul(x ^ (x >>> 13), 3266489917) >>> 0; return arr[((x ^ (x >>> 16)) >>> 0) % arr.length]; };
  const arr0 = a => a[(((day + h) % a.length) + a.length) % a.length]; const o = { top: arr0(W.top), bottom: pk(W.bottom, 3, 5), shoes: pk(W.shoes, 5, 3), head: pk(W.head, 7, 11), acc: pk(W.acc, 2, 13) };
  if (o.top[2].up) { o.head = NONE[0]; if (o.acc[1] === 'headphones') o.acc = NONE[0]; }
  o.label = [o.top, o.bottom, o.shoes, o.head, o.acc].map(x => x[0]).filter(Boolean).join(', '); return o; }

let STENCIL_ID = 0; const OUT = new THREE.MeshBasicMaterial({ color: 0x1d2050, side: THREE.BackSide });
// hull pushed out along normals AND back in depth so overlapping inner blocks don't draw double lines; only silhouettes survive
OUT.onBeforeCompile = s => { s.vertexShader = s.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = position + normal * 0.03;').replace('#include <project_vertex>', '#include <project_vertex>\n gl_Position.z += 0.003 * gl_Position.w;'); };
const KEY = new THREE.Vector3(-0.45, 0.8, 0.45).normalize(), SH = new THREE.Color(0x98a0d4);

export function makeChibi({ name, role, skin = 0xf0c4a6, hair, shirt, pants, day }) {
  const root = new THREE.Group(); root.userData = { name, role, activity: 'Working at desk' };
  const L = { hair: mute(hair), shirt: mute(shirt), pants: mute(pants), skin: mute(skin, 0.1) }, dd0 = day ?? ootdDay(), fit = pickOOTD(name, L, dd0);
  /* atlas: 8x8 tiles painted lazily as outfit parts ask for them */
  const AN = 8, cv = document.createElement('canvas'); cv.width = cv.height = T * AN; const g = cv.getContext('2d'); const tiles = {}; let nt = 0; seed = (name || 'x').length * 977 + 13;
  const t = (fn, base, o = {}) => { const key = fn + new THREE.Color(base).getHexString() + JSON.stringify(o); if (tiles[key] === undefined) { if (nt >= AN * AN) return 'skin'; const i = nt++;
      const x0 = (i % AN) * T, y0 = ((i / AN) | 0) * T; PAINT[fn]((x, y, c) => { g.fillStyle = css(c); g.fillRect(x0 + x * 2, y0 + y * 2, 2, 2); }, base, o); tiles[key] = i; } return key; };
  tiles.skin = tiles[t('skin', L.skin)];
  const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; tex.colorSpace = THREE.SRGBColorSpace;
  /* one clean silhouette per character: fills stamp a per-chibi stencil id, outline hulls only draw outside it (no seams at overlaps) */
  const sid = (STENCIL_ID = STENCIL_ID % 250 + 1);
  const fill = new THREE.MeshBasicMaterial({ map: tex, vertexColors: true, stencilWrite: true, stencilRef: sid, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp });
  const outM = OUT.clone(); outM.onBeforeCompile = OUT.onBeforeCompile; outM.customProgramCacheKey = () => 'chibiOutline'; Object.assign(outM, { stencilWrite: true, stencilRef: sid, stencilFunc: THREE.NotEqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp });
  const geos = { body: [], head: [], armL: [], armR: [], legL: [], legR: [] };
  const box = (part, w, h, d, x, y, z, tk, o = {}) => {
    /* v5 rig: longer legs - body/head/arms ride 0.1 higher; leg parts stretch down to the same ground */
    if (part === 'body') y += LIFT; else if (part === 'legL' || part === 'legR') { if (y < -0.3) y -= LIFT; else { h += LIFT * 0.9; y -= LIFT * 0.45; } }
    const mn = Math.min(w, h, d), blob = o.blob ?? false; let geo;
    if (blob) { /* sculpted mass: subdivided box blended toward an ellipsoid, then tapered / sagged / quilted / bent; faceted */
      const sy = o.sy ?? (h > 0.5 ? 5 : 3); geo = new THREE.BoxGeometry(w, h, d, 4, Math.max(4, sy), 4); const pa = geo.attributes.position, v = new THREE.Vector3(), rnd0 = o.round ?? 0.9;
      for (let i = 0; i < pa.count; i++) { v.set(pa.getX(i) / (w / 2), pa.getY(i) / (h / 2), pa.getZ(i) / (d / 2)); const u = v.clone().normalize().multiplyScalar(Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z))); v.lerp(u, rnd0);
        const yn = v.y; let sc = 1 + (yn > 0 ? (o.tp || 0) * yn : (o.bt || 0) * -yn); if (o.quilt) sc *= 1 + o.quilt * Math.cos(yn * Math.PI * (o.qn ?? 2.5)); { const pf = o.puff ?? (h > 0.4 ? 0.05 : 0); if (pf) sc *= 1 + pf * (1 - yn * yn); }
        let X = v.x * w / 2 * sc, Y = v.y * h / 2, Z = v.z * d / 2 * sc; if (o.sag) Z += o.sag * (1 - yn) * (1 - yn) * 0.25 * d * (v.z > 0 ? 1 : 0.3); if (o.bend) { const k = (1 - yn) / 2; X += o.bend * k * k * h; Z += (o.bendz || 0) * k * k * h; } if (o.lean) Z += o.lean * (yn + 1) / 2 * h; const cv = o.carve; if (cv && Z > cv.z && Math.abs(X) < cv.x && Y > cv.y0 && Y < cv.y1) Z = cv.z;
        pa.setXYZ(i, X, Y, Z); }
      geo = geo.toNonIndexed(); geo.computeVertexNormals(); }
    else { geo = new RoundedBoxGeometry(w, h, d, 1, mn * 0.2); if (geo.index) geo = geo.toNonIndexed();
      const pa = geo.attributes.position, tp = o.tp || 0, bt = o.bt || 0; if (tp || bt) for (let i = 0; i < pa.count; i++) { const yn = pa.getY(i) / (h / 2), s = 1 + (yn > 0 ? tp * yn : bt * -yn); pa.setX(i, pa.getX(i) * s); pa.setZ(i, pa.getZ(i) * s); } }
    const uv = geo.attributes.uv, k = tiles[tk] ?? tiles.skin, u0 = (k % AN) / AN, v0 = 1 - ((k / AN | 0) + 1) / AN, s = 1 / AN, e = 0.5 / (T * AN);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, u0 + e + uv.getX(i) * (s - 2 * e), v0 + e + uv.getY(i) * (s - 2 * e));
    const n = geo.attributes.normal, col = new Float32Array(n.count * 3), v = new THREE.Vector3(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(o.rx || 0, o.ry || 0, o.rz || 0));
    for (let i = 0; i < n.count; i++) { v.fromBufferAttribute(n, i); const bevel = Math.max(Math.abs(v.x), Math.abs(v.y), Math.abs(v.z)) < 0.97; v.applyQuaternion(q); const dd = v.dot(KEY);
      const c = new THREE.Color(1, 1, 1); if (tk === 'skin' && part === 'head') { if (dd < 0.1) c.lerp(SH, 0.12); } else if (dd < 0.1) c.lerp(SH, 0.8); else if (dd < 0.5) c.lerp(SH, 0.3); if (bevel && dd > 0.55) c.lerp(WARM, 0.35).multiplyScalar(1.08); col.set([c.r, c.g, c.b], i * 3); }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(1, 1, 1))); geos[part].push(geo); };
  /* anatomy (soft, tapered head) + today's outfit */
  const girl = GIRLS.has(name); box('head', girl ? 0.76 : 0.8, 0.62, 0.66, 0, -0.04, 0, 'skin', { bt: girl ? -0.12 : -0.04 }); box('body', 0.3, 0.14, 0.3, 0, 1.38, 0, 'skin', { r: 0.4 });
  ['armL', 'armR'].forEach(a => box(a, 0.22, 0.18, 0.24, 0, -0.5, 0.02, 'skin', { r: 0.48 }));
  TOPS[fit.top[1]](box, t, fit.top[2]); BOTTOMS[fit.bottom[1]](box, t, fit.bottom[2]); shoes(box, t, { kind: fit.shoes[1], ...fit.shoes[2] });
  const hat = fit.head[1], cov = fit.top[2].up ? 'hood' : hat ? 'hat' : null; if (hat) HATS[hat](box, t, fit.head[2]);
  const HC = name === 'Sage' ? 0xa8a6cc : L.hair, hk = t('cel', HC, { lo: -0.36, hi: 0.2, specks: 3 }), hkd = t('flat', tone(HC, -0.4)); (HAIR[name] || HAIR.Calvin)(box, hk, hkd, cov, t('cel', L.shirt, { hi: 0.25 })); /* fringe peeking under the hood */
  [].concat(fit.acc[1] || []).forEach(a => ACC[a](box, t, fit.acc[2], !!hat));
  root.userData.ootd = fit.label; root.userData.ootdDay = dd0;
  const body = new THREE.Group(), head = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group(), legL = new THREE.Group(), legR = new THREE.Group();
  root.add(body); head.position.y = 1.68 + LIFT; armL.position.set(-0.5, 1.1 + LIFT, 0.03); armR.position.set(0.5, 1.1 + LIFT, -0.03); body.add(head, armL, armR);
  legL.position.set(-0.19, 0.5 + LIFT, 0.08); legR.position.set(0.19, 0.5 + LIFT, -0.06); root.add(legL, legR); // offset feet = relaxed stance
  const grp = { body, head, armL, armR, legL, legR };
  /* torso tapers toward the hips (shoulders stay wide) */
  for (const gg of geos.body) { const pa = gg.attributes.position; for (let i = 0; i < pa.count; i++) { const y = pa.getY(i); if (y < 1.05) { const s = 1 - Math.min(1, (1.05 - y) / 0.5) * 0.16; pa.setX(i, pa.getX(i) * s); } } }
  for (const l of ['legL', 'legR']) for (const gg of geos[l]) { const pa = gg.attributes.position; for (let i = 0; i < pa.count; i++) if (pa.getY(i) > -0.33) { pa.setX(i, pa.getX(i) * 0.84); pa.setZ(i, pa.getZ(i) * 0.9); } }
  for (const [k, list] of Object.entries(geos)) { if (!list.length) continue; const m = mergeGeometries(list); list.forEach(x => x.dispose()); const og = new THREE.BufferGeometry(); og.setAttribute('position', m.attributes.position.clone()); const ogm = mergeVertices(og, 1e-4); ogm.computeVertexNormals(); og.dispose(); /* smooth normals so the hull never cracks */
    const f = new THREE.Mesh(m, fill), o = new THREE.Mesh(ogm, outM);
    if (k === 'body') { const ph = sid * 1.7; f.onBeforeRender = () => { const sy = 1 + 0.018 * Math.sin(performance.now() / 1000 * 1.7 + ph); f.scale.y = o.scale.y = sy; head.position.y = (1.68 + LIFT) + (sy - 1) * 1.6; }; } /* idle breathing */ o.renderOrder = 2; o.raycast = () => {}; grp[k].add(f, o); }
  legR.children.forEach(m => { m.rotation.set(0, 0.42, 0.05); }); legL.children.forEach(m => { m.rotation.set(0, -0.12, -0.04); }); // toes out, asymmetric
    head.scale.setScalar(girl ? 0.8 : 0.83); body.children.filter(m => m.isMesh).forEach(m => { m.scale.set(girl ? 0.98 : 1.14, 1, girl ? 1.02 : 1.1); m.rotation.set(0.03, 0.02, -0.01); });
  const pocket = fit.top[1] === 'hoodie' || fit.top[1] === 'jacket'; root.userData.pocket = pocket; armL.children.forEach(m => m.rotation.set(pocket ? -0.3 : -0.1, 0, pocket ? 0.2 : 0.05)); armR.children.forEach(m => m.rotation.set(pocket ? -0.22 : 0.12, 0, pocket ? -0.2 : -0.04)); /* arms hang & hug the body */ // smaller head vs chunkier body (ref proportions)
  // ---- face: open = black vertical-oval eyes + heavy brow; shut = flat lids + per-bot sleep mouth (kept separate for setSleepFace)
  const fz = 0.335, fg = (w, h, col, x, y, z = fz, rz = 0) => { let gg = new RoundedBoxGeometry(w, h, 0.03, 1, Math.min(w, h) * 0.45); if (gg.index) gg = gg.toNonIndexed(); gg.rotateZ(rz); gg.translate(x, y, z);
    const c = new THREE.Color(col), a = new Float32Array(gg.attributes.position.count * 3); for (let i = 0; i < a.length; i += 3) { a[i] = c.r; a[i + 1] = c.g; a[i + 2] = c.b; } gg.setAttribute('color', new THREE.BufferAttribute(a, 3));
    for (const k of Object.keys(gg.attributes)) if (k !== 'position' && k !== 'color') gg.deleteAttribute(k); return gg; };
  const BROW = tone(L.hair, -0.5).getHex(), MOUTH = 0x6a2f3e, openG = [], shutG = [];
  const EW = girl ? 0.09 : 0.075, EH = girl ? 0.15 : 0.13, BW = girl ? 0.16 : 0.21, BH = girl ? 0.028 : 0.06, BR = girl ? -0.18 : 0;
  [-1, 1].forEach(s => { openG.push(fg(EW, EH, 0x101024, s * 0.15, -0.06), fg(0.035, 0.045, 0xf4f0ff, s * 0.15 + 0.016, -0.025, fz + 0.01), fg(BW, BH, BROW, s * 0.15, girl ? 0.075 : 0.065, fz, s * BR));
    if (girl) openG.push(fg(0.05, 0.022, 0x101024, s * 0.205, 0.0, fz + 0.005, s * 0.6), fg(0.04, 0.02, 0x101024, s * 0.2, 0.025, fz + 0.005, s * 0.95)); /* lash ticks */
    shutG.push(fg(0.13, 0.03, 0x101024, s * 0.15, -0.08, fz, s * 0.08), fg(BW, BH, BROW, s * 0.15, 0.05, fz, s * (girl ? -0.1 : 0)));
    if (girl) shutG.push(fg(0.04, 0.02, 0x101024, s * 0.22, -0.095, fz + 0.005, s * -0.6)); });
  openG.push(fg(0.1, 0.025, MOUTH, 0.02, -0.22)); const BL = new THREE.Color(L.skin).lerp(new THREE.Color(0xf07a90), girl ? 0.8 : 0.35).getHex(); [-1, 1].forEach(s => { const bl = fg(girl ? 0.12 : 0.1, 0.05, BL, s * 0.24, -0.15, fz - 0.012); openG.push(bl); shutG.push(fg(0.11, 0.05, BL, s * 0.24, -0.15, fz - 0.012)); });
  const sleepMouth = { Jun: 'o', Mika: 'drool', Sage: 'frown', Pixel: 'mumble' }[name] || 'o';
  if (sleepMouth === 'o') shutG.push(fg(0.06, 0.06, MOUTH, 0, -0.23)); if (sleepMouth === 'frown') shutG.push(fg(0.12, 0.025, MOUTH, 0, -0.24));
  if (sleepMouth === 'drool') shutG.push(fg(0.09, 0.025, MOUTH, 0.01, -0.23));
  const faceMat = new THREE.MeshBasicMaterial({ vertexColors: true });
  const faceOpen = new THREE.Mesh(mergeGeometries(openG), faceMat), faceShut = new THREE.Mesh(mergeGeometries(shutG), faceMat); faceShut.visible = false; head.add(faceOpen, faceShut);
    let anim = null;
  if (sleepMouth === 'drool') { anim = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), new THREE.MeshBasicMaterial({ color: 0xcfefff, transparent: true, opacity: 0.75 })); anim.position.set(0.08, -0.25, fz + 0.02); }
  if (sleepMouth === 'mumble') { anim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.05, 0.03), new THREE.MeshBasicMaterial({ color: MOUTH })); anim.position.set(0, -0.23, fz); }
  if (anim) { anim.visible = false; head.add(anim); }
  head.children.forEach(m => { m.rotation.set(0.03, 0, 0.04); m.position.z += 0.04; }); /* head sits forward, tilted & dropped (hunched idle) */
  // invisible fat hit-box
  const hit = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 2.6, 8), new THREE.MeshBasicMaterial({ visible: false })); hit.position.y = 1.3; hit.userData.chibi = root; root.add(hit);
  [root, body, head, armL, armR, legL, legR].forEach(o => { o.userData.dynamic = true; });
  // held props (toggled by the behaviour system)
  const P = (geo, c) => new THREE.Mesh(geo, toonMat(c)); const handY = -0.52;
  const cup = new THREE.Group(); cup.add(P(new THREE.CylinderGeometry(0.11, 0.09, 0.22, 8), 0xffffff)); const liq = P(new THREE.CylinderGeometry(0.095, 0.095, 0.02, 8), 0x6b4226); liq.position.y = 0.1; cup.add(liq); cup.position.set(0, handY, 0.1); armR.add(cup);
  const spinner = new THREE.Group(); for (let i = 0; i < 3; i++) { const lobe = P(new THREE.CylinderGeometry(0.09, 0.09, 0.04, 8), 0xff5d8f); const a = i / 3 * 6.28; lobe.position.set(Math.cos(a) * 0.12, 0, Math.sin(a) * 0.12); spinner.add(lobe); }
  spinner.add(P(new THREE.CylinderGeometry(0.05, 0.05, 0.05, 8), 0x2b2d42)); spinner.position.set(0, handY - 0.05, 0.08); armR.add(spinner);
  const pencil = P(new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), 0xffd36a); pencil.rotation.x = 1.2; pencil.position.set(0, handY, 0.12); armR.add(pencil);
  const book = new THREE.Group(); book.add(P(new THREE.BoxGeometry(0.7, 0.06, 0.5), 0x4f6fb3)); const pg = P(new THREE.BoxGeometry(0.64, 0.07, 0.46), 0xfdf7ea); pg.position.y = 0.01; book.add(pg); book.rotation.x = -0.9; book.position.set(0, 0.95, 0.6); body.add(book);
  const pad = P(new THREE.BoxGeometry(0.6, 0.04, 0.45), 0xfdf7ea); pad.rotation.x = -0.6; pad.position.set(0, 0.85, 0.62); body.add(pad);
  const ctrl = new THREE.Group(); ctrl.add(P(new THREE.BoxGeometry(0.5, 0.1, 0.24), 0x5a5f7a)); [-0.18, 0.18].forEach(x => { const gp = P(new THREE.BoxGeometry(0.18, 0.12, 0.2), 0x5a5f7a); gp.position.set(x, 0, 0.06); ctrl.add(gp); });
  ctrl.rotation.x = -0.5; ctrl.position.set(0, 0.8, 0.62); body.add(ctrl);
  const props = { cup, liq, spinner, pencil, book, pad, ctrl }; Object.values(props).forEach(o => { if (o !== liq) o.visible = false; });
  root.userData.parts = { body, head, armL, armR, legL, legR }; root.userData.hit = hit; root.userData.props = props; root.userData.atlas = cv;
  let asleep = false; root.userData.setSleepFace = on => { if (on === asleep) return; asleep = on; faceOpen.visible = !on; faceShut.visible = on; if (anim) anim.visible = on; };
  root.userData.sleepAnim = (t, ph) => { if (!anim) return;
    if (sleepMouth === 'drool') { const u = ((t + ph * 7) % 9) / 9, gk = u < 0.6 ? 0.25 + u / 0.6 * 0.95 : u < 0.63 ? 1.4 : 0.15; anim.scale.setScalar(gk); }
    else { const on = Math.sin(t * 0.45 + ph) > 0.55; anim.scale.y = on ? 0.4 + Math.abs(Math.sin(t * 9)) * 1.2 : 0.4; } };
  return root;
}
export const LOOKS = { Calvin: { hair: 0x3b2a22, shirt: 0x2f4f86, pants: 0x3a3a48, skin: 0xffdcc2 } };
