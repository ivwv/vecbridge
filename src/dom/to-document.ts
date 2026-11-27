/**
 * 将 `DomScene`（或浏览器 `Element`）转换为统一的 `DrawingDocument`（IR）。
 *
 * `sceneToDocument()` 纯计算、环境无关，Node 与浏览器均可直接调用；
 * `domToDocument()` 组合 `extractDomScene()` 与 `sceneToDocument()`。
 */

import {
  colorToAci,
  isNearWhiteRgb,
  parseColorRgba,
  sanitizeLayerCandidate,
} from '../core/color';
import { DrawingDocument } from '../core/document';
import type { Linetype } from '../core/types';
import { drawHatch } from '../patterns/hatch';
import { parseSvgToDocument } from '../svg/parser';
import {
  borderStyleToLinetype,
  clipSegmentToRect,
  hasAnyBorder,
  hasAnyRadius,
  intersectRects,
  isBorderVisible,
  isRectOutsideClip,
  mergeAxisAlignedSegments,
  sampleRoundedRectPoints,
  type AxisSegment,
} from './borders';
import { extractDomScene } from './extract';
import type {
  DomBackgroundMode,
  DomBorders,
  DomBorderSide,
  DomClipRect,
  DomConvertOptions,
  DomLayerStrategy,
  DomMediaMode,
  DomRectMm,
  DomScene,
  DomSvgNode,
  DomTextNode,
} from './types';

function pickDominantBorder(borders: DomBorders): DomBorderSide | null {
  for (const side of [borders.top, borders.right, borders.bottom, borders.left]) {
    if (isBorderVisible(side)) return side;
  }
  return null;
}

/**
 * 纯计算转换：将 `DomScene` 场景快照转为 `DrawingDocument` IR。
 *
 * 两阶段输出：先输出纸张/背景/边框/内嵌 SVG/媒体占位并执行表格重边合并，
 * 再统一输出文本命令，确保文字始终清晰叠放于表格边框之上。
 */
export function sceneToDocument(
  scene: DomScene,
  options: DomConvertOptions = {}
): DrawingDocument {
  const doc = new DrawingDocument();
  const widthMm = Number.isFinite(scene.widthMm) && scene.widthMm > 0 ? scene.widthMm : 1;
  const heightMm = Number.isFinite(scene.heightMm) && scene.heightMm > 0 ? scene.heightMm : 1;
  doc.setExtents(0, 0, widthMm, heightMm);

  if (scene.nodes.length === 0) return doc;

  const layerBy: DomLayerStrategy = options.layerBy ?? 'semantic';
  const defaultLayer = sanitizeLayerCandidate(options.defaultLayer, '0');
  const backgroundMode: DomBackgroundMode = options.backgroundMode ?? 'ignore';
  const markRootPaper = options.markRootPaper ?? true;
  const dedupeBorders = options.dedupeBorders ?? true;
  const curveTolerance =
    Number.isFinite(options.curveTolerance) && (options.curveTolerance as number) > 0
      ? (options.curveTolerance as number)
      : 0.1;
  const fontSizeScale =
    Number.isFinite(options.fontSizeScale) && (options.fontSizeScale as number) > 0
      ? (options.fontSizeScale as number)
      : 0.78;
  const mediaMode: DomMediaMode = options.mediaMode ?? 'ignore';
  const clipOverflow = options.clipOverflow ?? true;
  const maxPrimitives =
    options.maxPrimitives === undefined
      ? 200_000
      : Number.isFinite(options.maxPrimitives) && options.maxPrimitives > 0
        ? Math.floor(options.maxPrimitives)
        : 0;

  const clipMap = new Map<string, DomClipRect>();
  for (const clip of scene.clips) clipMap.set(clip.id, clip);

  const registeredLayers = new Set<string>(['0']);
  const resolveLayer = (
    semanticName: string,
    hint: string | null | undefined,
    color: number,
    linetype: Linetype | null
  ): string => {
    let candidate = defaultLayer;
    if (layerBy === 'semantic') {
      candidate = hint ? sanitizeLayerCandidate(hint, semanticName) : semanticName;
    } else if (layerBy === 'id') {
      candidate = sanitizeLayerCandidate(hint, defaultLayer);
    } else if (layerBy === 'color') {
      candidate = `COLOR_${color}`;
    }
    const safe = sanitizeLayerCandidate(candidate, defaultLayer);
    if (!registeredLayers.has(safe)) {
      registeredLayers.add(safe);
      doc.addLayer(safe, color, linetype ?? 'CONTINUOUS');
    }
    return safe;
  };

  let emitted = 0;
  const canEmit = (): boolean => maxPrimitives === 0 || emitted < maxPrimitives;
  const remaining = (): number =>
    maxPrimitives === 0 ? 0 : Math.max(0, maxPrimitives - emitted);

  const toWorldY = (yMm: number): number => heightMm - yMm;
  const pendingSegments: AxisSegment[] = [];
  const pendingTexts: DomTextNode[] = [];

  const pushBorderSegment = (
    x1Mm: number,
    y1Mm: number,
    x2Mm: number,
    y2Mm: number,
    layer: string,
    color: number,
    linetype: Linetype | null,
    lineWidth: number,
    clip: DomRectMm | null
  ): void => {
    let sx1 = x1Mm;
    let sy1 = y1Mm;
    let sx2 = x2Mm;
    let sy2 = y2Mm;
    if (clip) {
      const clipped = clipSegmentToRect(sx1, sy1, sx2, sy2, clip);
      if (!clipped) return;
      [sx1, sy1, sx2, sy2] = clipped;
    }

    const wy1 = toWorldY(sy1);
    const wy2 = toWorldY(sy2);

    if (dedupeBorders) {
      pendingSegments.push({
        x1: sx1,
        y1: wy1,
        x2: sx2,
        y2: wy2,
        layer,
        color,
        linetype,
        lineWidth,
      });
    } else if (canEmit()) {
      if (lineWidth > 0.35) {
        doc.addPolyline(
          [
            [sx1, wy1],
            [sx2, wy2],
          ],
          layer,
          color,
          false,
          lineWidth,
          linetype ? { linetype } : undefined
        );
      } else {
        doc.addLine(sx1, wy1, sx2, wy2, layer, color, linetype);
      }
      emitted++;
    }
  };

  const emitEmbeddedSvg = (node: DomSvgNode, clip: DomRectMm | null): void => {
    if (!canEmit()) return;
    if (clip && isRectOutsideClip(node.rect, clip)) return;
    const vb = node.viewBox;
    if (vb.w <= 0 || vb.h <= 0 || node.rect.w <= 0 || node.rect.h <= 0) return;

    const scale = Math.min(node.rect.w / vb.w, node.rect.h / vb.h);
    const renderedW = vb.w * scale;
    const renderedH = vb.h * scale;
    const padX = (node.rect.w - renderedW) * 0.5;
    const padY = (node.rect.h - renderedH) * 0.5;
    const shiftX = node.rect.x + padX - vb.x * scale;
    const shiftY = heightMm - (node.rect.y + padY + renderedH);

    const svgDefaultLayer = resolveLayer('DOM_SVG', node.layerHint, 7, null);
    const subDoc = parseSvgToDocument(node.markup, {
      yAxis: 'flip-viewbox',
      scale,
      curveTolerance,
      layerBy: layerBy === 'single' ? 'single' : layerBy === 'color' ? 'color' : 'group-id',
      defaultLayer: svgDefaultLayer,
      ignoreBackground: true,
      maxPrimitives: remaining(),
    });

    for (const lay of subDoc.layers) {
      if (!registeredLayers.has(lay.name)) {
        registeredLayers.add(lay.name);
        doc.addLayer(lay.name, lay.color, lay.linetype);
      }
    }

    for (const cmd of subDoc.commands) {
      if (!canEmit()) break;
      const targetLayer = layerBy === 'single' ? defaultLayer : cmd.layer;
      switch (cmd.type) {
        case 'line':
          doc.addLine(
            cmd.x1 + shiftX,
            cmd.y1 + shiftY,
            cmd.x2 + shiftX,
            cmd.y2 + shiftY,
            targetLayer,
            cmd.color,
            cmd.linetype ?? null
          );
          emitted++;
          break;
        case 'circle':
          doc.addCircle(
            cmd.cx + shiftX,
            cmd.cy + shiftY,
            cmd.r,
            targetLayer,
            cmd.color,
            cmd.linetype ?? null
          );
          emitted++;
          break;
        case 'polyline':
          doc.addPolyline(
            cmd.points.map(([px, py]) => [px + shiftX, py + shiftY] as const),
            targetLayer,
            cmd.color,
            cmd.closed,
            cmd.lineWidth,
            cmd.linetype ? { linetype: cmd.linetype } : undefined
          );
          emitted++;
          break;
        case 'text':
          doc.addText(
            cmd.x + shiftX,
            cmd.y + shiftY,
            cmd.h,
            cmd.text,
            targetLayer,
            cmd.color,
            cmd.rot,
            cmd.hAlign,
            cmd.vAlign,
            cmd.widthFactor,
            cmd.bold ? { bold: true } : undefined
          );
          emitted++;
          break;
        case 'solid':
          doc.addSolid(
            cmd.points.map(([px, py]) => [px + shiftX, py + shiftY] as const),
            targetLayer,
            cmd.color
          );
          emitted++;
          break;
      }
    }
  };

  // Pass 1: 纸张/背景/边框/线条/圆/内嵌 SVG/媒体占位
  for (const node of scene.nodes) {
    if (!canEmit()) break;

    if (node.kind === 'text') {
      pendingTexts.push(node);
      continue;
    }

    const clip = clipOverflow && node.clipId ? (clipMap.get(node.clipId)?.rect ?? null) : null;

    if (node.kind === 'box') {
      if (clip && isRectOutsideClip(node.rect, clip)) continue;

      const bgRgba = parseColorRgba(node.backgroundColor);
      const hasVisibleBg = !!bgRgba && bgRgba[3] > 0.01;
      const isWhiteBg = hasVisibleBg && isNearWhiteRgb(bgRgba[0], bgRgba[1], bgRgba[2]);

      // 根容器白底标记为 paper 矩形（供浅色主题 Canvas/SVG 填白纸）
      if (node.isRoot && markRootPaper && (isWhiteBg || !hasVisibleBg)) {
        const frameLayer = resolveLayer('DOM_FRAME', node.layerHint, 8, null);
        doc.addRect(0, 0, widthMm, heightMm, frameLayer, 8, 0, { paper: true });
        emitted++;
      }

      // 非白色背景处理策略（ignore / outline / hatch）
      if (hasVisibleBg && !isWhiteBg && backgroundMode !== 'ignore') {
        const bgColor = colorToAci(node.backgroundColor);
        const fillLayer = resolveLayer('DOM_FILL', node.layerHint, bgColor, null);
        const targetRect = clip ? intersectRects(node.rect, clip) : node.rect;
        if (targetRect) {
          if (backgroundMode === 'hatch') {
            const beforeCount = doc.commands.length;
            drawHatch(
              doc,
              targetRect.x,
              toWorldY(targetRect.y + targetRect.h),
              targetRect.x + targetRect.w,
              toWorldY(targetRect.y),
              'diagonal',
              fillLayer,
              bgColor,
              { maxPrimitives: remaining() }
            );
            emitted += doc.commands.length - beforeCount;
          } else if (backgroundMode === 'solid' && canEmit()) {
            const beforeCount = doc.commands.length;
            if (node.quad && !clip) {
              doc.addSolid(
                node.quad.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor
              );
            } else if (hasAnyRadius(node.radii) && !clip) {
              const pts = sampleRoundedRectPoints(node.rect, node.radii, curveTolerance);
              doc.addSolid(
                pts.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor
              );
            } else {
              doc.addSolidRect(
                targetRect.x,
                toWorldY(targetRect.y + targetRect.h),
                targetRect.x + targetRect.w,
                toWorldY(targetRect.y),
                fillLayer,
                bgColor
              );
            }
            emitted += doc.commands.length - beforeCount;
          } else if (backgroundMode === 'outline' && !hasAnyBorder(node.borders) && canEmit()) {
            if (node.quad) {
              doc.addPolyline(
                node.quad.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor,
                true,
                0
              );
              emitted++;
            } else if (hasAnyRadius(node.radii) && !clip) {
              const pts = sampleRoundedRectPoints(node.rect, node.radii, curveTolerance);
              doc.addPolyline(
                pts.map(([px, py]) => [px, toWorldY(py)] as const),
                fillLayer,
                bgColor,
                true,
                0
              );
              emitted++;
            } else {
              doc.addRect(
                targetRect.x,
                toWorldY(targetRect.y + targetRect.h),
                targetRect.x + targetRect.w,
                toWorldY(targetRect.y),
                fillLayer,
                bgColor,
                0
              );
              emitted++;
            }
          }
        }
      }

      // 边框绘制
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
          const color = colorToAci(edge.side.color);
          const lt = borderStyleToLinetype(edge.side.style);
          const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
          pushBorderSegment(
            edge.a[0],
            edge.a[1],
            edge.b[0],
            edge.b[1],
            layer,
            color,
            lt,
            edge.side.width,
            clip
          );
        }
        continue;
      }

      if (hasAnyRadius(node.radii) && !clip) {
        const dominant = pickDominantBorder(node.borders);
        if (dominant && canEmit()) {
          const color = colorToAci(dominant.color);
          const lt = borderStyleToLinetype(dominant.style);
          const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
          const pts = sampleRoundedRectPoints(node.rect, node.radii, curveTolerance);
          if (pts.length >= 2) {
            doc.addPolyline(
              pts.map(([px, py]) => [px, toWorldY(py)] as const),
              layer,
              color,
              true,
              dominant.width > 0.35 ? dominant.width : 0,
              lt ? { linetype: lt } : undefined
            );
            emitted++;
          }
        }
        continue;
      }

      const { x, y, w, h } = node.rect;
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
        const color = colorToAci(side.color);
        const lt = borderStyleToLinetype(side.style);
        const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
        if (side.style === 'double') {
          const gap = Math.max(0.25, side.width * 0.65);
          pushBorderSegment(x1, y1, x2, y2, layer, color, null, 0, clip);
          pushBorderSegment(
            x1 + inwardDx * gap,
            y1 + inwardDy * gap,
            x2 + inwardDx * gap,
            y2 + inwardDy * gap,
            layer,
            color,
            null,
            0,
            clip
          );
        } else {
          pushBorderSegment(x1, y1, x2, y2, layer, color, lt, side.width, clip);
        }
      };

      emitSide(node.borders.top, x, y, x + w, y, 0, 1);
      emitSide(node.borders.right, x + w, y, x + w, y + h, -1, 0);
      emitSide(node.borders.bottom, x, y + h, x + w, y + h, 0, -1);
      emitSide(node.borders.left, x, y, x, y + h, 1, 0);
      continue;
    }

    if (node.kind === 'line') {
      const color = colorToAci(node.color);
      const lt = borderStyleToLinetype(node.style);
      const layer = resolveLayer('DOM_BORDER', node.layerHint, color, lt);
      pushBorderSegment(node.x1, node.y1, node.x2, node.y2, layer, color, lt, node.width, clip);
      continue;
    }

    if (node.kind === 'circle') {
      if (!canEmit() || node.r <= 1e-4) continue;
      const box: DomRectMm = {
        x: node.cx - node.r,
        y: node.cy - node.r,
        w: node.r * 2,
        h: node.r * 2,
      };
      if (clip && isRectOutsideClip(box, clip)) continue;
      const color = colorToAci(node.strokeColor || node.fillColor || '#111827');
      const layer = resolveLayer('DOM_BORDER', node.layerHint, color, null);
      doc.addCircle(node.cx, toWorldY(node.cy), node.r, layer, color);
      emitted++;
      continue;
    }

    if (node.kind === 'svg') {
      emitEmbeddedSvg(node, clip);
      continue;
    }

    if (node.kind === 'media') {
      if (mediaMode !== 'placeholder' || !canEmit()) continue;
      if (clip && isRectOutsideClip(node.rect, clip)) continue;
      const r = clip ? intersectRects(node.rect, clip) : node.rect;
      if (!r) continue;
      const mediaLayer = resolveLayer('DOM_MEDIA', node.layerHint, 8, 'DASHED');
      const wyBot = toWorldY(r.y + r.h);
      const wyTop = toWorldY(r.y);
      doc.addRect(r.x, wyBot, r.x + r.w, wyTop, mediaLayer, 8, 0);
      doc.addLine(r.x, wyBot, r.x + r.w, wyTop, mediaLayer, 8, 'DASHED');
      doc.addLine(r.x, wyTop, r.x + r.w, wyBot, mediaLayer, 8, 'DASHED');
      emitted += 3;
      if (canEmit() && r.h >= 3) {
        doc.addText(
          r.x + r.w * 0.5,
          (wyBot + wyTop) * 0.5,
          Math.min(3, r.h * 0.35),
          `[${node.label}]`,
          mediaLayer,
          8,
          0,
          1,
          2,
          0.85
        );
        emitted++;
      }
      continue;
    }
  }

  // 刷出合并后的边框线段
  if (dedupeBorders && pendingSegments.length > 0) {
    const merged = mergeAxisAlignedSegments(pendingSegments);
    for (const seg of merged) {
      if (!canEmit()) break;
      if (seg.lineWidth > 0.35) {
        doc.addPolyline(
          [
            [seg.x1, seg.y1],
            [seg.x2, seg.y2],
          ],
          seg.layer,
          seg.color,
          false,
          seg.lineWidth,
          seg.linetype ? { linetype: seg.linetype } : undefined
        );
      } else {
        doc.addLine(seg.x1, seg.y1, seg.x2, seg.y2, seg.layer, seg.color, seg.linetype);
      }
      emitted++;
    }
  }

  // Pass 2: 统一输出文本，保证叠放于边框线之上
  for (const node of pendingTexts) {
    if (!canEmit()) break;
    const clip = clipOverflow && node.clipId ? (clipMap.get(node.clipId)?.rect ?? null) : null;
    if (clip && isRectOutsideClip(node.rect, clip)) continue;

    const color = colorToAci(node.color);
    const layer = resolveLayer('DOM_TEXT', node.layerHint, color, null);
    const h = Math.max(0.5, node.fontSize * fontSizeScale);
    doc.addText(
      node.x,
      toWorldY(node.y),
      h,
      node.text,
      layer,
      color,
      node.rot,
      node.hAlign,
      node.vAlign,
      0.85,
      node.bold ? { bold: true } : undefined
    );
    emitted++;
  }

  return doc;
}

/**
 * 将浏览器已挂载的 HTML `Element` 转换为统一 IR `DrawingDocument`。
 *
 * 返回的文档可直接交给 `DxfExporter`、`SvgExporter` 或 `DualViewPreview`。
 */
export function domToDocument(
  element: Element,
  options: DomConvertOptions = {}
): DrawingDocument {
  const scene = extractDomScene(element, options);
  return sceneToDocument(scene, options);
}
