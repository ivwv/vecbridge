/**
 * Reference A4 sheet layout built entirely with the public API.
 *
 * This is NOT part of the library — it exercises `DrawingDocument` + `drawHatch`
 * with a realistic, moderately complex drawing so golden tests can lock the
 * serialized output of every supported backend.
 */
import { DrawingDocument, type HatchPattern, type Linetype, type HAlign } from '../../src/index';
import { drawHatch } from '../../src/patterns/hatch';

export interface SeriesData {
  depth: number[];
  a: number[];
  b: number[];
  c: number[];
  aIndex: number[];
  bIndex: number[];
}

export interface BandItem {
  typeId: number;
  name: string;
  pattern: HatchPattern;
  from: number;
  to: number;
  length: number;
  avgA: number;
  avgB: number;
  note: string;
  code: string;
  index: number;
}

export interface SheetItem {
  sheetNo: string;
  elevation: string;
  recordDate: string;
  data: SeriesData;
  bands: BandItem[];
}

export interface SheetConfig {
  projectName: string;
  projectCode: string;
  stage: string;
  recordDate: string;
  drawingNo: string;
  layoutMode: 'grid' | 'horizontal' | 'vertical';
  gridCols: number;
  sheetGap: number;
  company: string;
  certNo: string;
  leaderName: string;
  approverName: string;
  auditorName: string;
  checkerName: string;
  draftsmanName: string;
  depthScale: number;
  unitA: number;
  minBandLength: number;
  smoothWindow: number;
  showA: boolean;
  showB: boolean;
  showC: boolean;
  showGrid: boolean;
}

const CIRCLED_NUMS = [
  '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩',
  '⑪', '⑫', '⑬', '⑭', '⑮', '⑯', '⑰', '⑱', '⑲', '⑳',
];

export function getCircledNum(idx: number): string {
  return CIRCLED_NUMS[idx] || `(${idx + 1})`;
}

export function getAutoDrawingNo(baseStr: string, index: number, total: number): string {
  if (total <= 1) return baseStr;
  const m = baseStr.match(/^(.*?)(\d+)$/);
  if (m) {
    const prefix = m[1];
    const startNum = parseInt(m[2], 10);
    return `${prefix}${startNum + index}`;
  }
  return `${baseStr}-${index + 1}`;
}

export function niceStep(v: number): number {
  if (!(v > 0)) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const f = v / base;
  let nf: number;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 2.5) nf = 2.5;
  else if (f <= 4) nf = 4;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * base;
}

interface CurveDef {
  key: 'a' | 'b' | 'c';
  title: string;
  unit: string;
  layer: string;
  color: number;
}

/** Draw one A4 sheet (297 x 210 mm) into the document at the given offset. */
export function drawSingleA4Sheet(
  dwg: DrawingDocument,
  ox: number,
  oy: number,
  sheetItem: SheetItem,
  config: SheetConfig,
  pageIndex: number,
  totalPages: number
): void {
  dwg.setOffset(ox, oy);
  const data = sheetItem.data;
  const bands = sheetItem.bands;

  const W = 297;
  const H = 210;
  const L = 20;
  const R = 289;
  const T = 202;
  const B = 8;

  const yTitleBot = 191.5;
  const yMetaBot = 183.5;
  const yHeaderMid = 175.0;
  const yPlotTop = 168.0;
  const yPlotBot = 32.0;
  const yAxisBot = 26.0;
  const ySignMid = 17.0;
  const plotH = yPlotTop - yPlotBot;

  const x0 = L;
  const x1 = 27.5;
  const x2 = 39.5;
  const x3 = 50.5;
  const x4 = 66.5;
  const x5 = 87.5;
  const x6 = 96.8;
  const x7 = 106.0;

  const activeCurves: CurveDef[] = [];
  if (config.showA) {
    activeCurves.push({ key: 'a', title: '曲线 A (MPa)', unit: 'MPa', layer: 'CURVE_A', color: 1 });
  }
  if (config.showB) {
    activeCurves.push({ key: 'b', title: '曲线 B (kPa)', unit: 'kPa', layer: 'CURVE_B', color: 5 });
  }
  if (config.showC) {
    activeCurves.push({ key: 'c', title: '曲线 C (kPa)', unit: 'kPa', layer: 'CURVE_C', color: 3 });
  }
  if (activeCurves.length === 0) {
    activeCurves.push({ key: 'a', title: '曲线 A (MPa)', unit: 'MPa', layer: 'CURVE_A', color: 1 });
  }

  const curveTotalW = R - x7;
  const singleCurveW = curveTotalW / activeCurves.length;

  const maxDepth = Math.max(1, ...data.depth);
  let depthScale: number;
  let scaleRatioText: string;
  if (config.depthScale > 0) {
    if (config.depthScale >= 20) {
      depthScale = 1000 / config.depthScale;
      scaleRatioText = `1:${Math.round(config.depthScale)}`;
    } else {
      depthScale = config.depthScale;
      scaleRatioText = `1:${Math.round(1000 / depthScale)}`;
    }
  } else {
    depthScale = plotH / (maxDepth * 1.02);
    scaleRatioText = `1:${Math.round(1000 / depthScale)}`;
  }
  const depthToY = (d: number) => yPlotTop - d * depthScale;

  const maxA = Math.max(0.5, ...data.a);
  const maxB = Math.max(5, ...data.b);
  const maxC = Math.max(5, ...data.c);
  const scaleStepMap = {
    a: niceStep(maxA / 4.2),
    b: niceStep(maxB / 4.2),
    c: niceStep(maxC / 4.2),
  };

  // 1. Sheet frame + binding line
  dwg.addRect(0, 0, W, H, 'FRAME_OUTER', 8, 0);
  dwg.addRect(L, B, R, T, 'FRAME_BORDER', 7, 0.5);
  dwg.addLine(10, H / 2 - 28, 10, H / 2 + 28, 'FRAME_OUTER', 8);
  dwg.addText(7.2, H / 2, 2.0, '装   订   线', 'TEXT_LABEL', 8, 90, 1, 2, 0.85);

  // 2. Title area
  const centerX = (L + R) / 2;
  dwg.addText(centerX, 197.2, 4.3, '工 程 综 合 记 录 图 (A4)', 'TEXT_TITLE', 7, 0, 1, 2, 0.9);
  dwg.addLine(centerX - 42, 193.8, centerX + 42, 193.8, 'TABLE_LINE', 7);
  dwg.addLine(centerX - 42, 193.1, centerX + 42, 193.1, 'FRAME_OUTER', 8);

  dwg.addText(L + 2.5, 195.5, 2.1, `工程编号：${config.projectCode}`, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);
  dwg.addText(
    R - 2.5,
    195.5,
    2.1,
    `阶段：${config.stage}    第 ${pageIndex + 1} 页 共 ${totalPages} 页`,
    'TEXT_VALUE',
    7,
    0,
    2,
    2,
    0.82
  );
  dwg.addLine(L, yTitleBot, R, yTitleBot, 'FRAME_BORDER', 7);

  // 3. Project / sheet metadata
  dwg.addLine(L, yMetaBot, R, yMetaBot, 'TABLE_LINE', 7);
  const metaY = (yTitleBot + yMetaBot) / 2;
  const safeElev = (parseFloat(sheetItem.elevation) || 0).toFixed(2);
  const metaCols = [
    { xL: 20, xM: 35, xR: 106, label: '工程名称', val: config.projectName },
    { xL: 106, xM: 120, xR: 146, label: '记录编号', val: sheetItem.sheetNo },
    { xL: 146, xM: 161, xR: 187, label: '基准标高', val: `${safeElev} m` },
    { xL: 187, xM: 202, xR: 229, label: '记录深度', val: `${maxDepth.toFixed(2)} m` },
    { xL: 229, xM: 244, xR: 289, label: '记录日期', val: sheetItem.recordDate || config.recordDate },
  ];
  for (const mc of metaCols) {
    dwg.addLine(mc.xM, yTitleBot, mc.xM, yMetaBot, 'FRAME_OUTER', 8);
    if (mc.xR < R) dwg.addLine(mc.xR, yTitleBot, mc.xR, yMetaBot, 'TABLE_LINE', 7);
    dwg.addText((mc.xL + mc.xM) / 2, metaY, 2.0, mc.label, 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
    dwg.addText(mc.xM + 2, metaY, 2.3, mc.val, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);
  }

  // 4. Band / curve headers
  dwg.addLine(L, yPlotTop, R, yPlotTop, 'FRAME_BORDER', 7);
  dwg.addLine(x5, yHeaderMid, R, yHeaderMid, 'TABLE_LINE', 7);

  [x1, x2, x3, x4, x5, x7].forEach((x) => dwg.addLine(x, yMetaBot, x, yPlotBot, 'TABLE_LINE', 7));
  dwg.addLine(x6, yHeaderMid, x6, yPlotBot, 'TABLE_LINE', 7);

  const hCenterY = (yMetaBot + yPlotTop) / 2;
  dwg.addText((x0 + x1) / 2, hCenterY, 2.0, '序\n号', 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
  dwg.addText((x1 + x2) / 2, hCenterY, 1.9, '分段深度\n(m)', 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
  dwg.addText((x2 + x3) / 2, hCenterY, 1.9, '分段长度\n(m)', 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
  dwg.addText((x3 + x4) / 2, hCenterY, 1.9, '分段示意\n及深度标尺', 'TEXT_VALUE', 7, 0, 1, 2, 0.75);
  dwg.addText((x4 + x5) / 2, hCenterY, 2.0, '分段名称\n及说明', 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
  dwg.addText((x5 + x7) / 2, (yMetaBot + yHeaderMid) / 2, 1.9, '统计均值', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  dwg.addText((x5 + x6) / 2, (yHeaderMid + yPlotTop) / 2, 1.65, 'A\n(MPa)', 'TEXT_VALUE', 7, 0, 1, 2, 0.75);
  dwg.addText((x6 + x7) / 2, (yHeaderMid + yPlotTop) / 2, 1.65, 'B\n(kPa)', 'TEXT_VALUE', 7, 0, 1, 2, 0.75);

  // 5. Curve headers, dual rulers, dashed grid
  const depthTickMajor = maxDepth > 80 ? 10 : 5;
  const depthTickMinor = maxDepth > 80 ? 2 : 1;

  if (config.showGrid) {
    for (let d = depthTickMajor; d < maxDepth; d += depthTickMajor) {
      const y = depthToY(d);
      if (y <= yPlotBot + 0.5) break;
      dwg.addLine(x7, y, R, y, 'GRID_DASH', 8, 'DASHED');
    }
  }

  activeCurves.forEach((cv, idx) => {
    const cLeft = x7 + idx * singleCurveW;
    const cRight = cLeft + singleCurveW;
    const cMid = (cLeft + cRight) / 2;
    const stepVal = scaleStepMap[cv.key];

    if (idx > 0) dwg.addLine(cLeft, yMetaBot, cLeft, yAxisBot, 'TABLE_LINE', 7);

    const headerY = (yMetaBot + yHeaderMid) / 2;
    dwg.addText(cMid - 4, headerY, 2.2, cv.title, 'TEXT_VALUE', 7, 0, 1, 2, 0.85);
    dwg.addPolyline([[cMid + 16, headerY], [cMid + 24, headerY]], cv.layer, cv.color, false, 0.35);

    const numMajor = 5;
    const numMinor = 10;
    for (let m = 0; m <= numMinor; m++) {
      const x = cLeft + (singleCurveW / numMinor) * m;
      const isMajor = m % 2 === 0;
      const tickH = isMajor ? 1.8 : 1.0;

      dwg.addLine(x, yPlotTop, x, yPlotTop + tickH, 'TABLE_LINE', 7);
      dwg.addLine(x, yPlotBot, x, yPlotBot - tickH, 'TABLE_LINE', 7);

      if (isMajor) {
        const k = m / 2;
        const valNum = k * stepVal;
        const valStr = stepVal < 1 ? valNum.toFixed(1) : String(Math.round(valNum * 10) / 10);
        let align: HAlign = 1;
        let tx = x;
        if (k === 0) {
          align = 0;
          tx = x + 0.6;
        } else if (k === numMajor) {
          align = 2;
          tx = x - 0.6;
        }

        dwg.addText(tx, yPlotTop + 3.4, 1.75, valStr, 'TEXT_VALUE', 7, 0, align, 2, 0.8);
        dwg.addText(tx, yPlotBot - 3.3, 1.75, valStr, 'TEXT_VALUE', 7, 0, align, 2, 0.8);

        if (config.showGrid && k > 0 && k < numMajor) {
          dwg.addLine(x, yPlotTop, x, yPlotBot, 'GRID_DASH', 8, 'DASHED');
        }
      }
    }
  });

  // 6. Depth ruler beside the band column
  const xRulerRight = x3 + 4.8;
  dwg.addLine(xRulerRight, yPlotTop, xRulerRight, yPlotBot, 'TABLE_LINE', 7);

  for (let d = 0; d <= maxDepth; d += depthTickMinor) {
    const y = depthToY(d);
    if (y < yPlotBot - 0.1) break;
    const isMajor = d % depthTickMajor === 0;
    const isMid = d % (depthTickMajor / 2) === 0;
    if (isMajor) {
      dwg.addLine(xRulerRight - 1.4, y, xRulerRight, y, 'TABLE_LINE', 7);
      if (d > 0 && y > yPlotBot + 1.8) {
        dwg.addText(xRulerRight - 1.6, y, 1.6, String(d), 'TEXT_VALUE', 7, 0, 2, 2, 0.75);
      }
    } else if (isMid) {
      dwg.addLine(xRulerRight - 0.9, y, xRulerRight, y, 'TABLE_LINE', 7);
    } else {
      dwg.addLine(xRulerRight - 0.5, y, xRulerRight, y, 'FRAME_OUTER', 8);
    }
  }

  // 7. Hatch, band rows, band boundaries
  for (const band of bands) {
    const yTop = Math.min(depthToY(band.from), yPlotTop);
    const yBot = Math.max(depthToY(band.to), yPlotBot);
    if (yTop <= yBot) continue;

    drawHatch(dwg, xRulerRight, yBot, x4, yTop, band.pattern, 'HATCH_PAT', 8);
    dwg.addLine(x0, yBot, x3, yBot, 'TABLE_LINE', 7);
    dwg.addLine(xRulerRight, yBot, x7, yBot, 'TABLE_LINE', 7);

    if (config.showGrid && yBot > yPlotBot + 1.0) {
      dwg.addLine(x7, yBot, R, yBot, 'LAYER_DOT', 8, 'DOT');
    }

    const midY = (yTop + yBot) / 2;
    const boxH = yTop - yBot;
    if (boxH >= 3.2) {
      const fontH = boxH < 5.5 ? 1.65 : 2.05;
      const cxCode = (x0 + x1) / 2;
      const rCode = Math.min(1.45, boxH * 0.38);
      dwg.addCircle(cxCode, midY, rCode, 'TABLE_LINE', 7);
      dwg.addText(cxCode, midY, fontH * 0.82, String(band.index), 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
      dwg.addText((x1 + x2) / 2, midY, fontH, band.to.toFixed(2), 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
      dwg.addText((x2 + x3) / 2, midY, fontH, band.length.toFixed(2), 'TEXT_VALUE', 7, 0, 1, 2, 0.8);

      if (boxH >= 8.5) {
        dwg.addText((x4 + x5) / 2, midY + 1.4, 2.1, band.name, 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
        dwg.addText((x4 + x5) / 2, midY - 1.6, 1.65, `(${band.note})`, 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
      } else {
        dwg.addText((x4 + x5) / 2, midY, fontH, `${band.name}(${band.note})`, 'TEXT_VALUE', 7, 0, 1, 2, 0.72);
      }

      dwg.addText((x5 + x6) / 2, midY, fontH * 0.92, band.avgA.toFixed(2), 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
      dwg.addText((x6 + x7) / 2, midY, fontH * 0.92, band.avgB.toFixed(1), 'TEXT_VALUE', 7, 0, 1, 2, 0.78);
    }
  }

  dwg.addLine(L, yPlotBot, R, yPlotBot, 'FRAME_BORDER', 7);
  dwg.addLine(L, yAxisBot, R, yAxisBot, 'FRAME_BORDER', 7);

  dwg.addText(
    L + 2,
    (yPlotBot + yAxisBot) / 2,
    1.75,
    '附注：1. 基准面以设计文件为准；2. 均值列为各段算术平均值。',
    'TEXT_LABEL',
    8,
    0,
    0,
    2,
    0.8
  );

  // 8. Series curves with bucket min/max decimation for long series
  const bucketSize = data.depth.length > 2200 ? Math.ceil(data.depth.length / 1100) : 1;
  activeCurves.forEach((cv, idx) => {
    const cLeft = x7 + idx * singleCurveW;
    const cRight = cLeft + singleCurveW;
    const stepVal = scaleStepMap[cv.key];
    const maxRange = stepVal * 5;
    const pts: Array<[number, number]> = [];
    const values = data[cv.key];

    const pushPointAt = (idxPt: number) => {
      const val = values[idxPt];
      if (!isFinite(val)) return;
      let x = cLeft + (val / maxRange) * singleCurveW;
      x = Math.max(cLeft, Math.min(x, cRight));
      const y = depthToY(data.depth[idxPt]);
      if (y < yPlotBot || y > yPlotTop) return;
      pts.push([x, y]);
    };

    if (bucketSize === 1) {
      for (let i = 0; i < data.depth.length; i++) pushPointAt(i);
    } else {
      for (let i = 0; i < data.depth.length; i += bucketSize) {
        const end = Math.min(data.depth.length - 1, i + bucketSize - 1);
        let minIdx = i;
        let maxIdx = i;
        for (let k = i + 1; k <= end; k++) {
          const v = values[k];
          if (v < values[minIdx]) minIdx = k;
          if (v > values[maxIdx]) maxIdx = k;
        }
        if (minIdx === maxIdx) {
          pushPointAt(minIdx);
        } else if (minIdx < maxIdx) {
          pushPointAt(minIdx);
          pushPointAt(maxIdx);
        } else {
          pushPointAt(maxIdx);
          pushPointAt(minIdx);
        }
      }
    }
    if (pts.length > 1) {
      dwg.addPolyline(pts, cv.layer, cv.color, false, 0.22);
    }
  });

  // 9. Title block
  dwg.addLine(L, ySignMid, R, ySignMid, 'TABLE_LINE', 7);

  const sxUnitRight = 114.0;
  dwg.addLine(35, yAxisBot, 35, B, 'FRAME_OUTER', 8);
  dwg.addLine(sxUnitRight, yAxisBot, sxUnitRight, B, 'TABLE_LINE', 7);

  const row1Y = (yAxisBot + ySignMid) / 2;
  const row2Y = (ySignMid + B) / 2;

  dwg.addText(27.5, row1Y, 1.9, '编制单位', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(37.0, row1Y, 2.5, config.company, 'TEXT_VALUE', 7, 0, 0, 2, 0.85);
  dwg.addText(sxUnitRight - 2, row1Y, 1.75, `[${config.certNo}]`, 'TEXT_LABEL', 8, 0, 2, 2, 0.78);

  dwg.addText(27.5, row2Y, 1.9, '工程名称', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(37.0, row2Y, 2.3, config.projectName, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);

  const signRoles = [
    { role: '项目负责', name: config.leaderName },
    { role: '审   定', name: config.approverName },
    { role: '审   核', name: config.auditorName },
    { role: '校   核', name: config.checkerName },
    { role: '制   图', name: config.draftsmanName },
  ];
  const roleW = 22.0;
  signRoles.forEach((sr, idx) => {
    const rxL = sxUnitRight + idx * roleW;
    const rxR = rxL + roleW;
    const rxM = (rxL + rxR) / 2;
    dwg.addLine(rxR, yAxisBot, rxR, B, 'TABLE_LINE', 7);
    dwg.addText(rxM, row1Y, 1.85, sr.role, 'TEXT_LABEL', 8, 0, 1, 2, 0.76);
    if (sr.name) {
      dwg.addText(rxM, row2Y, 2.4, sr.name, 'TEXT_VALUE', 7, 0, 1, 2, 0.85);
    }
  });

  dwg.addLine(236, yAxisBot, 236, B, 'FRAME_OUTER', 8);
  dwg.addText(230, row1Y, 1.9, '图   名', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(238, row1Y, 2.3, `工程综合记录图 (${sheetItem.sheetNo})`, 'TEXT_VALUE', 7, 0, 0, 2, 0.82);

  const sheetDrawingNo = getAutoDrawingNo(config.drawingNo, pageIndex, totalPages);
  dwg.addLine(256, ySignMid, 256, B, 'TABLE_LINE', 7);
  dwg.addLine(267, ySignMid, 267, B, 'FRAME_OUTER', 8);
  dwg.addText(230, row2Y, 1.9, '比例尺', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(246, row2Y, 2.0, `垂 ${scaleRatioText}`, 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  dwg.addText(261.5, row2Y, 1.9, '图 号', 'TEXT_LABEL', 8, 0, 1, 2, 0.8);
  dwg.addText(278, row2Y, 2.1, sheetDrawingNo, 'TEXT_VALUE', 7, 0, 1, 2, 0.82);
}

const LAYER_DEFS: Array<[string, number, Linetype]> = [
  ['FRAME_OUTER', 8, 'CONTINUOUS'],
  ['FRAME_BORDER', 7, 'CONTINUOUS'],
  ['TABLE_LINE', 7, 'CONTINUOUS'],
  ['GRID_DASH', 8, 'DASHED'],
  ['LAYER_DOT', 8, 'DOT'],
  ['HATCH_PAT', 8, 'CONTINUOUS'],
  ['CURVE_A', 1, 'CONTINUOUS'],
  ['CURVE_B', 5, 'CONTINUOUS'],
  ['CURVE_C', 3, 'CONTINUOUS'],
  ['TEXT_TITLE', 7, 'CONTINUOUS'],
  ['TEXT_LABEL', 8, 'CONTINUOUS'],
  ['TEXT_VALUE', 7, 'CONTINUOUS'],
];

/** Compose one or more sheets into a single document. */
export function generateMultiSheetDxf(
  sheetList: SheetItem[],
  config: SheetConfig,
  onlySingleIndex = -1
): DrawingDocument {
  const dwg = new DrawingDocument();
  for (const [name, color, linetype] of LAYER_DEFS) {
    dwg.addLayer(name, color, linetype);
  }

  const W = 297;
  const H = 210;
  const gap = config.sheetGap;
  const total = sheetList.length;

  if (onlySingleIndex >= 0 && onlySingleIndex < total) {
    drawSingleA4Sheet(dwg, 0, 0, sheetList[onlySingleIndex], config, onlySingleIndex, total);
    dwg.setExtents(0, 0, W, H);
    return dwg;
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  sheetList.forEach((sheetItem, idx) => {
    let col = 0;
    let row = 0;
    if (config.layoutMode === 'horizontal') {
      col = idx;
      row = 0;
    } else if (config.layoutMode === 'vertical') {
      col = 0;
      row = idx;
    } else {
      const colsPerRow = Math.max(1, config.gridCols);
      col = idx % colsPerRow;
      row = Math.floor(idx / colsPerRow);
    }

    const ox = col * (W + gap);
    const oy = -row * (H + gap);

    drawSingleA4Sheet(dwg, ox, oy, sheetItem, config, idx, total);

    minX = Math.min(minX, ox);
    minY = Math.min(minY, oy);
    maxX = Math.max(maxX, ox + W);
    maxY = Math.max(maxY, oy + H);
  });

  if (total > 0) {
    dwg.setExtents(minX, minY, maxX, maxY);
  }

  return dwg;
}
