# VecBridge

[中文](./README.md) | **English** · [Live Playground](https://ivwv.github.io/vecbridge/) · [API Docs](https://ivwv.github.io/vecbridge/api.html) · [GitHub](https://github.com/ivwv/vecbridge) · [npm](https://www.npmjs.com/package/vecbridge)

**Zero-dependency 2D vector conversion engine & 1:1 Canvas/SVG dual-engine viewer** — powered by a unified Intermediate Representation (IR) that bridges **HTML DOM, SVG, Canvas 2D API, and AutoCAD DXF** for parsing, cross-format conversion, synchronized preview, and archival export.

- **Zero runtime dependencies**: Pure TypeScript, shipped as ESM + CJS + single-file IIFE (`window.VecBridge`) + `.d.ts`, tree-shakeable via sub-path exports.
- **Isomorphic (Node.js & Browser)**: DXF read/write, SVG read/write, headless Canvas 2D recording, and GBK codec are pure computation with identical output across server and browser.
- **Native CJK / GBK AutoCAD compatibility**: Built-in zero-dependency GBK reverse lookup table, automatic encoding detection (`$ACADVER` + `$DWGCODEPAGE`), 8 CJK SHX/TTF font recipes, and bidirectional `\U+XXXX` / `\M+nXXXX` / `%%c` text escaping.
- **1:1 Synchronized Canvas + SVG Preview**: A single `Camera` drives both raster Canvas and vector SVG engines in lockstep with cursor-anchored wheel zoom and drift-free panning.

---

## Why VecBridge? (5 Pain Points Solved)

| Common Pain Point | Limitation of Traditional Approaches | How VecBridge Solves It |
| --- | --- | --- |
| **Exporting HTML tables/reports to AutoCAD** | Hand-coding thousands of DXF coordinates that break on every layout tweak | **`domToDxfBytes()`**: Reads real browser CSS layout, deduplicates overlapping table borders, splits wrapped text via native `Range`, and preserves form values & embedded `<svg>` |
| **Garbled CJK text in JS-generated/parsed DXF** | Most JS DXF libraries only emit UTF-8 without SHX big fonts, causing mojibake in AutoCAD | Built-in zero-dependency **GBK (`ANSI_936`) codec** + 8 CJK SHX/TTF font recipes; automatically distinguishes R12 GBK from 2007+ UTF-8 when parsing external DXF files |
| **Adding CAD export to existing Canvas 2D code** | Either export blurry PNGs or maintain a duplicate DXF drawing pipeline | **`recordCanvasContext(realCtx)`**: One-line dual-write proxy that renders to the real `<canvas>` as usual while simultaneously recording IR for DXF / SVG export |
| **Previewing DXF & converting to SVG in the browser** | Pulling in heavy WebGL/Three.js stacks or relying on backend conversion services | Zero-dependency **ASCII DXF parser** (R12–R2024+, supporting `LWPOLYLINE` bulge, `BLOCKS/INSERT`, `MTEXT`, `SPLINE`, `DIMENSION`) wired straight into dual-engine preview & `dxfToSvgText()` |
| **Preview doesn't match the exported file** | Separate rendering codebases cause font size, dash pattern, and color drift | **Single-source-of-truth IR** (`DrawingDocument`): DXF, SVG, and Canvas all consume the same `DrawCommand[]` and style resolution pipeline |

---

## Format Conversion & Preview Matrix

| Input Source \ Target Output | Unified IR (`DrawingDocument`) | DXF R12 (GBK / UTF-8) | Pure Vector SVG | Canvas 2D Render | 1:1 Dual-Engine Viewer |
| --- | :---: | :---: | :---: | :---: | :---: |
| **HTML DOM / HTML String** (`vecbridge/dom`) | ✅ | ✅ | ✅ (`visual` / `cad`) | ✅ | ✅ |
| **SVG Source** (`parseSvgToDocument`) | ✅ | ✅ (`svgToDxfBytes`) | ✅ | ✅ | ✅ |
| **ASCII DXF** (`parseDxfToDocument`) | ✅ | ✅ (normalized re-export) | ✅ (`dxfToSvgText`) | ✅ | ✅ |
| **Canvas 2D API** (`vecbridge/canvas`) | ✅ | ✅ | ✅ | ✅ (dual-write tee) | ✅ |
| **Programmatic Builder** (`DrawingDocument`) | Native | ✅ | ✅ | ✅ | ✅ |

> **Scope boundaries**:
> - Does not convert DXF/SVG back into HTML `<div>` DOM — browsers already render `<svg>` and `<canvas>` natively without loss.
> - Does not vectorize arbitrary rasterized `<canvas>` pixels — use `recordCanvasContext(realCtx)` or headless `createVectorContext()` to record vector drawing calls instead.

---

## Online Playground

Try it directly in your browser: **[https://ivwv.github.io/vecbridge/](https://ivwv.github.io/vecbridge/)**

Or build and open it locally:

```bash
pnpm install && pnpm build
# Then open in your browser:
# examples/playground.html
```

---

## Installation

```bash
npm install vecbridge
# or
pnpm add vecbridge
```

---

## Quick Start (Top 5 Workflows)

### 1. Parse External DXF → Dual-Engine Preview / Convert to SVG (CJK-safe)

```ts
import { parseDxfWithReport, dxfToSvgText } from 'vecbridge';
import { DualViewPreview, EXTENDED_LIGHT_THEME } from 'vecbridge/render';

// Pass raw Uint8Array when reading local .dxf files in the browser
// (avoid file.text(), which corrupts GBK-encoded CJK text)
const bytes = new Uint8Array(await file.arrayBuffer());

// 1) Parse into unified IR + diagnostic report (auto-detects R12 GBK vs 2007+ UTF-8)
const { document: doc, stats, warnings } = parseDxfWithReport(bytes);
console.log(stats.acadVersion, stats.detectedEncoding, warnings);

// 2) Render in 1:1 synchronized Canvas + SVG preview
const preview = new DualViewPreview({
  canvas: document.querySelector('#canvas')!,
  svgContainer: document.querySelector('#svg')!,
  theme: EXTENDED_LIGHT_THEME,
});
preview.setDocument(doc, { fit: true });

// 3) Or convert to a print-ready vector SVG in one call (Node & Browser)
const svgText = dxfToSvgText(bytes);
```

### 2. HTML DOM / Tables / Forms → Pure Vector SVG & AutoCAD DXF

```ts
import { domToSvg, downloadDomAsDxf, htmlToDxfBytes } from 'vecbridge/dom';

const reportEl = document.querySelector('#specSheet')!;

// High-fidelity pure vector SVG (no <foreignObject>; preserves colors, border-radius & clipping)
const visualSvg = domToSvg(reportEl, { fitWidthMm: 297, mode: 'visual' });

// One-click download as AutoCAD-compatible GBK DXF (deduped borders, Range line-wrapping, forms & inline <svg>)
downloadDomAsDxf(reportEl, {
  filename: 'spec-sheet.dxf',
  fitWidthMm: 297,
  dedupeBorders: true,
  encoding: 'gbk',
  font: 'gbenor',
});

// Offscreen HTML string conversion is also supported
const bytes = htmlToDxfBytes('<table><tr><td>Summary</td></tr></table>', {
  widthPx: 760,
  fitWidthMm: 297,
  css: 'table{border-collapse:collapse} td{border:1px solid #000;padding:6px}',
});
```

### 3. One-Step SVG to DXF

```ts
import { svgToDxfBytes, parseSvgToDocument } from 'vecbridge';

// Direct export to GBK DXF (supports path Beziers/arcs, rounded rects, transforms & <defs>/<use>)
const dxfBytes = svgToDxfBytes(svgText, {
  encoding: 'gbk',
  font: 'gbenor',
  curveTolerance: 0.1,
});

// Or parse into IR first for preview or additional CAD annotations
const doc = parseSvgToDocument(svgText, { fillMode: 'solid' });
```

### 4. Standard Canvas 2D API (Headless or Dual-Write Proxy) → DXF / SVG

```ts
import { createVectorContext, recordCanvasContext } from 'vecbridge/canvas';

// Mode A: Headless pure-JS drawing (Node & Browser, no <canvas> or node-canvas needed)
const ctx = createVectorContext({ width: 800, height: 600, fitWidthMm: 297 });
ctx.strokeStyle = '#0f5acc';
ctx.strokeRect(20, 20, 760, 560);
ctx.beginPath();
ctx.arc(400, 300, 120, 0, Math.PI * 2);
ctx.stroke();
ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
ctx.fillText('Canvas 2D → CAD', 320, 80);

const dxfBytes = ctx.toDxfBytes({ encoding: 'gbk' });
const svgText = ctx.toSvgText();

// Mode B: Wrap a real browser CanvasRenderingContext2D — zero changes to existing drawing code
const proxyCtx = recordCanvasContext(realCanvas.getContext('2d')!, { fitWidthMm: 297 });
renderExistingChart(proxyCtx);
const chartDxf = proxyCtx.toDxfBytes({ encoding: 'gbk' });
```

### 5. Browser CDN / No-Build Usage (IIFE)

```html
<script src="https://unpkg.com/vecbridge/dist/vecbridge.global.js"></script>
<script>
  const { DrawingDocument, parseDxfToDocument, DualViewPreview, downloadDxf } = window.VecBridge;
</script>
```

---

## Sub-Path Exports

| Entry Point | Exports | Environment |
| --- | --- | --- |
| `vecbridge` | core + encoding + dxf + svg + canvas + patterns + one-step converters | Node / Browser |
| `vecbridge/core` | IR types, `DrawingDocument`, themes (base & 25-color extended), style resolution & utils | Universal |
| `vecbridge/encoding` | `TextCodec`, `decodeAuto`, `encodeToGbk`, `encodeToUtf8` | Universal (Node needs full-icu) |
| `vecbridge/dxf` | `DxfSerializer`, `DxfExporter`, `DxfImporter`, `parseDxfToDocument`, `parseDxfWithReport`, `validateCommand` | Universal |
| `vecbridge/svg` | `SvgSerializer`, `SvgExporter`, `SvgImporter`, `parseSvgToDocument` | Universal |
| `vecbridge/canvas` | `VectorCanvasContext`, `createVectorContext`, `recordCanvasContext` | Universal (proxy needs real ctx) |
| `vecbridge/patterns` | `drawHatch` & 9 built-in geometric hatch patterns | Universal |
| `vecbridge/render` | `Camera`, `Viewport`, `CanvasRenderer`, `SvgLiveView`, `DualViewPreview`, `Emitter` | Browser |
| `vecbridge/browser` | `downloadDxf`, `downloadSvg`, `downloadBytes` | Browser |
| `vecbridge/dom` | `domToDocument`, `domToSvg`, `domToDxf*`, `htmlTo*`, `extractDomScene`, `sceneToDocument` | Browser (`sceneTo*` universal) |
| `vecbridge/global` | Single-file IIFE bundle exposing `window.VecBridge` | Browser |

---

## Examples & Documentation

- **[Unified Playground](./examples/playground.html)** — All-in-one interactive workbench (DXF preview & SVG export / SVG → DXF / HTML DOM → Vector / Canvas 2D live recording)
- **[Full API Reference (Chinese)](./docs/API.md)** — Complete classes, methods, options, DXF group codes & stability contracts (run `pnpm docs:api` to build searchable `docs/api.html`)
- **Focused Demos**:
  - [`examples/dxf-preview.html`](./examples/dxf-preview.html) — Drag-and-drop DXF upload, encoding switcher, dual-engine sync preview & SVG export
  - [`examples/svg-to-dxf.html`](./examples/svg-to-dxf.html) — Live SVG parsing & DXF export
  - [`examples/dom-to-dxf.html`](./examples/dom-to-dxf.html) — HTML specification sheet to high-fidelity vector SVG & CAD DXF
  - [`examples/canvas-record.html`](./examples/canvas-record.html) — Canvas 2D drawing & freehand dual-write recording to vector formats
  - [`examples/browser-demo.html`](./examples/browser-demo.html) — Programmatic API drawing, hatch patterns & 16-combination encoding/font batch export
  - [`examples/node-generate.mjs`](./examples/node-generate.mjs) / [`examples/node-svg-to-dxf.mjs`](./examples/node-svg-to-dxf.mjs) / [`examples/simple-square.mjs`](./examples/simple-square.mjs) — Node.js CLI generation & conversion scripts
- **[CHANGELOG](./CHANGELOG.md)** — Release history

---

## Development & Verification

```bash
pnpm typecheck      # tsc --noEmit (checks src and test separately)
pnpm build          # tsup: ESM + CJS + IIFE + .d.ts
pnpm test           # vitest: unit + DXF/SVG/DOM/Canvas conversion + cross-entry + smoke tests
pnpm verify         # run typecheck + build + test in sequence
pnpm docs:api       # build searchable docs/api.html from docs/API.md
pnpm build:site     # assemble static GitHub Pages bundle into site/ (demos + api.html + browser dist)
pnpm pack:check     # preview exact file list included in npm publish
```

## Publishing (npm + GitHub Pages)

- **Manual npm release**: Run `pnpm pack:check` to inspect the tarball manifest, then run `npm publish` (`prepublishOnly` automatically runs `pnpm verify`; `site/` and `docs/api.html` are excluded from the npm package).
- **Automatic GitHub Pages deployment**: Set **Settings → Pages → Source** to **GitHub Actions**. Pushing to `main` (or `master`) triggers `.github/workflows/pages.yml` to verify and publish:
  - [`https://ivwv.github.io/vecbridge/`](https://ivwv.github.io/vecbridge/) — Online Playground & focused interactive demos
  - [`https://ivwv.github.io/vecbridge/api.html`](https://ivwv.github.io/vecbridge/api.html) — Searchable API reference
  - [`https://ivwv.github.io/vecbridge/dist/vecbridge.global.js`](https://ivwv.github.io/vecbridge/dist/vecbridge.global.js) — Bundled browser IIFE artifact (plus ESM `.js` modules)

## Community & Acknowledgments

Thanks to the [LINUX DO](https://linux.do) community for support and feedback. Feel free to join discussions there or open an issue / PR in this repository.

## License

MIT
