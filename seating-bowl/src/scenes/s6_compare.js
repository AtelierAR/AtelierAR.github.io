import { el, text, path, group } from '../overlay/svg.js';
import { C } from '../palette.js';
import { NORTH_LOWER_BOWL as N, fmt } from '../data.js';
import { cam, fade, roll } from './common.js';

// Scene 6 — North lower bowl, alternate vs proposed (0:58-1:06), p62-64.
// Same camera on both halves (view offset ±480 px), synchronized orbit.
// Figures read from the rasterized p62 (text layer is jumbled).
const A = { px: 120, py: 360, pz: 150, tx: -300, ty: 95, tz: -10, fov: 46, upMix: 1, roll: 0, shiftX: 0 };
const B = { px: 120, py: 346, pz: 96, tx: -300, ty: 95, tz: 10, fov: 46, upMix: 1, roll: 0, shiftX: 0 };
const NORTH_ALT_HIDE = ['LO_N2', 'SWEEP_NE', 'SWEEP_NW', 'SU_NE2', 'SU_NW2', 'SRO_NE', 'SRO_NW'];

export const s6 = {
  id: 6, name: 'Alternate vs proposed', start: 58, end: 66, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage } = ctx;
    const T0 = this.start;
    cam(tl, stage.rig, T0, 8, A, B, 'power1.inOut');

    const g = group(svg);
    fade(tl, g, T0 + 0.2, 0.4);
    el('rect', { x: 0, y: 0, width: 1920, height: 300, fill: C.paper, opacity: 0.96 }, g);
    path(g, 'M960,300L960,1080', { stroke: '#FFFFFF', width: 4 });
    text(g, 96, 92, 'NORTH LOWER BOWL', { size: 42, weight: 700, fill: '#163B40', tracking: 0.04 });
    text(g, 480, 160, 'ALTERNATE', { size: 34, weight: 700, fill: '#163B40', tracking: 0.14, anchor: 'middle' });
    text(g, 1440, 160, 'PROPOSED', { size: 34, weight: 700, fill: '#1F9D45', tracking: 0.14, anchor: 'middle' });

    // one comparison table: alternate | label | proposed
    const rows = [
      ['LOWER BOWL', N.alternate.lowerBowl, N.proposed.lowerBowl],
      ['CLUB LEVEL', N.alternate.clubLevel, N.proposed.clubLevel],
      ['TOTAL', N.alternate.total, N.proposed.total],
    ];
    const tbl = el('g', { opacity: 0 }, g);
    fade(tl, tbl, T0 + 0.5, 0.4);
    rows.forEach(([lab, a, b], i) => {
      const y = 206 + i * 34;
      const strong = lab === 'TOTAL';
      text(tbl, 960, y, lab, { size: 17, weight: 700, fill: strong ? '#163B40' : '#2A9A9A', anchor: 'middle', tracking: 0.12 });
      const va = text(tbl, 780, y, '0', { size: strong ? 26 : 23, weight: strong ? 700 : 500, fill: strong ? '#163B40' : '#2A9A9A', anchor: 'end' });
      const vb = text(tbl, 1140, y, '0', { size: strong ? 26 : 23, weight: strong ? 700 : 500, fill: strong ? '#163B40' : '#2A9A9A' });
      text(tbl, 790, y, 'seats', { size: 16, weight: 500, fill: '#7C8689' });
      text(tbl, 1130, y, 'seats', { size: 16, weight: 500, fill: '#7C8689', anchor: 'end' });
      roll(tl, va, T0 + 0.7 + i * 0.3, 2.0, 0, a);
      roll(tl, vb, T0 + 0.7 + i * 0.3, 2.0, 0, b);       // last ends 61.3
    });
    // rakes + alternate-only notes (p62)
    const notes = el('g', { opacity: 0 }, g);
    text(notes, 96, 206, 'BOWL RAKE', { size: 17, weight: 700, fill: '#163B40', tracking: 0.1 });
    text(notes, 96, 234, `${N.alternate.rake}°`, { size: 23, weight: 500, fill: '#163B40' });
    text(notes, 250, 206, 'RIBBON BOARDS', { size: 17, weight: 700, fill: '#163B40', tracking: 0.1 });
    text(notes, 250, 234, N.alternate.ribbon, { size: 19, weight: 500, fill: '#163B40' });
    text(notes, 250, 268, 'BOWL AREA', { size: 17, weight: 700, fill: '#163B40', tracking: 0.1 });
    text(notes, 372, 268, N.alternate.bowlArea, { size: 19, weight: 600, fill: '#D93A2B' });
    text(notes, 1824, 206, 'BOWL RAKE', { size: 17, weight: 700, fill: '#163B40', tracking: 0.1, anchor: 'end' });
    text(notes, 1824, 234, `LOWER BOWL ${N.proposed.rakeLower}°`, { size: 19, weight: 500, fill: '#163B40', anchor: 'end' });
    text(notes, 1824, 262, `CLUB ${N.proposed.rakeClub}°`, { size: 19, weight: 500, fill: '#163B40', anchor: 'end' });
    fade(tl, notes, T0 + 1.2, 0.5);

    // centre badge: seat delta
    const badge = el('g', { opacity: 0, transform: 'translate(960,960)' }, g);
    el('rect', { x: -190, y: -58, width: 380, height: 116, rx: 58, fill: C.midnight }, badge);
    text(badge, 0, -14, 'SEAT DELTA', { size: 18, weight: 700, fill: '#9FD9CF', anchor: 'middle', tracking: 0.18 });
    const dv = text(badge, 0, 34, '+0 seats', { size: 40, weight: 800, fill: '#FFFFFF', anchor: 'middle' });
    fade(tl, badge, T0 + 3.0, 0.4);
    roll(tl, dv, T0 + 3.1, 2.4, 0, N.seatDelta, { prefix: '+', suffix: ' seats', format: fmt }); // ends 63.5
  },
  frame() {
    return { render: (ctx) => this.render(ctx) };
  },
  render(ctx) {
    const { stage, model, field } = ctx;
    const { renderer, camera, composer, fxPass } = stage;
    const setAlt = () => {
      model.preset('proposed');
      model.show(NORTH_ALT_HIDE, false);
      model.show('ALT_N', true);
      model.look('BOARD_N', 'glassAlt');
      field.group.position.y = -4;
    };
    const setProp = () => {
      model.preset('proposed');
      model.look(['LO_N2', 'SWEEP_NE', 'SWEEP_NW', 'SU_NE2', 'SU_NW2'], 'teal');
      model.look('BOARD_N', 'glass');
      field.group.position.y = -4;
    };
    fxPass.enabled = false;
    const halves = [[setAlt, 0, 480], [setProp, 960, -480]];
    halves.forEach(([set, x, off], i) => {
      set();
      camera.setViewOffset(1920, 1080, off, 0, 1920, 1080);
      camera.updateProjectionMatrix();
      renderer.setScissorTest(i === 1);
      if (i === 1) renderer.setScissor(x, 0, 960, 1080);
      composer.render();
    });
    renderer.setScissorTest(false);
    camera.clearViewOffset();
    camera.updateProjectionMatrix();
    fxPass.enabled = true;
  },
};
