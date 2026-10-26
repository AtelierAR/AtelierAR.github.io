// Shared plumbing for the kit: geometry is authored in FEET in plan coordinates
// (+X east, +Z south, Y up) and converted to metres here. Parts are merged per material,
// given world-space box-projected UVs (so textures tile at true scale) and hairline edges.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { FT } from '../data.js';
import { MAT } from '../materials.js';

// material key -> [material name in MAT.materials, category]
export const KEYS = {
  clay: ['clay', 'clay'], seating: ['seating', 'clay'],
  masonry: ['masonry', 'masonry'], fins: ['fins', 'fins'],
  glass: ['glass', 'glazing'], frame: ['frame', 'glazing'],
  metal: ['metal', 'metal'], mesh: ['mesh', 'mesh'], dark: ['dark', 'mesh'],
  soffit: ['soffit', 'soffit'], wingSoffit: ['wingSoffit', 'soffit'], reflective: ['reflective', 'reflective'],
  roof: ['roof', 'roof'], pv: ['pv', 'pv'], galv: ['galv', 'pv'], steel: ['steel', 'steel'],
  board: ['board', 'board'], boardFrame: ['boardFrame', 'board'],
};

const _v = new THREE.Vector3();
const _n = new THREE.Vector3();

// World-aligned box projection in metres.
export function boxUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    _v.fromBufferAttribute(p, i); _n.fromBufferAttribute(n, i);
    const ax = Math.abs(_n.x), ay = Math.abs(_n.y), az = Math.abs(_n.z);
    let u, v;
    if (ay >= ax && ay >= az) { u = _v.x; v = _v.z; }
    else if (ax >= az) { u = _v.z * Math.sign(_n.x || 1); v = _v.y; }
    else { u = -_v.x * Math.sign(_n.z || 1); v = _v.y; }
    uv[i * 2] = u; uv[i * 2 + 1] = v;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

// Facade frame: maps local (u along run, y up, w outward) in feet to plan coordinates.
// face: 'N' facade faces -Z at z=line, run along x; 'S' faces +Z; 'E' faces +X at x=line, run along z; 'W' faces -X.
export function frame(face, line) {
  return {
    face, line,
    pt(u, y, w) {
      switch (face) {
        case 'N': return [u, y, line - w];
        case 'S': return [u, y, line + w];
        case 'E': return [line + w, y, u];
        default: return [line - w, y, u];
      }
    },
    size(su, sy, sw) { return face === 'N' || face === 'S' ? [su, sy, sw] : [sw, sy, su]; },
  };
}

export class Builder {
  constructor() { this.parts = new Map(); }

  add(key, geo, { keepUV = false } = {}) {
    if (!this.parts.has(key)) this.parts.set(key, []);
    if (!keepUV) boxUV(geo);
    if (geo.index) geo = geo.toNonIndexed();
    // normalise attribute set for merging
    for (const name of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(name)) geo.deleteAttribute(name);
    this.parts.get(key).push(geo);
    return geo;
  }

  // Axis-aligned box from centre/size in feet.
  box(key, cx, cy, cz, sx, sy, sz) {
    if (sx <= 0 || sy <= 0 || sz <= 0) return null;
    const g = new THREE.BoxGeometry(sx * FT, sy * FT, sz * FT);
    g.translate(cx * FT, cy * FT, cz * FT);
    return this.add(key, g);
  }

  // Box from min/max corners in feet.
  minmax(key, x0, y0, z0, x1, y1, z1) {
    return this.box(key, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0));
  }

  // Box in a facade frame: u0..u1 along run, y0..y1, w0..w1 outward (feet).
  fbox(key, F, u0, u1, y0, y1, w0, w1) {
    const c = F.pt((u0 + u1) / 2, (y0 + y1) / 2, (w0 + w1) / 2);
    const s = F.size(Math.abs(u1 - u0), Math.abs(y1 - y0), Math.abs(w1 - w0));
    return this.box(key, c[0], c[1], c[2], s[0], s[1], s[2]);
  }

  // Quad from four points in feet (counter-clockwise seen from the front).
  quad(key, a, b, c, d, opts) {
    const g = new THREE.BufferGeometry();
    const P = [a, b, c, a, c, d].flatMap((p) => p.map((x) => x * FT));
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
    g.computeVertexNormals();
    return this.add(key, g, opts);
  }

  build(group, { edges = true, shadows = true, edgeAngle = 25 } = {}) {
    const meshes = {};
    for (const [key, list] of this.parts) {
      if (!list.length) continue;
      const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
      geo.computeBoundingSphere();
      const [mname, cat] = KEYS[key];
      const mesh = new THREE.Mesh(geo, MAT.materials[mname]);
      mesh.name = key;
      mesh.userData.cat = cat;
      mesh.castShadow = shadows && key !== 'mesh';
      mesh.receiveShadow = shadows;
      group.add(mesh);
      if (edges && key !== 'mesh' && key !== 'pv') {
        const eg = new THREE.EdgesGeometry(geo, edgeAngle);
        const lines = new THREE.LineSegments(eg, MAT.edges[cat]);
        lines.name = key + ':edges';
        lines.userData.cat = cat;
        lines.raycast = () => {};
        group.add(lines);
      }
      meshes[key] = mesh;
    }
    this.parts.clear();
    return meshes;
  }
}

// Base class: every kit piece is a Group with `.cats` (set of categories it contains).
export class KitPart extends THREE.Group {
  constructor(name) {
    super();
    this.name = name;
    this.b = new Builder();
  }
  finish(opts) {
    this.meshes = this.b.build(this, opts);
    this.cats = new Set(Object.values(this.meshes).map((m) => m.userData.cat));
    return this;
  }
}
