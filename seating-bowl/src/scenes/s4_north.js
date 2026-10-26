import { el, text, path, group, toD, drawable } from '../overlay/svg.js';
import { C } from '../palette.js';
import { NORTH_EXISTING, NORTH_PROPOSED, NORTH_SECTION } from '../data.js';
import { cam, fade, tw, moveList, anchoredDot, placeAnchors } from './common.js';
import north from '../geometry/section_north_p51.json';

// Scene 4 — North Stand (0:32-0:46), p52 axon. Existing (red): lower the
// field, demo the north bowl above the main concourse by planar slicing with
// fine dust. Proposed (greens): overbuild, super vom (camera looks through),
// occupiable board rises, club sweep, upper-terrace SRO. p51 section inset.
const AX0 = { px: 810, py: 930, pz: -540, tx: -330, ty: -30, tz: 10, fov: 21, upMix: 1, roll: 0, shiftX: 0 };
const AX1 = { px: 760, py: 880, pz: -500, tx: -330, ty: -30, tz: 10, fov: 21, upMix: 1, roll: 0, shiftX: 0 };
const VOM = { px: -298, py: 27, pz: 0, tx: 40, ty: 6, tz: 0, fov: 55, upMix: 1, roll: 0, shiftX: 0 };
const AX2 = { px: 740, py: 860, pz: -470, tx: -336, ty: -14, tz: 14, fov: 21, upMix: 1, roll: 0, shiftX: 0 };

const DEMO = ['UP_N', 'FAC_N', 'FAC_NE', 'FAC_NW', 'BOARD_N_OLD', 'TOWER_N', 'SU_NE', 'SU_NW', 'CL_NE', 'CL_NW', 'LG_N'];

export const s4 = {
  id: 4, name: 'North Stand', start: 32, end: 46, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage } = ctx;
    const T0 = this.start;
    const p = (this.p = { fieldRed: 0, drop: 0, demoRed: 0, slice: 20, gone: 0, over: 0, vom: 0, board: 0, sweep: 0, sro: 0, proposed: 0 });
    cam(tl, stage.rig, T0, 8.0, AX0, AX1, 'power1.inOut');
    tw(tl, p, T0 + 1.2, 0.3, { fieldRed: 0 }, { fieldRed: 1 }, 'none');
    tw(tl, p, T0 + 1.6, 1.0, { drop: 0 }, { drop: 1 });
    tw(tl, p, T0 + 2.8, 0.3, { demoRed: 0 }, { demoRed: 1 }, 'none');
    tw(tl, p, T0 + 3.6, 2.6, { slice: 20 }, { slice: 205 }, 'power1.inOut');
    tw(tl, p, T0 + 6.2, 0.01, { gone: 0 }, { gone: 1 }, 'none');
    tw(tl, p, T0 + 6.4, 0.3, { proposed: 0 }, { proposed: 1 }, 'none');
    tw(tl, p, T0 + 6.6, 1.2, { over: 0 }, { over: 1 }, 'power2.out');
    tw(tl, p, T0 + 8.0, 0.25, { vom: 0 }, { vom: 1 }, 'none');
    cam(tl, stage.rig, T0 + 8.0, 1.0, AX1, VOM, 'power2.inOut');
    cam(tl, stage.rig, T0 + 9.5, 1.1, VOM, AX2, 'power2.inOut');
    tw(tl, p, T0 + 9.8, 1.3, { board: 0 }, { board: 1 }, 'power3.out');
    tw(tl, p, T0 + 11.0, 0.8, { sweep: 0 }, { sweep: 1 }, 'power2.out');
    tw(tl, p, T0 + 11.8, 0.7, { sro: 0 }, { sro: 1 }, 'power2.out');

    // overlay
    const g = group(svg);
    fade(tl, g, T0 + 0.6, 0.4);
    text(g, 96, 112, 'NORTH STAND', { size: 46, weight: 700, fill: '#163B40', tracking: 0.02 });
    el('rect', { x: 64, y: 788, width: 860, height: 292, fill: C.paper, opacity: 0.92 }, g);
    const exH = text(g, 96, 840, 'EXISTING', { size: 30, weight: 500, fill: '#7C8689', tracking: 0.12, opacity: 0 });
    const prH = text(g, 96, 840, 'PROPOSED', { size: 30, weight: 700, fill: '#1F9D45', tracking: 0.12, opacity: 0 });
    const exL = moveList(g, 96, 890, NORTH_EXISTING.map((m) => ({ ...m, demo: true })), { size: 21, gap: 40 });
    const prL = moveList(g, 96, 890, NORTH_PROPOSED, { size: 21, gap: 38 });
    fade(tl, exH, T0 + 0.9, 0.4);
    exL.forEach((it, i) => fade(tl, it, T0 + 1.2 + i * 1.6, 0.4));
    fade(tl, exH, T0 + 6.2, 0.3, 0, 1);
    exL.forEach((it) => fade(tl, it, T0 + 6.2, 0.3, 0, 1));
    fade(tl, prH, T0 + 6.4, 0.4);
    [6.6, 8.0, 9.8, 11.0, 11.8].forEach((at, i) => fade(tl, prL[i], T0 + at, 0.4));

    // 3D-anchored dots
    const dots = el('g', {}, g);
    this.anchors = [
      anchoredDot(dots, 1, [-150, 2, 40], C.demo),
      anchoredDot(dots, 2, [-345, 130, -40], C.demo),
      anchoredDot(dots, 1, [-240, 18, 20], C.line),
      anchoredDot(dots, 2, [-292, 34, 0], '#9BA3A6'),
      anchoredDot(dots, 3, [-360, 120, -10], C.line),
      anchoredDot(dots, 4, [-262, 76, -200], C.line),
      anchoredDot(dots, 5, [-268, 150, -205], C.line),
    ];
    const dotT = [1.2, 2.8, 6.6, 8.0, 10.2, 11.0, 11.8];
    this.anchors.forEach((a, i) => {
      fade(tl, a.g, T0 + dotT[i], 0.3);
      if (i < 2) fade(tl, a.g, T0 + 6.2, 0.3, 0, 1);
    });
    fade(tl, this.anchors[3].g, T0 + 8.0, 0.01, 0, 1); // hidden while the camera is in the vom
    fade(tl, this.anchors[3].g, T0 + 10.4, 0.3);

    // ---- p51 north section inset (right)
    const ins = group(svg);
    fade(tl, ins, T0 + 6.6, 0.5);
    const IX = 1200, IY = 960, s = 1.75;
    const X = (u) => IX + (u + 30) * s, Y = (v) => IY - (v + 6) * s;
    const P = (pts) => pts.map(([u, v]) => [X(u), Y(v)]);
    el('rect', { x: IX - 26, y: IY - 400, width: 706, height: 456, fill: '#FFFFFF', opacity: 0.94 }, ins);
    text(ins, IX - 6, IY - 368, 'NORTH SECTION', { size: 18, weight: 800, fill: '#163B40', tracking: 0.08 });
    text(ins, IX - 6, IY - 346, 'p51', { size: 13, weight: 500, fill: '#9AA3A6', tracking: 0.08 });
    const pr = north.proposed, ex = north.existing;
    path(ins, toD(P(ex.field)), { stroke: C.demo, width: 1.4, dash: '6 4' });
    path(ins, toD(P(ex.demolition)), { stroke: C.demo, width: 1.4, dash: '2 4' });
    path(ins, toD(P(pr.board), true), { stroke: '#2B9C91', width: 1.5, fill: 'rgba(65,182,175,0.30)' });
    const lines = [pr.field, pr.lowerBowl, pr.fieldClub, pr.mainConcourse, pr.lowerLevel, ...pr.sroLevels];
    lines.forEach((ln, i) => {
      const dr = drawable(ins, toD(P(ln)), { stroke: C.line, width: 1.5 });
      tl.fromTo(dr, { prog: 0 }, { prog: 1, duration: 1.2, ease: 'power2.inOut', immediateRender: false }, T0 + 6.8 + i * 0.25);
    });
    // SRO levels 1-4 stacked inside the board volume
    const lv = north.levelLabels;
    NORTH_SECTION.sroLevels.forEach((k, i) => {
      const y = Y(lv[k]);
      const lg = el('g', { opacity: 0 }, ins);
      text(lg, X(272), y + 5, k, { size: 13, weight: 600, fill: '#2B7F77', tracking: 0.08 });
      fade(tl, lg, T0 + 9.9 + i * 0.25, 0.3);
    });
    for (const k of ['UPPER LEVEL', 'CLUB LEVEL', 'MAIN CONCOURSE']) {
      text(ins, X(272), Y(lv[k]) + 5, k, { size: 12, weight: 500, fill: '#9AA3A6', tracking: 0.08 });
    }
    // 50 ROWS ON NORTH
    const rl = el('g', { opacity: 0 }, ins);
    const top = pr.lowerBowl[pr.lowerBowl.length - 1];
    text(rl, X(top[0] - 40), Y(top[1] + 46), String(NORTH_SECTION.rows), { size: 34, weight: 800, fill: '#1F9D45', anchor: 'middle' });
    text(rl, X(top[0] - 40), Y(top[1] + 46) + 20, NORTH_SECTION.rowsLabel, { size: 12, weight: 700, fill: '#1F9D45', anchor: 'middle', tracking: 0.1 });
    path(rl, `M${X(top[0] - 40)},${Y(top[1] + 46) + 28}L${X(top[0] - 18)},${Y(top[1] + 4)}`, { stroke: '#1F9D45', width: 0.75 });
    fade(tl, rl, T0 + 8.0, 0.4);
    this.g = g;
  },
  frame(ctx) {
    const { model, field, M, dust, SLICE } = ctx;
    const p = this.p;
    model.preset(p.proposed > 0.5 ? 'proposed' : 'existing');
    model.show(['ROOF_E', 'ROOF_W'], false); // p52 isolates the stand
    // north focus: the south half stays as context
    field.group.position.y = -4 * p.drop;
    if (p.fieldRed > 0.5 && p.proposed < 0.5) field.clay.material = M.hatchField;
    if (p.proposed < 0.5) {
      if (p.demoRed > 0.5) model.look(DEMO, 'hatch');
      // discrete 5' slices peel away bottom to top
      SLICE.constant = -Math.floor(p.slice / 5) * 5;
      dust.points.visible = p.slice > 25 && p.gone < 1;
      dust.uniforms.uCut.value = p.slice;
      dust.uniforms.uSide.value = 0;
      if (p.gone >= 1) model.show(DEMO, false);
      // proposed sides already in place so the north reads in isolation
      model.show(['LO_E', 'LO_W', 'CL_E', 'CL_W', 'SU_E', 'SU_W', 'LG_E', 'LG_W', 'RIB_CLUB'], true);
    } else {
      // keep the existing south as context, rebuild the north
      model.show(['LO_S2A', 'LO_S2B', 'ROWS_S', 'BOARD_S', 'BUNKER_S', 'SU_S2'], false);
      model.show(model.match(/^EZS_/), false);
      model.show(['LO_S', 'LG_S', 'UP_S', 'SU_S', 'FAC_S', 'BOARD_S_OLD', 'FAC_SE', 'FAC_SW'], true);
      model.look(['LO_S', 'LG_S', 'UP_S', 'SU_S', 'FAC_S', 'BOARD_S_OLD'], 'clay');
      const solid = p.vom < 0.5;
      model.show('LO_N2', !solid && p.over > 0);
      model.show('LO_N2_SOLID', solid && p.over > 0);
      model.look(['LO_N2', 'LO_N2_SOLID'], 'overbuild');
      for (const n of ['LO_N2', 'LO_N2_SOLID']) model.parts[n].group.scale.y = Math.max(0.001, p.over);
      model.show(['BOARD_N', 'SRO_DECK_1', 'SRO_DECK_2', 'SRO_DECK_3', 'SRO_DECK_4'], p.board > 0.001);
      model.parts.BOARD_N.group.position.y = -150 * (1 - p.board);
      for (let i = 1; i <= 4; i++) model.parts[`SRO_DECK_${i}`].group.position.y = -150 * (1 - p.board);
      model.show(['SWEEP_NE', 'SWEEP_NW', 'SU_NE2', 'SU_NW2'], p.sweep > 0.001);
      model.look(['SWEEP_NE', 'SWEEP_NW'], 'clubSweep');
      model.look(['SU_NE2', 'SU_NW2'], 'newSeat');
      for (const n of ['SWEEP_NE', 'SWEEP_NW', 'SU_NE2', 'SU_NW2']) model.parts[n].group.scale.y = Math.max(0.001, p.sweep);
      model.show(['SRO_NE', 'SRO_NW'], p.sro > 0.001);
      model.look(['SRO_NE', 'SRO_NW'], 'newSeat');
      model.parts.SRO_NE.group.position.y = 60 * (1 - p.sro);
      model.parts.SRO_NW.group.position.y = 60 * (1 - p.sro);
      field.group.position.y = -4;
    }
    return {};
  },
  after(ctx) {
    placeAnchors(ctx.stage, this.anchors);
  },
};
