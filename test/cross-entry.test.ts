import { describe, expect, it, beforeAll } from 'vitest';
import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const hasDist = existsSync(new URL('../dist/index.js', import.meta.url));
const require = createRequire(import.meta.url);

type CoreModule = typeof import('../src/core/index');
type MainModule = typeof import('../src/index');
type DxfModule = typeof import('../src/dxf/index');
type SvgModule = typeof import('../src/svg/index');
type EncodingModule = typeof import('../src/encoding/index');
type RenderModule = typeof import('../src/render/index');
type PatternsModule = typeof import('../src/patterns/index');
type BrowserModule = typeof import('../src/browser/index');
type CanvasModule = typeof import('../src/canvas/index');
type DomModule = typeof import('../src/dom/index');

interface EntrySet {
  core: CoreModule;
  main: MainModule;
  dxf: DxfModule;
  svg: SvgModule;
  encoding: EncodingModule;
  render: RenderModule;
  patterns: PatternsModule;
  browser: BrowserModule;
  canvas: CanvasModule;
  dom: DomModule;
}

const makeTheme = (core: CoreModule) =>
  new core.RenderTheme({
    name: 'brand',
    isDark: true,
    background: '#000000',
    exportBackground: '#000000',
    paper: '#ffffff',
    defaultColor: '#ffffff',
    aci: { 1: '#123456' },
  });

describe('cross-entry module consistency', () => {
  let esm: EntrySet;
  let cjs: EntrySet;

  beforeAll(async () => {
    if (!hasDist) {
      throw new Error(
        'dist/index.js is missing — run `pnpm build` before cross-entry tests.'
      );
    }
    esm = {
      core: (await import(new URL('../dist/core.js', import.meta.url).href)) as CoreModule,
      main: (await import(new URL('../dist/index.js', import.meta.url).href)) as MainModule,
      dxf: (await import(new URL('../dist/dxf.js', import.meta.url).href)) as DxfModule,
      svg: (await import(new URL('../dist/svg.js', import.meta.url).href)) as SvgModule,
      encoding: (await import(new URL('../dist/encoding.js', import.meta.url).href)) as EncodingModule,
      render: (await import(new URL('../dist/render.js', import.meta.url).href)) as RenderModule,
      patterns: (await import(new URL('../dist/patterns.js', import.meta.url).href)) as PatternsModule,
      browser: (await import(new URL('../dist/browser.js', import.meta.url).href)) as BrowserModule,
      canvas: (await import(new URL('../dist/canvas.js', import.meta.url).href)) as CanvasModule,
      dom: (await import(new URL('../dist/dom.js', import.meta.url).href)) as DomModule,
    };
    cjs = {
      core: require('../dist/core.cjs') as CoreModule,
      main: require('../dist/index.cjs') as MainModule,
      dxf: require('../dist/dxf.cjs') as DxfModule,
      svg: require('../dist/svg.cjs') as SvgModule,
      encoding: require('../dist/encoding.cjs') as EncodingModule,
      render: require('../dist/render.cjs') as RenderModule,
      patterns: require('../dist/patterns.cjs') as PatternsModule,
      browser: require('../dist/browser.cjs') as BrowserModule,
      canvas: require('../dist/canvas.cjs') as CanvasModule,
      dom: require('../dist/dom.cjs') as DomModule,
    };
  });

  it('shares one RenderTheme class across ESM entries', () => {
    expect(esm.core.RenderTheme).toBe(esm.main.RenderTheme);
  });

  it('shares one RenderTheme class across CJS entries', () => {
    expect(cjs.core.RenderTheme).toBe(cjs.main.RenderTheme);
  });

  it.each([
    ['ESM', () => esm],
    ['CJS', () => cjs],
  ])('applies a theme created in another %s entry', (_label, getEntries) => {
    const entries = getEntries();
    const theme = makeTheme(entries.core);

    expect(entries.main.resolveTheme(theme).name).toBe('brand');

    const doc = new entries.main.DrawingDocument();
    doc.addLine(0, 0, 10, 10, '0', 1);

    const svg = new entries.svg.SvgSerializer().serialize(doc, { theme });
    expect(svg).toContain('#123456');
  });

  it('recognises RenderTheme across mixed ESM and CJS imports', () => {
    const esmTheme = makeTheme(esm.core);
    const cjsTheme = makeTheme(cjs.core);

    const doc = new esm.main.DrawingDocument();
    doc.addLine(0, 0, 10, 10, '0', 1);

    expect(cjs.main.isRenderTheme(esmTheme)).toBe(true);
    expect(esm.main.isRenderTheme(cjsTheme)).toBe(true);
    expect(new cjs.svg.SvgSerializer().serialize(doc, { theme: esmTheme })).toContain('#123456');
    expect(new esm.svg.SvgSerializer().serialize(doc, { theme: cjsTheme })).toContain('#123456');
  });

  it('shares the exact GBK reverse table reference across entries', () => {
    esm.encoding.resetGbkCache();
    const table = esm.encoding.getGbkTable();

    expect(table.size).toBeGreaterThan(20000);
    expect(esm.main.getGbkTable()).toBe(table);
    expect(cjs.encoding.getGbkTable()).toBe(table);
    expect(cjs.main.getGbkTable()).toBe(table);

    // Resetting from one entry must rebuild a new shared instance everywhere.
    cjs.encoding.resetGbkCache();
    const rebuilt = cjs.main.getGbkTable();
    expect(rebuilt).not.toBe(table);
    expect(esm.encoding.getGbkTable()).toBe(rebuilt);
  });

  it('works cleanly across dxf, render, patterns and browser sub-path entries', () => {
    const doc = new esm.core.DrawingDocument();
    esm.patterns.drawHatch(doc, 0, 0, 10, 10, 'diagonal', 'H', 1);
    expect(doc.commands.length).toBeGreaterThan(0);

    const dxfBytes = cjs.dxf.DxfExporter.toBytes(doc, { encoding: 'gbk' });
    expect(dxfBytes.length).toBeGreaterThan(0);

    const reparsed = esm.dxf.parseDxfToDocument(dxfBytes);
    expect(reparsed.commands.length).toBe(doc.commands.length);
    expect(cjs.main.dxfToSvgText(dxfBytes)).toContain('<svg');

    const esmTheme = makeTheme(esm.core);
    const cjsRenderer = new cjs.render.CanvasRenderer({ theme: esmTheme });
    expect(cjsRenderer.getTheme().name).toBe('brand');

    const cjsTheme = makeTheme(cjs.core);
    const esmRenderer = new esm.render.CanvasRenderer({ theme: cjsTheme });
    expect(esmRenderer.getTheme().name).toBe('brand');

    expect(typeof esm.browser.downloadDxf).toBe('function');
    expect(typeof cjs.browser.downloadSvg).toBe('function');

    const vctx = esm.canvas.createVectorContext({ width: 100, height: 50, pxToMm: 1 });
    vctx.strokeRect(5, 5, 40, 20);
    expect(vctx.toDocument().commands).toHaveLength(1);
    expect(cjs.canvas.createVectorContext({ width: 100, height: 50 }).toSvgText()).toContain('<svg');

    const sampleScene = {
      widthMm: 100,
      heightMm: 50,
      pxToMm: 25.4 / 96,
      clips: [],
      nodes: [
        {
          kind: 'text' as const,
          text: '跨入口 DOM 测试',
          rect: { x: 10, y: 10, w: 40, h: 6 },
          x: 10,
          y: 13,
          fontSize: 4,
          fontFamily: 'sans-serif',
          bold: false,
          italic: false,
          color: '#111827',
          hAlign: 0 as const,
          vAlign: 2 as const,
          rot: 0,
          opacity: 1,
        },
      ],
    };
    const domDoc = esm.dom.sceneToDocument(sampleScene);
    expect(domDoc.commands).toHaveLength(1);
    expect(cjs.dom.sceneToVisualSvg(sampleScene)).toContain('跨入口 DOM 测试');
    expect(typeof esm.dom.domToDxfBytes).toBe('function');
    expect(typeof cjs.dom.downloadDomAsDxf).toBe('function');
  });
});
