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
