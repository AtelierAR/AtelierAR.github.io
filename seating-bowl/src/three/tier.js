import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ringVerts, samplePath, blend, segRuns } from './rings.js';

// A seating tier swept between two plan rings: stepped treads/risers, a front
// fascia, an optional soffit, and seat rows as InstancedMesh strips (the fine
// parallel lines of the p55-59 renders).
//
// opts: { inner, outer, segs, k, rows, y0, y1, base, soffitTo, notch(rowIdx, i, n) }
export function buildTier(opts) {
  const runs = segRuns(opts.segs);
  if (runs.length === 1) return buildTierRun({ ...opts, segs: runs[0] });
  const parts = runs.map((segs) => buildTierRun({ ...opts, segs }));
  return {
    ...parts[0],
    geometry: mergeGeometries(parts.map((p) => p.geometry)),
    stripMatrices: parts.flatMap((p) => p.stripMatrices),
    seats: (...a) => parts.flatMap((p) => p.seats(...a)),
    profileAt: null,
  };
}

function buildTierRun(opts) {
  const { inner, outer, segs, k = 8, rows, y0, y1, base = y0 - 4, soffitTo = null, notch = null, rowFrom = 0 } = opts;
  const pa = samplePath(ringVerts(inner), segs, k);
  const pb = samplePath(ringVerts(outer), segs, k);
  const n = pa.pts.length;
  const closed = pa.closed;
  const at = (t) => blend(pa, pb, t);
  const yAt = (r) => y0 + ((y1 - y0) * r) / rows;
  const rowPaths = [];
  for (let r = 0; r <= rows; r++) rowPaths.push(at(r / rows));

  const pos = [];
  const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  const segCount = closed ? n : n - 1;
  const skip = (r, i) => notch && notch(r, i / (n - 1), n);

  for (let r = rowFrom; r < rows; r++) {
    const A = rowPaths[r], B = rowPaths[r + 1];
    const yf = yAt(r), yb = yAt(r + 1);
    for (let i = 0; i < segCount; i++) {
      if (skip(r, i)) continue;
      const j = (i + 1) % n;
      // riser
      quad([A[i].x, yf, A[i].z], [A[j].x, yf, A[j].z], [A[j].x, yb, A[j].z], [A[i].x, yb, A[i].z]);
      // tread
      quad([A[i].x, yb, A[i].z], [A[j].x, yb, A[j].z], [B[j].x, yb, B[j].z], [B[i].x, yb, B[i].z]);
    }
  }
  const F = rowPaths[rowFrom], Bk = rowPaths[rows];
  const yF = yAt(rowFrom);
  for (let i = 0; i < segCount; i++) {
    const j = (i + 1) % n;
    // front fascia down to base
    quad([F[i].x, base, F[i].z], [F[j].x, base, F[j].z], [F[j].x, yF, F[j].z], [F[i].x, yF, F[i].z]);
    // soffit (underside) from fascia bottom to the back of the tier
    if (soffitTo !== null && !skip(rows - 1, i)) {
      quad([F[i].x, base, F[i].z], [F[j].x, base, F[j].z], [Bk[j].x, soffitTo, Bk[j].z], [Bk[i].x, soffitTo, Bk[i].z]);
      quad([Bk[i].x, soffitTo, Bk[i].z], [Bk[j].x, soffitTo, Bk[j].z], [Bk[j].x, y1, Bk[j].z], [Bk[i].x, y1, Bk[i].z]);
    }
  }
  // open ends: close the stepped profile with a side wall
  if (!closed) {
    for (const i of [0, n - 1]) {
      for (let r = rowFrom; r < rows; r++) {
        const A = rowPaths[r][i], B = rowPaths[r + 1][i];
        const yb = yAt(r + 1);
        const lo = soffitTo !== null ? base + ((soffitTo - base) * (r + 1)) / rows : base;
        quad([A.x, lo, A.z], [B.x, lo, B.z], [B.x, yb, B.z], [A.x, yb, A.z]);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geometry.computeVertexNormals();

  // seat strips: one instance per row per polyline segment
  const mats = [];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  for (let r = rowFrom; r < rows; r++) {
    const S = at((r + 0.62) / rows);
    const y = yAt(r + 1) + 0.55;
    for (let i = 0; i < segCount; i++) {
      if (skip(r, i)) continue;
      const a = S[i], b = S[(i + 1) % n];
      const dx = b.x - a.x, dz = b.z - a.z;
      const len = Math.hypot(dx, dz);
      if (len < 0.01) continue;
      q.setFromAxisAngle(up, -Math.atan2(dz, dx));
      p.set((a.x + b.x) / 2, y, (a.z + b.z) / 2);
      s.set(len + 0.05, 1, 1);
      mats.push(m4.compose(p, q, s).clone());
    }
  }

  // closed section profile (u along the ring normal, v up) at path index i —
  // used for the poché at the 50-yard cut
  function profileAt(i) {
    const pts = [];
    const lo = soffitTo !== null ? soffitTo : base;
    pts.push([rowPaths[rowFrom][i].z, base], [rowPaths[rowFrom][i].z, yAt(rowFrom)]);
    for (let r = rowFrom; r < rows; r++) {
      pts.push([rowPaths[r][i].z, yAt(r + 1)], [rowPaths[r + 1][i].z, yAt(r + 1)]);
    }
    pts.push([rowPaths[rows][i].z, lo]);
    return pts;
  }

  return {
    geometry, stripMatrices: mats, rowPaths, yAt, rows, n, closed, profileAt,
    // seat positions for the crowd: every `step` ft along each row
    seats(step = 2.2, rowStep = 1) {
      const out = [];
      for (let r = rowFrom; r < rows; r += rowStep) {
        const S = at((r + 0.45) / rows);
        const y = yAt(r + 1);
        for (let i = 0; i < segCount; i++) {
          if (skip(r, i)) continue;
          const a = S[i], b = S[(i + 1) % n];
          const len = Math.hypot(b.x - a.x, b.z - a.z);
          const m = Math.max(1, Math.floor(len / step));
          const nx = -(b.z - a.z) / len, nz = (b.x - a.x) / len;
          for (let c = 0; c < m; c++) {
            const u = (c + 0.5) / m;
            out.push({ x: a.x + (b.x - a.x) * u, y, z: a.z + (b.z - a.z) * u, nx, nz });
          }
        }
      }
      return out;
    },
  };
}

// Extruded band between two rings (suites, concourse slabs, loge boxes).
export function buildBand({ inner, outer, segs, k = 8, yb, yt }) {
  return buildTier({ inner, outer, segs, k, rows: 1, y0: yt, y1: yt, base: yb, soffitTo: yb });
}

// Strip geometry shared by every seat-row InstancedMesh: a seat-back line
// 1 ft long (scaled per instance), 1.1 ft tall, 0.35 ft thick.
export const STRIP_GEOMETRY = new THREE.BoxGeometry(1, 1.1, 0.35);

export function stripMesh(tier, material) {
  const mesh = new THREE.InstancedMesh(STRIP_GEOMETRY, material, Math.max(1, tier.stripMatrices.length));
  tier.stripMatrices.forEach((m, i) => mesh.setMatrixAt(i, m));
  mesh.count = tier.stripMatrices.length;
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = false;
  mesh.receiveShadow = true;
  return mesh;
}

// Hexahedron from a section polygon (4 points in u,v) extruded across ±halfW.
// `dir` maps section u to plan x (-1 north, +1 south).
export function boardGeometry(poly, halfW, dir, uOffset) {
  const P = poly.map(([u, v]) => [dir * (u + uOffset), v]);
  const v3 = (i, z) => [P[i][0], P[i][1], z];
  const pos = [];
  const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    quad(v3(i, -halfW), v3(j, -halfW), v3(j, halfW), v3(i, halfW));
  }
  quad(v3(0, -halfW), v3(1, -halfW), v3(2, -halfW), v3(3, -halfW));
  quad(v3(0, halfW), v3(3, halfW), v3(2, halfW), v3(1, halfW));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

// Vertical wall along a ring path (facade, back walls).
export function buildWall({ ring, segs, k = 8, yb, yt }) {
  return buildTier({ inner: ring, outer: ring, segs, k, rows: 1, y0: yt, y1: yt, base: yb });
}

// Thin slab from four plan corners (roof canopies, SRO terrace bars).
export function slabGeometry(corners, thickness) {
  // corners: [[x,y,z] x4] top surface, counter-clockwise
  const top = corners, bot = corners.map(([x, y, z]) => [x, y - thickness, z]);
  const pos = [];
  const quad = (a, b, c, d) => pos.push(...a, ...b, ...c, ...a, ...c, ...d);
  quad(top[0], top[1], top[2], top[3]);
  quad(bot[3], bot[2], bot[1], bot[0]);
  for (let i = 0; i < 4; i++) { const j = (i + 1) % 4; quad(bot[i], bot[j], top[j], top[i]); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
