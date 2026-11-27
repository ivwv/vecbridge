/**
 * DXF 输出端出口：把 IR 快照序列化为 DXF R12（AC1009）文本或字节。
 *
 * 输出严格遵循 HEADER → TABLES → ENTITIES → EOF 的组码顺序，且受
 * 「输出字节稳定性契约」保护——组码顺序、换行、清洗规则均不可随意改动。
 */
export * from './serializer'; // DxfSerializer、DxfExporter 与实体校验 validateCommand
export * from './parser'; // DxfImporter、parseDxfToDocument 与 parseDxfWithReport（DXF → IR）
