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
