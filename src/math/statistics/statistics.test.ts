import { describe, expect, it } from 'vitest';
import { buildGazeFeatures, GAZE_SIGNAL_ORDER } from './gazeFeatures';
import { kurtosis, maximum, mean, minimum, skewness, standardDeviation, variance } from './statistics';

describe('population statistics', () => {
  const values = [1, 2, 3, 4];
  it('calculates mean, variance, and standard deviation', () => {
    expect(mean(values)).toBe(2.5);
    expect(variance(values)).toBe(1.25);
    expect(standardDeviation(values)).toBeCloseTo(Math.sqrt(1.25));
  });
  it('calculates standardized moments', () => {
    expect(skewness(values)).toBeCloseTo(0);
    expect(kurtosis([1, 1, 2, 2])).toBeCloseTo(-2);
    expect(skewness([5, 5, 5])).toBe(0);
    expect(kurtosis([5, 5, 5])).toBe(0);
  });
  it('calculates extrema', () => {
    expect(minimum(values)).toBe(1);
    expect(maximum(values)).toBe(4);
  });
});

describe('36D gaze features', () => {
  it('has explicit signal-major ordering and exactly 36 entries', () => {
    const samples = { Lx:[0,2], Ly:[1,3], Lz:[2,4], Rx:[3,5], Ry:[4,6], Rz:[5,7] };
    const features = buildGazeFeatures(samples);
    expect(features).toHaveLength(36);
    GAZE_SIGNAL_ORDER.forEach((_signal, index) => {
      expect(features[index * 6]).toBe(index + 1);
      expect(features[index * 6 + 4]).toBe(index);
      expect(features[index * 6 + 5]).toBe(index + 2);
    });
  });
});
