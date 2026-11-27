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
