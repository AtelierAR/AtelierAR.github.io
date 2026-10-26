// DOM/SVG overlay helpers. Everything here is driven by the master timeline (tweened
// properties) plus a per-frame `update(camera)` for 3D-anchored elements.
import * as THREE from 'three';
import { WIDTH, HEIGHT, BANDS, PAL } from '../data.js';

const SVGNS = 'http://www.w3.org/2000/svg';

export function createOverlay(root) {
  const O = { root, updaters: [] };

  O.el = (tag, cls = '', parent = root, html = '') => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html) e.innerHTML = html;
    parent.appendChild(e);
    return e;
  };
  O.svg = (tag, attrs = {}, parent) => {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  };

  const v = new THREE.Vector3();
  O.project = (p, camera) => {
    v.copy(p).project(camera);
    return { x: (v.x * 0.5 + 0.5) * WIDTH, y: (-v.y * 0.5 + 0.5) * HEIGHT, z: v.z, ok: v.z < 1 && v.z > -1 };
  };

  // Typewriter: tween `.p` 0..1
  O.typer = (el, text) => {
    let p = 0;
    const o = {
      get p() { return p; },
      set p(x) {
        p = x;
        const n = Math.round(x * text.length);
        el.textContent = text.slice(0, n);
        el.classList.toggle('caret', x > 0 && x < 1);
      },
    };
    o.p = 0;
    return o;
  };

  // Rolling number that lands exactly on the published string
  O.counter = (el, finalText, { suffix = '', decimals = null } = {}) => {
    const target = parseFloat(finalText.replace(/,/g, ''));
    const dec = decimals ?? (finalText.includes('.') ? finalText.split('.')[1].length : 0);
    const fmt = new Intl.NumberFormat('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    let p = 0;
    const o = {
      get p() { return p; },
      set p(x) {
        p = x;
        el.innerHTML = (x >= 1 ? finalText : fmt.format(target * x)) + suffix;
      },
    };
    o.p = 0;
    return o;
  };

  O.update = (camera, T) => { for (const u of O.updaters) u(camera, T); };
  return O;
}

// ---------------------------------------------------------------------------------------
// Leader labels drawn exactly like p26-29: thin vertical leaders from the element to a
// label sitting in the sky band or the ground band. Lines never cross: labels keep the
// left-to-right order of their anchors and are spaced apart, and every frame is checked.
// ---------------------------------------------------------------------------------------
export class LeaderLabels {
  constructor(O, items, { groundBand = BANDS.ground, skyBand = BANDS.sky } = {}) {
    this.O = O;
    this.box = O.el('div', 'ov labels');
    this.svg = O.svg('svg', { width: WIDTH, height: HEIGHT, viewBox: `0 0 ${WIDTH} ${HEIGHT}` }, this.box);
    this.skyY = skyBand * HEIGHT;
    this.groundY = groundBand * HEIGHT;
    this.items = items.map((it) => {
      const el = O.el('div', 'lbl ' + it.band, this.box, it.text);
      const line = O.svg('line', { stroke: it.band === 'sky' ? 'rgba(244,246,248,0.9)' : 'rgba(60,68,70,0.75)', 'stroke-width': 1.1 }, this.svg);
      return { ...it, el, line, p: 0, w: it.text.length * 9.2 + 22 };
    });
    this.crossings = 0;
  }

  update(camera) {
    const pos = [];
    for (const it of this.items) {
      const a = this.O.project(it.anchor, camera);
      const on = a.ok && a.x > -20 && a.x < WIDTH + 20 && a.y > -20 && a.y < HEIGHT + 20;
      it.el.style.display = on ? '' : 'none';
      it.line.style.display = on ? '' : 'none';
      if (on) pos.push({ it, a });
    }
    for (const band of ['sky', 'ground']) {
      const list = pos.filter((p) => p.it.band === band).sort((a, b) => a.a.x - b.a.x);
      // spacing relaxation that preserves order
      list.forEach((p) => (p.x = p.a.x));
      for (let k = 0; k < 6; k++) {
        for (let i = 1; i < list.length; i++) {
          const need = (list[i - 1].it.w + list[i].it.w) / 2;
          if (list[i].x - list[i - 1].x < need) {
            const d = (need - (list[i].x - list[i - 1].x)) / 2;
            list[i - 1].x -= d; list[i].x += d;
          }
        }
        for (const p of list) p.x = Math.min(WIDTH - 30 - p.it.w / 2, Math.max(30 + p.it.w / 2, p.x));
      }
    }
    const segs = [];
    for (const p of pos) {
      const it = p.it;
      const ly = it.band === 'sky' ? this.skyY : this.groundY;
      const y0 = it.band === 'sky' ? ly + 10 : ly - 10;
      const e = Math.min(1, it.p * 1.25);
      const x1 = p.x + (p.a.x - p.x) * e, y1 = y0 + (p.a.y - y0) * e;
      it.line.setAttribute('x1', p.x); it.line.setAttribute('y1', y0);
      it.line.setAttribute('x2', x1); it.line.setAttribute('y2', y1);
      it.line.style.opacity = it.p > 0 ? 1 : 0;
      it.el.style.left = p.x + 'px';
      it.el.style.top = (it.band === 'sky' ? ly : ly) + 'px';
      it.el.style.opacity = Math.max(0, Math.min(1, (it.p - 0.25) * 2.5));
      if (it.p > 0.99) segs.push([p.x, y0, p.a.x, p.a.y, it.text]);
    }
    // QA: count crossings among fully drawn leaders
    let c = 0;
    for (let i = 0; i < segs.length; i++) for (let j = i + 1; j < segs.length; j++) if (cross(segs[i], segs[j])) c++;
    this.crossings = c;
  }

  setVisible(v) { this.box.style.display = v ? '' : 'none'; }
}

function cross(a, b) {
  const o = (px, py, qx, qy, rx, ry) => Math.sign((qx - px) * (ry - py) - (qy - py) * (rx - px));
  const [ax, ay, bx, by] = a, [cx, cy, dx, dy] = b;
  return o(ax, ay, bx, by, cx, cy) * o(ax, ay, bx, by, dx, dy) < 0 && o(cx, cy, dx, dy, ax, ay) * o(cx, cy, dx, dy, bx, by) < 0;
}

export { PAL };
