/**
 * 文本编解码层：字符串与 UTF-8/GBK 字节之间的双向转换。
 *
 * 解码走 `TextDecoder`（浏览器与带完整 ICU 的 Node 原生支持 GBK）；
 * 编码到 GBK 则依赖延迟构建的反查表，表外字符被转义为 AutoCAD 原生理解的
 * CAD `\U+XXXX` 序列。这是 DXF 中文兼容的关键一环。
 */

import { getGbkDecoder, getGbkTable, isGbkSupported } from './gbk-table';

// 编解码器实例懒加载缓存：首次使用时才 new，避免无谓开销。
let utf8Encoder: TextEncoder | null = null;
let utf8Decoder: TextDecoder | null = null;
let utf8FatalDecoder: TextDecoder | null = null;
let utf16leDecoder: TextDecoder | null = null;
let utf16beDecoder: TextDecoder | null = null;

const getUtf8Encoder = (): TextEncoder => (utf8Encoder ??= new TextEncoder());
const getUtf8Decoder = (): TextDecoder => (utf8Decoder ??= new TextDecoder('utf-8'));
// fatal 版：遇到非法 UTF-8 直接抛错，供 decodeAuto 做"严格 UTF-8 探测"。
const getUtf8FatalDecoder = (): TextDecoder =>
  (utf8FatalDecoder ??= new TextDecoder('utf-8', { fatal: true }));
const getUtf16leDecoder = (): TextDecoder => (utf16leDecoder ??= new TextDecoder('utf-16le'));
const getUtf16beDecoder = (): TextDecoder => (utf16beDecoder ??= new TextDecoder('utf-16be'));

/** 支持的编码名称。 */
export type EncodingName = 'utf-8' | 'gbk' | 'gb2312' | 'gb18030';

/** 编解码器可选配置。 */
export interface TextCodecOptions {
  /** 每次 encodeToGbk() 遇到表外字符时调用一次，参数是转换记录列表。 */
  onUnencodable?: (entries: string[]) => void;
  /**
   * 复现旧实现的 `console.info` 报告，输出表外字符。
   * 默认关闭——库不应无条件打印日志。
   */
  warnOnUnencodable?: boolean;
}

/**
 * 双向文本编解码器。
 *
 * 解码走 `TextDecoder`（浏览器与带完整 ICU 的 Node 原生支持 GBK）；
 * 编码到 GBK 用延迟构建的反查表；表外字符转义成 CAD `\U+XXXX`，AutoCAD 原生识别。
 */
export class TextCodec {
  private readonly options: TextCodecOptions;

  constructor(options: TextCodecOptions = {}) {
    this.options = options;
  }

  /** 按显式编码把字节解成字符串；GBK 系列走 GBK 解码器，否则按 UTF-8。 */
  decode(bytes: Uint8Array, encoding: EncodingName | string = 'utf-8'): string {
    const enc = String(encoding || 'utf-8').toLowerCase();
    if (enc === 'gbk' || enc === 'gb2312' || enc === 'gb18030') {
      const decoder = getGbkDecoder();
      if (!decoder) {
        // 环境没有 GBK 解码器时，退回 UTF-8。
        return getUtf8Decoder().decode(bytes);
      }
      return decoder.decode(bytes);
    }
    return getUtf8Decoder().decode(bytes);
  }

  /**
   * 自动探测编码，依次尝试：BOM → 严格 UTF-8 → GBK 回退 → 宽松 UTF-8。
   *
   * GBK 回退的取舍：先用 GBK 解码，只有当替换字符（U+FFFD）占比 < 5%
   * 时才采信结果，否则认为这不是 GBK。UTF-32LE 的 BOM 与 UTF-16LE 前缀相同，
   * 需要特判排除，避免误判。
   * 参数：bytes 为待探测的字节流。
   * 返回：解出的字符串。
   */
  decodeAuto(bytes: Uint8Array): string {
    if (!bytes || bytes.length === 0) return '';

    // UTF-8 BOM（EF BB BF）：跳过 BOM 后按 UTF-8 解码。
    if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
      return getUtf8Decoder().decode(bytes.subarray(3));
    }
    // UTF-16LE BOM（FF FE）与 UTF-32LE 前缀相同，先用 4 字节排除 UTF-32LE。
    const isUtf32LeBom =
      bytes.length >= 4 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xfe &&
      bytes[2] === 0x00 &&
      bytes[3] === 0x00;
    if (!isUtf32LeBom && bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return getUtf16leDecoder().decode(bytes.subarray(2));
    }
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return getUtf16beDecoder().decode(bytes.subarray(2));
    }

    try {
      // 先用严格 UTF-8，非法字节会抛错。
      return getUtf8FatalDecoder().decode(bytes);
    } catch {
      const gbkDecoder = getGbkDecoder();
      if (gbkDecoder) {
        try {
          const text = gbkDecoder.decode(bytes);
          let bad = 0;
          for (let i = 0; i < text.length; i++) {
            if (text.charCodeAt(i) === 0xfffd) bad++;
          }
          // 替换字符占比低于 5% 才认为是有效 GBK 文本。
          if (bad / Math.max(1, text.length) < 0.05) return text;
        } catch {
          /* 继续往下走，退回宽松 UTF-8 */
        }
      }
      return getUtf8Decoder().decode(bytes);
    }
  }

  /** 字符串 → UTF-8 字节。 */
  encodeToUtf8(str: string): Uint8Array {
    return getUtf8Encoder().encode(str);
  }

  /**
   * 字符串 → GBK 字节；GBK 表外字符变成 `\U+XXXX` 转义文本。
   *
   * 注意：【勿改·历史兼容】遍历按 UTF-16 code unit（而非码点）进行，
   * emoji 等增补字符会产生两个转义。此行为为 v1 输出兼容而锁定，勿改。
   * 缓冲按 max(16, len*2) 预分配，转义结果可能比原字符更长，故需动态扩容。
   */
  encodeToGbk(str: string): Uint8Array {
    const table = getGbkTable();
    let buf = new Uint8Array(Math.max(16, str.length * 2));
    let pos = 0;
    const unencodable: string[] = [];

    // 保证还能再写 extra 个字节，不够就翻倍扩容。
    const ensureCapacity = (extra: number): void => {
      if (pos + extra <= buf.length) return;
      let nextSize = buf.length * 2;
      while (nextSize < pos + extra) nextSize *= 2;
      const grown = new Uint8Array(nextSize);
      grown.set(buf.subarray(0, pos));
      buf = grown;
    };

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      if (code < 0x80) {
        // ASCII 直接单字节写入。
        ensureCapacity(1);
        buf[pos++] = code;
        continue;
      }
      const ch = str.charAt(i);
      const pair = table.get(ch);
      if (pair) {
        // 表内字符：写 GBK 双字节。
        ensureCapacity(2);
        buf[pos++] = pair[0];
        buf[pos++] = pair[1];
      } else {
        // 表外字符：写成 \U+XXXX 的 ASCII 转义（6 个字符）。
        const esc = '\\U+' + code.toString(16).toUpperCase().padStart(4, '0');
        unencodable.push(ch + ' -> ' + esc);
        ensureCapacity(esc.length);
        for (let k = 0; k < esc.length; k++) buf[pos++] = esc.charCodeAt(k);
      }
    }

    if (unencodable.length > 0) this.reportUnencodable(unencodable);
    return buf.slice(0, pos);
  }

  /** 当前环境是否支持 GBK 解码。 */
  isGbkSupported(): boolean {
    return isGbkSupported();
  }

  /** 强制构建反查表（批量任务或 worker 预热时有用）。 */
  warmup(): void {
    getGbkTable();
  }

  /** 返回反查表条目数。 */
  getTableSize(): number {
    return getGbkTable().size;
  }

  /** 按配置上报表外字符：回调 onUnencodable，或在开启时打印旧式日志。 */
  private reportUnencodable(entries: string[]): void {
    if (this.options.onUnencodable) {
      this.options.onUnencodable(entries);
    }
    if (this.options.warnOnUnencodable) {
      const preview = entries.slice(0, 50).join('\n');
      const suffix = entries.length > 50 ? '\n... total ' + entries.length : '';
      console.info(
        '[vecbridge] characters outside GBK were escaped as CAD \\U+XXXX:\n' +
          preview +
          suffix
      );
    }
  }
}

/** 共享的默认编解码器实例。 */
export const textCodec = new TextCodec();

/** 便捷函数：委托给共享实例 textCodec。 */
export function decode(bytes: Uint8Array, encoding?: EncodingName | string): string {
  return textCodec.decode(bytes, encoding);
}
/** 便捷函数：自动探测编码解码，委托给共享实例。 */
export function decodeAuto(bytes: Uint8Array): string {
  return textCodec.decodeAuto(bytes);
}
/** 便捷函数：编码到 UTF-8，委托给共享实例。 */
export function encodeToUtf8(str: string): Uint8Array {
  return textCodec.encodeToUtf8(str);
}
/** 便捷函数：编码到 GBK，委托给共享实例。 */
export function encodeToGbk(str: string): Uint8Array {
  return textCodec.encodeToGbk(str);
}
