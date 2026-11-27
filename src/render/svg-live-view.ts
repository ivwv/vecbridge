/**
 * 实时 SVG 视图：管理容器内的一个活动 SVG 子树（依赖 DOM）。
 *
 * 关键性能取舍：文档/主题变化走全量 `render()` 重建子树；而平移/缩放只走
 * `setViewBox()` 修改根节点的 viewBox 属性，不重建 DOM（保留旧实现的性能特性）。
 * `hasRenderedContent`/`rootElement` 两个状态决定双视图门面该用哪条路径。
 */

import type { DecorationOptions } from '../core/decorations';
import type { DocumentLike } from '../core/data';
import { fmtNumber } from '../core/format';
import type { TextMetricsPolicy } from '../core/text';
import type { ThemeInput } from '../core/theme';
import type { ViewBox } from '../core/types';
import { SvgSerializer } from '../svg/serializer';

/** 实时 SVG 视图选项。 */
export interface SvgLiveViewOptions {
  theme?: ThemeInput;
  decorations?: DecorationOptions;
  text?: Partial<TextMetricsPolicy>;
  /** 根节点 id，默认 'liveSvgElement'；传 null 则省略 id 属性。 */
  rootId?: string | null;
  /** 在文本上输出 `xml:space="preserve"`，默认 true。 */
  preserveWhitespace?: boolean;
}

/** 管理容器内 SVG 子树的类。 */
export class SvgLiveView {
  private readonly container: HTMLElement;
  private options: SvgLiveViewOptions;
  private rootElement: SVGSVGElement | null = null;
  private rendered = false;

  constructor(container: HTMLElement, options: SvgLiveViewOptions = {}) {
    this.container = container;
    this.options = options;
  }

  /**
   * 全量渲染：用 SvgSerializer 的 live 模式生成 SVG 并替换容器 innerHTML，
   * 保存根节点引用。doc 为 null 时等价于 clear()。
   */
  render(doc: DocumentLike | null, viewBox?: ViewBox | null): void {
    if (!doc) {
      this.clear();
      return;
    }

    const serializer = new SvgSerializer();
    const svg = serializer.serialize(doc, {
      theme: this.options.theme,
      mode: 'live',
      viewBox: viewBox ?? null,
      rootId: this.options.rootId === undefined ? 'liveSvgElement' : this.options.rootId,
      decorations: this.options.decorations,
      text: this.options.text,
      preserveWhitespace: this.options.preserveWhitespace,
    });

    this.container.innerHTML = svg;
    this.rootElement = this.container.querySelector('svg');
    this.rendered = true;
  }

  /** 仅更新根节点的 viewBox 属性（平移/缩放走这里，避免全量重建）。 */
  setViewBox(viewBox: ViewBox): void {
    if (!this.rootElement) return;
    this.rootElement.setAttribute(
      'viewBox',
      `${fmtNumber(viewBox.x)} ${fmtNumber(viewBox.y)} ${fmtNumber(viewBox.w)} ${fmtNumber(
        viewBox.h
      )}`
    );
  }

  /** 切换主题（下次全量渲染生效）。 */
  setTheme(theme: ThemeInput): void {
    this.options = { ...this.options, theme };
  }

  /** 切换装饰配置（下次全量渲染生效）。 */
  setDecorations(decorations: DecorationOptions): void {
    this.options = { ...this.options, decorations };
  }

  /** 清空容器并复位状态。 */
  clear(): void {
    this.container.innerHTML = '';
    this.rootElement = null;
    this.rendered = false;
  }

  /** 当前 SVG 根元素。 */
  get element(): SVGSVGElement | null {
    return this.rootElement;
  }

  /** 是否已经渲染过内容（决定 setViewBox 是否可用）。 */
  get hasRenderedContent(): boolean {
    return this.rendered;
  }
}
