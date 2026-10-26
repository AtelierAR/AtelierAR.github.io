// Assembles the renovated Lincoln Financial Field from the kit. Plan units = feet,
// +X east, +Z south (deck "north" = the plaza / videoboard end). Each block is commented
// with the reference it was traced from.
import * as THREE from 'three';
import { LAYOUT, FT, ROOF } from './data.js';
import { KitPart, frame } from './kit/builder.js';
import { Tower } from './kit/Tower.js';
import { CanopyWing, pvLayout } from './kit/CanopyWing.js';
import { addFins } from './kit/FinArray.js';
import { addGlazing } from './kit/GlazingBand.js';
import { addPlinth } from './kit/MasonryPlinth.js';
import { addMesh } from './kit/MeshScreen.js';
import { addMetal, VideoBoard, EntryCanopy, Bowl, GrandStair, Blade } from './kit/misc.js';

const LV = [30, 58, 88, 118]; // concourse levels used by the glazing ribbons (p34)

// A facade "sector": one kit part holding a run of facade elements on one face.
class Sector extends KitPart {
  constructor(name, face, line, items) {
    super(name);
    const F = frame(face, line);
    for (const it of items) {
      const o = { ...it };
      switch (it.k) {
        case 'fins': addFins(this.b, F, o); break;
        case 'glazing': addGlazing(this.b, F, o); break;
        case 'plinth': addPlinth(this.b, F, o); break;
        case 'mesh': addMesh(this.b, F, o); break;
        case 'metal': addMetal(this.b, F, o); break;
        case 'clay': this.b.fbox('clay', F, o.u0, o.u1, o.y0, o.y1, (o.w0 ?? 0) - (o.depth ?? 30), o.w0 ?? 0); break;
        default: throw new Error('unknown sector item ' + it.k);
      }
    }
    this.finish();
  }
}

export function buildStadium(boardMaterial) {
  const root = new THREE.Group();
  root.name = 'Stadium';
  const parts = { wings: [], towers: [], boards: [], sectors: [], canopies: [] };
  const add = (p, list) => { root.add(p); if (list) list.push(p); return p; };

  add(new Bowl());
  add(new GrandStair());

  // ---------------- NORTH (plaza) face, z ~ -470 (p26 plaza view, p30 north elevation)
  add(new Sector('N-east', 'N', -470, [
    { k: 'plinth', u0: 105, u1: 160, h: 30, bay: 0 }, // stair cheek / base (p26 "Masonry" at the stair)
    { k: 'glazing', u0: 105, u1: 203, levels: [30, 58, 88, 115] },
    { k: 'plinth', u0: 160, u1: 203, h: 30, bay: 21, bayW: 14, bayH: 24, w0: 2 }, // storefront beside the NE tower (p26 "Glazing")
    { k: 'plinth', u0: 270, u1: 362, h: 58, bay: 0, w0: 10 }, // NE masonry plinth (p26/p30 hatched block)
    { k: 'fins', u0: 272, u1: 360, y0: 58, y1: 132, spacing: 9, depth: [6, 7], backing: 'glass' },
    { k: 'glazing', u0: 362, u1: 400, levels: [30, 58, 88] },
  ]), parts.sectors);
  add(new Sector('N-west', 'N', -470, [
    { k: 'plinth', u0: -160, u1: -105, h: 30, bay: 0 },
    { k: 'glazing', u0: -160, u1: -105, levels: [30, 58, 88, 115] },
    { k: 'plinth', u0: -226, u1: -160, h: 58, bay: 0, w0: 18 }, // p26 "Masonry" left of the pavilion
    { k: 'glazing', u0: -226, u1: -160, levels: [58, 88, 115], w0: 2 },
    { k: 'metal', u0: -318, u1: -226, y0: 0, y1: 150, depth: 50 }, // core of the NW fin block
    { k: 'fins', u0: -316, u1: -228, y0: 38, y1: 150, spacing: 8, depth: [7, 8], backing: null }, // p26 right "Fins"
    { k: 'mesh', u0: -400, u1: -318, y0: 55, y1: 107, depth: 60, w0: -10 },
    { k: 'plinth', u0: -398, u1: -330, h: 55, bay: 0, w0: 34 }, // NW masonry block with logo position (p26 bottom right)
  ]), parts.sectors);
  // NW glazed pavilion under a cantilevered canopy (p26 "Glazing" + low canopy)
  add(new Sector('NW-pavilion', 'N', -530, [
    { k: 'glazing', u0: -318, u1: -175, levels: [0, 34], band: 1.5, mullion: 6, w0: 0 },
    { k: 'clay', u0: -318, u1: -175, y0: 0, y1: 33, depth: 58, w0: -1 },
  ]), parts.sectors);
  parts.canopies.push(add(new EntryCanopy({ id: 'NW', x0: -340, x1: -150, z0: -556, z1: -462, y: 38, t: 3.5, posts: [[-330, -548], [-160, -548]] })));
  parts.canopies.push(add(new EntryCanopy({ id: 'NE-low', x0: 360, x1: 470, z0: -478, z1: -420, y: 44, t: 3 })));
  const neLogoBlock = new Sector('NW-logo', 'N', -504, [{ k: 'clay', u0: -398, u1: -330, y0: 46, y1: 55, depth: 2 }]);
  add(neLogoBlock);
  const logoNW = new THREE.Object3D(); logoNW.name = 'LOGO_SLOT'; logoNW.position.set(-364 * FT, 30 * FT, -505 * FT); root.add(logoNW);

  // ---------------- EAST face, x ~ 400 (p27 VIP Entry East, p31 east elevation). u = z.
  add(new Sector('E', 'E', 400, [
    { k: 'mesh', u0: -462, u1: -300, y0: 24, y1: 124, depth: 60 }, // p30 grey mass at X 402-438
    { k: 'plinth', u0: -462, u1: -300, h: 24, bay: 0 },
    { k: 'plinth', u0: -300, u1: -60, h: 30, bay: 34, bayW: 16, bayH: 22 },
    { k: 'glazing', u0: -300, u1: -60, levels: [30, 58, 88, 118] },
    { k: 'metal', u0: -60, u1: 20, y0: 0, y1: 132, depth: 40 },
    { k: 'glazing', u0: 20, u1: 160, levels: [40, 70, 100, 125], w0: -2 }, // above the VIP pavilion
    { k: 'plinth', u0: 206, u1: 330, h: 62, bay: 0, w0: 4 }, // p27 masonry face with glazing above
    { k: 'glazing', u0: 206, u1: 330, levels: [62, 88, 118], w0: 1 },
    { k: 'plinth', u0: 330, u1: 460, h: 128, bay: 0, w0: 8 }, // p27 corner block (horizontal-coursed masonry)
  ]), parts.sectors);
  // VIP pavilion: glazed box + masonry end with a flat canopy (p27 right)
  add(new Sector('E-vip', 'E', 470, [
    { k: 'glazing', u0: 20, u1: 118, levels: [0, 36], band: 1.5, mullion: 6 },
    { k: 'clay', u0: 20, u1: 118, y0: 0, y1: 35, depth: 70, w0: -1 },
    { k: 'plinth', u0: 118, u1: 160, h: 38, bay: 0, depth: 70 },
  ]), parts.sectors);
  parts.canopies.push(add(new EntryCanopy({ id: 'E-vip', x0: 400, x1: 492, z0: 10, z1: 128, y: 40, t: 3 })));
  parts.canopies.push(add(new EntryCanopy({ id: 'E-band', x0: 404, x1: 430, z0: 206, z1: 330, y: 62, t: 4 }))); // p27 long horizontal canopy

  // ---------------- SOUTH face, z ~ +460 (p28 Alternate GA, p32 south elevation; p27 left)
  add(new Sector('S', 'S', 460, [
    { k: 'fins', u0: -348, u1: -282, y0: 0, y1: 150, spacing: 7.5, backing: 'metal' },
    { k: 'metal', u0: -282, u1: -200, y0: 0, y1: 140, depth: 40 },
    { k: 'mesh', u0: -200, u1: -105, y0: 30, y1: 130, depth: 50 },
    { k: 'plinth', u0: -200, u1: -105, h: 30, bay: 0 },
    { k: 'glazing', u0: -105, u1: 105, levels: [0, 48], band: 2, mullion: 6 },
    { k: 'mesh', u0: 105, u1: 196, y0: 30, y1: 130, depth: 50 },
    { k: 'plinth', u0: 105, u1: 196, h: 30, bay: 22, bayW: 12 },
    { k: 'fins', u0: 196, u1: 404, y0: 0, y1: 146, spacing: 8, depth: [6, 8], backing: 'glass' }, // p27 long fin wall
  ]), parts.sectors);
  parts.canopies.push(add(new EntryCanopy({ id: 'S-ga', x0: -60, x1: 60, z0: 455, z1: 520, y: 60, t: 3 })));
  // p27 "Soffit": tilted blade over the south-east fin wall, rising toward the west
  parts.canopies.push(add(new Blade({ id: 'SE', corners: [[404, 118, 452], [404, 112, 540], [190, 188, 540], [190, 196, 452]] })));

  // ---------------- WEST face, x ~ -400 (p29 GA West Entry, p33 west elevation). u = z.
  add(new Sector('W', 'W', -400, [
    { k: 'mesh', u0: -470, u1: -300, y0: 20, y1: 112, depth: 60 },
    { k: 'plinth', u0: -470, u1: -300, h: 20, bay: 0 },
    { k: 'fins', u0: -300, u1: -120, y0: 0, y1: 150, spacing: 7, depth: [6, 8], backing: 'metal' }, // p29 "Fins"
    { k: 'metal', u0: -120, u1: -60, y0: 0, y1: 176, depth: 40, w0: 6 }, // p29 "Metal Panel" tower
    { k: 'glazing', u0: -104, u1: -76, levels: [20, 50, 80, 110, 140, 170], w0: 6.3, band: 3 },
    { k: 'mesh', u0: -60, u1: 70, y0: 10, y1: 150, depth: 50, w0: 10 }, // p29 "Mesh/Grate" box
    { k: 'glazing', u0: 70, u1: 330, levels: [30, 58, 88, 118], w0: -8 }, // open concourse behind the GA entry
    { k: 'plinth', u0: 86, u1: 320, h: 14, bay: 0, w0: 70, depth: 8 }, // low masonry wall (p29 "Masonry")
    { k: 'fins', u0: 330, u1: 396, y0: 0, y1: 150, spacing: 7, backing: 'glass' }, // p29 "Fins" right of the entry
  ]), parts.sectors);
  parts.canopies.push(add(new EntryCanopy({ id: 'W-ga', x0: -515, x1: -392, z0: 70, z1: 330, y: 72, t: 9 }))); // p29 cantilevered entry canopy

  // ---------------- towers
  for (const t of LAYOUT.towers) parts.towers.push(add(new Tower(t)));

  // ---------------- videoboards
  for (const bd of LAYOUT.boards) parts.boards.push(add(new VideoBoard(bd, boardMaterial)));

  // ---------------- canopy wings + PV array (exactly ROOF.pv.panels instances)
  const cells = pvLayout(LAYOUT.wings, ROOF.pv.panels);
  for (const w of LAYOUT.wings) {
    const wing = new CanopyWing(w, { pvCells: cells[w.id] });
    parts.wings.push(add(wing));
  }

  root.userData.parts = parts;
  root.userData.logoSlots = [];
  root.traverse((o) => { if (o.name === 'LOGO_SLOT') root.userData.logoSlots.push(o); });
  return root;
}
