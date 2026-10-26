import { el, text, path, group } from '../overlay/svg.js';
import { C } from '../palette.js';
import { PRODUCT_TIERS, LADDER_HEADLINE as H } from '../data.js';
import { cam, fade, tw, roll } from './common.js';

// Scene 7 — The new product ladder (1:06-1:20), p45. Products are sampled as
// tiles from the plan bands where they live, lift out of the bowl and stack
// into a stepped pyramid from the base up. Labels pin to each tier.
const R0 = { px: 640, py: 900, pz: 620, tx: 0, ty: 30, tz: 0, fov: 30, upMix: 1, roll: 0, shiftX: 0 };
const R1 = { px: 760, py: 420, pz: 560, tx: 0, ty: 110, tz: 0, fov: 30, upMix: 1, roll: 0, shiftX: 230 };
const R2 = { px: 840, py: 360, pz: 330, tx: 0, ty: 120, tz: 0, fov: 30, upMix: 1, roll: 0, shiftX: 230 };

export const s7 = {
  id: 7, name: 'Product ladder', start: 66, end: 80, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage, ladder } = ctx;
    const T0 = this.start;
    const p = (this.p = { tiles: 0, rise: 0, fly: 0, solid: 1, sink: 0 });
    cam(tl, stage.rig, T0, 3.0, R0, R1, 'power2.inOut');
    cam(tl, stage.rig, T0 + 3.0, 11.0, R1, R2, 'power1.inOut');
    tw(tl, p, T0 + 0.2, 1.2, { tiles: 0 }, { tiles: 1 }, 'power2.out');
    tw(tl, p, T0 + 1.1, 1.4, { rise: 0 }, { rise: 1 }, 'power2.inOut');
    tw(tl, p, T0 + 1.6, 1.6, { sink: 0 }, { sink: 1 }, 'power2.in');
    tw(tl, p, T0 + 2.4, 6.6, { fly: 0 }, { fly: 1 }, 'none');

    const g = group(svg);
    fade(tl, g, T0 + 0.3, 0.4);
    text(g, 96, 72, 'Seating Bowl Design', { size: 22, weight: 800, fill: '#0E4A52' });
    text(g, 90, 150, 'NEW PRODUCT LADDER', { size: 76, weight: 900, fill: '#0E4A52', tracking: -0.01 });

    // tier labels pinned to the pyramid (right edge of each slab)
    this.labels = [];
    const order = ['GA', 'GA+', 'D', 'C', 'B', 'A'];
    const n = order.length;
    PRODUCT_TIERS.forEach((t) => {
      const lg = el('g', { opacity: 0 }, g);
      const lead = path(lg, 'M0,0', { stroke: '#7C8E91', width: 0.75 });
      const chip = el('rect', { width: 30, height: 30, rx: 3, fill: t.color, stroke: '#0B2B2F', 'stroke-width': 0.5 }, lg);
      const tier = text(lg, 0, 0, t.tier, { size: 22, weight: 800, fill: t.tier === 'GA' || t.tier === 'GA+' ? '#0B2B2F' : '#FFFFFF', anchor: 'middle' });
      const seats = text(lg, 0, 0, t.seats ? '0' : t.seatsLabel, { size: 26, weight: 700, fill: '#0E4A52' });
      const pct = text(lg, 0, 0, t.pct || t.pctLabel, { size: 20, weight: 600, fill: '#3D8C7F' });
      const names = text(lg, 0, 0, t.products.slice(0, 3).join(' · '), { size: 16, weight: 600, fill: '#163B40', tracking: 0.02 });
      const names2 = text(lg, 0, 0, t.products.slice(3).join(' · '), { size: 16, weight: 600, fill: '#163B40', tracking: 0.02 });
      const ti = order.indexOf(t.tier);
      // tier lands when fly reaches its slot (matches ladder.update timing)
      const land = T0 + 2.4 + 6.6 * ((ti + 1.1) / (n + 1.2));
      fade(tl, lg, land, 0.4);
      if (t.seats) roll(tl, seats, land, 1.4, 0, t.seats);
      this.labels.push({ t, lead, chip, tier, seats, pct, names, names2, ti });
    });

    // headline: before (p44) -> after (p45); finishes by 1:18.6
    const hd = el('g', { opacity: 0 }, g);
    fade(tl, hd, T0 + 9.4, 0.5);
    el('rect', { x: 0, y: 952, width: 1920, height: 128, fill: C.paper, opacity: 0.94 }, hd);
    const cols = [
      { x: 330, label: 'CLUBS', a: H.before.clubs, b: H.after.clubs },
      { x: 960, label: 'SUITES', a: H.before.suites, b: H.after.suites },
      { x: 1590, label: 'PREMIUM', a: 19, b: 32.4, pct: true },
    ];
    cols.forEach((c, i) => {
      const at = T0 + 9.6 + i * 0.35;
      const before = text(hd, c.x - 150, 1032, c.pct ? H.before.premium : String(c.a), { size: 34, weight: 500, fill: '#7C8E91', anchor: 'end' });
      path(hd, `M${c.x - 132},${1021}L${c.x - 92},${1021}M${c.x - 102},${1013}L${c.x - 92},${1021}L${c.x - 102},${1029}`, { stroke: '#7C8E91', width: 1.5 });
      const after = text(hd, c.x - 72, 1032, '0', { size: 48, weight: 800, fill: '#0E4A52' });
      text(hd, c.x + (c.pct ? 70 : 34), 1032, c.label, { size: 34, weight: 500, fill: '#0E4A52' });
      void before;
      roll(tl, after, at, 2.0, c.a, c.b, c.pct ? { format: (v) => (v >= 32.4 - 1e-6 ? H.after.premium : `${v.toFixed(1)}%`) } : {});
    });
  },
  frame(ctx) {
    const { model, ladder, field } = ctx;
    const p = this.p;
    model.preset('proposed');
    field.group.position.y = -4;
    model.root.visible = p.sink < 0.999;
    model.root.scale.y = Math.max(0.001, 1 - p.sink);
    ladder.group.visible = true;
    ladder.update(p);
    return {};
  },
  after(ctx) {
    const { stage, ladder } = ctx;
    for (const L of this.labels) {
      const T = ladder.tiers[L.t.tier];
      const ym = (T.y0 + T.y1) / 2;
      const [ax, ay] = stage.project(T.size / 2, ym, -T.size / 2);
      const x = 1250;
      const y = 880 - L.ti * 112;
      L.lead.setAttribute('d', `M${ax.toFixed(1)},${ay.toFixed(1)}L${x - 14},${y - 8}`);
      L.chip.setAttribute('x', x); L.chip.setAttribute('y', y - 32);
      L.tier.setAttribute('x', x + 15); L.tier.setAttribute('y', y - 9);
      L.seats.setAttribute('x', x + 46); L.seats.setAttribute('y', y - 6);
      L.pct.setAttribute('x', x + 160); L.pct.setAttribute('y', y - 6);
      L.names.setAttribute('x', x + 46); L.names.setAttribute('y', y + 20);
      L.names2.setAttribute('x', x + 46); L.names2.setAttribute('y', y + 40);
    }
  },
};
