import { defineConfig } from 'tsup';

const shared = {
  target: 'es2020' as const,
  sourcemap: true,
  treeshake: true,
  platform: 'neutral' as const,
};

export default defineConfig([
  {
    ...shared,
    clean: true,
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
    // Share internal chunks across entries so sub-paths do not duplicate core
    // classes or tables. The Symbol brand in theme.ts and the globalThis cache
    // in gbk-table.ts still guard mixed ESM + CJS (dual-package) imports.
    splitting: true,
    dts: true,
  },
  {
    ...shared,
    entry: { vecbridge: 'src/global.ts' },
    format: ['iife'],
    globalName: 'VecBridge',
    dts: false,
    minify: true,
    splitting: false,
  },
]);
