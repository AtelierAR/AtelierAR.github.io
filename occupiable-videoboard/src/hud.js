// DOM/SVG overlay authored on a 1920 × 1080 frame: statements, counters, option cards,
// dimension strings with tick marks (p70 style), 3D-anchored labels, the p4 waveform.
// Everything is redrawn from timeline state each frame, so seeking is exact.
import * as THREE from 'three';

const W = 1920, H = 1080;

export class Hud {
  constructor(root) {
    this.root = root;
    this.els = new Map();
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    this.svg.setAttribute('preserveAspectRatio', 'none');
    root.appendChild(this.svg);
    this.svgParts = [];
    this.v = new THREE.Vector3();
    this.touched = new Set();
  }

  // ---- frame lifecycle
  begin() {
    this.svgParts.length = 0;
    this.touched.clear();
  }
  end() {
    this.svg.innerHTML = this.svgParts.join('');
    for (const [id, el] of this.els) if (!this.touched.has(id)) el.style.display = 'none';
  }

  // ---- HTML elements
  el(id, className, html) {
    let e = this.els.get(id);
    if (!e) {
      e = document.createElement('div');
      e.className = className;
      e.dataset.id = id;
      this.root.appendChild(e);
      this.els.set(id, e);
      e._html = null;
    }
    if (html !== undefined && html !== e._html) {
      e.innerHTML = html;
      e._html = html;
    }
    return e;
  }

  // show element with opacity, optional px position in 1920×1080 space
  show(id, className, html, { o = 1, x, y, ty = 0, style } = {}) {
    if (o <= 0.001) return null;
    const e = this.el(id, className, html);
    this.touched.add(id);
    e.style.display = '';
    e.style.opacity = o.toFixed(3);
    if (x !== undefined) e.style.left = `calc(${x.toFixed(1)} * var(--u))`;
    if (y !== undefined) e.style.top = `calc(${y.toFixed(1)} * var(--u))`;
    e.style.transform = ty ? `translateY(calc(${ty.toFixed(1)} * var(--u)))` : '';
    if (style) Object.assign(e.style, style);
    return e;
  }

  // anchored at a projected 3D point
  show3d(id, className, html, world, camera, { o = 1, dx = 0, dy = 0, viewport = [0, 0, W, H], center = false, right = false } = {}) {
    const p = this.project(world, camera, viewport);
    if (!p || p.z > 1) return null;
    const e = this.show(id, className, html, { o, x: p.x + dx, y: p.y + dy });
    if (e) e.style.transform = center ? 'translate(-50%, -50%)' : right ? 'translate(-100%, -50%)' : 'translate(0, -50%)';
    return p;
  }

  project(world, camera, viewport = [0, 0, W, H]) {
    const v = this.v.copy(world).project(camera);
    if (v.z > 1 || v.z < -1) return null;
    const [vx, vy, vw, vh] = viewport;
    return { x: vx + (v.x * 0.5 + 0.5) * vw, y: vy + (-v.y * 0.5 + 0.5) * vh, z: v.z };
  }

  // ---- SVG primitives (1920×1080 space)
  line(x1, y1, x2, y2, { stroke = '#fff', w = 1.6, o = 1, dash } = {}) {
    if (o <= 0.001) return;
    this.svgParts.push(
      `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${stroke}" stroke-width="${w}" opacity="${o.toFixed(3)}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linecap="round"/>`,
    );
  }
  polyline(pts, { stroke = '#fff', w = 2, o = 1, dash, fill = 'none' } = {}) {
    if (o <= 0.001 || pts.length < 2) return;
    const d = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    this.svgParts.push(
      `<polyline points="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" opacity="${o.toFixed(3)}"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round" stroke-linecap="round"/>`,
    );
  }
  rect(x, y, w, h, { fill = '#000', o = 1 } = {}) {
    if (o <= 0.001) return;
    this.svgParts.push(`<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${fill}" opacity="${o.toFixed(3)}"/>`);
  }
  text(x, y, str, { size = 22, fill = '#fff', o = 1, anchor = 'middle', weight = 400, rotate = 0, tracking = 0 } = {}) {
    if (o <= 0.001) return;
    this.svgParts.push(
      `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="${size}" fill="${fill}" opacity="${o.toFixed(3)}" text-anchor="${anchor}" dominant-baseline="middle" font-weight="${weight}" letter-spacing="${tracking}" style="font-family:'HKS Sans','Hanken Grotesk',sans-serif;font-variant-numeric:tabular-nums"${rotate ? ` transform="rotate(${rotate.toFixed(2)} ${x.toFixed(1)} ${y.toFixed(1)})"` : ''}>${str}</text>`,
    );
  }

  // Architectural dimension string between two projected points, offset by `off` px
  // perpendicular to the measured line, with 45° ticks (p70–71).
  dim(a, b, label, { off = 40, p = 1, o = 1, side = 1, size = 24, stroke = '#fff' } = {}) {
    if (!a || !b || o <= 0.001 || p <= 0.001) return;
    const dx = b.x - a.x, dy = b.y - a.y;
    const L = Math.hypot(dx, dy) || 1;
    const ux = dx / L, uy = dy / L;
    const nx = -uy * side, ny = ux * side;
    const A = [a.x + nx * off, a.y + ny * off], B = [b.x + nx * off, b.y + ny * off];
    const ext = Math.min(1, p * 2);
    // extension lines
    this.line(a.x + nx * 8, a.y + ny * 8, a.x + nx * (off + 10) * ext, a.y + ny * (off + 10) * ext, { o: o * 0.8, w: 1.2, stroke });
    this.line(b.x + nx * 8, b.y + ny * 8, b.x + nx * (off + 10) * ext, b.y + ny * (off + 10) * ext, { o: o * 0.8, w: 1.2, stroke });
    // dimension line grows from the middle
    const g = Math.max(0, Math.min(1, (p - 0.15) / 0.6));
    const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2;
    this.line(mx - (mx - A[0]) * g, my - (my - A[1]) * g, mx + (B[0] - mx) * g, my + (B[1] - my) * g, { o, w: 1.6, stroke });
    if (g > 0.98) {
      const t = 9;
      for (const P of [A, B]) this.line(P[0] - (ux + nx) * t * 0.7, P[1] - (uy + ny) * t * 0.7, P[0] + (ux + nx) * t * 0.7, P[1] + (uy + ny) * t * 0.7, { o, w: 2.2, stroke });
    }
    const lo = Math.max(0, Math.min(1, (p - 0.55) / 0.3)) * o;
    let ang = (Math.atan2(uy, ux) * 180) / Math.PI;
    if (ang > 90) ang -= 180;
    if (ang < -90) ang += 180;
    if (Math.abs(ang) > 55) {
      // near-vertical strings: horizontal label beside the line, as on p70
      this.text(mx + nx * 14, my + ny * 14, label, { size, o: lo, anchor: nx < 0 ? 'end' : 'start', weight: 400 });
    } else this.text(mx + nx * 22, my + ny * 22, label, { size, o: lo, rotate: ang, weight: 400 });
  }
}

export const HUD_W = W;
export const HUD_H = H;
