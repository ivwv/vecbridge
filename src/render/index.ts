/**
 * render 层（浏览器渲染与交互）统一出口。
 *
 * 这是全库唯一依赖 DOM 的核心层：相机负责世界↔屏幕坐标换算，视口负责尺寸
 * 与 DPR 适配，CanvasRenderer 与 SvgLiveView 分别把同一份 IR 画到两个引擎，
 * DualViewPreview 作为门面用一个共享相机统一调度两端、保证 1:1 同步。
 *
 * 注意本层为浏览器专用，不应从环境无关的主入口 `index.ts` 导出。
 */
export * from './camera'; // Camera：世界(mm)↔屏幕(px)↔SVG viewBox 的坐标变换
export * from './viewport'; // Viewport：DOM 尺寸测量与 DPR 适配
export * from './canvas-renderer'; // CanvasRenderer：把 IR 画到 2D canvas
export * from './svg-live-view'; // SvgLiveView：管理活动 SVG 子树（全量渲染/仅更新 viewBox）
export * from './dual-view'; // DualViewPreview：双视图门面 + 交互状态机
export * from './emitter'; // Emitter：无 DOM 依赖的泛型事件发射器
// 装饰判定本属 core，这里转出是为了让 render 的使用者直接从本入口取到配套工具。
export { isPaperCommand, isBoldText } from '../core/decorations';
export type { DecorationOptions } from '../core/decorations';
