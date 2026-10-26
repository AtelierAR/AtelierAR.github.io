import { el, text, group } from '../overlay/svg.js';
import { C } from '../palette.js';
import { TAGLINE } from '../data.js';
import { tw } from './common.js';

// Scene 9 — From the seat (1:26-1:34). Four fan-eye holds matched to the
// p56-p59 renders (white clay, sky, crowd). The crowd wave runs on film time,
// so it carries across the cuts. Ends on the south upper bowl looking at the
// north board with the tagline (PROPOSED COPY, see data.js).
// Camera poses were matched against the rasterized renders with ?qa=<page>
// (50% overlay); comparisons are saved to qa/ by `npm run qa`.
export const VIEWS = [
  { page: 56, label: 'NORTHWEST LOWER BOWL VIEW', t: [0, 1.5],
    from: { px: -206, py: 17, pz: 134, tx: 80, ty: 24, tz: -70, fov: 62 }, to: { px: -203, py: 17.5, pz: 131, tx: 80, ty: 24, tz: -76, fov: 61 } },
  { page: 57, label: 'SOUTH WEST LOWER BOWL 50 YD VIEW', t: [1.5, 3.0],
    from: { px: 8, py: 13, pz: 158, tx: 8, ty: 32, tz: -300, fov: 62 }, to: { px: 4, py: 13.5, pz: 155, tx: 4, ty: 32, tz: -300, fov: 61 } },
  { page: 58, label: 'SOUTH ENDZONE VIEW', t: [3.0, 4.5],
    from: { px: 300, py: 64, pz: 122, tx: -170, ty: -6, tz: -92, fov: 62 }, to: { px: 296, py: 64.5, pz: 118, tx: -170, ty: -6, tz: -96, fov: 61 } },
  { page: 59, label: 'SOUTH UPPERBOWL VIEW', t: [4.5, 8.0],
    from: { px: 296, py: 122, pz: -236, tx: -190, ty: 6, tz: 40, fov: 58 }, to: { px: 290, py: 120, pz: -230, tx: -200, ty: 12, tz: 40, fov: 54 } },
];

export const s9 = {
  id: 9, name: 'From the seat', start: 86, end: 94, ground: '#FFFFFF',
  build(ctx) {
    const { tl, svg } = ctx;
    const T0 = this.start;
    this.p = { tag: 0 };
    const g = group(svg, { opacity: 1 });
    this.views = VIEWS.map((v) => {
      const lg = el('g', { opacity: 0 }, g);
      text(lg, 64, 64, v.label, { size: 26, weight: 800, fill: '#1B5E54', tracking: 0.08 });
      tl.set(lg, { opacity: 1 }, T0 + v.t[0]);
      tl.set(lg, { opacity: 0 }, T0 + v.t[1]);
      return { ...v, rig: { ...v.from } };
    });
    this.views.forEach((v) => {
      tl.fromTo(v.rig, { ...v.from }, { ...v.to, duration: v.t[1] - v.t[0], ease: 'none', immediateRender: false }, T0 + v.t[0]);
    });
    // tagline — PROPOSED COPY
    const tg = el('g', { opacity: 0 }, g);
    el('rect', { x: 0, y: 820, width: 1920, height: 260, fill: 'url(#tagShade)' }, tg);
    const defs = el('defs', {}, svg);
    const lg = el('linearGradient', { id: 'tagShade', x1: 0, x2: 0, y1: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': C.midnight, 'stop-opacity': 0 }, lg);
    el('stop', { offset: 1, 'stop-color': C.midnight, 'stop-opacity': 0.82 }, lg);
    text(tg, 960, 990, TAGLINE, { size: 64, weight: 800, fill: '#FFFFFF', anchor: 'middle', tracking: 0.01 });
    tl.fromTo(tg, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 1.0, ease: 'power3.out', immediateRender: false }, T0 + 5.2);
    tw(tl, this.p, T0 + 5.2, 1.0, { tag: 0 }, { tag: 1 });
  },
  frame(ctx, time, lt) {
    const { model, field, crowd, stage, scene } = ctx;
    model.preset('proposed');
    model.look(['LO_N2', 'LO_S2A', 'ROWS_S', 'SWEEP_NE', 'SWEEP_NW', 'SU_NE2', 'SU_NW2', 'SRO_NE', 'SRO_NW'], 'clay');
    model.look(['BOARD_N', 'BOARD_S'], 'glass');
    field.group.position.y = -4;
    crowd.mesh.visible = true;
    crowd.uniforms.uTime.value = time;
    stage.sky.visible = true;
    scene.background.set('#DDE1E7');
    stage.dof.bokehScale = 1.4;
    ctx.grain.style.opacity = 0.04;
    const v = this.views.find((w) => lt >= w.t[0] && lt < w.t[1]) || this.views[this.views.length - 1];
    Object.assign(stage.rig, v.rig, { upMix: 1, roll: 0, shiftX: 0 });
    this.active = v;
    return {};
  },
};
