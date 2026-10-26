import * as THREE from 'three';
import { RING, ringWith, lerpRingParams, ALL, NORTH_STAND, SOUTH_STAND } from './rings.js';
import { buildTier, buildBand, buildWall, stripMesh, boardGeometry, slabGeometry } from './tier.js';
import north from '../geometry/section_north_p51.json';
import south from '../geometry/section_south_p53.json';
import planData from '../geometry/plan_rings.json';

// Datum: y = 0 is the EXISTING field. The proposed field sits at y = -4.
// Elevations below are read from p50 (6.2 px/ft) and p51/p53 (4.45 px/ft) and
// re-based on this datum; plan extents come from p37/p42 (plan_rings.json).
export const NEW_FIELD = -4;

const LB_in = RING('LB_in'), LB_out = RING('LB_out'), LS_out = RING('LS_out');
const C_out = RING('C_out'), CS_out = RING('CS_out'), UB_out = RING('UB_out');
const LB_in_new = RING('LB_in_new'), LB_out_new = RING('LB_out_new');
const UB_in = { ...lerpRingParams(C_out, CS_out, 0.15), name: 'UB_in' };
const EDGE_ANGLE = 35;

// Looks: material sets a part can switch between from scene to scene.
function looks(M) {
  return {
    clay: { mesh: M.clay, strip: M.seat, edge: M.edge },
    fascia: { mesh: M.fascia, strip: M.seat, edge: M.edge },
    hatch: { mesh: M.hatch, strip: M.seatRed, edge: M.edgeRed },
    hatchField: { mesh: M.hatchField, strip: M.seatRed, edge: M.edgeRed },
    overbuild: { mesh: M.overbuild, strip: M.seatGreen, edge: M.edgeGreen },
    newSeat: { mesh: M.newSeat, strip: M.seatLight, edge: M.edgeGreen },
    clubSweep: { mesh: M.clubSweep, strip: M.seatLight, edge: M.edgeGreen },
    alt: { mesh: M.altGreen, strip: M.seatLight, edge: M.edgeGreen },
    teal: { mesh: M.tealSeat, strip: M.seatTeal, edge: M.edge },
    glass: { mesh: M.glass, strip: null, edge: M.edgeGlass },
    glassSolid: { mesh: M.glassSolid, strip: null, edge: M.edgeGlass },
    glassAlt: { mesh: M.glassAlt, strip: null, edge: M.edgeGlass },
    ribbon: { mesh: M.ribbon, strip: null, edge: null },
  };
}

export function buildModel(M) {
  const root = new THREE.Group();
  root.name = 'stadium';
  const L = looks(M);
  const parts = {};

  function part(name, state, geometry, { look = 'clay', tier = null, edges = true, shadow = true } = {}) {
    const group = new THREE.Group();
    group.name = name;
    const mesh = new THREE.Mesh(geometry, L[look].mesh);
    mesh.castShadow = shadow; mesh.receiveShadow = true;
    group.add(mesh);
    let strips = null;
    if (tier && tier.stripMatrices.length) { strips = stripMesh(tier, L[look].strip || M.seat); group.add(strips); }
    let edge = null;
    if (edges) {
      edge = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, EDGE_ANGLE), L[look].edge || M.edge);
      edge.computeLineDistances();
      group.add(edge);
    }
    const p = {
      name, state, group, mesh, strips, edge, tier, look, defaultLook: look,
      setLook(k) {
        if (p.look === k) return;
        p.look = k;
        const s = L[k];
        mesh.material = s.mesh;
        if (strips) { strips.visible = !!s.strip; if (s.strip) strips.material = s.strip; }
        if (edge) { edge.visible = !!s.edge; if (s.edge) edge.material = s.edge; }
      },
    };
    root.add(group);
    parts[name] = p;
    return p;
  }
  const tierPart = (name, state, opts, look) => {
    const t = buildTier(opts);
    return part(name, state, t.geometry, { look, tier: t, edges: false });
  };
  const bandPart = (name, state, opts, look = 'fascia') => {
    const t = buildBand(opts);
    return part(name, state, t.geometry, { look, tier: { ...t, stripMatrices: [] } });
  };

  /* ---------------- EXISTING (p37 plan, pre-renovation elevations) ---------------- */
  const LOW = { E: [2], W: [8], N: NORTH_STAND, S: SOUTH_STAND };
  for (const [k, segs] of Object.entries(LOW)) {
    tierPart(`LO_${k}`, 'existing', { inner: LB_in, outer: LB_out, segs, rows: 28, y0: 4, y1: 30, base: 0, soffitTo: 0 });
    bandPart(`LG_${k}`, 'existing', { inner: LB_out, outer: LS_out, segs, yb: 30, yt: 37 });
  }
  const CLUB = { E: [2], W: [8], NE: [0, 1], NW: [9, 10], SE: [3, 4], SW: [6, 7] };
  for (const [k, segs] of Object.entries(CLUB)) {
    tierPart(`CL_${k}`, 'existing', { inner: LS_out, outer: C_out, segs, rows: 12, y0: 48, y1: 66, base: 44, soffitTo: 37 });
    bandPart(`SU_${k}`, 'existing', { inner: C_out, outer: CS_out, segs, yb: 37, yt: 80 });
  }
  bandPart('SU_S', 'existing', { inner: C_out, outer: CS_out, segs: [5], yb: 37, yt: 80 });
  const UP = { E: [2], W: [8], SE: [3], SW: [7], N: NORTH_STAND, S: [4, 5, 6] };
  for (const [k, segs] of Object.entries(UP)) {
    const state = k === 'N' || k === 'S' ? 'existing' : 'both';
    tierPart(`UP_${k}`, state, { inner: UB_in, outer: UB_out, segs, rows: 26, y0: 88, y1: 128, base: 82, soffitTo: 80 });
  }
  // facade
  const FAC = { E: [2], W: [8], SE: [3, 4], SW: [6, 7], NE: [0, 1], NW: [9, 10], N: [11], S: [5] };
  for (const [k, segs] of Object.entries(FAC)) {
    const state = ['N', 'S', 'NE', 'NW'].includes(k) ? 'existing' : 'both';
    const yt = k === 'E' || k === 'W' ? 150 : 128; // sideline facades carry the roof canopies
    part(`FAC_${k}`, state, buildWall({ ring: UB_out, segs, yb: 0, yt }).geometry, { look: 'fascia' });
  }
  // main concourse slab
  part('SLAB', 'both', buildBand({ inner: LS_out, outer: UB_out, segs: ALL, yb: 28, yt: 30 }).geometry, { look: 'fascia', edges: false });
  // roof canopies over the sidelines (p50 roof trapezoid; p55-59 renders)
  for (const s of [-1, 1]) {
    const zi = s * 168, zo = s * 347;
    const g = slabGeometry([[-150, 160, zi], [150, 160, zi], [300, 150, zo], [-300, 150, zo]], 3.5);
    part(`ROOF_${s < 0 ? 'E' : 'W'}`, 'both', g, { look: 'clay' });
  }
  // existing north videoboard + tower (p52 existing), existing south board (p54)
  part('BOARD_N_OLD', 'existing', new THREE.BoxGeometry(18, 46, 150).translate(-352, 112, 0), { look: 'fascia' });
  part('TOWER_N', 'existing', new THREE.BoxGeometry(22, 196, 22).translate(-350, 98, 214), { look: 'fascia' });
  part('BOARD_S_OLD', 'existing', new THREE.BoxGeometry(16, 44, 140).translate(352, 110, 0), { look: 'fascia' });

  // LED ribbon boards (the only bloom-selected objects)
  const ribbon = (name, state, ring, y, segs) => {
    const g = buildWall({ ring, segs, yb: y, yt: y + 2.6 }).geometry;
    return part(name, state, g, { look: 'ribbon', edges: false, shadow: false });
  };
  const ribSegs = [0, 1, 2, 3, 4, 6, 7, 8, 9, 10];
  ribbon('RIB_CLUB', 'existing', ringWith('LS_out', { zs: LS_out.zs - 0.6 }), 44.4, ribSegs);
  ribbon('RIB_UP', 'existing', ringWith('UB_in', { ...UB_in, zs: UB_in.zs - 0.6 }), 83, ALL);

  /* ---------------- PROPOSED ---------------- */
  // sides: restrike + overbuild 20 rows, add 4 rows (p50), 15° rake (p62)
  for (const [k, segs] of [['E', [2]], ['W', [8]]]) {
    tierPart(`LO_${k}2`, 'proposed', { inner: LB_in_new, outer: LB_out_new, segs, rows: 24, y0: 0, y1: 25, base: NEW_FIELD, soffitTo: NEW_FIELD }, 'clay');
    bandPart(`LG_${k}2`, 'proposed', { inner: LB_out_new, outer: LS_out, segs, yb: 25, yt: 33 });
    // field suites (10) under the front rows
    const fs = ringWith('LB_in_new', { zs: LB_in_new.zs - 0.5 });
    part(`FS_${k}`, 'proposed', buildWall({ ring: fs, segs, yb: NEW_FIELD, yt: 3.5 }).geometry, { look: 'glassSolid' });
  }
  // club raised 8' (p50 move 5)
  for (const [k, segs] of Object.entries({ E: [2], W: [8], SE: [3, 4], SW: [6, 7] })) {
    tierPart(`CL_${k}2`, 'proposed', { inner: LS_out, outer: C_out, segs, rows: 12, y0: 56, y1: 74, base: 52, soffitTo: 33 });
    bandPart(`SU_${k}2`, 'proposed', { inner: C_out, outer: CS_out, segs, yb: 33, yt: 86 });
  }
  ribbon('RIB_CLUB2', 'proposed', ringWith('LS_out', { zs: LS_out.zs - 0.6 }), 52.4, [2, 3, 4, 6, 7, 8]);
  ribbon('RIB_UP2', 'proposed', ringWith('UB_in', { ...UB_in, zs: UB_in.zs - 0.6 }), 83, [2, 3, 7, 8]);

  // NORTH (p51/p52): overbuild 20 rows, rows continue to 50 on the north,
  // super vom carved at the top-centre, occupiable board, club sweeps, SRO bars.
  const superVom = (r, f) => {
    const top = 36 - 15;
    if (r < top) return false;
    return Math.abs(f - 0.5) < 0.045 + (r - top) * 0.0042;
  };
  tierPart('LO_N2', 'proposed', { inner: LB_in_new, outer: LB_out, segs: NORTH_STAND, rows: 36, y0: 0, y1: 30, base: NEW_FIELD, soffitTo: NEW_FIELD, notch: superVom }, 'clay');
  tierPart('LO_N2_SOLID', 'proposed', { inner: LB_in_new, outer: LB_out, segs: NORTH_STAND, rows: 36, y0: 0, y1: 30, base: NEW_FIELD, soffitTo: NEW_FIELD }, 'clay');
  for (const [k, segs] of [['NE', [0, 1]], ['NW', [9, 10]]]) {
    tierPart(`SWEEP_${k}`, 'proposed', { inner: LS_out, outer: C_out, segs, rows: 12, y0: 56, y1: 74, base: 50, soffitTo: 33 }, 'clay');
    bandPart(`SU_${k}2`, 'proposed', { inner: C_out, outer: CS_out, segs, yb: 33, yt: 86 });
  }
  const bN = north.proposed.board.map(([u, v]) => [u, v + NEW_FIELD]);
  part('BOARD_N', 'proposed', boardGeometry(bN, planData.boards.north.halfWidth, -1, 180), { look: 'glass' });
  // SRO terrace bars float either side of the board (p52 item 5)
  const sro = (s) => slabGeometry([[-300, 142, s * 158], [-250, 142, s * 214], [-262, 142, s * 226], [-312, 142, s * 170]], 2.4);
  part('SRO_NE', 'proposed', sro(-1), { look: 'clay' });
  part('SRO_NW', 'proposed', sro(1), { look: 'clay' });
  // SRO decks inside the board volume (p51 SRO LEVEL 1-4; floor lines traced
  // inside the board at 68 / 90 / 105 ft, fourth level continues the spacing).
  [68, 86, 104, 122].forEach((v, i) => {
    part(`SRO_DECK_${i + 1}`, 'proposed', new THREE.BoxGeometry(96, 1.2, 200).translate(-(180 + 195), v + NEW_FIELD, 0), { look: 'fascia', shadow: false });
  });

  // SOUTH (p53/p54): overbuild half the lower bowl, 9 end-zone suites +
  // bunker suites, 4 new rows on the back, larger board moved back.
  tierPart('LO_S2A', 'proposed', { inner: LB_in_new, outer: lerpRingParams(LB_in_new, LB_out, 0.5), segs: SOUTH_STAND, rows: 14, y0: 0, y1: 15, base: NEW_FIELD, soffitTo: NEW_FIELD }, 'clay');
  tierPart('LO_S2B', 'proposed', { inner: lerpRingParams(LB_in_new, LB_out, 0.5), outer: LB_out, segs: SOUTH_STAND, rows: 14, y0: 15, y1: 30, base: NEW_FIELD, soffitTo: NEW_FIELD }, 'clay');
  tierPart('ROWS_S', 'proposed', { inner: LB_out, outer: ringWith('LS_out', { xeS: LS_out.xeS + 6 }), segs: [4, 5, 6], rows: 4, y0: 30, y1: 36, base: 26, soffitTo: 26 }, 'clay');
  {
    // 9 end-zone suites on the apron in front of the south wall, bunker suites
    // as the glazed band below the front rows (p54 item 3)
    const x0 = LB_in_new.xeS;
    for (let i = 0; i < 9; i++) {
      const z = -72 + i * 18;
      part(`EZS_${i}`, 'proposed', new THREE.BoxGeometry(11, 7.5, 16).translate(x0 - 6.5, NEW_FIELD + 3.75, z), { look: 'glassSolid', shadow: false });
    }
    const bunker = ringWith('LB_in_new', { xeS: LB_in_new.xeS - 0.4 });
    part('BUNKER_S', 'proposed', buildWall({ ring: bunker, segs: [4, 5, 6], yb: NEW_FIELD, yt: 0 }).geometry, { look: 'glassSolid', shadow: false });
  }
  const bS = south.proposed.board.map(([u, v]) => [u, v + NEW_FIELD]);
  part('BOARD_S', 'proposed', boardGeometry(bS, planData.boards.south.halfWidth, 1, 180), { look: 'glass' });

  // ALTERNATE north lower bowl (p62 left): single steep 29° tier, no sweep.
  tierPart('ALT_N', 'alt', { inner: LB_in_new, outer: ringWith('LB_out', { xeN: 286, ze: 96 }), segs: NORTH_STAND, rows: 40, y0: 0, y1: 46, base: NEW_FIELD, soffitTo: NEW_FIELD }, 'alt');

  // ---------------- 50-yard cut poché (scene 2) ----------------
  // East-side pieces are swept along segment 2; with k = 8 the path point at
  // index 4 sits exactly on x = 0.
  const caps = [];
  const pocheLine = new THREE.LineBasicMaterial({ color: '#0F1F21' });
  for (const n of ['LO_E', 'LG_E', 'CL_E', 'SU_E', 'UP_E', 'LO_E2', 'LG_E2', 'CL_E2', 'SU_E2']) {
    const t = parts[n].tier;
    if (!t || !t.profileAt) continue;
    const pts = t.profileAt(4);
    const shape = new THREE.Shape(pts.map(([z, y]) => new THREE.Vector2(z, y)));
    const g = new THREE.ShapeGeometry(shape);
    g.rotateY(-Math.PI / 2);
    g.translate(0.08, 0, 0);
    const mesh = new THREE.Mesh(g, M.poche);
    const outline = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(pts.map(([z, y]) => new THREE.Vector3(0.12, y, z))), pocheLine);
    const grp = new THREE.Group();
    grp.add(mesh, outline);
    grp.name = `CAP_${n}`;
    grp.visible = false;
    root.add(grp);
    caps.push({ group: grp, of: n });
  }

  // ---------------- state helpers ----------------
  const api = {
    root, parts, caps,
    showCaps(v) { for (const c of caps) c.group.visible = v && parts[c.of].group.visible; },
    preset(state) {
      for (const c of caps) c.group.visible = false;
      for (const p of Object.values(parts)) {
        p.group.visible = p.state === 'both' || p.state === state;
        p.setLook(p.defaultLook);
        p.group.position.set(0, 0, 0);
        p.group.scale.set(1, 1, 1);
      }
      parts.LO_N2_SOLID.group.visible = false;
    },
    show(names, v = true) { for (const n of [].concat(names)) if (parts[n]) parts[n].group.visible = v; },
    look(names, k) { for (const n of [].concat(names)) if (parts[n]) parts[n].setLook(k); },
    match(re) { return Object.keys(parts).filter((n) => re.test(n)); },
  };
  return api;
}
