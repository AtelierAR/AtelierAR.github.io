// The board volumes (p67 north, p68 south) as faceted hexahedra whose six face areas
// equal the deck values. Pure functions — no three.js — so they can be unit-tested.
//
// Local frame: x = east, y = up, z = away from the field (0 at the field face), feet.
// The six faces are planes:
//   bottom  y = e·z                  (underside, falls toward the back as in p51/p53)
//   front   z = -a·y                 (field face, top leans toward the field)
//   back    z = D + b·y              (plaza face, top leans away)
//   top     y = H + c·z              (roof, falls toward the back as in the p51/p53 sections)
//   east    x =  w/2 + a·tE·y + tE·z
//   west    x = -w/2 - a·tW·y - tW·z
// Tying the side lean (a·t) to the front tilt keeps the field face an exact 214' × 109.5'
// rectangle (p70) while the top grows larger than the bottom, so the side walls lean
// outward exactly as on p63.
import { FACE } from '../data.js';

const PARAMS = ['a', 'D', 'b', 'H', 'c', 'e', 'tE', 'tW'];

function planes(p, w) {
  const { a, D, b, H, c, e, tE, tW } = p;
  return {
    bottom: { n: [0, 1, -e], d: 0 },
    front: { n: [0, a, 1], d: 0 },
    back: { n: [0, -b, 1], d: D },
    top: { n: [0, 1, -c], d: H },
    east: { n: [1, -a * tE, -tE], d: w / 2 },
    west: { n: [-1, -a * tW, -tW], d: w / 2 },
  };
}

function solve3(A, d) {
  const det = (m) =>
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const D0 = det(A);
  const col = (i) => A.map((row, r) => row.map((v, c) => (c === i ? d[r] : v)));
  return [det(col(0)) / D0, det(col(1)) / D0, det(col(2)) / D0];
}

const meet = (P, Q, R) => solve3([P.n, Q.n, R.n], [P.d, Q.d, R.d]);

// Vertex key: [bottom|top][front|back][west|east]
export function volumeVertices(p, w = FACE.width) {
  const P = planes(p, w);
  const v = {};
  for (const [yk, yp] of [['b', P.bottom], ['t', P.top]])
    for (const [zk, zp] of [['f', P.front], ['k', P.back]])
      for (const [xk, xp] of [['w', P.west], ['e', P.east]]) v[yk + zk + xk] = meet(yp, zp, xp);
  return v;
}

// Each loop is counter-clockwise seen from outside.
export const FACE_LOOPS = {
  front: ['bfe', 'bfw', 'tfw', 'tfe'],
  back: ['bkw', 'bke', 'tke', 'tkw'],
  bottom: ['bfw', 'bfe', 'bke', 'bkw'],
  top: ['tfe', 'tfw', 'tkw', 'tke'],
  east: ['bke', 'bfe', 'tfe', 'tke'],
  west: ['bfw', 'bkw', 'tkw', 'tfw'],
};

const sub = (u, v) => [u[0] - v[0], u[1] - v[1], u[2] - v[2]];
const cross = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
const len = (u) => Math.hypot(u[0], u[1], u[2]);

export function polygonArea(pts) {
  let s = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const c = cross(pts[i], pts[(i + 1) % pts.length]);
    s = [s[0] + c[0], s[1] + c[1], s[2] + c[2]];
  }
  return len(s) / 2;
}

export function volumeMeasures(p, w = FACE.width) {
  const v = volumeVertices(p, w);
  const areas = {};
  for (const [k, loop] of Object.entries(FACE_LOOPS)) areas[k] = polygonArea(loop.map((n) => v[n]));
  const faceHeight = len(sub(v.tfw, v.bfw));
  const faceTopWidth = len(sub(v.tfe, v.tfw));
  const depth = (v.tke[2] + v.tkw[2]) / 2 - (v.tfe[2] + v.tfw[2]) / 2;
  return { v, areas, faceHeight, faceTopWidth, depth };
}

function residuals(p, target, w) {
  const m = volumeMeasures(p, w);
  const f = target.faces;
  return [
    m.faceHeight - FACE.height,
    m.areas.top - f.top,
    m.areas.bottom - f.bottom,
    m.areas.back - f.back,
    m.areas.east - f.east,
    m.areas.west - f.west,
  ];
}

// Levenberg–Marquardt on a square system: six exact equations (field-face height and the
// five other face areas — the field face area then follows from its exact 214' × 109.5')
// in six unknowns (D, b, H, c, tE, tW). The front tilt `a` and underside slope `e` are not
// fitted: they are read off the section drawings (p51 north, p53 south) and passed in.
// The printed depth (155' / 109') is reported, not forced — see REFERENCE_NOTES.md.
export const FREE_PARAMS = ['D', 'b', 'H', 'c', 'tE', 'tW'];

export function fitVolume(target, guess, w = FACE.width) {
  const toP = (x) => ({ ...guess, ...Object.fromEntries(FREE_PARAMS.map((k, i) => [k, x[i]])) });
  const res = (x) => residuals(toP(x), target, w);
  const norm = (r) => r.reduce((s, v) => s + v * v, 0);
  let x = FREE_PARAMS.map((k) => guess[k]);
  let lambda = 1e-2;
  let r = res(x);
  for (let it = 0; it < 3000 && norm(r) > 1e-16; it++) {
    const J = r.map(() => new Array(x.length).fill(0));
    for (let j = 0; j < x.length; j++) {
      const h = 1e-7 * Math.max(1, Math.abs(x[j]));
      const xh = x.slice();
      xh[j] += h;
      const rh = res(xh);
      for (let i = 0; i < r.length; i++) J[i][j] = (rh[i] - r[i]) / h;
    }
    // (JᵀJ + λ·diag(JᵀJ)) δ = −Jᵀr
    const n = x.length;
    const A = Array.from({ length: n }, (_, i) =>
      Array.from({ length: n }, (_, j) => J.reduce((s, row) => s + row[i] * row[j], 0)),
    );
    const g = Array.from({ length: n }, (_, i) => J.reduce((s, row, k) => s + row[i] * r[k], 0));
    for (let i = 0; i < n; i++) A[i][i] *= 1 + lambda;
    const delta = gaussSolve(A, g.map((v) => -v));
    const xn = x.map((v, i) => v + delta[i]);
    const rn = res(xn);
    if (norm(rn) < norm(r)) {
      x = xn;
      r = rn;
      lambda = Math.max(lambda / 3, 1e-15);
    } else lambda *= 4;
  }
  return toP(x);
}

function gaussSolve(A, b) {
  const n = b.length;
  const M = A.map((row, i) => [...row, b[i]]);
  for (let c = 0; c < n; c++) {
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = M[r][n];
    for (let k = r + 1; k < n; k++) s -= M[r][k] * x[k];
    x[r] = s / M[r][r];
  }
  return x;
}
