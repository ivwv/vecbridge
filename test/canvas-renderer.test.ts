import { describe, expect, it } from 'vitest';

import { DrawingDocument } from '../src/core/document';
import { Camera } from '../src/render/camera';
import { CanvasRenderer } from '../src/render/canvas-renderer';

interface RecordedCall {
  method: string;
  args: unknown[];
  state?: Record<string, unknown>;
}

/**
 * Minimal CanvasRenderingContext2D substitute. jsdom returns `null` from
 * getContext('2d'), so the renderer's main path is otherwise untested.
 */
class RecordingContext {
  readonly calls: RecordedCall[] = [];

  fillStyle = '';
  strokeStyle = '';
  lineWidth = 0;
  font = '';
  textAlign = '';
  textBaseline = '';
  shadowBlur = 0;

  private shadowColorValue = '';
  private dash: number[] = [];

  get shadowColor(): string {
    return this.shadowColorValue;
  }

  set shadowColor(value: string) {
    this.shadowColorValue = value;
    this.calls.push({ method: 'set shadowColor', args: [value] });
  }

  save(): void {
    this.calls.push({ method: 'save', args: [] });
  }

  restore(): void {
    this.calls.push({ method: 'restore', args: [] });
  }

  setTransform(...args: number[]): void {
    this.calls.push({ method: 'setTransform', args });
  }

  fillRect(...args: number[]): void {
    this.calls.push({ method: 'fillRect', args });
  }

  beginPath(): void {
    this.calls.push({ method: 'beginPath', args: [] });
  }

  moveTo(x: number, y: number): void {
    this.calls.push({ method: 'moveTo', args: [x, y] });
  }

  lineTo(x: number, y: number): void {
    this.calls.push({ method: 'lineTo', args: [x, y] });
  }

  arc(...args: number[]): void {
    this.calls.push({ method: 'arc', args });
  }

  closePath(): void {
    this.calls.push({ method: 'closePath', args: [] });
  }

  stroke(): void {
    this.calls.push({
      method: 'stroke',
      args: [this.lineWidth, this.strokeStyle, [...this.dash]],
    });
  }

  fill(): void {
    this.calls.push({ method: 'fill', args: [this.fillStyle] });
  }

  setLineDash(segments: number[]): void {
    this.dash = [...segments];
  }

  translate(x: number, y: number): void {
    this.calls.push({ method: 'translate', args: [x, y] });
  }

  rotate(angle: number): void {
    this.calls.push({ method: 'rotate', args: [angle] });
  }

  scale(x: number, y: number): void {
    this.calls.push({ method: 'scale', args: [x, y] });
  }

  fillText(text: string, x: number, y: number): void {
    this.calls.push({
      method: 'fillText',
      args: [text, x, y],
      state: {
        font: this.font,
        textAlign: this.textAlign,
        textBaseline: this.textBaseline,
        fillStyle: this.fillStyle,
      },
    });
  }
}

const metrics = { width: 800, height: 600, dpr: 1 };

const makeCanvas = (ctx: RecordingContext): HTMLCanvasElement =>
  ({ getContext: () => ctx }) as unknown as HTMLCanvasElement;

const render = (
  doc: DrawingDocument,
  ctx: RecordingContext,
  renderer = new CanvasRenderer({ theme: 'dark' }),
  camera = new Camera()
): Camera => {
  camera.fit(doc.extents, metrics);
  renderer.render(doc, makeCanvas(ctx), camera, metrics);
  return camera;
};

const findCalls = (ctx: RecordingContext, method: string): RecordedCall[] =>
  ctx.calls.filter((call) => call.method === method);

describe('CanvasRenderer', () => {
  it('sets up the dpr transform and fills the background', () => {
    const doc = new DrawingDocument();
    const ctx = new RecordingContext();
    render(doc, ctx);

    const transform = findCalls(ctx, 'setTransform')[0];
    expect(transform.args).toEqual([1, 0, 0, 1, 0, 0]);

    const background = findCalls(ctx, 'fillRect')[0];
    expect(background.args).toEqual([0, 0, 800, 600]);
  });

  it('applies camera-scaled line widths and dash patterns', () => {
    const doc = new DrawingDocument();
    doc.addLayer('HIDDEN', 8, 'DASHED');
    doc.addLine(0, 0, 10, 10, 'HIDDEN');

    const ctx = new RecordingContext();
    const camera = render(doc, ctx);
    const stroke = findCalls(ctx, 'stroke')[0];

    expect(stroke.args[0]).toBeCloseTo(Math.max(0.5, 0.16 * camera.scale), 6);
    expect(stroke.args[2]).toEqual([
      Math.max(1, 1.2 * camera.scale),
      Math.max(1, 0.9 * camera.scale),
    ]);
  });

  it('resolves BYLAYER colours from the layer table', () => {
    const doc = new DrawingDocument();
    doc.addLayer('RED', 1, 'CONTINUOUS');
    doc.addLine(0, 0, 10, 10, 'RED');

    const ctx = new RecordingContext();
    render(doc, ctx);

    expect(findCalls(ctx, 'stroke')[0].args[1]).toBe('#ff3b30');
  });

  it('maps horizontal and vertical text alignment', () => {
    const doc = new DrawingDocument();
    doc.addText(10, 10, 4, 'X', 'L', 7, 0, 2, 1);

    const ctx = new RecordingContext();
    render(doc, ctx);

    const text = findCalls(ctx, 'fillText')[0];
    expect(text.args[0]).toBe('X');
    expect(text.state?.textAlign).toBe('right');
    expect(text.state?.textBaseline).toBe('bottom');
    expect(String(text.state?.font)).toContain('px');
  });

  it('emits bold text for decorated layers', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 4, 'TITLE', 'TITLE', 7, 0, 0, 0);

    const ctx = new RecordingContext();
    render(doc, ctx, new CanvasRenderer({ decorations: { boldLayers: ['TITLE'] } }));

    expect(String(findCalls(ctx, 'fillText')[0].state?.font)).toContain('bold ');
  });

  it('skips text below the minimum pixel size', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 0.1, 'tiny', 'L', 7);

    const ctx = new RecordingContext();
    const camera = new Camera({ scale: 1, offsetX: 0, offsetY: 0 });
    new CanvasRenderer().render(doc, makeCanvas(ctx), camera, metrics);

    expect(findCalls(ctx, 'fillText')).toHaveLength(0);
  });

  it('fills paper with a path and resets the shadow state', () => {
    const doc = new DrawingDocument();
    doc.addRect(0, 0, 100, 100, 'FRAME', 8, 0, { paper: true });

    const ctx = new RecordingContext();
    render(doc, ctx, new CanvasRenderer({ theme: 'light' }));

    const paperFill = findCalls(ctx, 'fill').find((call) => call.args[0] === '#ffffff');
    expect(paperFill).toBeTruthy();

    const shadowValues = findCalls(ctx, 'set shadowColor').map((call) => call.args[0]);
    expect(shadowValues).toContain('rgba(0,0,0,0.12)');
    expect(shadowValues[shadowValues.length - 1]).toBe('transparent');
  });

  it('draws dashed circles and skips non-positive radii or single-point polylines', () => {
    const doc = new DrawingDocument();
    doc.addCircle(20, 20, 5, '0', 1, 'DASHED');
    doc.addCircle(20, 20, -3, '0', 1);
    doc.addPolyline([[0, 0]], '0', 1);
    doc.addPolyline(
      [
        [0, 0],
        [10, 0],
        [10, 10],
      ],
      '0',
      5,
      true,
      0.5
    );

    const ctx = new RecordingContext();
    render(doc, ctx);

    expect(findCalls(ctx, 'arc')).toHaveLength(1);
    expect(findCalls(ctx, 'stroke')).toHaveLength(2);
    expect(findCalls(ctx, 'closePath')).toHaveLength(1);
    expect((findCalls(ctx, 'stroke')[0].args[2] as number[]).length).toBe(2);
  });

  it('maps all vertical text alignments and applies rotation', () => {
    const doc = new DrawingDocument();
    doc.addText(10, 10, 4, 'B', '0', 7, 90, 0, 0);
    doc.addText(10, 20, 4, 'BOT', '0', 7, 0, 1, 1);
    doc.addText(10, 30, 4, 'MID', '0', 7, 0, 1, 2);
    doc.addText(10, 40, 4, 'TOP', '0', 7, 0, 1, 3);

    const ctx = new RecordingContext();
    render(doc, ctx);

    const texts = findCalls(ctx, 'fillText');
    expect(texts.map((item) => item.state?.textBaseline)).toEqual([
      'alphabetic',
      'bottom',
      'middle',
      'top',
    ]);
    const rotations = findCalls(ctx, 'rotate');
    expect(rotations).toHaveLength(1);
    expect(rotations[0].args[0]).toBeCloseTo(-Math.PI / 2, 9);
  });

  it('skips non-positive text heights and fills rotated paper polygons', () => {
    const doc = new DrawingDocument();
    doc.addPolyline(
      [
        [10, 0],
        [20, 10],
        [10, 20],
        [0, 10],
      ],
      'FRAME',
      8,
      true,
      0,
      { paper: true }
    );
    doc.addText(10, 10, 0, 'ZERO', '0', 7);
    doc.addText(10, 10, -3, 'NEG', '0', 7);

    const ctx = new RecordingContext();
    render(doc, ctx, new CanvasRenderer({ theme: 'light' }));

    expect(findCalls(ctx, 'fillText')).toHaveLength(0);
    expect(findCalls(ctx, 'fill')).toHaveLength(1);
    expect(findCalls(ctx, 'moveTo').length).toBeGreaterThanOrEqual(2);
    expect(findCalls(ctx, 'lineTo').length).toBeGreaterThanOrEqual(6);
  });

  it('fills solid commands using resolved BYLAYER color and skips invalid solids', () => {
    const doc = new DrawingDocument();
    doc.addLayer('BG', 3, 'CONTINUOUS');
    doc.addSolidRect(0, 0, 20, 10, 'BG', null);
    doc.commands.push({
      type: 'solid',
      points: [
        [0, 0],
        [NaN, 0],
        [10, 10],
      ],
      layer: 'BG',
      color: 1,
    });

    const ctx = new RecordingContext();
    render(doc, ctx);

    const fills = findCalls(ctx, 'fill');
    expect(fills).toHaveLength(1);
    expect(fills[0].args[0]).toBe('#32d74b');
    expect(findCalls(ctx, 'closePath')).toHaveLength(1);
  });
});
