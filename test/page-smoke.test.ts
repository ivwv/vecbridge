import { describe, expect, it, beforeAll } from 'vitest';
import { JSDOM } from 'jsdom';
import { existsSync, readFileSync } from 'node:fs';

import { SvgSerializer } from '../src/svg/serializer';
import type { DocumentData } from '../src/core/types';

const htmlPath = new URL('../examples/browser-demo.html', import.meta.url);
const bundlePath = new URL('../dist/vecbridge.global.js', import.meta.url);
const coreScriptPath = new URL('../examples/assets/demo-core.js', import.meta.url);
const demoScriptPath = new URL('../examples/js/browser-demo.js', import.meta.url);

const normalizeSvgContent = (input: string): string =>
  input
    // jsdom serializes empty SVG elements as <x></x>; the serializer emits <x/>
    .replace(/<\/(polygon|polyline|line|circle|rect)>/g, '')
    .replace(/\s*\/>/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const extractGroup = (svgMarkup: string): string => {
  const start = svgMarkup.indexOf('<g ');
  const end = svgMarkup.lastIndexOf('</g>');
  return start >= 0 && end > start ? svgMarkup.slice(start, end + 4) : '';
};

/**
 * Integration smoke test: run the bundled IIFE in a DOM environment, boot the
 * browser demo and verify that both engines render the same document.
 */
describe('browser demo (IIFE bundle)', () => {
  let dom: JSDOM;
  let win: JSDOM['window'];
  let doc: Document;

  beforeAll(() => {
    if (!existsSync(bundlePath)) {
      throw new Error(
        'dist/vecbridge.global.js is missing — run `pnpm build` before the smoke tests.'
      );
    }

    const html = readFileSync(htmlPath, 'utf8');
    const bundle = readFileSync(bundlePath, 'utf8');
    const coreScript = readFileSync(coreScriptPath, 'utf8');
    const demoScript = readFileSync(demoScriptPath, 'utf8');

    dom = new JSDOM(html, {
      url: 'https://example.test/browser-demo.html',
      runScripts: 'outside-only',
      pretendToBeVisual: true,
    });
    win = dom.window;

    // jsdom does not implement object URLs / anchor navigation.
    Object.defineProperty(win.URL, 'createObjectURL', {
      value: () => 'blob:mock',
      configurable: true,
    });
    Object.defineProperty(win.URL, 'revokeObjectURL', {
      value: () => undefined,
      configurable: true,
    });
    win.HTMLAnchorElement.prototype.click = () => undefined;
    win.alert = () => undefined;

    win.eval(bundle);
    win.eval(coreScript);
    win.eval(demoScript);
    doc = win.document;
  });

  it('boots and renders both engines', () => {
    expect(win.VecBridge).toBeTruthy();

    const canvas = doc.getElementById('previewCanvas') as HTMLCanvasElement;
    // viewport fallback is 800x690 at dpr 1 (jsdom has no layout)
    expect(canvas.width).toBe(800);
    expect(canvas.height).toBe(690);

    const svg = doc.querySelector('#previewSvg svg') as SVGSVGElement;
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBeTruthy();
    expect(svg?.querySelectorAll('text').length).toBeGreaterThan(5);
    expect(svg?.querySelectorAll('polygon').length).toBeGreaterThan(0);
    // Preserve multi-space text content intact in live SVG DOM.
    const textNodes = Array.from(svg?.querySelectorAll('text') ?? []);
    expect(textNodes.some((node) => node.textContent === '比例 1:1    单位 mm')).toBe(true);
    expect(textNodes.every((node) => node.getAttribute('xml:space') === 'preserve')).toBe(true);

    // End-to-end: page-rendered SVG must equal what the serializer produces
    // for the same document and the page's fitted viewBox.
    const data = (win as unknown as { __demo: { doc: { toJSON(): DocumentData } } }).__demo.doc.toJSON();
    const viewBoxParts = (svg?.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
    const expectedSvg = new SvgSerializer().serialize(data, {
      theme: 'light',
      mode: 'live',
      viewBox: {
        x: viewBoxParts[0],
        y: viewBoxParts[1],
        w: viewBoxParts[2],
        h: viewBoxParts[3],
      },
      decorations: {
        boldLayers: ['TEXT_TITLE'],
        paperFillLayers: ['FRAME_OUTER'],
      },
    });

    const actualContent = normalizeSvgContent(extractGroup(svg?.outerHTML ?? ''));
    const expectedContent = normalizeSvgContent(extractGroup(expectedSvg));
    if (actualContent !== expectedContent) {
      let index = 0;
      const max = Math.min(actualContent.length, expectedContent.length);
      while (index < max && actualContent[index] === expectedContent[index]) index++;
      throw new Error(
        `SVG content mismatch at ${index}/${actualContent.length}\n` +
          `ACTUAL  : ${actualContent.slice(Math.max(0, index - 100), index + 200)}\n` +
          `EXPECTED: ${expectedContent.slice(Math.max(0, index - 100), index + 200)}`
      );
    }
  });

  it('keeps Canvas and SVG in sync while zooming', () => {
    const pane = doc.getElementById('canvasPane') as HTMLElement;
    const svg = doc.querySelector('#previewSvg svg') as SVGSVGElement;
    const before = svg.getAttribute('viewBox');

    pane.dispatchEvent(
      new win.WheelEvent('wheel', {
        deltaY: -100,
        clientX: 400,
        clientY: 300,
        bubbles: true,
        cancelable: true,
      })
    );

    const after = svg.getAttribute('viewBox');
    expect(after).toBeTruthy();
    expect(after).not.toBe(before);
  });

  it('switches theme without losing the drawing', () => {
    const toggle = doc.getElementById('themeBtn') as HTMLButtonElement;
    const initial = doc.querySelector('#previewSvg svg');

    // 示例页默认使用亮色打印主题
    expect(initial?.querySelector('rect')?.getAttribute('fill')).toBe('#e5e7eb');
    expect(initial?.querySelector('polygon[fill="#ffffff"]')).toBeTruthy();

    toggle.click();
    const darkRect = doc.querySelector('#previewSvg svg rect');
    expect(darkRect?.getAttribute('fill')).toBe('#111418');

    toggle.click();
    const backToLight = doc.querySelector('#previewSvg svg rect');
    expect(backToLight?.getAttribute('fill')).toBe('#e5e7eb');
  });

  it('updates the export filename when encoding or font changes', () => {
    const encoding = doc.getElementById('encodingSelect') as HTMLSelectElement;
    const font = doc.getElementById('fontSelect') as HTMLSelectElement;
    const filename = doc.getElementById('filenamePreview') as HTMLElement;

    expect(encoding.value).toBe('gbk');
    expect(font.value).toBe('gbcbig');
    expect(filename.textContent).toBe('dxf-example-gbk-gbcbig.dxf');

    encoding.value = 'utf8';
    encoding.dispatchEvent(new win.Event('change', { bubbles: true }));
    expect(filename.textContent).toBe('dxf-example-utf8-gbcbig.dxf');

    font.value = 'hztxt';
    font.dispatchEvent(new win.Event('change', { bubbles: true }));
    expect(filename.textContent).toBe('dxf-example-utf8-hztxt.dxf');

    // Restore defaults so later assertions start from a known state.
    encoding.value = 'gbk';
    font.value = 'gbcbig';
    encoding.dispatchEvent(new win.Event('change', { bubbles: true }));
    font.dispatchEvent(new win.Event('change', { bubbles: true }));
    expect(filename.textContent).toBe('dxf-example-gbk-gbcbig.dxf');
  });

  it('encodes DXF/SVG (single and batch) with matching filenames and decorations', async () => {
    const downloads: string[] = [];
    const blobs: Blob[] = [];

    const originalBlob = win.Blob;
    const originalClick = win.HTMLAnchorElement.prototype.click;

    class CapturingBlob extends originalBlob {
      constructor(parts: BlobPart[], options?: BlobPropertyBag) {
        super(parts, options);
        blobs.push(this);
      }
    }

    (win as unknown as { Blob: typeof Blob }).Blob = CapturingBlob as unknown as typeof Blob;
    win.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
      downloads.push(this.download);
    };
    Object.defineProperty(win.URL, 'createObjectURL', {
      value: () => 'blob:mock',
      configurable: true,
    });

    try {
      const encoding = doc.getElementById('encodingSelect') as HTMLSelectElement;
      const font = doc.getElementById('fontSelect') as HTMLSelectElement;
      const exportBtn = doc.getElementById('exportBtn') as HTMLButtonElement;
      const exportBatchBtn = doc.getElementById('exportBatchBtn') as HTMLButtonElement;
      const exportSvgBtn = doc.getElementById('exportSvgBtn') as HTMLButtonElement;
      const currentTheme = (win as unknown as { __demo: { theme: string } }).__demo.theme;

      encoding.value = 'gbk';
      font.value = 'gbcbig';
      exportBtn.click();

      encoding.value = 'utf8';
      font.value = 'simsun';
      exportBtn.click();

      exportSvgBtn.click();

      expect(downloads).toEqual([
        'dxf-example-gbk-gbcbig.dxf',
        'dxf-example-utf8-simsun.dxf',
        `dxf-example-${currentTheme}.svg`,
      ]);
      expect(blobs.length).toBe(3);

      const latin = (bytes: Uint8Array): string => Buffer.from(bytes).toString('latin1');
      const gbkBytes = new Uint8Array(await blobs[0].arrayBuffer());
      const utf8Bytes = new Uint8Array(await blobs[1].arrayBuffer());
      const svgText = await blobs[2].text();

      // The header declaration and STYLE font recipe must follow the selection.
      expect(latin(gbkBytes)).toContain('ANSI_936');
      expect(latin(gbkBytes)).toContain('gbcbig.shx');
      expect(latin(utf8Bytes)).toContain('UTF-8');
      expect(latin(utf8Bytes)).toContain('simsun.ttf');

      // UTF-8 needs more bytes for the same CJK text than GBK.
      expect(utf8Bytes.length).toBeGreaterThan(gbkBytes.length);

      // Exported SVG must preserve bold title decoration matching preview.
      expect(svgText).toContain('font-weight="bold"');

      expect(blobs[0].type).toBe('application/dxf');
      expect(blobs[1].type).toBe('application/dxf');
      expect(blobs[2].type).toBe('image/svg+xml;charset=utf-8');

      // Batch export emits all 2 x 8 combinations.
      downloads.length = 0;
      blobs.length = 0;
      exportBatchBtn.click();
      expect(downloads).toHaveLength(16);
      expect(blobs).toHaveLength(16);
      expect(downloads.map((name) => name.split('_')[0])).toEqual([
        'dxf-gbk-gbcbig',
        'dxf-gbk-gbenor',
        'dxf-gbk-gbeitc',
        'dxf-gbk-hztxt',
        'dxf-gbk-hzfs',
        'dxf-gbk-romans',
        'dxf-gbk-tssd',
        'dxf-gbk-simsun',
        'dxf-utf8-gbcbig',
        'dxf-utf8-gbenor',
        'dxf-utf8-gbeitc',
        'dxf-utf8-hztxt',
        'dxf-utf8-hzfs',
        'dxf-utf8-romans',
        'dxf-utf8-tssd',
        'dxf-utf8-simsun',
      ]);
    } finally {
      (win as unknown as { Blob: typeof Blob }).Blob = originalBlob;
      win.HTMLAnchorElement.prototype.click = originalClick;
    }
  });
});
