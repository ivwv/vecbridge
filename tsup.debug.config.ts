import { defineConfig } from 'tsup';

/**
 * 实时调试构建（浏览器 + Node 共用）：
 * - ESM/CJS 供 Node 与打包器使用，IIFE 供 <script> 使用
 * - 关闭 minify / dts / clean，sourcemap 稳定，watch 重建快
 * - 发布构建仍走原来的 tsup.config.ts
 */
const shared = {
  outDir: 'dist',
  target: 'es2020' as const,
  sourcemap: true,
  minify: false,
  clean: false,
  treeshake: false,
  dts: false,
};

export default defineConfig([
  {
    ...shared,
    entry: {
      index: 'src/index.ts',
      core: 'src/core/index.ts',
      encoding: 'src/encoding/index.ts',
      dxf: 'src/dxf/index.ts',
      svg: 'src/svg/index.ts',
      render: 'src/render/index.ts',
      patterns: 'src/patterns/index.ts',
      browser: 'src/browser/index.ts',
      canvas: 'src/canvas/index.ts',
      dom: 'src/dom/index.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'neutral',
    splitting: true,
  },
  {
    ...shared,
    entry: { vecbridge: 'src/global.ts' },
    outExtension: () => ({ js: '.global.js' }),
    format: ['iife'],
    globalName: 'VecBridge',
    platform: 'browser',
    splitting: false,
  },
]);
