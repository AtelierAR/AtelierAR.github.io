// Dark iron-spot masonry plinths in stack bond at plaza level, broken by tall glazing (p23, p26).
import { KitPart, frame } from './builder.js';

export function addPlinth(b, F, { u0, u1, h, depth = 24, bay = 0, bayW = 14, bayH = null, w0 = 0, glassOffset = 0.5 }) {
  const oh = bayH ?? h * 0.72;
  b.fbox('clay', F, u0, u1, 0, h, w0 - depth, w0 - 1.5); // body behind the veneer
  if (!bay) { b.fbox('masonry', F, u0, u1, 0, h, w0 - 1.5, w0); return; }
  const n = Math.max(1, Math.floor((u1 - u0) / bay));
  const step = (u1 - u0) / n;
  for (let i = 0; i < n; i++) {
    const a = u0 + i * step, c = a + step;
    const m = (a + c) / 2;
    const g0 = m - bayW / 2, g1 = m + bayW / 2;
    b.fbox('masonry', F, a, g0, 0, h, w0 - 1.5, w0);
    b.fbox('masonry', F, g1, c, 0, h, w0 - 1.5, w0);
    b.fbox('masonry', F, g0, g1, oh, h, w0 - 1.5, w0);
    b.fbox('glass', F, g0, g1, 0, oh, w0 - 1.5, w0 - glassOffset - 0.3);
    b.fbox('frame', F, g0 - 0.3, g1 + 0.3, oh - 0.6, oh, w0 - 1.5, w0 - glassOffset + 0.2);
  }
}

export class MasonryPlinth extends KitPart {
  constructor(o) {
    super(o.name || 'MasonryPlinth');
    addPlinth(this.b, frame(o.face, o.line), o);
    this.finish();
  }
}
