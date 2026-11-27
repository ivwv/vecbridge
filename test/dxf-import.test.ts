import { describe, expect, it } from 'vitest';

import {
  DrawingDocument,
  DxfExporter,
  DxfImporter,
  dxfToSvgText,
  encodeToGbk,
  encodeToUtf8,
  parseDxfToDocument,
  parseDxfWithReport,
  stripMtextFormatting,
  unescapeDxfText,
  type CircleCommand,
  type LineCommand,
  type PolylineCommand,
  type SolidCommand,
  type TextCommand,
} from '../src/index';

describe('DXF text unescaping & MTEXT formatting', () => {
  it('decodes \\U+XXXX, \\M+5 GBK hex escapes and %% control symbols', () => {
    expect(unescapeDxfText('\\U+4E2D\\U+6587')).toBe('中文');
    // GBK for '中' is 0xD6 0xD0
    expect(unescapeDxfText('\\M+5D6D0')).toBe('中');
    expect(unescapeDxfText('%%c25 %%d90 %%p0.1 %%% %%uTitle%%u')).toBe('Ø25 °90 ±0.1 % Title');
  });

  it('strips AutoCAD MTEXT formatting while preserving paragraphs and fractions', () => {
    const raw =
      '{\\fSimSun|b1|i0;\\C1;\\H2.5;第一行\\P第二行\\~公差\\S+0.1/-0.1;\\P保留\\{括号\\}与\\\\反斜杠}';
    expect(stripMtextFormatting(raw)).toBe('第一行\n第二行 公差+0.1/-0.1\n保留{括号}与\\反斜杠');
  });
});

describe('DXF round-trip & encoding auto-detection', () => {
  it('round-trips DrawingDocument -> DxfExporter (GBK & UTF-8) -> parseDxfToDocument', () => {
    const source = new DrawingDocument({ extents: { minX: 0, minY: 0, maxX: 200, maxY: 120 } });
    source.addLayer('FRAME', 7, 'CONTINUOUS');
    source.addLayer('GRID', 8, 'DASHED');
    source.addLayer('FILL', 3, 'CONTINUOUS');
    source.addLine(0, 0, 200, 0, 'GRID', null, 'DASHED');
    source.addCircle(50, 60, 15, 'FRAME', 1);
    source.addPolyline(
      [
        [10, 10],
        [40, 10],
        [40, 30],
        [10, 30],
      ],
      'FRAME',
      5,
      true,
      0.5
    );
    source.addSolidRect(120, 20, 160, 50, 'FILL', 3);
    source.addText(100, 95, 4.5, '中文工程图标题', 'FRAME', 7, 15, 1, 2, 0.9);

    for (const encoding of ['gbk', 'utf8'] as const) {
      const bytes = DxfExporter.toBytes(source, { encoding, font: 'gbenor' });
      const report = parseDxfWithReport(bytes);
      const doc = report.document;

      expect(report.stats.acadVersion).toBe('AC1009');
      expect(report.stats.detectedEncoding).toBe(encoding === 'gbk' ? 'gbk' : 'utf-8');
      expect(doc.layers.map((l) => l.name)).toEqual(['FRAME', 'GRID', 'FILL']);
      expect(doc.commands).toHaveLength(5);

      const line = doc.commands[0] as LineCommand;
      expect(line).toMatchObject({
        type: 'line',
        layer: 'GRID',
        color: null,
        linetype: 'DASHED',
        x1: 0,
        y1: 0,
        x2: 200,
        y2: 0,
      });

      const circle = doc.commands[1] as CircleCommand;
      expect(circle).toMatchObject({ type: 'circle', cx: 50, cy: 60, r: 15, color: 1 });

      const poly = doc.commands[2] as PolylineCommand;
      expect(poly.closed).toBe(true);
      expect(poly.lineWidth).toBeCloseTo(0.5, 4);
      expect(poly.points).toHaveLength(4);

      // SOLID Z-order must be un-swapped back to contour order
      const solid = doc.commands[3] as SolidCommand;
      expect(solid.points).toEqual([
        [120, 20],
        [160, 20],
        [160, 50],
        [120, 50],
      ]);

      const text = doc.commands[4] as TextCommand;
      expect(text).toMatchObject({
        type: 'text',
        text: '中文工程图标题',
        x: 100,
        y: 95,
        h: 4.5,
        rot: 15,
        hAlign: 1,
        vAlign: 2,
      });
    }
  });

  it('decodes AutoCAD 2007+ (AC1021) UTF-8 files even when $DWGCODEPAGE says ANSI_936', () => {
    const dxf = [
      '  0', 'SECTION', '  2', 'HEADER',
      '  9', '$ACADVER', '  1', 'AC1021',
      '  9', '$DWGCODEPAGE', '  3', 'ANSI_936',
      '  0', 'ENDSEC',
      '  0', 'SECTION', '  2', 'ENTITIES',
      '  0', 'TEXT', '  8', '0', ' 10', '10', ' 20', '20', ' 40', '3', '  1', '新版图纸中文',
      '  0', 'ENDSEC',
      '  0', 'EOF',
    ].join('\n');

    const report = parseDxfWithReport(encodeToUtf8(dxf));
    expect(report.stats.detectedEncoding).toBe('utf-8');
    expect((report.document.commands[0] as TextCommand).text).toBe('新版图纸中文');
  });

  it('disambiguates short GBK text (including UTF-8-valid bytes "模式") under AC1009 + ANSI_936 and handles UTF-8 BOM', () => {
    for (const sample of ['联通', '模式']) {
      const gbkDxf = [
        '  0', 'SECTION', '  2', 'HEADER',
        '  9', '$ACADVER', '  1', 'AC1009',
        '  9', '$DWGCODEPAGE', '  3', 'ANSI_936',
        '  0', 'ENDSEC',
        '  0', 'SECTION', '  2', 'ENTITIES',
        '  0', 'TEXT', '  8', '0', ' 10', '0', ' 20', '0', ' 40', '3', '  1', sample,
        '  0', 'ENDSEC',
        '  0', 'EOF',
      ].join('\n');

      const gbkReport = parseDxfWithReport(encodeToGbk(gbkDxf));
      expect(gbkReport.stats.detectedEncoding).toBe('gbk');
      expect((gbkReport.document.commands[0] as TextCommand).text).toBe(sample);

      const utf8Body = encodeToUtf8(gbkDxf);
      const withBom = new Uint8Array(3 + utf8Body.length);
      withBom.set([0xef, 0xbb, 0xbf], 0);
      withBom.set(utf8Body, 3);
      const bomReport = parseDxfWithReport(withBom.buffer);
      expect(bomReport.stats.detectedEncoding).toBe('utf-8-bom');
      expect((bomReport.document.commands[0] as TextCommand).text).toBe(sample);
    }
  });

  it('rejects Binary DXF headers with a clear error', () => {
    const binaryHeader = new TextEncoder().encode('AutoCAD Binary DXF\r\n\x1a\x00');
    expect(() => parseDxfToDocument(binaryHeader)).toThrow(/Binary DXF/i);
  });
});

describe('DXF 2D entity geometry, blocks, spaces, layers & dxfToSvgText', () => {
  it('parses ARC, LWPOLYLINE with bulge, ELLIPSE, SPLINE, MTEXT, 3DFACE and POINT', () => {
    const dxf = [
      '  0', 'SECTION', '  2', 'ENTITIES',
      // Wrap-around ARC 300° -> 60° (120° CCW sweep passing through (20, 0))
      '  0', 'ARC', '  8', '0', ' 10', '10', ' 20', '0', ' 40', '10', ' 50', '300', ' 51', '60',
      // LWPOLYLINE semicircle bulge=1 from (0,0) to (20,0) -> passes through (10, -10)
      '  0', 'LWPOLYLINE', '  8', '0', ' 70', '0',
      ' 10', '0', ' 20', '0', ' 42', '1',
      ' 10', '20', ' 20', '0', ' 42', '0',
      // Full ELLIPSE
      '  0', 'ELLIPSE', '  8', '0', ' 10', '50', ' 20', '50', ' 11', '20', ' 21', '0', ' 40', '0.5', ' 41', '0', ' 42', '6.2831853',
      // Cubic SPLINE (clamped Bezier from (0,0) to (30,0))
      '  0', 'SPLINE', '  8', '0', ' 70', '8', ' 71', '3',
      ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '1', ' 40', '1', ' 40', '1', ' 40', '1',
      ' 10', '0', ' 20', '0', ' 10', '10', ' 20', '20', ' 10', '20', ' 20', '20', ' 10', '30', ' 20', '0',
      // Multi-chunk MTEXT
      '  0', 'MTEXT', '  8', '0', ' 10', '5', ' 20', '80', ' 40', '3', ' 71', '1',
      '  3', '{\\fSimSun;第一行', '  1', '\\P第二行}',
      // 3DFACE triangle (p3 == p2) & POINT
      '  0', '3DFACE', '  8', '0',
      ' 10', '0', ' 20', '0', ' 11', '10', ' 21', '0', ' 12', '5', ' 22', '10', ' 13', '5', ' 23', '10',
      '  0', 'POINT', '  8', '0', ' 10', '42', ' 20', '24',
      '  0', 'ENDSEC',
      '  0', 'EOF',
    ].join('\n');

    const doc = new DxfImporter({ curveTolerance: 0.1 }).parse(dxf);

    const arcPoly = doc.commands[0] as PolylineCommand;
    expect(arcPoly.type).toBe('polyline');
    expect(arcPoly.closed).toBe(false);
    expect(arcPoly.points.some(([x, y]) => Math.abs(x - 20) < 0.2 && Math.abs(y) < 0.2)).toBe(true);

    const bulgePoly = doc.commands[1] as PolylineCommand;
    expect(bulgePoly.points[0][0]).toBeCloseTo(0, 4);
    expect(bulgePoly.points[bulgePoly.points.length - 1][0]).toBeCloseTo(20, 4);
    expect(Math.min(...bulgePoly.points.map((p) => p[1]))).toBeCloseTo(-10, 1);

    const ellipsePoly = doc.commands[2] as PolylineCommand;
    expect(ellipsePoly.closed).toBe(true);
    expect(ellipsePoly.points.length).toBeGreaterThanOrEqual(12);

    const splinePoly = doc.commands[3] as PolylineCommand;
    expect(splinePoly.points[0]).toEqual([0, 0]);
    expect(splinePoly.points[splinePoly.points.length - 1][0]).toBeCloseTo(30, 4);
    expect(Math.max(...splinePoly.points.map((p) => p[1]))).toBeCloseTo(15, 0);

    const texts = doc.commands.filter((c): c is TextCommand => c.type === 'text');
    expect(texts.map((t) => t.text)).toEqual(['第一行', '第二行']);
    expect(texts[0].y).toBeGreaterThan(texts[1].y);

    const face = doc.commands.find(
      (c): c is PolylineCommand => c.type === 'polyline' && c.closed && c.points.length === 3
    );
    expect(face).toBeTruthy();

    const ptCircle = doc.commands.find((c): c is CircleCommand => c.type === 'circle');
    expect(ptCircle).toMatchObject({ cx: 42, cy: 24 });
  });

  it('expands BLOCKS + INSERT (MINSERT, non-uniform scale, BYBLOCK/layer 0 inheritance) and DIMENSION blocks', () => {
    const dxf = [
      '  0', 'SECTION', '  2', 'BLOCKS',
      '  0', 'BLOCK', '  2', 'SYM', ' 10', '1', ' 20', '1',
      '  0', 'CIRCLE', '  8', '0', ' 62', '0', ' 10', '1', ' 20', '1', ' 40', '5',
      '  0', 'ENDBLK',
      '  0', 'BLOCK', '  2', '*D1', ' 10', '0', ' 20', '0',
      '  0', 'LINE', '  8', '0', ' 10', '0', ' 20', '0', ' 11', '50', ' 21', '0',
      '  0', 'TEXT', '  8', '0', ' 10', '25', ' 20', '2', ' 40', '2.5', '  1', '50.00',
      '  0', 'ENDBLK',
      '  0', 'ENDSEC',
      '  0', 'SECTION', '  2', 'ENTITIES',
      // MINSERT 2x1 with non-uniform scale (2, 1) on layer MECH, color 5 -> circle becomes closed polyline
      '  0', 'INSERT', '  8', 'MECH', ' 62', '5', '  2', 'SYM',
      ' 10', '10', ' 20', '20', ' 41', '2', ' 42', '1', ' 70', '2', ' 71', '1', ' 44', '30', ' 45', '0',
      // DIMENSION referencing anonymous block *D1
      '  0', 'DIMENSION', '  8', 'DIM', ' 62', '3', '  2', '*D1',
      '  0', 'ENDSEC',
      '  0', 'EOF',
    ].join('\n');

    const report = parseDxfWithReport(dxf);
    const doc = report.document;
    expect(report.stats.blockCount).toBe(2);

    const polys = doc.commands.filter((c): c is PolylineCommand => c.type === 'polyline');
    expect(polys).toHaveLength(2);
    expect(polys[0].layer).toBe('MECH');
    expect(polys[0].color).toBe(5);
    expect(polys[0].closed).toBe(true);
    // Non-uniform scale (2,1) turns r=5 circle at (10,20) into width 20 (x: 0..20)
    const xs = polys[0].points.map((p) => p[0]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeCloseTo(20, 1);

    // DIMENSION expanded into LINE + TEXT on layer DIM
    expect(doc.commands.some((c) => c.type === 'line' && c.layer === 'DIM')).toBe(true);
    expect(doc.commands.some((c) => c.type === 'text' && c.text === '50.00' && c.layer === 'DIM')).toBe(
      true
    );
  });

  it('filters PaperSpace and hidden/frozen layers, maps TrueColor 420, reports unsupported entities, and converts to SVG', () => {
    const dxf = [
      '  0', 'SECTION', '  2', 'TABLES',
      '  0', 'TABLE', '  2', 'LAYER', ' 70', '3',
      '  0', 'LAYER', '  2', 'VISIBLE', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS',
      '  0', 'LAYER', '  2', 'OFF_LAYER', ' 70', '0', ' 62', '-1', '  6', 'CONTINUOUS',
      '  0', 'LAYER', '  2', 'FROZEN', ' 70', '1', ' 62', '3', '  6', 'CONTINUOUS',
      '  0', 'ENDTAB',
      '  0', 'ENDSEC',
      '  0', 'SECTION', '  2', 'ENTITIES',
      // TrueColor 0xFF0000 (16711680) -> ACI 1
      '  0', 'LINE', '  8', 'VISIBLE', '420', '16711680', ' 10', '0', ' 20', '0', ' 11', '100', ' 21', '0',
      // Hidden & frozen layers
      '  0', 'LINE', '  8', 'OFF_LAYER', ' 10', '0', ' 20', '10', ' 11', '100', ' 21', '10',
      '  0', 'LINE', '  8', 'FROZEN', ' 10', '0', ' 20', '20', ' 11', '100', ' 21', '20',
      // PaperSpace entity (67 = 1)
      '  0', 'LINE', '  8', 'VISIBLE', ' 67', '1', ' 10', '0', ' 20', '30', ' 11', '100', ' 21', '30',
      // Unsupported 3DSOLID
      '  0', '3DSOLID', '  8', 'VISIBLE',
      '  0', 'ENDSEC',
      '  0', 'EOF',
    ].join('\n');

    const defaultReport = parseDxfWithReport(dxf);
    expect(defaultReport.document.commands).toHaveLength(1);
    expect(defaultReport.document.commands[0].color).toBe(1);
    expect(defaultReport.stats.skippedHiddenLayer).toBe(2);
    expect(defaultReport.stats.skippedPaperSpace).toBe(1);
    expect(defaultReport.stats.unsupportedEntities['3DSOLID']).toBe(1);
    expect(defaultReport.warnings.some((w) => w.includes('3DSOLID(1)'))).toBe(true);

    const allReport = parseDxfWithReport(dxf, {
      space: 'all',
      includeHiddenLayers: true,
    });
    expect(allReport.document.commands).toHaveLength(4);

    // One-step dxfToSvgText output
    const svg = dxfToSvgText(dxf);
    expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
    expect(svg).toContain('<line x1="0" y1="0" x2="100" y2="0"');
    expect(svg).toContain('stroke="#d92121"');
  });

  it('enforces maxPrimitives to prevent runaway memory usage', () => {
    const lines = ['  0', 'SECTION', '  2', 'ENTITIES'];
    for (let i = 0; i < 50; i++) {
      lines.push('  0', 'LINE', '  8', '0', ' 10', String(i), ' 20', '0', ' 11', String(i), ' 21', '10');
    }
    lines.push('  0', 'ENDSEC', '  0', 'EOF');

    const report = parseDxfWithReport(lines.join('\n'), { maxPrimitives: 10 });
    expect(report.document.commands).toHaveLength(10);
    expect(report.stats.truncated).toBe(true);
    expect(report.warnings.some((w) => w.includes('truncated'))).toBe(true);
  });
});
