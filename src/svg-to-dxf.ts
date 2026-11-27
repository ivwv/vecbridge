/**
 * 一步式 SVG → DXF 转换便捷入口。
 *
 * 位于顶层组合 `svg/parser` 与 `dxf/serializer`，避免 `svg` 与 `dxf` 两个子模块
 * 之间产生交叉依赖。通过 `dxf-ink` 主入口与全局 IIFE 构建暴露。
 */

import { DxfSerializer, type DxfSerializeOptions } from './dxf/serializer';
import type { TextCodec } from './encoding';
import { parseSvgToDocument, type SvgImportOptions } from './svg/parser';

/** SVG 一步转 DXF 选项：合并 SVG 解析选项与 DXF 序列化选项。 */
export interface SvgToDxfOptions extends SvgImportOptions, DxfSerializeOptions {
  /** 可选自定义编解码器（如监听 GBK 表外字符转义）。 */
  codec?: TextCodec;
}

/** 将 SVG 字符串直接转换为 DXF R12 文本。 */
export function svgToDxfText(svgText: string, options: SvgToDxfOptions = {}): string {
  const {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
    codec,
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  } = options;

  const doc = parseSvgToDocument(svgText, {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
  });

  return new DxfSerializer({ codec }).serialize(doc, {
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  });
}

/** 将 SVG 字符串直接转换为编码后的 DXF R12 字节流（默认 GBK）。 */
export function svgToDxfBytes(svgText: string, options: SvgToDxfOptions = {}): Uint8Array {
  const {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
    codec,
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  } = options;

  const doc = parseSvgToDocument(svgText, {
    yAxis,
    curveTolerance,
    scale,
    layerBy,
    defaultLayer,
    fillMode,
    ignoreBackground,
    fontSizeScale,
    maxPrimitives,
  });

  return new DxfSerializer({ codec }).toBytes(doc, {
    encoding,
    font,
    newline,
    validate,
    onInvalidCommand,
  });
}
