import { el, text, path, group, fan, goalpost } from '../overlay/svg.js';
import { C } from '../palette.js';
import { FIELD_HEIGHTS } from '../data.js';
import { cam, fade, tw, roll, PLAN_RIG } from './common.js';
import fh from '../geometry/field_heights_p61.json';

// Scene 2 — Lower the field 4 feet (0:10-0:20). Plan tilts into a 3D cut at
// the 50-yard line; the field drops 4'-0" with the CURRENT level ghosted; a
// p61 inset shows why: the lower the field, the fewer rows are overbuilt.
const WIDE = { px: 600, py: 128, pz: -130, tx: 0, ty: 62, tz: -236, fov: 30, upMix: 1, roll: 0, shiftX: 0 };
const CLOSE = { px: 330, py: 34, pz: -132, tx: 0, ty: 12, tz: -176, fov: 28, upMix: 1, roll: 0, shiftX: 0 };
const DRIFT = { px: 640, py: 120, pz: -150, tx: 0, ty: 60, tz: -238, fov: 31, upMix: 1, roll: 0, shiftX: 330 };

export const s2 = {
  id: 2, name: 'Lower the field', start: 10, end: 20, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage } = ctx;
    const T0 = this.start;
    this.p = { plan: 1, extrude: 0.02, cut: 700, drop: 0, ghost: 0 };
    cam(tl, stage.rig, T0, 3.2, PLAN_RIG, WIDE, 'power3.inOut');
    tw(tl, this.p, T0 + 0.3, 1.6, { plan: 1 }, { plan: 0 });
    tw(tl, this.p, T0 + 0.5, 2.4, { extrude: 0.02 }, { extrude: 1 }, 'power2.out');
    tw(tl, this.p, T0 + 1.2, 2.0, { cut: 700 }, { cut: 0 }, 'power2.inOut');
    cam(tl, stage.rig, T0 + 3.4, 1.8, WIDE, CLOSE);
    tw(tl, this.p, T0 + 4.9, 0.4, { ghost: 0 }, { ghost: 1 }, 'none');
    tw(tl, this.p, T0 + 5.3, 1.4, { drop: 0 }, { drop: 1 }, 'power2.inOut');
    cam(tl, stage.rig, T0 + 6.6, 3.4, CLOSE, DRIFT, 'power1.inOut');

    // overlay: header + 3D-anchored CURRENT / NEW + 4'-0" dimension
    const g = group(svg);
    fade(tl, g, T0 + 2.6, 0.5);
    text(g, 96, 118, 'Lower the field 4 feet', { size: 46, weight: 700, fill: C.ink });
    text(g, 98, 158, 'EAST STAND · 50-YARD LINE CUT', { size: 19, weight: 600, fill: C.inkSoft, tracking: 0.14 });
    this.ghostLine = path(g, 'M0,0', { stroke: C.demo, width: 2, dash: '10 7' });
    this.newLine = path(g, 'M0,0', { stroke: C.line, width: 2.5 });
    this.lblCur = text(g, 0, 0, 'CURRENT', { size: 19, weight: 600, fill: C.demo, tracking: 0.12 });
    this.lblNew = text(g, 0, 0, 'NEW', { size: 19, weight: 600, fill: '#1F8F41', tracking: 0.12 });
    this.dim = el('g', {}, g);
    this.dimLine = path(this.dim, 'M0,0', { stroke: C.ink, width: 1.2 });
    this.dimTicks = path(this.dim, 'M0,0', { stroke: C.ink, width: 1.6 });
    this.dimTxt = text(this.dim, 0, 0, '4\'-0"', { size: 26, weight: 700, fill: C.ink });
    this.p.dimOn = 0;
    tw(tl, this.p, T0 + 5.4, 0.5, { dimOn: 0 }, { dimOn: 1 }, 'power2.out');

    // ---- p61 inset: three stacked mini-sections ----
    const inset = group(svg);
    fade(tl, inset, T0 + 5.6, 0.5);
    const X0 = 1120, Y0 = 196, PW = 740, PH = 262;
    el('rect', { x: X0 - 24, y: Y0 - 58, width: PW + 48, height: PH * 3 + 70, fill: '#FFFFFF', opacity: 0.94, rx: 2 }, inset);
    text(inset, X0, Y0 - 22, 'LOWER BOWL FIELD HEIGHTS', { size: 22, weight: 800, fill: '#1B4F4C', tracking: 0.04 });
    const sx = (x) => X0 + 150 + ((x - fh.strip.x0) / (fh.strip.x1 - fh.strip.x0)) * (PW - 160);
    FIELD_HEIGHTS.forEach((c, i) => {
      const pg = el('g', { opacity: 0 }, inset);
      const y0 = Y0 + i * PH;
      const ground = y0 + 178;
      const ppf = 3.1; // inset px per ft
      const fy = ground - c.dropFt * -ppf; // field line (drops)
      text(pg, X0 + 150, y0 + 24, c.title, { size: 18, weight: 700, fill: c.proposed ? '#1F8F41' : '#1B4F4C', tracking: 0.04 });
      // mini plan thumbnail: bowl ring with the overbuild ring in blue
      const tg = el('g', { transform: `translate(${X0 + 62},${y0 + 104})` }, pg);
      el('rect', { x: -58, y: -40, width: 116, height: 80, rx: 26, fill: '#B9BDC9' }, tg);
      const ob = el('rect', { x: -58, y: -40, width: 116, height: 80, rx: 26, fill: C.overbuildBlue }, tg);
      const inner = 1 - c.overbuildRows / 34;
      el('rect', { x: -32, y: -20, width: 64, height: 40, rx: 8, fill: '#2E8B57' }, tg);
      if (inner > 0) ob.setAttribute('transform', `scale(${1 - inner * 0.42})`);
      // field + ghost grade
      path(pg, `M${X0 + 150},${ground}L${X0 + PW},${ground}`, { stroke: '#9BA5A8', width: 0.75 });
      path(pg, `M${X0 + 150},${fy + 0.01}L${sx(1860)},${fy}L${sx(1860)},${ground - 8}L${X0 + PW},${ground - 8}`, { stroke: C.line, width: 1.5 });
      goalpost(pg, sx(fh.goalpost.x), fy, ppf * 0.9, C.line);
      fh.fans.forEach((fx) => fan(pg, sx(fx), fy, 16, C.line));
      // rake: rows from the front of the lower bowl up to the concourse
      const rx0 = sx(fh.rakeStartX), rx1 = sx(fh.rakeEndX);
      const ry0 = fy - 9, ry1 = ground - 120;
      const rows = 34;
      let d = `M${rx0},${ry0}`;
      for (let r = 0; r < rows; r++) {
        const xa = rx0 + ((rx1 - rx0) * r) / rows, xb = rx0 + ((rx1 - rx0) * (r + 1)) / rows;
        const yb = ry0 + ((ry1 - ry0) * (r + 1)) / rows;
        d += `L${xa.toFixed(1)},${yb.toFixed(1)}L${xb.toFixed(1)},${yb.toFixed(1)}`;
      }
      path(pg, d, { stroke: '#8D9699', width: 0.75 });
      // sightline fan (grey) from the near sideline to each row
      const sl = el('g', { opacity: 0.35 }, pg);
      for (let r = 0; r < rows; r += 2) {
        const xa = rx0 + ((rx1 - rx0) * r) / rows, ya = ry0 + ((ry1 - ry0) * r) / rows;
        path(sl, `M${sx(c.dropFt === 0 ? 775 : c.dropFt === -2 ? 800 : 890)},${fy}L${xa},${ya - 4}`, { stroke: '#A8AFB2', width: 0.5 });
      }
      // overbuilt rows highlighted (front rows that must be rebuilt)
      const obPath = path(pg, d, { stroke: C.overbuildBlue, width: 3 });
      const len = obPath.getTotalLength();
      const frac = c.overbuildRows / rows;
      obPath.setAttribute('stroke-dasharray', `${len} ${len}`);
      const obState = { _f: 0, get f() { return this._f; }, set f(v) { this._f = v; obPath.setAttribute('stroke-dashoffset', `${len * (1 - v)}`); } };
      obState.f = 0;
      // structure columns
      for (const cx of fh.columns) path(pg, `M${sx(cx)},${ground}L${sx(cx)},${ry0 + ((ry1 - ry0) * (sx(cx) - rx0)) / (rx1 - rx0)}`, { stroke: '#3E4FB8', width: 0.75 });
      // figures
      const rowsN = text(pg, X0 + PW, ground + 30, '', { size: 17, weight: 700, fill: C.overbuildBlue, anchor: 'end', tracking: 0.04 });
      text(pg, X0, y0 + 190, 'NEW', { size: 15, weight: 600, fill: '#2C9A6C' });
      const nsf = text(pg, X0 + 44, y0 + 190, '0', { size: 15, weight: 600, fill: '#2C9A6C' });
      text(pg, X0, y0 + 212, 'OVERBUILD', { size: 15, weight: 600, fill: C.overbuildBlue });
      const osf = text(pg, X0 + 92, y0 + 212, '0', { size: 15, weight: 600, fill: C.overbuildBlue });
      const at = T0 + 5.75 + i * 0.8;
      fade(tl, pg, at, 0.35);
      tl.fromTo(obState, { f: 0 }, { f: frac, duration: 1.2, ease: 'expo.out', immediateRender: false }, at + 0.1);
      roll(tl, rowsN, at + 0.1, 1.2, 0, c.overbuildRows, { prefix: 'OVERBUILD ', suffix: ' ROWS' });
      roll(tl, nsf, at + 0.15, 1.2, 0, c.newSF, { suffix: ' SF' });
      roll(tl, osf, at + 0.2, 1.2, 0, c.overbuildSF, { suffix: ' SF' });       // last finishes at 18.75
      if (c.proposed) {
        const hl = el('rect', { x: X0 - 14, y: y0 - 6, width: PW + 28, height: PH - 22, fill: 'none', stroke: C.line, 'stroke-width': 2, rx: 2, opacity: 0 }, inset);
        fade(tl, hl, at + 1.2, 0.4);
      }
    });
  },
  frame(ctx) {
    const { model, plans, field, CUT } = ctx;
    const P = this.p;
    model.root.scale.y = P.extrude;
    plans.p37.group.visible = P.plan > 0.001;
    for (const b of plans.p37.bands) { b.mat.uniforms.uSweep.value = 1; b.mat.uniforms.uOpacity.value = P.plan; }
    plans.divMat.opacity = 0.85 * P.plan;
    field.planMat.opacity = P.plan;
    CUT.constant = P.cut;
    field.group.position.y = -4 * P.drop;
    model.showCaps(P.cut < 2);
    return {};
  },
  after(ctx) {
    const { stage } = ctx;
    const P = this.p;
    // anchor the overlay lines at the cut plane (x = 0) across the apron
    const za = -96, zb = -141, zc = -60;
    const cur0 = stage.project(0, 0, zc), cur1 = stage.project(0, 0, zb);
    const new0 = stage.project(0, -4 * P.drop, zc), new1 = stage.project(0, -4 * P.drop, zb);
    this.ghostLine.setAttribute('d', `M${cur0[0]},${cur0[1]}L${cur1[0]},${cur1[1]}`);
    this.ghostLine.setAttribute('opacity', P.ghost * P.drop > 0.02 ? 1 : 0);
    this.newLine.setAttribute('d', `M${new0[0]},${new0[1]}L${new1[0]},${new1[1]}`);
    this.newLine.setAttribute('opacity', P.ghost);
    this.lblCur.setAttribute('x', cur0[0] - 14); this.lblCur.setAttribute('y', cur0[1] - 12);
    this.lblCur.setAttribute('text-anchor', 'end');
    this.lblCur.setAttribute('opacity', P.ghost);
    this.lblNew.setAttribute('x', new0[0] - 14); this.lblNew.setAttribute('y', new0[1] + 26);
    this.lblNew.setAttribute('text-anchor', 'end');
    this.lblNew.setAttribute('opacity', P.ghost * P.drop);
    // 4'-0" dimension string at z = za
    const d0 = stage.project(0, 0, za), d1 = stage.project(0, -4, za);
    const x = d0[0];
    this.dimLine.setAttribute('d', `M${x},${d0[1] - 16}L${x},${d1[1] + 16}`);
    this.dimTicks.setAttribute('d', `M${x - 7},${d0[1] + 7}L${x + 7},${d0[1] - 7}M${x - 7},${d1[1] + 7}L${x + 7},${d1[1] - 7}`);
    this.dimTxt.setAttribute('x', x + 16); this.dimTxt.setAttribute('y', (d0[1] + d1[1]) / 2 + 9);
    this.dim.setAttribute('opacity', P.dimOn);
  },
};
