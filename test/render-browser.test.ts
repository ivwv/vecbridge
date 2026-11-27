import { describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';

import { DrawingDocument, TextCodec } from '../src/index';
import { DualViewPreview, Emitter, SvgLiveView, Viewport } from '../src/render';
import { downloadBytes, downloadDxf, downloadSvg } from '../src/browser';

function withDomGlobals<T>(dom: JSDOM, fn: () => T): T {
  const prev = {
    window: globalThis.window,
    document: globalThis.document,
    URL: globalThis.URL,
    Blob: globalThis.Blob,
    AbortController: globalThis.AbortController,
  };
  Object.assign(globalThis, {
    window: dom.window,
    document: dom.window.document,
    URL: dom.window.URL,
    Blob: dom.window.Blob,
    AbortController: dom.window.AbortController,
  });
  try {
    return fn();
  } finally {
    Object.assign(globalThis, prev);
  }
}

describe('DualViewPreview & Viewport', () => {
  it('recomputes zoom limits per document with headroom and without leaking across fits', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="p1"><canvas id="c"></canvas></div><div id="p2"><div id="s"></div></div></body></html>'
    );
    withDomGlobals(dom, () => {
      const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
      canvas.getContext = () => null;
      const svg = dom.window.document.getElementById('s') as HTMLElement;
      const pane1 = dom.window.document.getElementById('p1') as HTMLElement;
      const pane2 = dom.window.document.getElementById('p2') as HTMLElement;

      const preview = new DualViewPreview({
        canvas,
        svgContainer: svg,
        panes: [pane1, pane2],
        limits: { minScale: 0.2, maxScale: 50 },
      });

      // 1. Huge drawing: fitted scale is far below 0.2, yet wheel zoom-out still works.
      const huge = new DrawingDocument({ extents: { minX: 0, minY: 0, maxX: 50_000, maxY: 40_000 } });
      huge.addLine(0, 0, 50_000, 40_000, '0', 7);
      preview.setDocument(huge, { fit: true });
      const hugeScale = preview.camera.scale;
      expect(hugeScale).toBeLessThan(0.2);

      pane1.dispatchEvent(
        new dom.window.WheelEvent('wheel', {
          deltaY: 120,
          clientX: 400,
          clientY: 300,
          bubbles: true,
          cancelable: true,
        })
      );
      expect(preview.camera.scale).toBeLessThan(hugeScale);

      // 2. Switch back to normal A4: limits must reset to baseLimits (minScale = 0.2).
      const a4 = new DrawingDocument({ extents: { minX: 0, minY: 0, maxX: 297, maxY: 210 } });
      a4.addLine(0, 0, 297, 210, '0', 7);
      preview.setDocument(a4, { fit: true });

      for (let i = 0; i < 40; i++) {
        pane1.dispatchEvent(
          new dom.window.WheelEvent('wheel', {
            deltaY: 120,
            clientX: 400,
            clientY: 300,
            bubbles: true,
            cancelable: true,
          })
        );
      }
      expect(preview.camera.scale).toBeCloseTo(0.2, 6);
      preview.destroy();
    });
  });

  it('prevents text selection on drag start, clears drag on blur, and guards post-destroy calls', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="p1"><canvas id="c"></canvas></div><div id="s"></div></body></html>'
    );
    withDomGlobals(dom, () => {
      const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
      canvas.getContext = () => null;
      const svg = dom.window.document.getElementById('s') as HTMLElement;
      const preview = new DualViewPreview({ canvas, svgContainer: svg });

      const doc = new DrawingDocument();
      doc.addLine(0, 0, 100, 100, '0', 7);
      preview.setDocument(doc, { fit: true });

      const down = new dom.window.MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
        cancelable: true,
      });
      svg.dispatchEvent(down);
      expect(down.defaultPrevented).toBe(true);

      // Window blur must cancel active drag so later mousemove does not pan.
      const before = preview.camera.getState();
      dom.window.dispatchEvent(new dom.window.Event('blur'));
      dom.window.dispatchEvent(
        new dom.window.MouseEvent('mousemove', { clientX: 250, clientY: 250 })
      );
      expect(preview.camera.getState()).toEqual(before);

      preview.destroy();
      let eventsAfterDestroy = 0;
      preview.on('render', () => {
        eventsAfterDestroy += 1;
      });
      preview.setDocument(doc, { fit: true });
      preview.setTheme('light');
      preview.fit();
      preview.render();
      expect(eventsAfterDestroy).toBe(0);
      expect(svg.innerHTML).toBe('');
    });
  });

  it('uses the canvas ownerDocument realm AbortController and supports drag panning and live APIs', () => {
    const dom = new JSDOM(
      '<!doctype html><html><body><div id="p1"><canvas id="c"></canvas></div><div id="p2"><div id="s"></div></div></body></html>'
    );
    // Intentionally do NOT override globalThis.AbortController or globalThis.window:
    // DualViewPreview must resolve them from canvas.ownerDocument.defaultView.
    const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
    canvas.getContext = () => null;
    const svg = dom.window.document.getElementById('s') as HTMLElement;
    const pane1 = dom.window.document.getElementById('p1') as HTMLElement;
    const pane2 = dom.window.document.getElementById('p2') as HTMLElement;
    pane1.getBoundingClientRect = () =>
      ({ width: 800, height: 690, left: 0, top: 0, right: 800, bottom: 690 }) as DOMRect;

    const preview = new DualViewPreview({
      canvas,
      svgContainer: svg,
      panes: [pane1, pane2],
      measure: pane1,
    });

    const doc = new DrawingDocument();
    doc.addText(10, 10, 4, 'TITLE', 'TITLE', 7);
    preview.setDocument(doc, { fit: true });

    const before = preview.camera.getState();
    const vbBefore = svg.querySelector('svg')?.getAttribute('viewBox');

    pane1.dispatchEvent(
      new dom.window.MouseEvent('mousedown', {
        button: 0,
        clientX: 100,
        clientY: 100,
        cancelable: true,
      })
    );
    dom.window.dispatchEvent(
      new dom.window.MouseEvent('mousemove', { clientX: 140, clientY: 120 })
    );
    dom.window.dispatchEvent(new dom.window.MouseEvent('mouseup'));

    expect(preview.camera.offsetX).toBeCloseTo(before.offsetX + 40, 6);
    expect(preview.camera.offsetY).toBeCloseTo(before.offsetY + 20, 6);
    expect(svg.querySelector('svg')?.getAttribute('viewBox')).not.toBe(vbBefore);

    preview.setMeasureElement(pane2);
    expect(preview.viewport.getMeasureElement()).toBe(pane2);

    preview.setDecorations({ boldLayers: ['TITLE'] });
    expect(svg.querySelector('text')?.getAttribute('font-weight')).toBe('bold');

    preview.resetView();
    expect(preview.camera.offsetX).toBeCloseTo(before.offsetX, 6);
    preview.destroy();
  });

  it('clamps Viewport minSize to at least 1', () => {
    const dom = new JSDOM('<!doctype html><html><body><div id="box"><canvas id="c"></canvas></div></body></html>');
    withDomGlobals(dom, () => {
      const canvas = dom.window.document.getElementById('c') as HTMLCanvasElement;
      const box = dom.window.document.getElementById('box') as HTMLElement;
      box.getBoundingClientRect = () =>
        ({ width: 0.2, height: 0.2, left: 0, top: 0, right: 0.2, bottom: 0.2 }) as DOMRect;

      const viewport = new Viewport({ canvas, measure: box, minSize: 0 });
      const m = viewport.sync();
      expect(m.width).toBe(1);
      expect(m.height).toBe(1);
    });
  });

  it('Emitter and SvgLiveView manage subscriptions and live DOM updates cleanly', () => {
    const emitter = new Emitter<{ tick: number }>();
    const received: number[] = [];
    const off = emitter.on('tick', (n) => received.push(n));
    emitter.emit('tick', 1);
    off();
    emitter.emit('tick', 2);
    expect(received).toEqual([1]);

    const dom = new JSDOM('<!doctype html><html><body><div id="host"></div></body></html>');
    const host = dom.window.document.getElementById('host') as HTMLElement;
    const view = new SvgLiveView(host, { theme: 'dark', rootId: 'customSvg' });
    const doc = new DrawingDocument();
    doc.addLine(0, 0, 10, 10, '0', 1);

    view.render(doc, { x: 0, y: -10, w: 20, h: 20 });
    expect(view.hasRenderedContent).toBe(true);
    expect(view.element?.getAttribute('id')).toBe('customSvg');

    view.setViewBox({ x: 5, y: -5, w: 10, h: 10 });
    expect(view.element?.getAttribute('viewBox')).toBe('5 -5 10 10');

    view.clear();
    expect(view.hasRenderedContent).toBe(false);
    expect(view.element).toBeNull();
  });
});

describe('browser download helpers', () => {
  it('throws a clear error outside a browser environment', () => {
    const doc = new DrawingDocument();
    expect(() => downloadBytes('x', { filename: 'a.txt' })).toThrow(/not available/i);
    expect(() => downloadDxf(doc, { filename: 'a.dxf' })).toThrow(/not available/i);
    expect(() => downloadSvg(doc, { filename: 'a.svg' })).toThrow(/not available/i);
  });

  it('attaches and removes the anchor, forwards custom codec, and tolerates null document.body', () => {
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    withDomGlobals(dom, () => {
      let revoked = 0;
      Object.defineProperty(dom.window.URL, 'createObjectURL', {
        value: () => 'blob:test',
        configurable: true,
      });
      Object.defineProperty(dom.window.URL, 'revokeObjectURL', {
        value: () => {
          revoked += 1;
        },
        configurable: true,
      });

      const clickedConnected: boolean[] = [];
      dom.window.HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
        clickedConnected.push(this.isConnected);
      };

      const escaped: string[] = [];
      const codec = new TextCodec({ onUnencodable: (entries) => escaped.push(...entries) });
      const doc = new DrawingDocument();
      doc.addText(0, 0, 3, 'Emoji😀', '0', 7);

      downloadDxf(doc, { filename: 'test.dxf', encoding: 'gbk', codec });
      expect(clickedConnected).toEqual([true]);
      expect(dom.window.document.body.querySelectorAll('a')).toHaveLength(0);
      expect(escaped.length).toBeGreaterThan(0);
      expect(revoked).toBe(1);

      // Even if document.body is missing, downloadBytes falls back without throwing.
      dom.window.document.body.remove();
      expect(dom.window.document.body).toBeNull();
      expect(() => downloadSvg(doc, { filename: 'test.svg' })).not.toThrow();
      expect(revoked).toBe(2);

      // Delayed revocation must wait for revokeDelayMs.
      vi.useFakeTimers();
      try {
        downloadBytes('hello', { filename: 'delay.txt', revokeDelayMs: 500 });
        expect(revoked).toBe(2);
        vi.advanceTimersByTime(499);
        expect(revoked).toBe(2);
        vi.advanceTimersByTime(1);
        expect(revoked).toBe(3);
      } finally {
        vi.useRealTimers();
      }
    });
  });
});