/**
 * 核心数据模型 —— DXF 序列化器、SVG 序列化器与 Canvas 渲染器共享的「单一事实源」。
 *
 * 这里定义的 `DrawCommand` 中间表示（IR）是整个库的枢纽：调用方先把图形累积成
 * 一组命令，再由三端消费者从同一份 IR 各自输出，从而天然保证三端一致。
 *
 * 字段命名刻意沿用旧实现里的 `drawCmds` 中间表示，这样从原实现抓取的文档
 * 可以逐字段比对（服务于输出字节稳定性契约）。
 */

export type Linetype = 'CONTINUOUS' | 'DASHED' | 'DOT';

/** DXF TEXT 水平对齐方式（对应组码 72）。 */
export type HAlign = 0 | 1 | 2;
/** DXF TEXT 垂直对齐方式（对应组码 73）。 */
export type VAlign = 0 | 1 | 2 | 3;

/** 一个二维点，[x, y]。 */
export type Point = readonly [number, number];

/** 图幅范围（世界坐标，单位 mm）。 */
export interface Extents {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** SVG 视口结构（x/y 为左上角，w/h 为宽高）。 */
export interface ViewBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 图层定义：名称 + ACI 颜色 + 线型。 */
export interface LayerDef {
  name: string;
  color: number;
  linetype: Linetype;
}

/** 所有图元命令的公共字段。 */
export interface CommandBase {
  /** 目标图层名。 */
  layer: string;
  /**
   * ACI 颜色索引。
   * `null` 表示「省略组码 62」，即随层（BYLAYER）；
   * `0` 是真实值 BYBLOCK，必须原样保留——二者语义不同，不可混为一谈。
   */
  color: number | null;
  /** 图元自己的线型（组码 6）；省略则随层/实线。 */
  linetype?: Linetype | null;
  /** 应用层私有载荷；序列化器一律忽略，不会写进输出。 */
  data?: Record<string, unknown>;
}

/** 线段命令：由 (x1,y1) 到 (x2,y2)。 */
export interface LineCommand extends CommandBase {
  type: 'line';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** 圆命令：圆心 (cx,cy) 与半径 r。 */
export interface CircleCommand extends CommandBase {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

/** 折线命令：点集 points、是否闭合 closed、线宽 lineWidth。 */
export interface PolylineCommand extends CommandBase {
  type: 'polyline';
  points: readonly Point[];
  closed: boolean;
  lineWidth: number;
  /**
   * 渲染提示：这条 4 点闭合折线代表一张图纸。
   * Canvas/SVG 渲染器在浅色主题下可用纸张色填充它。
   */
  paper?: boolean;
}

/** 文本命令：插入点、字高、内容、旋转角与对齐方式等。 */
export interface TextCommand extends CommandBase {
  type: 'text';
  x: number;
  y: number;
  h: number;
  text: string;
  rot: number;
  hAlign: HAlign;
  vAlign: VAlign;
  widthFactor: number;
  /** 渲染提示：用粗体字重绘制。 */
  bold?: boolean;
}

/**
 * 实心填充命令：3 或 4 个按顺/逆时针轮廓顺序排列的顶点（对应 DXF R12 `SOLID` 实体）。
 *
 * IR 统一保存自然轮廓点序供 SVG/Canvas 直接填充；DXF 序列化端会在输出时自动映射为
 * AutoCAD R12 `SOLID` 要求的第 3/4 顶点交换顺序（三角形重复第 3 顶点）。
 */
export interface SolidCommand extends CommandBase {
  type: 'solid';
  points: readonly Point[];
}

/**
 * 全部图元命令的判别联合（discriminated union）。
 *
 * 消费者一律按 `type` 分支处理。新增图元种类时，必须同步修改所有
 * switch 分支（DXF/SVG/Canvas 三端），否则会漏输出。
 */
export type DrawCommand =
  | LineCommand
  | CircleCommand
  | PolylineCommand
  | TextCommand
  | SolidCommand;

/** 文档的可序列化普通快照：三端消费者共同的输入格式。 */
export interface DocumentData {
  layers: readonly LayerDef[];
  commands: readonly DrawCommand[];
  extents: Extents;
}

/**
 * 绘图目标的结构子集，供组合类助手（如填充图案）依赖。
 * `DrawingDocument` 实现了这个接口。
 *
 * 好处是 drawHatch 这类助手不依赖具体文档类，只要对象提供
 * addLine/addCircle/addPolyline 就能往里添加图元，从而进入三端同源流程。
 */
export interface DrawTarget {
  addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    layer?: string,
    color?: number | null,
    linetype?: Linetype | null
  ): unknown;
  addCircle(
    cx: number,
    cy: number,
    r: number,
    layer?: string,
    color?: number | null,
    linetype?: Linetype | null
  ): unknown;
  addPolyline(
    points: readonly Point[],
    layer?: string,
    color?: number | null,
    closed?: boolean,
    lineWidth?: number
  ): unknown;
}
