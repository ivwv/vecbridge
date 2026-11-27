/**
 * Node 端示例：读取 SVG 文件并转换为 DXF R12。
 *
 * 用法：
 *   node examples/node-svg-to-dxf.mjs input.svg
 *   node examples/node-svg-to-dxf.mjs input.svg output.dxf gbk gbenor
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { parseSvgToDocument, DxfExporter, textCodec } from '../dist/index.js';

const [inputPath, outputArg, encoding = 'gbk', font = 'gbenor'] = process.argv.slice(2);

if (!inputPath) {
  console.error(
    '用法：node examples/node-svg-to-dxf.mjs <input.svg> [output.dxf] [gbk|utf8] [gbcbig|gbenor|...]'
  );
  process.exit(1);
}

const svgText = readFileSync(inputPath, 'utf8');
const doc = parseSvgToDocument(svgText, {
  yAxis: 'flip-viewbox',
  curveTolerance: 0.1,
  layerBy: 'group-id',
});

if (encoding === 'gbk') textCodec.warmup();

const outputPath =
  outputArg ??
  join(
    dirname(inputPath),
    `${basename(inputPath, extname(inputPath))}-${encoding}-${font}.dxf`
  );

const bytes = DxfExporter.toBytes(doc, { encoding, font });
writeFileSync(outputPath, bytes);

console.log(
  `converted ${inputPath} -> ${outputPath} (${doc.commands.length} entities, ${doc.layers.length + 1} layers, ${bytes.length} bytes)`
);
