// Effects Chain - Configuration
// Default order, storage key, and randomization ranges

import type { EffectId } from './effects-types';

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

