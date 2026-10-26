// Remaining kit pieces: metal panel walls, videoboard volumes, cantilevered entry canopies,
// the seating bowl with its open-air concourses, and the grand stair.
import * as THREE from 'three';
import { KitPart, frame } from './builder.js';
import { FT, LAYOUT } from '../data.js';

export function addMetal(b, F, { u0, u1, y0, y1, w0 = 0, depth = 20 }) {
  b.fbox('clay', F, u0, u1, y0, y1, w0 - depth, w0 - 1);
  b.fbox('metal', F, u0, u1, y0, y1, w0 - 1, w0);
}

export class MetalPanel extends KitPart {
  constructor(o) {
    super(o.name || 'MetalPanel');
    addMetal(this.b, frame(o.face, o.line), o);
    this.finish();
  }
}

// Trapezoidal videoboard volume above the grand stair (p26, p30, p66). Screen face leans out.
export class VideoBoard extends KitPart {
  constructor(o, screenMaterial) {
    super('VideoBoard:' + o.id);
    this.o = o;
    const { z, dir, w, wTop, y0, y1, depth, lean } = o;
    const zf0 = z, zf1 = z + dir * lean; // front face bottom / top
    const zb = z - dir * depth;
    const b = this.b;
    const P = (x, y, zz) => [x, y, zz];
    // frame volume (8 faces of a skewed box)
    const f = [P(-w / 2, y0, zf0), P(w / 2, y0, zf0), P(wTop / 2, y1, zf1), P(-wTop / 2, y1, zf1)];
    const k = [P(-w / 2 + 6, y0 + 4, zb), P(w / 2 - 6, y0 + 4, zb), P(wTop / 2 - 6, y1 - 2, zb), P(-wTop / 2 + 6, y1 - 2, zb)];
    const quad = (a, c, d, e) => (dir < 0 ? b.quad('boardFrame', a, c, d, e) : b.quad('boardFrame', e, d, c, a));
    quad(f[1], f[0], k[0], k[1]); // bottom
    quad(f[3], f[2], k[2], k[3]); // top
    quad(f[0], f[3], k[3], k[0]); // side
    quad(f[2], f[1], k[1], k[2]); // side
    quad(k[1], k[0], k[3], k[2]); // back
    // the screen, inset 4 ft from the frame edge, 0.6 ft proud
    const ins = 4;
    const lerp = (a, c, t) => a.map((v, i) => v + (c[i] - v) * t);
    const off = (p) => [p[0], p[1], p[2] + dir * 0.6];
    const yb = y0 + ins, yt = y1 - ins;
    const tb = (yb - y0) / (y1 - y0), tt = (yt - y0) / (y1 - y0);
    const L0 = lerp(f[0], f[3], tb), R0 = lerp(f[1], f[2], tb), L1 = lerp(f[0], f[3], tt), R1 = lerp(f[1], f[2], tt);
    const sc = [off([L0[0] + ins, L0[1], L0[2]]), off([R0[0] - ins, R0[1], R0[2]]), off([R1[0] - ins, R1[1], R1[2]]), off([L1[0] + ins, L1[1], L1[2]])];
    const sg = new THREE.BufferGeometry();
    const order = dir < 0 ? [sc[1], sc[0], sc[3], sc[1], sc[3], sc[2]] : [sc[0], sc[1], sc[2], sc[0], sc[2], sc[3]];
    sg.setAttribute('position', new THREE.Float32BufferAttribute(order.flat().map((v) => v * FT), 3));
    const uvs = dir < 0 ? [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1] : [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
    sg.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    sg.computeVertexNormals();
    b.add('board', sg, { keepUV: true });
    // frame fins either side of the board (p13 "video board" swatch)
    for (const s of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = s * (w / 2 + 4 + i * 5);
        b.minmax('fins', x - 0.9, y0 - 4, Math.min(zf0, zb), x + 0.9, y1 + 2, Math.max(zf0, zb) + (dir > 0 ? 2 : 0));
      }
    }
    // supports down to the concourse
    for (const s of [-1, 1]) b.minmax('boardFrame', s * (w / 2 - 20) - 3, 30, zb - 3 * dir, s * (w / 2 - 20) + 3, y0, zb + 3 * dir);
    this.finish();
    this.meshes.board.material = screenMaterial || this.meshes.board.material;
    this.screen = this.meshes.board;
    this.screenCenter = new THREE.Vector3(0, ((y0 + y1) / 2) * FT, (z + dir * (lean / 2 + 1)) * FT);
  }
}

// Cantilevered entry canopy: flat slab with aluminium soffit (p26 NW pavilion, p29 GA West).
export class EntryCanopy extends KitPart {
  constructor(o) {
    super('EntryCanopy:' + o.id);
    const { x0, x1, z0, z1, y, t = 3, posts = [] } = o;
    const b = this.b;
    b.minmax('metal', x0, y, z0, x1, y + t, z1);
    b.minmax('soffit', x0 + 0.3, y - 0.3, z0 + 0.3, x1 - 0.3, y, z1 - 0.3);
    for (const [px, pz] of posts) b.minmax('steel', px - 1, 0, pz - 1, px + 1, y, pz + 1);
    this.finish();
  }
}

// Rounded-rectangle ring in plan (feet), n points per corner.
export function ringPts(hx, hz, r, n = 8) {
  r = Math.min(r, hx - 0.01, hz - 0.01);
  const pts = [];
  const cs = [[hx - r, hz - r, 0], [-(hx - r), hz - r, Math.PI / 2], [-(hx - r), -(hz - r), Math.PI], [hx - r, -(hz - r), 1.5 * Math.PI]];
  for (const [cx, cz, a0] of cs) for (let i = 0; i <= n; i++) {
    const a = a0 + (i / n) * (Math.PI / 2);
    pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return pts;
}

// Seating bowl lofted through rounded-rect rings (p34/p35 sections; p74 plan).
export class Bowl extends KitPart {
  constructor() {
    super('Bowl');
    const B = LAYOUT.bowl;
    const b = this.b;
    // [hx, hz, r, y] from the field edge up to the rim
    const rings = [
      [B.fieldX, B.fieldZ, 40, B.fieldY + 4],
      [B.fieldX + 72, B.fieldZ + 72, 90, 26],
      [B.fieldX + 80, B.fieldZ + 80, 95, 42], // suite / club fascia
      [B.fieldX + 92, B.fieldZ + 92, 100, 52],
      [B.outerX - 22, B.outerZ - 22, B.cornerR - 10, B.rim],
    ];
    for (let k = 0; k < rings.length - 1; k++) this.loft(rings[k], rings[k + 1], k === 2 ? 'clay' : 'seating');
    // outer wall of the bowl down to grade, and the rim parapet
    this.loft([B.outerX - 22, B.outerZ - 22, B.cornerR - 10, B.rim], [B.outerX - 22, B.outerZ - 22, B.cornerR - 10, B.rim + 4], 'clay');
    this.loft([B.outerX - 22, B.outerZ - 22, B.cornerR - 10, 0], [B.outerX - 22, B.outerZ - 22, B.cornerR - 10, B.rim], 'clay', true);
    // field
    const fg = new THREE.PlaneGeometry(B.fieldX * 2 * FT, B.fieldZ * 2 * FT);
    fg.rotateX(-Math.PI / 2); fg.translate(0, B.fieldY * FT, 0);
    b.add('clay', fg);
    // open-air concourse decks between the bowl and the facade line
    for (const y of LAYOUT.concourses) this.slab(B.outerX - 22, B.outerZ - 22, 392, 462, y);
    this.finish({ edgeAngle: 35 });
  }

  loft(A, C, key, flip = false) {
    const pa = ringPts(A[0], A[1], A[2]), pc = ringPts(C[0], C[1], C[2]);
    const pos = [], uv = [];
    let run = 0;
    const rake = Math.hypot(Math.hypot(C[0] - A[0], C[1] - A[1]), C[3] - A[3]) * FT;
    for (let i = 0; i < pa.length; i++) {
      const j = (i + 1) % pa.length;
      const a0 = [pa[i][0], A[3], pa[i][1]], a1 = [pa[j][0], A[3], pa[j][1]];
      const c0 = [pc[i][0], C[3], pc[i][1]], c1 = [pc[j][0], C[3], pc[j][1]];
      const seg = Math.hypot(pa[j][0] - pa[i][0], pa[j][1] - pa[i][1]) * FT;
      const tri = flip ? [a0, a1, c1, a0, c1, c0] : [a0, c1, a1, a0, c0, c1];
      const tuv = flip ? [[run, 0], [run + seg, 0], [run + seg, rake], [run, 0], [run + seg, rake], [run, rake]]
        : [[run, 0], [run + seg, rake], [run + seg, 0], [run, 0], [run, rake], [run + seg, rake]];
      tri.forEach((p) => pos.push(p[0] * FT, p[1] * FT, p[2] * FT));
      tuv.forEach((t) => uv.push(t[0], t[1]));
      run += seg;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    this.b.add(key, g, { keepUV: true });
  }

  slab(ix, iz, ox, oz, y) {
    // a thin rounded-rect annulus: inner ring = bowl wall, outer ring = facade line
    const pi = ringPts(ix, iz, LAYOUT.bowl.cornerR - 10), po = ringPts(ox, oz, 60);
    const shape = new THREE.Shape(po.map(([x, z]) => new THREE.Vector2(x * FT, z * FT)));
    shape.holes.push(new THREE.Path(pi.map(([x, z]) => new THREE.Vector2(x * FT, z * FT)).reverse()));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 1.6 * FT, bevelEnabled: false, curveSegments: 4 });
    g.rotateX(Math.PI / 2);
    g.translate(0, y * FT, 0);
    this.b.add('clay', g);
  }
}

// Grand stair from the plaza up to the main concourse beneath the north board (p26).
export class GrandStair extends KitPart {
  constructor({ x0 = -78, x1 = 78, zTop = -470, zBottom = -548, rise = 30 } = {}) {
    super('GrandStair');
    const n = 22;
    const run = (zTop - zBottom) / n;
    for (let i = 0; i < n; i++) {
      const y = ((i + 1) / n) * rise;
      this.b.minmax('clay', x0, 0, zBottom + i * run, x1, y, zTop);
    }
    // cheek walls in masonry
    for (const s of [-1, 1]) this.b.minmax('masonry', s > 0 ? x1 : x0 - 6, 0, zBottom, s > 0 ? x1 + 6 : x0, rise + 3.5, zTop);
    this.finish({ edgeAngle: 40 });
  }
}

// Tilted cantilevered blade (thin planar canopy, aluminium soffit underneath), e.g. the
// "Soffit" blade over the south-east fin wall on p27. corners: 4 x [x, y, z] top surface (ft).
export class Blade extends KitPart {
  constructor({ id, corners, t = 3 }) {
    super('Blade:' + id);
    const b = this.b;
    const dn = (p) => [p[0], p[1] - t, p[2]];
    const [a, c, d, e] = corners;
    b.quad('roof', a, c, d, e);
    b.quad('soffit', dn(e), dn(d), dn(c), dn(a));
    for (let i = 0; i < 4; i++) {
      const p = corners[i], q = corners[(i + 1) % 4];
      b.quad('metal', q, p, dn(p), dn(q));
    }
    this.finish({ edgeAngle: 20 });
    for (const m of Object.values(this.meshes)) m.material.side = THREE.DoubleSide;
  }
}
