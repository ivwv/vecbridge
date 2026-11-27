# Project Structure

```
E:\.Learn\.Project\vecbridge
├── .github
│   └── workflows
│       └── pages.yml (332 tokens)
├── docs
│   └── API.md (12702 tokens)
├── examples
│   ├── assets
│   │   ├── demo-core.js (2606 tokens)
│   │   ├── demo.css (1938 tokens)
│   │   └── tailwind-theme.js (104 tokens)
│   ├── js
│   │   ├── browser-demo.js (1328 tokens)
│   │   ├── canvas-record.js (2529 tokens)
│   │   ├── dom-to-dxf.js (998 tokens)
│   │   ├── dxf-preview.js (1688 tokens)
│   │   ├── playground.js (5208 tokens)
│   │   └── svg-to-dxf.js (1264 tokens)
│   ├── browser-demo.html (2151 tokens)
│   ├── canvas-record.html (1824 tokens)
│   ├── dom-to-dxf.html (3229 tokens)
│   ├── dxf-preview.html (2175 tokens)
│   ├── node-generate.mjs (872 tokens)
│   ├── node-svg-to-dxf.mjs (317 tokens)
│   ├── playground.html (6506 tokens)
│   ├── simple-square.mjs (297 tokens)
│   └── svg-to-dxf.html (2161 tokens)
├── scripts
│   ├── build-docs.mjs (2742 tokens)
│   └── build-site.mjs (1157 tokens)
├── src
│   ├── browser
│   │   └── index.ts (840 tokens)
│   ├── canvas
│   │   ├── index.ts (72 tokens)
│   │   └── recorder.ts (11321 tokens)
│   ├── core
│   │   ├── color.ts (1618 tokens)
│   │   ├── data.ts (236 tokens)
│   │   ├── decorations.ts (341 tokens)
│   │   ├── document.ts (2546 tokens)
│   │   ├── format.ts (456 tokens)
│   │   ├── index.ts (185 tokens)
│   │   ├── style.ts (446 tokens)
│   │   ├── text.ts (279 tokens)
│   │   ├── theme.ts (1264 tokens)
│   │   ├── types.ts (891 tokens)
│   │   └── xml.ts (78 tokens)
│   ├── dom
│   │   ├── borders.ts (3307 tokens)
│   │   ├── extract.ts (11595 tokens)
│   │   ├── html.ts (1202 tokens)
│   │   ├── index.ts (919 tokens)
│   │   ├── to-document.ts (4826 tokens)
│   │   ├── to-svg.ts (3089 tokens)
│   │   └── types.ts (1617 tokens)
│   ├── dxf
│   │   ├── index.ts (83 tokens)
│   │   ├── parser.ts (16332 tokens)
│   │   └── serializer.ts (3971 tokens)
│   ├── encoding
│   │   ├── codec.ts (1772 tokens)
│   │   ├── gbk-table.ts (989 tokens)
│   │   └── index.ts (81 tokens)
│   ├── patterns
│   │   ├── hatch.ts (2201 tokens)
│   │   └── index.ts (64 tokens)
│   ├── render
│   │   ├── camera.ts (1345 tokens)
│   │   ├── canvas-renderer.ts (1695 tokens)
│   │   ├── dual-view.ts (2907 tokens)
│   │   ├── emitter.ts (371 tokens)
│   │   ├── index.ts (205 tokens)
│   │   ├── svg-live-view.ts (753 tokens)
│   │   └── viewport.ts (896 tokens)
│   ├── svg
│   │   ├── index.ts (84 tokens)
│   │   ├── parser.ts (12632 tokens)
│   │   └── serializer.ts (2422 tokens)
│   ├── dxf-to-svg.ts (418 tokens)
│   ├── global.ts (131 tokens)
│   ├── index.ts (217 tokens)
│   └── svg-to-dxf.ts (517 tokens)
├── test
│   ├── fixtures
│   ├── helpers
│   │   └── sheet-layout.ts (4707 tokens)
│   ├── canvas-record.test.ts (2217 tokens)
│   ├── canvas-renderer.test.ts (2373 tokens)
│   ├── cross-entry.test.ts (1864 tokens)
│   ├── dom-import.test.ts (6410 tokens)
│   ├── dxf-import.test.ts (3307 tokens)
│   ├── page-smoke.test.ts (2735 tokens)
│   ├── render-browser.test.ts (2821 tokens)
│   ├── svg-import.test.ts (2609 tokens)
│   └── unit.test.ts (9141 tokens)
├── .gitignore (12 tokens)
├── CHANGELOG.md (2203 tokens)
├── LICENSE (275 tokens)
├── package.json (803 tokens)
├── pnpm-workspace.yaml (8 tokens)
├── README.md (2135 tokens)
├── tsconfig.json (107 tokens)
├── tsconfig.test.json (31 tokens)
├── tsup.config.ts (280 tokens)
├── tsup.debug.config.ts (279 tokens)
└── vitest.config.ts (48 tokens)

```

# File Contents

## .github\workflows\pages.yml
```yml
name: Deploy GitHub Pages

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Install dependencies
        run: |
          if [ -f pnpm-lock.yaml ]; then
            pnpm install --frozen-lockfile
          else
            pnpm install
          fi

      - name: Verify, build dist and assemble site
        run: |
          pnpm verify
          pnpm docs:api
          node scripts/build-site.mjs

      - name: Configure Pages
        uses: actions/configure-pages@v5

      - name: Upload Pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: site

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4

```

## docs\API.md
```md
# vecbridge API 参考

> 版本 **0.5.0** · 适用于 Node.js 18+ 与现代浏览器
>
> 本文档覆盖 `vecbridge` 的全部公开导出。所有签名均与 `dist/*.d.ts` 一致。

---

## 目录

- [1. 安装与入口](#1-安装与入口)
  - [1.1 安装](#11-安装)
  - [1.2 四种导入方式](#12-四种导入方式)
  - [1.3 子路径入口](#13-子路径入口)
  - [1.4 运行环境](#14-运行环境)
- [2. 核心模型](#2-核心模型)
  - [2.1 坐标、单位与 Y 轴约定](#21-坐标单位与-y-轴约定)
  - [2.2 DrawCommand](#22-drawcommand)
  - [2.3 基础类型](#23-基础类型)
  - [2.4 DrawingDocument](#24-drawingdocument)
  - [2.5 工具函数](#25-工具函数)
  - [2.6 主题](#26-主题)
  - [2.7 文本度量](#27-文本度量)
  - [2.8 装饰选项](#28-装饰选项)
- [3. 字符编码](#3-字符编码)
- [4. DXF 序列化](#4-dxf-序列化)
- [5. SVG 序列化](#5-svg-序列化)
- [6. 填充图案](#6-填充图案)
- [7. 渲染与交互](#7-渲染与交互)
- [8. 浏览器下载](#8-浏览器下载)
- [9. 全局构建（IIFE / CDN）](#9-全局构建iife-cdn)
- [10. 附录](#10-附录)

---

## 1. 安装与入口

### 1.1 安装

```bash
npm install vecbridge
# 或
pnpm add vecbridge
# 或
yarn add vecbridge
```

本包**零运行时依赖**，`sideEffects: false`，支持 tree-shaking。

### 1.2 四种导入方式

**ESM（推荐）**

```ts
import { DrawingDocument, DxfExporter, parseDxfToDocument, drawHatch } from 'vecbridge';
import { DualViewPreview } from 'vecbridge/render';
import { downloadDxf } from 'vecbridge/browser';
```

**CommonJS**

```js
const { DrawingDocument, DxfExporter } = require('vecbridge');
const { DualViewPreview } = require('vecbridge/render');
```

**浏览器 ESM（免构建）**

```html
<script type="module">
  import { DrawingDocument, DxfExporter } from 'https://esm.sh/vecbridge';
  import { DualViewPreview } from 'https://esm.sh/vecbridge/render';
</script>
```

**浏览器 IIFE（CDN，全局变量 `VecBridge`）**

```html
<script src="https://unpkg.com/vecbridge/dist/vecbridge.global.js"></script>
<!-- 或 https://cdn.jsdelivr.net/npm/vecbridge/dist/vecbridge.global.js -->
<script>
  const { DrawingDocument, DxfExporter, DualViewPreview } = window.VecBridge;
</script>
```

### 1.3 子路径入口

| 入口 | 导出内容 | 运行环境 |
| --- | --- | --- |
| `vecbridge` | core + encoding + dxf + svg + canvas + patterns + `svgToDxf*` + `dxfToSvgText` | Node / 浏览器 |
| `vecbridge/core` | 类型、`DrawingDocument`、主题、文本度量、工具函数 | 通用 |
| `vecbridge/encoding` | `TextCodec`、编解码便捷函数、GBK 表管理 | 通用 |
| `vecbridge/dxf` | `DxfSerializer`、`DxfExporter`、`DxfImporter`、`parseDxfToDocument`、`parseDxfWithReport`、`unescapeDxfText`、`stripMtextFormatting`、`validateCommand` | 通用 |
| `vecbridge/svg` | `SvgSerializer`、`SvgExporter`、`SvgImporter`、`parseSvgToDocument` | 通用 |
| `vecbridge/canvas` | `VectorCanvasContext`、`createVectorContext`、`recordCanvasContext` | 通用（双写代理需真实 ctx） |
| `vecbridge/render` | `Camera`、`Viewport`、`CanvasRenderer`、`SvgLiveView`、`DualViewPreview`、`Emitter` | 浏览器 |
| `vecbridge/patterns` | `drawHatch`、`HatchPattern` | 通用 |
| `vecbridge/browser` | `downloadBytes`、`downloadDxf`、`downloadSvg` | 浏览器 |
| `vecbridge/dom` | `domToDocument`、`domToSvg`、`domToDxfText`、`domToDxfBytes`、`downloadDomAsDxf`、`downloadDomAsSvg`、`htmlToDocument`、`htmlToSvg`、`htmlToDxfText`、`htmlToDxfBytes`、`extractDomScene`、`extractHtmlScene`、`sceneToDocument`、`sceneToVisualSvg` | 浏览器（`sceneTo*` 通用） |
| `vecbridge/global` | IIFE 文件，挂载 `window.VecBridge` | 浏览器 |
| `vecbridge/package.json` | 包清单 | — |

### 1.4 运行环境

| 能力 | Node.js | 浏览器 |
| --- | --- | --- |
| `DrawingDocument` / `DxfSerializer` / `DxfExporter` | ✅ | ✅ |
| `SvgSerializer` / `SvgExporter` | ✅ | ✅ |
| `TextCodec`（GBK 解码） | ✅ 需 full-icu（官方构建默认包含） | ✅ |
| `drawHatch` | ✅ | ✅ |
| `Camera` / `Emitter` | ✅（纯计算） | ✅ |
| `Viewport` / `CanvasRenderer` / `SvgLiveView` / `DualViewPreview` | ❌ 需要 DOM | ✅ |
| `downloadBytes` / `downloadDxf` / `downloadSvg` | ❌ | ✅ |
| `domToDocument` / `domToSvg` / `domToDxf*` | ❌ 需要真实布局 DOM（可经 Playwright 提取 `DomScene` 后在 Node 调用 `sceneToDocument`） | ✅ |

> Node 端需要 GBK 时，可先调用 `textCodec.isGbkSupported()` 检测；若为 `false`，GBK 编码会退化为 UTF-8 解码，且 `encodeToGbk` 的反查表为空（所有非 ASCII 字符都会被转义为 `\U+XXXX`）。

---

## 2. 核心模型

### 2.1 坐标、单位与 Y 轴约定

- 所有坐标使用**毫米（mm）**，世界坐标系为 **Y 轴向上**（CAD 习惯）。
- `DrawingDocument` 在 `add*()` 时**一次性**把 `setOffset(ox, oy)` 叠加到坐标上，IR 中保存的是最终世界坐标。之后再改 offset **不会**影响已添加的图元。
- SVG 与 Canvas 渲染时会做 `y → -y` 翻转；`Camera` 的符号约定与之配套（详见 [7.1](#71-camera)）。

### 2.2 DrawCommand

`DrawCommand` 是所有后端的唯一数据源，共五种：

```ts
type DrawCommand =
  | LineCommand
  | CircleCommand
  | PolylineCommand
  | TextCommand
  | SolidCommand;

interface CommandBase {
  layer: string;                       // 目标图层名
  color: number | null;                // ACI 索引；null = BYLAYER（省略组码 62），0 = BYBLOCK
  linetype?: Linetype | null;          // 可选实体线型（组码 6）
  data?: Record<string, unknown>;      // 应用自定义载荷，序列化器忽略
}

interface LineCommand extends CommandBase {
  type: 'line';
  x1: number; y1: number; x2: number; y2: number;
}

interface CircleCommand extends CommandBase {
  type: 'circle';
  cx: number; cy: number; r: number;
}

interface PolylineCommand extends CommandBase {
  type: 'polyline';
  points: readonly Point[];            // [[x, y], ...]
  closed: boolean;
  lineWidth: number;                   // 0 表示使用默认线宽
  paper?: boolean;                     // 渲染提示：闭合四点矩形代表纸张
}

interface TextCommand extends CommandBase {
  type: 'text';
  x: number; y: number; h: number;     // 插入点与字高（mm）
  text: string;
  rot: number;                         // 旋转角（度，逆时针）
  hAlign: HAlign;                      // 0 左 / 1 中 / 2 右
  vAlign: VAlign;                      // 0 基线 / 1 底 / 2 中 / 3 顶
  widthFactor: number;                 // 宽度因子（STYLE 41）
  bold?: boolean;                      // 渲染提示：粗体
}

interface SolidCommand extends CommandBase {
  type: 'solid';
  points: readonly Point[];            // 3 或 4 个按轮廓顺序排列的顶点（DXF 端自动转为 SOLID Z 序）
}
```

> `color: null` 与 `color: 0` 语义不同：前者省略组码 62（BYLAYER），后者输出 `62 / 0`（BYBLOCK）。ACI `256` 同样代表显式 BYLAYER。
>
> SVG 与 Canvas 渲染前会通过 `resolveCommandStyle()` 从 `layers` 解析 BYLAYER 颜色与线型；DXF 依赖 CAD 原生随层机制。图层重名时以首次定义为准。

### 2.3 基础类型

```ts
type Linetype = 'CONTINUOUS' | 'DASHED' | 'DOT';
type HAlign = 0 | 1 | 2;
type VAlign = 0 | 1 | 2 | 3;
type Point = readonly [number, number];

interface Extents { minX: number; minY: number; maxX: number; maxY: number; }
interface ViewBox { x: number; y: number; w: number; h: number; }
interface LayerDef { name: string; color: number; linetype: Linetype; }

interface DocumentData {
  layers: readonly LayerDef[];
  commands: readonly DrawCommand[];
  extents: Extents;
}

type DocumentLike = DocumentData | { toJSON(): DocumentData };
```

`DocumentLike` 让所有序列化器既能接受纯 JSON 快照，也能直接接受 `DrawingDocument` 实例。

```ts
function resolveDocumentData(doc: DocumentLike): DocumentData;
```

若传入对象带有 `toJSON()` 方法则调用它，否则视为 `DocumentData` 原样返回。

### 2.4 DrawingDocument

Builder + Command IR。只负责收集图元，不做序列化、不触碰 DOM。

```ts
import { DrawingDocument } from 'vecbridge';

const doc = new DrawingDocument({
  extents: { minX: 0, minY: 0, maxX: 297, maxY: 210 }, // 默认即 A4 横版
  offset: [0, 0],
  text: { lineGapFactor: 1.35 },
});
```

#### 构造函数

```ts
interface DrawingDocumentOptions {
  extents?: Partial<Extents>;
  offset?: Point;
  text?: Partial<TextMetricsPolicy>;
}

// 用法
declare const options: DrawingDocumentOptions;
const doc = new DrawingDocument(options);
```

| 选项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `extents` | `Partial<Extents>` | `{0, 0, 297, 210}` | 图纸范围；影响 DXF `$EXTMIN/$EXTMAX`、SVG 自动 viewBox、`Camera.fit()` |
| `offset` | `Point` | `[0, 0]` | 初始原点偏移 |
| `text.lineGapFactor` | `number` | `1.35` | 多行文本行距系数 |

#### 属性

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `layers` | `LayerDef[]` | 图层定义（可读写数组，`addLayer` 追加，不去重） |
| `commands` | `DrawCommand[]` | 图元 IR（可读写数组） |
| `extents` | `Extents`（只读 getter） | 当前图纸范围 |
| `offsetX` / `offsetY` | `number`（只读 getter） | 当前原点偏移 |
| `ox` / `oy` | `number`（只读 getter） | `offsetX` / `offsetY` 的别名 |

#### 方法

所有 `add*` 方法都返回 `this`，支持链式调用。

##### `setOffset(ox, oy): this`

设置后续 `add*()` 使用的原点偏移。**只影响之后添加的图元**。

##### `setExtents(minX, minY, maxX, maxY): this`

直接覆盖图纸范围（不累积）。

> `extents` **不会**随图元自动更新。忘记调用时，DXF 的 `$EXTMIN/$EXTMAX`、SVG 自动 viewBox 与 `Camera.fit()` 都会按默认 A4 计算，可能裁切或偏离图形。需要自动包围盒时请在应用层根据图元计算后调用本方法。

##### `addLayer(name, color?, linetype?): this`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `name` | `string` | 必填 |
| `color` | `number` | `7` |
| `linetype` | `Linetype` | `'CONTINUOUS'` |

> 同名图层不会去重——DXF 的 LAYER 表条目数与调用次数一致。AutoCAD 遇到重复 `LAYER` 记录会报 `Duplicate record name` 并拒绝打开文件，调用方需自行保证图层名唯一。

##### `addLine(x1, y1, x2, y2, layer?, color?, linetype?): this`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `x1, y1, x2, y2` | `number` | 必填 |
| `layer` | `string` | `'0'` |
| `color` | `number \| null` | `null`（BYLAYER） |
| `linetype` | `Linetype \| null` | `null`（随层） |

##### `addRect(x1, y1, x2, y2, layer?, color?, lineWidth?, options?): this`

以左下角 `(x1, y1)`、右上角 `(x2, y2)` 生成闭合四点多段线，点序为
`[x1,y1] → [x2,y1] → [x2,y2] → [x1,y2]`。

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `layer` | `string` | `'0'` |
| `color` | `number \| null` | `null` |
| `lineWidth` | `number` | `0` |
| `options.paper` | `boolean` | `false` |

`options.paper: true` 会打上纸张标记，浅色主题下 Canvas/SVG 会把该矩形填成白纸。

```ts
interface AddRectOptions { paper?: boolean; }
```

##### `addCircle(cx, cy, r, layer?, color?, linetype?): this`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `layer` | `string` | `'0'` |
| `color` | `number \| null` | `null` |
| `linetype` | `Linetype \| null` | `null`（随层） |

##### `addPolyline(points, layer?, color?, closed?, lineWidth?, options?): this`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `points` | `readonly Point[]` | 必填；空数组直接忽略 |
| `layer` | `string` | `'0'` |
| `color` | `number \| null` | `null` |
| `closed` | `boolean` | `false` |
| `lineWidth` | `number` | `0` |
| `options.paper` | `boolean` | `false` |
| `options.linetype` | `Linetype` | 不设置（随层） |

```ts
interface AddPolylineOptions {
  paper?: boolean;
  linetype?: Linetype;
}
```

##### `addSolid(points, layer?, color?): this`

添加实心填充区域（对应 DXF R12 `SOLID` 实体）。`points` 按自然轮廓顺序传入：3~4 个顶点直接生成单条 `solid` 命令；超过 4 个顶点的凸多边形会自动扇形拆分为若干四边形/三角形。少于 3 点静默忽略。

##### `addSolidRect(x1, y1, x2, y2, layer?, color?): this`

以对角两点 `(x1, y1)`、`(x2, y2)` 添加一条 4 顶点实心填充矩形。

##### `addText(x, y, h, text, layer?, color?, rot?, hAlign?, vAlign?, widthFactor?, options?): this`

| 参数 | 类型 | 默认值 |
| --- | --- | --- |
| `x, y` | `number` | 插入点 |
| `h` | `number` | 字高（mm） |
| `text` | `string \| number \| null \| undefined` | 文本；`null`/`undefined`/`''` 直接忽略 |
| `layer` | `string` | `'0'` |
| `color` | `number \| null` | `null` |
| `rot` | `number` | `0` |
| `hAlign` | `HAlign` | `0`（左对齐） |
| `vAlign` | `VAlign` | `0`（基线） |
| `widthFactor` | `number` | `0.85` |
| `options.bold` | `boolean` | `false` |

```ts
interface AddTextOptions { bold?: boolean; }
```

**多行文本行为**

- 按 `\r\n`、`\r` 或 `\n` 拆分为多行，每行生成一个独立的 `text` 命令。
- 行距 = `h * lineGapFactor`（默认 `h * 1.35`）。
- 整块文本以 `(x, y)` 为**垂直中心**展开：`subY = y + (n - 1) * lineGap / 2 - i * lineGap`。
- `rot != 0` 时，行偏移沿旋转后的基线法向量 `(-sin(rot), cos(rot))` 排列，竖排多行标注不会重叠。
- 空行不生成命令，但仍参与行距计算（例如 `"A\n\nB"` 会保留两倍行距的间隔）。
- 单行文本会执行 `trim()`；纯空白直接忽略。

```ts
doc.addText(148, 190, 4, '第一行\n第二行', 'TITLE', 7, 0, 1, 2, 0.9, { bold: true });
```

##### `clear(): this`

清空 `layers` 与 `commands`；**不清空** `extents` 与 `offset`。

##### `toJSON(): DocumentData`

返回快照。注意：`layers`、`commands`、`extents` 返回的是**内部引用**，不是深拷贝。需要持久化时请自行 `JSON.parse(JSON.stringify(doc.toJSON()))`，或直接 `JSON.stringify`。

##### `DrawingDocument.fromJSON(data): DrawingDocument`

```ts
const restored = DrawingDocument.fromJSON(json);
```

使用 `data.extents` 初始化，并把 `layers` / `commands` 浅拷贝进新实例。

### 2.5 工具函数

#### `fmtNumber(n): string`

DXF 坐标、SVG 属性与 viewBox 共用的数字格式：

- 非有限值（`NaN`、`±Infinity`）→ `"0"`
- 保留 4 位小数后去掉尾零：`1.5` → `"1.5"`，`1.234567` → `"1.2346"`
- `-0` → `"0"`

```ts
fmtNumber(1.5);       // '1.5'
fmtNumber(1.234567);  // '1.2346'
fmtNumber(NaN);       // '0'
```

#### `escapeXml(value): string`

转义 `& < > " '`，用于 SVG 文本与属性。

```ts
escapeXml('a & b < c'); // 'a &amp; b &lt; c'
```

#### `createLayerLookup(layers)` / `resolveCommandStyle(cmd, lookup)`

供 SVG 与 Canvas 渲染器共用的 BYLAYER 样式解析工具：

```ts
type LayerLookup = ReadonlyMap<string, LayerDef>;

interface ResolvedCommandStyle {
  color: number | null;
  linetype: Linetype | null;
}

function createLayerLookup(layers: readonly LayerDef[]): LayerLookup;
function resolveCommandStyle(cmd: DrawCommand, layers: LayerLookup): ResolvedCommandStyle;
```

- 重名图层以首次定义为准；
- 解析优先级：图元显式值 > 所属图层定义 > `null`（主题默认色 / 实线）；
- `color: null` 与 `color: 256` 均视为 BYLAYER 继承图层颜色。

### 2.6 主题

```ts
interface ThemeDefinition {
  name: string;
  isDark: boolean;
  background: string;        // 预览背景
  exportBackground: string;  // 导出模式背景
  paper: string;             // 纸张填充色
  defaultColor: string;      // ACI 未命中时的兜底色
  aci: Readonly<Record<number, string>>;
}

class RenderTheme {
  constructor(definition: ThemeDefinition);
  readonly name: string;
  readonly isDark: boolean;
  readonly background: string;
  readonly exportBackground: string;
  readonly paper: string;
  readonly defaultColor: string;

  resolveAci(aci: number | null | undefined): string;
  backgroundFor(mode: 'live' | 'export'): string;
}
```

#### 内置主题

| 字段 | `DARK_THEME` | `LIGHT_THEME` |
| --- | --- | --- |
| `background` | `#111418` | `#e5e7eb` |
| `exportBackground` | `#111418` | `#ffffff` |
| `paper` | `#ffffff` | `#ffffff` |
| `defaultColor` | `#f0f4f8` | `#111827` |
| ACI 1（红） | `#ff3b30` | `#d92121` |
| ACI 3（绿） | `#32d74b` | `#168f33` |
| ACI 5（蓝） | `#409cff` | `#0f5acc` |
| ACI 8（灰） | `#76808f` | `#6b7280` |

此外还提供全常用 ACI 调色板扩展主题 **`EXTENDED_DARK_THEME`** 与 **`EXTENDED_LIGHT_THEME`**（覆盖黄、青、品红、橙、琥珀、深绿、青绿、天蓝、紫、浅灰等 25 种常用 ACI 索引），适合将多色 SVG 或 HTML DOM 转换结果传入 `DualViewPreview` / `SvgSerializer` 时获得更高色彩还原度。

#### `isRenderTheme(value): value is RenderTheme` / `resolveTheme(input?): RenderTheme`

`isRenderTheme()` 基于全局 `Symbol.for('vecbridge.RenderTheme')` 品牌标识判定，在 ESM + CJS 双包混用或跨子路径导入场景下也能可靠识别自定义 `RenderTheme` 实例。

```ts
isRenderTheme(customTheme);     // true（跨子路径 / ESM+CJS 同样有效）
resolveTheme();                 // DARK_THEME
resolveTheme('light');          // LIGHT_THEME
resolveTheme('dark');           // DARK_THEME
resolveTheme(customTheme);      // 原样返回 RenderTheme 实例
```

#### 自定义主题

```ts
import { RenderTheme } from 'vecbridge';

const blueprint = new RenderTheme({
  name: 'blueprint',
  isDark: true,
  background: '#0b2545',
  exportBackground: '#0b2545',
  paper: '#ffffff',
  defaultColor: '#dbeafe',
  aci: { 1: '#ff6b6b', 3: '#51cf66', 5: '#4dabf7', 8: '#8d99ae' },
});

new SvgSerializer().serialize(doc, { theme: blueprint });
```

### 2.7 文本度量

```ts
interface TextMetricsPolicy {
  defaultWidthFactor: number;   // 默认 0.85
  svgSizeFactor: number;        // 默认 1.04（仅 SVG）
  canvasSizeFactor: number;     // 默认 1.05（仅 Canvas）
  lineGapFactor: number;        // 默认 1.35（多行行距）
  svgFontFamily: string;        // 'Microsoft YaHei, SimSun, sans-serif'
  canvasFontFamily: string;     // '"Microsoft YaHei", sans-serif'
  minCanvasFontPx: number;      // 默认 2.2（低于此像素值不绘制）
}

const DEFAULT_TEXT_METRICS: Readonly<TextMetricsPolicy>;
```

> `svgSizeFactor` 与 `canvasSizeFactor` **故意不同**，字体栈也不同。这是输出稳定性的一部分，请勿为了“统一”而改成同一个值。

覆盖方式：在 `SvgSerializer` / `CanvasRenderer` / `DualViewPreview` 的 `text` 选项中传 `Partial<TextMetricsPolicy>`。

```ts
new SvgSerializer().serialize(doc, {
  text: { svgFontFamily: '"Noto Sans SC", sans-serif', svgSizeFactor: 1.06 },
});
```

### 2.8 装饰选项

```ts
interface DecorationOptions {
  paperFillLayers?: readonly string[];  // 这些图层的闭合四点矩形按纸张填充
  boldLayers?: readonly string[];       // 这些图层的文本按粗体渲染
}

function isPaperCommand(cmd: DrawCommand, decorations?: DecorationOptions): cmd is PolylineCommand;
function isBoldText(cmd: TextCommand, decorations?: DecorationOptions): boolean;
```

优先级：**IR 元数据（`paper` / `bold`）> 图层名配置**。默认配置为空，库不会猜测调用方的图层命名。

```ts
new SvgSerializer().serialize(doc, {
  decorations: {
    paperFillLayers: ['FRAME_OUTER'],
    boldLayers: ['TEXT_TITLE'],
  },
});
```

---

## 3. 字符编码

### 3.1 TextCodec

```ts
type EncodingName = 'utf-8' | 'gbk' | 'gb2312' | 'gb18030';

interface TextCodecOptions {
  /** 每次 encodeToGbk() 调用回调一次，参数为本次无法编码字符的汇总数组。 */
  onUnencodable?: (entries: string[]) => void;
  warnOnUnencodable?: boolean;                  // 是否 console.info 汇总（默认 false）
}

class TextCodec {
  constructor(options?: TextCodecOptions);

  decode(bytes: Uint8Array, encoding?: EncodingName | string): string;
  decodeAuto(bytes: Uint8Array): string;
  encodeToUtf8(str: string): Uint8Array;
  encodeToGbk(str: string): Uint8Array;

  isGbkSupported(): boolean;
  warmup(): void;
  getTableSize(): number;
}
```

#### `decode(bytes, encoding = 'utf-8'): string`

按显式编码解码。`'gbk' | 'gb2312' | 'gb18030'` 走 GBK 解码器；其他值走 UTF-8。若环境不支持 GBK 解码器，会回退为 UTF-8。

#### `decodeAuto(bytes): string`

自动识别顺序：

1. UTF-8 BOM（`EF BB BF`）→ UTF-8
2. UTF-16 LE BOM（`FF FE`）→ UTF-16LE
3. UTF-16 BE BOM（`FE FF`）→ UTF-16BE
4. 严格 UTF-8 解码（`fatal: true`）
5. GBK 解码；若替换字符（`U+FFFD`）占比 < 5%，采用结果
6. 宽松 UTF-8 解码兜底

空输入返回 `''`。

#### `encodeToUtf8(str): Uint8Array`

等价于 `new TextEncoder().encode(str)`。

#### `encodeToGbk(str): Uint8Array`

把字符串编码为 GBK 字节。**GBK 字库外的字符**（如 emoji、生僻字）会转义为 CAD 原生文本 `\U+XXXX`：

```ts
textCodec.encodeToGbk('A中😀');
// 'A' + GBK('中') + '\U+D83D\U+DE00'
```

注意：遍历按 UTF-16 code unit 进行，增补平面字符会产生**两个**转义序列（与 v1 输出契约一致）。

> `\U+XXXX` 是 DXF R13+ 的语法：极老的 R12 解析器或部分 CAM 软件可能把它当普通字符串显示；代理对（emoji、Ext-B 生僻字）不会被 AutoCAD 合并还原。需要严格控制字符集时，请在写入前自行过滤。
>
> 另外，浏览器/Node 的 `TextDecoder('gbk')` 按 WHATWG 标准实现（实际为 GB18030 子集），与 Windows 原生 `CP936` 在极少数码位上存在细微差异。

#### `isGbkSupported(): boolean`

当前环境是否提供 GBK 解码器。

#### `warmup(): void`

强制构建 Unicode → GBK 反查表（约 2.4 万条）。批量任务建议每个 worker 调用一次。

#### `getTableSize(): number`

返回反查表条目数；环境不支持 GBK 时为 `0`。

#### 自定义编解码器

```ts
const codec = new TextCodec({
  onUnencodable: (entries) => console.warn('转义字符:', entries),
  warnOnUnencodable: true,
});

new DxfSerializer({ codec }).toBytes(doc, { encoding: 'gbk' });
```

### 3.2 便捷函数

以下函数都委托给共享实例 `textCodec`：

```ts
const textCodec: TextCodec;

function decode(bytes: Uint8Array, encoding?: EncodingName | string): string;
function decodeAuto(bytes: Uint8Array): string;
function encodeToUtf8(str: string): Uint8Array;
function encodeToGbk(str: string): Uint8Array;
```

### 3.3 GBK 表管理

```ts
function isGbkSupported(): boolean;
function getGbkTable(): Map<string, [number, number]>;  // Unicode 字符 -> [lead, trail]
function resetGbkCache(): void;                        // 测试用：清空缓存，下次重建
```

---

## 4. DXF 序列化

> ⚠️ **传统 CAD 请使用 GBK。** AutoCAD、中望、浩辰等 R12 读取器不识别 `$DWGCODEPAGE = UTF-8`，会按本机 ANSI 代码页（如 `ANSI_936`）解码字节，中文会乱码。`encoding: 'utf8'` 仅适用于支持 UTF-8 探测的现代查看器（QCAD、LibreCAD、部分在线转换器）。

### 4.1 DxfSerializer

```ts
type DxfEncoding = 'gbk' | 'utf8';
type DxfFontPreset =
  | 'gbcbig'
  | 'gbenor'
  | 'gbeitc'
  | 'hztxt'
  | 'hzfs'
  | 'romans'
  | 'tssd'
  | 'simsun';

interface DxfFontRecipe {
  primary: string;  // 组码 3 主字体（如 gbenor.shx / simsun.ttf）
  big?: string;     // 组码 4 大字体（如 gbcbig.shx / hztxt.shx）
}

type DxfFont = DxfFontPreset | DxfFontRecipe;
type NewlineStyle = 'crlf' | 'lf';

const DXF_FONT_RECIPES: Readonly<
  Record<DxfFontPreset, Readonly<{ primary: string; big: string }>>
>;
function resolveDxfFont(font?: DxfFont): { primary: string; big: string };

interface DxfSerializeOptions {
  encoding?: DxfEncoding;  // 默认 'gbk'
  font?: DxfFont;          // 默认 'gbcbig'
  newline?: NewlineStyle;  // 默认 'crlf'
  /** 跳过会让 CAD 拒绝整份文件的非法实体。默认 true。 */
  validate?: boolean;
  /** 每个被跳过的实体回调一次，参数为原因。 */
  onInvalidCommand?: (command: DrawCommand, reason: string) => void;
}

class DxfSerializer {
  constructor(options?: { codec?: TextCodec });

  serialize(doc: DocumentLike, options?: DxfSerializeOptions): string;
  toBytes(doc: DocumentLike, options?: DxfSerializeOptions): Uint8Array;
}

/** 独立预检单个图元是否可安全写入 DXF；合法返回 null，非法返回原因文本。 */
function validateCommand(command: DrawCommand): string | null;
```

被判定为非法的实体包括：`CIRCLE` 半径 `<= 0`、`TEXT` 字高/宽度因子 `<= 0`、`TEXT` 旋转角非有限或对齐值越界、非有限坐标、ACI 索引非 `0..256` 整数、单顶点 `POLYLINE`。传 `validate: false` 可关闭校验（不推荐）。

> 所有写入 DXF 值行的文本与线型都会自动拍平 `CR/LF`；图层名会过滤 DXF 符号表禁止字符（`<>\/":;?*|,=\`` 及控制字符）、裁剪前后空白，并在 `encoding: 'gbk'` 模式下将非 GBK 字符替换为 `_`（避免编码阶段在 `LAYER` 表中注入 `\U+XXXX`），空/纯空白图层名回落为 `'0'`。`LAYER` 表会跳过清洗后为 `'0'` 的条目，避免与默认 `'0'` 层重复。

#### `serialize(doc, options?): string`

生成 DXF R12（`AC1009`）文本。行尾默认 `\r\n`；`newline: 'lf'` 可改为 `\n`（便于测试与版本控制）。

```ts
const text = new DxfSerializer().serialize(doc, {
  encoding: 'gbk',
  font: 'gbcbig',
  newline: 'lf',
});
```

#### `toBytes(doc, options?): Uint8Array`

`serialize()` + 按 `encoding` 编码：

- `'gbk'` → `TextCodec.encodeToGbk`（超出字库转 `\U+XXXX`）
- `'utf8'` → `TextCodec.encodeToUtf8`

### 4.2 DxfExporter

无状态静态封装，适合 Node 批量出图：

```ts
class DxfExporter {
  static toText(doc: DocumentLike, options?: DxfSerializeOptions): string;
  static toBytes(doc: DocumentLike, options?: DxfSerializeOptions): Uint8Array;
}
```

```ts
import { writeFileSync } from 'node:fs';
import { DrawingDocument, DxfExporter, textCodec } from 'vecbridge';

textCodec.warmup();
const bytes = DxfExporter.toBytes(doc, { encoding: 'gbk', font: 'gbcbig' });
writeFileSync('out.dxf', bytes);
```

#### 批量导出与文件命名

同一份图纸常需要导出多种编码/字体组合。建议把选项写进文件名，避免事后无法区分：

```ts
const ENCODINGS = ['gbk', 'utf8'] as const;
const FONTS = [
  'gbcbig',
  'gbenor',
  'gbeitc',
  'hztxt',
  'hzfs',
  'romans',
  'tssd',
  'simsun',
] as const;

for (const encoding of ENCODINGS) {
  for (const font of FONTS) {
    const bytes = DxfExporter.toBytes(doc, { encoding, font });
    writeFileSync(`drawing-${encoding}-${font}.dxf`, bytes);
  }
}
// drawing-gbk-gbcbig.dxf / drawing-gbk-gbenor.dxf / … / drawing-utf8-simsun.dxf
```

浏览器端同理：

```ts
downloadDxf(doc, {
  filename: `drawing-${encoding}-${font}.dxf`,
  encoding,
  font,
});
```

| 建议字段 | 取值 | 说明 |
| --- | --- | --- |
| `encoding` | `gbk` / `utf8` | 决定 `$DWGCODEPAGE` 与字节编码 |
| `font` | `gbcbig` / `gbenor` / `gbeitc` / `hztxt` / `hzfs` / `romans` / `tssd` / `simsun` | 决定 STYLE 表字体配方 |
| 其他 | `newline`、版本号、日期 | 可选，便于区分批次 |

完整可运行示例见 [`examples/browser-demo.html`](../examples/browser-demo.html)（下拉切换 + 文件名预览）与 [`examples/node-generate.mjs`](../examples/node-generate.mjs)（`all` 模式一次导出 16 份）。

### 4.3 字体配方

| `font` | `STYLE` 主字体（组码 3） | 大字体（组码 4） | 说明 |
| --- | --- | --- | --- |
| `gbcbig` | `txt.shx` | `gbcbig.shx` | 默认，AutoCAD 中文环境常用 |
| `gbenor` | `gbenor.shx` | `gbcbig.shx` | 国标正体西文 + 国标长仿宋，主流国标组合 |
| `gbeitc` | `gbeitc.shx` | `gbcbig.shx` | 国标倾斜西文 + 国标长仿宋，标注常用 |
| `hztxt` | `txt.shx` | `hztxt.shx` | 老设计院、旧图纸高频标配 |
| `hzfs` | `txt.shx` | `hzfs.shx` | 仿宋单线，部分地方院图纸常用 |
| `romans` | `romans.shx` | `gbcbig.shx` | 单线 Roman 西文 + 国标长仿宋，机械图常用 |
| `tssd` | `tssdeng.shx` | `tssdchn.shx` | 探索者 TSSD 钢筋符号与配筋文字，结构图常用 |
| `simsun` | `simsun.ttf` | *(空)* | TrueType，Windows 上通常可回退生效 |

也可以直接传入自定义配方对象自由组合西文与中文大字体：

```ts
DxfExporter.toBytes(doc, {
  encoding: 'gbk',
  font: { primary: 'romans.shx', big: 'hztxt.shx' },
});
```

> `simsun.ttf` 在 Windows AutoCAD 上通常可用；macOS / Linux CAD 或缺少 TrueType 字体映射时可能回退为默认字体并丢失中文。跨平台交付建议优先 `gbcbig` 或 `gbenor`。
>
> 所有字体名都写入 R12 `STYLE` 表，实际显示取决于目标机器是否安装了对应 SHX / TTF 字体。

### 4.4 输出结构

生成的 DXF 固定按以下顺序：

1. **HEADER**
   - `$ACADVER` = `AC1009`
   - `$DWGCODEPAGE` = `ANSI_936`（GBK）或 `UTF-8`
   - `$MEASUREMENT` = `1`（公制）
   - `$LTSCALE` = `1.0`
   - `$EXTMIN` / `$EXTMAX` / `$LIMMIN` / `$LIMMAX`
2. **TABLES**
   - `LTYPE`：`CONTINUOUS`、`DASHED`（2.2 / 1.3 / -0.9）、`DOT`（1.2 / 0.5 / -0.7）
   - `LAYER`：固定先输出 `0` 层（颜色 7），再按添加顺序输出
   - `STYLE`：`STANDARD`，宽度因子 `0.85`
3. **ENTITIES**：按 `commands` 顺序输出
4. **EOF**

实体组码：

| 实体 | 组码 |
| --- | --- |
| `LINE` | `8` 图层；`6` 线型（可选）；`62` 颜色（非 `null` 时）；`10/20/30` 起点；`11/21/31` 终点 |
| `CIRCLE` | `8`；`6` 线型（可选）；`62`；`10/20/30` 圆心；`40` 半径 |
| `POLYLINE` | `8`；`6`；`62`；`66=1`；`10/20/30`（R12 要求的标高原点）；`70`（`1` 闭合 / `0` 开放）；`40/41` 线宽（>0 时）；每个顶点一组 `VERTEX`；`SEQEND` |
| `TEXT` | `8`；`62`；`10/20/30` 插入点；`40` 字高；`1` 文本；`50` 旋转；`41` 宽度因子；`7=STANDARD`；`72` 水平对齐；`73` 垂直对齐（非 0 时）；对齐非 0 时重复 `11/21/31` 插入点 |
| `SOLID` | `8` 图层；`62` 颜色（非 `null` 时）；`10/20/30`、`11/21/31`、`12/22/32`、`13/23/33` 四角点（自动按 AutoCAD Z 序交换第 3/4 点；三角形重复第 3 点） |

### 4.5 DXF 解析导入与一步转 SVG（`parseDxfToDocument` / `dxfToSvgText`）

零依赖、环境无关的 ASCII DXF（R12 ~ R2024+）解析器，可直接将 `.dxf` 字节流或文本解析为 `DrawingDocument` 供双引擎预览或导出 SVG：

```ts
type DxfParseEncoding =
  | 'auto' | 'utf-8' | 'gbk' | 'gb2312' | 'gb18030'
  | 'big5' | 'shift-jis' | 'euc-kr' | 'windows-1252' | (string & {});
type DxfSpaceFilter = 'model' | 'paper' | 'all';

interface DxfImportOptions {
  encoding?: DxfParseEncoding;        // 默认 'auto'（结合 BOM / $ACADVER / $DWGCODEPAGE / UTF-8 严格校验）
  space?: DxfSpaceFilter;             // 默认 'model'（跳过图纸空间 67=1）
  curveTolerance?: number;            // ARC / ELLIPSE / SPLINE / bulge 细分容差（mm），默认 0.1
  includeHiddenLayers?: boolean;      // 是否包含关闭（负色号）或冻结图层，默认 false
  includeUnsupportedWarnings?: boolean; // 是否汇总跳过的未支持实体告警，默认 true
  maxPrimitives?: number;             // 图元硬上限，默认 200_000；传 0 关闭
  maxBlockDepth?: number;             // INSERT 嵌套块最大深度，默认 16
}

interface DxfParseResult {
  document: DrawingDocument;
  stats: DxfParseStats;               // acadVersion / codepage / detectedEncoding / entityCounts / unsupportedEntities / blockCount 等
  warnings: string[];
}

class DxfImporter {
  constructor(options?: DxfImportOptions);
  parse(input: string | Uint8Array | ArrayBuffer, options?: DxfImportOptions): DrawingDocument;
  parseWithReport(input: string | Uint8Array | ArrayBuffer, options?: DxfImportOptions): DxfParseResult;
}

function parseDxfToDocument(input: string | Uint8Array | ArrayBuffer, options?: DxfImportOptions): DrawingDocument;
function parseDxfWithReport(input: string | Uint8Array | ArrayBuffer, options?: DxfImportOptions): DxfParseResult;
function unescapeDxfText(raw: string): string;
function stripMtextFormatting(raw: string): string;
function dxfToSvgText(input: string | Uint8Array | ArrayBuffer, options?: DxfToSvgOptions): string;
```

支持实体：`LINE`、`CIRCLE`、`ARC`、`POLYLINE`（含 `VERTEX`/`bulge`）、`LWPOLYLINE`（含圆弧凸度 `bulge`）、`SOLID` / `TRACE`（自动还原 Z 字序）、`3DFACE`、`ELLIPSE`、`SPLINE`（NURBS 有理 B 样条）、`TEXT` / `ATTRIB`、`MTEXT`（格式剥离 + 多行）、`POINT`、`BLOCKS` + `INSERT`（含嵌套变换、MINSERT 阵列与 0 层/BYBLOCK 继承）、`DIMENSION`（展开匿名块 `*D*`）以及组码 `420` 真彩色映射。

> 读取外部 `.dxf` 文件时请传入 `Uint8Array` 或 `ArrayBuffer`（而非 `file.text()`），以保证 GBK（`ANSI_936`）中文自动探测准确无乱码。

---

## 5. SVG 序列化

### 5.1 SvgSerializer

```ts
interface SvgSerializeOptions {
  theme?: 'dark' | 'light' | RenderTheme;  // 默认 'dark'
  mode?: 'live' | 'export';                // 默认 'live'
  viewBox?: ViewBox | null;                // 覆盖自动计算值
  rootId?: string | null;                  // 默认 'liveSvgElement'；null 表示不输出 id
  paddingMm?: number;                      // 世界坐标内边距，默认 12
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  backgroundColor?: string;                // 覆盖主题背景色
  includeXmlDeclaration?: boolean;         // 默认：export 为 true，live 为 false
  preserveWhitespace?: boolean;            // 文本保留连续空格，默认 true
}

class SvgSerializer {
  serialize(doc: DocumentLike, options?: SvgSerializeOptions): string;
}
```

#### 自动 viewBox

未传 `viewBox` 时：

```
minX = extents.minX - paddingMm
minY = -extents.maxY - paddingMm
w    = (extents.maxX - extents.minX) + paddingMm * 2
h    = (extents.maxY - extents.minY) + paddingMm * 2
```

#### live 与 export 的差异

| 特性 | `mode: 'live'` | `mode: 'export'` |
| --- | --- | --- |
| XML 声明 | 默认不输出 | 默认输出 |
| 根元素 | `<svg id="liveSvgElement" viewBox="..." preserveAspectRatio="xMidYMid meet">` | `<svg xmlns version width="...mm" height="...mm" viewBox="...">` |
| 背景 | `theme.background`，矩形按图幅外扩（至少 5000mm） | `theme.exportBackground`，矩形严格贴合 viewBox |
| 用途 | 嵌入页面，与 Canvas 同步 | 下载/打印，白底 + 实际尺寸 |

#### 颜色与线宽规则

- 颜色：先按 `resolveCommandStyle()` 解析 BYLAYER，再 `theme.resolveAci()`；`null` 使用主题 `defaultColor`。
- 线宽：`color === 8` 时为 `0.16`，否则 `0.24`；多段线使用 `lineWidth || 0.24`；圆固定 `0.16`。
- 虚线：`DASHED` → `stroke-dasharray="1.3,0.9"`；`DOT` → `"0.4,0.7"`。
- 文本：`font-size = h * svgSizeFactor`；`widthFactor != 1` 时追加 `scale(wf,1)`；`rot` 输出为 `rotate(-rot)`。
- 垂直对齐：`vAlign 0/1/2/3 → alphabetic / text-after-edge / central / hanging`。
- 连续空格：默认输出 `xml:space="preserve"`，可用 `preserveWhitespace: false` 关闭。
- 非法几何过滤：与 DXF/Canvas 一致，自动跳过非有限坐标、`r <= 0` 的圆、少于两点的多段线与 `h <= 0` 的文本；非正 `widthFactor` 回退为默认值。

#### 浅色主题的纸张填充

当 `theme.isDark === false` 时，所有被判定为“纸张”的闭合多段线会先绘制为 `theme.paper` 填充的 `<polygon>`，再绘制线框。使用多边形而非轴对齐矩形，因此反向坐标、顺时针点序和旋转图框都能正确填充。

```ts
const svg = new SvgSerializer().serialize(doc, {
  theme: 'light',
  mode: 'export',
  decorations: { paperFillLayers: ['FRAME_OUTER'] },
});
```

### 5.2 SvgExporter

```ts
class SvgExporter {
  static toText(doc: DocumentLike, options?: SvgSerializeOptions): string;
}
```

### 5.3 SVG 导入与一键转 DXF（`parseSvgToDocument` / `svgToDxfBytes`）

零依赖、环境无关的 SVG 解析器，支持将 SVG 直接解析为 `DrawingDocument` 或一步导出为 DXF R12：

```ts
type SvgYAxisMode = 'flip-viewbox' | 'negate';
type SvgLayerStrategy = 'group-id' | 'color' | 'single';
type SvgFillMode = 'outline' | 'solid' | 'ignore';

interface SvgImportOptions {
  yAxis?: SvgYAxisMode;           // 默认 'flip-viewbox'；往返本库 SVG 可用 'negate'
  curveTolerance?: number;        // 曲线/圆弧/椭圆细分弦高容差（mm），默认 0.1
  scale?: number;                 // 显式用户坐标 → mm 缩放倍率
  layerBy?: SvgLayerStrategy;     // 默认 'group-id'（按 <g id> / data-layer 分层）
  defaultLayer?: string;          // 默认 '0'
  fillMode?: SvgFillMode;         // 无描边填充图形：'outline'（默认）或 'ignore'
  ignoreBackground?: boolean;     // 自动跳过全画布背景矩形，默认 true
  fontSizeScale?: number;         // 字号缩放系数，默认 1
  maxPrimitives?: number;         // 图元数量硬上限，默认 200_000
}

class SvgImporter {
  constructor(options?: SvgImportOptions);
  parse(svgText: string, options?: SvgImportOptions): DrawingDocument;
}

function parseSvgToDocument(svgText: string, options?: SvgImportOptions): DrawingDocument;

interface SvgToDxfOptions extends SvgImportOptions, DxfSerializeOptions {
  codec?: TextCodec;
}

function svgToDxfText(svgText: string, options?: SvgToDxfOptions): string;
function svgToDxfBytes(svgText: string, options?: SvgToDxfOptions): Uint8Array;
```

支持元素：`line`、`rect`（含 `rx/ry` 圆角）、`circle`、`ellipse`、`polyline`、`polygon`、`path`（`M/L/H/V/Z`、二/三次贝塞尔 `C/S/Q/T` 与椭圆弧 `A`）、`text`/`tspan`、`<defs>` + `<use>` 以及嵌套 `transform` 矩阵。

```ts
import { svgToDxfBytes, parseSvgToDocument } from 'vecbridge';

// 一步直接转换
const dxfBytes = svgToDxfBytes(svgText, { encoding: 'gbk', font: 'gbenor' });

// 或先转 DrawingDocument，再预览 / 二次编辑 / 导出
const doc = parseSvgToDocument(svgText, { curveTolerance: 0.05 });
```

完整示例见 [`examples/svg-to-dxf.html`](../examples/svg-to-dxf.html) 与 [`examples/node-svg-to-dxf.mjs`](../examples/node-svg-to-dxf.mjs)。

---

## 6. 填充图案

### 6.1 HatchPattern

```ts
type HatchPattern =
  | 'diagonal'
  | 'diagonal-dash'
  | 'horizontal'
  | 'horizontal-dots'
  | 'dots-fine'
  | 'dots-coarse'
  | 'scatter'
  | 'crosshatch'
  | 'dash-bands';
```

| 图案 | 几何特征 |
| --- | --- |
| `diagonal` | 等距平行斜线，步长 2.0 |
| `diagonal-dash` | 斜线与虚线交替，步长 1.9 |
| `horizontal` | 横线逐行排列，隔行断开为两段 |
| `horizontal-dots` | 横线与圆点行交替 |
| `dots-fine` | 细密错位圆点，半径 0.18 / 0.28 |
| `dots-coarse` | 大小圆点交替，半径 0.2 / 0.4 |
| `scatter` | 闭合三角形与圆点散布 |
| `crosshatch` | 双向交叉斜线，步长 2.6 |
| `dash-bands` | 错位短横线 |

所有图案只由 `addLine` / `addCircle` / `addPolyline` 组合，因此对任何 `DrawTarget` 都可用。

### 6.2 drawHatch

```ts
interface HatchOptions {
  /** 图元数量硬上限，默认 200_000；传 0 关闭。 */
  maxPrimitives?: number;
}

function drawHatch(
  target: DrawTarget,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pattern: HatchPattern,
  layer?: string,          // 默认 '0'
  color?: number | null,   // 默认 null
  options?: HatchOptions
): void;
```

在矩形内绘制图案：

- 坐标会自动归一化，`x1 > x2` 或 `y1 > y2` 也可正常绘制；含 `NaN`/`±Infinity` 时静默忽略。
- 内边距固定 `0.25mm`；若有效区域为空则直接返回。
- 未知图案名抛出 `RangeError`。
- 图元数达到 `maxPrimitives` 后立即中止迭代并截断返回（不报错），同时防止 OOM 与主线程卡死。

```ts
import { DrawingDocument, drawHatch } from 'vecbridge';

const doc = new DrawingDocument();
drawHatch(doc, 20, 40, 80, 120, 'diagonal', 'HATCH_PAT', 8);
```

`DrawTarget` 结构：

```ts
interface DrawTarget {
  addLine(x1, y1, x2, y2, layer?, color?, linetype?): unknown;
  addCircle(cx, cy, r, layer?, color?, linetype?): unknown;
  addPolyline(points, layer?, color?, closed?, lineWidth?): unknown;
}
```

---

## 7. 渲染与交互

### 7.1 Camera

世界坐标（mm，Y 上）↔ 屏幕坐标（px，Y 下）的纯数学相机。

```ts
interface CameraState { scale: number; offsetX: number; offsetY: number; }
interface CameraLimits { minScale: number; maxScale: number; }
interface MetricsLike { width: number; height: number; }

class Camera {
  constructor(state?: Partial<CameraState>);

  get scale(): number;
  get offsetX(): number;
  get offsetY(): number;

  getState(): CameraState;
  setState(state: Partial<CameraState>): void;

  fit(extents: Extents, metrics: MetricsLike, paddingPx?: number): void;
  toScreen(x: number, y: number): { x: number; y: number };
  toWorld(px: number, py: number): { x: number; y: number };
  getViewBox(metrics: MetricsLike): ViewBox;

  zoomAt(px: number, py: number, factor: number, limits?: CameraLimits): void;
  panBy(dx: number, dy: number): void;
}
```

#### 坐标变换

```
screenX = offsetX + worldX * scale
screenY = offsetY - worldY * scale
worldX  = (screenX - offsetX) / scale
worldY  = (offsetY - screenY) / scale
```

`toWorld()` 是 `toScreen()` 的逆变换，可用于光标读数、拾取与标注。

#### `fit(extents, metrics, paddingPx = 16)`

按宽高比取较小缩放，使 `extents` 居中满幅。`paddingPx` 会加到世界尺寸上。若 `extents` 反向/非有限、`paddingPx < 0` 或视口尺寸非正，则静默忽略且保持当前相机状态不变。

#### `getViewBox(metrics): ViewBox`

```
x = -offsetX / scale
y = -offsetY / scale
w = width / scale
h = height / scale
```

若 `scale` 非正或非有限，返回 `{ x: 0, y: 0, w, h }` 安全兜底，避免产出 `Infinity`/`NaN`。

> `fit()` 中使用 `offsetY = height/2 + centerY * scale`（加号），`getViewBox()` 中使用 `y = -offsetY / scale`（负号）。这两个符号是**成对约定**，单独修改任意一个都会导致 Canvas 与 SVG 上下颠倒。

#### `zoomAt(px, py, factor, limits?)`

以屏幕点 `(px, py)` 为锚点缩放，结果 scale 被限制在 `limits` 内（默认 `0.2 ~ 50`）。

#### `panBy(dx, dy)`

按屏幕像素平移。

### 7.2 Viewport

DOM 适配层：测量容器尺寸、同步 `devicePixelRatio`、换算鼠标坐标。

```ts
interface ViewportMetrics { width: number; height: number; dpr: number; }

interface ViewportOptions {
  canvas: HTMLCanvasElement;
  measure?: HTMLElement | (() => HTMLElement | null) | null;
  maxDpr?: number;                                // 默认 3
  minSize?: number;                               // 默认 1
  fallbackSize?: { width: number; height: number }; // 默认 { 800, 690 }
}

class Viewport {
  constructor(options: ViewportOptions);

  setMeasureElement(element: HTMLElement | (() => HTMLElement | null) | null): void;
  getMeasureElement(): HTMLElement | null;
  get metrics(): ViewportMetrics | null;

  sync(): ViewportMetrics;
  pointFromEvent(
    event: { clientX: number; clientY: number },
    element?: HTMLElement | null,
    metrics?: ViewportMetrics
  ): { x: number; y: number } | null;
}
```

- `measure` 可以是 getter 函数，便于在分屏/单视图模式间切换测量源。
- `sync()` 会把 canvas 的 `width/height` 设为 `逻辑尺寸 × dpr`，并返回逻辑尺寸与 dpr。
- 当测量元素缺失或尺寸为 0 时，使用 `fallbackSize`。

### 7.3 CanvasRenderer

```ts
interface CanvasRendererOptions {
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
}

class CanvasRenderer {
  constructor(options?: CanvasRendererOptions);

  setTheme(theme: ThemeInput): void;
  setDecorations(decorations: DecorationOptions): void;
  getTheme(): RenderTheme;

  render(
    doc: DocumentLike,
    canvas: HTMLCanvasElement,
    camera: Camera,
    metrics: ViewportMetrics
  ): void;
}
```

绘制规则：

- 先按 `metrics.dpr` 设置变换，再用主题背景填充整块画布。
- 浅色主题下，纸张矩形先填白并加 `rgba(0,0,0,0.12)` 阴影（blur 10）。
- 线宽：`line` 为 `(color === 8 ? 0.16 : 0.24) * scale`，最小 `0.5px`；`circle` 为 `0.16 * scale`；`polyline` 为 `(lineWidth || 0.24) * scale`，最小 `0.6px`。
- 虚线间隔随 `scale` 缩放，且每段不小于 `1px`。
- 文本：`fontPx = h * scale * canvasSizeFactor`；小于 `minCanvasFontPx`（默认 2.2）时跳过。
- 文本对齐：`hAlign 0/1/2 → left/center/right`；`vAlign 0/1/2/3 → alphabetic/bottom/middle/top`。

### 7.4 SvgLiveView

```ts
interface SvgLiveViewOptions {
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  rootId?: string | null;  // 默认 'liveSvgElement'
  preserveWhitespace?: boolean;  // 默认 true
}

class SvgLiveView {
  constructor(container: HTMLElement, options?: SvgLiveViewOptions);

  render(doc: DocumentLike | null, viewBox?: ViewBox | null): void;
  setViewBox(viewBox: ViewBox): void;
  setTheme(theme: ThemeInput): void;
  setDecorations(decorations: DecorationOptions): void;
  clear(): void;

  get element(): SVGSVGElement | null;
  get hasRenderedContent(): boolean;
}
```

- `render()` 会整体替换容器内容（文档或主题变化时使用）。
- `setViewBox()` 只修改根 `<svg>` 的 `viewBox` 属性，适合高频平移/缩放。
- `clear()` 清空容器。

### 7.5 DualViewPreview

Canvas + SVG 双引擎同步预览的外观类（Facade + Observer）。

```ts
type RenderReason =
  | 'fit' | 'zoom' | 'pan' | 'resize'
  | 'document' | 'theme' | 'clear' | 'manual';

interface DualViewEvents {
  render: { reason: RenderReason };
  cameraChange: CameraState;
  documentChange: DocumentData | null;
  themeChange: RenderTheme;
  destroy: undefined;
}

interface DualViewOptions {
  canvas: HTMLCanvasElement;
  svgContainer: HTMLElement;
  measure?: HTMLElement | (() => HTMLElement | null) | null;
  panes?: HTMLElement[];
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  camera?: Camera;
  limits?: CameraLimits;
  zoomStep?: { in: number; out: number };  // 默认 { in: 1.15, out: 0.87 }
  paddingPx?: number;                      // 默认 16
  svgRootId?: string | null;
  preserveWhitespace?: boolean;            // 默认 true
  listenWindowResize?: boolean;            // 默认 true
  maxDpr?: number;
}

class DualViewPreview {
  constructor(options: DualViewOptions);

  readonly camera: Camera;
  readonly viewport: Viewport;

  get document(): DocumentData | null;
  get theme(): RenderTheme;

  setDocument(doc: DocumentLike | null, options?: { fit?: boolean }): void;
  setTheme(theme: ThemeInput): void;
  setDecorations(decorations: DecorationOptions): void;
  setMeasureElement(element: HTMLElement | (() => HTMLElement | null) | null): void;

  fit(): void;
  resetView(): void;
  render(reason?: RenderReason): void;
  clear(): void;

  on<K extends keyof DualViewEvents>(event: K, listener: (payload: DualViewEvents[K]) => void): () => void;
  off<K extends keyof DualViewEvents>(event: K, listener: (payload: DualViewEvents[K]) => void): void;
  destroy(): void;
}
```

#### 行为说明

- 构造时绑定 `wheel`（缩放）与 `mousedown`（拖拽起点，含 `preventDefault()` 防止 SVG 拖拽选字），并在 `window` 上监听 `mousemove` / `mouseup` / `blur` / `resize`。
- `fit()` 会基于构造时的初始 `limits` 动态扩展当前文档的有效缩放区间（为适配倍率预留上下缓冲），切换回普通尺寸图纸时自动恢复，避免限幅泄漏或贴边锁死。
- 每次相机变化只重绘 Canvas，并更新 SVG 的 `viewBox`；主题/文档变化才重建 SVG 子树。
- `destroy()` 通过 `AbortController` 解绑全部监听，并清空 SVG 容器；调用后实例不可复用，后续公开方法调用全部静默早退。
- `panes` 默认 `[canvas, svgContainer]`；分屏模式下可显式传入两个面板。
- `measure` 用于指定逻辑尺寸来源；SVG 单视图模式可传 getter 切换到 `svgPane`。

#### 典型用法

```ts
const preview = new DualViewPreview({
  canvas: document.querySelector('#canvas')!,
  svgContainer: document.querySelector('#svg'),
  panes: [document.querySelector('#canvasPane')!, document.querySelector('#svgPane')!],
  theme: 'dark',
  decorations: { boldLayers: ['TEXT_TITLE'], paperFillLayers: ['FRAME_OUTER'] },
});

preview.on('cameraChange', ({ scale }) => console.log('scale', scale));
preview.setDocument(doc, { fit: true });

// 组件卸载
preview.destroy();
```

### 7.6 Emitter

无 DOM 依赖的类型化事件发射器。

```ts
class Emitter<Events extends object> {
  on<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): () => void;
  off<K extends keyof Events>(event: K, listener: (payload: Events[K]) => void): void;
  emit<K extends keyof Events>(event: K, payload: Events[K]): void;
  clear(): void;
}
```

`on()` 返回取消订阅函数：

```ts
const off = emitter.on('change', handler);
off();
```

---

## 8. 浏览器下载

仅在浏览器环境可用；在 Node 中调用会抛出明确错误。

### 8.1 downloadBytes

```ts
interface DownloadOptions {
  filename: string;
  mimeType?: string;      // 默认 'application/octet-stream'
  revokeDelayMs?: number; // 默认 0（立即 revoke）
}

function downloadBytes(
  data: Uint8Array | Blob | string,
  options: DownloadOptions
): void;
```

### 8.2 downloadDxf

```ts
interface DownloadDxfOptions extends DxfSerializeOptions, DownloadOptions {
  codec?: TextCodec;  // 自定义编码器，可接收 onUnencodable 回调
}

function downloadDxf(doc: DocumentLike, options: DownloadDxfOptions): void;
```

```ts
downloadDxf(doc, {
  filename: 'drawing.dxf',
  encoding: 'gbk',
  font: 'gbcbig',
  mimeType: 'application/dxf',
});
```

### 8.3 downloadSvg

```ts
interface DownloadSvgOptions extends SvgSerializeOptions, DownloadOptions {}

function downloadSvg(doc: DocumentLike, options: DownloadSvgOptions): void;
```

`downloadSvg` 默认使用 `mode: 'export'`（白底、mm 尺寸、含 XML 声明），可通过 options 覆盖。

```ts
downloadSvg(doc, { filename: 'drawing.svg', theme: 'light' });
```

> 大文件下载时建议设置 `revokeDelayMs`（例如 `1500`），避免部分浏览器在下载开始前就释放 Blob URL。

### 8.4 HTML DOM 转 SVG / DXF（`vecbridge/dom`）

直接读取浏览器已挂载 HTML 元素的真实 CSS 布局（表格合并单元格、圆角边框、`Range` 自动换行文本、竖排文字 `writing-mode`、`<ul>/<ol>` 列表圆点与序号、表单控件值、内嵌 `<svg>` 与 `overflow: hidden` 裁剪），零依赖转换为纯矢量 SVG（不使用 `<foreignObject>`）或 AutoCAD R12 DXF。

```ts
import {
  domToDocument,
  domToSvg,
  domToDxfText,
  domToDxfBytes,
  downloadDomAsDxf,
  downloadDomAsSvg,
  extractDomScene,
  extractHtmlScene,
  htmlToDocument,
  htmlToSvg,
  htmlToDxfText,
  htmlToDxfBytes,
  sceneToDocument,
  sceneToVisualSvg,
} from 'vecbridge/dom';
```

#### 核心选项

```ts
interface DomConvertOptions {
  pxToMm?: number;                          // 默认 25.4 / 96（96 DPI）
  fitWidthMm?: number;                      // 按目标宽度（mm）等比缩放（优先级高于 pxToMm）
  layerBy?: 'semantic' | 'id' | 'color' | 'single'; // 默认 'semantic'
  defaultLayer?: string;                    // 默认 '0'
  backgroundMode?: 'ignore' | 'outline' | 'hatch' | 'solid'; // IR/DXF 背景色策略，默认 'ignore'
  markRootPaper?: boolean;                  // 根白底标记为 paper，默认 true
  dedupeBorders?: boolean;                  // 合并表格/相邻盒子重合边框，默认 true
  curveTolerance?: number;                  // 圆角与内嵌 SVG 曲线容差（mm），默认 0.1
  fontSizeScale?: number;                   // CAD 字高系数，默认 0.78
  mediaMode?: 'ignore' | 'placeholder' | 'embed';   // img/canvas 处理方式
  clipOverflow?: boolean;                   // 裁剪 overflow 溢出内容，默认 true
  filter?: (element: Element) => boolean;   // 跳过返回 false 的节点及子树
  maxPrimitives?: number;                   // 图元硬上限，默认 200_000
}

interface DomToSvgOptions extends DomConvertOptions {
  mode?: 'visual' | 'cad';                  // 'visual' 高保真纯矢量（默认）；'cad' 经 IR 与 DXF 同源
  svgOptions?: SvgSerializeOptions;
  includeXmlDeclaration?: boolean;          // 默认 true
}

interface DomToDxfOptions extends DomConvertOptions, DxfSerializeOptions {
  codec?: TextCodec;
}
```

#### HTML 注解属性

- `data-dxf-ignore`：跳过该元素及其子树（常用于排除页面工具栏/提示条）。
- `data-dxf-layer="LAYER_NAME"`（或 `data-layer`）：显式指定导出图层名。

#### 典型用法

```ts
const sheet = document.querySelector('#report')!;

// 1. 提取为 DrawingDocument，直接接入双引擎预览或二次叠加 CAD 图元
const doc = domToDocument(sheet, { fitWidthMm: 297, dedupeBorders: true });
preview.setDocument(doc, { fit: true });

// 2. 导出高保真纯矢量 SVG（保留真彩背景、圆角、clipPath，不含 foreignObject）
const visualSvg = domToSvg(sheet, { fitWidthMm: 297, mode: 'visual' });

// 3. 一步下载为 AutoCAD 兼容 GBK DXF
downloadDomAsDxf(sheet, {
  filename: 'report.dxf',
  fitWidthMm: 297,
  encoding: 'gbk',
  font: 'gbenor',
});
```

#### 离屏 HTML 字符串一键转换

在浏览器环境中若持有的是 HTML 片段或完整 HTML 文档字符串，可直接调用 `htmlToDocument` / `htmlToSvg` / `htmlToDxfText` / `htmlToDxfBytes`（内部自动挂载至屏幕外容器测量布局并在 `finally` 中销毁）：

```ts
interface HtmlConvertOptions extends DomConvertOptions {
  widthPx?: number;                         // 离屏容器宽度（px），默认 794
  css?: string;                             // 附加 CSS 样式文本
  document?: Document;                      // 指定目标 Document，默认全局 document
  beforeExtract?: (root: HTMLElement) => void;
}

const dxfBytes = htmlToDxfBytes('<table><tr><td>汇总</td></tr></table>', {
  widthPx: 760,
  fitWidthMm: 297,
  css: 'table { border-collapse: collapse; } td { border: 1px solid #000; padding: 6px; }',
  encoding: 'gbk',
  font: 'gbenor',
});
```

> 服务端批量渲染 HTML 时，可在 Playwright/Puppeteer 页面中调用 `extractDomScene(el, opts)` 返回纯 JSON 的 `DomScene`，再在 Node 端调用 `sceneToDocument(scene)` + `DxfExporter.toBytes(doc)` 出图。

### 8.5 Canvas 2D 矢量录制与双写代理（`vecbridge/canvas`）

兼容标准 HTML5 Canvas 2D 绘图 API（`save`/`restore`、`translate`/`rotate`/`scale`/`transform`/`setTransform`、`beginPath`/`moveTo`/`lineTo`/`rect`/`roundRect`/`arc`/`arcTo`/`ellipse`/`quadraticCurveTo`/`bezierCurveTo`/`closePath`、`stroke`/`fill`/`strokeRect`/`fillRect`/`clearRect`/`fillText`/`strokeText`/`setLineDash`）以及扩展图层方法 `setLayer(name)`。

```ts
import {
  VectorCanvasContext,
  createVectorContext,
  recordCanvasContext,
} from 'vecbridge/canvas';

interface CanvasRecorderOptions {
  width?: number;                     // 画布逻辑宽（px），默认取 target.canvas.width 或 800
  height?: number;                    // 画布逻辑高（px），默认取 target.canvas.height 或 600
  pxToMm?: number;                    // 默认 25.4 / 96
  fitWidthMm?: number;                // 按目标宽度（mm）等比缩放（优先级高于 pxToMm）
  flipY?: boolean;                    // 是否将 Canvas Y 向下翻转为 CAD Y 向上，默认 true
  layerBy?: 'layer' | 'color' | 'single'; // 默认 'layer'
  defaultLayer?: string;              // 默认 '0'
  fillMode?: 'solid' | 'outline' | 'ignore'; // 默认 'solid'
  curveTolerance?: number;            // 曲线细分容差（mm），默认 0.1
  fontSizeScale?: number;             // CAD 字高系数，默认 0.78
  ignoreBackgroundFill?: boolean;     // 跳过整画布清屏 fillRect，默认 true
  markPaper?: boolean;                // 自动为整块画布添加 paper 图框，默认 false
  maxPrimitives?: number;             // 图元硬上限，默认 200_000
}

// 1. 无头模式（Node & 浏览器通用）
const ctx = createVectorContext({ width: 800, height: 600, fitWidthMm: 297 });
ctx.strokeRect(20, 20, 760, 560);
const dxfBytes = ctx.toDxfBytes({ encoding: 'gbk' });

// 2. 双写代理模式（透传给真实 Canvas 上屏渲染的同时同步录制 IR）
const proxy = recordCanvasContext(realCanvas.getContext('2d')!, { fitWidthMm: 297 });
drawChart(proxy);
const svgText = proxy.toSvgText();
```

---

## 9. 全局构建（IIFE / CDN）

### 9.1 window.VecBridge

`dist/vecbridge.global.js` 会把以下全部入口导出挂到 `window.VecBridge`：

- `vecbridge`（core + encoding + dxf + svg + canvas + patterns + 一步式互转）
- `vecbridge/render`
- `vecbridge/browser`
- `vecbridge/dom`

```html
<script src="https://unpkg.com/vecbridge/dist/vecbridge.global.js"></script>
<script>
  const {
    DrawingDocument,
    DxfExporter,
    parseDxfToDocument,
    SvgExporter,
    recordCanvasContext,
    drawHatch,
    textCodec,
    DualViewPreview,
    downloadDxf,
  } = window.VecBridge;
</script>
```

### 9.2 完整示例

仓库内提供多套可独立打开的浏览器页面示例：

- [`examples/playground.html`](../examples/playground.html) — 亮色四合一在线工作台（DXF 预览转 SVG / SVG 转 DXF / HTML DOM 转矢量 / Canvas 2D 双写录制）；
- [`examples/dxf-preview.html`](../examples/dxf-preview.html) — DXF 拖拽上传、自动编码识别、双引擎同步预览与 SVG 导出；
- [`examples/canvas-record.html`](../examples/canvas-record.html) — Canvas 2D 标准代码与手绘实时双写录制转 DXF / SVG；
- [`examples/browser-demo.html`](../examples/browser-demo.html) — 精简双引擎预览示例（图框、三种填充图案、采样曲线、主题切换、单份与 16 组合批量导出 DXF / SVG）。

---

## 10. 附录

### 10.1 ACI 颜色索引

内置主题映射以下 ACI：

| ACI | 含义 | 深色主题 | 浅色主题 |
| --- | --- | --- | --- |
| `1` | 红 | `#ff3b30` | `#d92121` |
| `3` | 绿 | `#32d74b` | `#168f33` |
| `5` | 蓝 | `#409cff` | `#0f5acc` |
| `8` | 灰 | `#76808f` | `#6b7280` |
| `null` / `256` | BYLAYER | 继承图层颜色，未定义时为 `defaultColor` | 继承图层颜色，未定义时为 `defaultColor` |
| 其他 | 未映射 | `defaultColor` | `defaultColor` |

需要更多颜色时，传入自定义 `RenderTheme` 的 `aci` 映射。

### 10.2 错误与边界行为

| 场景 | 行为 |
| --- | --- |
| `addPolyline([])` | 静默忽略，不产生命令 |
| `addText(null / undefined / '')` | 静默忽略 |
| `addText('   ')` | `trim()` 后为空，忽略 |
| 多行文本中的空行 | 不产生命令，但保留行距 |
| `color: null` | 省略组码 62（BYLAYER） |
| `color: 0` | 输出 `62 / 0`（BYBLOCK） |
| `lineWidth: 0` | DXF 不输出 `40/41`；渲染使用默认线宽 |
| `fmtNumber(NaN / Infinity)` | 输出 `"0"` |
| 非浏览器环境调用下载 API | 抛出 `Error`，提示改用 `toBytes()` / `toText()` |
| 环境不支持 GBK 解码器 | `isGbkSupported()` 为 `false`；解码退化为 UTF-8，反查表为空 |
| `DrawingDocument.addLayer` 重名 | 不去重，LAYER 表条目数等于调用次数 |
| `toJSON()` | 返回内部引用，非深拷贝 |

### 10.3 输出稳定性契约

- **DXF 与 SVG 的输出字节视为公共契约**：`patch` 版本不改变输出。
- 输出格式变更走 `minor` 版本，并提供兼容开关。
- `DocumentData` 是可持久化格式；`DrawingDocument.fromJSON()` 保证向后兼容。
- 以下历史行为被**有意锁定**，不视为缺陷：
  1. emoji 等增补平面字符按 UTF-16 code unit 转义为两个 `\U+xxxx`；
  2. `downloadBytes` 默认立即 `revokeObjectURL`；
  3. `addLayer` 不去重；
  4. Canvas 与 SVG 不承诺像素级一致（字体栅格化存在平台差异），矢量内容以 SVG/DXF 为准；
  5. SVG 字号系数 `1.04` 与 Canvas `1.05` 保持差异，字体栈也不同。

### 10.4 版本与语义化

| 变更类型 | 版本位 | 示例 |
| --- | --- | --- |
| 输出字节变化、公开 API 破坏性变更 | `major` | 修改 DXF 组码顺序、删除方法 |
| 新增 API、新增选项、可选行为 | `minor` | 新增填充图案、新增导出选项 |
| 内部修复，输出不变 | `patch` | 性能优化、类型修正 |

---

## 相关文档

- [README](../README.md) — 核心痛点、能力矩阵、快速开始与设计概览
- [CHANGELOG](../CHANGELOG.md) — 版本变更记录
- [统一在线工作台 Playground](../examples/playground.html) — DXF / SVG / HTML DOM / Canvas 2D 四合一互转与双引擎预览
- [DXF 预览与转 SVG 示例](../examples/dxf-preview.html) — 拖拽上传 `.dxf`、编码切换、诊断报告与导出
- [Canvas 2D 矢量录制示例](../examples/canvas-record.html) — 标准 Canvas 2D 绘图与手绘双写录制转 DXF / SVG
- [SVG 转 DXF 示例](../examples/svg-to-dxf.html) — 拖拽或编辑 SVG 源码实时双引擎预览并导出 DXF
- [HTML DOM 转 SVG / DXF 示例](../examples/dom-to-dxf.html) — 规格清单表格、表单与内嵌 SVG 实时转换、双引擎预览及导出
- [浏览器编程式绘图示例](../examples/browser-demo.html) — 双引擎预览 + 编码/字体切换 + 单份与批量导出
- [Node 示例](../examples/node-generate.mjs) — 指定编码/字体，或用 `all` 批量导出全部组合

---

*本文档对应 `vecbridge@0.5.0`。*

```

## examples\assets\demo-core.js
```js
/*!
 * VecBridge 示例页共用工具集
 * 依赖：../dist/vecbridge.global.js 先于本文件加载
 *
 * 暴露 window.DxfDemo：
 *   guard()                  构建产物缺失时给出友好提示
 *   samples.dxf / samples.svg 内置演示样例
 *   resolveTheme(mode)       'light' | 'dark' → 扩展主题对象
 *   createPreview(opts)      创建 DualViewPreview（统一默认参数）
 *   bindThemeToggle(btn, preview, initial, labels)
 *   describeDoc(doc)         图幅 / 图层 / 各类型图元统计
 *   statsText(doc, opts)     单行统计文案
 *   renderStats(el, doc)     写入统计胶囊
 *   exportSvg / exportDxf    统一导出封装
 *   setSegmented(root, value) 分段控件高亮
 *   bindSegmented(root, handler)
 *   bindDropZone(zone, input, onFile, activeClasses)
 *   bindDebounced(el, fn, ms)
 */
(() => {
  const VB = window.VecBridge;

  /* ---------------- 内置演示样例 ---------------- */
  const SAMPLE_DXF = [
    '  0', 'SECTION', '  2', 'HEADER',
    '  9', '$ACADVER', '  1', 'AC1015',
    '  9', '$DWGCODEPAGE', '  3', 'UTF-8',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'TABLES',
    '  0', 'TABLE', '  2', 'LAYER', ' 70', '6',
    '  0', 'LAYER', '  2', '0', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'FRAME', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'AXIS', ' 70', '0', ' 62', '8', '  6', 'DASHED',
    '  0', 'LAYER', '  2', 'PART', ' 70', '0', ' 62', '5', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'ACCENT', ' 70', '0', ' 62', '1', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'NOTE', ' 70', '0', ' 62', '3', '  6', 'CONTINUOUS',
    '  0', 'ENDTAB',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'BLOCKS',
    '  0', 'BLOCK', '  8', '0', '  2', 'BOLT_HOLE', ' 70', '0', ' 10', '0', ' 20', '0', ' 30', '0',
    '  0', 'CIRCLE', '  8', '0', ' 62', '0', ' 10', '0', ' 20', '0', ' 40', '4.5',
    '  0', 'LINE', '  8', 'AXIS', ' 10', '-7', ' 20', '0', ' 11', '7', ' 21', '0',
    '  0', 'LINE', '  8', 'AXIS', ' 10', '0', ' 20', '-7', ' 11', '0', ' 21', '7',
    '  0', 'ENDBLK', '  8', '0',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'ENTITIES',
    '  0', 'LWPOLYLINE', '  8', 'FRAME', ' 90', '4', ' 70', '1', ' 43', '0.35',
    ' 10', '0', ' 20', '0', ' 10', '220', ' 20', '0', ' 10', '220', ' 20', '140', ' 10', '0', ' 20', '140',
    '  0', 'LWPOLYLINE', '  8', 'PART', ' 90', '8', ' 70', '1', ' 43', '0.4',
    ' 10', '28', ' 20', '25', ' 42', '0',
    ' 10', '112', ' 20', '25', ' 42', '0.41421356',
    ' 10', '120', ' 20', '33', ' 42', '0',
    ' 10', '120', ' 20', '97', ' 42', '0.41421356',
    ' 10', '112', ' 20', '105', ' 42', '0',
    ' 10', '28', ' 20', '105', ' 42', '0.41421356',
    ' 10', '20', ' 20', '97', ' 42', '0',
    ' 10', '20', ' 20', '33', ' 42', '0.41421356',
    '  0', 'CIRCLE', '  8', 'ACCENT', ' 10', '70', ' 20', '65', ' 40', '20',
    '  0', 'ARC', '  8', 'ACCENT', ' 10', '70', ' 20', '65', ' 40', '28', ' 50', '30', ' 51', '150',
    '  0', 'ARC', '  8', 'ACCENT', ' 10', '70', ' 20', '65', ' 40', '28', ' 50', '210', ' 51', '330',
    '  0', 'INSERT', '  8', 'PART', '  2', 'BOLT_HOLE', ' 10', '32', ' 20', '37', ' 70', '2', ' 71', '2', ' 44', '76', ' 45', '56',
    '  0', 'ELLIPSE', '  8', 'NOTE', ' 10', '170', ' 20', '88', ' 11', '26', ' 21', '8', ' 40', '0.5', ' 41', '0', ' 42', '6.2831853',
    '  0', 'SPLINE', '  8', 'ACCENT', ' 70', '8', ' 71', '3',
    ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '1', ' 40', '1', ' 40', '1', ' 40', '1',
    ' 10', '138', ' 20', '30', ' 10', '158', ' 20', '68', ' 10', '184', ' 20', '16', ' 10', '204', ' 20', '56',
    '  0', 'SOLID', '  8', 'ACCENT',
    ' 10', '142', ' 20', '126', ' 11', '150', ' 21', '129', ' 12', '150', ' 22', '123', ' 13', '150', ' 23', '123',
    '  0', 'TEXT', '  8', 'FRAME', ' 10', '110', ' 20', '126', ' 11', '110', ' 21', '126',
    ' 40', '5.2', '  1', 'VecBridge DXF 解析预览 %%c40 / 90%%d', ' 50', '0', ' 72', '1', ' 73', '2',
    '  0', 'MTEXT', '  8', 'NOTE', ' 10', '154', ' 20', '128', ' 40', '2.8', ' 71', '1',
    '  1', '{\\fMicrosoft YaHei;技术说明：\\P1. 圆角采用 LWPOLYLINE 凸度\\P2. 螺栓孔由 INSERT 阵列展开\\P3. 公差 %%p0.05mm}',
    '  0', 'ENDSEC',
    '  0', 'EOF',
  ].join('\n');

  const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210">
  <rect x="0" y="0" width="297" height="210" fill="#ffffff" />
  <g id="FRAME" stroke="#111827" stroke-width="0.35" fill="none">
    <rect x="14" y="10" width="269" height="190" />
    <rect x="22" y="18" width="112" height="58" rx="6" ry="6" />
  </g>
  <g id="GRID" stroke="#6b7280" stroke-width="0.18" stroke-dasharray="2,1.5" fill="none">
    <line x1="150" y1="20" x2="150" y2="190" />
    <line x1="25" y1="105" x2="275" y2="105" />
  </g>
  <g id="GEOMETRY" fill="none" stroke-width="0.32">
    <circle cx="78" cy="47" r="18" stroke="#d92121" />
    <ellipse cx="215" cy="52" rx="34" ry="18" stroke="#0f5acc" transform="rotate(-12 215 52)" />
    <path d="M 30 168 C 80 112, 130 192, 185 138 S 255 124, 270 168" stroke="#168f33" />
    <path d="M 190 164 A 25 18 0 1 1 245 164 Z" stroke="#d92121" />
    <polygon points="48,118 68,152 28,152" stroke="#0f5acc" />
  </g>
  <g id="ANNOTATION" fill="#111827">
    <text x="148.5" y="191" font-size="4.5" font-weight="bold" text-anchor="middle" dominant-baseline="central">VecBridge · SVG 转 DXF 矢量样例</text>
    <text x="78" y="47" font-size="3" text-anchor="middle" dominant-baseline="central">Ø36</text>
    <text x="215" y="52" font-size="2.8" text-anchor="middle" dominant-baseline="central" transform="rotate(-12 215 52)">旋转椭圆标注</text>
  </g>
</svg>`;

  /* ---------------- 基础工具 ---------------- */
  function guard() {
    if (!window.VecBridge) {
      alert('未加载 ../dist/vecbridge.global.js，请先在项目根目录运行 pnpm build。');
      throw new Error('window.VecBridge is not loaded');
    }
  }

  const resolveTheme = (mode) =>
    mode === 'dark' ? VB.EXTENDED_DARK_THEME : VB.EXTENDED_LIGHT_THEME;

  function createPreview({ canvas, svgContainer, panes, measure, theme = 'light', decorations }) {
    return new VB.DualViewPreview({
      canvas,
      svgContainer,
      panes,
      measure,
      decorations,
      theme: resolveTheme(theme),
    });
  }

  /**
   * 绑定主题切换按钮，返回可变状态对象（mode 字段实时反映当前主题）。
   */
  function bindThemeToggle(button, preview, initial = 'light', labels = null) {
    const text = labels || { light: '浅色打印底', dark: '深色 CAD 底' };
    const state = { mode: initial };

    const apply = () => {
      preview.setTheme(resolveTheme(state.mode));
      button.textContent = state.mode === 'light' ? text.light : text.dark;
    };

    apply();
    if (button) {
      button.addEventListener('click', () => {
        state.mode = state.mode === 'light' ? 'dark' : 'light';
        apply();
      });
    }
    return state;
  }

  /* ---------------- 统计 ---------------- */
  function describeDoc(doc) {
    const counts = { line: 0, polyline: 0, circle: 0, solid: 0, text: 0 };
    for (const cmd of doc.commands) {
      if (counts[cmd.type] !== undefined) counts[cmd.type] += 1;
    }
    const ext = doc.extents;
    return {
      width: ext.maxX - ext.minX,
      height: ext.maxY - ext.minY,
      layers: doc.layers.length + 1,
      commands: doc.commands.length,
      counts,
    };
  }

  function countsLabel(counts) {
    return `L:${counts.line} P:${counts.polyline} C:${counts.circle} S:${counts.solid} T:${counts.text}`;
  }

  function statsText(doc, { digits = 1 } = {}) {
    const d = describeDoc(doc);
    return (
      `${d.width.toFixed(digits)} × ${d.height.toFixed(digits)}mm · ` +
      `${d.layers} 层 · ${d.commands} 图元 (${countsLabel(d.counts)})`
    );
  }

  function renderStats(el, doc, options = {}) {
    if (!el) return;
    el.textContent = doc ? statsText(doc, options) : '空文档';
  }

  /* ---------------- 导出封装 ---------------- */
  function exportSvg(doc, baseName, { themeMode = 'light', mode = 'export', decorations, includeThemeSuffix = true } = {}) {
    if (!doc) return;
    VB.downloadSvg(doc, {
      filename: `${baseName}${includeThemeSuffix ? `-${themeMode}` : ''}.svg`,
      theme: resolveTheme(themeMode),
      mode,
      decorations,
      revokeDelayMs: 1500,
    });
  }

  function exportDxf(doc, baseName, { encoding = 'gbk', font = 'gbenor' } = {}) {
    if (!doc) return;
    const codec = new VB.TextCodec({
      onUnencodable: (entries) => console.warn('[VecBridge] 超出 GBK 的字符已转义：', entries),
    });
    VB.downloadDxf(doc, {
      filename: `${baseName}-${encoding}-${font}.dxf`,
      encoding,
      font,
      codec,
      revokeDelayMs: 1500,
    });
  }

  /* ---------------- 分段控件 ---------------- */
  function setSegmented(root, value, attr = 'data-seg') {
    if (!root) return;
    root.querySelectorAll(`[${attr}]`).forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === value);
    });
  }

  function bindSegmented(root, handler, attr = 'data-seg') {
    if (!root) return;
    root.querySelectorAll(`[${attr}]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute(attr);
        setSegmented(root, value, attr);
        handler(value);
      });
    });
  }

  /* ---------------- 文件拖拽 / 输入节流 ---------------- */
  function bindDropZone(zone, input, onFile, activeClasses = ['border-blue-400', 'bg-blue-50']) {
    if (!zone || !input) return;
    zone.addEventListener('click', () => {
      input.value = '';
      input.click();
    });
    input.addEventListener('change', (e) => onFile(e.target.files && e.target.files[0]));
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add(...activeClasses);
    });
    zone.addEventListener('dragleave', () => zone.classList.remove(...activeClasses));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove(...activeClasses);
      onFile(e.dataTransfer.files && e.dataTransfer.files[0]);
    });
  }

  function bindDebounced(el, fn, delay = 200) {
    if (!el) return;
    let timer = null;
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    });
  }

  window.DxfDemo = {
    guard,
    samples: { dxf: SAMPLE_DXF, svg: SAMPLE_SVG },
    resolveTheme,
    createPreview,
    bindThemeToggle,
    describeDoc,
    countsLabel,
    statsText,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
    bindDropZone,
    bindDebounced,
  };
})();

```

## examples\assets\demo.css
```css
/* ==========================================================================
   VecBridge 示例页共用样式（Tailwind 负责布局，本文件只承担结构性样式）
   供 playground / dxf-preview / svg-to-dxf / dom-to-dxf / canvas-record /
   browser-demo 共用。
   ========================================================================== */

html,
body {
  height: 100%;
}

/* ---------- 双引擎预览画布与 SVG 宿主 ---------- */
.vb-canvas {
  display: block;
  width: 100%;
  height: 100%;
  cursor: grab;
  user-select: none;
}
.vb-canvas:active {
  cursor: grabbing;
}

.vb-svg-host {
  width: 100%;
  height: 100%;
  cursor: grab;
  user-select: none;
}
.vb-svg-host:active {
  cursor: grabbing;
}
.vb-svg-host > svg {
  display: block;
  width: 100%;
  height: 100%;
}

/* 高保真 Visual SVG 纸张容器 */
.vb-visual-host {
  overflow: auto;
}
.vb-visual-host > svg {
  max-width: 100%;
  height: auto;
  background: #ffffff;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.1);
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

/* ---------- 细滚动条 ---------- */
.vb-scroll {
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}
.vb-scroll::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
.vb-scroll::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 999px;
}
.vb-scroll::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
.vb-scroll::-webkit-scrollbar-track {
  background: transparent;
}

/* ---------- 分段控件（视图切换 / 标签切换 / 场景切换） ---------- */
.vb-seg {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px;
  background: #f1f5f9;
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 10px;
}
.vb-seg-btn {
  padding: 5px 10px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  color: #475569;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
}
.vb-seg-btn:hover {
  color: #0f172a;
}
.vb-seg-btn.is-active {
  background: #ffffff;
  color: #1d4ed8;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.1);
}

/* 蓝色实心分段按钮（用于画布场景切换） */
.vb-seg-btn-solid.is-active {
  background: #2563eb;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.35);
}
.vb-seg-btn-solid.is-active:hover {
  color: #ffffff;
}

/* ---------- 通用按钮 / 表单控件 ---------- */
.vb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 500;
  line-height: 1.35;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}
.vb-btn:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.vb-btn:active {
  background: #f1f5f9;
}

.vb-btn-primary {
  border-color: #2563eb;
  background: #2563eb;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(37, 99, 235, 0.25);
}
.vb-btn-primary:hover {
  border-color: #1d4ed8;
  background: #1d4ed8;
  color: #ffffff;
}

.vb-btn-teal {
  border-color: #0d9488;
  background: #0d9488;
  color: #ffffff;
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(13, 148, 136, 0.25);
}
.vb-btn-teal:hover {
  border-color: #0f766e;
  background: #0f766e;
  color: #ffffff;
}

.vb-input,
.vb-select {
  width: 100%;
  padding: 6px 8px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  line-height: 1.35;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}
.vb-select {
  cursor: pointer;
}
.vb-input:focus,
.vb-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}
.vb-input::placeholder {
  color: #94a3b8;
}

.vb-check {
  width: 14px;
  height: 14px;
  accent-color: #2563eb;
  cursor: pointer;
}

.vb-textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: rgba(248, 250, 252, 0.7);
  color: #334155;
  font-family: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
  font-size: 11px;
  line-height: 1.55;
  resize: vertical;
  outline: none;
  transition: background-color 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.vb-textarea:focus {
  background: #ffffff;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

/* ---------- 可打印 DOM 样板（显式声明，避免 Tailwind Preflight 重置） ---------- */
.vb-sheet {
  width: 680px;
  padding: 18px 20px 18px 34px;
  position: relative;
  background: #ffffff;
  color: #111827;
  border: 2px solid #111827;
  font: 12px/1.5 "Microsoft YaHei", "SimSun", sans-serif;
}
.vb-sheet .vb-bind {
  position: absolute;
  left: 7px;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  letter-spacing: 5px;
  font-size: 11px;
  color: #6b7280;
  padding: 10px 2px;
  border-right: 1px dashed #9ca3af;
}
.vb-sheet .vb-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  margin-bottom: 10px;
  border-bottom: 3px double #111827;
}
.vb-sheet .vb-title {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: 1px;
  color: #111827;
}
.vb-sheet .vb-sub {
  font-size: 11px;
  color: #4b5563;
  margin-top: 2px;
}
.vb-sheet .vb-pill {
  padding: 3px 10px;
  border-radius: 12px;
  background: #dcfce7;
  border: 1px solid #168f33;
  color: #168f33;
  font-size: 11.5px;
  font-weight: 700;
}
.vb-sheet .vb-ignore {
  margin-bottom: 8px;
  padding: 5px 9px;
  border-radius: 4px;
  background: #fef3c7;
  border: 1px dashed #d97706;
  color: #92400e;
  font-size: 11px;
}
.vb-sheet table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 10px;
  table-layout: fixed;
}
.vb-sheet th,
.vb-sheet td {
  border: 1px solid #111827;
  padding: 4px 6px;
  font-size: 11.5px;
  vertical-align: middle;
}
.vb-sheet th {
  background: #eef2f7;
  font-weight: 700;
  text-align: center;
}
.vb-sheet .vb-input {
  width: 100%;
  padding: 2px 5px;
  border: 1px solid #9ca3af;
  border-radius: 3px;
  font: inherit;
  color: #111827;
  background: #ffffff;
}
.vb-sheet .vb-card-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
.vb-sheet .vb-box {
  flex: 1;
  padding: 8px 10px;
  border: 1px solid #6b7280;
  border-radius: 6px;
  background: #f9fafb;
}
.vb-sheet .vb-check-box {
  width: 195px;
  padding: 8px 10px;
  border: 1px solid #6b7280;
  border-radius: 6px;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.vb-sheet ul {
  list-style-type: disc;
  margin: 4px 0 0;
  padding-left: 18px;
}
.vb-sheet ol {
  list-style-type: decimal;
  margin: 4px 0 0;
  padding-left: 18px;
}
.vb-sheet li {
  margin: 2px 0;
}
.vb-sheet hr {
  border: 0;
  border-top: 1px dashed #6b7280;
  margin: 8px 0;
}
.vb-sheet .vb-note {
  padding: 7px 9px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
  font-size: 11px;
  color: #334155;
}
.vb-sheet [contenteditable]:focus {
  outline: 2px solid #93c5fd;
  outline-offset: 2px;
  border-radius: 2px;
}

/* ---------- 画布上的悬浮角标 ---------- */
.vb-badge {
  position: absolute;
  top: 10px;
  left: 12px;
  z-index: 10;
  pointer-events: none;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.18);
}
.vb-badge-blue {
  background: rgba(37, 99, 235, 0.9);
}
.vb-badge-teal {
  background: rgba(13, 148, 136, 0.9);
}

.vb-hint {
  position: absolute;
  bottom: 10px;
  right: 12px;
  z-index: 10;
  pointer-events: none;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #475569;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(226, 232, 240, 0.9);
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
}

```

## examples\assets\tailwind-theme.js
```js
/**
 * Tailwind CDN 主题配置（各示例页共用）
 * 用法：<script src="https://cdn.tailwindcss.com"></script>
 *       <script src="./assets/tailwind-theme.js"></script>
 */
tailwind.config = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Microsoft YaHei"', '"PingFang SC"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
};

```

## examples\js\browser-demo.js
```js
/* VecBridge API 绘图示例 —— 页面逻辑 */
(() => {
  const {
    createPreview,
    bindThemeToggle,
    renderStats,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const {
    DXF_FONT_RECIPES,
    DrawingDocument,
    TextCodec,
    drawHatch,
    downloadDxf,
    downloadSvg,
  } = window.VecBridge;

  /* ---------------- 用 API 现画一张 A4 图纸 ---------------- */
  const doc = new DrawingDocument();
  doc.setExtents(0, 0, 297, 210);

  for (const [name, color, linetype] of [
    ['FRAME_OUTER', 8, 'CONTINUOUS'],
    ['FRAME_BORDER', 7, 'CONTINUOUS'],
    ['TABLE_LINE', 7, 'CONTINUOUS'],
    ['GRID_DASH', 8, 'DASHED'],
    ['HATCH_PAT', 8, 'CONTINUOUS'],
    ['CURVE_A', 1, 'CONTINUOUS'],
    ['CURVE_B', 5, 'CONTINUOUS'],
    ['TEXT_TITLE', 7, 'CONTINUOUS'],
    ['TEXT_VALUE', 7, 'CONTINUOUS'],
  ]) {
    doc.addLayer(name, color, linetype);
  }

  // 图框与标题栏
  doc.addRect(0, 0, 297, 210, 'FRAME_OUTER', 8, 0, { paper: true });
  doc.addRect(20, 8, 289, 202, 'FRAME_BORDER', 7, 0.35);
  doc.addText(154.5, 193, 4.5, '示例图纸', 'TEXT_TITLE', 7, 0, 1, 2, 0.9, { bold: true });
  doc.addLine(20, 30, 289, 30, 'TABLE_LINE', 7);
  doc.addText(24, 24, 2.4, '示例：DXF R12 渲染', 'TEXT_VALUE', 7, 0, 0, 2, 0.85);
  doc.addText(24, 18, 2.0, '比例 1:1    单位 mm', 'TEXT_VALUE', 7, 0, 0, 2, 0.85);

  // 参考网格
  for (let x = 30; x <= 280; x += 10) doc.addLine(x, 40, x, 180, 'GRID_DASH', 8, 'DASHED');
  for (let y = 40; y <= 180; y += 10) doc.addLine(30, y, 280, y, 'GRID_DASH', 8, 'DASHED');

  // 内置填充图案
  drawHatch(doc, 40, 60, 90, 120, 'diagonal', 'HATCH_PAT', 8);
  drawHatch(doc, 100, 60, 150, 120, 'dots-coarse', 'HATCH_PAT', 8);
  drawHatch(doc, 160, 60, 210, 120, 'crosshatch', 'HATCH_PAT', 8);
  doc.addText(65, 126, 2.2, 'diagonal', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  doc.addText(125, 126, 2.2, 'dots-coarse', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  doc.addText(185, 126, 2.2, 'crosshatch', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);

  // 两条采样曲线
  const ptsA = [];
  const ptsB = [];
  for (let i = 0; i <= 60; i++) {
    const x = 40 + i * 4;
    ptsA.push([x, 150 + Math.sin(i / 8) * 12 + Math.sin(i / 3) * 4]);
    ptsB.push([x, 150 + Math.cos(i / 7) * 13]);
  }
  doc.addPolyline(ptsA, 'CURVE_A', 1, false, 0.35);
  doc.addPolyline(ptsB, 'CURVE_B', 5, false, 0.35);

  // 尺寸标注圆
  doc.addCircle(250, 90, 18, 'CURVE_A', 1);
  doc.addText(250, 90, 3, 'R18', 'TEXT_VALUE', 7, 0, 1, 2, 0.85);

  const decorations = { boldLayers: ['TEXT_TITLE'], paperFillLayers: ['FRAME_OUTER'] };

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    panes: [document.getElementById('canvasPane'), document.getElementById('svgPane')],
    theme: 'light',
    decorations,
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');
  preview.setDocument(doc, { fit: true });
  renderStats(document.getElementById('statsPill'), doc, { digits: 1 });

  /* ---------------- 导出 ---------------- */
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const filenamePreview = document.getElementById('filenamePreview');

  const buildDxfFilename = () => `dxf-example-${encodingSelect.value}-${fontSelect.value}.dxf`;

  const syncFilenamePreview = () => {
    filenamePreview.textContent = buildDxfFilename();
    filenamePreview.title = buildDxfFilename();
  };

  const getCurrentTime = () => {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${String(date.getFullYear()).slice(-2)}${date.getMonth() + 1}${date.getDate()}${pad(date.getHours())}-${pad(date.getMinutes())}`;
  };

  const exportDxfFile = (filename, encoding, font) => {
    const codec = new TextCodec({
      onUnencodable: (entries) => console.warn('[DXF] 超出 GBK 的字符已转义：', entries),
    });
    downloadDxf(doc, {
      filename,
      encoding,
      font,
      codec,
      onInvalidCommand: (_cmd, reason) => console.warn('[DXF] 已跳过非法实体：', reason),
      revokeDelayMs: 1500,
    });
  };

  encodingSelect.addEventListener('change', syncFilenamePreview);
  fontSelect.addEventListener('change', syncFilenamePreview);
  syncFilenamePreview();

  document.getElementById('fitBtn').addEventListener('click', () => preview.fit());

  document.getElementById('exportBtn').addEventListener('click', () => {
    exportDxfFile(buildDxfFilename(), encodingSelect.value, fontSelect.value);
  });

  document.getElementById('exportBatchBtn').addEventListener('click', () => {
    const stamp = getCurrentTime();
    const encodings = ['gbk', 'utf8'];
    const fonts = Object.keys(DXF_FONT_RECIPES);
    for (const encoding of encodings) {
      for (const font of fonts) {
        exportDxfFile(`dxf-${encoding}-${font}_${stamp}.dxf`, encoding, font);
      }
    }
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    downloadSvg(doc, {
      filename: `dxf-example-${theme.mode}.svg`,
      theme: DxfDemo.resolveTheme(theme.mode),
      decorations,
      revokeDelayMs: 1500,
    });
  });

  window.__demo = {
    doc,
    preview,
    get theme() { return theme.mode; },
    buildDxfFilename,
    get encoding() { return encodingSelect.value; },
    get font() { return fontSelect.value; },
  };
})();

```

## examples\js\canvas-record.js
```js
/* Canvas 2D API 矢量录制 —— 页面逻辑 */
(() => {
  const {
    createPreview,
    bindThemeToggle,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const { recordCanvasContext } = window.VecBridge;

  const drawCanvas = document.getElementById('drawCanvas');
  const realCtx = drawCanvas.getContext('2d');
  const widthSelect = document.getElementById('widthSelect');
  const fillModeSelect = document.getElementById('fillModeSelect');
  const brushColorSelect = document.getElementById('brushColorSelect');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const sceneSeg = document.getElementById('sceneSeg');
  const viewSeg = document.getElementById('viewSeg');
  const statsPill = document.getElementById('statsPill');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');

  let activeScene = 'geo';
  let viewMode = 'both';
  let recorder = null;
  let currentDoc = null;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? svgPane : canvasPane),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');

  function applyView(mode) {
    viewMode = mode;
    setSegmented(viewSeg, mode);
    canvasPane.classList.toggle('hidden', mode === 'svg');
    svgPane.classList.toggle('hidden', mode === 'canvas');
    if (currentDoc) requestAnimationFrame(() => preview.fit());
  }

  function createRecorder() {
    const fitW = Number(widthSelect.value);
    return recordCanvasContext(realCtx, {
      width: drawCanvas.width,
      height: drawCanvas.height,
      fitWidthMm: fitW > 0 ? fitW : undefined,
      fillMode: fillModeSelect.value,
      markPaper: true,
    });
  }

  function syncPreview(autoFit = true) {
    currentDoc = recorder.toDocument();
    preview.setDocument(currentDoc, { fit: autoFit });
    renderStats(statsPill, currentDoc, { digits: 1 });
  }

  /* ---------------- 内置场景 ---------------- */
  function drawGeometryScene(ctx) {
    ctx.clearRect(0, 0, 640, 440);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 640, 440);

    ctx.setLayer('GRID');
    ctx.save();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    for (let x = 40; x <= 600; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = 40; y <= 400; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 592, 392);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Canvas 2D 标准 API 实时录制示例', 320, 52);

    ctx.setLayer('SHAPES');
    ctx.beginPath();
    ctx.roundRect(56, 88, 170, 110, 16);
    ctx.fillStyle = '#e0f2fe';
    ctx.fill();
    ctx.strokeStyle = '#0f5acc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(141, 143);
    ctx.rotate(Math.PI / 6);
    ctx.strokeStyle = '#d92121';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-32, -22, 64, 44);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(330, 145, 52, 0, Math.PI * 2);
    ctx.strokeStyle = '#168f33';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(330, 145, 34, -Math.PI * 0.75, Math.PI * 0.45);
    ctx.strokeStyle = '#d92121';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(505, 145, 62, 32, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.setLayer('CURVES');
    ctx.beginPath();
    ctx.moveTo(64, 340);
    ctx.bezierCurveTo(180, 220, 290, 390, 420, 270);
    ctx.quadraticCurveTo(500, 210, 576, 335);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.setLayer('LABELS');
    ctx.save();
    ctx.translate(330, 145);
    ctx.fillStyle = '#111827';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R52 精确圆', 0, 0);
    ctx.restore();
  }

  function drawChartScene(ctx) {
    ctx.clearRect(0, 0, 640, 440);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 640, 440);

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, 600, 400);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 17px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('季度指标对比图（Canvas 2D 直接转矢量 DXF/SVG）', 320, 50);

    const x0 = 80;
    const y0 = 365;
    const w = 500;
    const h = 270;

    ctx.setLayer('AXIS');
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i <= 5; i++) {
      const y = y0 - (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - h - 10);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + w + 10, y0);
    ctx.stroke();

    const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    const bars = [42, 68, 56, 84, 73, 92];
    const lineVals = [35, 58, 62, 76, 82, 95];
    const step = w / labels.length;

    ctx.setLayer('BARS');
    for (let i = 0; i < labels.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const bh = (bars[i] / 100) * h;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cx - 18, y0 - bh, 36, bh);
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 18, y0 - bh, 36, bh);

      ctx.fillStyle = '#111827';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, y0 + 10);
    }

    ctx.setLayer('TREND');
    ctx.strokeStyle = '#d92121';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < lineVals.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const cy = y0 - (lineVals[i] / 100) * h;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    for (let i = 0; i < lineVals.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const cy = y0 - (lineVals[i] / 100) * h;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d92121';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  function renderScene(name) {
    activeScene = name;
    setSegmented(sceneSeg, name);
    recorder = createRecorder();
    if (name === 'geo') drawGeometryScene(recorder);
    else if (name === 'chart') drawChartScene(recorder);
    else {
      recorder.clearRect(0, 0, 640, 440);
      recorder.fillStyle = '#ffffff';
      recorder.fillRect(0, 0, 640, 440);
    }
    syncPreview(true);
  }

  /* ---------------- 手绘叠加 ---------------- */
  let drawing = false;
  let lastPt = null;
  let strokePts = [];

  function canvasPointFromEvent(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) * drawCanvas.width) / rect.width,
      ((e.clientY - rect.top) * drawCanvas.height) / rect.height,
    ];
  }

  drawCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    drawing = true;
    const pt = canvasPointFromEvent(e);
    lastPt = pt;
    strokePts = [pt];
  });

  window.addEventListener('mousemove', (e) => {
    if (!drawing || !lastPt) return;
    const pt = canvasPointFromEvent(e);
    if (Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]) < 3) return;
    realCtx.save();
    realCtx.strokeStyle = brushColorSelect.value;
    realCtx.lineWidth = 2;
    realCtx.lineCap = 'round';
    realCtx.beginPath();
    realCtx.moveTo(lastPt[0], lastPt[1]);
    realCtx.lineTo(pt[0], pt[1]);
    realCtx.stroke();
    realCtx.restore();
    strokePts.push(pt);
    lastPt = pt;
  });

  window.addEventListener('mouseup', () => {
    if (!drawing) return;
    drawing = false;
    if (strokePts.length >= 2) {
      recorder.save();
      recorder.setLayer('FREEHAND');
      recorder.strokeStyle = brushColorSelect.value;
      recorder.lineWidth = 2;
      recorder.beginPath();
      recorder.moveTo(strokePts[0][0], strokePts[0][1]);
      for (let i = 1; i < strokePts.length; i++) {
        recorder.lineTo(strokePts[i][0], strokePts[i][1]);
      }
      recorder.stroke();
      recorder.restore();
      syncPreview(false);
    }
    lastPt = null;
    strokePts = [];
  });

  /* ---------------- 事件 ---------------- */
  bindSegmented(sceneSeg, renderScene);
  bindSegmented(viewSeg, applyView);

  widthSelect.addEventListener('change', () => renderScene(activeScene));
  fillModeSelect.addEventListener('change', () => renderScene(activeScene));

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, `canvas-recorded-${activeScene}`, { themeMode: theme.mode, mode: 'export' });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxf(currentDoc, `canvas-recorded-${activeScene}`, {
      encoding: encodingSelect.value,
      font: fontSelect.value,
    });
  });

  /* ---------------- 初始化 ---------------- */
  applyView('both');
  renderScene('geo');

  window.__canvasDemo = {
    get recorder() { return recorder; },
    get doc() { return currentDoc; },
    preview,
    renderScene,
    applyView,
  };
})();

```

## examples\js\dom-to-dxf.js
```js
/* HTML DOM → SVG / DXF 实时转换 —— 页面逻辑 */
(() => {
  const {
    createPreview,
    bindThemeToggle,
    renderStats,
    setSegmented,
    bindSegmented,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const {
    TextCodec,
    domToDocument,
    domToSvg,
    downloadDomAsDxf,
    downloadDomAsSvg,
  } = window.VecBridge;

  const sourceSheet = document.getElementById('sourceSheet');
  const widthSelect = document.getElementById('widthSelect');
  const bgModeSelect = document.getElementById('bgModeSelect');
  const layerBySelect = document.getElementById('layerBySelect');
  const dedupeCheck = document.getElementById('dedupeCheck');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const statsPill = document.getElementById('statsPill');
  const cadHost = document.getElementById('cadHost');
  const visualHost = document.getElementById('visualHost');
  const viewSeg = document.getElementById('viewSeg');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');

  let currentDoc = null;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');

  function getOptions() {
    const fitWidth = Number(widthSelect.value);
    return {
      fitWidthMm: fitWidth > 0 ? fitWidth : undefined,
      backgroundMode: bgModeSelect.value,
      layerBy: layerBySelect.value,
      dedupeBorders: dedupeCheck.checked,
    };
  }

  function rebuild(autoFit = true) {
    const opts = getOptions();
    const doc = domToDocument(sourceSheet, opts);
    currentDoc = doc;
    preview.setDocument(doc, { fit: autoFit });

    visualHost.innerHTML = domToSvg(sourceSheet, { ...opts, mode: 'visual' });
    renderStats(statsPill, currentDoc, { digits: 1 });
  }

  function setView(view) {
    setSegmented(viewSeg, view);
    cadHost.classList.toggle('hidden', view !== 'cad');
    visualHost.classList.toggle('hidden', view !== 'visual');
    if (view === 'cad' && currentDoc) requestAnimationFrame(() => preview.fit());
  }

  bindSegmented(viewSeg, setView);

  document.getElementById('refreshBtn').addEventListener('click', () => rebuild(true));
  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  for (const el of [widthSelect, bgModeSelect, layerBySelect, dedupeCheck]) {
    el.addEventListener('change', () => rebuild(true));
  }

  /* ---------------- 导出 ---------------- */
  document.getElementById('exportVisualSvgBtn').addEventListener('click', () => {
    downloadDomAsSvg(sourceSheet, {
      ...getOptions(),
      mode: 'visual',
      filename: 'spec-sheet-visual.svg',
      revokeDelayMs: 1500,
    });
  });

  document.getElementById('exportCadSvgBtn').addEventListener('click', () => {
    downloadDomAsSvg(sourceSheet, {
      ...getOptions(),
      mode: 'cad',
      svgOptions: { theme: theme.mode === 'dark' ? 'dark' : 'light' },
      filename: `spec-sheet-cad-${theme.mode}.svg`,
      revokeDelayMs: 1500,
    });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    const encoding = encodingSelect.value;
    const font = fontSelect.value;
    const codec = new TextCodec({
      onUnencodable: (entries) => console.warn('[VecBridge] 超出 GBK 的字符已转义：', entries),
    });
    downloadDomAsDxf(sourceSheet, {
      ...getOptions(),
      encoding,
      font,
      codec,
      filename: `spec-sheet-${encoding}-${font}.dxf`,
      revokeDelayMs: 1500,
    });
  });

  /* ---------------- 初始化 ---------------- */
  setView('cad');
  requestAnimationFrame(() => rebuild(true));

  window.__domDemo = {
    rebuild,
    get doc() { return currentDoc; },
    preview,
    setView,
  };
})();

```

## examples\js\dxf-preview.js
```js
/* DXF 上传预览与 SVG 导出 —— 页面逻辑 */
(() => {
  const {
    samples,
    createPreview,
    bindThemeToggle,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
    bindDropZone,
    bindDebounced,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const {
    parseDxfWithReport,
  } = window.VecBridge;

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const dxfEncoding = document.getElementById('dxfEncoding');
  const dxfSpace = document.getElementById('dxfSpace');
  const dxfTol = document.getElementById('dxfTol');
  const dxfHiddenLayers = document.getElementById('dxfHiddenLayers');
  const dxfText = document.getElementById('dxfText');
  const statusBox = document.getElementById('statusBox');
  const warningsBox = document.getElementById('warningsBox');
  const errorBox = document.getElementById('errorBox');
  const statsBox = document.getElementById('statsBox');
  const statsPill = document.getElementById('statsPill');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');
  const viewSeg = document.getElementById('viewSeg');

  let viewMode = 'both';
  let currentInput = null;
  let currentBaseName = 'dxf-sample';
  let currentDoc = null;
  let lastReport = null;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? svgPane : canvasPane),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });

  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');
  const encoding = () => encodingSelect.value;
  const font = () => fontSelect.value;

  /* ---------------- 解析与渲染 ---------------- */
  function renderCurrent(autoFit = true) {
    errorBox.classList.add('hidden');
    warningsBox.classList.add('hidden');

    if (currentInput === null || (typeof currentInput === 'string' && !currentInput.trim())) {
      currentDoc = null;
      lastReport = null;
      preview.setDocument(null);
      statusBox.textContent = '等待导入 DXF…';
      statsBox.textContent = '尚未载入图纸';
      statsPill.textContent = '空文档';
      return;
    }

    try {
      const report = parseDxfWithReport(currentInput, {
        encoding: dxfEncoding.value,
        space: dxfSpace.value,
        curveTolerance: parseFloat(dxfTol.value) || 0.1,
        includeHiddenLayers: dxfHiddenLayers.checked,
      });

      lastReport = report;
      currentDoc = report.document;
      preview.setDocument(currentDoc, { fit: autoFit });

      const s = report.stats;
      statusBox.innerHTML =
        `<strong>解析成功</strong> · 版本 <span class="font-mono">${s.acadVersion || '未声明'}</span> · ` +
        `解码 <span class="font-mono">${s.detectedEncoding}</span>${s.codepage ? ` (${s.codepage})` : ''}`;

      const ext = currentDoc.extents;
      const counts = { line: 0, circle: 0, polyline: 0, solid: 0, text: 0 };
      for (const cmd of currentDoc.commands) counts[cmd.type] += 1;

      statsBox.innerHTML =
        `图幅：<strong>${(ext.maxX - ext.minX).toFixed(2)} × ${(ext.maxY - ext.minY).toFixed(2)} mm</strong><br>` +
        `图层：<strong>${currentDoc.layers.length + 1}</strong> · 块定义：<strong>${s.blockCount}</strong><br>` +
        `图元：<strong>${currentDoc.commands.length}</strong> ` +
        `(LINE ${counts.line} / POLY ${counts.polyline} / CIRCLE ${counts.circle} / SOLID ${counts.solid} / TEXT ${counts.text})`;

      renderStats(statsPill, currentDoc, { digits: 1 });

      if (report.warnings.length > 0) {
        warningsBox.textContent = report.warnings.join('\n');
        warningsBox.classList.remove('hidden');
      }
    } catch (err) {
      currentDoc = null;
      lastReport = null;
      preview.setDocument(null);
      errorBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      errorBox.classList.remove('hidden');
      statusBox.textContent = '解析失败';
      statsBox.textContent = '请检查源文件或编码设置';
      statsPill.textContent = '空文档';
    }
  }

  async function loadFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'dxf-preview';
    currentInput = new Uint8Array(await file.arrayBuffer());
    dxfText.value = '';
    dxfText.placeholder = `已载入二进制文件：${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    renderCurrent(true);
  }

  /* ---------------- 视图切换 ---------------- */
  function applyView(mode) {
    viewMode = mode;
    setSegmented(viewSeg, mode);
    canvasPane.classList.toggle('hidden', mode === 'svg');
    svgPane.classList.toggle('hidden', mode === 'canvas');
    if (currentDoc) requestAnimationFrame(() => preview.fit());
  }

  /* ---------------- 事件绑定 ---------------- */
  bindDropZone(dropZone, fileInput, loadFile);
  bindSegmented(viewSeg, applyView);

  bindDebounced(dxfText, () => {
    currentBaseName = 'pasted-dxf';
    currentInput = dxfText.value;
    renderCurrent(true);
  }, 200);

  for (const el of [dxfEncoding, dxfSpace, dxfTol, dxfHiddenLayers]) {
    el.addEventListener('change', () => renderCurrent(true));
  }

  document.getElementById('sampleBtn').addEventListener('click', () => {
    currentBaseName = 'dxf-sample';
    currentInput = samples.dxf;
    dxfText.value = samples.dxf;
    renderCurrent(true);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    currentBaseName = 'dxf-preview';
    currentInput = null;
    dxfText.value = '';
    dxfText.placeholder = '粘贴 ASCII DXF 文本（以 0 / SECTION 开头）';
    renderCurrent(true);
  });

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, currentBaseName, { themeMode: theme.mode, mode: 'export' });
  });

  document.getElementById('exportPrintSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, `${currentBaseName}-print`, { themeMode: 'light', mode: 'export', includeThemeSuffix: false });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxf(currentDoc, currentBaseName, { encoding: encoding(), font: font() });
  });

  /* ---------------- 初始化 ---------------- */
  currentInput = samples.dxf;
  dxfText.value = samples.dxf;
  applyView('both');
  renderCurrent(true);

  window.__dxfPreview = {
    get doc() { return currentDoc; },
    get report() { return lastReport; },
    preview,
    renderCurrent,
    applyView,
  };
})();

```

## examples\js\playground.js
```js
/* VecBridge Playground —— 工作台逻辑（DXF / SVG / DOM / Canvas 四模式） */
(() => {
  window.DxfDemo.guard();

  const {
    samples,
    createPreview,
    exportDxf: exportDxfFile,
  } = window.DxfDemo;
  const SAMPLE_DXF = samples.dxf;
  const SAMPLE_SVG = samples.svg;

  const {
    EXTENDED_DARK_THEME,
    EXTENDED_LIGHT_THEME,
    TextCodec,
    parseDxfWithReport,
    parseSvgToDocument,
    domToDocument,
    domToSvg,
    recordCanvasContext,
    downloadSvg,
    downloadBytes,
  } = window.VecBridge;

  /* ================= 全局状态与双引擎预览 ================= */
  const previewCanvasPane = document.getElementById('previewCanvasPane');
  const previewSvgPane = document.getElementById('previewSvgPane');
  const cadDualHost = document.getElementById('cadDualHost');
  const visualSvgHost = document.getElementById('visualSvgHost');
  const visualSvgTabBtn = document.getElementById('visualSvgTabBtn');
  const previewThemeBtn = document.getElementById('previewThemeBtn');
  const statsPill = document.getElementById('statsPill');
  const globalEncoding = document.getElementById('globalEncoding');
  const globalFont = document.getElementById('globalFont');

  let activeTab = 'dxf'; // 'dxf' | 'svg' | 'dom' | 'canvas'
  let viewMode = 'both'; // 'both' | 'canvas' | 'svg' | 'visual'
  let previewTheme = 'light'; // 默认清新浅色打印主题
  let currentDoc = null;
  let currentVisualSvg = '';
  let currentBaseName = 'vecbridge-dxf-sample';

  // Tab 1 状态
  let dxfInput = SAMPLE_DXF;
  // Tab 4 状态
  let canvasScene = 'geo';
  let canvasRecorder = null;

  const resolvePreviewTheme = () =>
    previewTheme === 'dark' ? EXTENDED_DARK_THEME : EXTENDED_LIGHT_THEME;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? previewSvgPane : previewCanvasPane),
    panes: [previewCanvasPane, previewSvgPane],
    theme: previewTheme,
  });

  function updateDocument(doc, autoFit = true) {
    currentDoc = doc;
    preview.setDocument(doc, { fit: autoFit });
    if (!doc) {
      statsPill.textContent = '空文档';
      return;
    }
    const c = { line: 0, polyline: 0, circle: 0, solid: 0, text: 0 };
    for (const cmd of doc.commands) c[cmd.type] += 1;
    const ext = doc.extents;
    statsPill.textContent =
      `${(ext.maxX - ext.minX).toFixed(1)}×${(ext.maxY - ext.minY).toFixed(1)}mm · ` +
      `${doc.layers.length + 1} 层 · ${doc.commands.length} 图元 ` +
      `(L:${c.line} P:${c.polyline} C:${c.circle} S:${c.solid} T:${c.text})`;
  }

  function setViewMode(mode) {
    if (mode === 'visual' && activeTab !== 'dom') mode = 'both';
    viewMode = mode;
    document.querySelectorAll('.view-btn').forEach((btn) => {
      const on = btn.dataset.view === mode;
      btn.className = `view-btn ${btn.id === 'visualSvgTabBtn' && activeTab !== 'dom' ? 'hidden ' : ''}px-2.5 py-1 rounded-md text-xs transition-all ${
        on ? 'font-semibold bg-white text-slate-900 shadow-sm' : 'font-medium text-slate-600 hover:text-slate-900'
      }`;
    });

    const isVisual = mode === 'visual';
    cadDualHost.classList.toggle('hidden', isVisual);
    visualSvgHost.classList.toggle('hidden', !isVisual);
    if (!isVisual) {
      previewCanvasPane.classList.toggle('hidden', mode === 'svg');
      previewSvgPane.classList.toggle('hidden', mode === 'canvas');
      if (currentDoc) requestAnimationFrame(() => preview.fit());
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      const on = btn.dataset.tab === tab;
      btn.className = `tab-btn px-3 py-1.5 rounded-lg text-xs transition-all ${
        on ? 'font-semibold bg-white text-blue-700 shadow-sm' : 'font-medium text-slate-600 hover:text-slate-900'
      }`;
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.id !== `panel-${tab}`);
    });

    // 左侧在 DOM 模式下稍微加宽便于查看完整规格表格
    const leftPanel = document.getElementById('leftPanel');
    leftPanel.style.width = tab === 'dom' ? '48%' : '';

    visualSvgTabBtn.classList.toggle('hidden', tab !== 'dom');
    if (tab !== 'dom' && viewMode === 'visual') setViewMode('both');

    if (tab === 'dxf') runDxfTab(true);
    else if (tab === 'svg') runSvgTab(true);
    else if (tab === 'dom') requestAnimationFrame(() => runDomTab(true));
    else if (tab === 'canvas') requestAnimationFrame(() => runCanvasTab(canvasScene));
  }

  /* ================= TAB 1: DXF 解析逻辑 ================= */
  const dxfFileInput = document.getElementById('dxfFileInput');
  const dxfDropZone = document.getElementById('dxfDropZone');
  const dxfEncoding = document.getElementById('dxfEncoding');
  const dxfSpace = document.getElementById('dxfSpace');
  const dxfTol = document.getElementById('dxfTol');
  const dxfHiddenLayers = document.getElementById('dxfHiddenLayers');
  const dxfText = document.getElementById('dxfText');
  const dxfDiagBox = document.getElementById('dxfDiagBox');
  const dxfWarnBox = document.getElementById('dxfWarnBox');
  const dxfErrBox = document.getElementById('dxfErrBox');

  function runDxfTab(autoFit = true) {
    dxfErrBox.classList.add('hidden');
    dxfWarnBox.classList.add('hidden');
    if (!dxfInput || (typeof dxfInput === 'string' && !dxfInput.trim())) {
      dxfDiagBox.textContent = '等待上传或粘贴 ASCII DXF 文件…';
      updateDocument(null);
      return;
    }
    try {
      const report = parseDxfWithReport(dxfInput, {
        encoding: dxfEncoding.value,
        space: dxfSpace.value,
        curveTolerance: parseFloat(dxfTol.value) || 0.1,
        includeHiddenLayers: dxfHiddenLayers.checked,
      });
      const s = report.stats;
      dxfDiagBox.innerHTML =
        `<strong>解析成功</strong> · 版本 <code>${s.acadVersion || '未声明'}</code> · ` +
        `解码 <code>${s.detectedEncoding}</code>${s.codepage ? ` (${s.codepage})` : ''} · ` +
        `块定义 <strong>${s.blockCount}</strong>`;
      if (report.warnings.length > 0) {
        dxfWarnBox.textContent = report.warnings.join('\n');
        dxfWarnBox.classList.remove('hidden');
      }
      updateDocument(report.document, autoFit);
    } catch (err) {
      dxfErrBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      dxfErrBox.classList.remove('hidden');
      updateDocument(null);
    }
  }

  async function loadDxfFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'dxf-converted';
    dxfInput = new Uint8Array(await file.arrayBuffer());
    dxfText.value = '';
    dxfText.placeholder = `已读取二进制 DXF：${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    runDxfTab(true);
  }

  dxfDropZone.addEventListener('click', () => { dxfFileInput.value = ''; dxfFileInput.click(); });
  dxfFileInput.addEventListener('change', (e) => loadDxfFile(e.target.files[0]));
  dxfDropZone.addEventListener('dragover', (e) => { e.preventDefault(); dxfDropZone.classList.add('border-blue-500', 'bg-blue-50'); });
  dxfDropZone.addEventListener('dragleave', () => dxfDropZone.classList.remove('border-blue-500', 'bg-blue-50'));
  dxfDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dxfDropZone.classList.remove('border-blue-500', 'bg-blue-50');
    loadDxfFile(e.dataTransfer.files[0]);
  });

  let dxfTimer = null;
  dxfText.addEventListener('input', () => {
    clearTimeout(dxfTimer);
    dxfTimer = setTimeout(() => {
      currentBaseName = 'pasted-dxf';
      dxfInput = dxfText.value;
      runDxfTab(true);
    }, 200);
  });
  for (const el of [dxfEncoding, dxfSpace, dxfTol, dxfHiddenLayers]) {
    el.addEventListener('change', () => runDxfTab(true));
  }
  document.getElementById('dxfSampleBtn').addEventListener('click', () => {
    currentBaseName = 'vecbridge-dxf-sample';
    dxfInput = SAMPLE_DXF;
    dxfText.value = SAMPLE_DXF;
    runDxfTab(true);
  });
  document.getElementById('dxfClearBtn').addEventListener('click', () => {
    dxfInput = '';
    dxfText.value = '';
    runDxfTab(true);
  });

  /* ================= TAB 2: SVG → DXF 逻辑 ================= */
  const svgFileInput = document.getElementById('svgFileInput');
  const svgDropZone = document.getElementById('svgDropZone');
  const svgText = document.getElementById('svgText');
  const svgYAxis = document.getElementById('svgYAxis');
  const svgLayerBy = document.getElementById('svgLayerBy');
  const svgFillMode = document.getElementById('svgFillMode');
  const svgTol = document.getElementById('svgTol');
  const svgIgnoreBg = document.getElementById('svgIgnoreBg');
  const svgErrBox = document.getElementById('svgErrBox');

  svgText.value = SAMPLE_SVG;

  function runSvgTab(autoFit = true) {
    svgErrBox.classList.add('hidden');
    const src = svgText.value.trim();
    if (!src) { updateDocument(null); return; }
    try {
      const doc = parseSvgToDocument(src, {
        yAxis: svgYAxis.value,
        layerBy: svgLayerBy.value,
        fillMode: svgFillMode.value,
        curveTolerance: parseFloat(svgTol.value) || 0.1,
        ignoreBackground: svgIgnoreBg.checked,
      });
      currentBaseName = 'vecbridge-svg-converted';
      updateDocument(doc, autoFit);
    } catch (err) {
      svgErrBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      svgErrBox.classList.remove('hidden');
      updateDocument(null);
    }
  }

  async function loadSvgFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'svg-converted';
    svgText.value = await file.text();
    runSvgTab(true);
  }

  svgDropZone.addEventListener('click', () => { svgFileInput.value = ''; svgFileInput.click(); });
  svgFileInput.addEventListener('change', (e) => loadSvgFile(e.target.files[0]));
  svgDropZone.addEventListener('dragover', (e) => { e.preventDefault(); svgDropZone.classList.add('border-teal-500', 'bg-teal-50'); });
  svgDropZone.addEventListener('dragleave', () => svgDropZone.classList.remove('border-teal-500', 'bg-teal-50'));
  svgDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    svgDropZone.classList.remove('border-teal-500', 'bg-teal-50');
    loadSvgFile(e.dataTransfer.files[0]);
  });

  let svgTimer = null;
  svgText.addEventListener('input', () => {
    clearTimeout(svgTimer);
    svgTimer = setTimeout(() => runSvgTab(true), 200);
  });
  for (const el of [svgYAxis, svgLayerBy, svgFillMode, svgTol, svgIgnoreBg]) {
    el.addEventListener('change', () => runSvgTab(true));
  }
  document.getElementById('svgSampleBtn').addEventListener('click', () => {
    svgText.value = SAMPLE_SVG;
    runSvgTab(true);
  });

  /* ================= TAB 3: HTML DOM → 矢量逻辑 ================= */
  const domSourceSheet = document.getElementById('domSourceSheet');
  const domWidth = document.getElementById('domWidth');
  const domBgMode = document.getElementById('domBgMode');
  const domDedupe = document.getElementById('domDedupe');

  function getDomOpts() {
    const w = Number(domWidth.value);
    return {
      fitWidthMm: w > 0 ? w : undefined,
      backgroundMode: domBgMode.value,
      dedupeBorders: domDedupe.checked,
    };
  }

  function runDomTab(autoFit = true) {
    const opts = getDomOpts();
    currentBaseName = 'vecbridge-dom-sheet';
    const doc = domToDocument(domSourceSheet, opts);
    currentVisualSvg = domToSvg(domSourceSheet, { ...opts, mode: 'visual' });
    visualSvgHost.innerHTML = currentVisualSvg;
    updateDocument(doc, autoFit);
  }

  document.getElementById('domRefreshBtn').addEventListener('click', () => runDomTab(true));
  for (const el of [domWidth, domBgMode, domDedupe]) {
    el.addEventListener('change', () => runDomTab(true));
  }

  /* ================= TAB 4: Canvas 2D 双写录制逻辑 ================= */
  const drawCanvas = document.getElementById('drawCanvas');
  const realCtx = drawCanvas.getContext('2d');
  const canvasWidthMm = document.getElementById('canvasWidthMm');
  const canvasFillMode = document.getElementById('canvasFillMode');
  const brushColor = document.getElementById('brushColor');

  function createFreshRecorder() {
    const fitW = Number(canvasWidthMm.value);
    return recordCanvasContext(realCtx, {
      width: drawCanvas.width,
      height: drawCanvas.height,
      fitWidthMm: fitW > 0 ? fitW : undefined,
      fillMode: canvasFillMode.value,
      markPaper: true,
    });
  }

  function drawCanvasGeo(ctx) {
    ctx.clearRect(0, 0, 520, 360);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 520, 360);

    ctx.setLayer('GRID');
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let x = 40; x <= 480; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x, 328); ctx.stroke();
    }
    for (let y = 40; y <= 320; y += 40) {
      ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(488, y); ctx.stroke();
    }
    ctx.restore();

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(20, 20, 480, 320);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Canvas 2D 标准 API 实时录制', 260, 46);

    ctx.setLayer('SHAPES');
    ctx.beginPath();
    ctx.roundRect(48, 76, 136, 92, 14);
    ctx.fillStyle = '#dbeafe';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.save();
    ctx.translate(116, 122);
    ctx.rotate(Math.PI / 6);
    ctx.strokeStyle = '#dc2626';
    ctx.strokeRect(-26, -18, 52, 36);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(270, 124, 42, 0, Math.PI * 2);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(270, 124, 28, -Math.PI * 0.7, Math.PI * 0.45);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(410, 124, 52, 26, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.setLayer('CURVES');
    ctx.beginPath();
    ctx.moveTo(54, 284);
    ctx.bezierCurveTo(150, 190, 240, 320, 345, 224);
    ctx.quadraticCurveTo(410, 180, 466, 280);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  function drawCanvasChart(ctx) {
    ctx.clearRect(0, 0, 520, 360);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 520, 360);

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, 484, 324);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('季度指标对比（Canvas 2D → 矢量 DXF/SVG）', 260, 44);

    const x0 = 64, y0 = 296, w = 408, h = 216;
    ctx.setLayer('AXIS');
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    for (let i = 1; i <= 4; i++) {
      const y = y0 - (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0 - h - 8); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w + 8, y0); ctx.stroke();

    const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    const bars = [44, 68, 54, 86, 74, 94];
    const trend = [36, 56, 62, 78, 84, 96];
    const step = w / labels.length;

    ctx.setLayer('BARS');
    for (let i = 0; i < labels.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const bh = (bars[i] / 100) * h;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cx - 14, y0 - bh, 28, bh);
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 14, y0 - bh, 28, bh);
      ctx.fillStyle = '#0f172a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, y0 + 8);
    }

    ctx.setLayer('TREND');
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < trend.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const cy = y0 - (trend[i] / 100) * h;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  function runCanvasTab(sceneName) {
    canvasScene = sceneName;
    currentBaseName = `vecbridge-canvas-${sceneName}`;
    document.querySelectorAll('.cscene-btn').forEach((btn) => {
      const on = btn.dataset.cscene === sceneName;
      btn.className = `cscene-btn px-2.5 py-1 text-xs rounded-lg transition-colors ${
        on ? 'font-semibold bg-blue-600 text-white' : 'font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
      }`;
    });
    canvasRecorder = createFreshRecorder();
    if (sceneName === 'geo') drawCanvasGeo(canvasRecorder);
    else if (sceneName === 'chart') drawCanvasChart(canvasRecorder);
    else {
      canvasRecorder.clearRect(0, 0, 520, 360);
      canvasRecorder.fillStyle = '#ffffff';
      canvasRecorder.fillRect(0, 0, 520, 360);
    }
    updateDocument(canvasRecorder.toDocument(), true);
  }

  document.querySelectorAll('.cscene-btn').forEach((btn) => {
    btn.addEventListener('click', () => runCanvasTab(btn.dataset.cscene));
  });
  canvasWidthMm.addEventListener('change', () => runCanvasTab(canvasScene));
  canvasFillMode.addEventListener('change', () => runCanvasTab(canvasScene));

  // 手绘叠画
  let drawing = false;
  let lastPt = null;
  let strokePts = [];
  const canvasPt = (e) => {
    const r = drawCanvas.getBoundingClientRect();
    return [((e.clientX - r.left) * drawCanvas.width) / r.width, ((e.clientY - r.top) * drawCanvas.height) / r.height];
  };
  drawCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !canvasRecorder) return;
    drawing = true;
    lastPt = canvasPt(e);
    strokePts = [lastPt];
  });
  window.addEventListener('mousemove', (e) => {
    if (!drawing || !lastPt) return;
    const pt = canvasPt(e);
    if (Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]) < 3) return;
    realCtx.save();
    realCtx.strokeStyle = brushColor.value;
    realCtx.lineWidth = 2;
    realCtx.lineCap = 'round';
    realCtx.beginPath();
    realCtx.moveTo(lastPt[0], lastPt[1]);
    realCtx.lineTo(pt[0], pt[1]);
    realCtx.stroke();
    realCtx.restore();
    strokePts.push(pt);
    lastPt = pt;
  });
  window.addEventListener('mouseup', () => {
    if (!drawing || !canvasRecorder) return;
    drawing = false;
    if (strokePts.length >= 2) {
      canvasRecorder.save();
      canvasRecorder.setLayer('FREEHAND');
      canvasRecorder.strokeStyle = brushColor.value;
      canvasRecorder.lineWidth = 2;
      canvasRecorder.beginPath();
      canvasRecorder.moveTo(strokePts[0][0], strokePts[0][1]);
      for (let i = 1; i < strokePts.length; i++) {
        canvasRecorder.lineTo(strokePts[i][0], strokePts[i][1]);
      }
      canvasRecorder.stroke();
      canvasRecorder.restore();
      updateDocument(canvasRecorder.toDocument(), false);
    }
    lastPt = null;
    strokePts = [];
  });

  /* ================= 通用交互与导出 ================= */
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.view));
  });

  previewThemeBtn.addEventListener('click', () => {
    previewTheme = previewTheme === 'light' ? 'dark' : 'light';
    previewThemeBtn.textContent = previewTheme === 'light' ? '浅色打印底' : '深色 CAD 底';
    preview.setTheme(resolvePreviewTheme());
  });

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    if (activeTab === 'dom' && viewMode === 'visual' && currentVisualSvg) {
      downloadBytes(currentVisualSvg, {
        filename: `${currentBaseName}-visual.svg`,
        mimeType: 'image/svg+xml;charset=utf-8',
        revokeDelayMs: 1500,
      });
      return;
    }
    if (!currentDoc) return;
    downloadSvg(currentDoc, {
      filename: `${currentBaseName}-${previewTheme}.svg`,
      theme: resolvePreviewTheme(),
      mode: 'export',
      revokeDelayMs: 1500,
    });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxfFile(currentDoc, currentBaseName, {
      encoding: globalEncoding.value,
      font: globalFont.value,
    });
  });

  // 初始化默认进入 DXF 预览标签并加载内置示例
  dxfText.value = SAMPLE_DXF;
  switchTab('dxf');

  window.__playground = {
    switchTab,
    setViewMode,
    preview,
    get doc() { return currentDoc; },
  };
})();

```

## examples\js\svg-to-dxf.js
```js
/* SVG → DXF 实时转换 —— 页面逻辑 */
(() => {
  const {
    samples,
    createPreview,
    bindThemeToggle,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
    bindDropZone,
    bindDebounced,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const { parseSvgToDocument } = window.VecBridge;

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const svgInput = document.getElementById('svgInput');
  const yAxisSelect = document.getElementById('yAxisSelect');
  const tolInput = document.getElementById('tolInput');
  const layerBySelect = document.getElementById('layerBySelect');
  const fillModeSelect = document.getElementById('fillModeSelect');
  const ignoreBgCheck = document.getElementById('ignoreBgCheck');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const statsBox = document.getElementById('statsBox');
  const statsPill = document.getElementById('statsPill');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');
  const viewSeg = document.getElementById('viewSeg');

  let currentDoc = null;
  let currentBaseName = 'svg-sample';
  let viewMode = 'both';

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? svgPane : canvasPane),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');

  function applyView(mode) {
    viewMode = mode;
    setSegmented(viewSeg, mode);
    canvasPane.classList.toggle('hidden', mode === 'svg');
    svgPane.classList.toggle('hidden', mode === 'canvas');
    if (currentDoc) requestAnimationFrame(() => preview.fit());
  }

  /* ---------------- 转换 ---------------- */
  function convert(autoFit = true) {
    const svgText = svgInput.value.trim();
    if (!svgText) {
      currentDoc = null;
      preview.setDocument(null);
      statsBox.textContent = '等待输入 SVG…';
      statsPill.textContent = '空文档';
      return;
    }

    try {
      const doc = parseSvgToDocument(svgText, {
        yAxis: yAxisSelect.value,
        curveTolerance: parseFloat(tolInput.value) || 0.1,
        layerBy: layerBySelect.value,
        fillMode: fillModeSelect.value,
        ignoreBackground: ignoreBgCheck.checked,
      });
      currentDoc = doc;
      preview.setDocument(doc, { fit: autoFit });

      const ext = doc.extents;
      const counts = { line: 0, circle: 0, polyline: 0, text: 0, solid: 0 };
      for (const cmd of doc.commands) counts[cmd.type] += 1;

      statsBox.innerHTML =
        `图幅：<strong>${(ext.maxX - ext.minX).toFixed(2)} × ${(ext.maxY - ext.minY).toFixed(2)} mm</strong><br>` +
        `图层：<strong>${doc.layers.length + 1}</strong>（含 0 层） · 图元：<strong>${doc.commands.length}</strong><br>` +
        `LINE ${counts.line} · CIRCLE ${counts.circle} · POLYLINE ${counts.polyline} · SOLID ${counts.solid} · TEXT ${counts.text}`;

      renderStats(statsPill, currentDoc, { digits: 1 });
    } catch (err) {
      currentDoc = null;
      preview.setDocument(null);
      statsBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      statsPill.textContent = '空文档';
    }
  }

  async function loadFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'svg-converted';
    svgInput.value = await file.text();
    convert(true);
  }

  /* ---------------- 事件 ---------------- */
  bindDropZone(dropZone, fileInput, loadFile, ['border-teal-400', 'bg-teal-50']);
  bindSegmented(viewSeg, applyView);
  bindDebounced(svgInput, () => convert(true), 200);

  for (const el of [yAxisSelect, tolInput, layerBySelect, fillModeSelect, ignoreBgCheck]) {
    el.addEventListener('change', () => convert(true));
  }

  document.getElementById('sampleBtn').addEventListener('click', () => {
    currentBaseName = 'svg-sample';
    svgInput.value = samples.svg;
    convert(true);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    currentBaseName = 'svg-converted';
    svgInput.value = '';
    convert(true);
  });

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, currentBaseName, { themeMode: theme.mode, mode: 'export' });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxf(currentDoc, currentBaseName, {
      encoding: encodingSelect.value,
      font: fontSelect.value,
    });
  });

  /* ---------------- 初始化 ---------------- */
  svgInput.value = samples.svg;
  applyView('both');
  convert(true);

  window.__svgDemo = {
    get doc() { return currentDoc; },
    preview,
    convert,
    applyView,
  };
})();

```

## examples\browser-demo.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VecBridge · API 绘图与多编码导出示例</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="./assets/tailwind-theme.js"></script>
<link rel="stylesheet" href="./assets/demo.css" />
</head>
<body class="bg-slate-50 text-slate-800 antialiased flex flex-col h-screen overflow-hidden">

  <!-- 顶部导航 -->
  <header class="bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-20">
    <a href="./playground.html" class="flex items-center gap-2.5 mr-1 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
        VB
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900 text-sm tracking-tight">VecBridge</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/70">API 示例</span>
        </div>
        <p class="text-[11px] text-slate-500">DrawingDocument 纯 API 绘图 · 双引擎 1:1 同步 · 多编码导出</p>
      </div>
    </a>

    <nav class="vb-seg hidden lg:inline-flex" aria-label="示例导航">
      <a href="./playground.html" class="vb-seg-btn">工作台</a>
      <a href="./dxf-preview.html" class="vb-seg-btn">DXF 预览</a>
      <a href="./svg-to-dxf.html" class="vb-seg-btn">SVG → DXF</a>
      <a href="./dom-to-dxf.html" class="vb-seg-btn">DOM → 矢量</a>
      <a href="./canvas-record.html" class="vb-seg-btn">Canvas 录制</a>
      <a href="./browser-demo.html" class="vb-seg-btn is-active">API 示例</a>
      <a href="../docs/api.html" class="vb-seg-btn">API 文档</a>
    </nav>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <span class="text-[11px] text-slate-500">DXF</span>
        <select id="encodingSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF 字节编码（AutoCAD/中望/浩辰推荐 GBK）">
          <option value="gbk" selected>GBK · ANSI_936</option>
          <option value="utf8">UTF-8</option>
        </select>
        <span class="text-slate-300">|</span>
        <select id="fontSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF STYLE 字体配方">
          <option value="gbcbig" selected>txt + gbcbig</option>
          <option value="gbenor">gbenor + gbcbig</option>
          <option value="gbeitc">gbeitc + gbcbig</option>
          <option value="hztxt">txt + hztxt</option>
          <option value="hzfs">txt + hzfs</option>
          <option value="romans">romans + gbcbig</option>
          <option value="tssd">tssdeng + tssdchn</option>
          <option value="simsun">simsun.ttf</option>
        </select>
      </div>
      <button id="exportSvgBtn" class="vb-btn vb-btn-teal">导出 SVG</button>
      <button id="exportBatchBtn" class="vb-btn">批量 16 份</button>
      <button id="exportBtn" class="vb-btn vb-btn-primary">导出 DXF</button>
    </div>
  </header>

  <!-- 主工作区 -->
  <div class="flex-1 flex min-h-0 overflow-hidden">

    <!-- 左侧：图纸构成与导出信息 -->
    <aside class="w-[300px] xl:w-[320px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
      <div class="flex-1 overflow-y-auto vb-scroll p-4 space-y-3.5">

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">当前导出文件名</div>
          <code id="filenamePreview" class="block font-mono text-[11px] text-blue-700 bg-white border border-slate-200 rounded-lg px-2.5 py-2 truncate">—</code>
          <p class="text-[11px] text-slate-500 leading-relaxed">文件名自动拼入编码与字体，多次导出也能分清版本。</p>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">内置图层</div>
          <ul class="space-y-1.5 text-[11px] text-slate-600">
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-slate-500"></span><span class="font-mono">FRAME_OUTER</span><span class="ml-auto text-slate-400">ACI 8</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-slate-900"></span><span class="font-mono">FRAME_BORDER</span><span class="ml-auto text-slate-400">ACI 7</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-slate-900"></span><span class="font-mono">TABLE_LINE</span><span class="ml-auto text-slate-400">ACI 7</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400"></span><span class="font-mono">GRID_DASH</span><span class="ml-auto text-slate-400">DASHED</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-slate-400"></span><span class="font-mono">HATCH_PAT</span><span class="ml-auto text-slate-400">ACI 8</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-rose-600"></span><span class="font-mono">CURVE_A</span><span class="ml-auto text-slate-400">ACI 1</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-blue-600"></span><span class="font-mono">CURVE_B</span><span class="ml-auto text-slate-400">ACI 5</span></li>
            <li class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-sm bg-slate-900"></span><span class="font-mono">TEXT_*</span><span class="ml-auto text-slate-400">ACI 7</span></li>
          </ul>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">演示内容</div>
          <ul class="text-[11px] text-slate-600 space-y-1.5 leading-relaxed">
            <li class="flex gap-2"><span class="text-slate-400">01</span>A4 图框与双线标题栏</li>
            <li class="flex gap-2"><span class="text-slate-400">02</span>10mm 虚线参考网格</li>
            <li class="flex gap-2"><span class="text-slate-400">03</span>diagonal / dots / crosshatch 三种填充</li>
            <li class="flex gap-2"><span class="text-slate-400">04</span>两条正弦采样曲线</li>
            <li class="flex gap-2"><span class="text-slate-400">05</span>R18 圆与尺寸标注</li>
          </ul>
        </div>

        <div class="rounded-xl border border-blue-200/70 bg-blue-50/60 p-3">
          <div class="text-[11px] font-bold uppercase tracking-wider text-blue-600/80">导出矩阵</div>
          <p class="text-[11px] text-blue-900/80 leading-relaxed mt-1.5">
            批量导出 = 2 种编码（GBK / UTF-8）× 8 种 SHX 字体配方，共 16 份 DXF，文件名带时间戳。
          </p>
        </div>
      </div>
    </aside>

    <!-- 右侧：双引擎预览 -->
    <main class="flex-1 min-w-0 flex flex-col bg-slate-100/60">
      <div class="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center gap-2 flex-wrap shrink-0">
        <div class="flex items-center gap-1.5 text-xs text-slate-500">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          <span class="font-medium text-slate-700">双屏 1:1 同步</span>
          <span class="text-slate-400">Canvas / SVG 同源渲染</span>
        </div>
        <button id="themeBtn" class="vb-btn">浅色打印底</button>
        <button id="fitBtn" class="vb-btn">适配窗口</button>
        <div class="flex-1"></div>
        <div id="statsPill" class="text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 font-mono">
          就绪
        </div>
      </div>

      <div class="flex-1 min-h-0 flex relative">
        <div id="canvasPane" class="flex-1 min-w-0 relative">
          <span class="vb-badge vb-badge-blue">Canvas 光栅引擎</span>
          <canvas id="previewCanvas" class="vb-canvas"></canvas>
          <span class="vb-hint">滚轮缩放 · 左键拖拽（双屏 1:1 同步）</span>
        </div>
        <div id="svgPane" class="flex-1 min-w-0 relative border-l border-slate-200">
          <span class="vb-badge vb-badge-teal">SVG 纯矢量引擎</span>
          <div id="previewSvg" class="vb-svg-host"></div>
        </div>
      </div>
    </main>
  </div>

  <script src="../dist/vecbridge.global.js"></script>
  <script src="./assets/demo-core.js"></script>
  <script src="./js/browser-demo.js"></script>
</body>
</html>

```

## examples\canvas-record.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VecBridge · Canvas 2D API 矢量录制器</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="./assets/tailwind-theme.js"></script>
<link rel="stylesheet" href="./assets/demo.css" />
</head>
<body class="bg-slate-50 text-slate-800 antialiased flex flex-col h-screen overflow-hidden">

  <!-- 顶部导航 -->
  <header class="bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-20">
    <a href="./playground.html" class="flex items-center gap-2.5 mr-1 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
        VB
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900 text-sm tracking-tight">VecBridge</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200/70">Canvas 录制</span>
        </div>
        <p class="text-[11px] text-slate-500">recordCanvasContext 拦截标准 2D 指令 · 所绘即所导</p>
      </div>
    </a>

    <nav class="vb-seg hidden lg:inline-flex" aria-label="示例导航">
      <a href="./playground.html" class="vb-seg-btn">工作台</a>
      <a href="./dxf-preview.html" class="vb-seg-btn">DXF 预览</a>
      <a href="./svg-to-dxf.html" class="vb-seg-btn">SVG → DXF</a>
      <a href="./dom-to-dxf.html" class="vb-seg-btn">DOM → 矢量</a>
      <a href="./canvas-record.html" class="vb-seg-btn is-active">Canvas 录制</a>
      <a href="./browser-demo.html" class="vb-seg-btn">API 示例</a>
      <a href="../docs/api.html" class="vb-seg-btn">API 文档</a>
    </nav>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <span class="text-[11px] text-slate-500">DXF</span>
        <select id="encodingSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF 字节编码">
          <option value="gbk" selected>GBK · ANSI_936</option>
          <option value="utf8">UTF-8</option>
        </select>
        <span class="text-slate-300">|</span>
        <select id="fontSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF STYLE 字体配方">
          <option value="gbenor" selected>gbenor + gbcbig</option>
          <option value="gbcbig">txt + gbcbig</option>
          <option value="gbeitc">gbeitc + gbcbig</option>
          <option value="hztxt">txt + hztxt</option>
          <option value="hzfs">txt + hzfs</option>
          <option value="romans">romans + gbcbig</option>
          <option value="tssd">tssdeng + tssdchn</option>
          <option value="simsun">simsun.ttf</option>
        </select>
      </div>
      <button id="exportSvgBtn" class="vb-btn vb-btn-teal">导出 SVG</button>
      <button id="exportDxfBtn" class="vb-btn vb-btn-primary">导出 DXF</button>
    </div>
  </header>

  <!-- 主工作区 -->
  <div class="flex-1 flex min-h-0 overflow-hidden">

    <!-- 左侧：真实 Canvas 绘制区 -->
    <aside class="w-[460px] xl:w-[500px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
      <div class="p-3 border-b border-slate-200 bg-slate-50 space-y-2.5 shrink-0">
        <div id="sceneSeg" class="vb-seg">
          <button data-seg="geo" class="vb-seg-btn vb-seg-btn-solid is-active">示例 1 · 几何与曲线</button>
          <button data-seg="chart" class="vb-seg-btn vb-seg-btn-solid">示例 2 · 柱状折线</button>
          <button data-seg="blank" class="vb-seg-btn vb-seg-btn-solid">清空自由手绘</button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <label class="space-y-1 col-span-2">
            <span class="text-[11px] text-slate-500 block">输出图幅</span>
            <select id="widthSelect" class="vb-select">
              <option value="297" selected>适配 A4 横版 (297mm)</option>
              <option value="210">适配 A4 竖版 (210mm)</option>
              <option value="0">原始 96DPI 物理尺寸</option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="text-[11px] text-slate-500 block">填充模式</span>
            <select id="fillModeSelect" class="vb-select">
              <option value="solid" selected>SOLID 实心</option>
              <option value="outline">闭合轮廓线</option>
              <option value="ignore">仅保留描边</option>
            </select>
          </label>
          <label class="space-y-1">
            <span class="text-[11px] text-slate-500 block">手绘画笔</span>
            <select id="brushColorSelect" class="vb-select">
              <option value="#d92121" selected>红色 (ACI 1)</option>
              <option value="#0f5acc">蓝色 (ACI 5)</option>
              <option value="#168f33">绿色 (ACI 3)</option>
              <option value="#111827">黑色 (ACI 7)</option>
            </select>
          </label>
        </div>
      </div>

      <div class="flex-1 overflow-auto vb-scroll p-4 bg-slate-100/70 flex items-center justify-center">
        <canvas id="drawCanvas" width="640" height="440" class="bg-white rounded-xl border border-slate-200 shadow-sm max-w-full h-auto cursor-crosshair"></canvas>
      </div>

      <div class="border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500 leading-relaxed shrink-0">
        由 <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">recordCanvasContext(realCtx)</code>
        实时双写录制 · 可按住鼠标左键直接在画布上叠加手绘矢量线
      </div>
    </aside>

    <!-- 右侧：录制结果双引擎预览 -->
    <main class="flex-1 min-w-0 flex flex-col bg-slate-100/60">
      <div class="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center gap-2 flex-wrap shrink-0">
        <div id="viewSeg" class="vb-seg">
          <button data-seg="both" class="vb-seg-btn is-active">双屏对比</button>
          <button data-seg="canvas" class="vb-seg-btn">仅 Canvas</button>
          <button data-seg="svg" class="vb-seg-btn">仅 SVG</button>
        </div>
        <button id="themeBtn" class="vb-btn">浅色打印底</button>
        <button id="fitBtn" class="vb-btn">适配窗口</button>
        <div class="flex-1"></div>
        <div id="statsPill" class="text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 font-mono">
          就绪
        </div>
      </div>

      <div class="flex-1 min-h-0 flex relative">
        <div id="canvasPane" class="flex-1 min-w-0 relative">
          <span class="vb-badge vb-badge-blue">Canvas 录制预览</span>
          <canvas id="previewCanvas" class="vb-canvas"></canvas>
          <span class="vb-hint">滚轮缩放 · 左键拖拽（双屏 1:1 同步）</span>
        </div>
        <div id="svgPane" class="flex-1 min-w-0 relative border-l border-slate-200">
          <span class="vb-badge vb-badge-teal">SVG 同源核对</span>
          <div id="previewSvg" class="vb-svg-host"></div>
        </div>
      </div>
    </main>
  </div>

  <script src="../dist/vecbridge.global.js"></script>
  <script src="./assets/demo-core.js"></script>
  <script src="./js/canvas-record.js"></script>
</body>
</html>

```

## examples\dom-to-dxf.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VecBridge · HTML DOM → SVG / DXF 实时转换器</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="./assets/tailwind-theme.js"></script>
<link rel="stylesheet" href="./assets/demo.css" />
</head>
<body class="bg-slate-50 text-slate-800 antialiased flex flex-col h-screen overflow-hidden">

  <!-- 顶部导航 -->
  <header class="bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-20">
    <a href="./playground.html" class="flex items-center gap-2.5 mr-1 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
        VB
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900 text-sm tracking-tight">VecBridge</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/70">DOM → 矢量</span>
        </div>
        <p class="text-[11px] text-slate-500">读取浏览器真实布局 · 表格去重边 / 表单 / 换行文字 / 内嵌 SVG</p>
      </div>
    </a>

    <nav class="vb-seg hidden lg:inline-flex" aria-label="示例导航">
      <a href="./playground.html" class="vb-seg-btn">工作台</a>
      <a href="./dxf-preview.html" class="vb-seg-btn">DXF 预览</a>
      <a href="./svg-to-dxf.html" class="vb-seg-btn">SVG → DXF</a>
      <a href="./dom-to-dxf.html" class="vb-seg-btn is-active">DOM → 矢量</a>
      <a href="./canvas-record.html" class="vb-seg-btn">Canvas 录制</a>
      <a href="./browser-demo.html" class="vb-seg-btn">API 示例</a>
      <a href="../docs/api.html" class="vb-seg-btn">API 文档</a>
    </nav>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <span class="text-[11px] text-slate-500">DXF</span>
        <select id="encodingSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF 字节编码（AutoCAD/中望/浩辰推荐 GBK）">
          <option value="gbk" selected>GBK · ANSI_936</option>
          <option value="utf8">UTF-8</option>
        </select>
        <span class="text-slate-300">|</span>
        <select id="fontSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF STYLE 字体配方">
          <option value="gbenor" selected>gbenor + gbcbig</option>
          <option value="gbcbig">txt + gbcbig</option>
          <option value="gbeitc">gbeitc + gbcbig</option>
          <option value="hztxt">txt + hztxt</option>
          <option value="hzfs">txt + hzfs</option>
          <option value="romans">romans + gbcbig</option>
          <option value="tssd">tssdeng + tssdchn</option>
          <option value="simsun">simsun.ttf</option>
        </select>
      </div>
      <button id="exportVisualSvgBtn" class="vb-btn vb-btn-teal">导出高保真 SVG</button>
      <button id="exportCadSvgBtn" class="vb-btn">导出 CAD SVG</button>
      <button id="exportDxfBtn" class="vb-btn vb-btn-primary">导出 DXF</button>
    </div>
  </header>

  <!-- 主工作区 -->
  <div class="flex-1 flex min-h-0 overflow-hidden">

    <!-- 左侧：待转换的真实 DOM 技术规格单 -->
    <aside class="w-1/2 min-w-[380px] max-w-[760px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
      <div class="p-3 border-b border-slate-200 bg-slate-50 space-y-2 shrink-0">
        <div class="flex items-center justify-between gap-2">
          <span class="text-xs font-semibold text-slate-700">真实 HTML 布局提取（可直接编辑下方文字 / 表单）</span>
          <button id="refreshBtn" class="vb-btn vb-btn-primary px-2.5 py-1">刷新提取</button>
        </div>
        <div class="grid grid-cols-2 xl:grid-cols-4 gap-2">
          <select id="widthSelect" class="vb-select" title="输出图幅">
            <option value="297" selected>A4 横版 297mm</option>
            <option value="210">A4 竖版 210mm</option>
            <option value="0">原始 96DPI</option>
          </select>
          <select id="bgModeSelect" class="vb-select" title="背景色处理">
            <option value="ignore" selected>背景：纯线稿</option>
            <option value="solid">背景：SOLID 实心</option>
            <option value="outline">背景：轮廓线</option>
            <option value="hatch">背景：斜线填充</option>
          </select>
          <select id="layerBySelect" class="vb-select" title="图层策略">
            <option value="semantic" selected>按语义 + data-dxf-layer</option>
            <option value="id">按元素 id / data-layer</option>
            <option value="color">按 ACI 颜色分层</option>
            <option value="single">合并到单图层 0</option>
          </select>
          <label class="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer select-none">
            <input id="dedupeCheck" type="checkbox" checked class="vb-check" />
            合并表格重边
          </label>
        </div>
      </div>

      <div class="flex-1 overflow-auto vb-scroll p-5 bg-slate-100/80">
        <div id="sourceSheet" class="vb-sheet mx-auto shadow-sm">
          <div class="vb-bind" data-dxf-layer="BINDING">装订线</div>
          <div class="vb-ignore" data-dxf-ignore>
            标注了 <code>data-dxf-ignore</code> 的提示条会自动跳过导出；修改下方表格或表单后点「刷新提取」。
          </div>

          <div class="vb-head" data-dxf-layer="TITLE_BLOCK">
            <div>
              <div class="vb-title" contenteditable="true">模块化机械组件规格与交付清单</div>
              <div class="vb-sub">VecBridge DOM 实时提取 · 表格重边合并 + Range 自动换行 + 内嵌 SVG</div>
            </div>
            <div class="vb-pill">检验通过</div>
          </div>

          <table data-dxf-layer="META_TABLE">
            <colgroup>
              <col style="width: 16%" /><col style="width: 34%" />
              <col style="width: 16%" /><col style="width: 34%" />
            </colgroup>
            <tr>
              <th>产品型号</th>
              <td><input class="vb-input" type="text" value="VB-200 精密伺服滑台模组" /></td>
              <th>文档编号</th>
              <td><input class="vb-input" type="text" value="SPEC-2026-088" /></td>
            </tr>
            <tr>
              <th>交付阶段</th>
              <td>
                <select class="vb-input">
                  <option>工程样机 (EVT)</option>
                  <option selected>量产交付 (MP)</option>
                  <option>定制方案 (OEM)</option>
                </select>
              </td>
              <th>签发日期</th>
              <td style="text-align:center;">2026.11.24</td>
            </tr>
          </table>

          <table data-dxf-layer="DATA_TABLE">
            <thead>
              <tr>
                <th style="width: 10%">序号</th>
                <th style="width: 28%">部件名称</th>
                <th style="width: 16%">标称 (mm)</th>
                <th style="width: 15%">公差</th>
                <th style="width: 16%">实测均值</th>
                <th style="width: 15%">工艺</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align:center;">01</td>
                <td>铝合金底座框架</td>
                <td style="text-align:right;">240.00</td>
                <td style="text-align:right;">±0.05</td>
                <td style="text-align:right; color:#0f5acc; font-weight:700;">240.01</td>
                <td style="text-align:center;">阳极氧化</td>
              </tr>
              <tr>
                <td style="text-align:center;">02</td>
                <td>精密线性导轨副</td>
                <td style="text-align:right;">180.00</td>
                <td style="text-align:right;">±0.02</td>
                <td style="text-align:right; color:#0f5acc; font-weight:700;">180.00</td>
                <td style="text-align:center;">高频淬火</td>
              </tr>
              <tr>
                <td style="text-align:center;">03</td>
                <td>滚珠丝杠驱动轴</td>
                <td style="text-align:right;">16.00</td>
                <td style="text-align:right;">±0.01</td>
                <td style="text-align:right; color:#d92121; font-weight:700;">16.008</td>
                <td style="text-align:center;">精密研磨</td>
              </tr>
            </tbody>
          </table>

          <div class="vb-card-row">
            <div class="vb-box" data-dxf-layer="EMBED_CHART">
              <div style="font-weight:700; font-size:11.5px; margin-bottom:4px;">内嵌 SVG 响应效率曲线</div>
              <svg viewBox="0 0 320 104" style="width:100%; height:104px; display:block;">
                <line x1="30" y1="10" x2="30" y2="86" stroke="#111827" stroke-width="1.2" />
                <line x1="30" y1="86" x2="306" y2="86" stroke="#111827" stroke-width="1.2" />
                <line x1="30" y1="36" x2="306" y2="36" stroke="#6b7280" stroke-width="0.8" stroke-dasharray="4,3" />
                <line x1="30" y1="62" x2="306" y2="62" stroke="#6b7280" stroke-width="0.8" stroke-dasharray="4,3" />
                <path d="M 30 78 C 100 72, 180 34, 298 18" fill="none" stroke="#d92121" stroke-width="2" />
                <circle cx="122" cy="59" r="3.2" fill="none" stroke="#0f5acc" stroke-width="1.5" />
                <circle cx="210" cy="34" r="3.2" fill="none" stroke="#0f5acc" stroke-width="1.5" />
                <circle cx="298" cy="18" r="3.2" fill="none" stroke="#0f5acc" stroke-width="1.5" />
                <text x="168" y="100" font-size="9.5" fill="#111827" text-anchor="middle">输入转速 (rpm)</text>
              </svg>
            </div>

            <div class="vb-check-box" data-dxf-layer="CHECK_ITEMS">
              <div style="font-weight:700; font-size:11.5px;">出厂复核项</div>
              <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="checkbox" checked /> 尺寸三坐标全检</label>
              <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="checkbox" checked /> 满载运行测试</label>
              <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="checkbox" /> 选配防尘护罩</label>
              <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="radio" name="pg_grade" checked /> 标准 A 级出厂</label>
            </div>
          </div>

          <div class="vb-card-row" data-dxf-layer="NOTES">
            <div class="vb-box" style="background:#ffffff;">
              <strong>装配步骤（有序列表）</strong>
              <ol>
                <li>清洁基准安装面并校验平行度</li>
                <li>按对角顺序分两次锁紧螺栓</li>
              </ol>
            </div>
            <div class="vb-box" style="background:#ffffff;">
              <strong>交付物清单（无序列表）</strong>
              <ul>
                <li>检测报告矢量图（.SVG）</li>
                <li style="list-style-type: square; color:#ea580c;">二维接口 CAD 图纸（.DXF）</li>
              </ul>
            </div>
          </div>

          <hr />
          <div class="vb-note" contenteditable="true" data-dxf-layer="NOTES">
            备注：本段较长中文说明用于验证浏览器原生 Range 自动换行算法——每一视觉行都会独立映射为对齐精确的 CAD TEXT 实体，导出 AutoCAD 后排版依然整洁不重叠。
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧：CAD 双引擎 / 高保真 SVG -->
    <main class="flex-1 min-w-0 flex flex-col bg-slate-100/60">
      <div class="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center gap-2 flex-wrap shrink-0">
        <div id="viewSeg" class="vb-seg">
          <button data-seg="cad" class="vb-seg-btn is-active">CAD 双引擎预览</button>
          <button data-seg="visual" class="vb-seg-btn">高保真矢量 SVG</button>
        </div>
        <button id="themeBtn" class="vb-btn">浅色打印底</button>
        <button id="fitBtn" class="vb-btn">适配窗口</button>
        <div class="flex-1"></div>
        <div id="statsPill" class="text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 font-mono">
          就绪
        </div>
      </div>

      <div class="flex-1 min-h-0 relative">
        <div id="cadHost" class="absolute inset-0 flex">
          <div id="canvasPane" class="flex-1 min-w-0 relative">
            <span class="vb-badge vb-badge-blue">Canvas CAD 预览</span>
            <canvas id="previewCanvas" class="vb-canvas"></canvas>
            <span class="vb-hint">滚轮缩放 · 左键拖拽（双屏 1:1 同步）</span>
          </div>
          <div id="svgPane" class="flex-1 min-w-0 relative border-l border-slate-200">
            <span class="vb-badge vb-badge-teal">SVG CAD 同源核对</span>
            <div id="previewSvg" class="vb-svg-host"></div>
          </div>
        </div>

        <div id="visualHost" class="hidden flex vb-visual-host absolute inset-0 p-6 bg-slate-100 items-start justify-center"></div>
      </div>
    </main>
  </div>

  <script src="../dist/vecbridge.global.js"></script>
  <script src="./assets/demo-core.js"></script>
  <script src="./js/dom-to-dxf.js"></script>
</body>
</html>

```

## examples\dxf-preview.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VecBridge · DXF 上传预览与 SVG 导出</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="./assets/tailwind-theme.js"></script>
<link rel="stylesheet" href="./assets/demo.css" />
</head>
<body class="bg-slate-50 text-slate-800 antialiased flex flex-col h-screen overflow-hidden">

  <!-- 顶部导航 -->
  <header class="bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-20">
    <a href="./playground.html" class="flex items-center gap-2.5 mr-1 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
        VB
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900 text-sm tracking-tight">VecBridge</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">DXF 预览</span>
        </div>
        <p class="text-[11px] text-slate-500">上传 / 粘贴 ASCII DXF · 自动识别编码 · 双引擎同步</p>
      </div>
    </a>

    <nav class="vb-seg hidden lg:inline-flex" aria-label="示例导航">
      <a href="./playground.html" class="vb-seg-btn">工作台</a>
      <a href="./dxf-preview.html" class="vb-seg-btn is-active">DXF 预览</a>
      <a href="./svg-to-dxf.html" class="vb-seg-btn">SVG → DXF</a>
      <a href="./dom-to-dxf.html" class="vb-seg-btn">DOM → 矢量</a>
      <a href="./canvas-record.html" class="vb-seg-btn">Canvas 录制</a>
      <a href="./browser-demo.html" class="vb-seg-btn">API 示例</a>
      <a href="../docs/api.html" class="vb-seg-btn">API 文档</a>
    </nav>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <span class="text-[11px] text-slate-500">DXF</span>
        <select id="encodingSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF 字节编码（AutoCAD/中望/浩辰推荐 GBK）">
          <option value="gbk" selected>GBK · ANSI_936</option>
          <option value="utf8">UTF-8</option>
        </select>
        <span class="text-slate-300">|</span>
        <select id="fontSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF STYLE 字体配方">
          <option value="gbenor" selected>gbenor + gbcbig</option>
          <option value="gbcbig">txt + gbcbig</option>
          <option value="gbeitc">gbeitc + gbcbig</option>
          <option value="hztxt">txt + hztxt</option>
          <option value="hzfs">txt + hzfs</option>
          <option value="romans">romans + gbcbig</option>
          <option value="tssd">tssdeng + tssdchn</option>
          <option value="simsun">simsun.ttf</option>
        </select>
      </div>
      <button id="exportSvgBtn" class="vb-btn vb-btn-teal">导出 SVG</button>
      <button id="exportPrintSvgBtn" class="vb-btn">白底 SVG</button>
      <button id="exportDxfBtn" class="vb-btn vb-btn-primary">另存 R12 DXF</button>
    </div>
  </header>

  <!-- 主工作区 -->
  <div class="flex-1 flex min-h-0 overflow-hidden">

    <!-- 左侧：导入与解析参数 -->
    <aside class="w-[380px] xl:w-[420px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
      <div class="flex-1 overflow-y-auto vb-scroll p-4 space-y-3.5">

        <input type="file" id="fileInput" accept=".dxf" class="hidden" />
        <div id="dropZone" class="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-4 text-center cursor-pointer transition-all">
          <div class="text-xs font-semibold text-blue-700">点击选择或拖拽本地 .dxf 文件到此处</div>
          <div class="text-[11px] text-slate-500 mt-1">支持 R12 ~ R2024+ ASCII DXF，以原始字节读取自动识别 GBK / UTF-8</div>
        </div>

        <div class="flex gap-2">
          <button id="sampleBtn" class="vb-btn flex-1">加载内置机械零件示例</button>
          <button id="clearBtn" class="vb-btn">清空</button>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2.5">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">解析参数</div>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="space-y-1">
              <span class="text-xs text-slate-600 block">源文件编码</span>
              <select id="dxfEncoding" class="vb-select">
                <option value="auto" selected>自动检测（推荐）</option>
                <option value="gbk">GBK / ANSI_936</option>
                <option value="utf-8">UTF-8</option>
                <option value="big5">Big5（繁体）</option>
                <option value="shift-jis">Shift-JIS（日文）</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs text-slate-600 block">空间过滤</span>
              <select id="dxfSpace" class="vb-select">
                <option value="model" selected>仅模型空间</option>
                <option value="paper">仅图纸空间</option>
                <option value="all">全部空间</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs text-slate-600 block">曲线容差 (mm)</span>
              <input id="dxfTol" type="number" value="0.1" step="0.05" min="0.01" max="5" class="vb-input" />
            </label>
            <label class="flex items-center gap-2 pt-5 cursor-pointer select-none">
              <input id="dxfHiddenLayers" type="checkbox" class="vb-check" />
              <span class="text-xs text-slate-600 leading-snug">显示隐藏/冻结图层</span>
            </label>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">解析诊断</div>
          <div id="statusBox" class="rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-3 py-2.5 text-xs text-emerald-900 leading-relaxed">
            就绪
          </div>
          <div id="statsBox" class="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed">
            尚未载入图纸
          </div>
          <div id="warningsBox" class="hidden rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-[11px] text-amber-800 whitespace-pre-wrap leading-relaxed"></div>
          <div id="errorBox" class="hidden rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700"></div>
        </div>

        <div class="space-y-1.5">
          <div class="text-xs font-medium text-slate-600">或粘贴 ASCII DXF 源码</div>
          <textarea id="dxfText" spellcheck="false" class="vb-textarea h-40 resize-y" placeholder="粘贴以 0 / SECTION 开头的 ASCII DXF 文本"></textarea>
        </div>
      </div>

      <div class="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 shrink-0">
        支持 LWPOLYLINE 凸度 · BLOCK/INSERT 阵列 · SPLINE · TEXT/MTEXT 转义
      </div>
    </aside>

    <!-- 右侧：双引擎预览 -->
    <main class="flex-1 min-w-0 flex flex-col bg-slate-100/60">
      <div class="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center gap-2 flex-wrap shrink-0">
        <div id="viewSeg" class="vb-seg">
          <button data-seg="both" class="vb-seg-btn is-active">双屏对比</button>
          <button data-seg="canvas" class="vb-seg-btn">仅 Canvas</button>
          <button data-seg="svg" class="vb-seg-btn">仅 SVG</button>
        </div>
        <button id="themeBtn" class="vb-btn">浅色打印底</button>
        <button id="fitBtn" class="vb-btn">适配窗口</button>
        <div class="flex-1"></div>
        <div id="statsPill" class="text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 font-mono">
          就绪
        </div>
      </div>

      <div class="flex-1 min-h-0 flex relative">
        <div id="canvasPane" class="flex-1 min-w-0 relative">
          <span class="vb-badge vb-badge-blue">Canvas 光栅引擎</span>
          <canvas id="previewCanvas" class="vb-canvas"></canvas>
          <span class="vb-hint">滚轮缩放 · 左键拖拽（双屏 1:1 同步）</span>
        </div>
        <div id="svgPane" class="flex-1 min-w-0 relative border-l border-slate-200">
          <span class="vb-badge vb-badge-teal">SVG 纯矢量引擎</span>
          <div id="previewSvg" class="vb-svg-host"></div>
        </div>
      </div>
    </main>
  </div>

  <script src="../dist/vecbridge.global.js"></script>
  <script src="./assets/demo-core.js"></script>
  <script src="./js/dxf-preview.js"></script>
</body>
</html>

```

## examples\node-generate.mjs
```mjs
/**
 * Node 端示例：按指定编码与字体导出 DXF，文件名自动包含所选选项，
 * 避免批量导出后分不清哪份是 GBK、哪份是 UTF-8。
 *
 * 用法：
 *   node examples/node-generate.mjs                     # 默认 gbk + gbcbig
 *   node examples/node-generate.mjs gbk gbenor          # 国标主流组合 gbenor.shx + gbcbig.shx
 *   node examples/node-generate.mjs utf8 simsun ./out   # 指定输出目录
 *   node examples/node-generate.mjs all                 # 导出全部 2 x 8 组合
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DrawingDocument, DxfExporter, drawHatch, textCodec } from '../dist/index.js';
// 发布安装后可直接改为：import { DrawingDocument, DxfExporter, drawHatch, textCodec } from 'vecbridge';

const ENCODINGS = ['gbk', 'utf8'];
const FONTS = ['gbcbig', 'gbenor', 'gbeitc', 'hztxt', 'hzfs', 'romans', 'tssd', 'simsun'];

const args = process.argv.slice(2);
const isAll = args[0] === 'all';
const encodingArg = isAll ? null : (args[0] ?? 'gbk').toLowerCase();
const fontArg = isAll ? null : (args[1] ?? 'gbcbig').toLowerCase();
const outDir = (isAll ? args[1] : args[2]) ?? '.';

function buildDoc() {
  const doc = new DrawingDocument();
  doc.setExtents(0, 0, 297, 210);

  doc.addLayer('FRAME_OUTER', 8, 'CONTINUOUS');
  doc.addLayer('TABLE_LINE', 7, 'CONTINUOUS');
  doc.addLayer('HATCH_PAT', 8, 'CONTINUOUS');
  doc.addLayer('CURVE_A', 1, 'CONTINUOUS');
  doc.addLayer('TEXT_TITLE', 7, 'CONTINUOUS');
  doc.addLayer('TEXT_VALUE', 7, 'CONTINUOUS');

  doc.addRect(0, 0, 297, 210, 'FRAME_OUTER', 8, 0, { paper: true });
  doc.addRect(20, 8, 289, 202, 'TABLE_LINE', 7, 0.5);
  doc.addText(148.5, 193, 4.5, 'vecbridge 示例图纸', 'TEXT_TITLE', 7, 0, 1, 2, 0.9, {
    bold: true,
  });
  doc.addText(24, 30, 2.6, '示例：编码与字体可自由组合', 'TEXT_VALUE', 7, 0, 0, 2, 0.85);
  doc.addText(24, 22, 2.2, '文件名自动附带选项，例：vecbridge-example-gbk-gbcbig.dxf', 'TEXT_VALUE', 7, 0, 0, 2, 0.8);

  drawHatch(doc, 40, 60, 100, 150, 'diagonal', 'HATCH_PAT', 8);
  drawHatch(doc, 110, 60, 170, 150, 'crosshatch', 'HATCH_PAT', 8);
  doc.addText(70, 156, 2.2, 'diagonal', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  doc.addText(140, 156, 2.2, 'crosshatch', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);

  const pts = [];
  for (let i = 0; i <= 60; i++) {
    pts.push([185 + i * 1.6, 108 + Math.sin(i / 6) * 26]);
  }
  doc.addPolyline(pts, 'CURVE_A', 1, false, 0.35);

  return doc;
}

function exportOne(doc, encoding, font) {
  const filename = `vecbridge-example-${encoding}-${font}.dxf`;
  const output = join(outDir, filename);
  const bytes = DxfExporter.toBytes(doc, { encoding, font });
  writeFileSync(output, bytes);
  console.log(`written ${output}  (${encoding}/${font}, ${bytes.length} bytes)`);
}

if (!textCodec.isGbkSupported()) {
  console.warn('warning: this Node build has no GBK decoder; gbk output will be ASCII-escaped.');
}

mkdirSync(outDir, { recursive: true });

if (isAll) {
  textCodec.warmup();
  const doc = buildDoc();
  for (const encoding of ENCODINGS) {
    for (const font of FONTS) exportOne(doc, encoding, font);
  }
} else {
  if (!ENCODINGS.includes(encodingArg)) {
    console.error(
      `unknown encoding "${encodingArg}". Use one of: ${ENCODINGS.join(', ')} (or "all")`
    );
    process.exit(1);
  }
  if (!FONTS.includes(fontArg)) {
    console.error(`unknown font "${fontArg}". Use one of: ${FONTS.join(', ')}`);
    process.exit(1);
  }

  if (encodingArg === 'gbk') textCodec.warmup();
  exportOne(buildDoc(), encodingArg, fontArg);
}

```

## examples\node-svg-to-dxf.mjs
```mjs
/**
 * Node 端示例：读取 SVG 文件并转换为 DXF R12。
 *
 * 用法：
 *   node examples/node-svg-to-dxf.mjs input.svg
 *   node examples/node-svg-to-dxf.mjs input.svg output.dxf gbk gbenor
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { parseSvgToDocument, DxfExporter, textCodec } from '../dist/index.js';

const [inputPath, outputArg, encoding = 'gbk', font = 'gbenor'] = process.argv.slice(2);

if (!inputPath) {
  console.error(
    '用法：node examples/node-svg-to-dxf.mjs <input.svg> [output.dxf] [gbk|utf8] [gbcbig|gbenor|...]'
  );
  process.exit(1);
}

const svgText = readFileSync(inputPath, 'utf8');
const doc = parseSvgToDocument(svgText, {
  yAxis: 'flip-viewbox',
  curveTolerance: 0.1,
  layerBy: 'group-id',
});

if (encoding === 'gbk') textCodec.warmup();

const outputPath =
  outputArg ??
  join(
    dirname(inputPath),
    `${basename(inputPath, extname(inputPath))}-${encoding}-${font}.dxf`
  );

const bytes = DxfExporter.toBytes(doc, { encoding, font });
writeFileSync(outputPath, bytes);

console.log(
  `converted ${inputPath} -> ${outputPath} (${doc.commands.length} entities, ${doc.layers.length + 1} layers, ${bytes.length} bytes)`
);

```

## examples\playground.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VecBridge Playground · 2D 矢量互转与双引擎预览工作台</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="./assets/tailwind-theme.js"></script>
<link rel="stylesheet" href="./assets/demo.css" />
</head>
<body class="bg-slate-50 text-slate-800 antialiased flex flex-col h-screen overflow-hidden">

  <!-- 顶部导航与全局导出栏 -->
  <header class="bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-20">
    <!-- Brand -->
    <div class="flex items-center gap-2.5 mr-2">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
        VB
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900 text-sm tracking-tight">VecBridge</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/70">Playground</span>
        </div>
        <p class="text-[11px] text-slate-500">DXF / SVG / HTML DOM / Canvas 互转与双引擎预览</p>
      </div>
    </div>

    <!-- 模式切换 Tabs -->
    <nav id="modeTabs" class="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
      <button data-tab="dxf" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-semibold transition-all bg-white text-blue-700 shadow-sm">
        DXF 预览 &amp; 转 SVG
      </button>
      <button data-tab="svg" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-600 hover:text-slate-900">
        SVG → DXF
      </button>
      <button data-tab="dom" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-600 hover:text-slate-900">
        HTML DOM → 矢量
      </button>
      <button data-tab="canvas" class="tab-btn px-3 py-1.5 rounded-lg text-xs font-medium transition-all text-slate-600 hover:text-slate-900">
        Canvas 2D 录制
      </button>
    </nav>

    <div class="flex-1"></div>

    <div class="flex items-center gap-1.5">
      <a href="./browser-demo.html" class="vb-btn hidden xl:inline-flex">专题示例</a>
      <a href="../docs/api.html" class="vb-btn">API 文档</a>
    </div>

    <!-- 全局导出参数与操作 -->
    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <span class="text-[11px] text-slate-500">DXF</span>
        <select id="globalEncoding" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF 字节编码（AutoCAD/中望/浩辰推荐使用 GBK）">
          <option value="gbk" selected>GBK (ANSI_936)</option>
          <option value="utf8">UTF-8</option>
        </select>
        <span class="text-slate-300">|</span>
        <select id="globalFont" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF STYLE 字体配方">
          <option value="gbenor" selected>gbenor + gbcbig</option>
          <option value="gbcbig">txt + gbcbig</option>
          <option value="gbeitc">gbeitc + gbcbig</option>
          <option value="hztxt">txt + hztxt</option>
          <option value="hzfs">txt + hzfs</option>
          <option value="romans">romans + gbcbig</option>
          <option value="tssd">tssdeng + tssdchn</option>
          <option value="simsun">simsun.ttf</option>
        </select>
      </div>

      <button id="exportSvgBtn" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition-colors">
        导出 SVG
      </button>
      <button id="exportDxfBtn" class="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors">
        导出 DXF
      </button>
    </div>
  </header>

  <!-- 主工作区：左侧源输入 + 右侧统一双引擎预览 -->
  <div class="flex-1 flex min-h-0 overflow-hidden">

    <!-- 左侧源工作区 -->
    <aside id="leftPanel" class="w-[460px] xl:w-[500px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">

      <!-- ============ TAB 1: DXF 预览 & 转 SVG ============ -->
      <section id="panel-dxf" class="tab-panel flex-1 overflow-y-auto p-4 space-y-3.5">
        <input type="file" id="dxfFileInput" accept=".dxf" class="hidden" />
        <div id="dxfDropZone" class="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/80 rounded-xl p-4 text-center cursor-pointer transition-all">
          <div class="text-xs font-semibold text-blue-700">点击选择或拖拽本地 .dxf 文件到此处</div>
          <div class="text-[11px] text-slate-500 mt-1">支持 R12 ~ R2024+ ASCII DXF，以原始字节读取自动识别 GBK / UTF-8</div>
        </div>

        <div class="flex gap-2">
          <button id="dxfSampleBtn" class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">
            加载内置机械零件示例 DXF
          </button>
          <button id="dxfClearBtn" class="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
            清空
          </button>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2.5">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">解析参数</div>
          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <label class="space-y-1">
              <span class="text-slate-600 block">源文件编码</span>
              <select id="dxfEncoding" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                <option value="auto" selected>自动检测（推荐）</option>
                <option value="gbk">GBK / ANSI_936</option>
                <option value="utf-8">UTF-8</option>
                <option value="big5">Big5（繁体）</option>
                <option value="shift-jis">Shift-JIS（日文）</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-slate-600 block">空间过滤</span>
              <select id="dxfSpace" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                <option value="model" selected>仅模型空间</option>
                <option value="paper">仅图纸空间</option>
                <option value="all">全部空间</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-slate-600 block">曲线细分容差 (mm)</span>
              <input id="dxfTol" type="number" value="0.1" step="0.05" min="0.01" max="5" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
            </label>
            <label class="flex items-center gap-2 pt-5 cursor-pointer select-none">
              <input id="dxfHiddenLayers" type="checkbox" class="rounded border-slate-300 text-blue-600" />
              <span class="text-slate-600">显示隐藏/冻结图层</span>
            </label>
          </div>
        </div>

        <div id="dxfDiagBox" class="rounded-xl bg-emerald-50/70 border border-emerald-200/80 px-3 py-2.5 text-xs text-emerald-900 leading-relaxed">
          就绪
        </div>
        <div id="dxfWarnBox" class="hidden rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 whitespace-pre-wrap"></div>
        <div id="dxfErrBox" class="hidden rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700"></div>

        <div class="space-y-1.5">
          <div class="text-xs font-medium text-slate-600">或粘贴 ASCII DXF 源码</div>
          <textarea id="dxfText" spellcheck="false" class="w-full h-36 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 font-mono text-[11px] text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 resize-y" placeholder="粘贴以 0 / SECTION 开头的 ASCII DXF 文本"></textarea>
        </div>
      </section>

      <!-- ============ TAB 2: SVG → DXF ============ -->
      <section id="panel-svg" class="tab-panel hidden flex-1 overflow-y-auto p-4 space-y-3.5">
        <input type="file" id="svgFileInput" accept=".svg,image/svg+xml" class="hidden" />
        <div id="svgDropZone" class="border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/40 hover:bg-teal-50/80 rounded-xl p-4 text-center cursor-pointer transition-all">
          <div class="text-xs font-semibold text-teal-700">点击选择或拖拽 .svg 文件到此处</div>
          <div class="text-[11px] text-slate-500 mt-1">支持 path 贝塞尔/椭圆弧、圆角矩形、transform 矩阵、&lt;defs&gt;/&lt;use&gt; 与文字</div>
        </div>

        <div class="flex gap-2">
          <button id="svgSampleBtn" class="flex-1 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700">
            加载内置矢量示例 SVG
          </button>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2.5">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">SVG 解析参数</div>
          <div class="grid grid-cols-2 gap-2.5 text-xs">
            <label class="space-y-1">
              <span class="text-slate-600 block">Y 轴翻转模式</span>
              <select id="svgYAxis" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                <option value="flip-viewbox" selected>flip-viewbox（外部推荐）</option>
                <option value="negate">negate（精确往返）</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-slate-600 block">图层归类方式</span>
              <select id="svgLayerBy" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                <option value="group-id" selected>按 &lt;g id&gt; / data-layer</option>
                <option value="color">按 ACI 颜色分层</option>
                <option value="single">合并到单图层 0</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-slate-600 block">纯填充处理</span>
              <select id="svgFillMode" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500">
                <option value="outline" selected>转为闭合轮廓线</option>
                <option value="solid">DXF 实心填充（SOLID）</option>
                <option value="ignore">忽略无描边填充</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-slate-600 block">曲线容差 (mm)</span>
              <input id="svgTol" type="number" value="0.1" step="0.05" min="0.01" max="5" class="w-full rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:border-blue-500" />
            </label>
          </div>
          <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer pt-1">
            <input id="svgIgnoreBg" type="checkbox" checked class="rounded border-slate-300 text-blue-600" />
            自动跳过覆盖全画布的背景矩形
          </label>
        </div>

        <div id="svgErrBox" class="hidden rounded-xl bg-rose-50 border border-rose-200 px-3 py-2 text-xs text-rose-700"></div>

        <div class="space-y-1.5">
          <div class="text-xs font-medium text-slate-600">SVG 源码（可直接编辑实时生效）</div>
          <textarea id="svgText" spellcheck="false" class="w-full h-60 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 font-mono text-[11px] text-slate-700 focus:outline-none focus:bg-white focus:border-blue-500 resize-y"></textarea>
        </div>
      </section>

      <!-- ============ TAB 3: HTML DOM → SVG / DXF ============ -->
      <section id="panel-dom" class="tab-panel hidden flex-1 flex flex-col min-h-0">
        <div class="p-3 border-b border-slate-200 bg-slate-50 space-y-2 shrink-0">
          <div class="flex items-center justify-between gap-2">
            <span class="text-xs font-semibold text-slate-700">真实 HTML 布局提取（可直接编辑下方文字/表单）</span>
            <button id="domRefreshBtn" class="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white">
              刷新提取
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <select id="domWidth" class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
              <option value="297" selected>适配 A4 横版 (297mm)</option>
              <option value="210">适配 A4 竖版 (210mm)</option>
              <option value="0">原始 96DPI 尺寸</option>
            </select>
            <select id="domBgMode" class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
              <option value="ignore" selected>背景：纯线稿</option>
              <option value="solid">背景：SOLID 实心</option>
              <option value="outline">背景：轮廓线</option>
              <option value="hatch">背景：斜线填充</option>
            </select>
            <label class="flex items-center gap-1.5 text-slate-600 cursor-pointer pl-1">
              <input id="domDedupe" type="checkbox" checked class="rounded border-slate-300 text-blue-600" />
              合并表格重边
            </label>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-4 bg-slate-100/80">
          <div id="domSourceSheet" class="vb-sheet mx-auto shadow-sm">
            <div class="vb-bind" data-dxf-layer="BINDING">装订线</div>
            <div class="vb-ignore" data-dxf-ignore>
              标注了 <code>data-dxf-ignore</code> 的提示条会自动跳过导出；修改下方表格或表单后点「刷新提取」。
            </div>

            <div class="vb-head" data-dxf-layer="TITLE_BLOCK">
              <div>
                <div class="vb-title" contenteditable="true">模块化机械组件规格与交付清单</div>
                <div class="vb-sub">VecBridge DOM 实时提取 · 表格重边合并 + Range 自动换行 + 内嵌 SVG</div>
              </div>
              <div class="vb-pill">检验通过</div>
            </div>

            <table data-dxf-layer="META_TABLE">
              <colgroup>
                <col style="width: 16%" /><col style="width: 34%" />
                <col style="width: 16%" /><col style="width: 34%" />
              </colgroup>
              <tr>
                <th>产品型号</th>
                <td><input class="vb-input" type="text" value="VB-200 精密伺服滑台模组" /></td>
                <th>文档编号</th>
                <td><input class="vb-input" type="text" value="SPEC-2026-088" /></td>
              </tr>
              <tr>
                <th>交付阶段</th>
                <td>
                  <select class="vb-input">
                    <option>工程样机 (EVT)</option>
                    <option selected>量产交付 (MP)</option>
                    <option>定制方案 (OEM)</option>
                  </select>
                </td>
                <th>签发日期</th>
                <td style="text-align:center;">2026.11.24</td>
              </tr>
            </table>

            <table data-dxf-layer="DATA_TABLE">
              <thead>
                <tr>
                  <th style="width: 10%">序号</th>
                  <th style="width: 28%">部件名称</th>
                  <th style="width: 16%">标称 (mm)</th>
                  <th style="width: 15%">公差</th>
                  <th style="width: 16%">实测均值</th>
                  <th style="width: 15%">工艺</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="text-align:center;">01</td>
                  <td>铝合金底座框架</td>
                  <td style="text-align:right;">240.00</td>
                  <td style="text-align:right;">±0.05</td>
                  <td style="text-align:right; color:#0f5acc; font-weight:700;">240.01</td>
                  <td style="text-align:center;">阳极氧化</td>
                </tr>
                <tr>
                  <td style="text-align:center;">02</td>
                  <td>精密线性导轨副</td>
                  <td style="text-align:right;">180.00</td>
                  <td style="text-align:right;">±0.02</td>
                  <td style="text-align:right; color:#0f5acc; font-weight:700;">180.00</td>
                  <td style="text-align:center;">高频淬火</td>
                </tr>
                <tr>
                  <td style="text-align:center;">03</td>
                  <td>滚珠丝杠驱动轴</td>
                  <td style="text-align:right;">16.00</td>
                  <td style="text-align:right;">±0.01</td>
                  <td style="text-align:right; color:#d92121; font-weight:700;">16.008</td>
                  <td style="text-align:center;">精密研磨</td>
                </tr>
              </tbody>
            </table>

            <div class="vb-card-row">
              <div class="vb-box" data-dxf-layer="EMBED_CHART">
                <div style="font-weight:700; font-size:11.5px; margin-bottom:4px;">内嵌 SVG 响应效率曲线</div>
                <svg viewBox="0 0 320 104" style="width:100%; height:104px; display:block;">
                  <line x1="30" y1="10" x2="30" y2="86" stroke="#111827" stroke-width="1.2" />
                  <line x1="30" y1="86" x2="306" y2="86" stroke="#111827" stroke-width="1.2" />
                  <line x1="30" y1="36" x2="306" y2="36" stroke="#6b7280" stroke-width="0.8" stroke-dasharray="4,3" />
                  <line x1="30" y1="62" x2="306" y2="62" stroke="#6b7280" stroke-width="0.8" stroke-dasharray="4,3" />
                  <path d="M 30 78 C 100 72, 180 34, 298 18" fill="none" stroke="#d92121" stroke-width="2" />
                  <circle cx="122" cy="59" r="3.2" fill="none" stroke="#0f5acc" stroke-width="1.5" />
                  <circle cx="210" cy="34" r="3.2" fill="none" stroke="#0f5acc" stroke-width="1.5" />
                  <circle cx="298" cy="18" r="3.2" fill="none" stroke="#0f5acc" stroke-width="1.5" />
                  <text x="168" y="100" font-size="9.5" fill="#111827" text-anchor="middle">输入转速 (rpm)</text>
                </svg>
              </div>

              <div class="vb-check-box" data-dxf-layer="CHECK_ITEMS">
                <div style="font-weight:700; font-size:11.5px;">出厂复核项</div>
                <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="checkbox" checked /> 尺寸三坐标全检</label>
                <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="checkbox" checked /> 满载运行测试</label>
                <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="checkbox" /> 选配防尘护罩</label>
                <label style="display:flex; align-items:center; gap:5px; font-size:11.5px;"><input type="radio" name="pg_grade" checked /> 标准 A 级出厂</label>
              </div>
            </div>

            <div class="vb-card-row" data-dxf-layer="NOTES">
              <div class="vb-box" style="background:#ffffff;">
                <strong>装配步骤（有序列表）</strong>
                <ol>
                  <li>清洁基准安装面并校验平行度</li>
                  <li>按对角顺序分两次锁紧螺栓</li>
                </ol>
              </div>
              <div class="vb-box" style="background:#ffffff;">
                <strong>交付物清单（无序列表）</strong>
                <ul>
                  <li>检测报告矢量图（.SVG）</li>
                  <li style="list-style-type: square; color:#ea580c;">二维接口 CAD 图纸（.DXF）</li>
                </ul>
              </div>
            </div>

            <hr />
            <div class="vb-note" contenteditable="true" data-dxf-layer="NOTES">
              备注：本段较长中文说明用于验证浏览器原生 Range 自动换行算法——每一视觉行都会独立映射为对齐精确的 CAD TEXT 实体，导出 AutoCAD 后排版依然整洁不重叠。
            </div>
          </div>
        </div>
      </section>

      <!-- ============ TAB 4: Canvas 2D 矢量录制 ============ -->
      <section id="panel-canvas" class="tab-panel hidden flex-1 flex flex-col min-h-0">
        <div class="p-3 border-b border-slate-200 bg-slate-50 space-y-2.5 shrink-0">
          <div class="flex items-center gap-1.5 flex-wrap">
            <button data-cscene="geo" class="cscene-btn px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-600 text-white">
              几何与贝塞尔曲线
            </button>
            <button data-cscene="chart" class="cscene-btn px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
              数据柱状折线图
            </button>
            <button data-cscene="blank" class="cscene-btn px-2.5 py-1 text-xs font-medium rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-100">
              清空自由手绘
            </button>
          </div>
          <div class="grid grid-cols-3 gap-2 text-xs">
            <select id="canvasWidthMm" class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
              <option value="297" selected>适配 A4 (297mm)</option>
              <option value="210">适配 210mm</option>
              <option value="0">96DPI 原始尺寸</option>
            </select>
            <select id="canvasFillMode" class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs">
              <option value="solid" selected>填充：SOLID 实心</option>
              <option value="outline">填充：闭合轮廓</option>
              <option value="ignore">填充：仅留描边</option>
            </select>
            <select id="brushColor" class="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs" title="在下方画布按住左键手绘的颜色">
              <option value="#d92121" selected>画笔：红色</option>
              <option value="#0f5acc">画笔：蓝色</option>
              <option value="#168f33">画笔：绿色</option>
              <option value="#111827">画笔：黑色</option>
            </select>
          </div>
        </div>

        <div class="flex-1 overflow-auto p-4 bg-slate-100/70 flex flex-col items-center justify-center gap-2.5">
          <div class="text-[11px] text-slate-500">
            由 <code class="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">recordCanvasContext(realCtx)</code> 实时双写录制 · 可按住鼠标左键直接手绘叠加矢量
          </div>
          <canvas id="drawCanvas" width="520" height="360" class="bg-white rounded-xl border border-slate-200 shadow-sm max-w-full h-auto cursor-crosshair"></canvas>
        </div>
      </section>
    </aside>

    <!-- 右侧统一双引擎预览区 -->
    <main class="flex-1 min-w-0 flex flex-col bg-slate-100/60">
      <!-- 预览控制栏 -->
      <div class="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center gap-2 flex-wrap shrink-0">
        <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200/80">
          <button data-view="both" class="view-btn px-2.5 py-1 rounded-md text-xs font-semibold bg-white text-slate-900 shadow-sm">
            双屏对比
          </button>
          <button data-view="canvas" class="view-btn px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900">
            仅 Canvas
          </button>
          <button data-view="svg" class="view-btn px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900">
            仅 SVG
          </button>
          <button id="visualSvgTabBtn" data-view="visual" class="view-btn hidden px-2.5 py-1 rounded-md text-xs font-medium text-teal-700 hover:text-teal-900">
            高保真 Visual SVG
          </button>
        </div>

        <button id="previewThemeBtn" class="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
          浅色打印底
        </button>
        <button id="fitBtn" class="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
          适配窗口
        </button>

        <div class="flex-1"></div>

        <div id="statsPill" class="text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 font-mono">
          就绪
        </div>
      </div>

      <!-- 预览画布容器 -->
      <div class="flex-1 min-h-0 flex relative">
        <div id="cadDualHost" class="flex-1 flex min-w-0 min-h-0">
          <div id="previewCanvasPane" class="flex-1 min-w-0 relative">
            <span class="absolute top-2.5 left-3 z-10 pointer-events-none px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-600/90 text-white shadow-sm">
              Canvas 光栅引擎
            </span>
            <canvas id="previewCanvas" class="vb-canvas"></canvas>
            <span class="absolute bottom-2.5 right-3 z-10 pointer-events-none px-2 py-0.5 rounded-md text-[11px] bg-white/85 text-slate-600 border border-slate-200/80 shadow-sm">
              滚轮缩放 · 左键拖拽（双屏 1:1 同步）
            </span>
          </div>
          <div id="previewSvgPane" class="flex-1 min-w-0 relative border-l border-slate-200">
            <span class="absolute top-2.5 left-3 z-10 pointer-events-none px-2 py-0.5 rounded-md text-[11px] font-semibold bg-teal-600/90 text-white shadow-sm">
              SVG 纯矢量引擎
            </span>
            <div id="previewSvg" class="vb-svg-host"></div>
          </div>
        </div>

        <div id="visualSvgHost" class="hidden flex-1 vb-visual-host p-6 bg-slate-100 flex items-start justify-center"></div>
      </div>
    </main>
  </div>

  <!-- 引入构建产物（发布至 CDN 后可替换为 https://unpkg.com/vecbridge/dist/vecbridge.global.js） -->
  <script src="../dist/vecbridge.global.js"></script>
  <script src="./assets/demo-core.js"></script>
  <script src="./js/playground.js"></script>
</body>
</html>

```

## examples\simple-square.mjs
```mjs
// simple-square.mjs
import { writeFileSync } from 'node:fs';
import { DrawingDocument, DxfExporter, SvgExporter } from '../dist/index.js';
// 安装发布包后改为：import { DrawingDocument, DxfExporter, SvgExporter } from 'vecbridge';

// 1. 世界坐标：正方形 100×100，左下角在原点
const doc = new DrawingDocument({
  extents: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
});

doc.addLayer('FRAME', 7, 'CONTINUOUS');
doc.addLayer('TEXT', 7, 'CONTINUOUS');

// 2. 正方形：左下 (0,0) → 右上 (100,100)，闭合四点多段线
doc.addRect(0, 0, 100, 100, 'FRAME', 7, 0.35);

// 3. 中文文字：居中放在正方形中心 (50,50)
//    参数顺序：x, y, h, text, layer, color, rot, hAlign, vAlign, widthFactor
//    hAlign=1 → 水平居中；vAlign=2 → 垂直居中
doc.addText(50, 50, 10, '你好，世界', 'TEXT', 7, 0, 1, 2, 0.85);

// 4. 导出 DXF（GBK 编码，AutoCAD 中文环境可正常显示）
const dxfBytes = DxfExporter.toBytes(doc, {
  encoding: 'gbk',
  font: 'gbcbig',      // txt.shx + gbcbig.shx，国标大字体
});
writeFileSync('square.dxf', dxfBytes);

// 5. 导出 SVG（UTF-8，白底、实际 mm 尺寸）
const svgText = SvgExporter.toText(doc, {
  theme: 'light',
  mode: 'export',
  paddingMm: 10,       // 四周留 10mm 白边
});
writeFileSync('square.svg', svgText);

console.log('已生成 square.dxf 与 square.svg');
```

## examples\svg-to-dxf.html
```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>VecBridge · SVG → DXF 实时转换器</title>
<script src="https://cdn.tailwindcss.com"></script>
<script src="./assets/tailwind-theme.js"></script>
<link rel="stylesheet" href="./assets/demo.css" />
</head>
<body class="bg-slate-50 text-slate-800 antialiased flex flex-col h-screen overflow-hidden">

  <!-- 顶部导航 -->
  <header class="bg-white/95 backdrop-blur border-b border-slate-200/90 px-4 py-2.5 flex items-center gap-3 flex-wrap shrink-0 z-20">
    <a href="./playground.html" class="flex items-center gap-2.5 mr-1 shrink-0">
      <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
        VB
      </div>
      <div class="leading-tight">
        <div class="flex items-center gap-1.5">
          <span class="font-bold text-slate-900 text-sm tracking-tight">VecBridge</span>
          <span class="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200/70">SVG → DXF</span>
        </div>
        <p class="text-[11px] text-slate-500">零依赖 SVG 解析 · 贝塞尔 / 圆弧 / transform · 双引擎核对</p>
      </div>
    </a>

    <nav class="vb-seg hidden lg:inline-flex" aria-label="示例导航">
      <a href="./playground.html" class="vb-seg-btn">工作台</a>
      <a href="./dxf-preview.html" class="vb-seg-btn">DXF 预览</a>
      <a href="./svg-to-dxf.html" class="vb-seg-btn is-active">SVG → DXF</a>
      <a href="./dom-to-dxf.html" class="vb-seg-btn">DOM → 矢量</a>
      <a href="./canvas-record.html" class="vb-seg-btn">Canvas 录制</a>
      <a href="./browser-demo.html" class="vb-seg-btn">API 示例</a>
      <a href="../docs/api.html" class="vb-seg-btn">API 文档</a>
    </nav>

    <div class="flex-1"></div>

    <div class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1">
        <span class="text-[11px] text-slate-500">DXF</span>
        <select id="encodingSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF 字节编码（AutoCAD/中望/浩辰推荐 GBK）">
          <option value="gbk" selected>GBK · ANSI_936</option>
          <option value="utf8">UTF-8</option>
        </select>
        <span class="text-slate-300">|</span>
        <select id="fontSelect" class="text-xs bg-transparent text-slate-700 font-medium focus:outline-none cursor-pointer" title="DXF STYLE 字体配方">
          <option value="gbcbig" selected>txt + gbcbig</option>
          <option value="gbenor">gbenor + gbcbig</option>
          <option value="gbeitc">gbeitc + gbcbig</option>
          <option value="hztxt">txt + hztxt</option>
          <option value="hzfs">txt + hzfs</option>
          <option value="romans">romans + gbcbig</option>
          <option value="tssd">tssdeng + tssdchn</option>
          <option value="simsun">simsun.ttf</option>
        </select>
      </div>
      <button id="exportSvgBtn" class="vb-btn vb-btn-teal">导出规整 SVG</button>
      <button id="exportDxfBtn" class="vb-btn vb-btn-primary">导出 DXF</button>
    </div>
  </header>

  <!-- 主工作区 -->
  <div class="flex-1 flex min-h-0 overflow-hidden">

    <!-- 左侧：SVG 源与解析参数 -->
    <aside class="w-[380px] xl:w-[420px] shrink-0 bg-white border-r border-slate-200 flex flex-col min-h-0">
      <div class="flex-1 overflow-y-auto vb-scroll p-4 space-y-3.5">

        <input type="file" id="fileInput" accept=".svg,image/svg+xml" class="hidden" />
        <div id="dropZone" class="border-2 border-dashed border-teal-200 hover:border-teal-400 bg-teal-50/40 hover:bg-teal-50/80 rounded-xl p-4 text-center cursor-pointer transition-all">
          <div class="text-xs font-semibold text-teal-700">点击选择或拖拽 .svg 文件到此处</div>
          <div class="text-[11px] text-slate-500 mt-1">支持 path 贝塞尔 / 椭圆弧、圆角矩形、transform 矩阵、&lt;defs&gt;/&lt;use&gt; 与文字</div>
        </div>

        <div class="flex gap-2">
          <button id="sampleBtn" class="vb-btn flex-1">加载内置矢量示例 SVG</button>
          <button id="clearBtn" class="vb-btn">清空</button>
        </div>

        <div class="bg-slate-50 rounded-xl border border-slate-200/80 p-3 space-y-2.5">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">SVG 解析参数</div>
          <div class="grid grid-cols-2 gap-2.5">
            <label class="space-y-1 col-span-2">
              <span class="text-xs text-slate-600 block">Y 轴翻转模式</span>
              <select id="yAxisSelect" class="vb-select">
                <option value="flip-viewbox" selected>flip-viewbox（外部 SVG 推荐）</option>
                <option value="negate">negate（精确往返 VecBridge）</option>
              </select>
            </label>
            <label class="space-y-1 col-span-2">
              <span class="text-xs text-slate-600 block">图层归类方式</span>
              <select id="layerBySelect" class="vb-select">
                <option value="group-id" selected>按 &lt;g id&gt; / data-layer</option>
                <option value="color">按 ACI 颜色分图层</option>
                <option value="single">合并到单一图层 0</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs text-slate-600 block">纯填充处理</span>
              <select id="fillModeSelect" class="vb-select">
                <option value="outline" selected>转为闭合轮廓线</option>
                <option value="solid">DXF 实心填充（SOLID）</option>
                <option value="ignore">忽略无描边填充</option>
              </select>
            </label>
            <label class="space-y-1">
              <span class="text-xs text-slate-600 block">曲线容差 (mm)</span>
              <input id="tolInput" type="number" value="0.1" step="0.05" min="0.01" max="5" class="vb-input" />
            </label>
            <label class="flex items-center gap-2 text-xs text-slate-600 cursor-pointer col-span-2">
              <input id="ignoreBgCheck" type="checkbox" checked class="vb-check" />
              自动跳过覆盖全画布的背景矩形
            </label>
          </div>
        </div>

        <div class="space-y-2">
          <div class="text-[11px] font-bold uppercase tracking-wider text-slate-400">解析统计</div>
          <div id="statsBox" class="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-[11px] text-slate-600 leading-relaxed">
            等待输入 SVG…
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between">
            <div class="text-xs font-medium text-slate-600">SVG 源码（可直接编辑实时生效）</div>
            <span class="text-[10px] text-slate-400">200ms 防抖</span>
          </div>
          <textarea id="svgInput" spellcheck="false" class="vb-textarea h-64 resize-y" placeholder="粘贴 <svg ...>...</svg> 源码"></textarea>
        </div>
      </div>

      <div class="border-t border-slate-200 px-4 py-2 text-[11px] text-slate-500 shrink-0">
        路径统一转换为 DXF R12 可识别的 LINE / POLYLINE / CIRCLE / SOLID / TEXT
      </div>
    </aside>

    <!-- 右侧：转换结果双引擎预览 -->
    <main class="flex-1 min-w-0 flex flex-col bg-slate-100/60">
      <div class="bg-white border-b border-slate-200 px-3.5 py-2 flex items-center gap-2 flex-wrap shrink-0">
        <div id="viewSeg" class="vb-seg">
          <button data-seg="both" class="vb-seg-btn is-active">双屏对比</button>
          <button data-seg="canvas" class="vb-seg-btn">仅 Canvas</button>
          <button data-seg="svg" class="vb-seg-btn">仅 SVG</button>
        </div>
        <button id="themeBtn" class="vb-btn">浅色打印底</button>
        <button id="fitBtn" class="vb-btn">适配窗口</button>
        <div class="flex-1"></div>
        <div id="statsPill" class="text-[11.5px] text-slate-600 bg-slate-50 border border-slate-200/90 rounded-lg px-2.5 py-1 font-mono">
          就绪
        </div>
      </div>

      <div class="flex-1 min-h-0 flex relative">
        <div id="canvasPane" class="flex-1 min-w-0 relative">
          <span class="vb-badge vb-badge-blue">Canvas 转换结果</span>
          <canvas id="previewCanvas" class="vb-canvas"></canvas>
          <span class="vb-hint">滚轮缩放 · 左键拖拽（双屏 1:1 同步）</span>
        </div>
        <div id="svgPane" class="flex-1 min-w-0 relative border-l border-slate-200">
          <span class="vb-badge vb-badge-teal">SVG IR 矢量核对</span>
          <div id="previewSvg" class="vb-svg-host"></div>
        </div>
      </div>
    </main>
  </div>

  <script src="../dist/vecbridge.global.js"></script>
  <script src="./assets/demo-core.js"></script>
  <script src="./js/svg-to-dxf.js"></script>
</body>
</html>

```

## scripts\build-docs.mjs
```mjs
/**
 * Build a standalone, searchable HTML version of docs/API.md.
 *
 * Usage: pnpm docs:api
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { marked } from 'marked';

const sourcePath = new URL('../docs/API.md', import.meta.url);
const outputPath = new URL('../docs/api.html', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const version = pkg.version || '0.0.0';

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const decodeEntities = (value) =>
  String(value)
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'");

const stripTags = (value) => value.replace(/<[^>]+>/g, '');

const markdown = readFileSync(sourcePath, 'utf8');
let html = marked.parse(markdown, { gfm: true, breaks: false });

// marked percent-encodes non-ASCII fragments; our heading ids are raw UTF-8,
// so decode them back and re-escape quotes for attribute safety.
html = html.replace(/href="#([^"]*)"/g, (match, fragment) => {
  try {
    return `href="#${escapeHtml(decodeURIComponent(fragment))}"`;
  } catch {
    return match;
  }
});

// Assign GitHub-compatible slugs to h2/h3 and collect the table of contents.
// The Markdown links in API.md use the same slug format, so in-page anchors
// keep working in the generated HTML.
const usedSlugs = new Map();
const makeSlug = (text) => {
  let base = text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
  if (!base) base = 'section';
  const count = usedSlugs.get(base) ?? 0;
  usedSlugs.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
};

const toc = [];
html = html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (_match, level, inner) => {
  const text = decodeEntities(stripTags(inner)).trim();
  const id = makeSlug(text);
  toc.push({ id, level: Number(level), text });
  const anchor = `<a class="anchor" href="#${id}" aria-hidden="true">#</a>`;
  return `<h${level} id="${id}">${inner}${anchor}</h${level}>`;
});

const tocHtml = toc
  .map(
    (item) =>
      `<a class="toc-link level-${item.level}" href="#${item.id}" data-text="${escapeHtml(
        item.text.toLowerCase()
      )}">${escapeHtml(item.text)}</a>`
  )
  .join('\n');

const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>vecbridge API 参考</title>
<style>
  :root {
    color-scheme: light;
    --bg: #ffffff;
    --bg-soft: #f7f8fa;
    --bg-code: #0f172a;
    --fg: #1f2937;
    --fg-soft: #5b6675;
    --border: #e5e8ec;
    --accent: #2563eb;
    --accent-soft: #eff4ff;
  }
  * { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body {
    margin: 0;
    background: var(--bg);
    color: var(--fg);
    font: 15px/1.75 "Microsoft YaHei", "PingFang SC", system-ui, -apple-system, sans-serif;
  }
  .layout { display: flex; min-height: 100vh; }

  /* Sidebar */
  .sidebar {
    position: sticky;
    top: 0;
    align-self: flex-start;
    width: 300px;
    height: 100vh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    background: var(--bg-soft);
  }
  .brand {
    display: flex; align-items: baseline; gap: 8px;
    padding: 20px 20px 12px;
  }
  .brand .logo { font-size: 18px; font-weight: 700; letter-spacing: -.02em; }
  .brand .ver {
    font-size: 11px; color: var(--fg-soft);
    border: 1px solid var(--border); border-radius: 999px; padding: 1px 7px;
    background: #fff;
  }
  .side-links {
    display: flex; flex-wrap: wrap; gap: 6px;
    padding: 0 16px 12px;
  }
  .side-links a {
    font-size: 12px; font-weight: 500;
    color: var(--accent); background: #fff;
    border: 1px solid var(--border); border-radius: 6px;
    padding: 3px 9px; text-decoration: none;
  }
  .side-links a:hover { background: var(--accent-soft); border-color: #bfdbfe; }
  .search-wrap { padding: 0 16px 12px; }
  #search {
    width: 100%; padding: 8px 11px;
    border: 1px solid var(--border); border-radius: 8px;
    font: inherit; font-size: 13px; color: var(--fg);
    background: #fff; outline: none;
  }
  #search:focus { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); }
  nav#toc { flex: 1; overflow-y: auto; padding: 4px 12px 24px; }
  .toc-link {
    display: block;
    padding: 5px 10px;
    border-radius: 6px;
    color: var(--fg-soft);
    text-decoration: none;
    font-size: 13px;
    line-height: 1.5;
    border-left: 2px solid transparent;
  }
  .toc-link:hover { background: #eef1f6; color: var(--fg); }
  .toc-link.level-2 { font-weight: 600; color: var(--fg); margin-top: 6px; }
  .toc-link.level-3 { padding-left: 22px; font-size: 12.5px; }
  .toc-link.active { background: var(--accent-soft); color: var(--accent); border-left-color: var(--accent); }
  .toc-empty { padding: 12px; font-size: 12px; color: var(--fg-soft); }

  /* Content */
  .content { flex: 1; min-width: 0; }
  article { max-width: 920px; margin: 0 auto; padding: 36px 44px 120px; }
  article h1 {
    font-size: 30px; line-height: 1.3; margin: 0 0 18px;
    letter-spacing: -.02em;
  }
  article h2 {
    font-size: 22px; margin: 52px 0 16px; padding-bottom: 8px;
    border-bottom: 1px solid var(--border); scroll-margin-top: 20px;
  }
  article h3 {
    font-size: 17px; margin: 32px 0 12px; padding-left: 10px;
    border-left: 3px solid var(--accent); scroll-margin-top: 20px;
  }
  article h4 { font-size: 15px; margin: 24px 0 10px; }
  article p { margin: 12px 0; }
  article a { color: var(--accent); text-decoration: none; }
  article a:hover { text-decoration: underline; }
  article .anchor {
    margin-left: 8px; color: var(--border); font-weight: 400;
    opacity: 0; transition: opacity .15s;
  }
  article h2:hover .anchor, article h3:hover .anchor { opacity: 1; }
  article ul, article ol { padding-left: 26px; margin: 12px 0; }
  article li { margin: 5px 0; }
  article blockquote {
    margin: 16px 0; padding: 10px 16px;
    border-left: 3px solid #f0b429; background: #fffaf0;
    color: #6b5320; border-radius: 0 6px 6px 0;
  }
  article blockquote p { margin: 4px 0; }
  article code {
    font-family: "Cascadia Code", "JetBrains Mono", Consolas, monospace;
    font-size: .88em;
    background: #eef2f7; color: #b42318;
    padding: .12em .38em; border-radius: 4px;
    word-break: break-word;
  }
  article pre {
    margin: 16px 0; padding: 16px 18px;
    background: var(--bg-code); color: #e2e8f0;
    border-radius: 10px; overflow-x: auto;
    font-size: 13px; line-height: 1.65;
  }
  article pre code {
    background: none; color: inherit; padding: 0;
    font-size: inherit; word-break: normal;
  }
  article table {
    width: 100%; border-collapse: collapse; margin: 16px 0;
    font-size: 13.5px; display: block; overflow-x: auto;
  }
  article th, article td {
    border: 1px solid var(--border);
    padding: 8px 11px; text-align: left; vertical-align: top;
  }
  article th { background: var(--bg-soft); font-weight: 600; white-space: nowrap; }
  article tr:nth-child(even) td { background: #fcfcfd; }
  article hr { border: none; border-top: 1px solid var(--border); margin: 36px 0; }
  article img { max-width: 100%; }

  .top-btn {
    position: fixed; right: 28px; bottom: 28px;
    width: 40px; height: 40px; border-radius: 50%;
    border: 1px solid var(--border); background: #fff; color: var(--fg-soft);
    cursor: pointer; font-size: 16px; box-shadow: 0 4px 14px rgba(15, 23, 42, .08);
    display: none;
  }
  .top-btn.show { display: block; }

  @media (max-width: 940px) {
    .sidebar { display: none; }
    article { padding: 24px 20px 80px; }
    article h1 { font-size: 24px; }
  }
</style>
</head>
<body>
<div class="layout">
  <aside class="sidebar">
    <div class="brand">
      <span class="logo">vecbridge</span>
      <span class="ver">API · v${escapeHtml(version)}</span>
    </div>
    <div class="side-links">
      <a href="../examples/playground.html">在线工作台</a>
      <a href="../examples/browser-demo.html">API 示例</a>
      <a href="../dist/vecbridge.global.js">global.js</a>
    </div>
    <div class="search-wrap">
      <input id="search" type="search" placeholder="搜索类 / 方法 / 选项…" autocomplete="off" />
    </div>
    <nav id="toc">
      ${tocHtml}
      <div class="toc-empty" id="tocEmpty" style="display:none">没有匹配的条目</div>
    </nav>
  </aside>
  <main class="content">
    <article id="doc">
${html}
    </article>
  </main>
</div>
<button class="top-btn" id="topBtn" title="回到顶部">↑</button>
<script>
(() => {
  const search = document.getElementById('search');
  const links = Array.from(document.querySelectorAll('.toc-link'));
  const empty = document.getElementById('tocEmpty');

  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    let visible = 0;
    for (const link of links) {
      const hit = !q || link.dataset.text.includes(q);
      link.style.display = hit ? '' : 'none';
      if (hit) visible++;
    }
    empty.style.display = visible === 0 ? '' : 'none';
  });

  // Highlight the section currently in view.
  const byId = new Map(links.map((link) => [link.getAttribute('href').slice(1), link]));
  const headings = Array.from(document.querySelectorAll('article h2[id], article h3[id]'));
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) link.classList.remove('active');
        const active = byId.get(entry.target.id);
        if (active) {
          active.classList.add('active');
          active.scrollIntoView({ block: 'nearest' });
        }
        break;
      }
    },
    { rootMargin: '0px 0px -75% 0px', threshold: 0 }
  );
  headings.forEach((heading) => observer.observe(heading));

  const topBtn = document.getElementById('topBtn');
  window.addEventListener('scroll', () => {
    topBtn.classList.toggle('show', window.scrollY > 600);
  });
  topBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
})();
</script>
</body>
</html>
`;

mkdirSync(new URL('../docs/', import.meta.url), { recursive: true });
writeFileSync(outputPath, page);

const paragraphs = (html.match(/<p>/g) || []).length;
console.log(
  `docs/api.html written (${(page.length / 1024).toFixed(1)} kB, ${toc.length} headings, ${paragraphs} paragraphs)`
);

```

## scripts\build-site.mjs
```mjs
/**
 * Assemble the static GitHub Pages bundle into `site/` without mutating source files.
 *
 * Output layout:
 *   site/
 *   ├── .nojekyll
 *   ├── index.html               (flattened Playground entry)
 *   ├── playground.html          (same as index.html for direct links)
 *   ├── dxf-preview.html / svg-to-dxf.html / dom-to-dxf.html / canvas-record.html / browser-demo.html
 *   ├── api.html                 (generated from docs/api.html)
 *   ├── assets/ & js/            (example shared styles and scripts)
 *   ├── examples/*.mjs           (Node example scripts referenced by API docs)
 *   ├── README.md & CHANGELOG.md
 *   └── dist/                    (browser IIFE vecbridge.global.js + ESM .js/.js.map)
 *
 * Usage: pnpm build:site
 */
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = fileURLToPath(new URL('..', import.meta.url));
const distDir = join(rootDir, 'dist');
const docsDir = join(rootDir, 'docs');
const examplesDir = join(rootDir, 'examples');
const siteDir = join(rootDir, 'site');

const globalBundlePath = join(distDir, 'vecbridge.global.js');
const apiHtmlPath = join(docsDir, 'api.html');

if (!existsSync(globalBundlePath)) {
  console.error('Missing dist/vecbridge.global.js. Run `pnpm build` first.');
  process.exit(1);
}
if (!existsSync(apiHtmlPath)) {
  console.error('Missing docs/api.html. Run `pnpm docs:api` first.');
  process.exit(1);
}

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(siteDir, { recursive: true });
writeFileSync(join(siteDir, '.nojekyll'), '');

/** Copy only browser-consumable JS & sourcemap artifacts from dist/ (exclude .cjs / .d.ts). */
function copyBrowserDist(srcDir, targetDir) {
  mkdirSync(targetDir, { recursive: true });
  let count = 0;
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name);
    const dstPath = join(targetDir, entry.name);
    if (entry.isDirectory()) {
      count += copyBrowserDist(srcPath, dstPath);
    } else if (entry.name.endsWith('.js') || entry.name.endsWith('.js.map')) {
      copyFileSync(srcPath, dstPath);
      count += 1;
    }
  }
  return count;
}

const distFiles = copyBrowserDist(distDir, join(siteDir, 'dist'));

cpSync(join(examplesDir, 'assets'), join(siteDir, 'assets'), { recursive: true });
cpSync(join(examplesDir, 'js'), join(siteDir, 'js'), { recursive: true });

// Keep Node example scripts and top-level docs accessible so links in api.html never 404.
const siteNodeExamplesDir = join(siteDir, 'examples');
mkdirSync(siteNodeExamplesDir, { recursive: true });
for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.mjs')) {
    copyFileSync(join(examplesDir, entry.name), join(siteNodeExamplesDir, entry.name));
  }
}
for (const docFile of ['README.md', 'CHANGELOG.md']) {
  const srcPath = join(rootDir, docFile);
  if (existsSync(srcPath)) copyFileSync(srcPath, join(siteDir, docFile));
}

// Rewrite relative links in example HTML pages for flattened site/ root.
const rewriteExampleHtml = (html) =>
  html
    .replaceAll('../dist/', './dist/')
    .replaceAll('../docs/api.html', './api.html');

let htmlCount = 0;
for (const entry of readdirSync(examplesDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
  const raw = readFileSync(join(examplesDir, entry.name), 'utf8');
  const rewritten = rewriteExampleHtml(raw);
  writeFileSync(join(siteDir, entry.name), rewritten);
  htmlCount += 1;

  if (entry.name === 'playground.html') {
    writeFileSync(join(siteDir, 'index.html'), rewritten);
  }
}

// Rewrite relative links in docs/api.html for flattened site/ root.
const rawApiHtml = readFileSync(apiHtmlPath, 'utf8');
const rewrittenApiHtml = rawApiHtml
  .replace(/href="\.\.\/examples\/([^"]+\.html(?:#[^"]*)?)"/g, 'href="./$1"')
  .replace(/href="\.\.\/examples\/([^"]+\.mjs)"/g, 'href="./examples/$1"')
  .replace(/href="\.\.\/dist\/([^"]+)"/g, 'href="./dist/$1"')
  .replaceAll('href="../README.md"', 'href="./README.md"')
  .replaceAll('href="../CHANGELOG.md"', 'href="./CHANGELOG.md"');
writeFileSync(join(siteDir, 'api.html'), rewrittenApiHtml);

const globalSizeKb = (statSync(join(siteDir, 'dist', 'vecbridge.global.js')).size / 1024).toFixed(1);
console.log(
  `site/ assembled (${htmlCount} demo pages + index.html + api.html, ${distFiles} dist files, vecbridge.global.js ${globalSizeKb} kB)`
);

```

## src\browser\index.ts
```ts
/**
 * 浏览器平台适配层：把字节/文本触发为文件下载。
 *
 * 这是全库唯一依赖 `document`/`URL`/`Blob` 的下载工具，与 render 层一样只在
 * 浏览器子入口暴露；Node 环境调用会抛错并提示改用 toBytes()/toText() 自行写文件。
 * 【勿改·历史兼容】revokeDelayMs 默认 0（立即 revoke），大文件在慢浏览器上才需调大。
 */

import type { DocumentLike } from '../core/data';
import type { TextCodec } from '../encoding';
import { DxfSerializer, type DxfSerializeOptions } from '../dxf/serializer';
import { SvgSerializer, type SvgSerializeOptions } from '../svg/serializer';

/** 下载选项。 */
export interface DownloadOptions {
  filename: string;
  mimeType?: string;
  /**
   * revoke object URL 前的延迟（毫秒），默认 0（立即 revoke，历史行为）。
   * 慢浏览器上下载超大文件时可适当调大。
   */
  revokeDelayMs?: number;
}

/** 环境守卫：缺少 document/URL/Blob 时抛错并给出替代方案。 */
function assertBrowser(): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    throw new Error(
      'Browser download API is not available in this environment. ' +
        'Use DxfExporter.toBytes()/SvgExporter.toText() and write the bytes yourself.'
    );
  }
}

/**
 * 触发原始字节/Blob/字符串的浏览器下载。
 *
 * 把数据包成 Blob → createObjectURL → 临时 <a download> 触发点击 → 立即移除。
 * 部分老浏览器要求 <a> 挂到文档上才会触发下载，故挂到 body（缺失则用 documentElement）。
 * 【勿改·历史兼容】revokeDelayMs 默认 0，立即 revokeObjectURL。
 */
export function downloadBytes(data: Uint8Array | Blob | string, options: DownloadOptions): void {
  assertBrowser();

  const blob =
    data instanceof Blob
      ? data
      : new Blob([data as BlobPart], {
          type: options.mimeType ?? 'application/octet-stream',
        });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = options.filename;
  // 部分浏览器（老 Firefox/Safari）只有 anchor 挂到文档时才触发下载；
  // document.body 为 null 时用 documentElement 兜底。
  const mount = document.body ?? document.documentElement;
  if (mount) mount.appendChild(anchor);
  anchor.click();
  if (mount) anchor.remove();

  const delay = options.revokeDelayMs ?? 0;
  if (delay > 0) {
    setTimeout(() => URL.revokeObjectURL(url), delay);
  } else {
    URL.revokeObjectURL(url);
  }
}

/** DXF 下载选项：序列化选项 + 下载选项，另可传自定义 codec。 */
export interface DownloadDxfOptions extends DxfSerializeOptions, DownloadOptions {
  /** 可选自定义 codec（例如接收 onUnencodable 回调）。 */
  codec?: TextCodec;
}

/** 序列化 + 编码 + 下载 DXF（仅浏览器）。 */
export function downloadDxf(doc: DocumentLike, options: DownloadDxfOptions): void {
  const { filename, mimeType, revokeDelayMs, codec, ...serializeOptions } = options;
  const bytes = new DxfSerializer({ codec }).toBytes(doc, serializeOptions);

  downloadBytes(new Blob([bytes as BlobPart], { type: mimeType ?? 'application/dxf' }), {
    filename,
    revokeDelayMs,
  });
}

/** SVG 下载选项：序列化选项 + 下载选项。 */
export interface DownloadSvgOptions extends SvgSerializeOptions, DownloadOptions {}

/** 序列化 + 下载 SVG（仅浏览器），默认 export 模式。 */
export function downloadSvg(doc: DocumentLike, options: DownloadSvgOptions): void {
  const { filename, mimeType, revokeDelayMs, ...serializeOptions } = options;
  const text = new SvgSerializer().serialize(doc, {
    mode: 'export',
    ...serializeOptions,
  });

  downloadBytes(
    new Blob([text], { type: mimeType ?? 'image/svg+xml;charset=utf-8' }),
    { filename, revokeDelayMs }
  );
}

```

## src\canvas\index.ts
```ts
/**
 * Canvas 2D 矢量录制与双写代理层出口（`vecbridge/canvas`）。
 *
 * 提供与标准 `CanvasRenderingContext2D` 兼容的矢量上下文：
 * - 无头模式（`createVectorContext`）可在 Node 与浏览器直接用 Canvas 2D API 绘图并导出 DXF / SVG；
 * - 双写代理模式（`recordCanvasContext(realCtx)`）在实时绘制真实 `<canvas>` 的同时同步记录 IR。
 */
export * from './recorder';

```

## src\canvas\recorder.ts
```ts
/**
 * Canvas 2D API 矢量录制与双写代理层：将标准 Canvas 2D 绘图调用转为统一 IR `DrawingDocument`。
 *
 * 支持两种模式：
 * 1. 无头纯记录（`createVectorContext`）：零 DOM 依赖，Node 与浏览器均可直接用 Canvas 2D 语法出图并导出 DXF / SVG；
 * 2. 双写代理（`recordCanvasContext(realCtx)`）：在透传调用真实 `CanvasRenderingContext2D` 上屏渲染的同时，
 *    同步采集矢量命令流，实现“所绘即所导”。
 */

import {
  colorToAci,
  isTransparentColor,
  sanitizeLayerCandidate,
} from '../core/color';
import { DrawingDocument } from '../core/document';
import { EXTENDED_LIGHT_THEME } from '../core/theme';
import type { HAlign, Linetype, Point, VAlign } from '../core/types';
import { DxfSerializer, type DxfSerializeOptions } from '../dxf/serializer';
import type { TextCodec } from '../encoding';
import { SvgSerializer, type SvgSerializeOptions } from '../svg/serializer';

const DEFAULT_PX_TO_MM = 25.4 / 96;

/** `fill()` / `fillRect()` 输出策略。 */
export type CanvasFillMode = 'solid' | 'outline' | 'ignore';

/** 图层分配策略：按当前活动图层 / 按 ACI 颜色 / 单图层。 */
export type CanvasLayerStrategy = 'layer' | 'color' | 'single';

/** 可被双写代理包裹的最小 Canvas 2D 上下文结构（兼容 CanvasRenderingContext2D 与测试桩）。 */
export interface Canvas2DTarget {
  readonly canvas?: { readonly width: number; readonly height: number };
  strokeStyle: unknown;
  fillStyle: unknown;
  lineWidth: number;
  lineCap?: CanvasLineCap;
  lineJoin?: CanvasLineJoin;
  miterLimit?: number;
  lineDashOffset?: number;
  globalAlpha?: number;
  font?: string;
  textAlign?: CanvasTextAlign;
  textBaseline?: CanvasTextBaseline;
  save(): void;
  restore(): void;
  scale(x: number, y: number): void;
  rotate(angle: number): void;
  translate(x: number, y: number): void;
  transform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  setTransform(a: number, b: number, c: number, d: number, e: number, f: number): void;
  resetTransform?(): void;
  beginPath(): void;
  closePath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  rect(x: number, y: number, w: number, h: number): void;
  roundRect?(
    x: number,
    y: number,
    w: number,
    h: number,
    radii?: number | readonly number[]
  ): void;
  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void;
  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void;
  ellipse?(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise?: boolean
  ): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void;
  stroke(): void;
  fill(fillRule?: CanvasFillRule): void;
  strokeRect(x: number, y: number, w: number, h: number): void;
  fillRect(x: number, y: number, w: number, h: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  fillText(text: string, x: number, y: number, maxWidth?: number): void;
  strokeText?(text: string, x: number, y: number, maxWidth?: number): void;
  setLineDash?(segments: number[]): void;
  getLineDash?(): number[];
  measureText?(text: string): { width: number };
}

/** Canvas 录制选项。 */
export interface CanvasRecorderOptions {
  /** 画布逻辑宽度（px），默认取代理目标 `canvas.width` 或 `800`。 */
  width?: number;
  /** 画布逻辑高度（px），默认取代理目标 `canvas.height` 或 `600`。 */
  height?: number;
  /** CSS px → 世界 mm 缩放倍率，默认 `25.4 / 96`（96 DPI）。 */
  pxToMm?: number;
  /** 若指定，则按目标宽度（mm）等比缩放整块画布（优先级高于 `pxToMm`）。 */
  fitWidthMm?: number;
  /** 是否把 Canvas 坐标系（Y 向下）翻转为 CAD 世界坐标系（Y 向上），默认 `true`。 */
  flipY?: boolean;
  /** 图层归类方式，默认 `'layer'`（使用 `setLayer()` 或 `defaultLayer`）。 */
  layerBy?: CanvasLayerStrategy;
  /** 默认图层名，默认 `'0'`。 */
  defaultLayer?: string;
  /** `fill()` / `fillRect()` 输出策略：`'solid'`（默认）、`'outline'` 或 `'ignore'`。 */
  fillMode?: CanvasFillMode;
  /** 圆弧、椭圆、贝塞尔曲线细分弦高容差（世界 mm），默认 `0.1`。 */
  curveTolerance?: number;
  /** CAD 文本字高相对 CSS font-size 的换算系数，默认 `0.78`。 */
  fontSizeScale?: number;
  /** 是否自动跳过覆盖整块画布的清屏背景 `fillRect(0, 0, w, h)`，默认 `true`。 */
  ignoreBackgroundFill?: boolean;
  /** 是否在导出的文档中自动为整块画布添加 `paper: true` 图框，默认 `false`。 */
  markPaper?: boolean;
  /** 图元数量硬上限，默认 `200_000`；传 `0` 关闭。 */
  maxPrimitives?: number;
  /** 可选底层真实 Canvas 2D 上下文（传入即开启双写代理模式）。 */
  target?: Canvas2DTarget | null;
}

/** 2D 仿射矩阵 `[a, b, c, d, e, f]`，满足 `x' = a*x + c*y + e, y' = b*x + d*y + f`。 */
type Mat2D = readonly [number, number, number, number, number, number];
const IDENTITY_MAT: Mat2D = [1, 0, 0, 1, 0, 0];

function mulMat(m1: Mat2D, m2: Mat2D): Mat2D {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMat(m: Mat2D, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function maxMatrixScale(m: Mat2D): number {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  const s = Math.max(sx, sy);
  return Number.isFinite(s) && s > 1e-9 ? s : 1;
}

function uniformScaleIfSimilar(m: Mat2D): number | null {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  if (sx <= 1e-9 || sy <= 1e-9) return null;
  if (Math.abs(sx - sy) / Math.max(sx, sy) > 1e-4) return null;
  const dot = m[0] * m[2] + m[1] * m[3];
  if (Math.abs(dot) / (sx * sy) > 1e-4) return null;
  return (sx + sy) * 0.5;
}

function normalizeArcSweep(
  startAngle: number,
  endAngle: number,
  counterclockwise: boolean
): number {
  const twoPi = Math.PI * 2;
  if (!counterclockwise) {
    if (endAngle - startAngle >= twoPi - 1e-6) return twoPi;
    let end = endAngle;
    while (end < startAngle) end += twoPi;
    let sweep = end - startAngle;
    if (sweep > twoPi) sweep %= twoPi;
    return sweep;
  }
  if (startAngle - endAngle >= twoPi - 1e-6) return -twoPi;
  let end = endAngle;
  while (end > startAngle) end -= twoPi;
  let sweep = end - startAngle;
  if (sweep < -twoPi) sweep %= twoPi;
  return sweep;
}

function arcSteps(radiusWorld: number, sweepRad: number, tolWorld: number): number {
  const r = Math.abs(radiusWorld);
  const absSweep = Math.abs(sweepRad);
  if (r <= 1e-9 || absSweep <= 1e-9) return 1;
  const stepAngle =
    r > tolWorld
      ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tolWorld / r)))
      : Math.PI / 6;
  const safeStep = Number.isFinite(stepAngle) && stepAngle > 1e-4 ? stepAngle : Math.PI / 12;
  const rawSteps = Math.max(2, Math.min(256, Math.ceil(absSweep / safeStep)));
  if (Math.abs(absSweep - Math.PI * 2) <= 1e-4) {
    return Math.max(12, Math.min(256, Math.ceil(rawSteps / 4) * 4));
  }
  return rawSteps;
}

function subdivideQuadratic(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tolPx: number,
  out: Array<[number, number]>,
  depth = 0
): void {
  const mx = (x0 + x2) * 0.5;
  const my = (y0 + y2) * 0.5;
  const err = Math.hypot(x1 - mx, y1 - my) * 0.5;
  if (depth >= 10 || err <= tolPx) {
    out.push([x2, y2]);
    return;
  }
  const x01 = (x0 + x1) * 0.5;
  const y01 = (y0 + y1) * 0.5;
  const x12 = (x1 + x2) * 0.5;
  const y12 = (y1 + y2) * 0.5;
  const x012 = (x01 + x12) * 0.5;
  const y012 = (y01 + y12) * 0.5;
  subdivideQuadratic(x0, y0, x01, y01, x012, y012, tolPx, out, depth + 1);
  subdivideQuadratic(x012, y012, x12, y12, x2, y2, tolPx, out, depth + 1);
}

function subdivideCubic(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  tolPx: number,
  out: Array<[number, number]>,
  depth = 0
): void {
  const d1 = Math.hypot(3 * x1 - 2 * x0 - x3, 3 * y1 - 2 * y0 - y3) / 3;
  const d2 = Math.hypot(3 * x2 - x0 - 2 * x3, 3 * y2 - y0 - 2 * y3) / 3;
  if (depth >= 10 || Math.max(d1, d2) * 0.75 <= tolPx) {
    out.push([x3, y3]);
    return;
  }
  const x01 = (x0 + x1) * 0.5;
  const y01 = (y0 + y1) * 0.5;
  const x12 = (x1 + x2) * 0.5;
  const y12 = (y1 + y2) * 0.5;
  const x23 = (x2 + x3) * 0.5;
  const y23 = (y2 + y3) * 0.5;
  const x012 = (x01 + x12) * 0.5;
  const y012 = (y01 + y12) * 0.5;
  const x123 = (x12 + x23) * 0.5;
  const y123 = (y12 + y23) * 0.5;
  const x0123 = (x012 + x123) * 0.5;
  const y0123 = (y012 + y123) * 0.5;
  subdivideCubic(x0, y0, x01, y01, x012, y012, x0123, y0123, tolPx, out, depth + 1);
  subdivideCubic(x0123, y0123, x123, y123, x23, y23, x3, y3, tolPx, out, depth + 1);
}

function dedupeWorldPoints(points: readonly [number, number][], closed: boolean): Point[] {
  const out: Point[] = [];
  for (const pt of points) {
    if (!Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
    const prev = out[out.length - 1];
    if (prev && Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) <= 1e-6) continue;
    out.push(pt);
  }
  if (closed && out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-6) {
      out.pop();
    }
  }
  return out;
}

function parseCssFont(font: string): { sizePx: number; bold: boolean } {
  const raw = String(font || '').trim();
  let sizePx = 10;
  const sizeMatch = raw.match(/(\d+(?:\.\d+)?|\.\d+)\s*(px|pt|mm)\b/i);
  if (sizeMatch) {
    const val = Number.parseFloat(sizeMatch[1]);
    const unit = sizeMatch[2].toLowerCase();
    if (Number.isFinite(val) && val > 0) {
      if (unit === 'pt') sizePx = (val * 96) / 72;
      else if (unit === 'mm') sizePx = (val * 96) / 25.4;
      else sizePx = val;
    }
  }
  const bold =
    /\b(?:bold|bolder|[6-9]00)\b/i.test(raw);
  return { sizePx, bold };
}

function mapTextAlign(align: CanvasTextAlign): HAlign {
  if (align === 'center') return 1;
  if (align === 'right' || align === 'end') return 2;
  return 0;
}

function mapTextBaseline(baseline: CanvasTextBaseline): VAlign {
  if (baseline === 'bottom') return 1;
  if (baseline === 'middle') return 2;
  if (baseline === 'top' || baseline === 'hanging') return 3;
  return 0;
}

function dashToLinetype(dash: readonly number[], pxToMm: number): Linetype | null {
  if (!dash || dash.length === 0) return null;
  const first = dash[0];
  if (!Number.isFinite(first) || first <= 0) return null;
  const gap = dash[1] ?? first;
  const firstMm = first * pxToMm;
  if (firstMm <= 0.65 && first <= gap * 0.75) return 'DOT';
  return 'DASHED';
}

function paintToColorString(value: unknown): string | null {
  if (typeof value !== 'string') return '#000000';
  if (isTransparentColor(value)) return null;
  return value;
}

interface ContextState {
  mat: Mat2D;
  strokeStyle: unknown;
  fillStyle: unknown;
  lineWidth: number;
  lineDash: number[];
  lineDashOffset: number;
  lineCap: CanvasLineCap;
  lineJoin: CanvasLineJoin;
  miterLimit: number;
  globalAlpha: number;
  font: string;
  textAlign: CanvasTextAlign;
  textBaseline: CanvasTextBaseline;
  layer: string;
}

interface RecordedSubpath {
  /** 已按路径构建时的 CTM 变换后的画布根坐标点列（px）。 */
  points: Array<[number, number]>;
  closed: boolean;
  /** 若该子路径来自单一等比整圆 `arc()`，保留精确圆元数据供 `stroke()` 直接生成 `CIRCLE`。 */
  exactCircle?: { cx: number; cy: number; r: number };
}

/**
 * 兼容标准 Canvas 2D API 的矢量录制 / 双写代理上下文。
 *
 * 所有路径、图元与变换都会同步转化为统一 IR `DrawingDocument`，可随时导出为
 * DXF R12、SVG 或送入 `DualViewPreview` 双引擎同步预览。
 */
export class VectorCanvasContext {
  readonly width: number;
  readonly height: number;
  readonly pxToMm: number;

  private readonly flipY: boolean;
  private readonly layerBy: CanvasLayerStrategy;
  private readonly defaultLayer: string;
  private readonly fillMode: CanvasFillMode;
  private readonly curveTolerance: number;
  private readonly fontSizeScale: number;
  private readonly ignoreBackgroundFill: boolean;
  private readonly markPaper: boolean;
  private readonly maxPrimitives: number;
  private readonly target: Canvas2DTarget | null;

  private doc: DrawingDocument;
  private registeredLayers: Set<string>;
  private emitted = 0;

  private state: ContextState;
  private stack: ContextState[] = [];
  private subpaths: RecordedSubpath[] = [];
  private lastLocalPoint: [number, number] | null = null;

  constructor(options: CanvasRecorderOptions = {}) {
    this.target = options.target ?? null;
    const targetW = this.target?.canvas?.width;
    const targetH = this.target?.canvas?.height;
    this.width =
      Number.isFinite(options.width) && (options.width as number) > 0
        ? (options.width as number)
        : targetW && targetW > 0
          ? targetW
          : 800;
    this.height =
      Number.isFinite(options.height) && (options.height as number) > 0
        ? (options.height as number)
        : targetH && targetH > 0
          ? targetH
          : 600;

    if (Number.isFinite(options.fitWidthMm) && (options.fitWidthMm as number) > 0) {
      this.pxToMm = (options.fitWidthMm as number) / this.width;
    } else if (Number.isFinite(options.pxToMm) && (options.pxToMm as number) > 0) {
      this.pxToMm = options.pxToMm as number;
    } else {
      this.pxToMm = DEFAULT_PX_TO_MM;
    }

    this.flipY = options.flipY ?? true;
    this.layerBy = options.layerBy ?? 'layer';
    this.defaultLayer = sanitizeLayerCandidate(options.defaultLayer, '0');
    this.fillMode = options.fillMode ?? 'solid';
    this.curveTolerance =
      Number.isFinite(options.curveTolerance) && (options.curveTolerance as number) > 0
        ? (options.curveTolerance as number)
        : 0.1;
    this.fontSizeScale =
      Number.isFinite(options.fontSizeScale) && (options.fontSizeScale as number) > 0
        ? (options.fontSizeScale as number)
        : 0.78;
    this.ignoreBackgroundFill = options.ignoreBackgroundFill ?? true;
    this.markPaper = options.markPaper ?? false;
    this.maxPrimitives =
      options.maxPrimitives === undefined
        ? 200_000
        : Number.isFinite(options.maxPrimitives) && options.maxPrimitives > 0
          ? Math.floor(options.maxPrimitives)
          : 0;

    this.state = this.createInitialState();
    this.doc = new DrawingDocument();
    this.registeredLayers = new Set<string>(['0']);
    this.initDocument();
  }

  /** 兼容 `ctx.canvas` 读取（便于传入依赖 `ctx.canvas.width/height` 的绘图函数）。 */
  get canvas(): { readonly width: number; readonly height: number } {
    return this.target?.canvas ?? { width: this.width, height: this.height };
  }

  /** 已录制的 IR 命令条数。 */
  get commandCount(): number {
    return this.doc.commands.length;
  }

  /* -------- Canvas 2D 状态属性（读写自动双写至 target） -------- */

  get strokeStyle(): unknown {
    return this.state.strokeStyle;
  }
  set strokeStyle(value: unknown) {
    this.state.strokeStyle = value;
    if (this.target) this.target.strokeStyle = value;
  }

  get fillStyle(): unknown {
    return this.state.fillStyle;
  }
  set fillStyle(value: unknown) {
    this.state.fillStyle = value;
    if (this.target) this.target.fillStyle = value;
  }

  get lineWidth(): number {
    return this.state.lineWidth;
  }
  set lineWidth(value: number) {
    if (Number.isFinite(value) && value > 0) {
      this.state.lineWidth = value;
      if (this.target) this.target.lineWidth = value;
    }
  }

  get lineCap(): CanvasLineCap {
    return this.state.lineCap;
  }
  set lineCap(value: CanvasLineCap) {
    this.state.lineCap = value;
    if (this.target) this.target.lineCap = value;
  }

  get lineJoin(): CanvasLineJoin {
    return this.state.lineJoin;
  }
  set lineJoin(value: CanvasLineJoin) {
    this.state.lineJoin = value;
    if (this.target) this.target.lineJoin = value;
  }

  get miterLimit(): number {
    return this.state.miterLimit;
  }
  set miterLimit(value: number) {
    if (Number.isFinite(value) && value > 0) {
      this.state.miterLimit = value;
      if (this.target) this.target.miterLimit = value;
    }
  }

  get lineDashOffset(): number {
    return this.state.lineDashOffset;
  }
  set lineDashOffset(value: number) {
    if (Number.isFinite(value)) {
      this.state.lineDashOffset = value;
      if (this.target) this.target.lineDashOffset = value;
    }
  }

  get globalAlpha(): number {
    return this.state.globalAlpha;
  }
  set globalAlpha(value: number) {
    if (Number.isFinite(value) && value >= 0 && value <= 1) {
      this.state.globalAlpha = value;
      if (this.target) this.target.globalAlpha = value;
    }
  }

  get font(): string {
    return this.state.font;
  }
  set font(value: string) {
    this.state.font = String(value);
    if (this.target) this.target.font = String(value);
  }

  get textAlign(): CanvasTextAlign {
    return this.state.textAlign;
  }
  set textAlign(value: CanvasTextAlign) {
    this.state.textAlign = value;
    if (this.target) this.target.textAlign = value;
  }

  get textBaseline(): CanvasTextBaseline {
    return this.state.textBaseline;
  }
  set textBaseline(value: CanvasTextBaseline) {
    this.state.textBaseline = value;
    if (this.target) this.target.textBaseline = value;
  }

  /* -------- 扩展 CAD 图层控制（随 save/restore 入栈出栈） -------- */

  /** 设置当前活动 CAD 图层名（在 `layerBy: 'layer'` 下生效，随 `save/restore` 恢复）。 */
  setLayer(name: string): this {
    this.state.layer = sanitizeLayerCandidate(name, this.defaultLayer);
    return this;
  }

  /** 获取当前活动 CAD 图层名。 */
  getLayer(): string {
    return this.state.layer;
  }

  /* -------- 状态栈与 2D 变换 -------- */

  save(): void {
    this.stack.push({
      ...this.state,
      lineDash: this.state.lineDash.slice(),
    });
    this.target?.save();
  }

  restore(): void {
    const prev = this.stack.pop();
    if (prev) this.state = prev;
    this.target?.restore();
  }

  translate(x: number, y: number): void {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      this.state.mat = mulMat(this.state.mat, [1, 0, 0, 1, x, y]);
    }
    this.target?.translate(x, y);
  }

  scale(x: number, y: number): void {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      this.state.mat = mulMat(this.state.mat, [x, 0, 0, y, 0, 0]);
    }
    this.target?.scale(x, y);
  }

  rotate(angleRad: number): void {
    if (Number.isFinite(angleRad)) {
      const cos = Math.cos(angleRad);
      const sin = Math.sin(angleRad);
      this.state.mat = mulMat(this.state.mat, [cos, sin, -sin, cos, 0, 0]);
    }
    this.target?.rotate(angleRad);
  }

  transform(a: number, b: number, c: number, d: number, e: number, f: number): void {
    if ([a, b, c, d, e, f].every(Number.isFinite)) {
      this.state.mat = mulMat(this.state.mat, [a, b, c, d, e, f]);
    }
    this.target?.transform(a, b, c, d, e, f);
  }

  setTransform(
    aOrMatrix: number | { a?: number; b?: number; c?: number; d?: number; e?: number; f?: number },
    b?: number,
    c?: number,
    d?: number,
    e?: number,
    f?: number
  ): void {
    if (typeof aOrMatrix === 'object' && aOrMatrix !== null) {
      const ma = aOrMatrix.a ?? 1;
      const mb = aOrMatrix.b ?? 0;
      const mc = aOrMatrix.c ?? 0;
      const md = aOrMatrix.d ?? 1;
      const me = aOrMatrix.e ?? 0;
      const mf = aOrMatrix.f ?? 0;
      if ([ma, mb, mc, md, me, mf].every(Number.isFinite)) {
        this.state.mat = [ma, mb, mc, md, me, mf];
      }
      this.target?.setTransform(ma, mb, mc, md, me, mf);
      return;
    }
    const na = aOrMatrix;
    const nb = b ?? 0;
    const nc = c ?? 0;
    const nd = d ?? 1;
    const ne = e ?? 0;
    const nf = f ?? 0;
    if ([na, nb, nc, nd, ne, nf].every(Number.isFinite)) {
      this.state.mat = [na, nb, nc, nd, ne, nf];
    }
    this.target?.setTransform(na, nb, nc, nd, ne, nf);
  }

  resetTransform(): void {
    this.state.mat = IDENTITY_MAT;
    if (this.target?.resetTransform) this.target.resetTransform();
    else this.target?.setTransform(1, 0, 0, 1, 0, 0);
  }

  getTransform(): { a: number; b: number; c: number; d: number; e: number; f: number } {
    const [a, b, c, d, e, f] = this.state.mat;
    return { a, b, c, d, e, f };
  }

  setLineDash(segments: number[]): void {
    const clean = Array.isArray(segments)
      ? segments.filter((n) => Number.isFinite(n) && n >= 0)
      : [];
    this.state.lineDash = clean.length % 2 === 1 ? [...clean, ...clean] : clean;
    this.target?.setLineDash?.(this.state.lineDash);
  }

  getLineDash(): number[] {
    return this.state.lineDash.slice();
  }

  /* -------- 路径构建 API -------- */

  beginPath(): void {
    this.subpaths = [];
    this.lastLocalPoint = null;
    this.target?.beginPath();
  }

  closePath(): void {
    const cur = this.subpaths[this.subpaths.length - 1];
    if (cur && cur.points.length >= 2) {
      cur.closed = true;
    }
    this.target?.closePath();
  }

  moveTo(x: number, y: number): void {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      this.subpaths.push({
        points: [applyMat(this.state.mat, x, y)],
        closed: false,
      });
      this.lastLocalPoint = [x, y];
    }
    this.target?.moveTo(x, y);
  }

  lineTo(x: number, y: number): void {
    if (Number.isFinite(x) && Number.isFinite(y)) {
      const pt = applyMat(this.state.mat, x, y);
      const cur = this.subpaths[this.subpaths.length - 1];
      if (!cur) {
        this.subpaths.push({ points: [pt], closed: false });
      } else {
        cur.exactCircle = undefined;
        cur.points.push(pt);
      }
      this.lastLocalPoint = [x, y];
    }
    this.target?.lineTo(x, y);
  }

  rect(x: number, y: number, w: number, h: number): void {
    if ([x, y, w, h].every(Number.isFinite)) {
      const m = this.state.mat;
      this.subpaths.push({
        points: [
          applyMat(m, x, y),
          applyMat(m, x + w, y),
          applyMat(m, x + w, y + h),
          applyMat(m, x, y + h),
        ],
        closed: true,
      });
      this.lastLocalPoint = [x, y];
    }
    this.target?.rect(x, y, w, h);
  }

  roundRect(
    x: number,
    y: number,
    w: number,
    h: number,
    radii: number | readonly number[] = 0
  ): void {
    if ([x, y, w, h].every(Number.isFinite)) {
      const rx = w < 0 ? x + w : x;
      const ry = h < 0 ? y + h : y;
      const rw = Math.abs(w);
      const rh = Math.abs(h);

      const list = Array.isArray(radii) ? radii : [radii];
      const r0 = Math.max(0, Number(list[0] ?? 0) || 0);
      const r1 = Math.max(0, Number(list[1] ?? r0) || 0);
      const r2 = Math.max(0, Number(list[2] ?? r0) || 0);
      const r3 = Math.max(0, Number(list[3] ?? r1) || 0);

      let tl = r0;
      let tr = r1;
      let br = r2;
      let bl = r3;
      const scaleF = Math.min(
        1,
        tl + tr > rw && tl + tr > 0 ? rw / (tl + tr) : 1,
        bl + br > rw && bl + br > 0 ? rw / (bl + br) : 1,
        tl + bl > rh && tl + bl > 0 ? rh / (tl + bl) : 1,
        tr + br > rh && tr + br > 0 ? rh / (tr + br) : 1
      );
      tl *= scaleF;
      tr *= scaleF;
      br *= scaleF;
      bl *= scaleF;

      const m = this.state.mat;
      const pts: Array<[number, number]> = [];
      const pushLocal = (lx: number, ly: number): void => {
        pts.push(applyMat(m, lx, ly));
      };
      const addCorner = (
        cx: number,
        cy: number,
        r: number,
        startRad: number,
        endRad: number
      ): void => {
        if (r <= 1e-6) {
          pushLocal(cx, cy);
          return;
        }
        const steps = arcSteps(r * maxMatrixScale(m) * this.pxToMm, endRad - startRad, this.curveTolerance);
        for (let i = 0; i <= steps; i++) {
          const a = startRad + ((endRad - startRad) * i) / steps;
          pushLocal(cx + r * Math.cos(a), cy + r * Math.sin(a));
        }
      };

      addCorner(rx + rw - tr, ry + tr, tr, -Math.PI / 2, 0);
      addCorner(rx + rw - br, ry + rh - br, br, 0, Math.PI / 2);
      addCorner(rx + bl, ry + rh - bl, bl, Math.PI / 2, Math.PI);
      addCorner(rx + tl, ry + tl, tl, Math.PI, (Math.PI * 3) / 2);

      this.subpaths.push({ points: pts, closed: true });
      this.lastLocalPoint = [rx, ry];
    }

    if (this.target) {
      if (typeof this.target.roundRect === 'function') {
        this.target.roundRect(x, y, w, h, radii);
      } else {
        this.target.rect(x, y, w, h);
      }
    }
  }

  arc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise = false
  ): void {
    if (
      [x, y, radius, startAngle, endAngle].every(Number.isFinite) &&
      radius >= 0
    ) {
      this.recordArcInternal(x, y, radius, startAngle, endAngle, counterclockwise);
    }
    this.target?.arc(x, y, radius, startAngle, endAngle, counterclockwise);
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, radius: number): void {
    if ([x1, y1, x2, y2, radius].every(Number.isFinite) && radius >= 0) {
      if (!this.lastLocalPoint) {
        this.subpaths.push({
          points: [applyMat(this.state.mat, x1, y1)],
          closed: false,
        });
        this.lastLocalPoint = [x1, y1];
      } else {
        const [x0, y0] = this.lastLocalPoint;
        const v1x = x0 - x1;
        const v1y = y0 - y1;
        const v2x = x2 - x1;
        const v2y = y2 - y1;
        const len1 = Math.hypot(v1x, v1y);
        const len2 = Math.hypot(v2x, v2y);

        if (radius <= 1e-9 || len1 <= 1e-9 || len2 <= 1e-9) {
          this.pushLocalLinePoint(x1, y1);
        } else {
          const u1x = v1x / len1;
          const u1y = v1y / len1;
          const u2x = v2x / len2;
          const u2y = v2y / len2;
          const cross = u1x * u2y - u1y * u2x;
          if (Math.abs(cross) <= 1e-7) {
            this.pushLocalLinePoint(x1, y1);
          } else {
            const dot = Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y));
            const theta = Math.acos(dot);
            const halfTan = Math.tan(theta * 0.5);
            const halfSin = Math.sin(theta * 0.5);
            const distT = radius / halfTan;
            const t1x = x1 + distT * u1x;
            const t1y = y1 + distT * u1y;
            const t2x = x1 + distT * u2x;
            const t2y = y1 + distT * u2y;

            const bx = u1x + u2x;
            const by = u1y + u2y;
            const bLen = Math.hypot(bx, by);
            const distC = radius / halfSin;
            const cx = x1 + (bx / bLen) * distC;
            const cy = y1 + (by / bLen) * distC;

            const a1 = Math.atan2(t1y - cy, t1x - cx);
            const a2 = Math.atan2(t2y - cy, t2x - cx);
            this.pushLocalLinePoint(t1x, t1y);
            this.recordArcInternal(cx, cy, radius, a1, a2, cross > 0);
            this.lastLocalPoint = [t2x, t2y];
          }
        }
      }
    }
    this.target?.arcTo(x1, y1, x2, y2, radius);
  }

  ellipse(
    x: number,
    y: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
    startAngle: number,
    endAngle: number,
    counterclockwise = false
  ): void {
    if (
      [x, y, radiusX, radiusY, rotation, startAngle, endAngle].every(Number.isFinite) &&
      radiusX >= 0 &&
      radiusY >= 0
    ) {
      const sweep = normalizeArcSweep(startAngle, endAngle, counterclockwise);
      const isFull = Math.abs(Math.abs(sweep) - Math.PI * 2) <= 1e-4;
      const m = this.state.mat;
      const steps = arcSteps(
        Math.max(radiusX, radiusY) * maxMatrixScale(m) * this.pxToMm,
        sweep,
        this.curveTolerance
      );
      const cosR = Math.cos(rotation);
      const sinR = Math.sin(rotation);

      let cur = this.subpaths[this.subpaths.length - 1];
      if (!cur) {
        cur = { points: [], closed: false };
        this.subpaths.push(cur);
      } else {
        cur.exactCircle = undefined;
      }

      const ptAt = (a: number): [number, number] => {
        const lx = radiusX * Math.cos(a);
        const ly = radiusY * Math.sin(a);
        return [x + lx * cosR - ly * sinR, y + lx * sinR + ly * cosR];
      };

      const limit = isFull && cur.points.length === 0 ? steps - 1 : steps;
      for (let i = 0; i <= limit; i++) {
        const a = startAngle + (sweep * i) / steps;
        const [ex, ey] = ptAt(a);
        cur.points.push(applyMat(m, ex, ey));
      }
      if (isFull && cur.points.length === steps) cur.closed = true;
      this.lastLocalPoint = ptAt(startAngle + sweep);
    }
    this.target?.ellipse?.(
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      counterclockwise
    );
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    if ([cpx, cpy, x, y].every(Number.isFinite)) {
      const m = this.state.mat;
      const p1 = applyMat(m, cpx, cpy);
      const p2 = applyMat(m, x, y);
      let cur = this.subpaths[this.subpaths.length - 1];
      if (!cur || cur.points.length === 0) {
        cur = { points: [p1], closed: false };
        this.subpaths.push(cur);
      }
      cur.exactCircle = undefined;
      const p0 = cur.points[cur.points.length - 1];
      subdivideQuadratic(
        p0[0],
        p0[1],
        p1[0],
        p1[1],
        p2[0],
        p2[1],
        this.curveTolerance / this.pxToMm,
        cur.points
      );
      this.lastLocalPoint = [x, y];
    }
    this.target?.quadraticCurveTo(cpx, cpy, x, y);
  }

  bezierCurveTo(
    cp1x: number,
    cp1y: number,
    cp2x: number,
    cp2y: number,
    x: number,
    y: number
  ): void {
    if ([cp1x, cp1y, cp2x, cp2y, x, y].every(Number.isFinite)) {
      const m = this.state.mat;
      const p1 = applyMat(m, cp1x, cp1y);
      const p2 = applyMat(m, cp2x, cp2y);
      const p3 = applyMat(m, x, y);
      let cur = this.subpaths[this.subpaths.length - 1];
      if (!cur || cur.points.length === 0) {
        cur = { points: [p1], closed: false };
        this.subpaths.push(cur);
      }
      cur.exactCircle = undefined;
      const p0 = cur.points[cur.points.length - 1];
      subdivideCubic(
        p0[0],
        p0[1],
        p1[0],
        p1[1],
        p2[0],
        p2[1],
        p3[0],
        p3[1],
        this.curveTolerance / this.pxToMm,
        cur.points
      );
      this.lastLocalPoint = [x, y];
    }
    this.target?.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
  }

  /* -------- 描边、填充与文本绘制 API -------- */

  stroke(): void {
    this.emitCurrentPathStroke();
    this.target?.stroke();
  }

  fill(fillRule?: CanvasFillRule): void {
    this.emitCurrentPathFill();
    if (fillRule !== undefined) this.target?.fill(fillRule);
    else this.target?.fill();
  }

  strokeRect(x: number, y: number, w: number, h: number): void {
    if ([x, y, w, h].every(Number.isFinite) && this.state.globalAlpha > 0.001) {
      const colorStr = paintToColorString(this.state.strokeStyle);
      if (colorStr && this.canEmit()) {
        const m = this.state.mat;
        const corners = [
          this.toWorld(...applyMat(m, x, y)),
          this.toWorld(...applyMat(m, x + w, y)),
          this.toWorld(...applyMat(m, x + w, y + h)),
          this.toWorld(...applyMat(m, x, y + h)),
        ];
        const color = colorToAci(colorStr);
        const lt = dashToLinetype(this.state.lineDash, this.pxToMm);
        const layer = this.resolveLayer(color, lt);
        const lw = this.resolvedLineWidthMm();
        this.doc.addPolyline(corners, layer, color, true, lw, lt ? { linetype: lt } : undefined);
        this.emitted++;
      }
    }
    this.target?.strokeRect(x, y, w, h);
  }

  fillRect(x: number, y: number, w: number, h: number): void {
    if (
      [x, y, w, h].every(Number.isFinite) &&
      this.state.globalAlpha > 0.001 &&
      this.fillMode !== 'ignore'
    ) {
      const colorStr = paintToColorString(this.state.fillStyle);
      if (colorStr && this.canEmit()) {
        const m = this.state.mat;
        const cornersPx: Array<[number, number]> = [
          applyMat(m, x, y),
          applyMat(m, x + w, y),
          applyMat(m, x + w, y + h),
          applyMat(m, x, y + h),
        ];

        const skipBg = this.ignoreBackgroundFill && this.coversFullCanvas(cornersPx);
        if (!skipBg) {
          const worldPts = dedupeWorldPoints(
            cornersPx.map(([px, py]) => this.toWorld(px, py)),
            true
          );
          if (worldPts.length >= 3) {
            const color = colorToAci(colorStr);
            const layer = this.resolveLayer(color, null);
            if (this.fillMode === 'solid') {
              const before = this.doc.commands.length;
              this.doc.addSolid(worldPts, layer, color);
              this.emitted += this.doc.commands.length - before;
            } else {
              this.doc.addPolyline(worldPts, layer, color, true, 0);
              this.emitted++;
            }
          }
        }
      }
    }
    this.target?.fillRect(x, y, w, h);
  }

  clearRect(x: number, y: number, w: number, h: number): void {
    if ([x, y, w, h].every(Number.isFinite)) {
      const m = this.state.mat;
      const cornersPx: Array<[number, number]> = [
        applyMat(m, x, y),
        applyMat(m, x + w, y),
        applyMat(m, x + w, y + h),
        applyMat(m, x, y + h),
      ];
      // 全画布 clearRect 视为新一帧重绘，清空上一帧已录制的矢量命令避免重复叠加
      if (this.coversFullCanvas(cornersPx)) {
        this.doc.clear();
        this.registeredLayers = new Set<string>(['0']);
        this.emitted = 0;
        this.initDocument();
      }
    }
    this.target?.clearRect(x, y, w, h);
  }

  fillText(text: string, x: number, y: number, maxWidth?: number): void {
    this.emitText(text, x, y, this.state.fillStyle);
    if (maxWidth !== undefined) this.target?.fillText(text, x, y, maxWidth);
    else this.target?.fillText(text, x, y);
  }

  strokeText(text: string, x: number, y: number, maxWidth?: number): void {
    this.emitText(text, x, y, this.state.strokeStyle);
    if (maxWidth !== undefined) this.target?.strokeText?.(text, x, y, maxWidth);
    else this.target?.strokeText?.(text, x, y);
  }

  measureText(text: string): { width: number } {
    if (this.target?.measureText) {
      return this.target.measureText(text);
    }
    const { sizePx } = parseCssFont(this.state.font);
    const s = String(text ?? '');
    let units = 0;
    for (let i = 0; i < s.length; i++) {
      units += s.charCodeAt(i) > 0x7f ? 1.0 : 0.56;
    }
    return { width: units * sizePx };
  }

  /* -------- 导出与生命周期方法 -------- */

  /** 清空已录制的矢量命令与状态栈（可复用于新一帧录制）。 */
  reset(): this {
    this.state = this.createInitialState();
    this.stack = [];
    this.subpaths = [];
    this.lastLocalPoint = null;
    this.doc.clear();
    this.registeredLayers = new Set<string>(['0']);
    this.emitted = 0;
    this.initDocument();
    return this;
  }

  /** 返回当前录制结果对应的统一 IR `DrawingDocument` 快照。 */
  toDocument(): DrawingDocument {
    const cloned = DrawingDocument.fromJSON(this.doc.toJSON());
    const widthMm = this.width * this.pxToMm;
    const heightMm = this.height * this.pxToMm;

    let minX = 0;
    let minY = 0;
    let maxX = widthMm;
    let maxY = heightMm;

    const include = (x: number, y: number): void => {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    };

    for (const cmd of cloned.commands) {
      switch (cmd.type) {
        case 'line':
          include(cmd.x1, cmd.y1);
          include(cmd.x2, cmd.y2);
          break;
        case 'circle':
          include(cmd.cx - cmd.r, cmd.cy - cmd.r);
          include(cmd.cx + cmd.r, cmd.cy + cmd.r);
          break;
        case 'polyline':
          for (const [px, py] of cmd.points) include(px, py);
          break;
        case 'solid':
          for (const [px, py] of cmd.points) include(px, py);
          break;
        case 'text':
          include(cmd.x, cmd.y);
          break;
      }
    }

    cloned.setExtents(minX, minY, maxX, maxY);
    return cloned;
  }

  /** 将当前录制的矢量直接序列化为 DXF R12 文本。 */
  toDxfText(options: DxfSerializeOptions & { codec?: TextCodec } = {}): string {
    const { codec, ...dxfOpts } = options;
    return new DxfSerializer({ codec }).serialize(this.toDocument(), dxfOpts);
  }

  /** 将当前录制的矢量直接序列化为编码后的 DXF R12 字节流（默认 GBK）。 */
  toDxfBytes(options: DxfSerializeOptions & { codec?: TextCodec } = {}): Uint8Array {
    const { codec, ...dxfOpts } = options;
    return new DxfSerializer({ codec }).toBytes(this.toDocument(), dxfOpts);
  }

  /** 将当前录制的矢量直接序列化为 SVG 文本。 */
  toSvgText(options: SvgSerializeOptions = {}): string {
    return new SvgSerializer().serialize(this.toDocument(), {
      theme: EXTENDED_LIGHT_THEME,
      mode: 'export',
      ...options,
    });
  }

  /* -------- 内部实现辅助 -------- */

  private createInitialState(): ContextState {
    return {
      mat: IDENTITY_MAT,
      strokeStyle: '#000000',
      fillStyle: '#000000',
      lineWidth: 1,
      lineDash: [],
      lineDashOffset: 0,
      lineCap: 'butt',
      lineJoin: 'miter',
      miterLimit: 10,
      globalAlpha: 1,
      font: '10px sans-serif',
      textAlign: 'start',
      textBaseline: 'alphabetic',
      layer: this.defaultLayer,
    };
  }

  private initDocument(): void {
    const widthMm = this.width * this.pxToMm;
    const heightMm = this.height * this.pxToMm;
    this.doc.setExtents(0, 0, widthMm, heightMm);
    if (this.markPaper) {
      const frameLayer = this.resolveLayer(8, null, 'FRAME');
      this.doc.addRect(0, 0, widthMm, heightMm, frameLayer, 8, 0, { paper: true });
      this.emitted++;
    }
  }

  private canEmit(): boolean {
    return this.maxPrimitives === 0 || this.emitted < this.maxPrimitives;
  }

  private toWorld(px: number, py: number): [number, number] {
    const wx = px * this.pxToMm;
    const wy = this.flipY ? (this.height - py) * this.pxToMm : py * this.pxToMm;
    return [wx, wy];
  }

  private resolveLayer(
    color: number,
    linetype: Linetype | null,
    explicitOverride?: string
  ): string {
    let candidate = explicitOverride ?? this.state.layer;
    if (!explicitOverride) {
      if (this.layerBy === 'color') candidate = `COLOR_${color}`;
      else if (this.layerBy === 'single') candidate = this.defaultLayer;
    }
    const safe = sanitizeLayerCandidate(candidate, this.defaultLayer);
    if (!this.registeredLayers.has(safe)) {
      this.registeredLayers.add(safe);
      this.doc.addLayer(safe, color, linetype ?? 'CONTINUOUS');
    }
    return safe;
  }

  private resolvedLineWidthMm(): number {
    const mm = this.state.lineWidth * maxMatrixScale(this.state.mat) * this.pxToMm;
    return mm > 0.35 ? mm : 0;
  }

  private coversFullCanvas(cornersPx: readonly [number, number][]): boolean {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [px, py] of cornersPx) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    const epsX = this.width * 0.01;
    const epsY = this.height * 0.01;
    return (
      minX <= epsX &&
      minY <= epsY &&
      maxX >= this.width - epsX &&
      maxY >= this.height - epsY
    );
  }

  private pushLocalLinePoint(x: number, y: number): void {
    const pt = applyMat(this.state.mat, x, y);
    const cur = this.subpaths[this.subpaths.length - 1];
    if (!cur) {
      this.subpaths.push({ points: [pt], closed: false });
    } else {
      cur.exactCircle = undefined;
      cur.points.push(pt);
    }
    this.lastLocalPoint = [x, y];
  }

  private recordArcInternal(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    counterclockwise: boolean
  ): void {
    const sweep = normalizeArcSweep(startAngle, endAngle, counterclockwise);
    const isFull = Math.abs(Math.abs(sweep) - Math.PI * 2) <= 1e-4;
    const m = this.state.mat;
    const steps = arcSteps(radius * maxMatrixScale(m) * this.pxToMm, sweep, this.curveTolerance);

    let cur = this.subpaths[this.subpaths.length - 1];
    const isFreshSubpath = !cur || cur.points.length === 0;
    if (!cur) {
      cur = { points: [], closed: false };
      this.subpaths.push(cur);
    } else if (!isFreshSubpath) {
      cur.exactCircle = undefined;
    }

    const limit = isFull && isFreshSubpath ? steps - 1 : steps;
    for (let i = 0; i <= limit; i++) {
      const a = startAngle + (sweep * i) / steps;
      cur.points.push(applyMat(m, x + radius * Math.cos(a), y + radius * Math.sin(a)));
    }

    if (isFull && isFreshSubpath) {
      cur.closed = true;
      const uScale = uniformScaleIfSimilar(m);
      if (uScale !== null && radius > 0) {
        const [cx, cy] = applyMat(m, x, y);
        cur.exactCircle = { cx, cy, r: radius * uScale };
      }
    }

    const finalAngle = startAngle + sweep;
    this.lastLocalPoint = [x + radius * Math.cos(finalAngle), y + radius * Math.sin(finalAngle)];
  }

  private emitCurrentPathStroke(): void {
    if (this.state.globalAlpha <= 0.001) return;
    const colorStr = paintToColorString(this.state.strokeStyle);
    if (!colorStr) return;

    const color = colorToAci(colorStr);
    const lt = dashToLinetype(this.state.lineDash, this.pxToMm);
    const layer = this.resolveLayer(color, lt);
    const lw = this.resolvedLineWidthMm();

    for (const sp of this.subpaths) {
      if (!this.canEmit()) break;
      if (sp.exactCircle && lw === 0) {
        const [wcx, wcy] = this.toWorld(sp.exactCircle.cx, sp.exactCircle.cy);
        const wr = sp.exactCircle.r * this.pxToMm;
        if (wr > 0) {
          this.doc.addCircle(wcx, wcy, wr, layer, color, lt);
          this.emitted++;
        }
        continue;
      }

      const worldPts = dedupeWorldPoints(
        sp.points.map(([px, py]) => this.toWorld(px, py)),
        sp.closed
      );
      if (worldPts.length < 2) continue;

      if (!sp.closed && worldPts.length === 2 && lw === 0) {
        this.doc.addLine(
          worldPts[0][0],
          worldPts[0][1],
          worldPts[1][0],
          worldPts[1][1],
          layer,
          color,
          lt
        );
        this.emitted++;
      } else {
        this.doc.addPolyline(
          worldPts,
          layer,
          color,
          sp.closed,
          lw,
          lt ? { linetype: lt } : undefined
        );
        this.emitted++;
      }
    }
  }

  private emitCurrentPathFill(): void {
    if (this.fillMode === 'ignore' || this.state.globalAlpha <= 0.001) return;
    const colorStr = paintToColorString(this.state.fillStyle);
    if (!colorStr) return;

    const color = colorToAci(colorStr);
    const layer = this.resolveLayer(color, null);

    for (const sp of this.subpaths) {
      if (!this.canEmit()) break;
      const worldPts = dedupeWorldPoints(
        sp.points.map(([px, py]) => this.toWorld(px, py)),
        true
      );
      if (worldPts.length < 3) continue;

      if (this.fillMode === 'solid') {
        const before = this.doc.commands.length;
        this.doc.addSolid(worldPts, layer, color);
        this.emitted += this.doc.commands.length - before;
      } else {
        this.doc.addPolyline(worldPts, layer, color, true, 0);
        this.emitted++;
      }
    }
  }

  private emitText(rawText: string, x: number, y: number, paint: unknown): void {
    if (this.state.globalAlpha <= 0.001 || !this.canEmit()) return;
    const text = String(rawText ?? '');
    if (!text.trim() || !Number.isFinite(x) || !Number.isFinite(y)) return;

    const colorStr = paintToColorString(paint);
    if (!colorStr) return;

    const color = colorToAci(colorStr);
    const layer = this.resolveLayer(color, null);
    const m = this.state.mat;
    const [cx, cy] = applyMat(m, x, y);
    const [wx, wy] = this.toWorld(cx, cy);

    const { sizePx, bold } = parseCssFont(this.state.font);
    const scaleX = Math.hypot(m[0], m[1]);
    const scaleY = Math.hypot(m[2], m[3]);
    const safeScaleY = Number.isFinite(scaleY) && scaleY > 1e-6 ? scaleY : 1;
    const h = sizePx * safeScaleY * this.pxToMm * this.fontSizeScale;
    if (!Number.isFinite(h) || h <= 0) return;

    const rawRot = this.flipY
      ? (-Math.atan2(m[1], m[0]) * 180) / Math.PI
      : (Math.atan2(m[1], m[0]) * 180) / Math.PI;
    const rot = Math.abs(rawRot) < 1e-6 ? 0 : rawRot;
    const wf =
      Number.isFinite(scaleX) && scaleX > 1e-6
        ? Math.max(0.1, (scaleX / safeScaleY) * 0.85)
        : 0.85;

    const before = this.doc.commands.length;
    this.doc.addText(
      wx,
      wy,
      h,
      text,
      layer,
      color,
      rot,
      mapTextAlign(this.state.textAlign),
      mapTextBaseline(this.state.textBaseline),
      wf,
      bold ? { bold: true } : undefined
    );
    this.emitted += this.doc.commands.length - before;
  }
}

/**
 * 创建无头矢量 Canvas 2D 上下文（环境无关，Node 与浏览器均可使用）。
 *
 * 使用标准 Canvas 2D API 绘图后调用 `ctx.toDocument()`、`ctx.toDxfBytes()` 或 `ctx.toSvgText()` 导出。
 */
export function createVectorContext(
  options: Omit<CanvasRecorderOptions, 'target'> = {}
): VectorCanvasContext {
  return new VectorCanvasContext(options);
}

/**
 * 包裹真实 `CanvasRenderingContext2D` 开启双写代理录制（浏览器端“所绘即所导”）。
 *
 * 所有通过返回上下文调用的 Canvas 2D 指令都会同时渲染到屏幕并记录为统一 IR。
 */
export function recordCanvasContext(
  target: Canvas2DTarget,
  options: Omit<CanvasRecorderOptions, 'target'> = {}
): VectorCanvasContext {
  return new VectorCanvasContext({ ...options, target });
}

```

## src\core\color.ts
```ts
/**
 * 共享色彩解析、CSS/SVG 颜色 → AutoCAD ACI 索引映射与图层名清洗工具。
 *
 * 纯计算、环境无关，由 `src/svg/parser.ts` 与 `src/dom/*` 共同复用，
 * 确保 SVG 导入与 HTML DOM 导入在颜色映射和图层命名上完全一致。
 */

const CSS_NAMED_COLORS: Record<string, readonly [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  lime: [0, 255, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  aqua: [0, 255, 255],
  magenta: [255, 0, 255],
  fuchsia: [255, 0, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  darkgray: [169, 169, 169],
  darkgrey: [169, 169, 169],
  lightgray: [211, 211, 211],
  lightgrey: [211, 211, 211],
  orange: [255, 165, 0],
  brown: [165, 42, 42],
  navy: [0, 0, 128],
  teal: [0, 128, 128],
  olive: [128, 128, 0],
  purple: [128, 0, 128],
  maroon: [128, 0, 0],
};

/** 本库内置深/浅主题精确映射，往返转换时优先原样命中。 */
const EXACT_THEME_ACI: Record<string, number> = {
  '#ff3b30': 1,
  '#d92121': 1,
  '#32d74b': 3,
  '#168f33': 3,
  '#409cff': 5,
  '#0f5acc': 5,
  '#76808f': 8,
  '#6b7280': 8,
  '#f0f4f8': 7,
  '#111827': 7,
};

/** AutoCAD 常用 ACI 调色板（索引 1..9 + 典型工程色与灰度）。 */
const ACI_PALETTE: ReadonlyArray<readonly [number, number, number, number]> = [
  [1, 255, 0, 0], // 红
  [2, 255, 255, 0], // 黄
  [3, 0, 255, 0], // 绿
  [4, 0, 255, 255], // 青
  [5, 0, 0, 255], // 蓝
  [6, 255, 0, 255], // 品红
  [8, 128, 128, 128], // 深灰
  [9, 192, 192, 192], // 浅灰
  [10, 255, 64, 64],
  [14, 180, 0, 0],
  [30, 255, 128, 0], // 橙
  [40, 255, 191, 0], // 琥珀
  [52, 180, 180, 0], // 橄榄
  [80, 128, 255, 0],
  [94, 0, 160, 0], // 深绿
  [134, 0, 160, 160], // 青绿
  [140, 0, 191, 255], // 天蓝
  [150, 0, 128, 255],
  [174, 0, 0, 160], // 深蓝
  [200, 128, 0, 255], // 紫
  [214, 160, 0, 160],
  [240, 255, 0, 128],
  [251, 90, 90, 90],
  [253, 168, 168, 168],
];

/** 解析 CSS/SVG 颜色为 [r, g, b, alpha]（RGB 范围 0..255，alpha 范围 0..1）。 */
export function parseColorRgba(
  raw: string | undefined | null
): [number, number, number, number] | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s || s === 'none' || s === 'transparent' || s.startsWith('url(')) return null;

  if (CSS_NAMED_COLORS[s]) {
    const [r, g, b] = CSS_NAMED_COLORS[s];
    return [r, g, b, 1];
  }

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? Number.parseInt(hex[3] + hex[3], 16) / 255 : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && Number.isFinite(a)) {
        return [r, g, b, a];
      }
    } else if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && Number.isFinite(a)) {
        return [r, g, b, a];
      }
    }
    return null;
  }

  const rgbMatch = s.match(/^rgba?\s*\(([^)]+)\)$/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const parseChannel = (token: string): number => {
        if (token.endsWith('%')) return Math.round((Number.parseFloat(token) / 100) * 255);
        return Math.round(Number.parseFloat(token));
      };
      const parseAlpha = (token: string): number => {
        const v = token.endsWith('%')
          ? Number.parseFloat(token) / 100
          : Number.parseFloat(token);
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
      };
      const r = Math.max(0, Math.min(255, parseChannel(parts[0])));
      const g = Math.max(0, Math.min(255, parseChannel(parts[1])));
      const b = Math.max(0, Math.min(255, parseChannel(parts[2])));
      const a = parts.length >= 4 ? parseAlpha(parts[3]) : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r, g, b, a];
      }
    }
  }
  return null;
}

/** 解析 CSS/SVG 颜色为 [r, g, b]。 */
export function parseColorRgb(
  raw: string | undefined | null
): [number, number, number] | null {
  const rgba = parseColorRgba(raw);
  return rgba ? [rgba[0], rgba[1], rgba[2]] : null;
}

/** 判断颜色是否完全透明或无效。 */
export function isTransparentColor(raw: string | undefined | null): boolean {
  const rgba = parseColorRgba(raw);
  return !rgba || rgba[3] <= 0.001;
}

/** 判断颜色是否接近纯白（用于跳过白底背景填充与识别白纸）。 */
export function isNearWhiteRgb(r: number, g: number, b: number): boolean {
  return r >= 245 && g >= 245 && b >= 245;
}

/** 将 RGB 格式化为 SVG 1.1 兼容的 6 位十六进制颜色。 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 将 CSS/SVG 颜色映射为最接近的 AutoCAD ACI 索引（1..255）。 */
export function colorToAci(raw: string | undefined | null): number {
  if (!raw) return 7;
  const trimmed = raw.trim().toLowerCase();
  if (EXACT_THEME_ACI[trimmed] !== undefined) return EXACT_THEME_ACI[trimmed];

  const rgb = parseColorRgb(trimmed);
  if (!rgb) return 7;
  const [r, g, b] = rgb;

  // 极黑与极白在 AutoCAD 中均对应 ACI 7（随背景黑白自动反色）。
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  if (maxC - minC <= 18) {
    if (maxC <= 45 || minC >= 225) return 7;
    return maxC < 165 ? 8 : 9;
  }

  let bestAci = 7;
  let bestDist = Infinity;
  for (const [aci, pr, pg, pb] of ACI_PALETTE) {
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    // 人眼加权欧氏距离
    const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestAci = aci;
    }
  }
  return bestAci;
}

/** 清洗候选图层名，过滤 DXF 符号表禁用字符与控制字符。 */
export function sanitizeLayerCandidate(
  raw: string | null | undefined,
  fallback: string
): string {
  if (!raw) return fallback;
  const clean = raw.replace(/[\\<>\/":;?*|,=`\r\n\x00-\x1f]/g, '_').trim();
  return clean || fallback;
}

```

## src\core\data.ts
```ts
/**
 * 文档数据适配层（鸭子类型桥）。
 *
 * 这是所有输出端/渲染端的统一入口：无论拿到的是普通 `DocumentData` 快照，
 * 还是像 `DrawingDocument` 这样带 `toJSON()` 的 builder，都能取到同一份可
 * 消费的数据。DXF/SVG 序列化器与双视图预览都通过这里取数。
 */

import type { DocumentData } from './types';

/** 任何可当作文档的对象：普通快照，或提供 toJSON() 的 builder。 */
export type DocumentLike = DocumentData | { toJSON(): DocumentData };

/**
 * 从 `DocumentLike` 取出 `DocumentData` 快照。
 *
 * 参数：doc 为普通快照或带 toJSON() 的对象。
 * 返回：若有 toJSON() 方法就调用它取值，否则把入参当作快照原样返回。
 * 注意：核心调用链的第一环——
 *       resolveDocumentData → createLayerLookup → resolveCommandStyle →
 *       theme.resolveAci → fmtNumber → isPaperCommand/isBoldText，
 *       这条链是三端视觉与输出一致的保证。
 */
export function resolveDocumentData(doc: DocumentLike): DocumentData {
  const candidate = doc as { toJSON?: unknown };
  if (typeof candidate.toJSON === 'function') {
    return (doc as { toJSON(): DocumentData }).toJSON();
  }
  return doc as DocumentData;
}

```

## src\core\decorations.ts
```ts
/**
 * 装饰判定：识别"纸张区域"与"粗体文本"，供 SVG/Canvas 渲染端美化输出。
 *
 * 这里搭起「通用引擎」与「应用层图层命名」之间的桥梁：
 *  - 推荐做法：在 IR 命令上打元数据标记（`paper`、`bold`）；
 *  - 兼容做法：在此列出图层名（如 paperFillLayers: ['FRAME_OUTER']）。
 * 优先级：IR 元数据优先，其次才是配置的图层名列表。
 *
 * 默认配置刻意留空——库不会去猜测外部文档的图层约定。
 */

import type { DrawCommand, PolylineCommand, TextCommand } from './types';

/** 装饰配置：用图层名兼容那些没有 IR 元数据的旧文档。 */
export interface DecorationOptions {
  /** 这些图层上的 4 点闭合折线会被当作纸张填充。 */
  paperFillLayers?: readonly string[];
  /** 这些图层上的文本会以粗体字重渲染。 */
  boldLayers?: readonly string[];
}

/**
 * 判断一条命令是否应被当作"一张纸"的区域。
 *
 * 条件：必须是闭合的 4 点折线；先认 IR 的 `paper` 标记，
 * 否则再看图层名是否命中 paperFillLayers。
 * 返回：是则为 true，并把类型收窄为 PolylineCommand。
 */
export function isPaperCommand(
  cmd: DrawCommand,
  decorations?: DecorationOptions
): cmd is PolylineCommand {
  if (cmd.type !== 'polyline') return false;
  if (!cmd.closed || cmd.points.length !== 4) return false;
  if (cmd.paper) return true;
  const layers = decorations?.paperFillLayers;
  return !!layers && layers.includes(cmd.layer);
}

/**
 * 判断一条文本命令是否应以粗体渲染。
 *
 * 先认 IR 的 `bold` 标记，否则看图层名是否命中 boldLayers。
 */
export function isBoldText(cmd: TextCommand, decorations?: DecorationOptions): boolean {
  if (cmd.bold) return true;
  const layers = decorations?.boldLayers;
  return !!layers && layers.includes(cmd.layer);
}

```

## src\core\document.ts
```ts
import { DEFAULT_TEXT_METRICS, type TextMetricsPolicy } from './text';
import type {
  DrawCommand,
  DrawTarget,
  DocumentData,
  Extents,
  HAlign,
  LayerDef,
  Linetype,
  Point,
  TextCommand,
  VAlign,
} from './types';

/** 文档构建选项。 */
export interface DrawingDocumentOptions {
  /** 图幅范围，默认 A4 横向 297×210。 */
  extents?: Partial<Extents>;
  /** 原点偏移 [x, y]，默认 [0, 0]。 */
  offset?: Point;
  /** 构建期文本布局参数覆盖（主要是多行行距）。 */
  text?: Partial<TextMetricsPolicy>;
}

/** addPolyline 的可选参数。 */
export interface AddPolylineOptions {
  /** 把这条闭合折线标记为"纸张区域"（渲染提示）。 */
  paper?: boolean;
  /** 显式图元线型（组码 6）；省略则不输出。 */
  linetype?: Linetype;
}

/** addRect 的可选参数。 */
export interface AddRectOptions {
  paper?: boolean;
}

/** addText 的可选参数。 */
export interface AddTextOptions {
  /** 渲染提示：粗体字重。 */
  bold?: boolean;
}

/**
 * 绘图文档（Builder + 命令 IR）。
 *
 * 职责：
 *  - 累积图层、世界坐标图元命令与图幅范围；
 *  - 在 add*() 调用的那一刻【一次性】应用当前原点偏移，让 IR 永久保存最终
 *    世界坐标（这是输出字节一致的前提——偏移不会在序列化阶段二次叠加）；
 *  - 把多行文本展开为"每行一条"文本命令（历史行为）。
 *
 * 本类只负责构建数据，不做序列化、不碰 DOM。它实现了 `DrawTarget` 接口，
 * 因此 fill 图案等组合助手可以直接往里添加图元。
 */
export class DrawingDocument implements DrawTarget {
  /** 累积的图层定义。注意：【勿改·历史兼容】addLayer 不去重。 */
  readonly layers: LayerDef[] = [];
  /** 累积的图元命令（IR）。 */
  readonly commands: DrawCommand[] = [];

  private _extents: Extents;
  private _offsetX: number;
  private _offsetY: number;
  private readonly lineGapFactor: number;

  /** 默认 A4 横向图幅、零偏移、默认文本行距策略。 */
  constructor(options: DrawingDocumentOptions = {}) {
    this._extents = { minX: 0, minY: 0, maxX: 297, maxY: 210, ...options.extents };
    this._offsetX = options.offset?.[0] ?? 0;
    this._offsetY = options.offset?.[1] ?? 0;
    this.lineGapFactor =
      options.text?.lineGapFactor ?? DEFAULT_TEXT_METRICS.lineGapFactor;
  }

  /** 当前图幅范围。 */
  get extents(): Extents {
    return this._extents;
  }

  /** 当前 X 方向原点偏移。 */
  get offsetX(): number {
    return this._offsetX;
  }

  /** 当前 Y 方向原点偏移。 */
  get offsetY(): number {
    return this._offsetY;
  }

  /** 旧版别名，等同 offsetX（【勿改·历史兼容】保留给外部调用方）。 */
  get ox(): number {
    return this._offsetX;
  }

  /** 旧版别名，等同 offsetY（【勿改·历史兼容】保留给外部调用方）。 */
  get oy(): number {
    return this._offsetY;
  }

  /** 设置原点偏移，影响此后 add*() 添加的图元；返回 this 便于链式调用。 */
  setOffset(ox: number, oy: number): this {
    this._offsetX = ox;
    this._offsetY = oy;
    return this;
  }

  /** 设置图幅范围；返回 this 便于链式调用。 */
  setExtents(minX: number, minY: number, maxX: number, maxY: number): this {
    this._extents = { minX, minY, maxX, maxY };
    return this;
  }

  /**
   * 追加一个图层定义。
   * 注意：【勿改·历史兼容】这里不去重，重复名称会全部 push 进去。
   */
  addLayer(name: string, color = 7, linetype: Linetype = 'CONTINUOUS'): this {
    this.layers.push({ name, color, linetype });
    return this;
  }

  /**
   * 添加一条线段；四个坐标在入栈前各加一次当前偏移，IR 存最终世界坐标。
   * 参数：x1/y1 与 x2/y2 为两端点，layer 图层名，color 为 ACI 或 null（随层）。
   */
  addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = '0',
    color: number | null = null,
    linetype: Linetype | null = null
  ): this {
    const ox = this._offsetX;
    const oy = this._offsetY;
    this.commands.push({
      type: 'line',
      x1: x1 + ox,
      y1: y1 + oy,
      x2: x2 + ox,
      y2: y2 + oy,
      layer,
      color,
      linetype,
    });
    return this;
  }

  /**
   * 便捷方法：添加一个闭合矩形，内部转成 4 点闭合折线。
   * 参数：x1/y1 与 x2/y2 为对角两点；options.paper 可标记为纸张区域。
   */
  addRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = '0',
    color: number | null = null,
    lineWidth = 0,
    options?: AddRectOptions
  ): this {
    return this.addPolyline(
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      layer,
      color,
      true,
      lineWidth,
      { paper: options?.paper }
    );
  }

  /**
   * 添加一个圆；圆心加偏移，半径不变。linetype 仅在给出时才写入命令。
   */
  addCircle(
    cx: number,
    cy: number,
    r: number,
    layer = '0',
    color: number | null = null,
    linetype: Linetype | null = null
  ): this {
    const command: DrawCommand = {
      type: 'circle',
      cx: cx + this._offsetX,
      cy: cy + this._offsetY,
      r,
      layer,
      color,
    };
    if (linetype) command.linetype = linetype;
    this.commands.push(command);
    return this;
  }

  /**
   * 添加一条折线；所有点整体加偏移后成为世界坐标。
   *
   * 参数：points 点集；closed 是否闭合；lineWidth 线宽；
   *       options.paper 标记纸张区域、options.linetype 指定图元线型。
   * 空点集直接忽略。
   */
  addPolyline(
    points: readonly Point[],
    layer = '0',
    color: number | null = null,
    closed = false,
    lineWidth = 0,
    options?: AddPolylineOptions
  ): this {
    if (!points || points.length === 0) return this;
    const ox = this._offsetX;
    const oy = this._offsetY;
    const worldPoints: Point[] = points.map(([x, y]) => [x + ox, y + oy] as const);

    const command: DrawCommand = {
      type: 'polyline',
      points: worldPoints,
      layer,
      color,
      closed,
      lineWidth,
    };
    if (options?.paper) (command as { paper?: boolean }).paper = true;
    if (options?.linetype) (command as { linetype?: Linetype }).linetype = options.linetype;
    this.commands.push(command);
    return this;
  }

  /**
   * 添加实心填充区域（对应 DXF R12 `SOLID` 实体）；顶点按轮廓顺序传入并在入栈时一次性应用偏移。
   *
   * 少于 3 个顶点时静默忽略；3~4 个顶点直接生成单条 `solid` 命令；
   * 超过 4 个顶点（如凸多边形、圆角矩形）自动按扇形拆分为若干 4 顶点四边形（奇数余量补 3 顶点三角形）。
   */
  addSolid(
    points: readonly Point[],
    layer = '0',
    color: number | null = null
  ): this {
    if (!points || points.length < 3) return this;
    const ox = this._offsetX;
    const oy = this._offsetY;
    const worldPoints: Point[] = points.map(([x, y]) => [x + ox, y + oy] as const);

    if (worldPoints.length <= 4) {
      this.commands.push({
        type: 'solid',
        points: worldPoints,
        layer,
        color,
      });
      return this;
    }

    const anchor = worldPoints[0];
    for (let i = 1; i + 1 < worldPoints.length; i += 2) {
      if (i + 2 < worldPoints.length) {
        this.commands.push({
          type: 'solid',
          points: [anchor, worldPoints[i], worldPoints[i + 1], worldPoints[i + 2]],
          layer,
          color,
        });
      } else {
        this.commands.push({
          type: 'solid',
          points: [anchor, worldPoints[i], worldPoints[i + 1]],
          layer,
          color,
        });
      }
    }
    return this;
  }

  /** 便捷方法：添加一个实心填充矩形（左下/右上或任意对角两点）。 */
  addSolidRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = '0',
    color: number | null = null
  ): this {
    return this.addSolid(
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      layer,
      color
    );
  }

  /**
   * 添加文本；多行文本会被拆成"每行一条"文本命令（历史行为）。
   *
   * 参数：x/y 为插入点，h 为字高，text 支持 string | number | null | undefined
   *       （空值直接忽略），layer 图层名，color 为 ACI 或 null（随层），
   *       rot 为旋转角（度），hAlign/vAlign 对应组码 72/73，
   *       widthFactor 为宽度系数，options.bold 标记粗体。
   *
   * 多行时，各行沿旋转基线的法向（dirX/dirY）展开，使竖排（rot=90）
   * 的多行标签堆叠而不重叠。
   * 注意：【勿改·字节契约】rot===0 时特意保留原算术式
   *       `y + totalH / 2 - idx * lineGap`，浮点运算结合顺序会影响输出字节。
   */
  addText(
    x: number,
    y: number,
    h: number,
    text: string | number | null | undefined,
    layer = '0',
    color: number | null = null,
    rot = 0,
    hAlign: HAlign = 0,
    vAlign: VAlign = 0,
    widthFactor = DEFAULT_TEXT_METRICS.defaultWidthFactor,
    options?: AddTextOptions
  ): this {
    if (text === null || text === undefined || text === '') return this;

    const lines = String(text).split(/\r\n|\r|\n/);
    if (lines.length > 1) {
      const lineGap = h * this.lineGapFactor;
      const totalH = (lines.length - 1) * lineGap;
      // 沿旋转基线的法向偏移每一行，让竖排（rot=90）的多行标签堆叠而非重叠。
      const radians = (rot * Math.PI) / 180;
      const dirX = -Math.sin(radians);
      const dirY = Math.cos(radians);
      for (let idx = 0; idx < lines.length; idx++) {
        const offset = totalH / 2 - idx * lineGap;
        // 未旋转时保留原算术式 y + totalH / 2 - idx * lineGap 的浮点结合顺序，
        // 保证与旧实现字节一致。
        const lineX = rot === 0 ? x : x + dirX * offset;
        const lineY = rot === 0 ? y + totalH / 2 - idx * lineGap : y + dirY * offset;
        this.addText(
          lineX,
          lineY,
          h,
          lines[idx],
          layer,
          color,
          rot,
          hAlign,
          vAlign,
          widthFactor,
          options
        );
      }
      return this;
    }

    const cleanText = String(text).trim();
    if (!cleanText) return this;

    const command: TextCommand = {
      type: 'text',
      x: x + this._offsetX,
      y: y + this._offsetY,
      h,
      text: cleanText,
      layer,
      color,
      rot,
      hAlign,
      vAlign,
      widthFactor,
    };
    if (options?.bold) command.bold = true;
    this.commands.push(command);
    return this;
  }

  /** 清空图层与命令，保留图幅范围与偏移设置。 */
  clear(): this {
    this.layers.length = 0;
    this.commands.length = 0;
    return this;
  }

  /** 返回普通快照；结构可安全序列化/持久化（就是三端共用的 DocumentData）。 */
  toJSON(): DocumentData {
    return {
      layers: this.layers,
      commands: this.commands,
      extents: this._extents,
    };
  }

  /**
   * 从快照还原文档。
   *
   * 注意：【勿改·历史兼容/性能】用 for 循环逐条 push，而不是
   * `push(...data.commands)`——后者在 V8 上约 12.5 万实体时会超出参数个数上限而抛错。
   */
  static fromJSON(data: DocumentData): DrawingDocument {
    const doc = new DrawingDocument({ extents: data?.extents });
    // 逐条迭代而非展开：push(...commands) 在 V8 约 12.5 万实体时会参数溢出。
    if (Array.isArray(data?.layers)) {
      for (const layer of data.layers) doc.layers.push(layer);
    }
    if (Array.isArray(data?.commands)) {
      for (const command of data.commands) doc.commands.push(command);
    }
    return doc;
  }
}

```

## src\core\format.ts
```ts
/**
 * 三端共享的数值格式化契约：DXF 坐标、SVG 属性与 viewBox 字符串都用它。
 *
 * 行为刻意与旧实现保持一致（`String(Number(n.toFixed(4)))`），包括：
 *  - 非有限值（NaN/Infinity）统一折叠为 "0"；
 *  - 去掉尾部多余的零（"1.5000" → "1.5"）；
 *  - 负零输出为 "0"。
 *
 * 额外防护：`Number.prototype.toFixed` 在 |n| >= 1e21 时会切到科学计数法，
 * 部分 DXF/SVG 解析器不接受这种写法，因此这类值改为展开成普通十进制整数。
 */

const SCIENTIFIC_THRESHOLD = 1e21;

/**
 * 把科学计数法形式的数字展开为普通十进制字符串。
 *
 * 例如 "1.23e+25" → "12300000000000000000000000"。做法是拆出尾数与指数，
 * 拼出全部数字位，再按小数点应落下的位置（intPart.length + exponent）
 * 分三种情况重组：小数点落在开头之前、落在末尾之后、落在数字中间。
 * 参数：n 为确定含 e/E 的数字（本函数由 fmtNumber 在阈值判断后调用）。
 * 返回：普通十进制表示，保留负号。
 */
function toPlainInteger(n: number): string {
  const text = n.toString();
  if (!/[eE]/.test(text)) return text;

  const [mantissa, exponentText] = text.split(/[eE]/);
  const exponent = Number(exponentText);
  const negative = mantissa.startsWith('-');
  const [intPart, fracPart = ''] = (negative ? mantissa.slice(1) : mantissa).split('.');
  const digits = intPart + fracPart;
  const pointPosition = intPart.length + exponent;

  let plain: string;
  if (pointPosition <= 0) {
    plain = `0.${'0'.repeat(-pointPosition)}${digits}`;
  } else if (pointPosition >= digits.length) {
    plain = digits + '0'.repeat(pointPosition - digits.length);
  } else {
    plain = `${digits.slice(0, pointPosition)}.${digits.slice(pointPosition)}`;
  }
  return negative ? `-${plain}` : plain;
}

/**
 * 把任意数值格式化为输出用的字符串。
 *
 * 参数：n 为待格式化的坐标/尺寸数值。
 * 返回：非有限值为 "0"；|n| >= 1e21 走普通十进制展开；
 *       其余走 `String(Number(n.toFixed(4)))`（4 位小数、去尾零、负零归零）。
 * 注意：【勿改·字节契约】三端共用，任何改动都会改变输出字节。
 */
export function fmtNumber(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (Math.abs(n) >= SCIENTIFIC_THRESHOLD) return toPlainInteger(n);
  return String(Number(n.toFixed(4)));
}

```

## src\core\index.ts
```ts
/**
 * core 层统一出口：IR 数据模型、策略与纯计算工具。
 *
 * 本层是整个库的地基，全部为纯计算、不碰 DOM，可被 Node 与浏览器共同使用。
 * DXF/SVG/Canvas 三端都从本层定义的 `DocumentData` 快照出发，并复用
 * `resolveCommandStyle` → `resolveAci` → `fmtNumber` 这条解析链，从而保证
 * 三端视觉与输出字节一致。
 */
export * from './types'; // DrawCommand 中间表示（IR）的全部类型定义
export * from './format'; // 数值格式化契约 fmtNumber（三端共享）
export * from './xml'; // SVG 文本/属性转义 escapeXml
export * from './theme'; // ACI 主题与深/浅色预置、跨 realm 品牌检测
export * from './text'; // 文本度量策略与各渲染端刻意不同的字号系数
export * from './decorations'; // 纸张/粗体装饰判定（IR 元数据优先）
export * from './document'; // DrawingDocument builder：累积命令并一次性应用偏移
export * from './data'; // DocumentLike 鸭子类型桥：统一取 DocumentData 快照
export * from './style'; // 图层索引与 BYLAYER（随层）颜色/线型解析

```

## src\core\style.ts
```ts
/**
 * 样式解析：把命令的「随层（BYLAYER）」颜色/线型解析成渲染端可用的具体值。
 *
 * DXF 通过省略组码 62/6 原生处理 BYLAYER，但 SVG 与 Canvas 渲染端必须自己
 * 到图层表里查值。因此这里被三端渲染路径共用，是一致性调用链的一环。
 */

import type { DrawCommand, LayerDef, Linetype } from './types';

/** 按名称索引的只读图层表。 */
export type LayerLookup = ReadonlyMap<string, LayerDef>;

/**
 * 按名称给图层定义建索引。
 *
 * 重名图层保留第一个定义，这与 LAYER 表写入时的顺序一致。
 * （注意：【勿改·历史兼容】addLayer 本身不去重，重复名称会全部保留。）
 */
export function createLayerLookup(layers: readonly LayerDef[]): LayerLookup {
  const lookup = new Map<string, LayerDef>();
  for (const layer of layers) {
    if (!lookup.has(layer.name)) lookup.set(layer.name, layer);
  }
  return lookup;
}

/** 一条命令解析后的有效样式。 */
export interface ResolvedCommandStyle {
  /** 有效 ACI 索引；`null` 表示仍是随层（BYLAYER）且没有图层定义。 */
  color: number | null;
  /** 有效线型；`null` 表示实线 / 无显式图元线型。 */
  linetype: Linetype | null;
}

/**
 * 为渲染端解析命令的随层颜色与线型。
 *
 * 优先级：命令自身的值 → 图层定义 → null（主题默认色 / 实线）。
 * DXF 靠省略组码原生实现，SVG/Canvas 则靠本函数查表。
 *
 * 参数：cmd 为待解析命令，layers 为按名索引的图层表。
 * 返回：有效颜色与线型。
 * 注意：【勿改·历史兼容】`color === 256` 在 DXF 语义里同样表示 BYLAYER，
 *       必须和 `null` 一样对待，不能当成真实颜色。
 */
export function resolveCommandStyle(
  cmd: DrawCommand,
  layers: LayerLookup
): ResolvedCommandStyle {
  // null 和 ACI 256 在 DXF 中都表示 BYLAYER（随层）。
  const isByLayerColor = cmd.color === null || cmd.color === 256;
  if (!isByLayerColor && cmd.linetype) {
    return { color: cmd.color, linetype: cmd.linetype };
  }

  const layer = layers.get(cmd.layer);
  const layerColor =
    layer && Number.isFinite(layer.color) ? Math.abs(layer.color) : null;
  const explicitColor = isByLayerColor ? null : cmd.color;
  return {
    color: explicitColor ?? layerColor,
    linetype: cmd.linetype ?? layer?.linetype ?? null,
  };
}

```

## src\core\text.ts
```ts
/**
 * 文本渲染度量策略（各输出端的字号/行距/字体栈参数）。
 *
 * 重要：这些系数在各输出端之间【刻意不同】。历史输出里 SVG 字号是
 * h * 1.04，而 Canvas 用 h * 1.05，两套字体栈也不一样。
 * 【勿改·历史兼容】不要把它们"统一"——字节与视觉一致性依赖这些精确值。
 */

/** 文本布局策略接口；各字段对应一个历史锁定值。 */
export interface TextMetricsPolicy {
  /** DXF/SVG/Canvas 默认宽度系数（STYLE 组码 41）。 */
  defaultWidthFactor: number;
  /** 仅 SVG：字号 = h * svgSizeFactor（历史值 1.04）。 */
  svgSizeFactor: number;
  /** 仅 Canvas：像素字号 = h * canvasSizeFactor（历史值 1.05）。 */
  canvasSizeFactor: number;
  /** 多行文本行距系数（历史值 1.35）。 */
  lineGapFactor: number;
  /** SVG 的 font-family 属性（历史字体栈含 SimSun）。 */
  svgFontFamily: string;
  /** Canvas 2D font 简写里的字体栈（历史字体栈不含 SimSun）。 */
  canvasFontFamily: string;
  /** 仅 Canvas：屏幕上字号低于此值的文本直接跳过。 */
  minCanvasFontPx: number;
}

/** 默认度量策略（冻结，防止被意外改写）。 */
export const DEFAULT_TEXT_METRICS: Readonly<TextMetricsPolicy> = Object.freeze({
  defaultWidthFactor: 0.85,
  svgSizeFactor: 1.04,
  canvasSizeFactor: 1.05,
  lineGapFactor: 1.35,
  svgFontFamily: 'Microsoft YaHei, SimSun, sans-serif',
  canvasFontFamily: '"Microsoft YaHei", sans-serif',
  minCanvasFontPx: 2.2,
});

```

## src\core\theme.ts
```ts
/**
 * ACI（AutoCAD Color Index）调色板，供 SVG/Canvas 渲染端把颜色索引换成 hex。
 *
 * 放在 `core` 而不是 `render`，是因为 SVG 序列化器也要用颜色；若放到
 * `render` 下会形成 `svg → render` 的循环依赖（破坏分层）。
 */

/** 一份主题定义：背景/纸张色 + ACI 索引到 hex 的映射。 */
export interface ThemeDefinition {
  name: string;
  isDark: boolean;
  /** 预览画布 / live 模式 SVG 的背景色。 */
  background: string;
  /** export 模式 SVG 的背景色（浅色主题导出到白纸上）。 */
  exportBackground: string;
  /** 图纸边框的纸张填充色。 */
  paper: string;
  /** 没有显式映射的 ACI 索引使用的兜底色。 */
  defaultColor: string;
  /** ACI 索引 → hex 颜色。 */
  aci: Readonly<Record<number, string>>;
}

/**
 * RenderTheme 实例的「跨 realm 品牌」标记。
 *
 * 同一个包被加载两次时（ESM + CJS，或不同子路径各引入一份），`instanceof`
 * 会失效。这里用 `Symbol.for` 从全局符号注册表取键，所有副本都能识别所有
 * 实例，从而让 `isRenderTheme` 的鸭子类型检查稳定工作。
 */
const RENDER_THEME_BRAND = Symbol.for('vecbridge.RenderTheme');

/** 主题对象：持有一份调色板并提供颜色解析/背景选择能力。 */
export class RenderTheme {
  readonly name: string;
  readonly isDark: boolean;
  readonly background: string;
  readonly exportBackground: string;
  readonly paper: string;
  readonly defaultColor: string;
  private readonly aciMap: Readonly<Record<number, string>>;

  /**
   * 从一份主题定义构造主题，并在实例上打跨 realm 品牌标记。
   */
  constructor(definition: ThemeDefinition) {
    Object.defineProperty(this, RENDER_THEME_BRAND, { value: true });
    this.name = definition.name;
    this.isDark = definition.isDark;
    this.background = definition.background;
    this.exportBackground = definition.exportBackground;
    this.paper = definition.paper;
    this.defaultColor = definition.defaultColor;
    this.aciMap = definition.aci;
  }

  /** 把 ACI 索引换成 hex；空值或未映射的索引返回兜底色。 */
  resolveAci(aci: number | null | undefined): string {
    if (aci === null || aci === undefined) return this.defaultColor;
    return this.aciMap[aci] ?? this.defaultColor;
  }

  /** 按模式取背景色：export 用 exportBackground，其余用 background。 */
  backgroundFor(mode: 'live' | 'export'): string {
    return mode === 'export' ? this.exportBackground : this.background;
  }
}

/** 预置深色主题。 */
export const DARK_THEME: RenderTheme = new RenderTheme({
  name: 'dark',
  isDark: true,
  background: '#111418',
  exportBackground: '#111418',
  paper: '#ffffff',
  defaultColor: '#f0f4f8',
  aci: { 1: '#ff3b30', 3: '#32d74b', 5: '#409cff', 8: '#76808f' },
});

/** 预置浅色主题（导出到白纸）。 */
export const LIGHT_THEME: RenderTheme = new RenderTheme({
  name: 'light',
  isDark: false,
  background: '#e5e7eb',
  exportBackground: '#ffffff',
  paper: '#ffffff',
  defaultColor: '#111827',
  aci: { 1: '#d92121', 3: '#168f33', 5: '#0f5acc', 8: '#6b7280' },
});

/**
 * 扩展深色主题：覆盖常用 AutoCAD ACI 调色板（红/黄/绿/青/蓝/品红/橙/紫/灰等），
 * 适用于多色 SVG / HTML DOM 转换结果在 DualViewPreview 中的高还原预览。
 */
export const EXTENDED_DARK_THEME: RenderTheme = new RenderTheme({
  name: 'extended-dark',
  isDark: true,
  background: '#111418',
  exportBackground: '#111418',
  paper: '#ffffff',
  defaultColor: '#f0f4f8',
  aci: {
    1: '#ff3b30',
    2: '#ffd60a',
    3: '#32d74b',
    4: '#5ac8fa',
    5: '#409cff',
    6: '#ff66d9',
    7: '#f0f4f8',
    8: '#76808f',
    9: '#b4bcc8',
    10: '#ff6961',
    14: '#d93829',
    30: '#ff9f0a',
    40: '#ffbe0b',
    52: '#b8b832',
    80: '#8ce02c',
    94: '#28a745',
    134: '#20b2aa',
    140: '#38bdf8',
    150: '#3b82f6',
    174: '#4f6bed',
    200: '#bf5af2',
    214: '#c056c0',
    240: '#ff375f',
    251: '#5a6270',
    253: '#a8b0bc',
  },
});

/**
 * 扩展浅色主题：覆盖常用 AutoCAD ACI 调色板并针对白底对比度优化，
 * 适用于多色 SVG / HTML DOM 转换结果在浅色打印预览下的高还原显示。
 */
export const EXTENDED_LIGHT_THEME: RenderTheme = new RenderTheme({
  name: 'extended-light',
  isDark: false,
  background: '#e5e7eb',
  exportBackground: '#ffffff',
  paper: '#ffffff',
  defaultColor: '#111827',
  aci: {
    1: '#d92121',
    2: '#b58900',
    3: '#168f33',
    4: '#0891b2',
    5: '#0f5acc',
    6: '#c026d3',
    7: '#111827',
    8: '#6b7280',
    9: '#9ca3af',
    10: '#ef4444',
    14: '#991b1b',
    30: '#ea580c',
    40: '#d97706',
    52: '#858500',
    80: '#65a30d',
    94: '#15803d',
    134: '#0f766e',
    140: '#0284c7',
    150: '#2563eb',
    174: '#1d4ed8',
    200: '#7c3aed',
    214: '#86198f',
    240: '#e11d48',
    251: '#4b5563',
    253: '#94a3b8',
  },
});

/** 主题入参：预置名或自定义主题对象。 */
export type ThemeInput = 'dark' | 'light' | RenderTheme;

/**
 * 鸭子类型判断一个值是否为 RenderTheme。
 *
 * 先试 `instanceof`，再用品牌符号探测——这样即使包被加载成多个实例
 * （ESM+CJS 或不同子路径）也能正确识别。库内部应优先用本函数而非 instanceof。
 */
export function isRenderTheme(value: unknown): value is RenderTheme {
  if (!value || typeof value !== 'object') return false;
  if (value instanceof RenderTheme) return true;
  return (value as Record<symbol, unknown>)[RENDER_THEME_BRAND] === true;
}

/** 把主题入参解析成 RenderTheme：对象直接用，'light' 取浅色，其余取深色。 */
export function resolveTheme(input?: ThemeInput): RenderTheme {
  if (isRenderTheme(input)) return input;
  if (input === 'light') return LIGHT_THEME;
  return DARK_THEME;
}

```

## src\core\types.ts
```ts
/**
 * 核心数据模型 —— DXF 序列化器、SVG 序列化器与 Canvas 渲染器共享的「单一事实源」。
 *
 * 这里定义的 `DrawCommand` 中间表示（IR）是整个库的枢纽：调用方先把图形累积成
 * 一组命令，再由三端消费者从同一份 IR 各自输出，从而天然保证三端一致。
 *
 * 字段命名刻意沿用旧实现里的 `drawCmds` 中间表示，这样从原实现抓取的文档
 * 可以逐字段比对（服务于输出字节稳定性契约）。
 */

export type Linetype = 'CONTINUOUS' | 'DASHED' | 'DOT';

/** DXF TEXT 水平对齐方式（对应组码 72）。 */
export type HAlign = 0 | 1 | 2;
/** DXF TEXT 垂直对齐方式（对应组码 73）。 */
export type VAlign = 0 | 1 | 2 | 3;

/** 一个二维点，[x, y]。 */
export type Point = readonly [number, number];

/** 图幅范围（世界坐标，单位 mm）。 */
export interface Extents {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** SVG 视口结构（x/y 为左上角，w/h 为宽高）。 */
export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 图层定义：名称 + ACI 颜色 + 线型。 */
export interface LayerDef {
  name: string;
  color: number;
  linetype: Linetype;
}

/** 所有图元命令的公共字段。 */
export interface CommandBase {
  /** 目标图层名。 */
  layer: string;
  /**
   * ACI 颜色索引。
   * `null` 表示「省略组码 62」，即随层（BYLAYER）；
   * `0` 是真实值 BYBLOCK，必须原样保留——二者语义不同，不可混为一谈。
   */
  color: number | null;
  /** 图元自己的线型（组码 6）；省略则随层/实线。 */
  linetype?: Linetype | null;
  /** 应用层私有载荷；序列化器一律忽略，不会写进输出。 */
  data?: Record<string, unknown>;
}

/** 线段命令：由 (x1,y1) 到 (x2,y2)。 */
export interface LineCommand extends CommandBase {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 圆命令：圆心 (cx,cy) 与半径 r。 */
export interface CircleCommand extends CommandBase {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

/** 折线命令：点集 points、是否闭合 closed、线宽 lineWidth。 */
export interface PolylineCommand extends CommandBase {
  type: 'polyline';
  points: readonly Point[];
  closed: boolean;
  lineWidth: number;
  /**
   * 渲染提示：这条 4 点闭合折线代表一张图纸。
   * Canvas/SVG 渲染器在浅色主题下可用纸张色填充它。
   */
  paper?: boolean;
}

/** 文本命令：插入点、字高、内容、旋转角与对齐方式等。 */
export interface TextCommand extends CommandBase {
  type: 'text';
  x: number;
  y: number;
  h: number;
  text: string;
  rot: number;
  hAlign: HAlign;
  vAlign: VAlign;
  widthFactor: number;
  /** 渲染提示：用粗体字重绘制。 */
  bold?: boolean;
}

/**
 * 实心填充命令：3 或 4 个按顺/逆时针轮廓顺序排列的顶点（对应 DXF R12 `SOLID` 实体）。
 *
 * IR 统一保存自然轮廓点序供 SVG/Canvas 直接填充；DXF 序列化端会在输出时自动映射为
 * AutoCAD R12 `SOLID` 要求的第 3/4 顶点交换顺序（三角形重复第 3 顶点）。
 */
export interface SolidCommand extends CommandBase {
  type: 'solid';
  points: readonly Point[];
}

/**
 * 全部图元命令的判别联合（discriminated union）。
 *
 * 消费者一律按 `type` 分支处理。新增图元种类时，必须同步修改所有
 * switch 分支（DXF/SVG/Canvas 三端），否则会漏输出。
 */
export type DrawCommand =
  | LineCommand
  | CircleCommand
  | PolylineCommand
  | TextCommand
  | SolidCommand;

/** 文档的可序列化普通快照：三端消费者共同的输入格式。 */
export interface DocumentData {
  layers: readonly LayerDef[];
  commands: readonly DrawCommand[];
  extents: Extents;
}

/**
 * 绘图目标的结构子集，供组合类助手（如填充图案）依赖。
 * `DrawingDocument` 实现了这个接口。
 *
 * 好处是 drawHatch 这类助手不依赖具体文档类，只要对象提供
 * addLine/addCircle/addPolyline 就能往里添加图元，从而进入三端同源流程。
 */
export interface DrawTarget {
  addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer?: string,
    color?: number | null,
    linetype?: Linetype | null
  ): unknown;
  addCircle(
    cx: number,
    cy: number,
    r: number,
    layer?: string,
    color?: number | null,
    linetype?: Linetype | null
  ): unknown;
  addPolyline(
    points: readonly Point[],
    layer?: string,
    color?: number | null,
    closed?: boolean,
    lineWidth?: number
  ): unknown;
}

```

## src\core\xml.ts
```ts
/**
 * 把值转义成可安全放进 SVG 文本节点或属性值的字符串。
 *
 * 依次替换 & < > " ' 五个字符，防止文本内容破坏 SVG 结构。
 */
export function escapeXml(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

```

## src\dom\borders.ts
```ts
/**
 * 边框几何、圆角采样、溢出矩形裁剪与表格重边合并算法。
 *
 * 全部为纯数学计算、无 DOM 依赖，既供 `to-document.ts` 消除表格重叠线，
 * 也供 `to-svg.ts` 生成圆角与边框路径。
 */

import { fmtNumber as fmt } from '../core/format';
import type { Linetype } from '../core/types';
import type { DomBorders, DomBorderSide, DomBorderStyle, DomRadii, DomRectMm } from './types';

export const ZERO_RADII: DomRadii = Object.freeze({
  tl: [0, 0] as const,
  tr: [0, 0] as const,
  br: [0, 0] as const,
  bl: [0, 0] as const,
});

/** 规范化 CSS border-style 值。 */
export function parseBorderStyle(raw: string | undefined | null): DomBorderStyle {
  if (!raw) return 'none';
  const s = raw.trim().toLowerCase();
  if (!s || s === 'none' || s === 'hidden') return 'none';
  if (s === 'dashed') return 'dashed';
  if (s === 'dotted') return 'dotted';
  if (s === 'double') return 'double';
  return 'solid';
}

/** 将边框样式映射为 DXF/IR 线型。 */
export function borderStyleToLinetype(style: DomBorderStyle): Linetype | null {
  if (style === 'dashed') return 'DASHED';
  if (style === 'dotted') return 'DOT';
  return null;
}

/** 判断单个边框是否可见。 */
export function isBorderVisible(side: DomBorderSide): boolean {
  return side.style !== 'none' && Number.isFinite(side.width) && side.width > 1e-4;
}

/** 判断四条边中是否存在至少一条可见边。 */
export function hasAnyBorder(borders: DomBorders): boolean {
  return (
    isBorderVisible(borders.top) ||
    isBorderVisible(borders.right) ||
    isBorderVisible(borders.bottom) ||
    isBorderVisible(borders.left)
  );
}

/** 判断四条边是否完全一致（宽度/样式/颜色相同且可见）。 */
export function areBordersUniform(borders: DomBorders): boolean {
  const { top, right, bottom, left } = borders;
  if (!isBorderVisible(top)) return false;
  const eq = (a: DomBorderSide, b: DomBorderSide): boolean =>
    a.style === b.style &&
    Math.abs(a.width - b.width) <= 1e-3 &&
    a.color.trim().toLowerCase() === b.color.trim().toLowerCase();
  return eq(top, right) && eq(top, bottom) && eq(top, left);
}

/** 判断是否存在任意大于阈值的圆角。 */
export function hasAnyRadius(radii: DomRadii): boolean {
  return (
    (radii.tl[0] > 1e-4 && radii.tl[1] > 1e-4) ||
    (radii.tr[0] > 1e-4 && radii.tr[1] > 1e-4) ||
    (radii.br[0] > 1e-4 && radii.br[1] > 1e-4) ||
    (radii.bl[0] > 1e-4 && radii.bl[1] > 1e-4)
  );
}

/** 按 CSS Backgrounds & Borders Level 3 规范比例缩减超限圆角。 */
export function normalizeRadii(rect: DomRectMm, radii: DomRadii): DomRadii {
  const w = Math.max(0, rect.w);
  const h = Math.max(0, rect.h);
  if (w <= 0 || h <= 0) return ZERO_RADII;

  const clampPair = (p: readonly [number, number]): [number, number] => [
    Math.max(0, Number.isFinite(p[0]) ? p[0] : 0),
    Math.max(0, Number.isFinite(p[1]) ? p[1] : 0),
  ];

  const tl = clampPair(radii.tl);
  const tr = clampPair(radii.tr);
  const br = clampPair(radii.br);
  const bl = clampPair(radii.bl);

  let factor = 1;
  const check = (sum: number, span: number): void => {
    if (sum > span && sum > 0) factor = Math.min(factor, span / sum);
  };
  check(tl[0] + tr[0], w);
  check(bl[0] + br[0], w);
  check(tl[1] + bl[1], h);
  check(tr[1] + br[1], h);

  if (factor < 1) {
    return {
      tl: [tl[0] * factor, tl[1] * factor],
      tr: [tr[0] * factor, tr[1] * factor],
      br: [br[0] * factor, br[1] * factor],
      bl: [bl[0] * factor, bl[1] * factor],
    };
  }
  return { tl, tr, br, bl };
}

/** 将圆角矩形离散为闭合点列（Y 向下毫米坐标，顺时针）。 */
export function sampleRoundedRectPoints(
  rect: DomRectMm,
  rawRadii: DomRadii,
  toleranceMm = 0.1
): Array<[number, number]> {
  const { x, y, w, h } = rect;
  const r = normalizeRadii(rect, rawRadii);
  const tol = Number.isFinite(toleranceMm) && toleranceMm > 1e-4 ? toleranceMm : 0.1;

  const pts: Array<[number, number]> = [];
  const push = (px: number, py: number): void => {
    const prev = pts[pts.length - 1];
    if (prev && Math.hypot(px - prev[0], py - prev[1]) <= 1e-6) return;
    pts.push([px, py]);
  };

  const sampleQuarter = (
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    startAngle: number,
    endAngle: number
  ): void => {
    if (rx <= 1e-5 || ry <= 1e-5) {
      push(cx + rx * Math.cos(endAngle), cy + ry * Math.sin(endAngle));
      return;
    }
    const maxR = Math.max(rx, ry);
    const stepAngle =
      maxR > tol ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tol / maxR))) : Math.PI / 4;
    const safeStep = Number.isFinite(stepAngle) && stepAngle > 1e-4 ? stepAngle : Math.PI / 8;
    const steps = Math.max(2, Math.min(32, Math.ceil(Math.abs(endAngle - startAngle) / safeStep)));
    for (let i = 1; i <= steps; i++) {
      const a = startAngle + ((endAngle - startAngle) * i) / steps;
      push(cx + rx * Math.cos(a), cy + ry * Math.sin(a));
    }
  };

  // Top edge -> Top-right arc
  push(x + r.tl[0], y);
  push(x + w - r.tr[0], y);
  sampleQuarter(x + w - r.tr[0], y + r.tr[1], r.tr[0], r.tr[1], -Math.PI / 2, 0);

  // Right edge -> Bottom-right arc
  push(x + w, y + h - r.br[1]);
  sampleQuarter(x + w - r.br[0], y + h - r.br[1], r.br[0], r.br[1], 0, Math.PI / 2);

  // Bottom edge -> Bottom-left arc
  push(x + r.bl[0], y + h);
  sampleQuarter(x + r.bl[0], y + h - r.bl[1], r.bl[0], r.bl[1], Math.PI / 2, Math.PI);

  // Left edge -> Top-left arc
  push(x, y + r.tl[1]);
  sampleQuarter(x + r.tl[0], y + r.tl[1], r.tl[0], r.tl[1], Math.PI, (Math.PI * 3) / 2);

  if (pts.length > 2) {
    const first = pts[0];
    const last = pts[pts.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-6) {
      pts.pop();
    }
  }
  return pts;
}

/** 生成圆角矩形的精确 SVG path `d` 属性字符串（Y 向下毫米坐标）。 */
export function roundedRectSvgPath(rect: DomRectMm, rawRadii: DomRadii): string {
  const { x, y, w, h } = rect;
  const r = normalizeRadii(rect, rawRadii);
  const parts: string[] = [];

  parts.push(`M${fmt(x + r.tl[0])},${fmt(y)}`);
  parts.push(`L${fmt(x + w - r.tr[0])},${fmt(y)}`);
  if (r.tr[0] > 1e-5 && r.tr[1] > 1e-5) {
    parts.push(`A${fmt(r.tr[0])},${fmt(r.tr[1])} 0 0 1 ${fmt(x + w)},${fmt(y + r.tr[1])}`);
  }
  parts.push(`L${fmt(x + w)},${fmt(y + h - r.br[1])}`);
  if (r.br[0] > 1e-5 && r.br[1] > 1e-5) {
    parts.push(`A${fmt(r.br[0])},${fmt(r.br[1])} 0 0 1 ${fmt(x + w - r.br[0])},${fmt(y + h)}`);
  }
  parts.push(`L${fmt(x + r.bl[0])},${fmt(y + h)}`);
  if (r.bl[0] > 1e-5 && r.bl[1] > 1e-5) {
    parts.push(`A${fmt(r.bl[0])},${fmt(r.bl[1])} 0 0 1 ${fmt(x)},${fmt(y + h - r.bl[1])}`);
  }
  parts.push(`L${fmt(x)},${fmt(y + r.tl[1])}`);
  if (r.tl[0] > 1e-5 && r.tl[1] > 1e-5) {
    parts.push(`A${fmt(r.tl[0])},${fmt(r.tl[1])} 0 0 1 ${fmt(x + r.tl[0])},${fmt(y)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

/** 计算两个矩形的交集；无交集返回 null。 */
export function intersectRects(a: DomRectMm, b: DomRectMm): DomRectMm | null {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 + 1e-6 || y2 <= y1 + 1e-6) return null;
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** 判断矩形是否完全落在裁剪矩形之外。 */
export function isRectOutsideClip(rect: DomRectMm, clip: DomRectMm): boolean {
  return (
    rect.x + rect.w <= clip.x + 1e-6 ||
    rect.x >= clip.x + clip.w - 1e-6 ||
    rect.y + rect.h <= clip.y + 1e-6 ||
    rect.y >= clip.y + clip.h - 1e-6
  );
}

/**
 * Liang-Barsky 线段矩形裁剪。
 *
 * 将线段 (x1,y1)-(x2,y2) 裁剪到矩形 `clip` 内部；完全在外部时返回 null。
 */
export function clipSegmentToRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  clip: DomRectMm
): [number, number, number, number] | null {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const minX = clip.x;
  const maxX = clip.x + clip.w;
  const minY = clip.y;
  const maxY = clip.y + clip.h;

  let t0 = 0;
  let t1 = 1;

  const test = (p: number, q: number): boolean => {
    if (Math.abs(p) <= 1e-12) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };

  if (
    !test(-dx, x1 - minX) ||
    !test(dx, maxX - x1) ||
    !test(-dy, y1 - minY) ||
    !test(dy, maxY - y1)
  ) {
    return null;
  }

  const cx1 = x1 + t0 * dx;
  const cy1 = y1 + t0 * dy;
  const cx2 = x1 + t1 * dx;
  const cy2 = y1 + t1 * dy;
  if (Math.hypot(cx2 - cx1, cy2 - cy1) <= 1e-5) return null;
  return [cx1, cy1, cx2, cy2];
}

/** 待合并的矢量边框线段（世界坐标）。 */
export interface AxisSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: string;
  color: number | null;
  linetype: Linetype | null;
  lineWidth: number;
}

/**
 * 对同图层、同色、同线型、同线宽桶的水平/垂直边框线段进行去重与共线区间合并。
 *
 * 解决 HTML `<table>` 相邻单元格共享边产生重复叠线的问题；斜线原样保留。
 */
export function mergeAxisAlignedSegments(
  segments: readonly AxisSegment[],
  eps = 0.08
): AxisSegment[] {
  const groups = new Map<string, { h: AxisSegment[]; v: AxisSegment[]; other: AxisSegment[] }>();

  const keyOf = (s: AxisSegment): string => {
    const wBucket = s.lineWidth > 0.35 ? Math.round(s.lineWidth * 20) : 0;
    return `${s.layer}\0${s.color ?? 'null'}\0${s.linetype ?? ''}\0${wBucket}`;
  };

  for (const seg of segments) {
    if (Math.hypot(seg.x2 - seg.x1, seg.y2 - seg.y1) <= 1e-5) continue;
    const key = keyOf(seg);
    let bucket = groups.get(key);
    if (!bucket) {
      bucket = { h: [], v: [], other: [] };
      groups.set(key, bucket);
    }
    if (Math.abs(seg.y1 - seg.y2) <= 1e-4) bucket.h.push(seg);
    else if (Math.abs(seg.x1 - seg.x2) <= 1e-4) bucket.v.push(seg);
    else bucket.other.push(seg);
  }

  const out: AxisSegment[] = [];

  for (const bucket of groups.values()) {
    // 1. 水平线段：按 y 聚类，再按 [minX, maxX] 合并重叠或首尾相接区间
    if (bucket.h.length > 0) {
      bucket.h.sort((a, b) => a.y1 - b.y1);
      let idx = 0;
      while (idx < bucket.h.length) {
        const refY = bucket.h[idx].y1;
        const cluster: Array<{ start: number; end: number; sample: AxisSegment }> = [];
        while (idx < bucket.h.length && bucket.h[idx].y1 - refY <= eps) {
          const seg = bucket.h[idx++];
          cluster.push({
            start: Math.min(seg.x1, seg.x2),
            end: Math.max(seg.x1, seg.x2),
            sample: seg,
          });
        }
        cluster.sort((a, b) => a.start - b.start);
        let curStart = cluster[0].start;
        let curEnd = cluster[0].end;
        const sample = cluster[0].sample;
        for (let i = 1; i < cluster.length; i++) {
          if (cluster[i].start <= curEnd + eps) {
            curEnd = Math.max(curEnd, cluster[i].end);
          } else {
            out.push({
              x1: curStart,
              y1: refY,
              x2: curEnd,
              y2: refY,
              layer: sample.layer,
              color: sample.color,
              linetype: sample.linetype,
              lineWidth: sample.lineWidth,
            });
            curStart = cluster[i].start;
            curEnd = cluster[i].end;
          }
        }
        out.push({
          x1: curStart,
          y1: refY,
          x2: curEnd,
          y2: refY,
          layer: sample.layer,
          color: sample.color,
          linetype: sample.linetype,
          lineWidth: sample.lineWidth,
        });
      }
    }

    // 2. 垂直线段：按 x 聚类，再按 [minY, maxY] 合并重叠或首尾相接区间
    if (bucket.v.length > 0) {
      bucket.v.sort((a, b) => a.x1 - b.x1);
      let idx = 0;
      while (idx < bucket.v.length) {
        const refX = bucket.v[idx].x1;
        const cluster: Array<{ start: number; end: number; sample: AxisSegment }> = [];
        while (idx < bucket.v.length && bucket.v[idx].x1 - refX <= eps) {
          const seg = bucket.v[idx++];
          cluster.push({
            start: Math.min(seg.y1, seg.y2),
            end: Math.max(seg.y1, seg.y2),
            sample: seg,
          });
        }
        cluster.sort((a, b) => a.start - b.start);
        let curStart = cluster[0].start;
        let curEnd = cluster[0].end;
        const sample = cluster[0].sample;
        for (let i = 1; i < cluster.length; i++) {
          if (cluster[i].start <= curEnd + eps) {
            curEnd = Math.max(curEnd, cluster[i].end);
          } else {
            out.push({
              x1: refX,
              y1: curStart,
              x2: refX,
              y2: curEnd,
              layer: sample.layer,
              color: sample.color,
              linetype: sample.linetype,
              lineWidth: sample.lineWidth,
            });
            curStart = cluster[i].start;
            curEnd = cluster[i].end;
          }
        }
        out.push({
          x1: refX,
          y1: curStart,
          x2: refX,
          y2: curEnd,
          layer: sample.layer,
          color: sample.color,
          linetype: sample.linetype,
          lineWidth: sample.lineWidth,
        });
      }
    }

    // 3. 斜线直接透传
    for (const seg of bucket.other) out.push(seg);
  }

  return out;
}

```

## src\dom\extract.ts
```ts
/**
 * 浏览器 DOM 布局提取器：遍历已挂载的 `Element`，通过原生 Web API
 *（getBoundingClientRect / getComputedStyle / Range.getClientRects / XMLSerializer）
 * 提取真实渲染几何与样式，产出可序列化的 `DomScene`。
 *
 * 仅在浏览器（或提供对应 DOM API 的环境）运行；不依赖任何第三方库。
 */

import { isTransparentColor } from '../core/color';
import { fmtNumber as fmt } from '../core/format';
import type { HAlign } from '../core/types';
import {
  hasAnyBorder,
  hasAnyRadius,
  intersectRects,
  isRectOutsideClip,
  parseBorderStyle,
  ZERO_RADII,
} from './borders';
import type {
  DomBorders,
  DomBorderSide,
  DomBoxNode,
  DomClipRect,
  DomConvertOptions,
  DomRadii,
  DomRectMm,
  DomScene,
  DomSceneNode,
} from './types';

const DEFAULT_PX_TO_MM = 25.4 / 96;

const SKIP_TAGS = new Set([
  'script',
  'style',
  'noscript',
  'template',
  'head',
  'meta',
  'link',
  'title',
  'defs',
  'colgroup',
  'col',
  'option',
  'optgroup',
]);

const SVG_PRESENTATION_TAGS = new Set([
  'line',
  'rect',
  'circle',
  'ellipse',
  'polyline',
  'polygon',
  'path',
  'text',
  'tspan',
]);

type Linear2D = readonly [number, number, number, number];
const IDENTITY_LINEAR: Linear2D = [1, 0, 0, 1];

interface ClientRectLike {
  left: number;
  top: number;
  width: number;
  height: number;
}

function parsePx(raw: string | undefined | null): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function parseBorderSide(
  widthRaw: string,
  styleRaw: string,
  colorRaw: string,
  pxToMm: number
): DomBorderSide {
  const style = parseBorderStyle(styleRaw);
  if (style === 'none' || isTransparentColor(colorRaw)) {
    return { width: 0, style: 'none', color: '' };
  }
  const width = parsePx(widthRaw) * pxToMm;
  if (width <= 1e-4) {
    return { width: 0, style: 'none', color: '' };
  }
  return { width, style, color: colorRaw };
}

function parseCornerRadius(
  raw: string | undefined,
  boxWpx: number,
  boxHpx: number,
  pxToMm: number
): readonly [number, number] {
  if (!raw) return [0, 0];
  const tokens = raw.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return [0, 0];

  const resolve = (token: string, refPx: number): number => {
    if (token.endsWith('%')) {
      const pct = Number.parseFloat(token);
      return Number.isFinite(pct) && pct > 0 ? (pct / 100) * refPx * pxToMm : 0;
    }
    return parsePx(token) * pxToMm;
  };

  const rx = resolve(tokens[0], boxWpx);
  const ry = resolve(tokens[1] ?? tokens[0], boxHpx);
  return [rx, ry];
}

function parseTransformLinear(raw: string | undefined): Linear2D {
  if (!raw || raw === 'none') return IDENTITY_LINEAR;
  const m2 = raw.match(/^matrix\s*\(([^)]+)\)$/);
  if (m2) {
    const nums = m2[1].split(/[,\s]+/).map(Number);
    if (nums.length >= 4 && nums.slice(0, 4).every(Number.isFinite)) {
      return [nums[0], nums[1], nums[2], nums[3]];
    }
  }
  const m3 = raw.match(/^matrix3d\s*\(([^)]+)\)$/);
  if (m3) {
    const nums = m3[1].split(/[,\s]+/).map(Number);
    if (nums.length >= 16 && [nums[0], nums[1], nums[4], nums[5]].every(Number.isFinite)) {
      return [nums[0], nums[1], nums[4], nums[5]];
    }
  }
  return IDENTITY_LINEAR;
}

function mulLinear(p: Linear2D, l: Linear2D): Linear2D {
  return [
    p[0] * l[0] + p[2] * l[1],
    p[1] * l[0] + p[3] * l[1],
    p[0] * l[2] + p[2] * l[3],
    p[1] * l[2] + p[3] * l[3],
  ];
}

function isRotatedOrSkewed(m: Linear2D): boolean {
  return Math.abs(m[1]) > 1e-3 || Math.abs(m[2]) > 1e-3;
}

function rotationDegFromLinear(m: Linear2D): number {
  if (Math.abs(m[1]) <= 1e-4 && m[0] >= 0) return 0;
  const deg = (-Math.atan2(m[1], m[0]) * 180) / Math.PI;
  return Math.abs(deg) < 1e-4 ? 0 : deg;
}

function isBoldWeight(raw: string | undefined): boolean {
  if (!raw) return false;
  const s = raw.trim().toLowerCase();
  if (s === 'bold' || s === 'bolder') return true;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 600;
}

function mapTextAlign(raw: string | undefined): HAlign {
  if (!raw) return 0;
  const s = raw.trim().toLowerCase();
  if (s === 'center' || s === '-webkit-center') return 1;
  if (s === 'right' || s === 'end') return 2;
  return 0;
}

function getElementLayoutSize(el: Element): { w: number; h: number } | null {
  const html = el as { offsetWidth?: unknown; offsetHeight?: unknown };
  if (
    typeof html.offsetWidth === 'number' &&
    typeof html.offsetHeight === 'number' &&
    html.offsetWidth > 0 &&
    html.offsetHeight > 0
  ) {
    return { w: html.offsetWidth, h: html.offsetHeight };
  }
  return null;
}

function parseSvgViewBox(
  svgEl: Element,
  fallbackW: number,
  fallbackH: number
): { x: number; y: number; w: number; h: number } {
  const vbRaw = svgEl.getAttribute('viewBox');
  if (vbRaw) {
    const nums = vbRaw
      .trim()
      .split(/[\s,]+/)
      .map(Number)
      .filter(Number.isFinite);
    if (nums.length >= 4 && nums[2] > 0 && nums[3] > 0) {
      return { x: nums[0], y: nums[1], w: nums[2], h: nums[3] };
    }
  }
  return {
    x: 0,
    y: 0,
    w: Math.max(1, fallbackW),
    h: Math.max(1, fallbackH),
  };
}

/** 克隆内嵌 `<svg>` 并内联关键计算样式，避免依赖外部 CSS 规则丢失样式。 */
function serializeEmbeddedSvg(
  svgEl: Element,
  win: Window,
  rectPx: ClientRectLike,
  rectMm: DomRectMm
): { markup: string; viewBox: { x: number; y: number; w: number; h: number } } {
  const viewBox = parseSvgViewBox(svgEl, rectPx.width, rectPx.height);
  const clone = svgEl.cloneNode(true) as Element;

  const copyStyles = (orig: Element, target: Element): void => {
    const tag = orig.tagName.toLowerCase();
    if (SVG_PRESENTATION_TAGS.has(tag)) {
      const cs = win.getComputedStyle(orig);
      const syncAttr = (attr: string, value: string | undefined): void => {
        if (!value || !value.trim()) return;
        if (!target.hasAttribute(attr)) target.setAttribute(attr, value);
      };
      if (cs.display === 'none') target.setAttribute('display', 'none');
      if (cs.visibility === 'hidden') target.setAttribute('visibility', 'hidden');
      syncAttr('stroke', cs.stroke);
      syncAttr('stroke-width', cs.strokeWidth);
      if (cs.strokeDasharray && cs.strokeDasharray !== 'none') {
        syncAttr('stroke-dasharray', cs.strokeDasharray);
      }
      syncAttr('fill', cs.fill);
      if (cs.opacity && cs.opacity !== '1') syncAttr('opacity', cs.opacity);
      if (tag === 'text' || tag === 'tspan') {
        syncAttr('font-size', cs.fontSize);
        syncAttr('font-weight', cs.fontWeight);
        syncAttr('text-anchor', cs.textAnchor);
        syncAttr('dominant-baseline', cs.dominantBaseline);
      }
    }

    const origChildren = orig.children;
    const targetChildren = target.children;
    const count = Math.min(origChildren.length, targetChildren.length);
    for (let i = 0; i < count; i++) {
      copyStyles(origChildren[i], targetChildren[i]);
    }
  };

  copyStyles(svgEl, clone);

  if (!clone.hasAttribute('xmlns')) {
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  }
  clone.setAttribute(
    'viewBox',
    `${fmt(viewBox.x)} ${fmt(viewBox.y)} ${fmt(viewBox.w)} ${fmt(viewBox.h)}`
  );
  clone.setAttribute('width', `${fmt(rectMm.w)}mm`);
  clone.setAttribute('height', `${fmt(rectMm.h)}mm`);

  let markup: string;
  const SerializerCtor = (win as unknown as { XMLSerializer?: typeof XMLSerializer })
    .XMLSerializer;
  if (typeof SerializerCtor === 'function') {
    markup = new SerializerCtor().serializeToString(clone);
  } else {
    markup = clone.outerHTML;
  }

  return { markup, viewBox };
}

function getNonEmptyClientRects(range: Range): ClientRectLike[] {
  if (typeof range.getClientRects !== 'function') return [];
  const list = range.getClientRects();
  const out: ClientRectLike[] = [];
  for (let i = 0; i < list.length; i++) {
    const r = list[i];
    if (r.width > 0.05 && r.height > 0.05) {
      out.push({ left: r.left, top: r.top, width: r.width, height: r.height });
    }
  }
  return out;
}

function unionClientRects(rects: readonly ClientRectLike[]): ClientRectLike | null {
  if (rects.length === 0) return null;
  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  for (const r of rects) {
    if (r.left < minL) minL = r.left;
    if (r.top < minT) minT = r.top;
    if (r.left + r.width > maxR) maxR = r.left + r.width;
    if (r.top + r.height > maxB) maxB = r.top + r.height;
  }
  return { left: minL, top: minT, width: maxR - minL, height: maxB - minT };
}

/**
 * 利用浏览器原生 Range API 将可能自动换行的单个 Text 节点拆分为逐行视觉片段。
 * 单行文本走 O(1) 快路径；多行文本按字符偏移二分查找断点，复杂度 O(L log N)。
 */
function extractVisualTextLines(
  textNode: Text,
  ownerDoc: Document,
  preserveWs: boolean,
  fallbackRect: ClientRectLike | null
): Array<{ text: string; rect: ClientRectLike }> {
  const raw = textNode.nodeValue ?? '';
  if (!preserveWs && !raw.trim()) return [];
  if (preserveWs && raw.length === 0) return [];

  const range = ownerDoc.createRange();
  range.selectNodeContents(textNode);
  const allRects = getNonEmptyClientRects(range);

  if (allRects.length === 0) {
    const bound =
      typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
    const usable =
      bound && bound.width > 0.05 && bound.height > 0.05
        ? { left: bound.left, top: bound.top, width: bound.width, height: bound.height }
        : fallbackRect;
    if (!usable) return [];
    const cleaned = preserveWs ? raw.replace(/\r\n|\r/g, '\n') : raw.replace(/\s+/g, ' ').trim();
    if (!cleaned) return [];
    return [{ text: cleaned, rect: usable }];
  }

  // 快路径：所有文本落在同一行（覆盖表格单元格与标签的绝大多数情况）
  const firstTop = allRects[0].top;
  const lineTol = Math.max(2, allRects[0].height * 0.45);
  const allSameLine =
    (!preserveWs || !raw.includes('\n')) &&
    allRects.every((r) => Math.abs(r.top - firstTop) <= lineTol);

  if (allSameLine) {
    const union = unionClientRects(allRects);
    const cleaned = preserveWs ? raw.replace(/\r\n|\r/g, '') : raw.replace(/\s+/g, ' ').trim();
    if (!union || !cleaned) return [];
    return [{ text: cleaned, rect: union }];
  }

  // 多行路径：按视觉行二分查找行末字符偏移
  const lines: Array<{ text: string; rect: ClientRectLike }> = [];
  const len = raw.length;
  let lineStart = 0;

  while (lineStart < len) {
    if (!preserveWs) {
      while (lineStart < len && /\s/.test(raw[lineStart])) lineStart++;
    } else if (raw[lineStart] === '\r' || raw[lineStart] === '\n') {
      lineStart++;
      continue;
    }
    if (lineStart >= len) break;

    range.setStart(textNode, lineStart);
    range.setEnd(textNode, lineStart + 1);
    const charRects = getNonEmptyClientRects(range);
    if (charRects.length === 0) {
      lineStart++;
      continue;
    }

    const baseTop = charRects[0].top;
    const baseTol = Math.max(2, charRects[0].height * 0.45);

    // 若 preserveWs 且存在显式换行符，行尾不能越过换行符
    let maxEnd = len;
    if (preserveWs) {
      const nl = raw.indexOf('\n', lineStart);
      if (nl !== -1) maxEnd = nl;
    }

    let lo = lineStart + 1;
    let hi = maxEnd;
    let best = lo;

    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      range.setStart(textNode, lineStart);
      range.setEnd(textNode, mid);
      const rects = getNonEmptyClientRects(range);
      const sameLine = rects.every((r) => Math.abs(r.top - baseTop) <= baseTol);
      if (sameLine) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }

    range.setStart(textNode, lineStart);
    range.setEnd(textNode, best);
    const lineRect = unionClientRects(getNonEmptyClientRects(range)) ?? charRects[0];
    const slice = raw.slice(lineStart, best);
    const cleaned = preserveWs ? slice.replace(/\r/g, '') : slice.replace(/\s+/g, ' ').trim();
    if (cleaned) {
      lines.push({ text: cleaned, rect: lineRect });
    }

    lineStart = best;
    if (preserveWs && lineStart < len && raw[lineStart] === '\n') {
      lineStart++;
    }
  }

  return lines;
}

/**
 * 竖排文字提取：处理 `writing-mode: vertical-rl / vertical-lr / sideways-rl / sideways-lr`。
 *
 * - `sideways-*` 按竖列输出旋转 90°/-90° 的整列文本；
 * - `vertical-*` 按竖列拆出每个直立字符（CJK 竖排字形保持直立，沿列自上而下排布）。
 */
function extractVerticalTextEntries(
  textNode: Text,
  ownerDoc: Document,
  preserveWs: boolean,
  writingMode: string,
  fallbackRect: ClientRectLike | null
): Array<{ text: string; rect: ClientRectLike; rot: number }> {
  const raw = textNode.nodeValue ?? '';
  if (!preserveWs && !raw.trim()) return [];
  if (preserveWs && raw.length === 0) return [];

  const isSideways = writingMode.startsWith('sideways-');
  const sidewaysRot = writingMode === 'sideways-lr' ? 90 : -90;

  const range = ownerDoc.createRange();
  range.selectNodeContents(textNode);
  const allRects = getNonEmptyClientRects(range);

  // 拆分为按 X 列分组的视觉竖列
  const columns: Array<{ text: string; start: number; end: number; rect: ClientRectLike }> = [];
  if (allRects.length === 0) {
    const bound =
      typeof range.getBoundingClientRect === 'function' ? range.getBoundingClientRect() : null;
    const usable =
      bound && bound.width > 0.05 && bound.height > 0.05
        ? { left: bound.left, top: bound.top, width: bound.width, height: bound.height }
        : fallbackRect;
    const cleaned = preserveWs ? raw.replace(/\r\n|\r/g, '') : raw.replace(/\s+/g, ' ').trim();
    if (usable && cleaned) {
      columns.push({ text: cleaned, start: 0, end: raw.length, rect: usable });
    }
  } else {
    const firstLeft = allRects[0].left;
    const colTol = Math.max(2, allRects[0].width * 0.45);
    const allSameCol =
      (!preserveWs || !raw.includes('\n')) &&
      allRects.every((r) => Math.abs(r.left - firstLeft) <= colTol);

    if (allSameCol) {
      const union = unionClientRects(allRects);
      const cleaned = preserveWs ? raw.replace(/\r\n|\r/g, '') : raw.replace(/\s+/g, ' ').trim();
      if (union && cleaned) {
        columns.push({ text: cleaned, start: 0, end: raw.length, rect: union });
      }
    } else {
      const len = raw.length;
      let colStart = 0;
      while (colStart < len) {
        if (!preserveWs) {
          while (colStart < len && /\s/.test(raw[colStart])) colStart++;
        } else if (raw[colStart] === '\r' || raw[colStart] === '\n') {
          colStart++;
          continue;
        }
        if (colStart >= len) break;

        range.setStart(textNode, colStart);
        range.setEnd(textNode, colStart + 1);
        const charRects = getNonEmptyClientRects(range);
        if (charRects.length === 0) {
          colStart++;
          continue;
        }
        const baseLeft = charRects[0].left;
        const baseTol = Math.max(2, charRects[0].width * 0.45);
        let maxEnd = len;
        if (preserveWs) {
          const nl = raw.indexOf('\n', colStart);
          if (nl !== -1) maxEnd = nl;
        }

        let lo = colStart + 1;
        let hi = maxEnd;
        let best = lo;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          range.setStart(textNode, colStart);
          range.setEnd(textNode, mid);
          const rects = getNonEmptyClientRects(range);
          const sameCol = rects.every((r) => Math.abs(r.left - baseLeft) <= baseTol);
          if (sameCol) {
            best = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }

        range.setStart(textNode, colStart);
        range.setEnd(textNode, best);
        const colRect = unionClientRects(getNonEmptyClientRects(range)) ?? charRects[0];
        const slice = raw.slice(colStart, best);
        const cleaned = preserveWs ? slice.replace(/\r/g, '') : slice.replace(/\s+/g, ' ').trim();
        if (cleaned) {
          columns.push({ text: cleaned, start: colStart, end: best, rect: colRect });
        }

        colStart = best;
        if (preserveWs && colStart < len && raw[colStart] === '\n') colStart++;
      }
    }
  }

  const out: Array<{ text: string; rect: ClientRectLike; rot: number }> = [];
  for (const col of columns) {
    if (isSideways) {
      out.push({ text: col.text, rect: col.rect, rot: sidewaysRot });
      continue;
    }

    // vertical-rl / vertical-lr：逐字直立排布（优先读取单字 Range 盒，回退均匀竖排）
    const chars = Array.from(col.text);
    const total = chars.length;
    if (total === 0) continue;

    let offset = col.start;
    const stepH = col.rect.height / total;
    for (let i = 0; i < total; i++) {
      const ch = chars[i];
      const charLen = ch.length;
      const charStart = raw.indexOf(ch, offset);
      const nextOffset = charStart >= 0 ? charStart + charLen : offset + charLen;

      if (ch.trim()) {
        let charRect: ClientRectLike | null = null;
        if (charStart >= 0 && charStart + charLen <= raw.length) {
          range.setStart(textNode, charStart);
          range.setEnd(textNode, charStart + charLen);
          const measured = unionClientRects(getNonEmptyClientRects(range));
          if (measured && measured.height < col.rect.height * 0.85) {
            charRect = measured;
          }
        }
        if (!charRect) {
          charRect = {
            left: col.rect.left,
            top: col.rect.top + i * stepH,
            width: col.rect.width,
            height: stepH,
          };
        }
        out.push({ text: ch, rect: charRect, rot: 0 });
      }
      offset = nextOffset;
    }
  }

  return out;
}

/** 转为字母序列表记（1 -> a, 26 -> z, 27 -> aa）。 */
function toAlphaCounter(num: number, upper: boolean): string {
  if (!Number.isInteger(num) || num <= 0) return String(num);
  let n = num;
  let out = '';
  while (n > 0) {
    n -= 1;
    out = String.fromCharCode((upper ? 65 : 97) + (n % 26)) + out;
    n = Math.floor(n / 26);
  }
  return out;
}

/** 转为罗马数字列表标记（1..3999）。 */
function toRomanCounter(num: number, upper: boolean): string {
  if (!Number.isInteger(num) || num <= 0 || num > 3999) return String(num);
  const table: ReadonlyArray<readonly [number, string]> = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];
  let rem = num;
  let res = '';
  for (const [val, sym] of table) {
    while (rem >= val) {
      res += sym;
      rem -= val;
    }
  }
  return upper ? res : res.toLowerCase();
}

/** 转为简易中文序号（1..99，如 一、二、十二、）。 */
function toCjkCounter(num: number): string {
  if (!Number.isInteger(num) || num <= 0 || num > 99) return `${num}.`;
  const digits = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (num < 10) return `${digits[num]}、`;
  const tens = Math.floor(num / 10);
  const ones = num % 10;
  return `${tens === 1 ? '' : digits[tens]}十${digits[ones]}、`;
}

/** 计算当前 `<li>` 在所属 `<ol>` 中的逻辑序号（支持 start / reversed / value 属性）。 */
function computeListItemIndex(li: Element): number {
  const parent = li.parentElement;
  if (!parent) return 1;

  const isOl = parent.tagName.toLowerCase() === 'ol';
  const listItems: Element[] = [];
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].tagName.toLowerCase() === 'li') {
      listItems.push(parent.children[i]);
    }
  }

  const reversed = isOl && parent.hasAttribute('reversed');
  const startAttr = isOl ? parent.getAttribute('start') : null;
  const parsedStart = startAttr !== null ? Number.parseInt(startAttr, 10) : NaN;
  let current = Number.isFinite(parsedStart)
    ? parsedStart
    : reversed
      ? listItems.length
      : 1;
  const step = reversed ? -1 : 1;

  for (let i = 0; i < listItems.length; i++) {
    const item = listItems[i];
    const valAttr = item.getAttribute('value');
    const parsedVal = valAttr !== null ? Number.parseInt(valAttr, 10) : NaN;
    if (Number.isFinite(parsedVal)) current = parsedVal;
    if (item === li) return current;
    current += step;
  }
  return 1;
}

/** 提取 `<li>` / `display: list-item` 的圆点、方块或编号标记。 */
function extractListMarker(
  el: Element,
  style: CSSStyleDeclaration,
  rectMm: DomRectMm,
  pxToMm: number,
  clipId: string | null,
  layerHint: string | null,
  opacity: number,
  rot: number,
  nodes: DomSceneNode[]
): void {
  let listType = (style.listStyleType || '').trim().toLowerCase();
  if (!listType) {
    const parentTag = el.parentElement?.tagName.toLowerCase();
    listType = parentTag === 'ol' ? 'decimal' : 'disc';
  }
  if (listType === 'none') return;

  const color = style.color || '#111827';
  const fontSizeMm = Math.max(0.5, (parsePx(style.fontSize) || 14) * pxToMm);
  const fontFamily = style.fontFamily || 'Microsoft YaHei, sans-serif';
  const bold = isBoldWeight(style.fontWeight);
  const italic = style.fontStyle === 'italic' || style.fontStyle === 'oblique';
  const padTopMm = (parsePx(style.paddingTop) + parsePx(style.borderTopWidth)) * pxToMm;
  const padLeftMm = (parsePx(style.paddingLeft) + parsePx(style.borderLeftWidth)) * pxToMm;
  const lineHeightPx = parsePx(style.lineHeight);
  const firstLineH = lineHeightPx > 0 ? lineHeightPx * pxToMm : fontSizeMm * 1.35;
  const markerY = rectMm.y + padTopMm + Math.min(firstLineH, rectMm.h) * 0.5;
  const isInside = (style.listStylePosition || '').trim().toLowerCase() === 'inside';

  if (listType === 'disc' || listType === 'circle') {
    const r = Math.max(0.35, fontSizeMm * 0.16);
    const cx = isInside ? rectMm.x + padLeftMm + r * 1.5 : rectMm.x - fontSizeMm * 0.55;
    nodes.push({
      kind: 'circle',
      cx,
      cy: markerY,
      r,
      strokeColor: color,
      strokeWidth: Math.max(0.18, r * 0.35),
      fillColor: listType === 'disc' ? color : null,
      clipId,
      layerHint,
      opacity,
    });
    return;
  }

  if (listType === 'square') {
    const s = Math.max(0.7, fontSizeMm * 0.32);
    const cx = isInside ? rectMm.x + padLeftMm + s * 0.8 : rectMm.x - fontSizeMm * 0.55;
    const side: DomBorderSide = { width: Math.max(0.18, s * 0.2), style: 'solid', color };
    nodes.push({
      kind: 'box',
      rect: { x: cx - s * 0.5, y: markerY - s * 0.5, w: s, h: s },
      backgroundColor: color,
      borders: { top: side, right: side, bottom: side, left: side },
      radii: ZERO_RADII,
      clipId,
      layerHint,
      opacity,
    });
    return;
  }

  const idx = computeListItemIndex(el);
  let markerText = `${idx}.`;
  switch (listType) {
    case 'decimal':
      markerText = `${idx}.`;
      break;
    case 'decimal-leading-zero':
      markerText = `${idx >= 0 && idx < 10 ? '0' + idx : idx}.`;
      break;
    case 'lower-alpha':
    case 'lower-latin':
      markerText = `${toAlphaCounter(idx, false)}.`;
      break;
    case 'upper-alpha':
    case 'upper-latin':
      markerText = `${toAlphaCounter(idx, true)}.`;
      break;
    case 'lower-roman':
      markerText = `${toRomanCounter(idx, false)}.`;
      break;
    case 'upper-roman':
      markerText = `${toRomanCounter(idx, true)}.`;
      break;
    case 'cjk-ideographic':
    case 'simp-chinese-informal':
    case 'trad-chinese-informal':
      markerText = toCjkCounter(idx);
      break;
    default:
      markerText = `${idx}.`;
      break;
  }

  const anchorX = isInside ? rectMm.x + padLeftMm : rectMm.x - fontSizeMm * 0.35;
  const hAlign: HAlign = isInside ? 0 : 2;
  const approxW = markerText.length * fontSizeMm * 0.6;
  nodes.push({
    kind: 'text',
    text: markerText,
    rect: {
      x: hAlign === 2 ? anchorX - approxW : anchorX,
      y: markerY - fontSizeMm * 0.5,
      w: approxW,
      h: fontSizeMm,
    },
    x: anchorX,
    y: markerY,
    fontSize: fontSizeMm,
    fontFamily,
    bold,
    italic,
    color,
    hAlign,
    vAlign: 2,
    rot,
    clipId,
    layerHint,
    opacity,
  });
}

/** 判断元素是否只包含单一有效文本节点（用于启用居中/右对齐 CAD 锚点优化）。 */
function isSingleTextContainer(el: Element): boolean {
  let textCount = 0;
  for (let i = 0; i < el.childNodes.length; i++) {
    const child = el.childNodes[i];
    if (child.nodeType === 1) return false;
    if (child.nodeType === 3 && (child.nodeValue ?? '').trim().length > 0) {
      textCount++;
      if (textCount > 1) return false;
    }
  }
  return textCount === 1;
}

/**
 * 从浏览器已挂载的 HTML `Element` 提取真实布局场景 `DomScene`。
 *
 * 参数：element 为根元素（需已挂载到文档中以便测量布局）；options 为缩放、过滤与裁剪选项。
 * 返回：所有坐标均已转换为根相对毫米（Y 轴向下）的纯 JSON 场景快照。
 */
export function extractDomScene(
  element: Element,
  options: DomConvertOptions = {}
): DomScene {
  const ownerDoc = element?.ownerDocument;
  const win = ownerDoc?.defaultView ?? (typeof window !== 'undefined' ? window : null);
  if (!ownerDoc || !win || typeof win.getComputedStyle !== 'function') {
    throw new Error(
      'HTML DOM extraction requires a browser DOM environment with getComputedStyle().'
    );
  }

  const rootRectRaw = element.getBoundingClientRect();
  const rootFallback = getElementLayoutSize(element);
  const rootWpx = rootRectRaw.width > 0 ? rootRectRaw.width : (rootFallback?.w ?? 0);
  const rootHpx = rootRectRaw.height > 0 ? rootRectRaw.height : (rootFallback?.h ?? 0);

  if (rootWpx <= 0 || rootHpx <= 0) {
    return { widthMm: 0, heightMm: 0, pxToMm: DEFAULT_PX_TO_MM, clips: [], nodes: [] };
  }

  let pxToMm = DEFAULT_PX_TO_MM;
  if (Number.isFinite(options.fitWidthMm) && (options.fitWidthMm as number) > 0) {
    pxToMm = (options.fitWidthMm as number) / rootWpx;
  } else if (Number.isFinite(options.pxToMm) && (options.pxToMm as number) > 0) {
    pxToMm = options.pxToMm as number;
  }

  const rootLeft = rootRectRaw.left;
  const rootTop = rootRectRaw.top;
  const widthMm = rootWpx * pxToMm;
  const heightMm = rootHpx * pxToMm;
  const clipOverflow = options.clipOverflow ?? true;
  const mediaMode = options.mediaMode ?? 'ignore';

  const toMmRect = (r: ClientRectLike): DomRectMm => ({
    x: (r.left - rootLeft) * pxToMm,
    y: (r.top - rootTop) * pxToMm,
    w: r.width * pxToMm,
    h: r.height * pxToMm,
  });

  const clips: DomClipRect[] = [];
  const nodes: DomSceneNode[] = [];
  let clipCounter = 0;

  const walk = (
    el: Element,
    isRoot: boolean,
    parentOpacity: number,
    parentLayerHint: string | null,
    parentLinear: Linear2D,
    activeClip: DomClipRect | null
  ): void => {
    const tag = el.tagName.toLowerCase();
    if (SKIP_TAGS.has(tag)) return;

    const ignoreAttr = el.getAttribute('data-dxf-ignore');
    if (ignoreAttr !== null && ignoreAttr.toLowerCase() !== 'false') return;
    if (!isRoot && options.filter && options.filter(el) === false) return;

    const style = win.getComputedStyle(el);
    if (style.display === 'none') return;
    const isHidden = style.visibility === 'hidden' || style.visibility === 'collapse';

    const localOpacity = style.opacity !== '' ? Number.parseFloat(style.opacity) : 1;
    const opacity =
      parentOpacity * (Number.isFinite(localOpacity) ? Math.max(0, Math.min(1, localOpacity)) : 1);
    if (opacity <= 0.001) return;

    const ownLayer =
      el.getAttribute('data-dxf-layer') ||
      el.getAttribute('data-layer') ||
      (el.id ? el.id : null);
    const layerHint = ownLayer ? ownLayer.trim() : parentLayerHint;

    const linear = mulLinear(parentLinear, parseTransformLinear(style.transform));
    const rectRaw = el.getBoundingClientRect();
    const rectPx: ClientRectLike =
      rectRaw.width > 0 || rectRaw.height > 0
        ? { left: rectRaw.left, top: rectRaw.top, width: rectRaw.width, height: rectRaw.height }
        : isRoot
          ? { left: rootLeft, top: rootTop, width: rootWpx, height: rootHpx }
          : { left: rectRaw.left, top: rectRaw.top, width: 0, height: 0 };
    const rectMm = toMmRect(rectPx);

    const clipId = activeClip?.id ?? null;

    // 1. 内嵌 <svg> 直接整体克隆并内联样式，不再按 HTML 遍历其子节点
    if (tag === 'svg') {
      if (isHidden || rectMm.w <= 1e-4 || rectMm.h <= 1e-4) return;
      if (activeClip && isRectOutsideClip(rectMm, activeClip.rect)) return;
      const { markup, viewBox } = serializeEmbeddedSvg(el, win, rectPx, rectMm);
      nodes.push({
        kind: 'svg',
        rect: rectMm,
        markup,
        viewBox,
        clipId,
        layerHint,
        opacity,
      });
      return;
    }

    // 2. 水平分隔线 <hr>
    if (tag === 'hr') {
      if (isHidden || rectMm.w <= 1e-4) return;
      if (activeClip && isRectOutsideClip(rectMm, activeClip.rect)) return;
      const borderTop = parseBorderSide(
        style.borderTopWidth,
        style.borderTopStyle,
        style.borderTopColor,
        pxToMm
      );
      const cy = rectMm.y + rectMm.h * 0.5;
      nodes.push({
        kind: 'line',
        x1: rectMm.x,
        y1: cy,
        x2: rectMm.x + rectMm.w,
        y2: cy,
        width: borderTop.width > 0 ? borderTop.width : Math.max(0.2, rectMm.h),
        style: borderTop.style !== 'none' ? borderTop.style : 'solid',
        color: borderTop.color || style.color || '#666666',
        clipId,
        layerHint,
        opacity,
      });
      return;
    }

    // 3. 位图与画布元素 <img> / <canvas>
    if (tag === 'img' || tag === 'canvas') {
      if (isHidden || rectMm.w <= 1e-4 || rectMm.h <= 1e-4) return;
      if (activeClip && isRectOutsideClip(rectMm, activeClip.rect)) return;
      if (mediaMode !== 'ignore') {
        let dataUrl: string | null = null;
        let label = tag === 'img' ? 'IMG' : 'CANVAS';
        if (tag === 'img') {
          const img = el as HTMLImageElement;
          label = img.alt?.trim() || 'IMG';
          if (mediaMode === 'embed') {
            dataUrl = img.currentSrc || img.getAttribute('src') || null;
          }
        } else {
          const canvas = el as HTMLCanvasElement;
          label = canvas.getAttribute('aria-label')?.trim() || 'CANVAS';
          if (mediaMode === 'embed' && typeof canvas.toDataURL === 'function') {
            try {
              dataUrl = canvas.toDataURL('image/png');
            } catch {
              dataUrl = null;
            }
          }
        }
        nodes.push({
          kind: 'media',
          mediaType: tag as 'img' | 'canvas',
          rect: rectMm,
          label,
          dataUrl,
          clipId,
          layerHint,
          opacity,
        });
      }
      return;
    }

    // 4. 盒子背景与边框提取（仅在自身可见且尺寸有效时输出）
    const borders: DomBorders = {
      top: parseBorderSide(style.borderTopWidth, style.borderTopStyle, style.borderTopColor, pxToMm),
      right: parseBorderSide(
        style.borderRightWidth,
        style.borderRightStyle,
        style.borderRightColor,
        pxToMm
      ),
      bottom: parseBorderSide(
        style.borderBottomWidth,
        style.borderBottomStyle,
        style.borderBottomColor,
        pxToMm
      ),
      left: parseBorderSide(
        style.borderLeftWidth,
        style.borderLeftStyle,
        style.borderLeftColor,
        pxToMm
      ),
    };

    const radii: DomRadii =
      rectPx.width > 0 && rectPx.height > 0
        ? {
            tl: parseCornerRadius(style.borderTopLeftRadius, rectPx.width, rectPx.height, pxToMm),
            tr: parseCornerRadius(style.borderTopRightRadius, rectPx.width, rectPx.height, pxToMm),
            br: parseCornerRadius(
              style.borderBottomRightRadius,
              rectPx.width,
              rectPx.height,
              pxToMm
            ),
            bl: parseCornerRadius(
              style.borderBottomLeftRadius,
              rectPx.width,
              rectPx.height,
              pxToMm
            ),
          }
        : ZERO_RADII;

    const bgColor = isTransparentColor(style.backgroundColor) ? null : style.backgroundColor;
    const hasVisualBox =
      !isHidden &&
      rectMm.w > 1e-4 &&
      rectMm.h > 1e-4 &&
      (isRoot || bgColor !== null || hasAnyBorder(borders));

    if (hasVisualBox && (!activeClip || !isRectOutsideClip(rectMm, activeClip.rect))) {
      let quad: DomBoxNode['quad'];
      if (isRotatedOrSkewed(linear)) {
        const localSize = getElementLayoutSize(el);
        if (localSize) {
          const cx = rectMm.x + rectMm.w * 0.5;
          const cy = rectMm.y + rectMm.h * 0.5;
          const hw = localSize.w * 0.5 * pxToMm;
          const hh = localSize.h * 0.5 * pxToMm;
          const pt = (lx: number, ly: number): readonly [number, number] => [
            cx + linear[0] * lx + linear[2] * ly,
            cy + linear[1] * lx + linear[3] * ly,
          ];
          quad = [pt(-hw, -hh), pt(hw, -hh), pt(hw, hh), pt(-hw, hh)];
        }
      }

      nodes.push({
        kind: 'box',
        rect: rectMm,
        isRoot: isRoot || undefined,
        backgroundColor: bgColor,
        borders,
        radii,
        quad,
        clipId,
        layerHint,
        opacity,
      });
    }

    // 4.5 列表项标记（<li> 或 display: list-item 的圆点/方块/序号）
    if (
      !isHidden &&
      (tag === 'li' || (style.display || '').toLowerCase() === 'list-item') &&
      rectMm.w > 1e-4 &&
      rectMm.h > 1e-4 &&
      (!activeClip || !isRectOutsideClip(rectMm, activeClip.rect))
    ) {
      extractListMarker(
        el,
        style,
        rectMm,
        pxToMm,
        clipId,
        layerHint,
        opacity,
        rotationDegFromLinear(linear),
        nodes
      );
    }

    // 5. 表单控件内容提取（<input> / <textarea> / <select>）
    if (!isHidden && (tag === 'input' || tag === 'textarea' || tag === 'select')) {
      if (!activeClip || !isRectOutsideClip(rectMm, activeClip.rect)) {
        extractFormControl(
          el,
          tag,
          style,
          rectMm,
          pxToMm,
          clipId,
          layerHint,
          opacity,
          rotationDegFromLinear(linear),
          nodes
        );
      }
      return;
    }

    // 6. 计算子节点裁剪框（overflow: hidden / clip / scroll / auto）
    let childClip = activeClip;
    if (clipOverflow && !isRoot && rectMm.w > 1e-4 && rectMm.h > 1e-4) {
      const ovx = (style.overflowX || style.overflow || '').toLowerCase();
      const ovy = (style.overflowY || style.overflow || '').toLowerCase();
      const clipsContent =
        ovx === 'hidden' ||
        ovx === 'clip' ||
        ovx === 'scroll' ||
        ovx === 'auto' ||
        ovy === 'hidden' ||
        ovy === 'clip' ||
        ovy === 'scroll' ||
        ovy === 'auto';
      if (clipsContent) {
        const innerRect: DomRectMm = {
          x: rectMm.x + borders.left.width,
          y: rectMm.y + borders.top.width,
          w: Math.max(0, rectMm.w - borders.left.width - borders.right.width),
          h: Math.max(0, rectMm.h - borders.top.width - borders.bottom.width),
        };
        const merged = activeClip ? intersectRects(activeClip.rect, innerRect) : innerRect;
        if (!merged) return; // 子树完全被裁剪，提前终止
        const nextClip: DomClipRect = {
          id: `dom-clip-${++clipCounter}`,
          rect: merged,
          radii: !activeClip && hasAnyRadius(radii) ? radii : undefined,
        };
        clips.push(nextClip);
        childClip = nextClip;
      }
    }

    // 7. 遍历子节点（按 DOM 顺序处理元素与文本节点）
    const singleTextOnly = isSingleTextContainer(el);
    const rotDeg = rotationDegFromLinear(linear);
    const fontSizeMm = Math.max(0.5, (parsePx(style.fontSize) || 14) * pxToMm);
    const fontFamily = style.fontFamily || 'Microsoft YaHei, sans-serif';
    const bold = isBoldWeight(style.fontWeight);
    const italic = style.fontStyle === 'italic' || style.fontStyle === 'oblique';
    const textColor = style.color || '#111827';
    const preserveWs = /^(pre|pre-wrap|break-spaces)$/i.test(style.whiteSpace || '');
    const writingMode = (style.writingMode || '').trim().toLowerCase();
    const isVerticalWriting =
      writingMode === 'vertical-rl' ||
      writingMode === 'vertical-lr' ||
      writingMode === 'sideways-rl' ||
      writingMode === 'sideways-lr';

    const padLeftPx = parsePx(style.paddingLeft) + parsePx(style.borderLeftWidth);
    const padRightPx = parsePx(style.paddingRight) + parsePx(style.borderRightWidth);
    const padTopPx = parsePx(style.paddingTop) + parsePx(style.borderTopWidth);
    const padBottomPx = parsePx(style.paddingBottom) + parsePx(style.borderBottomWidth);
    const contentFallbackPx: ClientRectLike | null =
      rectPx.width > 0 && rectPx.height > 0
        ? {
            left: rectPx.left + padLeftPx,
            top: rectPx.top + padTopPx,
            width: Math.max(1, rectPx.width - padLeftPx - padRightPx),
            height: Math.max(1, rectPx.height - padTopPx - padBottomPx),
          }
        : null;

    for (let i = 0; i < el.childNodes.length; i++) {
      const child = el.childNodes[i];
      if (child.nodeType === 1) {
        walk(child as Element, false, opacity, layerHint, linear, childClip);
      } else if (child.nodeType === 3 && !isHidden) {
        if (isVerticalWriting && Math.abs(rotDeg) <= 0.1) {
          const vEntries = extractVerticalTextEntries(
            child as Text,
            ownerDoc,
            preserveWs,
            writingMode,
            singleTextOnly ? contentFallbackPx : null
          );
          for (const entry of vEntries) {
            const lineMm = toMmRect(entry.rect);
            if (childClip && isRectOutsideClip(lineMm, childClip.rect)) continue;
            nodes.push({
              kind: 'text',
              text: entry.text,
              rect: lineMm,
              x: lineMm.x + lineMm.w * 0.5,
              y: lineMm.y + lineMm.h * 0.5,
              fontSize: fontSizeMm,
              fontFamily,
              bold,
              italic,
              color: textColor,
              hAlign: 1,
              vAlign: 2,
              rot: entry.rot,
              clipId: childClip?.id ?? null,
              layerHint,
              opacity,
            });
          }
        } else {
          const lines = extractVisualTextLines(
            child as Text,
            ownerDoc,
            preserveWs,
            singleTextOnly ? contentFallbackPx : null
          );
          for (const line of lines) {
            const lineMm = toMmRect(line.rect);
            if (childClip && isRectOutsideClip(lineMm, childClip.rect)) continue;

            let hAlign: HAlign = 0;
            let anchorX = lineMm.x;
            const anchorY = lineMm.y + lineMm.h * 0.5;

            if (Math.abs(rotDeg) > 0.1) {
              hAlign = 1;
              anchorX = lineMm.x + lineMm.w * 0.5;
            } else if (singleTextOnly) {
              hAlign = mapTextAlign(style.textAlign);
              if (hAlign === 1) anchorX = lineMm.x + lineMm.w * 0.5;
              else if (hAlign === 2) anchorX = lineMm.x + lineMm.w;
            }

            nodes.push({
              kind: 'text',
              text: line.text,
              rect: lineMm,
              x: anchorX,
              y: anchorY,
              fontSize: fontSizeMm,
              fontFamily,
              bold,
              italic,
              color: textColor,
              hAlign,
              vAlign: 2,
              rot: rotDeg,
              clipId: childClip?.id ?? null,
              layerHint,
              opacity,
            });
          }
        }
      }
    }
  };

  walk(element, true, 1, null, IDENTITY_LINEAR, null);

  return { widthMm, heightMm, pxToMm, clips, nodes };
}

/** 提取表单控件（input / textarea / select）的值文本与勾选矢量。 */
function extractFormControl(
  el: Element,
  tag: string,
  style: CSSStyleDeclaration,
  rectMm: DomRectMm,
  pxToMm: number,
  clipId: string | null,
  layerHint: string | null,
  opacity: number,
  rot: number,
  nodes: DomSceneNode[]
): void {
  const color = style.color || '#111827';
  const fontSizeMm = Math.max(0.5, (parsePx(style.fontSize) || 13) * pxToMm);
  const fontFamily = style.fontFamily || 'Microsoft YaHei, sans-serif';
  const bold = isBoldWeight(style.fontWeight);
  const italic = style.fontStyle === 'italic' || style.fontStyle === 'oblique';

  if (tag === 'input') {
    const input = el as HTMLInputElement;
    const type = (input.type || 'text').toLowerCase();
    if (type === 'hidden') return;

    if (type === 'checkbox') {
      const s = Math.min(rectMm.w, rectMm.h);
      const bx = rectMm.x + (rectMm.w - s) * 0.5;
      const by = rectMm.y + (rectMm.h - s) * 0.5;
      const side: DomBorderSide = { width: Math.max(0.2, s * 0.08), style: 'solid', color };
      nodes.push({
        kind: 'box',
        rect: { x: bx, y: by, w: s, h: s },
        backgroundColor: null,
        borders: { top: side, right: side, bottom: side, left: side },
        radii: ZERO_RADII,
        clipId,
        layerHint,
        opacity,
      });
      if (input.checked) {
        const w = Math.max(0.25, s * 0.12);
        nodes.push({
          kind: 'line',
          x1: bx + s * 0.2,
          y1: by + s * 0.52,
          x2: bx + s * 0.42,
          y2: by + s * 0.76,
          width: w,
          style: 'solid',
          color,
          clipId,
          layerHint,
          opacity,
        });
        nodes.push({
          kind: 'line',
          x1: bx + s * 0.42,
          y1: by + s * 0.76,
          x2: bx + s * 0.82,
          y2: by + s * 0.26,
          width: w,
          style: 'solid',
          color,
          clipId,
          layerHint,
          opacity,
        });
      }
      return;
    }

    if (type === 'radio') {
      const r = Math.min(rectMm.w, rectMm.h) * 0.46;
      const cx = rectMm.x + rectMm.w * 0.5;
      const cy = rectMm.y + rectMm.h * 0.5;
      nodes.push({
        kind: 'circle',
        cx,
        cy,
        r,
        strokeColor: color,
        strokeWidth: Math.max(0.2, r * 0.16),
        fillColor: null,
        clipId,
        layerHint,
        opacity,
      });
      if (input.checked) {
        nodes.push({
          kind: 'circle',
          cx,
          cy,
          r: r * 0.45,
          strokeColor: color,
          strokeWidth: Math.max(0.2, r * 0.2),
          fillColor: color,
          clipId,
          layerHint,
          opacity,
        });
      }
      return;
    }

    const rawValue =
      type === 'password' ? '•'.repeat(input.value.length) : input.value || input.placeholder || '';
    if (!rawValue.trim()) return;
    const isPlaceholder = !input.value && !!input.placeholder;
    const padL = (parsePx(style.paddingLeft) + parsePx(style.borderLeftWidth)) * pxToMm;
    const padR = (parsePx(style.paddingRight) + parsePx(style.borderRightWidth)) * pxToMm;
    const hAlign = mapTextAlign(style.textAlign);
    const contentW = Math.max(0.5, rectMm.w - padL - padR);
    const x =
      hAlign === 1
        ? rectMm.x + padL + contentW * 0.5
        : hAlign === 2
          ? rectMm.x + rectMm.w - padR
          : rectMm.x + padL;

    nodes.push({
      kind: 'text',
      text: rawValue,
      rect: { x: rectMm.x + padL, y: rectMm.y, w: contentW, h: rectMm.h },
      x,
      y: rectMm.y + rectMm.h * 0.5,
      fontSize: fontSizeMm,
      fontFamily,
      bold,
      italic,
      color: isPlaceholder ? '#888888' : color,
      hAlign,
      vAlign: 2,
      rot,
      clipId,
      layerHint,
      opacity,
    });
    return;
  }

  if (tag === 'select') {
    const select = el as HTMLSelectElement;
    const opt = select.options?.[select.selectedIndex];
    const text = opt?.text?.trim() ?? '';
    if (!text) return;
    const padL = (parsePx(style.paddingLeft) + parsePx(style.borderLeftWidth)) * pxToMm;
    nodes.push({
      kind: 'text',
      text,
      rect: rectMm,
      x: rectMm.x + padL,
      y: rectMm.y + rectMm.h * 0.5,
      fontSize: fontSizeMm,
      fontFamily,
      bold,
      italic,
      color,
      hAlign: 0,
      vAlign: 2,
      rot,
      clipId,
      layerHint,
      opacity,
    });
    return;
  }

  if (tag === 'textarea') {
    const area = el as HTMLTextAreaElement;
    const rawValue = area.value || area.placeholder || '';
    if (!rawValue.trim()) return;
    const isPlaceholder = !area.value && !!area.placeholder;
    const padL = (parsePx(style.paddingLeft) + parsePx(style.borderLeftWidth)) * pxToMm;
    const padT = (parsePx(style.paddingTop) + parsePx(style.borderTopWidth)) * pxToMm;
    const padB = (parsePx(style.paddingBottom) + parsePx(style.borderBottomWidth)) * pxToMm;
    const lineHeightPx = parsePx(style.lineHeight);
    const lineStepMm = lineHeightPx > 0 ? lineHeightPx * pxToMm : fontSizeMm * 1.35;
    const maxY = rectMm.y + rectMm.h - padB;

    const lines = rawValue.split(/\r\n|\r|\n/);
    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i].trimEnd();
      const y = rectMm.y + padT + lineStepMm * (i + 0.5);
      if (y > maxY) break;
      if (!lineText) continue;
      nodes.push({
        kind: 'text',
        text: lineText,
        rect: { x: rectMm.x + padL, y: y - lineStepMm * 0.5, w: rectMm.w - padL, h: lineStepMm },
        x: rectMm.x + padL,
        y,
        fontSize: fontSizeMm,
        fontFamily,
        bold,
        italic,
        color: isPlaceholder ? '#888888' : color,
        hAlign: 0,
        vAlign: 2,
        rot,
        clipId,
        layerHint,
        opacity,
      });
    }
  }
}

```

## src\dom\html.ts
```ts
/**
 * 离屏 HTML 字符串转换器（仅浏览器 / 含真实布局的 DOM 环境）。
 *
 * 将 HTML 片段或完整 HTML 文档挂载到屏幕外固定定位容器中（不设置 visibility:hidden
 * 或 display:none，确保布局与样式正常计算），提取完成后在 `finally` 中可靠销毁容器。
 */

import type { DrawingDocument } from '../core/document';
import { DxfSerializer } from '../dxf/serializer';
import { SvgSerializer } from '../svg/serializer';
import { extractDomScene } from './extract';
import { sceneToDocument } from './to-document';
import { sceneToVisualSvg } from './to-svg';
import type {
  DomScene,
  HtmlConvertOptions,
  HtmlToDxfOptions,
  HtmlToSvgOptions,
} from './types';

function parseHtmlPayload(html: string): { bodyHtml: string; extractedCss: string } {
  const cssParts: string[] = [];
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m: RegExpExecArray | null;
    while ((m = styleRe.exec(headMatch[1])) !== null) {
      if (m[1].trim()) cssParts.push(m[1]);
    }
  }

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return {
    bodyHtml: bodyMatch ? bodyMatch[1] : html,
    extractedCss: cssParts.join('\n'),
  };
}

/**
 * 在浏览器离屏容器中挂载 HTML 字符串并提取 `DomScene`，结束后自动清理临时 DOM。
 */
export function extractHtmlScene(
  html: string,
  options: HtmlConvertOptions = {}
): DomScene {
  const targetDoc =
    options.document ?? (typeof document !== 'undefined' ? document : null);
  if (!targetDoc || typeof targetDoc.createElement !== 'function') {
    throw new Error(
      'Offscreen HTML conversion requires a browser Document. ' +
        'Run in a browser/headless browser or pass options.document.'
    );
  }
  const mount = targetDoc.body ?? targetDoc.documentElement;
  if (!mount) {
    throw new Error('Target Document has no body or documentElement to mount offscreen HTML.');
  }

  const widthPx =
    Number.isFinite(options.widthPx) && (options.widthPx as number) > 0
      ? (options.widthPx as number)
      : 794;
  const { bodyHtml, extractedCss } = parseHtmlPayload(String(html ?? ''));
  const combinedCss = [extractedCss, options.css ?? ''].filter((s) => s.trim().length > 0).join('\n');

  const host = targetDoc.createElement('div');
  host.setAttribute('data-dxf-offscreen-host', 'true');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-2147483648';
  host.style.boxSizing = 'border-box';

  if (combinedCss) {
    const styleEl = targetDoc.createElement('style');
    styleEl.textContent = combinedCss;
    host.appendChild(styleEl);
  }

  const contentRoot = targetDoc.createElement('div');
  contentRoot.style.width = `${widthPx}px`;
  contentRoot.style.boxSizing = 'border-box';
  contentRoot.innerHTML = bodyHtml;
  host.appendChild(contentRoot);

  mount.appendChild(host);
  try {
    options.beforeExtract?.(contentRoot);
    return extractDomScene(contentRoot, options);
  } finally {
    host.remove();
  }
}

/** 将 HTML 字符串通过离屏挂载转换为统一 IR `DrawingDocument`。 */
export function htmlToDocument(
  html: string,
  options: HtmlConvertOptions = {}
): DrawingDocument {
  const scene = extractHtmlScene(html, options);
  return sceneToDocument(scene, options);
}

/** 将 HTML 字符串通过离屏挂载转换为纯矢量 SVG（支持 `visual` 与 `cad` 双模式）。 */
export function htmlToSvg(html: string, options: HtmlToSvgOptions = {}): string {
  const mode = options.mode ?? 'visual';
  const scene = extractHtmlScene(html, {
    ...options,
    mediaMode: options.mediaMode ?? (mode === 'visual' ? 'embed' : 'ignore'),
  });

  if (mode === 'cad') {
    const doc = sceneToDocument(scene, options);
    return new SvgSerializer().serialize(doc, {
      theme: 'light',
      mode: 'export',
      ...options.svgOptions,
    });
  }

  return sceneToVisualSvg(scene, options);
}

/** 将 HTML 字符串通过离屏挂载一步转换为 DXF R12 文本。 */
export function htmlToDxfText(html: string, options: HtmlToDxfOptions = {}): string {
  const doc = htmlToDocument(html, options);
  return new DxfSerializer({ codec: options.codec }).serialize(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

/** 将 HTML 字符串通过离屏挂载一步转换为编码后的 DXF R12 字节流（默认 GBK）。 */
export function htmlToDxfBytes(html: string, options: HtmlToDxfOptions = {}): Uint8Array {
  const doc = htmlToDocument(html, options);
  return new DxfSerializer({ codec: options.codec }).toBytes(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

```

## src\dom\index.ts
```ts
/**
 * 浏览器 HTML DOM 转换层统一出口（`vecbridge/dom`）。
 *
 * 将浏览器中已挂载的 HTML 元素直接转换为：
 * - `DrawingDocument` IR（`domToDocument`）——可接入 `DualViewPreview` 双引擎预览与二次标注；
 * - 纯矢量 SVG（`domToSvg`，支持高保真 `visual` 与 IR 同源 `cad` 双模式，无 `<foreignObject>`）；
 * - AutoCAD R12 DXF（`domToDxfText` / `domToDxfBytes` / `downloadDomAsDxf`）。
 *
 * 同时导出纯计算函数 `sceneToDocument` 与 `sceneToVisualSvg`，支持在 Playwright/Puppeteer
 * 中提取 `DomScene` JSON 后回传 Node 端批量出图。
 */

import { downloadBytes } from '../browser';
import { DxfSerializer } from '../dxf/serializer';
import { extractDomScene } from './extract';
import { domToDocument, sceneToDocument } from './to-document';
import { domToSvg, sceneToVisualSvg } from './to-svg';
import type {
  DomConvertOptions,
  DomToDxfOptions,
  DownloadDomDxfOptions,
  DownloadDomSvgOptions,
} from './types';

export * from './types';
export { extractDomScene } from './extract';
export { domToDocument, sceneToDocument } from './to-document';
export { domToSvg, sceneToVisualSvg } from './to-svg';
export {
  extractHtmlScene,
  htmlToDocument,
  htmlToDxfBytes,
  htmlToDxfText,
  htmlToSvg,
} from './html';
export {
  clipSegmentToRect,
  mergeAxisAlignedSegments,
  roundedRectSvgPath,
  sampleRoundedRectPoints,
  type AxisSegment,
} from './borders';

function pickConvertOptions(options: DomToDxfOptions): DomConvertOptions {
  return {
    pxToMm: options.pxToMm,
    fitWidthMm: options.fitWidthMm,
    layerBy: options.layerBy,
    defaultLayer: options.defaultLayer,
    backgroundMode: options.backgroundMode,
    markRootPaper: options.markRootPaper,
    dedupeBorders: options.dedupeBorders,
    curveTolerance: options.curveTolerance,
    fontSizeScale: options.fontSizeScale,
    mediaMode: options.mediaMode,
    clipOverflow: options.clipOverflow,
    filter: options.filter,
    maxPrimitives: options.maxPrimitives,
  };
}

/** 将浏览器已挂载的 HTML `Element` 直接转换为 DXF R12 文本。 */
export function domToDxfText(element: Element, options: DomToDxfOptions = {}): string {
  const doc = domToDocument(element, pickConvertOptions(options));
  return new DxfSerializer({ codec: options.codec }).serialize(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

/** 将浏览器已挂载的 HTML `Element` 直接转换为编码后的 DXF R12 字节流（默认 GBK）。 */
export function domToDxfBytes(element: Element, options: DomToDxfOptions = {}): Uint8Array {
  const doc = domToDocument(element, pickConvertOptions(options));
  return new DxfSerializer({ codec: options.codec }).toBytes(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

/** 一步将 HTML `Element` 转换并触发浏览器下载为 `.dxf` 文件。 */
export function downloadDomAsDxf(element: Element, options: DownloadDomDxfOptions): void {
  const { filename, mimeType, revokeDelayMs, ...convertAndDxfOptions } = options;
  const bytes = domToDxfBytes(element, convertAndDxfOptions);
  downloadBytes(new Blob([bytes as BlobPart], { type: mimeType ?? 'application/dxf' }), {
    filename,
    revokeDelayMs,
  });
}

/** 一步将 HTML `Element` 转换并触发浏览器下载为纯矢量 `.svg` 文件。 */
export function downloadDomAsSvg(element: Element, options: DownloadDomSvgOptions): void {
  const { filename, mimeType, revokeDelayMs, ...svgOptions } = options;
  const text = domToSvg(element, svgOptions);
  downloadBytes(new Blob([text], { type: mimeType ?? 'image/svg+xml;charset=utf-8' }), {
    filename,
    revokeDelayMs,
  });
}

```

## src\dom\to-document.ts
```ts
/**
 * 将 `DomScene`（或浏览器 `Element`）转换为统一的 `DrawingDocument`（IR）。
 *
 * `sceneToDocument()` 纯计算、环境无关，Node 与浏览器均可直接调用；
 * `domToDocument()` 组合 `extractDomScene()` 与 `sceneToDocument()`。
 */

import {
  colorToAci,
  isNearWhiteRgb,
  parseColorRgba,
  sanitizeLayerCandidate,
} from '../core/color';
import { DrawingDocument } from '../core/document';
import type { Linetype } from '../core/types';
import { drawHatch } from '../patterns/hatch';
import { parseSvgToDocument } from '../svg/parser';
import {
  borderStyleToLinetype,
  clipSegmentToRect,
  hasAnyBorder,
  hasAnyRadius,
  intersectRects,
  isBorderVisible,
  isRectOutsideClip,
  mergeAxisAlignedSegments,
  sampleRoundedRectPoints,
  type AxisSegment,
} from './borders';
import { extractDomScene } from './extract';
import type {
  DomBackgroundMode,
  DomBorders,
  DomBorderSide,
  DomClipRect,
  DomConvertOptions,
  DomLayerStrategy,
  DomMediaMode,
  DomRectMm,
  DomScene,
  DomSvgNode,
  DomTextNode,
} from './types';

function pickDominantBorder(borders: DomBorders): DomBorderSide | null {
  for (const side of [borders.top, borders.right, borders.bottom, borders.left]) {
    if (isBorderVisible(side)) return side;
  }
  return null;
}

/**
 * 纯计算转换：将 `DomScene` 场景快照转为 `DrawingDocument` IR。
 *
 * 两阶段输出：先输出纸张/背景/边框/内嵌 SVG/媒体占位并执行表格重边合并，
 * 再统一输出文本命令，确保文字始终清晰叠放于表格边框之上。
 */
export function sceneToDocument(
  scene: DomScene,
  options: DomConvertOptions = {}
): DrawingDocument {
  const doc = new DrawingDocument();
  const widthMm = Number.isFinite(scene.widthMm) && scene.widthMm > 0 ? scene.widthMm : 1;
  const heightMm = Number.isFinite(scene.heightMm) && scene.heightMm > 0 ? scene.heightMm : 1;
  doc.setExtents(0, 0, widthMm, heightMm);

  if (scene.nodes.length === 0) return doc;

  const layerBy: DomLayerStrategy = options.layerBy ?? 'semantic';
  const defaultLayer = sanitizeLayerCandidate(options.defaultLayer, '0');
  const backgroundMode: DomBackgroundMode = options.backgroundMode ?? 'ignore';
  const markRootPaper = options.markRootPaper ?? true;
  const dedupeBorders = options.dedupeBorders ?? true;
  const curveTolerance =
    Number.isFinite(options.curveTolerance) && (options.curveTolerance as number) > 0
      ? (options.curveTolerance as number)
      : 0.1;
  const fontSizeScale =
    Number.isFinite(options.fontSizeScale) && (options.fontSizeScale as number) > 0
      ? (options.fontSizeScale as number)
      : 0.78;
  const mediaMode: DomMediaMode = options.mediaMode ?? 'ignore';
  const clipOverflow = options.clipOverflow ?? true;
  const maxPrimitives =
    options.maxPrimitives === undefined
      ? 200_000
      : Number.isFinite(options.maxPrimitives) && options.maxPrimitives > 0
        ? Math.floor(options.maxPrimitives)
        : 0;

  const clipMap = new Map<string, DomClipRect>();
  for (const clip of scene.clips) clipMap.set(clip.id, clip);

  const registeredLayers = new Set<string>(['0']);
  const resolveLayer = (
    semanticName: string,
    hint: string | null | undefined,
    color: number,
    linetype: Linetype | null
  ): string => {
    let candidate = defaultLayer;
    if (layerBy === 'semantic') {
      candidate = hint ? sanitizeLayerCandidate(hint, semanticName) : semanticName;
    } else if (layerBy === 'id') {
      candidate = sanitizeLayerCandidate(hint, defaultLayer);
    } else if (layerBy === 'color') {
      candidate = `COLOR_${color}`;
    }
    const safe = sanitizeLayerCandidate(candidate, defaultLayer);
    if (!registeredLayers.has(safe)) {
      registeredLayers.add(safe);
      doc.addLayer(safe, color, linetype ?? 'CONTINUOUS');
    }
    return safe;
  };

  let emitted = 0;
  const canEmit = (): boolean => maxPrimitives === 0 || emitted < maxPrimitives;
  const remaining = (): number =>
    maxPrimitives === 0 ? 0 : Math.max(0, maxPrimitives - emitted);

  const toWorldY = (yMm: number): number => heightMm - yMm;
  const pendingSegments: AxisSegment[] = [];
  const pendingTexts: DomTextNode[] = [];

  const pushBorderSegment = (
    x1Mm: number,
    y1Mm: number,
    x2Mm: number,
    y2Mm: number,
    layer: string,
    color: number,
    linetype: Linetype | null,
    lineWidth: number,
    clip: DomRectMm | null
  ): void => {
    let sx1 = x1Mm;
    let sy1 = y1Mm;
    let sx2 = x2Mm;
    let sy2 = y2Mm;
    if (clip) {
      const clipped = clipSegmentToRect(sx1, sy1, sx2, sy2, clip);
      if (!clipped) return;
      [sx1, sy1, sx2, sy2] = clipped;
    }

    const wy1 = toWorldY(sy1);
    const wy2 = toWorldY(sy2);

    if (dedupeBorders) {
      pendingSegments.push({
        x1: sx1,
        y1: wy1,
        x2: sx2,
        y2: wy2,
        layer,
        color,
        linetype,
        lineWidth,
      });
    } else if (canEmit()) {
      if (lineWidth > 0.35) {
        doc.addPolyline(
          [
            [sx1, wy1],
            [sx2, wy2],
          ],
          layer,
          color,
          false,
          lineWidth,
          linetype ? { linetype } : undefined
        );
      } else {
        doc.addLine(sx1, wy1, sx2, wy2, layer, color, linetype);
      }
      emitted++;
    }
  };

  const emitEmbeddedSvg = (node: DomSvgNode, clip: DomRectMm | null): void => {
    if (!canEmit()) return;
    if (clip && isRectOutsideClip(node.rect, clip)) return;
    const vb = node.viewBox;
    if (vb.w <= 0 || vb.h <= 0 || node.rect.w <= 0 || node.rect.h <= 0) return;

    const scale = Math.min(node.rect.w / vb.w, node.rect.h / vb.h);
    const renderedW = vb.w * scale;
    const renderedH = vb.h * scale;
    const padX = (node.rect.w - renderedW) * 0.5;
    const padY = (node.rect.h - renderedH) * 0.5;
    const shiftX = node.rect.x + padX - vb.x * scale;
    const shiftY = heightMm - (node.rect.y + padY + renderedH);

    const svgDefaultLayer = resolveLayer('DOM_SVG', node.layerHint, 7, null);
    const subDoc = parseSvgToDocument(node.markup, {
      yAxis: 'flip-viewbox',
      scale,
      curveTolerance,
      layerBy: layerBy === 'single' ? 'single' : layerBy === 'color' ? 'color' : 'group-id',
      defaultLayer: svgDefaultLayer,
      ignoreBackground: true,
      maxPrimitives: remaining(),
    });

    for (const lay of subDoc.layers) {
      if (!registeredLayers.has(lay.name)) {
        registeredLayers.add(lay.name);
        doc.addLayer(lay.name, lay.color, lay.linetype);
      }
    }

    for (const cmd of subDoc.commands) {
      if (!canEmit()) break;
      const targetLayer = layerBy === 'single' ? defaultLayer : cmd.layer;
      switch (cmd.type) {
        case 'line':
          doc.addLine(
            cmd.x1 + shiftX,
            cmd.y1 + shiftY,
            cmd.x2 + shiftX,
            cmd.y2 + shiftY,
            targetLayer,
            cmd.color,
            cmd.linetype ?? null
          );
          emitted++;
          break;
        case 'circle':
          doc.addCircle(
            cmd.cx + shiftX,
            cmd.cy + shiftY,
            cmd.r,
            targetLayer,
            cmd.color,
            cmd.linetype ?? null
          );
          emitted++;
          break;
        case 'polyline':
          doc.addPolyline(
            cmd.points.map(([px, py]) => [px + shiftX, py + shiftY] as const),
            targetLayer,
            cmd.color,
            cmd.closed,
            cmd.lineWidth,
            cmd.linetype ? { linetype: cmd.linetype } : undefined
          );
          emitted++;
          break;
        case 'text':
          doc.addText(
            cmd.x + shiftX,
            cmd.y + shiftY,
            cmd.h,
            cmd.text,
            targetLayer,
            cmd.color,
            cmd.rot,
            cmd.hAlign,
            cmd.vAlign,
            cmd.widthFactor,
            cmd.bold ? { bold: true } : undefined
          );
          emitted++;
          break;
        case 'solid':
          doc.addSolid(
            cmd.points.map(([px, py]) => [px + shiftX, py + shiftY] as const),
            targetLayer,
            cmd.color
          );
          emitted++;
          break;
      }
    }
  };

  // Pass 1: 纸张/背景/边框/线条/圆/内嵌 SVG/媒体占位
  for (const node of scene.nodes) {
    if (!canEmit()) break;

    if (node.kind === 'text') {
      pendingTexts.push(node);
      continue;
    }

    const clip = clipOverflow && node.clipId ? (clipMap.get(node.clipId)?.rect ?? null) : null;

    if (node.kind === 'box') {
      if (clip && isRectOutsideClip(node.rect, clip)) continue;

      const bgRgba = parseColorRgba(node.backgroundColor);
      const hasVisibleBg = !!bgRgba && bgRgba[3] > 0.01;
      const isWhiteBg = hasVisibleBg && isNearWhiteRgb(bgRgba[0], bgRgba[1], bgRgba[2]);

      // 根容器白底标记为 paper 矩形（供浅色主题 Canvas/SVG 填白纸）
      if (node.isRoot && markRootPaper && (isWhiteBg || !hasVisibleBg)) {
        const frameLayer = resolveLayer('DOM_FRAME', node.layerHint, 8, null);
        doc.addRect(0, 0, widthMm, heightMm, frameLayer, 8, 0, { paper: true });
        emitted++;
      }

      // 非白色背景处理策略（ignore / outline / hatch）
      if (hasVisibleBg && !isWhiteBg && backgroundMode !== 'ignore') {
        const bgColor = colorToAci(node.backgroundColor);
        const fillLayer = resolveLayer('DOM_FILL', node.layerHint, bgColor, null);
        const targetRect = clip ? intersectRects(node.rect, clip) : node.rect;
        if (targetRect) {
          if (backgroundMode === 'hatch') {
            const beforeCount = doc.commands.length;
            drawHatch(
              doc,
              targetRect.x,
              toWorldY(targetRect.y + targetRect.h),
              targetRect.x + targetRect.w,
              toWorldY(targetRect.y),
              'diagonal',
              fillLayer,
              bgColor,
              { maxPrimitives: remaining() }
            );
            emitted += doc.commands.length - beforeCount;
          } else if (backgroundMode === 'solid' && canEmit()) {
            const beforeCount = doc.commands.length;
            if (node.quad && !clip) {
              doc.addSolid(
                node.quad.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor
              );
            } else if (hasAnyRadius(node.radii) && !clip) {
              const pts = sampleRoundedRectPoints(node.rect, node.radii, curveTolerance);
              doc.addSolid(
                pts.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor
              );
            } else {
              doc.addSolidRect(
                targetRect.x,
                toWorldY(targetRect.y + targetRect.h),
                targetRect.x + targetRect.w,
                toWorldY(targetRect.y),
                fillLayer,
                bgColor
              );
            }
            emitted += doc.commands.length - beforeCount;
          } else if (backgroundMode === 'outline' && !hasAnyBorder(node.borders) && canEmit()) {
            if (node.quad) {
              doc.addPolyline(
                node.quad.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor,
                true,
                0
              );
              emitted++;
            } else if (hasAnyRadius(node.radii) && !clip) {
              const pts = sampleRoundedRectPoints(node.rect, node.radii, curveTolerance);
              doc.addPolyline(
                pts.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor,
                true,
                0
              );
              emitted++;
            } else {
              doc.addRect(
                targetRect.x,
                toWorldY(targetRect.y + targetRect.h),
                targetRect.x + targetRect.w,
                toWorldY(targetRect.y),
                fillLayer,
                bgColor,
                0
              );
              emitted++;
            }
          }
        }
      }

      // 边框绘制
      if (!hasAnyBorder(node.borders)) continue;

      if (node.quad) {
        const q = node.quad;
        const edges: ReadonlyArray<{
          side: DomBorderSide;
          a: readonly [number, number];
          b: readonly [number, number];
        }> = [
          { side: node.borders.top, a: q[0], b: q[1] },
          { side: node.borders.right, a: q[1], b: q[2] },
          { side: node.borders.bottom, a: q[2], b: q[3] },
          { side: node.borders.left, a: q[3], b: q[0] },
        ];
        for (const edge of edges) {
          if (!isBorderVisible(edge.side)) continue;
          const color = colorToAci(edge.side.color);
          const lt = borderStyleToLinetype(edge.side.style);
          const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
          pushBorderSegment(
            edge.a[0],
            edge.a[1],
            edge.b[0],
            edge.b[1],
            layer,
            color,
            lt,
            edge.side.width,
            clip
          );
        }
        continue;
      }

      if (hasAnyRadius(node.radii) && !clip) {
        const dominant = pickDominantBorder(node.borders);
        if (dominant && canEmit()) {
          const color = colorToAci(dominant.color);
          const lt = borderStyleToLinetype(dominant.style);
          const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
          const pts = sampleRoundedRectPoints(node.rect, node.radii, curveTolerance);
          if (pts.length >= 2) {
            doc.addPolyline(
              pts.map(([px, py]) => [px, toWorldY(py)] as const),
              layer,
              color,
              true,
              dominant.width > 0.35 ? dominant.width : 0,
              lt ? { linetype: lt } : undefined
            );
            emitted++;
          }
        }
        continue;
      }

      const { x, y, w, h } = node.rect;
      const emitSide = (
        side: DomBorderSide,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        inwardDx: number,
        inwardDy: number
      ): void => {
        if (!isBorderVisible(side)) return;
        const color = colorToAci(side.color);
        const lt = borderStyleToLinetype(side.style);
        const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
        if (side.style === 'double') {
          const gap = Math.max(0.25, side.width * 0.65);
          pushBorderSegment(x1, y1, x2, y2, layer, color, null, 0, clip);
          pushBorderSegment(
            x1 + inwardDx * gap,
            y1 + inwardDy * gap,
            x2 + inwardDx * gap,
            y2 + inwardDy * gap,
            layer,
            color,
            null,
            0,
            clip
          );
        } else {
          pushBorderSegment(x1, y1, x2, y2, layer, color, lt, side.width, clip);
        }
      };

      emitSide(node.borders.top, x, y, x + w, y, 0, 1);
      emitSide(node.borders.right, x + w, y, x + w, y + h, -1, 0);
      emitSide(node.borders.bottom, x, y + h, x + w, y + h, 0, -1);
      emitSide(node.borders.left, x, y, x, y + h, 1, 0);
      continue;
    }

    if (node.kind === 'line') {
      const color = colorToAci(node.color);
      const lt = borderStyleToLinetype(node.style);
      const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
      pushBorderSegment(node.x1, node.y1, node.x2, node.y2, layer, color, lt, node.width, clip);
      continue;
    }

    if (node.kind === 'circle') {
      if (!canEmit() || node.r <= 1e-4) continue;
      const box: DomRectMm = {
        x: node.cx - node.r,
        y: node.cy - node.r,
        w: node.r * 2,
        h: node.r * 2,
      };
      if (clip && isRectOutsideClip(box, clip)) continue;
      const color = colorToAci(node.strokeColor || node.fillColor || '#111827');
      const layer = resolveLayer('DOM_BORDER', node.layerHint, color, null);
      doc.addCircle(node.cx, toWorldY(node.cy), node.r, layer, color);
      emitted++;
      continue;
    }

    if (node.kind === 'svg') {
      emitEmbeddedSvg(node, clip);
      continue;
    }

    if (node.kind === 'media') {
      if (mediaMode !== 'placeholder' || !canEmit()) continue;
      if (clip && isRectOutsideClip(node.rect, clip)) continue;
      const r = clip ? intersectRects(node.rect, clip) : node.rect;
      if (!r) continue;
      const mediaLayer = resolveLayer('DOM_MEDIA', node.layerHint, 8, 'DASHED');
      const wyBot = toWorldY(r.y + r.h);
      const wyTop = toWorldY(r.y);
      doc.addRect(r.x, wyBot, r.x + r.w, wyTop, mediaLayer, 8, 0);
      doc.addLine(r.x, wyBot, r.x + r.w, wyTop, mediaLayer, 8, 'DASHED');
      doc.addLine(r.x, wyTop, r.x + r.w, wyBot, mediaLayer, 8, 'DASHED');
      emitted += 3;
      if (canEmit() && r.h >= 3) {
        doc.addText(
          r.x + r.w * 0.5,
          (wyBot + wyTop) * 0.5,
          Math.min(3, r.h * 0.35),
          `[${node.label}]`,
          mediaLayer,
          8,
          0,
          1,
          2,
          0.85
        );
        emitted++;
      }
      continue;
    }
  }

  // 刷出合并后的边框线段
  if (dedupeBorders && pendingSegments.length > 0) {
    const merged = mergeAxisAlignedSegments(pendingSegments);
    for (const seg of merged) {
      if (!canEmit()) break;
      if (seg.lineWidth > 0.35) {
        doc.addPolyline(
          [
            [seg.x1, seg.y1],
            [seg.x2, seg.y2],
          ],
          seg.layer,
          seg.color,
          false,
          seg.lineWidth,
          seg.linetype ? { linetype: seg.linetype } : undefined
        );
      } else {
        doc.addLine(seg.x1, seg.y1, seg.x2, seg.y2, seg.layer, seg.color, seg.linetype);
      }
      emitted++;
    }
  }

  // Pass 2: 统一输出文本，保证叠放于边框线之上
  for (const node of pendingTexts) {
    if (!canEmit()) break;
    const clip = clipOverflow && node.clipId ? (clipMap.get(node.clipId)?.rect ?? null) : null;
    if (clip && isRectOutsideClip(node.rect, clip)) continue;

    const color = colorToAci(node.color);
    const layer = resolveLayer('DOM_TEXT', node.layerHint, color, null);
    const h = Math.max(0.5, node.fontSize * fontSizeScale);
    doc.addText(
      node.x,
      toWorldY(node.y),
      h,
      node.text,
      layer,
      color,
      node.rot,
      node.hAlign,
      node.vAlign,
      0.85,
      node.bold ? { bold: true } : undefined
    );
    emitted++;
  }

  return doc;
}

/**
 * 将浏览器已挂载的 HTML `Element` 转换为统一 IR `DrawingDocument`。
 *
 * 返回的文档可直接交给 `DxfExporter`、`SvgExporter` 或 `DualViewPreview`。
 */
export function domToDocument(
  element: Element,
  options: DomConvertOptions = {}
): DrawingDocument {
  const scene = extractDomScene(element, options);
  return sceneToDocument(scene, options);
}

```

## src\dom\to-svg.ts
```ts
/**
 * 将 `DomScene`（或浏览器 `Element`）输出为纯矢量 SVG 字符串（不使用 `<foreignObject>`）。
 *
 * 支持两种模式：
 * - `'visual'`（默认）：直接基于 `DomScene` 保留真彩色背景、圆角路径、四边边框、
 *   `clipPath` 裁剪、内嵌 `<svg>` 与可选 `<img>/<canvas>`；
 * - `'cad'`：先转换为 `DrawingDocument` 再交给 `SvgSerializer`，与导出的 DXF 100% 同源。
 */

import { parseColorRgba, rgbToHex } from '../core/color';
import { fmtNumber as fmt } from '../core/format';
import { escapeXml } from '../core/xml';
import { SvgSerializer } from '../svg/serializer';
import {
  areBordersUniform,
  hasAnyBorder,
  hasAnyRadius,
  isBorderVisible,
  roundedRectSvgPath,
} from './borders';
import { extractDomScene } from './extract';
import { sceneToDocument } from './to-document';
import type {
  DomBorderSide,
  DomBorderStyle,
  DomRectMm,
  DomScene,
  DomToSvgOptions,
} from './types';

function formatStrokeDash(style: DomBorderStyle, widthMm: number): string {
  const w = Math.max(0.25, widthMm);
  if (style === 'dashed') return ` stroke-dasharray="${fmt(w * 3)},${fmt(w * 2)}"`;
  if (style === 'dotted') return ` stroke-dasharray="${fmt(w)},${fmt(w * 1.6)}"`;
  return '';
}

function formatPaint(
  rawColor: string | undefined | null,
  nodeOpacity: number,
  attrPrefix: 'fill' | 'stroke'
): string | null {
  const rgba = parseColorRgba(rawColor);
  if (!rgba || rgba[3] <= 0.001) return null;
  const effAlpha = rgba[3] * nodeOpacity;
  if (effAlpha <= 0.001) return null;
  const hex = rgbToHex(rgba[0], rgba[1], rgba[2]);
  const opAttr = effAlpha < 0.999 ? ` ${attrPrefix}-opacity="${fmt(effAlpha)}"` : '';
  return `${attrPrefix}="${hex}"${opAttr}`;
}

/** 将内嵌 `<svg>` 源码调整为指定位置和毫米尺寸的嵌套 `<svg>` 元素。 */
function placeNestedSvg(markup: string, rect: DomRectMm, clipAttr: string, opacity: number): string {
  const cleaned = markup.replace(/<\?xml[\s\S]*?\?>/gi, '').trim();
  const openTagMatch = cleaned.match(/^<svg\b([^>]*)>/i);
  if (!openTagMatch) return '';

  const rawAttrs = openTagMatch[1]
    .replace(/\b(?:x|y|width|height)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim();
  const opAttr = opacity < 0.999 ? ` opacity="${fmt(opacity)}"` : '';
  const patchedOpen = `<svg${rawAttrs ? ' ' + rawAttrs : ''} x="${fmt(rect.x)}" y="${fmt(
    rect.y
  )}" width="${fmt(rect.w)}" height="${fmt(rect.h)}"${clipAttr}${opAttr}>`;

  return patchedOpen + cleaned.slice(openTagMatch[0].length);
}

/**
 * 纯计算：将 `DomScene` 序列化为高保真纯矢量 SVG（不含 `<foreignObject>`）。
 */
export function sceneToVisualSvg(scene: DomScene, options: DomToSvgOptions = {}): string {
  const widthMm = Number.isFinite(scene.widthMm) && scene.widthMm > 0 ? scene.widthMm : 1;
  const heightMm = Number.isFinite(scene.heightMm) && scene.heightMm > 0 ? scene.heightMm : 1;
  const includeXmlDeclaration = options.includeXmlDeclaration ?? true;
  const mediaMode = options.mediaMode ?? 'embed';

  const out: string[] = [];
  if (includeXmlDeclaration) {
    out.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
  }
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${fmt(
      widthMm
    )}mm" height="${fmt(heightMm)}mm" viewBox="0 0 ${fmt(widthMm)} ${fmt(heightMm)}">`
  );

  if (scene.clips.length > 0) {
    out.push('<defs>');
    for (const clip of scene.clips) {
      const r = clip.rect;
      const shape =
        clip.radii && hasAnyRadius(clip.radii)
          ? `<path d="${roundedRectSvgPath(r, clip.radii)}"/>`
          : `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(r.h)}"/>`;
      out.push(`<clipPath id="${escapeXml(clip.id)}">${shape}</clipPath>`);
    }
    out.push('</defs>');
  }

  for (const node of scene.nodes) {
    const clipAttr = node.clipId ? ` clip-path="url(#${escapeXml(node.clipId)})"` : '';

    if (node.kind === 'box') {
      const r = node.rect;
      const fillPaint = formatPaint(node.backgroundColor, node.opacity, 'fill');

      // 1. 背景填充
      if (fillPaint) {
        if (node.quad) {
          const pts = node.quad.map(([px, py]) => `${fmt(px)},${fmt(py)}`).join(' ');
          out.push(`<polygon points="${pts}" ${fillPaint}${clipAttr}/>`);
        } else if (hasAnyRadius(node.radii)) {
          out.push(`<path d="${roundedRectSvgPath(r, node.radii)}" ${fillPaint}${clipAttr}/>`);
        } else {
          out.push(
            `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
              r.h
            )}" ${fillPaint}${clipAttr}/>`
          );
        }
      }

      // 2. 边框描边
      if (!hasAnyBorder(node.borders)) continue;

      if (node.quad) {
        const q = node.quad;
        const edges: ReadonlyArray<{
          side: DomBorderSide;
          a: readonly [number, number];
          b: readonly [number, number];
        }> = [
          { side: node.borders.top, a: q[0], b: q[1] },
          { side: node.borders.right, a: q[1], b: q[2] },
          { side: node.borders.bottom, a: q[2], b: q[3] },
          { side: node.borders.left, a: q[3], b: q[0] },
        ];
        for (const edge of edges) {
          if (!isBorderVisible(edge.side)) continue;
          const strokePaint = formatPaint(edge.side.color, node.opacity, 'stroke');
          if (!strokePaint) continue;
          out.push(
            `<line x1="${fmt(edge.a[0])}" y1="${fmt(edge.a[1])}" x2="${fmt(
              edge.b[0]
            )}" y2="${fmt(edge.b[1])}" ${strokePaint} stroke-width="${fmt(
              edge.side.width
            )}"${formatStrokeDash(edge.side.style, edge.side.width)}${clipAttr}/>`
          );
        }
        continue;
      }

      if (areBordersUniform(node.borders) && node.borders.top.style !== 'double') {
        const side = node.borders.top;
        const strokePaint = formatPaint(side.color, node.opacity, 'stroke');
        if (strokePaint) {
          const dash = formatStrokeDash(side.style, side.width);
          if (hasAnyRadius(node.radii)) {
            out.push(
              `<path d="${roundedRectSvgPath(r, node.radii)}" fill="none" ${strokePaint} stroke-width="${fmt(
                side.width
              )}"${dash}${clipAttr}/>`
            );
          } else {
            out.push(
              `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
                r.h
              )}" fill="none" ${strokePaint} stroke-width="${fmt(side.width)}"${dash}${clipAttr}/>`
            );
          }
        }
        continue;
      }

      const emitSide = (
        side: DomBorderSide,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        inwardDx: number,
        inwardDy: number
      ): void => {
        if (!isBorderVisible(side)) return;
        const strokePaint = formatPaint(side.color, node.opacity, 'stroke');
        if (!strokePaint) return;
        if (side.style === 'double') {
          const sw = Math.max(0.15, side.width / 3);
          const gap = Math.max(0.25, side.width * 0.65);
          out.push(
            `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(
              y2
            )}" ${strokePaint} stroke-width="${fmt(sw)}"${clipAttr}/>`
          );
          out.push(
            `<line x1="${fmt(x1 + inwardDx * gap)}" y1="${fmt(y1 + inwardDy * gap)}" x2="${fmt(
              x2 + inwardDx * gap
            )}" y2="${fmt(y2 + inwardDy * gap)}" ${strokePaint} stroke-width="${fmt(sw)}"${clipAttr}/>`
          );
        } else {
          out.push(
            `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(
              y2
            )}" ${strokePaint} stroke-width="${fmt(side.width)}"${formatStrokeDash(
              side.style,
              side.width
            )}${clipAttr}/>`
          );
        }
      };

      emitSide(node.borders.top, r.x, r.y, r.x + r.w, r.y, 0, 1);
      emitSide(node.borders.right, r.x + r.w, r.y, r.x + r.w, r.y + r.h, -1, 0);
      emitSide(node.borders.bottom, r.x, r.y + r.h, r.x + r.w, r.y + r.h, 0, -1);
      emitSide(node.borders.left, r.x, r.y, r.x, r.y + r.h, 1, 0);
      continue;
    }

    if (node.kind === 'line') {
      const strokePaint = formatPaint(node.color, node.opacity, 'stroke');
      if (!strokePaint) continue;
      out.push(
        `<line x1="${fmt(node.x1)}" y1="${fmt(node.y1)}" x2="${fmt(node.x2)}" y2="${fmt(
          node.y2
        )}" ${strokePaint} stroke-width="${fmt(node.width)}"${formatStrokeDash(
          node.style,
          node.width
        )}${clipAttr}/>`
      );
      continue;
    }

    if (node.kind === 'circle') {
      const fillPaint = formatPaint(node.fillColor, node.opacity, 'fill') ?? 'fill="none"';
      const strokePaint = formatPaint(node.strokeColor, node.opacity, 'stroke');
      const swAttr =
        strokePaint && node.strokeWidth ? ` stroke-width="${fmt(node.strokeWidth)}"` : '';
      out.push(
        `<circle cx="${fmt(node.cx)}" cy="${fmt(node.cy)}" r="${fmt(node.r)}" ${fillPaint}${
          strokePaint ? ' ' + strokePaint : ''
        }${swAttr}${clipAttr}/>`
      );
      continue;
    }

    if (node.kind === 'svg') {
      const nested = placeNestedSvg(node.markup, node.rect, clipAttr, node.opacity);
      if (nested) out.push(nested);
      continue;
    }

    if (node.kind === 'media') {
      const r = node.rect;
      if (mediaMode === 'embed' && node.dataUrl) {
        const opAttr = node.opacity < 0.999 ? ` opacity="${fmt(node.opacity)}"` : '';
        out.push(
          `<image x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
            r.h
          )}" href="${escapeXml(node.dataUrl)}" preserveAspectRatio="none"${clipAttr}${opAttr}/>`
        );
      } else if (mediaMode === 'placeholder') {
        out.push(
          `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
            r.h
          )}" fill="none" stroke="#9ca3af" stroke-width="0.25" stroke-dasharray="1.2,0.8"${clipAttr}/>`
        );
        out.push(
          `<text x="${fmt(r.x + r.w * 0.5)}" y="${fmt(
            r.y + r.h * 0.5
          )}" fill="#6b7280" font-size="${fmt(
            Math.min(3.5, Math.max(1.5, r.h * 0.35))
          )}" text-anchor="middle" dominant-baseline="central"${clipAttr}>${escapeXml(
            `[${node.label}]`
          )}</text>`
        );
      }
      continue;
    }

    if (node.kind === 'text') {
      const fillPaint = formatPaint(node.color, node.opacity, 'fill') ?? 'fill="#111827"';
      const anchor = node.hAlign === 1 ? 'middle' : node.hAlign === 2 ? 'end' : 'start';
      const baseline =
        node.vAlign === 1
          ? 'text-after-edge'
          : node.vAlign === 2
            ? 'central'
            : node.vAlign === 3
              ? 'hanging'
              : 'alphabetic';
      const weightAttr = node.bold ? ' font-weight="bold"' : '';
      const styleAttr = node.italic ? ' font-style="italic"' : '';
      const posAttr =
        Math.abs(node.rot) > 1e-4
          ? `transform="translate(${fmt(node.x)},${fmt(node.y)}) rotate(${fmt(-node.rot)})"`
          : `x="${fmt(node.x)}" y="${fmt(node.y)}"`;

      out.push(
        `<text ${posAttr} ${fillPaint} font-family="${escapeXml(
          node.fontFamily
        )}" font-size="${fmt(
          node.fontSize
        )}"${weightAttr}${styleAttr} text-anchor="${anchor}" dominant-baseline="${baseline}" xml:space="preserve"${clipAttr}>${escapeXml(
          node.text
        )}</text>`
      );
      continue;
    }
  }

  out.push('</svg>');
  return out.join('\n');
}

/**
 * 将浏览器已挂载的 HTML `Element` 转换为纯矢量 SVG 文本。
 */
export function domToSvg(element: Element, options: DomToSvgOptions = {}): string {
  const mode = options.mode ?? 'visual';
  const scene = extractDomScene(element, {
    ...options,
    mediaMode: options.mediaMode ?? (mode === 'visual' ? 'embed' : 'ignore'),
  });

  if (mode === 'cad') {
    const doc = sceneToDocument(scene, options);
    return new SvgSerializer().serialize(doc, {
      theme: 'light',
      mode: 'export',
      ...options.svgOptions,
    });
  }

  return sceneToVisualSvg(scene, options);
}

```

## src\dom\types.ts
```ts
/**
 * HTML DOM → SVG / DXF 转换层的类型定义。
 *
 * `DomScene` 是浏览器布局提取器与下游输出端（`sceneToDocument`、`sceneToVisualSvg`）
 * 之间的纯 JSON 快照，所有几何坐标已归一化为根元素相对毫米（Y 轴向下）。
 */

import type { DownloadOptions } from '../browser';
import type { HAlign, VAlign } from '../core/types';
import type { DxfSerializeOptions } from '../dxf/serializer';
import type { TextCodec } from '../encoding';
import type { SvgSerializeOptions } from '../svg/serializer';

/** 毫米级矩形（相对根元素左上角，Y 轴向下）。 */
export interface DomRectMm {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 支持的 CSS 边框样式分类。 */
export type DomBorderStyle = 'none' | 'solid' | 'dashed' | 'dotted' | 'double';

/** 单条边框属性。 */
export interface DomBorderSide {
  width: number;
  style: DomBorderStyle;
  color: string;
}

/** 盒子四边边框定义。 */
export interface DomBorders {
  top: DomBorderSide;
  right: DomBorderSide;
  bottom: DomBorderSide;
  left: DomBorderSide;
}

/** 四个圆角各自的 [rx, ry]（mm）。 */
export interface DomRadii {
  tl: readonly [number, number];
  tr: readonly [number, number];
  br: readonly [number, number];
  bl: readonly [number, number];
}

/** 溢出裁剪区域定义（对应 CSS overflow: hidden/clip/scroll/auto）。 */
export interface DomClipRect {
  id: string;
  rect: DomRectMm;
  radii?: DomRadii;
}

/** 场景节点公共元数据。 */
export interface DomNodeBase {
  clipId?: string | null;
  layerHint?: string | null;
  opacity: number;
}

/** 普通盒子节点（div / table / td / th / button / input 外框等）。 */
export interface DomBoxNode extends DomNodeBase {
  kind: 'box';
  rect: DomRectMm;
  isRoot?: boolean;
  backgroundColor?: string | null;
  borders: DomBorders;
  radii: DomRadii;
  /** 存在 CSS 旋转/斜切时记录真实四角坐标（顺时针 TL/TR/BR/BL，mm，Y 向下）。 */
  quad?: readonly [
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
    readonly [number, number],
  ];
}

/** 独立矢量线段节点（如 `<hr>`、表单勾选符号线段等）。 */
export interface DomLineNode extends DomNodeBase {
  kind: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  style: DomBorderStyle;
  color: string;
}

/** 独立圆形节点（如 radio 选中圆点）。 */
export interface DomCircleNode extends DomNodeBase {
  kind: 'circle';
  cx: number;
  cy: number;
  r: number;
  strokeColor?: string | null;
  strokeWidth?: number;
  fillColor?: string | null;
}

/** 单行视觉文本节点（已由 Range 完成自动换行拆分）。 */
export interface DomTextNode extends DomNodeBase {
  kind: 'text';
  text: string;
  rect: DomRectMm;
  x: number;
  y: number;
  fontSize: number;
  fontFamily: string;
  bold: boolean;
  italic: boolean;
  color: string;
  hAlign: HAlign;
  vAlign: VAlign;
  /** CAD 世界坐标逆时针旋转角（度）。 */
  rot: number;
}

/** 内嵌 `<svg>` 子树节点（关键计算样式已内联）。 */
export interface DomSvgNode extends DomNodeBase {
  kind: 'svg';
  rect: DomRectMm;
  markup: string;
  viewBox: { x: number; y: number; w: number; h: number };
}

/** 位图/画布媒体节点（`<img>` / `<canvas>`）。 */
export interface DomMediaNode extends DomNodeBase {
  kind: 'media';
  mediaType: 'img' | 'canvas';
  rect: DomRectMm;
  label: string;
  dataUrl?: string | null;
}

export type DomSceneNode =
  | DomBoxNode
  | DomLineNode
  | DomCircleNode
  | DomTextNode
  | DomSvgNode
  | DomMediaNode;

/** 浏览器布局提取产出的可序列化场景快照。 */
export interface DomScene {
  widthMm: number;
  heightMm: number;
  pxToMm: number;
  clips: DomClipRect[];
  nodes: DomSceneNode[];
}

/** 图层分配策略。 */
export type DomLayerStrategy = 'semantic' | 'id' | 'color' | 'single';

/** IR/DXF 模式下盒子背景色处理策略。 */
export type DomBackgroundMode = 'ignore' | 'outline' | 'hatch' | 'solid';

/** `<img>` / `<canvas>` 媒体元素处理策略。 */
export type DomMediaMode = 'ignore' | 'placeholder' | 'embed';

/** DOM 提取与转换公共选项。 */
export interface DomConvertOptions {
  /** CSS px → 世界 mm 缩放倍率，默认 `25.4 / 96`（96 DPI）。 */
  pxToMm?: number;
  /** 若指定，则按目标宽度(mm)等比缩放整块 DOM（优先级高于 pxToMm）。 */
  fitWidthMm?: number;
  /** 图层分配方式：语义分层 / 节点 id / ACI 颜色 / 单图层，默认 `'semantic'`。 */
  layerBy?: DomLayerStrategy;
  /** 默认图层名，默认 `'0'`。 */
  defaultLayer?: string;
  /** IR/DXF 下背景色处理策略，默认 `'ignore'`。 */
  backgroundMode?: DomBackgroundMode;
  /** 是否把根容器白色背景标记为 `paper: true` 图框，默认 `true`。 */
  markRootPaper?: boolean;
  /** 是否对表格/相邻盒子的重合水平、垂直边框去重与共线合并，默认 `true`。 */
  dedupeBorders?: boolean;
  /** 圆角与内嵌 SVG 曲线的细分弦高容差（mm），默认 `0.1`。 */
  curveTolerance?: number;
  /** CAD 文本字高相对 CSS font-size 的换算系数，默认 `0.78`。 */
  fontSizeScale?: number;
  /** `<img>` / `<canvas>` 处理策略（IR/DXF 默认 `'ignore'`，visual SVG 默认 `'embed'`）。 */
  mediaMode?: DomMediaMode;
  /** 是否对 `overflow: hidden/clip/scroll/auto` 做几何裁剪，默认 `true`。 */
  clipOverflow?: boolean;
  /** 节点过滤回调；返回 `false` 时跳过该节点及其子树。 */
  filter?: (element: Element) => boolean;
  /** 生成图元数量硬上限，默认 `200_000`；传 `0` 关闭。 */
  maxPrimitives?: number;
}

/** `domToSvg` / `sceneToVisualSvg` 选项。 */
export interface DomToSvgOptions extends DomConvertOptions {
  /**
   * - `'visual'`（默认）：直接从 `DomScene` 生成高保真纯矢量 SVG（真彩色、背景填充、clipPath，无 foreignObject）；
   * - `'cad'`：先转 `DrawingDocument` 再走 `SvgSerializer`，与导出 DXF 100% 图元同源。
   */
  mode?: 'visual' | 'cad';
  /** `mode: 'cad'` 时透传给 `SvgSerializer` 的选项。 */
  svgOptions?: SvgSerializeOptions;
  /** `mode: 'visual'` 时是否输出 XML 声明，默认 `true`。 */
  includeXmlDeclaration?: boolean;
}

/** `domToDxfText` / `domToDxfBytes` 选项。 */
export interface DomToDxfOptions extends DomConvertOptions, DxfSerializeOptions {
  /** 可选自定义编解码器（如监听 GBK 表外字符转义）。 */
  codec?: TextCodec;
}

/** 浏览器一键下载 DOM 为 DXF 的选项。 */
export interface DownloadDomDxfOptions extends DomToDxfOptions, DownloadOptions {}

/** 浏览器一键下载 DOM 为 SVG 的选项。 */
export interface DownloadDomSvgOptions extends DomToSvgOptions, DownloadOptions {}

/** 离屏 HTML 字符串转换选项（自动创建临时容器测量布局并在 finally 中移除）。 */
export interface HtmlConvertOptions extends DomConvertOptions {
  /** 离屏渲染容器宽度（CSS px），决定文本换行与流式布局，默认 794（约 A4 96DPI 宽度）。 */
  widthPx?: number;
  /** 可选附加 CSS 样式文本，注入临时容器内的 `<style>` 中并随容器一起清理。 */
  css?: string;
  /** 指定挂载目标 Document（跨 iframe 或测试环境使用），默认全局 `document`。 */
  document?: Document;
  /** 挂载完成、提取布局前的钩子，可用于自定义 DOM 预处理。 */
  beforeExtract?: (root: HTMLElement) => void;
}

/** `htmlToSvg` 选项。 */
export interface HtmlToSvgOptions extends DomToSvgOptions, HtmlConvertOptions {}

/** `htmlToDxfText` / `htmlToDxfBytes` 选项。 */
export interface HtmlToDxfOptions extends DomToDxfOptions, HtmlConvertOptions {}

```

## src\dxf\index.ts
```ts
/**
 * DXF 输出端出口：把 IR 快照序列化为 DXF R12（AC1009）文本或字节。
 *
 * 输出严格遵循 HEADER → TABLES → ENTITIES → EOF 的组码顺序，且受
 * 「输出字节稳定性契约」保护——组码顺序、换行、清洗规则均不可随意改动。
 */
export * from './serializer'; // DxfSerializer、DxfExporter 与实体校验 validateCommand
export * from './parser'; // DxfImporter、parseDxfToDocument 与 parseDxfWithReport（DXF → IR）

```

## src\dxf\parser.ts
```ts
/**
 * DXF 输入端：把 ASCII DXF（R12 ~ R2024+）文本或字节流解析为统一 IR `DrawingDocument`。
 *
 * 零运行时依赖、环境无关（Node 与浏览器行为一致），与 `DxfSerializer`、`SvgSerializer`、
 * `CanvasRenderer`、`DualViewPreview` 共用同一份 `DrawCommand[]` 模型，使外部 DXF 可直接
 * 双引擎预览、导出 SVG 或二次编辑。
 */

import { colorToAci, rgbToHex, sanitizeLayerCandidate } from '../core/color';
import { DrawingDocument } from '../core/document';
import type { HAlign, Linetype, Point, VAlign } from '../core/types';
import { decodeAuto } from '../encoding';

/** DXF 解析输入编码选项（默认 `'auto'` 自动探测）。 */
export type DxfParseEncoding =
  | 'auto'
  | 'utf-8'
  | 'gbk'
  | 'gb2312'
  | 'gb18030'
  | 'big5'
  | 'shift-jis'
  | 'euc-kr'
  | 'windows-1252'
  | (string & {});

/** 空间过滤策略：默认仅解析模型空间，避免与图纸布局空间重叠。 */
export type DxfSpaceFilter = 'model' | 'paper' | 'all';

/** DXF 导入选项。 */
export interface DxfImportOptions {
  /** 字节解码方式；默认 `'auto'`（结合 BOM、`$ACADVER`、`$DWGCODEPAGE` 与 UTF-8 严格校验判定）。 */
  encoding?: DxfParseEncoding;
  /** 实体空间过滤：`'model'`（默认）仅模型空间、`'paper'` 仅图纸空间、`'all'` 全部。 */
  space?: DxfSpaceFilter;
  /** ARC / ELLIPSE / SPLINE / LWPOLYLINE 凸度圆弧离散的弦高容差（世界单位 mm），默认 `0.1`。 */
  curveTolerance?: number;
  /** 是否包含关闭（负色号）或冻结（70 & 1）的图层，默认 `false`。 */
  includeHiddenLayers?: boolean;
  /** 是否在结果 `warnings` 中记录被跳过的未支持实体统计，默认 `true`。 */
  includeUnsupportedWarnings?: boolean;
  /** 生成图元数量硬上限，防止异常文件导致 OOM，默认 `200_000`；传 `0` 关闭。 */
  maxPrimitives?: number;
  /** `INSERT` 嵌套块最大展开深度（防循环引用），默认 `16`。 */
  maxBlockDepth?: number;
}

/** DXF 解析统计信息。 */
export interface DxfParseStats {
  /** `$ACADVER` 版本标识（如 `AC1009`、`AC1015`、`AC1021`）。 */
  acadVersion: string | null;
  /** `$DWGCODEPAGE` 声明值（如 `ANSI_936`、`UTF-8`）。 */
  codepage: string | null;
  /** 实际采用的解码名称。 */
  detectedEncoding: string;
  /** 已解析的各 DXF 实体类型计数。 */
  entityCounts: Record<string, number>;
  /** 被跳过的未支持实体类型及数量。 */
  unsupportedEntities: Record<string, number>;
  /** 因空间过滤跳过的实体数。 */
  skippedPaperSpace: number;
  /** 因隐藏/冻结图层跳过的实体数。 */
  skippedHiddenLayer: number;
  /** `BLOCKS` 段解析到的块定义总数。 */
  blockCount: number;
  /** 是否触发 `maxPrimitives` 上限截断。 */
  truncated: boolean;
}

/** 带诊断报告的解析结果。 */
export interface DxfParseResult {
  document: DrawingDocument;
  stats: DxfParseStats;
  warnings: string[];
}

/* ================= 编码探测与 CAD 文本转义还原 ================= */

const BINARY_DXF_MAGIC = 'AutoCAD Binary DXF';

const CODEPAGE_MAP: Readonly<Record<string, string>> = {
  ANSI_936: 'gbk',
  GB2312: 'gbk',
  GBK: 'gbk',
  GB18030: 'gb18030',
  ANSI_950: 'big5',
  BIG5: 'big5',
  ANSI_932: 'shift-jis',
  SHIFT_JIS: 'shift-jis',
  ANSI_949: 'euc-kr',
  ANSI_1252: 'windows-1252',
  ASCII: 'windows-1252',
  'UTF-8': 'utf-8',
  UTF8: 'utf-8',
};

const M_ESCAPE_ENCODINGS: Readonly<Record<string, string>> = {
  '1': 'shift-jis',
  '2': 'big5',
  '3': 'euc-kr',
  '4': 'euc-kr',
  '5': 'gbk',
};

const decoderCache = new Map<string, TextDecoder | null>();

function getDecoder(label: string): TextDecoder | null {
  const key = label.toLowerCase();
  if (decoderCache.has(key)) return decoderCache.get(key) ?? null;
  let dec: TextDecoder | null = null;
  try {
    dec = new TextDecoder(key);
  } catch {
    dec = null;
  }
  decoderCache.set(key, dec);
  return dec;
}

function decodeStrictUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function hasBinaryMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < BINARY_DXF_MAGIC.length) return false;
  for (let i = 0; i < BINARY_DXF_MAGIC.length; i++) {
    if (bytes[i] !== BINARY_DXF_MAGIC.charCodeAt(i)) return false;
  }
  return true;
}

/** 仅以 ASCII/Latin1 快速预扫 HEADER 头部（前 ~64KB），提前读取 `$ACADVER` 与 `$DWGCODEPAGE`。 */
function peekDxfHeaderMeta(bytes: Uint8Array): {
  acadVersion: string | null;
  codepage: string | null;
} {
  const sampleLen = Math.min(bytes.length, 65_536);
  let text = '';
  for (let i = 0; i < sampleLen; i++) {
    text += String.fromCharCode(bytes[i]);
  }
  const lines = text.split(/\r\n|\r|\n/);
  let acadVersion: string | null = null;
  let codepage: string | null = null;

  for (let i = 0; i + 3 < lines.length; i += 2) {
    const code = Number.parseInt(lines[i].trim(), 10);
    const val = lines[i + 1].trim();
    if (code === 0 && val === 'ENDSEC') break;
    if (code === 9 && val === '$ACADVER') {
      acadVersion = lines[i + 3].trim() || null;
      i += 2;
    } else if (code === 9 && val === '$DWGCODEPAGE') {
      codepage = lines[i + 3].trim() || null;
      i += 2;
    }
    if (acadVersion && codepage) break;
  }
  return { acadVersion, codepage };
}

function parseAcadVersionNumber(version: string | null): number | null {
  if (!version) return null;
  const match = version.trim().match(/^AC(\d{4})$/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function countCjkAndBad(text: string): { cjk: number; bad: number } {
  let cjk = 0;
  let bad = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0xfffd) bad++;
    else if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf)) cjk++;
  }
  return { cjk, bad };
}

function hasNonAsciiBytes(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 0x80) return true;
  }
  return false;
}

function decodeDxfBytes(
  bytes: Uint8Array,
  requestedEncoding: DxfParseEncoding
): { text: string; detectedEncoding: string } {
  if (hasBinaryMagicBytes(bytes)) {
    throw new Error(
      'Binary DXF is not supported yet. Please re-save the file as ASCII DXF.'
    );
  }

  const req = String(requestedEncoding || 'auto')
    .trim()
    .toLowerCase();
  if (req !== 'auto') {
    const dec = getDecoder(req) ?? getDecoder('utf-8')!;
    return { text: dec.decode(bytes), detectedEncoding: req };
  }

  // 1. BOM 优先
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return {
      text: (getDecoder('utf-8') ?? new TextDecoder('utf-8')).decode(bytes.subarray(3)),
      detectedEncoding: 'utf-8-bom',
    };
  }
  const isUtf32LeBom =
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xfe &&
    bytes[2] === 0x00 &&
    bytes[3] === 0x00;
  if (!isUtf32LeBom && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return {
      text: (getDecoder('utf-16le') ?? new TextDecoder('utf-16le')).decode(bytes.subarray(2)),
      detectedEncoding: 'utf-16le',
    };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return {
      text: (getDecoder('utf-16be') ?? new TextDecoder('utf-16be')).decode(bytes.subarray(2)),
      detectedEncoding: 'utf-16be',
    };
  }

  if (!hasNonAsciiBytes(bytes)) {
    return {
      text: (getDecoder('utf-8') ?? new TextDecoder('utf-8')).decode(bytes),
      detectedEncoding: 'ascii',
    };
  }

  // 2. 结合 HEADER 中的 $ACADVER 与 $DWGCODEPAGE 做精确判定
  const meta = peekDxfHeaderMeta(bytes);
  const verNum = parseAcadVersionNumber(meta.acadVersion);
  const cpKey = meta.codepage ? meta.codepage.trim().toUpperCase() : '';
  const mappedCodepage = cpKey ? CODEPAGE_MAP[cpKey] ?? null : null;

  const utf8Text = decodeStrictUtf8(bytes);

  // AutoCAD 2007 (AC1021) 及以上规范统一为 UTF-8（即便 $DWGCODEPAGE 仍写 ANSI_936）
  if ((verNum !== null && verNum >= 1021) || mappedCodepage === 'utf-8') {
    if (utf8Text !== null) {
      return { text: utf8Text, detectedEncoding: 'utf-8' };
    }
    if (mappedCodepage && mappedCodepage !== 'utf-8') {
      const dec = getDecoder(mappedCodepage);
      if (dec) return { text: dec.decode(bytes), detectedEncoding: mappedCodepage };
    }
    return { text: decodeAuto(bytes), detectedEncoding: 'gbk' };
  }

  // R12 ~ AutoCAD 2004 且声明了明确的 ANSI 代码页（如 ANSI_936）
  if (mappedCodepage && mappedCodepage !== 'utf-8') {
    const cpDec = getDecoder(mappedCodepage);
    if (utf8Text === null) {
      if (cpDec) return { text: cpDec.decode(bytes), detectedEncoding: mappedCodepage };
      return { text: decodeAuto(bytes), detectedEncoding: mappedCodepage };
    }
    // 严格 UTF-8 恰好也通过时（例如极短文件仅含“联通”等双合法字节串）：
    // 若代码页解码无替换字符且 CJK 汉字数更优，则采信代码页，避免误判。
    if (cpDec) {
      const cpText = cpDec.decode(bytes);
      const cpScore = countCjkAndBad(cpText);
      const utf8Score = countCjkAndBad(utf8Text);
      if (cpScore.bad === 0 && cpScore.cjk > utf8Score.cjk) {
        return { text: cpText, detectedEncoding: mappedCodepage };
      }
    }
    return { text: utf8Text, detectedEncoding: 'utf-8' };
  }

  // 3. 无头信息或未知代码页：严格 UTF-8 → decodeAuto（GBK 回退）
  if (utf8Text !== null) {
    return { text: utf8Text, detectedEncoding: 'utf-8' };
  }
  return { text: decodeAuto(bytes), detectedEncoding: 'gbk' };
}

/**
 * 还原 DXF 文本中的 CAD 转义序列：
 * - `\U+XXXX` Unicode 码元转义
 * - `\M+nXXXX` 多字节代码页转义（1=Shift-JIS, 2=Big5, 3/4=EUC-KR, 5=GBK）
 * - `%%c` (Ø)、`%%d` (°)、`%%p` (±)、`%%u` / `%%o`（上下划线开关）与 `%%%` (%)
 */
export function unescapeDxfText(raw: string): string {
  if (!raw || (!raw.includes('\\') && !raw.includes('%'))) return raw;

  let out = raw.replace(/\\U\+([0-9a-fA-F]{4})/gi, (_m, hex: string) => {
    const code = Number.parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCharCode(code) : _m;
  });

  out = out.replace(/\\M\+([1-5])([0-9a-fA-F]{4})/gi, (match, idx: string, hex: string) => {
    const enc = M_ESCAPE_ENCODINGS[idx];
    const dec = enc ? getDecoder(enc) : null;
    if (!dec) return match;
    const b1 = Number.parseInt(hex.slice(0, 2), 16);
    const b2 = Number.parseInt(hex.slice(2, 4), 16);
    try {
      const decoded = dec.decode(new Uint8Array([b1, b2]));
      return decoded && decoded !== '\uFFFD' ? decoded : match;
    } catch {
      return match;
    }
  });

  out = out.replace(/%%([cdpuo%]|\d{3})/gi, (_m, code: string) => {
    const lower = code.toLowerCase();
    if (lower === 'c') return 'Ø';
    if (lower === 'd') return '°';
    if (lower === 'p') return '±';
    if (lower === '%') return '%';
    if (lower === 'u' || lower === 'o') return '';
    const num = Number.parseInt(code, 10);
    return Number.isFinite(num) && num >= 32 && num <= 255 ? String.fromCharCode(num) : '';
  });

  return out;
}

/** 剥离 AutoCAD `MTEXT` 富文本格式控制码并保留换行与叠式分数内容。 */
export function stripMtextFormatting(raw: string): string {
  if (!raw) return '';
  const BS = '\uE001';
  const OB = '\uE002';
  const CB = '\uE003';

  let s = raw
    .replace(/\\\\/g, BS)
    .replace(/\\\{/g, OB)
    .replace(/\\\}/g, CB)
    .replace(/\\P/g, '\n')
    .replace(/\\N/g, '\n')
    .replace(/\\~/g, ' ');

  // 叠式分数/公差：\S上^下; 或 \S上/下; 或 \S上#下;
  s = s.replace(/\\S([^;^/#]*)([\^/#])([^;]*);/g, (_m, a: string, sep: string, b: string) => {
    const left = a.trim();
    const right = b.trim();
    if (!left) return right;
    if (!right) return left;
    return sep === '^' ? `${left} ${right}` : `${left}/${right}`;
  });

  // 剥离带分号结尾的参数化格式码（字体、字高、颜色、宽比、倾斜、段落等）
  s = s.replace(/\\[fFAHWCQTWp][^;]*;/g, '');
  // 剥离无分号开关控制码（下划线、上划线、删除线）
  s = s.replace(/\\[LlOoKk]/g, '');
  // 去除分组大括号
  s = s.replace(/[{}]/g, '');

  s = s.replace(/\uE001/g, '\\').replace(/\uE002/g, '{').replace(/\uE003/g, '}');
  return unescapeDxfText(s);
}

/* ================= 2D 仿射矩阵与曲线几何算法 ================= */

type Mat2D = readonly [number, number, number, number, number, number];
const IDENTITY_MAT: Mat2D = [1, 0, 0, 1, 0, 0];

function mulMat(m1: Mat2D, m2: Mat2D): Mat2D {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMat(m: Mat2D, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function maxMatrixScale(m: Mat2D): number {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  const s = Math.max(sx, sy);
  return Number.isFinite(s) && s > 1e-9 ? s : 1;
}

function uniformScaleIfSimilar(m: Mat2D): number | null {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  if (sx <= 1e-9 || sy <= 1e-9) return null;
  if (Math.abs(sx - sy) / Math.max(sx, sy) > 1e-4) return null;
  const dot = m[0] * m[2] + m[1] * m[3];
  if (Math.abs(dot) / (sx * sy) > 1e-4) return null;
  return (sx + sy) * 0.5;
}

function buildInsertMatrix(
  insX: number,
  insY: number,
  sx: number,
  sy: number,
  rotDeg: number,
  baseX: number,
  baseY: number
): Mat2D {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tIns: Mat2D = [1, 0, 0, 1, insX, insY];
  const rMat: Mat2D = [cos, sin, -sin, cos, 0, 0];
  const sMat: Mat2D = [sx, 0, 0, sy, 0, 0];
  const tBase: Mat2D = [1, 0, 0, 1, -baseX, -baseY];
  return mulMat(mulMat(mulMat(tIns, rMat), sMat), tBase);
}

function arcSteps(radiusWorld: number, sweepRad: number, tolWorld: number): number {
  const r = Math.abs(radiusWorld);
  const absSweep = Math.abs(sweepRad);
  if (r <= 1e-9 || absSweep <= 1e-9) return 1;
  const stepAngle =
    r > tolWorld
      ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tolWorld / r)))
      : Math.PI / 6;
  const safeStep = Number.isFinite(stepAngle) && stepAngle > 1e-4 ? stepAngle : Math.PI / 12;
  const rawSteps = Math.max(2, Math.min(256, Math.ceil(absSweep / safeStep)));
  if (Math.abs(absSweep - Math.PI * 2) <= 1e-4) {
    return Math.max(12, Math.min(256, Math.ceil(rawSteps / 4) * 4));
  }
  return rawSteps;
}

/** 采样圆弧（逆时针角度，单位弧度）并直接变换到世界坐标。 */
function sampleArcPoints(
  cx: number,
  cy: number,
  r: number,
  startRad: number,
  sweepRad: number,
  mat: Mat2D,
  tolWorld: number,
  includeStart: boolean,
  out: Array<[number, number]>
): void {
  const steps = arcSteps(r * maxMatrixScale(mat), sweepRad, tolWorld);
  const startIdx = includeStart ? 0 : 1;
  for (let i = startIdx; i <= steps; i++) {
    const a = startRad + (sweepRad * i) / steps;
    out.push(applyMat(mat, cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
}

/** 采样带凸度 `bulge` 的多段线圆弧段（不含起点、含终点）。 */
function sampleBulgeSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bulge: number,
  mat: Mat2D,
  tolWorld: number,
  out: Array<[number, number]>
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const chord = Math.hypot(dx, dy);
  if (chord <= 1e-9 || Math.abs(bulge) <= 1e-6) {
    out.push(applyMat(mat, x2, y2));
    return;
  }

  // 精确中心解析式：对 |bulge| < 1、= 1、> 1 及正负方向全部无奇点成立
  const k = (1 - bulge * bulge) / (4 * bulge);
  const cx = (x1 + x2) * 0.5 - k * dy;
  const cy = (y1 + y2) * 0.5 + k * dx;
  const r = Math.hypot(x1 - cx, y1 - cy);
  const startRad = Math.atan2(y1 - cy, x1 - cx);
  const sweepRad = 4 * Math.atan(bulge);

  sampleArcPoints(cx, cy, r, startRad, sweepRad, mat, tolWorld, false, out);
}

/** 采样 DXF 椭圆 / 椭圆弧（按参数 `startParam..endParam`）。 */
function sampleDxfEllipse(
  cx: number,
  cy: number,
  majorX: number,
  majorY: number,
  ratio: number,
  startParam: number,
  endParam: number,
  mirrorZ: boolean,
  mat: Mat2D,
  tolWorld: number
): { points: Array<[number, number]>; closed: boolean } {
  const majorLen = Math.hypot(majorX, majorY);
  if (majorLen <= 1e-9 || !Number.isFinite(ratio) || ratio <= 0) {
    return { points: [], closed: false };
  }
  const sign = mirrorZ ? -1 : 1;
  const minorX = -majorY * ratio * sign;
  const minorY = majorX * ratio * sign;

  let sweep = endParam - startParam;
  if (sweep <= 1e-9) sweep += Math.PI * 2;
  const closed = Math.abs(sweep - Math.PI * 2) <= 1e-4;
  const maxR = Math.max(majorLen, majorLen * ratio) * maxMatrixScale(mat);
  const steps = Math.max(closed ? 12 : 4, arcSteps(maxR, sweep, tolWorld));
  const limit = closed ? steps - 1 : steps;

  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= limit; i++) {
    const t = startParam + (sweep * i) / steps;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const lx = cx + majorX * cosT + minorX * sinT;
    const ly = cy + majorY * cosT + minorY * sinT;
    pts.push(applyMat(mat, lx, ly));
  }
  return { points: pts, closed };
}

/** 评估有理 B 样条曲线（de Boor 齐次坐标算法）。 */
function evalNurbs(
  u: number,
  degree: number,
  knots: readonly number[],
  ctrl: readonly [number, number][],
  weights: readonly number[]
): [number, number] {
  const n = ctrl.length;
  const p = degree;
  let k = p;
  if (u >= knots[n] - 1e-12) {
    k = n - 1;
    while (k > p && knots[k] >= knots[n] - 1e-12) k--;
  } else {
    for (let i = p; i < n; i++) {
      if (u >= knots[i] && u < knots[i + 1]) {
        k = i;
        break;
      }
    }
  }

  const d: Array<[number, number, number]> = [];
  for (let j = 0; j <= p; j++) {
    const idx = Math.max(0, Math.min(n - 1, k - p + j));
    const pt = ctrl[idx];
    const w = weights[idx] ?? 1;
    d.push([pt[0] * w, pt[1] * w, w]);
  }

  for (let r = 1; r <= p; r++) {
    for (let j = p; j >= r; j--) {
      const i = k - p + j;
      const uLeft = knots[i];
      const uRight = knots[i + p + 1 - r];
      const denom = uRight - uLeft;
      const alpha = Math.abs(denom) > 1e-12 ? (u - uLeft) / denom : 0;
      const prev = d[j - 1];
      const curr = d[j];
      d[j] = [
        (1 - alpha) * prev[0] + alpha * curr[0],
        (1 - alpha) * prev[1] + alpha * curr[1],
        (1 - alpha) * prev[2] + alpha * curr[2],
      ];
    }
  }

  const res = d[p];
  const invW = Math.abs(res[2]) > 1e-12 ? 1 / res[2] : 1;
  return [res[0] * invW, res[1] * invW];
}

function buildClampedUniformKnots(ctrlCount: number, degree: number): number[] {
  const total = ctrlCount + degree + 1;
  const interior = total - 2 * (degree + 1);
  const knots: number[] = [];
  for (let i = 0; i <= degree; i++) knots.push(0);
  for (let i = 1; i <= interior; i++) knots.push(i / (interior + 1));
  for (let i = 0; i <= degree; i++) knots.push(1);
  return knots;
}

/** 自适应采样 DXF `SPLINE` 曲线到世界坐标点列。 */
function sampleDxfSpline(
  degreeRaw: number,
  rawKnots: readonly number[],
  ctrl: readonly [number, number][],
  weights: readonly number[],
  fitPoints: readonly [number, number][],
  mat: Mat2D,
  tolWorld: number
): Array<[number, number]> {
  if (ctrl.length < 2) {
    return fitPoints.map(([x, y]) => applyMat(mat, x, y));
  }
  const p = Math.max(1, Math.min(degreeRaw || 3, ctrl.length - 1));
  const knots =
    rawKnots.length === ctrl.length + p + 1
      ? rawKnots
      : buildClampedUniformKnots(ctrl.length, p);

  const uMin = knots[p];
  const uMax = knots[ctrl.length];
  if (!Number.isFinite(uMin) || !Number.isFinite(uMax) || uMax <= uMin + 1e-12) {
    return ctrl.map(([x, y]) => applyMat(mat, x, y));
  }

  const evalWorld = (u: number): [number, number] => {
    const [lx, ly] = evalNurbs(u, p, knots, ctrl, weights);
    return applyMat(mat, lx, ly);
  };

  // 收集非退化节点区间断点，并在每段上自适应二分细化
  const breaks: number[] = [uMin];
  for (let i = p + 1; i <= ctrl.length; i++) {
    const v = knots[i];
    if (v > breaks[breaks.length - 1] + 1e-10 && v <= uMax + 1e-10) {
      breaks.push(Math.min(v, uMax));
    }
  }
  if (breaks.length < 2) breaks.push(uMax);

  const out: Array<[number, number]> = [evalWorld(breaks[0])];

  const pointToSegmentDist = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): number => {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-12) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  const subdivide = (
    uA: number,
    pA: [number, number],
    uB: number,
    pB: [number, number],
    depth: number
  ): void => {
    const uM = (uA + uB) * 0.5;
    const pM = evalWorld(uM);
    const err = pointToSegmentDist(pM[0], pM[1], pA[0], pA[1], pB[0], pB[1]);
    if (depth >= 7 || (depth >= 1 && err <= tolWorld)) {
      out.push(pM, pB);
      return;
    }
    subdivide(uA, pA, uM, pM, depth + 1);
    subdivide(uM, pM, uB, pB, depth + 1);
  };

  for (let i = 0; i + 1 < breaks.length; i++) {
    const uA = breaks[i];
    const uB = breaks[i + 1];
    const pA = out[out.length - 1];
    const pB = evalWorld(uB);
    subdivide(uA, pA, uB, pB, 0);
  }
  return out;
}

function dedupeWorldPoints(points: readonly [number, number][], closed: boolean): Point[] {
  const out: Point[] = [];
  for (const pt of points) {
    if (!Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
    const prev = out[out.length - 1];
    if (prev && Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) <= 1e-6) continue;
    out.push(pt);
  }
  if (closed && out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-6) {
      out.pop();
    }
  }
  return out;
}

/* ================= 组码流与实体词法结构 ================= */

interface GroupPair {
  code: number;
  value: string;
}

interface RawEntity {
  type: string;
  pairs: GroupPair[];
  vertices?: RawEntity[];
}

interface ParsedLayerMeta {
  name: string;
  color: number;
  linetype: Linetype;
  hidden: boolean;
}

interface ParsedBlock {
  name: string;
  baseX: number;
  baseY: number;
  entities: RawEntity[];
}

function tokenizeDxf(text: string): GroupPair[] {
  const lines = text.split(/\r\n|\r|\n/);
  const pairs: GroupPair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const codeStr = lines[i].trim();
    if (!codeStr) {
      // 容错：跳过偶发空行对齐偏移
      i -= 1;
      continue;
    }
    const code = Number.parseInt(codeStr, 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[i + 1] });
  }
  return pairs;
}

function normalizeLinetype(raw: string | undefined | null): Linetype | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  if (!s || s === 'BYLAYER' || s === 'BYBLOCK') return null;
  if (s === 'CONTINUOUS') return 'CONTINUOUS';
  if (s.includes('DOT') && !s.includes('DASH') && !s.includes('CENTER')) return 'DOT';
  if (
    s.includes('DASH') ||
    s.includes('HIDDEN') ||
    s.includes('CENTER') ||
    s.includes('PHANTOM') ||
    s.includes('BORDER') ||
    s.includes('DIVIDE')
  ) {
    return 'DASHED';
  }
  return 'CONTINUOUS';
}

function trueColorIntToAci(value: number): number {
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return colorToAci(rgbToHex(r, g, b));
}

function parseNum(value: string, fallback = 0): number {
  const n = Number.parseFloat(value.trim());
  return Number.isFinite(n) ? n : fallback;
}

function parseIntVal(value: string, fallback = 0): number {
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** 读取实体列表，直到遇到 `stopValues` 中的任意 `0` 组码标识。 */
function readEntityList(
  pairs: readonly GroupPair[],
  startIndex: number,
  stopValues: ReadonlySet<string>
): { entities: RawEntity[]; nextIndex: number } {
  const entities: RawEntity[] = [];
  let i = startIndex;

  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code === 0) {
      const tag = p.value.trim().toUpperCase();
      if (stopValues.has(tag)) break;

      const entity: RawEntity = { type: tag, pairs: [] };
      i++;
      while (i < pairs.length && pairs[i].code !== 0) {
        entity.pairs.push(pairs[i]);
        i++;
      }

      // 合并 POLYLINE + VERTEX... + SEQEND 为复合实体
      if (tag === 'POLYLINE') {
        const verts: RawEntity[] = [];
        while (i < pairs.length) {
          if (pairs[i].code !== 0) {
            i++;
            continue;
          }
          const subTag = pairs[i].value.trim().toUpperCase();
          if (subTag === 'SEQEND') {
            i++;
            while (i < pairs.length && pairs[i].code !== 0) i++;
            break;
          }
          if (stopValues.has(subTag)) break;
          if (subTag === 'VERTEX') {
            const v: RawEntity = { type: 'VERTEX', pairs: [] };
            i++;
            while (i < pairs.length && pairs[i].code !== 0) {
              v.pairs.push(pairs[i]);
              i++;
            }
            verts.push(v);
          } else {
            break;
          }
        }
        entity.vertices = verts;
      }

      if (tag !== 'SEQEND') {
        entities.push(entity);
      }
    } else {
      i++;
    }
  }

  return { entities, nextIndex: i };
}

/* ================= 主解析器实现 ================= */

/**
 * DXF 导入器：支持将 ASCII DXF 文本或字节流解析为统一 `DrawingDocument` IR。
 */
export class DxfImporter {
  private readonly defaults: DxfImportOptions;

  constructor(options: DxfImportOptions = {}) {
    this.defaults = options;
  }

  /** 解析 DXF 并直接返回 `DrawingDocument`。 */
  parse(
    input: string | Uint8Array | ArrayBuffer,
    options: DxfImportOptions = {}
  ): DrawingDocument {
    return parseDxfWithReport(input, { ...this.defaults, ...options }).document;
  }

  /** 解析 DXF 并返回含统计信息与告警的完整报告。 */
  parseWithReport(
    input: string | Uint8Array | ArrayBuffer,
    options: DxfImportOptions = {}
  ): DxfParseResult {
    return parseDxfWithReport(input, { ...this.defaults, ...options });
  }
}

/**
 * 将 ASCII DXF（文本 / `Uint8Array` / `ArrayBuffer`）解析为 `DrawingDocument` IR。
 *
 * 读取外部 `.dxf` 文件时推荐传入原始 `Uint8Array` / `ArrayBuffer`，
 * 以便自动识别 GBK (`ANSI_936`) 与 UTF-8，避免提前按 UTF-8 误读破坏中文。
 */
export function parseDxfToDocument(
  input: string | Uint8Array | ArrayBuffer,
  options: DxfImportOptions = {}
): DrawingDocument {
  return parseDxfWithReport(input, options).document;
}

/**
 * 将 ASCII DXF 解析为 `DrawingDocument` 并附带编码、实体统计与未支持实体告警报告。
 */
export function parseDxfWithReport(
  input: string | Uint8Array | ArrayBuffer,
  options: DxfImportOptions = {}
): DxfParseResult {
  const doc = new DrawingDocument();
  const warnings: string[] = [];
  const stats: DxfParseStats = {
    acadVersion: null,
    codepage: null,
    detectedEncoding: 'string',
    entityCounts: {},
    unsupportedEntities: {},
    skippedPaperSpace: 0,
    skippedHiddenLayer: 0,
    blockCount: 0,
    truncated: false,
  };

  let text = '';
  if (typeof input === 'string') {
    if (input.startsWith(BINARY_DXF_MAGIC)) {
      throw new Error(
        'Binary DXF is not supported yet. Please re-save the file as ASCII DXF.'
      );
    }
    text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  } else if (input instanceof ArrayBuffer) {
    const decoded = decodeDxfBytes(new Uint8Array(input), options.encoding ?? 'auto');
    text = decoded.text;
    stats.detectedEncoding = decoded.detectedEncoding;
  } else if (ArrayBuffer.isView(input)) {
    const view = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    const decoded = decodeDxfBytes(view, options.encoding ?? 'auto');
    text = decoded.text;
    stats.detectedEncoding = decoded.detectedEncoding;
  } else {
    warnings.push('Empty or invalid DXF input.');
    return { document: doc, stats, warnings };
  }

  const pairs = tokenizeDxf(text);
  if (pairs.length === 0) {
    warnings.push('No DXF group-code pairs were found.');
    return { document: doc, stats, warnings };
  }

  const spaceFilter: DxfSpaceFilter = options.space ?? 'model';
  const curveTolerance =
    Number.isFinite(options.curveTolerance) && (options.curveTolerance as number) > 0
      ? (options.curveTolerance as number)
      : 0.1;
  const includeHiddenLayers = options.includeHiddenLayers ?? false;
  const includeUnsupportedWarnings = options.includeUnsupportedWarnings ?? true;
  const maxPrimitives =
    options.maxPrimitives === undefined
      ? 200_000
      : Number.isFinite(options.maxPrimitives) && options.maxPrimitives > 0
        ? Math.floor(options.maxPrimitives)
        : 0;
  const maxBlockDepth =
    Number.isFinite(options.maxBlockDepth) && (options.maxBlockDepth as number) > 0
      ? Math.floor(options.maxBlockDepth as number)
      : 16;

  // 1. 分段解析 HEADER / TABLES / BLOCKS / ENTITIES
  let headerExtMin: [number, number] | null = null;
  let headerExtMax: [number, number] | null = null;
  const layerTable = new Map<string, ParsedLayerMeta>();
  const blocks = new Map<string, ParsedBlock>();
  const topEntities: RawEntity[] = [];

  const END_SECTION_STOPS = new Set(['ENDSEC', 'EOF']);
  const END_BLOCK_STOPS = new Set(['ENDBLK', 'ENDSEC', 'EOF']);

  let i = 0;
  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code === 0 && p.value.trim().toUpperCase() === 'EOF') break;

    if (p.code === 0 && p.value.trim().toUpperCase() === 'SECTION') {
      i++;
      if (i >= pairs.length || pairs[i].code !== 2) continue;
      const sectionName = pairs[i].value.trim().toUpperCase();
      i++;

      if (sectionName === 'HEADER') {
        let currentVar = '';
        let tmpX = NaN;
        let tmpY = NaN;
        const flushExtVar = (): void => {
          if (currentVar === '$EXTMIN' && Number.isFinite(tmpX) && Number.isFinite(tmpY)) {
            headerExtMin = [tmpX, tmpY];
          } else if (
            currentVar === '$EXTMAX' &&
            Number.isFinite(tmpX) &&
            Number.isFinite(tmpY)
          ) {
            headerExtMax = [tmpX, tmpY];
          }
          tmpX = NaN;
          tmpY = NaN;
        };

        while (i < pairs.length) {
          const hp = pairs[i];
          if (hp.code === 0 && hp.value.trim().toUpperCase() === 'ENDSEC') {
            flushExtVar();
            i++;
            break;
          }
          if (hp.code === 9) {
            flushExtVar();
            currentVar = hp.value.trim().toUpperCase();
          } else if (currentVar === '$ACADVER' && hp.code === 1) {
            stats.acadVersion = hp.value.trim() || null;
          } else if (currentVar === '$DWGCODEPAGE' && hp.code === 3) {
            stats.codepage = hp.value.trim() || null;
          } else if (currentVar === '$EXTMIN' || currentVar === '$EXTMAX') {
            if (hp.code === 10) tmpX = parseNum(hp.value, NaN);
            else if (hp.code === 20) tmpY = parseNum(hp.value, NaN);
          }
          i++;
        }
      } else if (sectionName === 'TABLES') {
        while (i < pairs.length) {
          const tp = pairs[i];
          if (tp.code === 0 && tp.value.trim().toUpperCase() === 'ENDSEC') {
            i++;
            break;
          }
          if (tp.code === 0 && tp.value.trim().toUpperCase() === 'TABLE') {
            i++;
            let tableName = '';
            while (i < pairs.length && pairs[i].code !== 0) {
              if (pairs[i].code === 2) tableName = pairs[i].value.trim().toUpperCase();
              i++;
            }
            if (tableName === 'LAYER') {
              while (i < pairs.length) {
                if (pairs[i].code === 0) {
                  const rec = pairs[i].value.trim().toUpperCase();
                  if (rec === 'ENDTAB' || rec === 'ENDSEC') {
                    if (rec === 'ENDTAB') i++;
                    break;
                  }
                  if (rec === 'LAYER') {
                    i++;
                    let rawName = '';
                    let rawColor = 7;
                    let trueColor: number | null = null;
                    let flags = 0;
                    let ltRaw = '';
                    while (i < pairs.length && pairs[i].code !== 0) {
                      const lp = pairs[i];
                      if (lp.code === 2) rawName = unescapeDxfText(lp.value.trim());
                      else if (lp.code === 62) rawColor = parseIntVal(lp.value, 7);
                      else if (lp.code === 420) trueColor = parseIntVal(lp.value, -1);
                      else if (lp.code === 70) flags = parseIntVal(lp.value, 0);
                      else if (lp.code === 6) ltRaw = lp.value.trim();
                      i++;
                    }
                    if (rawName) {
                      const safeName = sanitizeLayerCandidate(rawName, '0');
                      const hidden = rawColor < 0 || (flags & 1) !== 0;
                      const resolvedColor =
                        trueColor !== null && trueColor >= 0
                          ? trueColorIntToAci(trueColor)
                          : Math.max(1, Math.min(255, Math.abs(rawColor) || 7));
                      const linetype = normalizeLinetype(ltRaw) ?? 'CONTINUOUS';
                      if (!layerTable.has(safeName)) {
                        layerTable.set(safeName, {
                          name: safeName,
                          color: resolvedColor,
                          linetype,
                          hidden,
                        });
                      }
                    }
                    continue;
                  }
                }
                i++;
              }
            } else {
              // 跳过其它表（LTYPE/STYLE/VPORT/APPID 等）
              while (i < pairs.length) {
                if (pairs[i].code === 0) {
                  const rec = pairs[i].value.trim().toUpperCase();
                  if (rec === 'ENDTAB') {
                    i++;
                    break;
                  }
                  if (rec === 'ENDSEC') break;
                }
                i++;
              }
            }
          } else {
            i++;
          }
        }
      } else if (sectionName === 'BLOCKS') {
        while (i < pairs.length) {
          const bp = pairs[i];
          if (bp.code === 0 && bp.value.trim().toUpperCase() === 'ENDSEC') {
            i++;
            break;
          }
          if (bp.code === 0 && bp.value.trim().toUpperCase() === 'BLOCK') {
            i++;
            let name = '';
            let baseX = 0;
            let baseY = 0;
            while (i < pairs.length && pairs[i].code !== 0) {
              const hp = pairs[i];
              if (hp.code === 2 || hp.code === 3) {
                const candidate = unescapeDxfText(hp.value.trim());
                if (candidate && !name) name = candidate;
              } else if (hp.code === 10) {
                baseX = parseNum(hp.value, 0);
              } else if (hp.code === 20) {
                baseY = parseNum(hp.value, 0);
              }
              i++;
            }
            const body = readEntityList(pairs, i, END_BLOCK_STOPS);
            i = body.nextIndex;
            if (i < pairs.length && pairs[i].code === 0 && pairs[i].value.trim().toUpperCase() === 'ENDBLK') {
              i++;
              while (i < pairs.length && pairs[i].code !== 0) i++;
            }
            if (name) {
              blocks.set(name, { name, baseX, baseY, entities: body.entities });
            }
          } else {
            i++;
          }
        }
      } else if (sectionName === 'ENTITIES') {
        const res = readEntityList(pairs, i, END_SECTION_STOPS);
        for (const ent of res.entities) topEntities.push(ent);
        i = res.nextIndex;
        if (i < pairs.length && pairs[i].code === 0 && pairs[i].value.trim().toUpperCase() === 'ENDSEC') {
          i++;
        }
      } else {
        // 跳过 CLASSES / OBJECTS / THUMBNAILIMAGE 等非几何段
        while (i < pairs.length) {
          if (pairs[i].code === 0 && pairs[i].value.trim().toUpperCase() === 'ENDSEC') {
            i++;
            break;
          }
          i++;
        }
      }
    } else {
      i++;
    }
  }

  stats.blockCount = blocks.size;

  // 2. 向文档注册图层表（去重并跳过 '0'，避免与 DxfSerializer 固定 0 层重复）
  const registeredLayers = new Set<string>(['0']);
  const ensureLayer = (name: string): string => {
    const safe = sanitizeLayerCandidate(name, '0');
    if (!registeredLayers.has(safe)) {
      registeredLayers.add(safe);
      const meta = layerTable.get(safe);
      doc.addLayer(safe, meta?.color ?? 7, meta?.linetype ?? 'CONTINUOUS');
    }
    return safe;
  };

  for (const meta of layerTable.values()) {
    if (!meta.hidden || includeHiddenLayers) {
      ensureLayer(meta.name);
    }
  }

  // 3. 实体转换上下文（含块嵌套、BYBLOCK/0层继承与上限保护）
  let emitted = 0;
  const canEmit = (): boolean => {
    if (maxPrimitives > 0 && emitted >= maxPrimitives) {
      stats.truncated = true;
      return false;
    }
    return true;
  };

  const countEntity = (type: string): void => {
    stats.entityCounts[type] = (stats.entityCounts[type] ?? 0) + 1;
  };

  const countUnsupported = (type: string): void => {
    stats.unsupportedEntities[type] = (stats.unsupportedEntities[type] ?? 0) + 1;
  };

  interface BlockContext {
    layer: string;
    color: number | null;
    linetype: Linetype | null;
    depth: number;
  }

  const emitEntities = (
    entities: readonly RawEntity[],
    mat: Mat2D,
    blockCtx: BlockContext | null
  ): void => {
    for (const ent of entities) {
      if (!canEmit()) return;

      // 提取公共组码：图层(8)、颜色(62/420)、线型(6)、空间(67)、法向Z(230)
      let rawLayer = '0';
      let rawColor: number | null = null;
      let trueColor: number | null = null;
      let rawLinetype: string | null = null;
      let paperSpace = 0;
      let extrusionZ = 1;

      for (const p of ent.pairs) {
        if (p.code === 8) rawLayer = unescapeDxfText(p.value.trim()) || '0';
        else if (p.code === 62) rawColor = parseIntVal(p.value, 256);
        else if (p.code === 420) trueColor = parseIntVal(p.value, -1);
        else if (p.code === 6) rawLinetype = p.value.trim();
        else if (p.code === 67) paperSpace = parseIntVal(p.value, 0);
        else if (p.code === 230) extrusionZ = parseNum(p.value, 1);
      }

      // 顶层实体应用空间过滤（块内部实体随 INSERT 所在空间）
      if (!blockCtx) {
        if (spaceFilter === 'model' && paperSpace === 1) {
          stats.skippedPaperSpace++;
          continue;
        }
        if (spaceFilter === 'paper' && paperSpace !== 1) {
          stats.skippedPaperSpace++;
          continue;
        }
      }

      // AutoCAD 块继承规则：块内 0 层图元继承 INSERT 图层
      let effectiveLayer = sanitizeLayerCandidate(rawLayer, '0');
      if (blockCtx && effectiveLayer === '0') {
        effectiveLayer = blockCtx.layer;
      }

      const layerMeta = layerTable.get(effectiveLayer);
      if (layerMeta?.hidden && !includeHiddenLayers) {
        stats.skippedHiddenLayer++;
        continue;
      }
      effectiveLayer = ensureLayer(effectiveLayer);

      // 颜色解析：TrueColor(420) > 显式 ACI(1..255) > BYBLOCK(0) 继承块色 > BYLAYER(null/256)
      let color: number | null = null;
      if (trueColor !== null && trueColor >= 0) {
        color = trueColorIntToAci(trueColor);
      } else if (rawColor === 0) {
        color = blockCtx ? blockCtx.color : 0;
      } else if (rawColor !== null && rawColor !== 256) {
        const abs = Math.abs(rawColor);
        color = abs >= 1 && abs <= 255 ? abs : null;
      }

      // 线型解析：BYBLOCK 继承块线型，否则随自身显式线型（BYLAYER 保留 null）
      const ltUpper = rawLinetype ? rawLinetype.trim().toUpperCase() : '';
      const linetype: Linetype | null =
        ltUpper === 'BYBLOCK'
          ? (blockCtx?.linetype ?? null)
          : normalizeLinetype(rawLinetype);

      // OCS 法向 Z < 0 时做局部 X 镜像（AutoCAD 2D 镜像实体常见）
      const entityMat: Mat2D =
        extrusionZ < 0 ? mulMat(mat, [-1, 0, 0, 1, 0, 0]) : mat;

      switch (ent.type) {
        case 'LINE': {
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          for (const p of ent.pairs) {
            if (p.code === 10) x1 = parseNum(p.value);
            else if (p.code === 20) y1 = parseNum(p.value);
            else if (p.code === 11) x2 = parseNum(p.value);
            else if (p.code === 21) y2 = parseNum(p.value);
          }
          const [wx1, wy1] = applyMat(entityMat, x1, y1);
          const [wx2, wy2] = applyMat(entityMat, x2, y2);
          doc.addLine(wx1, wy1, wx2, wy2, effectiveLayer, color, linetype);
          emitted++;
          countEntity('LINE');
          break;
        }

        case 'CIRCLE': {
          let cx = 0;
          let cy = 0;
          let r = 0;
          for (const p of ent.pairs) {
            if (p.code === 10) cx = parseNum(p.value);
            else if (p.code === 20) cy = parseNum(p.value);
            else if (p.code === 40) r = parseNum(p.value);
          }
          if (r <= 0) break;
          const uScale = uniformScaleIfSimilar(entityMat);
          if (uScale !== null) {
            const [wcx, wcy] = applyMat(entityMat, cx, cy);
            doc.addCircle(wcx, wcy, r * uScale, effectiveLayer, color, linetype);
          } else {
            const pts: Array<[number, number]> = [];
            sampleArcPoints(cx, cy, r, 0, Math.PI * 2, entityMat, curveTolerance, true, pts);
            const clean = dedupeWorldPoints(pts, true);
            if (clean.length >= 2) {
              doc.addPolyline(
                clean,
                effectiveLayer,
                color,
                true,
                0,
                linetype ? { linetype } : undefined
              );
            }
          }
          emitted++;
          countEntity('CIRCLE');
          break;
        }

        case 'ARC': {
          let cx = 0;
          let cy = 0;
          let r = 0;
          let startDeg = 0;
          let endDeg = 360;
          for (const p of ent.pairs) {
            if (p.code === 10) cx = parseNum(p.value);
            else if (p.code === 20) cy = parseNum(p.value);
            else if (p.code === 40) r = parseNum(p.value);
            else if (p.code === 50) startDeg = parseNum(p.value);
            else if (p.code === 51) endDeg = parseNum(p.value);
          }
          if (r <= 0) break;
          let sweepDeg = endDeg - startDeg;
          while (sweepDeg <= 0) sweepDeg += 360;
          if (sweepDeg > 360) sweepDeg %= 360;
          const pts: Array<[number, number]> = [];
          sampleArcPoints(
            cx,
            cy,
            r,
            (startDeg * Math.PI) / 180,
            (sweepDeg * Math.PI) / 180,
            entityMat,
            curveTolerance,
            true,
            pts
          );
          const clean = dedupeWorldPoints(pts, false);
          if (clean.length >= 2) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              false,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('ARC');
          }
          break;
        }

        case 'LWPOLYLINE': {
          let flags = 0;
          let constWidth = 0;
          let firstWidth = 0;
          const verts: Array<{ x: number; y: number; bulge: number }> = [];
          let cur: { x: number; y: number; bulge: number } | null = null;

          for (const p of ent.pairs) {
            if (p.code === 70) flags = parseIntVal(p.value, 0);
            else if (p.code === 43) constWidth = parseNum(p.value, 0);
            else if (p.code === 40 && firstWidth === 0) firstWidth = parseNum(p.value, 0);
            else if (p.code === 10) {
              cur = { x: parseNum(p.value), y: 0, bulge: 0 };
              verts.push(cur);
            } else if (p.code === 20 && cur) {
              cur.y = parseNum(p.value);
            } else if (p.code === 42 && cur) {
              cur.bulge = parseNum(p.value, 0);
            }
          }
          if (verts.length < 2) break;

          const closed = (flags & 1) !== 0;
          const sampled: Array<[number, number]> = [applyMat(entityMat, verts[0].x, verts[0].y)];
          const segCount = closed ? verts.length : verts.length - 1;
          for (let s = 0; s < segCount; s++) {
            const v1 = verts[s];
            const v2 = verts[(s + 1) % verts.length];
            sampleBulgeSegment(
              v1.x,
              v1.y,
              v2.x,
              v2.y,
              v1.bulge,
              entityMat,
              curveTolerance,
              sampled
            );
          }
          const clean = dedupeWorldPoints(sampled, closed);
          if (clean.length >= 2) {
            const rawWidth = constWidth > 0 ? constWidth : firstWidth;
            const lw = rawWidth > 0 ? rawWidth * maxMatrixScale(entityMat) : 0;
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              lw,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('LWPOLYLINE');
          }
          break;
        }

        case 'POLYLINE': {
          let flags = 0;
          let defaultW = 0;
          for (const p of ent.pairs) {
            if (p.code === 70) flags = parseIntVal(p.value, 0);
            else if (p.code === 40 && defaultW === 0) defaultW = parseNum(p.value, 0);
            else if (p.code === 41 && defaultW === 0) defaultW = parseNum(p.value, 0);
          }
          // 跳过 3D 多面网格（64）或 3D 多边形网格（16）
          if ((flags & 16) !== 0 || (flags & 64) !== 0) {
            countUnsupported('POLYLINE_MESH');
            break;
          }

          const rawVerts = ent.vertices ?? [];
          const verts: Array<{ x: number; y: number; bulge: number }> = [];
          let vertWidth = 0;
          for (const v of rawVerts) {
            let vx = 0;
            let vy = 0;
            let bulge = 0;
            let vFlags = 0;
            for (const vp of v.pairs) {
              if (vp.code === 10) vx = parseNum(vp.value);
              else if (vp.code === 20) vy = parseNum(vp.value);
              else if (vp.code === 42) bulge = parseNum(vp.value, 0);
              else if (vp.code === 40 && vertWidth === 0) vertWidth = parseNum(vp.value, 0);
              else if (vp.code === 70) vFlags = parseIntVal(vp.value, 0);
            }
            // 跳过样条拟合控制框架顶点（16）与多面网格面记录（128 且非 64）
            if ((vFlags & 16) !== 0 || ((vFlags & 128) !== 0 && (vFlags & 64) === 0)) continue;
            verts.push({ x: vx, y: vy, bulge });
          }
          if (verts.length < 2) break;

          const closed = (flags & 1) !== 0;
          const sampled: Array<[number, number]> = [applyMat(entityMat, verts[0].x, verts[0].y)];
          const segCount = closed ? verts.length : verts.length - 1;
          for (let s = 0; s < segCount; s++) {
            const v1 = verts[s];
            const v2 = verts[(s + 1) % verts.length];
            sampleBulgeSegment(
              v1.x,
              v1.y,
              v2.x,
              v2.y,
              v1.bulge,
              entityMat,
              curveTolerance,
              sampled
            );
          }
          const clean = dedupeWorldPoints(sampled, closed);
          if (clean.length >= 2) {
            const rawWidth = defaultW > 0 ? defaultW : vertWidth;
            const lw = rawWidth > 0 ? rawWidth * maxMatrixScale(entityMat) : 0;
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              lw,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('POLYLINE');
          }
          break;
        }

        case 'SOLID':
        case 'TRACE': {
          let x0 = 0;
          let y0 = 0;
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          let x3 = 0;
          let y3 = 0;
          let has3 = false;
          for (const p of ent.pairs) {
            if (p.code === 10) x0 = parseNum(p.value);
            else if (p.code === 20) y0 = parseNum(p.value);
            else if (p.code === 11) x1 = parseNum(p.value);
            else if (p.code === 21) y1 = parseNum(p.value);
            else if (p.code === 12) x2 = parseNum(p.value);
            else if (p.code === 22) y2 = parseNum(p.value);
            else if (p.code === 13) {
              x3 = parseNum(p.value);
              has3 = true;
            } else if (p.code === 23) {
              y3 = parseNum(p.value);
              has3 = true;
            }
          }
          const p0 = applyMat(entityMat, x0, y0);
          const p1 = applyMat(entityMat, x1, y1);
          const p2 = applyMat(entityMat, x2, y2);
          const p3 = applyMat(entityMat, x3, y3);
          const isTriangle = !has3 || Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) <= 1e-6;
          // 还原 DXF SOLID Z 字序：[p0, p1, p2, p3] -> 轮廓序 [p0, p1, p3, p2]
          const contour: Point[] = isTriangle ? [p0, p1, p2] : [p0, p1, p3, p2];
          doc.addSolid(contour, effectiveLayer, color);
          emitted++;
          countEntity(ent.type);
          break;
        }

        case '3DFACE': {
          let x0 = 0;
          let y0 = 0;
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          let x3 = 0;
          let y3 = 0;
          let has3 = false;
          for (const p of ent.pairs) {
            if (p.code === 10) x0 = parseNum(p.value);
            else if (p.code === 20) y0 = parseNum(p.value);
            else if (p.code === 11) x1 = parseNum(p.value);
            else if (p.code === 21) y1 = parseNum(p.value);
            else if (p.code === 12) x2 = parseNum(p.value);
            else if (p.code === 22) y2 = parseNum(p.value);
            else if (p.code === 13) {
              x3 = parseNum(p.value);
              has3 = true;
            } else if (p.code === 23) {
              y3 = parseNum(p.value);
              has3 = true;
            }
          }
          const rawPts: Array<[number, number]> = [
            applyMat(entityMat, x0, y0),
            applyMat(entityMat, x1, y1),
            applyMat(entityMat, x2, y2),
          ];
          if (has3) rawPts.push(applyMat(entityMat, x3, y3));
          const clean = dedupeWorldPoints(rawPts, true);
          if (clean.length >= 3) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              true,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('3DFACE');
          }
          break;
        }

        case 'ELLIPSE': {
          let cx = 0;
          let cy = 0;
          let mx = 0;
          let my = 0;
          let ratio = 1;
          let startParam = 0;
          let endParam = Math.PI * 2;
          for (const p of ent.pairs) {
            if (p.code === 10) cx = parseNum(p.value);
            else if (p.code === 20) cy = parseNum(p.value);
            else if (p.code === 11) mx = parseNum(p.value);
            else if (p.code === 21) my = parseNum(p.value);
            else if (p.code === 40) ratio = parseNum(p.value, 1);
            else if (p.code === 41) startParam = parseNum(p.value, 0);
            else if (p.code === 42) endParam = parseNum(p.value, Math.PI * 2);
          }
          const { points, closed } = sampleDxfEllipse(
            cx,
            cy,
            mx,
            my,
            ratio,
            startParam,
            endParam,
            extrusionZ < 0,
            mat,
            curveTolerance
          );
          const clean = dedupeWorldPoints(points, closed);
          if (clean.length >= 2) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('ELLIPSE');
          }
          break;
        }

        case 'SPLINE': {
          let flags = 0;
          let degree = 3;
          const knots: number[] = [];
          const weights: number[] = [];
          const ctrl: Array<[number, number]> = [];
          const fit: Array<[number, number]> = [];
          let curCtrl: [number, number] | null = null;
          let curFit: [number, number] | null = null;

          for (const p of ent.pairs) {
            if (p.code === 70) flags = parseIntVal(p.value, 0);
            else if (p.code === 71) degree = parseIntVal(p.value, 3);
            else if (p.code === 40) knots.push(parseNum(p.value));
            else if (p.code === 41) weights.push(parseNum(p.value, 1));
            else if (p.code === 10) {
              curCtrl = [parseNum(p.value), 0];
              ctrl.push(curCtrl);
            } else if (p.code === 20 && curCtrl) {
              curCtrl[1] = parseNum(p.value);
            } else if (p.code === 11) {
              curFit = [parseNum(p.value), 0];
              fit.push(curFit);
            } else if (p.code === 21 && curFit) {
              curFit[1] = parseNum(p.value);
            }
          }

          const closed = (flags & 1) !== 0;
          const pts = sampleDxfSpline(
            degree,
            knots,
            ctrl,
            weights,
            fit,
            entityMat,
            curveTolerance
          );
          const clean = dedupeWorldPoints(pts, closed);
          if (clean.length >= 2) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('SPLINE');
          }
          break;
        }

        case 'TEXT':
        case 'ATTRIB': {
          let x10 = 0;
          let y10 = 0;
          let x11 = 0;
          let y11 = 0;
          let has11 = false;
          let h = 2.5;
          let rot = 0;
          let widthFactor = 0.85;
          let rawHAlign = 0;
          let rawVAlign = 0;
          let rawText = '';

          for (const p of ent.pairs) {
            if (p.code === 10) x10 = parseNum(p.value);
            else if (p.code === 20) y10 = parseNum(p.value);
            else if (p.code === 11) {
              x11 = parseNum(p.value);
              has11 = true;
            } else if (p.code === 21) {
              y11 = parseNum(p.value);
              has11 = true;
            } else if (p.code === 40) h = parseNum(p.value, 2.5);
            else if (p.code === 50) rot = parseNum(p.value, 0);
            else if (p.code === 41) widthFactor = parseNum(p.value, 0.85);
            else if (p.code === 72) rawHAlign = parseIntVal(p.value, 0);
            else if (p.code === 73) rawVAlign = parseIntVal(p.value, 0);
            else if (p.code === 1) rawText = p.value;
          }

          const content = unescapeDxfText(rawText).trim();
          if (!content || h <= 0) break;

          let hAlign: HAlign = 0;
          let vAlign: VAlign =
            rawVAlign === 1 || rawVAlign === 2 || rawVAlign === 3 ? rawVAlign : 0;
          if (rawHAlign === 1) hAlign = 1;
          else if (rawHAlign === 2) hAlign = 2;
          else if (rawHAlign === 4) {
            hAlign = 1;
            if (vAlign === 0) vAlign = 2;
          }

          const useAlignPt =
            has11 &&
            (rawHAlign !== 0 || rawVAlign !== 0) &&
            rawHAlign !== 3 &&
            rawHAlign !== 5;
          const ax = useAlignPt ? x11 : x10;
          const ay = useAlignPt ? y11 : y10;
          const [wx, wy] = applyMat(entityMat, ax, ay);

          const baseWf = widthFactor > 0 ? widthFactor : 0.85;
          let worldRot = rot;
          let worldH = h;
          let wf = baseWf;
          if (entityMat !== IDENTITY_MAT) {
            const rad = (rot * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const vx = entityMat[0] * cos + entityMat[2] * sin;
            const vy = entityMat[1] * cos + entityMat[3] * sin;
            const ux = -entityMat[0] * sin + entityMat[2] * cos;
            const uy = -entityMat[1] * sin + entityMat[3] * cos;
            worldRot = (Math.atan2(vy, vx) * 180) / Math.PI;
            const yLen = Math.hypot(ux, uy);
            worldH = h * (yLen || 1);
            const scaleRatio = yLen > 1e-6 ? Math.hypot(vx, vy) / yLen : 1;
            wf = Math.max(0.1, baseWf * scaleRatio);
          }

          doc.addText(
            wx,
            wy,
            worldH,
            content,
            effectiveLayer,
            color,
            Math.abs(worldRot) < 1e-6 ? 0 : worldRot,
            hAlign,
            vAlign,
            wf
          );
          emitted++;
          countEntity(ent.type);
          break;
        }

        case 'MTEXT': {
          let x = 0;
          let y = 0;
          let dirX = 0;
          let dirY = 0;
          let hasDir = false;
          let h = 2.5;
          let rot50 = 0;
          let attach = 1;
          let chunks = '';

          for (const p of ent.pairs) {
            if (p.code === 10) x = parseNum(p.value);
            else if (p.code === 20) y = parseNum(p.value);
            else if (p.code === 11) {
              dirX = parseNum(p.value);
              hasDir = true;
            } else if (p.code === 21) {
              dirY = parseNum(p.value);
              hasDir = true;
            } else if (p.code === 40) h = parseNum(p.value, 2.5);
            else if (p.code === 50) rot50 = parseNum(p.value, 0);
            else if (p.code === 71) attach = parseIntVal(p.value, 1);
            else if (p.code === 3) chunks += p.value;
            else if (p.code === 1) chunks += p.value;
          }

          const content = stripMtextFormatting(chunks).trim();
          if (!content || h <= 0) break;

          // MTEXT 组码 11/21 方向向量优先于组码 50 旋转角
          const localRot =
            hasDir && Math.hypot(dirX, dirY) > 1e-6
              ? (Math.atan2(dirY, dirX) * 180) / Math.PI
              : rot50;

          const colIdx = (attach - 1) % 3; // 0=L, 1=C, 2=R
          const rowIdx = Math.floor((attach - 1) / 3); // 0=T, 1=M, 2=B
          const hAlign: HAlign = colIdx === 1 ? 1 : colIdx === 2 ? 2 : 0;
          const vAlign: VAlign = rowIdx === 0 ? 3 : rowIdx === 2 ? 1 : 2;

          const [wx, wy] = applyMat(entityMat, x, y);
          let worldRot = localRot;
          let worldH = h;
          if (entityMat !== IDENTITY_MAT) {
            const rad = (localRot * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const vx = entityMat[0] * cos + entityMat[2] * sin;
            const vy = entityMat[1] * cos + entityMat[3] * sin;
            const ux = -entityMat[0] * sin + entityMat[2] * cos;
            const uy = -entityMat[1] * sin + entityMat[3] * cos;
            worldRot = (Math.atan2(vy, vx) * 180) / Math.PI;
            worldH = h * (Math.hypot(ux, uy) || 1);
          }

          // 多行 MTEXT：DrawingDocument.addText 以锚点为垂直中心展开，
          // 顶对齐(3)下移半块高度、底对齐(1)上移半块高度以保持真实贴边位置。
          const lineCount = content.split('\n').length;
          let adjX = wx;
          let adjY = wy;
          if (lineCount > 1 && (vAlign === 3 || vAlign === 1)) {
            const halfBlock = ((lineCount - 1) * worldH * 1.35) / 2;
            const shift = vAlign === 3 ? -halfBlock : halfBlock;
            const wRad = (worldRot * Math.PI) / 180;
            adjX += -Math.sin(wRad) * shift;
            adjY += Math.cos(wRad) * shift;
          }

          const beforeCmds = doc.commands.length;
          doc.addText(
            adjX,
            adjY,
            worldH,
            content,
            effectiveLayer,
            color,
            Math.abs(worldRot) < 1e-6 ? 0 : worldRot,
            hAlign,
            vAlign,
            0.85
          );
          emitted += doc.commands.length - beforeCmds;
          countEntity('MTEXT');
          break;
        }

        case 'POINT': {
          let x = 0;
          let y = 0;
          for (const p of ent.pairs) {
            if (p.code === 10) x = parseNum(p.value);
            else if (p.code === 20) y = parseNum(p.value);
          }
          const [wx, wy] = applyMat(entityMat, x, y);
          doc.addCircle(wx, wy, 0.25, effectiveLayer, color);
          emitted++;
          countEntity('POINT');
          break;
        }

        case 'INSERT': {
          const depth = blockCtx ? blockCtx.depth + 1 : 1;
          if (depth > maxBlockDepth) {
            warnings.push(`Maximum INSERT nesting depth (${maxBlockDepth}) reached; skipped.`);
            break;
          }
          let blockName = '';
          let insX = 0;
          let insY = 0;
          let sx = 1;
          let sy = 1;
          let rot = 0;
          let cols = 1;
          let rows = 1;
          let colSpacing = 0;
          let rowSpacing = 0;

          for (const p of ent.pairs) {
            if (p.code === 2) blockName = unescapeDxfText(p.value.trim());
            else if (p.code === 10) insX = parseNum(p.value);
            else if (p.code === 20) insY = parseNum(p.value);
            else if (p.code === 41) sx = parseNum(p.value, 1);
            else if (p.code === 42) sy = parseNum(p.value, 1);
            else if (p.code === 50) rot = parseNum(p.value, 0);
            else if (p.code === 70) cols = Math.max(1, parseIntVal(p.value, 1));
            else if (p.code === 71) rows = Math.max(1, parseIntVal(p.value, 1));
            else if (p.code === 44) colSpacing = parseNum(p.value, 0);
            else if (p.code === 45) rowSpacing = parseNum(p.value, 0);
          }

          const block = blocks.get(blockName);
          if (!block) {
            if (blockName) countUnsupported(`MISSING_BLOCK:${blockName}`);
            break;
          }

          countEntity('INSERT');
          const rad = (rot * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const nextCtx: BlockContext = {
            layer: effectiveLayer,
            color,
            linetype,
            depth,
          };

          for (let rIdx = 0; rIdx < rows; rIdx++) {
            for (let cIdx = 0; cIdx < cols; cIdx++) {
              if (!canEmit()) return;
              const localDx = cIdx * colSpacing;
              const localDy = rIdx * rowSpacing;
              const offX = insX + localDx * cos - localDy * sin;
              const offY = insY + localDx * sin + localDy * cos;
              const localMat = buildInsertMatrix(
                offX,
                offY,
                sx,
                sy,
                rot,
                block.baseX,
                block.baseY
              );
              emitEntities(block.entities, mulMat(entityMat, localMat), nextCtx);
            }
          }
          break;
        }

        case 'DIMENSION': {
          // 优先展开 AutoCAD 自动生成的匿名标注块 (*D1, *D2...)
          let dimBlockName = '';
          for (const p of ent.pairs) {
            if (p.code === 2) {
              dimBlockName = unescapeDxfText(p.value.trim());
              break;
            }
          }
          const dimBlock = dimBlockName ? blocks.get(dimBlockName) : undefined;
          const depth = blockCtx ? blockCtx.depth + 1 : 1;
          if (dimBlock && depth <= maxBlockDepth) {
            countEntity('DIMENSION');
            const localMat = buildInsertMatrix(0, 0, 1, 1, 0, dimBlock.baseX, dimBlock.baseY);
            emitEntities(dimBlock.entities, mulMat(entityMat, localMat), {
              layer: effectiveLayer,
              color,
              linetype,
              depth,
            });
          } else {
            countUnsupported('DIMENSION');
          }
          break;
        }

        case 'ATTDEF':
          // 块定义模板占位符，仅在作为真实 ATTRIB 实例化时渲染，此处静默跳过
          break;

        default:
          countUnsupported(ent.type);
          break;
      }
    }
  };

  emitEntities(topEntities, IDENTITY_MAT, null);

  // 4. 自动根据实际生成图元计算精确包围盒（避开外部 DXF 中常见的过期 $EXTMIN/$EXTMAX）
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const cmd of doc.commands) {
    switch (cmd.type) {
      case 'line':
        include(cmd.x1, cmd.y1);
        include(cmd.x2, cmd.y2);
        break;
      case 'circle':
        include(cmd.cx - cmd.r, cmd.cy - cmd.r);
        include(cmd.cx + cmd.r, cmd.cy + cmd.r);
        break;
      case 'polyline':
        for (const [px, py] of cmd.points) include(px, py);
        break;
      case 'text':
        include(cmd.x, cmd.y);
        break;
      case 'solid':
        for (const [px, py] of cmd.points) include(px, py);
        break;
    }
  }

  if (Number.isFinite(minX) && Number.isFinite(minY)) {
    if (maxX === minX) maxX = minX + 1;
    if (maxY === minY) maxY = minY + 1;
    doc.setExtents(minX, minY, maxX, maxY);
  } else if (
    headerExtMin &&
    headerExtMax &&
    headerExtMax[0] > headerExtMin[0] &&
    headerExtMax[1] > headerExtMin[1] &&
    Math.abs(headerExtMin[0]) < 1e15 &&
    Math.abs(headerExtMax[0]) < 1e15
  ) {
    doc.setExtents(headerExtMin[0], headerExtMin[1], headerExtMax[0], headerExtMax[1]);
  }

  // 5. 汇总告警
  if (stats.truncated) {
    warnings.push(`Entity limit (${maxPrimitives}) reached; remaining geometry was truncated.`);
  }
  if (includeUnsupportedWarnings) {
    const entries = Object.entries(stats.unsupportedEntities);
    if (entries.length > 0) {
      const summary = entries.map(([name, cnt]) => `${name}(${cnt})`).join(', ');
      warnings.push(`Skipped unsupported DXF entities: ${summary}`);
    }
  }

  return { document: doc, stats, warnings };
}

```

## src\dxf\serializer.ts
```ts
/**
 * DXF 输出端：把 `DocumentData` 快照序列化为 AutoCAD R12（AC1009）文本/字节。
 *
 * 受「输出字节稳定性契约」严格保护：组码取值与出现顺序、换行风格、清洗规则
 * 都逐字沿用旧实现——这里的任何改动都等同于破坏输出字节（breaking change）。
 */

import { resolveDocumentData, type DocumentLike } from '../core/data';
import { fmtNumber } from '../core/format';
import { DEFAULT_TEXT_METRICS } from '../core/text';
import type { DocumentData, DrawCommand } from '../core/types';
import { getGbkTable, textCodec, type TextCodec } from '../encoding';

export type DxfEncoding = 'gbk' | 'utf8';

/** 内置 DXF 字体配方预设名（覆盖国标 SHX、传统单线、机械、结构与 TrueType 常用组合）。 */
export type DxfFontPreset =
  | 'gbcbig'
  | 'gbenor'
  | 'gbeitc'
  | 'hztxt'
  | 'hzfs'
  | 'romans'
  | 'tssd'
  | 'simsun';

/** 自定义 DXF STYLE 字体配方（组码 3 主字体 + 组码 4 大字体）。 */
export interface DxfFontRecipe {
  /** 组码 3：主字体（西文 SHX 或 TrueType，如 `gbenor.shx`、`simsun.ttf`）。 */
  primary: string;
  /** 组码 4：中文大字体（如 `gbcbig.shx`、`hztxt.shx`）；TrueType 或纯西文留空。 */
  big?: string;
}

export type DxfFont = DxfFontPreset | DxfFontRecipe;
export type NewlineStyle = 'crlf' | 'lf';

/**
 * 值清洗（【勿改·字节契约】）。
 *
 * DXF 是严格的"组码行 + 值行"成对格式，任何内嵌 CR/LF 都会破坏整个文件，
 * 所以写入前先压平换行。图层名还要去掉反斜杠，并在 GBK 编码下【先】把表外
 * 字符替换掉——否则 `encodeToGbk()` 会把它们转成含反斜杠的 `\U+XXXX` 写进
 * LAYER 表，而 CAD 会拒收这种图层名。
 */
const sanitizeLineValue = (value: string): string =>
  String(value).replace(/[\r\n]+/g, ' ');

// AutoCAD DXF 符号表名禁用 <>／":;?*|,=` 及控制字符。
const INVALID_LAYER_CHARS = /[\\<>\/":;?*|,=`\x00-\x1f]/g;

// 清洗图层名：压平换行、替换禁用字符；GBK 下再把表外非 ASCII 字符换成 '_'；
// 结果 trim 后若为空则用 "0" 兜底。
const sanitizeLayerName = (value: string, useGbk = false): string => {
  let clean = sanitizeLineValue(value).replace(INVALID_LAYER_CHARS, '_');
  if (useGbk && /[^\x00-\x7f]/.test(clean)) {
    const table = getGbkTable();
    let out = '';
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      if (code < 0x80) {
        out += clean.charAt(i);
      } else {
        const ch = clean.charAt(i);
        out += table.has(ch) ? ch : '_';
      }
    }
    clean = out;
  }
  const trimmed = clean.trim();
  return trimmed || '0';
};

// 清洗图层颜色：仅接受非 0、|值|<=255 的整数，否则回退默认 7。
const sanitizeLayerColor = (color: number): number =>
  Number.isInteger(color) && color !== 0 && Math.abs(color) <= 255 ? color : 7;

// 清洗线型：压平换行并 trim，空值回退 CONTINUOUS。
const sanitizeLinetype = (linetype: string): string => {
  const clean = sanitizeLineValue(linetype).trim();
  return clean || 'CONTINUOUS';
};

/** 内置常用 CJK CAD 字体配方表（原有 gbcbig / hztxt / simsun 保持字节不变）。 */
export const DXF_FONT_RECIPES: Readonly<
  Record<DxfFontPreset, Readonly<{ primary: string; big: string }>>
> = Object.freeze({
  gbcbig: Object.freeze({ primary: 'txt.shx', big: 'gbcbig.shx' }),
  gbenor: Object.freeze({ primary: 'gbenor.shx', big: 'gbcbig.shx' }),
  gbeitc: Object.freeze({ primary: 'gbeitc.shx', big: 'gbcbig.shx' }),
  hztxt: Object.freeze({ primary: 'txt.shx', big: 'hztxt.shx' }),
  hzfs: Object.freeze({ primary: 'txt.shx', big: 'hzfs.shx' }),
  romans: Object.freeze({ primary: 'romans.shx', big: 'gbcbig.shx' }),
  tssd: Object.freeze({ primary: 'tssdeng.shx', big: 'tssdchn.shx' }),
  simsun: Object.freeze({ primary: 'simsun.ttf', big: '' }),
});

/** 解析字体选项为 STYLE 表组码 3（主字体）与组码 4（大字体）。 */
export function resolveDxfFont(font: DxfFont = 'gbcbig'): { primary: string; big: string } {
  if (!font) return DXF_FONT_RECIPES.gbcbig;
  if (typeof font === 'string') {
    return Object.prototype.hasOwnProperty.call(DXF_FONT_RECIPES, font)
      ? DXF_FONT_RECIPES[font as DxfFontPreset]
      : DXF_FONT_RECIPES.gbcbig;
  }
  const primary = sanitizeLineValue(font.primary ?? '').trim() || 'txt.shx';
  const big = sanitizeLineValue(font.big ?? '').trim();
  return { primary, big };
}

/** 序列化选项。 */
export interface DxfSerializeOptions {
  /** 字节编码方式 + $DWGCODEPAGE 声明，默认 'gbk'。 */
  encoding?: DxfEncoding;
  /** STYLE 表字体配方，默认 'gbcbig'。 */
  font?: DxfFont;
  /** 行结束符风格，默认 'crlf'。 */
  newline?: NewlineStyle;
  /**
   * 是否跳过会让 CAD 拒收整份文件的实体（非正半径/字高、非有限坐标、
   * 非法 ACI、单点折线）。默认 true。
   */
  validate?: boolean;
  /** 每跳过一个实体回调一次，参数是跳过原因。 */
  onInvalidCommand?: (command: DrawCommand, reason: string) => void;
}

/**
 * 校验一条命令是否会生成非法 DXF 实体。
 *
 * 返回人类可读的原因字符串表示应跳过；返回 null 表示可以安全写入。
 * 注意：校验失败只回调并跳过该实体（见 serialize），不抛错——设计意图是
 * "保住整份文件"，不让一个坏实体毁掉整张图。
 */
export function validateCommand(command: DrawCommand): string | null {
  const finite = (value: number): boolean => Number.isFinite(value);

  switch (command.type) {
    case 'line':
      if (![command.x1, command.y1, command.x2, command.y2].every(finite)) {
        return 'non-finite line coordinates';
      }
      break;
    case 'circle':
      if (!finite(command.r) || command.r <= 0) {
        return 'circle radius must be positive and finite';
      }
      if (!finite(command.cx) || !finite(command.cy)) {
        return 'non-finite circle centre';
      }
      break;
    case 'polyline':
      if (command.points.length < 2) {
        return 'polyline needs at least two points';
      }
      if (!command.points.every(([x, y]) => finite(x) && finite(y))) {
        return 'non-finite polyline vertex';
      }
      if (!finite(command.lineWidth) || command.lineWidth < 0) {
        return 'polyline line width must be zero or positive';
      }
      break;
    case 'text':
      if (!finite(command.h) || command.h <= 0) {
        return 'text height must be positive and finite';
      }
      if (!finite(command.widthFactor) || command.widthFactor <= 0) {
        return 'text width factor must be positive';
      }
      if (!finite(command.x) || !finite(command.y)) {
        return 'non-finite text insertion point';
      }
      if (!finite(command.rot)) {
        return 'text rotation must be finite';
      }
      if (!Number.isInteger(command.hAlign) || command.hAlign < 0 || command.hAlign > 2) {
        return 'text horizontal alignment must be 0, 1 or 2';
      }
      if (!Number.isInteger(command.vAlign) || command.vAlign < 0 || command.vAlign > 3) {
        return 'text vertical alignment must be 0, 1, 2 or 3';
      }
      break;
    case 'solid':
      if (command.points.length < 3 || command.points.length > 4) {
        return 'solid needs 3 or 4 vertices';
      }
      if (!command.points.every(([x, y]) => finite(x) && finite(y))) {
        return 'non-finite solid vertex';
      }
      break;
  }

  if (
    command.color !== null &&
    (!Number.isInteger(command.color) || command.color < 0 || command.color > 256)
  ) {
    return 'ACI colour must be an integer in 0..256';
  }

  return null;
}

/**
 * 把快照序列化为 AutoCAD R12（AC1009）DXF 文本。
 *
 * 中文兼容"三件套"：
 *  1. HEADER 声明 $DWGCODEPAGE = ANSI_936（GBK）或 UTF-8；
 *  2. STYLE 表把 STANDARD 映射到 txt.shx + 大字体（或 TrueType）；
 *  3. `DxfExporter.toBytes()` 用匹配编码器把最终字符串编码成字节。
 *
 * 【勿改·字节契约】组码与顺序逐字沿用旧实现，任何改动都会改变输出字节。
 */
export class DxfSerializer {
  private readonly codec: TextCodec;

  constructor(options: { codec?: TextCodec } = {}) {
    this.codec = options.codec ?? textCodec;
  }

  /**
   * 序列化主流程：HEADER + TABLES + ENTITIES + 末尾 EOF。
   *
   * 参数：doc 文档（快照或 builder），options 序列化选项。
   * 关键：字体"三件套"按 font 选择主字体/大字体；实体按 type 逐条写出，
   *       校验失败的实体回调 onInvalidCommand 后跳过；最后按 newline 选项转 CRLF/LF。
   */
  serialize(doc: DocumentLike, options: DxfSerializeOptions = {}): string {
    const data = resolveDocumentData(doc);
    const useGbk = (options.encoding ?? 'gbk').toLowerCase() === 'gbk';
    const codepage = useGbk ? 'ANSI_936' : 'UTF-8';
    const { primary: primaryFont, big: bigFont } = resolveDxfFont(options.font);

    let out = '';
    out += this.header(data, codepage);
    out += this.tables(data, primaryFont, bigFont, useGbk);
    out += '  0\nSECTION\n  2\nENTITIES\n';
    const validate = options.validate ?? true;
    for (const command of data.commands) {
      if (validate) {
        const reason = validateCommand(command);
        if (reason) {
          options.onInvalidCommand?.(command, reason);
          continue;
        }
      }
      out += this.entity(command, useGbk);
    }
    out += '  0\nENDSEC\n  0\nEOF\n';

    return (options.newline ?? 'crlf') === 'crlf' ? out.replace(/\r?\n/g, '\r\n') : out;
  }

  /** 一步完成：序列化成文本后按 encoding 编码为字节。 */
  toBytes(doc: DocumentLike, options: DxfSerializeOptions = {}): Uint8Array {
    const text = this.serialize(doc, options);
    return (options.encoding ?? 'gbk').toLowerCase() === 'gbk'
      ? this.codec.encodeToGbk(text)
      : this.codec.encodeToUtf8(text);
  }

  /** HEADER 段：ACADVER=AC1009、$DWGCODEPAGE、测量单位、比例与图幅范围。 */
  private header(data: DocumentData, codepage: string): string {
    const ext = data.extents;
    let out = '';
    out += '  0\nSECTION\n  2\nHEADER\n';
    out += '  9\n$ACADVER\n  1\nAC1009\n';
    out += `  9\n$DWGCODEPAGE\n  3\n${codepage}\n`;
    out += '  9\n$MEASUREMENT\n 70\n1\n';
    out += '  9\n$LTSCALE\n 40\n1.0\n';
    out += `  9\n$EXTMIN\n 10\n${fmtNumber(ext.minX)}\n 20\n${fmtNumber(ext.minY)}\n 30\n0.0\n`;
    out += `  9\n$EXTMAX\n 10\n${fmtNumber(ext.maxX)}\n 20\n${fmtNumber(ext.maxY)}\n 30\n0.0\n`;
    out += `  9\n$LIMMIN\n 10\n${fmtNumber(ext.minX)}\n 20\n${fmtNumber(ext.minY)}\n`;
    out += `  9\n$LIMMAX\n 10\n${fmtNumber(ext.maxX)}\n 20\n${fmtNumber(ext.maxY)}\n`;
    out += '  0\nENDSEC\n';
    return out;
  }

  /**
   * TABLES 段：LTYPE（3 种线型）、LAYER、STYLE 三张表。
   *
   * LAYER 表里 "0" 层始终第一个写出；清洗后变成 "0" 的条目会被跳过，
   * 保证不会出现重复的 "0" 记录（CAD 会拒收）。STYLE 表填入选定的字体配方。
   */
  private tables(
    data: DocumentData,
    primaryFont: string,
    bigFont: string,
    useGbk: boolean
  ): string {
    let out = '';
    out += '  0\nSECTION\n  2\nTABLES\n';

    out += '  0\nTABLE\n  2\nLTYPE\n 70\n3\n';
    out +=
      '  0\nLTYPE\n  2\nCONTINUOUS\n 70\n0\n  3\nSolid line\n 72\n65\n 73\n0\n 40\n0.0\n';
    out +=
      '  0\nLTYPE\n  2\nDASHED\n 70\n0\n  3\nDashed grid line\n 72\n65\n 73\n2\n 40\n2.2\n 49\n1.3\n 49\n-0.9\n';
    out +=
      '  0\nLTYPE\n  2\nDOT\n 70\n0\n  3\nDotted layer line\n 72\n65\n 73\n2\n 40\n1.2\n 49\n0.5\n 49\n-0.7\n';
    out += '  0\nENDTAB\n';

    // "0" 层始终第一个写出；清洗成 "0" 的条目跳过，避免 LAYER 表出现重复 "0"（CAD 拒收）。
    const layerEntries: Array<{ name: string; color: number; linetype: string }> = [];
    for (const layer of data.layers) {
      const name = sanitizeLayerName(layer.name, useGbk);
      if (name === '0') continue;
      layerEntries.push({
        name,
        color: sanitizeLayerColor(layer.color),
        linetype: sanitizeLinetype(layer.linetype),
      });
    }
    out += `  0\nTABLE\n  2\nLAYER\n 70\n${layerEntries.length + 1}\n`;
    out += '  0\nLAYER\n  2\n0\n 70\n0\n 62\n7\n  6\nCONTINUOUS\n';
    for (const layer of layerEntries) {
      out += `  0\nLAYER\n  2\n${layer.name}\n 70\n0\n 62\n${layer.color}\n  6\n${layer.linetype}\n`;
    }
    out += '  0\nENDTAB\n';

    out += '  0\nTABLE\n  2\nSTYLE\n 70\n1\n';
    out += `  0\nSTYLE\n  2\nSTANDARD\n 70\n0\n 40\n0.0\n 41\n${
      DEFAULT_TEXT_METRICS.defaultWidthFactor
    }\n 50\n0.0\n 71\n0\n 42\n2.5\n  3\n${primaryFont}\n  4\n${bigFont}\n`;
    out += '  0\nENDTAB\n';

    out += '  0\nENDSEC\n';
    return out;
  }

  /**
   * 把单条命令写成一组"组码行 + 值行"，按 type 分支：
   * LINE / CIRCLE / POLYLINE（含 VERTEX 与 SEQEND）/ TEXT。
   *
   * 【勿改·字节契约】所有组码取值与顺序固定；颜色 null 时省略组码 62（随层）；
   * 线宽 > 0 才写组码 40/41。
   */
  private entity(cmd: DrawCommand, useGbk: boolean): string {
    const lines: string[] = [];
    const layerName = sanitizeLayerName(cmd.layer, useGbk);

    switch (cmd.type) {
      case 'line': {
        lines.push('  0', 'LINE', '  8', layerName);
        if (cmd.linetype) lines.push('  6', sanitizeLinetype(cmd.linetype));
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(cmd.x1), ' 20', fmtNumber(cmd.y1), ' 30', '0.0');
        lines.push(' 11', fmtNumber(cmd.x2), ' 21', fmtNumber(cmd.y2), ' 31', '0.0');
        break;
      }
      case 'circle': {
        lines.push('  0', 'CIRCLE', '  8', layerName);
        if (cmd.linetype) lines.push('  6', sanitizeLinetype(cmd.linetype));
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(cmd.cx), ' 20', fmtNumber(cmd.cy), ' 30', '0.0');
        lines.push(' 40', fmtNumber(cmd.r));
        break;
      }
      case 'polyline': {
        lines.push('  0', 'POLYLINE', '  8', layerName);
        if (cmd.linetype) lines.push('  6', sanitizeLinetype(cmd.linetype));
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 66', '1');
        // R12 要求 POLYLINE 头带 3D 标高点（组码 10/20/30）；严格的解析器
        // （ODA、部分 CAM/CNC 导入器）会拒收没有它的文件。
        lines.push(' 10', '0.0', ' 20', '0.0', ' 30', '0.0');
        lines.push(' 70', cmd.closed ? '1' : '0');
        if (cmd.lineWidth > 0) {
          lines.push(' 40', fmtNumber(cmd.lineWidth), ' 41', fmtNumber(cmd.lineWidth));
        }
        for (const [x, y] of cmd.points) {
          lines.push('  0', 'VERTEX', '  8', layerName);
          lines.push(' 10', fmtNumber(x), ' 20', fmtNumber(y), ' 30', '0.0');
          if (cmd.lineWidth > 0) {
            lines.push(' 40', fmtNumber(cmd.lineWidth), ' 41', fmtNumber(cmd.lineWidth));
          }
          lines.push(' 70', '0');
        }
        lines.push('  0', 'SEQEND', '  8', layerName);
        break;
      }
      case 'text': {
        lines.push('  0', 'TEXT', '  8', layerName);
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(cmd.x), ' 20', fmtNumber(cmd.y), ' 30', '0.0');
        lines.push(' 40', fmtNumber(cmd.h), '  1', sanitizeLineValue(cmd.text), ' 50', fmtNumber(cmd.rot));
        lines.push(' 41', fmtNumber(cmd.widthFactor));
        lines.push('  7', 'STANDARD');
        lines.push(' 72', String(cmd.hAlign));
        if (cmd.vAlign) lines.push(' 73', String(cmd.vAlign));
        if (cmd.hAlign !== 0 || cmd.vAlign !== 0) {
          lines.push(' 11', fmtNumber(cmd.x), ' 21', fmtNumber(cmd.y), ' 31', '0.0');
        }
        break;
      }
      case 'solid': {
        if (cmd.points.length < 3) break;
        const p0 = cmd.points[0];
        const p1 = cmd.points[1];
        const p2 = cmd.points[2];
        // AutoCAD R12 SOLID 要求 3/4 顶点按 Z 字顺序写入：
        // 四边形轮廓 [p0, p1, p2, p3] -> DXF 10/11/12/13 为 [p0, p1, p3, p2]；
        // 三角形 [p0, p1, p2] -> DXF 10/11/12/13 为 [p0, p1, p2, p2]。
        const dxfP3 = cmd.points.length >= 4 ? cmd.points[3] : p2;
        const dxfP4 = p2;
        lines.push('  0', 'SOLID', '  8', layerName);
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(p0[0]), ' 20', fmtNumber(p0[1]), ' 30', '0.0');
        lines.push(' 11', fmtNumber(p1[0]), ' 21', fmtNumber(p1[1]), ' 31', '0.0');
        lines.push(' 12', fmtNumber(dxfP3[0]), ' 22', fmtNumber(dxfP3[1]), ' 32', '0.0');
        lines.push(' 13', fmtNumber(dxfP4[0]), ' 23', fmtNumber(dxfP4[1]), ' 33', '0.0');
        break;
      }
    }

    if (lines.length === 0) return '';
    return lines.join('\n') + '\n';
  }
}

/** 静态便捷出口：对齐旧版 writer 的方法命名，环境无关。 */
export class DxfExporter {
  /** 直接把文档序列化为 DXF 文本。 */
  static toText(doc: DocumentLike, options: DxfSerializeOptions = {}): string {
    return new DxfSerializer().serialize(doc, options);
  }

  /** 直接把文档序列化并编码为 DXF 字节。 */
  static toBytes(doc: DocumentLike, options: DxfSerializeOptions = {}): Uint8Array {
    return new DxfSerializer().toBytes(doc, options);
  }
}

```

## src\encoding\codec.ts
```ts
/**
 * 文本编解码层：字符串与 UTF-8/GBK 字节之间的双向转换。
 *
 * 解码走 `TextDecoder`（浏览器与带完整 ICU 的 Node 原生支持 GBK）；
 * 编码到 GBK 则依赖延迟构建的反查表，表外字符被转义为 AutoCAD 原生理解的
 * CAD `\U+XXXX` 序列。这是 DXF 中文兼容的关键一环。
 */

import { getGbkDecoder, getGbkTable, isGbkSupported } from './gbk-table';

// 编解码器实例懒加载缓存：首次使用时才 new，避免无谓开销。
let utf8Encoder: TextEncoder | null = null;
let utf8Decoder: TextDecoder | null = null;
let utf8FatalDecoder: TextDecoder | null = null;
let utf16leDecoder: TextDecoder | null = null;
let utf16beDecoder: TextDecoder | null = null;

const getUtf8Encoder = (): TextEncoder => (utf8Encoder ??= new TextEncoder());
const getUtf8Decoder = (): TextDecoder => (utf8Decoder ??= new TextDecoder('utf-8'));
// fatal 版：遇到非法 UTF-8 直接抛错，供 decodeAuto 做"严格 UTF-8 探测"。
const getUtf8FatalDecoder = (): TextDecoder =>
  (utf8FatalDecoder ??= new TextDecoder('utf-8', { fatal: true }));
const getUtf16leDecoder = (): TextDecoder => (utf16leDecoder ??= new TextDecoder('utf-16le'));
const getUtf16beDecoder = (): TextDecoder => (utf16beDecoder ??= new TextDecoder('utf-16be'));

/** 支持的编码名称。 */
export type EncodingName = 'utf-8' | 'gbk' | 'gb2312' | 'gb18030';

/** 编解码器可选配置。 */
export interface TextCodecOptions {
  /** 每次 encodeToGbk() 遇到表外字符时调用一次，参数是转换记录列表。 */
  onUnencodable?: (entries: string[]) => void;
  /**
   * 复现旧实现的 `console.info` 报告，输出表外字符。
   * 默认关闭——库不应无条件打印日志。
   */
  warnOnUnencodable?: boolean;
}

/**
 * 双向文本编解码器。
 *
 * 解码走 `TextDecoder`（浏览器与带完整 ICU 的 Node 原生支持 GBK）；
 * 编码到 GBK 用延迟构建的反查表；表外字符转义成 CAD `\U+XXXX`，AutoCAD 原生识别。
 */
export class TextCodec {
  private readonly options: TextCodecOptions;

  constructor(options: TextCodecOptions = {}) {
    this.options = options;
  }

  /** 按显式编码把字节解成字符串；GBK 系列走 GBK 解码器，否则按 UTF-8。 */
  decode(bytes: Uint8Array, encoding: EncodingName | string = 'utf-8'): string {
    const enc = String(encoding || 'utf-8').toLowerCase();
    if (enc === 'gbk' || enc === 'gb2312' || enc === 'gb18030') {
      const decoder = getGbkDecoder();
      if (!decoder) {
        // 环境没有 GBK 解码器时，退回 UTF-8。
        return getUtf8Decoder().decode(bytes);
      }
      return decoder.decode(bytes);
    }
    return getUtf8Decoder().decode(bytes);
  }

  /**
   * 自动探测编码，依次尝试：BOM → 严格 UTF-8 → GBK 回退 → 宽松 UTF-8。
   *
   * GBK 回退的取舍：先用 GBK 解码，只有当替换字符（U+FFFD）占比 < 5%
   * 时才采信结果，否则认为这不是 GBK。UTF-32LE 的 BOM 与 UTF-16LE 前缀相同，
   * 需要特判排除，避免误判。
   * 参数：bytes 为待探测的字节流。
   * 返回：解出的字符串。
   */
  decodeAuto(bytes: Uint8Array): string {
    if (!bytes || bytes.length === 0) return '';

    // UTF-8 BOM（EF BB BF）：跳过 BOM 后按 UTF-8 解码。
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return getUtf8Decoder().decode(bytes.subarray(3));
    }
    // UTF-16LE BOM（FF FE）与 UTF-32LE 前缀相同，先用 4 字节排除 UTF-32LE。
    const isUtf32LeBom =
      bytes.length >= 4 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xfe &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x00;
    if (!isUtf32LeBom && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return getUtf16leDecoder().decode(bytes.subarray(2));
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return getUtf16beDecoder().decode(bytes.subarray(2));
    }

    try {
      // 先用严格 UTF-8，非法字节会抛错。
      return getUtf8FatalDecoder().decode(bytes);
    } catch {
      const gbkDecoder = getGbkDecoder();
      if (gbkDecoder) {
        try {
          const text = gbkDecoder.decode(bytes);
          let bad = 0;
          for (let i = 0; i < text.length; i++) {
            if (text.charCodeAt(i) === 0xfffd) bad++;
          }
          // 替换字符占比低于 5% 才认为是有效 GBK 文本。
          if (bad / Math.max(1, text.length) < 0.05) return text;
        } catch {
          /* 继续往下走，退回宽松 UTF-8 */
        }
      }
      return getUtf8Decoder().decode(bytes);
    }
  }

  /** 字符串 → UTF-8 字节。 */
  encodeToUtf8(str: string): Uint8Array {
    return getUtf8Encoder().encode(str);
  }

  /**
   * 字符串 → GBK 字节；GBK 表外字符变成 `\U+XXXX` 转义文本。
   *
   * 注意：【勿改·历史兼容】遍历按 UTF-16 code unit（而非码点）进行，
   * emoji 等增补字符会产生两个转义。此行为为 v1 输出兼容而锁定，勿改。
   * 缓冲按 max(16, len*2) 预分配，转义结果可能比原字符更长，故需动态扩容。
   */
  encodeToGbk(str: string): Uint8Array {
    const table = getGbkTable();
    let buf = new Uint8Array(Math.max(16, str.length * 2));
    let pos = 0;
    const unencodable: string[] = [];

    // 保证还能再写 extra 个字节，不够就翻倍扩容。
    const ensureCapacity = (extra: number): void => {
      if (pos + extra <= buf.length) return;
      let nextSize = buf.length * 2;
      while (nextSize < pos + extra) nextSize *= 2;
      const grown = new Uint8Array(nextSize);
      grown.set(buf.subarray(0, pos));
      buf = grown;
    };

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        // ASCII 直接单字节写入。
        ensureCapacity(1);
        buf[pos++] = code;
        continue;
      }
      const ch = str.charAt(i);
      const pair = table.get(ch);
      if (pair) {
        // 表内字符：写 GBK 双字节。
        ensureCapacity(2);
        buf[pos++] = pair[0];
        buf[pos++] = pair[1];
      } else {
        // 表外字符：写成 \U+XXXX 的 ASCII 转义（6 个字符）。
        const esc = '\\U+' + code.toString(16).toUpperCase().padStart(4, '0');
        unencodable.push(ch + ' -> ' + esc);
        ensureCapacity(esc.length);
        for (let k = 0; k < esc.length; k++) buf[pos++] = esc.charCodeAt(k);
      }
    }

    if (unencodable.length > 0) this.reportUnencodable(unencodable);
    return buf.slice(0, pos);
  }

  /** 当前环境是否支持 GBK 解码。 */
  isGbkSupported(): boolean {
    return isGbkSupported();
  }

  /** 强制构建反查表（批量任务或 worker 预热时有用）。 */
  warmup(): void {
    getGbkTable();
  }

  /** 返回反查表条目数。 */
  getTableSize(): number {
    return getGbkTable().size;
  }

  /** 按配置上报表外字符：回调 onUnencodable，或在开启时打印旧式日志。 */
  private reportUnencodable(entries: string[]): void {
    if (this.options.onUnencodable) {
      this.options.onUnencodable(entries);
    }
    if (this.options.warnOnUnencodable) {
      const preview = entries.slice(0, 50).join('\n');
      const suffix = entries.length > 50 ? '\n... total ' + entries.length : '';
      console.info(
        '[vecbridge] characters outside GBK were escaped as CAD \\U+XXXX:\n' +
          preview +
          suffix
      );
    }
  }
}

/** 共享的默认编解码器实例。 */
export const textCodec = new TextCodec();

/** 便捷函数：委托给共享实例 textCodec。 */
export function decode(bytes: Uint8Array, encoding?: EncodingName | string): string {
  return textCodec.decode(bytes, encoding);
}
/** 便捷函数：自动探测编码解码，委托给共享实例。 */
export function decodeAuto(bytes: Uint8Array): string {
  return textCodec.decodeAuto(bytes);
}
/** 便捷函数：编码到 UTF-8，委托给共享实例。 */
export function encodeToUtf8(str: string): Uint8Array {
  return textCodec.encodeToUtf8(str);
}
/** 便捷函数：编码到 GBK，委托给共享实例。 */
export function encodeToGbk(str: string): Uint8Array {
  return textCodec.encodeToGbk(str);
}

```

## src\encoding\gbk-table.ts
```ts
/**
 * Unicode → GBK 反查表。
 *
 * 浏览器/Node 的 `TextEncoder` 只支持 UTF-8，没有 GBK 编码器，因此这里通过
 * `TextDecoder('gbk')` 反向解码所有合法的 GBK 双字节序列，重建"字符 → 双字节"
 * 的映射。
 *
 * GBK 双字节结构：
 *   首字节（lead byte） 0x81 - 0xFE
 *   尾字节（trail byte） 0x40 - 0xFE（排除 0x7F）
 *
 * 缓存挂在 `globalThis` 的一个 `Symbol.for` 键上，这样包的重复实例
 * （ESM + CJS，或两个子路径各引入一份）共享同一张表，避免重复构建。
 */

interface GbkCacheState {
  table: Map<string, [number, number]> | null;
  decoder: TextDecoder | null;
  decoderReady: boolean;
}

const GBK_CACHE_KEY = Symbol.for('vecbridge.gbkCache');
const globalScope = globalThis as unknown as Record<symbol, unknown>;

// 从全局取缓存；没有就创建并写回全局，保证跨模块实例共享。
const cache: GbkCacheState =
  (globalScope[GBK_CACHE_KEY] as GbkCacheState | undefined) ??
  (() => {
    const state: GbkCacheState = {
      table: null,
      decoder: null,
      decoderReady: false,
    };
    globalScope[GBK_CACHE_KEY] = state;
    return state;
  })();

/**
 * 内部函数：获取共享的 GBK 解码器（非公开 API）。
 * 依次尝试 gbk → gb18030 → gb2312，都不支持则返回 null。
 */
export function getGbkDecoder(): TextDecoder | null {
  if (cache.decoderReady) return cache.decoder;
  cache.decoderReady = true;
  try {
    cache.decoder = new TextDecoder('gbk');
  } catch {
    try {
      cache.decoder = new TextDecoder('gb18030');
    } catch {
      try {
        cache.decoder = new TextDecoder('gb2312');
      } catch {
        cache.decoder = null;
      }
    }
  }
  return cache.decoder;
}

/** 当前环境是否支持 GBK 系列解码。 */
export function isGbkSupported(): boolean {
  return !!getGbkDecoder();
}

/**
 * 获取 Unicode → GBK 双字节的反查表（延迟构建，结果缓存）。
 *
 * 快路径：把所有双字节对用 0x0A 分隔后一次性解码，再按换行拆分（约 50 倍加速）；
 * 用"行数 == 对数+1 且末行为空"校验对齐，一旦运行时丢行/错位，就回退到逐对解码。
 * 两条路径都只保留能解出单个有效字符（排除 U+FFFD/FFFE/FFFF）的映射，且同名字符
 * 保留首次出现的编码。
 * 返回：字符 → [首字节, 尾字节] 的 Map；环境不支持 GBK 时返回空表。
 */
export function getGbkTable(): Map<string, [number, number]> {
  if (cache.table) return cache.table;

  const decoder = getGbkDecoder();
  const map = new Map<string, [number, number]>();
  if (!decoder) {
    cache.table = map;
    return map;
  }

  // 加速构建：把每个双字节对用 0x0A 分隔，一次性解码（比逐对解码快约 50 倍）。
  const totalPairs = (0xfe - 0x81 + 1) * (0xfe - 0x40);
  const buf = new Uint8Array(totalPairs * 3);
  const pairs = new Uint16Array(totalPairs);
  let ptr = 0;
  let idx = 0;
  for (let b1 = 0x81; b1 <= 0xfe; b1++) {
    for (let b2 = 0x40; b2 <= 0xfe; b2++) {
      if (b2 === 0x7f) continue;
      buf[ptr++] = b1;
      buf[ptr++] = b2;
      buf[ptr++] = 0x0a;
      pairs[idx++] = (b1 << 8) | b2;
    }
  }

  try {
    const decodedLines = decoder.decode(buf).split('\n');
    // 每对后面都跟一个 0x0A，正确解码会得到一个尾随空串；否则说明运行时
    // 丢行或错位，整张表会错位——此时回退到逐对解码。
    if (decodedLines.length === totalPairs + 1 && decodedLines[totalPairs] === '') {
      for (let i = 0; i < totalPairs; i++) {
        const ch = decodedLines[i];
        if (ch && ch.length === 1 && ch !== '\uFFFD' && ch !== '\uFFFE' && ch !== '\uFFFF') {
          if (!map.has(ch)) {
            const code = pairs[i];
            map.set(ch, [code >> 8, code & 0xff]);
          }
        }
      }
      cache.table = map;
      return map;
    }
  } catch {
    map.clear();
    /* 回退到逐对解码 */
  }

  // 兜底路径：逐个双字节对解码。不可删除——快路径对齐校验失败时靠它保证正确。
  for (let b1 = 0x81; b1 <= 0xfe; b1++) {
    for (let b2 = 0x40; b2 <= 0xfe; b2++) {
      if (b2 === 0x7f) continue;
      const bytes = new Uint8Array([b1, b2]);
      let ch: string;
      try {
        ch = decoder.decode(bytes);
      } catch {
        continue;
      }
      if (ch && ch.length === 1 && ch !== '\uFFFD' && ch !== '\uFFFE' && ch !== '\uFFFF') {
        if (!map.has(ch)) map.set(ch, [b1, b2]);
      }
    }
  }
  cache.table = map;
  return map;
}

/** 测试辅助：清空缓存的表与解码器，让下次调用重新构建。 */
export function resetGbkCache(): void {
  cache.table = null;
  cache.decoder = null;
  cache.decoderReady = false;
}

```

## src\encoding\index.ts
```ts
/**
 * 文本编解码层出口。
 *
 * 负责字符串与 UTF-8/GBK 字节之间的双向转换，是 DXF 中文兼容的关键：
 * DXF 输出用 GBK 字节编码，表外字符转义为 CAD 的 `\U+XXXX`。本层与 core
 * 一样是纯计算、环境无关，Node 中可安全使用。
 */
export * from './codec'; // TextCodec 类、共享实例 textCodec 与 4 个便捷函数
export { isGbkSupported, getGbkTable, resetGbkCache } from './gbk-table'; // GBK 反查表能力探测、构建与测试用重置

```

## src\patterns\hatch.ts
```ts
/**
 * 填充图案（组合助手）层：在矩形区域内生成各种工程图纸常用的填充纹理。
 *
 * 每种图案都是 line/circle/polyline 基础图元的【纯组合】，因此生成的结果
 * 经由 DXF/SVG/Canvas 三端输出时天然一致。本层只依赖 `DrawTarget` 鸭子接口，
 * 环境无关、不碰 DOM。
 */

import type { DrawTarget } from '../core/types';

/**
 * 内置填充图案，按几何纹理命名。
 *
 * 每种图案都是 line/circle/polyline 基础图元的纯组合，
 * 所以在 DXF/SVG/Canvas 三端渲染结果一致。
 */
export type HatchPattern =
  | 'diagonal'
  | 'diagonal-dash'
  | 'horizontal'
  | 'horizontal-dots'
  | 'dots-fine'
  | 'dots-coarse'
  | 'scatter'
  | 'crosshatch'
  | 'dash-bands';

/** 合法图案名集合，用于运行时校验。 */
const KNOWN_PATTERNS: ReadonlySet<string> = new Set<HatchPattern>([
  'diagonal',
  'diagonal-dash',
  'horizontal',
  'horizontal-dots',
  'dots-fine',
  'dots-coarse',
  'scatter',
  'crosshatch',
  'dash-bands',
]);

/** 填充选项。 */
export interface HatchOptions {
  /**
   * 生成图元数量的硬上限，默认 200000；传 0 表示禁用限制。
   * 填充是确定性的，达到上限只是截断图案而非报错——用它保护超大矩形免于 OOM。
   */
  maxPrimitives?: number;
}

// 达到图元上限时抛出的哨兵符号：它是控制流信号，不是错误。
const HATCH_LIMIT_REACHED = Symbol('hatchLimitReached');

/**
 * 用内置图案填充一个矩形区域。
 *
 * 这是组合助手：只用到目标的 addLine / addCircle / addPolyline，
 * 因此可用于 `DrawingDocument` 或任何自定义 `DrawTarget`。
 * 角点可以任意顺序传入（内部会归一化）；给定矩形与图案时输出是确定性的。
 *
 * 参数：target 图元目标；x1/y1 与 x2/y2 为矩形对角两点（顺序不限）；
 *       pattern 图案名；layer 图层名；color 为 ACI 或 null（随层）；
 *       options.maxPrimitives 限制图元数量。
 * 注意：内缩 0.25mm 边距避免图元压在边框上；通过包装 target 计数，
 *       超过上限时抛 HATCH_LIMIT_REACHED 并在 try/catch 中静默截断。
 */
export function drawHatch(
  target: DrawTarget,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  pattern: HatchPattern,
  layer = '0',
  color: number | null = null,
  options?: HatchOptions
): void {
  if (!KNOWN_PATTERNS.has(pattern)) {
    throw new RangeError(`Unknown hatch pattern: ${String(pattern)}`);
  }
  if (
    !Number.isFinite(x1) ||
    !Number.isFinite(y1) ||
    !Number.isFinite(x2) ||
    !Number.isFinite(y2)
  ) {
    return;
  }

  // 归一化角点：允许任意顺序传入。
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const bottom = Math.min(y1, y2);
  const top = Math.max(y1, y2);

  // 内缩 0.25mm 边距，避免填充图元压在矩形边框上。
  const pad = 0.25;
  const xa0 = left + pad;
  const xb0 = right - pad;
  const ya0 = bottom + pad;
  const yb0 = top - pad;
  if (xa0 >= xb0 || ya0 >= yb0) return;

  const rawLimit = options?.maxPrimitives ?? 200_000;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.floor(rawLimit) : 0;
  let emitted = 0;

  // 包装目标：每次添加图元前检查计数，超限就抛哨兵符号以提前终止。
  const limited: DrawTarget = {
    addLine(lx1, ly1, lx2, ly2, l, c, lt) {
      if (limit > 0 && emitted >= limit) throw HATCH_LIMIT_REACHED;
      emitted += 1;
      target.addLine(lx1, ly1, lx2, ly2, l, c, lt);
    },
    addCircle(cx, cy, r, l, c) {
      if (limit > 0 && emitted >= limit) throw HATCH_LIMIT_REACHED;
      emitted += 1;
      target.addCircle(cx, cy, r, l, c);
    },
    addPolyline(points, l, c, closed, lineWidth) {
      if (limit > 0 && emitted >= limit) throw HATCH_LIMIT_REACHED;
      emitted += 1;
      target.addPolyline(points, l, c, closed, lineWidth);
    },
  };

  // 抛出的哨兵符号被静默吞掉（图案确定性截断）；其它真实错误继续上抛。
  try {
    emitHatchPrimitives(limited, xa0, xb0, ya0, yb0, pattern, layer, color);
  } catch (error) {
    if (error !== HATCH_LIMIT_REACHED) throw error;
  }
}

/**
 * 按图案生成具体图元；只往 `limited` 里添加，由调用方负责限额与裁剪边界。
 *
 * 两个裁剪函数处理对角线 y = x - c 与 y = c - x 在矩形
 * [xa0,xb0]×[ya0,yb0] 内的线段求交，处理任意角点顺序。
 * 9 个分支各有步长/偏移/奇偶行逻辑；虚线类用 hypot 算长度再细分段。
 */
function emitHatchPrimitives(
  limited: DrawTarget,
  xa0: number,
  xb0: number,
  ya0: number,
  yb0: number,
  pattern: HatchPattern,
  layer: string,
  color: number | null
): void {
  // 裁剪直线 y = x - c 到矩形内的线段。
  const clipDiagPos = (c: number): [number, number, number, number] | null => {
    const xs = Math.max(xa0, ya0 + c);
    const ys = xs - c;
    const xe = Math.min(xb0, yb0 + c);
    const ye = xe - c;
    return xs < xe ? [xs, ys, xe, ye] : null;
  };
  // 裁剪直线 y = c - x 到矩形内的线段。
  const clipDiagNeg = (c: number): [number, number, number, number] | null => {
    const xs = Math.max(xa0, c - yb0);
    const ys = c - xs;
    const xe = Math.min(xb0, c - ya0);
    const ye = c - xe;
    return xs < xe ? [xs, ys, xe, ye] : null;
  };

  // 单向斜线：固定步长画正斜线。
  if (pattern === 'diagonal') {
    const step = 2.0;
    for (let c = xa0 - yb0; c < xb0 - ya0; c += step) {
      const seg = clipDiagPos(c);
      if (seg) limited.addLine(seg[0], seg[1], seg[2], seg[3], layer, color);
    }
  } else if (pattern === 'diagonal-dash') {
    // 斜虚线：奇数行把线段按 dash/gap 细分成多段短线。
    const step = 1.9;
    let index = 0;
    for (let c = xa0 - yb0; c < xb0 - ya0; c += step, index++) {
      const seg = clipDiagPos(c);
      if (!seg) continue;
      if (index % 2 === 0) {
        limited.addLine(seg[0], seg[1], seg[2], seg[3], layer, color);
      } else {
        const len = Math.hypot(seg[2] - seg[0], seg[3] - seg[1]);
        const dash = 2.2;
        const gap = 1.4;
        for (let d = 0; d < len; d += dash + gap) {
          const t1 = d / len;
          const t2 = Math.min(1, (d + dash) / len);
          limited.addLine(
            seg[0] + (seg[2] - seg[0]) * t1,
            seg[1] + (seg[3] - seg[1]) * t1,
            seg[0] + (seg[2] - seg[0]) * t2,
            seg[1] + (seg[3] - seg[1]) * t2,
            layer,
            color
          );
        }
      }
    }
  } else if (pattern === 'horizontal') {
    // 水平线：偶数行通长线，奇数行拆成左右两截。
    const step = 1.7;
    let index = 0;
    const w = xb0 - xa0;
    for (let y = ya0 + 0.8; y < yb0; y += step, index++) {
      if (index % 2 === 0) {
        limited.addLine(xa0, y, xb0, y, layer, color);
      } else {
        limited.addLine(xa0 + w * 0.08, y, xa0 + w * 0.44, y, layer, color);
        limited.addLine(xa0 + w * 0.56, y, xa0 + w * 0.92, y, layer, color);
      }
    }
  } else if (pattern === 'horizontal-dots') {
    // 水平线 + 点：偶数行通长线，奇数行布小圆点。
    const step = 1.8;
    let index = 0;
    for (let y = ya0 + 0.9; y < yb0; y += step, index++) {
      if (index % 2 === 0) {
        limited.addLine(xa0, y, xb0, y, layer, color);
      } else {
        for (let x = xa0 + 1.4; x < xb0 - 0.6; x += 2.4) {
          limited.addCircle(x, y, 0.22, layer, color);
        }
      }
    }
  } else if (pattern === 'dots-fine') {
    // 细点阵：偶数行错位半格，每 3 行换一种点半径。
    const stepY = 1.7;
    const stepX = 2.1;
    let row = 0;
    for (let y = ya0 + 0.9; y < yb0; y += stepY, row++) {
      const offset = (row % 2) * (stepX * 0.5);
      for (let x = xa0 + 0.9 + offset; x < xb0 - 0.5; x += stepX) {
        limited.addCircle(x, y, row % 3 === 0 ? 0.28 : 0.18, layer, color);
      }
    }
  } else if (pattern === 'dots-coarse') {
    // 粗点阵：按行列奇偶交替两种点半径。
    const stepY = 2.0;
    const stepX = 2.4;
    let row = 0;
    for (let y = ya0 + 1.0; y < yb0; y += stepY, row++) {
      const offset = (row % 2) * (stepX * 0.5);
      let col = 0;
      for (let x = xa0 + 1.1 + offset; x < xb0 - 0.7; x += stepX, col++) {
        const r = (row + col) % 2 === 0 ? 0.4 : 0.2;
        limited.addCircle(x, y, r, layer, color);
      }
    }
  } else if (pattern === 'scatter') {
    // 散点：错位行里画小三角折线，并在右侧补小圆点。
    const stepY = 2.5;
    const stepX = 3.0;
    let row = 0;
    for (let y = ya0 + 1.2; y < yb0 - 0.5; y += stepY, row++) {
      const offset = (row % 2) * 1.3;
      for (let x = xa0 + 1.3 + offset; x < xb0 - 0.9; x += stepX) {
        limited.addPolyline(
          [
            [x - 0.5, y - 0.3],
            [x + 0.5, y - 0.25],
            [x + 0.1, y + 0.45],
          ],
          layer,
          color,
          true
        );
        if (x + 1.3 < xb0 - 0.4) {
          limited.addCircle(x + 1.3, y - 0.15, 0.2, layer, color);
        }
      }
    }
  } else if (pattern === 'crosshatch') {
    // 交叉网格：正斜线与反斜线两组都画。
    const step = 2.6;
    for (let c = xa0 - yb0; c < xb0 - ya0; c += step) {
      const seg = clipDiagPos(c);
      if (seg) limited.addLine(seg[0], seg[1], seg[2], seg[3], layer, color);
    }
    for (let c = xa0 + ya0; c < xb0 + yb0; c += step) {
      const seg = clipDiagNeg(c);
      if (seg) limited.addLine(seg[0], seg[1], seg[2], seg[3], layer, color);
    }
  } else {
    // dash-bands：水平错位虚线段，上下两行交替。
    const step = 2.0;
    const w = xb0 - xa0;
    for (let y = ya0 + 1.0; y < yb0; y += step) {
      limited.addLine(xa0 + w * 0.1, y, xa0 + w * 0.45, y, layer, color);
      const offsetY = y + 0.4;
      if (offsetY < yb0) {
        limited.addLine(xa0 + w * 0.55, offsetY, xa0 + w * 0.9, offsetY, layer, color);
      }
    }
  }
}

```

## src\patterns\index.ts
```ts
/**
 * 填充图案（组合助手）层出口。
 *
 * `drawHatch` 只依赖 `DrawTarget` 鸭子接口（addLine/addCircle/addPolyline），
 * 因此它生成的图元可以进入任何图元目标——通常是 `DrawingDocument`，进而经由
 * DXF/SVG/Canvas 三端同源输出。纯计算、环境无关。
 */
export * from './hatch'; // drawHatch 及 9 种内置填充图案（HatchPattern）

```

## src\render\camera.ts
```ts
/**
 * 相机（世界 mm / Y 向上 ↔ 屏幕 px / Y 向下 的坐标变换）。
 *
 * 注意：下面的符号约定是"承重"的（load-bearing），全库双视图对齐都靠它：
 *   screenY = offsetY - worldY * scale
 *   SVG viewBox y = -offsetY / scale
 * 因此对坐标为 -worldY 的 SVG 文档有：
 *   (svgY - vb.y) * scale = offsetY - worldY * scale = screenY
 * 【勿改·坐标符号】单独翻转其中任何一个符号，都会让两个预览窗格相对上下颠倒。
 * 公式与正负号必须原样保留；SVG 序列化端也用同样的 y→-y 约定与之配对。
 */

import type { Extents, ViewBox } from '../core/types';

/** 相机状态：缩放比例 + X/Y 方向偏移。 */
export interface CameraState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** 缩放比例的限制范围。 */
export interface CameraLimits {
  minScale: number;
  maxScale: number;
}

/** 视口尺寸的最小结构（宽高，单位px）。 */
export interface MetricsLike {
  width: number;
  height: number;
}

/** 相机：同一个实例同时驱动 Canvas 的 setTransform 与 SVG 的 viewBox。 */
export class Camera {
  private _scale: number;
  private _offsetX: number;
  private _offsetY: number;

  /** 默认 scale=1、偏移 0；可用局部状态覆盖。 */
  constructor(state?: Partial<CameraState>) {
    this._scale = state?.scale ?? 1;
    this._offsetX = state?.offsetX ?? 0;
    this._offsetY = state?.offsetY ?? 0;
  }

  /** 当前缩放比例。 */
  get scale(): number {
    return this._scale;
  }

  /** 当前 X 偏移（px）。 */
  get offsetX(): number {
    return this._offsetX;
  }

  /** 当前 Y 偏移（px）。 */
  get offsetY(): number {
    return this._offsetY;
  }

  /** 取出完整相机状态快照。 */
  getState(): CameraState {
    return { scale: this._scale, offsetX: this._offsetX, offsetY: this._offsetY };
  }

  /** 用局部状态覆盖相机（只覆盖显式给出的字段）。 */
  setState(state: Partial<CameraState>): void {
    if (state.scale !== undefined) this._scale = state.scale;
    if (state.offsetX !== undefined) this._offsetX = state.offsetX;
    if (state.offsetY !== undefined) this._offsetY = state.offsetY;
  }

  /**
   * 把世界图幅范围适配到视口（padding 以世界 mm 计）。
   *
   * 取 min(scaleX, scaleY) 保证完整放入；再把图幅中心对齐到视口中心。
   * 退化输入（非法/倒置的范围、零视口、负 padding）会被忽略，避免用
   * Infinity 或负 scale 污染相机。
   * 注意：offsetY 这里用【加号】，与 getViewBox() 里的减号成对。
   */
  fit(extents: Extents, metrics: MetricsLike, paddingPx = 16): void {
    if (
      !Number.isFinite(extents.minX) ||
      !Number.isFinite(extents.maxX) ||
      !Number.isFinite(extents.minY) ||
      !Number.isFinite(extents.maxY) ||
      extents.maxX < extents.minX ||
      extents.maxY < extents.minY ||
      !Number.isFinite(paddingPx) ||
      paddingPx < 0
    ) {
      return;
    }

    const worldW = extents.maxX - extents.minX + paddingPx * 2;
    const worldH = extents.maxY - extents.minY + paddingPx * 2;

    // 退化的图幅/视口不能把相机污染成 Infinity 或负 scale。
    if (
      !Number.isFinite(worldW) ||
      !Number.isFinite(worldH) ||
      worldW <= 0 ||
      worldH <= 0 ||
      !Number.isFinite(metrics.width) ||
      !Number.isFinite(metrics.height) ||
      metrics.width <= 0 ||
      metrics.height <= 0
    ) {
      return;
    }

    const scaleX = metrics.width / worldW;
    const scaleY = metrics.height / worldH;
    this._scale = Math.min(scaleX, scaleY);

    const centerX = (extents.minX + extents.maxX) / 2;
    const centerY = (extents.minY + extents.maxY) / 2;
    this._offsetX = metrics.width / 2 - centerX * this._scale;
    // 注意：加号——与 getViewBox() 里的负号成对。
    this._offsetY = metrics.height / 2 + centerY * this._scale;
  }

  /** 世界坐标 → 屏幕坐标（Y 在这里取负）。 */
  toScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this._offsetX + x * this._scale,
      y: this._offsetY - y * this._scale,
    };
  }

  /** toScreen 的逆变换：屏幕点 → 世界坐标；scale 非法时原样返回。 */
  toWorld(px: number, py: number): { x: number; y: number } {
    if (!Number.isFinite(this._scale) || this._scale <= 0) {
      return { x: px, y: py };
    }
    return {
      x: (px - this._offsetX) / this._scale,
      y: (this._offsetY - py) / this._scale,
    };
  }

  /**
   * 生成与 Canvas 1:1 的等价 SVG viewBox。
   * 注意：y 用【负号】，与 fit() 里的加号成对；scale 非法时回退到视口尺寸。
   */
  getViewBox(metrics: MetricsLike): ViewBox {
    if (!Number.isFinite(this._scale) || this._scale <= 0) {
      return {
        x: 0,
        y: 0,
        w: Number.isFinite(metrics.width) && metrics.width > 0 ? metrics.width : 1,
        h: Number.isFinite(metrics.height) && metrics.height > 0 ? metrics.height : 1,
      };
    }
    return {
      x: -this._offsetX / this._scale,
      // 注意：负号——与 fit() 里的加号成对。
      y: -this._offsetY / this._scale,
      w: metrics.width / this._scale,
      h: metrics.height / this._scale,
    };
  }

  /**
   * 以屏幕点 (px,py) 为中心缩放，并把结果 scale 钳制到 limits 内。
   * 关键是缩放后调整偏移，使锚点在世界坐标里保持不动（滚轮以鼠标为中心）。
   */
  zoomAt(
    px: number,
    py: number,
    factor: number,
    limits: CameraLimits = { minScale: 0.2, maxScale: 50 }
  ): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    if (!Number.isFinite(this._scale) || this._scale <= 0) return;

    const newScale = Math.max(
      limits.minScale,
      Math.min(limits.maxScale, this._scale * factor)
    );
    const ratio = newScale / this._scale;

    this._offsetX = px - (px - this._offsetX) * ratio;
    this._offsetY = py - (py - this._offsetY) * ratio;
    this._scale = newScale;
  }

  /** 按屏幕空间的位移量平移（逻辑 px，拖拽用）。 */
  panBy(dx: number, dy: number): void {
    this._offsetX += dx;
    this._offsetY += dy;
  }
}

```

## src\render\canvas-renderer.ts
```ts
/**
 * Canvas 渲染端：用共享相机把 `DocumentData` 画到 2D canvas。
 *
 * 线宽、虚线样式与文本度量刻意与旧渲染器逐字一致（含 1.05 字号系数与
 * 2.2px 的文字剔除），且与 SVG 端共用 core 的样式解析链。
 * 依赖 DOM（canvas 2D context），只在浏览器 render 层使用。
 *
 * 【勿改·坐标符号】tx/ty 与 camera.toScreen 一致：ty 用 offsetY - y*scale；
 * 文字旋转取负（SVG 的 Y 轴向下），与 SVG 端配对保证双视图一致。
 */

import { isBoldText, isPaperCommand, type DecorationOptions } from '../core/decorations';
import { resolveDocumentData, type DocumentLike } from '../core/data';
import { createLayerLookup, resolveCommandStyle } from '../core/style';
import { DEFAULT_TEXT_METRICS, type TextMetricsPolicy } from '../core/text';
import { resolveTheme, type RenderTheme, type ThemeInput } from '../core/theme';
import type { Camera } from './camera';
import type { ViewportMetrics } from './viewport';

/** Canvas 渲染选项。 */
export interface CanvasRendererOptions {
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
}

/** Canvas 2D 渲染器。 */
export class CanvasRenderer {
  private options: CanvasRendererOptions;

  constructor(options: CanvasRendererOptions = {}) {
    this.options = options;
  }

  /** 切换主题。 */
  setTheme(theme: ThemeInput): void {
    this.options = { ...this.options, theme };
  }

  /** 切换装饰配置。 */
  setDecorations(decorations: DecorationOptions): void {
    this.options = { ...this.options, decorations };
  }

  /** 取当前解析后的主题对象。 */
  getTheme(): RenderTheme {
    return resolveTheme(this.options.theme);
  }

  /**
   * 全量重绘一帧。
   *
   * 流程：setTransform(dpr) → 填背景 → 浅色主题下把纸张图框填充为白纸并加阴影
   * → 逐命令按 type 画 line/circle/polyline/text，样式经 core 调用链解析。
   * 【勿改·历史兼容】字号用 canvasSizeFactor（1.05），屏幕上字号 < minCanvasFontPx
   * 的文本直接跳过；AC I 8 用更细线宽。
   */
  render(
    doc: DocumentLike,
    canvas: HTMLCanvasElement,
    camera: Camera,
    metrics: ViewportMetrics
  ): void {
    const data = resolveDocumentData(doc);
    const theme = resolveTheme(this.options.theme);
    const text = { ...DEFAULT_TEXT_METRICS, ...this.options.text };
    const layerLookup = createLayerLookup(data.layers);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = camera.scale;
    const offsetX = camera.offsetX;
    const offsetY = camera.offsetY;
    // 世界 → 屏幕：X 正向、Y 取负，与 camera.toScreen 完全一致。
    const tx = (x: number) => offsetX + x * scale;
    const ty = (y: number) => offsetY - y * scale;

    ctx.save();
    ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, metrics.width, metrics.height);

    // 浅色主题：把图框填充为白纸并加柔和阴影，再在其上绘制内容。
    if (!theme.isDark) {
      for (const cmd of data.commands) {
        if (!isPaperCommand(cmd, this.options.decorations)) continue;
        ctx.fillStyle = theme.paper;
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 10;
        // 填充真实多边形，以支持反向角点 / 旋转的图框。
        ctx.beginPath();
        cmd.points.forEach(([px, py], index) => {
          if (index === 0) ctx.moveTo(tx(px), ty(py));
          else ctx.lineTo(tx(px), ty(py));
        });
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }
    }

    for (const cmd of data.commands) {
      // 复用 core 调用链：随层样式 → ACI hex。
      const style = resolveCommandStyle(cmd, layerLookup);
      const strokeColor = theme.resolveAci(style.color);
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;

      // 线型 → canvas 虚线样式（dash 间距按 scale 缩放，且不小于 1px）。
      if (style.linetype === 'DASHED') {
        ctx.setLineDash([Math.max(1, 1.2 * scale), Math.max(1, 0.9 * scale)]);
      } else if (style.linetype === 'DOT') {
        ctx.setLineDash([Math.max(1, 0.4 * scale), Math.max(1, 0.7 * scale)]);
      } else {
        ctx.setLineDash([]);
      }

      switch (cmd.type) {
        case 'line': {
          ctx.lineWidth = Math.max(0.5, (style.color === 8 ? 0.16 : 0.24) * scale);
          ctx.beginPath();
          ctx.moveTo(tx(cmd.x1), ty(cmd.y1));
          ctx.lineTo(tx(cmd.x2), ty(cmd.y2));
          ctx.stroke();
          break;
        }
        case 'circle': {
          if (!Number.isFinite(cmd.r) || cmd.r <= 0) break;
          ctx.lineWidth = Math.max(0.5, 0.16 * scale);
          ctx.beginPath();
          ctx.arc(tx(cmd.cx), ty(cmd.cy), Math.max(0.3, cmd.r * scale), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'polyline': {
          if (cmd.points.length < 2) break;
          ctx.lineWidth = Math.max(
            0.6,
            (cmd.lineWidth > 0 ? cmd.lineWidth : 0.24) * scale
          );
          ctx.beginPath();
          cmd.points.forEach(([px, py], index) => {
            if (index === 0) ctx.moveTo(tx(px), ty(py));
            else ctx.lineTo(tx(px), ty(py));
          });
          if (cmd.closed) ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'text': {
          if (!Number.isFinite(cmd.h) || cmd.h <= 0) break;
          const fontPx = cmd.h * scale * text.canvasSizeFactor;
          // 屏幕字号过小的文本跳过，避免糊成一团。
          if (fontPx < text.minCanvasFontPx) break;

          ctx.save();
          ctx.translate(tx(cmd.x), ty(cmd.y));
          // 旋转取负：canvas 屏幕 Y 向下，与 SVG 端一致。
          if (cmd.rot) ctx.rotate((-cmd.rot * Math.PI) / 180);
          ctx.scale(cmd.widthFactor || text.defaultWidthFactor, 1);

          const isBold = isBoldText(cmd, this.options.decorations);
          ctx.font = `${isBold ? 'bold ' : ''}${fontPx}px ${text.canvasFontFamily}`;

          // 组码 72/73 → canvas 的 textAlign / textBaseline。
          if (cmd.hAlign === 1) ctx.textAlign = 'center';
          else if (cmd.hAlign === 2) ctx.textAlign = 'right';
          else ctx.textAlign = 'left';

          if (cmd.vAlign === 1) ctx.textBaseline = 'bottom';
          else if (cmd.vAlign === 2) ctx.textBaseline = 'middle';
          else if (cmd.vAlign === 3) ctx.textBaseline = 'top';
          else ctx.textBaseline = 'alphabetic';

          ctx.fillText(cmd.text, 0, 0);
          ctx.restore();
          break;
        }
        case 'solid': {
          if (
            cmd.points.length < 3 ||
            !cmd.points.every(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
          ) {
            break;
          }
          ctx.beginPath();
          cmd.points.forEach(([px, py], index) => {
            if (index === 0) ctx.moveTo(tx(px), ty(py));
            else ctx.lineTo(tx(px), ty(py));
          });
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
    }

    ctx.restore();
  }
}

```

## src\render\dual-view.ts
```ts
/**
 * 双视图预览门面（Facade + Observer），render 层的核心编排者。
 *
 * 一个共享的 `Camera` 同时驱动 Canvas 2D 变换与 SVG viewBox，让两个窗格
 * 始终保持 1:1 对齐。滚轮缩放与拖拽平移绑定到给定窗格；每次相机变化都会
 * 全量重绘 Canvas，但 SVG 只更新 viewBox 属性（除非内容真的变了）。
 *
 * 这是一个显式状态机，四个关键状态：
 *  - destroyed：destroy() 后所有公开方法守卫返回，不再工作；
 *  - drag：null 或 {element,lastX,lastY}，表示正在拖拽平移；
 *  - needsFullSvgRender：true 时下次 draw 全量重建 SVG，否则只更新 viewBox；
 *  - limits：当前缩放包络，fit() 时从不可变的 baseLimits 重算，避免跨文档泄漏。
 *
 * 事件用 AbortController.signal 统一绑定，destroy() 时一次性解绑全部监听。
 */

import type { DecorationOptions } from '../core/decorations';
import { resolveDocumentData, type DocumentLike } from '../core/data';
import type { TextMetricsPolicy } from '../core/text';
import { resolveTheme, type RenderTheme, type ThemeInput } from '../core/theme';
import type { DocumentData } from '../core/types';
import { Camera, type CameraLimits, type CameraState } from './camera';
import { CanvasRenderer } from './canvas-renderer';
import { Emitter } from './emitter';
import { SvgLiveView } from './svg-live-view';
import { Viewport, type ViewportMetrics } from './viewport';

/** 触发重绘的原因，随 render 事件发出。 */
export type RenderReason =
  | 'fit'
  | 'zoom'
  | 'pan'
  | 'resize'
  | 'document'
  | 'theme'
  | 'clear'
  | 'manual';

/** 门面对外发出的事件及其载荷类型。 */
export interface DualViewEvents {
  render: { reason: RenderReason };
  cameraChange: CameraState;
  documentChange: DocumentData | null;
  themeChange: RenderTheme;
  destroy: undefined;
}

/** 门面构造选项。 */
export interface DualViewOptions {
  canvas: HTMLCanvasElement;
  svgContainer: HTMLElement;
  /**
   * 用于测量逻辑尺寸的元素。可见窗格会变化时传 getter（如 SVG-only 模式）。
   * 默认取 canvas 的父元素。
   */
  measure?: HTMLElement | (() => HTMLElement | null) | null;
  /** 接收滚轮/拖拽事件的元素，默认 [canvas, svgContainer]。 */
  panes?: HTMLElement[];
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  camera?: Camera;
  limits?: CameraLimits;
  zoomStep?: { in: number; out: number };
  paddingPx?: number;
  svgRootId?: string | null;
  /** SVG 文本是否输出 `xml:space="preserve"`，默认 true。 */
  preserveWhitespace?: boolean;
  listenWindowResize?: boolean;
  maxDpr?: number;
}

/** 双视图预览门面。 */
export class DualViewPreview {
  readonly camera: Camera;
  readonly viewport: Viewport;

  private readonly options: DualViewOptions;
  private readonly renderer: CanvasRenderer;
  private readonly svgView: SvgLiveView;
  private readonly emitter = new Emitter<DualViewEvents>();
  private readonly abort: AbortController;
  private readonly baseLimits: CameraLimits;
  private limits: CameraLimits;

  private doc: DocumentData | null = null;
  private needsFullSvgRender = true;
  private drag: { element: HTMLElement; lastX: number; lastY: number } | null = null;
  private destroyed = false;

  /** 组装相机/视口/两个渲染端/事件器，并绑定交互事件。 */
  constructor(options: DualViewOptions) {
    this.options = options;
    const ownerWindow = options.canvas.ownerDocument?.defaultView;
    const AbortCtor = ownerWindow?.AbortController ?? AbortController;
    this.abort = new AbortCtor();
    this.baseLimits = options.limits ?? { minScale: 0.2, maxScale: 50 };
    this.limits = { ...this.baseLimits };
    this.camera = options.camera ?? new Camera();
    this.viewport = new Viewport({
      canvas: options.canvas,
      measure: options.measure ?? options.canvas.parentElement ?? null,
      maxDpr: options.maxDpr,
    });
    this.renderer = new CanvasRenderer({
      theme: options.theme,
      decorations: options.decorations,
      text: options.text,
    });
    this.svgView = new SvgLiveView(options.svgContainer, {
      theme: options.theme,
      decorations: options.decorations,
      text: options.text,
      rootId: options.svgRootId,
      preserveWhitespace: options.preserveWhitespace,
    });
    this.bindEvents();
  }

  /** 当前文档快照。 */
  get document(): DocumentData | null {
    return this.doc;
  }

  /** 当前解析后的主题。 */
  get theme(): RenderTheme {
    return this.renderer.getTheme();
  }

  /**
   * 设置文档：归一化快照、置全量渲染标志、发 documentChange；
   * doc 为 null 则清空；options.fit 决定适配视图还是直接重绘。
   */
  setDocument(doc: DocumentLike | null, options: { fit?: boolean } = {}): void {
    if (this.destroyed) return;
    this.doc = doc ? resolveDocumentData(doc) : null;
    this.needsFullSvgRender = true;
    this.emitter.emit('documentChange', this.doc);

    if (!this.doc) {
      this.clear();
      return;
    }
    if (options.fit) this.fit();
    else this.draw('document');
  }

  /** 切换主题并强制全量重建 SVG（颜色会变）。 */
  setTheme(theme: ThemeInput): void {
    if (this.destroyed) return;
    this.renderer.setTheme(theme);
    this.svgView.setTheme(theme);
    this.needsFullSvgRender = true;
    if (this.doc) this.draw('theme');
    else this.clear();
    this.emitter.emit('themeChange', resolveTheme(theme));
  }

  /** 切换装饰配置并强制全量重建 SVG。 */
  setDecorations(decorations: DecorationOptions): void {
    if (this.destroyed) return;
    this.renderer.setDecorations(decorations);
    this.svgView.setDecorations(decorations);
    this.needsFullSvgRender = true;
    if (this.doc) this.draw('theme');
  }

  /** 切换测量元素（拖拽/滚轮绑定保持不变）。 */
  setMeasureElement(element: HTMLElement | (() => HTMLElement | null) | null): void {
    if (this.destroyed) return;
    this.viewport.setMeasureElement(element);
  }

  /**
   * 适配视图：相机 fit 后，从不可变的 baseLimits 派生新的缩放包络
   * （在 fit 后的 scale 上下各留一半/两倍余量），这样超大/超小图纸既能
   * 继续缩放，又不会把上一次的 limits 泄漏到后续文档。
   */
  fit(): void {
    if (this.destroyed) return;
    const metrics = this.viewport.sync();
    if (this.doc) {
      this.camera.fit(this.doc.extents, metrics, this.options.paddingPx ?? 16);
      const scale = this.camera.scale;
      if (Number.isFinite(scale) && scale > 0) {
        this.limits = {
          minScale: Math.min(this.baseLimits.minScale, scale * 0.5),
          maxScale: Math.max(this.baseLimits.maxScale, scale * 2),
        };
      } else {
        this.limits = { ...this.baseLimits };
      }
    } else {
      this.limits = { ...this.baseLimits };
    }
    this.draw('fit', metrics);
  }

  /** 重置视图（等同 fit）。 */
  resetView(): void {
    this.fit();
  }

  /** 以当前相机状态重绘一帧。 */
  render(reason: RenderReason = 'manual'): void {
    if (this.destroyed) return;
    this.draw(reason);
  }

  /** 清空两端：canvas 填背景色、SVG 清子树、置全量渲染标志。 */
  clear(): void {
    if (this.destroyed) return;
    const metrics = this.viewport.sync();
    const ctx = this.options.canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
      ctx.fillStyle = this.renderer.getTheme().background;
      ctx.fillRect(0, 0, metrics.width, metrics.height);
      ctx.restore();
    }
    this.svgView.clear();
    this.needsFullSvgRender = true;
    this.emitter.emit('render', { reason: 'clear' });
  }

  /** 订阅事件；destroy() 后订阅返回空操作。 */
  on<K extends keyof DualViewEvents>(
    event: K,
    listener: (payload: DualViewEvents[K]) => void
  ): () => void {
    if (this.destroyed) return () => undefined;
    return this.emitter.on(event, listener);
  }

  /** 取消订阅。 */
  off<K extends keyof DualViewEvents>(
    event: K,
    listener: (payload: DualViewEvents[K]) => void
  ): void {
    if (this.destroyed) return;
    this.emitter.off(event, listener);
  }

  /** 销毁：一次性解绑全部事件、清空资源、发 destroy 并清事件器。 */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    this.svgView.clear();
    this.emitter.emit('destroy', undefined);
    this.emitter.clear();
    this.doc = null;
    this.drag = null;
  }

  /**
   * 核心渲染编排：Canvas 总是全量重绘；SVG 视 needsFullSvgRender 标志
   *（或尚无内容、或 forceFullSvg）决定全量重建还是仅 setViewBox。
   * 最后发 render 与 cameraChange 事件。
   */
  private draw(
    reason: RenderReason,
    metrics?: ViewportMetrics,
    forceFullSvg = false
  ): void {
    if (!this.doc) {
      this.clear();
      return;
    }
    const m = metrics ?? this.viewport.sync();
    this.renderer.render(this.doc, this.options.canvas, this.camera, m);

    const viewBox = this.camera.getViewBox(m);
    if (forceFullSvg || this.needsFullSvgRender || !this.svgView.hasRenderedContent) {
      this.svgView.render(this.doc, viewBox);
      this.needsFullSvgRender = false;
    } else {
      this.svgView.setViewBox(viewBox);
    }

    this.emitter.emit('render', { reason });
    this.emitter.emit('cameraChange', this.camera.getState());
  }

  /** 用 AbortController.signal 统一绑定 wheel/mousedown/mousemove/up/blur/resize。 */
  private bindEvents(): void {
    const win =
      this.options.canvas.ownerDocument?.defaultView ??
      (typeof window !== 'undefined' ? window : null);
    if (!win) return;
    const signal = this.abort.signal;
    const panes = this.options.panes ?? [this.options.canvas, this.options.svgContainer];

    for (const pane of panes) {
      pane.addEventListener('wheel', this.onWheel as EventListener, {
        passive: false,
        signal,
      });
      pane.addEventListener('mousedown', this.onMouseDown as EventListener, { signal });
    }
    win.addEventListener('mousemove', this.onMouseMove as EventListener, { signal });
    win.addEventListener('mouseup', this.onMouseUp as EventListener, { signal });
    win.addEventListener('blur', this.onWindowBlur, { signal });
    if (this.options.listenWindowResize !== false) {
      win.addEventListener('resize', this.onResize, { signal });
    }
  }

  /** 滚轮缩放：以鼠标所在屏幕点为中心 zoomAt，然后重绘。 */
  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (!this.doc) return;

    const pane = event.currentTarget as HTMLElement | null;
    const metrics = this.viewport.sync();
    const point = this.viewport.pointFromEvent(event, pane, metrics);
    if (!point) return;

    const step = this.options.zoomStep ?? { in: 1.15, out: 0.87 };
    const factor = event.deltaY < 0 ? step.in : step.out;
    this.camera.zoomAt(point.x, point.y, factor, this.limits);
    this.draw('zoom', metrics);
  };

  /** 鼠标按下：仅左键，进入 drag 状态。preventDefault 防止选中文字/原生拖拽。 */
  private onMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return;
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    // 在 SVG 文字上平移时，阻止浏览器原生的文字选择/拖动手势。
    event.preventDefault();
    this.drag = { element, lastX: event.clientX, lastY: event.clientY };
  };

  /** 窗口失焦（切换标签/开发者工具）：复位 drag，防止拖拽卡死。 */
  private onWindowBlur = (): void => {
    this.drag = null;
  };

  /** 鼠标移动：drag 状态下按鼠标位移 panBy，再重绘（仅更新 SVG viewBox）。 */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.drag || !this.doc) return;
    const metrics = this.viewport.sync();
    const rect = this.drag.element.getBoundingClientRect();
    const ratioX = metrics.width / Math.max(1, rect.width);
    const ratioY = metrics.height / Math.max(1, rect.height);

    this.camera.panBy(
      (event.clientX - this.drag.lastX) * ratioX,
      (event.clientY - this.drag.lastY) * ratioY
    );
    this.drag.lastX = event.clientX;
    this.drag.lastY = event.clientY;
    this.draw('pan', metrics);
  };

  /** 鼠标抬起：退出 drag 状态。 */
  private onMouseUp = (): void => {
    this.drag = null;
  };

  /** 窗口尺寸变化：重绘以重新适配视口像素。 */
  private onResize = (): void => {
    if (!this.doc) return;
    this.draw('resize');
  };
}

```

## src\render\emitter.ts
```ts
/**
 * 类型化的最小事件发射器（无 DOM 依赖）。
 *
 * 被 DualViewPreview 用作观察者机制：对外暴露 render / cameraChange /
 * documentChange / themeChange / destroy 等事件。泛型 `Events` 把事件名
 * 映射到它的载荷类型，从而让 on/emit 获得类型安全。
 */

type Listener<T> = (payload: T) => void;

/** 泛型事件发射器：按事件名维护监听器集合。 */
export class Emitter<Events extends object> {
  private readonly listeners = new Map<keyof Events, Set<Listener<never>>>();

  /**
   * 注册监听器。
   * 返回：一个反注册闭包，调用它即可取消本次订阅。
   */
  on<K extends keyof Events>(event: K, listener: Listener<Events[K]>): () => void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(event, listener);
  }

  /** 注销监听器；该事件监听器清空后把事件键一并删除。 */
  off<K extends keyof Events>(event: K, listener: Listener<Events[K]>): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.delete(listener as Listener<never>);
    if (set.size === 0) this.listeners.delete(event);
  }

  /**
   * 触发事件。
   * 注意：用 `Array.from(set)` 拷贝一份再遍历，避免监听器在回调中 on/off
   * 修改集合导致迭代行为异常。
   */
  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const listener of Array.from(set)) {
      (listener as Listener<Events[K]>)(payload);
    }
  }

  /** 清空所有事件的监听器。 */
  clear(): void {
    this.listeners.clear();
  }
}

```

## src\render\index.ts
```ts
/**
 * render 层（浏览器渲染与交互）统一出口。
 *
 * 这是全库唯一依赖 DOM 的核心层：相机负责世界↔屏幕坐标换算，视口负责尺寸
 * 与 DPR 适配，CanvasRenderer 与 SvgLiveView 分别把同一份 IR 画到两个引擎，
 * DualViewPreview 作为门面用一个共享相机统一调度两端、保证 1:1 同步。
 *
 * 注意本层为浏览器专用，不应从环境无关的主入口 `index.ts` 导出。
 */
export * from './camera'; // Camera：世界(mm)↔屏幕(px)↔SVG viewBox 的坐标变换
export * from './viewport'; // Viewport：DOM 尺寸测量与 DPR 适配
export * from './canvas-renderer'; // CanvasRenderer：把 IR 画到 2D canvas
export * from './svg-live-view'; // SvgLiveView：管理活动 SVG 子树（全量渲染/仅更新 viewBox）
export * from './dual-view'; // DualViewPreview：双视图门面 + 交互状态机
export * from './emitter'; // Emitter：无 DOM 依赖的泛型事件发射器
// 装饰判定本属 core，这里转出是为了让 render 的使用者直接从本入口取到配套工具。
export { isPaperCommand, isBoldText } from '../core/decorations';
export type { DecorationOptions } from '../core/decorations';

```

## src\render\svg-live-view.ts
```ts
/**
 * 实时 SVG 视图：管理容器内的一个活动 SVG 子树（依赖 DOM）。
 *
 * 关键性能取舍：文档/主题变化走全量 `render()` 重建子树；而平移/缩放只走
 * `setViewBox()` 修改根节点的 viewBox 属性，不重建 DOM（保留旧实现的性能特性）。
 * `hasRenderedContent`/`rootElement` 两个状态决定双视图门面该用哪条路径。
 */

import type { DecorationOptions } from '../core/decorations';
import type { DocumentLike } from '../core/data';
import { fmtNumber } from '../core/format';
import type { TextMetricsPolicy } from '../core/text';
import type { ThemeInput } from '../core/theme';
import type { ViewBox } from '../core/types';
import { SvgSerializer } from '../svg/serializer';

/** 实时 SVG 视图选项。 */
export interface SvgLiveViewOptions {
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  /** 根节点 id，默认 'liveSvgElement'；传 null 则省略 id 属性。 */
  rootId?: string | null;
  /** 在文本上输出 `xml:space="preserve"`，默认 true。 */
  preserveWhitespace?: boolean;
}

/** 管理容器内 SVG 子树的类。 */
export class SvgLiveView {
  private readonly container: HTMLElement;
  private options: SvgLiveViewOptions;
  private rootElement: SVGSVGElement | null = null;
  private rendered = false;

  constructor(container: HTMLElement, options: SvgLiveViewOptions = {}) {
    this.container = container;
    this.options = options;
  }

  /**
   * 全量渲染：用 SvgSerializer 的 live 模式生成 SVG 并替换容器 innerHTML，
   * 保存根节点引用。doc 为 null 时等价于 clear()。
   */
  render(doc: DocumentLike | null, viewBox?: ViewBox | null): void {
    if (!doc) {
      this.clear();
      return;
    }

    const serializer = new SvgSerializer();
    const svg = serializer.serialize(doc, {
      theme: this.options.theme,
      mode: 'live',
      viewBox: viewBox ?? null,
      rootId: this.options.rootId === undefined ? 'liveSvgElement' : this.options.rootId,
      decorations: this.options.decorations,
      text: this.options.text,
      preserveWhitespace: this.options.preserveWhitespace,
    });

    this.container.innerHTML = svg;
    this.rootElement = this.container.querySelector('svg');
    this.rendered = true;
  }

  /** 仅更新根节点的 viewBox 属性（平移/缩放走这里，避免全量重建）。 */
  setViewBox(viewBox: ViewBox): void {
    if (!this.rootElement) return;
    this.rootElement.setAttribute(
      'viewBox',
      `${fmtNumber(viewBox.x)} ${fmtNumber(viewBox.y)} ${fmtNumber(viewBox.w)} ${fmtNumber(
        viewBox.h
      )}`
    );
  }

  /** 切换主题（下次全量渲染生效）。 */
  setTheme(theme: ThemeInput): void {
    this.options = { ...this.options, theme };
  }

  /** 切换装饰配置（下次全量渲染生效）。 */
  setDecorations(decorations: DecorationOptions): void {
    this.options = { ...this.options, decorations };
  }

  /** 清空容器并复位状态。 */
  clear(): void {
    this.container.innerHTML = '';
    this.rootElement = null;
    this.rendered = false;
  }

  /** 当前 SVG 根元素。 */
  get element(): SVGSVGElement | null {
    return this.rootElement;
  }

  /** 是否已经渲染过内容（决定 setViewBox 是否可用）。 */
  get hasRenderedContent(): boolean {
    return this.rendered;
  }
}

```

## src\render\viewport.ts
```ts
/**
 * 视口适配层（依赖 DOM）：测量逻辑视口尺寸，并让 canvas 的 backing store
 * 与 devicePixelRatio 同步，从而在 HiDPI 屏幕上清晰绘制而不被拉伸。
 *
 * 逻辑尺寸（CSS px）与实际像素（canvas.width/height）分开：相机使用逻辑尺寸，
 * 渲染时通过 setTransform(dpr,...) 放大到实际像素。
 */

export interface ViewportMetrics {
  width: number;
  height: number;
  dpr: number;
}

export interface ViewportOptions {
  canvas: HTMLCanvasElement;
  /**
   * CSS 盒子被用来定义逻辑视口尺寸的元素。
   * 可以是 getter，便于调用方切换窗格（如 SVG-only 模式下 canvas 被
   * display:none，量到 0，此时改测另一个元素）。
   */
  measure?: HTMLElement | (() => HTMLElement | null) | null;
  /** devicePixelRatio 的上限，默认 3。 */
  maxDpr?: number;
  /** 逻辑视口最小尺寸，默认 1（不强制拉伸）。 */
  minSize?: number;
  /** 测量元素缺失或尺寸为 0 时的兜底尺寸，默认 800×690。 */
  fallbackSize?: { width: number; height: number };
}

/** DOM 视口适配器。 */
export class Viewport {
  private readonly options: ViewportOptions;
  private lastMetrics: ViewportMetrics | null = null;

  constructor(options: ViewportOptions) {
    this.options = options;
  }

  /** 切换用于测量的元素（不影响已绑定的拖拽/滚轮事件）。 */
  setMeasureElement(element: HTMLElement | (() => HTMLElement | null) | null): void {
    this.options.measure = element;
  }

  /** 取当前测量元素（兼容 getter 形式）。 */
  getMeasureElement(): HTMLElement | null {
    const source = this.options.measure;
    if (!source) return null;
    if (typeof source === 'function') return source();
    return source;
  }

  /** 最近一次 sync() 得到的尺寸指标。 */
  get metrics(): ViewportMetrics | null {
    return this.lastMetrics;
  }

  /**
   * 量测逻辑尺寸并按 DPR 同步 canvas 的实际像素尺寸。
   *
   * 逻辑尺寸取测量元素的 CSS 盒子（四舍五入、不低于 minSize），
   * DPR 取 min(maxDpr, max(1, window.devicePixelRatio))；
   * 仅当实际像素尺寸变化时才写 canvas.width/height（写会清空画布）。
   * 返回：本次的 ViewportMetrics。
   */
  sync(): ViewportMetrics {
    const canvas = this.options.canvas;
    const measure = this.getMeasureElement();
    const rect = measure ? measure.getBoundingClientRect() : null;
    const fallback = this.options.fallbackSize ?? { width: 800, height: 690 };
    const minSize = Math.max(1, this.options.minSize ?? 1);
    const maxDpr = this.options.maxDpr ?? 3;

    const logicalW = Math.max(minSize, Math.round(rect?.width || fallback.width));
    const logicalH = Math.max(minSize, Math.round(rect?.height || fallback.height));
    const win =
      canvas.ownerDocument?.defaultView ?? (typeof window !== 'undefined' ? window : undefined);
    const dpr = Math.min(maxDpr, Math.max(1, win?.devicePixelRatio || 1));

    const targetW = Math.round(logicalW * dpr);
    const targetH = Math.round(logicalH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const metrics: ViewportMetrics = { width: logicalW, height: logicalH, dpr };
    this.lastMetrics = metrics;
    return metrics;
  }

  /**
   * 把鼠标事件坐标换算成逻辑视口坐标。
   * 参数：event 为含 clientX/clientY 的事件；element 为监听器所挂载的元素
   *       （默认取测量元素）；metrics 可传入以避免重复量测。
   * 返回：逻辑坐标；没有可用元素时返回 null。
   */
  pointFromEvent(
    event: { clientX: number; clientY: number },
    element?: HTMLElement | null,
    metrics?: ViewportMetrics
  ): { x: number; y: number } | null {
    const el = element ?? this.getMeasureElement();
    if (!el) return null;
    const m = metrics ?? this.lastMetrics ?? this.sync();
    const rect = el.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (m.width / Math.max(1, rect.width)),
      y: (event.clientY - rect.top) * (m.height / Math.max(1, rect.height)),
    };
  }
}

```

## src\svg\index.ts
```ts
/**
 * SVG 输出端出口：把 IR 快照序列化为 SVG 文本。
 *
 * 支持 live（实时预览）与 export（静态导出）两种模式；SVG 坐标对世界坐标
 * 做 Y 翻转（y → -y），并与 Canvas 相机共用同一套 viewBox 约定，保证双视图
 * 预览时两端 1:1 对齐。纯计算、环境无关。
 */
export * from './serializer'; // SvgSerializer 与静态便捷出口 SvgExporter
export * from './parser'; // SvgImporter 与 parseSvgToDocument（SVG → DrawingDocument IR）

```

## src\svg\parser.ts
```ts
/**
 * SVG 输入端：把 SVG 文本解析并转换为 `DrawingDocument`（统一图元 IR）。
 *
 * 零运行时依赖、环境无关（不依赖浏览器 DOMParser，Node 与浏览器输出完全一致）。
 * 转换后的 `DrawingDocument` 可直接交给 `DxfExporter` 导出 DXF，或交给
 * `DualViewPreview` 做 Canvas + SVG 双引擎预览。
 */

import { colorToAci, sanitizeLayerCandidate } from '../core/color';
import { DrawingDocument } from '../core/document';
import type { HAlign, Linetype, Point, VAlign } from '../core/types';

/** Y 轴翻转策略。 */
export type SvgYAxisMode = 'flip-viewbox' | 'negate';

/** 图层归类策略。 */
export type SvgLayerStrategy = 'group-id' | 'color' | 'single';

/** 填充元素处理策略：仅轮廓线 / DXF 原生 SOLID 实心填充 / 忽略纯填充。 */
export type SvgFillMode = 'outline' | 'solid' | 'ignore';

/** SVG 导入选项。 */
export interface SvgImportOptions {
  /**
   * Y 轴翻转模式：
   * - `'flip-viewbox'`（默认）：按 viewBox 高度翻转到第一象限，适合任意外部 SVG；
   * - `'negate'`：直接取 `y → -y`，与 `SvgSerializer` 输出精确互逆。
   */
  yAxis?: SvgYAxisMode;
  /** 曲线/圆弧/椭圆离散的弦高容差（世界单位 mm），默认 0.1。 */
  curveTolerance?: number;
  /**
   * 显式坐标缩放倍率（SVG 用户单位 → 世界 mm）。
   * 未传时：若根 `<svg>` 带物理单位（mm/cm/in/pt/pc/px）且有 viewBox，
   * 自动换算到 mm；否则保持 1:1 数值。
   */
  scale?: number;
  /** 图层归类方式：按 `<g id>` / `data-layer`、按 ACI 颜色或统一单图层，默认 `'group-id'`。 */
  layerBy?: SvgLayerStrategy;
  /** 默认图层名，默认 `'0'`。 */
  defaultLayer?: string;
  /** 仅有 fill 无 stroke 的几何元素如何处理，默认 `'outline'`（转为闭合轮廓）。 */
  fillMode?: SvgFillMode;
  /** 是否跳过覆盖整个画布的无描边背景 `<rect>`，默认 `true`。 */
  ignoreBackground?: boolean;
  /** 文本字号换算系数，默认 `1`（往返本库 SvgSerializer 时可传 `1 / 1.04`）。 */
  fontSizeScale?: number;
  /** 单份 SVG 允许的最大图元上限，防止畸形路径导致内存溢出，默认 `200_000`；传 `0` 关闭。 */
  maxPrimitives?: number;
}

/* ================= 轻量 XML / SVG 树解析 ================= */

interface XmlNode {
  tag: string;
  attrs: Record<string, string>;
  children: Array<XmlNode | string>;
}

const NON_DRAWING_TAGS = new Set([
  'defs',
  'style',
  'title',
  'desc',
  'metadata',
  'clippath',
  'mask',
  'lineargradient',
  'radialgradient',
  'filter',
  'script',
  'pattern',
  'symbol',
  'marker',
]);

const NAMED_XML_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
};

function decodeXmlEntities(input: string): string {
  if (!input.includes('&')) return input;
  return input.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z]+);/g, (match, body: string) => {
    if (body.startsWith('#x') || body.startsWith('#X')) {
      const code = Number.parseInt(body.slice(2), 16);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    if (body.startsWith('#')) {
      const code = Number.parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code >= 0 && code <= 0x10ffff
        ? String.fromCodePoint(code)
        : match;
    }
    return NAMED_XML_ENTITIES[body] ?? match;
  });
}

function localTagName(raw: string): string {
  const colon = raw.lastIndexOf(':');
  return (colon >= 0 ? raw.slice(colon + 1) : raw).toLowerCase();
}

/** 轻量无依赖 XML/SVG 解析器：返回最外层 `<svg>` 节点（不存在时返回 null）。 */
function parseXmlRoot(source: string): XmlNode | null {
  const text = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const len = text.length;
  let pos = 0;

  const root: XmlNode = { tag: '#root', attrs: {}, children: [] };
  const stack: XmlNode[] = [root];

  const isSpace = (ch: number): boolean => ch === 32 || ch === 9 || ch === 10 || ch === 13;

  while (pos < len) {
    const lt = text.indexOf('<', pos);
    if (lt === -1) {
      const tail = text.slice(pos);
      if (tail) stack[stack.length - 1].children.push(decodeXmlEntities(tail));
      break;
    }
    if (lt > pos) {
      stack[stack.length - 1].children.push(decodeXmlEntities(text.slice(pos, lt)));
    }

    // 注释 <!-- ... -->
    if (text.startsWith('<!--', lt)) {
      const end = text.indexOf('-->', lt + 4);
      pos = end === -1 ? len : end + 3;
      continue;
    }
    // CDATA <![CDATA[ ... ]]>
    if (text.startsWith('<![CDATA[', lt)) {
      const end = text.indexOf(']]>', lt + 9);
      const body = end === -1 ? text.slice(lt + 9) : text.slice(lt + 9, end);
      if (body) stack[stack.length - 1].children.push(body);
      pos = end === -1 ? len : end + 3;
      continue;
    }
    // 处理指令 <? ... ?>
    if (text.startsWith('<?', lt)) {
      const end = text.indexOf('?>', lt + 2);
      pos = end === -1 ? len : end + 2;
      continue;
    }
    // DOCTYPE / 声明 <! ... >（兼容内部 [...] 子集）
    if (text.startsWith('<!', lt)) {
      let i = lt + 2;
      let bracketDepth = 0;
      while (i < len) {
        const c = text.charCodeAt(i);
        if (c === 91) bracketDepth++; // [
        else if (c === 93 && bracketDepth > 0) bracketDepth--; // ]
        else if (c === 62 && bracketDepth === 0) {
          i++;
          break;
        }
        i++;
      }
      pos = i;
      continue;
    }
    // 闭合标签 </tag>
    if (text.startsWith('</', lt)) {
      const gt = text.indexOf('>', lt + 2);
      const rawName = (gt === -1 ? text.slice(lt + 2) : text.slice(lt + 2, gt)).trim();
      const closeTag = localTagName(rawName);
      for (let k = stack.length - 1; k >= 1; k--) {
        if (stack[k].tag === closeTag) {
          stack.length = k;
          break;
        }
      }
      pos = gt === -1 ? len : gt + 1;
      continue;
    }

    // 开始标签 <tag attr="val" ...>
    let i = lt + 1;
    while (i < len && !isSpace(text.charCodeAt(i)) && text[i] !== '>' && text[i] !== '/') {
      i++;
    }
    const rawTag = text.slice(lt + 1, i);
    if (!rawTag) {
      pos = lt + 1;
      continue;
    }
    const tag = localTagName(rawTag);
    const attrs: Record<string, string> = {};
    let selfClosing = false;

    while (i < len) {
      while (i < len && isSpace(text.charCodeAt(i))) i++;
      if (i >= len) break;
      if (text[i] === '>') {
        i++;
        break;
      }
      if (text[i] === '/' && text[i + 1] === '>') {
        selfClosing = true;
        i += 2;
        break;
      }

      const nameStart = i;
      while (
        i < len &&
        !isSpace(text.charCodeAt(i)) &&
        text[i] !== '=' &&
        text[i] !== '>' &&
        text[i] !== '/'
      ) {
        i++;
      }
      const attrName = text.slice(nameStart, i).toLowerCase();
      while (i < len && isSpace(text.charCodeAt(i))) i++;

      let attrVal = '';
      if (text[i] === '=') {
        i++;
        while (i < len && isSpace(text.charCodeAt(i))) i++;
        if (text[i] === '"' || text[i] === "'") {
          const quote = text[i++];
          const valStart = i;
          while (i < len && text[i] !== quote) i++;
          attrVal = decodeXmlEntities(text.slice(valStart, i));
          if (i < len && text[i] === quote) i++;
        } else {
          const valStart = i;
          while (i < len && !isSpace(text.charCodeAt(i)) && text[i] !== '>' && text[i] !== '/') {
            i++;
          }
          attrVal = decodeXmlEntities(text.slice(valStart, i));
        }
      }
      if (attrName) attrs[attrName] = attrVal;
    }

    const node: XmlNode = { tag, attrs, children: [] };
    stack[stack.length - 1].children.push(node);
    if (!selfClosing) stack.push(node);
    pos = i;
  }

  const findSvg = (node: XmlNode): XmlNode | null => {
    if (node.tag === 'svg') return node;
    for (const child of node.children) {
      if (typeof child !== 'string') {
        const hit = findSvg(child);
        if (hit) return hit;
      }
    }
    return null;
  };
  return findSvg(root);
}

/* ================= 2D 仿射矩阵 ================= */

type Mat2D = readonly [number, number, number, number, number, number];

const IDENTITY_MAT: Mat2D = [1, 0, 0, 1, 0, 0];

function mulMat(m1: Mat2D, m2: Mat2D): Mat2D {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMat(m: Mat2D, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function maxMatrixScale(m: Mat2D): number {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  const s = Math.max(sx, sy);
  return Number.isFinite(s) && s > 1e-9 ? s : 1;
}

function uniformScaleIfSimilar(m: Mat2D): number | null {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  if (sx <= 1e-9 || sy <= 1e-9) return null;
  if (Math.abs(sx - sy) / Math.max(sx, sy) > 1e-4) return null;
  const dot = m[0] * m[2] + m[1] * m[3];
  if (Math.abs(dot) / (sx * sy) > 1e-4) return null;
  return (sx + sy) * 0.5;
}

function parseNumberList(input: string): number[] {
  const out: number[] = [];
  const re = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const n = Number(m[0]);
    if (Number.isFinite(n)) out.push(n);
  }
  return out;
}

function parseTransform(attr: string | undefined): Mat2D {
  if (!attr) return IDENTITY_MAT;
  let result: Mat2D = IDENTITY_MAT;
  const re = /([a-zA-Z]+)\s*\(([^)]*)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attr)) !== null) {
    const fn = m[1].toLowerCase();
    const nums = parseNumberList(m[2]);
    let step: Mat2D | null = null;
    switch (fn) {
      case 'matrix':
        if (nums.length >= 6) {
          step = [nums[0], nums[1], nums[2], nums[3], nums[4], nums[5]];
        }
        break;
      case 'translate':
        if (nums.length >= 1) {
          step = [1, 0, 0, 1, nums[0], nums[1] ?? 0];
        }
        break;
      case 'scale':
        if (nums.length >= 1) {
          const sx = nums[0];
          const sy = nums[1] ?? sx;
          step = [sx, 0, 0, sy, 0, 0];
        }
        break;
      case 'rotate':
        if (nums.length >= 1) {
          const rad = (nums[0] * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const rot: Mat2D = [cos, sin, -sin, cos, 0, 0];
          if (nums.length >= 3) {
            const cx = nums[1];
            const cy = nums[2];
            step = mulMat(mulMat([1, 0, 0, 1, cx, cy], rot), [1, 0, 0, 1, -cx, -cy]);
          } else {
            step = rot;
          }
        }
        break;
      case 'skewx':
        if (nums.length >= 1) {
          step = [1, 0, Math.tan((nums[0] * Math.PI) / 180), 1, 0, 0];
        }
        break;
      case 'skewy':
        if (nums.length >= 1) {
          step = [1, Math.tan((nums[0] * Math.PI) / 180), 0, 1, 0, 0];
        }
        break;
    }
    if (step) result = mulMat(result, step);
  }
  return result;
}

/* ================= 单位、样式与颜色 → ACI 映射 ================= */

/** 把带单位的长度转换为 mm；无单位或无法解析时返回 null。 */
function parseLengthMm(raw: string | undefined): { valueMm: number; hasUnit: boolean } | null {
  if (!raw) return null;
  const match = raw.trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)\s*([a-z%]*)$/i);
  if (!match) return null;
  const val = Number(match[1]);
  if (!Number.isFinite(val)) return null;
  const unit = match[2].toLowerCase();
  switch (unit) {
    case '':
      return { valueMm: val, hasUnit: false };
    case 'mm':
      return { valueMm: val, hasUnit: true };
    case 'cm':
      return { valueMm: val * 10, hasUnit: true };
    case 'in':
      return { valueMm: val * 25.4, hasUnit: true };
    case 'pt':
      return { valueMm: (val * 25.4) / 72, hasUnit: true };
    case 'pc':
      return { valueMm: (val * 25.4) / 6, hasUnit: true };
    case 'px':
      return { valueMm: (val * 25.4) / 96, hasUnit: true };
    default:
      return null;
  }
}

function parseLengthUser(raw: string | undefined, fallback = 0): number {
  if (!raw) return fallback;
  const match = raw.trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?)/);
  if (!match) return fallback;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : fallback;
}

function parseDasharrayToLinetype(raw: string | undefined): Linetype | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed || trimmed === 'none') return null;
  const nums = parseNumberList(trimmed).filter((n) => n > 0);
  if (nums.length === 0) return null;
  const dash = nums[0];
  const gap = nums[1] ?? dash;
  if (dash <= 0.65 && dash <= gap * 0.75) return 'DOT';
  return 'DASHED';
}

interface InheritedStyle {
  stroke: string;
  strokeWidth: string;
  strokeDasharray: string;
  fill: string;
  opacity: number;
  display: string;
  visibility: string;
  fontSize: string;
  fontWeight: string;
  textAnchor: string;
  dominantBaseline: string;
  layerHint: string | null;
}

const DEFAULT_INHERITED_STYLE: InheritedStyle = {
  stroke: 'none',
  strokeWidth: '',
  strokeDasharray: '',
  fill: 'black',
  opacity: 1,
  display: '',
  visibility: '',
  fontSize: '12',
  fontWeight: 'normal',
  textAnchor: 'start',
  dominantBaseline: 'alphabetic',
  layerHint: null,
};

function parseInlineStyle(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;
  for (const decl of raw.split(';')) {
    const colon = decl.indexOf(':');
    if (colon <= 0) continue;
    const key = decl.slice(0, colon).trim().toLowerCase();
    const val = decl.slice(colon + 1).trim();
    if (key && val) map[key] = val;
  }
  return map;
}

function mergeStyle(parent: InheritedStyle, attrs: Record<string, string>): InheritedStyle {
  const css = parseInlineStyle(attrs.style);
  const pick = (name: string): string | undefined => css[name] ?? attrs[name];

  const strokeRaw = pick('stroke');
  const fillRaw = pick('fill');
  const opacityRaw = pick('opacity');
  const localOpacity = opacityRaw !== undefined ? Number.parseFloat(opacityRaw) : 1;
  const nextOpacity = Number.isFinite(localOpacity)
    ? parent.opacity * Math.max(0, Math.min(1, localOpacity))
    : parent.opacity;

  const layerAttr = attrs['data-layer'] || attrs.id;

  return {
    stroke: strokeRaw && strokeRaw !== 'inherit' ? strokeRaw : parent.stroke,
    strokeWidth: pick('stroke-width') ?? parent.strokeWidth,
    strokeDasharray: pick('stroke-dasharray') ?? parent.strokeDasharray,
    fill: fillRaw && fillRaw !== 'inherit' ? fillRaw : parent.fill,
    opacity: nextOpacity,
    display: pick('display') ?? parent.display,
    visibility: pick('visibility') ?? parent.visibility,
    fontSize: pick('font-size') ?? parent.fontSize,
    fontWeight: pick('font-weight') ?? parent.fontWeight,
    textAnchor: pick('text-anchor') ?? parent.textAnchor,
    dominantBaseline:
      pick('dominant-baseline') ?? pick('alignment-baseline') ?? parent.dominantBaseline,
    layerHint: layerAttr ? layerAttr.trim() : parent.layerHint,
  };
}

function isNonePaint(value: string | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  return !s || s === 'none' || s === 'transparent';
}

/* ================= SVG Path 解析与曲线自适应离散 ================= */

interface Subpath {
  points: Array<[number, number]>;
  closed: boolean;
}

const MAX_CURVE_DEPTH = 10;

function subdivideQuadratic(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  tol: number,
  out: Array<[number, number]>,
  depth = 0
): void {
  // 二次贝塞尔曲线到弦的最大距离严格 <= 控制点到弦中点距离的一半。
  const mx = (x0 + x2) * 0.5;
  const my = (y0 + y2) * 0.5;
  const err = Math.hypot(x1 - mx, y1 - my) * 0.5;
  if (depth >= MAX_CURVE_DEPTH || err <= tol) {
    out.push([x2, y2]);
    return;
  }
  const x01 = (x0 + x1) * 0.5;
  const y01 = (y0 + y1) * 0.5;
  const x12 = (x1 + x2) * 0.5;
  const y12 = (y1 + y2) * 0.5;
  const x012 = (x01 + x12) * 0.5;
  const y012 = (y01 + y12) * 0.5;
  subdivideQuadratic(x0, y0, x01, y01, x012, y012, tol, out, depth + 1);
  subdivideQuadratic(x012, y012, x12, y12, x2, y2, tol, out, depth + 1);
}

function subdivideCubic(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  tol: number,
  out: Array<[number, number]>,
  depth = 0
): void {
  // 控制点偏离三等分弦点的距离上界（对自交/闭环贝塞尔同样可靠）。
  const d1 = Math.hypot(3 * x1 - 2 * x0 - x3, 3 * y1 - 2 * y0 - y3) / 3;
  const d2 = Math.hypot(3 * x2 - x0 - 2 * x3, 3 * y2 - y0 - 2 * y3) / 3;
  if (depth >= MAX_CURVE_DEPTH || Math.max(d1, d2) * 0.75 <= tol) {
    out.push([x3, y3]);
    return;
  }
  const x01 = (x0 + x1) * 0.5;
  const y01 = (y0 + y1) * 0.5;
  const x12 = (x1 + x2) * 0.5;
  const y12 = (y1 + y2) * 0.5;
  const x23 = (x2 + x3) * 0.5;
  const y23 = (y2 + y3) * 0.5;
  const x012 = (x01 + x12) * 0.5;
  const y012 = (y01 + y12) * 0.5;
  const x123 = (x12 + x23) * 0.5;
  const y123 = (y12 + y23) * 0.5;
  const x0123 = (x012 + x123) * 0.5;
  const y0123 = (y012 + y123) * 0.5;
  subdivideCubic(x0, y0, x01, y01, x012, y012, x0123, y0123, tol, out, depth + 1);
  subdivideCubic(x0123, y0123, x123, y123, x23, y23, x3, y3, tol, out, depth + 1);
}

/** 按 W3C SVG 1.1 F.6.5 / F.6.6 把椭圆弧离散为点列。 */
function sampleEllipticalArc(
  x1: number,
  y1: number,
  rawRx: number,
  rawRy: number,
  xAxisRotDeg: number,
  largeArc: number,
  sweep: number,
  x2: number,
  y2: number,
  tol: number,
  out: Array<[number, number]>
): void {
  if (Math.hypot(x2 - x1, y2 - y1) <= 1e-9) return;
  let rx = Math.abs(rawRx);
  let ry = Math.abs(rawRy);
  if (rx <= 1e-9 || ry <= 1e-9) {
    out.push([x2, y2]);
    return;
  }

  const phi = (xAxisRotDeg * Math.PI) / 180;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx2 = (x1 - x2) * 0.5;
  const dy2 = (y1 - y2) * 0.5;
  const x1p = cosPhi * dx2 + sinPhi * dy2;
  const y1p = -sinPhi * dx2 + cosPhi * dy2;

  const rxSq0 = rx * rx;
  const rySq0 = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;
  const lambda = x1pSq / rxSq0 + y1pSq / rySq0;
  if (lambda > 1) {
    const scale = Math.sqrt(lambda);
    rx *= scale;
    ry *= scale;
  }

  const rxSq = rx * rx;
  const rySq = ry * ry;
  const denom = rxSq * y1pSq + rySq * x1pSq;
  const num = Math.max(0, rxSq * rySq - denom);
  const factor = (largeArc === sweep ? -1 : 1) * Math.sqrt(denom > 0 ? num / denom : 0);
  const cxp = factor * ((rx * y1p) / ry);
  const cyp = factor * (-(ry * x1p) / rx);

  const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) * 0.5;
  const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) * 0.5;

  const angleBetween = (ux: number, uy: number, vx: number, vy: number): number => {
    const dot = ux * vx + uy * vy;
    const len = Math.hypot(ux, uy) * Math.hypot(vx, vy);
    const cosVal = len > 0 ? Math.max(-1, Math.min(1, dot / len)) : 1;
    const sign = ux * vy - uy * vx < 0 ? -1 : 1;
    return sign * Math.acos(cosVal);
  };

  const ux = (x1p - cxp) / rx;
  const uy = (y1p - cyp) / ry;
  const vx = (-x1p - cxp) / rx;
  const vy = (-y1p - cyp) / ry;

  const theta1 = angleBetween(1, 0, ux, uy);
  let dTheta = angleBetween(ux, uy, vx, vy);
  if (sweep === 0 && dTheta > 0) dTheta -= Math.PI * 2;
  else if (sweep === 1 && dTheta < 0) dTheta += Math.PI * 2;

  const maxR = Math.max(rx, ry);
  const stepAngle =
    maxR > tol ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tol / maxR))) : Math.PI / 4;
  const safeStep = Number.isFinite(stepAngle) && stepAngle > 1e-4 ? stepAngle : Math.PI / 8;
  const steps = Math.max(2, Math.min(256, Math.ceil(Math.abs(dTheta) / safeStep)));

  for (let i = 1; i <= steps; i++) {
    const t = theta1 + (dTheta * i) / steps;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const px = cx + cosPhi * rx * cosT - sinPhi * ry * sinT;
    const py = cy + sinPhi * rx * cosT + cosPhi * ry * sinT;
    out.push([px, py]);
  }
}

/** 游标式 SVG Path `d` 属性解析器（完整兼容压缩标志位如 `a5,5 0 0110,10`）。 */
function parsePathData(d: string, tol: number): Subpath[] {
  const len = d.length;
  let pos = 0;

  const skipSep = (): void => {
    while (pos < len) {
      const c = d.charCodeAt(pos);
      if (c === 32 || c === 9 || c === 10 || c === 13 || c === 44) pos++;
      else break;
    }
  };

  const isCommandChar = (c: number): boolean =>
    (c >= 65 && c <= 90) || (c >= 97 && c <= 122);

  const hasNumberAhead = (): boolean => {
    skipSep();
    if (pos >= len) return false;
    const c = d.charCodeAt(pos);
    return (c >= 48 && c <= 57) || c === 43 || c === 45 || c === 46; // 0-9 + - .
  };

  const readNumber = (): number | null => {
    skipSep();
    if (pos >= len) return null;
    const start = pos;
    if (d[pos] === '+' || d[pos] === '-') pos++;
    let hasDigits = false;
    while (pos < len && d.charCodeAt(pos) >= 48 && d.charCodeAt(pos) <= 57) {
      hasDigits = true;
      pos++;
    }
    if (pos < len && d[pos] === '.') {
      pos++;
      while (pos < len && d.charCodeAt(pos) >= 48 && d.charCodeAt(pos) <= 57) {
        hasDigits = true;
        pos++;
      }
    }
    if (!hasDigits) {
      pos = start;
      return null;
    }
    if (pos < len && (d[pos] === 'e' || d[pos] === 'E')) {
      const expMark = pos;
      pos++;
      if (pos < len && (d[pos] === '+' || d[pos] === '-')) pos++;
      let expDigits = false;
      while (pos < len && d.charCodeAt(pos) >= 48 && d.charCodeAt(pos) <= 57) {
        expDigits = true;
        pos++;
      }
      if (!expDigits) pos = expMark;
    }
    const val = Number(d.slice(start, pos));
    return Number.isFinite(val) ? val : null;
  };

  const readFlag = (): number | null => {
    skipSep();
    if (pos >= len) return null;
    if (d[pos] === '0') {
      pos++;
      return 0;
    }
    if (d[pos] === '1') {
      pos++;
      return 1;
    }
    return null;
  };

  const subpaths: Subpath[] = [];
  let current: Subpath | null = null;
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;
  let prevCmd = '';
  let lastCtrlX = 0;
  let lastCtrlY = 0;
  let cmd = '';

  const startSubpath = (x: number, y: number): void => {
    current = { points: [[x, y]], closed: false };
    subpaths.push(current);
    cx = x;
    cy = y;
    startX = x;
    startY = y;
  };

  const ensureSubpath = (): Subpath => {
    if (!current) startSubpath(cx, cy);
    return current!;
  };

  while (pos < len) {
    skipSep();
    if (pos >= len) break;

    if (isCommandChar(d.charCodeAt(pos))) {
      cmd = d[pos++];
    } else if (!cmd) {
      break;
    }

    const isRel = cmd === cmd.toLowerCase();
    const upper = cmd.toUpperCase();

    if (upper === 'Z') {
      const active = current as Subpath | null;
      if (active) {
        active.closed = true;
        cx = startX;
        cy = startY;
      }
      prevCmd = upper;
      cmd = '';
      continue;
    }

    if (upper === 'M') {
      const nx = readNumber();
      const ny = readNumber();
      if (nx === null || ny === null) break;
      const tx = isRel ? cx + nx : nx;
      const ty = isRel ? cy + ny : ny;
      startSubpath(tx, ty);
      prevCmd = upper;
      // M/m 之后若紧跟更多坐标对，按 SVG 规范隐式转为 L/l。
      cmd = isRel ? 'l' : 'L';
      continue;
    }

    if (upper === 'L') {
      const nx = readNumber();
      const ny = readNumber();
      if (nx === null || ny === null) break;
      const tx = isRel ? cx + nx : nx;
      const ty = isRel ? cy + ny : ny;
      ensureSubpath().points.push([tx, ty]);
      cx = tx;
      cy = ty;
      prevCmd = upper;
    } else if (upper === 'H') {
      const nx = readNumber();
      if (nx === null) break;
      const tx = isRel ? cx + nx : nx;
      ensureSubpath().points.push([tx, cy]);
      cx = tx;
      prevCmd = upper;
    } else if (upper === 'V') {
      const ny = readNumber();
      if (ny === null) break;
      const ty = isRel ? cy + ny : ny;
      ensureSubpath().points.push([cx, ty]);
      cy = ty;
      prevCmd = upper;
    } else if (upper === 'C') {
      const x1 = readNumber();
      const y1 = readNumber();
      const x2 = readNumber();
      const y2 = readNumber();
      const x = readNumber();
      const y = readNumber();
      if (x1 === null || y1 === null || x2 === null || y2 === null || x === null || y === null) {
        break;
      }
      const ax1 = isRel ? cx + x1 : x1;
      const ay1 = isRel ? cy + y1 : y1;
      const ax2 = isRel ? cx + x2 : x2;
      const ay2 = isRel ? cy + y2 : y2;
      const ax = isRel ? cx + x : x;
      const ay = isRel ? cy + y : y;
      subdivideCubic(cx, cy, ax1, ay1, ax2, ay2, ax, ay, tol, ensureSubpath().points);
      lastCtrlX = ax2;
      lastCtrlY = ay2;
      cx = ax;
      cy = ay;
      prevCmd = upper;
    } else if (upper === 'S') {
      const x2 = readNumber();
      const y2 = readNumber();
      const x = readNumber();
      const y = readNumber();
      if (x2 === null || y2 === null || x === null || y === null) break;
      const ax1 = prevCmd === 'C' || prevCmd === 'S' ? 2 * cx - lastCtrlX : cx;
      const ay1 = prevCmd === 'C' || prevCmd === 'S' ? 2 * cy - lastCtrlY : cy;
      const ax2 = isRel ? cx + x2 : x2;
      const ay2 = isRel ? cy + y2 : y2;
      const ax = isRel ? cx + x : x;
      const ay = isRel ? cy + y : y;
      subdivideCubic(cx, cy, ax1, ay1, ax2, ay2, ax, ay, tol, ensureSubpath().points);
      lastCtrlX = ax2;
      lastCtrlY = ay2;
      cx = ax;
      cy = ay;
      prevCmd = upper;
    } else if (upper === 'Q') {
      const x1 = readNumber();
      const y1 = readNumber();
      const x = readNumber();
      const y = readNumber();
      if (x1 === null || y1 === null || x === null || y === null) break;
      const ax1 = isRel ? cx + x1 : x1;
      const ay1 = isRel ? cy + y1 : y1;
      const ax = isRel ? cx + x : x;
      const ay = isRel ? cy + y : y;
      subdivideQuadratic(cx, cy, ax1, ay1, ax, ay, tol, ensureSubpath().points);
      lastCtrlX = ax1;
      lastCtrlY = ay1;
      cx = ax;
      cy = ay;
      prevCmd = upper;
    } else if (upper === 'T') {
      const x = readNumber();
      const y = readNumber();
      if (x === null || y === null) break;
      const ax1 = prevCmd === 'Q' || prevCmd === 'T' ? 2 * cx - lastCtrlX : cx;
      const ay1 = prevCmd === 'Q' || prevCmd === 'T' ? 2 * cy - lastCtrlY : cy;
      const ax = isRel ? cx + x : x;
      const ay = isRel ? cy + y : y;
      subdivideQuadratic(cx, cy, ax1, ay1, ax, ay, tol, ensureSubpath().points);
      lastCtrlX = ax1;
      lastCtrlY = ay1;
      cx = ax;
      cy = ay;
      prevCmd = upper;
    } else if (upper === 'A') {
      const rx = readNumber();
      const ry = readNumber();
      const rot = readNumber();
      const largeArc = readFlag();
      const sweep = readFlag();
      const x = readNumber();
      const y = readNumber();
      if (
        rx === null ||
        ry === null ||
        rot === null ||
        largeArc === null ||
        sweep === null ||
        x === null ||
        y === null
      ) {
        break;
      }
      const ax = isRel ? cx + x : x;
      const ay = isRel ? cy + y : y;
      sampleEllipticalArc(
        cx,
        cy,
        rx,
        ry,
        rot,
        largeArc,
        sweep,
        ax,
        ay,
        tol,
        ensureSubpath().points
      );
      cx = ax;
      cy = ay;
      prevCmd = upper;
    } else {
      break;
    }

    if (!hasNumberAhead()) {
      cmd = '';
    }
  }

  return subpaths;
}

/* ================= 辅助几何与对齐映射 ================= */

function sampleEllipse(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  mat: Mat2D,
  tolWorld: number
): Array<[number, number]> {
  const worldScale = maxMatrixScale(mat);
  const maxR = Math.max(rx, ry) * worldScale;
  const stepAngle =
    maxR > tolWorld
      ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tolWorld / maxR)))
      : Math.PI / 6;
  const safeStep = Number.isFinite(stepAngle) && stepAngle > 1e-4 ? stepAngle : Math.PI / 12;
  const steps = Math.max(12, Math.min(256, Math.ceil((Math.PI * 2) / safeStep)));
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < steps; i++) {
    const theta = (Math.PI * 2 * i) / steps;
    const lx = cx + rx * Math.cos(theta);
    const ly = cy + ry * Math.sin(theta);
    pts.push(applyMat(mat, lx, ly));
  }
  return pts;
}

function sampleRoundedRect(
  x: number,
  y: number,
  w: number,
  h: number,
  rawRx: number,
  rawRy: number,
  tolLocal: number
): Array<[number, number]> {
  const rx = Math.min(w * 0.5, Math.max(0, rawRx));
  const ry = Math.min(h * 0.5, Math.max(0, rawRy));
  if (rx <= 1e-6 || ry <= 1e-6) {
    return [
      [x, y],
      [x + w, y],
      [x + w, y + h],
      [x, y + h],
    ];
  }

  const pts: Array<[number, number]> = [[x + rx, y]];
  pts.push([x + w - rx, y]);
  sampleEllipticalArc(x + w - rx, y, rx, ry, 0, 0, 1, x + w, y + ry, tolLocal, pts);
  pts.push([x + w, y + h - ry]);
  sampleEllipticalArc(x + w, y + h - ry, rx, ry, 0, 0, 1, x + w - rx, y + h, tolLocal, pts);
  pts.push([x + rx, y + h]);
  sampleEllipticalArc(x + rx, y + h, rx, ry, 0, 0, 1, x, y + h - ry, tolLocal, pts);
  pts.push([x, y + ry]);
  sampleEllipticalArc(x, y + ry, rx, ry, 0, 0, 1, x + rx, y, tolLocal, pts);
  return pts;
}

function dedupePolyline(points: Array<[number, number]>, closed: boolean): Point[] {
  const out: Point[] = [];
  for (const pt of points) {
    if (!Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
    const prev = out[out.length - 1];
    if (prev && Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) <= 1e-7) continue;
    out.push(pt);
  }
  if (closed && out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-7) {
      out.pop();
    }
  }
  return out;
}

function mapTextAnchor(raw: string): HAlign {
  const s = raw.trim().toLowerCase();
  if (s === 'middle') return 1;
  if (s === 'end') return 2;
  return 0;
}

function mapDominantBaseline(raw: string): VAlign {
  const s = raw.trim().toLowerCase();
  if (s === 'text-after-edge' || s === 'bottom' || s === 'ideographic') return 1;
  if (s === 'central' || s === 'middle') return 2;
  if (s === 'hanging' || s === 'text-before-edge' || s === 'top') return 3;
  return 0;
}

function isBoldWeight(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (s === 'bold' || s === 'bolder') return true;
  const n = Number.parseInt(s, 10);
  return Number.isFinite(n) && n >= 600;
}

function collectPlainText(node: XmlNode): string {
  let out = '';
  for (const child of node.children) {
    if (typeof child === 'string') out += child;
    else if (child.tag === 'tspan') out += collectPlainText(child);
  }
  return out;
}

/* ================= 主导入器 ================= */

/**
 * SVG 导入器：将 SVG 字符串转为 `DrawingDocument`。
 *
 * 支持 `line`、`rect`（含圆角）、`circle`、`ellipse`、`polyline`、`polygon`、
 * `path`（直线/贝塞尔曲线/椭圆弧）、`text`/`tspan` 与 `<defs>`/`<use>` 引用展开。
 */
export class SvgImporter {
  private readonly defaults: SvgImportOptions;

  constructor(options: SvgImportOptions = {}) {
    this.defaults = options;
  }

  /** 将 SVG 文本解析为 `DrawingDocument`。 */
  parse(svgText: string, options: SvgImportOptions = {}): DrawingDocument {
    return parseSvgToDocument(svgText, { ...this.defaults, ...options });
  }
}

/**
 * 将 SVG 文本解析并转换为 `DrawingDocument`。
 *
 * 参数：svgText 为完整 SVG XML 文本；options 为转换配置。
 * 返回：已填充图层、图元命令与自动计算图幅范围的 `DrawingDocument`。
 */
export function parseSvgToDocument(
  svgText: string,
  options: SvgImportOptions = {}
): DrawingDocument {
  const doc = new DrawingDocument();
  if (!svgText || typeof svgText !== 'string') return doc;

  const svgRoot = parseXmlRoot(svgText);
  if (!svgRoot) return doc;

  const yAxis: SvgYAxisMode = options.yAxis ?? 'flip-viewbox';
  const curveTolerance =
    Number.isFinite(options.curveTolerance) && (options.curveTolerance as number) > 0
      ? (options.curveTolerance as number)
      : 0.1;
  const layerBy: SvgLayerStrategy = options.layerBy ?? 'group-id';
  const defaultLayer = sanitizeLayerCandidate(options.defaultLayer, '0');
  const fillMode: SvgFillMode = options.fillMode ?? 'outline';
  const ignoreBackground = options.ignoreBackground ?? true;
  const fontSizeScale =
    Number.isFinite(options.fontSizeScale) && (options.fontSizeScale as number) > 0
      ? (options.fontSizeScale as number)
      : 1;
  const maxPrimitives =
    options.maxPrimitives === undefined
      ? 200_000
      : Number.isFinite(options.maxPrimitives) && options.maxPrimitives > 0
        ? Math.floor(options.maxPrimitives)
        : 0;

  // 1. 解析根 <svg> viewBox 与物理尺寸，计算用户坐标 → 世界 mm 的缩放比例
  const vbNums = svgRoot.attrs.viewbox ? parseNumberList(svgRoot.attrs.viewbox) : [];
  const hasViewBox = vbNums.length >= 4 && vbNums[2] > 0 && vbNums[3] > 0;
  const wLen = parseLengthMm(svgRoot.attrs.width);
  const hLen = parseLengthMm(svgRoot.attrs.height);

  const vbMinX = hasViewBox ? vbNums[0] : 0;
  const vbMinY = hasViewBox ? vbNums[1] : 0;
  const vbW = hasViewBox ? vbNums[2] : (wLen?.valueMm ?? 297);
  const vbH = hasViewBox ? vbNums[3] : (hLen?.valueMm ?? 210);

  let unitScale = 1;
  if (Number.isFinite(options.scale) && (options.scale as number) > 0) {
    unitScale = options.scale as number;
  } else if (hasViewBox && wLen?.hasUnit && vbW > 0) {
    unitScale = wLen.valueMm / vbW;
  } else if (hasViewBox && hLen?.hasUnit && vbH > 0) {
    unitScale = hLen.valueMm / vbH;
  } else if (!hasViewBox && (wLen?.hasUnit || hLen?.hasUnit)) {
    // 根元素没有 viewBox 但带单位：保持用户坐标默认 1:1
    unitScale = 1;
  }

  // 把 SVG 用户坐标 (sx, sy) 转换为世界坐标 (wx, wy)（mm，Y 向上）
  const toWorld = (sx: number, sy: number): [number, number] => {
    const wx = sx * unitScale;
    const wy =
      yAxis === 'negate' ? -sy * unitScale : (vbMinY + vbH - sy) * unitScale;
    return [wx, wy];
  };

  // 建立 id 索引表供 <use> 展开使用
  const idMap = new Map<string, XmlNode>();
  const indexIds = (node: XmlNode): void => {
    if (node.attrs.id) idMap.set(node.attrs.id, node);
    for (const child of node.children) {
      if (typeof child !== 'string') indexIds(child);
    }
  };
  indexIds(svgRoot);

  // 图层去重注册表（"0" 层由 DxfSerializer 固定输出，不重复调用 addLayer）
  const registeredLayers = new Set<string>(['0']);
  const ensureLayer = (name: string, color: number, linetype: Linetype): string => {
    const safeName = sanitizeLayerCandidate(name, defaultLayer);
    if (!registeredLayers.has(safeName)) {
      registeredLayers.add(safeName);
      doc.addLayer(safeName, color, linetype);
    }
    return safeName;
  };

  const resolveLayerAndStyle = (
    style: InheritedStyle,
    useFillFallback: boolean
  ): {
    layer: string;
    color: number;
    linetype: Linetype | null;
    lineWidth: number;
    hasStroke: boolean;
    solidFillColor: number | null;
  } | null => {
    if (style.display.trim().toLowerCase() === 'none') return null;
    if (style.visibility.trim().toLowerCase() === 'hidden') return null;
    if (style.opacity <= 0) return null;

    const hasStroke = !isNonePaint(style.stroke);
    const hasFill = !isNonePaint(style.fill);
    if (!hasStroke && (!useFillFallback || fillMode === 'ignore' || !hasFill)) {
      return null;
    }

    const colorStr = hasStroke ? style.stroke : style.fill;
    const color = colorToAci(colorStr);
    const solidFillColor =
      useFillFallback && fillMode === 'solid' && hasFill ? colorToAci(style.fill) : null;
    const linetype = hasStroke ? parseDasharrayToLinetype(style.strokeDasharray) : null;
    const rawSw = hasStroke && style.strokeWidth ? parseLengthUser(style.strokeWidth, 0) : 0;
    const lineWidth = Number.isFinite(rawSw) && rawSw > 0 ? rawSw * unitScale : 0;

    let layerName = defaultLayer;
    if (layerBy === 'group-id') {
      layerName = sanitizeLayerCandidate(style.layerHint, defaultLayer);
    } else if (layerBy === 'color') {
      layerName = `COLOR_${color}`;
    }
    const finalLayer = ensureLayer(layerName, color, linetype ?? 'CONTINUOUS');
    return { layer: finalLayer, color, linetype, lineWidth, hasStroke, solidFillColor };
  };

  let emittedCount = 0;
  const canEmit = (): boolean => maxPrimitives === 0 || emittedCount < maxPrimitives;

  const isBackgroundRect = (
    cornersSvg: ReadonlyArray<[number, number]>,
    style: InheritedStyle,
    hasRadius: boolean
  ): boolean => {
    if (!ignoreBackground || hasRadius) return false;
    if (!isNonePaint(style.stroke) || isNonePaint(style.fill)) return false;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const [px, py] of cornersSvg) {
      if (px < minX) minX = px;
      if (py < minY) minY = py;
      if (px > maxX) maxX = px;
      if (py > maxY) maxY = py;
    }
    const epsX = vbW * 0.01;
    const epsY = vbH * 0.01;
    return (
      minX <= vbMinX + epsX &&
      minY <= vbMinY + epsY &&
      maxX >= vbMinX + vbW - epsX &&
      maxY >= vbMinY + vbH - epsY
    );
  };

  const emitPolylineFromSvgPoints = (
    svgPoints: Array<[number, number]>,
    closed: boolean,
    resolved: {
      layer: string;
      color: number;
      linetype: Linetype | null;
      lineWidth: number;
      hasStroke: boolean;
      solidFillColor: number | null;
    }
  ): void => {
    if (!canEmit()) return;
    const worldPts = dedupePolyline(
      svgPoints.map(([px, py]) => toWorld(px, py)),
      closed
    );
    if (worldPts.length < 2) return;

    if (closed && resolved.solidFillColor !== null && worldPts.length >= 3) {
      const before = doc.commands.length;
      doc.addSolid(worldPts, resolved.layer, resolved.solidFillColor);
      emittedCount += doc.commands.length - before;
      if (!resolved.hasStroke) return;
      if (!canEmit()) return;
    }

    if (!closed && worldPts.length === 2 && resolved.lineWidth === 0) {
      doc.addLine(
        worldPts[0][0],
        worldPts[0][1],
        worldPts[1][0],
        worldPts[1][1],
        resolved.layer,
        resolved.color,
        resolved.linetype
      );
      emittedCount++;
      return;
    }
    doc.addPolyline(
      worldPts,
      resolved.layer,
      resolved.color,
      closed,
      resolved.lineWidth,
      resolved.linetype ? { linetype: resolved.linetype } : undefined
    );
    emittedCount++;
  };

  const emitTextNode = (node: XmlNode, style: InheritedStyle, mat: Mat2D): void => {
    if (!canEmit()) return;
    if (style.display.trim().toLowerCase() === 'none') return;
    if (style.visibility.trim().toLowerCase() === 'hidden') return;
    if (style.opacity <= 0) return;

    const rawText = collectPlainText(node);
    if (!rawText.trim()) return;

    // 文本优先用 fill 颜色，缺失则用 stroke
    const paintStr = !isNonePaint(style.fill)
      ? style.fill
      : !isNonePaint(style.stroke)
        ? style.stroke
        : '';
    const color = colorToAci(paintStr);

    let layerName = defaultLayer;
    if (layerBy === 'group-id') {
      layerName = sanitizeLayerCandidate(style.layerHint, defaultLayer);
    } else if (layerBy === 'color') {
      layerName = `COLOR_${color}`;
    }
    const layer = ensureLayer(layerName, color, 'CONTINUOUS');

    const localX = parseLengthUser(node.attrs.x, 0);
    const localY = parseLengthUser(node.attrs.y, 0);
    const [svgX, svgY] = applyMat(mat, localX, localY);
    const [wx, wy] = toWorld(svgX, svgY);

    const scaleX = Math.hypot(mat[0], mat[1]);
    const scaleY = Math.hypot(mat[2], mat[3]);
    const safeScaleY = Number.isFinite(scaleY) && scaleY > 1e-6 ? scaleY : 1;
    const widthFactor =
      Number.isFinite(scaleX) && scaleX > 1e-6 ? scaleX / safeScaleY : 0.85;

    const rawFontSize = parseLengthUser(style.fontSize, 3.5);
    const h = rawFontSize * safeScaleY * unitScale * fontSizeScale;
    if (!Number.isFinite(h) || h <= 0) return;

    // SVG 旋转角为顺时针，转换到 Y 轴向上的 CAD 世界坐标系后取反。
    const rawRot = (-Math.atan2(mat[1], mat[0]) * 180) / Math.PI;
    const rot = Math.abs(rawRot) < 1e-6 ? 0 : rawRot;

    const hAlign = mapTextAnchor(style.textAnchor);
    const vAlign = mapDominantBaseline(style.dominantBaseline);
    const bold = isBoldWeight(style.fontWeight);

    doc.addText(
      wx,
      wy,
      h,
      rawText,
      layer,
      color,
      rot,
      hAlign,
      vAlign,
      widthFactor,
      bold ? { bold: true } : undefined
    );
    emittedCount++;
  };

  const walk = (
    node: XmlNode,
    parentStyle: InheritedStyle,
    parentMat: Mat2D,
    useDepth = 0
  ): void => {
    if (!canEmit()) return;
    if (NON_DRAWING_TAGS.has(node.tag)) return;

    const style = mergeStyle(parentStyle, node.attrs);
    if (style.display.trim().toLowerCase() === 'none') return;

    const localMat = parseTransform(node.attrs.transform);
    const mat = mulMat(parentMat, localMat);

    switch (node.tag) {
      case 'svg':
      case 'g':
      case 'a': {
        for (const child of node.children) {
          if (typeof child !== 'string') walk(child, style, mat, useDepth);
        }
        break;
      }
      case 'use': {
        if (useDepth >= 16) break;
        const href = (node.attrs.href ?? node.attrs['xlink:href'] ?? '').trim();
        if (!href.startsWith('#')) break;
        const target = idMap.get(href.slice(1));
        if (!target) break;
        const ux = parseLengthUser(node.attrs.x, 0);
        const uy = parseLengthUser(node.attrs.y, 0);
        const useMat =
          ux !== 0 || uy !== 0 ? mulMat(mat, [1, 0, 0, 1, ux, uy]) : mat;
        walk(target, style, useMat, useDepth + 1);
        break;
      }
      case 'line': {
        const resolved = resolveLayerAndStyle(style, false);
        if (!resolved || !canEmit()) break;
        const x1 = parseLengthUser(node.attrs.x1, 0);
        const y1 = parseLengthUser(node.attrs.y1, 0);
        const x2 = parseLengthUser(node.attrs.x2, 0);
        const y2 = parseLengthUser(node.attrs.y2, 0);
        const p1 = toWorld(...applyMat(mat, x1, y1));
        const p2 = toWorld(...applyMat(mat, x2, y2));
        doc.addLine(
          p1[0],
          p1[1],
          p2[0],
          p2[1],
          resolved.layer,
          resolved.color,
          resolved.linetype
        );
        emittedCount++;
        break;
      }
      case 'rect': {
        const x = parseLengthUser(node.attrs.x, 0);
        const y = parseLengthUser(node.attrs.y, 0);
        const w = parseLengthUser(node.attrs.width, 0);
        const h = parseLengthUser(node.attrs.height, 0);
        if (w <= 0 || h <= 0) break;

        const rxAttr = node.attrs.rx !== undefined ? parseLengthUser(node.attrs.rx, 0) : null;
        const ryAttr = node.attrs.ry !== undefined ? parseLengthUser(node.attrs.ry, 0) : null;
        const rx = rxAttr ?? ryAttr ?? 0;
        const ry = ryAttr ?? rxAttr ?? 0;
        const hasRadius = rx > 1e-6 && ry > 1e-6;

        const rawCorners: Array<[number, number]> = [
          applyMat(mat, x, y),
          applyMat(mat, x + w, y),
          applyMat(mat, x + w, y + h),
          applyMat(mat, x, y + h),
        ];
        if (isBackgroundRect(rawCorners, style, hasRadius)) break;

        const resolved = resolveLayerAndStyle(style, true);
        if (!resolved) break;

        if (hasRadius) {
          const localTol = curveTolerance / (maxMatrixScale(mat) * unitScale);
          const localPts = sampleRoundedRect(x, y, w, h, rx, ry, localTol);
          const svgPts = localPts.map(([px, py]) => applyMat(mat, px, py));
          emitPolylineFromSvgPoints(svgPts, true, resolved);
        } else {
          emitPolylineFromSvgPoints(rawCorners, true, resolved);
        }
        break;
      }
      case 'circle': {
        const resolved = resolveLayerAndStyle(style, true);
        if (!resolved || !canEmit()) break;
        const cx = parseLengthUser(node.attrs.cx, 0);
        const cy = parseLengthUser(node.attrs.cy, 0);
        const r = parseLengthUser(node.attrs.r, 0);
        if (r <= 0) break;

        if (resolved.solidFillColor !== null) {
          const fillPts = sampleEllipse(cx, cy, r, r, mat, curveTolerance / unitScale);
          const worldPts = dedupePolyline(
            fillPts.map(([px, py]) => toWorld(px, py)),
            true
          );
          if (worldPts.length >= 3) {
            const before = doc.commands.length;
            doc.addSolid(worldPts, resolved.layer, resolved.solidFillColor);
            emittedCount += doc.commands.length - before;
          }
          if (!resolved.hasStroke || !canEmit()) break;
        }

        const uniformScale = uniformScaleIfSimilar(mat);
        if (uniformScale !== null) {
          const [scx, scy] = applyMat(mat, cx, cy);
          const [wcx, wcy] = toWorld(scx, scy);
          doc.addCircle(
            wcx,
            wcy,
            r * uniformScale * unitScale,
            resolved.layer,
            resolved.color,
            resolved.linetype
          );
          emittedCount++;
        } else {
          const svgPts = sampleEllipse(cx, cy, r, r, mat, curveTolerance / unitScale);
          emitPolylineFromSvgPoints(svgPts, true, { ...resolved, solidFillColor: null });
        }
        break;
      }
      case 'ellipse': {
        const resolved = resolveLayerAndStyle(style, true);
        if (!resolved) break;
        const cx = parseLengthUser(node.attrs.cx, 0);
        const cy = parseLengthUser(node.attrs.cy, 0);
        const rx = parseLengthUser(node.attrs.rx, 0);
        const ry = parseLengthUser(node.attrs.ry, 0);
        if (rx <= 0 || ry <= 0) break;
        const svgPts = sampleEllipse(cx, cy, rx, ry, mat, curveTolerance / unitScale);
        emitPolylineFromSvgPoints(svgPts, true, resolved);
        break;
      }
      case 'polyline':
      case 'polygon': {
        const resolved = resolveLayerAndStyle(style, true);
        if (!resolved) break;
        const nums = parseNumberList(node.attrs.points ?? '');
        if (nums.length < 4) break;
        const svgPts: Array<[number, number]> = [];
        for (let i = 0; i + 1 < nums.length; i += 2) {
          svgPts.push(applyMat(mat, nums[i], nums[i + 1]));
        }
        emitPolylineFromSvgPoints(svgPts, node.tag === 'polygon', resolved);
        break;
      }
      case 'path': {
        const resolved = resolveLayerAndStyle(style, true);
        if (!resolved) break;
        const d = node.attrs.d;
        if (!d) break;
        const localTol = curveTolerance / (maxMatrixScale(mat) * unitScale);
        const subpaths = parsePathData(d, localTol);
        for (const sp of subpaths) {
          if (sp.points.length < 2) continue;
          const svgPts = sp.points.map(([px, py]) => applyMat(mat, px, py));
          emitPolylineFromSvgPoints(svgPts, sp.closed, resolved);
        }
        break;
      }
      case 'text': {
        // 若存在带独立 x/y 定位的子 <tspan>，按子段输出；否则作为整体文本输出
        const positionedTspans = node.children.filter(
          (child): child is XmlNode =>
            typeof child !== 'string' &&
            child.tag === 'tspan' &&
            (child.attrs.x !== undefined || child.attrs.y !== undefined)
        );
        if (positionedTspans.length > 0) {
          for (const span of positionedTspans) {
            const spanStyle = mergeStyle(style, span.attrs);
            const spanMat = mulMat(mat, parseTransform(span.attrs.transform));
            const mergedNode: XmlNode = {
              tag: 'text',
              attrs: {
                ...node.attrs,
                ...span.attrs,
              },
              children: span.children,
            };
            emitTextNode(mergedNode, spanStyle, spanMat);
          }
        } else {
          emitTextNode(node, style, mat);
        }
        break;
      }
      default:
        break;
    }
  };

  walk(svgRoot, DEFAULT_INHERITED_STYLE, IDENTITY_MAT);

  // 根据生成图元自动计算图纸包围盒 extents；空图时按 viewBox 兜底。
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const cmd of doc.commands) {
    switch (cmd.type) {
      case 'line':
        include(cmd.x1, cmd.y1);
        include(cmd.x2, cmd.y2);
        break;
      case 'circle':
        include(cmd.cx - cmd.r, cmd.cy - cmd.r);
        include(cmd.cx + cmd.r, cmd.cy + cmd.r);
        break;
      case 'polyline':
        for (const [px, py] of cmd.points) include(px, py);
        break;
      case 'text':
        include(cmd.x, cmd.y);
        break;
      case 'solid':
        for (const [px, py] of cmd.points) include(px, py);
        break;
    }
  }

  if (Number.isFinite(minX) && Number.isFinite(minY)) {
    // 防止单点/共线导致零宽或零高 extents
    if (maxX === minX) maxX = minX + 1;
    if (maxY === minY) maxY = minY + 1;
    doc.setExtents(minX, minY, maxX, maxY);
  } else if (hasViewBox) {
    const [wx1, wy1] = toWorld(vbMinX, vbMinY + vbH);
    const [wx2, wy2] = toWorld(vbMinX + vbW, vbMinY);
    doc.setExtents(
      Math.min(wx1, wx2),
      Math.min(wy1, wy2),
      Math.max(wx1, wx2),
      Math.max(wy1, wy2)
    );
  }

  return doc;
}

```

## src\svg\serializer.ts
```ts
/**
 * SVG 输出端：把 `DocumentData` 快照序列化为 SVG 文本。
 *
 * 世界坐标（mm，Y 向上）在 SVG 里对 Y 取反（y → -y）——这与 Canvas 相机采用
 * 的约定相同，正是它让两个引擎能共享 1:1 的 viewBox。X 保持不变。
 *
 * 本文件是纯计算、环境无关的，可复用这里的样式解析链（core 层）来保证与
 * DXF/Canvas 视觉一致：resolveCommandStyle → theme.resolveAci → fmtNumber →
 * isPaperCommand/isBoldText。
 */

import { isBoldText, isPaperCommand, type DecorationOptions } from '../core/decorations';
import { resolveDocumentData, type DocumentLike } from '../core/data';
import { fmtNumber as fmt } from '../core/format';
import { createLayerLookup, resolveCommandStyle } from '../core/style';
import { DEFAULT_TEXT_METRICS, type TextMetricsPolicy } from '../core/text';
import { resolveTheme, type ThemeInput } from '../core/theme';
import type { ViewBox } from '../core/types';
import { escapeXml } from '../core/xml';

/** SVG 序列化选项。 */
export interface SvgSerializeOptions {
  /** 'dark' | 'light' | RenderTheme，默认 'dark'。 */
  theme?: ThemeInput;
  /** 'live' 嵌入页面；'export' 会加 xml 声明与 mm 尺寸。 */
  mode?: 'live' | 'export';
  /** 覆盖计算出的 viewBox（用于与 Canvas 相机同步）。 */
  viewBox?: ViewBox | null;
  /** live 根节点 id，默认 'liveSvgElement'；传 null 则省略。 */
  rootId?: string | null;
  /** 世界坐标留白（mm），默认 12。 */
  paddingMm?: number;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  /** 覆盖本次渲染的主题背景色。 */
  backgroundColor?: string;
  /** 默认 export 模式为 true、live 模式为 false。 */
  includeXmlDeclaration?: boolean;
  /**
   * 在文本上输出 `xml:space="preserve"`，保留连续空格（SVG 默认会折叠空格，
   * 与 DXF/Canvas 不同）。默认 true。
   */
  preserveWhitespace?: boolean;
}

/**
 * 把快照序列化为 SVG 字符串。
 *
 * 要点：先算好 viewBox 与背景矩形，再逐命令输出四类图元。
 * 【勿改·坐标符号】所有 y 坐标取负（fmt(-y)），旋转取负（rotate(-rot)），
 * 这是与 Canvas 相机配对的约定，单独翻转会破坏双视图 1:1 对齐。
 * 【勿改·历史兼容】字号用 svgSizeFactor（1.04），与 Canvas 的 1.05 刻意不同。
 */
export class SvgSerializer {
  /**
   * 序列化主流程。
   * 参数：doc 文档（快照或 builder），options 序列化选项。
   * 返回：完整 SVG 文本字符串。
   */
  serialize(doc: DocumentLike, options: SvgSerializeOptions = {}): string {
    const data = resolveDocumentData(doc);
    const theme = resolveTheme(options.theme);
    const mode = options.mode ?? 'live';
    const forExport = mode === 'export';
    const text = { ...DEFAULT_TEXT_METRICS, ...options.text };
    const pad = options.paddingMm ?? 12;
    const layerLookup = createLayerLookup(data.layers);
    const preserveWhitespace = options.preserveWhitespace ?? true;

    const ext = data.extents;
    const minX = ext.minX - pad;
    const maxX = ext.maxX + pad;
    // SVG 的 Y 与世界的 Y 相反：世界最大 Y 对应 SVG 最小 Y。
    const minSvgY = -ext.maxY - pad;
    const maxSvgY = -ext.minY + pad;
    const fullW = maxX - minX;
    const fullH = maxSvgY - minSvgY;

    // 若有外部传入的 viewBox（来自 Canvas 相机）就用它，否则按图幅+留白计算。
    const viewBox = options.viewBox
      ? `${fmt(options.viewBox.x)} ${fmt(options.viewBox.y)} ${fmt(options.viewBox.w)} ${fmt(
          options.viewBox.h
        )}`
      : `${fmt(minX)} ${fmt(minSvgY)} ${fmt(fullW)} ${fmt(fullH)}`;

    const out: string[] = [];

    if (options.includeXmlDeclaration ?? forExport) {
      out.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
    }

    // export 模式：加 mm 物理尺寸；live 模式：加 id 与 preserveAspectRatio。
    if (forExport) {
      out.push(
        `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${fmt(fullW)}mm" height="${fmt(
          fullH
        )}mm" viewBox="${viewBox}">`
      );
    } else {
      const rootId = options.rootId === undefined ? 'liveSvgElement' : options.rootId;
      const idAttr = rootId ? ` id="${escapeXml(rootId)}"` : '';
      out.push(
        `<svg xmlns="http://www.w3.org/2000/svg"${idAttr} viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">`
      );
    }

    const bgFill = escapeXml(options.backgroundColor ?? theme.backgroundFor(mode));
    const effectiveViewBox = options.viewBox ?? { x: minX, y: minSvgY, w: fullW, h: fullH };
    // export 模式：背景矩形精确贴合 viewBox，否则矢量编辑器会看到一块巨大的画布外矩形；
    // live 模式：留出充裕余量（超大图纸按比例放大），保证平移时不会露出硬边。
    const liveMargin = Math.max(5000, fullW * 2, fullH * 2);
    const bg = forExport
      ? effectiveViewBox
      : {
          x: minX - liveMargin,
          y: minSvgY - liveMargin,
          w: fullW + liveMargin * 2,
          h: fullH + liveMargin * 2,
        };
    out.push(
      `<rect x="${fmt(bg.x)}" y="${fmt(bg.y)}" width="${fmt(bg.w)}" height="${fmt(
        bg.h
      )}" fill="${bgFill}"/>`
    );

    // 浅色主题：先用纸张色填充每个图框，再在其上绘制内容。
    if (!theme.isDark) {
      for (const cmd of data.commands) {
        if (!isPaperCommand(cmd, options.decorations)) continue;
        // 用 polygon 而非 min/max 矩形：能处理反向角点、顺时针点序和旋转的图框。
        const points = cmd.points.map(([px, py]) => `${fmt(px)},${fmt(-py)}`).join(' ');
        out.push(`<polygon points="${points}" fill="${escapeXml(theme.paper)}"/>`);
      }
    }

    out.push(`<g stroke-linecap="round" stroke-linejoin="round">`);

    for (const cmd of data.commands) {
      // 复用 core 的调用链解析样式：随层颜色 → ACI → hex、线型 dash、装饰判定。
      const style = resolveCommandStyle(cmd, layerLookup);
      const color = escapeXml(theme.resolveAci(style.color));

      let dashAttr = '';
      if (style.linetype === 'DASHED') dashAttr = ` stroke-dasharray="1.3,0.9"`;
      else if (style.linetype === 'DOT') dashAttr = ` stroke-dasharray="0.4,0.7"`;

      switch (cmd.type) {
        case 'line': {
          // 非有限坐标直接跳过，避免输出 NaN coordinate 破坏 SVG。
          if (
            !Number.isFinite(cmd.x1) ||
            !Number.isFinite(cmd.y1) ||
            !Number.isFinite(cmd.x2) ||
            !Number.isFinite(cmd.y2)
          ) {
            break;
          }
          // ACI 8 用更细的线宽。
          const sw = style.color === 8 ? 0.16 : 0.24;
          out.push(
            `<line x1="${fmt(cmd.x1)}" y1="${fmt(-cmd.y1)}" x2="${fmt(cmd.x2)}" y2="${fmt(
              -cmd.y2
            )}" stroke="${color}" stroke-width="${sw}"${dashAttr}/>`
          );
          break;
        }
        case 'circle': {
          if (
            !Number.isFinite(cmd.cx) ||
            !Number.isFinite(cmd.cy) ||
            !Number.isFinite(cmd.r) ||
            cmd.r <= 0
          ) {
            break;
          }
          out.push(
            `<circle cx="${fmt(cmd.cx)}" cy="${fmt(-cmd.cy)}" r="${fmt(
              cmd.r
            )}" fill="none" stroke="${color}" stroke-width="0.16"${dashAttr}/>`
          );
          break;
        }
        case 'polyline': {
          if (cmd.points.length < 2) break;
          const sw = cmd.lineWidth > 0 ? cmd.lineWidth : 0.24;
          const pts = cmd.points.map(([px, py]) => `${fmt(px)},${fmt(-py)}`).join(' ');
          if (cmd.closed) {
            out.push(
              `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="${fmt(
                sw
              )}"${dashAttr}/>`
            );
          } else {
            out.push(
              `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${fmt(
                sw
              )}"${dashAttr}/>`
            );
          }
          break;
        }
        case 'text': {
          if (
            !Number.isFinite(cmd.x) ||
            !Number.isFinite(cmd.y) ||
            !Number.isFinite(cmd.h) ||
            cmd.h <= 0
          ) {
            break;
          }
          // 组码 72/73 的枚举映射到 SVG 的 text-anchor / dominant-baseline。
          const anchor = cmd.hAlign === 1 ? 'middle' : cmd.hAlign === 2 ? 'end' : 'start';
          const baseline =
            cmd.vAlign === 1
              ? 'text-after-edge'
              : cmd.vAlign === 2
                ? 'central'
                : cmd.vAlign === 3
                  ? 'hanging'
                  : 'alphabetic';
          const fontWeight = isBoldText(cmd, options.decorations) ? 'bold' : 'normal';
          const wf =
            Number.isFinite(cmd.widthFactor) && cmd.widthFactor > 0
              ? cmd.widthFactor
              : text.defaultWidthFactor;
          // 【勿改·历史兼容】字号系数 1.04（svgSizeFactor），勿与 Canvas 统一。
          const fontSize = fmt(cmd.h * text.svgSizeFactor);

          // 先平移到插入点（Y 取负）；旋转取负因为 SVG 的 Y 轴向下；再按宽度系数横向缩放。
          let transform = `translate(${fmt(cmd.x)},${fmt(-cmd.y)})`;
          if (cmd.rot) transform += ` rotate(${fmt(-cmd.rot)})`;
          if (wf !== 1) transform += ` scale(${fmt(wf)},1)`;

          out.push(
            `<text transform="${transform}" fill="${color}" font-family="${escapeXml(
              text.svgFontFamily
            )}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="${baseline}"${
              preserveWhitespace ? ' xml:space="preserve"' : ''
            }>${escapeXml(cmd.text)}</text>`
          );
          break;
        }
        case 'solid': {
          if (
            cmd.points.length < 3 ||
            !cmd.points.every(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
          ) {
            break;
          }
          const pts = cmd.points.map(([px, py]) => `${fmt(px)},${fmt(-py)}`).join(' ');
          out.push(`<polygon points="${pts}" fill="${color}" stroke="none"/>`);
          break;
        }
      }
    }

    out.push(`</g>`);
    out.push(`</svg>`);
    return out.join('\n');
  }
}

/** 静态便捷出口：环境无关。 */
export class SvgExporter {
  /** 直接把文档序列化为 SVG 文本。 */
  static toText(doc: DocumentLike, options: SvgSerializeOptions = {}): string {
    return new SvgSerializer().serialize(doc, options);
  }
}

```

## src\dxf-to-svg.ts
```ts
/**
 * 一步式 DXF → SVG 转换便捷入口。
 *
 * 位于顶层组合 `dxf/parser` 与 `svg/serializer`，避免 `dxf` 与 `svg` 子模块
 * 之间产生交叉依赖。通过主入口与全局 IIFE 构建暴露。
 */

import { EXTENDED_DARK_THEME, EXTENDED_LIGHT_THEME } from './core/theme';
import { parseDxfToDocument, type DxfImportOptions } from './dxf/parser';
import { SvgSerializer, type SvgSerializeOptions } from './svg/serializer';

/** DXF 一步转 SVG 选项：合并 DXF 解析选项与 SVG 序列化选项。 */
export interface DxfToSvgOptions extends DxfImportOptions, SvgSerializeOptions {}

/**
 * 将 ASCII DXF（文本 / `Uint8Array` / `ArrayBuffer`）一步转换为纯矢量 SVG 文本。
 *
 * 默认使用 `mode: 'export'` 与 `EXTENDED_LIGHT_THEME`（白底打印 + 扩展 ACI 调色板），
 * 如指定 `mode: 'live'` 且未传 `theme` 则默认使用 `EXTENDED_DARK_THEME`。
 */
export function dxfToSvgText(
  input: string | Uint8Array | ArrayBuffer,
  options: DxfToSvgOptions = {}
): string {
  const {
    encoding,
    space,
    curveTolerance,
    includeHiddenLayers,
    includeUnsupportedWarnings,
    maxPrimitives,
    maxBlockDepth,
    theme,
    mode = 'export',
    viewBox,
    rootId,
    paddingMm,
    decorations,
    text,
    backgroundColor,
    includeXmlDeclaration,
    preserveWhitespace,
  } = options;

  const doc = parseDxfToDocument(input, {
    encoding,
    space,
    curveTolerance,
    includeHiddenLayers,
    includeUnsupportedWarnings,
    maxPrimitives,
    maxBlockDepth,
  });

  const resolvedTheme =
    theme ?? (mode === 'live' ? EXTENDED_DARK_THEME : EXTENDED_LIGHT_THEME);

  return new SvgSerializer().serialize(doc, {
    theme: resolvedTheme,
    mode,
    viewBox,
    rootId,
    paddingMm,
    decorations,
    text,
    backgroundColor,
    includeXmlDeclaration,
    preserveWhitespace,
  });
}

```

## src\global.ts
```ts
/**
 * IIFE 打包入口：经典 `<script>` 标签直接引入时，把全量 API 挂到
 * `window.VecBridge` 上。
 *
 * 与主入口 `index.ts` 的区别：这里额外导出了 `render`（双引擎预览交互）、
 * `browser`（文件下载）和 `dom`（HTML DOM 布局提取）三层——它们依赖 DOM，
 * 只有在浏览器环境下才有意义。构建时由 tsup 打成单文件 IIFE，全局名 `VecBridge`。
 */
export * from './index'; // 环境无关主入口的全部 API（core/encoding/dxf/svg/patterns）
export * from './render'; // 浏览器渲染与交互层：相机、视口、Canvas/SVG 渲染、双视图门面
export * from './browser'; // 浏览器平台适配：把字节/文本触发为文件下载
export * from './dom'; // 浏览器 HTML DOM 转换层：domToDocument / domToSvg / domToDxf

```

## src\index.ts
```ts
/**
 * `vecbridge` 的环境无关入口（主入口）。
 *
 * 这里导出的全部是纯计算 API，可在 Node 中安全导入：包括 IR 数据模型与
 * 策略（core）、文本编解码（encoding）、DXF/SVG 双向转换（dxf/svg）、
 * Canvas 2D 无头录制（canvas）及填充图案（patterns）。依赖 DOM 的 API
 * 隔离在 `vecbridge/render`、`vecbridge/browser` 与 `vecbridge/dom` 子入口。
 *
 * 这是"单一事实源 IR"架构的门面：使用者先用 core 的 `DrawingDocument`
 * 累积图元命令，再把同一份数据交给 DXF 或 SVG 输出端，天然保证三端一致。
 */
export * from './core'; // 核心数据模型层：IR 类型、DrawingDocument、主题与文本策略、样式工具
export * from './encoding'; // 文本编解码层：UTF-8/GBK 双向编解码与编码自动探测
export * from './dxf'; // DXF R12 序列化、校验与 ASCII DXF 解析导入
export * from './svg'; // SVG 序列化（live/export 双模式）与 SVG 导入解析
export * from './patterns'; // 填充图案组合助手：drawHatch 及内置图案
export * from './canvas'; // Canvas 2D 矢量录制与双写代理（Canvas API → IR / DXF / SVG）
export * from './svg-to-dxf'; // 一步式 SVG → DXF 转换便捷入口
export * from './dxf-to-svg'; // 一步式 DXF → SVG 转换便捷入口

```

## src\svg-to-dxf.ts
```ts
/**
 * 一步式 SVG → DXF 转换便捷入口。
 *
 * 位于顶层组合 `svg/parser` 与 `dxf/serializer`，避免 `svg` 与 `dxf` 两个子模块
 * 之间产生交叉依赖。通过 `dxf-ink` 主入口与全局 IIFE 构建暴露。
 */

import { DxfSerializer, type DxfSerializeOptions } from './dxf/serializer';
import type { TextCodec } from './encoding';
import { parseSvgToDocument, type SvgImportOptions } from './svg/parser';

/** SVG 一步转 DXF 选项：合并 SVG 解析选项与 DXF 序列化选项。 */
export interface SvgToDxfOptions extends SvgImportOptions, DxfSerializeOptions {
  /** 可选自定义编解码器（如监听 GBK 表外字符转义）。 */
  codec?: TextCodec;
}

/** 将 SVG 字符串直接转换为 DXF R12 文本。 */
export function svgToDxfText(svgText: string, options: SvgToDxfOptions = {}): string {
  const {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
    codec,
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  } = options;

  const doc = parseSvgToDocument(svgText, {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
  });

  return new DxfSerializer({ codec }).serialize(doc, {
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  });
}

/** 将 SVG 字符串直接转换为编码后的 DXF R12 字节流（默认 GBK）。 */
export function svgToDxfBytes(svgText: string, options: SvgToDxfOptions = {}): Uint8Array {
  const {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
    codec,
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  } = options;

  const doc = parseSvgToDocument(svgText, {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
  });

  return new DxfSerializer({ codec }).toBytes(doc, {
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  });
}

```

## test\helpers\sheet-layout.ts
```ts
/**
 * Reference A4 sheet layout built entirely with the public API.
 *
 * This is NOT part of the library — it exercises `DrawingDocument` + `drawHatch`
 * with a realistic, moderately complex drawing so golden tests can lock the
 * serialized output of every supported backend.
 */
import { DrawingDocument, type HatchPattern, type Linetype, type HAlign } from '../../src/index';
import { drawHatch } from '../../src/patterns/hatch';

export interface SeriesData {
  depth: number[];
  a: number[];
  b: number[];
  c: number[];
  aIndex: number[];
  bIndex: number[];
}

export interface BandItem {
  typeId: number;
  name: string;
  pattern: HatchPattern;
  from: number;
  to: number;
  length: number;
  avgA: number;
  avgB: number;
  note: string;
  code: string;
  index: number;
}

export interface SheetItem {
  sheetNo: string;
  elevation: string;
  recordDate: string;
  data: SeriesData;
  bands: BandItem[];
}

export interface SheetConfig {
  projectName: string;
  projectCode: string;
  stage: string;
  recordDate: string;
  drawingNo: string;
  layoutMode: 'grid' | 'horizontal' | 'vertical';
  gridCols: number;
  sheetGap: number;
  company: string;
  certNo: string;
  leaderName: string;
  approverName: string;
  auditorName: string;
  checkerName: string;
  draftsmanName: string;
  depthScale: number;
  unitA: number;
  minBandLength: number;
  smoothWindow: number;
  showA: boolean;
  showB: boolean;
  showC: boolean;
  showGrid: boolean;
}

const CIRCLED_NUMS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
];

export function getCircledNum(idx: number): string {
  return CIRCLED_NUMS[idx] || `(${idx + 1})`;
}

export function getAutoDrawingNo(baseStr: string, index: number, total: number): string {
  if (total <= 1) return baseStr;
  const m = baseStr.match(/^(.*?)(\d+)$/);
  if (m) {
    const prefix = m[1];
    const startNum = parseInt(m[2], 10);
    return `${prefix}${startNum + index}`;
  }
  return `${baseStr}-${index + 1}`;
}

export function niceStep(v: number): number {
  if (!(v > 0)) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const f = v / base;
  let nf: number;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 2.5) nf = 2.5;
  else if (f <= 4) nf = 4;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * base;
}

interface CurveDef {
  key: 'a' | 'b' | 'c';
  title: string;
  unit: string;
  layer: string;
  color: number;
}

/** Draw one A4 sheet (297 x 210 mm) into the document at the given offset. */
export function drawSingleA4Sheet(
  dwg: DrawingDocument,
  ox: number,
  oy: number,
  sheetItem: SheetItem,
  config: SheetConfig,
  pageIndex: number,
  totalPages: number
): void {
  dwg.setOffset(ox, oy);
  const data = sheetItem.data;
  const bands = sheetItem.bands;

  const W = 297;
  const H = 210;
  const L = 20;
  const R = 289;
  const T = 202;
  const B = 8;

  const yTitleBot = 191.5;
  const yMetaBot = 183.5;
  const yHeaderMid = 175.0;
  const yPlotTop = 168.0;
  const yPlotBot = 32.0;
  const yAxisBot = 26.0;
  const ySignMid = 17.0;
  const plotH = yPlotTop - yPlotBot;

  const x0 = L;
  const x1 = 27.5;
  const x2 = 39.5;
  const x3 = 50.5;
  const x4 = 66.5;
  const x5 = 87.5;
  const x6 = 96.8;
  const x7 = 106.0;

  const activeCurves: CurveDef[] = [];
  if (config.showA) {
    activeCurves.push({ key: 'a', title: '曲线 A (MPa)', unit: 'MPa', layer: 'CURVE_A', color: 1 });
  }
  if (config.showB) {
    activeCurves.push({ key: 'b', title: '曲线 B (kPa)', unit: 'kPa', layer: 'CURVE_B', color: 5 });
  }
  if (config.showC) {
    activeCurves.push({ key: 'c', title: '曲线 C (kPa)', unit: 'kPa', layer: 'CURVE_C', color: 3 });
  }
  if (activeCurves.length === 0) {
    activeCurves.push({ key: 'a', title: '曲线 A (MPa)', unit: 'MPa', layer: 'CURVE_A', color: 1 });
  }

  const curveTotalW = R - x7;
  const singleCurveW = curveTotalW / activeCurves.length;

  const maxDepth = Math.max(1, ...data.depth);
  let depthScale: number;
  let scaleRatioText: string;
  if (config.depthScale > 0) {
    if (config.depthScale >= 20) {
      depthScale = 1000 / config.depthScale;
      scaleRatioText = `1:${Math.round(config.depthScale)}`;
    } else {
      depthScale = config.depthScale;
      scaleRatioText = `1:${Math.round(1000 / depthScale)}`;
    }
  } else {
    depthScale = plotH / (maxDepth * 1.02);
    scaleRatioText = `1:${Math.round(1000 / depthScale)}`;
  }
  const depthToY = (d: number) => yPlotTop - d * depthScale;

  const maxA = Math.max(0.5, ...data.a);
  const maxB = Math.max(5, ...data.b);
  const maxC = Math.max(5, ...data.c);
  const scaleStepMap = {
    a: niceStep(maxA / 4.2),
    b: niceStep(maxB / 4.2),
    c: niceStep(maxC / 4.2),
  };

  // 1. Sheet frame + binding line
  dwg.addRect(0, 0, W, H, 'FRAME_OUTER', 8, 0);
  dwg.addRect(L, B, R, T, 'FRAME_BORDER', 7, 0.5);
  dwg.addLine(10, H / 2 - 28, 10, H / 2 + 28, 'FRAME_OUTER', 8);
  dwg.addText(7.2, H / 2, 2.0, '装   订   线', 'TEXT_LABEL', 8, 90, 1, 2, 0.85);

  // 2. Title area
  const centerX = (L + R) / 2;
  dwg.addText(centerX, 197.2, 4.3, '工 程 综 合 记 录 图 (A4)', 'TEXT_TITLE', 7, 0, 1, 2, 0.9);
  dwg.addLine(centerX - 42, 193.8, centerX + 42, 193.8, 'TABLE_LINE', 7);
  dwg.addLine(centerX - 42, 193.1, centerX + 42, 193.1, 'FRAME_OUTER', 8);

  dwg.addText(L + 2.5, 195.5, 2.1, `工程编号：${config.projectCode}`, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);
  dwg.addText(
    R - 2.5,
    195.5,
    2.1,
    `阶段：${config.stage}    第 ${pageIndex + 1} 页 共 ${totalPages} 页`,
    'TEXT_VALUE',
    7,
    0,
    2,
    2,
    0.82
  );
  dwg.addLine(L, yTitleBot, R, yTitleBot, 'FRAME_BORDER', 7);

  // 3. Project / sheet metadata
  dwg.addLine(L, yMetaBot, R, yMetaBot, 'TABLE_LINE', 7);
  const metaY = (yTitleBot + yMetaBot) / 2;
  const safeElev = (parseFloat(sheetItem.elevation) || 0).toFixed(2);
  const metaCols = [
    { xL: 20, xM: 35, xR: 106, label: '工程名称', val: config.projectName },
    { xL: 106, xM: 120, xR: 146, label: '记录编号', val: sheetItem.sheetNo },
    { xL: 146, xM: 161, xR: 187, label: '基准标高', val: `${safeElev} m` },
    { xL: 187, xM: 202, xR: 229, label: '记录深度', val: `${maxDepth.toFixed(2)} m` },
    { xL: 229, xM: 244, xR: 289, label: '记录日期', val: sheetItem.recordDate || config.recordDate },
  ];
  for (const mc of metaCols) {
    dwg.addLine(mc.xM, yTitleBot, mc.xM, yMetaBot, 'FRAME_OUTER', 8);
    if (mc.xR < R) dwg.addLine(mc.xR, yTitleBot, mc.xR, yMetaBot, 'TABLE_LINE', 7);
    dwg.addText((mc.xL + mc.xM) / 2, metaY, 2.0, mc.label, 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
    dwg.addText(mc.xM + 2, metaY, 2.3, mc.val, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);
  }

  // 4. Band / curve headers
  dwg.addLine(L, yPlotTop, R, yPlotTop, 'FRAME_BORDER', 7);
  dwg.addLine(x5, yHeaderMid, R, yHeaderMid, 'TABLE_LINE', 7);

  [x1, x2, x3, x4, x5, x7].forEach((x) => dwg.addLine(x, yMetaBot, x, yPlotBot, 'TABLE_LINE', 7));
  dwg.addLine(x6, yHeaderMid, x6, yPlotBot, 'TABLE_LINE', 7);

  const hCenterY = (yMetaBot + yPlotTop) / 2;
  dwg.addText((x0 + x1) / 2, hCenterY, 2.0, '序\n号', 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
  dwg.addText((x1 + x2) / 2, hCenterY, 1.9, '分段深度\n(m)', 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
  dwg.addText((x2 + x3) / 2, hCenterY, 1.9, '分段长度\n(m)', 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
  dwg.addText((x3 + x4) / 2, hCenterY, 1.9, '分段示意\n及深度标尺', 'TEXT_VALUE', 7, 0, 1, 2, 0.75);
  dwg.addText((x4 + x5) / 2, hCenterY, 2.0, '分段名称\n及说明', 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
  dwg.addText((x5 + x7) / 2, (yMetaBot + yHeaderMid) / 2, 1.9, '统计均值', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  dwg.addText((x5 + x6) / 2, (yHeaderMid + yPlotTop) / 2, 1.65, 'A\n(MPa)', 'TEXT_VALUE', 7, 0, 1, 2, 0.75);
  dwg.addText((x6 + x7) / 2, (yHeaderMid + yPlotTop) / 2, 1.65, 'B\n(kPa)', 'TEXT_VALUE', 7, 0, 1, 2, 0.75);

  // 5. Curve headers, dual rulers, dashed grid
  const depthTickMajor = maxDepth > 80 ? 10 : 5;
  const depthTickMinor = maxDepth > 80 ? 2 : 1;

  if (config.showGrid) {
    for (let d = depthTickMajor; d < maxDepth; d += depthTickMajor) {
      const y = depthToY(d);
      if (y <= yPlotBot + 0.5) break;
      dwg.addLine(x7, y, R, y, 'GRID_DASH', 8, 'DASHED');
    }
  }

  activeCurves.forEach((cv, idx) => {
    const cLeft = x7 + idx * singleCurveW;
    const cRight = cLeft + singleCurveW;
    const cMid = (cLeft + cRight) / 2;
    const stepVal = scaleStepMap[cv.key];

    if (idx > 0) dwg.addLine(cLeft, yMetaBot, cLeft, yAxisBot, 'TABLE_LINE', 7);

    const headerY = (yMetaBot + yHeaderMid) / 2;
    dwg.addText(cMid - 4, headerY, 2.2, cv.title, 'TEXT_VALUE', 7, 0, 1, 2, 0.85);
    dwg.addPolyline([[cMid + 16, headerY], [cMid + 24, headerY]], cv.layer, cv.color, false, 0.35);

    const numMajor = 5;
    const numMinor = 10;
    for (let m = 0; m <= numMinor; m++) {
      const x = cLeft + (singleCurveW / numMinor) * m;
      const isMajor = m % 2 === 0;
      const tickH = isMajor ? 1.8 : 1.0;

      dwg.addLine(x, yPlotTop, x, yPlotTop + tickH, 'TABLE_LINE', 7);
      dwg.addLine(x, yPlotBot, x, yPlotBot - tickH, 'TABLE_LINE', 7);

      if (isMajor) {
        const k = m / 2;
        const valNum = k * stepVal;
        const valStr = stepVal < 1 ? valNum.toFixed(1) : String(Math.round(valNum * 10) / 10);
        let align: HAlign = 1;
        let tx = x;
        if (k === 0) {
          align = 0;
          tx = x + 0.6;
        } else if (k === numMajor) {
          align = 2;
          tx = x - 0.6;
        }

        dwg.addText(tx, yPlotTop + 3.4, 1.75, valStr, 'TEXT_VALUE', 7, 0, align, 2, 0.8);
        dwg.addText(tx, yPlotBot - 3.3, 1.75, valStr, 'TEXT_VALUE', 7, 0, align, 2, 0.8);

        if (config.showGrid && k > 0 && k < numMajor) {
          dwg.addLine(x, yPlotTop, x, yPlotBot, 'GRID_DASH', 8, 'DASHED');
        }
      }
    }
  });

  // 6. Depth ruler beside the band column
  const xRulerRight = x3 + 4.8;
  dwg.addLine(xRulerRight, yPlotTop, xRulerRight, yPlotBot, 'TABLE_LINE', 7);

  for (let d = 0; d <= maxDepth; d += depthTickMinor) {
    const y = depthToY(d);
    if (y < yPlotBot - 0.1) break;
    const isMajor = d % depthTickMajor === 0;
    const isMid = d % (depthTickMajor / 2) === 0;
    if (isMajor) {
      dwg.addLine(xRulerRight - 1.4, y, xRulerRight, y, 'TABLE_LINE', 7);
      if (d > 0 && y > yPlotBot + 1.8) {
        dwg.addText(xRulerRight - 1.6, y, 1.6, String(d), 'TEXT_VALUE', 7, 0, 2, 2, 0.75);
      }
    } else if (isMid) {
      dwg.addLine(xRulerRight - 0.9, y, xRulerRight, y, 'TABLE_LINE', 7);
    } else {
      dwg.addLine(xRulerRight - 0.5, y, xRulerRight, y, 'FRAME_OUTER', 8);
    }
  }

  // 7. Hatch, band rows, band boundaries
  for (const band of bands) {
    const yTop = Math.min(depthToY(band.from), yPlotTop);
    const yBot = Math.max(depthToY(band.to), yPlotBot);
    if (yTop <= yBot) continue;

    drawHatch(dwg, xRulerRight, yBot, x4, yTop, band.pattern, 'HATCH_PAT', 8);
    dwg.addLine(x0, yBot, x3, yBot, 'TABLE_LINE', 7);
    dwg.addLine(xRulerRight, yBot, x7, yBot, 'TABLE_LINE', 7);

    if (config.showGrid && yBot > yPlotBot + 1.0) {
      dwg.addLine(x7, yBot, R, yBot, 'LAYER_DOT', 8, 'DOT');
    }

    const midY = (yTop + yBot) / 2;
    const boxH = yTop - yBot;
    if (boxH >= 3.2) {
      const fontH = boxH < 5.5 ? 1.65 : 2.05;
      const cxCode = (x0 + x1) / 2;
      const rCode = Math.min(1.45, boxH * 0.38);
      dwg.addCircle(cxCode, midY, rCode, 'TABLE_LINE', 7);
      dwg.addText(cxCode, midY, fontH * 0.82, String(band.index), 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
      dwg.addText((x1 + x2) / 2, midY, fontH, band.to.toFixed(2), 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
      dwg.addText((x2 + x3) / 2, midY, fontH, band.length.toFixed(2), 'TEXT_VALUE', 7, 0, 1, 2, 0.8);

      if (boxH >= 8.5) {
        dwg.addText((x4 + x5) / 2, midY + 1.4, 2.1, band.name, 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
        dwg.addText((x4 + x5) / 2, midY - 1.6, 1.65, `(${band.note})`, 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
      } else {
        dwg.addText((x4 + x5) / 2, midY, fontH, `${band.name}(${band.note})`, 'TEXT_VALUE', 7, 0, 1, 2, 0.72);
      }

      dwg.addText((x5 + x6) / 2, midY, fontH * 0.92, band.avgA.toFixed(2), 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
      dwg.addText((x6 + x7) / 2, midY, fontH * 0.92, band.avgB.toFixed(1), 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
    }
  }

  dwg.addLine(L, yPlotBot, R, yPlotBot, 'FRAME_BORDER', 7);
  dwg.addLine(L, yAxisBot, R, yAxisBot, 'FRAME_BORDER', 7);

  dwg.addText(
    L + 2,
    (yPlotBot + yAxisBot) / 2,
    1.75,
    '附注：1. 基准面以设计文件为准；2. 均值列为各段算术平均值。',
    'TEXT_LABEL',
    8,
    0,
    0,
    2,
    0.8
  );

  // 8. Series curves with bucket min/max decimation for long series
  const bucketSize = data.depth.length > 2200 ? Math.ceil(data.depth.length / 1100) : 1;
  activeCurves.forEach((cv, idx) => {
    const cLeft = x7 + idx * singleCurveW;
    const cRight = cLeft + singleCurveW;
    const stepVal = scaleStepMap[cv.key];
    const maxRange = stepVal * 5;
    const pts: Array<[number, number]> = [];
    const values = data[cv.key];

    const pushPointAt = (idxPt: number) => {
      const val = values[idxPt];
      if (!isFinite(val)) return;
      let x = cLeft + (val / maxRange) * singleCurveW;
      x = Math.max(cLeft, Math.min(x, cRight));
      const y = depthToY(data.depth[idxPt]);
      if (y < yPlotBot || y > yPlotTop) return;
      pts.push([x, y]);
    };

    if (bucketSize === 1) {
      for (let i = 0; i < data.depth.length; i++) pushPointAt(i);
    } else {
      for (let i = 0; i < data.depth.length; i += bucketSize) {
        const end = Math.min(data.depth.length - 1, i + bucketSize - 1);
        let minIdx = i;
        let maxIdx = i;
        for (let k = i + 1; k <= end; k++) {
          const v = values[k];
          if (v < values[minIdx]) minIdx = k;
          if (v > values[maxIdx]) maxIdx = k;
        }
        if (minIdx === maxIdx) {
          pushPointAt(minIdx);
        } else if (minIdx < maxIdx) {
          pushPointAt(minIdx);
          pushPointAt(maxIdx);
        } else {
          pushPointAt(maxIdx);
          pushPointAt(minIdx);
        }
      }
    }
    if (pts.length > 1) {
      dwg.addPolyline(pts, cv.layer, cv.color, false, 0.22);
    }
  });

  // 9. Title block
  dwg.addLine(L, ySignMid, R, ySignMid, 'TABLE_LINE', 7);

  const sxUnitRight = 114.0;
  dwg.addLine(35, yAxisBot, 35, B, 'FRAME_OUTER', 8);
  dwg.addLine(sxUnitRight, yAxisBot, sxUnitRight, B, 'TABLE_LINE', 7);

  const row1Y = (yAxisBot + ySignMid) / 2;
  const row2Y = (ySignMid + B) / 2;

  dwg.addText(27.5, row1Y, 1.9, '编制单位', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(37.0, row1Y, 2.5, config.company, 'TEXT_VALUE', 7, 0, 0, 2, 0.85);
  dwg.addText(sxUnitRight - 2, row1Y, 1.75, `[${config.certNo}]`, 'TEXT_LABEL', 8, 0, 2, 2, 0.78);

  dwg.addText(27.5, row2Y, 1.9, '工程名称', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(37.0, row2Y, 2.3, config.projectName, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);

  const signRoles = [
    { role: '项目负责', name: config.leaderName },
    { role: '审   定', name: config.approverName },
    { role: '审   核', name: config.auditorName },
    { role: '校   核', name: config.checkerName },
    { role: '制   图', name: config.draftsmanName },
  ];
  const roleW = 22.0;
  signRoles.forEach((sr, idx) => {
    const rxL = sxUnitRight + idx * roleW;
    const rxR = rxL + roleW;
    const rxM = (rxL + rxR) / 2;
    dwg.addLine(rxR, yAxisBot, rxR, B, 'TABLE_LINE', 7);
    dwg.addText(rxM, row1Y, 1.85, sr.role, 'TEXT_LABEL', 8, 0, 1, 2, 0.76);
    if (sr.name) {
      dwg.addText(rxM, row2Y, 2.4, sr.name, 'TEXT_VALUE', 7, 0, 1, 2, 0.85);
    }
  });

  dwg.addLine(236, yAxisBot, 236, B, 'FRAME_OUTER', 8);
  dwg.addText(230, row1Y, 1.9, '图   名', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(238, row1Y, 2.3, `工程综合记录图 (${sheetItem.sheetNo})`, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);

  const sheetDrawingNo = getAutoDrawingNo(config.drawingNo, pageIndex, totalPages);
  dwg.addLine(256, ySignMid, 256, B, 'TABLE_LINE', 7);
  dwg.addLine(267, ySignMid, 267, B, 'FRAME_OUTER', 8);
  dwg.addText(230, row2Y, 1.9, '比例尺', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(246, row2Y, 2.0, `垂 ${scaleRatioText}`, 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  dwg.addText(261.5, row2Y, 1.9, '图 号', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(278, row2Y, 2.1, sheetDrawingNo, 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
}

const LAYER_DEFS: Array<[string, number, Linetype]> = [
  ['FRAME_OUTER', 8, 'CONTINUOUS'],
  ['FRAME_BORDER', 7, 'CONTINUOUS'],
  ['TABLE_LINE', 7, 'CONTINUOUS'],
  ['GRID_DASH', 8, 'DASHED'],
  ['LAYER_DOT', 8, 'DOT'],
  ['HATCH_PAT', 8, 'CONTINUOUS'],
  ['CURVE_A', 1, 'CONTINUOUS'],
  ['CURVE_B', 5, 'CONTINUOUS'],
  ['CURVE_C', 3, 'CONTINUOUS'],
  ['TEXT_TITLE', 7, 'CONTINUOUS'],
  ['TEXT_LABEL', 8, 'CONTINUOUS'],
  ['TEXT_VALUE', 7, 'CONTINUOUS'],
];

/** Compose one or more sheets into a single document. */
export function generateMultiSheetDxf(
  sheetList: SheetItem[],
  config: SheetConfig,
  onlySingleIndex = -1
): DrawingDocument {
  const dwg = new DrawingDocument();
  for (const [name, color, linetype] of LAYER_DEFS) {
    dwg.addLayer(name, color, linetype);
  }

  const W = 297;
  const H = 210;
  const gap = config.sheetGap;
  const total = sheetList.length;

  if (onlySingleIndex >= 0 && onlySingleIndex < total) {
    drawSingleA4Sheet(dwg, 0, 0, sheetList[onlySingleIndex], config, onlySingleIndex, total);
    dwg.setExtents(0, 0, W, H);
    return dwg;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  sheetList.forEach((sheetItem, idx) => {
    let col = 0;
    let row = 0;
    if (config.layoutMode === 'horizontal') {
      col = idx;
      row = 0;
    } else if (config.layoutMode === 'vertical') {
      col = 0;
      row = idx;
    } else {
      const colsPerRow = Math.max(1, config.gridCols);
      col = idx % colsPerRow;
      row = Math.floor(idx / colsPerRow);
    }

    const ox = col * (W + gap);
    const oy = -row * (H + gap);

    drawSingleA4Sheet(dwg, ox, oy, sheetItem, config, idx, total);

    minX = Math.min(minX, ox);
    minY = Math.min(minY, oy);
    maxX = Math.max(maxX, ox + W);
    maxY = Math.max(maxY, oy + H);
  });

  if (total > 0) {
    dwg.setExtents(minX, minY, maxX, maxY);
  }

  return dwg;
}

```

## test\canvas-record.test.ts
```ts
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

```

## test\canvas-renderer.test.ts
```ts
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

```

## test\cross-entry.test.ts
```ts
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

```

## test\dom-import.test.ts
```ts
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

```

## test\dxf-import.test.ts
```ts
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

```

## test\page-smoke.test.ts
```ts
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

```

## test\render-browser.test.ts
```ts
import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

import { DrawingDocument, TextCodec } from '../src/index';
import { DualViewPreview, Emitter, SvgLiveView, Viewport } from '../src/render';
import { downloadBytes, downloadDxf, downloadSvg } from '../src/browser';

function withDomGlobals<T>(dom: JSDOM, fn: () => T): T {
  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    URL: globalThis.URL,
    Blob: globalThis.Blob,
    AbortController: globalThis.AbortController,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    URL: dom.window.URL,
    Blob: dom.window.Blob,
    AbortController: dom.window.AbortController,
  });
  try {
    return fn();
  } finally {
    Object.assign(globalThis, prev);
  }
}

describe('DualViewPreview & Viewport', () => {
  it('recomputes zoom limits per document with headroom and without leaking across fits', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="p1"><canvas id="c"></canvas></div><div id="p2"><div id="s"></div></div></body></html>'
    );
    withDomGlobals(dom, () => {
      const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
      canvas.getContext = () => null;
      const svg = dom.window.document.getElementById('s') as HTMLElement;
      const pane1 = dom.window.document.getElementById('p1') as HTMLElement;
      const pane2 = dom.window.document.getElementById('p2') as HTMLElement;

      const preview = new DualViewPreview({
        canvas,
        svgContainer: svg,
        panes: [pane1, pane2],
        limits: { minScale: 0.2, maxScale: 50 },
      });

      // 1. Huge drawing: fitted scale is far below 0.2, yet wheel zoom-out still works.
      const huge = new DrawingDocument({ extents: { minX: 0, minY: 0, maxX: 50_000, maxY: 40_000 } });
      huge.addLine(0, 0, 50_000, 40_000, '0', 7);
      preview.setDocument(huge, { fit: true });
      const hugeScale = preview.camera.scale;
      expect(hugeScale).toBeLessThan(0.2);

      pane1.dispatchEvent(
        new dom.window.WheelEvent('wheel', {
          deltaY: 120,
          clientX: 400,
          clientY: 300,
          bubbles: true,
          cancelable: true,
        })
      );
      expect(preview.camera.scale).toBeLessThan(hugeScale);

      // 2. Switch back to normal A4: limits must reset to baseLimits (minScale = 0.2).
      const a4 = new DrawingDocument({ extents: { minX: 0, minY: 0, maxX: 297, maxY: 210 } });
      a4.addLine(0, 0, 297, 210, '0', 7);
      preview.setDocument(a4, { fit: true });

      for (let i = 0; i < 40; i++) {
        pane1.dispatchEvent(
          new dom.window.WheelEvent('wheel', {
            deltaY: 120,
            clientX: 400,
            clientY: 300,
            bubbles: true,
            cancelable: true,
          })
        );
      }
      expect(preview.camera.scale).toBeCloseTo(0.2, 6);
      preview.destroy();
    });
  });

  it('prevents text selection on drag start, clears drag on blur, and guards post-destroy calls', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="p1"><canvas id="c"></canvas></div><div id="s"></div></body></html>'
    );
    withDomGlobals(dom, () => {
      const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
      canvas.getContext = () => null;
      const svg = dom.window.document.getElementById('s') as HTMLElement;
      const preview = new DualViewPreview({ canvas, svgContainer: svg });

      const doc = new DrawingDocument();
      doc.addLine(0, 0, 100, 100, '0', 7);
      preview.setDocument(doc, { fit: true });

      const down = new dom.window.MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
        cancelable: true,
      });
      svg.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);

      // Window blur must cancel active drag so later mousemove does not pan.
      const before = preview.camera.getState();
      dom.window.dispatchEvent(new dom.window.Event('blur'));
      dom.window.dispatchEvent(
        new dom.window.MouseEvent('mousemove', { clientX: 250, clientY: 250 })
      );
      expect(preview.camera.getState()).toEqual(before);

      preview.destroy();
      let eventsAfterDestroy = 0;
      preview.on('render', () => {
        eventsAfterDestroy += 1;
      });
      preview.setDocument(doc, { fit: true });
      preview.setTheme('light');
      preview.fit();
      preview.render();
      expect(eventsAfterDestroy).toBe(0);
      expect(svg.innerHTML).toBe('');
    });
  });

  it('uses the canvas ownerDocument realm AbortController and supports drag panning and live APIs', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="p1"><canvas id="c"></canvas></div><div id="p2"><div id="s"></div></div></body></html>'
    );
    // Intentionally do NOT override globalThis.AbortController or globalThis.window:
    // DualViewPreview must resolve them from canvas.ownerDocument.defaultView.
    const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
    canvas.getContext = () => null;
    const svg = dom.window.document.getElementById('s') as HTMLElement;
    const pane1 = dom.window.document.getElementById('p1') as HTMLElement;
    const pane2 = dom.window.document.getElementById('p2') as HTMLElement;
    pane1.getBoundingClientRect = () =>
      ({ width: 800, height: 690, left: 0, top: 0, right: 800, bottom: 690 }) as DOMRect;

    const preview = new DualViewPreview({
      canvas,
      svgContainer: svg,
      panes: [pane1, pane2],
      measure: pane1,
    });

    const doc = new DrawingDocument();
    doc.addText(10, 10, 4, 'TITLE', 'TITLE', 7);
    preview.setDocument(doc, { fit: true });

    const before = preview.camera.getState();
    const vbBefore = svg.querySelector('svg')?.getAttribute('viewBox');

    pane1.dispatchEvent(
      new dom.window.MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
        cancelable: true,
      })
    );
    dom.window.dispatchEvent(
      new dom.window.MouseEvent('mousemove', { clientX: 140, clientY: 120 })
    );
    dom.window.dispatchEvent(new dom.window.MouseEvent('mouseup'));

    expect(preview.camera.offsetX).toBeCloseTo(before.offsetX + 40, 6);
    expect(preview.camera.offsetY).toBeCloseTo(before.offsetY + 20, 6);
    expect(svg.querySelector('svg')?.getAttribute('viewBox')).not.toBe(vbBefore);

    preview.setMeasureElement(pane2);
    expect(preview.viewport.getMeasureElement()).toBe(pane2);

    preview.setDecorations({ boldLayers: ['TITLE'] });
    expect(svg.querySelector('text')?.getAttribute('font-weight')).toBe('bold');

    preview.resetView();
    expect(preview.camera.offsetX).toBeCloseTo(before.offsetX, 6);
    preview.destroy();
  });

  it('clamps Viewport minSize to at least 1', () => {
    const dom = new JSDOM('<!doctype html><html><body><div id="box"><canvas id="c"></canvas></div></body></html>');
    withDomGlobals(dom, () => {
      const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
      const box = dom.window.document.getElementById('box') as HTMLElement;
      box.getBoundingClientRect = () =>
        ({ width: 0.2, height: 0.2, left: 0, top: 0, right: 0.2, bottom: 0.2 }) as DOMRect;

      const viewport = new Viewport({ canvas, measure: box, minSize: 0 });
      const m = viewport.sync();
      expect(m.width).toBe(1);
      expect(m.height).toBe(1);
    });
  });

  it('Emitter and SvgLiveView manage subscriptions and live DOM updates cleanly', () => {
    const emitter = new Emitter<{ tick: number }>();
    const received: number[] = [];
    const off = emitter.on('tick', (n) => received.push(n));
    emitter.emit('tick', 1);
    off();
    emitter.emit('tick', 2);
    expect(received).toEqual([1]);

    const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>');
    const host = dom.window.document.getElementById('host') as HTMLElement;
    const view = new SvgLiveView(host, { theme: 'dark', rootId: 'customSvg' });
    const doc = new DrawingDocument();
    doc.addLine(0, 0, 10, 10, '0', 1);

    view.render(doc, { x: 0, y: -10, w: 20, h: 20 });
    expect(view.hasRenderedContent).toBe(true);
    expect(view.element?.getAttribute('id')).toBe('customSvg');

    view.setViewBox({ x: 5, y: -5, w: 10, h: 10 });
    expect(view.element?.getAttribute('viewBox')).toBe('5 -5 10 10');

    view.clear();
    expect(view.hasRenderedContent).toBe(false);
    expect(view.element).toBeNull();
  });
});

describe('browser download helpers', () => {
  it('throws a clear error outside a browser environment', () => {
    const doc = new DrawingDocument();
    expect(() => downloadBytes('x', { filename: 'a.txt' })).toThrow(/not available/i);
    expect(() => downloadDxf(doc, { filename: 'a.dxf' })).toThrow(/not available/i);
    expect(() => downloadSvg(doc, { filename: 'a.svg' })).toThrow(/not available/i);
  });

  it('attaches and removes the anchor, forwards custom codec, and tolerates null document.body', () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    withDomGlobals(dom, () => {
      let revoked = 0;
      Object.defineProperty(dom.window.URL, 'createObjectURL', {
        value: () => 'blob:test',
        configurable: true,
      });
      Object.defineProperty(dom.window.URL, 'revokeObjectURL', {
        value: () => {
          revoked += 1;
        },
        configurable: true,
      });

      const clickedConnected: boolean[] = [];
      dom.window.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        clickedConnected.push(this.isConnected);
      };

      const escaped: string[] = [];
      const codec = new TextCodec({ onUnencodable: (entries) => escaped.push(...entries) });
      const doc = new DrawingDocument();
      doc.addText(0, 0, 3, 'Emoji😀', '0', 7);

      downloadDxf(doc, { filename: 'test.dxf', encoding: 'gbk', codec });
      expect(clickedConnected).toEqual([true]);
      expect(dom.window.document.body.querySelectorAll('a')).toHaveLength(0);
      expect(escaped.length).toBeGreaterThan(0);
      expect(revoked).toBe(1);

      // Even if document.body is missing, downloadBytes falls back without throwing.
      dom.window.document.body.remove();
      expect(dom.window.document.body).toBeNull();
      expect(() => downloadSvg(doc, { filename: 'test.svg' })).not.toThrow();
      expect(revoked).toBe(2);

      // Delayed revocation must wait for revokeDelayMs.
      vi.useFakeTimers();
      try {
        downloadBytes('hello', { filename: 'delay.txt', revokeDelayMs: 500 });
        expect(revoked).toBe(2);
        vi.advanceTimersByTime(499);
        expect(revoked).toBe(2);
        vi.advanceTimersByTime(1);
        expect(revoked).toBe(3);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});
```

## test\svg-import.test.ts
```ts
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

```

## test\unit.test.ts
```ts
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

```

## .gitignore
```gitignore
node_modules
dist
site
docs/api.html
*.log

```

## CHANGELOG.md
```md
# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.5.0] - 2026-11-26

### Added

- **DXF Importer (`vecbridge/dxf`)**: zero-dependency ASCII DXF (R12–R2024+) parser (`parseDxfToDocument`, `parseDxfWithReport`, `DxfImporter`, `unescapeDxfText`, `stripMtextFormatting`) with automatic encoding detection (BOM + `$ACADVER` + `$DWGCODEPAGE` + strict UTF-8 + GBK disambiguation), `LINE` / `CIRCLE` / `ARC` / `POLYLINE` / `LWPOLYLINE` (with bulge) / `SOLID` / `TRACE` / `3DFACE` / `ELLIPSE` / `SPLINE` / `TEXT` / `MTEXT` / `POINT`, `BLOCKS` + `INSERT` (nested & `MINSERT`), `DIMENSION` anonymous block expansion, space & hidden-layer filtering, and TrueColor (`420`) mapping.
- **`dxfToSvgText()`**: one-step DXF → SVG conversion exported from the main entry.
- **Canvas 2D Vector Recorder & Dual-Write Proxy (`vecbridge/canvas`)**: `VectorCanvasContext`, `createVectorContext()` (headless, isomorphic) and `recordCanvasContext(realCtx)` (browser tee proxy) converting standard Canvas 2D drawing calls directly into IR, DXF and SVG.
- **Unified Online Playground (`examples/playground.html`)**: clean light-theme TailwindCSS workbench integrating DXF preview/export, SVG → DXF, HTML DOM → SVG/DXF, and Canvas 2D live recording.
- Standalone demos `examples/dxf-preview.html` and `examples/canvas-record.html`, plus full unit/integration test suites (`test/dxf-import.test.ts`, `test/canvas-record.test.ts`).

### Changed

- **Package renamed from `dxf-ink` to `vecbridge`** (`window.VecBridge`, `dist/vecbridge.global.js`, `Symbol.for('vecbridge.*')`) to reflect the broader multi-format 2D vector IR & conversion positioning.
- Rewrote `README.md` with pain-point comparison, format conversion matrix, and concise quick-start recipes; updated `docs/API.md` and `scripts/build-docs.mjs`.
- Cleaned domain-specific examples and debug copies, turning `examples/dom-to-dxf.html` into a neutral specification & delivery sheet demo.

### Removed

- Removed accidental self-dependency (`"dxf-ink"` in `package.json` `dependencies`), restoring true zero runtime dependencies.
- Removed closed-source obfuscation build script (`scripts/build-encrypt.mjs`), `javascript-obfuscator` devDependency, and legacy `docs/PUBLIC_*.md`.

## [0.4.0] - 2026-11-19

### Added

- `DxfSerializeOptions.validate` (default `true`) — invalid entities are skipped instead of producing a file CAD rejects wholesale.
- `DxfSerializeOptions.onInvalidCommand` — callback receiving `(command, reason)` for every skipped entity.
- `validateCommand()` exported for pre-flight checks.

### Changed

- **DXF output (breaking for byte comparisons):** `POLYLINE` headers now include the R12 elevation point (`10/20/30`). Strict parsers (ODA, some CAM/CNC importers) require it. Golden baseline regenerated.

### Fixed

- Circles with `r <= 0`, text with `h <= 0`, non-finite coordinates, out-of-range ACI indices and single-vertex polylines no longer reach the DXF stream by default.

## [0.3.1] - 2026-11-19

### Fixed

- `docs/api.html` in-page anchors now use GitHub-compatible heading slugs; all 50 table-of-contents and cross-reference links resolve.
- `onUnencodable` documentation corrected: the callback fires once per `encodeToGbk()` call with the complete list of unencodable characters.

### Added

- Canvas renderer tests backed by a recording 2D context: dpr transform, background fill, camera-scaled line width, dash patterns, BYLAYER colour, text alignment/baseline, bold, small-text culling and paper shadow reset.

### Changed

- Documentation warnings for real-world CAD compatibility: R12 + `$DWGCODEPAGE = UTF-8`, duplicate layer names, manual `extents`, `\U+XXXX` ecosystem limits, `simsun.ttf` portability and GBK/CP936 differences.

## [0.3.0] - 2026-11-19

### Added

- `Camera.toWorld(px, py)` — inverse of `toScreen`, for cursor read-out and picking.
- `HatchOptions.maxPrimitives` (default `200_000`) — hard cap on emitted primitives; pass `0` to disable.
- `DownloadDxfOptions.codec` — pass a custom `TextCodec` so browser downloads can receive `onUnencodable` callbacks.

### Changed

- `drawHatch` normalises corner order (`x1 > x2` / `y1 > y2` are accepted) and throws `RangeError` for unknown patterns instead of silently drawing `dash-bands`.
- `Viewport.minSize` defaults to `1` (was `300`), so narrow side panels are no longer force-stretched.
- SVG **export** background now fits the viewBox exactly; live mode keeps the wide margin for free panning.
- `DualViewPreview.fit()` widens the zoom envelope to include the fitted scale, preventing the first wheel gesture from snapping to an unrelated zoom.

### Fixed

- Multi-line text with `rot != 0` stacks along the rotated baseline normal instead of overlapping on the same line.
- `dash-bands` no longer draws its offset stroke outside the fill rectangle.
- `Camera.fit()` / `zoomAt()` ignore degenerate extents, non-positive viewports and non-positive zoom factors.
- `DualViewPreview` calls `preventDefault()` on drag start, clears drag state on window blur, and every public method early-returns after `destroy()`.
- `downloadBytes` attaches the temporary anchor to the document before clicking, improving older Firefox/Safari compatibility.

## [0.2.0] - 2026-11-19

### Added

- `createLayerLookup()` / `resolveCommandStyle()` — BYLAYER colour and linetype resolution shared by the SVG and Canvas backends.
- `SvgSerializeOptions.preserveWhitespace` (default `true`) — emits `xml:space="preserve"` so runs of spaces survive; `SvgLiveView` and `DualViewPreview` expose the same option.
- `SvgLiveViewOptions.preserveWhitespace` and `DualViewOptions.preserveWhitespace`.
- `vAlign: 1` (bottom) support in SVG (`text-after-edge`) and Canvas (`bottom`).
- `isRenderTheme()` and a `Symbol.for` brand on `RenderTheme`, so themes created by another module copy (ESM + CJS or a second sub-path entry) are recognised.
- `DxfSerializer` emits group 6 for `CIRCLE` linetypes, matching SVG/Canvas.

### Changed

- **SVG output (breaking for byte comparisons):** text elements now carry `xml:space="preserve"`; paper fills are written as `<polygon>` instead of `<rect>`, which fixes reversed corners and rotated sheet frames. Golden baseline regenerated.
- `CIRCLE` linetypes now render in SVG/Canvas path style consistently across all three backends.
- BYLAYER (`color: null`) and inherited linetypes are resolved from the layer table in SVG/Canvas, matching DXF behaviour.

### Fixed

- `fmtNumber` uses `Number.isFinite` (no more `TypeError` for `null` / strings passed from plain JS) and never emits scientific notation for `|n| >= 1e21`.
- SVG `font-family`, background, paper and ACI colours are XML-escaped, so a font stack containing double quotes no longer produces invalid SVG.
- DXF text and layer names are flattened of CR/LF before writing; layer names also replace backslashes to avoid GBK `\U+XXXX` escapes corrupting the LAYER table.
- `DrawingDocument.addText` splits isolated `\r`; `fromJSON` appends iteratively, avoiding the spread argument-limit crash on 125k+ entities.
- GBK fast-path decode requires exactly `totalPairs + 1` lines and falls back to pair-by-pair decoding on mismatch; cache is marked complete only after a successful build.
- Canvas resets `shadowColor` after painting paper.

### Build

- ESM/CJS multi-entry builds use code splitting; IIFE stays a single file.
- GBK cache moved to `globalThis` under a `Symbol.for` key, shared by every entry.
- `tsconfig.json` (src only, `types: []`) split from `tsconfig.test.json` (`types: ["node"]`); `@types/node` added explicitly.

## [0.1.0] - 2026-11-19

### Added

- `DrawingDocument` builder with a single `DrawCommand[]` IR shared by all backends.
- `DxfSerializer` / `DxfExporter` — DXF R12 text and byte output (`gbk` / `utf8`, SHX / TrueType big fonts).
- `SvgSerializer` / `SvgExporter` — live and export modes, dark / light themes, optional viewBox.
- `CanvasRenderer`, `SvgLiveView`, `Camera`, `Viewport` and `DualViewPreview` for 1:1 dual-engine preview.
- `TextCodec` / `decodeAuto` / `encodeToGbk` / `encodeToUtf8` with lazy GBK reverse table and `\U+XXXX` escaping.
- `drawHatch` with nine built-in fill patterns.
- ESM, CJS, IIFE (`window.DxfKit`) and `.d.ts` builds; sub-path exports for every module.
- Golden output tests, camera invariant tests and a browser demo smoke test.

### Notes

- DXF and SVG output bytes are treated as a public contract: patch releases do not change output.
- `DocumentData` (from `toJSON()`) is a stable, persistable representation.

```

## LICENSE
```LICENSE
MIT License

Copyright (c) 2026 vecbridge contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

```

## package.json
```json
{
  "name": "vecbridge",
  "version": "0.5.0",
  "description": "Zero-dependency 2D vector IR, multi-format converter (HTML DOM / SVG / Canvas 2D / DXF) and 1:1 Canvas+SVG dual-engine viewer with native CJK/GBK CAD support",
  "keywords": [
    "vecbridge",
    "vector",
    "dxf",
    "svg",
    "canvas",
    "dom",
    "cad",
    "dxf-parser",
    "dxf-viewer",
    "svg-to-dxf",
    "html-to-dxf",
    "canvas-to-dxf",
    "dxf-to-svg",
    "gbk",
    "typescript"
  ],
  "license": "MIT",
  "type": "module",
  "sideEffects": false,
  "engines": {
    "node": ">=18"
  },
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    },
    "./core": {
      "types": "./dist/core.d.ts",
      "import": "./dist/core.js",
      "require": "./dist/core.cjs"
    },
    "./encoding": {
      "types": "./dist/encoding.d.ts",
      "import": "./dist/encoding.js",
      "require": "./dist/encoding.cjs"
    },
    "./dxf": {
      "types": "./dist/dxf.d.ts",
      "import": "./dist/dxf.js",
      "require": "./dist/dxf.cjs"
    },
    "./svg": {
      "types": "./dist/svg.d.ts",
      "import": "./dist/svg.js",
      "require": "./dist/svg.cjs"
    },
    "./render": {
      "types": "./dist/render.d.ts",
      "import": "./dist/render.js",
      "require": "./dist/render.cjs"
    },
    "./patterns": {
      "types": "./dist/patterns.d.ts",
      "import": "./dist/patterns.js",
      "require": "./dist/patterns.cjs"
    },
    "./browser": {
      "types": "./dist/browser.d.ts",
      "import": "./dist/browser.js",
      "require": "./dist/browser.cjs"
    },
    "./canvas": {
      "types": "./dist/canvas.d.ts",
      "import": "./dist/canvas.js",
      "require": "./dist/canvas.cjs"
    },
    "./dom": {
      "types": "./dist/dom.d.ts",
      "import": "./dist/dom.js",
      "require": "./dist/dom.cjs"
    },
    "./global": "./dist/vecbridge.global.js",
    "./package.json": "./package.json"
  },
  "unpkg": "./dist/vecbridge.global.js",
  "jsdelivr": "./dist/vecbridge.global.js",
  "files": [
    "dist",
    "README.md",
    "CHANGELOG.md",
    "LICENSE"
  ],
  "scripts": {
    "build": "tsup",
    "build:debug": "tsup --config tsup.debug.config.ts",
    "dev": "tsup --config tsup.debug.config.ts --watch",
    "typecheck": "tsc --noEmit && tsc --noEmit -p tsconfig.test.json",
    "test": "vitest run",
    "test:watch": "vitest",
    "verify": "pnpm typecheck && pnpm build && pnpm test",
    "baseline": "UPDATE_BASELINE=1 vitest run test/golden.test.ts",
    "docs:api": "node scripts/build-docs.mjs",
    "build:site": "pnpm build && pnpm docs:api && node scripts/build-site.mjs",
    "pack:check": "pnpm build && npm pack --dry-run",
    "prepublishOnly": "pnpm verify"
  },
  "devDependencies": {
    "@types/jsdom": "^30.0.0",
    "@types/node": "^26.6.6",
    "jsdom": "^31.0.1",
    "marked": "^18.2.1",
    "tsup": "^9.0.0",
    "typescript": "^6.0.3",
    "vitest": "^5.1.1"
  }
}

```

## pnpm-workspace.yaml
```yaml
allowBuilds:
  esbuild: true

```

## README.md
```md
# VecBridge

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

仓库内置开箱即用的亮色多合一工作台，本地构建后直接用浏览器打开即可拖入文件体验全部功能：

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
  - `/` — 在线工作台（Playground）与各专题示例
  - `/api.html` — 可搜索 API 文档
  - `/dist/vecbridge.global.js` — 打包后的浏览器 IIFE 产物（同时附带 ESM `.js`）

## License

MIT

```

## tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "strict": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "types": []
  },
  "include": ["src"]
}

```

## tsconfig.test.json
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["node"]
  },
  "include": ["src", "test"]
}

```

## tsup.config.ts
```ts
import { defineConfig } from 'tsup';

const shared = {
  target: 'es2020' as const,
  sourcemap: true,
  treeshake: true,
  platform: 'neutral' as const,
};

export default defineConfig([
  {
    ...shared,
    clean: true,
    entry: {
      index: 'src/index.ts',
      core: 'src/core/index.ts',
      encoding: 'src/encoding/index.ts',
      dxf: 'src/dxf/index.ts',
      svg: 'src/svg/index.ts',
      render: 'src/render/index.ts',
      patterns: 'src/patterns/index.ts',
      browser: 'src/browser/index.ts',
      canvas: 'src/canvas/index.ts',
      dom: 'src/dom/index.ts',
    },
    format: ['esm', 'cjs'],
    // Share internal chunks across entries so sub-paths do not duplicate core
    // classes or tables. The Symbol brand in theme.ts and the globalThis cache
    // in gbk-table.ts still guard mixed ESM + CJS (dual-package) imports.
    splitting: true,
    dts: true,
  },
  {
    ...shared,
    entry: { vecbridge: 'src/global.ts' },
    format: ['iife'],
    globalName: 'VecBridge',
    dts: false,
    minify: true,
    splitting: false,
  },
]);

```

## tsup.debug.config.ts
```ts
import { defineConfig } from 'tsup';

/**
 * 实时调试构建（浏览器 + Node 共用）：
 * - ESM/CJS 供 Node 与打包器使用，IIFE 供 <script> 使用
 * - 关闭 minify / dts / clean，sourcemap 稳定，watch 重建快
 * - 发布构建仍走原来的 tsup.config.ts
 */
const shared = {
  outDir: 'dist',
  target: 'es2020' as const,
  sourcemap: true,
  minify: false,
  clean: false,
  treeshake: false,
  dts: false,
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      core: 'src/core/index.ts',
      encoding: 'src/encoding/index.ts',
      dxf: 'src/dxf/index.ts',
      svg: 'src/svg/index.ts',
      render: 'src/render/index.ts',
      patterns: 'src/patterns/index.ts',
      browser: 'src/browser/index.ts',
      canvas: 'src/canvas/index.ts',
      dom: 'src/dom/index.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'neutral',
    splitting: true,
  },
  {
    ...shared,
    entry: { vecbridge: 'src/global.ts' },
    outExtension: () => ({ js: '.global.js' }),
    format: ['iife'],
    globalName: 'VecBridge',
    platform: 'browser',
    splitting: false,
  },
]);

```

## vitest.config.ts
```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
  },
});

```

