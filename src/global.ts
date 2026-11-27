/**
 * IIFE 打包入口：经典 `<script>` 标签直接引入时，把全量 API 挂到
 * `window.VecBridge` 上。
 *
 * 与主入口 `index.ts` 的区别：这里额外导出了 `render`（双引擎预览交互）、
 * `browser`（文件下载）和 `dom`（HTML DOM 布局提取）三层——它们依赖 DOM，
 * 只有在浏览器环境下才有意义。构建时由 tsup 打成单文件 IIFE，全局名 `VecBridge`。
 */
export * from './index'; // 环境无关主入口的全部 API（core/encoding/dxf/svg/patterns）
export * from './render'; // 浏览器渲染与交互层：相机、视口、Canvas/SVG 渲染、双视图门面
export * from './browser'; // 浏览器平台适配：把字节/文本触发为文件下载
export * from './dom'; // 浏览器 HTML DOM 转换层：domToDocument / domToSvg / domToDxf
