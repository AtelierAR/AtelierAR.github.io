import * as THREE from 'three';
import { Line2 } from 'three/examples/jsm/lines/Line2.js';
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry.js';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial.js';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2.js';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry.js';

// Fat lines with widths in 1080p pixels. Every LineMaterial is registered so the renderer can
// keep its resolution (and therefore its pixel width) correct at 1080p and 2160p.
const materials = new Set();
let pixelRatio = 1;

export function setLineResolution(w, h, ratio) {
  pixelRatio = ratio;
  for (const m of materials) {
    m.resolution.set(w, h);
    m.linewidth = m.userData.px * ratio;
  }
}

export function lineMaterial({ color = '#ffffff', width = 2, opacity = 1, dashed = false, dash = 20, gap = 10, depthTest = true } = {}) {
  const m = new LineMaterial({
    color: new THREE.Color(color),
    linewidth: width * pixelRatio,
    transparent: true,
    opacity,
    dashed,
    dashSize: dash,
    gapSize: gap,
    depthTest,
    depthWrite: false,
    worldUnits: false,
  });
  m.userData.px = width;
  m.resolution.set(1920, 1080);
  materials.add(m);
  return m;
}

export function setWidth(m, px) {
  m.userData.px = px;
  m.linewidth = px * pixelRatio;
}

export function polyline(points, material) {
  const g = new LineGeometry();
  g.setPositions(points.flatMap((p) => [p[0], p[1], p[2] ?? 0]));
  const l = new Line2(g, material);
  l.computeLineDistances();
  l.frustumCulled = false;
  return l;
}

export function updatePolyline(line, points) {
  const arr = line.geometry.attributes.instanceStart.data.array;
  // instanceStart/End share one interleaved buffer of [x0 y0 z0 x1 y1 z1] per segment
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    arr.set([a[0], a[1], a[2] ?? 0, b[0], b[1], b[2] ?? 0], i * 6);
  }
  line.geometry.attributes.instanceStart.data.needsUpdate = true;
  line.geometry.computeBoundingSphere();
  line.computeLineDistances();
}

// segments: flat array [x0,y0,z0,x1,y1,z1, ...]
export function segments(flat, material) {
  const g = new LineSegmentsGeometry();
  g.setPositions(flat);
  const l = new LineSegments2(g, material);
  l.frustumCulled = false;
  return l;
}

// Resample a polyline to n points evenly spaced by arc length, so two different shapes can
// be morphed point-for-point.
export function resample(points, n) {
  const d = [0];
  for (let i = 1; i < points.length; i++) d.push(d[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  const total = d[d.length - 1];
  const out = [];
  let j = 0;
  for (let k = 0; k < n; k++) {
    const s = (k / (n - 1)) * total;
    while (j < d.length - 2 && d[j + 1] < s) j++;
    const f = (s - d[j]) / (d[j + 1] - d[j] || 1);
    out.push([points[j][0] + (points[j + 1][0] - points[j][0]) * f, points[j][1] + (points[j + 1][1] - points[j][1]) * f, 0]);
  }
  return out;
}

// Insert extra vertices at the original corners so sharp peaks survive resampling.
export function resampleKeepCorners(points, n) {
  const segLen = [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    segLen.push(l);
    total += l;
  }
  const out = [];
  const budget = n - points.length;
  for (let i = 0; i < points.length - 1; i++) {
    const k = Math.max(0, Math.round((segLen[i] / total) * budget));
    for (let s = 0; s <= k; s++) {
      const f = s / (k + 1);
      out.push([points[i][0] + (points[i + 1][0] - points[i][0]) * f, points[i][1] + (points[i + 1][1] - points[i][1]) * f, 0]);
    }
  }
  out.push([...points[points.length - 1].slice(0, 2), 0]);
  while (out.length > n) out.splice(Math.floor(out.length / 2), 1);
  while (out.length < n) out.splice(out.length - 1, 0, [...out[out.length - 1]]);
  return out;
}
