import { el, text, group } from '../overlay/svg.js';
import { C } from '../palette.js';
import { EXISTING_MANIFEST as E, fmt } from '../data.js';
import { camSet, fade, tw, roll, drive, PLAN_RIG, manifestRow, fmtPair } from './common.js';
import playersUrl from '../assets/p36_players.jpg';

// Scene 1 — Today (0:00-0:10): title card, then the existing bowl drawn ring
// by ring in the p37 colour coding while the existing manifest counts up.
export const s1 = {
  id: 1, name: 'Today', start: 0, end: 10, ground: C.paper,
  build(ctx) {
    const { tl, svg, stage } = ctx;
    const T0 = this.start;
    this.p = { sweep: { apron: 0, lower: 0, club: 0, suites: 0, upper: 0 }, field: 0 };

    // --- title card (p36) ---
    const card = el('g', { opacity: 1 }, svg);
    el('rect', { width: 1920, height: 1080, fill: C.midnight }, card);
    const img = el('image', { href: playersUrl, x: -40, y: 0, width: 2100, height: 1080, preserveAspectRatio: 'xMinYMid slice', opacity: 0.32 }, card);
    el('rect', { width: 1920, height: 1080, fill: 'url(#cardShade)' }, card);
    const defs = el('defs', {}, svg);
    const lg = el('linearGradient', { id: 'cardShade', x1: 0, x2: 1, y1: 0, y2: 0 }, defs);
    el('stop', { offset: 0, 'stop-color': C.midnight, 'stop-opacity': 0.15 }, lg);
    el('stop', { offset: 0.7, 'stop-color': C.midnight, 'stop-opacity': 0.55 }, lg);
    el('stop', { offset: 1, 'stop-color': C.midnight, 'stop-opacity': 0.85 }, lg);
    const ttl = el('g', { opacity: 0 }, card);
    text(ttl, 1820, 600, 'SEATING BOWL', { size: 118, weight: 800, fill: '#FFFFFF', anchor: 'end', tracking: 0.005 });
    text(ttl, 1824, 660, 'LINCOLN FINANCIAL FIELD  ·  HKS CONCEPT PRICING PACKAGE', { size: 22, weight: 500, fill: '#B8D3D0', anchor: 'end', tracking: 0.16 });
    tl.fromTo(img, { attr: { x: -40 } }, { attr: { x: -150 }, duration: 3.4, ease: 'none', immediateRender: false }, T0);
    tl.fromTo(ttl, { opacity: 0, x: 30 }, { opacity: 1, x: 0, duration: 0.9, ease: 'power3.out', immediateRender: false }, T0 + 0.35);
    fade(tl, card, T0 + 3.0, 0.45, 0, 1);

    // --- plan + manifest ---
    camSet(tl, stage.rig, T0, PLAN_RIG);
    const g = group(svg);
    fade(tl, g, T0 + 3.1, 0.4);
    text(g, 150, 128, 'Existing Manifest', { size: 76, weight: 600, fill: C.ink });
    const x = 80;
    const rows = [];
    E.rows.forEach((r, i) => rows.push([manifestRow(g, x, 300 + i * 60, r.code, r.label), r.value]));
    rows.push([manifestRow(g, x, 560, '', 'SUBTOTAL', { strong: true }), E.subtotal]);
    rows.push([manifestRow(g, x, 640, '', 'FIELD SEATS'), E.fieldSeats]);
    const suites = manifestRow(g, x, 700, '', 'SUITES');
    const mini = manifestRow(g, x, 760, '', 'MINI-SUITES');
    rows.push([manifestRow(g, x, 840, '', 'TOTAL', { strong: true }), E.total]);
    const sro = manifestRow(g, x, 950, '', 'SRO TERRACES');
    const tot = manifestRow(g, x, 1020, '', 'TOTAL with SRO', { strong: true });

    // the bowl draws ring by ring; manifest rows appear with their ring
    const S = this.p.sweep;
    const ringT = { apron: 3.3, lower: 3.8, club: 4.7, suites: 5.4, upper: 6.0 };
    for (const [k, at] of Object.entries(ringT)) tw(tl, S, T0 + at, 1.1, { [k]: 0 }, { [k]: 1 }, 'power2.inOut');
    tw(tl, this.p, T0 + 3.3, 0.8, { field: 0 }, { field: 1 });

    const show = (row, at, from, to, fmtFn) => {
      fade(tl, row.g, T0 + at, 0.35);
      roll(tl, row.v, T0 + at, 1.5, from, to, fmtFn ? { format: fmtFn } : {});
    };
    show(rows[0][0], 3.9, 0, rows[0][1]);           // lower
    show(rows[1][0], 4.8, 0, rows[1][1]);           // club
    show(rows[2][0], 5.2, 0, rows[2][1]);           // mezz
    show(rows[3][0], 6.1, 0, rows[3][1]);           // upper
    show(rows[4][0], 6.6, 0, rows[4][1]);           // subtotal
    show(rows[5][0], 6.9, 0, rows[5][1]);           // field seats
    fade(tl, suites.g, T0 + 7.0, 0.35);
    drive(tl, T0 + 6.95, 1.4, (k) => { suites.v.textContent = fmtPair(E.suites.count * k, E.suites.seats * k); });
    fade(tl, mini.g, T0 + 7.1, 0.35);
    drive(tl, T0 + 7.05, 1.3, (k) => { mini.v.textContent = `${fmt(E.miniSuites.count * k)}     | ${fmt(E.miniSuites.seats * k)}`; });
    show(rows[6][0], 7.15, 0, rows[6][1]);          // total
    show(sro, 7.25, 0, E.sroTerraces);
    show(tot, 7.35, 0, E.totalWithSro);             // finishes 8.85 (1.15 s before the cut)
    this.g = g;
    // legend chips (p37 colour coding)
    const lg2 = el('g', { opacity: 0 }, g);
    const chips = [['LOWER / UPPER BOWL', C.plan37.bowl], ['CLUB', C.plan37.club], ['CLUB SUITES', C.plan37.suites], ['LOGE', C.plan37.loge], ['MEZZANINE', C.plan37.mezz], ['TERRACES', C.plan37.terrace]];
    chips.forEach(([l, c], i) => {
      el('rect', { x: 690 + i * 205, y: 1028, width: 16, height: 16, fill: c }, lg2);
      text(lg2, 714 + i * 205, 1042, l, { size: 15, weight: 600, fill: C.inkSoft, tracking: 0.08 });
    });
    fade(tl, lg2, T0 + 6.4, 0.6);
  },
  frame(ctx) {
    const { model, plans, field } = ctx;
    model.root.visible = false;
    field.clay.visible = false;
    field.planMat.opacity = this.p.field;
    plans.p37.group.visible = true;
    for (const b of plans.p37.bands) b.mat.uniforms.uSweep.value = this.p.sweep[b.ring];
    plans.divMat.opacity = 0.85 * this.p.sweep.upper;
    return { post: false };
  },
};
