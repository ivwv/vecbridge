/**
 * Canvas 渲染端：用共享相机把 `DocumentData` 画到 2D canvas。
 *
 * 线宽、虚线样式与文本度量刻意与旧渲染器逐字一致（含 1.05 字号系数与
 * 2.2px 的文字剔除），且与 SVG 端共用 core 的样式解析链。
 * 依赖 DOM（canvas 2D context），只在浏览器 render 层使用。
 *
 * 【勿改·坐标符号】tx/ty 与 camera.toScreen 一致：ty 用 offsetY - y*scale；
 * 文字旋转取负（SVG 的 Y 轴向下），与 SVG 端配对保证双视图一致。
 */

import { isBoldText, isPaperCommand, type DecorationOptions } from '../core/decorations';
import { resolveDocumentData, type DocumentLike } from '../core/data';
import { createLayerLookup, resolveCommandStyle } from '../core/style';
import { DEFAULT_TEXT_METRICS, type TextMetricsPolicy } from '../core/text';
import { resolveTheme, type RenderTheme, type ThemeInput } from '../core/theme';
import type { Camera } from './camera';
import type { ViewportMetrics } from './viewport';

/** Canvas 渲染选项。 */
export interface CanvasRendererOptions {
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
}

/** Canvas 2D 渲染器。 */
export class CanvasRenderer {
  private options: CanvasRendererOptions;

  constructor(options: CanvasRendererOptions = {}) {
    this.options = options;
  }

  /** 切换主题。 */
  setTheme(theme: ThemeInput): void {
    this.options = { ...this.options, theme };
  }

  /** 切换装饰配置。 */
  setDecorations(decorations: DecorationOptions): void {
    this.options = { ...this.options, decorations };
  }

  /** 取当前解析后的主题对象。 */
  getTheme(): RenderTheme {
    return resolveTheme(this.options.theme);
  }

  /**
   * 全量重绘一帧。
   *
   * 流程：setTransform(dpr) → 填背景 → 浅色主题下把纸张图框填充为白纸并加阴影
   * → 逐命令按 type 画 line/circle/polyline/text，样式经 core 调用链解析。
   * 【勿改·历史兼容】字号用 canvasSizeFactor（1.05），屏幕上字号 < minCanvasFontPx
   * 的文本直接跳过；AC I 8 用更细线宽。
   */
  render(
    doc: DocumentLike,
    canvas: HTMLCanvasElement,
    camera: Camera,
    metrics: ViewportMetrics
  ): void {
    const data = resolveDocumentData(doc);
    const theme = resolveTheme(this.options.theme);
    const text = { ...DEFAULT_TEXT_METRICS, ...this.options.text };
    const layerLookup = createLayerLookup(data.layers);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = camera.scale;
    const offsetX = camera.offsetX;
    const offsetY = camera.offsetY;
    // 世界 → 屏幕：X 正向、Y 取负，与 camera.toScreen 完全一致。
    const tx = (x: number) => offsetX + x * scale;
    const ty = (y: number) => offsetY - y * scale;

    ctx.save();
    ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
    ctx.fillStyle = theme.background;
    ctx.fillRect(0, 0, metrics.width, metrics.height);

    // 浅色主题：把图框填充为白纸并加柔和阴影，再在其上绘制内容。
    if (!theme.isDark) {
      for (const cmd of data.commands) {
        if (!isPaperCommand(cmd, this.options.decorations)) continue;
        ctx.fillStyle = theme.paper;
        ctx.shadowColor = 'rgba(0,0,0,0.12)';
        ctx.shadowBlur = 10;
        // 填充真实多边形，以支持反向角点 / 旋转的图框。
        ctx.beginPath();
        cmd.points.forEach(([px, py], index) => {
          if (index === 0) ctx.moveTo(tx(px), ty(py));
          else ctx.lineTo(tx(px), ty(py));
        });
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
      }
    }

    for (const cmd of data.commands) {
      // 复用 core 调用链：随层样式 → ACI hex。
      const style = resolveCommandStyle(cmd, layerLookup);
      const strokeColor = theme.resolveAci(style.color);
      ctx.strokeStyle = strokeColor;
      ctx.fillStyle = strokeColor;

      // 线型 → canvas 虚线样式（dash 间距按 scale 缩放，且不小于 1px）。
      if (style.linetype === 'DASHED') {
        ctx.setLineDash([Math.max(1, 1.2 * scale), Math.max(1, 0.9 * scale)]);
      } else if (style.linetype === 'DOT') {
        ctx.setLineDash([Math.max(1, 0.4 * scale), Math.max(1, 0.7 * scale)]);
      } else {
        ctx.setLineDash([]);
      }

      switch (cmd.type) {
        case 'line': {
          ctx.lineWidth = Math.max(0.5, (style.color === 8 ? 0.16 : 0.24) * scale);
          ctx.beginPath();
          ctx.moveTo(tx(cmd.x1), ty(cmd.y1));
          ctx.lineTo(tx(cmd.x2), ty(cmd.y2));
          ctx.stroke();
          break;
        }
        case 'circle': {
          if (!Number.isFinite(cmd.r) || cmd.r <= 0) break;
          ctx.lineWidth = Math.max(0.5, 0.16 * scale);
          ctx.beginPath();
          ctx.arc(tx(cmd.cx), ty(cmd.cy), Math.max(0.3, cmd.r * scale), 0, Math.PI * 2);
          ctx.stroke();
          break;
        }
        case 'polyline': {
          if (cmd.points.length < 2) break;
          ctx.lineWidth = Math.max(
            0.6,
            (cmd.lineWidth > 0 ? cmd.lineWidth : 0.24) * scale
          );
          ctx.beginPath();
          cmd.points.forEach(([px, py], index) => {
            if (index === 0) ctx.moveTo(tx(px), ty(py));
            else ctx.lineTo(tx(px), ty(py));
          });
          if (cmd.closed) ctx.closePath();
          ctx.stroke();
          break;
        }
        case 'text': {
          if (!Number.isFinite(cmd.h) || cmd.h <= 0) break;
          const fontPx = cmd.h * scale * text.canvasSizeFactor;
          // 屏幕字号过小的文本跳过，避免糊成一团。
          if (fontPx < text.minCanvasFontPx) break;

          ctx.save();
          ctx.translate(tx(cmd.x), ty(cmd.y));
          // 旋转取负：canvas 屏幕 Y 向下，与 SVG 端一致。
          if (cmd.rot) ctx.rotate((-cmd.rot * Math.PI) / 180);
          ctx.scale(cmd.widthFactor || text.defaultWidthFactor, 1);

          const isBold = isBoldText(cmd, this.options.decorations);
          ctx.font = `${isBold ? 'bold ' : ''}${fontPx}px ${text.canvasFontFamily}`;

          // 组码 72/73 → canvas 的 textAlign / textBaseline。
          if (cmd.hAlign === 1) ctx.textAlign = 'center';
          else if (cmd.hAlign === 2) ctx.textAlign = 'right';
          else ctx.textAlign = 'left';

          if (cmd.vAlign === 1) ctx.textBaseline = 'bottom';
          else if (cmd.vAlign === 2) ctx.textBaseline = 'middle';
          else if (cmd.vAlign === 3) ctx.textBaseline = 'top';
          else ctx.textBaseline = 'alphabetic';

          ctx.fillText(cmd.text, 0, 0);
          ctx.restore();
          break;
        }
        case 'solid': {
          if (
            cmd.points.length < 3 ||
            !cmd.points.every(([px, py]) => Number.isFinite(px) && Number.isFinite(py))
          ) {
            break;
          }
          ctx.beginPath();
          cmd.points.forEach(([px, py], index) => {
            if (index === 0) ctx.moveTo(tx(px), ty(py));
            else ctx.lineTo(tx(px), ty(py));
          });
          ctx.closePath();
          ctx.fill();
          break;
        }
      }
    }

    ctx.restore();
  }
}
