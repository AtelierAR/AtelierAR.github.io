import { el, text, group } from '../overlay/svg.js';
import { C } from '../palette.js';
import { MANIFEST_DELTAS } from '../data.js';
import { camSet, fade, tw, roll, drive, PLAN_RIG, manifestRow, fmtPair } from './common.js';

// Scene 8 — The new manifest (1:20-1:26). The plan returns, recoloured from
// the p37 coding to p42; every line rolls from its existing (p37) value to the
// new (p42) value. All counters land by 1:24.8.
export const s8 = {
  id: 8, name: 'New manifest', start: 80, end: 86, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage } = ctx;
    const T0 = this.start;
    const p = (this.p = { mix: 0, sweep: 0 });
    camSet(tl, stage.rig, T0, PLAN_RIG);
    tw(tl, p, T0 + 0.6, 1.4, { mix: 0 }, { mix: 1 }, 'power2.inOut');

    const g = group(svg);
    fade(tl, g, T0, 0.3);
    text(g, 150, 128, 'New Manifest', { size: 76, weight: 600, fill: C.ink });
    const x = 80;
    const ys = [300, 360, 420, 560, 640, 760, 900, 990];
    MANIFEST_DELTAS.forEach((r, i) => {
      const row = manifestRow(g, x, ys[i], r.code, r.label, { strong: !!r.strong });
      fade(tl, row.g, T0 + 0.2 + i * 0.06, 0.3);
      const at = T0 + 0.9 + i * 0.12;
      if (r.pair) {
        drive(tl, at, 2.6, (k) => {
          row.v.textContent = fmtPair(r.from[0] + (r.to[0] - r.from[0]) * k, r.from[1] + (r.to[1] - r.from[1]) * k);
        });
      } else {
        roll(tl, row.v, at, 2.6, r.from, r.to); // last: 80.9 + 0.84 + 2.6 = 84.34
      }
      // existing value, struck through, for reference
      const old = text(g, x + 372, ys[i] + 26, r.pair ? fmtPair(...r.from) : r.from.toLocaleString('en-US'), { size: 16, weight: 500, fill: '#9AA3A6' });
      old.setAttribute('opacity', 0);
      old.setAttribute('text-decoration', 'line-through');
      fade(tl, old, at + 0.4, 0.4, 0.9);
    });
    const tag = el('g', { opacity: 0 }, g);
    text(tag, x + 372, 1056, 'grey = existing (p37)', { size: 14, weight: 500, fill: '#9AA3A6' });
    fade(tl, tag, T0 + 1.6, 0.4);
  },
  frame(ctx) {
    const { model, plans, field } = ctx;
    const p = this.p;
    model.root.visible = false;
    field.clay.visible = false;
    field.planMat.opacity = 1;
    plans.p37.group.visible = p.mix < 0.999;
    plans.p42.group.visible = p.mix > 0.001;
    for (const b of plans.p37.bands) { b.mat.uniforms.uSweep.value = 1; b.mat.uniforms.uOpacity.value = 1 - p.mix; }
    for (const b of plans.p42.bands) { b.mat.uniforms.uSweep.value = 1; b.mat.uniforms.uOpacity.value = p.mix; }
    plans.divMat.opacity = 0.85;
    plans.p42.boardLine.opacity = p.mix;
    return { post: false };
  },
};
