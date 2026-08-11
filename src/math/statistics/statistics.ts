const requireValues = (values: readonly number[]): void => {
  if (values.length === 0) throw new Error('Statistics require at least one value.');
};

export const mean = (values: readonly number[]): number => {
  requireValues(values);
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

/** Population variance: the second central moment divided by n. */
export const variance = (values: readonly number[]): number => {
  const center = mean(values);
  return values.reduce((sum, value) => sum + (value - center) ** 2, 0) / values.length;
};

export const standardDeviation = (values: readonly number[]): number => Math.sqrt(variance(values));

/** Population standardized third central moment. Constant signals return zero. */
export const skewness = (values: readonly number[]): number => {
  const center = mean(values);
  const deviation = standardDeviation(values);
  if (deviation === 0) return 0;
  return values.reduce((sum, value) => sum + ((value - center) / deviation) ** 3, 0) / values.length;
};

/** Population excess kurtosis (fourth standardized moment minus 3). */
export const kurtosis = (values: readonly number[]): number => {
  const center = mean(values);
  const deviation = standardDeviation(values);
  if (deviation === 0) return 0;
  return values.reduce((sum, value) => sum + ((value - center) / deviation) ** 4, 0) / values.length - 3;
};

export const minimum = (values: readonly number[]): number => { requireValues(values); return Math.min(...values); };
export const maximum = (values: readonly number[]): number => { requireValues(values); return Math.max(...values); };

export const describe = (values: readonly number[]): readonly number[] => [
  mean(values), standardDeviation(values), skewness(values), kurtosis(values), minimum(values), maximum(values),
];
