import * as THREE from 'three';
import { RING, ringVerts, lerpRingParams } from './rings.js';
import { PRODUCT_TIERS, PRODUCT_ZONES } from '../data.js';
import { CUT } from './materials.js';

// Scene 7: the plan becomes the ladder. Every product on p45 is sampled as
// tiles from the plan band where it lives; tiles rise out of the bowl, then
// fly into their tier of a stepped pyramid. One tile = SEATS_PER_TILE seats
// (tiers with no seat count on p45 — GA+ — get a fixed token count).
export const SEATS_PER_TILE = 60;
const TILE = 7;

// Pyramid tiers bottom-up (p45 order is top-down A..GA).
const STACK = ['GA', 'GA+', 'D', 'C', 'B', 'A'];
const SIZE = { GA: 300, 'GA+': 262, D: 222, C: 176, B: 128, A: 70 };
const HEIGHT = { GA: 50, 'GA+': 14, D: 42, C: 30, B: 38, A: 26 };
export const GAP = 10;

function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

const R = (n) => RING(n);
function bandRings(band) {
  const UB_in = lerpRingParams(R('C_out'), R('CS_out'), 0.15);
  switch (band) {
    case 'lower': return [R('LB_in_new'), R('LB_out_new'), 12];
    case 'loge': return [R('LB_out_new'), R('LS_out'), 30];
    case 'club': return [R('LS_out'), R('C_out'), 65];
    case 'suites': return [R('C_out'), R('CS_out'), 80];
    case 'suitesUpper': return [UB_in, lerpRingParams(UB_in, R('UB_out'), 0.2), 92];
    case 'upper': return [UB_in, R('UB_out'), 108];
    case 'terrace': return [lerpRingParams(UB_in, R('UB_out'), 0.75), R('UB_out'), 140];
    case 'field': return [lerpRingParams(R('LB_in_new'), R('LB_in_new'), 0), lerpRingParams(R('LB_in_new'), R('LB_out_new'), 0.1), 0];
    default: return null;
  }
}

function samplePoint(zone, rand) {
  if (zone.band === 'boardN') {
    const north = rand() < 0.5;
    return new THREE.Vector3((north ? -1 : 1) * (330 + rand() * 90), 70 + rand() * 80, -100 + rand() * 200);
  }
  if (zone.band === 'plaza') return new THREE.Vector3(400 + rand() * 60, 2, -90 + rand() * 180);
  const [inner, outer, y] = bandRings(zone.band);
  const segs = zone.segs === 'all' ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : zone.segs;
  const s = segs[Math.floor(rand() * segs.length)];
  const [u0, u1] = zone.span || [0, 1];
  const [t0, t1] = zone.rows || [0, 1];
  const u = u0 + (u1 - u0) * rand();
  const t = t0 + (t1 - t0) * rand();
  const A = ringVerts(inner), B = ringVerts(outer);
  const a = A[s], b = A[(s + 1) % 12], c = B[s], d = B[(s + 1) % 12];
  const pi = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
  const po = [c[0] + (d[0] - c[0]) * u, c[1] + (d[1] - c[1]) * u];
  return new THREE.Vector3(pi[0] + (po[0] - pi[0]) * t, y + t * 10, pi[1] + (po[1] - pi[1]) * t);
}

export function buildLadder() {
  const rand = rng(45);
  const group = new THREE.Group();
  const tiers = {};
  let y = 0;
  for (const k of STACK) {
    tiers[k] = { y0: y, y1: y + HEIGHT[k], size: SIZE[k] };
    y += HEIGHT[k] + GAP;
  }
  const top = y - GAP;

  // solid slabs (fade in as their tiles land)
  const slabs = {};
  for (const t of PRODUCT_TIERS) {
    const T = tiers[t.tier];
    const geo = new THREE.BoxGeometry(T.size, T.y1 - T.y0, T.size);
    geo.translate(0, (T.y0 + T.y1) / 2, 0);
    const mat = new THREE.MeshStandardMaterial({ color: t.color, roughness: 0.75, transparent: true, opacity: 0, clippingPlanes: [CUT] });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    const edge = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: '#0B2B2F', transparent: true, opacity: 0 }));
    group.add(mesh, edge);
    slabs[t.tier] = { mesh, edge, mat, T };
  }

  // tiles
  const tiles = [];
  for (const t of PRODUCT_TIERS) {
    const T = tiers[t.tier];
    const n = t.seats ? Math.max(4, Math.round(t.seats / SEATS_PER_TILE)) : 60;
    // target grid on the slab: fill layer by layer from the outside in
    const cells = [];
    const per = Math.floor(T.size / TILE);
    const layers = Math.max(1, Math.floor((T.y1 - T.y0) / TILE));
    for (let l = 0; l < layers; l++) for (let i = 0; i < per; i++) for (let j = 0; j < per; j++) cells.push([l, i, j]);
    cells.sort((p, q) => p[0] - q[0] || rand() - 0.5);
    const products = t.products;
    for (let i = 0; i < n; i++) {
      const prod = products[i % products.length];
      const zone = PRODUCT_ZONES[prod];
      const from = samplePoint(zone, rand);
      const [l, ci, cj] = cells[Math.floor((i / n) * cells.length)];
      const to = new THREE.Vector3(-T.size / 2 + (ci + 0.5) * (T.size / per), T.y0 + (l + 0.5) * TILE, -T.size / 2 + (cj + 0.5) * (T.size / per));
      tiles.push({ from, to, tier: t.tier, color: new THREE.Color(t.color), delay: rand() });
    }
  }
  const geo = new THREE.BoxGeometry(TILE * 0.82, TILE * 0.82, TILE * 0.82);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.7, clippingPlanes: [CUT] });
  const inst = new THREE.InstancedMesh(geo, mat, tiles.length);
  tiles.forEach((tl, i) => inst.setColorAt(i, tl.color));
  inst.castShadow = true;
  inst.frustumCulled = false;
  group.add(inst);

  const tierOrder = STACK; // build from the base up
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  // progress per tier: rise (0..1, out of the plan), fly (0..1, into the pyramid)
  function update(state) {
    tiles.forEach((tl, i) => {
      const ti = tierOrder.indexOf(tl.tier);
      const rise = state.rise;
      const fly = THREE.MathUtils.clamp((state.fly * (tierOrder.length + 1.2) - ti - tl.delay * 0.9) / 1.0, 0, 1);
      const e = fly < 0.5 ? 4 * fly ** 3 : 1 - (-2 * fly + 2) ** 3 / 2;
      p.copy(tl.from);
      p.y += rise * 18 * (0.6 + tl.delay * 0.8);
      const lifted = p.clone();
      p.lerpVectors(lifted, tl.to, e);
      p.y += Math.sin(e * Math.PI) * 70;
      q.identity();
      const sc = THREE.MathUtils.clamp(state.tiles, 0, 1) * (1 - 0.15 * Math.sin(e * Math.PI));
      s.set(sc, sc, sc);
      inst.setMatrixAt(i, m4.compose(p, q, s));
    });
    inst.instanceMatrix.needsUpdate = true;
    for (const k of tierOrder) {
      const ti = tierOrder.indexOf(k);
      const f = THREE.MathUtils.clamp(state.fly * (tierOrder.length + 1.2) - ti - 1.1, 0, 1);
      slabs[k].mat.opacity = f * state.solid;
      slabs[k].edge.material.opacity = f * state.solid * 0.9;
      slabs[k].mesh.visible = f * state.solid > 0.001;
    }
    inst.visible = state.tiles > 0.001;
  }
  return { group, update, tiers, top, slabs, tileCount: tiles.length };
}
