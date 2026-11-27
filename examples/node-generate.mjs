/**
 * Node 端示例：按指定编码与字体导出 DXF，文件名自动包含所选选项，
 * 避免批量导出后分不清哪份是 GBK、哪份是 UTF-8。
 *
 * 用法：
 *   node examples/node-generate.mjs                     # 默认 gbk + gbcbig
 *   node examples/node-generate.mjs gbk gbenor          # 国标主流组合 gbenor.shx + gbcbig.shx
 *   node examples/node-generate.mjs utf8 simsun ./out   # 指定输出目录
 *   node examples/node-generate.mjs all                 # 导出全部 2 x 8 组合
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DrawingDocument, DxfExporter, drawHatch, textCodec } from '../dist/index.js';
// 发布安装后可直接改为：import { DrawingDocument, DxfExporter, drawHatch, textCodec } from 'vecbridge';

const ENCODINGS = ['gbk', 'utf8'];
const FONTS = ['gbcbig', 'gbenor', 'gbeitc', 'hztxt', 'hzfs', 'romans', 'tssd', 'simsun'];

const args = process.argv.slice(2);
const isAll = args[0] === 'all';
const encodingArg = isAll ? null : (args[0] ?? 'gbk').toLowerCase();
const fontArg = isAll ? null : (args[1] ?? 'gbcbig').toLowerCase();
const outDir = (isAll ? args[1] : args[2]) ?? '.';

function buildDoc() {
  const doc = new DrawingDocument();
  doc.setExtents(0, 0, 297, 210);

  doc.addLayer('FRAME_OUTER', 8, 'CONTINUOUS');
  doc.addLayer('TABLE_LINE', 7, 'CONTINUOUS');
  doc.addLayer('HATCH_PAT', 8, 'CONTINUOUS');
  doc.addLayer('CURVE_A', 1, 'CONTINUOUS');
  doc.addLayer('TEXT_TITLE', 7, 'CONTINUOUS');
  doc.addLayer('TEXT_VALUE', 7, 'CONTINUOUS');

  doc.addRect(0, 0, 297, 210, 'FRAME_OUTER', 8, 0, { paper: true });
  doc.addRect(20, 8, 289, 202, 'TABLE_LINE', 7, 0.5);
  doc.addText(148.5, 193, 4.5, 'vecbridge 示例图纸', 'TEXT_TITLE', 7, 0, 1, 2, 0.9, {
    bold: true,
  });
  doc.addText(24, 30, 2.6, '示例：编码与字体可自由组合', 'TEXT_VALUE', 7, 0, 0, 2, 0.85);
  doc.addText(24, 22, 2.2, '文件名自动附带选项，例：vecbridge-example-gbk-gbcbig.dxf', 'TEXT_VALUE', 7, 0, 0, 2, 0.8);

  drawHatch(doc, 40, 60, 100, 150, 'diagonal', 'HATCH_PAT', 8);
  drawHatch(doc, 110, 60, 170, 150, 'crosshatch', 'HATCH_PAT', 8);
  doc.addText(70, 156, 2.2, 'diagonal', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  doc.addText(140, 156, 2.2, 'crosshatch', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);

  const pts = [];
  for (let i = 0; i <= 60; i++) {
    pts.push([185 + i * 1.6, 108 + Math.sin(i / 6) * 26]);
  }
  doc.addPolyline(pts, 'CURVE_A', 1, false, 0.35);

  return doc;
}

function exportOne(doc, encoding, font) {
  const filename = `vecbridge-example-${encoding}-${font}.dxf`;
  const output = join(outDir, filename);
  const bytes = DxfExporter.toBytes(doc, { encoding, font });
  writeFileSync(output, bytes);
  console.log(`written ${output}  (${encoding}/${font}, ${bytes.length} bytes)`);
}

if (!textCodec.isGbkSupported()) {
  console.warn('warning: this Node build has no GBK decoder; gbk output will be ASCII-escaped.');
}

mkdirSync(outDir, { recursive: true });

if (isAll) {
  textCodec.warmup();
  const doc = buildDoc();
  for (const encoding of ENCODINGS) {
    for (const font of FONTS) exportOne(doc, encoding, font);
  }
} else {
  if (!ENCODINGS.includes(encodingArg)) {
    console.error(
      `unknown encoding "${encodingArg}". Use one of: ${ENCODINGS.join(', ')} (or "all")`
    );
    process.exit(1);
  }
  if (!FONTS.includes(fontArg)) {
    console.error(`unknown font "${fontArg}". Use one of: ${FONTS.join(', ')}`);
    process.exit(1);
  }

  if (encodingArg === 'gbk') textCodec.warmup();
  exportOne(buildDoc(), encodingArg, fontArg);
}
