// Horizontal ribbons of unitized curtain wall at the concourse levels, separated by
// metal panel slab-edge bands, with aluminium fin extrusions (p24, p26-29).
import { KitPart, frame } from './builder.js';

export function addGlazing(b, F, { u0, u1, y0, y1, levels = null, band = 5, mullion = 10, w0 = 0, extrusions = true }) {
  const lv = levels || [y0, y1];
  for (let i = 0; i < lv.length - 1; i++) {
    const a = lv[i], c = lv[i + 1];
    b.fbox('glass', F, u0, u1, a + band, c, w0 - 0.6, w0);
    b.fbox('metal', F, u0 - 0.5, u1 + 0.5, a, a + band, w0 - 0.6, w0 + 1.2); // slab edge / spandrel band
    if (extrusions) {
      const n = Math.max(1, Math.round((u1 - u0) / mullion));
      for (let k = 0; k <= n; k++) {
        const u = u0 + ((u1 - u0) * k) / n;
        b.fbox('frame', F, u - 0.2, u + 0.2, a + band, c, w0, w0 + 1.1);
      }
    }
  }
  b.fbox('metal', F, u0 - 0.5, u1 + 0.5, lv[lv.length - 1], lv[lv.length - 1] + band * 0.6, w0 - 0.6, w0 + 1.2);
}

export class GlazingBand extends KitPart {
  constructor(o) {
    super(o.name || 'GlazingBand');
    addGlazing(this.b, frame(o.face, o.line), o);
    this.finish();
  }
}
