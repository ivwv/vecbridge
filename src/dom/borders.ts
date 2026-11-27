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
