// Framed and tensioned aluminium mesh screens over parking and service volumes (p23).
import { KitPart, frame } from './builder.js';

export function addMesh(b, F, { u0, u1, y0, y1, depth = 40, w0 = 0, post = 30, standoff = 3, volume = true }) {
  if (volume) b.fbox('dark', F, u0, u1, 0, y1 - 2, w0 - depth, w0 - 0.5); // parking / service volume behind
  b.fbox('mesh', F, u0, u1, y0, y1, w0 + standoff - 0.05, w0 + standoff + 0.05);
  const n = Math.max(1, Math.round((u1 - u0) / post));
  for (let k = 0; k <= n; k++) {
    const u = u0 + ((u1 - u0) * k) / n;
    b.fbox('frame', F, u - 0.4, u + 0.4, y0, y1, w0, w0 + standoff + 0.4);
  }
  b.fbox('frame', F, u0, u1, y1 - 0.6, y1, w0, w0 + standoff + 0.4);
  b.fbox('frame', F, u0, u1, y0, y0 + 0.6, w0, w0 + standoff + 0.4);
}

export class MeshScreen extends KitPart {
  constructor(o) {
    super(o.name || 'MeshScreen');
    addMesh(this.b, frame(o.face, o.line), o);
    this.finish();
  }
}
