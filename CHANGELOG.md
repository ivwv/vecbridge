# Changelog

All notable changes to this project are documented in this file.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2026-11-27

首个正式稳定版本发布，以统一的 2D 图元中间表示（IR）为核心，提供零运行时依赖的多格式矢量解析、互转、双引擎 1:1 同步预览与原生 CJK/GBK AutoCAD 导出能力。

### Core & Theme (`vecbridge/core`)

- **`DrawingDocument` 与统一 IR（`DocumentData` / `DrawCommand[]`）**：支持 `line`、`circle`、`polyline`（含闭合、线宽、纸张标记）、`solid`（实心填充及凸多边形自动扇形拆分）与 `text`（多行展开、旋转基线法向排布）五类图元，添加时一次性叠加原点偏移，提供 `toJSON()` / `DrawingDocument.fromJSON()` 持久化往返。
- **三端一致样式与格式化契约**：提供 `createLayerLookup()` / `resolveCommandStyle()`（BYLAYER 颜色与线型解析）、`fmtNumber()`、`escapeXml()` 及 `isPaperCommand()` / `isBoldText()` 装饰判定。
- **主题与 ACI 调色板**：内置深/浅色基础主题（`DARK_THEME`、`LIGHT_THEME`）与 25 色扩展 ACI 主题（`EXTENDED_DARK_THEME`、`EXTENDED_LIGHT_THEME`），支持自定义 `RenderTheme` 与跨子路径 / ESM+CJS 品牌识别（`isRenderTheme()`）。

### Encoding (`vecbridge/encoding`)

- **零依赖 UTF-8 / GBK 双向编解码（`TextCodec`）**：内置按需构建且跨入口共享的 Unicode → GBK 反查表（`getGbkTable()`、`isGbkSupported()`），提供 `decode()`、`decodeAuto()`（BOM + 严格 UTF-8 + GBK 回退）、`encodeToUtf8()` 与 `encodeToGbk()`（GBK 表外字符自动转义为 CAD 原生 `\U+XXXX`）。

### DXF (`vecbridge/dxf`)

- **DXF R12 序列化（`DxfSerializer` / `DxfExporter`）**：输出兼容 AutoCAD / 中望 / 浩辰的 R12 (`AC1009`) 文本与字节流；支持 GBK (`ANSI_936`) 与 UTF-8、8 套内置中文 SHX/TTF 字体配方（`gbcbig`、`gbenor`、`gbeitc`、`hztxt`、`hzfs`、`romans`、`tssd`、`simsun`）及自定义字体配方；内置 `validateCommand()` 非法实体预检与图层/值行清洗。
- **ASCII DXF 解析导入（`DxfImporter` / `parseDxfToDocument` / `parseDxfWithReport`）**：零依赖解析 R12–R2024+ ASCII DXF，支持编码自动探测（BOM / `$ACADVER` / `$DWGCODEPAGE` / 严格 UTF-8 / GBK 消歧）、模型/图纸空间与隐藏图层过滤；支持 `LINE`、`CIRCLE`、`ARC`、`POLYLINE`、`LWPOLYLINE`（含 `bulge` 凸度）、`SOLID`、`TRACE`、`3DFACE`、`ELLIPSE`、`SPLINE`、`TEXT`、`ATTRIB`、`MTEXT`（含 `stripMtextFormatting()` 与 `unescapeDxfText()`）、`POINT`、`BLOCKS` + `INSERT`（嵌套与 `MINSERT`）、`DIMENSION` 匿名块展开与 `420` 真彩色映射。
- **一步式 DXF → SVG**：主入口提供 `dxfToSvgText()`。

### SVG (`vecbridge/svg`)

- **SVG 序列化（`SvgSerializer` / `SvgExporter`）**：支持 `live`（实时预览）与 `export`（mm 物理尺寸 + XML 声明）双模式、浅色白纸多边形填充、自定义 `viewBox` 与 `xml:space="preserve"` 空格保留。
- **SVG 解析导入（`SvgImporter` / `parseSvgToDocument`）**：零依赖、环境无关解析 `line`、`rect`（含圆角）、`circle`、`ellipse`、`polyline`、`polygon`、`path`（含二/三次贝塞尔与椭圆弧）、`text` / `tspan`、嵌套 `transform` 矩阵与 `<defs>` / `<use>`，支持多种 Y 轴翻转、图层归类与填充（`outline` / `solid` / `ignore`）策略。
- **一步式 SVG → DXF**：主入口提供 `svgToDxfText()` 与 `svgToDxfBytes()`。

### HTML DOM (`vecbridge/dom`)

- **浏览器 DOM 转矢量（`extractDomScene` / `domToDocument` / `domToSvg` / `domToDxfText` / `domToDxfBytes` / `downloadDomAsDxf` / `downloadDomAsSvg`）**：直接读取真实 CSS 布局，支持表格重合边框去重与共线合并（`mergeAxisAlignedSegments`）、圆角路径采样、原生 `Range` 自动换行拆分、竖排文字（`writing-mode`）、`ul/ol` 列表标记、表单控件值（`input` / `textarea` / `select`）、内嵌 `<svg>`、`overflow` 几何裁剪与 `data-dxf-ignore` / `data-dxf-layer` 注解。
- **双模式 SVG 输出与离屏 HTML 转换**：`domToSvg()` 同时支持高保真纯矢量 `visual` 模式（不使用 `<foreignObject>`）与 IR 同源 `cad` 模式；提供离屏 HTML 字符串一键转换（`extractHtmlScene` / `htmlToDocument` / `htmlToSvg` / `htmlToDxfText` / `htmlToDxfBytes`）以及 Node/浏览器通用的纯计算转换（`sceneToDocument` / `sceneToVisualSvg`）。

### Canvas 2D Recorder (`vecbridge/canvas`)

- **矢量录制与双写代理（`VectorCanvasContext` / `createVectorContext` / `recordCanvasContext`）**：兼容标准 Canvas 2D 路径、曲线、圆弧、椭圆、矩形/圆角矩形、文本、虚线与状态栈变换 API，扩展 `setLayer()` 图层控制；支持无头纯代码绘图（Node 与浏览器同构）及包裹真实 `CanvasRenderingContext2D` 实时上屏并同步导出 `DrawingDocument` / DXF / SVG。

### Patterns, Render & Browser (`vecbridge/patterns`, `vecbridge/render`, `vecbridge/browser`)

- **几何填充图案（`drawHatch`）**：内置 9 种确定性工程填充图案（`diagonal`、`diagonal-dash`、`horizontal`、`horizontal-dots`、`dots-fine`、`dots-coarse`、`scatter`、`crosshatch`、`dash-bands`），支持任意角点顺序归一化与 `maxPrimitives` 上限保护。
- **Canvas + SVG 双引擎 1:1 同步预览**：提供 `Camera`、`Viewport`、`CanvasRenderer`、`SvgLiveView`、`DualViewPreview` 与 `Emitter`，单相机驱动双视图同步缩放/平移、HiDPI 适配、主题/装饰实时切换与 `AbortController` 自动销毁清理。
- **浏览器下载辅助**：提供 `downloadBytes()`、`downloadDxf()` 与 `downloadSvg()`。

### Packaging, Examples & Docs

- **多格式产物与按需导出**：零运行时依赖，提供 ESM、CJS、单文件 IIFE（`dist/vecbridge.global.js`，挂载 `window.VecBridge`）与完整 `.d.ts` 类型声明，支持全部子路径入口 tree-shaking。
- **在线工作台与静态站点**：内置四合一亮色工作台（`examples/playground.html`）、5 个专题浏览器示例、Node CLI 示例、可搜索 HTML API 文档生成（`pnpm docs:api`）以及 GitHub Pages 自动装配与部署流程（`pnpm build:site` + `.github/workflows/pages.yml`）。
