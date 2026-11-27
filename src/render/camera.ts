/**
 * 相机（世界 mm / Y 向上 ↔ 屏幕 px / Y 向下 的坐标变换）。
 *
 * 注意：下面的符号约定是"承重"的（load-bearing），全库双视图对齐都靠它：
 *   screenY = offsetY - worldY * scale
 *   SVG viewBox y = -offsetY / scale
 * 因此对坐标为 -worldY 的 SVG 文档有：
 *   (svgY - vb.y) * scale = offsetY - worldY * scale = screenY
 * 【勿改·坐标符号】单独翻转其中任何一个符号，都会让两个预览窗格相对上下颠倒。
 * 公式与正负号必须原样保留；SVG 序列化端也用同样的 y→-y 约定与之配对。
 */

import type { Extents, ViewBox } from '../core/types';

/** 相机状态：缩放比例 + X/Y 方向偏移。 */
export interface CameraState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

/** 缩放比例的限制范围。 */
export interface CameraLimits {
  minScale: number;
  maxScale: number;
}

/** 视口尺寸的最小结构（宽高，单位px）。 */
export interface MetricsLike {
  width: number;
  height: number;
}

/** 相机：同一个实例同时驱动 Canvas 的 setTransform 与 SVG 的 viewBox。 */
export class Camera {
  private _scale: number;
  private _offsetX: number;
  private _offsetY: number;

  /** 默认 scale=1、偏移 0；可用局部状态覆盖。 */
  constructor(state?: Partial<CameraState>) {
    this._scale = state?.scale ?? 1;
    this._offsetX = state?.offsetX ?? 0;
    this._offsetY = state?.offsetY ?? 0;
  }

  /** 当前缩放比例。 */
  get scale(): number {
    return this._scale;
  }

  /** 当前 X 偏移（px）。 */
  get offsetX(): number {
    return this._offsetX;
  }

  /** 当前 Y 偏移（px）。 */
  get offsetY(): number {
    return this._offsetY;
  }

  /** 取出完整相机状态快照。 */
  getState(): CameraState {
    return { scale: this._scale, offsetX: this._offsetX, offsetY: this._offsetY };
  }

  /** 用局部状态覆盖相机（只覆盖显式给出的字段）。 */
  setState(state: Partial<CameraState>): void {
    if (state.scale !== undefined) this._scale = state.scale;
    if (state.offsetX !== undefined) this._offsetX = state.offsetX;
    if (state.offsetY !== undefined) this._offsetY = state.offsetY;
  }

  /**
   * 把世界图幅范围适配到视口（padding 以世界 mm 计）。
   *
   * 取 min(scaleX, scaleY) 保证完整放入；再把图幅中心对齐到视口中心。
   * 退化输入（非法/倒置的范围、零视口、负 padding）会被忽略，避免用
   * Infinity 或负 scale 污染相机。
   * 注意：offsetY 这里用【加号】，与 getViewBox() 里的减号成对。
   */
  fit(extents: Extents, metrics: MetricsLike, paddingPx = 16): void {
    if (
      !Number.isFinite(extents.minX) ||
      !Number.isFinite(extents.maxX) ||
      !Number.isFinite(extents.minY) ||
      !Number.isFinite(extents.maxY) ||
      extents.maxX < extents.minX ||
      extents.maxY < extents.minY ||
      !Number.isFinite(paddingPx) ||
      paddingPx < 0
    ) {
      return;
    }

    const worldW = extents.maxX - extents.minX + paddingPx * 2;
    const worldH = extents.maxY - extents.minY + paddingPx * 2;

    // 退化的图幅/视口不能把相机污染成 Infinity 或负 scale。
    if (
      !Number.isFinite(worldW) ||
      !Number.isFinite(worldH) ||
      worldW <= 0 ||
      worldH <= 0 ||
      !Number.isFinite(metrics.width) ||
      !Number.isFinite(metrics.height) ||
      metrics.width <= 0 ||
      metrics.height <= 0
    ) {
      return;
    }

    const scaleX = metrics.width / worldW;
    const scaleY = metrics.height / worldH;
    this._scale = Math.min(scaleX, scaleY);

    const centerX = (extents.minX + extents.maxX) / 2;
    const centerY = (extents.minY + extents.maxY) / 2;
    this._offsetX = metrics.width / 2 - centerX * this._scale;
    // 注意：加号——与 getViewBox() 里的负号成对。
    this._offsetY = metrics.height / 2 + centerY * this._scale;
  }

  /** 世界坐标 → 屏幕坐标（Y 在这里取负）。 */
  toScreen(x: number, y: number): { x: number; y: number } {
    return {
      x: this._offsetX + x * this._scale,
      y: this._offsetY - y * this._scale,
    };
  }

  /** toScreen 的逆变换：屏幕点 → 世界坐标；scale 非法时原样返回。 */
  toWorld(px: number, py: number): { x: number; y: number } {
    if (!Number.isFinite(this._scale) || this._scale <= 0) {
      return { x: px, y: py };
    }
    return {
      x: (px - this._offsetX) / this._scale,
      y: (this._offsetY - py) / this._scale,
    };
  }

  /**
   * 生成与 Canvas 1:1 的等价 SVG viewBox。
   * 注意：y 用【负号】，与 fit() 里的加号成对；scale 非法时回退到视口尺寸。
   */
  getViewBox(metrics: MetricsLike): ViewBox {
    if (!Number.isFinite(this._scale) || this._scale <= 0) {
      return {
        x: 0,
        y: 0,
        w: Number.isFinite(metrics.width) && metrics.width > 0 ? metrics.width : 1,
        h: Number.isFinite(metrics.height) && metrics.height > 0 ? metrics.height : 1,
      };
    }
    return {
      x: -this._offsetX / this._scale,
      // 注意：负号——与 fit() 里的加号成对。
      y: -this._offsetY / this._scale,
      w: metrics.width / this._scale,
      h: metrics.height / this._scale,
    };
  }

  /**
   * 以屏幕点 (px,py) 为中心缩放，并把结果 scale 钳制到 limits 内。
   * 关键是缩放后调整偏移，使锚点在世界坐标里保持不动（滚轮以鼠标为中心）。
   */
  zoomAt(
    px: number,
    py: number,
    factor: number,
    limits: CameraLimits = { minScale: 0.2, maxScale: 50 }
  ): void {
    if (!Number.isFinite(factor) || factor <= 0) return;
    if (!Number.isFinite(this._scale) || this._scale <= 0) return;

    const newScale = Math.max(
      limits.minScale,
      Math.min(limits.maxScale, this._scale * factor)
    );
    const ratio = newScale / this._scale;

    this._offsetX = px - (px - this._offsetX) * ratio;
    this._offsetY = py - (py - this._offsetY) * ratio;
    this._scale = newScale;
  }

  /** 按屏幕空间的位移量平移（逻辑 px，拖拽用）。 */
  panBy(dx: number, dy: number): void {
    this._offsetX += dx;
    this._offsetY += dy;
  }
}
