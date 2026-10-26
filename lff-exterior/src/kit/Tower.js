// Vertical circulation towers clad in deep vertical fins with a logo position near the top
// (p25 fin depth 6-8 ft; p26/p27 logo positions). LOGO_SLOT is an empty anchor + blank plate:
// no marks are rendered.
import * as THREE from 'three';
import { KitPart, frame } from './builder.js';
import { addFins } from './FinArray.js';
import { addGlazing } from './GlazingBand.js';
import { FT } from '../data.js';

export class Tower extends KitPart {
  constructor(o) {
    super('Tower:' + o.id);
    this.o = o;
    const { x, z, w, d, h } = o;
    const b = this.b;
    const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
    if (o.core === 'glazing') {
      b.minmax('clay', x0 + 1, 0, z0 + 1, x1 - 1, h, z1 - 1);
      for (const face of ['N', 'S', 'E', 'W']) {
        const F = face === 'N' ? frame('N', z0) : face === 'S' ? frame('S', z1) : face === 'E' ? frame('E', x1) : frame('W', x0);
        const [u0, u1] = face === 'N' || face === 'S' ? [x0, x1] : [z0, z1];
        addGlazing(b, F, { u0, u1, levels: [0, 30, 58, 88, 118, 148, h - 8], band: 4, mullion: 5, extrusions: false });
      }
    } else {
      b.minmax('metal', x0, 0, z0, x1, h, z1);
    }
    b.minmax('metal', x0 - 0.5, h, z0 - 0.5, x1 + 0.5, h + 3, z1 + 0.5); // crown
    for (const face of o.fins || []) {
      const F = face === 'N' ? frame('N', z0) : face === 'S' ? frame('S', z1) : face === 'E' ? frame('E', x1) : frame('W', x0);
      const [u0, u1] = face === 'N' || face === 'S' ? [x0 + 1, x1 - 1] : [z0 + 1, z1 - 1];
      const top = face === o.logo ? h - 42 : h;
      addFins(b, F, { u0, u1, y0: 0, y1: top, spacing: 6.5, thick: 1.8, depth: [6, 8], backing: null, phase: x * 0.1 });
    }
    // LOGO_SLOT
    this.logoSlot = null;
    if (o.logo) {
      const F = o.logo === 'N' ? frame('N', z0) : o.logo === 'S' ? frame('S', z1) : o.logo === 'E' ? frame('E', x1) : frame('W', x0);
      const c = o.logo === 'N' || o.logo === 'S' ? x : z;
      b.fbox('metal', F, c - 13, c + 13, h - 36, h - 10, 0, 1.2); // blank plate
      const slot = new THREE.Object3D();
      slot.name = 'LOGO_SLOT';
      const p = F.pt(c, h - 23, 1.4);
      slot.position.set(p[0] * FT, p[1] * FT, p[2] * FT);
      this.add(slot);
      this.logoSlot = slot;
    }
    this.finish();
  }
}
