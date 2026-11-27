/* DXF 上传预览与 SVG 导出 —— 页面逻辑 */
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

  const {
    parseDxfWithReport,
  } = window.VecBridge;

  const fileInput = document.getElementById('fileInput');
  const dropZone = document.getElementById('dropZone');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const dxfEncoding = document.getElementById('dxfEncoding');
  const dxfSpace = document.getElementById('dxfSpace');
  const dxfTol = document.getElementById('dxfTol');
  const dxfHiddenLayers = document.getElementById('dxfHiddenLayers');
  const dxfText = document.getElementById('dxfText');
  const statusBox = document.getElementById('statusBox');
  const warningsBox = document.getElementById('warningsBox');
  const errorBox = document.getElementById('errorBox');
  const statsBox = document.getElementById('statsBox');
  const statsPill = document.getElementById('statsPill');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');
  const viewSeg = document.getElementById('viewSeg');

  let viewMode = 'both';
  let currentInput = null;
  let currentBaseName = 'dxf-sample';
  let currentDoc = null;
  let lastReport = null;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? svgPane : canvasPane),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });

  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');
  const encoding = () => encodingSelect.value;
  const font = () => fontSelect.value;

  /* ---------------- 解析与渲染 ---------------- */
  function renderCurrent(autoFit = true) {
    errorBox.classList.add('hidden');
    warningsBox.classList.add('hidden');

    if (currentInput === null || (typeof currentInput === 'string' && !currentInput.trim())) {
      currentDoc = null;
      lastReport = null;
      preview.setDocument(null);
      statusBox.textContent = '等待导入 DXF…';
      statsBox.textContent = '尚未载入图纸';
      statsPill.textContent = '空文档';
      return;
    }

    try {
      const report = parseDxfWithReport(currentInput, {
        encoding: dxfEncoding.value,
        space: dxfSpace.value,
        curveTolerance: parseFloat(dxfTol.value) || 0.1,
        includeHiddenLayers: dxfHiddenLayers.checked,
      });

      lastReport = report;
      currentDoc = report.document;
      preview.setDocument(currentDoc, { fit: autoFit });

      const s = report.stats;
      statusBox.innerHTML =
        `<strong>解析成功</strong> · 版本 <span class="font-mono">${s.acadVersion || '未声明'}</span> · ` +
        `解码 <span class="font-mono">${s.detectedEncoding}</span>${s.codepage ? ` (${s.codepage})` : ''}`;

      const ext = currentDoc.extents;
      const counts = { line: 0, circle: 0, polyline: 0, solid: 0, text: 0 };
      for (const cmd of currentDoc.commands) counts[cmd.type] += 1;

      statsBox.innerHTML =
        `图幅：<strong>${(ext.maxX - ext.minX).toFixed(2)} × ${(ext.maxY - ext.minY).toFixed(2)} mm</strong><br>` +
        `图层：<strong>${currentDoc.layers.length + 1}</strong> · 块定义：<strong>${s.blockCount}</strong><br>` +
        `图元：<strong>${currentDoc.commands.length}</strong> ` +
        `(LINE ${counts.line} / POLY ${counts.polyline} / CIRCLE ${counts.circle} / SOLID ${counts.solid} / TEXT ${counts.text})`;

      renderStats(statsPill, currentDoc, { digits: 1 });

      if (report.warnings.length > 0) {
        warningsBox.textContent = report.warnings.join('\n');
        warningsBox.classList.remove('hidden');
      }
    } catch (err) {
      currentDoc = null;
      lastReport = null;
      preview.setDocument(null);
      errorBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      errorBox.classList.remove('hidden');
      statusBox.textContent = '解析失败';
      statsBox.textContent = '请检查源文件或编码设置';
      statsPill.textContent = '空文档';
    }
  }

  async function loadFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'dxf-preview';
    currentInput = new Uint8Array(await file.arrayBuffer());
    dxfText.value = '';
    dxfText.placeholder = `已载入二进制文件：${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    renderCurrent(true);
  }

  /* ---------------- 视图切换 ---------------- */
  function applyView(mode) {
    viewMode = mode;
    setSegmented(viewSeg, mode);
    canvasPane.classList.toggle('hidden', mode === 'svg');
    svgPane.classList.toggle('hidden', mode === 'canvas');
    if (currentDoc) requestAnimationFrame(() => preview.fit());
  }

  /* ---------------- 事件绑定 ---------------- */
  bindDropZone(dropZone, fileInput, loadFile);
  bindSegmented(viewSeg, applyView);

  bindDebounced(dxfText, () => {
    currentBaseName = 'pasted-dxf';
    currentInput = dxfText.value;
    renderCurrent(true);
  }, 200);

  for (const el of [dxfEncoding, dxfSpace, dxfTol, dxfHiddenLayers]) {
    el.addEventListener('change', () => renderCurrent(true));
  }

  document.getElementById('sampleBtn').addEventListener('click', () => {
    currentBaseName = 'dxf-sample';
    currentInput = samples.dxf;
    dxfText.value = samples.dxf;
    renderCurrent(true);
  });

  document.getElementById('clearBtn').addEventListener('click', () => {
    currentBaseName = 'dxf-preview';
    currentInput = null;
    dxfText.value = '';
    dxfText.placeholder = '粘贴 ASCII DXF 文本（以 0 / SECTION 开头）';
    renderCurrent(true);
  });

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, currentBaseName, { themeMode: theme.mode, mode: 'export' });
  });

  document.getElementById('exportPrintSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, `${currentBaseName}-print`, { themeMode: 'light', mode: 'export', includeThemeSuffix: false });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxf(currentDoc, currentBaseName, { encoding: encoding(), font: font() });
  });

  /* ---------------- 初始化 ---------------- */
  currentInput = samples.dxf;
  dxfText.value = samples.dxf;
  applyView('both');
  renderCurrent(true);

  window.__dxfPreview = {
    get doc() { return currentDoc; },
    get report() { return lastReport; },
    preview,
    renderCurrent,
    applyView,
  };
})();
