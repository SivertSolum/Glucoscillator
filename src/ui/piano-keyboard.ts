// Virtual Piano Keyboard
// On-screen clickable piano with visual feedback

import { getSynth } from '../synthesis/synth-engine';
import { getKeyboardHandler } from '../input/keyboard-handler';

interface PianoKey {
  note: string;
  isBlack: boolean;
  keyboardShortcut?: string;
}

export class PianoKeyboard {
  private container: HTMLElement;
  private keys: Map<string, HTMLElement> = new Map();
  private activeNotes: Set<string> = new Set();
  private startOctave: number;
  private octaveCount: number;

  constructor(containerId: string, startOctave: number = 3, octaveCount: number = 3) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }
    this.container = container;
    this.startOctave = startOctave;
    this.octaveCount = octaveCount;
  }

  /**
   * Build and render the piano keyboard
   */
  render(): void {
    this.container.innerHTML = '';
    this.container.className = 'piano-keyboard';
    this.keys.clear();

    const keyboardHandler = getKeyboardHandler();

    for (let octave = this.startOctave; octave < this.startOctave + this.octaveCount; octave++) {
      const octaveKeys = this.getOctaveKeys(octave);
      
      for (const keyInfo of octaveKeys) {
        const keyElement = this.createKeyElement(keyInfo, keyboardHandler);
        this.container.appendChild(keyElement);
        this.keys.set(keyInfo.note, keyElement);
      }
    }

    // Add extra C at the end
    const finalC: PianoKey = { 
      note: `C${this.startOctave + this.octaveCount}`, 
      isBlack: false,
      keyboardShortcut: keyboardHandler.getKeyForNote(`C${this.startOctave + this.octaveCount}`)
    };
    const finalKeyElement = this.createKeyElement(finalC, keyboardHandler);
    this.container.appendChild(finalKeyElement);
    this.keys.set(finalC.note, finalKeyElement);
  }

  /**
   * Get keys for one octave
   */
  private getOctaveKeys(octave: number): PianoKey[] {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const kbHandler = getKeyboardHandler();
    
    return noteNames.map(name => ({
      note: `${name}${octave}`,
      isBlack: name.includes('#'),
      keyboardShortcut: kbHandler.getKeyForNote(`${name}${octave}`)
    }));
  }

  /**
   * Create a single piano key element
   */
  private createKeyElement(keyInfo: PianoKey, _keyboardHandler: any): HTMLElement {
    const key = document.createElement('div');
    key.className = `piano-key ${keyInfo.isBlack ? 'black-key' : 'white-key'}`;
    key.dataset.note = keyInfo.note;
    
    // Add keyboard shortcut label
    if (keyInfo.keyboardShortcut) {
      const shortcutLabel = document.createElement('span');
      shortcutLabel.className = 'key-shortcut';
      shortcutLabel.textContent = keyInfo.keyboardShortcut.toUpperCase();
      key.appendChild(shortcutLabel);
    }

    // Add note label
    const noteLabel = document.createElement('span');
    noteLabel.className = 'key-note';
    noteLabel.textContent = keyInfo.note;
    key.appendChild(noteLabel);

    // Mouse/touch events
    key.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.handleNoteOn(keyInfo.note);
    });

    key.addEventListener('mouseup', () => {
      this.handleNoteOff(keyInfo.note);
    });

    key.addEventListener('mouseleave', () => {
      if (this.activeNotes.has(keyInfo.note)) {
        this.handleNoteOff(keyInfo.note);
      }
    });

    key.addEventListener('mouseenter', (e) => {
      if (e.buttons === 1) { // Left mouse button held
        this.handleNoteOn(keyInfo.note);
      }
    });

    // Touch events
    key.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleNoteOn(keyInfo.note);
    });

    key.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.handleNoteOff(keyInfo.note);
    });

    return key;
  }

  /**
   * Handle note on
   */
  private handleNoteOn(note: string): void {
    if (this.activeNotes.has(note)) return;
    
    const synth = getSynth();
    synth.noteOn(note);
    this.activeNotes.add(note);
    this.setKeyActive(note, true);
  }

  /**
   * Handle note off
   */
  private handleNoteOff(note: string): void {
    if (!this.activeNotes.has(note)) return;
    
    const synth = getSynth();
    synth.noteOff(note);
    this.activeNotes.delete(note);
    this.setKeyActive(note, false);
  }

  /**
   * Set visual active state for a key
   */
  setKeyActive(note: string, active: boolean): void {
    const keyElement = this.keys.get(note);
    if (keyElement) {
      keyElement.classList.toggle('active', active);
    }
  }

  /**
   * Clear all active states
   */
  clearAllActive(): void {
    for (const note of this.activeNotes) {
      this.setKeyActive(note, false);
    }
    this.activeNotes.clear();
  }
}

// Factory function
export function createPianoKeyboard(containerId: string): PianoKeyboard {
  const keyboard = new PianoKeyboard(containerId, 3, 3);
  keyboard.render();
  return keyboard;
}

