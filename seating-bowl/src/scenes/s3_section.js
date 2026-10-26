import { el, text, path, group, drawable, dot, toD, goalpost } from '../overlay/svg.js';
import { C } from '../palette.js';
import { EW_MOVES, RAKES } from '../data.js';
import { fade, moveList } from './common.js';
import sec from '../geometry/section_ew_p50.json';

// Scene 3 — East/West section at the 50-yard line (0:20-0:32), p50 redrawn as
// a drawing: existing cut lines fade to silver dashed, the five moves draw in
// line green in order with their numbered dots. Cut lines 1.5 px, beyond 0.75 px.
const S = 4.9;                  // px per ft
const OX = 200, OY = 985;       // screen position of (u=0, v=0) — field centre at new field level
const X = (u) => OX + u * S;
const Y = (v) => OY - v * S;
const P = (pts) => pts.map(([u, v]) => [X(u), Y(v)]);

// Proposed rakes are drawn at the stated angles (p62), from the traced front row
// over the traced run.
function rakeAt([u0, v0], run, deg, rows) {
  const rise = run * Math.tan((deg * Math.PI) / 180);
  const out = [[u0, v0]];
  for (let i = 0; i < rows; i++) {
    const ua = u0 + (run * i) / rows, ub = u0 + (run * (i + 1)) / rows, vb = v0 + (rise * (i + 1)) / rows;
    out.push([ua, vb], [ub, vb]);
  }
  return out;
}

export const s3 = {
  id: 3, name: 'East/West section', start: 20, end: 32, ground: C.paper,
  build(ctx) {
    const { tl, svg } = ctx;
    const T0 = this.start;
    const g = group(svg);
    fade(tl, g, T0, 0.35);
    el('rect', { width: 1920, height: 1080, fill: C.paper }, g);
    text(g, 96, 112, 'East / West Section 50 Yard Line', { size: 52, weight: 700, fill: C.ink });

    const pr = sec.proposed, ex = sec.existing;
    const lb0 = pr.lowerBowl[0], lbN = pr.lowerBowl[pr.lowerBowl.length - 1];
    const lowerNew = rakeAt(lb0, lbN[0] - lb0[0], RAKES.lowerBowl, 24);
    const cb0 = pr.clubBowl[0], cbN = pr.clubBowl[pr.clubBowl.length - 1];
    const clubNew = rakeAt(cb0, cbN[0] - cb0[0], RAKES.club, 10);
    const draw = el('g', {}, g);

    // ---- beyond (0.75 px): goalpost at the far end line, roof edge
    const beyond = el('g', { opacity: 0 }, draw);
    goalpost(beyond, X(0), Y(0), S, '#AEB6B9');
    path(beyond, toD(P(pr.roof)), { stroke: '#AEB6B9', width: 0.75 });
    for (const c of pr.columns) path(beyond, toD(P(c)), { stroke: '#AEB6B9', width: 0.75 });
    fade(tl, beyond, T0 + 0.3, 0.6);

    // ---- retained structure (ink-grey cut lines, 1.5 px)
    const keep = el('g', { opacity: 0 }, draw);
    const kStroke = { stroke: '#6E7B7F', width: 1.5 };
    path(keep, toD(P(pr.upperBowl)), kStroke);
    path(keep, toD(P(pr.structure)), kStroke);
    for (const k of ['mainConcourse', 'logeSlab', 'clubSlab1', 'upperSlab', 'upperConcourse']) path(keep, toD(P(pr.levels[k])), kStroke);
    fade(tl, keep, T0 + 0.3, 0.6);

    // ---- existing cut lines: ink first, then fade to silver dashed
    const exG = el('g', {}, draw);
    const exParts = {
      field: path(exG, toD(P(ex.field)), { stroke: C.ink, width: 1.5 }),
      lower: path(exG, toD(P(ex.lowerBowl)), { stroke: C.ink, width: 1.5 }),
      loge: path(exG, toD(P(ex.loge)), { stroke: C.ink, width: 1.5 }),
      club: path(exG, toD(P(ex.clubBowl)), { stroke: C.ink, width: 1.5 }),
      clubLevel: path(exG, toD(P(ex.clubLevel)), { stroke: C.ink, width: 1.5 }),
    };
    fade(tl, exG, T0 + 0.3, 0.6);
    for (const [k, p] of Object.entries(exParts)) {
      tl.fromTo(p, { attr: { stroke: C.ink, 'stroke-dasharray': '1 0' } },
        { attr: { stroke: C.silver, 'stroke-dasharray': '7 5' }, duration: 0.6, ease: 'power1.inOut', immediateRender: false }, T0 + 1.2);
      void k;
    }

    // ---- level labels (p50)
    const labs = el('g', { opacity: 0 }, g);
    const L = sec.labels;
    const lab = (k, s, o = {}) => text(labs, X(L[k][0]), Y(L[k][1]), s, { size: 18, weight: 500, fill: '#8A9497', tracking: 0.1, ...o });
    lab('upperConcourse', 'UPPER CONCOURSE');
    lab('clubLevel', 'CLUB LEVEL');
    lab('mainConcourse', 'MAIN CONCOURSE');
    lab('loge', 'LOGE', { fill: '#1F8F41' });
    lab('fieldSuites', 'FIELD SUITES', { fill: '#1F8F41' });
    lab('sideline', 'SIDELINE', { anchor: 'middle', size: 15 });
    text(labs, 1840, Y(-20), 'EAST', { size: 30, weight: 600, fill: '#3E6E5C', anchor: 'end', tracking: 0.06 });
    fade(tl, labs, T0 + 0.8, 0.6);

    // ---- legend: NEW / CURRENT
    const leg = el('g', { opacity: 0 }, g);
    path(leg, `M150,${Y(-14)}L210,${Y(-14)}`, { stroke: C.line, width: 2.5 });
    text(leg, 224, Y(-14) + 7, 'NEW', { size: 19, weight: 600, fill: '#1F8F41', tracking: 0.1 });
    path(leg, `M150,${Y(-24)}L210,${Y(-24)}`, { stroke: C.silver, width: 2, dash: '7 5' });
    text(leg, 224, Y(-24) + 7, 'CURRENT', { size: 19, weight: 600, fill: '#8A9497', tracking: 0.1 });
    fade(tl, leg, T0 + 1.2, 0.5);

    // ---- move list (deck wording, numbered dots)
    const list = moveList(g, 150, 182, EW_MOVES, { size: 22, gap: 42 });
    list.forEach((it, i) => fade(tl, it, T0 + 1.3 + i * 0.12, 0.4, 0.38));

    // ---- the five moves, in order
    const newG = el('g', {}, draw);
    const G = { stroke: C.line, width: 1.5, headColor: '#C9FFD4' };
    const moves = [
      { at: 1.9, d: [toD(P(pr.field))], dot: [lb0[0] - 120, 3.5], extra: 'drop' },
      { at: 3.7, d: [toD(P(pr.fieldSuites))], dot: [lb0[0] - 8, 12] },
      { at: 5.4, d: [toD(P(lowerNew))], dot: [lb0[0] + 52, 26], extra: 'rake15', fadeEx: ['lower'] },
      { at: 7.1, d: [toD(P(pr.loge))], dot: [L.loge[0] - 30, 47], fadeEx: ['loge'] },
      { at: 8.6, d: [toD(P(clubNew)), toD(P(sec.proposed.levels.clubLevel))], dot: [cb0[0] - 6, cb0[1] + 18], extra: 'rake27', demo: ['club', 'clubLevel'] },
    ];
    moves.forEach((m, i) => {
      const at = T0 + m.at;
      // list: highlight the active move
      tl.fromTo(list[i], { opacity: 0.38 }, { opacity: 1, duration: 0.3, immediateRender: false }, at - 0.1);
      m.d.forEach((d, j) => {
        const dr = drawable(newG, d, G);
        tl.fromTo(dr, { prog: 0 }, { prog: 1, duration: 1.25, ease: 'power2.inOut', immediateRender: false }, at + j * 0.2);
      });
      const n = EW_MOVES[i];
      const dd = dot(g, X(m.dot[0]), Y(m.dot[1]), n.n, { fill: n.demo ? C.demo : C.line });
      tl.fromTo(dd, { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.35, ease: 'back.out(1.2)', immediateRender: false }, at);
      for (const k of m.fadeEx || []) {
        tl.fromTo(exParts[k], { opacity: 1 }, { opacity: 0.55, duration: 0.6, immediateRender: false }, at);
      }
      for (const k of m.demo || []) {
        tl.fromTo(exParts[k], { attr: { stroke: C.silver } }, { attr: { stroke: C.demo }, duration: 0.25, immediateRender: false }, at - 0.05);
        tl.fromTo(exParts[k], { opacity: 1 }, { opacity: 0.45, duration: 0.8, immediateRender: false }, at + 0.6);
      }
      if (m.extra === 'drop') {
        // 4'-0" dimension at the front of the bowl
        const x = X(lb0[0] - 60);
        const dg = el('g', { opacity: 0 }, g);
        path(dg, `M${x},${Y(4) - 14}L${x},${Y(0) + 14}`, { stroke: C.ink, width: 1.1 });
        path(dg, `M${x - 6},${Y(4) + 6}L${x + 6},${Y(4) - 6}M${x - 6},${Y(0) + 6}L${x + 6},${Y(0) - 6}`, { stroke: C.ink, width: 1.5 });
        text(dg, x - 12, Y(2) + 8, '4\'-0"', { size: 22, weight: 700, fill: C.ink, anchor: 'end' });
        fade(tl, dg, at + 0.6, 0.4);
      }
      if (m.extra === 'rake15' || m.extra === 'rake27') {
        const deg = m.extra === 'rake15' ? RAKES.lowerBowl : RAKES.club;
        const [u0, v0] = m.extra === 'rake15' ? lb0 : cb0;
        const r = 92;
        const cx = X(u0), cy = Y(v0);
        const a = (deg * Math.PI) / 180;
        const ag = el('g', { opacity: 0 }, g);
        path(ag, `M${cx},${cy}L${cx + r + 26},${cy}`, { stroke: '#1F8F41', width: 0.75, dash: '4 4' });
        path(ag, `M${cx + r},${cy}A${r},${r} 0 0 0 ${cx + r * Math.cos(a)},${cy - r * Math.sin(a)}`, { stroke: '#1F8F41', width: 1.5 });
        text(ag, cx + r + 10, cy - r * Math.sin(a / 2) + 7, `${deg}°`, { size: 22, weight: 700, fill: '#1F8F41' });
        text(ag, cx + r + 10, cy - r * Math.sin(a / 2) + 29, m.extra === 'rake15' ? 'LOWER BOWL' : 'CLUB', { size: 13, weight: 600, fill: '#1F8F41', tracking: 0.12 });
        fade(tl, ag, at + 1.1, 0.4);
      }
      if (m.demo) {
        // 8' raise dimension
        const x = X(cbN[0] + 14);
        const dg = el('g', { opacity: 0 }, g);
        path(dg, `M${x},${Y(cbN[1] - 8)}L${x},${Y(cbN[1])}`, { stroke: C.demo, width: 1.1 });
        path(dg, `M${x - 5},${Y(cbN[1] - 8) + 5}L${x + 5},${Y(cbN[1] - 8) - 5}M${x - 5},${Y(cbN[1]) + 5}L${x + 5},${Y(cbN[1]) - 5}`, { stroke: C.demo, width: 1.5 });
        text(dg, x + 10, Y(cbN[1] - 4) + 7, "8'", { size: 20, weight: 700, fill: C.demo });
        fade(tl, dg, at + 1.0, 0.4);
      }
    });
    this.g = g;
  },
  frame() {
    // pure 2D scene: clear the 3D layer to paper so any frame renders the same
    return {
      render: ({ stage }) => {
        stage.renderer.setClearColor(C.paper, 1);
        stage.renderer.clear();
      },
    };
  },
};
