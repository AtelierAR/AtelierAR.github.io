// All figures, copy and layout for the exterior animation.
// Source: ./reference/20261022_LFF_Eagles_HKS.pdf (HKS Concept Pricing Package, Oct 22 2026).
// Every value carries the page it came from. Area figures are copied verbatim as strings
// (never re-formatted from floats) so nothing is rounded on screen.

export const FT = 0.3048; // model is built in metres; the deck dimensions are in feet

export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;
export const DURATION = 85;

// ---------------------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------------------
export const PAL = {
  clay: '#F1F2F4', // deck render style (p26-29)
  edge: '#3A4649', // hairline edges, drawn at 35 %
  edgeOpacity: 0.35,
  skyTop: '#8D96AD', // lavender-grey sky (p26-29)
  skyHorizon: '#E3E6EC',
  midnight: '#0F4A52',
  eagles: '#004C54',
  glassTeal: '#41B6AF',
  lineGreen: '#3CCB5A',
  silver: '#A5ACAF',
  // dusk sky - warm, restrained (scene 7)
  duskTop: '#2C3550',
  duskMid: '#6E6680',
  duskHorizon: '#E2A877',
};

// Albedos sampled from the swatches on p11/p13 (median of each swatch, lifted from the
// rendered value to an albedo) - see REFERENCE_NOTES.md for the raw samples.
export const SWATCH = {
  masonry: { base: '#6E655D', speck: '#2E2722', joint: '#8A847C', page: 13 }, // iron-spot brick, charcoal-brown w/ speckle
  metal: { base: '#4A4643', page: 13 }, // blackened metal panel, near-black, warm cast
  fins: { base: '#6B655D', page: 13 }, // dark bronze-grey ACM
  glazing: { base: '#3B4A4E', tint: '#77838C', page: 13 }, // cool grey-green reflective
  mesh: { base: '#4C5550', page: 13 }, // dark powder-coated aluminium
  soffit: { base: '#B4B7B9', page: 13 }, // brushed aluminium
  reflective: { base: '#F2F2F0', page: 24 }, // 316 stainless, mirror finish
  roof: { base: '#9EA3A6', page: 24 }, // grey PVC membrane
  pv: { base: '#E4E6E3', cell: '#C9CDCB', page: 25 }, // Mitrex "polar white"
};

// ---------------------------------------------------------------------------------------
// Facade + roof schedules (p19, p22, p13)
// ---------------------------------------------------------------------------------------
export const FACADE = {
  page: 19,
  total: { area: '531,620.48', value: 531620.48, pct: '100%' },
  rows: [
    { key: 'masonry', label: 'Masonry', area: '39,499.58', value: 39499.58, pct: '7.4%', isolatePage: 14 },
    { key: 'fins', label: 'Fins', area: '152,280.84', value: 152280.84, pct: '28.6%', isolatePage: 15 },
    { key: 'glazing', label: 'Glazing', area: '148,901.06', value: 148901.06, pct: '28.0%', isolatePage: 16 },
    { key: 'metal', label: 'Metal panel', area: '102,696', value: 102696, pct: '19.3%', isolatePage: 17 },
    { key: 'mesh', label: 'Mesh / grate', area: '88,243', value: 88243, pct: '16.1%', isolatePage: 18 },
  ],
};

export const ROOF = {
  page: 22,
  // NOTE: p22 header reads "Roof total 716,408 sf" but its rows sum to 444,658.93 SF.
  // Only the two row values are shown (see REFERENCE_NOTES.md).
  rows: [
    { key: 'reflective', label: 'Reflective roof', area: '365,438.54', pct: '82.2%' },
    { key: 'soffit', label: 'Soffit', area: '79,220.39', pct: '17.8%' },
  ],
  pv: { panels: 9198, panelsText: '9,198', mwp: '5.3', page: 22 },
};

export const OPEN_AIR = {
  pages: [79, 80],
  headline: '96%',
  line: 'of the main concourse stays open to the air, under the new canopy.',
  conditioned: { existing: '1,091,547', proposed: '1,285,525' }, // p79 -> p80
};

// ---------------------------------------------------------------------------------------
// Material assemblies (p23-25). `short` is on-screen; `bod` sits in smaller type.
// ---------------------------------------------------------------------------------------
export const ASSEMBLIES = [
  {
    key: 'mesh', page: 23, title: 'Metal mesh', sub: 'Aluminum metal mesh screen',
    short: ['Framed & tensioned', 'Powder-coated aluminum mesh'],
    bod: 'BOD Cascade Architectural Boardwalk system (framed & tensioned) · powder-coated aluminum mesh · painted backup steel as required for support · tension system to keep mesh rigid',
  },
  {
    key: 'masonry', page: 23, title: 'Masonry brick', sub: 'Iron-spot brick over insulated backup',
    short: ['3 5/8" × 11 5/8" utility unit', 'Stack bond pattern'],
    bod: 'BOD Endicott Dark Iron Spot "Utility" brick unit · 3 5/8" × 11 5/8" · stack bond pattern',
  },
  {
    key: 'metal', page: 23, title: 'Metal panel', sub: 'Aluminum plate floating assembly',
    short: ['.125" thick sheet', 'PVDF 2-coat Kynar, custom color'],
    bod: 'BOD Northclad AL Series over insulated metal stud backup wall · .125" thick sheet · PVDF 2-coat Kynar custom color · extruded mounting system',
  },
  {
    key: 'glazing', page: 24, title: 'Curtain wall', sub: 'Unitized curtain wall SSG',
    short: ['Thermally broken', 'Aluminum fin extrusions'],
    bod: 'BOD YKK YUW 750 XT thermally broken · aluminum fin extrusions · backup steel as required for support, finish to match CW',
  },
  {
    key: 'fins', page: 25, title: 'Exterior fins', sub: 'ACM-wrapped structural column',
    short: ['Fin depth 6–8 ft', 'Dual-coat Kynar finish'],
    bod: 'BOD Alucobond Axcent ACM panel · fin depth 6–8 ft · dual-coat Kynar finish exterior · reveal joint at exterior ends',
  },
  {
    key: 'roof', page: 24, title: 'Opaque roof', sub: 'PVC roof membrane & soffit',
    short: ['Grey PVC roof membrane', '316 stainless mirror soffit plate'],
    bod: 'BOD grey PVC roof membrane · aluminum metal soffit panel · 316 stainless steel soffit plate where mirror finish is required',
  },
  {
    key: 'pv', page: 25, title: 'PV array', sub: 'Galvanized steel sub-frame and channels',
    short: ['Solar series, polar white', 'Galvanized steel support system'],
    // The deck spells the product "Gensis" (p25). Confirm spelling with the team.
    bod: 'BOD Mitrex Genesis Solar series, polar white · galvanized steel support system',
  },
];

// ---------------------------------------------------------------------------------------
// Copy
// ---------------------------------------------------------------------------------------
export const COPY = {
  title: ['EXTERIOR DESIGN', 'AND MATERIALS'], // p12
  kicker: 'Lincoln Financial Field · Exterior strategy',
  s2Title: 'Five materials, one language',
  s3Title: 'Material assemblies',
  s4Title: 'The canopy',
  s6Title: 'Every side',
  endLine: 'One language. Every approach.', // PROPOSED COPY
};

export const LABEL_PX = 18; // label text: 14 pt (= 18.7 px) at 1080p, Hanken Grotesk 400

// ---------------------------------------------------------------------------------------
// Massing / kit layout, in FEET. Plan origin = centre of field, +X = deck east,
// +Z = deck south, Y = up from plaza grade. Deck "north" is the plaza / videoboard end.
// Calibrated against the elevations p30-33 (1.99 px/ft at 200 DPI, from the scale bars)
// and the long/cross sections p34-35.
// ---------------------------------------------------------------------------------------
export const LAYOUT = {
  // seating bowl (p34/p35 sections; p74 plan)
  bowl: { outerX: 330, outerZ: 425, cornerR: 120, fieldX: 120, fieldZ: 225, rim: 118, fieldY: -14 },
  concourses: [30, 58, 88], // main / mid / upper concourse levels (p34)

  // canopy wings (p26-29 silhouettes, p30-33 heights, p14-18 plan extents).
  // Each wing is planar: y = y0 + gx*(|x|-inner) + gz*(|z| along wing)
  wings: [
    { id: 'NE', x0: 178, x1: 388, z0: -470, z1: 0, y0: 146, gx: 0.075, gz: 0.088 },
    { id: 'SE', x0: 178, x1: 388, z0: 0, z1: 462, y0: 146, gx: 0.075, gz: 0.08 },
    { id: 'NW', x0: -388, x1: -178, z0: -548, z1: 0, y0: 146, gx: 0.075, gz: 0.088 },
    { id: 'SW', x0: -388, x1: -178, z0: 0, z1: 462, y0: 146, gx: 0.075, gz: 0.08 },
  ],
  fascia: 2.5, // ft, thin leading edge (p26-29)
  wingDepth: 9, // ft, space-frame depth between PV top and soffit
  soffitBand: 13.5, // ft, aluminium soffit band around the mirror field: ~17.8 % of the underside (p22)

  // videoboards (p26 trapezoid, p30 elevation, p66 axon)
  boards: [
    { id: 'N', z: -472, dir: -1, w: 210, wTop: 222, y0: 44, y1: 164, depth: 46, lean: 7 },
    { id: 'S', z: 462, dir: 1, w: 190, wTop: 200, y0: 52, y1: 160, depth: 46, lean: 6 },
  ],

  // vertical circulation towers (p26/p27/p29, p30-33)
  towers: [
    { id: 'NE', x: 180, z: -448, w: 40, d: 52, h: 182, fins: ['N', 'E', 'W'], logo: 'N', core: 'metal' },
    { id: 'E', x: 416, z: -46, w: 46, d: 44, h: 176, fins: ['E', 'N', 'S'], logo: 'E', core: 'glazing' },
    { id: 'SE', x: 372, z: 420, w: 48, d: 48, h: 172, fins: ['S', 'E'], logo: null, core: 'metal' },
    { id: 'SW', x: -372, z: 420, w: 48, d: 48, h: 168, fins: ['S', 'W'], logo: null, core: 'metal' },
    { id: 'W', x: -420, z: 172, w: 40, d: 40, h: 172, fins: ['W', 'S'], logo: null, core: 'metal' },
  ],
};

// ---------------------------------------------------------------------------------------
// Ticketing canopies (p76, Studio MLA). Paths traced from p76 in deck feet and scaled by
// the code so each polyline measures exactly its published length.
// ---------------------------------------------------------------------------------------
export const TICKETING = [
  { id: 'plaza', length: 1033.5, text: '1,033.5 ft', page: 76, path: [[230, -560], [255, -760], [-120, -905], [-235, -600]] },
  { id: 'southwest', length: 491, text: '491 ft', page: 76, path: [[-430, 196], [-690, 205], [-500, 400]] },
];

// ---------------------------------------------------------------------------------------
// Scene timing (seconds)
// ---------------------------------------------------------------------------------------
export const SCENES = [
  { id: 1, name: 'Title and the kit', t0: 0, t1: 8 },
  { id: 2, name: 'Five facade materials, one language', t0: 8, t1: 26 },
  { id: 3, name: 'How it’s built: material assemblies', t0: 26, t1: 42 },
  { id: 4, name: 'The canopy: shelter, reflection, energy', t0: 42, t1: 56 },
  { id: 5, name: 'Four arrivals', t0: 56, t1: 72 },
  { id: 6, name: 'Every side', t0: 72, t1: 78 },
  { id: 7, name: 'Dusk on the plaza', t0: 78, t1: 85 },
];

// ---------------------------------------------------------------------------------------
// Arrivals (p26-29). Labels are listed left-to-right as on the page; `at` is the 3D anchor
// in feet; band = 'sky' | 'ground'. Camera poses are solved in scripts/solve_cameras.mjs
// from point correspondences on each page, then checked by overlay (./qa).
// ---------------------------------------------------------------------------------------
export const BANDS = { sky: 0.186, ground: 0.85 }; // p26: labels at y 146/787 and 668/787

export const ARRIVALS = [
  {
    id: 'plaza', page: 26, title: 'Plaza View', groundBand: 0.85,
    labels: [
      { text: 'Reflective Soffit', band: 'sky', at: [-300, 160, -470] },
      { text: 'Fins', band: 'sky', at: [180, 150, -476] },
      { text: 'Glazing', band: 'sky', at: [135, 95, -467] },
      { text: 'Video Board', band: 'sky', at: [0, 120, -482] },
      { text: 'Glazing', band: 'sky', at: [-150, 95, -467] },
      { text: 'Reflective Soffit', band: 'sky', at: [312, 162, -440] },
      { text: 'Fins', band: 'sky', at: [-272, 120, -472] },
      { text: 'Masonry', band: 'ground', at: [300, 20, -481] },
      { text: 'Glazing', band: 'ground', at: [232, 18, -481] },
      { text: 'Masonry', band: 'ground', at: [110, 15, -470] },
      { text: 'Masonry', band: 'ground', at: [-190, 20, -491] },
      { text: 'Glazing', band: 'ground', at: [-250, 16, -540] },
      { text: 'Masonry', band: 'ground', at: [-355, 25, -501] },
    ],
  },
  {
    id: 'vipEast', page: 27, title: 'VIP Entry East', groundBand: 0.953,
    labels: [
      { text: 'Soffit', band: 'sky', at: [400, 150, -60] },
      { text: 'Reflective Soffit', band: 'sky', at: [300, 160, -300] },
      { text: 'Fins', band: 'sky', at: [440, 150, -46] },
      { text: 'Reflective Soffit', band: 'sky', at: [300, 170, -440] },
      { text: 'Mesh/Grate', band: 'ground', at: [404, 40, 330] },
      { text: 'Fins', band: 'ground', at: [404, 20, 140] },
      { text: 'Fins', band: 'ground', at: [404, 20, 50] },
      { text: 'Masonry', band: 'ground', at: [410, 15, -10] },
      { text: 'Glazing', band: 'ground', at: [404, 15, -90] },
      { text: 'Glazing', band: 'ground', at: [404, 12, -160] },
      { text: 'Masonry', band: 'ground', at: [404, 15, -250] },
    ],
  },
  {
    id: 'altGA', page: 28, title: 'Alternate GA', groundBand: 0.967,
    labels: [
      { text: 'Fins', band: 'sky', at: [-372, 150, 444] },
      { text: 'Reflective Soffit', band: 'sky', at: [-280, 180, 380] },
      { text: 'Metal Panel', band: 'sky', at: [-120, 110, 470] },
      { text: 'Soffit', band: 'sky', at: [60, 90, 500] },
      { text: 'Metal Panel', band: 'sky', at: [200, 100, 462] },
      { text: 'Fins', band: 'ground', at: [-400, 20, 330] },
      { text: 'Fins', band: 'ground', at: [-330, 20, 446] },
      { text: 'Metal Panel', band: 'ground', at: [-250, 20, 470] },
      { text: 'Mesh/Grate', band: 'ground', at: [-160, 30, 470] },
      { text: 'Glazing', band: 'ground', at: [-40, 20, 470] },
      { text: 'Mesh/Grate', band: 'ground', at: [100, 30, 470] },
      { text: 'Fins', band: 'ground', at: [280, 20, 470] },
      { text: 'Fins', band: 'ground', at: [372, 20, 446] },
    ],
  },
  {
    id: 'gaWest', page: 29, title: 'GA West Entry', groundBand: 0.935,
    labels: [
      { text: 'Metal Panel', band: 'sky', at: [-404, 100, -340] },
      { text: 'Fins', band: 'sky', at: [-404, 110, -220] },
      { text: 'Video Board', band: 'sky', at: [-100, 150, -480] },
      { text: 'Mesh/Grate', band: 'sky', at: [-404, 120, -120] },
      { text: 'Reflective Soffit', band: 'sky', at: [-290, 175, 200] },
      { text: 'Mesh/Grate', band: 'ground', at: [-404, 30, -380] },
      { text: 'Fins', band: 'ground', at: [-404, 20, -260] },
      { text: 'Metal Panel', band: 'ground', at: [-404, 30, -160] },
      { text: 'Mesh/Grate', band: 'ground', at: [-404, 30, -80] },
      { text: 'Masonry', band: 'ground', at: [-470, 10, 10] },
      { text: 'Soffit', band: 'ground', at: [-480, 74, 60] },
      { text: 'Fins', band: 'ground', at: [-422, 20, 150] },
    ],
  },
];
