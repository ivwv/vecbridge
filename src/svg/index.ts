/**
 * SVG 输出端出口：把 IR 快照序列化为 SVG 文本。
 *
 * 支持 live（实时预览）与 export（静态导出）两种模式；SVG 坐标对世界坐标
 * 做 Y 翻转（y → -y），并与 Canvas 相机共用同一套 viewBox 约定，保证双视图
 * 预览时两端 1:1 对齐。纯计算、环境无关。
 */
export * from './serializer'; // SvgSerializer 与静态便捷出口 SvgExporter
export * from './parser'; // SvgImporter 与 parseSvgToDocument（SVG → DrawingDocument IR）
