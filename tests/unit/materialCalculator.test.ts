import { describe, it, expect } from 'vitest';
import { calcBlockCount, monteCarloWalledBlocks, mulchVolumeFromPolygon } from '../../src/utils/materialCalculator';

describe('calcBlockCount', () => {
  it('calculates blocks for a simple wall', () => {
    const count = calcBlockCount(20, 4, 12, 6);
    expect(count).toBe(160);
  });

  it('rounds up partial blocks', () => {
    const count = calcBlockCount(21, 4, 12, 6);
    expect(count).toBeGreaterThanOrEqual(168);
  });

  it('handles zero height', () => {
    expect(calcBlockCount(20, 0)).toBe(0);
  });
});

describe('monteCarloWalledBlocks', () => {
  it('returns a count greater than base for curved walls', () => {
    const base = calcBlockCount(20, 4);
    const monte = monteCarloWalledBlocks(20, 4, 12, 6, 1.2);
    expect(monte).toBeGreaterThanOrEqual(base);
  });

  it('applies 5% waste factor', () => {
    const base = calcBlockCount(20, 4);
    const monte = monteCarloWalledBlocks(20, 4, 12, 6, 1.0, 1000);
    expect(monte).toBeGreaterThan(base * 0.99);
    expect(monte).toBeLessThan(base * 1.15);
  });
});

describe('mulchVolumeFromPolygon', () => {
  it('calculates area and volume for a rectangle', () => {
    const rect = [
      { x: 0, y: 0 }, { x: 10, y: 0 },
      { x: 10, y: 10 }, { x: 0, y: 10 },
    ];
    const result = mulchVolumeFromPolygon(rect, 3);
    expect(result.area).toBeCloseTo(100, 1);
    expect(result.cubicYards).toBeGreaterThan(0);
    expect(result.bags).toBeGreaterThan(0);
  });

  it('returns zero area for degenerate polygon', () => {
    const result = mulchVolumeFromPolygon([{ x: 0, y: 0 }, { x: 0, y: 0 }], 3);
    expect(result.area).toBeCloseTo(0, 5);
  });
});
