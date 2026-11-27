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
