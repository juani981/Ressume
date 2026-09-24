import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, render, fireEvent } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import { useVerticalSpacerResize } from '../components/CV/SpacerBlock';
import { captureEditorSnapshot, generateCleanPrintHTML, executeCleanPrint } from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';

describe('Real-Time Sticky Quantum Pagination & Context Metrics', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    container.id = 'test-suite-root';
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    vi.restoreAllMocks();
  });

  describe('1. CVContext Page Metrics & Boundary Calculations', () => {
    it('provides pageHeightPx (~1123px) and pageGapPx (20px)', () => {
      const { result } = renderHook(() => useCV(), {
        wrapper: ({ children }) => <CVProvider>{children}</CVProvider>,
      });

      expect(result.current.pageHeightPx).toBeGreaterThanOrEqual(1000);
      expect(result.current.pageGapPx).toBe(20);
      expect(result.current.totalPages).toBeGreaterThanOrEqual(1);
    });

    it('calculates accurate page boundaries via getPageBounds', () => {
      const { result } = renderHook(() => useCV(), {
        wrapper: ({ children }) => <CVProvider>{children}</CVProvider>,
      });

      const { getPageBounds, pageHeightPx, pageGapPx } = result.current;

      // Page 1
      const p1 = getPageBounds(1);
      expect(p1.top).toBe(0);
      expect(p1.bottom).toBe(pageHeightPx);
      expect(p1.foldTop).toBe(pageHeightPx);
      expect(p1.foldBottom).toBe(pageHeightPx + pageGapPx);

      // Page 2
      const p2 = getPageBounds(2);
      expect(p2.top).toBe(pageHeightPx + pageGapPx);
      expect(p2.bottom).toBe(p2.top + pageHeightPx);
      expect(p2.foldTop).toBe(2 * pageHeightPx + pageGapPx);
      expect(p2.foldBottom).toBe(p2.foldTop + pageGapPx);
    });

    it('identifies if an element crosses the fold via getElementPageInfo', () => {
      const { result } = renderHook(() => useCV(), {
        wrapper: ({ children }) => <CVProvider>{children}</CVProvider>,
      });

      const { getElementPageInfo, pageHeightPx } = result.current;

      // Element safely inside page 1 (respecting pagePadding of 24px)
      const safeInfo = getElementPageInfo({ top: 100, height: 200 });
      expect(safeInfo.pageNum).toBe(1);
      expect(safeInfo.isCrossingFold).toBe(false);
      expect(safeInfo.remainingInPage).toBe(pageHeightPx - 24 - 300);

      // Element straddling the fold of page 1
      const crossingInfo = getElementPageInfo({ top: pageHeightPx - 50, height: 100 });
      expect(crossingInfo.pageNum).toBe(1);
      expect(crossingInfo.isCrossingFold).toBe(true);
      expect(crossingInfo.remainingInPage).toBe(0);
    });

    it('increments paginationTrigger when triggerPaginationRecalc is called', () => {
      const { result } = renderHook(() => useCV(), {
        wrapper: ({ children }) => <CVProvider>{children}</CVProvider>,
      });

      const initial = result.current.paginationTrigger;
      act(() => {
        result.current.triggerPaginationRecalc();
      });
      expect(result.current.paginationTrigger).toBe(initial + 1);
    });
  });

  describe('2. Live Resize Event Dispatch (cv-spacer-live-resize)', () => {
    it('dispatches cv-spacer-live-resize on every pixel drag move', () => {
      const liveEvents = [];
      const handler = (e) => liveEvents.push(e.detail);
      window.addEventListener('cv-spacer-live-resize', handler);

      const onCommit = vi.fn();
      const TestSpacerComponent = () => {
        const { handleResizeStart, localHeight } = useVerticalSpacerResize({
          initialHeight: 40,
          min: 0,
          max: 400,
          onCommit,
        });

        return (
          <div data-testid="handle" onMouseDown={handleResizeStart}>
            Height: {localHeight}
          </div>
        );
      };

      const { getByTestId } = render(<TestSpacerComponent />);
      const handle = getByTestId('handle');

      // Start drag at Y = 100
      fireEvent.mouseDown(handle, { clientY: 100 });

      // Move mouse to Y = 130 (+30px)
      fireEvent.mouseMove(window, { clientY: 130 });

      expect(liveEvents.length).toBeGreaterThan(0);
      const lastEvent = liveEvents[liveEvents.length - 1];
      expect(lastEvent.height).toBe(70); // 40 + 30

      // End drag
      fireEvent.mouseUp(window, { clientY: 130 });
      expect(onCommit).toHaveBeenCalledWith(70);

      window.removeEventListener('cv-spacer-live-resize', handler);
    });

    it('dispatches cv-spacer-live-resize on keyboard arrow adjustments', () => {
      const liveEvents = [];
      const handler = (e) => liveEvents.push(e.detail);
      window.addEventListener('cv-spacer-live-resize', handler);

      const onCommit = vi.fn();
      const TestKeyboardSpacer = () => {
        const { handleKeyDown, localHeight } = useVerticalSpacerResize({
          initialHeight: 50,
          min: 0,
          max: 400,
          onCommit,
        });

        return (
          <button data-testid="spacer-btn" onKeyDown={handleKeyDown}>
            {localHeight}
          </button>
        );
      };

      const { getByTestId } = render(<TestKeyboardSpacer />);
      const btn = getByTestId('spacer-btn');

      // ArrowDown (+2px)
      fireEvent.keyDown(btn, { key: 'ArrowDown' });
      expect(liveEvents.length).toBe(1);
      expect(liveEvents[0].height).toBe(52);

      // ArrowUp (-2px)
      fireEvent.keyDown(btn, { key: 'ArrowUp' });
      expect(liveEvents.length).toBe(2);
      expect(liveEvents[1].height).toBe(50);

      window.removeEventListener('cv-spacer-live-resize', handler);
    });
  });

  describe('3. Dynamic Fold Detection and Atomic Break Propagation', () => {
    it('pushes straddling elements and propagates cleanly to snapshot and clean print HTML', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume resume__single-column';
      areaCv.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 800,
        height: 1800,
        right: 800,
        bottom: 1800,
      }));
      container.appendChild(areaCv);

      const section = document.createElement('section');
      section.className = 'section cv-section';
      section.setAttribute('data-section-id', 'experience');

      const title = document.createElement('h2');
      title.className = 'section-title';
      title.setAttribute('data-section-title', 'experience');
      title.setAttribute('data-editor-break-forced', 'true');
      title.setAttribute('data-editor-break-fold', '1');
      title.style.marginTop = '45px';
      section.appendChild(title);

      areaCv.appendChild(section);

      // Capture snapshot
      const snapshot = captureEditorSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot.brokenElements).toHaveLength(1);
      expect(snapshot.brokenElements[0].sectionId).toBe('experience');
      expect(snapshot.brokenElements[0].isTitle).toBe(true);

      // Clean print HTML must generate matching page break CSS
      const printHtml = generateCleanPrintHTML(defaultSchema, 'es', snapshot);
      expect(printHtml).toContain('[data-section-title="experience"]');
      expect(printHtml).toContain('break-before: page !important');
    });

    it('correctly handles non-title section containers marked as broken without itemId', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume resume__single-column';
      areaCv.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 800,
        height: 1800,
        right: 800,
        bottom: 1800,
      }));
      container.appendChild(areaCv);

      const section = document.createElement('section');
      section.className = 'home section cv-section';
      section.setAttribute('data-section-id', 'profile_header');
      section.setAttribute('data-editor-break-forced', 'true');
      section.setAttribute('data-editor-break-fold', '1');
      areaCv.appendChild(section);

      const snapshot = captureEditorSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot.brokenElements).toHaveLength(1);
      expect(snapshot.brokenElements[0].sectionId).toBe('profile_header');
      expect(snapshot.brokenElements[0].isTitle).toBe(false);

      const printHtml = generateCleanPrintHTML(defaultSchema, 'es', snapshot);
      expect(printHtml).toContain('[data-section-id="profile_header"]');
      expect(printHtml).toContain('break-before: page !important');
      expect(printHtml).toContain('page-break-before: always !important');
    });

    it('guarantees global page margin preset across all spawned pages (Page 1, Page 2, etc.)', () => {
      const { result } = renderHook(() => useCV(), {
        wrapper: ({ children }) => <CVProvider>{children}</CVProvider>,
      });

      const { getPageBounds, pageHeightPx, pageGapPx } = result.current;
      const p1 = getPageBounds(1);
      const p2 = getPageBounds(2);

      // Page 1: starts at pagePadding (24px), ends at foldTop - pagePadding
      expect(p1.contentTop).toBe(24);
      expect(p1.contentBottom).toBe(pageHeightPx - 24);

      // Page 2: starts at foldBottom + pagePadding, ends at foldTop(2) - pagePadding
      expect(p2.contentTop).toBe((pageHeightPx + pageGapPx) + 24);
      expect(p2.contentBottom).toBe((2 * pageHeightPx + pageGapPx) - 24);

      // Distance from fold line to content on Page 2 is exactly pagePadding
      expect(p2.contentTop - p1.foldBottom).toBe(24);
    });

    it('extracts totalPages from #area-cv data-total-pages in captureEditorSnapshot', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';
      areaCv.setAttribute('data-total-pages', '2');
      areaCv.getBoundingClientRect = vi.fn(() => ({
        top: 0,
        left: 0,
        width: 794,
        height: 2246,
        right: 794,
        bottom: 2246,
      }));
      container.appendChild(areaCv);

      const snapshot = captureEditorSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot.totalPages).toBe(2);
    });

    it('ensures executeCleanPrint respects snapshot.totalPages and prevents 3-page inflation', async () => {
      let createdIframe = null;
      let targetHeightApplied = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);

      const customSnapshot = {
        width: 794,
        height: 2246,
        pageHeightPx: 1123,
        totalPages: 2,
        brokenElements: [
          { sectionId: 'experience', itemId: 'exp-1', isTitle: false, fold: '1' }
        ]
      };

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          createdIframe = child;
          const mockAreaCv = document.createElement('div');
          mockAreaCv.id = 'area-cv';

          const brokenItem = document.createElement('div');
          brokenItem.setAttribute('data-item-id', 'exp-1');
          mockAreaCv.appendChild(brokenItem);

          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: {
                open: vi.fn(),
                write: vi.fn(),
                close: vi.fn(),
                readyState: 'complete',
                fonts: { ready: Promise.resolve() },
                getElementById: (id) => id === 'area-cv' ? mockAreaCv : null,
                querySelector: (sel) => mockAreaCv.querySelector(sel),
                body: {
                  scrollHeight: 2280, // slightly over 2246 due to unfragmented iframe rendering
                  style: { zoom: 1.0 },
                  querySelector: () => mockAreaCv
                }
              },
              focus: vi.fn(),
              print: vi.fn(),
              close: vi.fn()
            }
          });
        }
        return originalAppendChild(child);
      });

      await executeCleanPrint(defaultSchema, 'es', customSnapshot);

      expect(createdIframe).not.toBeNull();
      // Should strictly be 2 * 1123 = 2246px, NOT inflated to 3 pages
      expect(createdIframe.style.height).toBe('2246px');
    });

    it('guarantees break-inside: avoid !important on .experience__bullets in print CSS', () => {
      const html = generateCleanPrintHTML(defaultSchema);
      expect(html).toContain('.experience__bullets,');
      expect(html).toContain('break-inside: avoid !important');
    });
  });
});
