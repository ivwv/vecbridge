// simple-square.mjs
import { writeFileSync } from 'node:fs';
import { DrawingDocument, DxfExporter, SvgExporter } from '../dist/index.js';
// 安装发布包后改为：import { DrawingDocument, DxfExporter, SvgExporter } from 'vecbridge';

// 1. 世界坐标：正方形 100×100，左下角在原点
const doc = new DrawingDocument({
  extents: { minX: 0, minY: 0, maxX: 100, maxY: 100 },
});

doc.addLayer('FRAME', 7, 'CONTINUOUS');
doc.addLayer('TEXT', 7, 'CONTINUOUS');

// 2. 正方形：左下 (0,0) → 右上 (100,100)，闭合四点多段线
doc.addRect(0, 0, 100, 100, 'FRAME', 7, 0.35);

// 3. 中文文字：居中放在正方形中心 (50,50)
//    参数顺序：x, y, h, text, layer, color, rot, hAlign, vAlign, widthFactor
//    hAlign=1 → 水平居中；vAlign=2 → 垂直居中
doc.addText(50, 50, 10, '你好，世界', 'TEXT', 7, 0, 1, 2, 0.85);

// 4. 导出 DXF（GBK 编码，AutoCAD 中文环境可正常显示）
const dxfBytes = DxfExporter.toBytes(doc, {
  encoding: 'gbk',
  font: 'gbcbig',      // txt.shx + gbcbig.shx，国标大字体
});
writeFileSync('square.dxf', dxfBytes);

// 5. 导出 SVG（UTF-8，白底、实际 mm 尺寸）
const svgText = SvgExporter.toText(doc, {
  theme: 'light',
  mode: 'export',
  paddingMm: 10,       // 四周留 10mm 白边
});
writeFileSync('square.svg', svgText);

console.log('已生成 square.dxf 与 square.svg');