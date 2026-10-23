// High-street island (v15): the plank bridge from the park lands on a paved street lined with six shops, each with its own
// silhouette, colour, sign and window display — Thread & Co. (clothes, where bots buy OOTD items), Gizmo Hub (gadgets),
// Byte Works (computers), Bean There (café), Paper Plane (stationery) and Little Bistro — plus outdoor tables, lamps, benches,
// planters and trees. All toon geometry bakes to 1 fill + 1 outline (+1 for unlit glass); the six painted signs share one
// canvas atlas on one merged mesh, and the lamp/string-light glows are one points draw — ~5 draw calls for the whole island.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { toonMesh, occPatch } from './toon.js';
import { bake } from './bake.js';
import { cast } from './shadows.js';
import { SHOP, BRIDGE2, SHOP_BLDG, SHOP_S, SHOP_L, SHOP_X, SHOP_SIDE, STREET, STREET_PROPS, STREET_TREE, LAMP_H, bridge2Y } from './layout.js';
import { SHOP_STOCK } from './chibi.js';
import { glowPoints } from './daycycle.js';
const B3 = (w, h, d) => new THREE.BoxGeometry(w, h, d), BX = (w, h, d) => { const g = new THREE.BoxGeometry(w, h, d); g.userData.soft = true; return g; }, // BX: crisp box, skips soften() (tri budget)
  CYL = (a, b, h, n = 8) => new THREE.CylinderGeometry(a, b, h, n, 1);
const LOOK = { // walls, roof/trim, accent, sign bg, sign ink
  clothes: [0xf6d3d6, 0xd9706f, 0xf29aa6, 0xfff4ee, 0xc4505e], gadgets: [0x8fd3cf, 0x3d6f8a, 0x54c2e0, 0x2f4f6a, 0xbff6ff],
  computers: [0xa3abcf, 0x4a5070, 0x7f8fe0, 0x2e3350, 0xffe38a], cafe: [0xf6e7c8, 0x8a5a36, 0xc98a5a, 0x6b4226, 0xfff0d4],
  stationery: [0xf7d774, 0x6f86c9, 0xf28a7a, 0xffffff, 0x3f5aa8], bistro: [0xd27b66, 0x3f6b4c, 0x5f9a68, 0x2f3a30, 0xf6eccc] };
function signAtlas() { // 2 x 4 grid of 512x128 boards
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const x = cv.getContext('2d');
  SHOP_BLDG.forEach((b, i) => { const [, , acc, bg, ink] = LOOK[b.kind], ox = (i % 2) * 512, oy = (i >> 1) * 128;
    x.fillStyle = '#' + new THREE.Color(bg).getHexString(); x.beginPath(); x.roundRect(ox + 6, oy + 6, 500, 116, 26); x.fill();
    x.lineWidth = 8; x.strokeStyle = '#' + new THREE.Color(acc).getHexString(); x.stroke();
    x.fillStyle = '#' + new THREE.Color(ink).getHexString(); x.font = '800 62px system-ui, "Trebuchet MS", sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
    x.fillText(b.name, ox + 256, oy + 58, 460); x.font = '700 22px system-ui, sans-serif'; x.globalAlpha = 0.8;
    x.fillText({ clothes: 'CLOTHING · KNITS · JACKETS', gadgets: 'PHONES · AUDIO · TOYS', computers: 'PCs · PARTS · REPAIRS', cafe: 'COFFEE · CAKES', stationery: 'PENS · PAPER · ART', bistro: 'LUNCH · DINNER' }[b.kind], ox + 256, oy + 102); x.globalAlpha = 1; });
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
export function makeShops(scene) {
  let seed = 77; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const g = new THREE.Group(), glows = [], signs = [], awnings = [], keepers = []; const add = (m, x, y, z, ry = 0, par = g) => { m.position.set(x, y, z); m.rotation.y = ry; par.add(m); return m; };
  const T = (geo, c, o) => toonMesh(geo, c, o), R = SHOP.r, cx = SHOP.cx, cz = SHOP.cz;
  // island lawn + layered cliff
  add(T(CYL(R, R - 0.4, 0.7, 36), 0x86cf5e), cx, -0.4, cz);
  let y = -0.75; [[R * 0.96, 1.5, 0xc9bca6], [R * 0.78, 1.9, 0xb5a690], [R * 0.5, 2.2, 0xc3b49c], [R * 0.24, 2.3, 0xa99a86]].forEach(([r, h, c], i, A) => {
    const geo = CYL(r, A[i + 1] ? A[i + 1][0] : 0.5, h, 14); const p = geo.attributes.position; for (let j = 0; j < p.count; j++) { const k = 0.9 + rnd() * 0.18; p.setX(j, p.getX(j) * k); p.setZ(j, p.getZ(j) * k); } geo.computeVertexNormals();
    add(T(geo, c), cx, y - h / 2, cz); y -= h * 0.92; });
  // street: paving, kerbs, east-end round plaza
  const SL = STREET.x1 - STREET.x0, SX = (STREET.x0 + STREET.x1) / 2;
  add(T(BX(SL, 0.05, STREET.front * 2), 0xeadfca, { outline: false }), SX, 0.025, STREET.z); // pavements up to the shop fronts
  add(T(BX(SL, 0.06, STREET.half * 2), 0xd9cbb2, { outline: false }), SX, 0.03, STREET.z); // street
  [-1, 1].forEach(s => add(T(BX(SL - 1.2, 0.08, 0.18), 0xbfae94, { outline: false }), SX + 0.3, 0.045, STREET.z + s * (STREET.half - 0.09)));
  for (let k = 0; k < 13; k++) add(T(BX(1.0, 0.065, 0.42), 0xe6dac4, { outline: false }), STREET.x0 + 1.6 + k * 2.55, 0.035, STREET.z + (k % 2 ? 0.55 : -0.55)); // centre-line stones
  SHOP_X.forEach(x => { for (let k = 0; k < 10; k++) add(T(BX(1.7, 0.066, 0.46), 0xfbf6ec, { outline: false }), x, 0.036, STREET.z - STREET.half + 0.55 + k * (STREET.half * 2 - 1.1) / 9); }); // zebra crossings shop-to-shop
  add(T(CYL(2.9, 2.9, 0.06, 18), 0xe2d5bd, { outline: false }), 53.6, 0.04, STREET.z); // east plaza
  // bridge (unchanged): planks along x following the sag, posts + rope rails
  const N = 28; for (let i = 0; i < N; i++) { const x = BRIDGE2.x0 + 0.35 + i * (BRIDGE2.deck1 - BRIDGE2.x0 - 0.7) / (N - 1), yy = bridge2Y(x) - 0.06;
    const pl = add(T(BX(0.3, 0.075, BRIDGE2.half * 2 + 0.1 - rnd() * 0.12), i % 2 ? 0xc48f5c : 0xb98250), x, yy, BRIDGE2.z + (rnd() - 0.5) * 0.06); pl.rotation.z = Math.atan2(bridge2Y(x + 0.2) - bridge2Y(x - 0.2), 0.4); }
  [-1, 1].forEach(sd => { const z = BRIDGE2.z + sd * BRIDGE2.half, pts = [];
    for (let i = 0; i <= 6; i++) { const x = BRIDGE2.s0 - 0.6 + i * (BRIDGE2.s1 - BRIDGE2.s0 + 1.2) / 6, yy = bridge2Y(x); add(T(BX(0.12, 1.05, 0.12), 0x8a5a36), x, yy + 0.47, z); pts.push(new THREE.Vector3(x, yy + 0.98, z)); }
    g.add(T(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.04, 4), 0xe0c48a, { outline: false })); });
  // ---- shops ----
  const glass = (w, h) => new THREE.Mesh(B3(w, h, 0.04), new THREE.MeshBasicMaterial({ color: 0xd6f1fb }));
  SHOP_BLDG.forEach((b, si) => { const [wall, trim, acc] = LOOK[b.kind], W = SHOP_L.W, D = SHOP_L.D, H = b.lh, F = D / 2, AY = 2.75, sg = new THREE.Group(); add(sg, b.x, 0, b.z, b.ry); sg.scale.setScalar(SHOP_S); // built in local units, scaled up
    const L = (m, x, y, z, ry = 0) => add(m, x, y, z, ry, sg);
    L(T(B3(W, H, D), wall), 0, H / 2, 0); L(T(BX(W + 0.12, 0.3, D + 0.12), trim), 0, 0.15, 0); // body + base course
    // ground floor stays chibi-sized (door 1.9 local = 2.5 world vs ~3 for a chibi incl. hair); the frontage + a second storey make the shop big
    L(T(BX(0.8, 1.9, 0.06), trim), -1.5, 1.05, F + 0.02); L(glass(0.5, 0.6), -1.5, 1.45, F + 0.06); L(T(BX(0.1, 0.1, 0.05), 0xe8c45a), -1.24, 1.0, F + 0.07); // door (glazed) + knob
    L(glass(2.3, 1.3), 0.75, 1.3, F + 0.02); L(T(BX(2.46, 0.1, 0.16), trim), 0.75, 0.6, F + 0.06); L(T(BX(2.46, 0.08, 0.08), trim), 0.75, 1.99, F + 0.04); [0.2, 1.3].forEach(x => L(T(BX(0.06, 1.3, 0.06), trim), x, 1.3, F + 0.05)); // shop window + sill + head + mullions
    const up = z => { L(T(BX(W + 0.06, 0.12, 0.12), trim), 0, 3.95, z * (F + 0.04)); [-1.5, 0, 1.5].forEach(x => { L(glass(0.82, 0.95), x, 4.75, z * (F + 0.02)); L(T(BX(0.98, 0.09, 0.14), trim), x, 4.22, z * (F + 0.05)); L(T(BX(0.98, 0.09, 0.08), trim), x, 5.27, z * (F + 0.03)); }); }; up(1); // first floor: string course + three sash windows
    const sY = AY + 0.62; signs.push([sg, 0, sY, F + 0.05, si]); L(T(BX(3.4, 0.86, 0.06), trim), 0, sY, F + 0.01);
    const aw = []; const A = m => (aw.push(m), m); // awning parts: measured for the clearance test (window.__awnings)
    const keeper = { x: -0.9, z: F + 0.3, ry: 0 }; // shopkeeper spot (local), moved behind the counter where there is one
    const counter = (c) => { L(T(BX(1.4, 0.72, 0.3), trim), 0.55, 0.36, F + 0.62); L(T(BX(1.5, 0.06, 0.38), c), 0.55, 0.75, F + 0.62); keeper.x = 0.55; keeper.z = F + 0.24; }; // sign backer
    const win = (m, x, yy, z = F + 0.11) => { m.children.slice().forEach(c => m.remove(c)); return L(m, x, yy, z); }; // display props: no outline hull (tris)
    if (b.kind === 'clothes') { // gable roof, striped awning, mannequins + folded stack in the window, side rack of stock tops
      const gr = (W + 0.3) / Math.sqrt(3), roof = L(T(CYL(gr, gr, D + 0.3, 3), trim), 0, H + 0.5 * gr * 0.36, 0); roof.rotation.set(-Math.PI / 2, 0, 0); roof.scale.set(1, 1, 0.36); // gable: apex up, ridge front-to-back
      for (let k = 0; k < 7; k++) { const a = A(L(T(BX(W / 7 + 0.01, 0.07, 0.75), k % 2 ? 0xfff4ee : acc), -W / 2 + W / 14 + k * W / 7, AY, F + 0.33)); a.rotation.x = 0.38; }
      const st = SHOP_STOCK.slice(0, 9); [0.12, 0.84].forEach((x, k) => { win(T(BX(0.34, 0.42, 0.18), st[k * 4][2].c), x, 1.2); win(T(BX(0.2, 0.2, 0.2), 0xe8e2d8, { outline: false }), x, 1.53); win(T(BX(0.04, 0.4, 0.04), 0x5a4a40, { outline: false }), x, 0.85); });
      [0, 1, 2].forEach(k => win(T(BX(0.26, 0.06, 0.16), st[k * 3 + 2][2].c, { outline: false }), 0.48, 0.76 + k * 0.065));
      const [r0, r1, r2, r3] = SHOP_SIDE[0], rk = new THREE.Group(); add(rk, (r0 + r2) / 2, 0, (r1 + r3) / 2, Math.PI / 2); rk.scale.setScalar(1.15); [-0.55, 0.55].forEach(s => add(T(BX(0.07, 1.4, 0.07), 0x5a4a40), s, 0.7, 0, 0, rk)); add(T(BX(1.2, 0.07, 0.07), 0x5a4a40), 0, 1.38, 0, 0, rk);
      st.filter((_, k) => k % 3 !== 1).slice(0, 5).forEach((s, k) => add(T(BX(0.2, 0.46, 0.06), s[2].c, { outline: false }), -0.44 + k * 0.22, 1.08, 0, 0, rk)); }
    if (b.kind === 'gadgets') { // flat roof w/ parapet, satellite dish + antenna, cyan canopy, phones + headphones on display
      L(T(BX(W + 0.2, 0.2, D + 0.2), trim), 0, H + 0.1, 0); const dish = L(T(CYL(0.42, 0.12, 0.14, 12), 0xeef2f4), 0.7, H + 0.62, -0.2); dish.rotation.set(-0.7, 0, 0.3); L(T(BX(0.08, 0.5, 0.08), 0x3a3d5c), 0.7, H + 0.36, -0.2);
      L(T(BX(0.05, 0.9, 0.05), 0x3a3d5c, { outline: false }), -0.9, H + 0.6, -0.4); L(T(BX(0.12, 0.12, 0.12), 0xff7a6a, { emissive: 0x802a20 }), -0.9, H + 1.08, -0.4);
      A(L(T(BX(W - 0.2, 0.08, 0.6), acc), 0, AY, F + 0.3)); counter(0x54c2e0);
      [0.02, 0.3, 0.58].forEach((x, k) => { win(T(BX(0.18, 0.32, 0.04), 0x2a2d40), x, 1.05); win(T(BX(0.14, 0.26, 0.02), [0x7fe0ff, 0xffb0e0, 0xb8f08a][k], { outline: false, emissive: 0x303030 }), x, 1.05, F + 0.14); });
      const hp = win(T(new THREE.TorusGeometry(0.15, 0.03, 4, 10, Math.PI), 0xf26a8a), 0.88, 1.18); [-1, 1].forEach(s => win(T(BX(0.08, 0.12, 0.08), 0xf26a8a), 0.88 + s * 0.15, 1.14)); void hp; }
    if (b.kind === 'computers') { // stepped roof + giant monitor sign, monitors + keyboard in the window
      L(T(BX(W + 0.16, 0.18, D + 0.16), trim), 0, H + 0.09, 0); L(T(BX(W - 0.8, 0.3, D - 0.8), wall), 0, H + 0.33, -0.1);
      L(T(BX(1.5, 0.95, 0.12), 0x2a2d40), 0, H + 1.15, 0.2); L(T(BX(1.3, 0.75, 0.04), 0x8fd8ff, { outline: false, emissive: 0x1a3a50 }), 0, H + 1.17, 0.27); L(T(BX(0.14, 0.4, 0.1), 0x2a2d40), 0, H + 0.6, 0.2);
      [0.66, 1.0].forEach((yy, k) => L(T(BX(0.8, 0.08, 0.02), k ? 0xffe38a : 0xffffff, { outline: false }), -0.1, H + yy + 0.66, 0.3));
      A(L(T(BX(W - 0.3, 0.08, 0.5), acc), 0, AY, F + 0.25));
      [0.18, 0.78].forEach(x => { win(T(BX(0.46, 0.34, 0.05), 0x2a2d40), x, 1.18); win(T(BX(0.4, 0.28, 0.02), 0x9ae6c8, { outline: false, emissive: 0x204030 }), x, 1.18, F + 0.14); win(T(BX(0.06, 0.16, 0.05), 0x2a2d40), x, 0.94); });
      win(T(BX(0.6, 0.04, 0.16), 0xe8e8f0, { outline: false }), 0.48, 0.74); }
    if (b.kind === 'cafe') { // brown roof cap + giant coffee cup on top, scalloped awning, cakes in the window
      L(T(BX(W + 0.24, 0.24, D + 0.24), trim), 0, H + 0.12, 0);
      L(T(CYL(0.42, 0.34, 0.7, 12), 0xfff8ee), 0.1, H + 0.6, 0.1); L(T(CYL(0.36, 0.36, 0.04, 12), 0x6b4226, { outline: false }), 0.1, H + 0.94, 0.1); L(T(new THREE.TorusGeometry(0.17, 0.05, 4, 10), 0xfff8ee), 0.55, H + 0.6, 0.1);
      L(T(CYL(0.58, 0.58, 0.05, 12), 0xc98a5a), 0.1, H + 0.27, 0.1);
      for (let k = 0; k < 6; k++) { const a = A(L(T(BX(W / 6 + 0.01, 0.07, 0.7), k % 2 ? 0xfff0d4 : 0x8a5a36), -W / 2 + W / 12 + k * W / 6, AY, F + 0.3)); a.rotation.x = 0.4; A(L(T(CYL(0.12, 0.12, 0.06, 8), k % 2 ? 0xfff0d4 : 0x8a5a36, { outline: false }), -W / 2 + W / 12 + k * W / 6, AY - 0.16, F + 0.62)); }
      counter(0xc98a5a);
      [0.08, 0.48, 0.88].forEach((x, k) => { win(T(CYL(0.12, 0.12, 0.14, 10), [0xf2c6d0, 0xf6e2a8, 0x9a6a4a][k]), x, 0.8); win(T(CYL(0.13, 0.13, 0.03, 10), 0xfff8ee, { outline: false }), x, 0.72); }); }
    if (b.kind === 'stationery') { // tall narrow facade with a giant pencil on the roof, notebooks + pencil cup in the window
      L(T(BX(W + 0.16, 0.18, D + 0.16), trim), 0, H + 0.09, 0);
      const pc = L(T(CYL(0.22, 0.22, 2.0, 6), 0xf7c64a), -0.15, H + 0.42, 0.2); pc.rotation.z = Math.PI / 2; const tip = L(T(CYL(0.0, 0.22, 0.42, 6), 0xf2d6b0), 1.06, H + 0.42, 0.2); tip.rotation.z = -Math.PI / 2;
      const er = L(T(CYL(0.22, 0.22, 0.28, 6), 0xf28a7a), -1.29, H + 0.42, 0.2); er.rotation.z = Math.PI / 2; L(T(BX(0.08, 0.3, 0.08), trim), -0.15, H + 0.22, 0.2);
      A(L(T(BX(W - 0.3, 0.08, 0.5), acc), 0, AY, F + 0.25)); L(glass(0.9, 0.4), 0, H - 0.3, F + 0.02);
      [0x6f86c9, 0xf28a7a, 0x8fc79a, 0xf7c64a].forEach((c, k) => win(T(BX(0.28, 0.07, 0.2), c, { outline: false }), 0.18, 0.76 + k * 0.07)); win(T(BX(0.22, 0.4, 0.04), 0x6f86c9), 0.6, 0.92); win(T(BX(0.22, 0.4, 0.04), 0xf28a7a), 0.86, 0.92);
      win(T(CYL(0.08, 0.08, 0.16, 8), 0x3a3d5c), 0.4, 0.8); [-0.03, 0.03].forEach((o, k) => win(T(BX(0.025, 0.22, 0.025), k ? 0xf28a7a : 0x6f86c9, { outline: false }), 0.4 + o, 0.95)); }
    if (b.kind === 'bistro') { // hipped green roof, green awning, string lights, chalkboard, bottles in the window
      const rk0 = W / 3, rf = L(T(CYL(0.9 * rk0, 2.15 * rk0, 0.8 * rk0, 4), trim), 0, H + 0.4 * rk0, 0); rf.rotation.y = Math.PI / 4; rf.scale.set(1, 1, 0.82);
      const ba = A(L(T(BX(W - 0.1, 0.08, 0.8), acc), 0, AY, F + 0.33)); ba.rotation.x = 0.3; A(L(T(BX(W - 0.1, 0.16, 0.04), 0xf6eccc, { outline: false }), 0, AY - 0.14, F + 0.7)); counter(0x5f9a68);
      [0.1, 0.32, 0.54, 0.76].forEach((x, k) => { win(T(CYL(0.05, 0.05, 0.3, 6), [0x3f6b4c, 0x7a2a3a, 0x3f6b4c, 0xc89a40][k]), x, 0.88); });
      for (let k = 0; k < 7; k++) glows.push(new THREE.Vector3(-W / 2 + 0.2 + k * (W - 0.4) / 6, AY + 0.3 - Math.sin(k / 6 * Math.PI) * 0.12, F + 0.75).multiplyScalar(SHOP_S).applyMatrix4(new THREE.Matrix4().makeRotationY(b.ry)).add(new THREE.Vector3(b.x, 0, b.z)));
      const [c0, c1, c2, c3] = SHOP_SIDE[1], cb = new THREE.Group(); add(cb, (c0 + c2) / 2, 0, (c1 + c3) / 2, Math.PI + 0.25); cb.scale.setScalar(1.2); add(T(BX(0.5, 0.7, 0.05), 0x2f3a30), 0, 0.55, 0, 0, cb); add(T(BX(0.56, 0.06, 0.08), 0x8a5a36), 0, 0.92, 0, 0, cb); add(T(BX(0.06, 0.3, 0.3), 0x8a5a36), 0, 0.15, -0.05, 0, cb); }
    if (b.ry) { // south row: its back faces the main camera — dress the rear like a second frontage (sign, windows, flower boxes)
      signs.push([sg, 0, sY, -F - 0.05, si, true]); L(T(BX(3.4, 0.86, 0.06), trim), 0, sY, -F - 0.01); up(-1);
      [-1.2, 1.2].forEach(x => { L(glass(0.8, 0.7), x, 1.25, -F - 0.02); L(T(BX(0.95, 0.1, 0.12), trim), x, 0.86, -F - 0.06); L(T(BX(0.9, 0.18, 0.22), 0xc98a5a), x, 0.74, -F - 0.14);
        [-0.28, 0, 0.28].forEach((o, k) => L(T(new THREE.DodecahedronGeometry(0.11, 0), [0xf28a7a, 0x7cbd62, 0xf7d774][k], { outline: false }), x + o, 0.88, -F - 0.16)); }); }
    sg.updateMatrixWorld(true); aw.forEach(m => awnings.push(new THREE.Box3().setFromObject(m)));
    const kp = new THREE.Vector3(keeper.x, 0, keeper.z).multiplyScalar(SHOP_S).applyAxisAngle(new THREE.Vector3(0, 1, 0), b.ry); keepers.push({ kind: b.kind, x: b.x + kp.x, z: b.z + kp.z, rot: b.ry });
    cast(b.x, b.z, b.w + 0.6, b.d + 0.6, b.ry); });
  // ---- street furniture ----
  STREET_PROPS.forEach(([x, z, , kind], k) => {
    if (kind === 'table') { const cafe = x < SHOP_X[1]; add(T(CYL(0.38, 0.38, 0.06, 10), cafe ? 0xfff8ee : 0xf6eccc), x, 0.72, z); add(T(BX(0.07, 0.7, 0.07), 0x3a3d5c), x, 0.36, z); add(T(CYL(0.22, 0.26, 0.04, 10), 0x3a3d5c, { outline: false }), x, 0.02, z);
      [-0.58, 0.58].forEach(o => { add(T(CYL(0.17, 0.17, 0.06, 8), cafe ? 0xc98a5a : 0x5f9a68, { outline: false }), x + o, 0.44, z); add(T(BX(0.05, 0.42, 0.05), 0x3a3d5c, { outline: false }), x + o, 0.21, z); });
      add(T(BX(0.04, 2.7, 0.04), 0xf6f0e4, { outline: false }), x, 2.05, z); add(T(CYL(0.02, 1.0, 0.34, 8), cafe ? (k % 2 ? 0xf29aa6 : 0xf6e2a8) : (k % 2 ? 0x5f9a68 : 0xf6eccc)), x, 3.5, z); // umbrella well above head height
      if (!cafe) { add(T(CYL(0.06, 0.06, 0.18, 6), 0x7a2a3a, { outline: false }), x + 0.1, 0.84, z); }
      add(T(CYL(0.07, 0.06, 0.08, 8), 0xfff8ee, { outline: false }), x - 0.12, 0.79, z + 0.06); cast(x, z, 1.5, 0.8); }
    if (kind === 'lamp') { add(T(BX(0.13, LAMP_H, 0.13), 0x3a3d5c), x, LAMP_H / 2, z); add(T(BX(0.34, 0.36, 0.34), 0xffe2a8), x, LAMP_H + 0.1, z); add(T(BX(0.42, 0.07, 0.42), 0x3a3d5c), x, LAMP_H + 0.31, z); add(T(BX(0.5, 0.05, 0.1), 0x3a3d5c), x, LAMP_H - 0.3, z); glows.push(new THREE.Vector3(x, LAMP_H + 0.1, z)); cast(x, z, 0.4, 0.4); }
    if (kind === 'planter') { add(T(BX(0.8, 0.42, 0.8), 0xc98a5a), x, 0.21, z); add(T(new THREE.DodecahedronGeometry(0.4, 0), [0x6fae5a, 0x7cbd62][k % 2]), x, 0.68, z); add(T(BX(0.1, 0.1, 0.1), [0xf28a7a, 0xf7d774][k % 2], { outline: false }), x + 0.2, 0.9, z + 0.18); cast(x, z, 0.9, 0.9); }
    if (kind === 'bench') { const ry = x > 52 ? -Math.PI / 2 : z < STREET.z ? 0 : Math.PI, bg = new THREE.Group(); add(bg, x, 0, z, ry); add(T(BX(1.3, 0.1, 0.42), 0xc48f5c), 0, 0.44, 0, 0, bg); add(T(BX(1.3, 0.34, 0.08), 0xc48f5c), 0, 0.72, -0.2, 0, bg);
      [-0.55, 0.55].forEach(s => add(T(BX(0.08, 0.42, 0.36), 0x3a3d5c), s, 0.2, 0, 0, bg)); cast(x, z, 1.4, 0.6); }
    if (kind === 'tree') { const Y = STREET_TREE.canopyY; add(T(BX(0.3, Y, 0.3), 0x8a5a36), x, Y / 2, z); add(T(new THREE.DodecahedronGeometry(STREET_TREE.canopyR, 0), 0x6fae5a), x, Y, z); add(T(new THREE.DodecahedronGeometry(0.62, 0), 0x86c466), x + 0.3, Y + 0.65, z - 0.2); cast(x, z, 1.8, 1.8); }
  });
  scene.add(g); bake(g);
  // signs: six boards from one atlas, merged into one mesh
  g.updateMatrixWorld(true); const atlas = signAtlas(), geos = signs.map(([sg, x, yy, z, i, back]) => { const p = new THREE.PlaneGeometry(3.24, 0.81), uv = p.attributes.uv, u0 = (i % 2) * 0.5, v0 = 1 - ((i >> 1) + 1) * 0.25;
    for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) * 0.5, v0 + uv.getY(k) * 0.25); if (back) p.rotateY(Math.PI); p.translate(x, yy, z); p.applyMatrix4(sg.matrixWorld); return p; });
  const sm = new THREE.Mesh(mergeGeometries(geos), occPatch(new THREE.MeshBasicMaterial({ map: atlas }))); sm.name = 'shopSigns'; scene.add(sm);
  glowPoints(scene, glows.map(v => [v.x, v.y, v.z]), { size: 50 });
  window.__awnings = awnings.map(b => ({ min: b.min.toArray(), max: b.max.toArray() })); g.userData.keepers = keepers;
  return g;
}
