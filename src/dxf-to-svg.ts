/**
 * 一步式 DXF → SVG 转换便捷入口。
 *
 * 位于顶层组合 `dxf/parser` 与 `svg/serializer`，避免 `dxf` 与 `svg` 子模块
 * 之间产生交叉依赖。通过主入口与全局 IIFE 构建暴露。
 */

import { EXTENDED_DARK_THEME, EXTENDED_LIGHT_THEME } from './core/theme';
import { parseDxfToDocument, type DxfImportOptions } from './dxf/parser';
import { SvgSerializer, type SvgSerializeOptions } from './svg/serializer';

/** DXF 一步转 SVG 选项：合并 DXF 解析选项与 SVG 序列化选项。 */
export interface DxfToSvgOptions extends DxfImportOptions, SvgSerializeOptions {}

/**
 * 将 ASCII DXF（文本 / `Uint8Array` / `ArrayBuffer`）一步转换为纯矢量 SVG 文本。
 *
 * 默认使用 `mode: 'export'` 与 `EXTENDED_LIGHT_THEME`（白底打印 + 扩展 ACI 调色板），
 * 如指定 `mode: 'live'` 且未传 `theme` 则默认使用 `EXTENDED_DARK_THEME`。
 */
export function dxfToSvgText(
  input: string | Uint8Array | ArrayBuffer,
  options: DxfToSvgOptions = {}
): string {
  const {
    encoding,
    space,
    curveTolerance,
    includeHiddenLayers,
    includeUnsupportedWarnings,
    maxPrimitives,
    maxBlockDepth,
    theme,
    mode = 'export',
    viewBox,
    rootId,
    paddingMm,
    decorations,
    text,
    backgroundColor,
    includeXmlDeclaration,
    preserveWhitespace,
  } = options;

  const doc = parseDxfToDocument(input, {
    encoding,
    space,
    curveTolerance,
    includeHiddenLayers,
    includeUnsupportedWarnings,
    maxPrimitives,
    maxBlockDepth,
  });

  const resolvedTheme =
    theme ?? (mode === 'live' ? EXTENDED_DARK_THEME : EXTENDED_LIGHT_THEME);

  return new SvgSerializer().serialize(doc, {
    theme: resolvedTheme,
    mode,
    viewBox,
    rootId,
    paddingMm,
    decorations,
    text,
    backgroundColor,
    includeXmlDeclaration,
    preserveWhitespace,
  });
}
