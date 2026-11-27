/**
 * 双视图预览门面（Facade + Observer），render 层的核心编排者。
 *
 * 一个共享的 `Camera` 同时驱动 Canvas 2D 变换与 SVG viewBox，让两个窗格
 * 始终保持 1:1 对齐。滚轮缩放与拖拽平移绑定到给定窗格；每次相机变化都会
 * 全量重绘 Canvas，但 SVG 只更新 viewBox 属性（除非内容真的变了）。
 *
 * 这是一个显式状态机，四个关键状态：
 *  - destroyed：destroy() 后所有公开方法守卫返回，不再工作；
 *  - drag：null 或 {element,lastX,lastY}，表示正在拖拽平移；
 *  - needsFullSvgRender：true 时下次 draw 全量重建 SVG，否则只更新 viewBox；
 *  - limits：当前缩放包络，fit() 时从不可变的 baseLimits 重算，避免跨文档泄漏。
 *
 * 事件用 AbortController.signal 统一绑定，destroy() 时一次性解绑全部监听。
 */

import type { DecorationOptions } from '../core/decorations';
import { resolveDocumentData, type DocumentLike } from '../core/data';
import type { TextMetricsPolicy } from '../core/text';
import { resolveTheme, type RenderTheme, type ThemeInput } from '../core/theme';
import type { DocumentData } from '../core/types';
import { Camera, type CameraLimits, type CameraState } from './camera';
import { CanvasRenderer } from './canvas-renderer';
import { Emitter } from './emitter';
import { SvgLiveView } from './svg-live-view';
import { Viewport, type ViewportMetrics } from './viewport';

/** 触发重绘的原因，随 render 事件发出。 */
export type RenderReason =
  | 'fit'
  | 'zoom'
  | 'pan'
  | 'resize'
  | 'document'
  | 'theme'
  | 'clear'
  | 'manual';

/** 门面对外发出的事件及其载荷类型。 */
export interface DualViewEvents {
  render: { reason: RenderReason };
  cameraChange: CameraState;
  documentChange: DocumentData | null;
  themeChange: RenderTheme;
  destroy: undefined;
}

/** 门面构造选项。 */
export interface DualViewOptions {
  canvas: HTMLCanvasElement;
  svgContainer: HTMLElement;
  /**
   * 用于测量逻辑尺寸的元素。可见窗格会变化时传 getter（如 SVG-only 模式）。
   * 默认取 canvas 的父元素。
   */
  measure?: HTMLElement | (() => HTMLElement | null) | null;
  /** 接收滚轮/拖拽事件的元素，默认 [canvas, svgContainer]。 */
  panes?: HTMLElement[];
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  camera?: Camera;
  limits?: CameraLimits;
  zoomStep?: { in: number; out: number };
  paddingPx?: number;
  svgRootId?: string | null;
  /** SVG 文本是否输出 `xml:space="preserve"`，默认 true。 */
  preserveWhitespace?: boolean;
  listenWindowResize?: boolean;
  maxDpr?: number;
}

/** 双视图预览门面。 */
export class DualViewPreview {
  readonly camera: Camera;
  readonly viewport: Viewport;

  private readonly options: DualViewOptions;
  private readonly renderer: CanvasRenderer;
  private readonly svgView: SvgLiveView;
  private readonly emitter = new Emitter<DualViewEvents>();
  private readonly abort: AbortController;
  private readonly baseLimits: CameraLimits;
  private limits: CameraLimits;

  private doc: DocumentData | null = null;
  private needsFullSvgRender = true;
  private drag: { element: HTMLElement; lastX: number; lastY: number } | null = null;
  private destroyed = false;

  /** 组装相机/视口/两个渲染端/事件器，并绑定交互事件。 */
  constructor(options: DualViewOptions) {
    this.options = options;
    const ownerWindow = options.canvas.ownerDocument?.defaultView;
    const AbortCtor = ownerWindow?.AbortController ?? AbortController;
    this.abort = new AbortCtor();
    this.baseLimits = options.limits ?? { minScale: 0.2, maxScale: 50 };
    this.limits = { ...this.baseLimits };
    this.camera = options.camera ?? new Camera();
    this.viewport = new Viewport({
      canvas: options.canvas,
      measure: options.measure ?? options.canvas.parentElement ?? null,
      maxDpr: options.maxDpr,
    });
    this.renderer = new CanvasRenderer({
      theme: options.theme,
      decorations: options.decorations,
      text: options.text,
    });
    this.svgView = new SvgLiveView(options.svgContainer, {
      theme: options.theme,
      decorations: options.decorations,
      text: options.text,
      rootId: options.svgRootId,
      preserveWhitespace: options.preserveWhitespace,
    });
    this.bindEvents();
  }

  /** 当前文档快照。 */
  get document(): DocumentData | null {
    return this.doc;
  }

  /** 当前解析后的主题。 */
  get theme(): RenderTheme {
    return this.renderer.getTheme();
  }

  /**
   * 设置文档：归一化快照、置全量渲染标志、发 documentChange；
   * doc 为 null 则清空；options.fit 决定适配视图还是直接重绘。
   */
  setDocument(doc: DocumentLike | null, options: { fit?: boolean } = {}): void {
    if (this.destroyed) return;
    this.doc = doc ? resolveDocumentData(doc) : null;
    this.needsFullSvgRender = true;
    this.emitter.emit('documentChange', this.doc);

    if (!this.doc) {
      this.clear();
      return;
    }
    if (options.fit) this.fit();
    else this.draw('document');
  }

  /** 切换主题并强制全量重建 SVG（颜色会变）。 */
  setTheme(theme: ThemeInput): void {
    if (this.destroyed) return;
    this.renderer.setTheme(theme);
    this.svgView.setTheme(theme);
    this.needsFullSvgRender = true;
    if (this.doc) this.draw('theme');
    else this.clear();
    this.emitter.emit('themeChange', resolveTheme(theme));
  }

  /** 切换装饰配置并强制全量重建 SVG。 */
  setDecorations(decorations: DecorationOptions): void {
    if (this.destroyed) return;
    this.renderer.setDecorations(decorations);
    this.svgView.setDecorations(decorations);
    this.needsFullSvgRender = true;
    if (this.doc) this.draw('theme');
  }

  /** 切换测量元素（拖拽/滚轮绑定保持不变）。 */
  setMeasureElement(element: HTMLElement | (() => HTMLElement | null) | null): void {
    if (this.destroyed) return;
    this.viewport.setMeasureElement(element);
  }

  /**
   * 适配视图：相机 fit 后，从不可变的 baseLimits 派生新的缩放包络
   * （在 fit 后的 scale 上下各留一半/两倍余量），这样超大/超小图纸既能
   * 继续缩放，又不会把上一次的 limits 泄漏到后续文档。
   */
  fit(): void {
    if (this.destroyed) return;
    const metrics = this.viewport.sync();
    if (this.doc) {
      this.camera.fit(this.doc.extents, metrics, this.options.paddingPx ?? 16);
      const scale = this.camera.scale;
      if (Number.isFinite(scale) && scale > 0) {
        this.limits = {
          minScale: Math.min(this.baseLimits.minScale, scale * 0.5),
          maxScale: Math.max(this.baseLimits.maxScale, scale * 2),
        };
      } else {
        this.limits = { ...this.baseLimits };
      }
    } else {
      this.limits = { ...this.baseLimits };
    }
    this.draw('fit', metrics);
  }

  /** 重置视图（等同 fit）。 */
  resetView(): void {
    this.fit();
  }

  /** 以当前相机状态重绘一帧。 */
  render(reason: RenderReason = 'manual'): void {
    if (this.destroyed) return;
    this.draw(reason);
  }

  /** 清空两端：canvas 填背景色、SVG 清子树、置全量渲染标志。 */
  clear(): void {
    if (this.destroyed) return;
    const metrics = this.viewport.sync();
    const ctx = this.options.canvas.getContext('2d');
    if (ctx) {
      ctx.save();
      ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
      ctx.fillStyle = this.renderer.getTheme().background;
      ctx.fillRect(0, 0, metrics.width, metrics.height);
      ctx.restore();
    }
    this.svgView.clear();
    this.needsFullSvgRender = true;
    this.emitter.emit('render', { reason: 'clear' });
  }

  /** 订阅事件；destroy() 后订阅返回空操作。 */
  on<K extends keyof DualViewEvents>(
    event: K,
    listener: (payload: DualViewEvents[K]) => void
  ): () => void {
    if (this.destroyed) return () => undefined;
    return this.emitter.on(event, listener);
  }

  /** 取消订阅。 */
  off<K extends keyof DualViewEvents>(
    event: K,
    listener: (payload: DualViewEvents[K]) => void
  ): void {
    if (this.destroyed) return;
    this.emitter.off(event, listener);
  }

  /** 销毁：一次性解绑全部事件、清空资源、发 destroy 并清事件器。 */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.abort.abort();
    this.svgView.clear();
    this.emitter.emit('destroy', undefined);
    this.emitter.clear();
    this.doc = null;
    this.drag = null;
  }

  /**
   * 核心渲染编排：Canvas 总是全量重绘；SVG 视 needsFullSvgRender 标志
   *（或尚无内容、或 forceFullSvg）决定全量重建还是仅 setViewBox。
   * 最后发 render 与 cameraChange 事件。
   */
  private draw(
    reason: RenderReason,
    metrics?: ViewportMetrics,
    forceFullSvg = false
  ): void {
    if (!this.doc) {
      this.clear();
      return;
    }
    const m = metrics ?? this.viewport.sync();
    this.renderer.render(this.doc, this.options.canvas, this.camera, m);

    const viewBox = this.camera.getViewBox(m);
    if (forceFullSvg || this.needsFullSvgRender || !this.svgView.hasRenderedContent) {
      this.svgView.render(this.doc, viewBox);
      this.needsFullSvgRender = false;
    } else {
      this.svgView.setViewBox(viewBox);
    }

    this.emitter.emit('render', { reason });
    this.emitter.emit('cameraChange', this.camera.getState());
  }

  /** 用 AbortController.signal 统一绑定 wheel/mousedown/mousemove/up/blur/resize。 */
  private bindEvents(): void {
    const win =
      this.options.canvas.ownerDocument?.defaultView ??
      (typeof window !== 'undefined' ? window : null);
    if (!win) return;
    const signal = this.abort.signal;
    const panes = this.options.panes ?? [this.options.canvas, this.options.svgContainer];

    for (const pane of panes) {
      pane.addEventListener('wheel', this.onWheel as EventListener, {
        passive: false,
        signal,
      });
      pane.addEventListener('mousedown', this.onMouseDown as EventListener, { signal });
    }
    win.addEventListener('mousemove', this.onMouseMove as EventListener, { signal });
    win.addEventListener('mouseup', this.onMouseUp as EventListener, { signal });
    win.addEventListener('blur', this.onWindowBlur, { signal });
    if (this.options.listenWindowResize !== false) {
      win.addEventListener('resize', this.onResize, { signal });
    }
  }

  /** 滚轮缩放：以鼠标所在屏幕点为中心 zoomAt，然后重绘。 */
  private onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    if (!this.doc) return;

    const pane = event.currentTarget as HTMLElement | null;
    const metrics = this.viewport.sync();
    const point = this.viewport.pointFromEvent(event, pane, metrics);
    if (!point) return;

    const step = this.options.zoomStep ?? { in: 1.15, out: 0.87 };
    const factor = event.deltaY < 0 ? step.in : step.out;
    this.camera.zoomAt(point.x, point.y, factor, this.limits);
    this.draw('zoom', metrics);
  };

  /** 鼠标按下：仅左键，进入 drag 状态。preventDefault 防止选中文字/原生拖拽。 */
  private onMouseDown = (event: MouseEvent): void => {
    if (event.button !== 0) return;
    const element = event.currentTarget as HTMLElement | null;
    if (!element) return;
    // 在 SVG 文字上平移时，阻止浏览器原生的文字选择/拖动手势。
    event.preventDefault();
    this.drag = { element, lastX: event.clientX, lastY: event.clientY };
  };

  /** 窗口失焦（切换标签/开发者工具）：复位 drag，防止拖拽卡死。 */
  private onWindowBlur = (): void => {
    this.drag = null;
  };

  /** 鼠标移动：drag 状态下按鼠标位移 panBy，再重绘（仅更新 SVG viewBox）。 */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.drag || !this.doc) return;
    const metrics = this.viewport.sync();
    const rect = this.drag.element.getBoundingClientRect();
    const ratioX = metrics.width / Math.max(1, rect.width);
    const ratioY = metrics.height / Math.max(1, rect.height);

    this.camera.panBy(
      (event.clientX - this.drag.lastX) * ratioX,
      (event.clientY - this.drag.lastY) * ratioY
    );
    this.drag.lastX = event.clientX;
    this.drag.lastY = event.clientY;
    this.draw('pan', metrics);
  };

  /** 鼠标抬起：退出 drag 状态。 */
  private onMouseUp = (): void => {
    this.drag = null;
  };

  /** 窗口尺寸变化：重绘以重新适配视口像素。 */
  private onResize = (): void => {
    if (!this.doc) return;
    this.draw('resize');
  };
}
