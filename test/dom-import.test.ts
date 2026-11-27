import { describe, expect, it } from 'vitest';
import { JSDOM } from 'jsdom';

import {
  DARK_THEME,
  DrawingDocument,
  EXTENDED_DARK_THEME,
  EXTENDED_LIGHT_THEME,
  LIGHT_THEME,
  SvgSerializer,
  textCodec,
  type CircleCommand,
  type LineCommand,
  type PolylineCommand,
  type TextCommand,
} from '../src/index';
import {
  clipSegmentToRect,
  domToDocument,
  domToDxfBytes,
  domToDxfText,
  domToSvg,
  downloadDomAsDxf,
  downloadDomAsSvg,
  extractDomScene,
  extractHtmlScene,
  htmlToDocument,
  htmlToDxfBytes,
  htmlToDxfText,
  htmlToSvg,
  mergeAxisAlignedSegments,
  roundedRectSvgPath,
  sampleRoundedRectPoints,
  sceneToDocument,
  sceneToVisualSvg,
  type DomBorders,
  type DomScene,
} from '../src/dom/index';

const NONE_SIDE = { width: 0, style: 'none' as const, color: '' };
const NO_BORDERS: DomBorders = {
  top: NONE_SIDE,
  right: NONE_SIDE,
  bottom: NONE_SIDE,
  left: NONE_SIDE,
};
const ZERO_RADII = {
  tl: [0, 0] as const,
  tr: [0, 0] as const,
  br: [0, 0] as const,
  bl: [0, 0] as const,
};

function makeRect(left: number, top: number, width: number, height: number): DOMRect {
  return {
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
    x: left,
    y: top,
    toJSON() {
      return {};
    },
  } as DOMRect;
}

function mockElementRect(el: Element, left: number, top: number, width: number, height: number): void {
  const rect = makeRect(left, top, width, height);
  el.getBoundingClientRect = () => rect;
}

function withDomGlobals<T>(dom: JSDOM, fn: () => T): T {
  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    URL: globalThis.URL,
    Blob: globalThis.Blob,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    URL: dom.window.URL,
    Blob: dom.window.Blob,
  });
  try {
    return fn();
  } finally {
    Object.assign(globalThis, prev);
  }
}

describe('dom border geometry & clipping algorithms', () => {
  it('merges overlapping and collinear 2x2 table borders from 16 segments down to 6 lines', () => {
    const cells = [
      { x: 0, y: 0, w: 50, h: 10 },
      { x: 50, y: 0, w: 50, h: 10 },
      { x: 0, y: 10, w: 50, h: 10 },
      { x: 50, y: 10, w: 50, h: 10 },
    ];
    const raw = [];
    for (const c of cells) {
      raw.push(
        { x1: c.x, y1: c.y, x2: c.x + c.w, y2: c.y, layer: 'DOM_BORDER', color: 7, linetype: null, lineWidth: 0.26 },
        { x1: c.x, y1: c.y + c.h, x2: c.x + c.w, y2: c.y + c.h, layer: 'DOM_BORDER', color: 7, linetype: null, lineWidth: 0.26 },
        { x1: c.x, y1: c.y, x2: c.x, y2: c.y + c.h, layer: 'DOM_BORDER', color: 7, linetype: null, lineWidth: 0.26 },
        { x1: c.x + c.w, y1: c.y, x2: c.x + c.w, y2: c.y + c.h, layer: 'DOM_BORDER', color: 7, linetype: null, lineWidth: 0.26 }
      );
    }

    const merged = mergeAxisAlignedSegments(raw);
    expect(merged).toHaveLength(6);

    const horizontals = merged.filter((s) => s.y1 === s.y2);
    const verticals = merged.filter((s) => s.x1 === s.x2);
    expect(horizontals).toHaveLength(3);
    expect(verticals).toHaveLength(3);
    for (const h of horizontals) {
      expect(h.x1).toBeCloseTo(0, 6);
      expect(h.x2).toBeCloseTo(100, 6);
    }
    for (const v of verticals) {
      expect(v.y1).toBeCloseTo(0, 6);
      expect(v.y2).toBeCloseTo(20, 6);
    }
  });

  it('keeps distinct layers/colors and diagonal segments separate during merging', () => {
    const merged = mergeAxisAlignedSegments([
      { x1: 0, y1: 0, x2: 10, y2: 0, layer: 'A', color: 1, linetype: null, lineWidth: 0.2 },
      { x1: 0, y1: 0, x2: 10, y2: 0, layer: 'A', color: 5, linetype: null, lineWidth: 0.2 },
      { x1: 0, y1: 0, x2: 10, y2: 10, layer: 'A', color: 1, linetype: null, lineWidth: 0.2 },
    ]);
    expect(merged).toHaveLength(3);
  });

  it('clips segments accurately with Liang-Barsky', () => {
    const clip = { x: 10, y: 10, w: 20, h: 20 };
    expect(clipSegmentToRect(0, 20, 40, 20, clip)).toEqual([10, 20, 30, 20]);
    expect(clipSegmentToRect(0, 0, 40, 40, clip)).toEqual([10, 10, 30, 30]);
    expect(clipSegmentToRect(0, 5, 40, 5, clip)).toBeNull();
  });

  it('samples rounded rectangles and clamps oversized radii proportionally', () => {
    const rect = { x: 0, y: 0, w: 20, h: 10 };
    const oversized = {
      tl: [15, 15] as const,
      tr: [15, 15] as const,
      br: [15, 15] as const,
      bl: [15, 15] as const,
    };

    const pts = sampleRoundedRectPoints(rect, oversized, 0.1);
    expect(pts.length).toBeGreaterThan(8);
    for (const [px, py] of pts) {
      expect(px).toBeGreaterThanOrEqual(-1e-6);
      expect(px).toBeLessThanOrEqual(20 + 1e-6);
      expect(py).toBeGreaterThanOrEqual(-1e-6);
      expect(py).toBeLessThanOrEqual(10 + 1e-6);
    }

    const d = roundedRectSvgPath(rect, oversized);
    expect(d).toContain('A5,5');
    expect(d.endsWith('Z')).toBe(true);
  });
});

describe('sceneToDocument & sceneToVisualSvg (pure computation)', () => {
  const buildSampleScene = (): DomScene => ({
    widthMm: 200,
    heightMm: 100,
    pxToMm: 25.4 / 96,
    clips: [{ id: 'dom-clip-1', rect: { x: 10, y: 10, w: 60, h: 40 } }],
    nodes: [
      {
        kind: 'box',
        isRoot: true,
        rect: { x: 0, y: 0, w: 200, h: 100 },
        backgroundColor: 'rgb(255, 255, 255)',
        borders: {
          top: { width: 0.5, style: 'solid', color: '#111827' },
          right: { width: 0.5, style: 'solid', color: '#111827' },
          bottom: { width: 0.5, style: 'solid', color: '#111827' },
          left: { width: 0.5, style: 'solid', color: '#111827' },
        },
        radii: ZERO_RADII,
        opacity: 1,
      },
      {
        kind: 'box',
        rect: { x: 10, y: 10, w: 40, h: 12 },
        backgroundColor: 'rgba(220, 230, 245, 0.8)',
        borders: NO_BORDERS,
        radii: {
          tl: [3, 3],
          tr: [3, 3],
          br: [3, 3],
          bl: [3, 3],
        },
        layerHint: 'HEADER_BADGE',
        opacity: 1,
      },
      {
        kind: 'line',
        x1: 0,
        y1: 25,
        x2: 90,
        y2: 25,
        width: 0.25,
        style: 'dashed',
        color: '#ff0000',
        clipId: 'dom-clip-1',
        opacity: 1,
      },
      {
        kind: 'svg',
        rect: { x: 120, y: 20, w: 50, h: 25 },
        viewBox: { x: 0, y: 0, w: 100, h: 50 },
        markup:
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50"><line x1="0" y1="0" x2="100" y2="50" stroke="#0000ff"/><circle cx="50" cy="25" r="10" stroke="#ff0000" fill="none"/></svg>',
        opacity: 1,
      },
      {
        kind: 'media',
        mediaType: 'img',
        rect: { x: 120, y: 60, w: 40, h: 20 },
        label: '现场照片',
        dataUrl: 'data:image/png;base64,AAAA',
        opacity: 1,
      },
      {
        kind: 'text',
        text: '工程检验报告',
        rect: { x: 12, y: 12, w: 36, h: 8 },
        x: 30,
        y: 16,
        fontSize: 4,
        fontFamily: 'Microsoft YaHei, sans-serif',
        bold: true,
        italic: false,
        color: '#111827',
        hAlign: 1,
        vAlign: 2,
        rot: 0,
        opacity: 1,
      },
      {
        kind: 'text',
        text: '被裁剪掉的文本',
        rect: { x: 100, y: 80, w: 20, h: 6 },
        x: 100,
        y: 83,
        fontSize: 3,
        fontFamily: 'sans-serif',
        bold: false,
        italic: false,
        color: '#000',
        hAlign: 0,
        vAlign: 2,
        rot: 0,
        clipId: 'dom-clip-1',
        opacity: 1,
      },
    ],
  });

  it('converts DomScene to DrawingDocument with paper, clipped lines, embedded SVG, media placeholder and hatch', () => {
    const doc = sceneToDocument(buildSampleScene(), {
      backgroundMode: 'hatch',
      mediaMode: 'placeholder',
    });

    expect(doc.extents).toEqual({ minX: 0, minY: 0, maxX: 200, maxY: 100 });

    // Root paper rect exists
    const paper = doc.commands.find(
      (c): c is PolylineCommand => c.type === 'polyline' && c.paper === true
    );
    expect(paper).toBeTruthy();

    // Clipped red dashed line x: 0..90 must be clipped to x: 10..70 at world y = 100 - 25 = 75
    const clippedLine = doc.commands.find(
      (c): c is LineCommand => c.type === 'line' && c.color === 1 && c.linetype === 'DASHED'
    );
    expect(clippedLine).toBeTruthy();
    expect(clippedLine?.x1).toBeCloseTo(10, 4);
    expect(clippedLine?.x2).toBeCloseTo(70, 4);
    expect(clippedLine?.y1).toBeCloseTo(75, 4);

    // Embedded SVG circle (cx=50,cy=25,r=10 in 100x50 viewBox placed at 120,20,50,25)
    // scale=0.5 -> r=5, world center = (120 + 25, 100 - (20 + 12.5)) = (145, 67.5)
    const svgCircle = doc.commands.find((c): c is CircleCommand => c.type === 'circle');
    expect(svgCircle).toBeTruthy();
    expect(svgCircle?.cx).toBeCloseTo(145, 3);
    expect(svgCircle?.cy).toBeCloseTo(67.5, 3);
    expect(svgCircle?.r).toBeCloseTo(5, 3);

    // Visible text emitted with CAD fontSizeScale (4 * 0.78 = 3.12), clipped text skipped
    const texts = doc.commands.filter((c): c is TextCommand => c.type === 'text');
    expect(texts.some((t) => t.text === '工程检验报告' && t.bold === true)).toBe(true);
    expect(texts.some((t) => t.text === '被裁剪掉的文本')).toBe(false);
    expect(texts.some((t) => t.text === '[现场照片]')).toBe(true);

    // Background hatch emitted diagonal lines on HEADER_BADGE
    const hatchLines = doc.commands.filter(
      (c): c is LineCommand => c.type === 'line' && c.layer === 'HEADER_BADGE'
    );
    expect(hatchLines.length).toBeGreaterThan(2);
  });

  it('renders pure-vector visual SVG without foreignObject and preserves clips, fills, SVG and media', () => {
    const svg = sceneToVisualSvg(buildSampleScene(), { mediaMode: 'embed' });
    expect(svg.startsWith('<?xml version="1.0"')).toBe(true);
    expect(svg).not.toContain('foreignObject');
    expect(svg).toContain('viewBox="0 0 200 100"');
    expect(svg).toContain('<clipPath id="dom-clip-1">');
    expect(svg).toContain('fill="#dce6f5" fill-opacity="0.8"');
    expect(svg).toContain('clip-path="url(#dom-clip-1)"');
    expect(svg).toContain('<image x="120" y="60" width="40" height="20" href="data:image/png;base64,AAAA"');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 50" x="120" y="20" width="50" height="25">');
    expect(svg).toContain('工程检验报告');
  });

  it('supports backgroundMode outline, solid and layerBy color/single', () => {
    const scene = buildSampleScene();
    const doc = sceneToDocument(scene, {
      backgroundMode: 'outline',
      layerBy: 'single',
      defaultLayer: 'SHEET',
    });
    expect(doc.layers.map((l) => l.name)).toEqual(['SHEET']);
    expect(doc.commands.every((c) => c.layer === 'SHEET')).toBe(true);

    const solidDoc = sceneToDocument(scene, { backgroundMode: 'solid' });
    const solids = solidDoc.commands.filter((c) => c.type === 'solid');
    expect(solids.length).toBeGreaterThan(0);
    expect(solids.every((s) => s.points.length === 3 || s.points.length === 4)).toBe(true);
  });
});

describe('browser DOM extraction, Range line wrapping, forms & DXF/SVG export (JSDOM)', () => {
  it('extracts table, wrapped Range text, form controls, hr, embedded SVG and filters ignored nodes', () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div id="sheet" style="background-color: #ffffff; border: 1px solid #111827;">
        <h2 id="title" style="font-size: 16px; font-weight: bold; text-align: center; color: #111827;">检验汇总表</h2>
        <div id="skipMe" data-dxf-ignore style="border: 1px solid red;">不要导出</div>
        <div id="hiddenEl" style="display: none;">隐藏内容</div>
        <table style="border-collapse: collapse;">
          <tr>
            <td id="c1" style="border: 1px solid #000; font-size: 12px; color: #000;">第一行第二行</td>
            <td id="c2" style="border: 1px solid #000; font-size: 12px; color: #ff0000;" data-dxf-layer="CUSTOM_COL">合格</td>
          </tr>
        </table>
        <hr id="sep" style="border-top: 1px dashed #6b7280;" />
        <input id="inpText" type="text" value="KC-2026" style="border: 1px solid #000; padding-left: 4px; font-size: 12px; color: #000;" />
        <input id="inpChk" type="checkbox" checked style="color: #000;" />
        <input id="inpRadio" type="radio" checked style="color: #000;" />
        <select id="sel" style="border: 1px solid #000; font-size: 12px; color: #000;">
          <option value="a">选项A</option>
          <option value="b" selected>国标甲级</option>
        </select>
        <svg id="chart" viewBox="0 0 100 50">
          <line x1="0" y1="50" x2="100" y2="0" stroke="#168f33" />
        </svg>
      </div>
    </body></html>`);

    const d = dom.window.document;
    const sheet = d.getElementById('sheet')!;
    const title = d.getElementById('title')!;
    const skipMe = d.getElementById('skipMe')!;
    const c1 = d.getElementById('c1')!;
    const c2 = d.getElementById('c2')!;
    const sep = d.getElementById('sep')!;
    const inpText = d.getElementById('inpText')!;
    const inpChk = d.getElementById('inpChk')!;
    const inpRadio = d.getElementById('inpRadio')!;
    const sel = d.getElementById('sel')!;
    const chart = d.getElementById('chart')!;

    mockElementRect(sheet, 0, 0, 800, 400);
    mockElementRect(title, 20, 10, 760, 24);
    mockElementRect(skipMe, 20, 36, 100, 20);
    mockElementRect(c1, 20, 50, 200, 40);
    mockElementRect(c2, 220, 50, 200, 40);
    mockElementRect(sep, 20, 100, 760, 2);
    mockElementRect(inpText, 20, 115, 160, 24);
    mockElementRect(inpChk, 200, 119, 16, 16);
    mockElementRect(inpRadio, 230, 119, 16, 16);
    mockElementRect(sel, 260, 115, 140, 24);
    mockElementRect(chart, 20, 160, 200, 100);

    // Mock Range.getClientRects so c1's "第一行第二行" wraps onto two visual lines
    const c1TextNode = c1.firstChild;
    dom.window.Range.prototype.getClientRects = function (this: Range): DOMRectList {
      if (this.startContainer === c1TextNode) {
        const rects: DOMRect[] = [];
        if (this.startOffset < 3) rects.push(makeRect(24, 54, 60, 14));
        if (this.endOffset > 3) rects.push(makeRect(24, 72, 60, 14));
        return rects as unknown as DOMRectList;
      }
      const parent = this.startContainer.parentElement;
      if (parent) {
        const pr = parent.getBoundingClientRect();
        return [makeRect(pr.left + 2, pr.top + 2, Math.max(10, pr.width - 4), 14)] as unknown as DOMRectList;
      }
      return [] as unknown as DOMRectList;
    };

    // Intentionally do NOT touch globalThis — must resolve ownerDocument.defaultView cleanly
    const scene = extractDomScene(sheet, { fitWidthMm: 200 });
    expect(scene.widthMm).toBeCloseTo(200, 6);
    expect(scene.heightMm).toBeCloseTo(100, 6);

    const doc = domToDocument(sheet, { fitWidthMm: 200, dedupeBorders: true });
    const texts = doc.commands
      .filter((c): c is TextCommand => c.type === 'text')
      .map((t) => ({ text: t.text, layer: t.layer, hAlign: t.hAlign, bold: t.bold }));

    expect(texts.some((t) => t.text === '检验汇总表' && t.hAlign === 1 && t.bold === true)).toBe(true);
    // Wrapped into two separate lines!
    expect(texts.some((t) => t.text === '第一行')).toBe(true);
    expect(texts.some((t) => t.text === '第二行')).toBe(true);
    // Custom layer respected
    expect(texts.some((t) => t.text === '合格' && t.layer === 'CUSTOM_COL')).toBe(true);
    // Form values extracted
    expect(texts.some((t) => t.text === 'KC-2026')).toBe(true);
    expect(texts.some((t) => t.text === '国标甲级')).toBe(true);
    // Ignored / hidden nodes excluded
    expect(texts.some((t) => t.text === '不要导出')).toBe(false);
    expect(texts.some((t) => t.text === '隐藏内容')).toBe(false);

    // Radio checked produces 2 circles, embedded SVG line (ACI 3 green) present
    const circles = doc.commands.filter((c) => c.type === 'circle');
    expect(circles).toHaveLength(2);
    const greenSvgLine = doc.commands.find(
      (c): c is LineCommand => c.type === 'line' && c.color === 3
    );
    expect(greenSvgLine).toBeTruthy();

    // DXF text & GBK bytes round-trip
    const dxfText = domToDxfText(sheet, { fitWidthMm: 200, font: 'gbenor', newline: 'lf' });
    expect(dxfText).toContain('gbenor.shx');
    expect(dxfText).toContain('检验汇总表');
    expect(dxfText).toContain('EOF');

    const dxfBytes = domToDxfBytes(sheet, { fitWidthMm: 200, encoding: 'gbk', font: 'gbcbig' });
    const decoded = textCodec.decode(dxfBytes, 'gbk');
    expect(decoded).toContain('ANSI_936');
    expect(decoded).toContain('检验汇总表');
    expect(decoded).toContain('国标甲级');

    // Both SVG modes work cleanly
    const visualSvg = domToSvg(sheet, { fitWidthMm: 200, mode: 'visual' });
    expect(visualSvg).not.toContain('foreignObject');
    expect(visualSvg).toContain('检验汇总表');

    const cadSvg = domToSvg(sheet, { fitWidthMm: 200, mode: 'cad' });
    expect(cadSvg).toContain('<?xml version="1.0"');
    expect(cadSvg).toContain('检验汇总表');
  });

  it('triggers browser downloads via downloadDomAsDxf and downloadDomAsSvg', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="box" style="border: 1px solid #000;">下载测试</div></body></html>'
    );
    const box = dom.window.document.getElementById('box')!;
    mockElementRect(box, 0, 0, 200, 100);

    withDomGlobals(dom, () => {
      const names: string[] = [];
      Object.defineProperty(dom.window.URL, 'createObjectURL', {
        value: () => 'blob:dom',
        configurable: true,
      });
      Object.defineProperty(dom.window.URL, 'revokeObjectURL', {
        value: () => undefined,
        configurable: true,
      });
      dom.window.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        names.push(this.download);
      };

      downloadDomAsDxf(box, { filename: 'report.dxf', fitWidthMm: 297 });
      downloadDomAsSvg(box, { filename: 'report.svg', mode: 'visual' });
      expect(names).toEqual(['report.dxf', 'report.svg']);
    });
  });

  it('throws a clear error when called with a non-browser element', () => {
    expect(() => extractDomScene({} as Element)).toThrow(/getComputedStyle/i);
  });

  it('extracts vertical-rl upright CJK text, sideways-lr rotated text, and ul/ol list markers', () => {
    const dom = new JSDOM(`<!doctype html><html><body>
      <div id="root">
        <div id="vCjk" style="writing-mode: vertical-rl; font-size: 14px; color: #111827;">装订线</div>
        <div id="vSide" style="writing-mode: sideways-lr; font-size: 12px; color: #111827;">Depth(m)</div>
        <ul id="ul">
          <li id="u1" style="font-size: 12px; color: #111827;">圆点项</li>
          <li id="u2" style="list-style-type: circle; font-size: 12px; color: #111827;">空心圆</li>
          <li id="u3" style="list-style-type: square; font-size: 12px; color: #111827;">方块项</li>
          <li id="u4" style="list-style-type: none; font-size: 12px; color: #111827;">无标记</li>
        </ul>
        <ol id="ol" start="3">
          <li id="o1" style="font-size: 12px; color: #111827;">第三条</li>
          <li id="o2" value="10" style="list-style-type: upper-roman; font-size: 12px; color: #111827;">第十条</li>
          <li id="o3" style="list-style-type: lower-alpha; font-size: 12px; color: #111827;">字母条</li>
          <li id="o4" style="list-style-type: cjk-ideographic; font-size: 12px; color: #111827;">中文条</li>
        </ol>
      </div>
    </body></html>`);

    const d = dom.window.document;
    const root = d.getElementById('root')!;
    mockElementRect(root, 0, 0, 400, 300);
    mockElementRect(d.getElementById('vCjk')!, 10, 20, 20, 90);
    mockElementRect(d.getElementById('vSide')!, 40, 20, 20, 90);
    mockElementRect(d.getElementById('u1')!, 100, 20, 150, 20);
    mockElementRect(d.getElementById('u2')!, 100, 44, 150, 20);
    mockElementRect(d.getElementById('u3')!, 100, 68, 150, 20);
    mockElementRect(d.getElementById('u4')!, 100, 92, 150, 20);
    mockElementRect(d.getElementById('o1')!, 100, 130, 150, 20);
    mockElementRect(d.getElementById('o2')!, 100, 154, 150, 20);
    mockElementRect(d.getElementById('o3')!, 100, 178, 150, 20);
    mockElementRect(d.getElementById('o4')!, 100, 202, 150, 20);

    const doc = domToDocument(root, { fitWidthMm: 200 });
    const texts = doc.commands.filter((c): c is TextCommand => c.type === 'text');

    // vertical-rl CJK splits into 3 upright characters stacked top-to-bottom (decreasing world Y)
    const ch1 = texts.find((t) => t.text === '装');
    const ch2 = texts.find((t) => t.text === '订');
    const ch3 = texts.find((t) => t.text === '线');
    expect(ch1 && ch2 && ch3).toBeTruthy();
    expect(ch1!.rot).toBe(0);
    expect(ch1!.y).toBeGreaterThan(ch2!.y);
    expect(ch2!.y).toBeGreaterThan(ch3!.y);

    // sideways-lr emits a 90° rotated text
    const side = texts.find((t) => t.text === 'Depth(m)');
    expect(side?.rot).toBe(90);

    // ul markers: disc + circle produce 2 circles; ol counters: 3., X., k., 十二、
    const circles = doc.commands.filter((c): c is CircleCommand => c.type === 'circle');
    expect(circles).toHaveLength(2);
    expect(texts.some((t) => t.text === '3.')).toBe(true);
    expect(texts.some((t) => t.text === 'X.')).toBe(true);
    expect(texts.some((t) => t.text === 'k.')).toBe(true);
    expect(texts.some((t) => t.text === '十二、')).toBe(true);

    // Visual SVG preserves filled disc vs hollow circle
    const visualSvg = domToSvg(root, { fitWidthMm: 200, mode: 'visual' });
    expect(visualSvg).toContain('fill="#111827"');
    expect(visualSvg).toContain('fill="none"');
  });

  it('converts offscreen HTML strings (fragment & full doc) and always removes the host container', () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    const targetDoc = dom.window.document;

    const fullHtml = `<!doctype html><html><head><style>.t { color: #ff0000; }</style></head>
      <body><div id="card" style="border: 1px solid #000; font-size: 14px;">离屏HTML标题</div></body></html>`;

    const mockLayout = (root: HTMLElement): void => {
      mockElementRect(root, 0, 0, 400, 200);
      const card = root.querySelector('#card');
      if (card) mockElementRect(card, 10, 10, 380, 40);
    };

    const doc = htmlToDocument(fullHtml, {
      document: targetDoc,
      widthPx: 400,
      fitWidthMm: 200,
      beforeExtract: mockLayout,
    });
    expect(targetDoc.querySelector('[data-dxf-offscreen-host]')).toBeNull();
    expect(doc.commands.some((c) => c.type === 'text' && c.text === '离屏HTML标题')).toBe(true);

    const visualSvg = htmlToSvg(fullHtml, {
      document: targetDoc,
      widthPx: 400,
      fitWidthMm: 200,
      mode: 'visual',
      beforeExtract: mockLayout,
    });
    expect(visualSvg).toContain('离屏HTML标题');
    expect(visualSvg).not.toContain('foreignObject');

    const cadSvg = htmlToSvg(fullHtml, {
      document: targetDoc,
      widthPx: 400,
      fitWidthMm: 200,
      mode: 'cad',
      beforeExtract: mockLayout,
    });
    expect(cadSvg).toContain('离屏HTML标题');

    const dxfText = htmlToDxfText(fullHtml, {
      document: targetDoc,
      widthPx: 400,
      fitWidthMm: 200,
      font: 'gbenor',
      newline: 'lf',
      beforeExtract: mockLayout,
    });
    expect(dxfText).toContain('gbenor.shx');
    expect(dxfText).toContain('离屏HTML标题');

    const dxfBytes = htmlToDxfBytes(fullHtml, {
      document: targetDoc,
      widthPx: 400,
      fitWidthMm: 200,
      encoding: 'gbk',
      beforeExtract: mockLayout,
    });
    expect(textCodec.decode(dxfBytes, 'gbk')).toContain('离屏HTML标题');

    // Host must still be removed even if beforeExtract throws
    expect(() =>
      extractHtmlScene('<div>boom</div>', {
        document: targetDoc,
        beforeExtract: () => {
          throw new Error('hook failed');
        },
      })
    ).toThrow('hook failed');
    expect(targetDoc.querySelector('[data-dxf-offscreen-host]')).toBeNull();

    // Clear error outside browser without options.document
    expect(() => extractHtmlScene('<div>x</div>')).toThrow(/browser Document/i);
  });

  it('provides EXTENDED_DARK_THEME and EXTENDED_LIGHT_THEME without modifying built-in defaults', () => {
    expect(DARK_THEME.resolveAci(30)).toBe(DARK_THEME.defaultColor);
    expect(LIGHT_THEME.resolveAci(200)).toBe(LIGHT_THEME.defaultColor);

    expect(EXTENDED_DARK_THEME.resolveAci(2)).toBe('#ffd60a');
    expect(EXTENDED_DARK_THEME.resolveAci(30)).toBe('#ff9f0a');
    expect(EXTENDED_DARK_THEME.resolveAci(200)).toBe('#bf5af2');

    expect(EXTENDED_LIGHT_THEME.resolveAci(2)).toBe('#b58900');
    expect(EXTENDED_LIGHT_THEME.resolveAci(30)).toBe('#ea580c');
    expect(EXTENDED_LIGHT_THEME.resolveAci(200)).toBe('#7c3aed');

    const doc = new DrawingDocument();
    doc.addLine(0, 0, 10, 0, '0', 30);
    doc.addLine(0, 5, 10, 5, '0', 200);
    const svg = new SvgSerializer().serialize(doc, { theme: EXTENDED_LIGHT_THEME });
    expect(svg).toContain('#ea580c');
    expect(svg).toContain('#7c3aed');
  });
});
