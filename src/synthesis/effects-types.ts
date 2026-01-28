// Effects Chain - Type Definitions
// All interfaces and types for audio effects

// Effect type identifiers
export type EffectId = 
  | 'compressor' 
  | 'eq3' 
  | 'bitcrusher' 
  | 'distortion' 
  | 'autowah' 
  | 'autofilter' 
  | 'phaser' 
  | 'chorus' 
  | 'tremolo' 
  | 'vibrato' 
  | 'freqshift' 
  | 'pitchshift' 
  | 'delay' 
  | 'reverb' 
  | 'stereowidener';

// Effect parameter interfaces
export interface CompressorParams {
  threshold: number;
  ratio: number;
  attack: number;
  release: number;
  enabled: boolean;
}

export interface EQ3Params {
  low: number;
  mid: number;
  high: number;
  enabled: boolean;
}

export interface BitCrusherParams {
  bits: number;
  wet: number;
  enabled: boolean;
}

export interface DistortionParams {
  amount: number;
  wet: number;
  enabled: boolean;
}

export interface AutoWahParams {
  baseFrequency: number;
  octaves: number;
  sensitivity: number;
  wet: number;
  enabled: boolean;
}

export interface AutoFilterParams {
  frequency: number;
  depth: number;
  octaves: number;
  wet: number;
  enabled: boolean;
}

export interface PhaserParams {
  frequency: number;
  octaves: number;
  wet: number;
  enabled: boolean;
}

export interface ChorusParams {
  frequency: number;
  depth: number;
  wet: number;
  enabled: boolean;
}

export interface TremoloParams {
  frequency: number;
  depth: number;
  wet: number;
  enabled: boolean;
}

export interface VibratoParams {
  frequency: number;
  depth: number;
  wet: number;
  enabled: boolean;
}

export interface FreqShiftParams {
  frequency: number;
  wet: number;
  enabled: boolean;
}

export interface PitchShiftParams {
  pitch: number;
  wet: number;
  enabled: boolean;
}

export interface DelayParams {
  time: number;
  feedback: number;
  wet: number;
  enabled: boolean;
}

export interface ReverbParams {
  decay: number;
  wet: number;
  enabled: boolean;
}

export interface StereoWidenerParams {
  width: number;
  wet: number;
  enabled: boolean;
}

export interface AllEffectParams {
  compressor: CompressorParams;
  eq3: EQ3Params;
  bitcrusher: BitCrusherParams;
  distortion: DistortionParams;
  autowah: AutoWahParams;
  autofilter: AutoFilterParams;
  phaser: PhaserParams;
  chorus: ChorusParams;
  tremolo: TremoloParams;
  vibrato: VibratoParams;
  freqshift: FreqShiftParams;
  pitchshift: PitchShiftParams;
  delay: DelayParams;
  reverb: ReverbParams;
  stereowidener: StereoWidenerParams;
}

// Callback types
export type EffectChangeCallback = (effectId: EffectId, params: any) => void;
export type OrderChangeCallback = (order: EffectId[]) => void;

