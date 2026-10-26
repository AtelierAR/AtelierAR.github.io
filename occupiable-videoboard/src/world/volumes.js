// Three.js build of the two board volumes: six LED faces each (shared ContentTexture),
// bright glass edges, internal floor plates with line-green slab edges (p63), and — in the
// north volume — the video board club (p97–99) the camera flies into.
import * as THREE from 'three';
import { FACE_LOOPS, volumeVertices } from '../geometry/volume.js';
import { VOLUME_PARAMS } from '../geometry/volumeParams.js';
import { FLOORS, COLORS } from '../data.js';
import { makeLedMaterial, makeStripMaterial, ledShared } from '../materials/led.js';
import { buildClub } from './club.js';

const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);

// Board placement in the stadium (feet). Field centre at the origin, north = −Z, east = +X.
// North: field face 112' behind the end line, underside ≈62' above the field (p51 section).
// South: at the back of the south lower bowl, underside ≈66' up (p53 section).
export const PLACEMENT = {
  north: { origin: new THREE.Vector3(0, 62, -292), flipZ: true },
  south: { origin: new THREE.Vector3(0, 66, 286), flipZ: false },
};

export function localToWorld(key, p, out = new THREE.Vector3()) {
  const pl = PLACEMENT[key];
  return out.set(p[0], p[1], pl.flipZ ? -p[2] : p[2]).add(pl.origin);
}

const EDGES = [
  ['bfw', 'bfe'], ['bfe', 'bke'], ['bke', 'bkw'], ['bkw', 'bfw'],
  ['tfw', 'tfe'], ['tfe', 'tke'], ['tke', 'tkw'], ['tkw', 'tfw'],
  ['bfw', 'tfw'], ['bfe', 'tfe'], ['bkw', 'tkw'], ['bke', 'tke'],
];

// Face geometry with face-space attributes: aFt (feet, x centred) and aCUv (content UV).
function faceGeometry(pts, outwardHint) {
  const [p0, p1, p2, p3] = pts.map((p) => p.clone());
  const c = new THREE.Vector3().add(p0).add(p1).add(p2).add(p3).multiplyScalar(0.25);
  let n = new THREE.Vector3().subVectors(p1, p0).cross(new THREE.Vector3().subVectors(p2, p0)).normalize();
  let quad = [p0, p1, p2, p3];
  if (n.dot(outwardHint) < 0) {
    quad = [p0, p3, p2, p1];
    n.negate();
  }
  // v: world up projected into the face (or "toward the back" for roof / underside)
  let up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(n.y) > 0.8) up = new THREE.Vector3(0, 0, -1).multiplyScalar(Math.sign(n.y) || 1);
  const v = up.clone().sub(n.clone().multiplyScalar(up.dot(n))).normalize();
  const u = new THREE.Vector3().crossVectors(v, n).normalize(); // viewer's right, seen from outside
  const ft = quad.map((p) => [p.clone().sub(c).dot(u), p.clone().sub(c).dot(v)]);
  const minY = Math.min(...ft.map((f) => f[1]));
  const minX = Math.min(...ft.map((f) => f[0]));
  const maxX = Math.max(...ft.map((f) => f[0]));
  const maxY = Math.max(...ft.map((f) => f[1]));
  ft.forEach((f) => (f[1] -= minY));
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(quad.flatMap((p) => [p.x, p.y, p.z]), 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(quad.flatMap(() => [n.x, n.y, n.z]), 3));
  g.setAttribute('aFt', new THREE.Float32BufferAttribute(ft.flat(), 2));
  g.setAttribute(
    'aCUv',
    new THREE.Float32BufferAttribute(ft.flatMap((f) => [(f[0] - minX) / (maxX - minX), f[1] / (maxY - minY)]), 2),
  );
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeBoundingSphere();
  return { g, u, v, n, c, minX, maxX, height: maxY - minY };
}

// Horizontal section of the hexahedron at local height h → convex polygon (local coords).
export function sectionAt(verts, h, inset = 0.6) {
  const pts = [];
  for (const [a, b] of EDGES) {
    const A = verts[a], B = verts[b];
    if ((A[1] - h) * (B[1] - h) <= 0 && A[1] !== B[1]) {
      const t = (h - A[1]) / (B[1] - A[1]);
      pts.push([A[0] + (B[0] - A[0]) * t, A[2] + (B[2] - A[2]) * t]);
    }
  }
  if (pts.length < 3) return [];
  const cx = pts.reduce((s, p) => s + p[0], 0) / pts.length;
  const cz = pts.reduce((s, p) => s + p[1], 0) / pts.length;
  pts.sort((p, q) => Math.atan2(p[1] - cz, p[0] - cx) - Math.atan2(q[1] - cz, q[0] - cx));
  return pts.map(([x, z]) => {
    const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz);
    return [x - (dx / l) * inset, z - (dz / l) * inset];
  });
}

// Clip a convex polygon (x,z) to z >= zMin.
function clipZ(poly, zMin) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const P = poly[i], Q = poly[(i + 1) % poly.length];
    const pin = P[1] >= zMin, qin = Q[1] >= zMin;
    if (pin) out.push(P);
    if (pin !== qin) {
      const t = (zMin - P[1]) / (Q[1] - P[1]);
      out.push([P[0] + (Q[0] - P[0]) * t, zMin]);
    }
  }
  return out;
}

export class BoardVolume {
  constructor(key, { quality = 'high' } = {}) {
    this.key = key;
    this.params = VOLUME_PARAMS[key];
    this.local = volumeVertices(this.params);
    this.group = new THREE.Group();
    this.group.name = `${key}-volume`;
    this.faces = {};
    this.lineMats = [];

    const W = {};
    for (const [k, p] of Object.entries(this.local)) W[k] = localToWorld(key, p);
    this.world = W;
    const centroid = Object.values(W).reduce((s, p) => s.add(p), new THREE.Vector3()).multiplyScalar(1 / 8);
    this.centroid = centroid;

    this.skin = new THREE.Group();
    this.group.add(this.skin);
    for (const [name, loop] of Object.entries(FACE_LOOPS)) {
      const pts = loop.map((n) => W[n]);
      const fc = pts.reduce((s, p) => s.add(p.clone()), new THREE.Vector3()).multiplyScalar(0.25);
      const info = faceGeometry(pts, fc.clone().sub(centroid));
      const isFront = name === 'front';
      const mat = makeLedMaterial({ faceKind: isFront ? 0 : 1, faceW: info.maxX - info.minX, faceX0: info.minX });
      const mesh = new THREE.Mesh(info.g, mat);
      mesh.renderOrder = 10;
      mesh.name = `${key}-${name}`;
      this.faces[name] = { mesh, ...info, center: fc };
      this.skin.add(mesh);
    }

    // bright glass edges
    const edgePos = [];
    for (const [a, b] of EDGES) edgePos.push(W[a].x, W[a].y, W[a].z, W[b].x, W[b].y, W[b].z);
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.Float32BufferAttribute(edgePos, 3));
    this.edgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color('#7FE3DA'), transparent: true, opacity: 0.9 });
    this.edges = new THREE.LineSegments(eg, this.edgeMat);
    this.edges.renderOrder = 11;
    this.skin.add(this.edges);

    // floor plates with line-green slab edges (p63)
    this.plates = new THREE.Group();
    this.group.add(this.plates);
    this.plateLevels = [];
    const slabMat = new THREE.MeshStandardMaterial({ color: COLORS.clay, roughness: 0.85 });
    this.slabMat = slabMat;
    this.slabEdgeMat = new THREE.LineBasicMaterial({ color: new THREE.Color(COLORS.lineGreen), transparent: true, opacity: 1 });
    this.lineMats.push(this.slabEdgeMat);
    for (const f of FLOORS) {
      if (key === 'south' && f.key.startsWith('sro')) continue;
      let poly = sectionAt(this.local, f.y, 1.2);
      if (!f.plate) poly = clipZ(poly, 28); // SRO terraces step back from the field face
      if (poly.length < 3) continue;
      const slab = this.#slab(poly, f.y, 1.5, slabMat);
      slab.userData.level = f;
      this.plates.add(slab);
      this.plateLevels.push({ ...f, obj: slab, poly, worldY: PLACEMENT[key].origin.y + f.y });
    }

    if (key === 'north') {
      this.club = buildClub(this, quality);
      this.group.add(this.club.group);
      this.rebuildStrips();
    }
  }

  #slab(poly, y, th, mat) {
    const key = this.key;
    const top = poly.map(([x, z]) => localToWorld(key, [x, y, z]));
    const bot = poly.map(([x, z]) => localToWorld(key, [x, y - th, z]));
    const pos = [];
    const n = poly.length;
    for (let i = 1; i < n - 1; i++) pos.push(top[0], top[i], top[i + 1], bot[0], bot[i + 1], bot[i]);
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      pos.push(top[i], bot[i], bot[j], top[i], bot[j], top[j]);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos.flatMap((p) => [p.x, p.y, p.z]), 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, mat);
    m.material.side = THREE.DoubleSide;
    m.castShadow = true;
    m.receiveShadow = true;
    const grp = new THREE.Group();
    grp.add(m);
    const ep = [];
    for (let i = 0; i < n; i++) {
      const a = top[i], b = top[(i + 1) % n];
      ep.push(a.x, a.y + 0.05, a.z, b.x, b.y + 0.05, b.z);
    }
    const eg = new THREE.BufferGeometry();
    eg.setAttribute('position', new THREE.Float32BufferAttribute(ep, 3));
    grp.add(new THREE.LineSegments(eg, this.slabEdgeMat));
    return grp;
  }

  // InstancedMesh of real bars on the north field face for the pass-through.
  // Rebuilt when the quality toggle changes the strip pitch.
  rebuildStrips() {
    if (this.strips) {
      this.group.remove(this.strips);
      this.strips.geometry.dispose();
      this.strips.dispose();
    }
    const f = this.faces.front;
    const pitch = ledShared.uPitch.value;
    const fill = ledShared.uFill.value;
    const count = Math.floor(214 / pitch);
    const geo = new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0);
    const xs = new Float32Array(count);
    const mat = makeStripMaterial(f.height);
    const mesh = new THREE.InstancedMesh(geo, mat, count);
    const origin = localToWorld(this.key, this.local.bfw).add(localToWorld(this.key, this.local.bfe)).multiplyScalar(0.5);
    const up = new THREE.Vector3().subVectors(
      localToWorld(this.key, this.local.tfw).add(localToWorld(this.key, this.local.tfe)).multiplyScalar(0.5),
      origin,
    );
    const H = up.length();
    up.normalize();
    const n = f.n.clone(); // outward (toward the field)
    const u = f.u.clone();
    const basis = new THREE.Matrix4().makeBasis(u, up, n.clone().negate());
    const m = new THREE.Matrix4();
    const depth = 0.3;
    for (let i = 0; i < count; i++) {
      const x = -107 + (i + 0.5) * pitch; // bars centred between gaps at integer multiples of the pitch
      xs[i] = x;
      const pos = origin.clone().addScaledVector(u, x).addScaledVector(n, -depth / 2 - 0.02);
      m.copy(basis).scale(new THREE.Vector3(fill * pitch, H, depth)).setPosition(pos);
      mesh.setMatrixAt(i, m);
    }
    geo.setAttribute('aX', new THREE.InstancedBufferAttribute(xs, 1));
    mesh.frustumCulled = false;
    mesh.renderOrder = 12;
    mesh.visible = false;
    this.strips = mesh;
    this.stripMat = mat;
    this.group.add(mesh);
  }

  // Local→world helpers for cameras and labels
  toWorld(p, out) {
    return localToWorld(this.key, p, out);
  }

  setClipping(planes) {
    for (const f of Object.values(this.faces)) f.mesh.material.clippingPlanes = planes;
    this.edgeMat.clippingPlanes = planes;
  }
}
