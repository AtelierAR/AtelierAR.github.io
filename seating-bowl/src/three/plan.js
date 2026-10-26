import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { RING, ringVerts, samplePath, blend, ALL, segRuns } from './rings.js';
import { planMaterial } from './materials.js';
import { C } from '../palette.js';

// Flat plan graphics for scenes 1 and 8, colour-coded like p37 / p42. Each band
// is a strip between two rings over a set of segments (optionally a sub-span
// of the band depth t0..t1 and of the segment length u0..u1).
function bandGeometry(inner, outer, segs, o = {}) {
  const runs = segRuns(segs);
  if (runs.length === 1) return bandRun(inner, outer, runs[0], o);
  return mergeGeometries(runs.map((r) => bandRun(inner, outer, r, o)));
}

function bandRun(inner, outer, segs, { t0 = 0, t1 = 1, u0 = 0, u1 = 1, k = 10 } = {}) {
  const A = samplePath(ringVerts(inner), segs, k), B = samplePath(ringVerts(outer), segs, k);
  const pa = blend(A, B, t0), pb = blend(A, B, t1);
  const keep = (p) => segs.length === 12 || (p.u >= u0 - 1e-6 && p.u <= u1 + 1e-6) || (u0 === 0 && u1 === 1);
  const idx = pa.map((p, i) => i).filter((i) => keep(pa[i]));
  const pos = [];
  const n = pa.length;
  const loop = A.closed;
  const count = loop ? idx.length : idx.length - 1;
  for (let c = 0; c < count; c++) {
    const i = idx[c], j = idx[(c + 1) % idx.length];
    if (!loop && j !== i + 1) continue;
    const a = pa[i], b = pa[j % n], cc = pb[j % n], d = pb[i];
    pos.push(a.x, 0, a.z, b.x, 0, b.z, cc.x, 0, cc.z, a.x, 0, a.z, cc.x, 0, cc.z, d.x, 0, d.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

// Aisle / section dividers: radial ticks between two rings.
function dividers(inner, outer, every = 3, k = 12) {
  const A = samplePath(ringVerts(inner), ALL, k), B = samplePath(ringVerts(outer), ALL, k);
  const pos = [];
  for (let i = 0; i < A.pts.length; i += every) {
    pos.push(A.pts[i].x, 0, A.pts[i].z, B.pts[i].x, 0, B.pts[i].z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return g;
}

function rect(x0, x1, z0, z1) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x0, 0, z0, x1, 0, z0, x1, 0, z1, x0, 0, z0, x1, 0, z1, x0, 0, z1], 3));
  return g;
}

export function buildPlans() {
  const LB_in = RING('LB_in'), LB_out = RING('LB_out'), LS_out = RING('LS_out');
  const C_out = RING('C_out'), CS_out = RING('CS_out'), UB_out = RING('UB_out');
  const LB_in_new = RING('LB_in_new'), LB_out_new = RING('LB_out_new');
  const inner0 = { ...LB_in, xs: 1, zs: 1, xm: 2, zm: 1, xeN: 3, xeS: 3, ze: 1 };

  function makePlan(spec) {
    const group = new THREE.Group();
    const rings = [];
    spec.forEach(([ring, hex, geo], i) => {
      const mat = planMaterial(hex);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 10 + i;
      mesh.frustumCulled = false;
      group.add(mesh);
      rings.push({ ring, mesh, mat });
    });
    return { group, bands: rings };
  }

  const P = C.plan37;
  const p37 = makePlan([
    ['apron', P.apron, bandGeometry(inner0, LB_in, ALL)],
    ['lower', P.bowl, bandGeometry(LB_in, LB_out, ALL)],
    ['club', P.loge, bandGeometry(LB_out, LS_out, [0, 1, 2, 3, 7, 8, 9, 10])],
    ['club', P.mezz, bandGeometry(LB_out, LS_out, [4, 5, 6])],
    ['club', P.rzs, bandGeometry(LB_out, LS_out, [11])],
    ['club', P.club, bandGeometry(LS_out, C_out, [0, 1, 2, 3, 4, 6, 7, 8, 9, 10])],
    ['suites', P.suites, bandGeometry(C_out, CS_out, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])],
    ['suites', P.press, bandGeometry(C_out, CS_out, [8], { u0: 0.42, u1: 0.78 })],
    ['upper', P.bowl, bandGeometry(CS_out, UB_out, ALL)],
    ['upper', P.terrace, bandGeometry(CS_out, UB_out, [0], { t0: 0, t1: 0.35 })],
    ['upper', P.terrace, bandGeometry(LB_out, LS_out, [7], { t0: 0, t1: 1, u0: 0, u1: 0.5 })],
  ]);
  const Q = C.plan42;
  const nb = (x0, x1) => rect(Math.min(x0, x1), Math.max(x0, x1), -107, 107);
  const p42 = makePlan([
    ['apron', Q.apron, bandGeometry(inner0, LB_in_new, ALL)],
    ['lower', Q.lower, bandGeometry(LB_in_new, LB_out_new, ALL)],
    ['club', Q.loge, bandGeometry(LB_out_new, LS_out, [0, 1, 2, 3, 4, 6, 7, 8, 9, 10])],
    ['club', Q.club, bandGeometry(LS_out, C_out, [0, 1, 2, 3, 4, 6, 7, 8, 9, 10])],
    ['suites', Q.pres, bandGeometry(LB_out_new, LS_out, [2, 8], { u0: 0.25, u1: 0.75, t0: 0.55, t1: 1 })],
    ['suites', Q.suites, bandGeometry(C_out, CS_out, [0, 1, 2, 3, 4, 6, 7, 8, 9, 10])],
    ['upper', Q.upper, bandGeometry(CS_out, UB_out, [2, 3, 7, 8])],
    ['upper', Q.upperDark, bandGeometry(CS_out, UB_out, [0, 1, 9, 10], { t0: 0.2 })],
    ['upper', '#F3FAFC', nb(-320, -441)],
    ['upper', '#F3FAFC', nb(315, 430)],
  ]);
  // VIDEOBOARD CLUB outlines (p42 cyan boxes)
  const boardLine = new THREE.LineBasicMaterial({ color: Q.board, transparent: true, depthTest: false });
  for (const [x0, x1] of [[-320, -441], [315, 430]]) {
    const pts = [[x0, -107], [x1, -107], [x1, 107], [x0, 107]].map(([x, z]) => new THREE.Vector3(x, 0, z));
    const ln = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts), boardLine);
    ln.renderOrder = 45; ln.frustumCulled = false;
    p42.group.add(ln);
  }
  p42.boardLine = boardLine;
  // section dividers drawn white over the bowl bands
  const divMat = new THREE.LineBasicMaterial({ color: '#FFFFFF', transparent: true, opacity: 0.85, depthTest: false });
  const div37 = new THREE.LineSegments(dividers(LB_in, LB_out, 3), divMat);
  const div37b = new THREE.LineSegments(dividers(CS_out, UB_out, 3), divMat);
  const div42 = new THREE.LineSegments(dividers(LB_in_new, LB_out_new, 3), divMat);
  const div42b = new THREE.LineSegments(dividers(CS_out, UB_out, 3), divMat);
  for (const d of [div37, div37b, div42, div42b]) { d.renderOrder = 40; d.frustumCulled = false; }
  p37.group.add(div37, div37b);
  p42.group.add(div42, div42b);
  p37.dividers = [div37, div37b];
  p42.dividers = [div42, div42b];
  return { p37, p42, divMat };
}
