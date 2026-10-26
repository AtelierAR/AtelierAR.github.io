import { describe, expect, it } from 'vitest';
import { RIBBONS } from '../src/data.js';
import { ribbonRunPoints, polylineLength } from '../src/world/ribbons.js';

describe('ribbon boards (p69)', () => {
  it('has 8 runs, mirrored west/east', () => {
    expect(RIBBONS).toHaveLength(8);
    for (let i = 0; i < 4; i++) {
      expect(RIBBONS[i].side).toBe('west');
      expect(RIBBONS[i + 4].side).toBe('east');
      expect(RIBBONS[i + 4].lf).toBe(RIBBONS[i].lf);
    }
  });
  it('existing + new linear feet add up to each total', () => {
    for (const r of RIBBONS) expect(r.existingLF + r.newLF).toBe(r.lf);
  });
  it.each(RIBBONS.map((r) => [r.n, r.name, r]))('run %i (%s) is modelled at its deck length within 1 LF', (_, __, r) => {
    const { pts } = ribbonRunPoints(r, 1);
    expect(Math.abs(polylineLength(pts) - r.lf)).toBeLessThan(1);
  });
  it('west runs travel south → north, east runs north → south (one ring)', () => {
    for (const r of RIBBONS) {
      const { pts } = ribbonRunPoints(r, 4);
      const dz = pts[pts.length - 1].z - pts[0].z;
      if (r.side === 'west') expect(dz).toBeLessThan(0);
      else expect(dz).toBeGreaterThan(0);
    }
  });
});
