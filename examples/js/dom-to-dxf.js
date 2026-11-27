/* HTML DOM → SVG / DXF 实时转换 —— 页面逻辑 */
(() => {
  const {
    createPreview,
    bindThemeToggle,
    renderStats,
    setSegmented,
    bindSegmented,
  } = window.DxfDemo;
  window.DxfDemo.guard();

  const {
    TextCodec,
    domToDocument,
    domToSvg,
    downloadDomAsDxf,
    downloadDomAsSvg,
  } = window.VecBridge;

  const sourceSheet = document.getElementById('sourceSheet');
  const widthSelect = document.getElementById('widthSelect');
  const bgModeSelect = document.getElementById('bgModeSelect');
  const layerBySelect = document.getElementById('layerBySelect');
  const dedupeCheck = document.getElementById('dedupeCheck');
  const encodingSelect = document.getElementById('encodingSelect');
  const fontSelect = document.getElementById('fontSelect');
  const statsPill = document.getElementById('statsPill');
  const cadHost = document.getElementById('cadHost');
  const visualHost = document.getElementById('visualHost');
  const viewSeg = document.getElementById('viewSeg');
  const canvasPane = document.getElementById('canvasPane');
  const svgPane = document.getElementById('svgPane');

  let currentDoc = null;

  const preview = createPreview({
    canvas: document.getElementById('previewCanvas'),
    svgContainer: document.getElementById('previewSvg'),
    panes: [canvasPane, svgPane],
    theme: 'light',
  });
  const theme = bindThemeToggle(document.getElementById('themeBtn'), preview, 'light');

  function getOptions() {
    const fitWidth = Number(widthSelect.value);
    return {
      fitWidthMm: fitWidth > 0 ? fitWidth : undefined,
      backgroundMode: bgModeSelect.value,
      layerBy: layerBySelect.value,
      dedupeBorders: dedupeCheck.checked,
    };
  }

  function rebuild(autoFit = true) {
    const opts = getOptions();
    const doc = domToDocument(sourceSheet, opts);
    currentDoc = doc;
    preview.setDocument(doc, { fit: autoFit });

    visualHost.innerHTML = domToSvg(sourceSheet, { ...opts, mode: 'visual' });
    renderStats(statsPill, currentDoc, { digits: 1 });
  }

  function setView(view) {
    setSegmented(viewSeg, view);
    cadHost.classList.toggle('hidden', view !== 'cad');
    visualHost.classList.toggle('hidden', view !== 'visual');
    if (view === 'cad' && currentDoc) requestAnimationFrame(() => preview.fit());
  }

  bindSegmented(viewSeg, setView);

  document.getElementById('refreshBtn').addEventListener('click', () => rebuild(true));
  document.getElementById('fitBtn').addEventListener('click', () => {
    if (currentDoc) preview.fit();
  });

  for (const el of [widthSelect, bgModeSelect, layerBySelect, dedupeCheck]) {
    el.addEventListener('change', () => rebuild(true));
  }

  /* ---------------- 导出 ---------------- */
  document.getElementById('exportVisualSvgBtn').addEventListener('click', () => {
    downloadDomAsSvg(sourceSheet, {
      ...getOptions(),
      mode: 'visual',
      filename: 'spec-sheet-visual.svg',
      revokeDelayMs: 1500,
    });
  });

  document.getElementById('exportCadSvgBtn').addEventListener('click', () => {
    downloadDomAsSvg(sourceSheet, {
      ...getOptions(),
      mode: 'cad',
      svgOptions: { theme: theme.mode === 'dark' ? 'dark' : 'light' },
      filename: `spec-sheet-cad-${theme.mode}.svg`,
      revokeDelayMs: 1500,
    });
  });

  document.getElementById('exportDxfBtn').addEventListener('click', () => {
    const encoding = encodingSelect.value;
    const font = fontSelect.value;
    const codec = new TextCodec({
      onUnencodable: (entries) => console.warn('[VecBridge] 超出 GBK 的字符已转义：', entries),
    });
    downloadDomAsDxf(sourceSheet, {
      ...getOptions(),
      encoding,
      font,
      codec,
      filename: `spec-sheet-${encoding}-${font}.dxf`,
      revokeDelayMs: 1500,
    });
  });

  /* ---------------- 初始化 ---------------- */
  setView('cad');
  requestAnimationFrame(() => rebuild(true));

  window.__domDemo = {
    rebuild,
    get doc() { return currentDoc; },
    preview,
    setView,
  };
})();
