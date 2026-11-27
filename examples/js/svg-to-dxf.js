/* SVG → DXF 实时转换 —— 页面逻辑 */
(() => {
  const {
    samples,
    createPreview,
    bindThemeToggle,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
    bindDropZone,
    bindDebounced,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const { parseSvgToDocument } = window.VecBridge;

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const svgInput = document.getElementById('svgInput');
  const yAxisSelect = document.getElementById('yAxisSelect');
  const tolInput = document.getElementById('tolInput');
  const layerBySelect = document.getElementById('layerBySelect');
  const fillModeSelect = document.getElementById('fillModeSelect');
  const ignoreBgCheck = document.getElementById('ignoreBgCheck');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const statsBox = document.getElementById('statsBox');
  const statsPill = document.getElementById('statsPill');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');
  const viewSeg = document.getElementById('viewSeg');

  let currentDoc = null;
  let currentBaseName = 'svg-sample';
  let viewMode = 'both';

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? svgPane : canvasPane),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');

  function applyView(mode) {
    viewMode = mode;
    setSegmented(viewSeg, mode);
    canvasPane.classList.toggle('hidden', mode === 'svg');
    svgPane.classList.toggle('hidden', mode === 'canvas');
    if (currentDoc) requestAnimationFrame(() => preview.fit());
  }

  /* ---------------- 转换 ---------------- */
  function convert(autoFit = true) {
    const svgText = svgInput.value.trim();
    if (!svgText) {
      currentDoc = null;
      preview.setDocument(null);
      statsBox.textContent = '等待输入 SVG…';
      statsPill.textContent = '空文档';
      return;
    }

    try {
      const doc = parseSvgToDocument(svgText, {
        yAxis: yAxisSelect.value,
        curveTolerance: parseFloat(tolInput.value) || 0.1,
        layerBy: layerBySelect.value,
        fillMode: fillModeSelect.value,
        ignoreBackground: ignoreBgCheck.checked,
      });
      currentDoc = doc;
      preview.setDocument(doc, { fit: autoFit });

      const ext = doc.extents;
      const counts = { line: 0, circle: 0, polyline: 0, text: 0, solid: 0 };
      for (const cmd of doc.commands) counts[cmd.type] += 1;

      statsBox.innerHTML =
        `图幅：<strong>${(ext.maxX - ext.minX).toFixed(2)} × ${(ext.maxY - ext.minY).toFixed(2)} mm</strong><br>` +
        `图层：<strong>${doc.layers.length + 1}</strong>（含 0 层） · 图元：<strong>${doc.commands.length}</strong><br>` +
        `LINE ${counts.line} · CIRCLE ${counts.circle} · POLYLINE ${counts.polyline} · SOLID ${counts.solid} · TEXT ${counts.text}`;

      renderStats(statsPill, currentDoc, { digits: 1 });
    } catch (err) {
      currentDoc = null;
      preview.setDocument(null);
      statsBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      statsPill.textContent = '空文档';
    }
  }

  async function loadFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'svg-converted';
    svgInput.value = await file.text();
    convert(true);
  }

  /* ---------------- 事件 ---------------- */
  bindDropZone(dropZone, fileInput, loadFile, ['border-teal-400', 'bg-teal-50']);
  bindSegmented(viewSeg, applyView);
  bindDebounced(svgInput, () => convert(true), 200);

  for (const el of [yAxisSelect, tolInput, layerBySelect, fillModeSelect, ignoreBgCheck]) {
    el.addEventListener('change', () => convert(true));
  }

  document.getElementById('sampleBtn').addEventListener('click', () => {
    currentBaseName = 'svg-sample';
    svgInput.value = samples.svg;
    convert(true);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    currentBaseName = 'svg-converted';
    svgInput.value = '';
    convert(true);
  });

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, currentBaseName, { themeMode: theme.mode, mode: 'export' });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxf(currentDoc, currentBaseName, {
      encoding: encodingSelect.value,
      font: fontSelect.value,
    });
  });

  /* ---------------- 初始化 ---------------- */
  svgInput.value = samples.svg;
  applyView('both');
  convert(true);

  window.__svgDemo = {
    get doc() { return currentDoc; },
    preview,
    convert,
    applyView,
  };
})();
