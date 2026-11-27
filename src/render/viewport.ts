/**
 * 视口适配层（依赖 DOM）：测量逻辑视口尺寸，并让 canvas 的 backing store
 * 与 devicePixelRatio 同步，从而在 HiDPI 屏幕上清晰绘制而不被拉伸。
 *
 * 逻辑尺寸（CSS px）与实际像素（canvas.width/height）分开：相机使用逻辑尺寸，
 * 渲染时通过 setTransform(dpr,...) 放大到实际像素。
 */

export interface ViewportMetrics {
  width: number;
  height: number;
  dpr: number;
}

export interface ViewportOptions {
  canvas: HTMLCanvasElement;
  /**
   * CSS 盒子被用来定义逻辑视口尺寸的元素。
   * 可以是 getter，便于调用方切换窗格（如 SVG-only 模式下 canvas 被
   * display:none，量到 0，此时改测另一个元素）。
   */
  measure?: HTMLElement | (() => HTMLElement | null) | null;
  /** devicePixelRatio 的上限，默认 3。 */
  maxDpr?: number;
  /** 逻辑视口最小尺寸，默认 1（不强制拉伸）。 */
  minSize?: number;
  /** 测量元素缺失或尺寸为 0 时的兜底尺寸，默认 800×690。 */
  fallbackSize?: { width: number; height: number };
}

/** DOM 视口适配器。 */
export class Viewport {
  private readonly options: ViewportOptions;
  private lastMetrics: ViewportMetrics | null = null;

  constructor(options: ViewportOptions) {
    this.options = options;
  }

  /** 切换用于测量的元素（不影响已绑定的拖拽/滚轮事件）。 */
  setMeasureElement(element: HTMLElement | (() => HTMLElement | null) | null): void {
    this.options.measure = element;
  }

  /** 取当前测量元素（兼容 getter 形式）。 */
  getMeasureElement(): HTMLElement | null {
    const source = this.options.measure;
    if (!source) return null;
    if (typeof source === 'function') return source();
    return source;
  }

  /** 最近一次 sync() 得到的尺寸指标。 */
  get metrics(): ViewportMetrics | null {
    return this.lastMetrics;
  }

  /**
   * 量测逻辑尺寸并按 DPR 同步 canvas 的实际像素尺寸。
   *
   * 逻辑尺寸取测量元素的 CSS 盒子（四舍五入、不低于 minSize），
   * DPR 取 min(maxDpr, max(1, window.devicePixelRatio))；
   * 仅当实际像素尺寸变化时才写 canvas.width/height（写会清空画布）。
   * 返回：本次的 ViewportMetrics。
   */
  sync(): ViewportMetrics {
    const canvas = this.options.canvas;
    const measure = this.getMeasureElement();
    const rect = measure ? measure.getBoundingClientRect() : null;
    const fallback = this.options.fallbackSize ?? { width: 800, height: 690 };
    const minSize = Math.max(1, this.options.minSize ?? 1);
    const maxDpr = this.options.maxDpr ?? 3;

    const logicalW = Math.max(minSize, Math.round(rect?.width || fallback.width));
    const logicalH = Math.max(minSize, Math.round(rect?.height || fallback.height));
    const win =
      canvas.ownerDocument?.defaultView ?? (typeof window !== 'undefined' ? window : undefined);
    const dpr = Math.min(maxDpr, Math.max(1, win?.devicePixelRatio || 1));

    const targetW = Math.round(logicalW * dpr);
    const targetH = Math.round(logicalH * dpr);
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    const metrics: ViewportMetrics = { width: logicalW, height: logicalH, dpr };
    this.lastMetrics = metrics;
    return metrics;
  }

  /**
   * 把鼠标事件坐标换算成逻辑视口坐标。
   * 参数：event 为含 clientX/clientY 的事件；element 为监听器所挂载的元素
   *       （默认取测量元素）；metrics 可传入以避免重复量测。
   * 返回：逻辑坐标；没有可用元素时返回 null。
   */
  pointFromEvent(
    event: { clientX: number; clientY: number },
    element?: HTMLElement | null,
    metrics?: ViewportMetrics
  ): { x: number; y: number } | null {
    const el = element ?? this.getMeasureElement();
    if (!el) return null;
    const m = metrics ?? this.lastMetrics ?? this.sync();
    const rect = el.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (m.width / Math.max(1, rect.width)),
      y: (event.clientY - rect.top) * (m.height / Math.max(1, rect.height)),
    };
  }
}
