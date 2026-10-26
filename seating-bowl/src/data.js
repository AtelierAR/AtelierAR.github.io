// Every figure shown on screen lives here, copied verbatim from the HKS
// Concept Pricing Package (20261022_LFF_Eagles_HKS.pdf). Page citations are
// PDF page numbers (deck page numbers match). Do not round or re-derive:
// where two pages disagree the cited page wins and the conflict is logged in
// REFERENCE_NOTES.md.

// p37 Existing Manifest
export const EXISTING_MANIFEST = {
  rows: [
    { code: '100', label: 'LOWER BOWL', value: 28325 },   // p37
    { code: 'C', label: 'CLUB', value: 8716 },            // p37
    { code: 'M', label: 'MEZZANINE', value: 2087 },       // p37
    { code: '200', label: 'UPPER BOWL', value: 26237 },   // p37
  ],
  subtotal: 65365,                                       // p37
  fieldSeats: 273,                                       // p37
  suites: { count: 174, seats: 4172 },                   // p37 "174 | 4,172"
  miniSuites: { count: 5, seats: 60 },                   // p37 "5 | 60"
  total: 69870,                                          // p37
  sroTerraces: 777,                                      // p37
  totalWithSro: 70647,                                   // p37
};

// p42 New Manifest
export const NEW_MANIFEST = {
  rows: [
    { code: '100', label: 'LOWER BOWL', value: 32095 },   // p42
    { code: 'C', label: 'CLUB', value: 12941 },           // p42
    { code: '200', label: 'UPPER BOWL', value: 20696 },   // p42
  ],
  subtotal: 65732,                                       // p42
  fieldSeats: 310,                                       // p42
  suites: { count: 205, seats: 4832 },                   // p42 "205 | 4,832"
  total: 70874,                                          // p42
  sroTerraces: 5787,                                     // p42
  totalWithSro: 76660,                                   // p42 (sum is 76,661 — logged, shown as printed)
};

// Scene 8 counter pairs: existing (p37) -> new (p42). Mezzanine and
// mini-suites have no p42 line and are not animated.
export const MANIFEST_DELTAS = [
  { code: '100', label: 'LOWER BOWL', from: 28325, to: 32095 },
  { code: 'C', label: 'CLUB', from: 8716, to: 12941 },
  { code: '200', label: 'UPPER BOWL', from: 26237, to: 20696 },
  { code: '', label: 'FIELD SEATS', from: 273, to: 310 },
  { code: '', label: 'SUITES', from: [174, 4172], to: [205, 4832], pair: true },
  { code: '', label: 'TOTAL', from: 69870, to: 70874, strong: true },
  { code: '', label: 'SRO TERRACES', from: 777, to: 5787 },
  { code: '', label: 'TOTAL with SRO', from: 70647, to: 76660, strong: true },
];

// p61 Lower bowl field heights
export const FIELD_HEIGHTS = [
  { key: 'grade', title: 'FIELD AT GRADE', dropFt: 0, overbuildRows: 34, overbuildSF: 141882, newSF: 20266 },  // p61
  { key: 'minus2', title: 'FIELD AT -2FT', dropFt: -2, overbuildRows: 28, overbuildSF: 121247, newSF: 20266 }, // p61
  { key: 'minus4', title: 'FIELD AT -4FT', dropFt: -4, overbuildRows: 20, overbuildSF: 68658, newSF: 20266, proposed: true }, // p61
];

// p50 East / West Section 50 Yard Line — the five moves, deck wording.
export const EW_MOVES = [
  { n: 1, text: "Lower the field 4'", demo: true },                                  // p50 (red)
  { n: 2, text: 'Add field suites (10)' },                                            // p50
  { n: 3, text: 'Restrike and overbuild 20 rows of lower bowl, add 4 rows' },         // p50
  { n: 4, text: 'Rebuild loge' },                                                     // p50
  { n: 5, text: "Demo and raise club level 8'", demo: true },                         // p50 (red "DEMO")
];
export const EW_LEVELS = ['FIELD SUITES', 'LOGE', 'MAIN CONCOURSE', 'CLUB LEVEL', 'UPPER CONCOURSE']; // p50
export const RAKES = { lowerBowl: 15, club: 27, alternate: 29 };                     // p62

// p52 North Stand
export const NORTH_EXISTING = [
  { n: 1, text: "Lower the field (4')" },                                             // p52
  { n: 2, text: 'Demo existing north bowl above main concourse' },                    // p52 (deck prints "EXISITNG"; p51 spells it "EXISTING")
];
export const NORTH_PROPOSED = [
  { n: 1, text: 'Overbuild lower bowl 20 rows' },                                     // p52
  { n: 2, text: 'Supervom for visibility from concourse' },                           // p52
  { n: 3, text: 'Occupiable video board (refer to video technology)' },               // p52
  { n: 4, text: 'New club sweep' },                                                   // p52
  { n: 5, text: 'Upper terrace SRO' },                                                // p52
];
export const NORTH_SECTION = {                                                        // p51
  rows: 50, rowsLabel: 'ROWS ON NORTH',
  sroLevels: ['SRO LEVEL 1', 'SRO LEVEL 2', 'SRO LEVEL 3', 'SRO LEVEL 4'],
};

// p54 South Stand
export const SOUTH_EXISTING = [
  { n: 1, text: 'Demolition' },                                                       // p54
  { n: 2, text: "Lower the field 4'" },                                               // p54
];
export const SOUTH_DEMO_CALLOUT = 'Demo club seats −6 rows @ 19,540 SF';               // p53 "DEMO CLUB SEATS (-6 ROWS @ 19,540SF)"
export const SOUTH_PROPOSED = [
  { n: 1, text: "Lower the field 4'" },                                               // p54
  { n: 2, text: 'Overbuild half of lower bowl (22,600 SF)' },                         // p54
  { n: 3, text: 'New premium products on south — 9 end zone suites + bunker suites' },// p54
  { n: 4, text: 'Adding new rows on the back' },                                      // p54
  { n: 5, text: 'Moving screen to the back' },                                        // p54
  { n: 6, text: 'Increasing size of videoboard — 16:9' },                             // p54
];
// Board size: p67 / p68 "214' x 109.5'" (also consistent with the 16:9 canvas
// on p70-71). p54 prints 215' x 112.5' and p53 prints 215' x 105' — logged.
export const BOARD = { width: 214, height: 109.5, label: "214' × 109.5'", ratio: '16:9' };   // p67, p68

// p62 North lower bowl — read from the rasterized page (text layer is jumbled).
export const NORTH_LOWER_BOWL = {
  alternate: {
    lowerBowl: 6532, clubLevel: 2128, total: 7034, rake: 29,                       // p62
    ribbon: "President's Club −3' × 272 LF",                                         // p62 "-3' x 272 LF"
    bowlArea: '−13,605 SF',                                                          // p62 "-13,605 SF"
  },
  proposed: { lowerBowl: 6533, clubLevel: 2129, total: 8662, rakeLower: 15, rakeClub: 27 }, // p62
  seatDelta: 1628,                                                                   // p62 "SEAT DELTA 1,628 seats"
};

// p45 New Product Ladder. Tier membership follows the bands printed on p45
// (Neighborhood Social sits in the GA band on the page; see REFERENCE_NOTES.md).
export const PRODUCT_TIERS = [
  { tier: 'A', color: '#0E3B40', seats: 520, pct: '0.6%',
    products: ['Owners Club', 'The Guild'] },
  { tier: 'B', color: '#1F6A63', seats: 6042, pct: '8.3%',
    products: ['The Foundry', 'Nineteen33', 'The Avenue Club', 'The Perch', 'The Homefield Collection'] },
  { tier: 'C', color: '#3D8C7F', seats: 3259, pct: '4.5%',
    products: ['The Green Door', 'The Rowhouse Suites (lower)', 'Victory House'] },
  { tier: 'D', color: '#76B39D', seats: 13890, pct: '19%',
    products: ['Ninth Street Social', 'The Landing', 'The Block', 'The Rowhouse Suites (upper)', 'The Stoop'] },
  { tier: 'GA+', color: '#B9D9C9', seats: null, pct: null, seatsLabel: '–', pctLabel: '–%',
    products: ['The Garden Society'] },
  { tier: 'GA', color: '#D9E3E0', seats: 49453, pct: '67.6%',
    products: ['Neighborhood Social', 'Upper concourse', 'Main concourse'] },
];
// Where each product lives in the plan (used to extrude tiles from the bowl).
// Level codes from p45 LVL column.
export const PRODUCT_ZONES = {
  'Owners Club': { band: 'club', segs: [8], span: [0.4, 0.6] },               // 300, west
  'The Guild': { band: 'lower', segs: [8], span: [0.35, 0.65], rows: [0, 0.3] }, // 100 VVIP sideline
  'The Foundry': { band: 'loge', segs: [2, 8], span: [0.1, 0.9] },             // 100 sideline club x2
  'Nineteen33': { band: 'field', segs: [8], span: [0.45, 0.55] },              // tunnel club
  'The Avenue Club': { band: 'suites', segs: [2, 8], span: [0.3, 0.7] },       // 400 presidential
  'The Perch': { band: 'boardN', segs: [11] },                                 // video club (boards)
  'The Homefield Collection': { band: 'field', segs: [2, 8], span: [0.2, 0.8] }, // field suites
  'The Green Door': { band: 'lower', segs: [11], rows: [0, 0.3] },             // 100 north end zone
  'The Rowhouse Suites (lower)': { band: 'suites', segs: [1, 2, 3, 7, 8, 9] }, // 300
  'Victory House': { band: 'club', segs: [2], span: [0.4, 0.6] },              // 500
  'Ninth Street Social': { band: 'loge', segs: [3, 7], span: [0, 1] },         // 200
  'The Landing': { band: 'loge', segs: [1, 9] },                               // 200 loge
  'The Block': { band: 'club', segs: [0, 1, 2, 3, 4, 6, 7, 8, 9, 10] },        // 500 club level
  'The Rowhouse Suites (upper)': { band: 'suitesUpper', segs: [2, 8] },        // 600
  'The Stoop': { band: 'loge', segs: [4, 6] },                                 // 200 cabanas
  'The Garden Society': { band: 'terrace', segs: [0, 1, 9, 10] },              // 800 upper terrace
  'Neighborhood Social': { band: 'plaza', segs: [5] },                         // plaza
  'Upper concourse': { band: 'upper', segs: 'all' },                           // 700
  'Main concourse': { band: 'lower', segs: 'all' },                            // 200
};
export const LADDER_HEADLINE = {
  before: { clubs: 8, suites: 175, premium: '19%' },     // p44 "8 CLUBS · 175 SUITES · 19% PREMIUM"
  after: { clubs: 11, suites: 205, premium: '32.4%' },   // p45 "11 CLUBS · 205 SUITES · 32.4% PREMIUM"
};

// PROPOSED COPY
export const TAGLINE = 'Closer. Louder. Unmistakably Eagles.'; // not in the deck

export const fmt = (n) => Math.round(n).toLocaleString('en-US');
