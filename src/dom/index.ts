/**
 * 浏览器 HTML DOM 转换层统一出口（`vecbridge/dom`）。
 *
 * 将浏览器中已挂载的 HTML 元素直接转换为：
 * - `DrawingDocument` IR（`domToDocument`）——可接入 `DualViewPreview` 双引擎预览与二次标注；
 * - 纯矢量 SVG（`domToSvg`，支持高保真 `visual` 与 IR 同源 `cad` 双模式，无 `<foreignObject>`）；
 * - AutoCAD R12 DXF（`domToDxfText` / `domToDxfBytes` / `downloadDomAsDxf`）。
 *
 * 同时导出纯计算函数 `sceneToDocument` 与 `sceneToVisualSvg`，支持在 Playwright/Puppeteer
 * 中提取 `DomScene` JSON 后回传 Node 端批量出图。
 */

import { downloadBytes } from '../browser';
import { DxfSerializer } from '../dxf/serializer';
import { extractDomScene } from './extract';
import { domToDocument, sceneToDocument } from './to-document';
import { domToSvg, sceneToVisualSvg } from './to-svg';
import type {
  DomConvertOptions,
  DomToDxfOptions,
  DownloadDomDxfOptions,
  DownloadDomSvgOptions,
} from './types';

export * from './types';
export { extractDomScene } from './extract';
export { domToDocument, sceneToDocument } from './to-document';
export { domToSvg, sceneToVisualSvg } from './to-svg';
export {
  extractHtmlScene,
  htmlToDocument,
  htmlToDxfBytes,
  htmlToDxfText,
  htmlToSvg,
} from './html';
export {
  clipSegmentToRect,
  mergeAxisAlignedSegments,
  roundedRectSvgPath,
  sampleRoundedRectPoints,
  type AxisSegment,
} from './borders';

function pickConvertOptions(options: DomToDxfOptions): DomConvertOptions {
  return {
    pxToMm: options.pxToMm,
    fitWidthMm: options.fitWidthMm,
    layerBy: options.layerBy,
    defaultLayer: options.defaultLayer,
    backgroundMode: options.backgroundMode,
    markRootPaper: options.markRootPaper,
    dedupeBorders: options.dedupeBorders,
    curveTolerance: options.curveTolerance,
    fontSizeScale: options.fontSizeScale,
    mediaMode: options.mediaMode,
    clipOverflow: options.clipOverflow,
    filter: options.filter,
    maxPrimitives: options.maxPrimitives,
  };
}

/** 将浏览器已挂载的 HTML `Element` 直接转换为 DXF R12 文本。 */
export function domToDxfText(element: Element, options: DomToDxfOptions = {}): string {
  const doc = domToDocument(element, pickConvertOptions(options));
  return new DxfSerializer({ codec: options.codec }).serialize(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

/** 将浏览器已挂载的 HTML `Element` 直接转换为编码后的 DXF R12 字节流（默认 GBK）。 */
export function domToDxfBytes(element: Element, options: DomToDxfOptions = {}): Uint8Array {
  const doc = domToDocument(element, pickConvertOptions(options));
  return new DxfSerializer({ codec: options.codec }).toBytes(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

/** 一步将 HTML `Element` 转换并触发浏览器下载为 `.dxf` 文件。 */
export function downloadDomAsDxf(element: Element, options: DownloadDomDxfOptions): void {
  const { filename, mimeType, revokeDelayMs, ...convertAndDxfOptions } = options;
  const bytes = domToDxfBytes(element, convertAndDxfOptions);
  downloadBytes(new Blob([bytes as BlobPart], { type: mimeType ?? 'application/dxf' }), {
    filename,
    revokeDelayMs,
  });
}

/** 一步将 HTML `Element` 转换并触发浏览器下载为纯矢量 `.svg` 文件。 */
export function downloadDomAsSvg(element: Element, options: DownloadDomSvgOptions): void {
  const { filename, mimeType, revokeDelayMs, ...svgOptions } = options;
  const text = domToSvg(element, svgOptions);
  downloadBytes(new Blob([text], { type: mimeType ?? 'image/svg+xml;charset=utf-8' }), {
    filename,
    revokeDelayMs,
  });
}
