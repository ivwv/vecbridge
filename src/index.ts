/**
 * `vecbridge` 的环境无关入口（主入口）。
 *
 * 这里导出的全部是纯计算 API，可在 Node 中安全导入：包括 IR 数据模型与
 * 策略（core）、文本编解码（encoding）、DXF/SVG 双向转换（dxf/svg）、
 * Canvas 2D 无头录制（canvas）及填充图案（patterns）。依赖 DOM 的 API
 * 隔离在 `vecbridge/render`、`vecbridge/browser` 与 `vecbridge/dom` 子入口。
 *
 * 这是"单一事实源 IR"架构的门面：使用者先用 core 的 `DrawingDocument`
 * 累积图元命令，再把同一份数据交给 DXF 或 SVG 输出端，天然保证三端一致。
 */
export * from './core'; // 核心数据模型层：IR 类型、DrawingDocument、主题与文本策略、样式工具
export * from './encoding'; // 文本编解码层：UTF-8/GBK 双向编解码与编码自动探测
export * from './dxf'; // DXF R12 序列化、校验与 ASCII DXF 解析导入
export * from './svg'; // SVG 序列化（live/export 双模式）与 SVG 导入解析
export * from './patterns'; // 填充图案组合助手：drawHatch 及内置图案
export * from './canvas'; // Canvas 2D 矢量录制与双写代理（Canvas API → IR / DXF / SVG）
export * from './svg-to-dxf'; // 一步式 SVG → DXF 转换便捷入口
export * from './dxf-to-svg'; // 一步式 DXF → SVG 转换便捷入口
