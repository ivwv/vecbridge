/**
 * 将 `DomScene`（或浏览器 `Element`）输出为纯矢量 SVG 字符串（不使用 `<foreignObject>`）。
 *
 * 支持两种模式：
 * - `'visual'`（默认）：直接基于 `DomScene` 保留真彩色背景、圆角路径、四边边框、
 *   `clipPath` 裁剪、内嵌 `<svg>` 与可选 `<img>/<canvas>`；
 * - `'cad'`：先转换为 `DrawingDocument` 再交给 `SvgSerializer`，与导出的 DXF 100% 同源。
 */

import { parseColorRgba, rgbToHex } from '../core/color';
import { fmtNumber as fmt } from '../core/format';
import { escapeXml } from '../core/xml';
import { SvgSerializer } from '../svg/serializer';
import {
  areBordersUniform,
  hasAnyBorder,
  hasAnyRadius,
  isBorderVisible,
  roundedRectSvgPath,
} from './borders';
import { extractDomScene } from './extract';
import { sceneToDocument } from './to-document';
import type {
  DomBorderSide,
  DomBorderStyle,
  DomRectMm,
  DomScene,
  DomToSvgOptions,
} from './types';

function formatStrokeDash(style: DomBorderStyle, widthMm: number): string {
  const w = Math.max(0.25, widthMm);
  if (style === 'dashed') return ` stroke-dasharray="${fmt(w * 3)},${fmt(w * 2)}"`;
  if (style === 'dotted') return ` stroke-dasharray="${fmt(w)},${fmt(w * 1.6)}"`;
  return '';
}

function formatPaint(
  rawColor: string | undefined | null,
  nodeOpacity: number,
  attrPrefix: 'fill' | 'stroke'
): string | null {
  const rgba = parseColorRgba(rawColor);
  if (!rgba || rgba[3] <= 0.001) return null;
  const effAlpha = rgba[3] * nodeOpacity;
  if (effAlpha <= 0.001) return null;
  const hex = rgbToHex(rgba[0], rgba[1], rgba[2]);
  const opAttr = effAlpha < 0.999 ? ` ${attrPrefix}-opacity="${fmt(effAlpha)}"` : '';
  return `${attrPrefix}="${hex}"${opAttr}`;
}

/** 将内嵌 `<svg>` 源码调整为指定位置和毫米尺寸的嵌套 `<svg>` 元素。 */
function placeNestedSvg(markup: string, rect: DomRectMm, clipAttr: string, opacity: number): string {
  const cleaned = markup.replace(/<\?xml[\s\S]*?\?>/gi, '').trim();
  const openTagMatch = cleaned.match(/^<svg\b([^>]*)>/i);
  if (!openTagMatch) return '';

  const rawAttrs = openTagMatch[1]
    .replace(/\b(?:x|y|width|height)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim();
  const opAttr = opacity < 0.999 ? ` opacity="${fmt(opacity)}"` : '';
  const patchedOpen = `<svg${rawAttrs ? ' ' + rawAttrs : ''} x="${fmt(rect.x)}" y="${fmt(
    rect.y
  )}" width="${fmt(rect.w)}" height="${fmt(rect.h)}"${clipAttr}${opAttr}>`;

  return patchedOpen + cleaned.slice(openTagMatch[0].length);
}

/**
 * 纯计算：将 `DomScene` 序列化为高保真纯矢量 SVG（不含 `<foreignObject>`）。
 */
export function sceneToVisualSvg(scene: DomScene, options: DomToSvgOptions = {}): string {
  const widthMm = Number.isFinite(scene.widthMm) && scene.widthMm > 0 ? scene.widthMm : 1;
  const heightMm = Number.isFinite(scene.heightMm) && scene.heightMm > 0 ? scene.heightMm : 1;
  const includeXmlDeclaration = options.includeXmlDeclaration ?? true;
  const mediaMode = options.mediaMode ?? 'embed';

  const out: string[] = [];
  if (includeXmlDeclaration) {
    out.push('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
  }
  out.push(
    `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${fmt(
      widthMm
    )}mm" height="${fmt(heightMm)}mm" viewBox="0 0 ${fmt(widthMm)} ${fmt(heightMm)}">`
  );

  if (scene.clips.length > 0) {
    out.push('<defs>');
    for (const clip of scene.clips) {
      const r = clip.rect;
      const shape =
        clip.radii && hasAnyRadius(clip.radii)
          ? `<path d="${roundedRectSvgPath(r, clip.radii)}"/>`
          : `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(r.h)}"/>`;
      out.push(`<clipPath id="${escapeXml(clip.id)}">${shape}</clipPath>`);
    }
    out.push('</defs>');
  }

  for (const node of scene.nodes) {
    const clipAttr = node.clipId ? ` clip-path="url(#${escapeXml(node.clipId)})"` : '';

    if (node.kind === 'box') {
      const r = node.rect;
      const fillPaint = formatPaint(node.backgroundColor, node.opacity, 'fill');

      // 1. 背景填充
      if (fillPaint) {
        if (node.quad) {
          const pts = node.quad.map(([px, py]) => `${fmt(px)},${fmt(py)}`).join(' ');
          out.push(`<polygon points="${pts}" ${fillPaint}${clipAttr}/>`);
        } else if (hasAnyRadius(node.radii)) {
          out.push(`<path d="${roundedRectSvgPath(r, node.radii)}" ${fillPaint}${clipAttr}/>`);
        } else {
          out.push(
            `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
              r.h
            )}" ${fillPaint}${clipAttr}/>`
          );
        }
      }

      // 2. 边框描边
      if (!hasAnyBorder(node.borders)) continue;

      if (node.quad) {
        const q = node.quad;
        const edges: ReadonlyArray<{
          side: DomBorderSide;
          a: readonly [number, number];
          b: readonly [number, number];
        }> = [
          { side: node.borders.top, a: q[0], b: q[1] },
          { side: node.borders.right, a: q[1], b: q[2] },
          { side: node.borders.bottom, a: q[2], b: q[3] },
          { side: node.borders.left, a: q[3], b: q[0] },
        ];
        for (const edge of edges) {
          if (!isBorderVisible(edge.side)) continue;
          const strokePaint = formatPaint(edge.side.color, node.opacity, 'stroke');
          if (!strokePaint) continue;
          out.push(
            `<line x1="${fmt(edge.a[0])}" y1="${fmt(edge.a[1])}" x2="${fmt(
              edge.b[0]
            )}" y2="${fmt(edge.b[1])}" ${strokePaint} stroke-width="${fmt(
              edge.side.width
            )}"${formatStrokeDash(edge.side.style, edge.side.width)}${clipAttr}/>`
          );
        }
        continue;
      }

      if (areBordersUniform(node.borders) && node.borders.top.style !== 'double') {
        const side = node.borders.top;
        const strokePaint = formatPaint(side.color, node.opacity, 'stroke');
        if (strokePaint) {
          const dash = formatStrokeDash(side.style, side.width);
          if (hasAnyRadius(node.radii)) {
            out.push(
              `<path d="${roundedRectSvgPath(r, node.radii)}" fill="none" ${strokePaint} stroke-width="${fmt(
                side.width
              )}"${dash}${clipAttr}/>`
            );
          } else {
            out.push(
              `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
                r.h
              )}" fill="none" ${strokePaint} stroke-width="${fmt(side.width)}"${dash}${clipAttr}/>`
            );
          }
        }
        continue;
      }

      const emitSide = (
        side: DomBorderSide,
        x1: number,
        y1: number,
        x2: number,
        y2: number,
        inwardDx: number,
        inwardDy: number
      ): void => {
        if (!isBorderVisible(side)) return;
        const strokePaint = formatPaint(side.color, node.opacity, 'stroke');
        if (!strokePaint) return;
        if (side.style === 'double') {
          const sw = Math.max(0.15, side.width / 3);
          const gap = Math.max(0.25, side.width * 0.65);
          out.push(
            `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(
              y2
            )}" ${strokePaint} stroke-width="${fmt(sw)}"${clipAttr}/>`
          );
          out.push(
            `<line x1="${fmt(x1 + inwardDx * gap)}" y1="${fmt(y1 + inwardDy * gap)}" x2="${fmt(
              x2 + inwardDx * gap
            )}" y2="${fmt(y2 + inwardDy * gap)}" ${strokePaint} stroke-width="${fmt(sw)}"${clipAttr}/>`
          );
        } else {
          out.push(
            `<line x1="${fmt(x1)}" y1="${fmt(y1)}" x2="${fmt(x2)}" y2="${fmt(
              y2
            )}" ${strokePaint} stroke-width="${fmt(side.width)}"${formatStrokeDash(
              side.style,
              side.width
            )}${clipAttr}/>`
          );
        }
      };

      emitSide(node.borders.top, r.x, r.y, r.x + r.w, r.y, 0, 1);
      emitSide(node.borders.right, r.x + r.w, r.y, r.x + r.w, r.y + r.h, -1, 0);
      emitSide(node.borders.bottom, r.x, r.y + r.h, r.x + r.w, r.y + r.h, 0, -1);
      emitSide(node.borders.left, r.x, r.y, r.x, r.y + r.h, 1, 0);
      continue;
    }

    if (node.kind === 'line') {
      const strokePaint = formatPaint(node.color, node.opacity, 'stroke');
      if (!strokePaint) continue;
      out.push(
        `<line x1="${fmt(node.x1)}" y1="${fmt(node.y1)}" x2="${fmt(node.x2)}" y2="${fmt(
          node.y2
        )}" ${strokePaint} stroke-width="${fmt(node.width)}"${formatStrokeDash(
          node.style,
          node.width
        )}${clipAttr}/>`
      );
      continue;
    }

    if (node.kind === 'circle') {
      const fillPaint = formatPaint(node.fillColor, node.opacity, 'fill') ?? 'fill="none"';
      const strokePaint = formatPaint(node.strokeColor, node.opacity, 'stroke');
      const swAttr =
        strokePaint && node.strokeWidth ? ` stroke-width="${fmt(node.strokeWidth)}"` : '';
      out.push(
        `<circle cx="${fmt(node.cx)}" cy="${fmt(node.cy)}" r="${fmt(node.r)}" ${fillPaint}${
          strokePaint ? ' ' + strokePaint : ''
        }${swAttr}${clipAttr}/>`
      );
      continue;
    }

    if (node.kind === 'svg') {
      const nested = placeNestedSvg(node.markup, node.rect, clipAttr, node.opacity);
      if (nested) out.push(nested);
      continue;
    }

    if (node.kind === 'media') {
      const r = node.rect;
      if (mediaMode === 'embed' && node.dataUrl) {
        const opAttr = node.opacity < 0.999 ? ` opacity="${fmt(node.opacity)}"` : '';
        out.push(
          `<image x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
            r.h
          )}" href="${escapeXml(node.dataUrl)}" preserveAspectRatio="none"${clipAttr}${opAttr}/>`
        );
      } else if (mediaMode === 'placeholder') {
        out.push(
          `<rect x="${fmt(r.x)}" y="${fmt(r.y)}" width="${fmt(r.w)}" height="${fmt(
            r.h
          )}" fill="none" stroke="#9ca3af" stroke-width="0.25" stroke-dasharray="1.2,0.8"${clipAttr}/>`
        );
        out.push(
          `<text x="${fmt(r.x + r.w * 0.5)}" y="${fmt(
            r.y + r.h * 0.5
          )}" fill="#6b7280" font-size="${fmt(
            Math.min(3.5, Math.max(1.5, r.h * 0.35))
          )}" text-anchor="middle" dominant-baseline="central"${clipAttr}>${escapeXml(
            `[${node.label}]`
          )}</text>`
        );
      }
      continue;
    }

    if (node.kind === 'text') {
      const fillPaint = formatPaint(node.color, node.opacity, 'fill') ?? 'fill="#111827"';
      const anchor = node.hAlign === 1 ? 'middle' : node.hAlign === 2 ? 'end' : 'start';
      const baseline =
        node.vAlign === 1
          ? 'text-after-edge'
          : node.vAlign === 2
            ? 'central'
            : node.vAlign === 3
              ? 'hanging'
              : 'alphabetic';
      const weightAttr = node.bold ? ' font-weight="bold"' : '';
      const styleAttr = node.italic ? ' font-style="italic"' : '';
      const posAttr =
        Math.abs(node.rot) > 1e-4
          ? `transform="translate(${fmt(node.x)},${fmt(node.y)}) rotate(${fmt(-node.rot)})"`
          : `x="${fmt(node.x)}" y="${fmt(node.y)}"`;

      out.push(
        `<text ${posAttr} ${fillPaint} font-family="${escapeXml(
          node.fontFamily
        )}" font-size="${fmt(
          node.fontSize
        )}"${weightAttr}${styleAttr} text-anchor="${anchor}" dominant-baseline="${baseline}" xml:space="preserve"${clipAttr}>${escapeXml(
          node.text
        )}</text>`
      );
      continue;
    }
  }

  out.push('</svg>');
  return out.join('\n');
}

/**
 * 将浏览器已挂载的 HTML `Element` 转换为纯矢量 SVG 文本。
 */
export function domToSvg(element: Element, options: DomToSvgOptions = {}): string {
  const mode = options.mode ?? 'visual';
  const scene = extractDomScene(element, {
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
