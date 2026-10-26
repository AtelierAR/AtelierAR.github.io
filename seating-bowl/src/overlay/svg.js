import { C, FONT } from '../palette.js';
import { fmt } from '../data.js';

// Tiny SVG toolkit for the 1920x1080 overlay layer. Everything here is driven
// by the master GSAP timeline (attributes / styles / counter proxies), so the
// overlay stays frame-locked to the 3D layer in ?record=1.
export const NS = 'http://www.w3.org/2000/svg';

export function el(tag, attrs = {}, parent = null, text = null) {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) e.setAttribute(k, v);
  if (text !== null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

export function group(parent, attrs = {}) {
  return el('g', { opacity: 0, ...attrs }, parent);
}

export function text(parent, x, y, str, o = {}) {
  const {
    size = 22, weight = 500, fill = C.ink, anchor = 'start', tracking = 0, family = FONT, opacity, tnum = true, baseline,
  } = o;
  return el('text', {
    x, y, fill, 'font-size': size, 'font-weight': weight, 'text-anchor': anchor, 'font-family': family,
    'letter-spacing': tracking ? `${tracking}em` : undefined, opacity, 'dominant-baseline': baseline,
    style: tnum ? 'font-variant-numeric: tabular-nums lining-nums; font-feature-settings: "tnum" 1, "lnum" 1;' : undefined,
  }, parent, str);
}

export function path(parent, d, o = {}) {
  const { stroke = C.line, width = 1.5, fill = 'none', dash, opacity, cap = 'round', join = 'round' } = o;
  return el('path', {
    d, stroke, 'stroke-width': width, fill, 'stroke-dasharray': dash, opacity,
    'stroke-linecap': cap, 'stroke-linejoin': join, 'vector-effect': 'non-scaling-stroke',
  }, parent);
}

export const toD = (pts, close = false) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join('') + (close ? 'Z' : '');

// Stroke draw-on with a travelling bright head. Returns {line, head, len}.
// Tween `prog` on the returned object (0..1) through the timeline.
export function drawable(parent, d, o = {}) {
  const line = path(parent, d, o);
  const len = Math.max(1, line.getTotalLength ? line.getTotalLength() : 1000);
  line.setAttribute('stroke-dasharray', `${len} ${len}`);
  line.setAttribute('stroke-dashoffset', `${len}`);
  const head = path(parent, d, { ...o, stroke: o.headColor || '#B8FFC6', width: (o.width || 1.5) + 1.6, opacity: 0 });
  const hl = Math.min(42, len * 0.25);
  head.setAttribute('stroke-dasharray', `${hl} ${len + hl}`);
  const api = {
    line, head, len,
    _p: 0,
    get prog() { return api._p; },
    set prog(v) {
      api._p = v;
      line.setAttribute('stroke-dashoffset', `${len * (1 - v)}`);
      head.setAttribute('stroke-dashoffset', `${hl - len * v}`);
      head.setAttribute('opacity', v > 0.001 && v < 0.999 ? 1 : 0);
    },
  };
  return api;
}

// Rolling counter: tween `.v` (or `.t` for from->to interpolation).
export function counter(node, { from = 0, to = 0, format = fmt, prefix = '', suffix = '' } = {}) {
  const api = {
    _v: from,
    get v() { return api._v; },
    set v(x) { api._v = x; node.textContent = prefix + format(x) + suffix; },
  };
  api.v = from;
  return api;
}

// Numbered dot (white numeral in a circle).
export function dot(parent, x, y, n, { r = 17, fill = C.line, size = 19 } = {}) {
  const g = el('g', { transform: `translate(${x},${y})`, opacity: 0 }, parent);
  el('circle', { r, fill }, g);
  text(g, 0, 0.5, String(n), { size, weight: 700, fill: '#FFFFFF', anchor: 'middle', baseline: 'central' });
  return g;
}

// Dimension string with ticks (architectural).
export function dimension(parent, x, y0, y1, label, { color = C.ink, side = 1 } = {}) {
  const g = el('g', { opacity: 0 }, parent);
  path(g, `M${x},${y0}L${x},${y1}`, { stroke: color, width: 1.2 });
  for (const y of [y0, y1]) path(g, `M${x - 7},${y + 7}L${x + 7},${y - 7}`, { stroke: color, width: 1.5 });
  path(g, `M${x - 12},${y0}L${x + 12},${y0}M${x - 12},${y1}L${x + 12},${y1}`, { stroke: color, width: 0.75 });
  text(g, x + side * 18, (y0 + y1) / 2 + 7, label, { size: 22, weight: 600, fill: color, anchor: side > 0 ? 'start' : 'end' });
  return g;
}

// Tiny standing fan figure (p61 scale figures). h = height in px.
export function fan(parent, x, y, h, color = C.line) {
  const g = el('g', { transform: `translate(${x},${y}) scale(${h / 30})` }, parent);
  el('circle', { cx: 0, cy: -26.5, r: 3.4, fill: 'none', stroke: color, 'stroke-width': 1.4, 'vector-effect': 'non-scaling-stroke' }, g);
  path(g, 'M0,-22.5L0,-10M0,-10L-4,0M0,-10L4.5,0M0,-19L-5,-13M0,-19L5,-14', { stroke: color, width: 1.1 });
  return g;
}

export function goalpost(parent, x, yGround, pxPerFt, color = C.line) {
  const g = el('g', {}, parent);
  const cb = yGround - 10 * pxPerFt, top = cb - 30 * pxPerFt, hw = 9.25 * pxPerFt;
  path(g, `M${x},${yGround}L${x},${cb}M${x - hw},${top}L${x - hw},${cb}L${x + hw},${cb}L${x + hw},${top}`, { stroke: color, width: 1.1 });
  return g;
}

// Grain texture for the paper grounds, generated once (deterministic).
export function grainDataURL(w = 512, h = 512, seed = 11) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const img = g.createImageData(w, h);
  let s = seed;
  for (let i = 0; i < w * h; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const v = 128 + ((s >>> 24) - 128) * 0.9;
    img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return cv.toDataURL('image/png');
}
