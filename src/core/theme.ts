/**
 * ACI（AutoCAD Color Index）调色板，供 SVG/Canvas 渲染端把颜色索引换成 hex。
 *
 * 放在 `core` 而不是 `render`，是因为 SVG 序列化器也要用颜色；若放到
 * `render` 下会形成 `svg → render` 的循环依赖（破坏分层）。
 */

/** 一份主题定义：背景/纸张色 + ACI 索引到 hex 的映射。 */
export interface ThemeDefinition {
  name: string;
  isDark: boolean;
  /** 预览画布 / live 模式 SVG 的背景色。 */
  background: string;
  /** export 模式 SVG 的背景色（浅色主题导出到白纸上）。 */
  exportBackground: string;
  /** 图纸边框的纸张填充色。 */
  paper: string;
  /** 没有显式映射的 ACI 索引使用的兜底色。 */
  defaultColor: string;
  /** ACI 索引 → hex 颜色。 */
  aci: Readonly<Record<number, string>>;
}

/**
 * RenderTheme 实例的「跨 realm 品牌」标记。
 *
 * 同一个包被加载两次时（ESM + CJS，或不同子路径各引入一份），`instanceof`
 * 会失效。这里用 `Symbol.for` 从全局符号注册表取键，所有副本都能识别所有
 * 实例，从而让 `isRenderTheme` 的鸭子类型检查稳定工作。
 */
const RENDER_THEME_BRAND = Symbol.for('vecbridge.RenderTheme');

/** 主题对象：持有一份调色板并提供颜色解析/背景选择能力。 */
export class RenderTheme {
  readonly name: string;
  readonly isDark: boolean;
  readonly background: string;
  readonly exportBackground: string;
  readonly paper: string;
  readonly defaultColor: string;
  private readonly aciMap: Readonly<Record<number, string>>;

  /**
   * 从一份主题定义构造主题，并在实例上打跨 realm 品牌标记。
   */
  constructor(definition: ThemeDefinition) {
    Object.defineProperty(this, RENDER_THEME_BRAND, { value: true });
    this.name = definition.name;
    this.isDark = definition.isDark;
    this.background = definition.background;
    this.exportBackground = definition.exportBackground;
    this.paper = definition.paper;
    this.defaultColor = definition.defaultColor;
    this.aciMap = definition.aci;
  }

  /** 把 ACI 索引换成 hex；空值或未映射的索引返回兜底色。 */
  resolveAci(aci: number | null | undefined): string {
    if (aci === null || aci === undefined) return this.defaultColor;
    return this.aciMap[aci] ?? this.defaultColor;
  }

  /** 按模式取背景色：export 用 exportBackground，其余用 background。 */
  backgroundFor(mode: 'live' | 'export'): string {
    return mode === 'export' ? this.exportBackground : this.background;
  }
}

/** 预置深色主题。 */
export const DARK_THEME: RenderTheme = new RenderTheme({
  name: 'dark',
  isDark: true,
  background: '#111418',
  exportBackground: '#111418',
  paper: '#ffffff',
  defaultColor: '#f0f4f8',
  aci: { 1: '#ff3b30', 3: '#32d74b', 5: '#409cff', 8: '#76808f' },
});

/** 预置浅色主题（导出到白纸）。 */
export const LIGHT_THEME: RenderTheme = new RenderTheme({
  name: 'light',
  isDark: false,
  background: '#e5e7eb',
  exportBackground: '#ffffff',
  paper: '#ffffff',
  defaultColor: '#111827',
  aci: { 1: '#d92121', 3: '#168f33', 5: '#0f5acc', 8: '#6b7280' },
});

/**
 * 扩展深色主题：覆盖常用 AutoCAD ACI 调色板（红/黄/绿/青/蓝/品红/橙/紫/灰等），
 * 适用于多色 SVG / HTML DOM 转换结果在 DualViewPreview 中的高还原预览。
 */
export const EXTENDED_DARK_THEME: RenderTheme = new RenderTheme({
  name: 'extended-dark',
  isDark: true,
  background: '#111418',
  exportBackground: '#111418',
  paper: '#ffffff',
  defaultColor: '#f0f4f8',
  aci: {
    1: '#ff3b30',
    2: '#ffd60a',
    3: '#32d74b',
    4: '#5ac8fa',
    5: '#409cff',
    6: '#ff66d9',
    7: '#f0f4f8',
    8: '#76808f',
    9: '#b4bcc8',
    10: '#ff6961',
    14: '#d93829',
    30: '#ff9f0a',
    40: '#ffbe0b',
    52: '#b8b832',
    80: '#8ce02c',
    94: '#28a745',
    134: '#20b2aa',
    140: '#38bdf8',
    150: '#3b82f6',
    174: '#4f6bed',
    200: '#bf5af2',
    214: '#c056c0',
    240: '#ff375f',
    251: '#5a6270',
    253: '#a8b0bc',
  },
});

/**
 * 扩展浅色主题：覆盖常用 AutoCAD ACI 调色板并针对白底对比度优化，
 * 适用于多色 SVG / HTML DOM 转换结果在浅色打印预览下的高还原显示。
 */
export const EXTENDED_LIGHT_THEME: RenderTheme = new RenderTheme({
  name: 'extended-light',
  isDark: false,
  background: '#e5e7eb',
  exportBackground: '#ffffff',
  paper: '#ffffff',
  defaultColor: '#111827',
  aci: {
    1: '#d92121',
    2: '#b58900',
    3: '#168f33',
    4: '#0891b2',
    5: '#0f5acc',
    6: '#c026d3',
    7: '#111827',
    8: '#6b7280',
    9: '#9ca3af',
    10: '#ef4444',
    14: '#991b1b',
    30: '#ea580c',
    40: '#d97706',
    52: '#858500',
    80: '#65a30d',
    94: '#15803d',
    134: '#0f766e',
    140: '#0284c7',
    150: '#2563eb',
    174: '#1d4ed8',
    200: '#7c3aed',
    214: '#86198f',
    240: '#e11d48',
    251: '#4b5563',
    253: '#94a3b8',
  },
});

/** 主题入参：预置名或自定义主题对象。 */
export type ThemeInput = 'dark' | 'light' | RenderTheme;

/**
 * 鸭子类型判断一个值是否为 RenderTheme。
 *
 * 先试 `instanceof`，再用品牌符号探测——这样即使包被加载成多个实例
 * （ESM+CJS 或不同子路径）也能正确识别。库内部应优先用本函数而非 instanceof。
 */
export function isRenderTheme(value: unknown): value is RenderTheme {
  if (!value || typeof value !== 'object') return false;
  if (value instanceof RenderTheme) return true;
  return (value as Record<symbol, unknown>)[RENDER_THEME_BRAND] === true;
}

/** 把主题入参解析成 RenderTheme：对象直接用，'light' 取浅色，其余取深色。 */
export function resolveTheme(input?: ThemeInput): RenderTheme {
  if (isRenderTheme(input)) return input;
  if (input === 'light') return LIGHT_THEME;
  return DARK_THEME;
}
