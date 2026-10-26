import { fromTo, EASE } from './timeline.js';

// DOM typography layer, laid out in 1080p pixels on the 1920×1080 stage.
export const overlay = document.getElementById('overlay');

export function el(tag, cls, parent = overlay, style = {}) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  Object.assign(e.style, style);
  parent.appendChild(e);
  return e;
}

// A block of text whose characters can be typed on. `parts` is a string or a list of
// {t, style} runs so one headline can mix weights (p4: light "HOUSE OF" + black "ENERGY").
export function textBlock(parent, parts, style = {}, cls = 'abs') {
  const box = el('div', cls, parent, style);
  const runs = typeof parts === 'string' ? [{ t: parts }] : parts;
  const chars = [];
  for (const run of runs) {
    const span = el('span', '', box, run.style || {});
    for (const ch of run.t) {
      const c = el('span', 'ch', span);
      c.textContent = ch;
      chars.push(c);
    }
  }
  box.chars = chars;
  return box;
}

// Type-on: characters rise and sharpen in sequence (expo.out per the brief).
export function typeOn(box, at, { duration = 0.9, per = 0.022, rise = 14 } = {}) {
  fromTo(box, at, 0.001, { opacity: 0 }, { opacity: 1 }, 'none');
  fromTo(box.chars, at, duration, { opacity: 0, y: rise, filter: 'blur(6px)' }, { opacity: 1, y: 0, filter: 'blur(0px)' }, EASE.type, {
    stagger: per,
  });
}

// Words-in: a softer reveal for body copy, word by word.
export function wordsIn(box, at, { duration = 0.8, per = 0.045, rise = 10 } = {}) {
  const words = [];
  let cur = [];
  for (const c of box.chars) {
    cur.push(c);
    if (c.textContent === ' ') {
      words.push(cur);
      cur = [];
    }
  }
  if (cur.length) words.push(cur);
  fromTo(box, at, 0.001, { opacity: 0 }, { opacity: 1 }, 'none');
  words.forEach((w, i) => fromTo(w, at + i * per, duration, { opacity: 0, y: rise }, { opacity: 1, y: 0 }, EASE.type));
}

export function show(e, at, duration = 0.6, from = {}, ease = EASE.type) {
  fromTo(e, at, duration, { opacity: 0, ...from }, { opacity: 1, x: 0, y: 0, scale: 1 }, ease);
}

export function hide(e, at, duration = 0.5, to = {}, ease = 'power2.in') {
  fromTo(e, at, duration, { opacity: 1 }, { opacity: 0, ...to }, ease);
}

export function rule(parent, x, y, w, at, duration = 0.9, color) {
  const r = el('div', 'rule', parent, { left: `${x}px`, top: `${y}px`, width: `${w}px` });
  if (color) r.style.background = color;
  fromTo(r, at, duration, { scaleX: 0 }, { scaleX: 1 }, EASE.type);
  return r;
}

export function vrule(parent, x, y, h, at, duration = 0.7) {
  const r = el('div', 'vrule', parent, { left: `${x}px`, top: `${y}px`, height: `${h}px` });
  fromTo(r, at, duration, { scaleY: 0 }, { scaleY: 1 }, EASE.type);
  return r;
}

// Gradient scrim so type never sits on busy imagery without support.
export function scrim(parent, style) {
  return el('div', 'scrim', parent, style);
}

export { wrap, wrapBalanced } from '../paragraph.js';

// A scene-owned layer that is only displayed inside its time window.
export function layer(name) {
  return el('div', `layer layer-${name}`, overlay, { position: 'absolute', inset: '0', display: 'none' });
}
