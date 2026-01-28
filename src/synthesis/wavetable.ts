// Wavetable Generation
// Converts glucose readings into playable waveforms

import type { DailyGlucoseData } from '../types';
import { GLUCOSE_RANGE } from '../types';

// Standard wavetable size (power of 2 for FFT efficiency)
export const WAVETABLE_SIZE = 2048;

/**
 * Generate a wavetable from a day's glucose readings
 * The glucose curve becomes a single-cycle waveform
 */
export function generateWavetable(dayData: DailyGlucoseData): Float32Array {
  const readings = dayData.readings;
  
  if (readings.length === 0) {
    // Return silence if no data
    return new Float32Array(WAVETABLE_SIZE).fill(0);
  }
  
  // Extract just the glucose values
  const values = readings.map(r => r.value);
  
  // Normalize to [-1, 1] range
  const normalized = normalizeGlucoseValues(values);
  
  // Resample to wavetable size
  const wavetable = resampleToWavetableSize(normalized, WAVETABLE_SIZE);
  
  // Apply smoothing to reduce aliasing
  smoothWavetable(wavetable);
  
  return wavetable;
}

/**
 * Normalize glucose values to [-1, 1] audio range
 * Uses the day's min/max for maximum dynamic range
 */
export function normalizeGlucoseValues(values: number[]): Float32Array {
  if (values.length === 0) {
    return new Float32Array(0);
  }
  
  // Use day's actual range for normalization
  // This gives each day its unique character
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  
  // Prevent division by zero (flat line)
  if (range === 0) {
    return new Float32Array(values.length).fill(0);
  }
  
  const normalized = new Float32Array(values.length);
  
  for (let i = 0; i < values.length; i++) {
    // Map to [-1, 1]
    normalized[i] = ((values[i] - min) / range) * 2 - 1;
  }
  
  return normalized;
}

/**
 * Alternative normalization using fixed physiological range
 * Useful for comparing days against each other
 */
export function normalizeToPhysiologicalRange(values: number[]): Float32Array {
  const { min, max } = GLUCOSE_RANGE.absolute;
  const range = max - min;
  
  const normalized = new Float32Array(values.length);
  
  for (let i = 0; i < values.length; i++) {
    // Clamp to physiological range
    const clamped = Math.max(min, Math.min(max, values[i]));
    // Map to [-1, 1]
    normalized[i] = ((clamped - min) / range) * 2 - 1;
  }
  
  return normalized;
}

/**
 * Resample normalized values to standard wavetable size
 * Uses linear interpolation
 */
function resampleToWavetableSize(values: Float32Array, targetSize: number): Float32Array {
  if (values.length === 0) {
    return new Float32Array(targetSize).fill(0);
  }
  
  if (values.length === targetSize) {
    return values;
  }
  
  const result = new Float32Array(targetSize);
  const ratio = values.length / targetSize;
  
  for (let i = 0; i < targetSize; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, values.length - 1);
    const fraction = srcIndex - srcIndexFloor;
    
    // Linear interpolation
    result[i] = values[srcIndexFloor] * (1 - fraction) + values[srcIndexCeil] * fraction;
  }
  
  return result;
}

/**
 * Apply gentle smoothing to reduce harsh high frequencies
 */
function smoothWavetable(wavetable: Float32Array, passes: number = 2): void {
  const temp = new Float32Array(wavetable.length);
  
  for (let pass = 0; pass < passes; pass++) {
    for (let i = 0; i < wavetable.length; i++) {
      const prev = wavetable[(i - 1 + wavetable.length) % wavetable.length];
      const curr = wavetable[i];
      const next = wavetable[(i + 1) % wavetable.length];
      
      // 3-point moving average with emphasis on current
      temp[i] = prev * 0.25 + curr * 0.5 + next * 0.25;
    }
    
    // Copy back
    wavetable.set(temp);
  }
}

/**
 * Compute FFT partials from wavetable for Tone.js
 * Tone.js uses Fourier coefficients for custom oscillators
 */
export function computePartialsFromWavetable(wavetable: Float32Array, numPartials: number = 64): number[] {
  const N = wavetable.length;
  const partials: number[] = [];
  
  // Compute real Fourier coefficients (cosine terms)
  for (let k = 1; k <= numPartials; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += wavetable[n] * Math.cos(angle);
      imag += wavetable[n] * Math.sin(angle);
    }
    
    // Magnitude of this harmonic
    const magnitude = Math.sqrt(real * real + imag * imag) / (N / 2);
    partials.push(magnitude);
  }
  
  // Normalize so fundamental is 1
  const fundamental = partials[0] || 1;
  return partials.map(p => p / fundamental);
}

/**
 * Generate wavetables for all days in the dataset
 */
export function generateAllWavetables(days: Map<string, DailyGlucoseData>): void {
  for (const [, dayData] of days) {
    dayData.wavetable = generateWavetable(dayData);
  }
}

/**
 * Get waveform data for visualization (downsampled for canvas)
 */
export function getWaveformForDisplay(wavetable: Float32Array, points: number = 200): number[] {
  const result: number[] = [];
  const step = wavetable.length / points;
  
  for (let i = 0; i < points; i++) {
    const index = Math.floor(i * step);
    result.push(wavetable[index]);
  }
  
  return result;
}

