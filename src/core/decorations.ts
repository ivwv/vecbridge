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
