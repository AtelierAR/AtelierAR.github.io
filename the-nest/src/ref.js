// Geometry traced from the deck rasters. Page units are "2000-wide" (see REFERENCE_NOTES.md);
// world units are feet. pageToWorld() uses the p34 scale bar (1.5 page units per foot), with x
// measured from the p34 video-board centre (x 1019) and y from grade (y 731). The Scene 1/2
// camera is placed so that page coordinates land exactly on screen (screen px = page × 0.96).

export const PX_PER_FT = 1.5; // p34 scale bar: 1471 → 1771 = 200 ft
export const PAGE_ORIGIN = { x: 1019, y: 731 };
export const pageToWorld = ([x, y]) => [(x - PAGE_ORIGIN.x) / PX_PER_FT, (PAGE_ORIGIN.y - y) / PX_PER_FT];

// p4 — dashed "today" line and the renovated-bowl zigzag
export const WAVE_TODAY = [[145, 795], [290, 768], [440, 828], [580, 776], [735, 815], [870, 782], [995, 805]];
export const WAVE_RENOVATED = [
  [998, 805], [1082, 680], [1165, 920], [1250, 662], [1333, 935], [1415, 650],
  [1500, 922], [1582, 675], [1665, 905], [1750, 712], [1855, 798],
];
export const WAVE_DIVIDER = { x: 998, y0: 635, y1: 950 };
export const WAVE_LABELS = { today: [145, 725], renovated: [1040, 955] };

// p34 — long section, single continuous stroke left → right (down under each canopy to the rake).
export const SECTION_LEFT = [
  [100, 731], [236, 731], [236, 552], [290, 552], [290, 433], [360, 405], [640, 400], [705, 432],
  [370, 455], [520, 553], [580, 630], [585, 690], [782, 750], [1019, 750],
];
export const SECTION_RIGHT = [
  [1019, 750], [1258, 750], [1460, 692], [1460, 630], [1520, 560], [1650, 472], [1340, 432],
  [1430, 405], [1615, 405], [1705, 432], [1708, 552], [1786, 552], [1790, 455], [1850, 455],
  [1850, 731], [1880, 731],
];

// Half profile for the Scene 2 sweep, from the right side of p34: (u = ft outward from the field
// edge, y = ft above grade). Split into the existing bowl and the new canopy.
const toRib = ([x, y]) => [(x - 1258) / PX_PER_FT, (PAGE_ORIGIN.y - y) / PX_PER_FT];
export const RIB_BOWL = [[1258, 750], [1460, 692], [1460, 630], [1520, 560], [1650, 472], [1708, 552], [1786, 552], [1786, 731]].map(toRib);
export const RIB_CANOPY = [[1340, 432], [1430, 405], [1615, 405], [1705, 432], [1650, 472]].map(toRib);
// Field edge half-widths (ft): x from p34 (782–1258), z from p35 (720–1290).
export const FIELD_HALF = { x: 159, z: 190, r: 90 };

// p26 — Plaza View, 0.6 ft per page unit, centre x 965, grade y 750.
export const P26_FT = 0.6;
export const p26 = ([x, y]) => [(x - 965) * P26_FT, (750 - y) * P26_FT];

// Stadium District on the p6 map, normalized to the p06_aerial crop (which starts at page y 198).
export const P6_STADIUM = { u: 915 / 2000, v: (912 - 198) / (1125 - 198) };
