/**
 * 把值转义成可安全放进 SVG 文本节点或属性值的字符串。
 *
 * 依次替换 & < > " ' 五个字符，防止文本内容破坏 SVG 结构。
 */
export function escapeXml(str: unknown): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
