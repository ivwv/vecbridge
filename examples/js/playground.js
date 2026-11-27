/* VecBridge Playground —— 工作台逻辑（DXF / SVG / DOM / Canvas 四模式） */
(() => {
  window.DxfDemo.guard();

  const {
    samples,
    createPreview,
    exportDxf: exportDxfFile,
  } = window.DxfDemo;
  const SAMPLE_DXF = samples.dxf;
  const SAMPLE_SVG = samples.svg;

  const {
    EXTENDED_DARK_THEME,
    EXTENDED_LIGHT_THEME,
    TextCodec,
    parseDxfWithReport,
    parseSvgToDocument,
    domToDocument,
    domToSvg,
    recordCanvasContext,
    downloadSvg,
    downloadBytes,
  } = window.VecBridge;

  /* ================= 全局状态与双引擎预览 ================= */
  const previewCanvasPane = document.getElementById('previewCanvasPane');
  const previewSvgPane = document.getElementById('previewSvgPane');
  const cadDualHost = document.getElementById('cadDualHost');
  const visualSvgHost = document.getElementById('visualSvgHost');
  const visualSvgTabBtn = document.getElementById('visualSvgTabBtn');
  const previewThemeBtn = document.getElementById('previewThemeBtn');
  const statsPill = document.getElementById('statsPill');
  const globalEncoding = document.getElementById('globalEncoding');
  const globalFont = document.getElementById('globalFont');

  let activeTab = 'dxf'; // 'dxf' | 'svg' | 'dom' | 'canvas'
  let viewMode = 'both'; // 'both' | 'canvas' | 'svg' | 'visual'
  let previewTheme = 'light'; // 默认清新浅色打印主题
  let currentDoc = null;
  let currentVisualSvg = '';
  let currentBaseName = 'vecbridge-dxf-sample';

  // Tab 1 状态
  let dxfInput = SAMPLE_DXF;
  // Tab 4 状态
  let canvasScene = 'geo';
  let canvasRecorder = null;

  const resolvePreviewTheme = () =>
    previewTheme === 'dark' ? EXTENDED_DARK_THEME : EXTENDED_LIGHT_THEME;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    measure: () => (viewMode === 'svg' ? previewSvgPane : previewCanvasPane),
    panes: [previewCanvasPane, previewSvgPane],
    theme: previewTheme,
  });

  function updateDocument(doc, autoFit = true) {
    currentDoc = doc;
    preview.setDocument(doc, { fit: autoFit });
    if (!doc) {
      statsPill.textContent = '空文档';
      return;
    }
    const c = { line: 0, polyline: 0, circle: 0, solid: 0, text: 0 };
    for (const cmd of doc.commands) c[cmd.type] += 1;
    const ext = doc.extents;
    statsPill.textContent =
      `${(ext.maxX - ext.minX).toFixed(1)}×${(ext.maxY - ext.minY).toFixed(1)}mm · ` +
      `${doc.layers.length + 1} 层 · ${doc.commands.length} 图元 ` +
      `(L:${c.line} P:${c.polyline} C:${c.circle} S:${c.solid} T:${c.text})`;
  }

  function setViewMode(mode) {
    if (mode === 'visual' && activeTab !== 'dom') mode = 'both';
    viewMode = mode;
    document.querySelectorAll('.view-btn').forEach((btn) => {
      const on = btn.dataset.view === mode;
      btn.className = `view-btn ${btn.id === 'visualSvgTabBtn' && activeTab !== 'dom' ? 'hidden ' : ''}px-2.5 py-1 rounded-md text-xs transition-all ${
        on ? 'font-semibold bg-white text-slate-900 shadow-sm' : 'font-medium text-slate-600 hover:text-slate-900'
      }`;
    });

    const isVisual = mode === 'visual';
    cadDualHost.classList.toggle('hidden', isVisual);
    visualSvgHost.classList.toggle('hidden', !isVisual);
    if (!isVisual) {
      previewCanvasPane.classList.toggle('hidden', mode === 'svg');
      previewSvgPane.classList.toggle('hidden', mode === 'canvas');
      if (currentDoc) requestAnimationFrame(() => preview.fit());
    }
  }

  function switchTab(tab) {
    activeTab = tab;
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      const on = btn.dataset.tab === tab;
      btn.className = `tab-btn px-3 py-1.5 rounded-lg text-xs transition-all ${
        on ? 'font-semibold bg-white text-blue-700 shadow-sm' : 'font-medium text-slate-600 hover:text-slate-900'
      }`;
    });
    document.querySelectorAll('.tab-panel').forEach((panel) => {
      panel.classList.toggle('hidden', panel.id !== `panel-${tab}`);
    });

    // 左侧在 DOM 模式下稍微加宽便于查看完整规格表格
    const leftPanel = document.getElementById('leftPanel');
    leftPanel.style.width = tab === 'dom' ? '48%' : '';

    visualSvgTabBtn.classList.toggle('hidden', tab !== 'dom');
    if (tab !== 'dom' && viewMode === 'visual') setViewMode('both');

    if (tab === 'dxf') runDxfTab(true);
    else if (tab === 'svg') runSvgTab(true);
    else if (tab === 'dom') requestAnimationFrame(() => runDomTab(true));
    else if (tab === 'canvas') requestAnimationFrame(() => runCanvasTab(canvasScene));
  }

  /* ================= TAB 1: DXF 解析逻辑 ================= */
  const dxfFileInput = document.getElementById('dxfFileInput');
  const dxfDropZone = document.getElementById('dxfDropZone');
  const dxfEncoding = document.getElementById('dxfEncoding');
  const dxfSpace = document.getElementById('dxfSpace');
  const dxfTol = document.getElementById('dxfTol');
  const dxfHiddenLayers = document.getElementById('dxfHiddenLayers');
  const dxfText = document.getElementById('dxfText');
  const dxfDiagBox = document.getElementById('dxfDiagBox');
  const dxfWarnBox = document.getElementById('dxfWarnBox');
  const dxfErrBox = document.getElementById('dxfErrBox');

  function runDxfTab(autoFit = true) {
    dxfErrBox.classList.add('hidden');
    dxfWarnBox.classList.add('hidden');
    if (!dxfInput || (typeof dxfInput === 'string' && !dxfInput.trim())) {
      dxfDiagBox.textContent = '等待上传或粘贴 ASCII DXF 文件…';
      updateDocument(null);
      return;
    }
    try {
      const report = parseDxfWithReport(dxfInput, {
        encoding: dxfEncoding.value,
        space: dxfSpace.value,
        curveTolerance: parseFloat(dxfTol.value) || 0.1,
        includeHiddenLayers: dxfHiddenLayers.checked,
      });
      const s = report.stats;
      dxfDiagBox.innerHTML =
        `<strong>解析成功</strong> · 版本 <code>${s.acadVersion || '未声明'}</code> · ` +
        `解码 <code>${s.detectedEncoding}</code>${s.codepage ? ` (${s.codepage})` : ''} · ` +
        `块定义 <strong>${s.blockCount}</strong>`;
      if (report.warnings.length > 0) {
        dxfWarnBox.textContent = report.warnings.join('\n');
        dxfWarnBox.classList.remove('hidden');
      }
      updateDocument(report.document, autoFit);
    } catch (err) {
      dxfErrBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      dxfErrBox.classList.remove('hidden');
      updateDocument(null);
    }
  }

  async function loadDxfFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'dxf-converted';
    dxfInput = new Uint8Array(await file.arrayBuffer());
    dxfText.value = '';
    dxfText.placeholder = `已读取二进制 DXF：${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
    runDxfTab(true);
  }

  dxfDropZone.addEventListener('click', () => { dxfFileInput.value = ''; dxfFileInput.click(); });
  dxfFileInput.addEventListener('change', (e) => loadDxfFile(e.target.files[0]));
  dxfDropZone.addEventListener('dragover', (e) => { e.preventDefault(); dxfDropZone.classList.add('border-blue-500', 'bg-blue-50'); });
  dxfDropZone.addEventListener('dragleave', () => dxfDropZone.classList.remove('border-blue-500', 'bg-blue-50'));
  dxfDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dxfDropZone.classList.remove('border-blue-500', 'bg-blue-50');
    loadDxfFile(e.dataTransfer.files[0]);
  });

  let dxfTimer = null;
  dxfText.addEventListener('input', () => {
    clearTimeout(dxfTimer);
    dxfTimer = setTimeout(() => {
      currentBaseName = 'pasted-dxf';
      dxfInput = dxfText.value;
      runDxfTab(true);
    }, 200);
  });
  for (const el of [dxfEncoding, dxfSpace, dxfTol, dxfHiddenLayers]) {
    el.addEventListener('change', () => runDxfTab(true));
  }
  document.getElementById('dxfSampleBtn').addEventListener('click', () => {
    currentBaseName = 'vecbridge-dxf-sample';
    dxfInput = SAMPLE_DXF;
    dxfText.value = SAMPLE_DXF;
    runDxfTab(true);
  });
  document.getElementById('dxfClearBtn').addEventListener('click', () => {
    dxfInput = '';
    dxfText.value = '';
    runDxfTab(true);
  });

  /* ================= TAB 2: SVG → DXF 逻辑 ================= */
  const svgFileInput = document.getElementById('svgFileInput');
  const svgDropZone = document.getElementById('svgDropZone');
  const svgText = document.getElementById('svgText');
  const svgYAxis = document.getElementById('svgYAxis');
  const svgLayerBy = document.getElementById('svgLayerBy');
  const svgFillMode = document.getElementById('svgFillMode');
  const svgTol = document.getElementById('svgTol');
  const svgIgnoreBg = document.getElementById('svgIgnoreBg');
  const svgErrBox = document.getElementById('svgErrBox');

  svgText.value = SAMPLE_SVG;

  function runSvgTab(autoFit = true) {
    svgErrBox.classList.add('hidden');
    const src = svgText.value.trim();
    if (!src) { updateDocument(null); return; }
    try {
      const doc = parseSvgToDocument(src, {
        yAxis: svgYAxis.value,
        layerBy: svgLayerBy.value,
        fillMode: svgFillMode.value,
        curveTolerance: parseFloat(svgTol.value) || 0.1,
        ignoreBackground: svgIgnoreBg.checked,
      });
      currentBaseName = 'vecbridge-svg-converted';
      updateDocument(doc, autoFit);
    } catch (err) {
      svgErrBox.textContent = `解析失败：${err && err.message ? err.message : String(err)}`;
      svgErrBox.classList.remove('hidden');
      updateDocument(null);
    }
  }

  async function loadSvgFile(file) {
    if (!file) return;
    currentBaseName = file.name.replace(/\.[^/.]+$/, '').trim() || 'svg-converted';
    svgText.value = await file.text();
    runSvgTab(true);
  }

  svgDropZone.addEventListener('click', () => { svgFileInput.value = ''; svgFileInput.click(); });
  svgFileInput.addEventListener('change', (e) => loadSvgFile(e.target.files[0]));
  svgDropZone.addEventListener('dragover', (e) => { e.preventDefault(); svgDropZone.classList.add('border-teal-500', 'bg-teal-50'); });
  svgDropZone.addEventListener('dragleave', () => svgDropZone.classList.remove('border-teal-500', 'bg-teal-50'));
  svgDropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    svgDropZone.classList.remove('border-teal-500', 'bg-teal-50');
    loadSvgFile(e.dataTransfer.files[0]);
  });

  let svgTimer = null;
  svgText.addEventListener('input', () => {
    clearTimeout(svgTimer);
    svgTimer = setTimeout(() => runSvgTab(true), 200);
  });
  for (const el of [svgYAxis, svgLayerBy, svgFillMode, svgTol, svgIgnoreBg]) {
    el.addEventListener('change', () => runSvgTab(true));
  }
  document.getElementById('svgSampleBtn').addEventListener('click', () => {
    svgText.value = SAMPLE_SVG;
    runSvgTab(true);
  });

  /* ================= TAB 3: HTML DOM → 矢量逻辑 ================= */
  const domSourceSheet = document.getElementById('domSourceSheet');
  const domWidth = document.getElementById('domWidth');
  const domBgMode = document.getElementById('domBgMode');
  const domDedupe = document.getElementById('domDedupe');

  function getDomOpts() {
    const w = Number(domWidth.value);
    return {
      fitWidthMm: w > 0 ? w : undefined,
      backgroundMode: domBgMode.value,
      dedupeBorders: domDedupe.checked,
    };
  }

  function runDomTab(autoFit = true) {
    const opts = getDomOpts();
    currentBaseName = 'vecbridge-dom-sheet';
    const doc = domToDocument(domSourceSheet, opts);
    currentVisualSvg = domToSvg(domSourceSheet, { ...opts, mode: 'visual' });
    visualSvgHost.innerHTML = currentVisualSvg;
    updateDocument(doc, autoFit);
  }

  document.getElementById('domRefreshBtn').addEventListener('click', () => runDomTab(true));
  for (const el of [domWidth, domBgMode, domDedupe]) {
    el.addEventListener('change', () => runDomTab(true));
  }

  /* ================= TAB 4: Canvas 2D 双写录制逻辑 ================= */
  const drawCanvas = document.getElementById('drawCanvas');
  const realCtx = drawCanvas.getContext('2d');
  const canvasWidthMm = document.getElementById('canvasWidthMm');
  const canvasFillMode = document.getElementById('canvasFillMode');
  const brushColor = document.getElementById('brushColor');

  function createFreshRecorder() {
    const fitW = Number(canvasWidthMm.value);
    return recordCanvasContext(realCtx, {
      width: drawCanvas.width,
      height: drawCanvas.height,
      fitWidthMm: fitW > 0 ? fitW : undefined,
      fillMode: canvasFillMode.value,
      markPaper: true,
    });
  }

  function drawCanvasGeo(ctx) {
    ctx.clearRect(0, 0, 520, 360);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 520, 360);

    ctx.setLayer('GRID');
    ctx.save();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let x = 40; x <= 480; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 32); ctx.lineTo(x, 328); ctx.stroke();
    }
    for (let y = 40; y <= 320; y += 40) {
      ctx.beginPath(); ctx.moveTo(32, y); ctx.lineTo(488, y); ctx.stroke();
    }
    ctx.restore();

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(20, 20, 480, 320);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Canvas 2D 标准 API 实时录制', 260, 46);

    ctx.setLayer('SHAPES');
    ctx.beginPath();
    ctx.roundRect(48, 76, 136, 92, 14);
    ctx.fillStyle = '#dbeafe';
    ctx.fill();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.save();
    ctx.translate(116, 122);
    ctx.rotate(Math.PI / 6);
    ctx.strokeStyle = '#dc2626';
    ctx.strokeRect(-26, -18, 52, 36);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(270, 124, 42, 0, Math.PI * 2);
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(270, 124, 28, -Math.PI * 0.7, Math.PI * 0.45);
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(410, 124, 52, 26, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.setLayer('CURVES');
    ctx.beginPath();
    ctx.moveTo(54, 284);
    ctx.bezierCurveTo(150, 190, 240, 320, 345, 224);
    ctx.quadraticCurveTo(410, 180, 466, 280);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.2;
    ctx.stroke();
  }

  function drawCanvasChart(ctx) {
    ctx.clearRect(0, 0, 520, 360);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 520, 360);

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(18, 18, 484, 324);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('季度指标对比（Canvas 2D → 矢量 DXF/SVG）', 260, 44);

    const x0 = 64, y0 = 296, w = 408, h = 216;
    ctx.setLayer('AXIS');
    ctx.strokeStyle = '#cbd5e1';
    ctx.setLineDash([4, 4]);
    for (let i = 1; i <= 4; i++) {
      const y = y0 - (h / 4) * i;
      ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x0 + w, y); ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(x0, y0 - h - 8); ctx.lineTo(x0, y0); ctx.lineTo(x0 + w + 8, y0); ctx.stroke();

    const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    const bars = [44, 68, 54, 86, 74, 94];
    const trend = [36, 56, 62, 78, 84, 96];
    const step = w / labels.length;

    ctx.setLayer('BARS');
    for (let i = 0; i < labels.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const bh = (bars[i] / 100) * h;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cx - 14, y0 - bh, 28, bh);
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 14, y0 - bh, 28, bh);
      ctx.fillStyle = '#0f172a';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, y0 + 8);
    }

    ctx.setLayer('TREND');
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (let i = 0; i < trend.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const cy = y0 - (trend[i] / 100) * h;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();
  }

  function runCanvasTab(sceneName) {
    canvasScene = sceneName;
    currentBaseName = `vecbridge-canvas-${sceneName}`;
    document.querySelectorAll('.cscene-btn').forEach((btn) => {
      const on = btn.dataset.cscene === sceneName;
      btn.className = `cscene-btn px-2.5 py-1 text-xs rounded-lg transition-colors ${
        on ? 'font-semibold bg-blue-600 text-white' : 'font-medium border border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
      }`;
    });
    canvasRecorder = createFreshRecorder();
    if (sceneName === 'geo') drawCanvasGeo(canvasRecorder);
    else if (sceneName === 'chart') drawCanvasChart(canvasRecorder);
    else {
      canvasRecorder.clearRect(0, 0, 520, 360);
      canvasRecorder.fillStyle = '#ffffff';
      canvasRecorder.fillRect(0, 0, 520, 360);
    }
    updateDocument(canvasRecorder.toDocument(), true);
  }

  document.querySelectorAll('.cscene-btn').forEach((btn) => {
    btn.addEventListener('click', () => runCanvasTab(btn.dataset.cscene));
  });
  canvasWidthMm.addEventListener('change', () => runCanvasTab(canvasScene));
  canvasFillMode.addEventListener('change', () => runCanvasTab(canvasScene));

  // 手绘叠画
  let drawing = false;
  let lastPt = null;
  let strokePts = [];
  const canvasPt = (e) => {
    const r = drawCanvas.getBoundingClientRect();
    return [((e.clientX - r.left) * drawCanvas.width) / r.width, ((e.clientY - r.top) * drawCanvas.height) / r.height];
  };
  drawCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0 || !canvasRecorder) return;
    drawing = true;
    lastPt = canvasPt(e);
    strokePts = [lastPt];
  });
  window.addEventListener('mousemove', (e) => {
    if (!drawing || !lastPt) return;
    const pt = canvasPt(e);
    if (Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]) < 3) return;
    realCtx.save();
    realCtx.strokeStyle = brushColor.value;
    realCtx.lineWidth = 2;
    realCtx.lineCap = 'round';
    realCtx.beginPath();
    realCtx.moveTo(lastPt[0], lastPt[1]);
    realCtx.lineTo(pt[0], pt[1]);
    realCtx.stroke();
    realCtx.restore();
    strokePts.push(pt);
    lastPt = pt;
  });
  window.addEventListener('mouseup', () => {
    if (!drawing || !canvasRecorder) return;
    drawing = false;
    if (strokePts.length >= 2) {
      canvasRecorder.save();
      canvasRecorder.setLayer('FREEHAND');
      canvasRecorder.strokeStyle = brushColor.value;
      canvasRecorder.lineWidth = 2;
      canvasRecorder.beginPath();
      canvasRecorder.moveTo(strokePts[0][0], strokePts[0][1]);
      for (let i = 1; i < strokePts.length; i++) {
        canvasRecorder.lineTo(strokePts[i][0], strokePts[i][1]);
      }
      canvasRecorder.stroke();
      canvasRecorder.restore();
      updateDocument(canvasRecorder.toDocument(), false);
    }
    lastPt = null;
    strokePts = [];
  });

  /* ================= 通用交互与导出 ================= */
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
  document.querySelectorAll('.view-btn').forEach((btn) => {
    btn.addEventListener('click', () => setViewMode(btn.dataset.view));
  });

  previewThemeBtn.addEventListener('click', () => {
    previewTheme = previewTheme === 'light' ? 'dark' : 'light';
    previewThemeBtn.textContent = previewTheme === 'light' ? '浅色打印底' : '深色 CAD 底';
    preview.setTheme(resolvePreviewTheme());
  });

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    if (activeTab === 'dom' && viewMode === 'visual' && currentVisualSvg) {
      downloadBytes(currentVisualSvg, {
        filename: `${currentBaseName}-visual.svg`,
        mimeType: 'image/svg+xml;charset=utf-8',
        revokeDelayMs: 1500,
      });
      return;
    }
    if (!currentDoc) return;
    downloadSvg(currentDoc, {
      filename: `${currentBaseName}-${previewTheme}.svg`,
      theme: resolvePreviewTheme(),
      mode: 'export',
      revokeDelayMs: 1500,
    });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxfFile(currentDoc, currentBaseName, {
      encoding: globalEncoding.value,
      font: globalFont.value,
    });
  });

  // 初始化默认进入 DXF 预览标签并加载内置示例
  dxfText.value = SAMPLE_DXF;
  switchTab('dxf');

  window.__playground = {
    switchTab,
    setViewMode,
    preview,
    get doc() { return currentDoc; },
  };
})();
