// Effects Chain - Configuration
// Default order, storage key, and randomization ranges

import type { EffectId } from './effects-types';
import type { GlucoseReading } from '../types';

// Glucose stats interface for data-driven randomization
export interface GlucoseStats {
  min: number;
  max: number;
  avg: number;
  timeInRange: number;
  volatility?: number; // Computed from readings
}

// Extended stats including computed volatility
export interface GlucoseStatsWithVolatility extends GlucoseStats {
  volatility: number;
}

// Default effect order (musically logical signal chain)
export const DEFAULT_ORDER: EffectId[] = [
  'compressor',
  'eq3',
  'bitcrusher',
  'distortion',
  'autowah',
  'autofilter',
  'phaser',
  'chorus',
  'tremolo',
  'vibrato',
  'freqshift',
  'pitchshift',
  'delay',
  'reverb',
  'stereowidener',
];

// Storage key for persisting effect order
export const STORAGE_KEY = 'glukoscillator-fx-order';

// Parameter ranges for randomization (musically sensible)
export const RANDOM_RANGES = {
  compressor: {
    threshold: { min: -30, max: -10 },
    ratio: { min: 2, max: 8 },
  },
  eq3: {
    low: { min: -12, max: 12 },
    mid: { min: -12, max: 12 },
    high: { min: -12, max: 12 },
  },
  bitcrusher: {
    bits: { min: 4, max: 12 },
    wet: { min: 0, max: 0.8 },
  },
  distortion: {
    amount: { min: 0, max: 0.6 },
    wet: { min: 0, max: 0.8 },
  },
  autowah: {
    baseFrequency: { min: 100, max: 800 },
    octaves: { min: 2, max: 6 },
    sensitivity: { min: 0, max: 0 },
    wet: { min: 0, max: 0.8 },
  },
  autofilter: {
    frequency: { min: 0.5, max: 8 },
    depth: { min: 0.2, max: 1 },
    octaves: { min: 1, max: 4 },
    wet: { min: 0, max: 0.8 },
  },
  phaser: {
    frequency: { min: 0.5, max: 8 },
    octaves: { min: 1, max: 3 },
    wet: { min: 0, max: 0.7 },
  },
  chorus: {
    frequency: { min: 0.5, max: 4 },
    depth: { min: 0.2, max: 0.8 },
    wet: { min: 0, max: 0.6 },
  },
  tremolo: {
    frequency: { min: 2, max: 12 },
    depth: { min: 0.3, max: 1 },
    wet: { min: 0, max: 0.8 },
  },
  vibrato: {
    frequency: { min: 2, max: 10 },
    depth: { min: 0.1, max: 0.5 },
    wet: { min: 0, max: 0.7 },
  },
  freqshift: {
    frequency: { min: -500, max: 500 },
    wet: { min: 0, max: 0.6 },
  },
  pitchshift: {
    pitch: { min: -12, max: 12 },
    wet: { min: 0, max: 0.8 },
  },
  delay: {
    time: { min: 0.1, max: 0.5 },
    feedback: { min: 0.2, max: 0.6 },
    wet: { min: 0, max: 0.5 },
  },
  reverb: {
    decay: { min: 0.5, max: 3 },
    wet: { min: 0.1, max: 0.5 },
  },
  stereowidener: {
    width: { min: 0, max: 1 },
    wet: { min: 0, max: 1 },
  },
};

/**
 * Get human-readable effect name
 */
export function getEffectDisplayName(effectId: EffectId): string {
  const names: Record<EffectId, string> = {
    compressor: 'Compressor',
    eq3: 'EQ3',
    bitcrusher: 'BitCrusher',
    distortion: 'Distortion',
    autowah: 'Auto-Wah',
    autofilter: 'AutoFilter',
    phaser: 'Phaser',
    chorus: 'Chorus',
    tremolo: 'Tremolo',
    vibrato: 'Vibrato',
    freqshift: 'FreqShift',
    pitchshift: 'PitchShift',
    delay: 'Delay',
    reverb: 'Reverb',
    stereowidener: 'Stereo Wide',
  };
  return names[effectId];
}

// Envelope ranges for data-driven ADSR values
export const ENVELOPE_RANGES = {
  attack: { min: 0.005, max: 0.3 },   // 5ms to 300ms
  decay: { min: 0.05, max: 0.5 },     // 50ms to 500ms
  sustain: { min: 0.3, max: 0.9 },    // 30% to 90%
  release: { min: 0.1, max: 1.0 },    // 100ms to 1s
};

// Effect categories for glucose-driven selection
export const EFFECT_CATEGORIES = {
  // High volatility = chaotic, aggressive effects
  highVolatility: ['bitcrusher', 'distortion', 'freqshift'] as EffectId[],
  // Low volatility = smooth, ambient effects
  lowVolatility: ['reverb', 'chorus', 'phaser'] as EffectId[],
  // High average glucose = modulation effects
  highAverage: ['tremolo', 'vibrato'] as EffectId[],
  // Low average glucose = stabilizing effects
  lowAverage: ['compressor', 'eq3'] as EffectId[],
  // Poor time-in-range = filtering effects
  poorTIR: ['autowah', 'autofilter'] as EffectId[],
  // Good time-in-range = spacious effects
  goodTIR: ['stereowidener', 'delay', 'pitchshift'] as EffectId[],
};

// Thresholds for categorizing glucose stats
export const GLUCOSE_THRESHOLDS = {
  volatility: {
    high: 40,   // mg/dL standard deviation considered high
    low: 20,    // mg/dL standard deviation considered low
  },
  average: {
    high: 150,  // mg/dL average considered high
    low: 100,   // mg/dL average considered low
    target: 120, // Target average for normalization
  },
  timeInRange: {
    good: 70,   // 70%+ is good
    poor: 50,   // Below 50% is poor
  },
};

/**
 * Compute volatility (standard deviation) from glucose readings
 * Returns a value in mg/dL representing how much the glucose varies
 */
export function computeVolatility(readings: GlucoseReading[]): number {
  if (readings.length < 2) return 0;
  
  // Calculate mean
  const values = readings.map(r => r.value);
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  // Calculate standard deviation
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  const stdDev = Math.sqrt(avgSquaredDiff);
  
  return stdDev;
}

/**
 * Compute rate of change volatility - measures how quickly glucose changes
 * Higher values indicate more rapid fluctuations
 */
export function computeRateOfChange(readings: GlucoseReading[]): number {
  if (readings.length < 2) return 0;
  
  let totalChange = 0;
  for (let i = 1; i < readings.length; i++) {
    totalChange += Math.abs(readings[i].value - readings[i - 1].value);
  }
  
  return totalChange / (readings.length - 1);
}

/**
 * Combine multiple days' stats into averaged stats
 */
export function combineGlucoseStats(statsArray: GlucoseStatsWithVolatility[]): GlucoseStatsWithVolatility {
  if (statsArray.length === 0) {
    return { min: 70, max: 180, avg: 120, timeInRange: 70, volatility: 25 };
  }
  
  if (statsArray.length === 1) {
    return statsArray[0];
  }
  
  const combined = statsArray.reduce((acc, stats) => ({
    min: Math.min(acc.min, stats.min),
    max: Math.max(acc.max, stats.max),
    avg: acc.avg + stats.avg,
    timeInRange: acc.timeInRange + stats.timeInRange,
    volatility: acc.volatility + stats.volatility,
  }), { min: Infinity, max: -Infinity, avg: 0, timeInRange: 0, volatility: 0 });
  
  return {
    min: combined.min,
    max: combined.max,
    avg: combined.avg / statsArray.length,
    timeInRange: combined.timeInRange / statsArray.length,
    volatility: combined.volatility / statsArray.length,
  };
}

/**
 * Scale a value within a range based on a 0-1 factor
 */
export function scaleInRange(factor: number, min: number, max: number): number {
  return min + factor * (max - min);
}

/**
 * Normalize a glucose stat to a 0-1 range for use in effect parameter scaling
 */
export function normalizeGlucoseStat(
  value: number,
  type: 'volatility' | 'average' | 'timeInRange'
): number {
  const thresholds = GLUCOSE_THRESHOLDS;
  
  switch (type) {
    case 'volatility':
      // Normalize volatility: 0 = very stable, 1 = very volatile
      return Math.min(1, Math.max(0, (value - thresholds.volatility.low) / 
        (thresholds.volatility.high - thresholds.volatility.low)));
    
    case 'average':
      // Normalize average: 0 = low, 0.5 = target, 1 = high
      if (value <= thresholds.average.low) return 0;
      if (value >= thresholds.average.high) return 1;
      if (value <= thresholds.average.target) {
        return 0.5 * (value - thresholds.average.low) / 
          (thresholds.average.target - thresholds.average.low);
      }
      return 0.5 + 0.5 * (value - thresholds.average.target) / 
        (thresholds.average.high - thresholds.average.target);
    
    case 'timeInRange':
      // Normalize TIR: 0 = poor (0%), 1 = excellent (100%)
      return Math.min(1, Math.max(0, value / 100));
    
    default:
      return 0.5;
  }
}

