// White-clay massing of the bowl and building (p63, p66, p67 language): raked tiers with
// seat rows as fine instanced strips, hairline edges, sideline canopies, the north plaza,
// the main concourse with the super vom under the north board, and the existing board on
// its framed tower (p52 "existing") for Scene 1.
import * as THREE from 'three';
import { COLORS } from '../data.js';
import { RING, ringPoint, sampleRing, runsWhere } from './ring.js';

export const LEVELS = {
  field: 0,
  mainConcourse: 34, // p51 "MAIN CONCOURSE" (≈ +38' over the lowered field at the section's scale)
};

// Bowl tiers: profile points (d = offset from the ring, y = height), and where they exist.
export const TIERS = {
  lower: { d0: 0, rows: 34, tread: 2.9, y0: 6, rise: 1.3, curve: 0.004 },
  club: { d0: 104, rows: 10, tread: 3.0, y0: 58, rise: 1.25, curve: 0 },
  upper: { d0: 146, rows: 34, tread: 3.1, y0: 99, rise: 1.9, curve: 0.006 },
};

// Ribbon fascias (p69): offset and bottom height of each 3' run.
export const RIBBON_FASCIA = {
  lowerClub: { d: -0.4, y: 3.0 },
  presidents: { d: 99.6, y: 51.5 },
  club: { d: 133.6, y: 72.5 },
  upperBowl: { d: 145.6, y: 95.5 },
};

const rowY = (t, k) => t.y0 + k * t.rise + t.curve * k * k;
const rowD = (t, k) => t.d0 + k * t.tread;

export function tierTop(t) {
  return { d: rowD(t, t.rows), y: rowY(t, t.rows) };
}

const SUPER_VOM_HALF = 26; // half-width of the super vom cut through the north lower bowl

export class Stadium {
  constructor({ quality = 'high' } = {}) {
    this.group = new THREE.Group();
    this.group.name = 'stadium';
    this.quality = quality;
    this.clay = new THREE.MeshStandardMaterial({ color: COLORS.clay, roughness: 0.88, side: THREE.DoubleSide });
    this.seatMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#C6CDD2'), roughness: 0.9 });
    this.glassBand = new THREE.MeshStandardMaterial({ color: new THREE.Color('#9AA6AC'), roughness: 0.25, metalness: 0.2 });
    this.lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.hairline), transparent: true, opacity: 0.35 });
    this.base = sampleRing(0, quality === 'high' ? 7 : 12);

    this.#field();
    this.#ground();
    this.#tiers();
    this.#canopies();
    this.#building();
    this.#concourse();
    this.#existingBoard();
    this.#goalposts();
  }

  // ---------- helpers
  #extrude(run, profile, mat, closed = false) {
    // profile: [[d, y], ...] → quads between consecutive samples, flat-shaded per profile segment
    const pos = [];
    const P = (p, d, y) => [p.x + p.nx * d, y, p.z + p.nz * d];
    const n = run.length;
    const lim = closed ? n : n - 1;
    for (let i = 0; i < lim; i++) {
      const a = run[i], b = run[(i + 1) % n];
      for (let k = 0; k < profile.length - 1; k++) {
        const [d0, y0] = profile[k], [d1, y1] = profile[k + 1];
        const A = P(a, d0, y0), B = P(b, d0, y0), C = P(b, d1, y1), D = P(a, d1, y1);
        pos.push(...A, ...B, ...C, ...A, ...C, ...D);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  #polyline(run, d, y, closed = false) {
    const pts = run.map((p) => new THREE.Vector3(p.x + p.nx * d, y, p.z + p.nz * d));
    if (closed) pts.push(pts[0].clone());
    return pts;
  }

  #lines(polylines) {
    const pos = [];
    for (const pl of polylines) for (let i = 0; i < pl.length - 1; i++) pos.push(pl[i].x, pl[i].y, pl[i].z, pl[i + 1].x, pl[i + 1].y, pl[i + 1].z);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    const l = new THREE.LineSegments(g, this.lineMat);
    this.group.add(l);
    return l;
  }

  #seats(runs, tier, rowFilter = () => true) {
    const items = [];
    for (const run of runs)
      for (let k = 0; k < tier.rows; k++) {
        const d = rowD(tier, k) + tier.tread * 0.62, y = rowY(tier, k + 1) - tier.rise * 0.05;
        for (let i = 0; i < run.length - 1; i++) {
          const a = run[i], b = run[i + 1];
          if (!rowFilter(a, k, y)) continue;
          items.push([a.x + a.nx * d, a.z + a.nz * d, b.x + b.nx * d, b.z + b.nz * d, y]);
        }
      }
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mesh = new THREE.InstancedMesh(geo, this.seatMat, items.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    items.forEach(([x0, z0, x1, z1, y], i) => {
      const len = Math.hypot(x1 - x0, z1 - z0);
      q.setFromAxisAngle(up, Math.atan2(-(z1 - z0), x1 - x0));
      s.set(len * 0.985, 0.9, 1.45);
      p.set((x0 + x1) / 2, y + 0.45, (z0 + z1) / 2);
      mesh.setMatrixAt(i, m.compose(p, q, s));
    });
    mesh.castShadow = this.quality === 'high';
    mesh.receiveShadow = true;
    this.group.add(mesh);
    return mesh;
  }

  // ---------- field (360' × 160', lowered 4' — p51 / p53)
  #field() {
    const c = document.createElement('canvas');
    c.width = 2048;
    c.height = 1024;
    const g = c.getContext('2d');
    const sx = 2048 / 400, sz = 1024 / 200; // canvas covers 400' × 200' (field + border)
    g.fillStyle = '#4E8A3E';
    g.fillRect(0, 0, 2048, 1024);
    for (let i = 0; i < 24; i++) {
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.035)' : 'rgba(0,0,0,0.04)';
      g.fillRect((20 + 30 + i * 15) * sx, 20 * sz, 15 * sx, 160 * sz);
    }
    // end zones: plain midnight green fills (no marks)
    g.fillStyle = '#0F4A52';
    g.fillRect(20 * sx, 20 * sz, 30 * sx, 160 * sz);
    g.fillRect(350 * sx, 20 * sz, 30 * sx, 160 * sz);
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2.2 * sx * 0.33;
    g.strokeRect(20 * sx, 20 * sz, 360 * sx, 160 * sz);
    for (let yd = 0; yd <= 100; yd += 5) {
      const x = (50 + yd * 3) * sx;
      g.lineWidth = (yd % 10 === 0 ? 0.6 : 0.45) * sx;
      g.beginPath();
      g.moveTo(x, 20 * sz);
      g.lineTo(x, 180 * sz);
      g.stroke();
    }
    g.lineWidth = 0.35 * sx;
    for (let yd = 1; yd < 100; yd++) {
      if (yd % 5 === 0) continue;
      const x = (50 + yd * 3) * sx;
      for (const zz of [21, 100 - 9.25, 100 + 9.25 - 2, 177]) {
        g.beginPath();
        g.moveTo(x, zz * sz);
        g.lineTo(x, (zz + 2) * sz);
        g.stroke();
      }
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 });
    const geo = new THREE.PlaneGeometry(400, 200).rotateX(-Math.PI / 2).rotateY(Math.PI / 2); // long axis → world Z
    const mesh = new THREE.Mesh(geo, mat);
    mesh.receiveShadow = true;
    this.group.add(mesh);
    this.fieldMat = mat;
    // turf apron to the bowl wall
    const shape = new THREE.Shape();
    const loop = this.base.map((p) => new THREE.Vector2(p.x, -p.z));
    shape.setFromPoints(loop);
    const hole = new THREE.Path([new THREE.Vector2(-100, -200), new THREE.Vector2(100, -200), new THREE.Vector2(100, 200), new THREE.Vector2(-100, 200)].reverse());
    shape.holes.push(hole);
    const apron = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshStandardMaterial({ color: new THREE.Color('#4A8239'), roughness: 1 }));
    apron.rotation.x = -Math.PI / 2;
    apron.position.y = -0.02;
    apron.receiveShadow = true;
    this.group.add(apron);
  }

  #ground() {
    this.groundMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#E6E8EB'), roughness: 0.95 });
    const g = new THREE.Mesh(new THREE.CircleGeometry(5000, 64), this.groundMat);
    g.rotation.x = -Math.PI / 2;
    g.position.y = -0.6;
    g.receiveShadow = true;
    this.group.add(g);
    // north plaza (p26): paving grid lines
    const pos = [];
    for (let x = -360; x <= 360; x += 30) pos.push(x, -0.3, -440, x, -0.3, -820);
    for (let z = -440; z >= -820; z -= 30) pos.push(-360, -0.3, z, 360, -0.3, z);
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    this.plazaLines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.hairline), transparent: true, opacity: 0.18 }));
    this.group.add(this.plazaLines);
    this.plazaMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#ECEDEF'), roughness: 0.9 });
    const plaza = new THREE.Mesh(new THREE.PlaneGeometry(720, 380), this.plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(0, -0.4, -630);
    plaza.receiveShadow = true;
    this.group.add(plaza);
    // white clay trees (p26)
    const trunk = new THREE.CylinderGeometry(0.8, 1.1, 14, 6);
    const crown = new THREE.IcosahedronGeometry(13, 1);
    const tm = new THREE.MeshStandardMaterial({ color: COLORS.clay, roughness: 1, flatShading: true });
    for (let i = 0; i < 18; i++) {
      const side = i % 2 ? 1 : -1;
      const x = side * (250 + (i % 3) * 38 + Math.sin(i * 3.7) * 10);
      const z = -470 - Math.floor(i / 2) * 36;
      const t = new THREE.Mesh(trunk, tm);
      t.position.set(x, 7, z);
      const c = new THREE.Mesh(crown, tm);
      c.position.set(x, 22, z);
      c.scale.set(1, 0.85, 1);
      t.castShadow = c.castShadow = true;
      this.group.add(t, c);
    }
  }

  #tiers() {
    const T = TIERS;
    const base = this.base;
    const lines = [];
    // Lower bowl — a full ring, except the super vom cut at the north end (p51 item 4)
    const lowerProfile = [[-1, 0], [-1, T.lower.y0]];
    for (let k = 0; k <= T.lower.rows; k++) lowerProfile.push([rowD(T.lower, k), rowY(T.lower, k)]);
    const lt = tierTop(T.lower);
    lowerProfile.push([lt.d + 2, lt.y], [lt.d + 2, LEVELS.mainConcourse - 6]);
    const isVom = (p) => Math.abs(p.x) < SUPER_VOM_HALF && p.z < -150;
    const outsideVom = runsWhere(base, (p) => !isVom(p));
    for (const r of outsideVom) this.#extrude(r, lowerProfile, this.clay);
    // inside the vom: rows stop below the concourse; cheek walls either side
    const vomRuns = runsWhere(base, isVom);
    const kMax = Array.from({ length: T.lower.rows + 1 }, (_, k) => k).filter((k) => rowY(T.lower, k) < LEVELS.mainConcourse - 1).pop();
    const vomProfile = lowerProfile.slice(0, 2 + kMax + 1);
    vomProfile.push([rowD(T.lower, kMax) + 0.5, LEVELS.mainConcourse - 0.5], [lt.d + 2, LEVELS.mainConcourse - 0.5]);
    for (const r of vomRuns) this.#extrude(r, vomProfile, this.clay);
    for (const x of [-SUPER_VOM_HALF, SUPER_VOM_HALF]) {
      const d0 = rowD(T.lower, kMax), d1 = lt.d + 2;
      const zf = -(RING.hz + d0), zb = -(RING.hz + d1);
      const shape = new THREE.Shape([new THREE.Vector2(zf, rowY(T.lower, kMax)), new THREE.Vector2(zb, LEVELS.mainConcourse - 1), new THREE.Vector2(zb, lt.y + 3.5), new THREE.Vector2(zf, rowY(T.lower, kMax) + 3.5)]);
      const wall = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 1.2, bevelEnabled: false }), this.clay);
      wall.rotation.y = -Math.PI / 2;
      wall.position.x = x - 0.6;
      wall.castShadow = wall.receiveShadow = true;
      this.group.add(wall);
    }
    this.#seats(outsideVom, T.lower);
    this.#seats(vomRuns, T.lower, (a, k) => k < kMax);
    for (const r of outsideVom) lines.push(this.#polyline(r, -1, T.lower.y0), this.#polyline(r, lt.d + 2, lt.y));

    // Club tier, president's club band and suites — sides only (|z| < 205)
    const sides = runsWhere(base, (p) => Math.abs(p.z) < 205);
    const ct = tierTop(T.club);
    const clubProfile = [[lt.d + 2, lt.y], [lt.d + 2, T.club.y0 - 0.5], [T.club.d0, T.club.y0]];
    for (let k = 0; k <= T.club.rows; k++) clubProfile.push([rowD(T.club, k), rowY(T.club, k)]);
    clubProfile.push([ct.d + 3, ct.y], [ct.d + 3, ct.y + 3.5], [ct.d + 5, ct.y + 3.5]);
    for (const r of sides) {
      this.#extrude(r, clubProfile, this.clay);
      this.#extrude(r, [[ct.d + 5, ct.y + 3.6], [ct.d + 5, T.upper.y0 - 3.8]], this.glassBand); // suites glazing
      this.#extrude(r, [[ct.d + 5, T.upper.y0 - 3.8], [T.upper.d0, T.upper.y0 - 3.8], [T.upper.d0, T.upper.y0]], this.clay);
      lines.push(this.#polyline(r, ct.d + 5, ct.y + 3.6), this.#polyline(r, ct.d + 5, T.upper.y0 - 3.8));
    }
    this.#seats(sides, T.club);

    // Upper bowl — sides and corners, open at the ends where the boards sit
    const ut = tierTop(T.upper);
    const upperRuns = runsWhere(base, (p) => Math.abs(p.z) < 228 || Math.abs(p.x) > 100);
    const upperProfile = [];
    for (let k = 0; k <= T.upper.rows; k++) upperProfile.push([rowD(T.upper, k), rowY(T.upper, k)]);
    upperProfile.push([ut.d + 3, ut.y], [ut.d + 3, ut.y + 6], [ut.d + 6, ut.y + 6], [ut.d + 6, 0]);
    for (const r of upperRuns) {
      this.#extrude(r, upperProfile, this.clay);
      // underside soffit back to the suites
      this.#extrude(r, [[T.upper.d0, T.upper.y0 - 3.8], [ut.d + 6, T.upper.y0 + 30]], this.clay);
      lines.push(this.#polyline(r, T.upper.d0, T.upper.y0), this.#polyline(r, ut.d + 3, ut.y + 6));
      // aisle hairlines
      for (let i = 0; i < r.length; i += 6) {
        const p = r[i];
        lines.push([0, T.upper.rows].map((k) => new THREE.Vector3(p.x + p.nx * rowD(T.upper, k), rowY(T.upper, k) + 0.2, p.z + p.nz * rowD(T.upper, k))));
      }
    }
    this.#seats(upperRuns, T.upper);
    for (const r of outsideVom)
      for (let i = 0; i < r.length; i += 7) {
        const p = r[i];
        lines.push([0, T.lower.rows].map((k) => new THREE.Vector3(p.x + p.nx * rowD(T.lower, k), rowY(T.lower, k) + 0.2, p.z + p.nz * rowD(T.lower, k))));
      }
    this.hairlines = this.#lines(lines);
    this.upperTop = ut;
  }

  #canopies() {
    // Sideline canopies (p66, p70): thin roofs over the upper bowl, rising outward.
    // Collected into this.canopies so the bowl diagrams (p67/p69 have no roof) can hide them.
    const before = this.group.children.length;
    const sides = runsWhere(sampleRing(0, 10), (p) => Math.abs(p.z) < 300 && Math.abs(p.x) > 60);
    const ut = this.upperTop;
    const prof = [[ut.d - 120, ut.y + 34], [ut.d + 30, ut.y + 52], [ut.d + 30, ut.y + 49], [ut.d - 120, ut.y + 31], [ut.d - 120, ut.y + 34]];
    for (const r of sides) {
      this.#extrude(r, prof, this.clay);
      const pts = [];
      for (let i = 0; i < r.length; i += 3) {
        const p = r[i];
        // canopy struts
        pts.push([new THREE.Vector3(p.x + p.nx * (ut.d + 4), ut.y + 6, p.z + p.nz * (ut.d + 4)), new THREE.Vector3(p.x + p.nx * (ut.d + 4), ut.y + 47, p.z + p.nz * (ut.d + 4))]);
      }
      this.#lines([this.#polyline(r, ut.d - 120, ut.y + 34), this.#polyline(r, ut.d + 30, ut.y + 52), ...pts]);
      const strut = new THREE.CylinderGeometry(0.9, 0.9, 41, 6);
      for (let i = 0; i < r.length; i += 3) {
        const p = r[i];
        const m = new THREE.Mesh(strut, this.clay);
        m.position.set(p.x + p.nx * (ut.d + 4), ut.y + 26.5, p.z + p.nz * (ut.d + 4));
        m.castShadow = true;
        this.group.add(m);
      }
    }
    this.canopies = new THREE.Group();
    this.canopies.add(...this.group.children.slice(before));
    this.group.add(this.canopies);
  }

  #building() {
    // perimeter building with vertical fins (p13, p26) on the sides
    const ut = this.upperTop;
    const sides = runsWhere(sampleRing(0, 10), (p) => Math.abs(p.z) < 300 && Math.abs(p.x) > 60);
    for (const r of sides) this.#extrude(r, [[ut.d + 6, 0], [ut.d + 16, 0], [ut.d + 16, ut.y - 30], [ut.d + 6, ut.y - 30]], this.clay);
    const finGeo = new THREE.BoxGeometry(1.2, 1, 5);
    const fins = [];
    for (const r of sides)
      for (let i = 0; i < r.length; i++) {
        const p = r[i];
        fins.push([p.x + p.nx * (ut.d + 18.5), p.z + p.nz * (ut.d + 18.5), Math.atan2(p.nx, p.nz)]);
      }
    const fm = new THREE.InstancedMesh(finGeo, this.clay, fins.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, ut.y - 34, 1), p = new THREE.Vector3();
    fins.forEach(([x, z, a], i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), a);
      p.set(x, (ut.y - 34) / 2 + 2, z);
      fm.setMatrixAt(i, m.compose(p, q, s));
    });
    fm.castShadow = true;
    this.group.add(fm);
    // north towers flanking the plaza (p26: fins + glazing)
    const tower = new THREE.BoxGeometry(46, 205, 46);
    for (const x of [-232, 232]) {
      const t = new THREE.Mesh(tower, this.clay);
      t.position.set(x, 102.5, -392);
      t.castShadow = t.receiveShadow = true;
      this.group.add(t);
      const e = new THREE.LineSegments(new THREE.EdgesGeometry(tower), this.lineMat);
      e.position.copy(t.position);
      this.group.add(e);
    }
    // south end building under/behind the south board
    const sb = new THREE.Mesh(new THREE.BoxGeometry(330, 62, 110), this.clay);
    sb.position.set(0, 31, 372);
    sb.castShadow = sb.receiveShadow = true;
    this.group.add(sb);
  }

  #concourse() {
    // main concourse slab under the north board (p51) — the super vom opens it to the field
    const slab = new THREE.Mesh(new THREE.BoxGeometry(400, 2, 120), this.clay);
    slab.position.set(0, LEVELS.mainConcourse - 1, -382);
    slab.receiveShadow = slab.castShadow = true;
    this.group.add(slab);
    // supporting walls below the concourse
    const wall = new THREE.Mesh(new THREE.BoxGeometry(400, LEVELS.mainConcourse - 2, 2), this.clay);
    wall.position.set(0, (LEVELS.mainConcourse - 2) / 2, -441);
    this.group.add(wall);
    // columns carrying the north board (p63)
    const col = new THREE.CylinderGeometry(1.6, 1.6, 1, 10);
    this.columns = new THREE.Group();
    for (const x of [-96, -64, 64, 96])
      for (const z of [-338, -372]) {
        const m = new THREE.Mesh(col, this.clay);
        m.position.set(x, 30, z);
        m.scale.y = 60;
        m.castShadow = true;
        this.columns.add(m);
      }
    for (const x of [-30, 30])
      for (const z of [-372]) {
        const m = new THREE.Mesh(col, this.clay);
        m.position.set(x, 30, z);
        m.scale.y = 60;
        m.castShadow = true;
        this.columns.add(m);
      }
    this.group.add(this.columns);
    // concourse guard rail at the vom
    const rail = new THREE.Mesh(new THREE.BoxGeometry(2 * SUPER_VOM_HALF, 3.4, 0.4), new THREE.MeshStandardMaterial({ color: '#cfd6da', transparent: true, opacity: 0.35, roughness: 0.1 }));
    rail.position.set(0, LEVELS.mainConcourse + 1.7, -(RING.hz + tierTop(TIERS.lower).d + 1));
    this.group.add(rail);
  }

  #existingBoard() {
    // Scene 1 only: the existing north board as a flat rectangle on a framed tower (p52).
    const g = new THREE.Group();
    g.name = 'existing-board';
    const W = 150, H = 44;
    this.existingScreen = new THREE.Mesh(new THREE.PlaneGeometry(W, H), null);
    this.existingScreen.position.set(0, 112, -312);
    g.add(this.existingScreen);
    const frameMat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#2b3236'), roughness: 0.7 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(W + 4, H + 4, 4), frameMat);
    back.position.set(0, 112, -315);
    g.add(back);
    // framed lattice tower (p52 existing): legs + braces
    const leg = new THREE.BoxGeometry(1.4, 1, 1.4);
    const add = (x, y, z, sy, rz = 0, rx = 0) => {
      const m = new THREE.Mesh(leg, frameMat);
      m.position.set(x, y, z);
      m.scale.y = sy;
      m.rotation.set(rx, 0, rz);
      g.add(m);
    };
    for (const x of [-70, -40, 40, 70]) add(x, 45, -318, 90);
    for (let y = 10; y < 90; y += 16) {
      for (const [x0, x1] of [[-70, -40], [40, 70]]) {
        add((x0 + x1) / 2, y + 8, -318, Math.hypot(30, 16), Math.atan2(30, 16));
        add((x0 + x1) / 2, y + 8, -318, Math.hypot(30, 16), -Math.atan2(30, 16));
      }
    }
    this.existingBoard = g;
    this.group.add(g);
  }

  #goalposts() {
    const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color('#E5C33A'), roughness: 0.5, emissive: new THREE.Color('#E5C33A'), emissiveIntensity: 0.05 });
    for (const z of [-180, 180]) {
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 10, 8), mat);
      post.position.set(0, 5, z + Math.sign(z) * 4);
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 6, 8), mat);
      neck.rotation.x = Math.PI / 2;
      neck.position.set(0, 10, z + Math.sign(z) * 1);
      const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 18.5, 8), mat);
      bar.rotation.z = Math.PI / 2;
      bar.position.set(0, 10, z);
      g.add(post, neck, bar);
      for (const x of [-9.25, 9.25]) {
        const u = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 35, 8), mat);
        u.position.set(x, 27.5, z);
        g.add(u);
      }
      g.traverse((m) => (m.castShadow = true));
      this.group.add(g);
    }
  }
}

export { ringPoint };
