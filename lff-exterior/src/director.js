// Camera director: shots are functions of the master clock. Keyframed paths use a
// time-aware Catmull-Rom (Hermite) spline so velocity stays continuous through keys.
import * as THREE from 'three';
import { FT } from './data.js';

export const ft = (x, y, z) => new THREE.Vector3(x * FT, y * FT, z * FT);
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
export const smoother = (x) => { x = clamp01(x); return x * x * x * (x * (x * 6 - 15) + 10); };
export const easeInOut = (x, p = 2) => { x = clamp01(x); return x < 0.5 ? Math.pow(2 * x, p) / 2 : 1 - Math.pow(2 - 2 * x, p) / 2; };

function hermite(p0, p1, m0, m1, t) {
  const t2 = t * t, t3 = t2 * t;
  return p0 * (2 * t3 - 3 * t2 + 1) + m0 * (t3 - 2 * t2 + t) + p1 * (-2 * t3 + 3 * t2) + m1 * (t3 - t2);
}

// keys: [{t, pos:[x,y,z] m, target:[x,y,z] m, fov, roll}] with t ascending (any unit)
export function spline(keys) {
  const fields = ['pos', 'target'];
  const scal = ['fov', 'roll'];
  const val = (k, f) => (f === 'pos' || f === 'target' ? k[f] : [k[f] ?? (f === 'fov' ? 35 : 0)]);
  return (t) => {
    if (t <= keys[0].t) t = keys[0].t;
    if (t >= keys[keys.length - 1].t) t = keys[keys.length - 1].t;
    let i = 0;
    while (i < keys.length - 2 && t > keys[i + 1].t) i++;
    const k0 = keys[i], k1 = keys[i + 1];
    const km = keys[i - 1] || k0, kp = keys[i + 2] || k1;
    const dt = k1.t - k0.t || 1;
    const u = (t - k0.t) / dt;
    const out = {};
    for (const f of [...fields, ...scal]) {
      const a = val(k0, f), b = val(k1, f), am = val(km, f), bp = val(kp, f);
      const r = [];
      for (let d = 0; d < a.length; d++) {
        // tangents (per unit u) from neighbouring keys, scaled to this segment's duration
        const m0 = k0 === km ? 0 : ((b[d] - am[d]) / (k1.t - km.t)) * dt;
        const m1 = k1 === kp ? 0 : ((bp[d] - a[d]) / (kp.t - k0.t)) * dt;
        r.push(hermite(a[d], b[d], m0, m1, u));
      }
      out[f] = f === 'fov' || f === 'roll' ? r[0] : new THREE.Vector3(...r);
    }
    return out;
  };
}

export class Director {
  constructor(camera) {
    this.camera = camera;
    this.shots = [];
    this.target = new THREE.Vector3();
    this.override = null;
    this.current = null;
  }

  add(t0, t1, fn, name = '') {
    this.shots.push({ t0, t1, fn, name });
    this.shots.sort((a, b) => a.t0 - b.t0);
    return this;
  }

  pose(T) {
    let s = this.shots[0];
    for (const sh of this.shots) if (T >= sh.t0) s = sh;
    if (!s) return null;
    this.current = s;
    const u = clamp01((T - s.t0) / (s.t1 - s.t0));
    return s.fn(u, T);
  }

  update(T) {
    const p = this.override || this.pose(T);
    if (!p) return;
    const cam = this.camera;
    cam.position.copy(p.pos);
    this.target.copy(p.target);
    cam.up.set(0, 1, 0);
    cam.lookAt(this.target);
    if (p.roll) cam.rotateZ(p.roll);
    if (p.fov && Math.abs(cam.fov - p.fov) > 1e-4) { cam.fov = p.fov; cam.updateProjectionMatrix(); }
    // lens shift (architectural "rise"/"shift"): moves the image without converging verticals,
    // like the deck renders. shiftY > 0 moves content down, shiftX > 0 moves it right.
    const sx = p.shiftX || 0, sy = p.shiftY || 0;
    if (sx || sy) cam.setViewOffset(1920, 1080, -sx * 1920, -sy * 1080, 1920, 1080);
    else if (cam.view && cam.view.enabled) cam.clearViewOffset();
    cam.updateMatrixWorld();
  }
}

// Rounded-rectangle "orbit" ring at a fixed stand-off from the building footprint.
// The deck footprint (~950 x 1070 ft) is larger than a 120 m circle, so the 120 m orbit is
// measured from the building edge rather than its centre (see REFERENCE_NOTES.md).
export function ringPoint(azDeg, standoffM, halfX, halfZ) {
  const a = THREE.MathUtils.degToRad(azDeg);
  const dx = Math.sin(a), dz = -Math.cos(a);
  // ray from centre; find t where sdRoundBox(p) = 0 with box half-extents and radius = standoff
  const sd = (t) => {
    const px = Math.abs(dx * t) - halfX, pz = Math.abs(dz * t) - halfZ;
    const ox = Math.max(px, 0), oz = Math.max(pz, 0);
    return Math.hypot(ox, oz) + Math.min(Math.max(px, pz), 0) - standoffM;
  };
  let lo = 0, hi = 5000;
  for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2; if (sd(m) > 0) hi = m; else lo = m; }
  return new THREE.Vector3(dx * lo, 0, dz * lo);
}
