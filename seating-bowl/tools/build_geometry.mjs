// Traced geometry for the seating-bowl film.
//
// Every anchor below was read off the 200-DPI rasters in reference/pages/
// (`npm run prep`) using tools/gridcrop.py (labelled pixel grids). Anchors are
// kept in ORIGINAL raster pixels so the trace can be re-checked against the
// page; this script converts them to feet with each drawing's calibration and
// writes src/geometry/*.json.
//
//   node tools/build_geometry.mjs
//
// Coordinate conventions (feet):
//   plan   : x = along the field, +x = SOUTH (p37 right), -x = NORTH (p37 left)
//            z = across the field, +z = WEST (p37 bottom, press side), -z = EAST
//   section: u = horizontal distance from the drawing's datum (field centre for
//            p50, end line for p51/p53), v = elevation above the NEW field (-4').
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'geometry');
mkdirSync(OUT, { recursive: true });
const r1 = (n) => Math.round(n * 10) / 10;
const save = (name, obj) => {
  writeFileSync(join(OUT, name), JSON.stringify(obj, null, 1) + '\n');
  console.log('wrote', name);
};

/* ------------------------------------------------------------------ */
/* PLAN — p37 existing manifest, p42 new manifest                      */
/* ------------------------------------------------------------------ */
// Calibration: playing field incl. end zones = 360 ft. End-zone outer edges
// read at x = 1125 px and x = 1652 px -> 527 px / 360 ft = 1.464 px/ft.
// Cross-check: sidelines y = 638 / 870 px -> 232 px = 158.5 ft (field 160 ft, 1%).
// The 30'/60'/90' scale bar (bottom right) gives 1.43 px/ft, within 2.5%.
const P37 = { page: 37, cx: 1388, cy: 754, pxPerFt: 527 / 360 };
const px2ft = (cal, px, py) => [r1((px - cal.cx) / cal.pxPerFt), r1((py - cal.cy) / cal.pxPerFt)];

// Rings are chamfered rectangles with 12 corresponding vertices so that seat
// rows can be interpolated between any two rings (see src/three/rings.js).
//   xs,zs  : end of the side straight          xm,zm : chamfer mid-point
//   xeN/xeS: north / south end straight        ze    : half-length of end straight
// Each ring lists the raster anchors it was derived from (orig px, p37 unless noted).
function ringFromPx(name, a, note) {
  const f = (k) => (k in a ? a[k] : undefined);
  const X = (px) => r1(Math.abs((px - P37.cx) / P37.pxPerFt));
  const Z = (py) => r1(Math.abs((py - P37.cy) / P37.pxPerFt));
  return {
    name, note,
    xs: X(f('xsPx')), zs: Z(f('zsPx')),
    xm: X(f('xmPx')), zm: Z(f('zmPx')),
    xeN: X(f('xeNPx')), xeS: X(f('xeSPx')), ze: Z(f('zePx')),
    anchorsPx: a,
  };
}

const existingRings = [
  ringFromPx('LB_in', { xsPx: 1513, zsPx: 548, xmPx: 1667, zmPx: 591, xeNPx: 1082, xeSPx: 1682, zePx: 637 },
    'Field wall / front of 100-level (light apron edge around field)'),
  ringFromPx('LB_out', { xsPx: 1571, zsPx: 452, xmPx: 1736, zmPx: 496, xeNPx: 944, xeSPx: 1820, zePx: 634 },
    'Back of 100-level = front of LS loge band'),
  ringFromPx('LS_out', { xsPx: 1571, zsPx: 423, xmPx: 1754, zmPx: 473, xeNPx: 905, xeSPx: 1855, zePx: 622 },
    'Back of LS loge band; at the ends back of RZS (north) and M mezzanine (south)'),
  ringFromPx('C_out', { xsPx: 1578, zsPx: 370, xmPx: 1781, zmPx: 429, xeNPx: 905, xeSPx: 1855, zePx: 615 },
    'Back of C club sections (club absent at the ends)'),
  ringFromPx('CS_out', { xsPx: 1586, zsPx: 335, xmPx: 1813, zmPx: 403, xeNPx: 905, xeSPx: 1890, zePx: 608 },
    'Back of CS club suites (CS145-CS160 at the south end)'),
  ringFromPx('UB_out', { xsPx: 1830, zsPx: 246, xmPx: 1885, zmPx: 418, xeNPx: 830, xeSPx: 1950, zePx: 540 },
    'Outer edge of 200-level (single straight chamfer at the corners)'),
];

// p42 new manifest — same calibration (field 1120..1653 px at this page; the
// plans are registered to within 4 px so P37 calibration is reused).
const newRings = [
  ringFromPx('LB_in_new', { xsPx: 1513, zsPx: 573, xmPx: 1660, zmPx: 606, xeNPx: 1093, xeSPx: 1680, zePx: 640 },
    'p42: front of 100-level after +4 rows and field suites (sideline 17 ft closer)'),
  ringFromPx('LB_out_new', { xsPx: 1578, zsPx: 427, xmPx: 1765, zmPx: 478, xeNPx: 940, xeSPx: 1836, zePx: 634 },
    'p42: back of the overbuilt 100-level (loge line)'),
];

save('plan_rings.json', {
  source: 'p37 Existing Manifest / p42 New Manifest, rasterized 200 DPI',
  calibration: { ...P37, method: 'field 360 ft = 527 px; checked vs 160 ft field width and 90 ft scale bar' },
  axes: '+x south (p37 right), +z west (p37 bottom); feet from field centre',
  existing: existingRings,
  proposed: newRings,
  // Videoboard volumes in plan (p42 VIDEOBOARD CLUB outlines; size from p67).
  boards: {
    north: { xFront: -320, xBack: -441, halfWidth: 107, note: 'x from p51 section; width 214 ft (p67)' },
    south: { xFront: 315, xBack: 430, halfWidth: 107, note: 'x from p53 section; width 214 ft (p67)' },
  },
});

/* ------------------------------------------------------------------ */
/* SECTIONS                                                            */
/* ------------------------------------------------------------------ */
// p50: the scale bar is unlabelled and disagrees with known dimensions (see
// REFERENCE_NOTES.md). Calibrated on the stated 4'-0" drop (CURRENT dashed
// y=1213, NEW y=1240) and the 80 ft half-field (goalpost centre x=411,
// SIDELINE x=908): 497 px / 80 ft = 6.2 px/ft. Crossbar 10 ft: 58 px = 5.8 px/ft.
const P50 = { page: 50, u0: 411, v0: 1240, pxPerFt: 6.2 };
// p51/p53: calibrated on the 4' field drop (18 px) and verified against the
// videoboard height 109.5 ft (p67): 483-486 px -> 4.43 px/ft. The printed
// 30'/90'/150' bar implies 3.86 px/ft and is ~15% off; not used.
const P51 = { page: 51, u0: 1136, v0: 1227, pxPerFt: 4.45 };
const P53 = { page: 53, u0: 1164, v0: 1227, pxPerFt: 4.45 };
const toFt = (cal) => ([x, y]) => [r1((x - cal.u0) / cal.pxPerFt), r1((cal.v0 - y) / cal.pxPerFt)];
const poly = (cal, pts) => pts.map(toFt(cal));

// Stepped rake generator: exact row counts between two traced end points.
function rake([u0, v0], [u1, v1], rows) {
  const out = [[u0, v0]];
  for (let i = 0; i < rows; i++) {
    const ua = u0 + ((u1 - u0) * i) / rows, ub = u0 + ((u1 - u0) * (i + 1)) / rows;
    const vb = v0 + ((v1 - v0) * (i + 1)) / rows;
    out.push([r1(ua), r1(vb)], [r1(ub), r1(vb)]);
  }
  return out;
}

// ---- p50 East/West section at the 50-yard line ----
{
  const c = P50; const p = (pts) => poly(c, pts);
  const lbFront = toFt(c)([1090, 1188]);      // first row (behind field suites)
  const lbBack = toFt(c)([1630, 1065]);       // top of 100-level at loge
  const clubFront = toFt(c)([1637, 892]);
  const clubBack = toFt(c)([1850, 786]);
  const ubFront = toFt(c)([1800, 711]);
  const ubBack = toFt(c)([2169, 461]);
  const existingLbFront = [r1(lbFront[0] + 20), r1(lbFront[1] + 2)]; // 4 rows + suites removed, see notes
  const deg = (a, b) => r1((Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI);
  save('section_ew_p50.json', {
    source: 'p50 East / West Section 50 Yard Line', calibration: c,
    axes: 'u = ft east of field centre, v = ft above NEW field',
    proposed: {
      field: p([[80, 1240], [1600, 1240]]),
      fieldSuites: p([[1090, 1240], [1090, 1175], [1360, 1150], [1600, 1150], [1600, 1240]]),
      lowerBowl: rake(lbFront, lbBack, 24),            // 20 overbuilt + 4 added rows
      loge: p([[1640, 1060], [1640, 1000], [1700, 1000], [1700, 1060]]),
      clubBowl: rake(clubFront, clubBack, 10),
      upperBowl: rake(ubFront, ubBack, 22),
      levels: {
        mainConcourse: p([[1630, 1076], [2560, 1076]]),
        logeSlab: p([[1700, 1011], [2560, 1011]]),
        clubSlab1: p([[1650, 949], [2560, 949]]),
        clubLevel: p([[1640, 876], [2560, 876]]),
        upperSlab: p([[1850, 761], [2560, 761]]),
        upperConcourse: p([[1800, 682], [2560, 682]]),
      },
      structure: p([[1600, 1240], [1600, 1205], [1940, 1205], [1940, 1180], [2556, 1180], [2556, 405], [2300, 405]]),
      columns: [p([[2475, 1180], [2475, 600]]), p([[2340, 1180], [2340, 1076]])],
      roof: p([[1296, 353], [1500, 263], [2133, 263], [2327, 353], [1296, 353]]),
    },
    existing: {
      // Existing linework is drawn grey (elevation, not cut) on p50; these are
      // the cut lines implied by the five moves: field +4', lower bowl before
      // restrike (20 rows, steeper, starting 4 rows further back), club 8' lower.
      field: [[r1((80 - c.u0) / c.pxPerFt), 4], [r1((1600 - c.u0) / c.pxPerFt), 4]],
      lowerBowl: rake(existingLbFront, [lbBack[0], lbBack[1]], 20),
      loge: p([[1640, 1060 - 8], [1640, 1000 - 8], [1700, 1000 - 8], [1700, 1060 - 8]]),
      clubBowl: rake([clubFront[0], r1(clubFront[1] - 8)], [clubBack[0], r1(clubBack[1] - 8)], 10),
      clubLevel: [[r1((1640 - c.u0) / c.pxPerFt), r1((c.v0 - 876) / c.pxPerFt - 8)], [r1((2560 - c.u0) / c.pxPerFt), r1((c.v0 - 876) / c.pxPerFt - 8)]],
    },
    measuredRakeDeg: { lowerBowl: deg(lbFront, lbBack), club: deg(clubFront, clubBack), upper: deg(ubFront, ubBack) },
    statedRakeDeg: { lowerBowl: 15, club: 27, source: 'p62 BOWL RAKE (proposed)' },
    dots: { 1: toFt(c)([190, 1213]), 2: toFt(c)([1048, 1178]), 3: toFt(c)([1390, 1092]), 4: toFt(c)([1163, 1140]), 5: toFt(c)([1595, 1017]), 6: toFt(c)([1660, 828]) },
    labels: {
      fieldSuites: toFt(c)([1380, 1192]), loge: toFt(c)([1686, 1042]), mainConcourse: toFt(c)([2330, 1066]),
      clubLevel: toFt(c)([2390, 850]), upperConcourse: toFt(c)([2335, 660]), sideline: toFt(c)([908, 1255]),
    },
  });
}

// ---- p51 North section ----
{
  const c = P51; const p = (pts) => poly(c, pts);
  save('section_north_p51.json', {
    source: 'p51 North Section', calibration: c,
    axes: 'u = ft north of the north end line, v = ft above NEW field',
    proposed: {
      field: p([[1000, 1227], [2400, 1227]]),
      lowerBowl: rake(toFt(c)([1250, 1183]), toFt(c)([1643, 1087]), 20),
      fieldClub: p([[1250, 1183], [1370, 1203], [1430, 1227]]),
      mainConcourse: p([[1643, 1087], [2243, 1087]]),
      lowerLevel: p([[1615, 1176], [2400, 1176]]),
      board: p([[1707, 440], [2311, 573], [2211, 980], [1767, 923]]),
      sroLevels: [p([[1815, 761], [2015, 761]]), p([[1845, 827], [2015, 827]]), p([[1760, 923], [2015, 923]])],
      superVom: toFt(c)([1864, 1056]),
    },
    existing: {
      field: p([[1000, 1209], [2010, 1209]]),
      demolition: p([[1643, 1087], [1743, 1037], [1750, 837], [2128, 573], [2100, 466], [2157, 580], [2093, 645], [2131, 749], [2250, 749], [2250, 1090]]),
    },
    // Level labels on the right of p51 (raster y) -> elevation above new field.
    levelLabels: Object.fromEntries(Object.entries({ 'SRO LEVEL 4': 534, 'SRO LEVEL 3': 611, 'SRO LEVEL 2': 684,
      'SRO LEVEL 1': 736, 'UPPER LEVEL': 796, 'CLUB LEVEL': 870, 'MAIN CONCOURSE': 1056, 'LOWER LEVEL': 1209 })
      .map(([k, y]) => [k, r1((c.v0 - y) / c.pxPerFt)])),
    rowsOnNorth: 50,
    boardCheckFt: { frontHeight: r1((923 - 440) / c.pxPerFt), stated: 109.5 },
  });
}

// ---- p53 South section ----
{
  const c = P53; const p = (pts) => poly(c, pts);
  save('section_south_p53.json', {
    source: 'p53 South Section', calibration: c,
    axes: 'u = ft south of the south end line, v = ft above NEW field',
    proposed: {
      field: p([[1000, 1227], [2343, 1227]]),
      endzoneSuites: p([[1157, 1227], [1157, 1173], [1400, 1173], [1400, 1227]]),
      lowerBowl: rake(toFt(c)([1314, 1187]), toFt(c)([1671, 1087]), 26),
      addedRows: rake(toFt(c)([1671, 1087]), toFt(c)([1829, 1030]), 4),
      mainConcourse: p([[1657, 1094], [2343, 1094]]),
      board: p([[1771, 444], [2289, 573], [2197, 987], [1829, 927]]),
      clubLines: [p([[1886, 759], [2211, 759]]), p([[1929, 827], [2186, 827]]), p([[1871, 899], [1926, 899]])],
      tunnel: p([[1757, 1227], [1757, 1094], [2200, 1094], [2200, 1227]]),
    },
    existing: {
      field: p([[1000, 1209], [1650, 1209]]),
      demoClub: p([[1814, 816], [1931, 816], [1931, 884], [1814, 884], [1814, 816]]),
    },
    callouts: { demoClub: 'DEMO CLUB SEATS (-6 ROWS @ 19,540SF)' },
    boardCheckFt: { frontHeight: r1((927 - 444) / c.pxPerFt), stated: 109.5, labelOnPage: "215' X 105'" },
  });
}

// ---- p61 Lower bowl field heights ----
// Three stacked diagrams share one scale. Fan figures ~ 6 ft tall = 30 px
// (displayed 2000 px wide) -> ~5 px/ft displayed; crossbar 10 ft = 62 px.
// Stored normalised (0..1 of the diagram strip) because the inset is redrawn
// at thumbnail size.
save('field_heights_p61.json', {
  source: 'p61 LOWER BOWL FIELD HEIGHTS',
  strip: { x0: 400, x1: 1925, note: 'displayed px of the 2000-wide raster' },
  goalpost: { x: 648, crossbarFt: 10, uprightFt: 30 },
  fans: [440, 555, 690, 795, 1068, 1340],
  rakeStartX: 1325, rakeEndX: 1885, columns: [1420, 1458, 1622, 1787],
  cases: [
    { key: 'grade', dropFt: 0, overbuildStartX: 1385 },
    { key: 'minus2', dropFt: -2, overbuildStartX: 1385 },
    { key: 'minus4', dropFt: -4, overbuildStartX: 1385 },
  ],
});
