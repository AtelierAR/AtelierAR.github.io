// Plan rings: 12-vertex chamfered rectangles with corresponding vertices, so
// any two rings can be blended to give a seat-row polyline.
//
// Vertex order (plan, +x south, +z west):
//  0 (-xeN,-ze) N end/east   1 (-xm,-zm) NE   2 (-xs,-zs) E side north
//  3 ( xs,-zs) E side south  4 ( xm,-zm) SE   5 ( xeS,-ze) S end/east
//  6 ( xeS, ze) S end/west   7 ( xm, zm) SW   8 ( xs, zs) W side south
//  9 (-xs, zs) W side north 10 (-xm, zm) NW  11 (-xeN, ze) N end/west
// Segment i runs from vertex i to i+1: 0-1 NE, 2 E side, 3-4 SE, 5 S end,
// 6-7 SW, 8 W side, 9-10 NW, 11 N end.
import rings from '../geometry/plan_rings.json';

export const SEG = { NE: [0, 1], E: [2], SE: [3, 4], S: [5], SW: [6, 7], W: [8], NW: [9, 10], N: [11] };
export const NORTH_STAND = [9, 10, 11, 0, 1];
export const SOUTH_STAND = [3, 4, 5, 6, 7];
export const ALL = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

export function ringVerts(r) {
  const { xs, zs, xm, zm, xeN, xeS, ze } = r;
  return [
    [-xeN, -ze], [-xm, -zm], [-xs, -zs], [xs, -zs], [xm, -zm], [xeS, -ze],
    [xeS, ze], [xm, zm], [xs, zs], [-xs, zs], [-xm, zm], [-xeN, ze],
  ];
}

const byName = Object.fromEntries([...rings.existing, ...rings.proposed].map((r) => [r.name, r]));
export const RING = (name) => byName[name];

// Derived ring: offset/override fields of a traced ring (used for tiers whose
// front edge is not a manifest boundary, e.g. the overhanging 200-level front).
export function ringWith(name, over) {
  return { ...byName[name], ...over, name: `${name}*` };
}
export function lerpRingParams(a, b, t) {
  const o = {};
  for (const k of ['xs', 'zs', 'xm', 'zm', 'xeN', 'xeS', 'ze']) o[k] = a[k] + (b[k] - a[k]) * t;
  return o;
}

// Points along a set of segments, `k` subdivisions per segment. Returns
// [{x,z,seg,u}] where u is 0..1 along each segment. Contiguous segment runs
// (with wrap-around) become a single open polyline; ALL gives a closed loop.
export function samplePath(verts, segs, k = 8) {
  const pts = [];
  const closed = segs.length === 12;
  segs.forEach((s, j) => {
    const a = verts[s], b = verts[(s + 1) % 12];
    const last = j === segs.length - 1 && !closed;
    for (let i = 0; i < k + (last ? 1 : 0); i++) {
      const u = i / k;
      pts.push({ x: a[0] + (b[0] - a[0]) * u, z: a[1] + (b[1] - a[1]) * u, seg: s, u });
    }
  });
  return { pts, closed };
}

export function blend(pa, pb, t) {
  return pa.pts.map((p, i) => ({ x: p.x + (pb.pts[i].x - p.x) * t, z: p.z + (pb.pts[i].z - p.z) * t, seg: p.seg, u: p.u }));
}

// Split a segment list into contiguous runs (in the order given, with wrap
// 11 -> 0), so non-adjacent pieces are never bridged across the bowl.
export function segRuns(segs) {
  if (segs.length === 12) return [segs];
  const runs = [];
  let cur = [segs[0]];
  for (let i = 1; i < segs.length; i++) {
    if (segs[i] === (segs[i - 1] + 1) % 12) cur.push(segs[i]);
    else { runs.push(cur); cur = [segs[i]]; }
  }
  runs.push(cur);
  if (runs.length > 1) {
    const first = runs[0], last = runs[runs.length - 1];
    if ((last[last.length - 1] + 1) % 12 === first[0]) { runs[0] = [...last, ...first]; runs.pop(); }
  }
  return runs;
}
