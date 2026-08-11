import { describe } from './statistics';

export const GAZE_SIGNAL_ORDER = ['Lx', 'Ly', 'Lz', 'Rx', 'Ry', 'Rz'] as const;
export type GazeSignal = typeof GAZE_SIGNAL_ORDER[number];
export type GazeSamples = Record<GazeSignal, readonly number[]>;

/** Signal-major ordering; each signal stores mean, std, skew, excess kurtosis, min, max. */
export const buildGazeFeatures = (samples: GazeSamples): readonly number[] =>
  GAZE_SIGNAL_ORDER.flatMap((signal) => describe(samples[signal]));
