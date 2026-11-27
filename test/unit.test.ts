import { describe, expect, it } from 'vitest';

import {
  DEFAULT_TEXT_METRICS,
  DXF_FONT_RECIPES,
  DrawingDocument,
  DxfExporter,
  DxfSerializer,
  RenderTheme,
  SvgExporter,
  SvgSerializer,
  escapeXml,
  fmtNumber,
  resolveDxfFont,
  resolveTheme,
  textCodec,
  isGbkSupported,
  decodeAuto,
  isRenderTheme,
  createLayerLookup,
  resolveCommandStyle,
  validateCommand,
  drawHatch,
  type DocumentData,
  type HatchPattern,
} from '../src/index';
import { Camera } from '../src/render';

describe('fmtNumber', () => {
  it('matches the legacy formatting contract', () => {
    expect(fmtNumber(1)).toBe('1');
    expect(fmtNumber(1.5)).toBe('1.5');
    expect(fmtNumber(1.23456789)).toBe('1.2346');
    expect(fmtNumber(-0)).toBe('0');
    expect(fmtNumber(NaN)).toBe('0');
    expect(fmtNumber(Infinity)).toBe('0');
    expect(fmtNumber(1e-5)).toBe('0');
  });

  it('rejects non-numeric and non-finite inputs without throwing', () => {
    expect(fmtNumber(null as unknown as number)).toBe('0');
    expect(fmtNumber(undefined as unknown as number)).toBe('0');
    expect(fmtNumber('12' as unknown as number)).toBe('0');
    expect(fmtNumber(NaN)).toBe('0');
    expect(fmtNumber(-Infinity)).toBe('0');
  });

  it('never emits scientific notation', () => {
    expect(fmtNumber(1e21)).toBe('1000000000000000000000');
    expect(fmtNumber(-1e21)).toBe('-1000000000000000000000');
    expect(fmtNumber(1.5e22)).not.toMatch(/e/i);
  });
});

describe('escapeXml', () => {
  it('escapes all five XML entities', () => {
    expect(escapeXml(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&apos;');
  });
});

describe('DrawingDocument', () => {
  it('applies the offset once, at add time', () => {
    const doc = new DrawingDocument();
    doc.addLine(0, 0, 10, 10, 'A', 1);
    doc.setOffset(100, 200);
    doc.addCircle(1, 2, 3, 'A', 5);

    const line = doc.commands[0];
    expect(line).toMatchObject({ type: 'line', x1: 0, y1: 0, x2: 10, y2: 10 });
    const circle = doc.commands[1];
    expect(circle).toMatchObject({ type: 'circle', cx: 101, cy: 202, r: 3 });
  });

  it('distinguishes null (BYLAYER) from 0 (BYBLOCK)', () => {
    const doc = new DrawingDocument();
    doc.addLine(0, 0, 1, 1, 'L', null);
    doc.addLine(0, 0, 1, 1, 'L', 0);
    expect(doc.commands[0].color).toBeNull();
    expect(doc.commands[1].color).toBe(0);

    const dxf = new DxfSerializer().serialize(doc, { newline: 'lf' });
    const entities = dxf.slice(dxf.indexOf('ENTITIES'));
    expect(entities.match(/\n 62\n/g)?.length ?? 0).toBe(1);
    expect(entities).toContain('\n 62\n0\n');
  });

  it('expands multi-line text and keeps blank lines in the leading', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 2, 'A\nB\n\nD', 'L', 7);

    expect(doc.commands).toHaveLength(3);
    const gap = 2 * DEFAULT_TEXT_METRICS.lineGapFactor;
    expect(doc.commands[0]).toMatchObject({ text: 'A', y: (3 * gap) / 2 });
    expect(doc.commands[1]).toMatchObject({ text: 'B', y: (3 * gap) / 2 - gap });
    expect(doc.commands[2]).toMatchObject({ text: 'D', y: (3 * gap) / 2 - 3 * gap });
  });

  it('ignores empty polylines and empty text', () => {
    const doc = new DrawingDocument();
    doc.addPolyline([]);
    doc.addText(0, 0, 2, '   ');
    expect(doc.commands).toHaveLength(0);
  });

  it('round-trips through toJSON/fromJSON', () => {
    const doc = new DrawingDocument();
    doc.addLayer('L', 1, 'DASHED').addRect(0, 0, 10, 10, 'L', 1, 0.5, { paper: true });
    const restored = DrawingDocument.fromJSON(doc.toJSON());
    expect(JSON.stringify(restored.toJSON())).toBe(JSON.stringify(doc.toJSON()));
  });

  it('splits isolated carriage returns into separate lines', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 2, 'A\rB\rC', 'L', 7);
    const texts = doc.commands.filter((command) => command.type === 'text');
    expect(texts.map((command) => (command as { text: string }).text)).toEqual(['A', 'B', 'C']);
  });

  it('restores very large documents without argument-limit overflow', () => {
    const commands = Array.from({ length: 130_000 }, (_, index) => ({
      type: 'line' as const,
      x1: index,
      y1: 0,
      x2: index,
      y2: 1,
      layer: '0',
      color: null,
    }));

    const restored = DrawingDocument.fromJSON({
      layers: [],
      commands,
      extents: { minX: 0, minY: 0, maxX: 130_000, maxY: 1 },
    });

    expect(restored.commands).toHaveLength(130_000);
  });

  it('stacks rotated multi-line text along the baseline normal', () => {
    const doc = new DrawingDocument();
    doc.addText(100, 100, 2, 'A\nB', 'L', 7, 90);

    const [first, second] = doc.commands as Array<{ text: string; x: number; y: number }>;
    expect(first.text).toBe('A');
    expect(second.text).toBe('B');
    expect(first.x).toBeLessThan(second.x);
    expect(first.y).toBeCloseTo(second.y, 9);
  });

  it('supports optional linetype on addCircle without altering default IR', () => {
    const doc = new DrawingDocument();
    doc.addCircle(0, 0, 5, 'L', 1);
    doc.addCircle(10, 10, 5, 'L', 1, 'DASHED');

    expect('linetype' in doc.commands[0]).toBe(false);
    expect(doc.commands[1].linetype).toBe('DASHED');
  });

  it('tolerates missing arrays in fromJSON input', () => {
    const restored = DrawingDocument.fromJSON({} as DocumentData);
    expect(restored.layers).toEqual([]);
    expect(restored.commands).toEqual([]);
    expect(restored.extents).toEqual({ minX: 0, minY: 0, maxX: 297, maxY: 210 });
  });

  it('adds solid triangles, quads, rects and fan-decomposes convex N-gons with offset applied once', () => {
    const doc = new DrawingDocument();
    doc.addSolid([[0, 0], [1, 0]]); // < 3 points ignored
    expect(doc.commands).toHaveLength(0);

    doc.setOffset(10, 20);
    doc.addSolidRect(0, 0, 5, 4, 'FILL', 1);
    doc.addSolid(
      [
        [0, 0],
        [4, 0],
        [6, 2],
        [4, 4],
        [0, 4],
      ],
      'FILL',
      3
    );

    expect(doc.commands).toHaveLength(3); // 1 rect + (1 quad + 1 tri) for 5-gon
    expect(doc.commands[0]).toEqual({
      type: 'solid',
      points: [
        [10, 20],
        [15, 20],
        [15, 24],
        [10, 24],
      ],
      layer: 'FILL',
      color: 1,
    });
    expect(doc.commands[1].type === 'solid' && doc.commands[1].points).toHaveLength(4);
    expect(doc.commands[2].type === 'solid' && doc.commands[2].points).toHaveLength(3);
  });
});

describe('DxfSerializer', () => {
  const buildDoc = (): DrawingDocument => {
    const doc = new DrawingDocument();
    doc.addLayer('CURVE_A', 1, 'CONTINUOUS');
    doc.addLine(0, 0, 10, 0, 'CURVE_A', 1);
    doc.addPolyline(
      [
        [0, 0],
        [1, 1],
      ],
      'CURVE_A',
      1,
      false,
      0.2
    );
    doc.addText(0, 0, 2, '测试', 'CURVE_A', 7, 0, 1, 2, 0.8);
    doc.setExtents(-5, -6, 100, 50);
    return doc;
  };

  it('declares ANSI_936 for GBK and UTF-8 otherwise', () => {
    const doc = buildDoc();
    expect(
      new DxfSerializer().serialize(doc, { encoding: 'gbk', newline: 'lf' })
    ).toContain('$DWGCODEPAGE\n  3\nANSI_936');
    expect(
      new DxfSerializer().serialize(doc, { encoding: 'utf8', newline: 'lf' })
    ).toContain('$DWGCODEPAGE\n  3\nUTF-8');
  });

  it.each([
    ['gbcbig', 'txt.shx', 'gbcbig.shx'],
    ['gbenor', 'gbenor.shx', 'gbcbig.shx'],
    ['gbeitc', 'gbeitc.shx', 'gbcbig.shx'],
    ['hztxt', 'txt.shx', 'hztxt.shx'],
    ['hzfs', 'txt.shx', 'hzfs.shx'],
    ['romans', 'romans.shx', 'gbcbig.shx'],
    ['tssd', 'tssdeng.shx', 'tssdchn.shx'],
    ['simsun', 'simsun.ttf', ''],
  ] as const)('maps font preset %s to primary %s and big font %s', (font, primary, big) => {
    const dxf = new DxfSerializer().serialize(buildDoc(), { font, newline: 'lf' });
    expect(dxf).toContain(`  3\n${primary}\n  4\n${big}\n`);
  });

  it('supports custom font recipes and sanitizes invalid values', () => {
    const dxf = new DxfSerializer().serialize(buildDoc(), {
      font: { primary: 'romans.shx', big: 'hztxt.shx' },
      newline: 'lf',
    });
    expect(dxf).toContain('  3\nromans.shx\n  4\nhztxt.shx\n');

    expect(resolveDxfFont({ primary: '  gbenor.shx\n', big: 'gbcbig.shx\r' })).toEqual({
      primary: 'gbenor.shx',
      big: 'gbcbig.shx',
    });
    expect(resolveDxfFont({ primary: '   ' })).toEqual({ primary: 'txt.shx', big: '' });
    expect(resolveDxfFont('toString' as never)).toEqual(DXF_FONT_RECIPES.gbcbig);
  });

  it('uses CRLF by default and LF on request', () => {
    const doc = buildDoc();
    expect(new DxfSerializer().serialize(doc)).toContain('\r\n');
    expect(new DxfSerializer().serialize(doc, { newline: 'lf' })).not.toContain('\r\n');
  });

  it('counts layers plus layer 0 in the LAYER table', () => {
    const dxf = new DxfSerializer().serialize(buildDoc(), { newline: 'lf' });
    expect(dxf).toContain('  0\nTABLE\n  2\nLAYER\n 70\n2\n');
  });

  it('omits group 73 for zero vertical alignment', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 2, 'X', 'L', 7, 0, 1, 0);
    const dxf = new DxfSerializer().serialize(doc, { newline: 'lf' });
    const entities = dxf.slice(dxf.indexOf('ENTITIES'));
    expect(entities).not.toContain('\n 73\n');
    expect(entities).toContain('\n 72\n1\n');
    // hAlign != 0 -> insertion point duplication (11/21/31)
    expect(entities).toContain('\n 11\n0\n 21\n0\n 31\n0.0\n');
  });

  it('repeats width on vertices when lineWidth > 0', () => {
    const doc = new DrawingDocument();
    doc.addPolyline(
      [
        [0, 0],
        [1, 1],
      ],
      'L',
      7,
      false,
      0.5
    );
    const dxf = new DxfSerializer().serialize(doc, { newline: 'lf' });
    const vertex = dxf.slice(dxf.indexOf('VERTEX'));
    expect(vertex.match(/\n 40\n0.5\n 41\n0.5\n/g)?.length ?? 0).toBe(2);
  });

  it('flattens CR/LF and backslashes in text and layer names', () => {
    const raw: DocumentData = {
      layers: [{ name: 'LA\nYER\\X', color: 7, linetype: 'CONTINUOUS' }],
      commands: [
        {
          type: 'text',
          x: 0,
          y: 0,
          h: 2,
          text: 'A\nB\rC',
          rot: 0,
          hAlign: 0,
          vAlign: 0,
          widthFactor: 0.85,
          layer: 'LA\nYER\\X',
          color: null,
        },
      ],
      extents: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    };

    const dxf = new DxfSerializer().serialize(raw, { newline: 'lf' });
    expect(dxf).not.toContain('\r');

    const lines = dxf.split('\n');
    expect(lines).toContain('A B C');
    expect(lines).toContain('LA YER_X');
  });

  it('writes group 6 for circle linetypes', () => {
    const raw: DocumentData = {
      layers: [],
      commands: [
        { type: 'circle', cx: 0, cy: 0, r: 5, layer: 'L', color: 1, linetype: 'DASHED' },
      ],
      extents: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    };

    const dxf = new DxfSerializer().serialize(raw, { newline: 'lf' });
    expect(dxf).toContain('  0\nCIRCLE\n  8\nL\n  6\nDASHED\n 62\n1');
  });

  it('writes the R12 elevation point on POLYLINE headers', () => {
    const doc = new DrawingDocument();
    doc.addPolyline(
      [
        [0, 0],
        [1, 1],
      ],
      'L'
    );

    const dxf = new DxfSerializer().serialize(doc, { newline: 'lf' });
    expect(dxf).toContain('  0\nPOLYLINE\n  8\nL\n 66\n1\n 10\n0.0\n 20\n0.0\n 30\n0.0\n 70\n0');
  });

  it('skips invalid entities and reports the reason', () => {
    const raw: DocumentData = {
      layers: [],
      commands: [
        { type: 'circle', cx: 0, cy: 0, r: 0, layer: 'L', color: 1 },
        { type: 'line', x1: 0, y1: 0, x2: 1, y2: 1, layer: 'L', color: 1 },
      ],
      extents: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    };

    const skipped: string[] = [];
    const dxf = new DxfSerializer().serialize(raw, {
      newline: 'lf',
      onInvalidCommand: (_command, reason) => skipped.push(reason),
    });

    expect(skipped).toHaveLength(1);
    expect(skipped[0]).toContain('radius');
    expect(dxf).not.toContain('CIRCLE');
    expect(dxf).toContain('LINE');
  });

  it('keeps invalid entities when validation is disabled', () => {
    const raw: DocumentData = {
      layers: [],
      commands: [{ type: 'circle', cx: 0, cy: 0, r: 0, layer: 'L', color: 1 }],
      extents: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    };

    const dxf = new DxfSerializer().serialize(raw, { newline: 'lf', validate: false });
    expect(dxf).toContain('CIRCLE');
  });

  it('prevents non-GBK layer names from emitting backslashes while keeping table and entity aligned', () => {
    const doc = new DrawingDocument();
    doc.addLayer('层é😀', 7, 'CONTINUOUS');
    doc.addLine(0, 0, 10, 10, '层é😀', 7);

    const bytes = new DxfSerializer().toBytes(doc, { encoding: 'gbk', newline: 'lf' });
    const rawLatin = Buffer.from(bytes).toString('latin1');
    expect(rawLatin).not.toContain('\\U+');

    // '层' and 'é' (GB2312/GBK 0xA8A6) are valid GBK; only '😀' (2 UTF-16 units) is replaced.
    const decoded = textCodec.decode(bytes, 'gbk');
    expect(decoded).toContain('  0\nLAYER\n  2\n层é__\n');
    expect(decoded).toContain('  0\nLINE\n  8\n层é__\n');
  });

  it('skips duplicate layer 0 records, strips forbidden table chars, and validates all command rules', () => {
    const raw: DocumentData = {
      layers: [
        { name: '   ', color: 1, linetype: 'CONTINUOUS' },
        { name: '0', color: 1, linetype: 'CONTINUOUS' },
        { name: '  A/B:C*D  ', color: NaN, linetype: 'DASHED\nBAD' as never },
      ],
      commands: [],
      extents: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    };
    const dxf = new DxfSerializer().serialize(raw, { newline: 'lf' });
    expect(dxf).not.toContain('NaN');
    expect(dxf).toContain('  0\nTABLE\n  2\nLAYER\n 70\n2\n');
    expect(dxf.match(/  0\nLAYER\n  2\n0\n/g)?.length ?? 0).toBe(1);
    expect(dxf).toContain('  0\nLAYER\n  2\nA_B_C_D\n 70\n0\n 62\n7\n  6\nDASHED BAD\n');

    expect(
      validateCommand({ type: 'line', x1: NaN, y1: 0, x2: 1, y2: 1, layer: '0', color: null })
    ).toContain('non-finite');
    expect(
      validateCommand({ type: 'circle', cx: NaN, cy: 0, r: 5, layer: '0', color: null })
    ).toContain('centre');
    expect(
      validateCommand({ type: 'circle', cx: 0, cy: 0, r: -1, layer: '0', color: null })
    ).toContain('radius');
    expect(
      validateCommand({
        type: 'polyline',
        points: [[0, 0]],
        closed: false,
        lineWidth: 0,
        layer: '0',
        color: null,
      })
    ).toContain('at least two');
    expect(
      validateCommand({
        type: 'polyline',
        points: [
          [0, NaN],
          [1, 1],
        ],
        closed: false,
        lineWidth: 0,
        layer: '0',
        color: null,
      })
    ).toContain('vertex');
    expect(
      validateCommand({
        type: 'polyline',
        points: [
          [0, 0],
          [1, 1],
        ],
        closed: false,
        lineWidth: -1,
        layer: '0',
        color: null,
      })
    ).toContain('line width');
    expect(
      validateCommand({
        type: 'text',
        x: 0,
        y: 0,
        h: -2,
        text: 'X',
        rot: 0,
        hAlign: 0,
        vAlign: 0,
        widthFactor: 0.85,
        layer: '0',
        color: null,
      })
    ).toContain('height');
    expect(
      validateCommand({
        type: 'text',
        x: 0,
        y: 0,
        h: 2,
        text: 'X',
        rot: 0,
        hAlign: 0,
        vAlign: 0,
        widthFactor: 0,
        layer: '0',
        color: null,
      })
    ).toContain('width factor');
    expect(
      validateCommand({
        type: 'text',
        x: 0,
        y: 0,
        h: 2,
        text: 'X',
        rot: NaN,
        hAlign: 0,
        vAlign: 0,
        widthFactor: 0.85,
        layer: '0',
        color: null,
      })
    ).toContain('rotation');
    expect(
      validateCommand({
        type: 'text',
        x: 0,
        y: 0,
        h: 2,
        text: 'X',
        rot: 0,
        hAlign: 9 as never,
        vAlign: 0,
        widthFactor: 0.85,
        layer: '0',
        color: null,
      })
    ).toContain('horizontal alignment');
    expect(
      validateCommand({
        type: 'text',
        x: 0,
        y: 0,
        h: 2,
        text: 'X',
        rot: 0,
        hAlign: 0,
        vAlign: 4 as never,
        widthFactor: 0.85,
        layer: '0',
        color: null,
      })
    ).toContain('vertical alignment');
    expect(
      validateCommand({ type: 'line', x1: 0, y1: 0, x2: 1, y2: 1, layer: '0', color: 257 })
    ).toContain('ACI');
    expect(
      validateCommand({ type: 'line', x1: 0, y1: 0, x2: 1, y2: 1, layer: '0', color: -1 })
    ).toContain('ACI');
    expect(
      validateCommand({ type: 'line', x1: 0, y1: 0, x2: 1, y2: 1, layer: '0', color: 1.5 })
    ).toContain('ACI');
  });

  it('serializes DXF R12 SOLID with AutoCAD Z-order vertex swap for quads and repeated 3rd vertex for triangles', () => {
    const doc = new DrawingDocument();
    doc.addSolidRect(0, 0, 10, 5, 'FILL', 1);
    doc.addSolid(
      [
        [0, 0],
        [10, 0],
        [5, 8],
      ],
      'FILL',
      null
    );

    const dxf = new DxfSerializer().serialize(doc, { newline: 'lf' });
    // Quad [0,0 -> 10,0 -> 10,5 -> 0,5] must emit DXF 10/11/12/13 as [0,0 / 10,0 / 0,5 / 10,5]
    expect(dxf).toContain(
      '  0\nSOLID\n  8\nFILL\n 62\n1\n 10\n0\n 20\n0\n 30\n0.0\n 11\n10\n 21\n0\n 31\n0.0\n 12\n0\n 22\n5\n 32\n0.0\n 13\n10\n 23\n5\n 33\n0.0\n'
    );
    // Triangle [0,0 -> 10,0 -> 5,8] must repeat 3rd point as 4th and omit group 62 when color is null
    expect(dxf).toContain(
      '  0\nSOLID\n  8\nFILL\n 10\n0\n 20\n0\n 30\n0.0\n 11\n10\n 21\n0\n 31\n0.0\n 12\n5\n 22\n8\n 32\n0.0\n 13\n5\n 23\n8\n 33\n0.0\n'
    );

    expect(
      validateCommand({
        type: 'solid',
        points: [
          [0, 0],
          [1, 0],
        ],
        layer: '0',
        color: null,
      })
    ).toContain('3 or 4');
    expect(
      validateCommand({
        type: 'solid',
        points: [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 2],
        ],
        layer: '0',
        color: null,
      })
    ).toContain('3 or 4');
    expect(
      validateCommand({
        type: 'solid',
        points: [
          [0, 0],
          [NaN, 0],
          [1, 1],
        ],
        layer: '0',
        color: null,
      })
    ).toContain('non-finite');
  });

  it('DxfExporter matches DxfSerializer output', () => {
    const doc = buildDoc();
    expect(DxfExporter.toText(doc, { newline: 'lf' })).toBe(
      new DxfSerializer().serialize(doc, { newline: 'lf' })
    );
    expect(Array.from(DxfExporter.toBytes(doc, { encoding: 'utf8' }))).toEqual(
      Array.from(new DxfSerializer().toBytes(doc, { encoding: 'utf8' }))
    );
  });
});

describe('SvgSerializer', () => {
  const buildDoc = (): DrawingDocument => {
    const doc = new DrawingDocument();
    doc.setExtents(0, 0, 297, 210);
    doc.addText(10, 20, 2, 'A & B', 'TEXT_TITLE', 7, 0, 1, 2, 0.8);
    doc.addRect(0, 0, 297, 210, 'FRAME_OUTER', 8, 0);
    doc.addLine(10, 10, 20, 20, 'L', 1, 'DASHED');
    return doc;
  };

  it('uses the 1.04 SVG font-size factor and escapes text', () => {
    const svg = new SvgSerializer().serialize(buildDoc(), { theme: 'dark', mode: 'live' });
    expect(svg).toContain('font-size="2.08"');
    expect(svg).toContain('A &amp; B');
    expect(svg).toContain('id="liveSvgElement"');
  });

  it('adds xml declaration and mm dimensions in export mode', () => {
    const svg = new SvgSerializer().serialize(buildDoc(), { mode: 'export' });
    expect(svg.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="no"?>')).toBe(true);
    expect(svg).toContain('width="321mm" height="234mm"');
    expect(svg).not.toContain('id="liveSvgElement"');
  });

  it('uses the live viewBox verbatim when supplied', () => {
    const svg = new SvgSerializer().serialize(buildDoc(), {
      theme: 'dark',
      viewBox: { x: -10, y: -20, w: 100, h: 50 },
    });
    expect(svg).toContain('viewBox="-10 -20 100 50"');
  });

  it('fills paper only for flagged or configured layers, in light mode', () => {
    const doc = buildDoc();
    const withOptions = new SvgSerializer().serialize(doc, {
      theme: 'light',
      decorations: { paperFillLayers: ['FRAME_OUTER'] },
    });
    expect(withOptions).toContain('fill="#ffffff"');

    const withoutOptions = new SvgSerializer().serialize(doc, { theme: 'light' });
    // Only the background rect remains (fill #ffffff via export background is absent in live)
    expect((withoutOptions.match(/fill="#ffffff"/g) ?? []).length).toBe(0);
  });

  it('is transparent about the theme palette', () => {
    const svg = new SvgSerializer().serialize(buildDoc(), { theme: 'dark' });
    expect(svg).toContain('stroke="#ff3b30"');
  });

  it('escapes font-family and color attributes', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 2, 'X', 'L', 7);

    const svg = new SvgSerializer().serialize(doc, {
      text: { svgFontFamily: '"Noto Sans SC", sans-serif' },
      backgroundColor: '#fff" onload="x',
    });

    expect(svg).toContain('font-family="&quot;Noto Sans SC&quot;, sans-serif"');
    expect(svg).toContain('fill="#fff&quot; onload=&quot;x"');
  });

  it('resolves BYLAYER colour and linetype from the layer table', () => {
    const doc = new DrawingDocument();
    doc.addLayer('DASHED_RED', 1, 'DASHED');
    doc.addLine(0, 0, 10, 10, 'DASHED_RED');

    const svg = new SvgSerializer().serialize(doc, { theme: 'dark' });
    expect(svg).toContain('stroke="#ff3b30"');
    expect(svg).toContain('stroke-dasharray="1.3,0.9"');
  });

  it('maps vertical alignment 1 to the bottom edge', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 2, 'X', 'L', 7, 0, 0, 1);

    const svg = new SvgSerializer().serialize(doc);
    expect(svg).toContain('dominant-baseline="text-after-edge"');
  });

  it('preserves whitespace by default and can opt out', () => {
    const doc = new DrawingDocument();
    doc.addText(0, 0, 2, 'A   B', 'L', 7);

    expect(new SvgSerializer().serialize(doc)).toContain('xml:space="preserve"');
    expect(new SvgSerializer().serialize(doc, { preserveWhitespace: false })).not.toContain(
      'xml:space'
    );
  });

  it('fills paper as a polygon regardless of corner order', () => {
    const doc = new DrawingDocument();
    doc.addRect(100, 80, 0, 0, 'FRAME', 8, 0, { paper: true });

    const svg = new SvgSerializer().serialize(doc, { theme: 'light' });
    expect(svg).toContain('<polygon points="100,-80 0,-80 0,0 100,0" fill="#ffffff"/>');
  });

  it('expands live background margin proportionally for very large drawings', () => {
    const doc = new DrawingDocument();
    doc.setExtents(0, 0, 20_000, 10_000);
    doc.addLine(0, 0, 20_000, 10_000, '0', 7);

    const svg = new SvgSerializer().serialize(doc, { mode: 'live' });
    const bgMatch = svg.match(/<rect x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);
    expect(bgMatch).toBeTruthy();
    expect(Number(bgMatch![3])).toBeGreaterThan(80_000);
  });

  it('skips invalid geometry and clamps negative text widthFactor', () => {
    const raw: DocumentData = {
      layers: [],
      commands: [
        { type: 'line', x1: NaN, y1: 0, x2: 10, y2: 10, layer: '0', color: 1 },
        { type: 'circle', cx: 0, cy: 0, r: -5, layer: '0', color: 1 },
        { type: 'polyline', points: [[0, 0]], closed: false, lineWidth: 0, layer: '0', color: 1 },
        {
          type: 'text',
          x: 0,
          y: 0,
          h: 0,
          text: 'ZERO',
          rot: 0,
          hAlign: 0,
          vAlign: 0,
          widthFactor: 1,
          layer: '0',
          color: 7,
        },
        {
          type: 'text',
          x: 5,
          y: 5,
          h: 2,
          text: 'NEGWF',
          rot: 0,
          hAlign: 0,
          vAlign: 0,
          widthFactor: -1,
          layer: '0',
          color: 7,
        },
      ],
      extents: { minX: 0, minY: 0, maxX: 10, maxY: 10 },
    };

    const svg = SvgExporter.toText(raw, { mode: 'live' });
    expect(svg).not.toContain('<line');
    expect(svg).not.toContain('<circle');
    expect(svg).not.toContain('<polyline');
    expect(svg).not.toContain('ZERO');
    expect(svg).toContain('NEGWF');
    expect(svg).toContain('scale(0.85,1)');
    expect(svg).not.toContain('scale(-1,1)');
  });

  it('renders solid commands as filled stroke-free polygons with BYLAYER resolution', () => {
    const doc = new DrawingDocument();
    doc.addLayer('SHADE', 5, 'CONTINUOUS');
    doc.addSolidRect(10, 20, 30, 40, 'SHADE', null);

    const svg = new SvgSerializer().serialize(doc, { theme: 'dark', mode: 'live' });
    expect(svg).toContain('<polygon points="10,-20 30,-20 30,-40 10,-40" fill="#409cff" stroke="none"/>');
  });
});

describe('RenderTheme', () => {
  it('resolves ACI colors and falls back to the default', () => {
    const dark = resolveTheme('dark');
    expect(dark.resolveAci(1)).toBe('#ff3b30');
    expect(dark.resolveAci(8)).toBe('#76808f');
    expect(dark.resolveAci(99)).toBe('#f0f4f8');
    expect(dark.resolveAci(null)).toBe('#f0f4f8');
    expect(dark.backgroundFor('export')).toBe('#111418');
  });

  it('exports light theme onto white paper', () => {
    const light = resolveTheme('light');
    expect(light.backgroundFor('live')).toBe('#e5e7eb');
    expect(light.backgroundFor('export')).toBe('#ffffff');
  });

  it('accepts a custom theme instance', () => {
    const custom = new RenderTheme({
      name: 'custom',
      isDark: false,
      background: '#fff',
      exportBackground: '#fff',
      paper: '#fff',
      defaultColor: '#000',
      aci: { 1: '#f00' },
    });
    expect(resolveTheme(custom)).toBe(custom);
    expect(custom.resolveAci(1)).toBe('#f00');
  });

  it('recognises branded themes from another module copy', () => {
    const fromAnotherCopy = {
      [Symbol.for('vecbridge.RenderTheme')]: true,
      name: 'external',
      isDark: true,
      background: '#000',
      exportBackground: '#000',
      paper: '#fff',
      defaultColor: '#fff',
      resolveAci: () => '#fff',
      backgroundFor: () => '#000',
    };

    expect(isRenderTheme(fromAnotherCopy)).toBe(true);
    expect(isRenderTheme({ name: 'plain-object' })).toBe(false);
    expect(isRenderTheme('dark')).toBe(false);
  });
});

describe('resolveCommandStyle', () => {
  const lookup = createLayerLookup([{ name: 'L', color: 1, linetype: 'DASHED' }]);
  const base = { type: 'line' as const, x1: 0, y1: 0, x2: 1, y2: 1, layer: 'L' };

  it('inherits colour and linetype from the layer', () => {
    expect(resolveCommandStyle({ ...base, color: null }, lookup)).toEqual({
      color: 1,
      linetype: 'DASHED',
    });
  });

  it('prefers explicit command values', () => {
    expect(resolveCommandStyle({ ...base, color: 5, linetype: 'DOT' }, lookup)).toEqual({
      color: 5,
      linetype: 'DOT',
    });
  });

  it('falls back to null for unknown layers', () => {
    expect(resolveCommandStyle({ ...base, layer: 'MISSING', color: null }, lookup)).toEqual({
      color: null,
      linetype: null,
    });
  });

  it('treats explicit ACI 256 as BYLAYER', () => {
    expect(resolveCommandStyle({ ...base, color: 256 }, lookup)).toEqual({
      color: 1,
      linetype: 'DASHED',
    });
  });

  it('normalises negative (off-layer) ACI colours via Math.abs', () => {
    const offLookup = createLayerLookup([{ name: 'OFF', color: -5, linetype: 'DOT' }]);
    expect(resolveCommandStyle({ ...base, layer: 'OFF', color: null }, offLookup)).toEqual({
      color: 5,
      linetype: 'DOT',
    });
  });
});

describe('Camera', () => {
  const extents = { minX: 0, minY: 0, maxX: 297, maxY: 210 };
  const metrics = { width: 1000, height: 700 };

  it('fits extents centered with padding', () => {
    const camera = new Camera();
    camera.fit(extents, metrics, 16);
    const scale = Math.min(1000 / (297 + 32), 700 / (210 + 32));
    expect(camera.scale).toBeCloseTo(scale, 12);
    expect(camera.offsetX).toBeCloseTo(500 - 148.5 * scale, 9);
    expect(camera.offsetY).toBeCloseTo(350 + 105 * scale, 9);
  });

  it('SVG viewBox stays consistent with the screen transform', () => {
    const camera = new Camera();
    camera.fit(extents, metrics, 16);
    camera.zoomAt(400, 200, 1.4);
    camera.panBy(30, -20);

    const vb = camera.getViewBox(metrics);
    for (const [wx, wy] of [
      [0, 0],
      [297, 210],
      [123.4, 56.7],
    ] as const) {
      const screen = camera.toScreen(wx, wy);
      expect((-wy - vb.y) * camera.scale).toBeCloseTo(screen.y, 6);
      expect((wx - vb.x) * camera.scale).toBeCloseTo(screen.x, 6);
    }
    expect(vb.y).toBeCloseTo(-camera.offsetY / camera.scale, 12);
  });

  it('keeps the world point under the cursor fixed while zooming', () => {
    const camera = new Camera();
    camera.fit(extents, metrics, 16);

    const px = 321;
    const py = 234;
    const worldBefore = camera.toWorld(px, py);
    camera.zoomAt(px, py, 1.15);
    const screen = camera.toScreen(worldBefore.x, worldBefore.y);
    expect(screen.x).toBeCloseTo(px, 6);
    expect(screen.y).toBeCloseTo(py, 6);
  });

  it('clamps scale to the configured limits', () => {
    const camera = new Camera();
    camera.zoomAt(0, 0, 1000);
    expect(camera.scale).toBe(50);
    camera.zoomAt(0, 0, 0.00001);
    expect(camera.scale).toBe(0.2);
  });

  it('inverts screen coordinates back to world space', () => {
    const camera = new Camera();
    camera.fit(extents, metrics);

    const screen = camera.toScreen(123.4, 45.6);
    const world = camera.toWorld(screen.x, screen.y);

    expect(world.x).toBeCloseTo(123.4, 9);
    expect(world.y).toBeCloseTo(45.6, 9);
  });

  it('ignores degenerate viewports instead of producing NaN', () => {
    const camera = new Camera({ scale: 2, offsetX: 10, offsetY: 20 });
    camera.fit(extents, { width: 0, height: 0 });

    expect(camera.scale).toBe(2);
    expect(camera.offsetX).toBe(10);
    expect(camera.offsetY).toBe(20);
  });

  it('ignores non-positive zoom factors', () => {
    const camera = new Camera({ scale: 1 });
    camera.zoomAt(0, 0, 0);
    expect(camera.scale).toBe(1);
    camera.zoomAt(0, 0, -2);
    expect(camera.scale).toBe(1);
  });

  it('ignores reversed extents even when padding would make width positive', () => {
    const camera = new Camera({ scale: 3, offsetX: 5, offsetY: 6 });
    camera.fit({ minX: 10, minY: 0, maxX: 0, maxY: 10 }, metrics, 16);

    expect(camera.scale).toBe(3);
    expect(camera.offsetX).toBe(5);
    expect(camera.offsetY).toBe(6);
  });

  it('returns a finite fallback viewBox when scale is non-positive', () => {
    const camera = new Camera({ scale: 0, offsetX: 10, offsetY: 20 });
    const vb = camera.getViewBox(metrics);

    expect(Number.isFinite(vb.x)).toBe(true);
    expect(Number.isFinite(vb.y)).toBe(true);
    expect(vb.w).toBe(metrics.width);
    expect(vb.h).toBe(metrics.height);
  });
});

describe('drawHatch', () => {
  it('normalises reversed corners', () => {
    const forward = new DrawingDocument();
    drawHatch(forward, 0, 0, 40, 30, 'diagonal', 'H', 8);

    const reversed = new DrawingDocument();
    drawHatch(reversed, 40, 30, 0, 0, 'diagonal', 'H', 8);

    expect(JSON.stringify(reversed.commands)).toBe(JSON.stringify(forward.commands));
  });

  it('throws for unknown patterns', () => {
    const doc = new DrawingDocument();
    expect(() => drawHatch(doc, 0, 0, 10, 10, 'unknown' as never)).toThrow(RangeError);
  });

  it('caps emitted primitives', () => {
    const doc = new DrawingDocument();
    drawHatch(doc, 0, 0, 500, 500, 'dots-fine', 'H', 8, { maxPrimitives: 50 });
    expect(doc.commands).toHaveLength(50);
  });

  it('keeps the offset band inside the rectangle', () => {
    const doc = new DrawingDocument();
    drawHatch(doc, 0, 0, 20, 20, 'dash-bands', 'H', 8);

    for (const command of doc.commands) {
      if (command.type !== 'line') continue;
      expect(command.y1).toBeGreaterThanOrEqual(0.25);
      expect(command.y1).toBeLessThanOrEqual(19.75);
    }
  });

  it('ignores non-finite coordinates without hanging', () => {
    const doc = new DrawingDocument();
    drawHatch(doc, 0, 0, Infinity, 100, 'dots-fine', 'H', 8);
    drawHatch(doc, NaN, 0, 20, 20, 'diagonal', 'H', 8);
    expect(doc.commands).toHaveLength(0);
  });

  it('aborts nested loops promptly once maxPrimitives is reached on huge rectangles', () => {
    const doc = new DrawingDocument();
    const start = Date.now();
    drawHatch(doc, 0, 0, 100_000, 100_000, 'dots-fine', 'H', 8, { maxPrimitives: 100 });
    expect(doc.commands).toHaveLength(100);
    expect(Date.now() - start).toBeLessThan(200);
  });

  it('supports all nine built-in patterns and maxPrimitives: 0', () => {
    const patterns: HatchPattern[] = [
      'diagonal',
      'diagonal-dash',
      'horizontal',
      'horizontal-dots',
      'dots-fine',
      'dots-coarse',
      'scatter',
      'crosshatch',
      'dash-bands',
    ];
    for (const pattern of patterns) {
      const doc = new DrawingDocument();
      drawHatch(doc, 0, 0, 20, 20, pattern, 'H', 8, { maxPrimitives: 0 });
      expect(doc.commands.length, `pattern ${pattern}`).toBeGreaterThan(0);
    }
  });
});

describe('TextCodec', () => {
  it('reports GBK availability in full-ICU environments', () => {
    expect(isGbkSupported()).toBe(true);
    expect(textCodec.getTableSize()).toBeGreaterThan(20000);
  });

  it('escapes characters outside GBK as CAD \\U+XXXX', () => {
    const bytes = textCodec.encodeToGbk('中😀');
    expect(Array.from(bytes.slice(0, 2))).toEqual([0xd6, 0xd0]);
    const tail = Buffer.from(bytes.slice(2)).toString('latin1');
    expect(tail).toBe('\\U+D83D\\U+DE00');
  });

  it('decodes BOM-prefixed UTF-8', () => {
    const bytes = Uint8Array.from([0xef, 0xbb, 0xbf, 0x41, 0x42]);
    expect(decodeAuto(bytes)).toBe('AB');
  });

  it('falls back to GBK when strict UTF-8 fails', () => {
    const gbk = textCodec.encodeToGbk('工程图纸');
    expect(textCodec.decodeAuto(gbk)).toBe('工程图纸');
  });

  it('decodes explicit GBK', () => {
    const gbk = textCodec.encodeToGbk('图纸编码');
    expect(textCodec.decode(gbk, 'gbk')).toBe('图纸编码');
  });

  it('grows the internal byte buffer cleanly for long escape-heavy strings', () => {
    // Each emoji expands from 2 UTF-16 code units to 14 ASCII bytes (> 2x initial buffer).
    const input = '😀'.repeat(64);
    const bytes = textCodec.encodeToGbk(input);
    expect(bytes.byteLength).toBe(64 * 14);
    expect(bytes.byteOffset).toBe(0);
    expect(bytes.buffer.byteLength).toBe(bytes.byteLength);
    expect(Buffer.from(bytes).toString('latin1')).toBe('\\U+D83D\\U+DE00'.repeat(64));
  });

  it('does not misidentify a UTF-32LE BOM as UTF-16LE', () => {
    const utf32LeBom = Uint8Array.from([0xff, 0xfe, 0x00, 0x00, 0x41, 0x00, 0x00, 0x00]);
    const decoded = decodeAuto(utf32LeBom);
    expect(decoded).not.toBe('\u0000A\u0000');
  });
});

describe('DocumentData', () => {
  it('serializes to plain JSON', () => {
    const doc = new DrawingDocument();
    doc.addLine(0, 0, 1, 1);
    const data: DocumentData = doc.toJSON();
    expect(JSON.parse(JSON.stringify(data))).toEqual(data);
  });
});
