// Planar roof wing: sloped top carrying the PV array on a structural space frame, very thin
// leading edges (~2.5 ft fascia), aluminium soffit band and a 316 stainless mirror field on
// the underside (p22, p24-29, p34-35).
//
// Plan = skewed quad (the wings flare toward the stadium ends, p26-29):
//   A inner-mid, B outer-mid, C outer-end, D inner-end. Bilinear (u: inner->outer, v: mid->end).
// Height plane: y = y0 + gIn*(xout - |x|) + gz*|z|  -> rises toward the field edge and toward
// the ends, so the high point is the inner end corner (the "blade" tip on p27-29).
import * as THREE from 'three';
import { KitPart } from './builder.js';
import { FT, LAYOUT, PAL } from '../data.js';
import { MAT } from '../materials.js';

export function wingCorners(o) {
  const sx = o.side, sz = o.end;
  return [[sx * o.xin, 0], [sx * o.xout, 0], [sx * o.xout, sz * o.zEndOut], [sx * o.xin, sz * o.zEndIn]];
}
export const wingHeight = (o) => (x, z) => o.y0 + o.gIn * (o.xout - Math.abs(x)) + o.gz * Math.abs(z);
function bilinear([A, B, C, D]) {
  return (u, v) => [
    (A[0] + (B[0] - A[0]) * u) * (1 - v) + (D[0] + (C[0] - D[0]) * u) * v,
    (A[1] + (B[1] - A[1]) * u) * (1 - v) + (D[1] + (C[1] - D[1]) * u) * v,
  ];
}

export class CanopyWing extends KitPart {
  constructor(o, { pvCells = null } = {}) {
    super('CanopyWing:' + o.id);
    this.o = o;
    const sx = o.side, sz = o.end;
    const h = wingHeight(o);
    this.height = h;
    this.normal = new THREE.Vector3(o.gIn * sx, 1, -o.gz * sz).normalize(); // top-surface normal
    const [A, B, C, D] = wingCorners(o);
    this.corners = [A, B, C, D];
    const bil = bilinear(this.corners);
    this.bil = bil;
    const fas = LAYOUT.fascia, dep = LAYOUT.wingDepth;
    const P = ([x, z], dy = 0) => [x, h(x, z) + dy, z];
    const b = this.b;

    b.quad('roof', P(A), P(D), P(C), P(B));
    // mirror field = quad scaled about the centroid so the band is exactly soffitShare (p22)
    const cen = [(A[0] + B[0] + C[0] + D[0]) / 4, (A[1] + B[1] + C[1] + D[1]) / 4];
    const k = Math.sqrt(1 - LAYOUT.soffitShare);
    const inset = ([x, z]) => [cen[0] + (x - cen[0]) * k, cen[1] + (z - cen[1]) * k];
    const [Ai, Bi, Ci, Di] = [A, B, C, D].map(inset);
    b.quad('reflective', P(Ai, -dep), P(Bi, -dep), P(Ci, -dep), P(Di, -dep));
    const ring = [[A, Ai], [B, Bi], [C, Ci], [D, Di]];
    for (let i = 0; i < 4; i++) {
      const [p, pi] = ring[i], [q, qi] = ring[(i + 1) % 4];
      b.quad('wingSoffit', P(p, -fas), P(q, -fas), P(qi, -dep), P(pi, -dep));
      b.quad('wingSoffit', P(q, 0), P(p, 0), P(p, -fas), P(q, -fas)); // fascia
    }

    // raking V-struts from the bowl rim to the inner zone of the wing (p34/p35)
    const rim = LAYOUT.bowl.rim;
    const zEnd = Math.min(o.zEndIn, o.zEndOut);
    const n = Math.max(2, Math.round(zEnd / 95));
    for (let i = 0; i <= n; i++) {
      const z = sz * (40 + ((zEnd - 110) * i) / n);
      const foot = [sx * (o.xin + 105), rim - 2, z];
      for (const dz of [-14, 14]) {
        const tx = sx * (o.xin + 34);
        this.strut(foot, [tx, h(tx, z + dz) - dep, z + dz], 1.6);
      }
      const bx = sx * (o.xin + 150);
      this.strut([sx * (o.xin + 118), rim + 4, z], [bx, h(bx, z) - dep, z], 1.4);
    }

    this.finish({ edgeAngle: 20 });
    this.children.filter((c) => c.isLineSegments && c.name.startsWith('reflective')).forEach((c) => (c.visible = false));
    this.meshes.reflective.receiveShadow = false;

    this.buildSpaceFrame(h, bil);
    if (pvCells) this.buildPV(h, pvCells);
  }

  // underside plane (for the live mirror)
  mirrorPlane(plane) {
    const o = this.o;
    const p = new THREE.Vector3(o.side * o.xout * FT, (o.y0 - LAYOUT.wingDepth) * FT, 0);
    return plane.setFromNormalAndCoplanarPoint(this.normal, p);
  }

  strut(a, c, r) {
    const A = new THREE.Vector3(...a).multiplyScalar(FT), C = new THREE.Vector3(...c).multiplyScalar(FT);
    const len = A.distanceTo(C);
    const g = new THREE.CylinderGeometry(r * FT, r * FT, len, 8, 1);
    g.translate(0, len / 2, 0);
    g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), C.clone().sub(A).normalize()));
    g.translate(A.x, A.y, A.z);
    this.b.add('steel', g);
  }

  // Space frame: top chords on a ~20 ft bilinear grid, bottom nodes at bay centres, diagonals.
  // Segments are sorted by distance from the stadium centre so a growing drawRange "draws" it.
  buildSpaceFrame(h, bil) {
    const o = this.o, dep = LAYOUT.wingDepth;
    const nu = Math.max(2, Math.round((o.xout - o.xin) / 20));
    const nv = Math.max(2, Math.round((o.zEndIn + o.zEndOut) / 2 / 20));
    const T = (u, v) => { const [x, z] = bil(u, v); return [x, h(x, z) - 0.4, z]; };
    const Bn = (u, v) => { const [x, z] = bil(u, v); return [x, h(x, z) - dep + 0.6, z]; };
    const segs = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
      const u = i / nu, v = j / nv, u1 = (i + 1) / nu, v1 = (j + 1) / nv;
      if (i < nu) segs.push([T(u, v), T(u1, v)]);
      if (j < nv) segs.push([T(u, v), T(u, v1)]);
      if (i < nu && j < nv) {
        const bc = Bn((u + u1) / 2, (v + v1) / 2);
        segs.push([T(u, v), bc], [T(u1, v), bc], [T(u, v1), bc], [T(u1, v1), bc]);
        if (i + 1 < nu) segs.push([bc, Bn((u1 + (i + 2) / nu) / 2, (v + v1) / 2)]);
        if (j + 1 < nv) segs.push([bc, Bn((u + u1) / 2, (v1 + (j + 2) / nv) / 2)]);
      }
    }
    const mid = (s) => Math.hypot((s[0][0] + s[1][0]) / 2, (s[0][2] + s[1][2]) / 2);
    segs.sort((a, b2) => mid(a) - mid(b2));
    const pos = new Float32Array(segs.length * 6);
    segs.forEach((s, i) => { pos.set([...s[0], ...s[1]].map((v) => v * FT), i * 6); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setDrawRange(0, 0);
    this.frameLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: PAL.lineGreen, transparent: true, opacity: 0.95, depthWrite: false }));
    this.frameLines.name = 'spaceframe';
    this.frameLines.frustumCulled = false;
    this.frameLines.visible = false;
    this.frameSegs = segs.length;
    this.add(this.frameLines);
  }

  setFrameProgress(p) {
    const n = Math.round(THREE.MathUtils.clamp(p, 0, 1) * this.frameSegs);
    this.frameLines.geometry.setDrawRange(0, n * 2);
    this.frameLines.visible = n > 0 && this.frameLines.material.opacity > 0.01;
  }

  // Instanced PV panels at the given cells: [{x, z, d}] (feet; d = metres from the ripple origin).
  buildPV(h, cells) {
    const geo = new THREE.BoxGeometry(4.4 * FT, 0.25 * FT, 7.4 * FT);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), this.normal);
    const mesh = new THREE.InstancedMesh(geo, MAT.materials.pv, cells.length);
    const dist = new Float32Array(cells.length);
    const m = new THREE.Matrix4(), one = new THREE.Vector3(1, 1, 1);
    cells.forEach((c, i) => {
      m.compose(new THREE.Vector3(c.x * FT, (h(c.x, c.z) + 1.1) * FT, c.z * FT), q, one);
      mesh.setMatrixAt(i, m);
      dist[i] = c.d;
    });
    geo.setAttribute('aDist', new THREE.InstancedBufferAttribute(dist, 1));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'pv';
    mesh.userData.cat = 'pv';
    this.pv = mesh;
    this.add(mesh);
  }
}

// Bilinear PV grid (~5 ft x 8 ft cells) over every wing, trimmed from the extreme tips so the
// total is exactly the published panel count (9,198, p22).
export function pvLayout(wings, total) {
  const all = [];
  for (const o of wings) {
    const bil = bilinear(wingCorners(o));
    const nu = Math.floor((o.xout - o.xin - 12) / 5), nv = Math.floor(((o.zEndIn + o.zEndOut) / 2 - 12) / 8);
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
      const u = 0.024 + (0.952 * (i + 0.5)) / nu, v = 0.01 + (0.98 * (j + 0.5)) / nv;
      const [x, z] = bil(u, v);
      all.push({ wing: o.id, x, z, d: Math.hypot(x, z) * FT });
    }
  }
  if (all.length < total) console.warn('PV layout short by', total - all.length);
  all.sort((a, b) => b.d - a.d);
  const keep = all.slice(Math.max(0, all.length - total));
  const byWing = {};
  for (const c of keep) (byWing[c.wing] ||= []).push(c);
  return byWing;
}
