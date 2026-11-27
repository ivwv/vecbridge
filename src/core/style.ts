/**
 * 样式解析：把命令的「随层（BYLAYER）」颜色/线型解析成渲染端可用的具体值。
 *
 * DXF 通过省略组码 62/6 原生处理 BYLAYER，但 SVG 与 Canvas 渲染端必须自己
 * 到图层表里查值。因此这里被三端渲染路径共用，是一致性调用链的一环。
 */

import type { DrawCommand, LayerDef, Linetype } from './types';

/** 按名称索引的只读图层表。 */
export type LayerLookup = ReadonlyMap<string, LayerDef>;

/**
 * 按名称给图层定义建索引。
 *
 * 重名图层保留第一个定义，这与 LAYER 表写入时的顺序一致。
 * （注意：【勿改·历史兼容】addLayer 本身不去重，重复名称会全部保留。）
 */
export function createLayerLookup(layers: readonly LayerDef[]): LayerLookup {
  const lookup = new Map<string, LayerDef>();
  for (const layer of layers) {
    if (!lookup.has(layer.name)) lookup.set(layer.name, layer);
  }
  return lookup;
}

/** 一条命令解析后的有效样式。 */
export interface ResolvedCommandStyle {
  /** 有效 ACI 索引；`null` 表示仍是随层（BYLAYER）且没有图层定义。 */
  color: number | null;
  /** 有效线型；`null` 表示实线 / 无显式图元线型。 */
  linetype: Linetype | null;
}

/**
 * 为渲染端解析命令的随层颜色与线型。
 *
 * 优先级：命令自身的值 → 图层定义 → null（主题默认色 / 实线）。
 * DXF 靠省略组码原生实现，SVG/Canvas 则靠本函数查表。
 *
 * 参数：cmd 为待解析命令，layers 为按名索引的图层表。
 * 返回：有效颜色与线型。
 * 注意：【勿改·历史兼容】`color === 256` 在 DXF 语义里同样表示 BYLAYER，
 *       必须和 `null` 一样对待，不能当成真实颜色。
 */
export function resolveCommandStyle(
  cmd: DrawCommand,
  layers: LayerLookup
): ResolvedCommandStyle {
  // null 和 ACI 256 在 DXF 中都表示 BYLAYER（随层）。
  const isByLayerColor = cmd.color === null || cmd.color === 256;
  if (!isByLayerColor && cmd.linetype) {
    return { color: cmd.color, linetype: cmd.linetype };
  }

  const layer = layers.get(cmd.layer);
  const layerColor =
    layer && Number.isFinite(layer.color) ? Math.abs(layer.color) : null;
  const explicitColor = isByLayerColor ? null : cmd.color;
  return {
    color: explicitColor ?? layerColor,
    linetype: cmd.linetype ?? layer?.linetype ?? null,
  };
}
