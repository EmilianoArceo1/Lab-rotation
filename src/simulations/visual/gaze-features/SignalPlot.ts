import type { GazeSamples, GazeSignal } from '../../../math/statistics/gazeFeatures';
import { GAZE_SIGNAL_ORDER } from '../../../math/statistics/gazeFeatures';

const COLORS: Record<GazeSignal, string> = { Lx:'#4776b9',Ly:'#33916a',Lz:'#7a5ba7',Rx:'#c54a45',Ry:'#b1782f',Rz:'#667078' };

export class SignalPlot {
  readonly element: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly observer: ResizeObserver;
  private samples: GazeSamples;

  constructor(host: HTMLElement, samples: GazeSamples) {
    this.samples = samples;
    this.element = document.createElement('canvas');
    this.element.className = 'signal-canvas';
    this.element.setAttribute('aria-label', 'Six synchronized gaze component time series');
    host.append(this.element);
    const context = this.element.getContext('2d');
    if (!context) throw new Error('Canvas 2D is unavailable.');
    this.context = context;
    this.observer = new ResizeObserver(() => this.draw());
    this.observer.observe(host);
  }

  update(samples: GazeSamples): void { this.samples = samples; this.draw(); }

  private draw(): void {
    const rect = this.element.getBoundingClientRect();
    const ratio = Math.min(devicePixelRatio, 2);
    this.element.width = Math.max(1, rect.width * ratio);
    this.element.height = Math.max(1, rect.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.context.clearRect(0, 0, rect.width, rect.height);
    const rowHeight = rect.height / 6;
    this.context.font = '10px Consolas, monospace';
    GAZE_SIGNAL_ORDER.forEach((signal, row) => {
      const centerY = rowHeight * (row + 0.5);
      this.context.strokeStyle = '#d3d5d4';
      this.context.beginPath();this.context.moveTo(38, centerY);this.context.lineTo(rect.width, centerY);this.context.stroke();
      this.context.fillStyle = COLORS[signal];this.context.fillText(`${signal}(t)`, 4, centerY + 3);
      const values = this.samples[signal];
      if (values.length < 2) return;
      this.context.strokeStyle = COLORS[signal];this.context.lineWidth = 1.7;this.context.beginPath();
      values.forEach((value, index) => {
        const x = 40 + index / Math.max(values.length - 1, 1) * (rect.width - 45);
        const y = centerY - value * rowHeight * 0.36;
        if (index === 0) this.context.moveTo(x, y); else this.context.lineTo(x, y);
      });
      this.context.stroke();
    });
  }

  destroy(): void { this.observer.disconnect(); this.element.remove(); }
}
