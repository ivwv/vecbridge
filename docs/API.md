# vecbridge API 参考

> 版本 **1.0.0** · 适用于 Node.js 18+ 与现代浏览器
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

*本文档对应 `vecbridge@1.0.0`。*
