/**
 * SVG 输出端：把 `DocumentData` 快照序列化为 SVG 文本。
 *
 * 世界坐标（mm，Y 向上）在 SVG 里对 Y 取反（y → -y）——这与 Canvas 相机采用
 * 的约定相同，正是它让两个引擎能共享 1:1 的 viewBox。X 保持不变。
 *
 * 本文件是纯计算、环境无关的，可复用这里的样式解析链（core 层）来保证与
 * DXF/Canvas 视觉一致：resolveCommandStyle → theme.resolveAci → fmtNumber →
 * isPaperCommand/isBoldText。
 */

import { isBoldText, isPaperCommand, type DecorationOptions } from '../core/decorations';
import { resolveDocumentData, type DocumentLike } from '../core/data';
import { fmtNumber as fmt } from '../core/format';
import { createLayerLookup, resolveCommandStyle } from '../core/style';
import { DEFAULT_TEXT_METRICS, type TextMetricsPolicy } from '../core/text';
import { resolveTheme, type ThemeInput } from '../core/theme';
import type { ViewBox } from '../core/types';
import { escapeXml } from '../core/xml';

/** SVG 序列化选项。 */
export interface SvgSerializeOptions {
  /** 'dark' | 'light' | RenderTheme，默认 'dark'。 */
  theme?: ThemeInput;
  /** 'live' 嵌入页面；'export' 会加 xml 声明与 mm 尺寸。 */
  mode?: 'live' | 'export';
  /** 覆盖计算出的 viewBox（用于与 Canvas 相机同步）。 */
  viewBox?: ViewBox | null;
  /** live 根节点 id，默认 'liveSvgElement'；传 null 则省略。 */
  rootId?: string | null;
  /** 世界坐标留白（mm），默认 12。 */
  paddingMm?: number;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  /** 覆盖本次渲染的主题背景色。 */
  backgroundColor?: string;
  /** 默认 export 模式为 true、live 模式为 false。 */
  includeXmlDeclaration?: boolean;
  /**
   * 在文本上输出 `xml:space="preserve"`，保留连续空格（SVG 默认会折叠空格，
   * 与 DXF/Canvas 不同）。默认 true。
   */
  preserveWhitespace?: boolean;
}

/**
 * 把快照序列化为 SVG 字符串。
 *
 * 要点：先算好 viewBox 与背景矩形，再逐命令输出四类图元。
 * 【勿改·坐标符号】所有 y 坐标取负（fmt(-y)），旋转取负（rotate(-rot)），
 * 这是与 Canvas 相机配对的约定，单独翻转会破坏双视图 1:1 对齐。
 * 【勿改·历史兼容】字号用 svgSizeFactor（1.04），与 Canvas 的 1.05 刻意不同。
 */
export class SvgSerializer {
  /**
   * 序列化主流程。
   * 参数：doc 文档（快照或 builder），options 序列化选项。
   * 返回：完整 SVG 文本字符串。
   */
  serialize(doc: DocumentLike, options: SvgSerializeOptions = {}): string {
    const data = resolveDocumentData(doc);
    const theme = resolveTheme(options.theme);
    const mode = options.mode ?? 'live';
    const forExport = mode === 'export';
    const text = { ...DEFAULT_TEXT_METRICS, ...options.text };
    const pad = options.paddingMm ?? 12;
    const layerLookup = createLayerLookup(data.layers);
    const preserveWhitespace = options.preserveWhitespace ?? true;

    const ext = data.extents;
    const minX = ext.minX - pad;
    const maxX = ext.maxX + pad;
    // SVG 的 Y 与世界的 Y 相反：世界最大 Y 对应 SVG 最小 Y。
    const minSvgY = -ext.maxY - pad;
    const maxSvgY = -ext.minY + pad;
    const fullW = maxX - minX;
    const fullH = maxSvgY - minSvgY;

    // 若有外部传入的 viewBox（来自 Canvas 相机）就用它，否则按图幅+留白计算。
    const viewBox = options.viewBox
      ? `${fmt(options.viewBox.x)} ${fmt(options.viewBox.y)} ${fmt(options.viewBox.w)} ${fmt(
          options.viewBox.h
        )}`
      : `${fmt(minX)} ${fmt(minSvgY)} ${fmt(fullW)} ${fmt(fullH)}`;

    const out: string[] = [];

    if (options.includeXmlDeclaration ?? forExport) {
      out.push(`<?xml version="1.0" encoding="UTF-8" standalone="no"?>`);
    }

    // export 模式：加 mm 物理尺寸；live 模式：加 id 与 preserveAspectRatio。
    if (forExport) {
      out.push(
        `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" width="${fmt(fullW)}mm" height="${fmt(
          fullH
        )}mm" viewBox="${viewBox}">`
      );
    } else {
      const rootId = options.rootId === undefined ? 'liveSvgElement' : options.rootId;
      const idAttr = rootId ? ` id="${escapeXml(rootId)}"` : '';
      out.push(
        `<svg xmlns="http://www.w3.org/2000/svg"${idAttr} viewBox="${viewBox}" preserveAspectRatio="xMidYMid meet">`
      );
    }

    const bgFill = escapeXml(options.backgroundColor ?? theme.backgroundFor(mode));
    const effectiveViewBox = options.viewBox ?? { x: minX, y: minSvgY, w: fullW, h: fullH };
    // export 模式：背景矩形精确贴合 viewBox，否则矢量编辑器会看到一块巨大的画布外矩形；
    // live 模式：留出充裕余量（超大图纸按比例放大），保证平移时不会露出硬边。
    const liveMargin = Math.max(5000, fullW * 2, fullH * 2);
    const bg = forExport
      ? effectiveViewBox
      : {
          x: minX - liveMargin,
          y: minSvgY - liveMargin,
          w: fullW + liveMargin * 2,
          h: fullH + liveMargin * 2,
        };
    out.push(
      `<rect x="${fmt(bg.x)}" y="${fmt(bg.y)}" width="${fmt(bg.w)}" height="${fmt(
        bg.h
      )}" fill="${bgFill}"/>`
    );

    // 浅色主题：先用纸张色填充每个图框，再在其上绘制内容。
    if (!theme.isDark) {
      for (const cmd of data.commands) {
        if (!isPaperCommand(cmd, options.decorations)) continue;
        // 用 polygon 而非 min/max 矩形：能处理反向角点、顺时针点序和旋转的图框。
        const points = cmd.points.map(([px, py]) => `${fmt(px)},${fmt(-py)}`).join(' ');
        out.push(`<polygon points="${points}" fill="${escapeXml(theme.paper)}"/>`);
      }
    }

    out.push(`<g stroke-linecap="round" stroke-linejoin="round">`);

    for (const cmd of data.commands) {
      // 复用 core 的调用链解析样式：随层颜色 → ACI → hex、线型 dash、装饰判定。
      const style = resolveCommandStyle(cmd, layerLookup);
      const color = escapeXml(theme.resolveAci(style.color));

      let dashAttr = '';
      if (style.linetype === 'DASHED') dashAttr = ` stroke-dasharray="1.3,0.9"`;
      else if (style.linetype === 'DOT') dashAttr = ` stroke-dasharray="0.4,0.7"`;

      switch (cmd.type) {
        case 'line': {
          // 非有限坐标直接跳过，避免输出 NaN coordinate 破坏 SVG。
          if (
            !Number.isFinite(cmd.x1) ||
            !Number.isFinite(cmd.y1) ||
            !Number.isFinite(cmd.x2) ||
            !Number.isFinite(cmd.y2)
          ) {
            break;
          }
          // ACI 8 用更细的线宽。
          const sw = style.color === 8 ? 0.16 : 0.24;
          out.push(
            `<line x1="${fmt(cmd.x1)}" y1="${fmt(-cmd.y1)}" x2="${fmt(cmd.x2)}" y2="${fmt(
              -cmd.y2
            )}" stroke="${color}" stroke-width="${sw}"${dashAttr}/>`
          );
          break;
        }
        case 'circle': {
          if (
            !Number.isFinite(cmd.cx) ||
            !Number.isFinite(cmd.cy) ||
            !Number.isFinite(cmd.r) ||
            cmd.r <= 0
          ) {
            break;
          }
          out.push(
            `<circle cx="${fmt(cmd.cx)}" cy="${fmt(-cmd.cy)}" r="${fmt(
              cmd.r
            )}" fill="none" stroke="${color}" stroke-width="0.16"${dashAttr}/>`
          );
          break;
        }
        case 'polyline': {
          if (cmd.points.length < 2) break;
          const sw = cmd.lineWidth > 0 ? cmd.lineWidth : 0.24;
          const pts = cmd.points.map(([px, py]) => `${fmt(px)},${fmt(-py)}`).join(' ');
          if (cmd.closed) {
            out.push(
              `<polygon points="${pts}" fill="none" stroke="${color}" stroke-width="${fmt(
                sw
              )}"${dashAttr}/>`
            );
          } else {
            out.push(
              `<polyline points="${pts}" fill="none" stroke="${color}" stroke-width="${fmt(
                sw
              )}"${dashAttr}/>`
            );
          }
          break;
        }
        case 'text': {
          if (
            !Number.isFinite(cmd.x) ||
            !Number.isFinite(cmd.y) ||
            !Number.isFinite(cmd.h) ||
            cmd.h <= 0
          ) {
            break;
          }
          // 组码 72/73 的枚举映射到 SVG 的 text-anchor / dominant-baseline。
          const anchor = cmd.hAlign === 1 ? 'middle' : cmd.hAlign === 2 ? 'end' : 'start';
          const baseline =
            cmd.vAlign === 1
              ? 'text-after-edge'
              : cmd.vAlign === 2
                ? 'central'
                : cmd.vAlign === 3
                  ? 'hanging'
                  : 'alphabetic';
          const fontWeight = isBoldText(cmd, options.decorations) ? 'bold' : 'normal';
          const wf =
            Number.isFinite(cmd.widthFactor) && cmd.widthFactor > 0
              ? cmd.widthFactor
              : text.defaultWidthFactor;
          // 【勿改·历史兼容】字号系数 1.04（svgSizeFactor），勿与 Canvas 统一。
          const fontSize = fmt(cmd.h * text.svgSizeFactor);

          // 先平移到插入点（Y 取负）；旋转取负因为 SVG 的 Y 轴向下；再按宽度系数横向缩放。
          let transform = `translate(${fmt(cmd.x)},${fmt(-cmd.y)})`;
          if (cmd.rot) transform += ` rotate(${fmt(-cmd.rot)})`;
          if (wf !== 1) transform += ` scale(${fmt(wf)},1)`;

          out.push(
            `<text transform="${transform}" fill="${color}" font-family="${escapeXml(
              text.svgFontFamily
            )}" font-size="${fontSize}" font-weight="${fontWeight}" text-anchor="${anchor}" dominant-baseline="${baseline}"${
              preserveWhitespace ? ' xml:space="preserve"' : ''
            }>${escapeXml(cmd.text)}</text>`
          );
          break;
        }
        case 'solid': {
          if (
            cmd.points.length < 3 ||
            !cmd.points.every(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
          ) {
            break;
          }
          const pts = cmd.points.map(([px, py]) => `${fmt(px)},${fmt(-py)}`).join(' ');
          out.push(`<polygon points="${pts}" fill="${color}" stroke="none"/>`);
          break;
        }
      }
    }

    out.push(`</g>`);
    out.push(`</svg>`);
    return out.join('\n');
  }
}

/** 静态便捷出口：环境无关。 */
export class SvgExporter {
  /** 直接把文档序列化为 SVG 文本。 */
  static toText(doc: DocumentLike, options: SvgSerializeOptions = {}): string {
    return new SvgSerializer().serialize(doc, options);
  }
}
