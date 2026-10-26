import gsap from 'gsap';

// One master timeline for the whole film. It is never played by GSAP's ticker: main.js sets
// master.time(t) from its own clock every frame, which makes any frame reproducible.
gsap.ticker.lagSmoothing(0);
export const master = gsap.timeline({ paused: true });

export const EASE = {
  camera: 'power3.inOut',
  type: 'expo.out',
  move: 'power3.inOut',
  out: 'power2.out',
};

// Tweens are always fromTo with immediateRender off, so scrubbing backwards and forwards lands
// on the same values. `to()` remembers the last value it set per object/property, so successive
// tweens on one object chain without restating where they start; they must be added in time order.
const last = new WeakMap();

export function to(obj, at, duration, vars, ease = EASE.move) {
  let mem = last.get(obj);
  if (!mem) last.set(obj, (mem = {}));
  const from = {};
  for (const k of Object.keys(vars)) {
    from[k] = k in mem ? mem[k] : obj[k];
    mem[k] = vars[k];
  }
  master.fromTo(obj, from, { ...vars, duration, ease, immediateRender: false }, at);
}

// For DOM/elements where the start state is set explicitly.
export function fromTo(target, at, duration, from, vars, ease = EASE.type, extra = {}) {
  master.fromTo(target, from, { ...vars, duration, ease, immediateRender: false, ...extra }, at);
}

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (x) => {
  x = clamp01(x);
  return x * x * (3 - 2 * x);
};
// Local 0..1 progress of t inside [a, b].
export const prog = (t, a, b) => clamp01((t - a) / (b - a));
