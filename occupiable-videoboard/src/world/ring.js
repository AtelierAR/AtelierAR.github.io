// Rounded-rectangle "ring" paths around the field, used for every bowl tier and for the
// ribbon boards. Offset d (ft) is measured outward from the bowl's inner edge.
// Field: 160' × 360' centred at the origin (north = −Z, east = +X).

export const RING = { hx: 115, hz: 215, r: 40 };

// Point at arc length s (0 at the 50-yard line on the east side, running counter-clockwise
// seen from above: east → north → west → south) on the ring at offset d.
export function ringLength(d) {
  const ax = RING.hx - RING.r, az = RING.hz - RING.r, R = RING.r + d;
  return 4 * ax + 4 * az + 2 * Math.PI * R;
}

export function ringPoint(d, s) {
  const ax = RING.hx - RING.r, az = RING.hz - RING.r, R = RING.r + d;
  const q = (Math.PI / 2) * R;
  const L = ringLength(d);
  s = ((s % L) + L) % L;
  // segments: east half-straight (z: 0 → −az), NE arc, north straight, NW arc, west straight, SW arc, south straight, SE arc, east half-straight
  const segs = [
    ['line', az, [ax + R, 0], [0, -1]],
    ['arc', q, [ax, -az], 0],
    ['line', 2 * ax, [ax, -az - R], [-1, 0]],
    ['arc', q, [-ax, -az], 1],
    ['line', 2 * az, [-ax - R, -az], [0, 1]],
    ['arc', q, [-ax, az], 2],
    ['line', 2 * ax, [-ax, az + R], [1, 0]],
    ['arc', q, [ax, az], 3],
    ['line', az, [ax + R, az], [0, -1]],
  ];
  for (const [kind, len, a, b] of segs) {
    if (s <= len + 1e-9) {
      if (kind === 'line') {
        const x = a[0] + b[0] * s, z = a[1] + b[1] * s;
        return { x, z, tx: b[0], tz: b[1], nx: -b[1], nz: b[0] }; // outward normal = (−tz, tx)
      }
      // arcs sweep 90° each, starting angle per quadrant (0: east→north …)
      const start = [0, Math.PI / 2, Math.PI, 1.5 * Math.PI][b];
      const th = start + s / R;
      const cx = a[0], cz = a[1];
      const x = cx + Math.cos(th) * R, z = cz - Math.sin(th) * R;
      return { x, z, nx: Math.cos(th), nz: -Math.sin(th), tx: -Math.sin(th), tz: -Math.cos(th) };
    }
    s -= len;
  }
  return ringPoint(d, 0);
}

// Sample a ring at offset d with roughly `step` ft spacing; returns closed loop of points.
export function sampleRing(d, step = 8) {
  const L = ringLength(d);
  const n = Math.max(24, Math.ceil(L / step));
  const out = [];
  for (let i = 0; i < n; i++) out.push({ ...ringPoint(d, (i / n) * L), s: (i / n) * L });
  return out;
}

// Split a closed loop into open runs where keep(p) is true.
export function runsWhere(loop, keep) {
  const flags = loop.map(keep);
  if (flags.every(Boolean)) return [[...loop, loop[0]]];
  const runs = [];
  const n = loop.length;
  const start = flags.findIndex((f) => !f);
  let cur = null;
  for (let k = 1; k <= n; k++) {
    const i = (start + k) % n;
    if (flags[i]) {
      if (!cur) cur = [];
      cur.push(loop[i]);
    } else if (cur) {
      runs.push(cur);
      cur = null;
    }
  }
  if (cur) runs.push(cur);
  return runs.filter((r) => r.length > 1);
}
