// Deep vertical fins (ACM-wrapped structural columns, fin depth 6-8 ft, p25).
import { KitPart, frame } from './builder.js';

export function addFins(b, F, { u0, u1, y0, y1, spacing = 7.5, thick = 2, depth = [6, 8], backing = 'glass', w0 = 0, phase = 0 }) {
  const n = Math.max(1, Math.floor((u1 - u0) / spacing));
  const step = (u1 - u0) / n;
  for (let i = 0; i <= n; i++) {
    const u = u0 + i * step;
    // fin depth breathes between 6 and 8 ft across the run (p25: "fin depth 6-8'")
    const d = depth[0] + (depth[1] - depth[0]) * (0.5 + 0.5 * Math.sin(i * 0.55 + phase));
    b.fbox('fins', F, u - thick / 2, u + thick / 2, y0, y1, w0, w0 + d);
  }
  if (backing) b.fbox(backing, F, u0, u1, y0, y1, w0 - 1.2, w0 - 0.2);
}

export class FinArray extends KitPart {
  constructor(o) {
    super(o.name || 'FinArray');
    this.o = o;
    addFins(this.b, frame(o.face, o.line), o);
    this.finish();
  }
}
