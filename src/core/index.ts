/**
 * core 层统一出口：IR 数据模型、策略与纯计算工具。
 *
 * 本层是整个库的地基，全部为纯计算、不碰 DOM，可被 Node 与浏览器共同使用。
 * DXF/SVG/Canvas 三端都从本层定义的 `DocumentData` 快照出发，并复用
 * `resolveCommandStyle` → `resolveAci` → `fmtNumber` 这条解析链，从而保证
 * 三端视觉与输出字节一致。
 */
export * from './types'; // DrawCommand 中间表示（IR）的全部类型定义
export * from './format'; // 数值格式化契约 fmtNumber（三端共享）
export * from './xml'; // SVG 文本/属性转义 escapeXml
export * from './theme'; // ACI 主题与深/浅色预置、跨 realm 品牌检测
export * from './text'; // 文本度量策略与各渲染端刻意不同的字号系数
export * from './decorations'; // 纸张/粗体装饰判定（IR 元数据优先）
export * from './document'; // DrawingDocument builder：累积命令并一次性应用偏移
export * from './data'; // DocumentLike 鸭子类型桥：统一取 DocumentData 快照
export * from './style'; // 图层索引与 BYLAYER（随层）颜色/线型解析
