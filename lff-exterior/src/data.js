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
  glazing: { base: '#7E8C93', tint: '#77838C', page: 13 }, // cool grey-green reflective
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
  // Each wing is a planar skewed quad (see kit/CanopyWing.js): side +1 east / -1 west,
  // end -1 north / +1 south; inner edge at xin (field side), outer at xout; plan flares from
  // zEndIn (inner end) to zEndOut (outer end). y = y0 + gIn*(xout-|x|) + gz*|z| (feet).
  wings: [
    { id: 'NE', side: 1, end: -1, xin: 178, xout: 400, zEndIn: 505, zEndOut: 560, y0: 136, gIn: 0.1, gz: 0.07 },
    { id: 'SE', side: 1, end: 1, xin: 178, xout: 400, zEndIn: 492, zEndOut: 545, y0: 136, gIn: 0.1, gz: 0.07 },
    { id: 'NW', side: -1, end: -1, xin: 178, xout: 432, zEndIn: 604, zEndOut: 680, y0: 136, gIn: 0.1, gz: 0.07 },
    { id: 'SW', side: -1, end: 1, xin: 178, xout: 432, zEndIn: 492, zEndOut: 545, y0: 136, gIn: 0.1, gz: 0.07 },
  ],

  fascia: 2.5, // ft, thin leading edge (p26-29)
  wingDepth: 9, // ft, space-frame depth between PV top and soffit
  soffitShare: 0.178, // aluminium soffit band share of each wing underside (p22: 17.8 %); band width is solved per wing

  // videoboards (p26 trapezoid, p30 elevation, p66 axon)
  boards: [
    { id: 'N', z: -472, dir: -1, w: 210, wTop: 222, y0: 44, y1: 164, depth: 46, lean: 7 },
    { id: 'S', z: 462, dir: 1, w: 190, wTop: 200, y0: 52, y1: 160, depth: 46, lean: 6 },
  ],

  // vertical circulation towers (p26/p27/p29, p30-33)
  towers: [
    { id: 'NE', x: 236, z: -452, w: 66, d: 56, h: 182, fins: ['N', 'E', 'W'], logo: 'N', core: 'metal' },
    { id: 'E', x: 418, z: 183, w: 46, d: 46, h: 176, fins: ['S', 'N'], logo: 'E', core: 'glazing' }, // p27
    { id: 'SW', x: -372, z: 420, w: 48, d: 48, h: 168, fins: ['S', 'W'], logo: null, core: 'metal' }, // p28/p29
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
export const BANDS = { sky: 0.186, ground: 0.832 }; // label text top at 183 px (sky) / 899 px (ground) on p26

export const ARRIVALS = [
  {
    id: 'plaza', page: 26, title: 'Plaza View', groundBand: 0.832,
    cam: { pos: [0, 6, -1350], yaw: 180, fov: 38, shiftY: 0.1 },
    // x = label centre on the page (1080p px, from the PDF text layer); `at` = fallback anchor (ft)
    labels: [
      { text: 'Reflective Soffit', band: 'sky', x: 379, at: [300, 170, -470] },
      { text: 'Fins', band: 'sky', x: 558, at: [236, 150, -482] },
      { text: 'Glazing', band: 'sky', x: 696, at: [150, 95, -471] },
      { text: 'Video Board', band: 'sky', x: 947, at: [0, 110, -478] },
      { text: 'Glazing', band: 'sky', x: 1177, at: [-140, 95, -471] },
      { text: 'Reflective Soffit', band: 'sky', x: 1405, at: [-330, 179, -600] },
      { text: 'Fins', band: 'sky', x: 1573, at: [-272, 120, -478] },
      { text: 'Masonry', band: 'ground', x: 374, at: [316, 25, -481] },
      { text: 'Glazing', band: 'ground', x: 549, at: [182, 12, -473] },
      { text: 'Masonry', band: 'ground', x: 710, at: [84, 15, -512] },
      { text: 'Masonry', band: 'ground', x: 1207, at: [-193, 25, -489] },
      { text: 'Glazing', band: 'ground', x: 1378, at: [-250, 15, -531] },
      { text: 'Masonry', band: 'ground', x: 1598, at: [-364, 25, -505] },
    ],
  },
  {
    id: 'vipEast', page: 27, title: 'VIP Entry East', groundBand: 0.938,
    cam: { pos: [600, 6, 650], yaw: 316, fov: 47, shiftY: 0.36 },
    // x = label centre on the page (1080p px, from the PDF text layer); `at` = fallback anchor (ft)
    labels: [
      { text: 'Soffit', band: 'sky', x: 566, at: [300, 148, 500] },
      { text: 'Reflective Soffit', band: 'sky', x: 1064, at: [250, 163, 300] },
      { text: 'Fins', band: 'sky', x: 1418, at: [418, 150, 207] },
      { text: 'Reflective Soffit', band: 'sky', x: 1716, at: [330, 155, -300] },
      { text: 'Mesh/Grate', band: 'ground', x: 177, at: [150, 60, 466] },
      { text: 'Fins', band: 'ground', x: 374, at: [230, 20, 467] },
      { text: 'Fins', band: 'ground', x: 937, at: [360, 20, 467] },
      { text: 'Masonry', band: 'ground', x: 1185, at: [409, 30, 400] },
      { text: 'Glazing', band: 'ground', x: 1307, at: [402, 75, 260] },
      { text: 'Glazing', band: 'ground', x: 1548, at: [471, 15, 70] },
      { text: 'Masonry', band: 'ground', x: 1762, at: [471, 15, 140] },
    ],
  },
  {
    id: 'altGA', page: 28, title: 'Alternate GA', groundBand: 0.951,
    cam: { pos: [330, 6, 720], yaw: 357, fov: 62, shiftY: 0.4 },
    // x = label centre on the page (1080p px, from the PDF text layer); `at` = fallback anchor (ft)
    labels: [
      { text: 'Fins', band: 'sky', x: 432, at: [-315, 130, 470] },
      { text: 'Reflective Soffit', band: 'sky', x: 1149, at: [260, 170, 380] },
      { text: 'Metal Panel', band: 'sky', x: 1534, at: [-240, 110, 461] },
      { text: 'Soffit', band: 'sky', x: 1661, at: [0, 59, 505] },
      { text: 'Metal Panel', band: 'sky', x: 1787, at: [404, 112, 500] },
      { text: 'Fins', band: 'ground', x: 398, at: [-372, 20, 446] },
      { text: 'Fins', band: 'ground', x: 728, at: [-315, 20, 468] },
      { text: 'Metal Panel', band: 'ground', x: 847, at: [-240, 30, 461] },
      { text: 'Mesh/Grate', band: 'ground', x: 995, at: [-150, 60, 465] },
      { text: 'Glazing', band: 'ground', x: 1197, at: [0, 20, 461] },
      { text: 'Mesh/Grate', band: 'ground', x: 1337, at: [150, 60, 465] },
      { text: 'Fins', band: 'ground', x: 1673, at: [240, 20, 468] },
      { text: 'Fins', band: 'ground', x: 1834, at: [350, 20, 468] },
    ],
  },
  {
    id: 'gaWest', page: 29, title: 'GA West Entry', groundBand: 0.919,
    cam: { pos: [-1250, 6, 480], yaw: 72, fov: 40, shiftY: 0.3 },
    // x = label centre on the page (1080p px, from the PDF text layer); `at` = fallback anchor (ft)
    labels: [
      { text: 'Metal Panel', band: 'sky', x: 446, at: [-406, 160, -90] },
      { text: 'Fins', band: 'sky', x: 675, at: [-404, 130, -210] },
      { text: 'Video Board', band: 'sky', x: 802, at: [-60, 150, -478] },
      { text: 'Mesh/Grate', band: 'sky', x: 955, at: [-410, 140, 0] },
      { text: 'Reflective Soffit', band: 'sky', x: 1283, at: [-300, 161, 300] },
      { text: 'Mesh/Grate', band: 'ground', x: 406, at: [-404, 40, -380] },
      { text: 'Fins', band: 'ground', x: 554, at: [-404, 20, -210] },
      { text: 'Metal Panel', band: 'ground', x: 765, at: [-406, 30, -90] },
      { text: 'Mesh/Grate', band: 'ground', x: 933, at: [-410, 30, 0] },
      { text: 'Masonry', band: 'ground', x: 1089, at: [-470, 7, 200] },
      { text: 'Soffit', band: 'ground', x: 1233, at: [-470, 72, 220] },
      { text: 'Fins', band: 'ground', x: 1403, at: [-404, 20, 360] },
    ],
  },
];
