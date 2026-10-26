// Keyframed camera paths: Catmull-Rom through positions and look-at targets, with a
// monotone (Fritsch–Carlson) time → parameter map so velocity is continuous across keys.
import * as THREE from 'three';

function monotone(xs, ys, restEnds = false) {
  const n = xs.length;
  const d = [], m = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = restEnds ? 0 : d[0];
  m[n - 1] = restEnds ? 0 : d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) {
      m[i] = m[i + 1] = 0;
      continue;
    }
    const a = m[i] / d[i], b = m[i + 1] / d[i];
    const s = a * a + b * b;
    if (s > 9) {
      const t = 3 / Math.sqrt(s);
      m[i] = t * a * d[i];
      m[i + 1] = t * b * d[i];
    }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

export class CamPath {
  // keys: [{ t, pos: [x,y,z], look: [x,y,z], fov }]; ease0/ease1: start/end at rest
  constructor(keys, { tension = 0.5, rest = true } = {}) {
    this.keys = keys;
    const P = (k) => new THREE.Vector3(...k);
    this.pos = new THREE.CatmullRomCurve3(keys.map((k) => P(k.pos)), false, 'catmullrom', tension);
    this.look = new THREE.CatmullRomCurve3(keys.map((k) => P(k.look)), false, 'catmullrom', tension);
    const ts = keys.map((k) => k.t);
    const idx = keys.map((_, i) => i);
    this.map = monotone(ts, idx, rest); // rest: start and end at zero velocity
    this.fov = monotone(ts, keys.map((k) => k.fov ?? 50));
    this.t0 = ts[0];
    this.t1 = ts[ts.length - 1];
  }
  sample(t, cam) {
    const x = t;
    const i = this.map(x);
    const u = i / (this.keys.length - 1);
    const p = this.pos.getPoint(Math.min(1, Math.max(0, u)));
    const l = this.look.getPoint(Math.min(1, Math.max(0, u)));
    cam.position.copy(p);
    cam.lookAt(l);
    const f = this.fov(x);
    if (Math.abs(cam.fov - f) > 1e-4) {
      cam.fov = f;
      cam.updateProjectionMatrix();
    }
    return { p, l };
  }
}

export function setCam(cam, pos, look, fov) {
  cam.position.set(...pos);
  cam.lookAt(...look);
  if (fov !== undefined && Math.abs(cam.fov - fov) > 1e-4) {
    cam.fov = fov;
    cam.updateProjectionMatrix();
  }
}
