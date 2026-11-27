/*!
 * VecBridge 示例页共用工具集
 * 依赖：../dist/vecbridge.global.js 先于本文件加载
 *
 * 暴露 window.DxfDemo：
 *   guard()                  构建产物缺失时给出友好提示
 *   samples.dxf / samples.svg 内置演示样例
 *   resolveTheme(mode)       'light' | 'dark' → 扩展主题对象
 *   createPreview(opts)      创建 DualViewPreview（统一默认参数）
 *   bindThemeToggle(btn, preview, initial, labels)
 *   describeDoc(doc)         图幅 / 图层 / 各类型图元统计
 *   statsText(doc, opts)     单行统计文案
 *   renderStats(el, doc)     写入统计胶囊
 *   exportSvg / exportDxf    统一导出封装
 *   setSegmented(root, value) 分段控件高亮
 *   bindSegmented(root, handler)
 *   bindDropZone(zone, input, onFile, activeClasses)
 *   bindDebounced(el, fn, ms)
 */
(() => {
  const VB = window.VecBridge;

  /* ---------------- 内置演示样例 ---------------- */
  const SAMPLE_DXF = [
    '  0', 'SECTION', '  2', 'HEADER',
    '  9', '$ACADVER', '  1', 'AC1015',
    '  9', '$DWGCODEPAGE', '  3', 'UTF-8',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'TABLES',
    '  0', 'TABLE', '  2', 'LAYER', ' 70', '6',
    '  0', 'LAYER', '  2', '0', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'FRAME', ' 70', '0', ' 62', '7', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'AXIS', ' 70', '0', ' 62', '8', '  6', 'DASHED',
    '  0', 'LAYER', '  2', 'PART', ' 70', '0', ' 62', '5', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'ACCENT', ' 70', '0', ' 62', '1', '  6', 'CONTINUOUS',
    '  0', 'LAYER', '  2', 'NOTE', ' 70', '0', ' 62', '3', '  6', 'CONTINUOUS',
    '  0', 'ENDTAB',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'BLOCKS',
    '  0', 'BLOCK', '  8', '0', '  2', 'BOLT_HOLE', ' 70', '0', ' 10', '0', ' 20', '0', ' 30', '0',
    '  0', 'CIRCLE', '  8', '0', ' 62', '0', ' 10', '0', ' 20', '0', ' 40', '4.5',
    '  0', 'LINE', '  8', 'AXIS', ' 10', '-7', ' 20', '0', ' 11', '7', ' 21', '0',
    '  0', 'LINE', '  8', 'AXIS', ' 10', '0', ' 20', '-7', ' 11', '0', ' 21', '7',
    '  0', 'ENDBLK', '  8', '0',
    '  0', 'ENDSEC',
    '  0', 'SECTION', '  2', 'ENTITIES',
    '  0', 'LWPOLYLINE', '  8', 'FRAME', ' 90', '4', ' 70', '1', ' 43', '0.35',
    ' 10', '0', ' 20', '0', ' 10', '220', ' 20', '0', ' 10', '220', ' 20', '140', ' 10', '0', ' 20', '140',
    '  0', 'LWPOLYLINE', '  8', 'PART', ' 90', '8', ' 70', '1', ' 43', '0.4',
    ' 10', '28', ' 20', '25', ' 42', '0',
    ' 10', '112', ' 20', '25', ' 42', '0.41421356',
    ' 10', '120', ' 20', '33', ' 42', '0',
    ' 10', '120', ' 20', '97', ' 42', '0.41421356',
    ' 10', '112', ' 20', '105', ' 42', '0',
    ' 10', '28', ' 20', '105', ' 42', '0.41421356',
    ' 10', '20', ' 20', '97', ' 42', '0',
    ' 10', '20', ' 20', '33', ' 42', '0.41421356',
    '  0', 'CIRCLE', '  8', 'ACCENT', ' 10', '70', ' 20', '65', ' 40', '20',
    '  0', 'ARC', '  8', 'ACCENT', ' 10', '70', ' 20', '65', ' 40', '28', ' 50', '30', ' 51', '150',
    '  0', 'ARC', '  8', 'ACCENT', ' 10', '70', ' 20', '65', ' 40', '28', ' 50', '210', ' 51', '330',
    '  0', 'INSERT', '  8', 'PART', '  2', 'BOLT_HOLE', ' 10', '32', ' 20', '37', ' 70', '2', ' 71', '2', ' 44', '76', ' 45', '56',
    '  0', 'ELLIPSE', '  8', 'NOTE', ' 10', '170', ' 20', '88', ' 11', '26', ' 21', '8', ' 40', '0.5', ' 41', '0', ' 42', '6.2831853',
    '  0', 'SPLINE', '  8', 'ACCENT', ' 70', '8', ' 71', '3',
    ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '0', ' 40', '1', ' 40', '1', ' 40', '1', ' 40', '1',
    ' 10', '138', ' 20', '30', ' 10', '158', ' 20', '68', ' 10', '184', ' 20', '16', ' 10', '204', ' 20', '56',
    '  0', 'SOLID', '  8', 'ACCENT',
    ' 10', '142', ' 20', '126', ' 11', '150', ' 21', '129', ' 12', '150', ' 22', '123', ' 13', '150', ' 23', '123',
    '  0', 'TEXT', '  8', 'FRAME', ' 10', '110', ' 20', '126', ' 11', '110', ' 21', '126',
    ' 40', '5.2', '  1', 'VecBridge DXF 解析预览 %%c40 / 90%%d', ' 50', '0', ' 72', '1', ' 73', '2',
    '  0', 'MTEXT', '  8', 'NOTE', ' 10', '154', ' 20', '128', ' 40', '2.8', ' 71', '1',
    '  1', '{\\fMicrosoft YaHei;技术说明：\\P1. 圆角采用 LWPOLYLINE 凸度\\P2. 螺栓孔由 INSERT 阵列展开\\P3. 公差 %%p0.05mm}',
    '  0', 'ENDSEC',
    '  0', 'EOF',
  ].join('\n');

  const SAMPLE_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="297mm" height="210mm" viewBox="0 0 297 210">
  <rect x="0" y="0" width="297" height="210" fill="#ffffff" />
  <g id="FRAME" stroke="#111827" stroke-width="0.35" fill="none">
    <rect x="14" y="10" width="269" height="190" />
    <rect x="22" y="18" width="112" height="58" rx="6" ry="6" />
  </g>
  <g id="GRID" stroke="#6b7280" stroke-width="0.18" stroke-dasharray="2,1.5" fill="none">
    <line x1="150" y1="20" x2="150" y2="190" />
    <line x1="25" y1="105" x2="275" y2="105" />
  </g>
  <g id="GEOMETRY" fill="none" stroke-width="0.32">
    <circle cx="78" cy="47" r="18" stroke="#d92121" />
    <ellipse cx="215" cy="52" rx="34" ry="18" stroke="#0f5acc" transform="rotate(-12 215 52)" />
    <path d="M 30 168 C 80 112, 130 192, 185 138 S 255 124, 270 168" stroke="#168f33" />
    <path d="M 190 164 A 25 18 0 1 1 245 164 Z" stroke="#d92121" />
    <polygon points="48,118 68,152 28,152" stroke="#0f5acc" />
  </g>
  <g id="ANNOTATION" fill="#111827">
    <text x="148.5" y="191" font-size="4.5" font-weight="bold" text-anchor="middle" dominant-baseline="central">VecBridge · SVG 转 DXF 矢量样例</text>
    <text x="78" y="47" font-size="3" text-anchor="middle" dominant-baseline="central">Ø36</text>
    <text x="215" y="52" font-size="2.8" text-anchor="middle" dominant-baseline="central" transform="rotate(-12 215 52)">旋转椭圆标注</text>
  </g>
</svg>`;

  /* ---------------- 基础工具 ---------------- */
  function guard() {
    if (!window.VecBridge) {
      alert('未加载 ../dist/vecbridge.global.js，请先在项目根目录运行 pnpm build。');
      throw new Error('window.VecBridge is not loaded');
    }
  }

  const resolveTheme = (mode) =>
    mode === 'dark' ? VB.EXTENDED_DARK_THEME : VB.EXTENDED_LIGHT_THEME;

  function createPreview({ canvas, svgContainer, panes, measure, theme = 'light', decorations }) {
    return new VB.DualViewPreview({
      canvas,
      svgContainer,
      panes,
      measure,
      decorations,
      theme: resolveTheme(theme),
    });
  }

  /**
   * 绑定主题切换按钮，返回可变状态对象（mode 字段实时反映当前主题）。
   */
  function bindThemeToggle(button, preview, initial = 'light', labels = null) {
    const text = labels || { light: '浅色打印底', dark: '深色 CAD 底' };
    const state = { mode: initial };

    const apply = () => {
      preview.setTheme(resolveTheme(state.mode));
      button.textContent = state.mode === 'light' ? text.light : text.dark;
    };

    apply();
    if (button) {
      button.addEventListener('click', () => {
        state.mode = state.mode === 'light' ? 'dark' : 'light';
        apply();
      });
    }
    return state;
  }

  /* ---------------- 统计 ---------------- */
  function describeDoc(doc) {
    const counts = { line: 0, polyline: 0, circle: 0, solid: 0, text: 0 };
    for (const cmd of doc.commands) {
      if (counts[cmd.type] !== undefined) counts[cmd.type] += 1;
    }
    const ext = doc.extents;
    return {
      width: ext.maxX - ext.minX,
      height: ext.maxY - ext.minY,
      layers: doc.layers.length + 1,
      commands: doc.commands.length,
      counts,
    };
  }

  function countsLabel(counts) {
    return `L:${counts.line} P:${counts.polyline} C:${counts.circle} S:${counts.solid} T:${counts.text}`;
  }

  function statsText(doc, { digits = 1 } = {}) {
    const d = describeDoc(doc);
    return (
      `${d.width.toFixed(digits)} × ${d.height.toFixed(digits)}mm · ` +
      `${d.layers} 层 · ${d.commands} 图元 (${countsLabel(d.counts)})`
    );
  }

  function renderStats(el, doc, options = {}) {
    if (!el) return;
    el.textContent = doc ? statsText(doc, options) : '空文档';
  }

  /* ---------------- 导出封装 ---------------- */
  function exportSvg(doc, baseName, { themeMode = 'light', mode = 'export', decorations, includeThemeSuffix = true } = {}) {
    if (!doc) return;
    VB.downloadSvg(doc, {
      filename: `${baseName}${includeThemeSuffix ? `-${themeMode}` : ''}.svg`,
      theme: resolveTheme(themeMode),
      mode,
      decorations,
      revokeDelayMs: 1500,
    });
  }

  function exportDxf(doc, baseName, { encoding = 'gbk', font = 'gbenor' } = {}) {
    if (!doc) return;
    const codec = new VB.TextCodec({
      onUnencodable: (entries) => console.warn('[VecBridge] 超出 GBK 的字符已转义：', entries),
    });
    VB.downloadDxf(doc, {
      filename: `${baseName}-${encoding}-${font}.dxf`,
      encoding,
      font,
      codec,
      revokeDelayMs: 1500,
    });
  }

  /* ---------------- 分段控件 ---------------- */
  function setSegmented(root, value, attr = 'data-seg') {
    if (!root) return;
    root.querySelectorAll(`[${attr}]`).forEach((btn) => {
      btn.classList.toggle('is-active', btn.getAttribute(attr) === value);
    });
  }

  function bindSegmented(root, handler, attr = 'data-seg') {
    if (!root) return;
    root.querySelectorAll(`[${attr}]`).forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute(attr);
        setSegmented(root, value, attr);
        handler(value);
      });
    });
  }

  /* ---------------- 文件拖拽 / 输入节流 ---------------- */
  function bindDropZone(zone, input, onFile, activeClasses = ['border-blue-400', 'bg-blue-50']) {
    if (!zone || !input) return;
    zone.addEventListener('click', () => {
      input.value = '';
      input.click();
    });
    input.addEventListener('change', (e) => onFile(e.target.files && e.target.files[0]));
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add(...activeClasses);
    });
    zone.addEventListener('dragleave', () => zone.classList.remove(...activeClasses));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove(...activeClasses);
      onFile(e.dataTransfer.files && e.dataTransfer.files[0]);
    });
  }

  function bindDebounced(el, fn, delay = 200) {
    if (!el) return;
    let timer = null;
    el.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(fn, delay);
    });
  }

  window.DxfDemo = {
    guard,
    samples: { dxf: SAMPLE_DXF, svg: SAMPLE_SVG },
    resolveTheme,
    createPreview,
    bindThemeToggle,
    describeDoc,
    countsLabel,
    statsText,
    renderStats,
    exportSvg,
    exportDxf,
    setSegmented,
    bindSegmented,
    bindDropZone,
    bindDebounced,
  };
})();
