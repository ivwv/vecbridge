/**
 * Unicode → GBK 反查表。
 *
 * 浏览器/Node 的 `TextEncoder` 只支持 UTF-8，没有 GBK 编码器，因此这里通过
 * `TextDecoder('gbk')` 反向解码所有合法的 GBK 双字节序列，重建"字符 → 双字节"
 * 的映射。
 *
 * GBK 双字节结构：
 *   首字节（lead byte） 0x81 - 0xFE
 *   尾字节（trail byte） 0x40 - 0xFE（排除 0x7F）
 *
 * 缓存挂在 `globalThis` 的一个 `Symbol.for` 键上，这样包的重复实例
 * （ESM + CJS，或两个子路径各引入一份）共享同一张表，避免重复构建。
 */

interface GbkCacheState {
  table: Map<string, [number, number]> | null;
  decoder: TextDecoder | null;
  decoderReady: boolean;
}

const GBK_CACHE_KEY = Symbol.for('vecbridge.gbkCache');
const globalScope = globalThis as unknown as Record<symbol, unknown>;

// 从全局取缓存；没有就创建并写回全局，保证跨模块实例共享。
const cache: GbkCacheState =
  (globalScope[GBK_CACHE_KEY] as GbkCacheState | undefined) ??
  (() => {
    const state: GbkCacheState = {
      table: null,
      decoder: null,
      decoderReady: false,
    };
    globalScope[GBK_CACHE_KEY] = state;
    return state;
  })();

/**
 * 内部函数：获取共享的 GBK 解码器（非公开 API）。
 * 依次尝试 gbk → gb18030 → gb2312，都不支持则返回 null。
 */
export function getGbkDecoder(): TextDecoder | null {
  if (cache.decoderReady) return cache.decoder;
  cache.decoderReady = true;
  try {
    cache.decoder = new TextDecoder('gbk');
  } catch {
    try {
      cache.decoder = new TextDecoder('gb18030');
    } catch {
      try {
        cache.decoder = new TextDecoder('gb2312');
      } catch {
        cache.decoder = null;
      }
    }
  }
  return cache.decoder;
}

/** 当前环境是否支持 GBK 系列解码。 */
export function isGbkSupported(): boolean {
  return !!getGbkDecoder();
}

/**
 * 获取 Unicode → GBK 双字节的反查表（延迟构建，结果缓存）。
 *
 * 快路径：把所有双字节对用 0x0A 分隔后一次性解码，再按换行拆分（约 50 倍加速）；
 * 用"行数 == 对数+1 且末行为空"校验对齐，一旦运行时丢行/错位，就回退到逐对解码。
 * 两条路径都只保留能解出单个有效字符（排除 U+FFFD/FFFE/FFFF）的映射，且同名字符
 * 保留首次出现的编码。
 * 返回：字符 → [首字节, 尾字节] 的 Map；环境不支持 GBK 时返回空表。
 */
export function getGbkTable(): Map<string, [number, number]> {
  if (cache.table) return cache.table;

  const decoder = getGbkDecoder();
  const map = new Map<string, [number, number]>();
  if (!decoder) {
    cache.table = map;
    return map;
  }

  // 加速构建：把每个双字节对用 0x0A 分隔，一次性解码（比逐对解码快约 50 倍）。
  const totalPairs = (0xfe - 0x81 + 1) * (0xfe - 0x40);
  const buf = new Uint8Array(totalPairs * 3);
  const pairs = new Uint16Array(totalPairs);
  let ptr = 0;
  let idx = 0;
  for (let b1 = 0x81; b1 <= 0xfe; b1++) {
    for (let b2 = 0x40; b2 <= 0xfe; b2++) {
      if (b2 === 0x7f) continue;
      buf[ptr++] = b1;
      buf[ptr++] = b2;
      buf[ptr++] = 0x0a;
      pairs[idx++] = (b1 << 8) | b2;
    }
  }

  try {
    const decodedLines = decoder.decode(buf).split('\n');
    // 每对后面都跟一个 0x0A，正确解码会得到一个尾随空串；否则说明运行时
    // 丢行或错位，整张表会错位——此时回退到逐对解码。
    if (decodedLines.length === totalPairs + 1 && decodedLines[totalPairs] === '') {
      for (let i = 0; i < totalPairs; i++) {
        const ch = decodedLines[i];
        if (ch && ch.length === 1 && ch !== '\uFFFD' && ch !== '\uFFFE' && ch !== '\uFFFF') {
          if (!map.has(ch)) {
            const code = pairs[i];
            map.set(ch, [code >> 8, code & 0xff]);
          }
        }
      }
      cache.table = map;
      return map;
    }
  } catch {
    map.clear();
    /* 回退到逐对解码 */
  }

  // 兜底路径：逐个双字节对解码。不可删除——快路径对齐校验失败时靠它保证正确。
  for (let b1 = 0x81; b1 <= 0xfe; b1++) {
    for (let b2 = 0x40; b2 <= 0xfe; b2++) {
      if (b2 === 0x7f) continue;
      const bytes = new Uint8Array([b1, b2]);
      let ch: string;
      try {
        ch = decoder.decode(bytes);
      } catch {
        continue;
      }
      if (ch && ch.length === 1 && ch !== '\uFFFD' && ch !== '\uFFFE' && ch !== '\uFFFF') {
        if (!map.has(ch)) map.set(ch, [b1, b2]);
      }
    }
  }
  cache.table = map;
  return map;
}

/** 测试辅助：清空缓存的表与解码器，让下次调用重新构建。 */
export function resetGbkCache(): void {
  cache.table = null;
  cache.decoder = null;
  cache.decoderReady = false;
}
