/**
 * DXF 输入端：把 ASCII DXF（R12 ~ R2024+）文本或字节流解析为统一 IR `DrawingDocument`。
 *
 * 零运行时依赖、环境无关（Node 与浏览器行为一致），与 `DxfSerializer`、`SvgSerializer`、
 * `CanvasRenderer`、`DualViewPreview` 共用同一份 `DrawCommand[]` 模型，使外部 DXF 可直接
 * 双引擎预览、导出 SVG 或二次编辑。
 */

import { colorToAci, rgbToHex, sanitizeLayerCandidate } from '../core/color';
import { DrawingDocument } from '../core/document';
import type { HAlign, Linetype, Point, VAlign } from '../core/types';
import { decodeAuto } from '../encoding';

/** DXF 解析输入编码选项（默认 `'auto'` 自动探测）。 */
export type DxfParseEncoding =
  | 'auto'
  | 'utf-8'
  | 'gbk'
  | 'gb2312'
  | 'gb18030'
  | 'big5'
  | 'shift-jis'
  | 'euc-kr'
  | 'windows-1252'
  | (string & {});

/** 空间过滤策略：默认仅解析模型空间，避免与图纸布局空间重叠。 */
export type DxfSpaceFilter = 'model' | 'paper' | 'all';

/** DXF 导入选项。 */
export interface DxfImportOptions {
  /** 字节解码方式；默认 `'auto'`（结合 BOM、`$ACADVER`、`$DWGCODEPAGE` 与 UTF-8 严格校验判定）。 */
  encoding?: DxfParseEncoding;
  /** 实体空间过滤：`'model'`（默认）仅模型空间、`'paper'` 仅图纸空间、`'all'` 全部。 */
  space?: DxfSpaceFilter;
  /** ARC / ELLIPSE / SPLINE / LWPOLYLINE 凸度圆弧离散的弦高容差（世界单位 mm），默认 `0.1`。 */
  curveTolerance?: number;
  /** 是否包含关闭（负色号）或冻结（70 & 1）的图层，默认 `false`。 */
  includeHiddenLayers?: boolean;
  /** 是否在结果 `warnings` 中记录被跳过的未支持实体统计，默认 `true`。 */
  includeUnsupportedWarnings?: boolean;
  /** 生成图元数量硬上限，防止异常文件导致 OOM，默认 `200_000`；传 `0` 关闭。 */
  maxPrimitives?: number;
  /** `INSERT` 嵌套块最大展开深度（防循环引用），默认 `16`。 */
  maxBlockDepth?: number;
}

/** DXF 解析统计信息。 */
export interface DxfParseStats {
  /** `$ACADVER` 版本标识（如 `AC1009`、`AC1015`、`AC1021`）。 */
  acadVersion: string | null;
  /** `$DWGCODEPAGE` 声明值（如 `ANSI_936`、`UTF-8`）。 */
  codepage: string | null;
  /** 实际采用的解码名称。 */
  detectedEncoding: string;
  /** 已解析的各 DXF 实体类型计数。 */
  entityCounts: Record<string, number>;
  /** 被跳过的未支持实体类型及数量。 */
  unsupportedEntities: Record<string, number>;
  /** 因空间过滤跳过的实体数。 */
  skippedPaperSpace: number;
  /** 因隐藏/冻结图层跳过的实体数。 */
  skippedHiddenLayer: number;
  /** `BLOCKS` 段解析到的块定义总数。 */
  blockCount: number;
  /** 是否触发 `maxPrimitives` 上限截断。 */
  truncated: boolean;
}

/** 带诊断报告的解析结果。 */
export interface DxfParseResult {
  document: DrawingDocument;
  stats: DxfParseStats;
  warnings: string[];
}

/* ================= 编码探测与 CAD 文本转义还原 ================= */

const BINARY_DXF_MAGIC = 'AutoCAD Binary DXF';

const CODEPAGE_MAP: Readonly<Record<string, string>> = {
  ANSI_936: 'gbk',
  GB2312: 'gbk',
  GBK: 'gbk',
  GB18030: 'gb18030',
  ANSI_950: 'big5',
  BIG5: 'big5',
  ANSI_932: 'shift-jis',
  SHIFT_JIS: 'shift-jis',
  ANSI_949: 'euc-kr',
  ANSI_1252: 'windows-1252',
  ASCII: 'windows-1252',
  'UTF-8': 'utf-8',
  UTF8: 'utf-8',
};

const M_ESCAPE_ENCODINGS: Readonly<Record<string, string>> = {
  '1': 'shift-jis',
  '2': 'big5',
  '3': 'euc-kr',
  '4': 'euc-kr',
  '5': 'gbk',
};

const decoderCache = new Map<string, TextDecoder | null>();

function getDecoder(label: string): TextDecoder | null {
  const key = label.toLowerCase();
  if (decoderCache.has(key)) return decoderCache.get(key) ?? null;
  let dec: TextDecoder | null = null;
  try {
    dec = new TextDecoder(key);
  } catch {
    dec = null;
  }
  decoderCache.set(key, dec);
  return dec;
}

function decodeStrictUtf8(bytes: Uint8Array): string | null {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

function hasBinaryMagicBytes(bytes: Uint8Array): boolean {
  if (bytes.length < BINARY_DXF_MAGIC.length) return false;
  for (let i = 0; i < BINARY_DXF_MAGIC.length; i++) {
    if (bytes[i] !== BINARY_DXF_MAGIC.charCodeAt(i)) return false;
  }
  return true;
}

/** 仅以 ASCII/Latin1 快速预扫 HEADER 头部（前 ~64KB），提前读取 `$ACADVER` 与 `$DWGCODEPAGE`。 */
function peekDxfHeaderMeta(bytes: Uint8Array): {
  acadVersion: string | null;
  codepage: string | null;
} {
  const sampleLen = Math.min(bytes.length, 65_536);
  let text = '';
  for (let i = 0; i < sampleLen; i++) {
    text += String.fromCharCode(bytes[i]);
  }
  const lines = text.split(/\r\n|\r|\n/);
  let acadVersion: string | null = null;
  let codepage: string | null = null;

  for (let i = 0; i + 3 < lines.length; i += 2) {
    const code = Number.parseInt(lines[i].trim(), 10);
    const val = lines[i + 1].trim();
    if (code === 0 && val === 'ENDSEC') break;
    if (code === 9 && val === '$ACADVER') {
      acadVersion = lines[i + 3].trim() || null;
      i += 2;
    } else if (code === 9 && val === '$DWGCODEPAGE') {
      codepage = lines[i + 3].trim() || null;
      i += 2;
    }
    if (acadVersion && codepage) break;
  }
  return { acadVersion, codepage };
}

function parseAcadVersionNumber(version: string | null): number | null {
  if (!version) return null;
  const match = version.trim().match(/^AC(\d{4})$/i);
  if (!match) return null;
  return Number.parseInt(match[1], 10);
}

function countCjkAndBad(text: string): { cjk: number; bad: number } {
  let cjk = 0;
  let bad = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0xfffd) bad++;
    else if ((c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf)) cjk++;
  }
  return { cjk, bad };
}

function hasNonAsciiBytes(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i++) {
    if (bytes[i] >= 0x80) return true;
  }
  return false;
}

function decodeDxfBytes(
  bytes: Uint8Array,
  requestedEncoding: DxfParseEncoding
): { text: string; detectedEncoding: string } {
  if (hasBinaryMagicBytes(bytes)) {
    throw new Error(
      'Binary DXF is not supported yet. Please re-save the file as ASCII DXF.'
    );
  }

  const req = String(requestedEncoding || 'auto')
    .trim()
    .toLowerCase();
  if (req !== 'auto') {
    const dec = getDecoder(req) ?? getDecoder('utf-8')!;
    return { text: dec.decode(bytes), detectedEncoding: req };
  }

  // 1. BOM 优先
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return {
      text: (getDecoder('utf-8') ?? new TextDecoder('utf-8')).decode(bytes.subarray(3)),
      detectedEncoding: 'utf-8-bom',
    };
  }
  const isUtf32LeBom =
    bytes.length >= 4 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xfe &&
    bytes[2] === 0x00 &&
    bytes[3] === 0x00;
  if (!isUtf32LeBom && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    return {
      text: (getDecoder('utf-16le') ?? new TextDecoder('utf-16le')).decode(bytes.subarray(2)),
      detectedEncoding: 'utf-16le',
    };
  }
  if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    return {
      text: (getDecoder('utf-16be') ?? new TextDecoder('utf-16be')).decode(bytes.subarray(2)),
      detectedEncoding: 'utf-16be',
    };
  }

  if (!hasNonAsciiBytes(bytes)) {
    return {
      text: (getDecoder('utf-8') ?? new TextDecoder('utf-8')).decode(bytes),
      detectedEncoding: 'ascii',
    };
  }

  // 2. 结合 HEADER 中的 $ACADVER 与 $DWGCODEPAGE 做精确判定
  const meta = peekDxfHeaderMeta(bytes);
  const verNum = parseAcadVersionNumber(meta.acadVersion);
  const cpKey = meta.codepage ? meta.codepage.trim().toUpperCase() : '';
  const mappedCodepage = cpKey ? CODEPAGE_MAP[cpKey] ?? null : null;

  const utf8Text = decodeStrictUtf8(bytes);

  // AutoCAD 2007 (AC1021) 及以上规范统一为 UTF-8（即便 $DWGCODEPAGE 仍写 ANSI_936）
  if ((verNum !== null && verNum >= 1021) || mappedCodepage === 'utf-8') {
    if (utf8Text !== null) {
      return { text: utf8Text, detectedEncoding: 'utf-8' };
    }
    if (mappedCodepage && mappedCodepage !== 'utf-8') {
      const dec = getDecoder(mappedCodepage);
      if (dec) return { text: dec.decode(bytes), detectedEncoding: mappedCodepage };
    }
    return { text: decodeAuto(bytes), detectedEncoding: 'gbk' };
  }

  // R12 ~ AutoCAD 2004 且声明了明确的 ANSI 代码页（如 ANSI_936）
  if (mappedCodepage && mappedCodepage !== 'utf-8') {
    const cpDec = getDecoder(mappedCodepage);
    if (utf8Text === null) {
      if (cpDec) return { text: cpDec.decode(bytes), detectedEncoding: mappedCodepage };
      return { text: decodeAuto(bytes), detectedEncoding: mappedCodepage };
    }
    // 严格 UTF-8 恰好也通过时（例如极短文件仅含“联通”等双合法字节串）：
    // 若代码页解码无替换字符且 CJK 汉字数更优，则采信代码页，避免误判。
    if (cpDec) {
      const cpText = cpDec.decode(bytes);
      const cpScore = countCjkAndBad(cpText);
      const utf8Score = countCjkAndBad(utf8Text);
      if (cpScore.bad === 0 && cpScore.cjk > utf8Score.cjk) {
        return { text: cpText, detectedEncoding: mappedCodepage };
      }
    }
    return { text: utf8Text, detectedEncoding: 'utf-8' };
  }

  // 3. 无头信息或未知代码页：严格 UTF-8 → decodeAuto（GBK 回退）
  if (utf8Text !== null) {
    return { text: utf8Text, detectedEncoding: 'utf-8' };
  }
  return { text: decodeAuto(bytes), detectedEncoding: 'gbk' };
}

/**
 * 还原 DXF 文本中的 CAD 转义序列：
 * - `\U+XXXX` Unicode 码元转义
 * - `\M+nXXXX` 多字节代码页转义（1=Shift-JIS, 2=Big5, 3/4=EUC-KR, 5=GBK）
 * - `%%c` (Ø)、`%%d` (°)、`%%p` (±)、`%%u` / `%%o`（上下划线开关）与 `%%%` (%)
 */
export function unescapeDxfText(raw: string): string {
  if (!raw || (!raw.includes('\\') && !raw.includes('%'))) return raw;

  let out = raw.replace(/\\U\+([0-9a-fA-F]{4})/gi, (_m, hex: string) => {
    const code = Number.parseInt(hex, 16);
    return Number.isFinite(code) ? String.fromCharCode(code) : _m;
  });

  out = out.replace(/\\M\+([1-5])([0-9a-fA-F]{4})/gi, (match, idx: string, hex: string) => {
    const enc = M_ESCAPE_ENCODINGS[idx];
    const dec = enc ? getDecoder(enc) : null;
    if (!dec) return match;
    const b1 = Number.parseInt(hex.slice(0, 2), 16);
    const b2 = Number.parseInt(hex.slice(2, 4), 16);
    try {
      const decoded = dec.decode(new Uint8Array([b1, b2]));
      return decoded && decoded !== '\uFFFD' ? decoded : match;
    } catch {
      return match;
    }
  });

  out = out.replace(/%%([cdpuo%]|\d{3})/gi, (_m, code: string) => {
    const lower = code.toLowerCase();
    if (lower === 'c') return 'Ø';
    if (lower === 'd') return '°';
    if (lower === 'p') return '±';
    if (lower === '%') return '%';
    if (lower === 'u' || lower === 'o') return '';
    const num = Number.parseInt(code, 10);
    return Number.isFinite(num) && num >= 32 && num <= 255 ? String.fromCharCode(num) : '';
  });

  return out;
}

/** 剥离 AutoCAD `MTEXT` 富文本格式控制码并保留换行与叠式分数内容。 */
export function stripMtextFormatting(raw: string): string {
  if (!raw) return '';
  const BS = '\uE001';
  const OB = '\uE002';
  const CB = '\uE003';

  let s = raw
    .replace(/\\\\/g, BS)
    .replace(/\\\{/g, OB)
    .replace(/\\\}/g, CB)
    .replace(/\\P/g, '\n')
    .replace(/\\N/g, '\n')
    .replace(/\\~/g, ' ');

  // 叠式分数/公差：\S上^下; 或 \S上/下; 或 \S上#下;
  s = s.replace(/\\S([^;^/#]*)([\^/#])([^;]*);/g, (_m, a: string, sep: string, b: string) => {
    const left = a.trim();
    const right = b.trim();
    if (!left) return right;
    if (!right) return left;
    return sep === '^' ? `${left} ${right}` : `${left}/${right}`;
  });

  // 剥离带分号结尾的参数化格式码（字体、字高、颜色、宽比、倾斜、段落等）
  s = s.replace(/\\[fFAHWCQTWp][^;]*;/g, '');
  // 剥离无分号开关控制码（下划线、上划线、删除线）
  s = s.replace(/\\[LlOoKk]/g, '');
  // 去除分组大括号
  s = s.replace(/[{}]/g, '');

  s = s.replace(/\uE001/g, '\\').replace(/\uE002/g, '{').replace(/\uE003/g, '}');
  return unescapeDxfText(s);
}

/* ================= 2D 仿射矩阵与曲线几何算法 ================= */

type Mat2D = readonly [number, number, number, number, number, number];
const IDENTITY_MAT: Mat2D = [1, 0, 0, 1, 0, 0];

function mulMat(m1: Mat2D, m2: Mat2D): Mat2D {
  return [
    m1[0] * m2[0] + m1[2] * m2[1],
    m1[1] * m2[0] + m1[3] * m2[1],
    m1[0] * m2[2] + m1[2] * m2[3],
    m1[1] * m2[2] + m1[3] * m2[3],
    m1[0] * m2[4] + m1[2] * m2[5] + m1[4],
    m1[1] * m2[4] + m1[3] * m2[5] + m1[5],
  ];
}

function applyMat(m: Mat2D, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

function maxMatrixScale(m: Mat2D): number {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  const s = Math.max(sx, sy);
  return Number.isFinite(s) && s > 1e-9 ? s : 1;
}

function uniformScaleIfSimilar(m: Mat2D): number | null {
  const sx = Math.hypot(m[0], m[1]);
  const sy = Math.hypot(m[2], m[3]);
  if (sx <= 1e-9 || sy <= 1e-9) return null;
  if (Math.abs(sx - sy) / Math.max(sx, sy) > 1e-4) return null;
  const dot = m[0] * m[2] + m[1] * m[3];
  if (Math.abs(dot) / (sx * sy) > 1e-4) return null;
  return (sx + sy) * 0.5;
}

function buildInsertMatrix(
  insX: number,
  insY: number,
  sx: number,
  sy: number,
  rotDeg: number,
  baseX: number,
  baseY: number
): Mat2D {
  const rad = (rotDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const tIns: Mat2D = [1, 0, 0, 1, insX, insY];
  const rMat: Mat2D = [cos, sin, -sin, cos, 0, 0];
  const sMat: Mat2D = [sx, 0, 0, sy, 0, 0];
  const tBase: Mat2D = [1, 0, 0, 1, -baseX, -baseY];
  return mulMat(mulMat(mulMat(tIns, rMat), sMat), tBase);
}

function arcSteps(radiusWorld: number, sweepRad: number, tolWorld: number): number {
  const r = Math.abs(radiusWorld);
  const absSweep = Math.abs(sweepRad);
  if (r <= 1e-9 || absSweep <= 1e-9) return 1;
  const stepAngle =
    r > tolWorld
      ? 2 * Math.acos(Math.max(-1, Math.min(1, 1 - tolWorld / r)))
      : Math.PI / 6;
  const safeStep = Number.isFinite(stepAngle) && stepAngle > 1e-4 ? stepAngle : Math.PI / 12;
  const rawSteps = Math.max(2, Math.min(256, Math.ceil(absSweep / safeStep)));
  if (Math.abs(absSweep - Math.PI * 2) <= 1e-4) {
    return Math.max(12, Math.min(256, Math.ceil(rawSteps / 4) * 4));
  }
  return rawSteps;
}

/** 采样圆弧（逆时针角度，单位弧度）并直接变换到世界坐标。 */
function sampleArcPoints(
  cx: number,
  cy: number,
  r: number,
  startRad: number,
  sweepRad: number,
  mat: Mat2D,
  tolWorld: number,
  includeStart: boolean,
  out: Array<[number, number]>
): void {
  const steps = arcSteps(r * maxMatrixScale(mat), sweepRad, tolWorld);
  const startIdx = includeStart ? 0 : 1;
  for (let i = startIdx; i <= steps; i++) {
    const a = startRad + (sweepRad * i) / steps;
    out.push(applyMat(mat, cx + r * Math.cos(a), cy + r * Math.sin(a)));
  }
}

/** 采样带凸度 `bulge` 的多段线圆弧段（不含起点、含终点）。 */
function sampleBulgeSegment(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  bulge: number,
  mat: Mat2D,
  tolWorld: number,
  out: Array<[number, number]>
): void {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const chord = Math.hypot(dx, dy);
  if (chord <= 1e-9 || Math.abs(bulge) <= 1e-6) {
    out.push(applyMat(mat, x2, y2));
    return;
  }

  // 精确中心解析式：对 |bulge| < 1、= 1、> 1 及正负方向全部无奇点成立
  const k = (1 - bulge * bulge) / (4 * bulge);
  const cx = (x1 + x2) * 0.5 - k * dy;
  const cy = (y1 + y2) * 0.5 + k * dx;
  const r = Math.hypot(x1 - cx, y1 - cy);
  const startRad = Math.atan2(y1 - cy, x1 - cx);
  const sweepRad = 4 * Math.atan(bulge);

  sampleArcPoints(cx, cy, r, startRad, sweepRad, mat, tolWorld, false, out);
}

/** 采样 DXF 椭圆 / 椭圆弧（按参数 `startParam..endParam`）。 */
function sampleDxfEllipse(
  cx: number,
  cy: number,
  majorX: number,
  majorY: number,
  ratio: number,
  startParam: number,
  endParam: number,
  mirrorZ: boolean,
  mat: Mat2D,
  tolWorld: number
): { points: Array<[number, number]>; closed: boolean } {
  const majorLen = Math.hypot(majorX, majorY);
  if (majorLen <= 1e-9 || !Number.isFinite(ratio) || ratio <= 0) {
    return { points: [], closed: false };
  }
  const sign = mirrorZ ? -1 : 1;
  const minorX = -majorY * ratio * sign;
  const minorY = majorX * ratio * sign;

  let sweep = endParam - startParam;
  if (sweep <= 1e-9) sweep += Math.PI * 2;
  const closed = Math.abs(sweep - Math.PI * 2) <= 1e-4;
  const maxR = Math.max(majorLen, majorLen * ratio) * maxMatrixScale(mat);
  const steps = Math.max(closed ? 12 : 4, arcSteps(maxR, sweep, tolWorld));
  const limit = closed ? steps - 1 : steps;

  const pts: Array<[number, number]> = [];
  for (let i = 0; i <= limit; i++) {
    const t = startParam + (sweep * i) / steps;
    const cosT = Math.cos(t);
    const sinT = Math.sin(t);
    const lx = cx + majorX * cosT + minorX * sinT;
    const ly = cy + majorY * cosT + minorY * sinT;
    pts.push(applyMat(mat, lx, ly));
  }
  return { points: pts, closed };
}

/** 评估有理 B 样条曲线（de Boor 齐次坐标算法）。 */
function evalNurbs(
  u: number,
  degree: number,
  knots: readonly number[],
  ctrl: readonly [number, number][],
  weights: readonly number[]
): [number, number] {
  const n = ctrl.length;
  const p = degree;
  let k = p;
  if (u >= knots[n] - 1e-12) {
    k = n - 1;
    while (k > p && knots[k] >= knots[n] - 1e-12) k--;
  } else {
    for (let i = p; i < n; i++) {
      if (u >= knots[i] && u < knots[i + 1]) {
        k = i;
        break;
      }
    }
  }

  const d: Array<[number, number, number]> = [];
  for (let j = 0; j <= p; j++) {
    const idx = Math.max(0, Math.min(n - 1, k - p + j));
    const pt = ctrl[idx];
    const w = weights[idx] ?? 1;
    d.push([pt[0] * w, pt[1] * w, w]);
  }

  for (let r = 1; r <= p; r++) {
    for (let j = p; j >= r; j--) {
      const i = k - p + j;
      const uLeft = knots[i];
      const uRight = knots[i + p + 1 - r];
      const denom = uRight - uLeft;
      const alpha = Math.abs(denom) > 1e-12 ? (u - uLeft) / denom : 0;
      const prev = d[j - 1];
      const curr = d[j];
      d[j] = [
        (1 - alpha) * prev[0] + alpha * curr[0],
        (1 - alpha) * prev[1] + alpha * curr[1],
        (1 - alpha) * prev[2] + alpha * curr[2],
      ];
    }
  }

  const res = d[p];
  const invW = Math.abs(res[2]) > 1e-12 ? 1 / res[2] : 1;
  return [res[0] * invW, res[1] * invW];
}

function buildClampedUniformKnots(ctrlCount: number, degree: number): number[] {
  const total = ctrlCount + degree + 1;
  const interior = total - 2 * (degree + 1);
  const knots: number[] = [];
  for (let i = 0; i <= degree; i++) knots.push(0);
  for (let i = 1; i <= interior; i++) knots.push(i / (interior + 1));
  for (let i = 0; i <= degree; i++) knots.push(1);
  return knots;
}

/** 自适应采样 DXF `SPLINE` 曲线到世界坐标点列。 */
function sampleDxfSpline(
  degreeRaw: number,
  rawKnots: readonly number[],
  ctrl: readonly [number, number][],
  weights: readonly number[],
  fitPoints: readonly [number, number][],
  mat: Mat2D,
  tolWorld: number
): Array<[number, number]> {
  if (ctrl.length < 2) {
    return fitPoints.map(([x, y]) => applyMat(mat, x, y));
  }
  const p = Math.max(1, Math.min(degreeRaw || 3, ctrl.length - 1));
  const knots =
    rawKnots.length === ctrl.length + p + 1
      ? rawKnots
      : buildClampedUniformKnots(ctrl.length, p);

  const uMin = knots[p];
  const uMax = knots[ctrl.length];
  if (!Number.isFinite(uMin) || !Number.isFinite(uMax) || uMax <= uMin + 1e-12) {
    return ctrl.map(([x, y]) => applyMat(mat, x, y));
  }

  const evalWorld = (u: number): [number, number] => {
    const [lx, ly] = evalNurbs(u, p, knots, ctrl, weights);
    return applyMat(mat, lx, ly);
  };

  // 收集非退化节点区间断点，并在每段上自适应二分细化
  const breaks: number[] = [uMin];
  for (let i = p + 1; i <= ctrl.length; i++) {
    const v = knots[i];
    if (v > breaks[breaks.length - 1] + 1e-10 && v <= uMax + 1e-10) {
      breaks.push(Math.min(v, uMax));
    }
  }
  if (breaks.length < 2) breaks.push(uMax);

  const out: Array<[number, number]> = [evalWorld(breaks[0])];

  const pointToSegmentDist = (
    px: number,
    py: number,
    ax: number,
    ay: number,
    bx: number,
    by: number
  ): number => {
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    if (lenSq <= 1e-12) return Math.hypot(px - ax, py - ay);
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lenSq));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  };

  const subdivide = (
    uA: number,
    pA: [number, number],
    uB: number,
    pB: [number, number],
    depth: number
  ): void => {
    const uM = (uA + uB) * 0.5;
    const pM = evalWorld(uM);
    const err = pointToSegmentDist(pM[0], pM[1], pA[0], pA[1], pB[0], pB[1]);
    if (depth >= 7 || (depth >= 1 && err <= tolWorld)) {
      out.push(pM, pB);
      return;
    }
    subdivide(uA, pA, uM, pM, depth + 1);
    subdivide(uM, pM, uB, pB, depth + 1);
  };

  for (let i = 0; i + 1 < breaks.length; i++) {
    const uA = breaks[i];
    const uB = breaks[i + 1];
    const pA = out[out.length - 1];
    const pB = evalWorld(uB);
    subdivide(uA, pA, uB, pB, 0);
  }
  return out;
}

function dedupeWorldPoints(points: readonly [number, number][], closed: boolean): Point[] {
  const out: Point[] = [];
  for (const pt of points) {
    if (!Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
    const prev = out[out.length - 1];
    if (prev && Math.hypot(pt[0] - prev[0], pt[1] - prev[1]) <= 1e-6) continue;
    out.push(pt);
  }
  if (closed && out.length > 2) {
    const first = out[0];
    const last = out[out.length - 1];
    if (Math.hypot(first[0] - last[0], first[1] - last[1]) <= 1e-6) {
      out.pop();
    }
  }
  return out;
}

/* ================= 组码流与实体词法结构 ================= */

interface GroupPair {
  code: number;
  value: string;
}

interface RawEntity {
  type: string;
  pairs: GroupPair[];
  vertices?: RawEntity[];
}

interface ParsedLayerMeta {
  name: string;
  color: number;
  linetype: Linetype;
  hidden: boolean;
}

interface ParsedBlock {
  name: string;
  baseX: number;
  baseY: number;
  entities: RawEntity[];
}

function tokenizeDxf(text: string): GroupPair[] {
  const lines = text.split(/\r\n|\r|\n/);
  const pairs: GroupPair[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const codeStr = lines[i].trim();
    if (!codeStr) {
      // 容错：跳过偶发空行对齐偏移
      i -= 1;
      continue;
    }
    const code = Number.parseInt(codeStr, 10);
    if (!Number.isFinite(code)) continue;
    pairs.push({ code, value: lines[i + 1] });
  }
  return pairs;
}

function normalizeLinetype(raw: string | undefined | null): Linetype | null {
  if (!raw) return null;
  const s = raw.trim().toUpperCase();
  if (!s || s === 'BYLAYER' || s === 'BYBLOCK') return null;
  if (s === 'CONTINUOUS') return 'CONTINUOUS';
  if (s.includes('DOT') && !s.includes('DASH') && !s.includes('CENTER')) return 'DOT';
  if (
    s.includes('DASH') ||
    s.includes('HIDDEN') ||
    s.includes('CENTER') ||
    s.includes('PHANTOM') ||
    s.includes('BORDER') ||
    s.includes('DIVIDE')
  ) {
    return 'DASHED';
  }
  return 'CONTINUOUS';
}

function trueColorIntToAci(value: number): number {
  const r = (value >> 16) & 0xff;
  const g = (value >> 8) & 0xff;
  const b = value & 0xff;
  return colorToAci(rgbToHex(r, g, b));
}

function parseNum(value: string, fallback = 0): number {
  const n = Number.parseFloat(value.trim());
  return Number.isFinite(n) ? n : fallback;
}

function parseIntVal(value: string, fallback = 0): number {
  const n = Number.parseInt(value.trim(), 10);
  return Number.isFinite(n) ? n : fallback;
}

/** 读取实体列表，直到遇到 `stopValues` 中的任意 `0` 组码标识。 */
function readEntityList(
  pairs: readonly GroupPair[],
  startIndex: number,
  stopValues: ReadonlySet<string>
): { entities: RawEntity[]; nextIndex: number } {
  const entities: RawEntity[] = [];
  let i = startIndex;

  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code === 0) {
      const tag = p.value.trim().toUpperCase();
      if (stopValues.has(tag)) break;

      const entity: RawEntity = { type: tag, pairs: [] };
      i++;
      while (i < pairs.length && pairs[i].code !== 0) {
        entity.pairs.push(pairs[i]);
        i++;
      }

      // 合并 POLYLINE + VERTEX... + SEQEND 为复合实体
      if (tag === 'POLYLINE') {
        const verts: RawEntity[] = [];
        while (i < pairs.length) {
          if (pairs[i].code !== 0) {
            i++;
            continue;
          }
          const subTag = pairs[i].value.trim().toUpperCase();
          if (subTag === 'SEQEND') {
            i++;
            while (i < pairs.length && pairs[i].code !== 0) i++;
            break;
          }
          if (stopValues.has(subTag)) break;
          if (subTag === 'VERTEX') {
            const v: RawEntity = { type: 'VERTEX', pairs: [] };
            i++;
            while (i < pairs.length && pairs[i].code !== 0) {
              v.pairs.push(pairs[i]);
              i++;
            }
            verts.push(v);
          } else {
            break;
          }
        }
        entity.vertices = verts;
      }

      if (tag !== 'SEQEND') {
        entities.push(entity);
      }
    } else {
      i++;
    }
  }

  return { entities, nextIndex: i };
}

/* ================= 主解析器实现 ================= */

/**
 * DXF 导入器：支持将 ASCII DXF 文本或字节流解析为统一 `DrawingDocument` IR。
 */
export class DxfImporter {
  private readonly defaults: DxfImportOptions;

  constructor(options: DxfImportOptions = {}) {
    this.defaults = options;
  }

  /** 解析 DXF 并直接返回 `DrawingDocument`。 */
  parse(
    input: string | Uint8Array | ArrayBuffer,
    options: DxfImportOptions = {}
  ): DrawingDocument {
    return parseDxfWithReport(input, { ...this.defaults, ...options }).document;
  }

  /** 解析 DXF 并返回含统计信息与告警的完整报告。 */
  parseWithReport(
    input: string | Uint8Array | ArrayBuffer,
    options: DxfImportOptions = {}
  ): DxfParseResult {
    return parseDxfWithReport(input, { ...this.defaults, ...options });
  }
}

/**
 * 将 ASCII DXF（文本 / `Uint8Array` / `ArrayBuffer`）解析为 `DrawingDocument` IR。
 *
 * 读取外部 `.dxf` 文件时推荐传入原始 `Uint8Array` / `ArrayBuffer`，
 * 以便自动识别 GBK (`ANSI_936`) 与 UTF-8，避免提前按 UTF-8 误读破坏中文。
 */
export function parseDxfToDocument(
  input: string | Uint8Array | ArrayBuffer,
  options: DxfImportOptions = {}
): DrawingDocument {
  return parseDxfWithReport(input, options).document;
}

/**
 * 将 ASCII DXF 解析为 `DrawingDocument` 并附带编码、实体统计与未支持实体告警报告。
 */
export function parseDxfWithReport(
  input: string | Uint8Array | ArrayBuffer,
  options: DxfImportOptions = {}
): DxfParseResult {
  const doc = new DrawingDocument();
  const warnings: string[] = [];
  const stats: DxfParseStats = {
    acadVersion: null,
    codepage: null,
    detectedEncoding: 'string',
    entityCounts: {},
    unsupportedEntities: {},
    skippedPaperSpace: 0,
    skippedHiddenLayer: 0,
    blockCount: 0,
    truncated: false,
  };

  let text = '';
  if (typeof input === 'string') {
    if (input.startsWith(BINARY_DXF_MAGIC)) {
      throw new Error(
        'Binary DXF is not supported yet. Please re-save the file as ASCII DXF.'
      );
    }
    text = input.charCodeAt(0) === 0xfeff ? input.slice(1) : input;
  } else if (input instanceof ArrayBuffer) {
    const decoded = decodeDxfBytes(new Uint8Array(input), options.encoding ?? 'auto');
    text = decoded.text;
    stats.detectedEncoding = decoded.detectedEncoding;
  } else if (ArrayBuffer.isView(input)) {
    const view = new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
    const decoded = decodeDxfBytes(view, options.encoding ?? 'auto');
    text = decoded.text;
    stats.detectedEncoding = decoded.detectedEncoding;
  } else {
    warnings.push('Empty or invalid DXF input.');
    return { document: doc, stats, warnings };
  }

  const pairs = tokenizeDxf(text);
  if (pairs.length === 0) {
    warnings.push('No DXF group-code pairs were found.');
    return { document: doc, stats, warnings };
  }

  const spaceFilter: DxfSpaceFilter = options.space ?? 'model';
  const curveTolerance =
    Number.isFinite(options.curveTolerance) && (options.curveTolerance as number) > 0
      ? (options.curveTolerance as number)
      : 0.1;
  const includeHiddenLayers = options.includeHiddenLayers ?? false;
  const includeUnsupportedWarnings = options.includeUnsupportedWarnings ?? true;
  const maxPrimitives =
    options.maxPrimitives === undefined
      ? 200_000
      : Number.isFinite(options.maxPrimitives) && options.maxPrimitives > 0
        ? Math.floor(options.maxPrimitives)
        : 0;
  const maxBlockDepth =
    Number.isFinite(options.maxBlockDepth) && (options.maxBlockDepth as number) > 0
      ? Math.floor(options.maxBlockDepth as number)
      : 16;

  // 1. 分段解析 HEADER / TABLES / BLOCKS / ENTITIES
  let headerExtMin: [number, number] | null = null;
  let headerExtMax: [number, number] | null = null;
  const layerTable = new Map<string, ParsedLayerMeta>();
  const blocks = new Map<string, ParsedBlock>();
  const topEntities: RawEntity[] = [];

  const END_SECTION_STOPS = new Set(['ENDSEC', 'EOF']);
  const END_BLOCK_STOPS = new Set(['ENDBLK', 'ENDSEC', 'EOF']);

  let i = 0;
  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code === 0 && p.value.trim().toUpperCase() === 'EOF') break;

    if (p.code === 0 && p.value.trim().toUpperCase() === 'SECTION') {
      i++;
      if (i >= pairs.length || pairs[i].code !== 2) continue;
      const sectionName = pairs[i].value.trim().toUpperCase();
      i++;

      if (sectionName === 'HEADER') {
        let currentVar = '';
        let tmpX = NaN;
        let tmpY = NaN;
        const flushExtVar = (): void => {
          if (currentVar === '$EXTMIN' && Number.isFinite(tmpX) && Number.isFinite(tmpY)) {
            headerExtMin = [tmpX, tmpY];
          } else if (
            currentVar === '$EXTMAX' &&
            Number.isFinite(tmpX) &&
            Number.isFinite(tmpY)
          ) {
            headerExtMax = [tmpX, tmpY];
          }
          tmpX = NaN;
          tmpY = NaN;
        };

        while (i < pairs.length) {
          const hp = pairs[i];
          if (hp.code === 0 && hp.value.trim().toUpperCase() === 'ENDSEC') {
            flushExtVar();
            i++;
            break;
          }
          if (hp.code === 9) {
            flushExtVar();
            currentVar = hp.value.trim().toUpperCase();
          } else if (currentVar === '$ACADVER' && hp.code === 1) {
            stats.acadVersion = hp.value.trim() || null;
          } else if (currentVar === '$DWGCODEPAGE' && hp.code === 3) {
            stats.codepage = hp.value.trim() || null;
          } else if (currentVar === '$EXTMIN' || currentVar === '$EXTMAX') {
            if (hp.code === 10) tmpX = parseNum(hp.value, NaN);
            else if (hp.code === 20) tmpY = parseNum(hp.value, NaN);
          }
          i++;
        }
      } else if (sectionName === 'TABLES') {
        while (i < pairs.length) {
          const tp = pairs[i];
          if (tp.code === 0 && tp.value.trim().toUpperCase() === 'ENDSEC') {
            i++;
            break;
          }
          if (tp.code === 0 && tp.value.trim().toUpperCase() === 'TABLE') {
            i++;
            let tableName = '';
            while (i < pairs.length && pairs[i].code !== 0) {
              if (pairs[i].code === 2) tableName = pairs[i].value.trim().toUpperCase();
              i++;
            }
            if (tableName === 'LAYER') {
              while (i < pairs.length) {
                if (pairs[i].code === 0) {
                  const rec = pairs[i].value.trim().toUpperCase();
                  if (rec === 'ENDTAB' || rec === 'ENDSEC') {
                    if (rec === 'ENDTAB') i++;
                    break;
                  }
                  if (rec === 'LAYER') {
                    i++;
                    let rawName = '';
                    let rawColor = 7;
                    let trueColor: number | null = null;
                    let flags = 0;
                    let ltRaw = '';
                    while (i < pairs.length && pairs[i].code !== 0) {
                      const lp = pairs[i];
                      if (lp.code === 2) rawName = unescapeDxfText(lp.value.trim());
                      else if (lp.code === 62) rawColor = parseIntVal(lp.value, 7);
                      else if (lp.code === 420) trueColor = parseIntVal(lp.value, -1);
                      else if (lp.code === 70) flags = parseIntVal(lp.value, 0);
                      else if (lp.code === 6) ltRaw = lp.value.trim();
                      i++;
                    }
                    if (rawName) {
                      const safeName = sanitizeLayerCandidate(rawName, '0');
                      const hidden = rawColor < 0 || (flags & 1) !== 0;
                      const resolvedColor =
                        trueColor !== null && trueColor >= 0
                          ? trueColorIntToAci(trueColor)
                          : Math.max(1, Math.min(255, Math.abs(rawColor) || 7));
                      const linetype = normalizeLinetype(ltRaw) ?? 'CONTINUOUS';
                      if (!layerTable.has(safeName)) {
                        layerTable.set(safeName, {
                          name: safeName,
                          color: resolvedColor,
                          linetype,
                          hidden,
                        });
                      }
                    }
                    continue;
                  }
                }
                i++;
              }
            } else {
              // 跳过其它表（LTYPE/STYLE/VPORT/APPID 等）
              while (i < pairs.length) {
                if (pairs[i].code === 0) {
                  const rec = pairs[i].value.trim().toUpperCase();
                  if (rec === 'ENDTAB') {
                    i++;
                    break;
                  }
                  if (rec === 'ENDSEC') break;
                }
                i++;
              }
            }
          } else {
            i++;
          }
        }
      } else if (sectionName === 'BLOCKS') {
        while (i < pairs.length) {
          const bp = pairs[i];
          if (bp.code === 0 && bp.value.trim().toUpperCase() === 'ENDSEC') {
            i++;
            break;
          }
          if (bp.code === 0 && bp.value.trim().toUpperCase() === 'BLOCK') {
            i++;
            let name = '';
            let baseX = 0;
            let baseY = 0;
            while (i < pairs.length && pairs[i].code !== 0) {
              const hp = pairs[i];
              if (hp.code === 2 || hp.code === 3) {
                const candidate = unescapeDxfText(hp.value.trim());
                if (candidate && !name) name = candidate;
              } else if (hp.code === 10) {
                baseX = parseNum(hp.value, 0);
              } else if (hp.code === 20) {
                baseY = parseNum(hp.value, 0);
              }
              i++;
            }
            const body = readEntityList(pairs, i, END_BLOCK_STOPS);
            i = body.nextIndex;
            if (i < pairs.length && pairs[i].code === 0 && pairs[i].value.trim().toUpperCase() === 'ENDBLK') {
              i++;
              while (i < pairs.length && pairs[i].code !== 0) i++;
            }
            if (name) {
              blocks.set(name, { name, baseX, baseY, entities: body.entities });
            }
          } else {
            i++;
          }
        }
      } else if (sectionName === 'ENTITIES') {
        const res = readEntityList(pairs, i, END_SECTION_STOPS);
        for (const ent of res.entities) topEntities.push(ent);
        i = res.nextIndex;
        if (i < pairs.length && pairs[i].code === 0 && pairs[i].value.trim().toUpperCase() === 'ENDSEC') {
          i++;
        }
      } else {
        // 跳过 CLASSES / OBJECTS / THUMBNAILIMAGE 等非几何段
        while (i < pairs.length) {
          if (pairs[i].code === 0 && pairs[i].value.trim().toUpperCase() === 'ENDSEC') {
            i++;
            break;
          }
          i++;
        }
      }
    } else {
      i++;
    }
  }

  stats.blockCount = blocks.size;

  // 2. 向文档注册图层表（去重并跳过 '0'，避免与 DxfSerializer 固定 0 层重复）
  const registeredLayers = new Set<string>(['0']);
  const ensureLayer = (name: string): string => {
    const safe = sanitizeLayerCandidate(name, '0');
    if (!registeredLayers.has(safe)) {
      registeredLayers.add(safe);
      const meta = layerTable.get(safe);
      doc.addLayer(safe, meta?.color ?? 7, meta?.linetype ?? 'CONTINUOUS');
    }
    return safe;
  };

  for (const meta of layerTable.values()) {
    if (!meta.hidden || includeHiddenLayers) {
      ensureLayer(meta.name);
    }
  }

  // 3. 实体转换上下文（含块嵌套、BYBLOCK/0层继承与上限保护）
  let emitted = 0;
  const canEmit = (): boolean => {
    if (maxPrimitives > 0 && emitted >= maxPrimitives) {
      stats.truncated = true;
      return false;
    }
    return true;
  };

  const countEntity = (type: string): void => {
    stats.entityCounts[type] = (stats.entityCounts[type] ?? 0) + 1;
  };

  const countUnsupported = (type: string): void => {
    stats.unsupportedEntities[type] = (stats.unsupportedEntities[type] ?? 0) + 1;
  };

  interface BlockContext {
    layer: string;
    color: number | null;
    linetype: Linetype | null;
    depth: number;
  }

  const emitEntities = (
    entities: readonly RawEntity[],
    mat: Mat2D,
    blockCtx: BlockContext | null
  ): void => {
    for (const ent of entities) {
      if (!canEmit()) return;

      // 提取公共组码：图层(8)、颜色(62/420)、线型(6)、空间(67)、法向Z(230)
      let rawLayer = '0';
      let rawColor: number | null = null;
      let trueColor: number | null = null;
      let rawLinetype: string | null = null;
      let paperSpace = 0;
      let extrusionZ = 1;

      for (const p of ent.pairs) {
        if (p.code === 8) rawLayer = unescapeDxfText(p.value.trim()) || '0';
        else if (p.code === 62) rawColor = parseIntVal(p.value, 256);
        else if (p.code === 420) trueColor = parseIntVal(p.value, -1);
        else if (p.code === 6) rawLinetype = p.value.trim();
        else if (p.code === 67) paperSpace = parseIntVal(p.value, 0);
        else if (p.code === 230) extrusionZ = parseNum(p.value, 1);
      }

      // 顶层实体应用空间过滤（块内部实体随 INSERT 所在空间）
      if (!blockCtx) {
        if (spaceFilter === 'model' && paperSpace === 1) {
          stats.skippedPaperSpace++;
          continue;
        }
        if (spaceFilter === 'paper' && paperSpace !== 1) {
          stats.skippedPaperSpace++;
          continue;
        }
      }

      // AutoCAD 块继承规则：块内 0 层图元继承 INSERT 图层
      let effectiveLayer = sanitizeLayerCandidate(rawLayer, '0');
      if (blockCtx && effectiveLayer === '0') {
        effectiveLayer = blockCtx.layer;
      }

      const layerMeta = layerTable.get(effectiveLayer);
      if (layerMeta?.hidden && !includeHiddenLayers) {
        stats.skippedHiddenLayer++;
        continue;
      }
      effectiveLayer = ensureLayer(effectiveLayer);

      // 颜色解析：TrueColor(420) > 显式 ACI(1..255) > BYBLOCK(0) 继承块色 > BYLAYER(null/256)
      let color: number | null = null;
      if (trueColor !== null && trueColor >= 0) {
        color = trueColorIntToAci(trueColor);
      } else if (rawColor === 0) {
        color = blockCtx ? blockCtx.color : 0;
      } else if (rawColor !== null && rawColor !== 256) {
        const abs = Math.abs(rawColor);
        color = abs >= 1 && abs <= 255 ? abs : null;
      }

      // 线型解析：BYBLOCK 继承块线型，否则随自身显式线型（BYLAYER 保留 null）
      const ltUpper = rawLinetype ? rawLinetype.trim().toUpperCase() : '';
      const linetype: Linetype | null =
        ltUpper === 'BYBLOCK'
          ? (blockCtx?.linetype ?? null)
          : normalizeLinetype(rawLinetype);

      // OCS 法向 Z < 0 时做局部 X 镜像（AutoCAD 2D 镜像实体常见）
      const entityMat: Mat2D =
        extrusionZ < 0 ? mulMat(mat, [-1, 0, 0, 1, 0, 0]) : mat;

      switch (ent.type) {
        case 'LINE': {
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          for (const p of ent.pairs) {
            if (p.code === 10) x1 = parseNum(p.value);
            else if (p.code === 20) y1 = parseNum(p.value);
            else if (p.code === 11) x2 = parseNum(p.value);
            else if (p.code === 21) y2 = parseNum(p.value);
          }
          const [wx1, wy1] = applyMat(entityMat, x1, y1);
          const [wx2, wy2] = applyMat(entityMat, x2, y2);
          doc.addLine(wx1, wy1, wx2, wy2, effectiveLayer, color, linetype);
          emitted++;
          countEntity('LINE');
          break;
        }

        case 'CIRCLE': {
          let cx = 0;
          let cy = 0;
          let r = 0;
          for (const p of ent.pairs) {
            if (p.code === 10) cx = parseNum(p.value);
            else if (p.code === 20) cy = parseNum(p.value);
            else if (p.code === 40) r = parseNum(p.value);
          }
          if (r <= 0) break;
          const uScale = uniformScaleIfSimilar(entityMat);
          if (uScale !== null) {
            const [wcx, wcy] = applyMat(entityMat, cx, cy);
            doc.addCircle(wcx, wcy, r * uScale, effectiveLayer, color, linetype);
          } else {
            const pts: Array<[number, number]> = [];
            sampleArcPoints(cx, cy, r, 0, Math.PI * 2, entityMat, curveTolerance, true, pts);
            const clean = dedupeWorldPoints(pts, true);
            if (clean.length >= 2) {
              doc.addPolyline(
                clean,
                effectiveLayer,
                color,
                true,
                0,
                linetype ? { linetype } : undefined
              );
            }
          }
          emitted++;
          countEntity('CIRCLE');
          break;
        }

        case 'ARC': {
          let cx = 0;
          let cy = 0;
          let r = 0;
          let startDeg = 0;
          let endDeg = 360;
          for (const p of ent.pairs) {
            if (p.code === 10) cx = parseNum(p.value);
            else if (p.code === 20) cy = parseNum(p.value);
            else if (p.code === 40) r = parseNum(p.value);
            else if (p.code === 50) startDeg = parseNum(p.value);
            else if (p.code === 51) endDeg = parseNum(p.value);
          }
          if (r <= 0) break;
          let sweepDeg = endDeg - startDeg;
          while (sweepDeg <= 0) sweepDeg += 360;
          if (sweepDeg > 360) sweepDeg %= 360;
          const pts: Array<[number, number]> = [];
          sampleArcPoints(
            cx,
            cy,
            r,
            (startDeg * Math.PI) / 180,
            (sweepDeg * Math.PI) / 180,
            entityMat,
            curveTolerance,
            true,
            pts
          );
          const clean = dedupeWorldPoints(pts, false);
          if (clean.length >= 2) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              false,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('ARC');
          }
          break;
        }

        case 'LWPOLYLINE': {
          let flags = 0;
          let constWidth = 0;
          let firstWidth = 0;
          const verts: Array<{ x: number; y: number; bulge: number }> = [];
          let cur: { x: number; y: number; bulge: number } | null = null;

          for (const p of ent.pairs) {
            if (p.code === 70) flags = parseIntVal(p.value, 0);
            else if (p.code === 43) constWidth = parseNum(p.value, 0);
            else if (p.code === 40 && firstWidth === 0) firstWidth = parseNum(p.value, 0);
            else if (p.code === 10) {
              cur = { x: parseNum(p.value), y: 0, bulge: 0 };
              verts.push(cur);
            } else if (p.code === 20 && cur) {
              cur.y = parseNum(p.value);
            } else if (p.code === 42 && cur) {
              cur.bulge = parseNum(p.value, 0);
            }
          }
          if (verts.length < 2) break;

          const closed = (flags & 1) !== 0;
          const sampled: Array<[number, number]> = [applyMat(entityMat, verts[0].x, verts[0].y)];
          const segCount = closed ? verts.length : verts.length - 1;
          for (let s = 0; s < segCount; s++) {
            const v1 = verts[s];
            const v2 = verts[(s + 1) % verts.length];
            sampleBulgeSegment(
              v1.x,
              v1.y,
              v2.x,
              v2.y,
              v1.bulge,
              entityMat,
              curveTolerance,
              sampled
            );
          }
          const clean = dedupeWorldPoints(sampled, closed);
          if (clean.length >= 2) {
            const rawWidth = constWidth > 0 ? constWidth : firstWidth;
            const lw = rawWidth > 0 ? rawWidth * maxMatrixScale(entityMat) : 0;
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              lw,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('LWPOLYLINE');
          }
          break;
        }

        case 'POLYLINE': {
          let flags = 0;
          let defaultW = 0;
          for (const p of ent.pairs) {
            if (p.code === 70) flags = parseIntVal(p.value, 0);
            else if (p.code === 40 && defaultW === 0) defaultW = parseNum(p.value, 0);
            else if (p.code === 41 && defaultW === 0) defaultW = parseNum(p.value, 0);
          }
          // 跳过 3D 多面网格（64）或 3D 多边形网格（16）
          if ((flags & 16) !== 0 || (flags & 64) !== 0) {
            countUnsupported('POLYLINE_MESH');
            break;
          }

          const rawVerts = ent.vertices ?? [];
          const verts: Array<{ x: number; y: number; bulge: number }> = [];
          let vertWidth = 0;
          for (const v of rawVerts) {
            let vx = 0;
            let vy = 0;
            let bulge = 0;
            let vFlags = 0;
            for (const vp of v.pairs) {
              if (vp.code === 10) vx = parseNum(vp.value);
              else if (vp.code === 20) vy = parseNum(vp.value);
              else if (vp.code === 42) bulge = parseNum(vp.value, 0);
              else if (vp.code === 40 && vertWidth === 0) vertWidth = parseNum(vp.value, 0);
              else if (vp.code === 70) vFlags = parseIntVal(vp.value, 0);
            }
            // 跳过样条拟合控制框架顶点（16）与多面网格面记录（128 且非 64）
            if ((vFlags & 16) !== 0 || ((vFlags & 128) !== 0 && (vFlags & 64) === 0)) continue;
            verts.push({ x: vx, y: vy, bulge });
          }
          if (verts.length < 2) break;

          const closed = (flags & 1) !== 0;
          const sampled: Array<[number, number]> = [applyMat(entityMat, verts[0].x, verts[0].y)];
          const segCount = closed ? verts.length : verts.length - 1;
          for (let s = 0; s < segCount; s++) {
            const v1 = verts[s];
            const v2 = verts[(s + 1) % verts.length];
            sampleBulgeSegment(
              v1.x,
              v1.y,
              v2.x,
              v2.y,
              v1.bulge,
              entityMat,
              curveTolerance,
              sampled
            );
          }
          const clean = dedupeWorldPoints(sampled, closed);
          if (clean.length >= 2) {
            const rawWidth = defaultW > 0 ? defaultW : vertWidth;
            const lw = rawWidth > 0 ? rawWidth * maxMatrixScale(entityMat) : 0;
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              lw,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('POLYLINE');
          }
          break;
        }

        case 'SOLID':
        case 'TRACE': {
          let x0 = 0;
          let y0 = 0;
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          let x3 = 0;
          let y3 = 0;
          let has3 = false;
          for (const p of ent.pairs) {
            if (p.code === 10) x0 = parseNum(p.value);
            else if (p.code === 20) y0 = parseNum(p.value);
            else if (p.code === 11) x1 = parseNum(p.value);
            else if (p.code === 21) y1 = parseNum(p.value);
            else if (p.code === 12) x2 = parseNum(p.value);
            else if (p.code === 22) y2 = parseNum(p.value);
            else if (p.code === 13) {
              x3 = parseNum(p.value);
              has3 = true;
            } else if (p.code === 23) {
              y3 = parseNum(p.value);
              has3 = true;
            }
          }
          const p0 = applyMat(entityMat, x0, y0);
          const p1 = applyMat(entityMat, x1, y1);
          const p2 = applyMat(entityMat, x2, y2);
          const p3 = applyMat(entityMat, x3, y3);
          const isTriangle = !has3 || Math.hypot(p3[0] - p2[0], p3[1] - p2[1]) <= 1e-6;
          // 还原 DXF SOLID Z 字序：[p0, p1, p2, p3] -> 轮廓序 [p0, p1, p3, p2]
          const contour: Point[] = isTriangle ? [p0, p1, p2] : [p0, p1, p3, p2];
          doc.addSolid(contour, effectiveLayer, color);
          emitted++;
          countEntity(ent.type);
          break;
        }

        case '3DFACE': {
          let x0 = 0;
          let y0 = 0;
          let x1 = 0;
          let y1 = 0;
          let x2 = 0;
          let y2 = 0;
          let x3 = 0;
          let y3 = 0;
          let has3 = false;
          for (const p of ent.pairs) {
            if (p.code === 10) x0 = parseNum(p.value);
            else if (p.code === 20) y0 = parseNum(p.value);
            else if (p.code === 11) x1 = parseNum(p.value);
            else if (p.code === 21) y1 = parseNum(p.value);
            else if (p.code === 12) x2 = parseNum(p.value);
            else if (p.code === 22) y2 = parseNum(p.value);
            else if (p.code === 13) {
              x3 = parseNum(p.value);
              has3 = true;
            } else if (p.code === 23) {
              y3 = parseNum(p.value);
              has3 = true;
            }
          }
          const rawPts: Array<[number, number]> = [
            applyMat(entityMat, x0, y0),
            applyMat(entityMat, x1, y1),
            applyMat(entityMat, x2, y2),
          ];
          if (has3) rawPts.push(applyMat(entityMat, x3, y3));
          const clean = dedupeWorldPoints(rawPts, true);
          if (clean.length >= 3) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              true,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('3DFACE');
          }
          break;
        }

        case 'ELLIPSE': {
          let cx = 0;
          let cy = 0;
          let mx = 0;
          let my = 0;
          let ratio = 1;
          let startParam = 0;
          let endParam = Math.PI * 2;
          for (const p of ent.pairs) {
            if (p.code === 10) cx = parseNum(p.value);
            else if (p.code === 20) cy = parseNum(p.value);
            else if (p.code === 11) mx = parseNum(p.value);
            else if (p.code === 21) my = parseNum(p.value);
            else if (p.code === 40) ratio = parseNum(p.value, 1);
            else if (p.code === 41) startParam = parseNum(p.value, 0);
            else if (p.code === 42) endParam = parseNum(p.value, Math.PI * 2);
          }
          const { points, closed } = sampleDxfEllipse(
            cx,
            cy,
            mx,
            my,
            ratio,
            startParam,
            endParam,
            extrusionZ < 0,
            mat,
            curveTolerance
          );
          const clean = dedupeWorldPoints(points, closed);
          if (clean.length >= 2) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('ELLIPSE');
          }
          break;
        }

        case 'SPLINE': {
          let flags = 0;
          let degree = 3;
          const knots: number[] = [];
          const weights: number[] = [];
          const ctrl: Array<[number, number]> = [];
          const fit: Array<[number, number]> = [];
          let curCtrl: [number, number] | null = null;
          let curFit: [number, number] | null = null;

          for (const p of ent.pairs) {
            if (p.code === 70) flags = parseIntVal(p.value, 0);
            else if (p.code === 71) degree = parseIntVal(p.value, 3);
            else if (p.code === 40) knots.push(parseNum(p.value));
            else if (p.code === 41) weights.push(parseNum(p.value, 1));
            else if (p.code === 10) {
              curCtrl = [parseNum(p.value), 0];
              ctrl.push(curCtrl);
            } else if (p.code === 20 && curCtrl) {
              curCtrl[1] = parseNum(p.value);
            } else if (p.code === 11) {
              curFit = [parseNum(p.value), 0];
              fit.push(curFit);
            } else if (p.code === 21 && curFit) {
              curFit[1] = parseNum(p.value);
            }
          }

          const closed = (flags & 1) !== 0;
          const pts = sampleDxfSpline(
            degree,
            knots,
            ctrl,
            weights,
            fit,
            entityMat,
            curveTolerance
          );
          const clean = dedupeWorldPoints(pts, closed);
          if (clean.length >= 2) {
            doc.addPolyline(
              clean,
              effectiveLayer,
              color,
              closed,
              0,
              linetype ? { linetype } : undefined
            );
            emitted++;
            countEntity('SPLINE');
          }
          break;
        }

        case 'TEXT':
        case 'ATTRIB': {
          let x10 = 0;
          let y10 = 0;
          let x11 = 0;
          let y11 = 0;
          let has11 = false;
          let h = 2.5;
          let rot = 0;
          let widthFactor = 0.85;
          let rawHAlign = 0;
          let rawVAlign = 0;
          let rawText = '';

          for (const p of ent.pairs) {
            if (p.code === 10) x10 = parseNum(p.value);
            else if (p.code === 20) y10 = parseNum(p.value);
            else if (p.code === 11) {
              x11 = parseNum(p.value);
              has11 = true;
            } else if (p.code === 21) {
              y11 = parseNum(p.value);
              has11 = true;
            } else if (p.code === 40) h = parseNum(p.value, 2.5);
            else if (p.code === 50) rot = parseNum(p.value, 0);
            else if (p.code === 41) widthFactor = parseNum(p.value, 0.85);
            else if (p.code === 72) rawHAlign = parseIntVal(p.value, 0);
            else if (p.code === 73) rawVAlign = parseIntVal(p.value, 0);
            else if (p.code === 1) rawText = p.value;
          }

          const content = unescapeDxfText(rawText).trim();
          if (!content || h <= 0) break;

          let hAlign: HAlign = 0;
          let vAlign: VAlign =
            rawVAlign === 1 || rawVAlign === 2 || rawVAlign === 3 ? rawVAlign : 0;
          if (rawHAlign === 1) hAlign = 1;
          else if (rawHAlign === 2) hAlign = 2;
          else if (rawHAlign === 4) {
            hAlign = 1;
            if (vAlign === 0) vAlign = 2;
          }

          const useAlignPt =
            has11 &&
            (rawHAlign !== 0 || rawVAlign !== 0) &&
            rawHAlign !== 3 &&
            rawHAlign !== 5;
          const ax = useAlignPt ? x11 : x10;
          const ay = useAlignPt ? y11 : y10;
          const [wx, wy] = applyMat(entityMat, ax, ay);

          const baseWf = widthFactor > 0 ? widthFactor : 0.85;
          let worldRot = rot;
          let worldH = h;
          let wf = baseWf;
          if (entityMat !== IDENTITY_MAT) {
            const rad = (rot * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const vx = entityMat[0] * cos + entityMat[2] * sin;
            const vy = entityMat[1] * cos + entityMat[3] * sin;
            const ux = -entityMat[0] * sin + entityMat[2] * cos;
            const uy = -entityMat[1] * sin + entityMat[3] * cos;
            worldRot = (Math.atan2(vy, vx) * 180) / Math.PI;
            const yLen = Math.hypot(ux, uy);
            worldH = h * (yLen || 1);
            const scaleRatio = yLen > 1e-6 ? Math.hypot(vx, vy) / yLen : 1;
            wf = Math.max(0.1, baseWf * scaleRatio);
          }

          doc.addText(
            wx,
            wy,
            worldH,
            content,
            effectiveLayer,
            color,
            Math.abs(worldRot) < 1e-6 ? 0 : worldRot,
            hAlign,
            vAlign,
            wf
          );
          emitted++;
          countEntity(ent.type);
          break;
        }

        case 'MTEXT': {
          let x = 0;
          let y = 0;
          let dirX = 0;
          let dirY = 0;
          let hasDir = false;
          let h = 2.5;
          let rot50 = 0;
          let attach = 1;
          let chunks = '';

          for (const p of ent.pairs) {
            if (p.code === 10) x = parseNum(p.value);
            else if (p.code === 20) y = parseNum(p.value);
            else if (p.code === 11) {
              dirX = parseNum(p.value);
              hasDir = true;
            } else if (p.code === 21) {
              dirY = parseNum(p.value);
              hasDir = true;
            } else if (p.code === 40) h = parseNum(p.value, 2.5);
            else if (p.code === 50) rot50 = parseNum(p.value, 0);
            else if (p.code === 71) attach = parseIntVal(p.value, 1);
            else if (p.code === 3) chunks += p.value;
            else if (p.code === 1) chunks += p.value;
          }

          const content = stripMtextFormatting(chunks).trim();
          if (!content || h <= 0) break;

          // MTEXT 组码 11/21 方向向量优先于组码 50 旋转角
          const localRot =
            hasDir && Math.hypot(dirX, dirY) > 1e-6
              ? (Math.atan2(dirY, dirX) * 180) / Math.PI
              : rot50;

          const colIdx = (attach - 1) % 3; // 0=L, 1=C, 2=R
          const rowIdx = Math.floor((attach - 1) / 3); // 0=T, 1=M, 2=B
          const hAlign: HAlign = colIdx === 1 ? 1 : colIdx === 2 ? 2 : 0;
          const vAlign: VAlign = rowIdx === 0 ? 3 : rowIdx === 2 ? 1 : 2;

          const [wx, wy] = applyMat(entityMat, x, y);
          let worldRot = localRot;
          let worldH = h;
          if (entityMat !== IDENTITY_MAT) {
            const rad = (localRot * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);
            const vx = entityMat[0] * cos + entityMat[2] * sin;
            const vy = entityMat[1] * cos + entityMat[3] * sin;
            const ux = -entityMat[0] * sin + entityMat[2] * cos;
            const uy = -entityMat[1] * sin + entityMat[3] * cos;
            worldRot = (Math.atan2(vy, vx) * 180) / Math.PI;
            worldH = h * (Math.hypot(ux, uy) || 1);
          }

          // 多行 MTEXT：DrawingDocument.addText 以锚点为垂直中心展开，
          // 顶对齐(3)下移半块高度、底对齐(1)上移半块高度以保持真实贴边位置。
          const lineCount = content.split('\n').length;
          let adjX = wx;
          let adjY = wy;
          if (lineCount > 1 && (vAlign === 3 || vAlign === 1)) {
            const halfBlock = ((lineCount - 1) * worldH * 1.35) / 2;
            const shift = vAlign === 3 ? -halfBlock : halfBlock;
            const wRad = (worldRot * Math.PI) / 180;
            adjX += -Math.sin(wRad) * shift;
            adjY += Math.cos(wRad) * shift;
          }

          const beforeCmds = doc.commands.length;
          doc.addText(
            adjX,
            adjY,
            worldH,
            content,
            effectiveLayer,
            color,
            Math.abs(worldRot) < 1e-6 ? 0 : worldRot,
            hAlign,
            vAlign,
            0.85
          );
          emitted += doc.commands.length - beforeCmds;
          countEntity('MTEXT');
          break;
        }

        case 'POINT': {
          let x = 0;
          let y = 0;
          for (const p of ent.pairs) {
            if (p.code === 10) x = parseNum(p.value);
            else if (p.code === 20) y = parseNum(p.value);
          }
          const [wx, wy] = applyMat(entityMat, x, y);
          doc.addCircle(wx, wy, 0.25, effectiveLayer, color);
          emitted++;
          countEntity('POINT');
          break;
        }

        case 'INSERT': {
          const depth = blockCtx ? blockCtx.depth + 1 : 1;
          if (depth > maxBlockDepth) {
            warnings.push(`Maximum INSERT nesting depth (${maxBlockDepth}) reached; skipped.`);
            break;
          }
          let blockName = '';
          let insX = 0;
          let insY = 0;
          let sx = 1;
          let sy = 1;
          let rot = 0;
          let cols = 1;
          let rows = 1;
          let colSpacing = 0;
          let rowSpacing = 0;

          for (const p of ent.pairs) {
            if (p.code === 2) blockName = unescapeDxfText(p.value.trim());
            else if (p.code === 10) insX = parseNum(p.value);
            else if (p.code === 20) insY = parseNum(p.value);
            else if (p.code === 41) sx = parseNum(p.value, 1);
            else if (p.code === 42) sy = parseNum(p.value, 1);
            else if (p.code === 50) rot = parseNum(p.value, 0);
            else if (p.code === 70) cols = Math.max(1, parseIntVal(p.value, 1));
            else if (p.code === 71) rows = Math.max(1, parseIntVal(p.value, 1));
            else if (p.code === 44) colSpacing = parseNum(p.value, 0);
            else if (p.code === 45) rowSpacing = parseNum(p.value, 0);
          }

          const block = blocks.get(blockName);
          if (!block) {
            if (blockName) countUnsupported(`MISSING_BLOCK:${blockName}`);
            break;
          }

          countEntity('INSERT');
          const rad = (rot * Math.PI) / 180;
          const cos = Math.cos(rad);
          const sin = Math.sin(rad);
          const nextCtx: BlockContext = {
            layer: effectiveLayer,
            color,
            linetype,
            depth,
          };

          for (let rIdx = 0; rIdx < rows; rIdx++) {
            for (let cIdx = 0; cIdx < cols; cIdx++) {
              if (!canEmit()) return;
              const localDx = cIdx * colSpacing;
              const localDy = rIdx * rowSpacing;
              const offX = insX + localDx * cos - localDy * sin;
              const offY = insY + localDx * sin + localDy * cos;
              const localMat = buildInsertMatrix(
                offX,
                offY,
                sx,
                sy,
                rot,
                block.baseX,
                block.baseY
              );
              emitEntities(block.entities, mulMat(entityMat, localMat), nextCtx);
            }
          }
          break;
        }

        case 'DIMENSION': {
          // 优先展开 AutoCAD 自动生成的匿名标注块 (*D1, *D2...)
          let dimBlockName = '';
          for (const p of ent.pairs) {
            if (p.code === 2) {
              dimBlockName = unescapeDxfText(p.value.trim());
              break;
            }
          }
          const dimBlock = dimBlockName ? blocks.get(dimBlockName) : undefined;
          const depth = blockCtx ? blockCtx.depth + 1 : 1;
          if (dimBlock && depth <= maxBlockDepth) {
            countEntity('DIMENSION');
            const localMat = buildInsertMatrix(0, 0, 1, 1, 0, dimBlock.baseX, dimBlock.baseY);
            emitEntities(dimBlock.entities, mulMat(entityMat, localMat), {
              layer: effectiveLayer,
              color,
              linetype,
              depth,
            });
          } else {
            countUnsupported('DIMENSION');
          }
          break;
        }

        case 'ATTDEF':
          // 块定义模板占位符，仅在作为真实 ATTRIB 实例化时渲染，此处静默跳过
          break;

        default:
          countUnsupported(ent.type);
          break;
      }
    }
  };

  emitEntities(topEntities, IDENTITY_MAT, null);

  // 4. 自动根据实际生成图元计算精确包围盒（避开外部 DXF 中常见的过期 $EXTMIN/$EXTMAX）
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const include = (x: number, y: number): void => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };

  for (const cmd of doc.commands) {
    switch (cmd.type) {
      case 'line':
        include(cmd.x1, cmd.y1);
        include(cmd.x2, cmd.y2);
        break;
      case 'circle':
        include(cmd.cx - cmd.r, cmd.cy - cmd.r);
        include(cmd.cx + cmd.r, cmd.cy + cmd.r);
        break;
      case 'polyline':
        for (const [px, py] of cmd.points) include(px, py);
        break;
      case 'text':
        include(cmd.x, cmd.y);
        break;
      case 'solid':
        for (const [px, py] of cmd.points) include(px, py);
        break;
    }
  }

  if (Number.isFinite(minX) && Number.isFinite(minY)) {
    if (maxX === minX) maxX = minX + 1;
    if (maxY === minY) maxY = minY + 1;
    doc.setExtents(minX, minY, maxX, maxY);
  } else if (
    headerExtMin &&
    headerExtMax &&
    headerExtMax[0] > headerExtMin[0] &&
    headerExtMax[1] > headerExtMin[1] &&
    Math.abs(headerExtMin[0]) < 1e15 &&
    Math.abs(headerExtMax[0]) < 1e15
  ) {
    doc.setExtents(headerExtMin[0], headerExtMin[1], headerExtMax[0], headerExtMax[1]);
  }

  // 5. 汇总告警
  if (stats.truncated) {
    warnings.push(`Entity limit (${maxPrimitives}) reached; remaining geometry was truncated.`);
  }
  if (includeUnsupportedWarnings) {
    const entries = Object.entries(stats.unsupportedEntities);
    if (entries.length > 0) {
      const summary = entries.map(([name, cnt]) => `${name}(${cnt})`).join(', ');
      warnings.push(`Skipped unsupported DXF entities: ${summary}`);
    }
  }

  return { document: doc, stats, warnings };
}
