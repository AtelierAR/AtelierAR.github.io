// All figures used by the animation, each with its page in
// reference/20261022_LFF_Eagles_HKS.pdf (HKS Concept Pricing Package, Oct 22 2026).
// Units: feet and square feet. Nothing in this file is invented; values that are
// derived (not printed in the deck) are marked DERIVED and show their arithmetic.

export const SOURCE = {
  title: 'Philadelphia Eagles · Lincoln Financial Field · HKS Concept Pricing Package',
  date: 'Oct 22, 2026',
  file: 'reference/20261022_LFF_Eagles_HKS.pdf',
};

// p42 — New manifest
export const CAPACITY = {
  totalWithSRO: 76660, // p42 "TOTAL with SRO 76,660"
};

// p70, p71 — the field-facing face of each board
export const FACE = {
  canvas: {
    width: 164, // p70 "164'"
    height: 92.25, // p70 "92'-3""
    areaSF: 15129, // p70 "15,129 SF Traditional LED (164' X 92'-3")"
    ratio: '16:9', // p70
  },
  wing: 25, // p70 "25'" clear-LED wing, each side
  band: 17.25, // p70 "17'-3"" band under the canvas
  width: 214, // p67, p68 "Videoboard size 214' x 109.5'"
  height: 109.5, // p67, p68
  areaSF: 23433, // p70 "South Face: 23,433 SF"
  clearAreaSF: 8304, // p70 "8,304 SF Clear LED" (hybrid option)
  // p54 prints "ASPECT RATIO 16:9 (215' x 112.5')" and p53 "NEW VIDEOBOARD 215' X 105'".
  // We use 214' x 109.5' (p67, p68, p70, p71). See REFERENCE_NOTES.md.
  discrepancies: [
    { page: 54, text: "215' x 112.5'" },
    { page: 53, text: "215' X 105'" },
  ],
};

// p67 — North videoboard volume
export const NORTH = {
  key: 'north',
  label: 'North videoboard',
  depth: 155, // p67 "155'"
  faces: {
    top: 26977, // p67
    bottom: 19726, // p67
    back: 16127, // p67 "North: 16,127 sf" (plaza side)
    east: 12217, // p67
    front: 23433, // p67 "South: 23,433 sf" (field-facing)
    west: 12127, // p67 — likely a transposition of 12,217; see REFERENCE_NOTES.md
  },
  faceNames: { front: 'South', back: 'North', east: 'East', west: 'West', top: 'Top', bottom: 'Bottom' },
  remainingSF: 87264, // p70 "Remaining Faces Total: 87,264 SF"
  totalSF: 23433 + 87264, // DERIVED p70: field face + remaining = 110,697
};

// p68 — South videoboard volume
export const SOUTH = {
  key: 'south',
  label: 'South videoboard',
  depth: 109, // p68 "109'"
  faces: {
    top: 23438, // p68
    bottom: 16129, // p68
    front: 23433, // p68 "North: 23,433 sf" (field-facing)
    east: 10453, // p68
    back: 16293, // p68 "South: 16,293 sf" (plaza side)
    west: 10453, // p68
  },
  faceNames: { front: 'North', back: 'South', east: 'East', west: 'West', top: 'Top', bottom: 'Bottom' },
  remainingSF: 76766, // p71 "Remaining Faces Total: 76,766 SF"
  totalSF: 23433 + 76766, // DERIVED p71: 100,199
};

// p66 (and p13) — total videoboard surface
export const TOTAL_VIDEOBOARD_SF = 224274; // p66 "Total Area 224,274 SF", p13 "VIDEO BOARD 224,274 SF"
// DERIVED: what p66 adds beyond the two volumes (vertical facade boards visible on p66).
// The deck does not itemise these; the animation only shows them as "+ facade boards (p66)".
export const FACADE_BOARDS_SF = TOTAL_VIDEOBOARD_SF - NORTH.totalSF - SOUTH.totalSF; // 13,378

// p70, p71 — skin options (same text on both pages, field face named per board)
export const OPTIONS = [
  {
    id: 1,
    title: 'Option 1 — All Clear LED',
    lines: (b) => [`${b.faceNames.front} Face: 23,433 SF`, `Remaining Faces Total: ${fmt(b.remainingSF)} SF`],
    skin: { canvas: 'clear', wings: 'clear', rest: 'clear' },
  },
  {
    id: 2,
    title: 'Option 2 — Hybrid',
    lines: (b) => [
      `${b.faceNames.front} Face:`,
      `15,129 SF Traditional LED (164' × 92'-3")`,
      `8,304 SF Clear LED`,
      `Remaining Faces Total: ${fmt(b.remainingSF)} SF Clear LED`,
    ],
    skin: { canvas: 'traditional', wings: 'clear', rest: 'clear' },
  },
  {
    id: 3,
    title: 'Option 3 — All Traditional LED',
    lines: (b) => [`${b.faceNames.front} Face: 23,433 SF`, `Remaining Faces Total: ${fmt(b.remainingSF)} SF`],
    skin: { canvas: 'traditional', wings: 'traditional', rest: 'traditional' },
  },
];

// p69 — ribbon boards, all 3' high. Runs 1–4 west, 5–8 east (mirrored).
// existingLF = "3' x ___ LF*" (*existing to be replaced per FCA); newLF = "New 3' x ___ LF".
export const RIBBON_HEIGHT = 3; // p69
export const RIBBONS = [
  { n: 1, side: 'west', tier: 'upperBowl', name: 'Upper bowl', lf: 801, existingLF: 510, newLF: 291 },
  { n: 2, side: 'west', tier: 'club', name: 'Club', lf: 375, existingLF: 0, newLF: 375 },
  { n: 3, side: 'west', tier: 'presidents', name: "President's Club", lf: 827, existingLF: 526, newLF: 301 },
  { n: 4, side: 'west', tier: 'lowerClub', name: 'Lower club', lf: 670, existingLF: 0, newLF: 670 },
  { n: 5, side: 'east', tier: 'upperBowl', name: 'Upper bowl', lf: 801, existingLF: 510, newLF: 291 },
  { n: 6, side: 'east', tier: 'club', name: 'Club', lf: 375, existingLF: 0, newLF: 375 },
  { n: 7, side: 'east', tier: 'presidents', name: "President's Club", lf: 827, existingLF: 526, newLF: 301 },
  { n: 8, side: 'east', tier: 'lowerClub', name: 'Lower club', lf: 670, existingLF: 0, newLF: 670 },
];

// p51, p63, p97–99, p110 — what is inside the volumes. Elevations are measured off the
// p51 North Section at its scale bar (≈2.3 px/ft at 1400 px width, checked against the
// 109.5' face height) and are therefore approximate; heights are above the volume underside.
export const FLOORS = [
  { key: 'club', label: 'Video board club — club level', y: 12, plate: true, src: 'p51, p97–99, p110' },
  { key: 'upperSuite', label: 'Video board club — upper suite level', y: 29, plate: true, src: 'p51, p110 (replaces 14 upper suites)' },
  { key: 'upperConcourse', label: 'GA+ club — upper concourse', y: 43, plate: true, src: 'p110' },
  { key: 'sro1', label: 'SRO level 1', y: 55, plate: false, src: 'p51' },
  { key: 'sro2', label: 'SRO level 2', y: 67, plate: false, src: 'p51' },
  { key: 'sro3', label: 'SRO level 3', y: 79, plate: false, src: 'p51' },
  { key: 'sro4', label: 'SRO level 4', y: 91, plate: false, src: 'p51' },
];

// p97 callouts, p87 callouts
export const CALLOUTS = {
  club: ['Club', 'Immersive experiences', 'Hospitality focus'], // p97
  superVom: ['Super vom — main concourse', 'Immersive experiences', 'Connection to the bowl'], // p51 item 4, p87
};

// p4 — House of Energy · Higher Amplitude
export const WAVEFORM = {
  before: 'TODAY', // p4, dashed low-amplitude line
  after: 'RENOVATED BOWL', // p4, solid green high-amplitude zigzag
  // Vertices of the p4 polyline, normalised (x 0..1 across, y −1..1), traced from
  // reference/pages/p-004.png at 200 DPI.
  today: [
    [0.0, 0.02], [0.083, 0.21], [0.167, -0.24], [0.25, 0.1], [0.333, -0.16], [0.417, 0.07],
    [0.5, -0.07],
  ],
  renovated: [
    [0.5, -0.07], [0.55, 0.81], [0.6, -0.89], [0.65, 0.98], [0.7, -1.0], [0.742, 1.0],
    [0.79, -0.89], [0.842, 0.87], [0.89, -0.81], [0.94, 0.58], [1.0, -0.05],
  ],
};

// Palette (prompt + p63/p67/p70 samples)
export const COLORS = {
  clay: '#F1F2F4',
  hairline: '#3A4649',
  skyTop: '#8D96AD',
  skyHorizon: '#E3E6EC',
  glassTeal: '#41B6AF',
  lineGreen: '#3CCB5A',
  midnight: '#0F4A52',
  eaglesGreen: '#004C54',
  silver: '#A5ACAF',
};

export function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}
