# VecBridge

**中文** | [English](./README.EN.md) · [在线工作台](https://ivwv.github.io/vecbridge/) · [API 文档](https://ivwv.github.io/vecbridge/api.html) · [GitHub](https://github.com/ivwv/vecbridge) · [npm](https://www.npmjs.com/package/vecbridge)

**零依赖 2D 矢量互转引擎 & Canvas/SVG 双引擎同步预览器** —— 通过统一的图元中间表示（IR），一键打通 **HTML DOM / SVG / Canvas 2D API / AutoCAD DXF** 的解析、互转、双引擎 1:1 预览与归档导出。

- **零运行时依赖**：纯 TypeScript，ESM + CJS + IIFE（`window.VecBridge`）+ `.d.ts`，支持按子路径 tree-shaking。
- **Node / 浏览器同构**：DXF 读写、SVG 读写、Canvas 无头录制与 GBK 编解码均为纯计算，服务端与浏览器输出一致。
- **原生解决 AutoCAD 中文乱码**：内建无依赖 GBK 反查表、`$ACADVER` / `$DWGCODEPAGE` 联合编码自动识别、8 套国标/常用 SHX 大字体配方与 `\U+XXXX` / `\M+nXXXX` / `%%c` 双向转义。
- **Canvas + SVG 1:1 同步预览**：单一 `Camera` 同步驱动光栅与纯矢量双引擎，滚轮以光标为中心缩放、拖拽平移零漂移。

---

## 为什么选择 VecBridge？（直击 5 大痛点）

| 常见痛点 | 传统做法的局限 | VecBridge 的解法 |
| --- | --- | --- |
| **网页表格/报表想导出 AutoCAD** | 只能手写上千行 DXF 坐标拼装，样式一改全盘重算 | **`domToDxfBytes()`**：直接读取浏览器真实布局，自动合并表格重合边框、用原生 `Range` 拆解自动换行、保留表单值与内嵌 `<svg>` |
| **JS 生成/解析 DXF 中文全变问号** | 市面 JS DXF 库大多只写 UTF-8 且不配 SHX 大字体，AutoCAD 打开全是乱码 | 内置零依赖 **GBK (`ANSI_936`) 双向编解码** + 8 套常用中文 SHX/TTF 字体配方；解析外部 DXF 时自动区分 R12 GBK 与 2007+ UTF-8 |
| **已有 Canvas 2D 代码要加导出 CAD** | 要么导出模糊 PNG，要么重写一套 DXF 绘图逻辑并双份维护 | **`recordCanvasContext(realCtx)`**：一行双写拦截，原有 Canvas 2D 代码零改造，屏幕照常渲染的同时自动产出 DXF / SVG |
| **前端想直接预览 DXF 并转 SVG** | 需要引入沉重的 Three.js/WebGL 或依赖后端转换服务 | 零依赖 **ASCII DXF 解析器**（R12~R2024+，支持 `LWPOLYLINE` 凸度、`BLOCKS/INSERT`、`MTEXT`、`SPLINE`、`DIMENSION`）直接接入双引擎预览与 `dxfToSvgText()` |
| **预览图与导出文件对不上** | 预览和导出各写一套渲染代码，字号、虚线、颜色频繁偏差 | **单一事实源 IR**（`DrawingDocument`），DXF / SVG / Canvas 三端消费同一份 `DrawCommand[]` 与样式解析链 |

---

## 格式互转与预览能力矩阵

| 输入来源 \ 目标输出 | 统一 IR (`DrawingDocument`) | DXF R12 (GBK / UTF-8) | 纯矢量 SVG | Canvas 2D 渲染 | 双引擎 1:1 交互预览 |
| --- | :---: | :---: | :---: | :---: | :---: |
| **HTML DOM / HTML 字符串** (`vecbridge/dom`) | ✅ | ✅ | ✅ (`visual` / `cad`) | ✅ | ✅ |
| **SVG 源码** (`parseSvgToDocument`) | ✅ | ✅ (`svgToDxfBytes`) | ✅ | ✅ | ✅ |
| **ASCII DXF** (`parseDxfToDocument`) | ✅ | ✅ (规整重导出) | ✅ (`dxfToSvgText`) | ✅ | ✅ |
| **Canvas 2D API** (`vecbridge/canvas`) | ✅ | ✅ | ✅ | ✅ (双写透传) | ✅ |
| **编程式构建** (`DrawingDocument`) | 原生 | ✅ | ✅ | ✅ | ✅ |

> **边界说明**：
> - 不提供“DXF/SVG 转回 HTML `<div>` DOM”——浏览器原生即可无损渲染 `<svg>` 与 `<canvas>`；
> - 不支持对已光栅化的任意 `<canvas>` 像素逆向还原矢量——通过 `recordCanvasContext(realCtx)` 或无头 `createVectorContext()` 录制矢量指令实现。

---

## 快速体验在线工作台（Playground）

在线直接体验：**[https://ivwv.github.io/vecbridge/](https://ivwv.github.io/vecbridge/)**

也可在本地构建后直接用浏览器打开：

```bash
pnpm install && pnpm build
# 然后在浏览器打开：
# examples/playground.html
```

---

## 安装

```bash
npm install vecbridge
# 或
pnpm add vecbridge
```

---

## 5 分钟上手（四大高频场景）

### 1. 读取外部 DXF → 双引擎预览 / 转 SVG（原生抗 GBK 乱码）

```ts
import { parseDxfWithReport, dxfToSvgText } from 'vecbridge';
import { DualViewPreview, EXTENDED_LIGHT_THEME } from 'vecbridge/render';

// 浏览器读取本地 .dxf 时请传 Uint8Array（避免 file.text() 破坏 GBK 中文）
const bytes = new Uint8Array(await file.arrayBuffer());

// 1) 解析为统一 IR + 诊断报告（自动识别 R12 GBK 与 2007+ UTF-8）
const { document: doc, stats, warnings } = parseDxfWithReport(bytes);
console.log(stats.acadVersion, stats.detectedEncoding, warnings);

// 2) 直接接入 Canvas + SVG 1:1 同步预览
const preview = new DualViewPreview({
  canvas: document.querySelector('#canvas')!,
  svgContainer: document.querySelector('#svg')!,
  theme: EXTENDED_LIGHT_THEME,
});
preview.setDocument(doc, { fit: true });

// 3) 或一步转为白底矢量 SVG（Node / 浏览器通用）
const svgText = dxfToSvgText(bytes);
```

### 2. HTML DOM / 表格 / 表单 → 纯矢量 SVG & AutoCAD DXF

```ts
import { domToSvg, downloadDomAsDxf, htmlToDxfBytes } from 'vecbridge/dom';

const reportEl = document.querySelector('#specSheet')!;

// 高保真纯矢量 SVG（不使用 <foreignObject>，保留真彩背景、圆角与裁剪）
const visualSvg = domToSvg(reportEl, { fitWidthMm: 297, mode: 'visual' });

// 一步下载为 AutoCAD 兼容 GBK DXF（自动合并表格重边、Range 换行、提取表单值与内嵌 <svg>）
downloadDomAsDxf(reportEl, {
  filename: 'spec-sheet.dxf',
  fitWidthMm: 297,
  dedupeBorders: true,
  encoding: 'gbk',
  font: 'gbenor',
});

// 也支持将离屏 HTML 字符串直接转为 DXF 字节
const bytes = htmlToDxfBytes('<table><tr><td>汇总</td></tr></table>', {
  widthPx: 760,
  fitWidthMm: 297,
  css: 'table{border-collapse:collapse} td{border:1px solid #000;padding:6px}',
});
```

### 3. SVG 一键转 DXF

```ts
import { svgToDxfBytes, parseSvgToDocument } from 'vecbridge';

// 一步导出 GBK DXF（支持 path 贝塞尔/椭圆弧、圆角矩形、transform 与 <defs>/<use>）
const dxfBytes = svgToDxfBytes(svgText, {
  encoding: 'gbk',
  font: 'gbenor',
  curveTolerance: 0.1,
});

// 或先解析为 IR 预览/二次叠加图元
const doc = parseSvgToDocument(svgText, { fillMode: 'solid' });
```

### 4. 用标准 Canvas 2D API 绘图或双写拦截 → DXF / SVG

```ts
import { createVectorContext, recordCanvasContext } from 'vecbridge/canvas';

// 方式 A：无头纯代码绘图（Node 与浏览器通用，无需 <canvas> 与 node-canvas）
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

// 方式 B：包裹浏览器真实 CanvasRenderingContext2D，原有绘图代码零改造实现“所绘即所导”
const proxyCtx = recordCanvasContext(realCanvas.getContext('2d')!, { fitWidthMm: 297 });
renderExistingChart(proxyCtx);
const chartDxf = proxyCtx.toDxfBytes({ encoding: 'gbk' });
```

### 5. 浏览器免构建 CDN（IIFE）

```html
<script src="https://unpkg.com/vecbridge/dist/vecbridge.global.js"></script>
<script>
  const { DrawingDocument, parseDxfToDocument, DualViewPreview, downloadDxf } = window.VecBridge;
</script>
```

---

## 子路径入口

| 入口 | 导出内容 | 运行环境 |
| --- | --- | --- |
| `vecbridge` | core + encoding + dxf + svg + canvas + patterns + 一步式互转 | Node / 浏览器 |
| `vecbridge/core` | IR 类型、`DrawingDocument`、主题（基础与扩展 25 色）、样式解析与工具 | 通用 |
| `vecbridge/encoding` | `TextCodec`、`decodeAuto`、`encodeToGbk`、`encodeToUtf8` | 通用（Node 需 full-icu） |
| `vecbridge/dxf` | `DxfSerializer`、`DxfExporter`、`DxfImporter`、`parseDxfToDocument`、`parseDxfWithReport`、`validateCommand` | 通用 |
| `vecbridge/svg` | `SvgSerializer`、`SvgExporter`、`SvgImporter`、`parseSvgToDocument` | 通用 |
| `vecbridge/canvas` | `VectorCanvasContext`、`createVectorContext`、`recordCanvasContext` | 通用（代理模式需真实 ctx） |
| `vecbridge/patterns` | `drawHatch` 与 9 种内置几何填充图案 | 通用 |
| `vecbridge/render` | `Camera`、`Viewport`、`CanvasRenderer`、`SvgLiveView`、`DualViewPreview`、`Emitter` | 浏览器 |
| `vecbridge/browser` | `downloadDxf`、`downloadSvg`、`downloadBytes` | 浏览器 |
| `vecbridge/dom` | `domToDocument`、`domToSvg`、`domToDxf*`、`htmlTo*`、`extractDomScene`、`sceneToDocument` | 浏览器（`sceneTo*` 通用） |
| `vecbridge/global` | 单文件 IIFE（挂载 `window.VecBridge`） | 浏览器 |

---

## 示例与文档

- **[统一在线工作台（Playground）](./examples/playground.html)** — 清新亮色四合一演示（DXF 预览转 SVG / SVG 转 DXF / HTML DOM 转矢量 / Canvas 2D 实时录制）
- **[完整 API 参考](./docs/API.md)** — 全部类、方法、选项、DXF 组码与边界契约（运行 `pnpm docs:api` 可生成可搜索 HTML 版 `docs/api.html`）
- **专项示例**：
  - [`examples/dxf-preview.html`](./examples/dxf-preview.html) — DXF 拖拽上传、多编码切换、双引擎同步预览与 SVG 导出
  - [`examples/svg-to-dxf.html`](./examples/svg-to-dxf.html) — SVG 实时解析与 DXF 导出
  - [`examples/dom-to-dxf.html`](./examples/dom-to-dxf.html) — HTML 规格清单转高保真纯矢量 SVG 与 CAD DXF
  - [`examples/canvas-record.html`](./examples/canvas-record.html) — Canvas 2D 绘图与手绘双写录制转矢量
  - [`examples/browser-demo.html`](./examples/browser-demo.html) — 编程式 API 绘图、填充图案与 16 组合编码/字体批量导出
  - [`examples/node-generate.mjs`](./examples/node-generate.mjs) / [`examples/node-svg-to-dxf.mjs`](./examples/node-svg-to-dxf.mjs) / [`examples/simple-square.mjs`](./examples/simple-square.mjs) — Node 命令行出图与转换脚本
- **[CHANGELOG](./CHANGELOG.md)** — 版本变更记录

---

## 开发与校验

```bash
pnpm typecheck      # tsc --noEmit（分别校验 src 与 test）
pnpm build          # tsup: ESM + CJS + IIFE + .d.ts
pnpm test           # vitest: 单元 + DXF/SVG/DOM/Canvas 互转 + 跨入口 + golden + 烟雾测试
pnpm verify         # 依次执行 typecheck + build + test
pnpm docs:api       # 从 docs/API.md 生成可搜索 docs/api.html
pnpm build:site     # 装配 GitHub Pages 静态站点到 site/（示例 + api.html + dist 浏览器产物）
pnpm pack:check     # 预览即将发布到 npm 的文件清单
```

## 发布（npm + GitHub Pages）

- **npm 手动发包**：运行 `pnpm pack:check` 确认包内清单无误后执行 `npm publish`（`prepublishOnly` 会自动执行 `pnpm verify`，`site/` 与 `docs/api.html` 不会被打包进 npm）。
- **GitHub Pages 自动部署**：在仓库 **Settings → Pages → Source** 中选择 **GitHub Actions**，推送到 `main`（或 `master`）后 `.github/workflows/pages.yml` 会自动校验并发布：
  - [`https://ivwv.github.io/vecbridge/`](https://ivwv.github.io/vecbridge/) — 在线工作台（Playground）与各专题示例
  - [`https://ivwv.github.io/vecbridge/api.html`](https://ivwv.github.io/vecbridge/api.html) — 可搜索 API 文档
  - [`https://ivwv.github.io/vecbridge/dist/vecbridge.global.js`](https://ivwv.github.io/vecbridge/dist/vecbridge.global.js) — 打包后的浏览器 IIFE 产物（同时附带 ESM `.js`）

## 社区与致谢

感谢 [LINUX DO](https://linux.do) 社区的支持与交流，欢迎前往社区讨论反馈或在本仓库提交 Issue / PR。

## License

MIT
