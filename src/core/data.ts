/**
 * 文档数据适配层（鸭子类型桥）。
 *
 * 这是所有输出端/渲染端的统一入口：无论拿到的是普通 `DocumentData` 快照，
 * 还是像 `DrawingDocument` 这样带 `toJSON()` 的 builder，都能取到同一份可
 * 消费的数据。DXF/SVG 序列化器与双视图预览都通过这里取数。
 */

import type { DocumentData } from './types';

/** 任何可当作文档的对象：普通快照，或提供 toJSON() 的 builder。 */
export type DocumentLike = DocumentData | { toJSON(): DocumentData };

/**
 * 从 `DocumentLike` 取出 `DocumentData` 快照。
 *
 * 参数：doc 为普通快照或带 toJSON() 的对象。
 * 返回：若有 toJSON() 方法就调用它取值，否则把入参当作快照原样返回。
 * 注意：核心调用链的第一环——
 *       resolveDocumentData → createLayerLookup → resolveCommandStyle →
 *       theme.resolveAci → fmtNumber → isPaperCommand/isBoldText，
 *       这条链是三端视觉与输出一致的保证。
 */
export function resolveDocumentData(doc: DocumentLike): DocumentData {
  const candidate = doc as { toJSON?: unknown };
  if (typeof candidate.toJSON === 'function') {
    return (doc as { toJSON(): DocumentData }).toJSON();
  }
  return doc as DocumentData;
}
