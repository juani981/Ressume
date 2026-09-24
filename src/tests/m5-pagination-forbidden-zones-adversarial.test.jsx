import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import App from '../App';
import { CVProvider } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import {
  generateCleanPrintHTML,
  executeCleanPrint,
  captureEditorSnapshot,
} from '../utils/staticHtmlPdfEngine';
import {
  A4_PAGE_HEIGHT_PX,
  A4_WIDTH_PX,
  A4_GAP_PX,
  DEFAULT_PAGE_PADDING,
  getRulerHeightPx,
  getRelativeBounds,
  getForbiddenZone,
  isInForbiddenBoundaryZone,
} from '../utils/pageGeometry';
import {
  BREAKABLE_SELECTOR,
  getBreakableComponents,
  resetForcedPageBreaks,
  auditForbiddenBoundaryZones,
  executePaginationAlgorithm,
  calculatePageBreaks,
} from '../utils/paginationEngine';
import printStyles from '../styles/print.css?raw';

describe('Milestone M5: Empirical Adversarial Stress Verification of Pagination, Forbidden Boundary Zones, and 1:1 Parity', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
  });

  // =========================================================================
  // STRESS 1: Boundary Oracle Precision & Edge Incursions
  // =========================================================================
  describe('STRESS 1: Mathematical Boundary Oracle Precision (isInForbiddenBoundaryZone & getForbiddenZone)', () => {
    it('M5-ORACLE-1.1: Exact sub-pixel boundary tests across multi-page folds (Pages 1 to 5)', () => {
      const pageHeight = 1123;
      const pagePadding = 24;
      const gapPx = 20;

      for (let page = 1; page <= 5; page++) {
        const zone = getForbiddenZone(page, pageHeight, pagePadding, gapPx);
        const expectedFoldTop = page * pageHeight + (page - 1) * gapPx;
        const expectedFoldBottom = expectedFoldTop + gapPx;
        const expectedStart = expectedFoldTop - pagePadding;
        const expectedEnd = expectedFoldBottom + pagePadding;

        expect(zone.foldTop).toBe(expectedFoldTop);
        expect(zone.foldBottom).toBe(expectedFoldBottom);
        expect(zone.forbiddenStart).toBe(expectedStart);
        expect(zone.forbiddenEnd).toBe(expectedEnd);

        // Case A: Touching forbiddenStart exactly from the outside -> MUST NOT be in forbidden zone
        expect(isInForbiddenBoundaryZone(expectedStart - 100, expectedStart, pageHeight, pagePadding, gapPx, 6)).toBe(false);

        // Case B: Incursion by 0.01px into forbiddenStart -> MUST be in forbidden zone
        expect(isInForbiddenBoundaryZone(expectedStart - 10, expectedStart + 0.01, pageHeight, pagePadding, gapPx, 6)).toBe(true);

        // Case C: Touching forbiddenEnd exactly from the outside -> MUST NOT be in forbidden zone
        expect(isInForbiddenBoundaryZone(expectedEnd, expectedEnd + 50, pageHeight, pagePadding, gapPx, 6)).toBe(false);

        // Case D: Incursion by 0.01px before forbiddenEnd -> MUST be in forbidden zone
        expect(isInForbiddenBoundaryZone(expectedEnd - 0.01, expectedEnd + 50, pageHeight, pagePadding, gapPx, 6)).toBe(true);

        // Case E: Fully enclosed inside forbidden zone
        expect(isInForbiddenBoundaryZone(expectedStart + 2, expectedEnd - 2, pageHeight, pagePadding, gapPx, 6)).toBe(true);

        // Case F: Huge element spanning entirely through forbidden zone
        expect(isInForbiddenBoundaryZone(expectedStart - 200, expectedEnd + 200, pageHeight, pagePadding, gapPx, 6)).toBe(true);
      }
    });

    it('M5-ORACLE-1.2: Degenerate, zero-height, and inverted geometry bounds handling', () => {
      const pageHeight = 1123;
      const pagePadding = 24;

      // Zero height element at fold boundary
      expect(isInForbiddenBoundaryZone(1100, 1100, pageHeight, pagePadding)).toBe(false);
      // Inverted coordinates (bottom < top)
      expect(isInForbiddenBoundaryZone(1150, 1100, pageHeight, pagePadding)).toBe(false);
      // Negative coordinates
      expect(isInForbiddenBoundaryZone(-50, -10, pageHeight, pagePadding)).toBe(false);
    });

    it('M5-ORACLE-1.3: Varied pagePadding extremes (0px, 12px, 24px, 48px, 64px)', () => {
      const pageHeight = 1123;
      const gapPx = 20;
      const paddings = [0, 12, 24, 48, 64];

      paddings.forEach((pad) => {
        const zone = getForbiddenZone(1, pageHeight, pad, gapPx);
        expect(zone.forbiddenStart).toBe(1123 - pad);
        expect(zone.forbiddenEnd).toBe(1143 + pad);

        // Safe area end
        expect(isInForbiddenBoundaryZone(100, 1123 - pad, pageHeight, pad, gapPx)).toBe(false);
        // 1px breach
        expect(isInForbiddenBoundaryZone(1123 - pad, 1123 - pad + 1, pageHeight, pad, gapPx)).toBe(true);
        // Next safe area start
        expect(isInForbiddenBoundaryZone(1143 + pad, 1200, pageHeight, pad, gapPx)).toBe(false);
      });
    });
  });

  // =========================================================================
  // STRESS 2: auditForbiddenBoundaryZones Reliability
  // =========================================================================
  describe('STRESS 2: Invariant Auditor Strictness (auditForbiddenBoundaryZones)', () => {
    it('M5-AUDIT-2.1: Correctly catches incursions at deep page folds (Page 3 of 4)', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';

      // Page 3 fold: foldTop = 3 * 1123 + 2 * 20 = 3369 + 40 = 3409.
      // forbiddenStart = 3409 - 24 = 3385, forbiddenEnd = 3429 + 24 = 3453.
      const deepRogue = document.createElement('div');
      deepRogue.className = 'cv-block';
      deepRogue.id = 'deep-rogue-item';
      deepRogue.getBoundingClientRect = () => ({ top: 3390, bottom: 3430, height: 40 });

      areaCv.appendChild(deepRogue);
      document.body.appendChild(areaCv);

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 4500, height: 4500 });

      expect(() => {
        auditForbiddenBoundaryZones(areaCv, 4, 1123, 24, 20);
      }).toThrowError(/FATAL_FORBIDDEN_ZONE_INCURSION.*deep-rogue-item.*Page 3/);

      areaCv.remove();
    });

    it('M5-AUDIT-2.2: Passes cleanly when elements are positioned safely across 5 simulated pages', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';

      // Create 5 safe blocks, one on each page safe zone
      for (let p = 1; p <= 5; p++) {
        const item = document.createElement('div');
        item.className = 'cv-block';
        item.id = `safe-item-page-${p}`;

        // Safe area on page p:
        const top = (p - 1) * 1143 + 80;
        const bottom = top + 300;
        item.getBoundingClientRect = () => ({ top, bottom, height: 300 });
        areaCv.appendChild(item);
      }

      document.body.appendChild(areaCv);
      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 6000, height: 6000 });

      expect(() => {
        auditForbiddenBoundaryZones(areaCv, 5, 1123, 24, 20);
      }).not.toThrow();

      areaCv.remove();
    });
  });

  // =========================================================================
  // STRESS 3: Multi-Page 1-Column ATS Layout Adversarial Pagination
  // =========================================================================
  describe('STRESS 3: Multi-Page 1-Column ATS Mode Stress', () => {
    it('M5-ATS-3.1: Complex 4-page ATS document with multiple boundary straddles resolves with zero zone incursions', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume resume__single-column resume--ats-mode';

      const singleCol = document.createElement('div');
      singleCol.className = 'resume__single-column';

      const items = [];
      for (let i = 0; i < 12; i++) {
        const sec = document.createElement('section');
        sec.className = 'cv-section';
        const item = document.createElement('div');
        item.className = 'cv-block experience__content';
        item.id = `ats-item-${i}`;
        item.setAttribute('data-item-id', `ats-item-${i}`);

        sec.appendChild(item);
        singleCol.appendChild(sec);
        items.push(item);
      }
      areaCv.appendChild(singleCol);
      document.body.appendChild(areaCv);

      const baseBounds = [
        { top: 50, height: 250 },
        { top: 350, height: 300 },
        { top: 700, height: 300 },
        { top: 1050, height: 100 }, // Straddler 1
        { top: 1200, height: 300 },
        { top: 1550, height: 300 },
        { top: 1900, height: 300 },
        { top: 2220, height: 100 }, // Straddler 2
        { top: 2400, height: 300 },
        { top: 2750, height: 300 },
        { top: 3100, height: 300 }, // Straddler 3
        { top: 3500, height: 300 },
      ];

      items.forEach((item, idx) => {
        item.getBoundingClientRect = () => {
          let cumulativeMargin = 0;
          for (let k = 0; k <= idx; k++) {
            cumulativeMargin += parseFloat(items[k].style.marginTop) || 0;
          }
          const top = baseBounds[idx].top + cumulativeMargin;
          return {
            top,
            bottom: top + baseBounds[idx].height,
            height: baseBounds[idx].height,
          };
        };
      });

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 5000, height: 5000 });
      Object.defineProperty(areaCv, 'scrollHeight', {
        get: () => 5000,
        configurable: true,
      });
      Object.defineProperty(singleCol, 'scrollHeight', {
        get: () => 5000,
        configurable: true,
      });

      const cvData = {
        layout: { type: '1-column', isAtsMode: true, pagePadding: 24 },
        sections: [],
      };

      const result = executePaginationAlgorithm({
        areaCv,
        cvData,
        pageHeightPx: 1123,
        gapPx: 20,
      });

      expect(result.totalPages).toBeGreaterThanOrEqual(4);
      expect(items[3].getAttribute('data-editor-break-forced')).toBe('true');
      expect(items[3].style.marginTop).not.toBe('');

      items.forEach((item, idx) => {
        const b = getRelativeBounds(item, areaCv);
        const inForbidden = isInForbiddenBoundaryZone(b.top, b.bottom, 1123, 24, 20, result.totalPages);
        expect(inForbidden, `ATS item ${idx} at [${b.top}, ${b.bottom}] must not be in forbidden zone`).toBe(false);
      });

      expect(() => {
        auditForbiddenBoundaryZones(areaCv, result.totalPages, 1123, 24, 20);
      }).not.toThrow();

      areaCv.remove();
    });
  });

  // =========================================================================
  // STRESS 4: Multi-Page 2-Column Asymmetric & Cross-Column Straddles
  // =========================================================================
  describe('STRESS 4: 2-Column Asymmetric & Simultaneous Cross-Column Straddles', () => {
    it('M5-2COL-4.1: Asymmetric columns (Left 1-page, Right 3-pages) resolves right column breaks cleanly', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';

      const leftCol = document.createElement('div');
      leftCol.className = 'resume__left';
      const rightCol = document.createElement('div');
      rightCol.className = 'resume__right';

      const leftSec = document.createElement('section');
      leftSec.className = 'cv-section';
      const leftItem = document.createElement('div');
      leftItem.className = 'cv-block';
      leftItem.id = 'left-only-item';
      leftItem.getBoundingClientRect = () => ({ top: 40, bottom: 340, height: 300 });
      leftSec.appendChild(leftItem);
      leftCol.appendChild(leftSec);

      const rightSec = document.createElement('section');
      rightSec.className = 'cv-section';

      const rightItem1 = document.createElement('div');
      rightItem1.className = 'cv-block';
      rightItem1.id = 'right-item-1';
      rightItem1.getBoundingClientRect = () => ({ top: 40, bottom: 950, height: 910 });

      const rightStraddler = document.createElement('div');
      rightStraddler.className = 'cv-block experience__content';
      rightStraddler.id = 'right-straddler';
      rightStraddler.getBoundingClientRect = () => {
        const mt = parseFloat(rightStraddler.style.marginTop) || 0;
        return { top: 1080 + mt, bottom: 1150 + mt, height: 70 };
      };

      const rightItem3 = document.createElement('div');
      rightItem3.className = 'cv-block';
      rightItem3.id = 'right-item-3';
      rightItem3.getBoundingClientRect = () => {
        const mt = parseFloat(rightStraddler.style.marginTop) || 0;
        return { top: 1170 + mt, bottom: 2000 + mt, height: 830 };
      };

      rightSec.appendChild(rightItem1);
      rightSec.appendChild(rightStraddler);
      rightSec.appendChild(rightItem3);
      rightCol.appendChild(rightSec);

      areaCv.appendChild(leftCol);
      areaCv.appendChild(rightCol);
      document.body.appendChild(areaCv);

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 3000, height: 3000 });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 3000, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 3000, configurable: true });

      const cvData = {
        layout: { type: '2-column', pagePadding: 24 },
        sections: [],
      };

      const result = executePaginationAlgorithm({
        areaCv,
        cvData,
        pageHeightPx: 1123,
        gapPx: 20,
      });

      expect(rightStraddler.getAttribute('data-editor-break-forced')).toBe('true');
      expect(rightStraddler.getAttribute('data-editor-break-fold')).toBe('1');

      const b = getRelativeBounds(rightStraddler, areaCv);
      expect(b.top).toBeGreaterThanOrEqual(1167);

      expect(() => {
        auditForbiddenBoundaryZones(areaCv, result.totalPages, 1123, 24, 20);
      }).not.toThrow();

      areaCv.remove();
    });

    it('M5-2COL-4.2: Simultaneous straddles in both Left and Right columns at Fold 1', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';

      const leftCol = document.createElement('div');
      leftCol.className = 'resume__left';
      const rightCol = document.createElement('div');
      rightCol.className = 'resume__right';

      const leftSec = document.createElement('section');
      leftSec.className = 'cv-section';
      const leftPre = document.createElement('div');
      leftPre.className = 'cv-block';
      leftPre.getBoundingClientRect = () => ({ top: 20, bottom: 1000, height: 980 });
      const leftStraddler = document.createElement('div');
      leftStraddler.className = 'cv-block';
      leftStraddler.id = 'left-dual-straddler';
      leftStraddler.getBoundingClientRect = () => {
        const mt = parseFloat(leftStraddler.style.marginTop) || 0;
        return { top: 1070 + mt, bottom: 1140 + mt, height: 70 };
      };
      leftSec.appendChild(leftPre);
      leftSec.appendChild(leftStraddler);
      leftCol.appendChild(leftSec);

      const rightSec = document.createElement('section');
      rightSec.className = 'cv-section';
      const rightPre = document.createElement('div');
      rightPre.className = 'cv-block';
      rightPre.getBoundingClientRect = () => ({ top: 20, bottom: 1050, height: 1030 });
      const rightStraddler = document.createElement('div');
      rightStraddler.className = 'cv-block';
      rightStraddler.id = 'right-dual-straddler';
      rightStraddler.getBoundingClientRect = () => {
        const mt = parseFloat(rightStraddler.style.marginTop) || 0;
        return { top: 1090 + mt, bottom: 1160 + mt, height: 70 };
      };
      rightSec.appendChild(rightPre);
      rightSec.appendChild(rightStraddler);
      rightCol.appendChild(rightSec);

      areaCv.appendChild(leftCol);
      areaCv.appendChild(rightCol);
      document.body.appendChild(areaCv);

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2500, height: 2500 });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 2500, configurable: true });
      Object.defineProperty(leftCol, 'scrollHeight', { value: 2500, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 2500, configurable: true });

      const cvData = {
        layout: { type: '2-column', pagePadding: 24 },
        sections: [],
      };

      const result = executePaginationAlgorithm({
        areaCv,
        cvData,
        pageHeightPx: 1123,
        gapPx: 20,
      });

      expect(leftStraddler.getAttribute('data-editor-break-forced')).toBe('true');
      expect(rightStraddler.getAttribute('data-editor-break-forced')).toBe('true');

      const leftB = getRelativeBounds(leftStraddler, areaCv);
      const rightB = getRelativeBounds(rightStraddler, areaCv);

      expect(leftB.top).toBeGreaterThanOrEqual(1167);
      expect(rightB.top).toBeGreaterThanOrEqual(1167);

      expect(() => {
        auditForbiddenBoundaryZones(areaCv, result.totalPages, 1123, 24, 20);
      }).not.toThrow();

      areaCv.remove();
    });
  });

  // =========================================================================
  // STRESS 5: Orphan Title Protection & Action Button Alignment
  // =========================================================================
  describe('STRESS 5: Section Title Orphan Avoidance & Action Button Alignment', () => {
    it('M5-ORPHAN-5.1: Section title sitting before fold 1 pushed to Page 2 when its child straddles fold 1', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';

      const singleCol = document.createElement('div');
      singleCol.className = 'resume__single-column';

      const sec = document.createElement('section');
      sec.className = 'cv-section';
      sec.setAttribute('data-section-id', 'experience');

      const actionBtns = document.createElement('div');
      actionBtns.className = 'section-action-buttons';
      const dragHandle = document.createElement('div');
      dragHandle.className = 'drag-handle';

      const title = document.createElement('h2');
      title.className = 'section-title';
      title.id = 'exp-title';
      title.setAttribute('data-section-title', 'experience');

      const child = document.createElement('div');
      child.className = 'cv-block experience__content';
      child.id = 'exp-child-1';

      sec.appendChild(actionBtns);
      sec.appendChild(dragHandle);
      sec.appendChild(title);
      sec.appendChild(child);
      singleCol.appendChild(sec);
      areaCv.appendChild(singleCol);
      document.body.appendChild(areaCv);

      title.getBoundingClientRect = () => {
        const mt = parseFloat(title.style.marginTop) || 0;
        return { top: 1060 + mt, bottom: 1090 + mt, height: 30 };
      };
      child.getBoundingClientRect = () => {
        const mt = parseFloat(title.style.marginTop) || parseFloat(child.style.marginTop) || 0;
        return { top: 1095 + mt, bottom: 1200 + mt, height: 105 };
      };

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2500, height: 2500 });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 2500, configurable: true });
      Object.defineProperty(singleCol, 'scrollHeight', { value: 2500, configurable: true });

      const cvData = {
        layout: { type: '1-column', pagePadding: 24 },
        sections: [{ id: 'experience', type: 'experience' }],
      };

      const result = executePaginationAlgorithm({
        areaCv,
        cvData,
        pageHeightPx: 1123,
        gapPx: 20,
      });

      expect(title.getAttribute('data-editor-break-forced')).toBe('true');
      const titleBounds = getRelativeBounds(title, areaCv);
      expect(titleBounds.top).toBeGreaterThanOrEqual(1167);

      // Verify action buttons top has been offset to match margin push
      expect(actionBtns.style.top).toMatch(/calc\(.*(0\.35rem.*107px|107px.*0\.35rem).*\)/);
      expect(dragHandle.style.top).toBe('107px');

      expect(() => {
        auditForbiddenBoundaryZones(areaCv, result.totalPages, 1123, 24, 20);
      }).not.toThrow();

      areaCv.remove();
    });
  });

  // =========================================================================
  // STRESS 6: box-decoration-break: clone Architecture & Multi-Page Margins
  // =========================================================================
  describe('STRESS 6: box-decoration-break: clone Architecture in print.css', () => {
    it('M5-BOX-6.1: print.css strictly enforces box-decoration-break: clone on column containers and slice on area-cv', () => {
      expect(printStyles).toMatch(/-webkit-box-decoration-break:\s*slice\s*!important/);
      expect(printStyles).toMatch(/box-decoration-break:\s*slice\s*!important/);

      expect(printStyles).toMatch(/-webkit-box-decoration-break:\s*clone\s*!important/);
      expect(printStyles).toMatch(/box-decoration-break:\s*clone\s*!important/);
    });
  });

  // =========================================================================
  // STRESS 7: 0px Drift Parity (Editor vs Print Snapshot)
  // =========================================================================
  describe('STRESS 7: 0px Drift Parity Between Editor #area-cv and Print Snapshot', () => {
    it('M5-PARITY-7.1: Zero width discrepancy (0px delta) between editor #area-cv and print snapshot across 10 dynamic states', () => {
      const paddingOptions = [16, 20, 24, 28, 32];
      const layoutOptions = ['2-column', '1-column'];

      paddingOptions.forEach((pad) => {
        layoutOptions.forEach((layoutType) => {
          const testSchema = {
            ...defaultSchema,
            layout: {
              ...defaultSchema.layout,
              type: layoutType,
              isAtsMode: layoutType === '1-column',
              pagePadding: pad,
            },
          };

          const printHTML = generateCleanPrintHTML(testSchema, 'es');
          const parser = new DOMParser();
          const doc = parser.parseFromString(printHTML, 'text/html');
          const areaCv = doc.querySelector('#area-cv');

          expect(areaCv).not.toBeNull();
          const style = areaCv.getAttribute('style') || '';
          expect(style).toContain('width: 794px');
          expect(style).toContain('max-width: 794px');

          const parsedWidth = parseInt(areaCv.style.width || '794px', 10);
          expect(parsedWidth).toBe(794);
        });
      });
    });

    it('M5-PARITY-7.2: 1:1 CSS variable transfer loop handles 10 diverse custom properties without drift or loss', async () => {
      const testVars = {
        '--page-padding': '30px',
        '--section-gap': '25px',
        '--item-gap': '14px',
        '--font-scale': '1.2',
        '--line-height': '1.7',
        '--title-color': '#0f172a',
        '--text-color': '#334155',
        '--accent-color-1': '#6366f1',
        '--accent-color-2': '#ec4899',
        '--border-radius': '6px',
      };

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      Object.entries(testVars).forEach(([k, v]) => {
        editorAreaCv.style.setProperty(k, v);
      });
      editorAreaCv.style.setProperty('font-size', '16px');
      document.body.appendChild(editorAreaCv);

      let targetDoc = null;
      const originalAppend = document.body.appendChild.bind(document.body);
      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          const doc = document.implementation.createHTMLDocument('Print Snapshot');
          Object.defineProperty(doc, 'readyState', { get: () => 'complete', configurable: true });
          doc.fonts = { ready: Promise.resolve() };
          targetDoc = doc;
          Object.defineProperty(child, 'contentDocument', { configurable: true, get: () => doc });
          Object.defineProperty(child, 'contentWindow', {
            configurable: true,
            value: {
              document: doc,
              focus: vi.fn(),
              print: vi.fn(),
              addEventListener: vi.fn(),
            },
          });
        }
        return originalAppend(child);
      });

      await executeCleanPrint(defaultSchema, 'es');

      expect(targetDoc).not.toBeNull();
      const transferredStyles = targetDoc.documentElement.style;

      Object.entries(testVars).forEach(([k, v]) => {
        expect(transferredStyles.getPropertyValue(k)).toBe(v);
      });

      expect(transferredStyles.getPropertyValue('font-size')).not.toBe('16px');

      editorAreaCv.remove();
    });
  });
});
