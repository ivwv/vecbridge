/* Canvas 2D API 矢量录制 —— 页面逻辑 */
(() => {
  const {
    createPreview,
    bindThemeToggle,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const { recordCanvasContext } = window.VecBridge;

  const drawCanvas = document.getElementById('drawCanvas');
  const realCtx = drawCanvas.getContext('2d');
  const widthSelect = document.getElementById('widthSelect');
  const fillModeSelect = document.getElementById('fillModeSelect');
  const brushColorSelect = document.getElementById('brushColorSelect');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const sceneSeg = document.getElementById('sceneSeg');
  const viewSeg = document.getElementById('viewSeg');
  const statsPill = document.getElementById('statsPill');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');

  let activeScene = 'geo';
  let viewMode = 'both';
  let recorder = null;
  let currentDoc = null;

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

  function createRecorder() {
    const fitW = Number(widthSelect.value);
    return recordCanvasContext(realCtx, {
      width: drawCanvas.width,
      height: drawCanvas.height,
      fitWidthMm: fitW > 0 ? fitW : undefined,
      fillMode: fillModeSelect.value,
      markPaper: true,
    });
  }

  function syncPreview(autoFit = true) {
    currentDoc = recorder.toDocument();
    preview.setDocument(currentDoc, { fit: autoFit });
    renderStats(statsPill, currentDoc, { digits: 1 });
  }

  /* ---------------- 内置场景 ---------------- */
  function drawGeometryScene(ctx) {
    ctx.clearRect(0, 0, 640, 440);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 640, 440);

    ctx.setLayer('GRID');
    ctx.save();
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 4]);
    for (let x = 40; x <= 600; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.lineTo(x, 400);
      ctx.stroke();
    }
    for (let y = 40; y <= 400; y += 40) {
      ctx.beginPath();
      ctx.moveTo(40, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }
    ctx.restore();

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, 592, 392);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Canvas 2D 标准 API 实时录制示例', 320, 52);

    ctx.setLayer('SHAPES');
    ctx.beginPath();
    ctx.roundRect(56, 88, 170, 110, 16);
    ctx.fillStyle = '#e0f2fe';
    ctx.fill();
    ctx.strokeStyle = '#0f5acc';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.translate(141, 143);
    ctx.rotate(Math.PI / 6);
    ctx.strokeStyle = '#d92121';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(-32, -22, 64, 44);
    ctx.restore();

    ctx.beginPath();
    ctx.arc(330, 145, 52, 0, Math.PI * 2);
    ctx.strokeStyle = '#168f33';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(330, 145, 34, -Math.PI * 0.75, Math.PI * 0.45);
    ctx.strokeStyle = '#d92121';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(505, 145, 62, 32, -0.25, 0, Math.PI * 2);
    ctx.strokeStyle = '#7c3aed';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.setLayer('CURVES');
    ctx.beginPath();
    ctx.moveTo(64, 340);
    ctx.bezierCurveTo(180, 220, 290, 390, 420, 270);
    ctx.quadraticCurveTo(500, 210, 576, 335);
    ctx.strokeStyle = '#ea580c';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.setLayer('LABELS');
    ctx.save();
    ctx.translate(330, 145);
    ctx.fillStyle = '#111827';
    ctx.font = '13px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('R52 精确圆', 0, 0);
    ctx.restore();
  }

  function drawChartScene(ctx) {
    ctx.clearRect(0, 0, 640, 440);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 640, 440);

    ctx.setLayer('FRAME');
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, 20, 600, 400);

    ctx.fillStyle = '#111827';
    ctx.font = 'bold 17px "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('季度指标对比图（Canvas 2D 直接转矢量 DXF/SVG）', 320, 50);

    const x0 = 80;
    const y0 = 365;
    const w = 500;
    const h = 270;

    ctx.setLayer('AXIS');
    ctx.strokeStyle = '#9ca3af';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    for (let i = 1; i <= 5; i++) {
      const y = y0 - (h / 5) * i;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + w, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0 - h - 10);
    ctx.lineTo(x0, y0);
    ctx.lineTo(x0 + w + 10, y0);
    ctx.stroke();

    const labels = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'];
    const bars = [42, 68, 56, 84, 73, 92];
    const lineVals = [35, 58, 62, 76, 82, 95];
    const step = w / labels.length;

    ctx.setLayer('BARS');
    for (let i = 0; i < labels.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const bh = (bars[i] / 100) * h;
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(cx - 18, y0 - bh, 36, bh);
      ctx.strokeStyle = '#1d4ed8';
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 18, y0 - bh, 36, bh);

      ctx.fillStyle = '#111827';
      ctx.font = '12px "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(labels[i], cx, y0 + 10);
    }

    ctx.setLayer('TREND');
    ctx.strokeStyle = '#d92121';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < lineVals.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const cy = y0 - (lineVals[i] / 100) * h;
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    for (let i = 0; i < lineVals.length; i++) {
      const cx = x0 + step * (i + 0.5);
      const cy = y0 - (lineVals[i] / 100) * h;
      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#d92121';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }
  }

  function renderScene(name) {
    activeScene = name;
    setSegmented(sceneSeg, name);
    recorder = createRecorder();
    if (name === 'geo') drawGeometryScene(recorder);
    else if (name === 'chart') drawChartScene(recorder);
    else {
      recorder.clearRect(0, 0, 640, 440);
      recorder.fillStyle = '#ffffff';
      recorder.fillRect(0, 0, 640, 440);
    }
    syncPreview(true);
  }

  /* ---------------- 手绘叠加 ---------------- */
  let drawing = false;
  let lastPt = null;
  let strokePts = [];

  function canvasPointFromEvent(e) {
    const rect = drawCanvas.getBoundingClientRect();
    return [
      ((e.clientX - rect.left) * drawCanvas.width) / rect.width,
      ((e.clientY - rect.top) * drawCanvas.height) / rect.height,
    ];
  }

  drawCanvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    drawing = true;
    const pt = canvasPointFromEvent(e);
    lastPt = pt;
    strokePts = [pt];
  });

  window.addEventListener('mousemove', (e) => {
    if (!drawing || !lastPt) return;
    const pt = canvasPointFromEvent(e);
    if (Math.hypot(pt[0] - lastPt[0], pt[1] - lastPt[1]) < 3) return;
    realCtx.save();
    realCtx.strokeStyle = brushColorSelect.value;
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
    if (!drawing) return;
    drawing = false;
    if (strokePts.length >= 2) {
      recorder.save();
      recorder.setLayer('FREEHAND');
      recorder.strokeStyle = brushColorSelect.value;
      recorder.lineWidth = 2;
      recorder.beginPath();
      recorder.moveTo(strokePts[0][0], strokePts[0][1]);
      for (let i = 1; i < strokePts.length; i++) {
        recorder.lineTo(strokePts[i][0], strokePts[i][1]);
      }
      recorder.stroke();
      recorder.restore();
      syncPreview(false);
    }
    lastPt = null;
    strokePts = [];
  });

  /* ---------------- 事件 ---------------- */
  bindSegmented(sceneSeg, renderScene);
  bindSegmented(viewSeg, applyView);

  widthSelect.addEventListener('change', () => renderScene(activeScene));
  fillModeSelect.addEventListener('change', () => renderScene(activeScene));

  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  document.getElementById('exportSvgBtn').addEventListener('click', () => {
    exportSvg(currentDoc, `canvas-recorded-${activeScene}`, { themeMode: theme.mode, mode: 'export' });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    exportDxf(currentDoc, `canvas-recorded-${activeScene}`, {
      encoding: encodingSelect.value,
      font: fontSelect.value,
    });
  });

  /* ---------------- 初始化 ---------------- */
  applyView('both');
  renderScene('geo');

  window.__canvasDemo = {
    get recorder() { return recorder; },
    get doc() { return currentDoc; },
    preview,
    renderScene,
    applyView,
  };
})();
