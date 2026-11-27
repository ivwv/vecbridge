/**
 * Canvas 2D 矢量录制与双写代理层出口（`vecbridge/canvas`）。
 *
 * 提供与标准 `CanvasRenderingContext2D` 兼容的矢量上下文：
 * - 无头模式（`createVectorContext`）可在 Node 与浏览器直接用 Canvas 2D API 绘图并导出 DXF / SVG；
 * - 双写代理模式（`recordCanvasContext(realCtx)`）在实时绘制真实 `<canvas>` 的同时同步记录 IR。
 */
export * from './recorder';
