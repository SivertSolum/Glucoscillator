// Waveform Display
// Canvas-based visualization of the current glucose wavetable

import type { DailyGlucoseData } from '../types';
import { getWaveformForDisplay } from '../synthesis/wavetable';

export class WaveformDisplay {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private currentData: DailyGlucoseData | null = null;
  private animationFrame: number | null = null;
  private playheadPosition: number = 0;
  private isPlaying: boolean = false;

  constructor(containerId: string) {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element #${containerId} not found`);
    }

    // Create canvas
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'waveform-canvas';
    container.appendChild(this.canvas);

    const ctx = this.canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not get canvas 2D context');
    }
    this.ctx = ctx;

    // Handle resize
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);
    this.handleResize();
  }

  /**
   * Handle canvas resize
   */
  private handleResize(): void {
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    if (!rect) return;

    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);

    this.draw();
  }

  /**
   * Set the day data to display
   */
  setData(dayData: DailyGlucoseData): void {
    this.currentData = dayData;
    this.draw();
  }

  /**
   * Clear the display
   */
  clear(): void {
    this.currentData = null;
    this.draw();
  }

  /**
   * Draw the waveform
   */
  draw(): void {
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);

    // Clear canvas
    this.ctx.clearRect(0, 0, width, height);

    // Draw background grid
    this.drawGrid(width, height);

    if (!this.currentData || !this.currentData.wavetable) {
      this.drawEmptyState(width, height);
      return;
    }

    // Draw waveform
    this.drawWaveform(width, height);

    // Draw info
    this.drawInfo(width, height);
  }

  /**
   * Draw oscilloscope-style background grid
   */
  private drawGrid(width: number, height: number): void {
    // Dark oscilloscope background with subtle vignette
    const bgGradient = this.ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    bgGradient.addColorStop(0, '#0c0a08');
    bgGradient.addColorStop(1, '#050403');
    this.ctx.fillStyle = bgGradient;
    this.ctx.fillRect(0, 0, width, height);

    // Phosphor green grid lines (oscilloscope style)
    const gridColor = 'rgba(143, 188, 143, 0.12)';
    const gridColorBright = 'rgba(143, 188, 143, 0.2)';
    this.ctx.lineWidth = 1;

    // Vertical lines - one per hour with major divisions
    const vLines = 24;
    for (let i = 0; i <= vLines; i++) {
      const x = (i / vLines) * width;
      const isMajor = i % 6 === 0;
      this.ctx.strokeStyle = isMajor ? gridColorBright : gridColor;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
      this.ctx.stroke();
    }

    // Horizontal lines with major divisions
    const hLines = 8;
    for (let i = 0; i <= hLines; i++) {
      const y = (i / hLines) * height;
      const isMajor = i === hLines / 2 || i === 0 || i === hLines;
      this.ctx.strokeStyle = isMajor ? gridColorBright : gridColor;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
      this.ctx.stroke();
    }

    // Center crosshair emphasis
    this.ctx.strokeStyle = 'rgba(232, 168, 124, 0.3)';
    this.ctx.lineWidth = 1;
    
    // Horizontal center line
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    this.ctx.lineTo(width, height / 2);
    this.ctx.stroke();

    // Small center tick marks
    const tickSize = 6;
    for (let i = 0; i <= vLines; i++) {
      const x = (i / vLines) * width;
      this.ctx.beginPath();
      this.ctx.moveTo(x, height / 2 - tickSize);
      this.ctx.lineTo(x, height / 2 + tickSize);
      this.ctx.stroke();
    }
  }

  /**
   * Draw empty state message (oscilloscope style)
   */
  private drawEmptyState(width: number, height: number): void {
    // Draw "NO SIGNAL" style message
    this.ctx.fillStyle = 'rgba(143, 188, 143, 0.4)';
    this.ctx.font = "bold 12px 'IBM Plex Mono', monospace";
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('NO SIGNAL', width / 2, height / 2 - 10);
    
    this.ctx.fillStyle = 'rgba(143, 188, 143, 0.25)';
    this.ctx.font = "10px 'IBM Plex Mono', monospace";
    this.ctx.fillText('SELECT A DAY TO VIEW WAVEFORM', width / 2, height / 2 + 10);
    
    // Draw a flat line at center
    this.ctx.strokeStyle = 'rgba(143, 188, 143, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([2, 4]);
    this.ctx.beginPath();
    this.ctx.moveTo(width * 0.2, height / 2);
    this.ctx.lineTo(width * 0.8, height / 2);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  /**
   * Draw the waveform path with warm organic colors
   */
  private drawWaveform(width: number, height: number): void {
    if (!this.currentData?.wavetable) return;

    const points = getWaveformForDisplay(this.currentData.wavetable, Math.floor(width));
    const padding = 20;
    const drawHeight = height - padding * 2;

    // Create warm organic gradient
    const gradient = this.ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, '#c97064');    // High glucose - warm red/coral
    gradient.addColorStop(0.25, '#d4a574'); // Above target - warm amber
    gradient.addColorStop(0.5, '#8fbc8f');  // In range - sage green
    gradient.addColorStop(0.75, '#d4a574'); // Below target - warm amber
    gradient.addColorStop(1, '#6b9ac4');    // Low glucose - muted blue

    // Draw soft glow underneath first
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    for (let i = 0; i < points.length; i++) {
      const x = (i / (points.length - 1)) * width;
      const y = padding + ((1 - points[i]) / 2) * drawHeight;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(width, height / 2);
    this.ctx.closePath();

    // Soft glow fill
    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = 0.15;
    this.ctx.shadowColor = '#8fbc8f';
    this.ctx.shadowBlur = 20;
    this.ctx.fill();
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    // Draw filled area with gradient
    this.ctx.beginPath();
    this.ctx.moveTo(0, height / 2);
    for (let i = 0; i < points.length; i++) {
      const x = (i / (points.length - 1)) * width;
      const y = padding + ((1 - points[i]) / 2) * drawHeight;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(width, height / 2);
    this.ctx.closePath();

    this.ctx.fillStyle = gradient;
    this.ctx.globalAlpha = 0.25;
    this.ctx.fill();
    this.ctx.globalAlpha = 1;

    // Draw main stroke with glow
    this.ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = (i / (points.length - 1)) * width;
      const y = padding + ((1 - points[i]) / 2) * drawHeight;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }

    // Outer glow
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 4;
    this.ctx.globalAlpha = 0.3;
    this.ctx.shadowColor = '#e8a87c';
    this.ctx.shadowBlur = 15;
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;
    this.ctx.globalAlpha = 1;

    // Main line
    this.ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = (i / (points.length - 1)) * width;
      const y = padding + ((1 - points[i]) / 2) * drawHeight;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.strokeStyle = gradient;
    this.ctx.lineWidth = 2.5;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Inner bright highlight
    this.ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = (i / (points.length - 1)) * width;
      const y = padding + ((1 - points[i]) / 2) * drawHeight;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    this.ctx.strokeStyle = 'rgba(240, 230, 216, 0.4)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  /**
   * Draw info overlay with warm styling
   */
  private drawInfo(width: number, height: number): void {
    if (!this.currentData) return;

    const stats = this.currentData.stats;
    
    // Time labels - warm cream color
    this.ctx.fillStyle = 'rgba(184, 169, 154, 0.6)';
    this.ctx.font = "10px 'IBM Plex Mono', monospace";
    this.ctx.textAlign = 'left';
    this.ctx.fillText('00:00', 8, height - 6);
    
    this.ctx.textAlign = 'center';
    this.ctx.fillText('12:00', width / 2, height - 6);
    
    this.ctx.textAlign = 'right';
    this.ctx.fillText('24:00', width - 8, height - 6);

    // Glucose range labels with subtle background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(width - 70, 4, 66, 16);
    this.ctx.fillRect(width - 70, height - 24, 66, 16);
    
    this.ctx.fillStyle = 'rgba(232, 168, 124, 0.8)';
    this.ctx.textAlign = 'right';
    this.ctx.fillText(`${Math.round(stats.max)} mg/dL`, width - 8, 15);
    
    this.ctx.fillStyle = 'rgba(107, 154, 196, 0.8)';
    this.ctx.fillText(`${Math.round(stats.min)} mg/dL`, width - 8, height - 11);
  }

  /**
   * Start playhead animation
   */
  startPlayhead(): void {
    this.isPlaying = true;
    this.animatePlayhead();
  }

  /**
   * Stop playhead animation
   */
  stopPlayhead(): void {
    this.isPlaying = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.playheadPosition = 0;
    this.draw();
  }

  /**
   * Animate playhead with warm phosphor glow
   */
  private animatePlayhead(): void {
    if (!this.isPlaying) return;

    this.playheadPosition = (this.playheadPosition + 0.005) % 1;
    this.draw();

    // Draw playhead with warm amber glow
    const width = this.canvas.width / (window.devicePixelRatio || 1);
    const height = this.canvas.height / (window.devicePixelRatio || 1);
    const x = this.playheadPosition * width;

    // Outer glow
    this.ctx.strokeStyle = 'rgba(232, 168, 124, 0.3)';
    this.ctx.lineWidth = 8;
    this.ctx.shadowColor = '#e8a87c';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, height);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Main playhead line
    this.ctx.strokeStyle = 'rgba(240, 230, 216, 0.9)';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, height);
    this.ctx.stroke();

    // Bright center
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(x, 0);
    this.ctx.lineTo(x, height);
    this.ctx.stroke();

    this.animationFrame = requestAnimationFrame(() => this.animatePlayhead());
  }

  /**
   * Dispose of resources
   */
  dispose(): void {
    window.removeEventListener('resize', this.handleResize);
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }
}

// Factory function
export function createWaveformDisplay(containerId: string): WaveformDisplay {
  return new WaveformDisplay(containerId);
}

