/**
 * 离屏 HTML 字符串转换器（仅浏览器 / 含真实布局的 DOM 环境）。
 *
 * 将 HTML 片段或完整 HTML 文档挂载到屏幕外固定定位容器中（不设置 visibility:hidden
 * 或 display:none，确保布局与样式正常计算），提取完成后在 `finally` 中可靠销毁容器。
 */

import type { DrawingDocument } from '../core/document';
import { DxfSerializer } from '../dxf/serializer';
import { SvgSerializer } from '../svg/serializer';
import { extractDomScene } from './extract';
import { sceneToDocument } from './to-document';
import { sceneToVisualSvg } from './to-svg';
import type {
  DomScene,
  HtmlConvertOptions,
  HtmlToDxfOptions,
  HtmlToSvgOptions,
} from './types';

function parseHtmlPayload(html: string): { bodyHtml: string; extractedCss: string } {
  const cssParts: string[] = [];
  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) {
    const styleRe = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
    let m: RegExpExecArray | null;
    while ((m = styleRe.exec(headMatch[1])) !== null) {
      if (m[1].trim()) cssParts.push(m[1]);
    }
  }

  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  return {
    bodyHtml: bodyMatch ? bodyMatch[1] : html,
    extractedCss: cssParts.join('\n'),
  };
}

/**
 * 在浏览器离屏容器中挂载 HTML 字符串并提取 `DomScene`，结束后自动清理临时 DOM。
 */
export function extractHtmlScene(
  html: string,
  options: HtmlConvertOptions = {}
): DomScene {
  const targetDoc =
    options.document ?? (typeof document !== 'undefined' ? document : null);
  if (!targetDoc || typeof targetDoc.createElement !== 'function') {
    throw new Error(
      'Offscreen HTML conversion requires a browser Document. ' +
        'Run in a browser/headless browser or pass options.document.'
    );
  }
  const mount = targetDoc.body ?? targetDoc.documentElement;
  if (!mount) {
    throw new Error('Target Document has no body or documentElement to mount offscreen HTML.');
  }

  const widthPx =
    Number.isFinite(options.widthPx) && (options.widthPx as number) > 0
      ? (options.widthPx as number)
      : 794;
  const { bodyHtml, extractedCss } = parseHtmlPayload(String(html ?? ''));
  const combinedCss = [extractedCss, options.css ?? ''].filter((s) => s.trim().length > 0).join('\n');

  const host = targetDoc.createElement('div');
  host.setAttribute('data-dxf-offscreen-host', 'true');
  host.style.position = 'fixed';
  host.style.left = '-99999px';
  host.style.top = '0';
  host.style.pointerEvents = 'none';
  host.style.zIndex = '-2147483648';
  host.style.boxSizing = 'border-box';

  if (combinedCss) {
    const styleEl = targetDoc.createElement('style');
    styleEl.textContent = combinedCss;
    host.appendChild(styleEl);
  }

  const contentRoot = targetDoc.createElement('div');
  contentRoot.style.width = `${widthPx}px`;
  contentRoot.style.boxSizing = 'border-box';
  contentRoot.innerHTML = bodyHtml;
  host.appendChild(contentRoot);

  mount.appendChild(host);
  try {
    options.beforeExtract?.(contentRoot);
    return extractDomScene(contentRoot, options);
  } finally {
    host.remove();
  }
}

/** 将 HTML 字符串通过离屏挂载转换为统一 IR `DrawingDocument`。 */
export function htmlToDocument(
  html: string,
  options: HtmlConvertOptions = {}
): DrawingDocument {
  const scene = extractHtmlScene(html, options);
  return sceneToDocument(scene, options);
}

/** 将 HTML 字符串通过离屏挂载转换为纯矢量 SVG（支持 `visual` 与 `cad` 双模式）。 */
export function htmlToSvg(html: string, options: HtmlToSvgOptions = {}): string {
  const mode = options.mode ?? 'visual';
  const scene = extractHtmlScene(html, {
    ...options,
    mediaMode: options.mediaMode ?? (mode === 'visual' ? 'embed' : 'ignore'),
  });

  if (mode === 'cad') {
    const doc = sceneToDocument(scene, options);
    return new SvgSerializer().serialize(doc, {
      theme: 'light',
      mode: 'export',
      ...options.svgOptions,
    });
  }

  return sceneToVisualSvg(scene, options);
}

/** 将 HTML 字符串通过离屏挂载一步转换为 DXF R12 文本。 */
export function htmlToDxfText(html: string, options: HtmlToDxfOptions = {}): string {
  const doc = htmlToDocument(html, options);
  return new DxfSerializer({ codec: options.codec }).serialize(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}

/** 将 HTML 字符串通过离屏挂载一步转换为编码后的 DXF R12 字节流（默认 GBK）。 */
export function htmlToDxfBytes(html: string, options: HtmlToDxfOptions = {}): Uint8Array {
  const doc = htmlToDocument(html, options);
  return new DxfSerializer({ codec: options.codec }).toBytes(doc, {
    encoding: options.encoding,
    font: options.font,
    newline: options.newline,
    validate: options.validate,
    onInvalidCommand: options.onInvalidCommand,
  });
}
