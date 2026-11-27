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
