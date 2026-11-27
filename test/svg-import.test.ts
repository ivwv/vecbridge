import { describe, expect, it } from 'vitest';

import {
  DrawingDocument,
  DxfExporter,
  SvgExporter,
  SvgImporter,
  parseSvgToDocument,
  svgToDxfBytes,
  svgToDxfText,
  textCodec,
  type CircleCommand,
  type LineCommand,
  type PolylineCommand,
  type TextCommand,
} from '../src/index';

describe('parseSvgToDocument & SvgImporter', () => {
  it('parses basic geometric primitives and flips Y by viewBox', () => {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
      <svg xmlns="http://www.w3.org/2000/svg" width="100mm" height="80mm" viewBox="0 0 100 80">
        <!-- background should be ignored by default -->
        <rect x="0" y="0" width="100" height="80" fill="#ffffff" />
        <g id="OUTLINE" stroke="#ff0000" stroke-width="0.4" fill="none">
          <line x1="0" y1="10" x2="50" y2="10" stroke-dasharray="2,1" />
          <rect x="10" y="20" width="30" height="20" />
          <circle cx="70" cy="30" r="10" />
          <ellipse cx="70" cy="60" rx="12" ry="6" />
          <polyline points="5,5 15,15 25,5" />
          <polygon points="80,10 90,20 80,20" />
        </g>
        <g id="LABELS" fill="#000000">
          <text x="50" y="40" font-size="4" font-weight="bold" text-anchor="middle" dominant-baseline="central">国标中文 &amp; 标注</text>
        </g>
      </svg>`;

    const doc = parseSvgToDocument(svg);
    expect(doc.layers.map((l) => l.name)).toEqual(['OUTLINE', 'LABELS']);
    expect(doc.commands).toHaveLength(7);

    const line = doc.commands[0] as LineCommand;
    expect(line).toMatchObject({
      type: 'line',
      layer: 'OUTLINE',
      color: 1,
      linetype: 'DASHED',
      x1: 0,
      y1: 70,
      x2: 50,
      y2: 70,
    });

    const rect = doc.commands[1] as PolylineCommand;
    expect(rect.type).toBe('polyline');
    expect(rect.closed).toBe(true);
    expect(rect.points).toHaveLength(4);
    expect(rect.lineWidth).toBeCloseTo(0.4, 6);

    const circle = doc.commands[2] as CircleCommand;
    expect(circle).toMatchObject({ type: 'circle', cx: 70, cy: 50, r: 10, color: 1 });

    const ellipse = doc.commands[3] as PolylineCommand;
    expect(ellipse.type).toBe('polyline');
    expect(ellipse.closed).toBe(true);
    expect(ellipse.points.length).toBeGreaterThanOrEqual(12);

    const poly = doc.commands[4] as PolylineCommand;
    expect(poly.closed).toBe(false);
    expect(poly.points).toHaveLength(3);

    const polygon = doc.commands[5] as PolylineCommand;
    expect(polygon.closed).toBe(true);
    expect(polygon.points).toHaveLength(3);

    const text = doc.commands[6] as TextCommand;
    expect(text).toMatchObject({
      type: 'text',
      layer: 'LABELS',
      color: 7,
      x: 50,
      y: 40,
      h: 4,
      text: '国标中文 & 标注',
      hAlign: 1,
      vAlign: 2,
      bold: true,
    });
  });

  it('parses path commands including cubic/quadratic Beziers, smooth curves and compact arc flags', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100">
        <path d="M10 10 H40 V30 L20 40 Z" stroke="#000" fill="none" />
        <path d="M 10 80 C 30 20 70 20 90 80 S 150 140 170 80" stroke="#0000ff" fill="none" />
        <path d="M 10 50 Q 40 10 70 50 T 130 50" stroke="#00ff00" fill="none" />
        <path d="M50 50 a20,10 0 0140,0" stroke="#ff0000" fill="none" />
      </svg>`;

    const doc = parseSvgToDocument(svg, { curveTolerance: 0.1 });
    expect(doc.commands).toHaveLength(4);

    const [pRect, pCubic, pQuad, pArc] = doc.commands as PolylineCommand[];
    expect(pRect.closed).toBe(true);
    expect(pRect.points).toHaveLength(4);

    expect(pCubic.closed).toBe(false);
    expect(pCubic.color).toBe(5);
    expect(pCubic.points.length).toBeGreaterThan(8);
    expect(pCubic.points[0]).toEqual([10, 20]);
    expect(pCubic.points[pCubic.points.length - 1][0]).toBeCloseTo(170, 4);
    expect(pCubic.points[pCubic.points.length - 1][1]).toBeCloseTo(20, 4);

    expect(pQuad.points.length).toBeGreaterThan(6);
    expect(pQuad.points[pQuad.points.length - 1][0]).toBeCloseTo(130, 4);
    expect(pQuad.points[pQuad.points.length - 1][1]).toBeCloseTo(50, 4);

    // Compact arc flag "0140,0" must parse as largeArc=0, sweep=1, dx=40, dy=0
    expect(pArc.points.length).toBeGreaterThan(4);
    expect(pArc.points[0]).toEqual([50, 50]);
    expect(pArc.points[pArc.points.length - 1][0]).toBeCloseTo(90, 4);
    expect(pArc.points[pArc.points.length - 1][1]).toBeCloseTo(50, 4);
  });

  it('applies nested transforms, converts non-uniform scaled circles to polylines, and expands <use>', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <defs>
          <line id="seg" x1="0" y1="0" x2="10" y2="0" stroke="#000" />
        </defs>
        <g transform="translate(20, 30)">
          <circle cx="0" cy="0" r="10" transform="scale(2, 1)" stroke="#ff0000" fill="none" />
          <use href="#seg" x="5" y="10" />
        </g>
      </svg>`;

    const doc = parseSvgToDocument(svg);
    expect(doc.commands).toHaveLength(2);

    const stretchedCircle = doc.commands[0] as PolylineCommand;
    expect(stretchedCircle.type).toBe('polyline');
    expect(stretchedCircle.closed).toBe(true);
    const xs = stretchedCircle.points.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(40, 1);

    const usedLine = doc.commands[1] as LineCommand;
    expect(usedLine.type).toBe('line');
    expect(usedLine.x1).toBeCloseTo(25, 6);
    expect(usedLine.y1).toBeCloseTo(60, 6);
    expect(usedLine.x2).toBeCloseTo(35, 6);
    expect(usedLine.y2).toBeCloseTo(60, 6);
  });

  it('handles rounded rects, display:none, fillMode, layerBy, and physical unit scaling', () => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="10cm" height="5cm" viewBox="0 0 100 50">
        <rect x="0" y="0" width="100" height="50" fill="#eee" />
        <rect x="10" y="10" width="20" height="10" rx="3" ry="3" style="stroke: #0000ff; fill: none" />
        <rect x="50" y="10" width="10" height="10" fill="#ff0000" stroke="none" />
        <line x1="0" y1="0" x2="10" y2="10" stroke="#000" style="display: none" />
      </svg>`;

    // 10cm = 100mm over viewBox 100 -> unitScale = 1; fillMode:'ignore' skips fill-only rect
    const ignored = new SvgImporter({ fillMode: 'ignore', layerBy: 'color' }).parse(svg);
    expect(ignored.commands).toHaveLength(1);
    expect(ignored.commands[0].type).toBe('polyline');
    expect((ignored.commands[0] as PolylineCommand).points.length).toBeGreaterThan(4);
    expect(ignored.commands[0].layer).toBe('COLOR_5');

    // ignoreBackground: false + fillMode: 'outline' keeps both filled rects
    const kept = parseSvgToDocument(svg, { ignoreBackground: false, fillMode: 'outline' });
    expect(kept.commands).toHaveLength(3);
  });

  it('round-trips DrawingDocument -> SvgExporter -> parseSvgToDocument -> DxfExporter', () => {
    const source = new DrawingDocument({ extents: { minX: 0, minY: 0, maxX: 200, maxY: 120 } });
    source.addLayer('FRAME', 7, 'CONTINUOUS');
    source.addLayer('GRID', 8, 'DASHED');
    source.addRect(0, 0, 200, 120, 'FRAME', 7, 0.35);
    source.addLine(10, 20, 190, 20, 'GRID', 8, 'DASHED');
    source.addCircle(100, 60, 25, 'FRAME', 1);
    source.addText(100, 95, 5, '往返测试', 'FRAME', 7, 30, 1, 2, 0.85, { bold: true });

    const exportedSvg = SvgExporter.toText(source, { theme: 'dark', mode: 'export' });
    const imported = parseSvgToDocument(exportedSvg, {
      yAxis: 'negate',
      fontSizeScale: 1 / 1.04,
    });

    expect(imported.commands).toHaveLength(4);
    const circle = imported.commands.find((c) => c.type === 'circle') as CircleCommand;
    expect(circle.cx).toBeCloseTo(100, 3);
    expect(circle.cy).toBeCloseTo(60, 3);
    expect(circle.r).toBeCloseTo(25, 3);
    expect(circle.color).toBe(1);

    const text = imported.commands.find((c) => c.type === 'text') as TextCommand;
    expect(text.text).toBe('往返测试');
    expect(text.x).toBeCloseTo(100, 3);
    expect(text.y).toBeCloseTo(95, 3);
    expect(text.h).toBeCloseTo(5, 3);
    expect(text.rot).toBeCloseTo(30, 3);
    expect(text.widthFactor).toBeCloseTo(0.85, 3);
    expect(text.hAlign).toBe(1);
    expect(text.vAlign).toBe(2);
    expect(text.bold).toBe(true);

    const dxfBytes = DxfExporter.toBytes(imported, { encoding: 'gbk', font: 'gbenor' });
    const decoded = textCodec.decode(dxfBytes, 'gbk');
    expect(decoded).toContain('gbenor.shx');
    expect(decoded).toContain('gbcbig.shx');
    expect(decoded).toContain('往返测试');
    expect(decoded).toContain('EOF');
  });

  it('converts SVG directly to DXF text and bytes via svgToDxfText / svgToDxfBytes', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50">
      <line x1="0" y1="0" x2="100" y2="50" stroke="#d92121" />
      <text x="50" y="25" font-size="4" fill="#000">中文矢量标注</text>
    </svg>`;

    const text = svgToDxfText(svg, { font: 'tssd', newline: 'lf' });
    expect(text).toContain('tssdeng.shx');
    expect(text).toContain('tssdchn.shx');
    expect(text).toContain('LINE');
    expect(text).toContain('TEXT');

    const bytes = svgToDxfBytes(svg, { encoding: 'gbk', font: 'tssd' });
    const decoded = textCodec.decode(bytes, 'gbk');
    expect(decoded).toContain('ANSI_936');
    expect(decoded).toContain('中文矢量标注');
  });

  it('supports fillMode solid to emit DXF R12 SOLID entities for filled SVG shapes', () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 60">
      <rect x="10" y="10" width="30" height="20" fill="#ff0000" stroke="none" />
      <polygon points="60,10 90,10 75,40" fill="#0000ff" stroke="#000000" />
    </svg>`;

    const doc = parseSvgToDocument(svg, { fillMode: 'solid' });
    const solids = doc.commands.filter((c) => c.type === 'solid');
    const polylines = doc.commands.filter((c) => c.type === 'polyline');
    expect(solids).toHaveLength(2);
    // Only the stroked polygon emits an outline polyline in addition to its solid fill
    expect(polylines).toHaveLength(1);

    const dxf = DxfExporter.toText(doc, { newline: 'lf' });
    expect(dxf.match(/  0\nSOLID\n/g)?.length).toBe(2);
  });
});
