// The eight ribbon-board runs (p69), 3' high, on four fascias, mirrored west/east.
// Each run is centred on the 50-yard line and its arc length equals the deck's linear feet,
// so the geometry carries the numbers it is labelled with.
import * as THREE from 'three';
import { RIBBONS, RIBBON_HEIGHT } from '../data.js';
import { ringLength, ringPoint } from './ring.js';
import { RIBBON_FASCIA } from './stadium.js';
import { ledShared } from '../materials/led.js';

const VERT = /* glsl */ `
attribute float aS;   // 0..1 along the run, in chase direction
attribute float aV;   // 0..1 across the 3' height
varying float vS;
varying float vV;
varying float vLen;
uniform float uLen;
void main() {
  vS = aS; vV = aV; vLen = uLen;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
const FRAG = /* glsl */ `
precision highp float;
uniform float uHead;     // chase head position 0..1 (beyond 1 = run fully lit)
uniform float uOn;       // overall on/off
uniform float uEnergy;   // touchdown whip
uniform float uWhip;     // phase of the whip chase around the bowl
uniform float uEmissive;
uniform float uBoost;
uniform float uIdle;     // idle content level
uniform float uTime;
varying float vS;
varying float vV;
varying float vLen;
const vec3 GREEN = vec3(0.0452, 0.6038, 0.1022);
const vec3 TEAL = vec3(0.0529, 0.4678, 0.4233);
void main() {
  float ft = vS * vLen;
  float lit = step(vS, uHead);
  float head = exp(-max(uHead - vS, 0.0) * vLen / 18.0) * lit;
  float trail = lit * 0.55;
  float px = 0.75 + 0.25 * step(0.5, fract(ft / 1.2));
  vec3 c = GREEN * (trail + head * 2.5) * px;
  // idle: slow teal content
  c += TEAL * uIdle * (0.5 + 0.5 * sin(ft * 0.05 - uTime * 1.5)) * 0.6;
  // touchdown whip: pulses racing around the bowl
  float w = fract(vS * 0.5 - uWhip);
  c += mix(GREEN, vec3(0.8, 1.0, 0.9), 0.3) * uEnergy * (0.4 + 2.4 * exp(-w * 18.0));
  float edge = smoothstep(0.0, 0.08, vV) * smoothstep(1.0, 0.92, vV);
  vec3 off = vec3(0.012, 0.016, 0.018);
  gl_FragColor = vec4(mix(off, c * uEmissive * uBoost, uOn) * mix(0.6, 1.0, edge), 1.0);
}
`;

export function ribbonRunPoints(r, step = 2) {
  const f = RIBBON_FASCIA[r.tier];
  const L = ringLength(f.d);
  // 50-yard line: s = 0 (east) and s = L/2 (west). Chase runs south → north on the west
  // side and north → south on the east, so the light circles the bowl.
  const centre = r.side === 'east' ? 0 : L / 2;
  const dir = r.side === 'east' ? 1 : -1; // east: s increasing heads north; west: decreasing heads north
  const n = Math.max(2, Math.ceil(r.lf / step));
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    // west: start at the south end and run north; east: start north, run south
    const along = r.side === 'west' ? (u - 0.5) * r.lf : (0.5 - u) * r.lf;
    const p = ringPoint(f.d, centre + dir * along);
    pts.push({ x: p.x, z: p.z, nx: p.nx, nz: p.nz, u });
  }
  return { pts, y: f.y };
}

export function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z);
  return L;
}

export class Ribbons {
  constructor() {
    this.group = new THREE.Group();
    this.group.name = 'ribbons';
    this.runs = [];
    for (const r of RIBBONS) {
      const { pts, y } = ribbonRunPoints(r, 2);
      const pos = [], aS = [], aV = [], idx = [];
      pts.forEach((p, i) => {
        // face the field: nudge 0.3' toward the field from the fascia
        const x = p.x - p.nx * 0.3, z = p.z - p.nz * 0.3;
        pos.push(x, 0, z, x, RIBBON_HEIGHT, z); // local y; the mesh sits at the fascia height
        aS.push(p.u, p.u);
        aV.push(0, 1);
        if (i > 0) {
          const a = 2 * (i - 1);
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('aS', new THREE.Float32BufferAttribute(aS, 1));
      g.setAttribute('aV', new THREE.Float32BufferAttribute(aV, 1));
      g.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERT,
        fragmentShader: FRAG,
        side: THREE.DoubleSide,
        uniforms: {
          uHead: { value: 0 },
          uOn: { value: 0 },
          uEnergy: { value: 0 },
          uWhip: { value: 0 },
          uIdle: { value: 0 },
          uTime: { value: 0 },
          uLen: { value: r.lf },
          uEmissive: ledShared.uEmissive,
          uBoost: { value: 1 },
        },
      });
      const mesh = new THREE.Mesh(g, mat);
      mesh.position.y = y;
      mesh.name = `ribbon-${r.n}`;
      this.group.add(mesh);
      const mid = pts[Math.floor(pts.length / 2)];
      const end = pts[pts.length - 1];
      this.runs.push({ ...r, mesh, mat, pts, y, mid: new THREE.Vector3(mid.x, y + 1.5, mid.z), end: new THREE.Vector3(end.x, y + 1.5, end.z) });
    }
  }

  setAll(fn) {
    for (const r of this.runs) fn(r.mat.uniforms, r);
  }
}
