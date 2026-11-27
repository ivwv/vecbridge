/* VecBridge API 绘图示例 —— 页面逻辑 */
(() => {
  const {
    createPreview,
    bindThemeToggle,
    renderStats,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const {
    DXF_FONT_RECIPES,
    DrawingDocument,
    TextCodec,
    drawHatch,
    downloadDxf,
    downloadSvg,
  } = window.VecBridge;

  /* ---------------- 用 API 现画一张 A4 图纸 ---------------- */
  const doc = new DrawingDocument();
  doc.setExtents(0, 0, 297, 210);

  for (const [name, color, linetype] of [
    ['FRAME_OUTER', 8, 'CONTINUOUS'],
    ['FRAME_BORDER', 7, 'CONTINUOUS'],
    ['TABLE_LINE', 7, 'CONTINUOUS'],
    ['GRID_DASH', 8, 'DASHED'],
    ['HATCH_PAT', 8, 'CONTINUOUS'],
    ['CURVE_A', 1, 'CONTINUOUS'],
    ['CURVE_B', 5, 'CONTINUOUS'],
    ['TEXT_TITLE', 7, 'CONTINUOUS'],
    ['TEXT_VALUE', 7, 'CONTINUOUS'],
  ]) {
    doc.addLayer(name, color, linetype);
  }

  // 图框与标题栏
  doc.addRect(0, 0, 297, 210, 'FRAME_OUTER', 8, 0, { paper: true });
  doc.addRect(20, 8, 289, 202, 'FRAME_BORDER', 7, 0.35);
  doc.addText(154.5, 193, 4.5, '示例图纸', 'TEXT_TITLE', 7, 0, 1, 2, 0.9, { bold: true });
  doc.addLine(20, 30, 289, 30, 'TABLE_LINE', 7);
  doc.addText(24, 24, 2.4, '示例：DXF R12 渲染', 'TEXT_VALUE', 7, 0, 0, 2, 0.85);
  doc.addText(24, 18, 2.0, '比例 1:1    单位 mm', 'TEXT_VALUE', 7, 0, 0, 2, 0.85);

  // 参考网格
  for (let x = 30; x <= 280; x += 10) doc.addLine(x, 40, x, 180, 'GRID_DASH', 8, 'DASHED');
  for (let y = 40; y <= 180; y += 10) doc.addLine(30, y, 280, y, 'GRID_DASH', 8, 'DASHED');

  // 内置填充图案
  drawHatch(doc, 40, 60, 90, 120, 'diagonal', 'HATCH_PAT', 8);
  drawHatch(doc, 100, 60, 150, 120, 'dots-coarse', 'HATCH_PAT', 8);
  drawHatch(doc, 160, 60, 210, 120, 'crosshatch', 'HATCH_PAT', 8);
  doc.addText(65, 126, 2.2, 'diagonal', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  doc.addText(125, 126, 2.2, 'dots-coarse', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);
  doc.addText(185, 126, 2.2, 'crosshatch', 'TEXT_VALUE', 7, 0, 1, 2, 0.8);

  // 两条采样曲线
  const ptsA = [];
  const ptsB = [];
  for (let i = 0; i <= 60; i++) {
    const x = 40 + i * 4;
    ptsA.push([x, 150 + Math.sin(i / 8) * 12 + Math.sin(i / 3) * 4]);
    ptsB.push([x, 150 + Math.cos(i / 7) * 13]);
  }
  doc.addPolyline(ptsA, 'CURVE_A', 1, false, 0.35);
  doc.addPolyline(ptsB, 'CURVE_B', 5, false, 0.35);

  // 尺寸标注圆
  doc.addCircle(250, 90, 18, 'CURVE_A', 1);
  doc.addText(250, 90, 3, 'R18', 'TEXT_VALUE', 7, 0, 1, 2, 0.85);

  const decorations = { boldLayers: ['TEXT_TITLE'], paperFillLayers: ['FRAME_OUTER'] };

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    panes: [document.getElementById('canvasPane'), document.getElementById('svgPane')],
    theme: 'light',
    decorations,
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');
  preview.setDocument(doc, { fit: true });
  renderStats(document.getElementById('statsPill'), doc, { digits: 1 });

  /* ---------------- 导出 ---------------- */
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const filenamePreview = document.getElementById('filenamePreview');

  const buildDxfFilename = () => `dxf-example-${encodingSelect.value}-${fontSelect.value}.dxf`;

  const syncFilenamePreview = () => {
    filenamePreview.textContent = buildDxfFilename();
    filenamePreview.title = buildDxfFilename();
  };

  const getCurrentTime = () => {
    const date = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${String(date.getFullYear()).slice(-2)}${date.getMonth() + 1}${date.getDate()}${pad(date.getHours())}-${pad(date.getMinutes())}`;
  };

  const exportDxfFile = (filename, encoding, font) => {
    const codec = new TextCodec({
      onUnencodable: (entries) => console.warn('[DXF] 超出 GBK 的字符已转义：', entries),
    });
    downloadDxf(doc, {
      filename,
      encoding,
      font,
      codec,
      onInvalidCommand: (_cmd, reason) => console.warn('[DXF] 已跳过非法实体：', reason),
      revokeDelayMs: 1500,
    });
  };

  encodingSelect.addEventListener('change', syncFilenamePreview);
  fontSelect.addEventListener('change', syncFilenamePreview);
  syncFilenamePreview();

  document.getElementById('fitBtn').addEventListener('click', () => preview.fit());

  document.getElementById('exportBtn').addEventListener('click', () => {
    exportDxfFile(buildDxfFilename(), encodingSelect.value, fontSelect.value);
  });

  document.getElementById('exportBatchBtn').addEventListener('click', () => {
    const stamp = getCurrentTime();
    const encodings = ['gbk', 'utf8'];
    const fonts = Object.keys(DXF_FONT_RECIPES);
    for (const encoding of encodings) {
      for (const font of fonts) {
        exportDxfFile(`dxf-${encoding}-${font}_${stamp}.dxf`, encoding, font);
      }
    }
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    downloadSvg(doc, {
      filename: `dxf-example-${theme.mode}.svg`,
      theme: DxfDemo.resolveTheme(theme.mode),
      decorations,
      revokeDelayMs: 1500,
    });
  });

  window.__demo = {
    doc,
    preview,
    get theme() { return theme.mode; },
    buildDxfFilename,
    get encoding() { return encodingSelect.value; },
    get font() { return fontSelect.value; },
  };
})();
