/**
 * 浏览器平台适配层：把字节/文本触发为文件下载。
 *
 * 这是全库唯一依赖 `document`/`URL`/`Blob` 的下载工具，与 render 层一样只在
 * 浏览器子入口暴露；Node 环境调用会抛错并提示改用 toBytes()/toText() 自行写文件。
 * 【勿改·历史兼容】revokeDelayMs 默认 0（立即 revoke），大文件在慢浏览器上才需调大。
 */

import type { DocumentLike } from '../core/data';
import type { TextCodec } from '../encoding';
import { DxfSerializer, type DxfSerializeOptions } from '../dxf/serializer';
import { SvgSerializer, type SvgSerializeOptions } from '../svg/serializer';

/** 下载选项。 */
export interface DownloadOptions {
  filename: string;
  mimeType?: string;
  /**
   * revoke object URL 前的延迟（毫秒），默认 0（立即 revoke，历史行为）。
   * 慢浏览器上下载超大文件时可适当调大。
   */
  revokeDelayMs?: number;
}

/** 环境守卫：缺少 document/URL/Blob 时抛错并给出替代方案。 */
function assertBrowser(): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof Blob === 'undefined') {
    throw new Error(
      'Browser download API is not available in this environment. ' +
        'Use DxfExporter.toBytes()/SvgExporter.toText() and write the bytes yourself.'
    );
  }
}

/**
 * 触发原始字节/Blob/字符串的浏览器下载。
 *
 * 把数据包成 Blob → createObjectURL → 临时 <a download> 触发点击 → 立即移除。
 * 部分老浏览器要求 <a> 挂到文档上才会触发下载，故挂到 body（缺失则用 documentElement）。
 * 【勿改·历史兼容】revokeDelayMs 默认 0，立即 revokeObjectURL。
 */
export function downloadBytes(data: Uint8Array | Blob | string, options: DownloadOptions): void {
  assertBrowser();

  const blob =
    data instanceof Blob
      ? data
      : new Blob([data as BlobPart], {
          type: options.mimeType ?? 'application/octet-stream',
        });

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = options.filename;
  // 部分浏览器（老 Firefox/Safari）只有 anchor 挂到文档时才触发下载；
  // document.body 为 null 时用 documentElement 兜底。
  const mount = document.body ?? document.documentElement;
  if (mount) mount.appendChild(anchor);
  anchor.click();
  if (mount) anchor.remove();

  const delay = options.revokeDelayMs ?? 0;
  if (delay > 0) {
    setTimeout(() => URL.revokeObjectURL(url), delay);
  } else {
    URL.revokeObjectURL(url);
  }
}

/** DXF 下载选项：序列化选项 + 下载选项，另可传自定义 codec。 */
export interface DownloadDxfOptions extends DxfSerializeOptions, DownloadOptions {
  /** 可选自定义 codec（例如接收 onUnencodable 回调）。 */
  codec?: TextCodec;
}

/** 序列化 + 编码 + 下载 DXF（仅浏览器）。 */
export function downloadDxf(doc: DocumentLike, options: DownloadDxfOptions): void {
  const { filename, mimeType, revokeDelayMs, codec, ...serializeOptions } = options;
  const bytes = new DxfSerializer({ codec }).toBytes(doc, serializeOptions);

  downloadBytes(new Blob([bytes as BlobPart], { type: mimeType ?? 'application/dxf' }), {
    filename,
    revokeDelayMs,
  });
}

/** SVG 下载选项：序列化选项 + 下载选项。 */
export interface DownloadSvgOptions extends SvgSerializeOptions, DownloadOptions {}

/** 序列化 + 下载 SVG（仅浏览器），默认 export 模式。 */
export function downloadSvg(doc: DocumentLike, options: DownloadSvgOptions): void {
  const { filename, mimeType, revokeDelayMs, ...serializeOptions } = options;
  const text = new SvgSerializer().serialize(doc, {
    mode: 'export',
    ...serializeOptions,
  });

  downloadBytes(
    new Blob([text], { type: mimeType ?? 'image/svg+xml;charset=utf-8' }),
    { filename, revokeDelayMs }
  );
}
