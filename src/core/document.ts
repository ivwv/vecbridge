import { DEFAULT_TEXT_METRICS, type TextMetricsPolicy } from './text';
import type {
  DrawCommand,
  DrawTarget,
  DocumentData,
  Extents,
  HAlign,
  LayerDef,
  Linetype,
  Point,
  TextCommand,
  VAlign,
} from './types';

/** 文档构建选项。 */
export interface DrawingDocumentOptions {
  /** 图幅范围，默认 A4 横向 297×210。 */
  extents?: Partial<Extents>;
  /** 原点偏移 [x, y]，默认 [0, 0]。 */
  offset?: Point;
  /** 构建期文本布局参数覆盖（主要是多行行距）。 */
  text?: Partial<TextMetricsPolicy>;
}

/** addPolyline 的可选参数。 */
export interface AddPolylineOptions {
  /** 把这条闭合折线标记为"纸张区域"（渲染提示）。 */
  paper?: boolean;
  /** 显式图元线型（组码 6）；省略则不输出。 */
  linetype?: Linetype;
}

/** addRect 的可选参数。 */
export interface AddRectOptions {
  paper?: boolean;
}

/** addText 的可选参数。 */
export interface AddTextOptions {
  /** 渲染提示：粗体字重。 */
  bold?: boolean;
}

/**
 * 绘图文档（Builder + 命令 IR）。
 *
 * 职责：
 *  - 累积图层、世界坐标图元命令与图幅范围；
 *  - 在 add*() 调用的那一刻【一次性】应用当前原点偏移，让 IR 永久保存最终
 *    世界坐标（这是输出字节一致的前提——偏移不会在序列化阶段二次叠加）；
 *  - 把多行文本展开为"每行一条"文本命令（历史行为）。
 *
 * 本类只负责构建数据，不做序列化、不碰 DOM。它实现了 `DrawTarget` 接口，
 * 因此 fill 图案等组合助手可以直接往里添加图元。
 */
export class DrawingDocument implements DrawTarget {
  /** 累积的图层定义。注意：【勿改·历史兼容】addLayer 不去重。 */
  readonly layers: LayerDef[] = [];
  /** 累积的图元命令（IR）。 */
  readonly commands: DrawCommand[] = [];

  private _extents: Extents;
  private _offsetX: number;
  private _offsetY: number;
  private readonly lineGapFactor: number;

  /** 默认 A4 横向图幅、零偏移、默认文本行距策略。 */
  constructor(options: DrawingDocumentOptions = {}) {
    this._extents = { minX: 0, minY: 0, maxX: 297, maxY: 210, ...options.extents };
    this._offsetX = options.offset?.[0] ?? 0;
    this._offsetY = options.offset?.[1] ?? 0;
    this.lineGapFactor =
      options.text?.lineGapFactor ?? DEFAULT_TEXT_METRICS.lineGapFactor;
  }

  /** 当前图幅范围。 */
  get extents(): Extents {
    return this._extents;
  }

  /** 当前 X 方向原点偏移。 */
  get offsetX(): number {
    return this._offsetX;
  }

  /** 当前 Y 方向原点偏移。 */
  get offsetY(): number {
    return this._offsetY;
  }

  /** 旧版别名，等同 offsetX（【勿改·历史兼容】保留给外部调用方）。 */
  get ox(): number {
    return this._offsetX;
  }

  /** 旧版别名，等同 offsetY（【勿改·历史兼容】保留给外部调用方）。 */
  get oy(): number {
    return this._offsetY;
  }

  /** 设置原点偏移，影响此后 add*() 添加的图元；返回 this 便于链式调用。 */
  setOffset(ox: number, oy: number): this {
    this._offsetX = ox;
    this._offsetY = oy;
    return this;
  }

  /** 设置图幅范围；返回 this 便于链式调用。 */
  setExtents(minX: number, minY: number, maxX: number, maxY: number): this {
    this._extents = { minX, minY, maxX, maxY };
    return this;
  }

  /**
   * 追加一个图层定义。
   * 注意：【勿改·历史兼容】这里不去重，重复名称会全部 push 进去。
   */
  addLayer(name: string, color = 7, linetype: Linetype = 'CONTINUOUS'): this {
    this.layers.push({ name, color, linetype });
    return this;
  }

  /**
   * 添加一条线段；四个坐标在入栈前各加一次当前偏移，IR 存最终世界坐标。
   * 参数：x1/y1 与 x2/y2 为两端点，layer 图层名，color 为 ACI 或 null（随层）。
   */
  addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = '0',
    color: number | null = null,
    linetype: Linetype | null = null
  ): this {
    const ox = this._offsetX;
    const oy = this._offsetY;
    this.commands.push({
      type: 'line',
      x1: x1 + ox,
      y1: y1 + oy,
      x2: x2 + ox,
      y2: y2 + oy,
      layer,
      color,
      linetype,
    });
    return this;
  }

  /**
   * 便捷方法：添加一个闭合矩形，内部转成 4 点闭合折线。
   * 参数：x1/y1 与 x2/y2 为对角两点；options.paper 可标记为纸张区域。
   */
  addRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = '0',
    color: number | null = null,
    lineWidth = 0,
    options?: AddRectOptions
  ): this {
    return this.addPolyline(
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      layer,
      color,
      true,
      lineWidth,
      { paper: options?.paper }
    );
  }

  /**
   * 添加一个圆；圆心加偏移，半径不变。linetype 仅在给出时才写入命令。
   */
  addCircle(
    cx: number,
    cy: number,
    r: number,
    layer = '0',
    color: number | null = null,
    linetype: Linetype | null = null
  ): this {
    const command: DrawCommand = {
      type: 'circle',
      cx: cx + this._offsetX,
      cy: cy + this._offsetY,
      r,
      layer,
      color,
    };
    if (linetype) command.linetype = linetype;
    this.commands.push(command);
    return this;
  }

  /**
   * 添加一条折线；所有点整体加偏移后成为世界坐标。
   *
   * 参数：points 点集；closed 是否闭合；lineWidth 线宽；
   *       options.paper 标记纸张区域、options.linetype 指定图元线型。
   * 空点集直接忽略。
   */
  addPolyline(
    points: readonly Point[],
    layer = '0',
    color: number | null = null,
    closed = false,
    lineWidth = 0,
    options?: AddPolylineOptions
  ): this {
    if (!points || points.length === 0) return this;
    const ox = this._offsetX;
    const oy = this._offsetY;
    const worldPoints: Point[] = points.map(([x, y]) => [x + ox, y + oy] as const);

    const command: DrawCommand = {
      type: 'polyline',
      points: worldPoints,
      layer,
      color,
      closed,
      lineWidth,
    };
    if (options?.paper) (command as { paper?: boolean }).paper = true;
    if (options?.linetype) (command as { linetype?: Linetype }).linetype = options.linetype;
    this.commands.push(command);
    return this;
  }

  /**
   * 添加实心填充区域（对应 DXF R12 `SOLID` 实体）；顶点按轮廓顺序传入并在入栈时一次性应用偏移。
   *
   * 少于 3 个顶点时静默忽略；3~4 个顶点直接生成单条 `solid` 命令；
   * 超过 4 个顶点（如凸多边形、圆角矩形）自动按扇形拆分为若干 4 顶点四边形（奇数余量补 3 顶点三角形）。
   */
  addSolid(
    points: readonly Point[],
    layer = '0',
    color: number | null = null
  ): this {
    if (!points || points.length < 3) return this;
    const ox = this._offsetX;
    const oy = this._offsetY;
    const worldPoints: Point[] = points.map(([x, y]) => [x + ox, y + oy] as const);

    if (worldPoints.length <= 4) {
      this.commands.push({
        type: 'solid',
        points: worldPoints,
        layer,
        color,
      });
      return this;
    }

    const anchor = worldPoints[0];
    for (let i = 1; i + 1 < worldPoints.length; i += 2) {
      if (i + 2 < worldPoints.length) {
        this.commands.push({
          type: 'solid',
          points: [anchor, worldPoints[i], worldPoints[i + 1], worldPoints[i + 2]],
          layer,
          color,
        });
      } else {
        this.commands.push({
          type: 'solid',
          points: [anchor, worldPoints[i], worldPoints[i + 1]],
          layer,
          color,
        });
      }
    }
    return this;
  }

  /** 便捷方法：添加一个实心填充矩形（左下/右上或任意对角两点）。 */
  addSolidRect(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer = '0',
    color: number | null = null
  ): this {
    return this.addSolid(
      [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ],
      layer,
      color
    );
  }

  /**
   * 添加文本；多行文本会被拆成"每行一条"文本命令（历史行为）。
   *
   * 参数：x/y 为插入点，h 为字高，text 支持 string | number | null | undefined
   *       （空值直接忽略），layer 图层名，color 为 ACI 或 null（随层），
   *       rot 为旋转角（度），hAlign/vAlign 对应组码 72/73，
   *       widthFactor 为宽度系数，options.bold 标记粗体。
   *
   * 多行时，各行沿旋转基线的法向（dirX/dirY）展开，使竖排（rot=90）
   * 的多行标签堆叠而不重叠。
   * 注意：【勿改·字节契约】rot===0 时特意保留原算术式
   *       `y + totalH / 2 - idx * lineGap`，浮点运算结合顺序会影响输出字节。
   */
  addText(
    x: number,
    y: number,
    h: number,
    text: string | number | null | undefined,
    layer = '0',
    color: number | null = null,
    rot = 0,
    hAlign: HAlign = 0,
    vAlign: VAlign = 0,
    widthFactor = DEFAULT_TEXT_METRICS.defaultWidthFactor,
    options?: AddTextOptions
  ): this {
    if (text === null || text === undefined || text === '') return this;

    const lines = String(text).split(/\r\n|\r|\n/);
    if (lines.length > 1) {
      const lineGap = h * this.lineGapFactor;
      const totalH = (lines.length - 1) * lineGap;
      // 沿旋转基线的法向偏移每一行，让竖排（rot=90）的多行标签堆叠而非重叠。
      const radians = (rot * Math.PI) / 180;
      const dirX = -Math.sin(radians);
      const dirY = Math.cos(radians);
      for (let idx = 0; idx < lines.length; idx++) {
        const offset = totalH / 2 - idx * lineGap;
        // 未旋转时保留原算术式 y + totalH / 2 - idx * lineGap 的浮点结合顺序，
        // 保证与旧实现字节一致。
        const lineX = rot === 0 ? x : x + dirX * offset;
        const lineY = rot === 0 ? y + totalH / 2 - idx * lineGap : y + dirY * offset;
        this.addText(
          lineX,
          lineY,
          h,
          lines[idx],
          layer,
          color,
          rot,
          hAlign,
          vAlign,
          widthFactor,
          options
        );
      }
      return this;
    }

    const cleanText = String(text).trim();
    if (!cleanText) return this;

    const command: TextCommand = {
      type: 'text',
      x: x + this._offsetX,
      y: y + this._offsetY,
      h,
      text: cleanText,
      layer,
      color,
      rot,
      hAlign,
      vAlign,
      widthFactor,
    };
    if (options?.bold) command.bold = true;
    this.commands.push(command);
    return this;
  }

  /** 清空图层与命令，保留图幅范围与偏移设置。 */
  clear(): this {
    this.layers.length = 0;
    this.commands.length = 0;
    return this;
  }

  /** 返回普通快照；结构可安全序列化/持久化（就是三端共用的 DocumentData）。 */
  toJSON(): DocumentData {
    return {
      layers: this.layers,
      commands: this.commands,
      extents: this._extents,
    };
  }

  /**
   * 从快照还原文档。
   *
   * 注意：【勿改·历史兼容/性能】用 for 循环逐条 push，而不是
   * `push(...data.commands)`——后者在 V8 上约 12.5 万实体时会超出参数个数上限而抛错。
   */
  static fromJSON(data: DocumentData): DrawingDocument {
    const doc = new DrawingDocument({ extents: data?.extents });
    // 逐条迭代而非展开：push(...commands) 在 V8 约 12.5 万实体时会参数溢出。
    if (Array.isArray(data?.layers)) {
      for (const layer of data.layers) doc.layers.push(layer);
    }
    if (Array.isArray(data?.commands)) {
      for (const command of data.commands) doc.commands.push(command);
    }
    return doc;
  }
}
