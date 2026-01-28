// Effects Panel - Modular Stomp Box Design
// Each effect is a standalone pedal-style module with knobs

import { getSynth } from '../synthesis/synth-engine';
import { 
  type EffectId, 
  getEffectDisplayName,
  type CompressorParams,
  type EQ3Params,
  type BitCrusherParams,
  type DistortionParams,
  type AutoWahParams,
  type AutoFilterParams,
  type PhaserParams,
  type ChorusParams,
  type TremoloParams,
  type VibratoParams,
  type FreqShiftParams,
  type PitchShiftParams,
  type DelayParams,
  type ReverbParams,
  type StereoWidenerParams,
} from '../synthesis/effects-chain';
import { EFFECT_ICONS, EFFECT_COLORS } from './effects-icons';

export class EffectsPanel {
  private container: HTMLElement;
  private effectsContainer: HTMLElement | null = null;
  private draggedEffect: EffectId | null = null;
  private activeKnob: HTMLElement | null = null;
  private startY: number = 0;
  private startValue: number = 0;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }
    this.container = container;
    
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    document.addEventListener('mousemove', this.handleMouseMove);
    document.addEventListener('mouseup', this.handleMouseUp);
    
    this.render();
    this.setupEffectsCallbacks();
  }

  private setupEffectsCallbacks(): void {
    const effectsChain = getSynth().getEffectsChain();
    effectsChain.onChange((effectId) => this.updateEffectModule(effectId));
    effectsChain.onOrderChange(() => this.renderEffectModules());
  }

  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'effects-rack';

    const header = document.createElement('div');
    header.className = 'rack-header';
    header.innerHTML = `
      <div class="rack-screws left"><div class="screw"></div><div class="screw"></div></div>
      <div class="rack-title">
        <span class="rack-label">EFFECTS CHAIN</span>
        <button class="rack-reset-btn" title="Reset all effects">RESET</button>
      </div>
      <div class="rack-screws right"><div class="screw"></div><div class="screw"></div></div>
    `;
    this.container.appendChild(header);
    header.querySelector('.rack-reset-btn')?.addEventListener('click', () => getSynth().getEffectsChain().reset());

    this.effectsContainer = document.createElement('div');
    this.effectsContainer.className = 'effects-pedalboard';
    this.container.appendChild(this.effectsContainer);
    this.renderEffectModules();
  }

  private renderEffectModules(): void {
    if (!this.effectsContainer) return;
    this.effectsContainer.innerHTML = '';
    for (const effectId of getSynth().getEffectsChain().getOrder()) {
      this.effectsContainer.appendChild(this.createEffectModule(effectId));
    }
  }

  private createEffectModule(effectId: EffectId): HTMLElement {
    const effectsChain = getSynth().getEffectsChain();
    const params = effectsChain.getEffectParams(effectId);
    const isEnabled = effectsChain.isEnabled(effectId);
    const accentColor = EFFECT_COLORS[effectId];

    const module = document.createElement('div');
    module.className = `effect-module ${isEnabled ? 'enabled' : 'disabled'}`;
    module.id = `effect-module-${effectId}`;
    module.draggable = true;
    module.dataset.effect = effectId;

    module.innerHTML = `
      <div class="module-faceplate" style="--accent-color: ${accentColor}">
        <div class="module-screws top"><div class="screw small"></div><div class="screw small"></div></div>
        <div class="module-header">
          <div class="module-icon">${EFFECT_ICONS[effectId]}</div>
          <div class="module-name">${getEffectDisplayName(effectId)}</div>
        </div>
        <div class="module-knobs">${this.getEffectKnobsHTML(effectId, params)}</div>
        <div class="module-footer">
          <button class="footswitch ${isEnabled ? 'on' : ''}" data-effect="${effectId}">
            <div class="footswitch-led"></div>
          </button>
          <div class="module-label">${effectId.toUpperCase()}</div>
        </div>
        <div class="module-screws bottom"><div class="screw small"></div><div class="screw small"></div></div>
      </div>
    `;

    module.querySelector('.footswitch')?.addEventListener('click', () => this.setEffectEnabled(effectId, !isEnabled));
    this.setupKnobHandlers(module, effectId);
    this.setupDragHandlers(module, effectId);
    return module;
  }

  private getEffectKnobsHTML(effectId: EffectId, params: any): string {
    const knob = (param: string, label: string, value: number, min: number, max: number) => this.createMiniKnobHTML(param, label, value, min, max);

    switch (effectId) {
      case 'compressor': { const p = params as CompressorParams; return `<div class="knob-row">${knob('threshold', 'THRESH', (p.threshold + 60) * (100/60), 0, 100)}${knob('ratio', 'RATIO', p.ratio * 5, 5, 100)}</div>`; }
      case 'eq3': { const p = params as EQ3Params; return `<div class="knob-row">${knob('low', 'LOW', p.low + 50, 0, 100)}${knob('mid', 'MID', p.mid + 50, 0, 100)}${knob('high', 'HIGH', p.high + 50, 0, 100)}</div>`; }
      case 'bitcrusher': { const p = params as BitCrusherParams; return `<div class="knob-row">${knob('bits', 'BITS', p.bits * 6, 24, 96)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'distortion': { const p = params as DistortionParams; return `<div class="knob-row">${knob('amount', 'DRIVE', p.amount * 100, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'autowah': { const p = params as AutoWahParams; return `<div class="knob-row">${knob('baseFrequency', 'FREQ', p.baseFrequency / 10, 10, 100)}${knob('octaves', 'OCT', p.octaves * 10, 10, 80)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'autofilter': { const p = params as AutoFilterParams; return `<div class="knob-row">${knob('frequency', 'RATE', p.frequency * 10, 5, 100)}${knob('depth', 'DEPTH', p.depth * 100, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'phaser': { const p = params as PhaserParams; return `<div class="knob-row">${knob('frequency', 'RATE', p.frequency * 10, 1, 100)}${knob('octaves', 'OCT', p.octaves, 1, 5)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'chorus': { const p = params as ChorusParams; return `<div class="knob-row">${knob('frequency', 'RATE', p.frequency * 10, 1, 80)}${knob('depth', 'DEPTH', p.depth * 100, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'tremolo': { const p = params as TremoloParams; return `<div class="knob-row">${knob('frequency', 'RATE', p.frequency * 5, 10, 100)}${knob('depth', 'DEPTH', p.depth * 100, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'vibrato': { const p = params as VibratoParams; return `<div class="knob-row">${knob('frequency', 'RATE', p.frequency * 5, 10, 100)}${knob('depth', 'DEPTH', p.depth * 100, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'freqshift': { const p = params as FreqShiftParams; return `<div class="knob-row">${knob('frequency', 'SHIFT', (p.frequency + 500) / 10, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'pitchshift': { const p = params as PitchShiftParams; return `<div class="knob-row">${knob('pitch', 'SEMI', (p.pitch + 12) * (100/24), 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'delay': { const p = params as DelayParams; return `<div class="knob-row">${knob('time', 'TIME', p.time * 100, 10, 100)}${knob('feedback', 'FDBK', p.feedback * 100, 0, 90)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'reverb': { const p = params as ReverbParams; return `<div class="knob-row">${knob('decay', 'DECAY', p.decay * 20, 10, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      case 'stereowidener': { const p = params as StereoWidenerParams; return `<div class="knob-row">${knob('width', 'WIDTH', p.width * 100, 0, 100)}${knob('wet', 'MIX', p.wet * 100, 0, 100)}</div>`; }
      default: return '';
    }
  }

  private createMiniKnobHTML(param: string, label: string, value: number, min: number, max: number): string {
    const rotation = -135 + ((value - min) / (max - min)) * 270;
    return `<div class="mini-knob-wrapper"><div class="mini-knob-label">${label}</div><div class="mini-knob-container"><div class="mini-knob" data-param="${param}" data-value="${value}" data-min="${min}" data-max="${max}" style="transform: rotate(${rotation}deg)"><div class="mini-knob-pointer"></div></div></div></div>`;
  }

  private setupKnobHandlers(module: HTMLElement, effectId: EffectId): void {
    module.querySelectorAll('.mini-knob').forEach(knob => {
      const knobEl = knob as HTMLElement;
      knobEl.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.activeKnob = knobEl;
        this.startY = e.clientY;
        this.startValue = parseFloat(knobEl.dataset.value || '0');
        knobEl.classList.add('active');
        (knobEl as any)._effectId = effectId;
      });
    });
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.activeKnob) return;
    const knob = this.activeKnob;
    const min = parseFloat(knob.dataset.min || '0');
    const max = parseFloat(knob.dataset.max || '100');
    const param = knob.dataset.param || '';
    const effectId = (knob as any)._effectId as EffectId;

    const deltaY = this.startY - e.clientY;
    let newValue = Math.max(min, Math.min(max, this.startValue + deltaY * 0.5));
    
    knob.dataset.value = String(newValue);
    knob.style.transform = `rotate(${-135 + ((newValue - min) / (max - min)) * 270}deg)`;
    this.updateEffectParameter(effectId, param, newValue);
  }

  private handleMouseUp(): void {
    if (this.activeKnob) {
      this.activeKnob.classList.remove('active');
      this.activeKnob = null;
    }
  }

  private updateEffectParameter(effectId: EffectId, param: string, rawValue: number): void {
    const fx = getSynth().getEffectsChain();
    switch (effectId) {
      case 'compressor': if (param === 'threshold') fx.setCompressor({ threshold: (rawValue * 60 / 100) - 60 }); else if (param === 'ratio') fx.setCompressor({ ratio: rawValue / 5 }); break;
      case 'eq3': if (param === 'low') fx.setEQ3({ low: rawValue - 50 }); else if (param === 'mid') fx.setEQ3({ mid: rawValue - 50 }); else if (param === 'high') fx.setEQ3({ high: rawValue - 50 }); break;
      case 'bitcrusher': if (param === 'bits') fx.setBitCrusher({ bits: Math.round(rawValue / 6) }); else if (param === 'wet') fx.setBitCrusher({ wet: rawValue / 100 }); break;
      case 'distortion': if (param === 'amount') fx.setDistortion({ amount: rawValue / 100 }); else if (param === 'wet') fx.setDistortion({ wet: rawValue / 100 }); break;
      case 'autowah': if (param === 'baseFrequency') fx.setAutoWah({ baseFrequency: rawValue * 10 }); else if (param === 'octaves') fx.setAutoWah({ octaves: Math.round(rawValue / 10) }); else if (param === 'wet') fx.setAutoWah({ wet: rawValue / 100 }); break;
      case 'autofilter': if (param === 'frequency') fx.setAutoFilter({ frequency: rawValue / 10 }); else if (param === 'depth') fx.setAutoFilter({ depth: rawValue / 100 }); else if (param === 'wet') fx.setAutoFilter({ wet: rawValue / 100 }); break;
      case 'phaser': if (param === 'frequency') fx.setPhaser({ frequency: rawValue / 10 }); else if (param === 'octaves') fx.setPhaser({ octaves: Math.round(rawValue) }); else if (param === 'wet') fx.setPhaser({ wet: rawValue / 100 }); break;
      case 'chorus': if (param === 'frequency') fx.setChorus({ frequency: rawValue / 10 }); else if (param === 'depth') fx.setChorus({ depth: rawValue / 100 }); else if (param === 'wet') fx.setChorus({ wet: rawValue / 100 }); break;
      case 'tremolo': if (param === 'frequency') fx.setTremolo({ frequency: rawValue / 5 }); else if (param === 'depth') fx.setTremolo({ depth: rawValue / 100 }); else if (param === 'wet') fx.setTremolo({ wet: rawValue / 100 }); break;
      case 'vibrato': if (param === 'frequency') fx.setVibrato({ frequency: rawValue / 5 }); else if (param === 'depth') fx.setVibrato({ depth: rawValue / 100 }); else if (param === 'wet') fx.setVibrato({ wet: rawValue / 100 }); break;
      case 'freqshift': if (param === 'frequency') fx.setFreqShift({ frequency: (rawValue * 10) - 500 }); else if (param === 'wet') fx.setFreqShift({ wet: rawValue / 100 }); break;
      case 'pitchshift': if (param === 'pitch') fx.setPitchShift({ pitch: Math.round((rawValue * 24 / 100) - 12) }); else if (param === 'wet') fx.setPitchShift({ wet: rawValue / 100 }); break;
      case 'delay': if (param === 'time') fx.setDelay({ time: rawValue / 100 }); else if (param === 'feedback') fx.setDelay({ feedback: rawValue / 100 }); else if (param === 'wet') fx.setDelay({ wet: rawValue / 100 }); break;
      case 'reverb': if (param === 'decay') fx.setReverb({ decay: rawValue / 20 }); else if (param === 'wet') fx.setReverb({ wet: rawValue / 100 }); break;
      case 'stereowidener': if (param === 'width') fx.setStereoWidener({ width: rawValue / 100 }); else if (param === 'wet') fx.setStereoWidener({ wet: rawValue / 100 }); break;
    }
  }

  private setupDragHandlers(module: HTMLElement, effectId: EffectId): void {
    module.addEventListener('dragstart', (e) => {
      this.draggedEffect = effectId;
      module.classList.add('dragging');
      e.dataTransfer?.setData('text/plain', effectId);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
    });
    module.addEventListener('dragend', () => {
      this.draggedEffect = null;
      module.classList.remove('dragging');
      document.querySelectorAll('.effect-module').forEach(m => m.classList.remove('drag-over-left', 'drag-over-right'));
    });
    module.addEventListener('dragover', (e) => {
      e.preventDefault();
      if (this.draggedEffect === effectId) return;
      const rect = module.getBoundingClientRect();
      module.classList.remove('drag-over-left', 'drag-over-right');
      module.classList.add(e.clientX < rect.left + rect.width / 2 ? 'drag-over-left' : 'drag-over-right');
    });
    module.addEventListener('dragleave', () => module.classList.remove('drag-over-left', 'drag-over-right'));
    module.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!this.draggedEffect || this.draggedEffect === effectId) return;
      const effectsChain = getSynth().getEffectsChain();
      const currentOrder = effectsChain.getOrder();
      const rect = module.getBoundingClientRect();
      const dropBefore = e.clientX < rect.left + rect.width / 2;
      const newOrder = currentOrder.filter(id => id !== this.draggedEffect);
      let insertIndex = newOrder.indexOf(effectId);
      if (!dropBefore) insertIndex++;
      newOrder.splice(insertIndex, 0, this.draggedEffect);
      effectsChain.reorder(newOrder);
      module.classList.remove('drag-over-left', 'drag-over-right');
    });
  }

  private setEffectEnabled(effectId: EffectId, enabled: boolean): void {
    const fx = getSynth().getEffectsChain();
    switch (effectId) {
      case 'compressor': fx.setCompressor({ enabled }); break;
      case 'eq3': fx.setEQ3({ enabled }); break;
      case 'bitcrusher': fx.setBitCrusher({ enabled }); break;
      case 'distortion': fx.setDistortion({ enabled }); break;
      case 'autowah': fx.setAutoWah({ enabled }); break;
      case 'autofilter': fx.setAutoFilter({ enabled }); break;
      case 'phaser': fx.setPhaser({ enabled }); break;
      case 'chorus': fx.setChorus({ enabled }); break;
      case 'tremolo': fx.setTremolo({ enabled }); break;
      case 'vibrato': fx.setVibrato({ enabled }); break;
      case 'freqshift': fx.setFreqShift({ enabled }); break;
      case 'pitchshift': fx.setPitchShift({ enabled }); break;
      case 'delay': fx.setDelay({ enabled }); break;
      case 'reverb': fx.setReverb({ enabled }); break;
      case 'stereowidener': fx.setStereoWidener({ enabled }); break;
    }
    this.updateEffectModule(effectId);
  }

  private updateEffectModule(effectId: EffectId): void {
    const module = document.getElementById(`effect-module-${effectId}`);
    if (!module) return;
    const effectsChain = getSynth().getEffectsChain();
    const isEnabled = effectsChain.isEnabled(effectId);
    module.classList.toggle('enabled', isEnabled);
    module.classList.toggle('disabled', !isEnabled);
    module.querySelector('.footswitch')?.classList.toggle('on', isEnabled);
    this.updateKnobValues(module, effectId, effectsChain.getEffectParams(effectId));
  }

  private updateKnobValues(module: HTMLElement, effectId: EffectId, params: any): void {
    module.querySelectorAll('.mini-knob').forEach(knob => {
      const knobEl = knob as HTMLElement;
      const param = knobEl.dataset.param || '';
      const min = parseFloat(knobEl.dataset.min || '0');
      const max = parseFloat(knobEl.dataset.max || '100');
      
      let value = this.getKnobValueFromParams(effectId, param, params);
      knobEl.dataset.value = String(value);
      knobEl.style.transform = `rotate(${-135 + ((value - min) / (max - min)) * 270}deg)`;
    });
  }

  private getKnobValueFromParams(effectId: EffectId, param: string, params: any): number {
    switch (effectId) {
      case 'compressor': { const p = params as CompressorParams; return param === 'threshold' ? (p.threshold + 60) * (100/60) : p.ratio * 5; }
      case 'eq3': { const p = params as EQ3Params; return param === 'low' ? p.low + 50 : param === 'mid' ? p.mid + 50 : p.high + 50; }
      case 'bitcrusher': { const p = params as BitCrusherParams; return param === 'bits' ? p.bits * 6 : p.wet * 100; }
      case 'distortion': { const p = params as DistortionParams; return param === 'amount' ? p.amount * 100 : p.wet * 100; }
      case 'autowah': { const p = params as AutoWahParams; return param === 'baseFrequency' ? p.baseFrequency / 10 : param === 'octaves' ? p.octaves * 10 : p.wet * 100; }
      case 'autofilter': { const p = params as AutoFilterParams; return param === 'frequency' ? p.frequency * 10 : param === 'depth' ? p.depth * 100 : p.wet * 100; }
      case 'phaser': { const p = params as PhaserParams; return param === 'frequency' ? p.frequency * 10 : param === 'octaves' ? p.octaves : p.wet * 100; }
      case 'chorus': { const p = params as ChorusParams; return param === 'frequency' ? p.frequency * 10 : param === 'depth' ? p.depth * 100 : p.wet * 100; }
      case 'tremolo': { const p = params as TremoloParams; return param === 'frequency' ? p.frequency * 5 : param === 'depth' ? p.depth * 100 : p.wet * 100; }
      case 'vibrato': { const p = params as VibratoParams; return param === 'frequency' ? p.frequency * 5 : param === 'depth' ? p.depth * 100 : p.wet * 100; }
      case 'freqshift': { const p = params as FreqShiftParams; return param === 'frequency' ? (p.frequency + 500) / 10 : p.wet * 100; }
      case 'pitchshift': { const p = params as PitchShiftParams; return param === 'pitch' ? (p.pitch + 12) * (100/24) : p.wet * 100; }
      case 'delay': { const p = params as DelayParams; return param === 'time' ? p.time * 100 : param === 'feedback' ? p.feedback * 100 : p.wet * 100; }
      case 'reverb': { const p = params as ReverbParams; return param === 'decay' ? p.decay * 20 : p.wet * 100; }
      case 'stereowidener': { const p = params as StereoWidenerParams; return param === 'width' ? p.width * 100 : p.wet * 100; }
      default: return 0;
    }
  }
}

export function createEffectsPanel(containerId: string): EffectsPanel {
  return new EffectsPanel(containerId);
}
