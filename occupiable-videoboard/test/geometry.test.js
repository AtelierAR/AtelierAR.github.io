import { describe, expect, it } from 'vitest';
import { FACE, NORTH, SOUTH, TOTAL_VIDEOBOARD_SF, FACADE_BOARDS_SF } from '../src/data.js';
import { faceAreas, faceLayout, feetInches } from '../src/geometry/face.js';
import { volumeMeasures } from '../src/geometry/volume.js';
import { VOLUME_PARAMS } from '../src/geometry/volumeParams.js';

describe('field face (p70, p71)', () => {
  const L = faceLayout();
  const A = faceAreas();
  it('is 214 wide and 109.5 high', () => {
    expect(L.width).toBe(214);
    expect(L.height).toBe(109.5);
  });
  it('has a 164 × 92.25 16:9 canvas', () => {
    expect(L.canvas.x1 - L.canvas.x0).toBe(164);
    expect(L.canvas.y1 - L.canvas.y0).toBe(92.25);
    expect((L.canvas.x1 - L.canvas.x0) / (L.canvas.y1 - L.canvas.y0)).toBeCloseTo(16 / 9, 2);
  });
  it('has 25 ft wings and a 17\'-3" band', () => {
    expect(L.wingL.x1 - L.wingL.x0).toBe(25);
    expect(L.wingR.x1 - L.wingR.x0).toBe(25);
    expect(L.band.y1 - L.band.y0).toBe(17.25);
  });
  it('areas equal the deck within 1 SF', () => {
    expect(Math.abs(A.canvas - FACE.canvas.areaSF)).toBeLessThan(1); // 15,129
    expect(Math.abs(A.clear - FACE.clearAreaSF)).toBeLessThan(1); // 8,304
    expect(Math.abs(A.total - FACE.areaSF)).toBeLessThan(1); // 23,433
    expect(A.canvas + A.clear).toBeCloseTo(A.total, 6);
  });
  it('prints dimensions like the deck', () => {
    expect(feetInches(92.25)).toBe(`92'-3"`);
    expect(feetInches(17.25)).toBe(`17'-3"`);
    expect(feetInches(109.5)).toBe(`109'-6"`);
    expect(feetInches(25)).toBe(`25'`);
  });
});

describe.each([
  ['north (p67)', NORTH],
  ['south (p68)', SOUTH],
])('%s volume', (_, board) => {
  const m = volumeMeasures(VOLUME_PARAMS[board.key]);
  it('keeps the field face an exact 214 × 109.5 rectangle', () => {
    expect(m.faceTopWidth).toBeCloseTo(214, 6);
    expect(m.faceHeight).toBeCloseTo(109.5, 6);
  });
  for (const k of ['front', 'back', 'top', 'bottom', 'east', 'west'])
    it(`${k} face area equals the deck within 1 SF`, () => {
      expect(Math.abs(m.areas[k] - board.faces[k])).toBeLessThan(1);
    });
  it('top is larger than the bottom (side walls flare, p63)', () => {
    expect(m.areas.top).toBeGreaterThan(m.areas.bottom);
    const topEdge = Math.hypot(...[0, 1, 2].map((i) => m.v.tke[i] - m.v.tfe[i]));
    const botEdge = Math.hypot(...[0, 1, 2].map((i) => m.v.bke[i] - m.v.bfe[i]));
    expect(topEdge).toBeGreaterThan(botEdge);
  });
  it('field face top leans toward the field, as in the sections (p51, p53)', () => {
    expect(m.v.tfe[2]).toBeLessThan(0);
  });
  it('depth stays within 12% of the printed depth', () => {
    expect(Math.abs(m.depth - board.depth) / board.depth).toBeLessThan(0.12);
  });
});

describe('totals (p66, p70, p71)', () => {
  it('remaining faces', () => {
    expect(SOUTH.faces.top + SOUTH.faces.bottom + SOUTH.faces.east + SOUTH.faces.back + SOUTH.faces.west).toBe(SOUTH.remainingSF);
    // p67 lists West 12,127; p70's 87,264 implies 12,217 (the documented 90 SF discrepancy).
    const northRemaining = NORTH.faces.top + NORTH.faces.bottom + NORTH.faces.east + NORTH.faces.back + NORTH.faces.west;
    expect(NORTH.remainingSF - northRemaining).toBe(90);
  });
  it('lands on 224,274 SF', () => {
    expect(NORTH.totalSF + SOUTH.totalSF + FACADE_BOARDS_SF).toBe(TOTAL_VIDEOBOARD_SF);
    expect(TOTAL_VIDEOBOARD_SF).toBe(224274);
  });
});
