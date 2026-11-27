import { describe, expect, it } from 'vitest';

import {
  createVectorContext,
  parseDxfToDocument,
  recordCanvasContext,
  textCodec,
  type Canvas2DTarget,
  type CircleCommand,
  type LineCommand,
  type PolylineCommand,
  type SolidCommand,
  type TextCommand,
} from '../src/index';

function createMockCanvas2D(width = 400, height = 200): {
  target: Canvas2DTarget;
  log: string[];
} {
  const log: string[] = [];
  const target: Canvas2DTarget = {
    canvas: { width, height },
    strokeStyle: '#000',
    fillStyle: '#000',
    lineWidth: 1,
    save: () => log.push('save'),
    restore: () => log.push('restore'),
    scale: (x, y) => log.push(`scale(${x},${y})`),
    rotate: (a) => log.push(`rotate(${a.toFixed(2)})`),
    translate: (x, y) => log.push(`translate(${x},${y})`),
    transform: () => log.push('transform'),
    setTransform: () => log.push('setTransform'),
    resetTransform: () => log.push('resetTransform'),
    beginPath: () => log.push('beginPath'),
    closePath: () => log.push('closePath'),
    moveTo: (x, y) => log.push(`moveTo(${x},${y})`),
    lineTo: (x, y) => log.push(`lineTo(${x},${y})`),
    rect: () => log.push('rect'),
    roundRect: () => log.push('roundRect'),
    arc: () => log.push('arc'),
    arcTo: () => log.push('arcTo'),
    ellipse: () => log.push('ellipse'),
    quadraticCurveTo: () => log.push('quadraticCurveTo'),
    bezierCurveTo: () => log.push('bezierCurveTo'),
    stroke: () => log.push('stroke'),
    fill: () => log.push('fill'),
    strokeRect: () => log.push('strokeRect'),
    fillRect: () => log.push('fillRect'),
    clearRect: () => log.push('clearRect'),
    fillText: (t) => log.push(`fillText(${t})`),
    strokeText: (t) => log.push(`strokeText(${t})`),
    setLineDash: () => log.push('setLineDash'),
    measureText: (t) => ({ width: t.length * 8 }),
  };
  return { target, log };
}

describe('createVectorContext (headless Canvas 2D -> IR / DXF / SVG)', () => {
  it('records lines, dashed lines, exact circles, rounded rects, arcs, arcTo, ellipses and Beziers with Y-flip', () => {
    const ctx = createVectorContext({ width: 200, height: 100, pxToMm: 1 });

    // Background clear fillRect covering whole canvas must be ignored by default
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 100);
    expect(ctx.commandCount).toBe(0);

    // 1. Dashed red line on custom layer GRID (canvas y=10 -> world y=90)
    ctx.setLayer('GRID');
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 0.25;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(190, 10);
    ctx.stroke();

    // 2. Exact circle (full arc with hairline stroke)
    ctx.setLayer('SHAPES');
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0000ff';
    ctx.beginPath();
    ctx.arc(50, 40, 15, 0, Math.PI * 2);
    ctx.stroke();

    // 3. RoundRect filled (SOLID) + stroked (closed polyline)
    ctx.beginPath();
    ctx.roundRect(80, 20, 40, 20, 5);
    ctx.fillStyle = '#00ff00';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.stroke();

    // 4. arcTo corner + quadratic + cubic Beziers
    ctx.beginPath();
    ctx.moveTo(10, 80);
    ctx.arcTo(40, 80, 40, 50, 8);
    ctx.quadraticCurveTo(70, 30, 100, 80);
    ctx.bezierCurveTo(120, 95, 150, 60, 180, 80);
    ctx.stroke();

    // 5. Rotated ellipse
    ctx.beginPath();
    ctx.ellipse(150, 35, 18, 8, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    // 6. Bold centered Chinese text
    ctx.setLayer('TEXT');
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 10px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('矢量画布测试', 100, 90);

    const doc = ctx.toDocument();
    expect(doc.extents).toEqual({ minX: 0, minY: 0, maxX: 200, maxY: 100 });

    const line = doc.commands.find((c): c is LineCommand => c.type === 'line');
    expect(line).toMatchObject({
      layer: 'GRID',
      color: 1,
      linetype: 'DASHED',
      x1: 10,
      y1: 90,
      x2: 190,
      y2: 90,
    });

    const circle = doc.commands.find((c): c is CircleCommand => c.type === 'circle');
    expect(circle).toMatchObject({
      layer: 'SHAPES',
      color: 5,
      cx: 50,
      cy: 60,
      r: 15,
    });

    const solids = doc.commands.filter((c): c is SolidCommand => c.type === 'solid');
    expect(solids.length).toBeGreaterThan(0);
    expect(solids[0].color).toBe(3);

    const text = doc.commands.find((c): c is TextCommand => c.type === 'text');
    expect(text).toMatchObject({
      layer: 'TEXT',
      text: '矢量画布测试',
      x: 100,
      y: 10,
      hAlign: 1,
      vAlign: 2,
      bold: true,
    });
    expect(text!.h).toBeCloseTo(7.8, 4);

    // One-step export to DXF bytes (GBK) and SVG
    const dxfBytes = ctx.toDxfBytes({ encoding: 'gbk', font: 'gbenor' });
    expect(textCodec.decode(dxfBytes, 'gbk')).toContain('矢量画布测试');
    const reparsed = parseDxfToDocument(dxfBytes);
    expect(reparsed.commands.some((c) => c.type === 'circle')).toBe(true);

    const svg = ctx.toSvgText();
    expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
    expect(svg).toContain('矢量画布测试');
  });

  it('captures path geometry under CTM at path-build time (matching HTML5 Canvas spec) and restores layer/state on restore()', () => {
    const ctx = createVectorContext({ width: 100, height: 100, pxToMm: 1 });

    ctx.setLayer('OUTER');
    ctx.save();
    ctx.setLayer('INNER');
    ctx.translate(40, 30);
    ctx.rotate(Math.PI / 2); // +90° CW in Canvas -> local (10, 0) becomes (40, 40) -> world (40, 60)
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(10, 0);
    // Restore BEFORE stroke(): path must keep its transformed coordinates, while layer returns to OUTER
    ctx.restore();
    expect(ctx.getLayer()).toBe('OUTER');
    ctx.stroke();

    const doc = ctx.toDocument();
    // pxToMm=1 且默认 lineWidth=1 -> 1mm 粗线自动以两顶点 POLYLINE 保留线宽
    const poly = doc.commands[0] as PolylineCommand;
    expect(poly.type).toBe('polyline');
    expect(poly.layer).toBe('OUTER');
    expect(poly.lineWidth).toBeCloseTo(1, 4);
    expect(poly.points[0][0]).toBeCloseTo(40, 4);
    expect(poly.points[0][1]).toBeCloseTo(70, 4);
    expect(poly.points[1][0]).toBeCloseTo(40, 4);
    expect(poly.points[1][1]).toBeCloseTo(60, 4);
  });

  it('respects fillMode (outline / ignore), fitWidthMm, layerBy: color, and clearRect frame reset', () => {
    const ctx = createVectorContext({
      width: 400,
      height: 200,
      fitWidthMm: 200,
      fillMode: 'outline',
      layerBy: 'color',
    });

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(20, 20, 60, 40);
    expect(ctx.commandCount).toBe(1);

    const first = ctx.toDocument().commands[0] as PolylineCommand;
    expect(first.type).toBe('polyline');
    expect(first.closed).toBe(true);
    expect(first.layer).toBe('COLOR_1');

    // Full-canvas clearRect wipes previous frame commands
    ctx.clearRect(0, 0, 400, 200);
    expect(ctx.commandCount).toBe(0);

    // Non-blocking ignore mode skips fills
    const ignored = createVectorContext({ width: 100, height: 100, pxToMm: 1, fillMode: 'ignore' });
    ignored.fillStyle = '#ff0000';
    ignored.fillRect(10, 10, 20, 20);
    expect(ignored.commandCount).toBe(0);
  });

  it('estimates text width in headless mode via measureText', () => {
    const ctx = createVectorContext({ width: 200, height: 100 });
    ctx.font = '20px sans-serif';
    expect(ctx.measureText('AB').width).toBeGreaterThan(15);
    expect(ctx.measureText('中文').width).toBeGreaterThan(ctx.measureText('AB').width);
  });
});

describe('recordCanvasContext (Tee dual-write proxy)', () => {
  it('forwards every drawing & transform call to the underlying real context while recording IR', () => {
    const { target, log } = createMockCanvas2D(300, 150);
    const ctx = recordCanvasContext(target, { fitWidthMm: 150 });

    ctx.save();
    ctx.translate(10, 20);
    ctx.strokeStyle = '#0f5acc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(100, 0);
    ctx.stroke();
    ctx.fillStyle = '#d92121';
    ctx.font = '14px sans-serif';
    ctx.fillText('实时双写', 20, 30);
    ctx.restore();

    expect(log).toContain('save');
    expect(log).toContain('translate(10,20)');
    expect(log).toContain('moveTo(0,0)');
    expect(log).toContain('lineTo(100,0)');
    expect(log).toContain('stroke');
    expect(log).toContain('fillText(实时双写)');
    expect(log).toContain('restore');
    expect(ctx.measureText('abcd').width).toBe(32);

    const doc = ctx.toDocument();
    expect(doc.extents).toEqual({ minX: 0, minY: 0, maxX: 150, maxY: 75 });
    expect(doc.commands).toHaveLength(2);
    expect(doc.commands[0].type).toBe('polyline'); // thick stroke (2px * 0.5mm/px = 1mm > 0.35)
    expect(doc.commands[1]).toMatchObject({ type: 'text', text: '实时双写', color: 1 });
  });
});
