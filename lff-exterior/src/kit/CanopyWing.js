// Planar roof wing: sloped top carrying the PV array on a structural space frame, very thin
// leading edges (~2.5 ft fascia), aluminium soffit band and a 316 stainless mirror field
// on the underside (p22, p24-29, p34-35).
import * as THREE from 'three';
import { KitPart } from './builder.js';
import { FT, LAYOUT, PAL } from '../data.js';
import { MAT } from '../materials.js';

export class CanopyWing extends KitPart {
  constructor(o, { pvCells = null } = {}) {
    super('CanopyWing:' + o.id);
    this.o = o;
    const sx = Math.sign(o.x0 + o.x1); // +1 east wing, -1 west wing
    const xin = Math.min(Math.abs(o.x0), Math.abs(o.x1));
    const h = (x, z) => o.y0 + o.gx * (Math.abs(x) - xin) + o.gz * Math.abs(z);
    this.height = h;
    const fas = LAYOUT.fascia, dep = LAYOUT.wingDepth, bnd = LAYOUT.soffitBand;
    const P = (x, z, dy = 0) => [x, h(x, z) + dy, z];
    const { x0, x1, z0, z1 } = o;
    const b = this.b;

    // top: PVC membrane (PV sits above it)
    b.quad('roof', P(x0, z0), P(x0, z1), P(x1, z1), P(x1, z0));
    // underside: mirror field (inset) + aluminium band slanting up to the thin fascia
    const ix0 = x0 + bnd, ix1 = x1 - bnd, iz0 = z0 + bnd, iz1 = z1 - bnd;
    b.quad('reflective', P(ix0, iz0, -dep), P(ix1, iz0, -dep), P(ix1, iz1, -dep), P(ix0, iz1, -dep));
    const ring = [[x0, z0, ix0, iz0], [x1, z0, ix1, iz0], [x1, z1, ix1, iz1], [x0, z1, ix0, iz1]];
    for (let i = 0; i < 4; i++) {
      const [ax, az, aix, aiz] = ring[i], [bx, bz, bix, biz] = ring[(i + 1) % 4];
      b.quad('wingSoffit', P(ax, az, -fas), P(bx, bz, -fas), P(bix, biz, -dep), P(aix, aiz, -dep));
      // fascia
      b.quad('wingSoffit', P(bx, bz, 0), P(ax, az, 0), P(ax, az, -fas), P(bx, bz, -fas));
    }
    this.areas = {
      reflective: (ix1 - ix0) * (iz1 - iz0),
      soffit: (x1 - x0) * (z1 - z0) - (ix1 - ix0) * (iz1 - iz0),
    };

    // raking V-struts from the bowl rim to the inner edge of the wing (p34/p35)
    const rim = LAYOUT.bowl.rim;
    const n = Math.max(2, Math.round(Math.abs(z1 - z0) / 95));
    for (let i = 0; i <= n; i++) {
      const z = z0 + 30 * Math.sign(z1 - z0) + ((z1 - z0 - 60 * Math.sign(z1 - z0)) * i) / n;
      const foot = [sx * (xin + 105), rim - 2, z];
      for (const dz of [-14, 14]) {
        const top = [sx * (xin + 34), h(sx * (xin + 34), z + dz) - dep, z + dz];
        this.strut(foot, top, 1.6);
      }
      const back = [sx * (xin + 150), h(sx * (xin + 150), z) - dep, z];
      this.strut([sx * (xin + 118), rim + 4, z], back, 1.4);
    }

    this.finish({ edgeAngle: 20 });
    // the mirror/soffit underside should not draw hairlines across the mirror
    this.children.filter((c) => c.isLineSegments && c.name.startsWith('reflective')).forEach((c) => (c.visible = false));
    this.meshes.reflective.receiveShadow = false;

    this.buildSpaceFrame(h, sx, xin);
    if (pvCells) this.buildPV(h, pvCells);
  }

  strut(a, c, r) {
    const A = new THREE.Vector3(...a).multiplyScalar(FT), C = new THREE.Vector3(...c).multiplyScalar(FT);
    const len = A.distanceTo(C);
    const g = new THREE.CylinderGeometry(r * FT, r * FT, len, 8, 1);
    g.translate(0, len / 2, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), C.clone().sub(A).normalize());
    g.applyQuaternion(q);
    g.translate(A.x, A.y, A.z);
    this.b.add('steel', g);
  }

  // Space frame: top chords on a 20 ft grid, bottom chords offset by half a bay, diagonals.
  // Segments are sorted by distance from the stadium centre so a growing drawRange "draws" it.
  buildSpaceFrame(h, sx, xin) {
    const { x0, x1, z0, z1 } = this.o;
    const dep = LAYOUT.wingDepth;
    const g = 20;
    const segs = [];
    const T = (x, z) => [x, h(x, z) - 0.4, z];
    const B = (x, z) => [x, h(x, z) - dep + 0.6, z];
    const xs = [], zs = [];
    for (let x = Math.min(x0, x1); x <= Math.max(x0, x1) + 0.01; x += (Math.abs(x1 - x0)) / Math.round(Math.abs(x1 - x0) / g)) xs.push(x);
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1) + 0.01; z += (Math.abs(z1 - z0)) / Math.round(Math.abs(z1 - z0) / g)) zs.push(z);
    for (let i = 0; i < xs.length; i++) for (let j = 0; j < zs.length; j++) {
      const x = xs[i], z = zs[j];
      if (i + 1 < xs.length) segs.push([T(x, z), T(xs[i + 1], z)]);
      if (j + 1 < zs.length) segs.push([T(x, z), T(x, zs[j + 1])]);
      if (i + 1 < xs.length && j + 1 < zs.length) {
        const cx = (x + xs[i + 1]) / 2, cz = (z + zs[j + 1]) / 2;
        const bc = B(cx, cz);
        segs.push([T(x, z), bc], [T(xs[i + 1], z), bc], [T(x, zs[j + 1]), bc], [T(xs[i + 1], zs[j + 1]), bc]);
        if (i + 2 < xs.length) segs.push([bc, B(cx + (xs[i + 1] - x), cz)]);
        if (j + 2 < zs.length) segs.push([bc, B(cx, cz + (zs[j + 1] - z))]);
      }
    }
    const mid = (s) => Math.hypot((s[0][0] + s[1][0]) / 2, (s[0][2] + s[1][2]) / 2);
    segs.sort((a, b2) => mid(a) - mid(b2));
    const pos = new Float32Array(segs.length * 6);
    segs.forEach((s, i) => { pos.set([...s[0], ...s[1]].map((v) => v * FT), i * 6); });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setDrawRange(0, 0);
    this.frameLines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: PAL.lineGreen, transparent: true, opacity: 0.95, depthWrite: false }));
    this.frameLines.name = 'spaceframe';
    this.frameLines.frustumCulled = false;
    this.frameLines.visible = false;
    this.frameSegs = segs.length;
    this.add(this.frameLines);
  }

  setFrameProgress(p) {
    const n = Math.round(THREE.MathUtils.clamp(p, 0, 1) * this.frameSegs);
    this.frameLines.geometry.setDrawRange(0, n * 2);
    this.frameLines.visible = n > 0 && this.frameLines.material.opacity > 0.01;
  }

  // Instanced PV panels on the given cells: [{x, z}] in feet (panel centres).
  buildPV(h, cells) {
    const geo = new THREE.BoxGeometry(4.4 * FT, 0.25 * FT, 7.4 * FT);
    // plane normal from the gradient of h
    const sx = Math.sign(this.o.x0 + this.o.x1), sz = Math.sign(this.o.z0 + this.o.z1) || 1;
    const nrm = new THREE.Vector3(-this.o.gx * sx, 1, -this.o.gz * sz).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nrm);
    const mesh = new THREE.InstancedMesh(geo, MAT.materials.pv, cells.length);
    const dist = new Float32Array(cells.length);
    const m = new THREE.Matrix4();
    cells.forEach((c, i) => {
      const p = new THREE.Vector3(c.x * FT, (h(c.x, c.z) + 1.1) * FT, c.z * FT);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      mesh.setMatrixAt(i, m);
      dist[i] = c.d; // metres from the ripple origin
    });
    geo.setAttribute('aDist', new THREE.InstancedBufferAttribute(dist, 1));
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'pv';
    mesh.userData.cat = 'pv';
    this.pv = mesh;
    this.add(mesh);
  }
}
