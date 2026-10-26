import { el, text, path, group } from '../overlay/svg.js';
import { C } from '../palette.js';
import { SOUTH_EXISTING, SOUTH_PROPOSED, SOUTH_DEMO_CALLOUT, BOARD } from '../data.js';
import { cam, fade, tw, moveList, anchoredDot, placeAnchors } from './common.js';

// Scene 5 — South Stand (0:46-0:58), p54 axon. Existing: demolition (callout
// from p53), lower the field. Proposed: lower the field, overbuild half of the
// lower bowl, 9 end-zone + bunker suites, new rows on the back, screen moved
// back, larger 16:9 board (214' x 109.5', p67).
const AX0 = { px: -810, py: 930, pz: 540, tx: 330, ty: -30, tz: -10, fov: 21, upMix: 1, roll: 0, shiftX: 0 };
const AX1 = { px: -760, py: 880, pz: 500, tx: 330, ty: -24, tz: -10, fov: 21, upMix: 1, roll: 0, shiftX: 0 };
const DEMO = ['UP_S', 'SU_S', 'FAC_S', 'BOARD_S_OLD', 'LG_S'];

export const s5 = {
  id: 5, name: 'South Stand', start: 46, end: 58, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage } = ctx;
    const T0 = this.start;
    const p = (this.p = { demoRed: 0, slice: 28, gone: 0, fieldRed: 0, drop: 0, proposed: 0, over: 0, suites: 0, rows: 0, move: 0, grow: 0 });
    cam(tl, stage.rig, T0, 12, AX0, AX1, 'power1.inOut');
    tw(tl, p, T0 + 1.0, 0.3, { demoRed: 0 }, { demoRed: 1 }, 'none');
    tw(tl, p, T0 + 1.8, 2.2, { slice: 28 }, { slice: 150 }, 'power1.inOut');
    tw(tl, p, T0 + 4.0, 0.01, { gone: 0 }, { gone: 1 }, 'none');
    tw(tl, p, T0 + 4.1, 0.3, { fieldRed: 0 }, { fieldRed: 1 }, 'none');
    tw(tl, p, T0 + 4.4, 0.9, { drop: 0 }, { drop: 1 });
    tw(tl, p, T0 + 5.4, 0.2, { proposed: 0 }, { proposed: 1 }, 'none');
    tw(tl, p, T0 + 6.0, 1.0, { over: 0 }, { over: 1 }, 'power2.out');
    tw(tl, p, T0 + 7.0, 1.0, { suites: 0 }, { suites: 1 }, 'none');
    tw(tl, p, T0 + 8.0, 0.8, { rows: 0 }, { rows: 1 }, 'power2.out');
    tw(tl, p, T0 + 8.8, 1.0, { move: 0 }, { move: 1 }, 'power2.inOut');
    tw(tl, p, T0 + 9.8, 1.0, { grow: 0 }, { grow: 1 }, 'power3.out');

    const g = group(svg);
    fade(tl, g, T0 + 0.4, 0.4);
    text(g, 96, 112, 'SOUTH STAND', { size: 46, weight: 700, fill: '#163B40', tracking: 0.02 });
    el('rect', { x: 64, y: 750, width: 1010, height: 330, fill: C.paper, opacity: 0.92 }, g);
    const exH = text(g, 96, 800, 'EXISTING', { size: 30, weight: 500, fill: '#7C8689', tracking: 0.12, opacity: 0 });
    const prH = text(g, 96, 800, 'PROPOSED', { size: 30, weight: 700, fill: '#1F9D45', tracking: 0.12, opacity: 0 });
    const exL = moveList(g, 96, 850, SOUTH_EXISTING.map((m) => ({ ...m, demo: true })), { size: 21, gap: 40 });
    const prL = moveList(g, 96, 850, SOUTH_PROPOSED, { size: 20, gap: 36 });
    fade(tl, exH, T0 + 0.7, 0.4);
    fade(tl, exL[0], T0 + 1.0, 0.4);
    fade(tl, exL[1], T0 + 4.1, 0.4);
    fade(tl, exH, T0 + 5.3, 0.3, 0, 1);
    exL.forEach((it) => fade(tl, it, T0 + 5.3, 0.3, 0, 1));
    fade(tl, prH, T0 + 5.5, 0.4);
    [5.6, 6.0, 7.0, 8.0, 8.8, 9.8].forEach((at, i) => fade(tl, prL[i], T0 + at, 0.4));

    // demo callout (p53)
    const co = el('g', { opacity: 0 }, g);
    this.callout = { g: co, line: path(co, 'M0,0', { stroke: C.demo, width: 1.2 }), txt: text(co, 0, 0, SOUTH_DEMO_CALLOUT.toUpperCase(), { size: 19, weight: 700, fill: C.demo, tracking: 0.04 }) };
    fade(tl, co, T0 + 1.3, 0.4);
    fade(tl, co, T0 + 4.2, 0.4, 0, 1);

    // board dimension
    const bd = el('g', { opacity: 0 }, g);
    this.boardDim = { g: bd, txt: text(bd, 0, 0, BOARD.label, { size: 26, weight: 700, fill: '#1B7F78' }), sub: text(bd, 0, 0, `ASPECT RATIO ${BOARD.ratio}`, { size: 15, weight: 600, fill: '#1B7F78', tracking: 0.12 }) };
    fade(tl, bd, T0 + 10.4, 0.5);

    const dots = el('g', {}, g);
    this.anchors = [
      anchoredDot(dots, 1, [350, 140, 60], C.demo),
      anchoredDot(dots, 2, [150, 2, -40], C.demo),
      anchoredDot(dots, 1, [192, -2, 60], C.line),
      anchoredDot(dots, 2, [232, 12, 10], C.line),
      anchoredDot(dots, 3, [194, 4, -86], C.line),
      anchoredDot(dots, 4, [302, 36, 0], C.line),
      anchoredDot(dots, 5, [375, 80, 20], C.line),
      anchoredDot(dots, 6, [375, 140, 20], C.line),
    ];
    const dt = [1.0, 4.1, 5.6, 6.0, 7.0, 8.0, 8.8, 9.8];
    this.anchors.forEach((a, i) => {
      fade(tl, a.g, T0 + dt[i], 0.3);
      if (i < 2) fade(tl, a.g, T0 + 5.3, 0.3, 0, 1);
    });
  },
  frame(ctx) {
    const { model, field, M, dust, SLICE } = ctx;
    const p = this.p;
    field.group.position.y = -4 * p.drop;
    if (p.proposed < 0.5) {
      model.preset('existing');
      model.show(['ROOF_E', 'ROOF_W'], false);
      if (p.demoRed > 0.5) model.look(DEMO, 'hatch');
      // discrete 5' slices peel away bottom to top
      SLICE.constant = -Math.floor(p.slice / 5) * 5;
      dust.points.visible = p.slice > 30 && p.gone < 1;
      dust.uniforms.uCut.value = p.slice;
      dust.uniforms.uSide.value = 1;
      if (p.gone >= 1) model.show(DEMO, false);
      if (p.fieldRed > 0.5) field.clay.material = M.hatchField;
      // north already rebuilt (scene 4)
      model.show(['LO_N', 'LG_N', 'UP_N', 'FAC_N', 'FAC_NE', 'FAC_NW', 'BOARD_N_OLD', 'TOWER_N', 'SU_NE', 'SU_NW', 'CL_NE', 'CL_NW'], false);
      model.show(['LO_N2', 'BOARD_N', 'SWEEP_NE', 'SWEEP_NW', 'SU_NE2', 'SU_NW2', 'SRO_NE', 'SRO_NW'], true);
    } else {
      model.preset('proposed');
      model.show(['ROOF_E', 'ROOF_W'], false);
      field.group.position.y = -4;
      model.show(['LO_S2A', 'LO_S2B'], p.over > 0.001);
      model.look('LO_S2A', 'overbuild');
      model.parts.LO_S2A.group.scale.y = Math.max(0.001, p.over);
      model.show(['LO_S'], p.over <= 0.001);
      const n = Math.floor(p.suites * 10);
      for (let i = 0; i < 9; i++) model.show(`EZS_${i}`, i < n);
      model.show('BUNKER_S', p.suites > 0.95);
      model.show('ROWS_S', p.rows > 0.001);
      model.look('ROWS_S', 'newSeat');
      model.parts.ROWS_S.group.scale.y = Math.max(0.001, p.rows);
      // screen: old-size ghost moves back, then grows to the new 16:9 board
      const ghost = model.parts.BOARD_S_OLD;
      const B = model.parts.BOARD_S;
      if (p.move > 0 && p.grow < 0.35) {
        ghost.group.visible = true;
        ghost.setLook('glass');
        ghost.group.position.set(40 * p.move, 0, 0);
      }
      // grows about its own centre from the old board's size to 214' x 109.5'
      B.group.visible = p.grow > 0.001;
      const k = 0.5 + 0.5 * p.grow;
      const cx = 372, cy = 108;
      B.group.scale.setScalar(k);
      B.group.position.set(cx * (1 - k), cy * (1 - k), 0);
      model.show(['SU_S2', 'LO_S'], false);
    }
    return {};
  },
  after(ctx) {
    const { stage } = ctx;
    placeAnchors(stage, this.anchors);
    const a = stage.project(346, 70, 50);
    const t = [a[0] + 140, a[1] - 110];
    this.callout.line.setAttribute('d', `M${a[0]},${a[1]}L${t[0] - 8},${t[1] + 6}`);
    this.callout.txt.setAttribute('x', t[0]); this.callout.txt.setAttribute('y', t[1]);
    const b = stage.project(372, 180, -110);
    this.boardDim.txt.setAttribute('x', b[0] + 20); this.boardDim.txt.setAttribute('y', b[1]);
    this.boardDim.sub.setAttribute('x', b[0] + 20); this.boardDim.sub.setAttribute('y', b[1] + 24);
  },
};
