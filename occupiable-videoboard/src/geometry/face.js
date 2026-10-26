// The field-facing face, built from its numbers (p70, p71). Pure functions, no three.js,
// so the dimensions can be unit-tested exactly.
import { FACE } from '../data.js';

// Face coordinates: x = 0 at the face centre, y = 0 at the bottom edge, feet.
export function faceLayout(f = FACE) {
  const width = f.canvas.width + 2 * f.wing; // 164 + 2·25 = 214
  const height = f.canvas.height + f.band; // 92.25 + 17.25 = 109.5
  const canvas = { x0: -f.canvas.width / 2, x1: f.canvas.width / 2, y0: f.band, y1: height };
  const wingL = { x0: -width / 2, x1: canvas.x0, y0: f.band, y1: height };
  const wingR = { x0: canvas.x1, x1: width / 2, y0: f.band, y1: height };
  const band = { x0: -width / 2, x1: width / 2, y0: 0, y1: f.band };
  return { width, height, canvas, wingL, wingR, band };
}

export const rectArea = (r) => (r.x1 - r.x0) * (r.y1 - r.y0);

export function faceAreas(f = FACE) {
  const L = faceLayout(f);
  const canvas = rectArea(L.canvas);
  const clear = rectArea(L.wingL) + rectArea(L.wingR) + rectArea(L.band);
  return { canvas, clear, total: L.width * L.height, wings: rectArea(L.wingL) + rectArea(L.wingR), band: rectArea(L.band) };
}

// Feet to the architectural string used on p70: 92.25 -> 92'-3", 25 -> 25'
export function feetInches(ft) {
  let whole = Math.floor(ft + 1e-9);
  let inches = Math.round((ft - whole) * 12);
  if (inches === 12) {
    whole += 1;
    inches = 0;
  }
  return inches ? `${whole}'-${inches}"` : `${whole}'`;
}
