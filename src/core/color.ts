/**
 * 共享色彩解析、CSS/SVG 颜色 → AutoCAD ACI 索引映射与图层名清洗工具。
 *
 * 纯计算、环境无关，由 `src/svg/parser.ts` 与 `src/dom/*` 共同复用，
 * 确保 SVG 导入与 HTML DOM 导入在颜色映射和图层命名上完全一致。
 */

const CSS_NAMED_COLORS: Record<string, readonly [number, number, number]> = {
  black: [0, 0, 0],
  white: [255, 255, 255],
  red: [255, 0, 0],
  lime: [0, 255, 0],
  green: [0, 128, 0],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  cyan: [0, 255, 255],
  aqua: [0, 255, 255],
  magenta: [255, 0, 255],
  fuchsia: [255, 0, 255],
  gray: [128, 128, 128],
  grey: [128, 128, 128],
  silver: [192, 192, 192],
  darkgray: [169, 169, 169],
  darkgrey: [169, 169, 169],
  lightgray: [211, 211, 211],
  lightgrey: [211, 211, 211],
  orange: [255, 165, 0],
  brown: [165, 42, 42],
  navy: [0, 0, 128],
  teal: [0, 128, 128],
  olive: [128, 128, 0],
  purple: [128, 0, 128],
  maroon: [128, 0, 0],
};

/** 本库内置深/浅主题精确映射，往返转换时优先原样命中。 */
const EXACT_THEME_ACI: Record<string, number> = {
  '#ff3b30': 1,
  '#d92121': 1,
  '#32d74b': 3,
  '#168f33': 3,
  '#409cff': 5,
  '#0f5acc': 5,
  '#76808f': 8,
  '#6b7280': 8,
  '#f0f4f8': 7,
  '#111827': 7,
};

/** AutoCAD 常用 ACI 调色板（索引 1..9 + 典型工程色与灰度）。 */
const ACI_PALETTE: ReadonlyArray<readonly [number, number, number, number]> = [
  [1, 255, 0, 0], // 红
  [2, 255, 255, 0], // 黄
  [3, 0, 255, 0], // 绿
  [4, 0, 255, 255], // 青
  [5, 0, 0, 255], // 蓝
  [6, 255, 0, 255], // 品红
  [8, 128, 128, 128], // 深灰
  [9, 192, 192, 192], // 浅灰
  [10, 255, 64, 64],
  [14, 180, 0, 0],
  [30, 255, 128, 0], // 橙
  [40, 255, 191, 0], // 琥珀
  [52, 180, 180, 0], // 橄榄
  [80, 128, 255, 0],
  [94, 0, 160, 0], // 深绿
  [134, 0, 160, 160], // 青绿
  [140, 0, 191, 255], // 天蓝
  [150, 0, 128, 255],
  [174, 0, 0, 160], // 深蓝
  [200, 128, 0, 255], // 紫
  [214, 160, 0, 160],
  [240, 255, 0, 128],
  [251, 90, 90, 90],
  [253, 168, 168, 168],
];

/** 解析 CSS/SVG 颜色为 [r, g, b, alpha]（RGB 范围 0..255，alpha 范围 0..1）。 */
export function parseColorRgba(
  raw: string | undefined | null
): [number, number, number, number] | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (!s || s === 'none' || s === 'transparent' || s.startsWith('url(')) return null;

  if (CSS_NAMED_COLORS[s]) {
    const [r, g, b] = CSS_NAMED_COLORS[s];
    return [r, g, b, 1];
  }

  if (s.startsWith('#')) {
    const hex = s.slice(1);
    if (hex.length === 3 || hex.length === 4) {
      const r = Number.parseInt(hex[0] + hex[0], 16);
      const g = Number.parseInt(hex[1] + hex[1], 16);
      const b = Number.parseInt(hex[2] + hex[2], 16);
      const a = hex.length === 4 ? Number.parseInt(hex[3] + hex[3], 16) / 255 : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && Number.isFinite(a)) {
        return [r, g, b, a];
      }
    } else if (hex.length === 6 || hex.length === 8) {
      const r = Number.parseInt(hex.slice(0, 2), 16);
      const g = Number.parseInt(hex.slice(2, 4), 16);
      const b = Number.parseInt(hex.slice(4, 6), 16);
      const a = hex.length === 8 ? Number.parseInt(hex.slice(6, 8), 16) / 255 : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b) && Number.isFinite(a)) {
        return [r, g, b, a];
      }
    }
    return null;
  }

  const rgbMatch = s.match(/^rgba?\s*\(([^)]+)\)$/);
  if (rgbMatch) {
    const parts = rgbMatch[1].split(/[\s,/]+/).filter(Boolean);
    if (parts.length >= 3) {
      const parseChannel = (token: string): number => {
        if (token.endsWith('%')) return Math.round((Number.parseFloat(token) / 100) * 255);
        return Math.round(Number.parseFloat(token));
      };
      const parseAlpha = (token: string): number => {
        const v = token.endsWith('%')
          ? Number.parseFloat(token) / 100
          : Number.parseFloat(token);
        return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 1;
      };
      const r = Math.max(0, Math.min(255, parseChannel(parts[0])));
      const g = Math.max(0, Math.min(255, parseChannel(parts[1])));
      const b = Math.max(0, Math.min(255, parseChannel(parts[2])));
      const a = parts.length >= 4 ? parseAlpha(parts[3]) : 1;
      if (Number.isFinite(r) && Number.isFinite(g) && Number.isFinite(b)) {
        return [r, g, b, a];
      }
    }
  }
  return null;
}

/** 解析 CSS/SVG 颜色为 [r, g, b]。 */
export function parseColorRgb(
  raw: string | undefined | null
): [number, number, number] | null {
  const rgba = parseColorRgba(raw);
  return rgba ? [rgba[0], rgba[1], rgba[2]] : null;
}

/** 判断颜色是否完全透明或无效。 */
export function isTransparentColor(raw: string | undefined | null): boolean {
  const rgba = parseColorRgba(raw);
  return !rgba || rgba[3] <= 0.001;
}

/** 判断颜色是否接近纯白（用于跳过白底背景填充与识别白纸）。 */
export function isNearWhiteRgb(r: number, g: number, b: number): boolean {
  return r >= 245 && g >= 245 && b >= 245;
}

/** 将 RGB 格式化为 SVG 1.1 兼容的 6 位十六进制颜色。 */
export function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number): string =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** 将 CSS/SVG 颜色映射为最接近的 AutoCAD ACI 索引（1..255）。 */
export function colorToAci(raw: string | undefined | null): number {
  if (!raw) return 7;
  const trimmed = raw.trim().toLowerCase();
  if (EXACT_THEME_ACI[trimmed] !== undefined) return EXACT_THEME_ACI[trimmed];

  const rgb = parseColorRgb(trimmed);
  if (!rgb) return 7;
  const [r, g, b] = rgb;

  // 极黑与极白在 AutoCAD 中均对应 ACI 7（随背景黑白自动反色）。
  const maxC = Math.max(r, g, b);
  const minC = Math.min(r, g, b);
  if (maxC - minC <= 18) {
    if (maxC <= 45 || minC >= 225) return 7;
    return maxC < 165 ? 8 : 9;
  }

  let bestAci = 7;
  let bestDist = Infinity;
  for (const [aci, pr, pg, pb] of ACI_PALETTE) {
    const dr = r - pr;
    const dg = g - pg;
    const db = b - pb;
    // 人眼加权欧氏距离
    const dist = 2 * dr * dr + 4 * dg * dg + 3 * db * db;
    if (dist < bestDist) {
      bestDist = dist;
      bestAci = aci;
    }
  }
  return bestAci;
}

/** 清洗候选图层名，过滤 DXF 符号表禁用字符与控制字符。 */
export function sanitizeLayerCandidate(
  raw: string | null | undefined,
  fallback: string
): string {
  if (!raw) return fallback;
  const clean = raw.replace(/[\\<>\/":;?*|,=`\r\n\x00-\x1f]/g, '_').trim();
  return clean || fallback;
}
