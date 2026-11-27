/**
 * DXF 输出端：把 `DocumentData` 快照序列化为 AutoCAD R12（AC1009）文本/字节。
 *
 * 受「输出字节稳定性契约」严格保护：组码取值与出现顺序、换行风格、清洗规则
 * 都逐字沿用旧实现——这里的任何改动都等同于破坏输出字节（breaking change）。
 */

import { resolveDocumentData, type DocumentLike } from '../core/data';
import { fmtNumber } from '../core/format';
import { DEFAULT_TEXT_METRICS } from '../core/text';
import type { DocumentData, DrawCommand } from '../core/types';
import { getGbkTable, textCodec, type TextCodec } from '../encoding';

export type DxfEncoding = 'gbk' | 'utf8';

/** 内置 DXF 字体配方预设名（覆盖国标 SHX、传统单线、机械、结构与 TrueType 常用组合）。 */
export type DxfFontPreset =
  | 'gbcbig'
  | 'gbenor'
  | 'gbeitc'
  | 'hztxt'
  | 'hzfs'
  | 'romans'
  | 'tssd'
  | 'simsun';

/** 自定义 DXF STYLE 字体配方（组码 3 主字体 + 组码 4 大字体）。 */
export interface DxfFontRecipe {
  /** 组码 3：主字体（西文 SHX 或 TrueType，如 `gbenor.shx`、`simsun.ttf`）。 */
  primary: string;
  /** 组码 4：中文大字体（如 `gbcbig.shx`、`hztxt.shx`）；TrueType 或纯西文留空。 */
  big?: string;
}

export type DxfFont = DxfFontPreset | DxfFontRecipe;
export type NewlineStyle = 'crlf' | 'lf';

/**
 * 值清洗（【勿改·字节契约】）。
 *
 * DXF 是严格的"组码行 + 值行"成对格式，任何内嵌 CR/LF 都会破坏整个文件，
 * 所以写入前先压平换行。图层名还要去掉反斜杠，并在 GBK 编码下【先】把表外
 * 字符替换掉——否则 `encodeToGbk()` 会把它们转成含反斜杠的 `\U+XXXX` 写进
 * LAYER 表，而 CAD 会拒收这种图层名。
 */
const sanitizeLineValue = (value: string): string =>
  String(value).replace(/[\r\n]+/g, ' ');

// AutoCAD DXF 符号表名禁用 <>／":;?*|,=` 及控制字符。
const INVALID_LAYER_CHARS = /[\\<>\/":;?*|,=`\x00-\x1f]/g;

// 清洗图层名：压平换行、替换禁用字符；GBK 下再把表外非 ASCII 字符换成 '_'；
// 结果 trim 后若为空则用 "0" 兜底。
const sanitizeLayerName = (value: string, useGbk = false): string => {
  let clean = sanitizeLineValue(value).replace(INVALID_LAYER_CHARS, '_');
  if (useGbk && /[^\x00-\x7f]/.test(clean)) {
    const table = getGbkTable();
    let out = '';
    for (let i = 0; i < clean.length; i++) {
      const code = clean.charCodeAt(i);
      if (code < 0x80) {
        out += clean.charAt(i);
      } else {
        const ch = clean.charAt(i);
        out += table.has(ch) ? ch : '_';
      }
    }
    clean = out;
  }
  const trimmed = clean.trim();
  return trimmed || '0';
};

// 清洗图层颜色：仅接受非 0、|值|<=255 的整数，否则回退默认 7。
const sanitizeLayerColor = (color: number): number =>
  Number.isInteger(color) && color !== 0 && Math.abs(color) <= 255 ? color : 7;

// 清洗线型：压平换行并 trim，空值回退 CONTINUOUS。
const sanitizeLinetype = (linetype: string): string => {
  const clean = sanitizeLineValue(linetype).trim();
  return clean || 'CONTINUOUS';
};

/** 内置常用 CJK CAD 字体配方表（原有 gbcbig / hztxt / simsun 保持字节不变）。 */
export const DXF_FONT_RECIPES: Readonly<
  Record<DxfFontPreset, Readonly<{ primary: string; big: string }>>
> = Object.freeze({
  gbcbig: Object.freeze({ primary: 'txt.shx', big: 'gbcbig.shx' }),
  gbenor: Object.freeze({ primary: 'gbenor.shx', big: 'gbcbig.shx' }),
  gbeitc: Object.freeze({ primary: 'gbeitc.shx', big: 'gbcbig.shx' }),
  hztxt: Object.freeze({ primary: 'txt.shx', big: 'hztxt.shx' }),
  hzfs: Object.freeze({ primary: 'txt.shx', big: 'hzfs.shx' }),
  romans: Object.freeze({ primary: 'romans.shx', big: 'gbcbig.shx' }),
  tssd: Object.freeze({ primary: 'tssdeng.shx', big: 'tssdchn.shx' }),
  simsun: Object.freeze({ primary: 'simsun.ttf', big: '' }),
});

/** 解析字体选项为 STYLE 表组码 3（主字体）与组码 4（大字体）。 */
export function resolveDxfFont(font: DxfFont = 'gbcbig'): { primary: string; big: string } {
  if (!font) return DXF_FONT_RECIPES.gbcbig;
  if (typeof font === 'string') {
    return Object.prototype.hasOwnProperty.call(DXF_FONT_RECIPES, font)
      ? DXF_FONT_RECIPES[font as DxfFontPreset]
      : DXF_FONT_RECIPES.gbcbig;
  }
  const primary = sanitizeLineValue(font.primary ?? '').trim() || 'txt.shx';
  const big = sanitizeLineValue(font.big ?? '').trim();
  return { primary, big };
}

/** 序列化选项。 */
export interface DxfSerializeOptions {
  /** 字节编码方式 + $DWGCODEPAGE 声明，默认 'gbk'。 */
  encoding?: DxfEncoding;
  /** STYLE 表字体配方，默认 'gbcbig'。 */
  font?: DxfFont;
  /** 行结束符风格，默认 'crlf'。 */
  newline?: NewlineStyle;
  /**
   * 是否跳过会让 CAD 拒收整份文件的实体（非正半径/字高、非有限坐标、
   * 非法 ACI、单点折线）。默认 true。
   */
  validate?: boolean;
  /** 每跳过一个实体回调一次，参数是跳过原因。 */
  onInvalidCommand?: (command: DrawCommand, reason: string) => void;
}

/**
 * 校验一条命令是否会生成非法 DXF 实体。
 *
 * 返回人类可读的原因字符串表示应跳过；返回 null 表示可以安全写入。
 * 注意：校验失败只回调并跳过该实体（见 serialize），不抛错——设计意图是
 * "保住整份文件"，不让一个坏实体毁掉整张图。
 */
export function validateCommand(command: DrawCommand): string | null {
  const finite = (value: number): boolean => Number.isFinite(value);

  switch (command.type) {
    case 'line':
      if (![command.x1, command.y1, command.x2, command.y2].every(finite)) {
        return 'non-finite line coordinates';
      }
      break;
    case 'circle':
      if (!finite(command.r) || command.r <= 0) {
        return 'circle radius must be positive and finite';
      }
      if (!finite(command.cx) || !finite(command.cy)) {
        return 'non-finite circle centre';
      }
      break;
    case 'polyline':
      if (command.points.length < 2) {
        return 'polyline needs at least two points';
      }
      if (!command.points.every(([x, y]) => finite(x) && finite(y))) {
        return 'non-finite polyline vertex';
      }
      if (!finite(command.lineWidth) || command.lineWidth < 0) {
        return 'polyline line width must be zero or positive';
      }
      break;
    case 'text':
      if (!finite(command.h) || command.h <= 0) {
        return 'text height must be positive and finite';
      }
      if (!finite(command.widthFactor) || command.widthFactor <= 0) {
        return 'text width factor must be positive';
      }
      if (!finite(command.x) || !finite(command.y)) {
        return 'non-finite text insertion point';
      }
      if (!finite(command.rot)) {
        return 'text rotation must be finite';
      }
      if (!Number.isInteger(command.hAlign) || command.hAlign < 0 || command.hAlign > 2) {
        return 'text horizontal alignment must be 0, 1 or 2';
      }
      if (!Number.isInteger(command.vAlign) || command.vAlign < 0 || command.vAlign > 3) {
        return 'text vertical alignment must be 0, 1, 2 or 3';
      }
      break;
    case 'solid':
      if (command.points.length < 3 || command.points.length > 4) {
        return 'solid needs 3 or 4 vertices';
      }
      if (!command.points.every(([x, y]) => finite(x) && finite(y))) {
        return 'non-finite solid vertex';
      }
      break;
  }

  if (
    command.color !== null &&
    (!Number.isInteger(command.color) || command.color < 0 || command.color > 256)
  ) {
    return 'ACI colour must be an integer in 0..256';
  }

  return null;
}

/**
 * 把快照序列化为 AutoCAD R12（AC1009）DXF 文本。
 *
 * 中文兼容"三件套"：
 *  1. HEADER 声明 $DWGCODEPAGE = ANSI_936（GBK）或 UTF-8；
 *  2. STYLE 表把 STANDARD 映射到 txt.shx + 大字体（或 TrueType）；
 *  3. `DxfExporter.toBytes()` 用匹配编码器把最终字符串编码成字节。
 *
 * 【勿改·字节契约】组码与顺序逐字沿用旧实现，任何改动都会改变输出字节。
 */
export class DxfSerializer {
  private readonly codec: TextCodec;

  constructor(options: { codec?: TextCodec } = {}) {
    this.codec = options.codec ?? textCodec;
  }

  /**
   * 序列化主流程：HEADER + TABLES + ENTITIES + 末尾 EOF。
   *
   * 参数：doc 文档（快照或 builder），options 序列化选项。
   * 关键：字体"三件套"按 font 选择主字体/大字体；实体按 type 逐条写出，
   *       校验失败的实体回调 onInvalidCommand 后跳过；最后按 newline 选项转 CRLF/LF。
   */
  serialize(doc: DocumentLike, options: DxfSerializeOptions = {}): string {
    const data = resolveDocumentData(doc);
    const useGbk = (options.encoding ?? 'gbk').toLowerCase() === 'gbk';
    const codepage = useGbk ? 'ANSI_936' : 'UTF-8';
    const { primary: primaryFont, big: bigFont } = resolveDxfFont(options.font);

    let out = '';
    out += this.header(data, codepage);
    out += this.tables(data, primaryFont, bigFont, useGbk);
    out += '  0\nSECTION\n  2\nENTITIES\n';
    const validate = options.validate ?? true;
    for (const command of data.commands) {
      if (validate) {
        const reason = validateCommand(command);
        if (reason) {
          options.onInvalidCommand?.(command, reason);
          continue;
        }
      }
      out += this.entity(command, useGbk);
    }
    out += '  0\nENDSEC\n  0\nEOF\n';

    return (options.newline ?? 'crlf') === 'crlf' ? out.replace(/\r?\n/g, '\r\n') : out;
  }

  /** 一步完成：序列化成文本后按 encoding 编码为字节。 */
  toBytes(doc: DocumentLike, options: DxfSerializeOptions = {}): Uint8Array {
    const text = this.serialize(doc, options);
    return (options.encoding ?? 'gbk').toLowerCase() === 'gbk'
      ? this.codec.encodeToGbk(text)
      : this.codec.encodeToUtf8(text);
  }

  /** HEADER 段：ACADVER=AC1009、$DWGCODEPAGE、测量单位、比例与图幅范围。 */
  private header(data: DocumentData, codepage: string): string {
    const ext = data.extents;
    let out = '';
    out += '  0\nSECTION\n  2\nHEADER\n';
    out += '  9\n$ACADVER\n  1\nAC1009\n';
    out += `  9\n$DWGCODEPAGE\n  3\n${codepage}\n`;
    out += '  9\n$MEASUREMENT\n 70\n1\n';
    out += '  9\n$LTSCALE\n 40\n1.0\n';
    out += `  9\n$EXTMIN\n 10\n${fmtNumber(ext.minX)}\n 20\n${fmtNumber(ext.minY)}\n 30\n0.0\n`;
    out += `  9\n$EXTMAX\n 10\n${fmtNumber(ext.maxX)}\n 20\n${fmtNumber(ext.maxY)}\n 30\n0.0\n`;
    out += `  9\n$LIMMIN\n 10\n${fmtNumber(ext.minX)}\n 20\n${fmtNumber(ext.minY)}\n`;
    out += `  9\n$LIMMAX\n 10\n${fmtNumber(ext.maxX)}\n 20\n${fmtNumber(ext.maxY)}\n`;
    out += '  0\nENDSEC\n';
    return out;
  }

  /**
   * TABLES 段：LTYPE（3 种线型）、LAYER、STYLE 三张表。
   *
   * LAYER 表里 "0" 层始终第一个写出；清洗后变成 "0" 的条目会被跳过，
   * 保证不会出现重复的 "0" 记录（CAD 会拒收）。STYLE 表填入选定的字体配方。
   */
  private tables(
    data: DocumentData,
    primaryFont: string,
    bigFont: string,
    useGbk: boolean
  ): string {
    let out = '';
    out += '  0\nSECTION\n  2\nTABLES\n';

    out += '  0\nTABLE\n  2\nLTYPE\n 70\n3\n';
    out +=
      '  0\nLTYPE\n  2\nCONTINUOUS\n 70\n0\n  3\nSolid line\n 72\n65\n 73\n0\n 40\n0.0\n';
    out +=
      '  0\nLTYPE\n  2\nDASHED\n 70\n0\n  3\nDashed grid line\n 72\n65\n 73\n2\n 40\n2.2\n 49\n1.3\n 49\n-0.9\n';
    out +=
      '  0\nLTYPE\n  2\nDOT\n 70\n0\n  3\nDotted layer line\n 72\n65\n 73\n2\n 40\n1.2\n 49\n0.5\n 49\n-0.7\n';
    out += '  0\nENDTAB\n';

    // "0" 层始终第一个写出；清洗成 "0" 的条目跳过，避免 LAYER 表出现重复 "0"（CAD 拒收）。
    const layerEntries: Array<{ name: string; color: number; linetype: string }> = [];
    for (const layer of data.layers) {
      const name = sanitizeLayerName(layer.name, useGbk);
      if (name === '0') continue;
      layerEntries.push({
        name,
        color: sanitizeLayerColor(layer.color),
        linetype: sanitizeLinetype(layer.linetype),
      });
    }
    out += `  0\nTABLE\n  2\nLAYER\n 70\n${layerEntries.length + 1}\n`;
    out += '  0\nLAYER\n  2\n0\n 70\n0\n 62\n7\n  6\nCONTINUOUS\n';
    for (const layer of layerEntries) {
      out += `  0\nLAYER\n  2\n${layer.name}\n 70\n0\n 62\n${layer.color}\n  6\n${layer.linetype}\n`;
    }
    out += '  0\nENDTAB\n';

    out += '  0\nTABLE\n  2\nSTYLE\n 70\n1\n';
    out += `  0\nSTYLE\n  2\nSTANDARD\n 70\n0\n 40\n0.0\n 41\n${
      DEFAULT_TEXT_METRICS.defaultWidthFactor
    }\n 50\n0.0\n 71\n0\n 42\n2.5\n  3\n${primaryFont}\n  4\n${bigFont}\n`;
    out += '  0\nENDTAB\n';

    out += '  0\nENDSEC\n';
    return out;
  }

  /**
   * 把单条命令写成一组"组码行 + 值行"，按 type 分支：
   * LINE / CIRCLE / POLYLINE（含 VERTEX 与 SEQEND）/ TEXT。
   *
   * 【勿改·字节契约】所有组码取值与顺序固定；颜色 null 时省略组码 62（随层）；
   * 线宽 > 0 才写组码 40/41。
   */
  private entity(cmd: DrawCommand, useGbk: boolean): string {
    const lines: string[] = [];
    const layerName = sanitizeLayerName(cmd.layer, useGbk);

    switch (cmd.type) {
      case 'line': {
        lines.push('  0', 'LINE', '  8', layerName);
        if (cmd.linetype) lines.push('  6', sanitizeLinetype(cmd.linetype));
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(cmd.x1), ' 20', fmtNumber(cmd.y1), ' 30', '0.0');
        lines.push(' 11', fmtNumber(cmd.x2), ' 21', fmtNumber(cmd.y2), ' 31', '0.0');
        break;
      }
      case 'circle': {
        lines.push('  0', 'CIRCLE', '  8', layerName);
        if (cmd.linetype) lines.push('  6', sanitizeLinetype(cmd.linetype));
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(cmd.cx), ' 20', fmtNumber(cmd.cy), ' 30', '0.0');
        lines.push(' 40', fmtNumber(cmd.r));
        break;
      }
      case 'polyline': {
        lines.push('  0', 'POLYLINE', '  8', layerName);
        if (cmd.linetype) lines.push('  6', sanitizeLinetype(cmd.linetype));
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 66', '1');
        // R12 要求 POLYLINE 头带 3D 标高点（组码 10/20/30）；严格的解析器
        // （ODA、部分 CAM/CNC 导入器）会拒收没有它的文件。
        lines.push(' 10', '0.0', ' 20', '0.0', ' 30', '0.0');
        lines.push(' 70', cmd.closed ? '1' : '0');
        if (cmd.lineWidth > 0) {
          lines.push(' 40', fmtNumber(cmd.lineWidth), ' 41', fmtNumber(cmd.lineWidth));
        }
        for (const [x, y] of cmd.points) {
          lines.push('  0', 'VERTEX', '  8', layerName);
          lines.push(' 10', fmtNumber(x), ' 20', fmtNumber(y), ' 30', '0.0');
          if (cmd.lineWidth > 0) {
            lines.push(' 40', fmtNumber(cmd.lineWidth), ' 41', fmtNumber(cmd.lineWidth));
          }
          lines.push(' 70', '0');
        }
        lines.push('  0', 'SEQEND', '  8', layerName);
        break;
      }
      case 'text': {
        lines.push('  0', 'TEXT', '  8', layerName);
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(cmd.x), ' 20', fmtNumber(cmd.y), ' 30', '0.0');
        lines.push(' 40', fmtNumber(cmd.h), '  1', sanitizeLineValue(cmd.text), ' 50', fmtNumber(cmd.rot));
        lines.push(' 41', fmtNumber(cmd.widthFactor));
        lines.push('  7', 'STANDARD');
        lines.push(' 72', String(cmd.hAlign));
        if (cmd.vAlign) lines.push(' 73', String(cmd.vAlign));
        if (cmd.hAlign !== 0 || cmd.vAlign !== 0) {
          lines.push(' 11', fmtNumber(cmd.x), ' 21', fmtNumber(cmd.y), ' 31', '0.0');
        }
        break;
      }
      case 'solid': {
        if (cmd.points.length < 3) break;
        const p0 = cmd.points[0];
        const p1 = cmd.points[1];
        const p2 = cmd.points[2];
        // AutoCAD R12 SOLID 要求 3/4 顶点按 Z 字顺序写入：
        // 四边形轮廓 [p0, p1, p2, p3] -> DXF 10/11/12/13 为 [p0, p1, p3, p2]；
        // 三角形 [p0, p1, p2] -> DXF 10/11/12/13 为 [p0, p1, p2, p2]。
        const dxfP3 = cmd.points.length >= 4 ? cmd.points[3] : p2;
        const dxfP4 = p2;
        lines.push('  0', 'SOLID', '  8', layerName);
        if (cmd.color !== null) lines.push(' 62', String(cmd.color));
        lines.push(' 10', fmtNumber(p0[0]), ' 20', fmtNumber(p0[1]), ' 30', '0.0');
        lines.push(' 11', fmtNumber(p1[0]), ' 21', fmtNumber(p1[1]), ' 31', '0.0');
        lines.push(' 12', fmtNumber(dxfP3[0]), ' 22', fmtNumber(dxfP3[1]), ' 32', '0.0');
        lines.push(' 13', fmtNumber(dxfP4[0]), ' 23', fmtNumber(dxfP4[1]), ' 33', '0.0');
        break;
      }
    }

    if (lines.length === 0) return '';
    return lines.join('\n') + '\n';
  }
}

/** 静态便捷出口：对齐旧版 writer 的方法命名，环境无关。 */
export class DxfExporter {
  /** 直接把文档序列化为 DXF 文本。 */
  static toText(doc: DocumentLike, options: DxfSerializeOptions = {}): string {
    return new DxfSerializer().serialize(doc, options);
  }

  /** 直接把文档序列化并编码为 DXF 字节。 */
  static toBytes(doc: DocumentLike, options: DxfSerializeOptions = {}): Uint8Array {
    return new DxfSerializer().toBytes(doc, options);
  }
}
