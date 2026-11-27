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
