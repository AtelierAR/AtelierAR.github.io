// Solves the Scene 3 field-level cameras so the board's field face lands where p70 / p71
// draw it. Corner positions were measured on reference/pages/p-070.png and p-071.png
// (2667 × 1500, normalised 0..1). Prints camera position, look target and fov.
import * as THREE from 'three';
import { VOLUME_PARAMS } from '../src/geometry/volumeParams.js';
import { volumeVertices } from '../src/geometry/volume.js';

const PLACEMENT = { north: { o: [0, 62, -292], flip: true }, south: { o: [0, 66, 286], flip: false } };
const W = (key, p) => new THREE.Vector3(p[0] + PLACEMENT[key].o[0], p[1] + PLACEMENT[key].o[1], (PLACEMENT[key].flip ? -p[2] : p[2]) + PLACEMENT[key].o[2]);

export const TARGETS = {
  // image TL, TR, BR, BL of the field face as drawn on the page
  p70: { key: 'north', corners: ['tfw', 'tfe', 'bfe', 'bfw'], img: [[0.3018, 0.1833], [0.5744, 0.2833], [0.5681, 0.4967], [0.3, 0.4587]], guess: [-60, 6, 120, 0.25, 0.2, 50] },
  // p63 "proposed" panel: field face + east face of the north volume (page-normalised)
  p63: {
    key: 'north',
    corners: ['tfw', 'tfe', 'bfe', 'bfw', 'tke', 'bke'],
    // panel-normalised: the proposed panel spans x 1335–2667, y 380–1380 on the page
    panel: [1335, 380, 2667, 1380],
    px: [[1930, 537], [2220, 450], [2269, 958], [1975, 960], [2642, 642], [2592, 1015]],
    guess: [150, 30, -120, 0.9, 0.15, 50],
    free: true,
  },
  p71: { key: 'south', corners: ['tfe', 'tfw', 'bfw', 'bfe'], img: [[0.2707, 0.0653], [0.6685, 0.3233], [0.6355, 0.6187], [0.2887, 0.5433]], guess: [60, 6, 100, 3.3, 0.3, 50] },
};

for (const T of Object.values(TARGETS))
  if (T.panel) {
    const [x0, y0, x1, y1] = T.panel;
    T.aspect = (x1 - x0) / (y1 - y0);
    T.img = T.px.map(([x, y]) => [(x - x0) / (x1 - x0), (y - y0) / (y1 - y0)]);
  }

function camFrom(x, aspect = 16 / 9) {
  const [px, py, pz, yaw, pitch, fov] = x;
  const cam = new THREE.PerspectiveCamera(fov, aspect, 0.1, 10000);
  cam.position.set(px, py, pz);
  cam.rotation.order = 'YXZ';
  cam.rotation.set(pitch, yaw, 0);
  cam.updateMatrixWorld();
  return cam;
}

export function solve(name) {
  const T = TARGETS[name];
  const v = volumeVertices(VOLUME_PARAMS[T.key]);
  const pts = T.corners.map((c) => W(T.key, v[c]));
  const res = (x) => {
    const asp = T.aspect || 16 / 9;
    const cam = camFrom(x, asp);
    const r = [];
    pts.forEach((p, i) => {
      const q = p.clone().project(cam);
      r.push((q.x * 0.5 + 0.5 - T.img[i][0]) * asp, -q.y * 0.5 + 0.5 - T.img[i][1]);
    });
    if (T.free) {
      // inside the bowl, in front of the north lower bowl, a normal lens
      r.push(Math.max(0, Math.hypot(x[0], x[2] + 300) - 420) * 0.01, Math.max(0, x[5] - 70) * 0.02);
    } else {
      r.push((x[1] - 6) * 0.01); // stay at field level (eye ≈ 6')
      r.push(Math.max(0, Math.abs(x[0]) - 72) * 0.02); // stay on the field (sidelines ±80')
    }
    return r;
  };
  let x = T.guess.slice();
  let lambda = 1e-2;
  const norm = (r) => r.reduce((s, a) => s + a * a, 0);
  let r = res(x);
  for (let it = 0; it < 4000; it++) {
    const J = r.map(() => new Array(x.length).fill(0));
    for (let j = 0; j < x.length; j++) {
      const h = 1e-5 * Math.max(1, Math.abs(x[j]));
      const xh = x.slice();
      xh[j] += h;
      const rh = res(xh);
      for (let i = 0; i < r.length; i++) J[i][j] = (rh[i] - r[i]) / h;
    }
    const n = x.length;
    const A = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => J.reduce((s, row) => s + row[i] * row[j], 0)));
    const g = Array.from({ length: n }, (_, i) => J.reduce((s, row, k) => s + row[i] * r[k], 0));
    for (let i = 0; i < n; i++) A[i][i] *= 1 + lambda;
    const M = A.map((row, i) => [...row, -g[i]]);
    for (let c = 0; c < n; c++) {
      let p = c;
      for (let q = c + 1; q < n; q++) if (Math.abs(M[q][c]) > Math.abs(M[p][c])) p = q;
      [M[c], M[p]] = [M[p], M[c]];
      for (let q = c + 1; q < n; q++) {
        const f = M[q][c] / M[c][c];
        for (let k = c; k <= n; k++) M[q][k] -= f * M[c][k];
      }
    }
    const d = new Array(n).fill(0);
    for (let q = n - 1; q >= 0; q--) {
      let s = M[q][n];
      for (let k = q + 1; k < n; k++) s -= M[q][k] * d[k];
      d[q] = s / M[q][q];
    }
    const xn = x.map((a, i) => a + d[i]);
    const rn = res(xn);
    if (norm(rn) < norm(r)) {
      x = xn;
      r = rn;
      lambda /= 3;
    } else lambda *= 4;
    if (norm(r) < 1e-12) break;
  }
  const cam = camFrom(x, T.aspect || 16 / 9);
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion);
  const look = cam.position.clone().addScaledVector(dir, 300);
  return {
    pos: cam.position.toArray().map((a) => +a.toFixed(2)),
    look: look.toArray().map((a) => +a.toFixed(2)),
    fov: +x[5].toFixed(2),
    aspect: T.aspect ? +T.aspect.toFixed(4) : undefined,
    rmsPx: +(Math.sqrt(norm(r.slice(0, 2 * pts.length)) / (2 * pts.length)) * 1080).toFixed(1),
  };
}

if (process.argv[1].endsWith('fit-cameras.mjs')) for (const n of Object.keys(TARGETS)) console.log(n, JSON.stringify(solve(n)));
