// v16 townsfolk: 13 generic chibis on the high-street island — six shopkeepers/baristas at their counters or doorways, three
// people sitting at the café / bistro terrace tables, two window-shoppers, and two strollers walking waypoint loops (with
// window-shopping stops) laid out clear of every collider (checked by islandtest.mjs). Daytime only (08:00–19:30).
// Cheap: each NPC is built with the regular chibi builder (coarse sculpt, `lo`), then its six rig parts are collapsed into ONE
// skinned fill + ONE skinned outline + ONE skinned face mesh driven by the original part groups as bones (3 draws, ~3.5k tris).
// They are frustum-culled per mesh and hidden entirely when the camera is far from the island (overview).
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { makeChibi } from './chibi.js';
import { applyPose, SEAT_CHAIR } from './behavior.js';
import { STREET, STREET_PROPS, SHOP_BLDG, SHOP, AWN, shopFront, CAFE } from './layout.js';

function skinify(root) { // root must be un-parented at identity
  root.updateMatrixWorld(true); const P = root.userData.parts, bones = [P.body, P.head, P.armL, P.armR, P.legL, P.legR], cats = { fill: [], out: [], face: [] }, mats = {};
  bones.forEach((bn, i) => bn.children.slice().forEach(m => { if (!m.isMesh) return; const mt = m.material;
    const cat = mt.map ? 'fill' : mt.side === THREE.BackSide ? 'out' : (bn === P.head && mt.vertexColors && m.visible) ? 'face' : null; if (!cat) return;
    const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let k = 0; k < n; k++) { si[k * 4] = i; sw[k * 4] = 1; } g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4)); g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
    cats[cat].push(g); mats[cat] = mt; bn.remove(m); }));
  const sk = new THREE.Skeleton(bones), meshes = [];
  for (const [cat, list] of Object.entries(cats)) { if (!list.length) continue; const sm = new THREE.SkinnedMesh(mergeGeometries(list), mats[cat]); if (cat === 'out') { sm.renderOrder = 2; sm.raycast = () => {}; }
    root.add(sm); root.updateMatrixWorld(true); sm.bind(sk, new THREE.Matrix4()); meshes.push(sm); }
  root.remove(root.userData.hit); return meshes; }

const HAIRS = [0x2b2220, 0x6a4a32, 0xc89a5a, 0x3b2a22, 0x8a5a44, 0x1e1e2a, 0xb8b0a8, 0x5a3a2a];
const SHIRTS = [0xe07a6a, 0x6a9ad0, 0x8ac48a, 0xf2c46a, 0xb08ad0, 0xf29aa6, 0x5ab8b0, 0xd0a070, 0x7a86c8, 0xe8e0d0];
const PANTS = [0x3a3a48, 0x4a5a7a, 0x6a5a48, 0x2f3a30, 0x7a6a8a, 0x3a4a5a];
const SKINS = [0xffdcc2, 0xf0c4a6, 0xd9a07a, 0xb8805a, 0xf6d0b4, 0x8a5a3a];
const STYLES = ['Calvin', 'Pixel', 'Jun', 'Sage', 'Mika'];
const KEEPER_POSE = { clothes: 'wave', gadgets: 'type', computers: 'think', cafe: 'type', stationery: 'nod', bistro: 'nod' };
const ROW = AWN.out + 0.55, NZ = STREET.z - STREET.front + ROW + 0.0, SZ = STREET.z + STREET.front - ROW; // window-shopping line (clear of the shop colliders)
// stroller loops: [x, z, pause s, facing while paused]
export const NPC_LOOPS = [ // lanes z 9 / 13 either side of the centre planters; stops in front of shop windows
  [[22.3, 9], [48.7, 9], [48.7, NZ, 4, Math.PI], [48.7, 9], [51, 9], [51, 13], [39.9, 13], [39.9, SZ, 3.5, 0], [39.9, 13], [22.3, 13]],
  [[51, 13], [36.4, 13], [36.4, NZ, 3, Math.PI], [36.4, 9], [29.1, 9], [29.1, NZ, 4, Math.PI], [29.1, 9], [22.3, 9], [22.3, 13], [51, 13]]];
export function makeNPCs(scene, keepers) {
  const grp = new THREE.Group(); grp.name = 'townsfolk'; scene.add(grp); const npcs = []; let n = 0;
  const staff = new THREE.Group(); staff.name = 'cafeStaff'; scene.add(staff); // v26 café barista: own group, own visibility
  const mk = (spec, into = grp, look = {}) => { const k = n++, c = makeChibi({ name: 'Townie' + k, role: 'Townsfolk', style: STYLES[(k * 3 + 1) % 5], lo: true, hair: HAIRS[k % HAIRS.length], shirt: SHIRTS[(k * 7 + 2) % SHIRTS.length], pants: PANTS[(k * 5) % PANTS.length], skin: SKINS[(k * 3) % SKINS.length], ...look });
    skinify(c); c.scale.setScalar([1.02, 1.08, 0.96, 1.04, 1.0][k % 5]); into.add(c); const o = { c, k, b: { cup: [0x6b4226, 0xc9a07a, 0x8a3a3a][k % 3] }, ...spec };
    if (o.loop) { o.seg = 0; o.wait = 0; o.ph = 0; const [x, z] = o.loop[o.start || 0]; o.seg = o.start || 0; c.position.set(x, 0, z); } else { c.position.set(o.pos[0], o.seat ?? 0, o.pos[1]); c.rotation.y = o.rot; }
    npcs.push(o); return o; };
  keepers.forEach(kp => mk({ role: 'keeper', kind: kp.kind, pos: [kp.x, kp.z], rot: kp.rot, pose: KEEPER_POSE[kp.kind] }));
  const tables = STREET_PROPS.filter(p => p[3] === 'table');
  [[0, -1], [1, 1], [2, 1]].forEach(([ti, s], i) => { const [x, z] = tables[ti]; mk({ role: 'diner', pos: [x + s * 0.6, z], rot: s < 0 ? Math.PI / 2 : -Math.PI / 2, seat: SEAT_CHAIR + 0.04, pose: i === 2 ? 'nod' : 'sip' }); });
  const sb = k => SHOP_BLDG.find(s => s.kind === k);
  [['gadgets', 1.25, 'look'], ['stationery', 0.9, 'think']].forEach(([kind, off, pose]) => { const b = sb(kind), [x, z] = shopFront(b, b.d / 2 + ROW, off); mk({ role: 'browser', pos: [x, z], rot: b.ry + Math.PI, pose }); });
  mk({ role: 'stroller', loop: NPC_LOOPS[0], start: 0, speed: 1.15 }); mk({ role: 'stroller', loop: NPC_LOOPS[1], start: 0, speed: 1.0 });
  // v26 barista: shuttles behind the café counter between the espresso machine and the register (pausing to work at each)
  { const bz = CAFE.barista[1], z0 = CAFE.counter[1] + 0.35; const b = mk({ role: 'barista', loop: [[CAFE.counter[0] + 1.0, bz, 7, 0], [CAFE.counter[2] - 0.35, bz, 5, 0]], start: 1, speed: 0.8, waitPose: 'type', group: 'staff' }, staff, { name: 'Barista', shirt: 0x6e4129, hair: 0x3b2a22 });
    b.c.userData.barista = true; staff.userData.npc = b; void z0; }
  const C = new THREE.Vector3(SHOP.cx, 0, SHOP.cz), CC = new THREE.Vector3((CAFE.x0 + CAFE.x1) / 2, 0, (CAFE.z0 + CAFE.z1) / 2);
  function update(dt, t, hour, camera) {
    staff.visible = hour >= 7 && hour < 21 && (window.__cafe?.visible ?? true) && camera.position.distanceTo(CC) < 40; // perf: a speck from the overview
    const on = hour >= 8 && hour < 19.5 && camera.position.distanceTo(C) < 54; grp.visible = on;
    for (const o of npcs) { if (!(o.group === 'staff' ? staff.visible : on)) continue; const c = o.c; let pose = o.pose || 'stand', tt = t + o.k * 1.7;
      if (o.loop) { const L = o.loop; if (o.wait > 0) { o.wait -= dt; pose = o.waitPose || 'look'; c.rotation.y = L[o.seg][3]; }
        else { const nx = (o.seg + 1) % L.length, [tx, tz] = L[nx], dx = tx - c.position.x, dz = tz - c.position.z, d = Math.hypot(dx, dz), st = o.speed * dt;
          if (d <= st) { c.position.x = tx; c.position.z = tz; o.seg = nx; if (L[nx][2]) o.wait = L[nx][2]; } else { c.position.x += dx / d * st; c.position.z += dz / d * st; const r = Math.atan2(dx, dz); c.rotation.y += Math.atan2(Math.sin(r - c.rotation.y), Math.cos(r - c.rotation.y)) * Math.min(1, dt * 8); }
          pose = 'walk'; tt = t * 0.75 + o.k; } }
      applyPose(c, pose, tt, dt, o.seat != null, o.b); } }
  return { group: grp, staff, npcs, update };
}
