// Effects Panel - Icon Definitions
// SVG icons for effect modules

import type { EffectId } from '../synthesis/effects-types';

// Effect icons as simple SVG paths
export const EFFECT_ICONS: Record<EffectId, string> = {
  compressor: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 8h16v8H4z"/>
    <path d="M8 8V6M16 8V6M8 16v2M16 16v2"/>
    <path d="M8 12h8"/>
  </svg>`,
  eq3: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 12h2v6H4zM10 8h2v10h-2zM16 10h2v8h-2z"/>
  </svg>`,
  bitcrusher: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/>
    <rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/>
    <rect x="10" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/>
    <rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/>
  </svg>`,
  distortion: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 12h2l3-9 4 18 3-9h4"/>
  </svg>`,
  autowah: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 17l4-4 4 4 4-8 4 8 2-2"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`,
  autofilter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 4l7 7v9l4-4v-5l7-7z"/>
  </svg>`,
  phaser: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="8"/>
    <path d="M12 4v16M4 12h16"/>
  </svg>`,
  chorus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 12s3-4 10-4 10 4 10 4-3 4-10 4-10-4-10-4z"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>`,
  tremolo: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0 4 3 6 0"/>
    <path d="M2 16c2-3 4-3 6 0s4 3 6 0" opacity="0.5"/>
  </svg>`,
  vibrato: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 12c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/>
    <circle cx="12" cy="12" r="1" fill="currentColor"/>
  </svg>`,
  freqshift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 12h16M12 4v16"/>
    <path d="M8 8l4-4 4 4M8 16l4 4 4-4"/>
  </svg>`,
  pitchshift: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 3v18"/>
    <path d="M5 10l7-7 7 7"/>
    <path d="M5 14l7 7 7-7" opacity="0.5"/>
  </svg>`,
  delay: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="6" cy="12" r="3"/><circle cx="12" cy="12" r="2" opacity="0.6"/>
    <circle cx="17" cy="12" r="1.5" opacity="0.3"/>
  </svg>`,
  reverb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M3 12c0-4.97 4.03-9 9-9s9 4.03 9 9"/>
    <path d="M6 12c0-3.31 2.69-6 6-6s6 2.69 6 6" opacity="0.7"/>
    <path d="M9 12c0-1.66 1.34-3 3-3s3 1.34 3 3" opacity="0.4"/>
  </svg>`,
  stereowidener: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 4v16"/>
    <path d="M8 8H4v8h4M16 8h4v8h-4"/>
    <path d="M4 12h4M16 12h4"/>
  </svg>`
};

// Effect-specific accent colors
export const EFFECT_COLORS: Record<EffectId, string> = {
  compressor: '#7a8b99',
  eq3: '#9b8b7a',
  bitcrusher: '#8b5a8b',
  distortion: '#c97064',
  autowah: '#d4a017',
  autofilter: '#5f9ea0',
  phaser: '#85677b',
  chorus: '#8fbc8f',
  tremolo: '#cd853f',
  vibrato: '#daa520',
  freqshift: '#708090',
  pitchshift: '#6a5acd',
  delay: '#d4a574',
  reverb: '#6b9ac4',
  stereowidener: '#9370db'
};

