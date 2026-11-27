/**
 * 文本编解码层出口。
 *
 * 负责字符串与 UTF-8/GBK 字节之间的双向转换，是 DXF 中文兼容的关键：
 * DXF 输出用 GBK 字节编码，表外字符转义为 CAD 的 `\U+XXXX`。本层与 core
 * 一样是纯计算、环境无关，Node 中可安全使用。
 */
export * from './codec'; // TextCodec 类、共享实例 textCodec 与 4 个便捷函数
export { isGbkSupported, getGbkTable, resetGbkCache } from './gbk-table'; // GBK 反查表能力探测、构建与测试用重置
