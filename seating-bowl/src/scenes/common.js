import { el, text, group, dot, counter } from '../overlay/svg.js';
import { C } from '../palette.js';
import { fmt } from '../data.js';

// Camera move on the shared rig (absolute timeline time `at`).
export function cam(tl, rig, at, dur, from, to, ease = 'power2.inOut') {
  tl.fromTo(rig, { ...from }, { ...to, duration: dur, ease, immediateRender: false }, at);
}
export function camSet(tl, rig, at, v) {
  tl.set(rig, { ...v }, at);
}

export function fade(tl, node, at, dur = 0.5, to = 1, from = null) {
  const f = from === null ? (to > 0 ? 0 : 1) : from;
  tl.fromTo(node, { opacity: f }, { opacity: to, duration: dur, ease: 'power2.out', immediateRender: false }, at);
}

// Scalar tween on a plain object (3D params read in frame()).
export function tw(tl, obj, at, dur, from, to, ease = 'power2.inOut') {
  tl.fromTo(obj, { ...from }, { ...to, duration: dur, ease, immediateRender: false }, at);
}

// Rolling number: expo.out, never bounce. Returns the counter api.
export function roll(tl, node, at, dur, from, to, opts = {}) {
  const c = counter(node, { from, to, ...opts });
  tl.fromTo(c, { v: from }, { v: to, duration: dur, ease: 'expo.out', immediateRender: false }, at);
  return c;
}

// Generic eased driver: tweens a progress proxy 0..1 and hands it to `set`
// (multi-value counters such as "174 | 4,172"). Setter-based, so it works
// under suppressed-event seeking.
export function drive(tl, at, dur, set, ease = 'expo.out') {
  const proxy = { _p: 0, get p() { return this._p; }, set p(v) { this._p = v; set(v); } };
  set(0);
  tl.fromTo(proxy, { p: 0 }, { p: 1, duration: dur, ease, immediateRender: false }, at);
  return proxy;
}

export const PLAN_RIG = { px: -265, py: 2660, pz: 0.01, tx: -265, ty: 0, tz: -14, fov: 20, upMix: 0, roll: 0, shiftX: 0 };

// Scene title in the deck's header style.
export function title(parent, str, { x = 96, y = 118, size = 44, color = C.ink, sub = null } = {}) {
  const g = group(parent);
  text(g, x, y, str, { size, weight: 700, fill: color, tracking: 0.02 });
  if (sub) text(g, x + 2, y + 38, sub, { size: 19, weight: 500, fill: C.inkSoft, tracking: 0.14 });
  return g;
}

// Numbered move list (p50/p52/p54 style). Returns per-item groups.
export function moveList(parent, x, y, items, { color = C.line, demoColor = C.demo, size = 23, gap = 44, numbered = 'dot' } = {}) {
  return items.map((it, i) => {
    const g = el('g', { opacity: 0 }, parent);
    const fill = it.demo ? demoColor : color;
    if (numbered === 'dot') {
      const d = dot(g, x + 16, y + i * gap - 8, it.n, { r: 15, fill, size: 17 });
      d.setAttribute('opacity', 1);
    } else {
      text(g, x, y + i * gap, `${it.n}.`, { size, weight: 600, fill });
    }
    text(g, x + 46, y + i * gap, it.text.toUpperCase(), { size, weight: 600, fill, tracking: 0.01 });
    return g;
  });
}

// Manifest table in the p37/p42 layout (code | label | value).
export function manifestRow(parent, x, y, code, label, { strong = false, valueX = 372 } = {}) {
  const g = el('g', { opacity: 0 }, parent);
  if (code) text(g, x, y, code, { size: 29, weight: 400, fill: '#8FB9A9' });
  text(g, strong ? x + valueX - 24 : x + 92, y, label, {
    size: strong ? 30 : 29, weight: strong ? 700 : 500, fill: strong ? C.midnight : '#3C8F72', anchor: strong ? 'end' : 'start',
  });
  const v = text(g, x + valueX, y, '0', { size: strong ? 36 : 29, weight: strong ? 700 : 500, fill: strong ? C.midnight : '#3C8F72' });
  if (strong) v.setAttribute('font-style', 'italic');
  return { g, v };
}

export const fmtPair = (a, b) => `${fmt(a)} | ${fmt(b)}`;

// Numbered dot pinned to a 3D point (re-projected every frame in after()).
export function anchoredDot(parent, n, pos, fill) {
  const g = dot(parent, 0, 0, n, { fill });
  return { g, pos, n };
}
export function placeAnchors(stage, anchors) {
  for (const a of anchors) {
    const [x, y] = stage.project(...a.pos);
    a.g.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
  }
}
