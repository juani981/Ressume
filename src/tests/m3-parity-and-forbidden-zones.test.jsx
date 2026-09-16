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

describe('Milestone M3: Paridad Visual 1:1, Paginación y Zonas Prohibidas (R4)', () => {
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
  // PILLAR 1: Strict 794px Canvas & 1:1 Visual Parity (Editor vs Print)
  // =========================================================================
  describe('Pillar 1: 1:1 Visual Parity & 794px Canvas Strictness', () => {
    it('PARITY-1.1: #area-cv maintains strict 794px width in 2-column mode (0px delta between editor and print snapshot)', () => {
      const { container, unmount } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const editorAreaCv = container.querySelector('#area-cv');
      expect(editorAreaCv).not.toBeNull();
      expect(editorAreaCv.style.maxWidth).toBe('794px');
      expect(editorAreaCv.style.minWidth).toBe('794px');

      const printHTML = generateCleanPrintHTML(defaultSchema, 'es');
      const parser = new DOMParser();
      const printDoc = parser.parseFromString(printHTML, 'text/html');
      const printAreaCv = printDoc.querySelector('#area-cv');

      expect(printAreaCv).not.toBeNull();
      const printStyle = printAreaCv.getAttribute('style') || '';
      expect(printStyle).toContain('width: 794px');
      expect(printStyle).toContain('max-width: 794px');

      const editorWidth = parseInt(editorAreaCv.style.maxWidth, 10);
      const printWidth = parseInt(printAreaCv.style.maxWidth || '794px', 10);
      expect(Math.abs(editorWidth - printWidth)).toBe(0);

      unmount();
    });

    it('PARITY-1.2: #area-cv maintains strict 794px width in 1-column ATS mode (0px delta between editor and print snapshot)', () => {
      const atsSchema = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '1-column',
          isAtsMode: true,
        },
      };

      localStorage.setItem('cvData', JSON.stringify(atsSchema));

      const { container, unmount } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const editorAreaCv = container.querySelector('#area-cv');
      expect(editorAreaCv).not.toBeNull();
      expect(editorAreaCv.style.maxWidth).toBe('794px');
      expect(editorAreaCv.style.minWidth).toBe('794px');

      const printHTML = generateCleanPrintHTML(atsSchema, 'es');
      const parser = new DOMParser();
      const printDoc = parser.parseFromString(printHTML, 'text/html');
      const printAreaCv = printDoc.querySelector('#area-cv');

      expect(printAreaCv).not.toBeNull();
      const printStyle = printAreaCv.getAttribute('style') || '';
      expect(printStyle).toContain('width: 794px');
      expect(printStyle).toContain('max-width: 794px');

      const editorWidth = parseInt(editorAreaCv.style.maxWidth, 10);
      const printWidth = parseInt(printAreaCv.style.maxWidth || '794px', 10);
      expect(Math.abs(editorWidth - printWidth)).toBe(0);

      unmount();
    });

    it('PARITY-1.3: Clean print iframe enforces strict 794px width and min-width upon execution', async () => {
      let createdIframe = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          createdIframe = child;
          const doc = document.implementation.createHTMLDocument('Print');
          Object.defineProperty(doc, 'readyState', {
            get: () => 'complete',
            configurable: true,
          });
          doc.fonts = { ready: Promise.resolve() };
          Object.defineProperty(child, 'contentDocument', {
            configurable: true,
            get: () => doc,
          });
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
        return originalAppendChild(child);
      });

      await executeCleanPrint(defaultSchema, 'es');

      expect(createdIframe).not.toBeNull();
      expect(createdIframe.style.width).toBe('794px');
      expect(createdIframe.style.minWidth).toBe('794px');
    });

    it('PARITY-1.4: Dynamic CSS custom property transfer loop in staticHtmlPdfEngine.js transmits all custom properties to doc.documentElement.style', async () => {
      // 1. Create a simulated live editor #area-cv with active custom properties
      const editorDiv = document.createElement('div');
      editorDiv.id = 'area-cv';
      editorDiv.style.setProperty('--page-padding', '32px');
      editorDiv.style.setProperty('--section-gap', '22px');
      editorDiv.style.setProperty('--item-gap', '12px');
      editorDiv.style.setProperty('--title-color', '#1e293b');
      editorDiv.style.setProperty('--font-scale', '1.15');
      editorDiv.style.setProperty('--line-height', '1.6');
      editorDiv.style.setProperty('--custom-brand-color', '#3b82f6', 'important');
      editorDiv.style.setProperty('color', '#000000'); // Standard property, should not leak as custom property
      document.body.appendChild(editorDiv);

      let capturedDoc = null;
      const originalAppendChild = document.body.appendChild.bind(document.body);

      vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
        if (child.tagName === 'IFRAME') {
          const doc = document.implementation.createHTMLDocument('Print Target');
          Object.defineProperty(doc, 'readyState', {
            get: () => 'complete',
            configurable: true,
          });
          doc.fonts = { ready: Promise.resolve() };
          capturedDoc = doc;
          Object.defineProperty(child, 'contentDocument', {
            configurable: true,
            get: () => doc,
          });
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
        return originalAppendChild(child);
      });

      await executeCleanPrint(defaultSchema, 'es');

      expect(capturedDoc).not.toBeNull();
      const rootStyle = capturedDoc.documentElement.style;

      // Assert all custom properties transferred 1:1
      expect(rootStyle.getPropertyValue('--page-padding')).toBe('32px');
      expect(rootStyle.getPropertyValue('--section-gap')).toBe('22px');
      expect(rootStyle.getPropertyValue('--item-gap')).toBe('12px');
      expect(rootStyle.getPropertyValue('--title-color')).toBe('#1e293b');
      expect(rootStyle.getPropertyValue('--font-scale')).toBe('1.15');
      expect(rootStyle.getPropertyValue('--line-height')).toBe('1.6');
      expect(rootStyle.getPropertyValue('--custom-brand-color')).toBe('#3b82f6');

      // Standard CSS property should not be transferred to doc.documentElement.style
      expect(rootStyle.getPropertyValue('color')).not.toBe('#000000');

      if (editorDiv.parentNode) {
        editorDiv.parentNode.removeChild(editorDiv);
      }
    });

    it('PARITY-1.5: Editor-only gapPx = 20 fold gap is strictly confined to editor A4 guides and 0px in print', () => {
      // 1. In editor: multi-page container minHeight accounts for (totalPages - 1) * 20px
      const { container, unmount } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const editorAreaCv = container.querySelector('#area-cv');
      expect(editorAreaCv).not.toBeNull();

      // 2. In clean print HTML: DOM contains zero editor fold guides or insets
      const printHTML = generateCleanPrintHTML(defaultSchema, 'es');
      const parser = new DOMParser();
      const printDoc = parser.parseFromString(printHTML, 'text/html');

      expect(printDoc.querySelector('.a4-page-fold-guide')).toBeNull();
      expect(printDoc.querySelector('.a4-page-inset')).toBeNull();
      expect(printDoc.querySelector('.a4-page-fold-line')).toBeNull();
      expect(printDoc.querySelector('.a4-page-fold-badge')).toBeNull();

      // 3. In print.css: strictly 0px fold gap
      expect(printStyles).toContain('min-height: var(--print-target-height-mm, 297mm) !important;');
      expect(printStyles).not.toContain('margin-bottom: 20px');
      expect(printStyles).not.toContain('gap: 20px');

      unmount();
    });
  });

  // =========================================================================
  // PILLAR 2: Forbidden Boundary Zone Enforcement (1-col ATS & 2-col traditional)
  // =========================================================================
  describe('Pillar 2: Forbidden Boundary Zone Enforcement', () => {
    it('ZONE-2.1: Mathematical precision of getForbiddenZone and isInForbiddenBoundaryZone', () => {
      const pageHeight = 1123;
      const pagePadding = 24;
      const gapPx = 20;

      const zone1 = getForbiddenZone(1, pageHeight, pagePadding, gapPx);
      expect(zone1.foldTop).toBe(1123);
      expect(zone1.foldBottom).toBe(1143);
      expect(zone1.forbiddenStart).toBe(1099); // 1123 - 24
      expect(zone1.forbiddenEnd).toBe(1167);   // 1143 + 24
      expect(zone1.contentAreaBottom).toBe(1099);
      expect(zone1.nextContentAreaTop).toBe(1167);

      // Element straddling forbiddenStart: [1080 .. 1120] -> intersects [1099 .. 1167]
      expect(isInForbiddenBoundaryZone(1080, 1120, pageHeight, pagePadding, gapPx)).toBe(true);
      // Element entirely inside forbidden zone: [1110 .. 1150]
      expect(isInForbiddenBoundaryZone(1110, 1150, pageHeight, pagePadding, gapPx)).toBe(true);
      // Element straddling forbiddenEnd: [1150 .. 1200]
      expect(isInForbiddenBoundaryZone(1150, 1200, pageHeight, pagePadding, gapPx)).toBe(true);
      // Element completely spanning forbidden zone: [1050 .. 1200]
      expect(isInForbiddenBoundaryZone(1050, 1200, pageHeight, pagePadding, gapPx)).toBe(true);

      // Element safely on Page 1: [50 .. 1099]
      expect(isInForbiddenBoundaryZone(50, 1099, pageHeight, pagePadding, gapPx)).toBe(false);
      // Element safely on Page 2: [1167 .. 2000]
      expect(isInForbiddenBoundaryZone(1167, 2000, pageHeight, pagePadding, gapPx)).toBe(false);
    });

    it('ZONE-2.2: 2-column traditional mode guarantees 0 elements residing in the forbidden boundary zone', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';

      const leftCol = document.createElement('div');
      leftCol.className = 'resume__left';
      const rightCol = document.createElement('div');
      rightCol.className = 'resume__right';

      // Left Column: Item 1 safe, Item 2 straddling page 1 forbidden boundary [1080 .. 1150]
      const leftSec = document.createElement('section');
      leftSec.className = 'cv-section';
      const leftItem1 = document.createElement('div');
      leftItem1.className = 'cv-block';
      leftItem1.id = 'left-item-1';
      leftItem1.getBoundingClientRect = () => ({ top: 40, bottom: 400, height: 360 });

      const leftStraddlingItem = document.createElement('div');
      leftStraddlingItem.className = 'cv-block';
      leftStraddlingItem.id = 'left-item-straddling';
      leftStraddlingItem.getBoundingClientRect = () => {
        const mt = parseFloat(leftStraddlingItem.style.marginTop) || 0;
        return { top: 1080 + mt, bottom: 1150 + mt, height: 70 };
      };

      leftSec.appendChild(leftItem1);
      leftSec.appendChild(leftStraddlingItem);
      leftCol.appendChild(leftSec);

      // Right Column: Title and Content
      const rightSec = document.createElement('section');
      rightSec.className = 'cv-section';
      const rightTitle = document.createElement('h2');
      rightTitle.className = 'section-title';
      rightTitle.getBoundingClientRect = () => ({ top: 40, bottom: 80, height: 40 });

      const rightItem1 = document.createElement('div');
      rightItem1.className = 'cv-block';
      rightItem1.getBoundingClientRect = () => ({ top: 90, bottom: 600, height: 510 });

      rightSec.appendChild(rightTitle);
      rightSec.appendChild(rightItem1);
      rightCol.appendChild(rightSec);

      areaCv.appendChild(leftCol);
      areaCv.appendChild(rightCol);
      document.body.appendChild(areaCv);

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2200, height: 2200 });

      const cvData = {
        layout: { type: '2-column', pagePadding: 24 },
        sections: [],
      };

      // Execute pagination algorithm
      const result = executePaginationAlgorithm({
        areaCv,
        cvData,
        pageHeightPx: 1123,
        gapPx: 20,
      });

      // Assert break was applied to push the straddling item past the forbidden zone
      expect(leftStraddlingItem.getAttribute('data-editor-break-forced')).toBe('true');
      expect(leftStraddlingItem.getAttribute('data-editor-break-fold')).toBe('1');
      expect(leftStraddlingItem.style.marginTop).not.toBe('');

      // Post-condition audit: passes with 0 forbidden zone incursions
      expect(() => {
        auditForbiddenBoundaryZones(areaCv, result.totalPages, 1123, 24, 20);
      }).not.toThrow();

      if (areaCv.parentNode) areaCv.parentNode.removeChild(areaCv);
    });

    it('ZONE-2.3: 1-column ATS mode guarantees 0 elements residing in the forbidden boundary zone', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume resume__single-column resume--ats-mode';

      const singleCol = document.createElement('div');
      singleCol.className = 'resume__single-column';

      const sec1 = document.createElement('section');
      sec1.className = 'cv-section';
      const item1 = document.createElement('div');
      item1.className = 'cv-block';
      item1.getBoundingClientRect = () => ({ top: 30, bottom: 500, height: 470 });

      const item2 = document.createElement('div');
      item2.className = 'cv-block';
      item2.getBoundingClientRect = () => ({ top: 520, bottom: 1050, height: 530 });

      // Item 3 straddles fold [1070 .. 1160] intersecting forbidden zone [1099 .. 1167]
      const straddlingItem = document.createElement('div');
      straddlingItem.className = 'cv-block';
      straddlingItem.id = 'ats-straddling-item';
      straddlingItem.getBoundingClientRect = () => {
        const mt = parseFloat(straddlingItem.style.marginTop) || 0;
        return { top: 1070 + mt, bottom: 1160 + mt, height: 90 };
      };

      sec1.appendChild(item1);
      sec1.appendChild(item2);
      sec1.appendChild(straddlingItem);
      singleCol.appendChild(sec1);
      areaCv.appendChild(singleCol);
      document.body.appendChild(areaCv);

      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2200, height: 2200 });

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

      expect(straddlingItem.getAttribute('data-editor-break-forced')).toBe('true');
      expect(straddlingItem.getAttribute('data-editor-break-fold')).toBe('1');

      // Verify margin-top pushes it so relative top >= nextContentAreaTop (1167px)
      const marginTopPx = parseFloat(straddlingItem.style.marginTop);
      expect(1070 + marginTopPx).toBeGreaterThanOrEqual(1167);

      // Audit must pass with 0 forbidden zone incursions
      expect(() => {
        auditForbiddenBoundaryZones(areaCv, result.totalPages, 1123, 24, 20);
      }).not.toThrow();

      if (areaCv.parentNode) areaCv.parentNode.removeChild(areaCv);
    });

    it('ZONE-2.4: Straddling breakable components receive forced break styling pushing them to page 2 with proper margin-top', () => {
      const areaCv = document.createElement('div');
      areaCv.id = 'area-cv';

      const sec = document.createElement('section');
      sec.className = 'cv-section';
      sec.id = 'exp-sec';
      sec.setAttribute('data-section-id', 'exp-sec');

      const expItem = document.createElement('div');
      expItem.className = 'cv-block experience__content';
      expItem.setAttribute('data-item-id', 'exp-101');
      // Starts at 1080px, ends at 1150px -> inside [1099 .. 1167]
      expItem.getBoundingClientRect = () => {
        const mt = parseFloat(expItem.style.marginTop) || 0;
        return { top: 1080 + mt, bottom: 1150 + mt, height: 70 };
      };

      sec.appendChild(expItem);
      areaCv.appendChild(sec);
      document.body.appendChild(areaCv);
      areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2000, height: 2000 });

      executePaginationAlgorithm({
        areaCv,
        cvData: { layout: { type: '1-column', pagePadding: 24 } },
        pageHeightPx: 1123,
        gapPx: 20,
      });

      expect(expItem.getAttribute('data-editor-break-forced')).toBe('true');
      expect(expItem.getAttribute('data-editor-break-fold')).toBe('1');
      expect(expItem.style.marginTop).toBe('87px'); // 1167 - 1080 = 87px

      // Now capture snapshot and verify static print HTML incorporates this break with var(--page-padding, 24px)
      const snapshot = captureEditorSnapshot();
      expect(snapshot).not.toBeNull();
      expect(snapshot.brokenElements.length).toBe(1);
      expect(snapshot.brokenElements[0].itemId).toBe('exp-101');

      const printHTML = generateCleanPrintHTML(
        { layout: { type: '1-column' }, sections: [{ id: 'exp-sec', type: 'experience', items: [{ id: 'exp-101' }] }] },
        'es',
        snapshot
      );

      // Verify print snapshot styling contains page-break and margin-top: 0
      expect(printHTML).toContain('[data-item-id="exp-101"]');
      expect(printHTML).toContain('break-before: page !important;');
      expect(printHTML).toContain('margin-top: 0 !important;');

      if (areaCv.parentNode) areaCv.parentNode.removeChild(areaCv);
    });

    it('ZONE-2.5: box-decoration-break: slice is strictly enforced across column and document containers in print.css', () => {
      // 1. Column containers (.resume__left, .resume__right) must have box-decoration-break: slice
      expect(printStyles).toContain('box-decoration-break: slice !important;');
      expect(printStyles).toContain('-webkit-box-decoration-break: slice !important;');

      // 2. Prohibit box-decoration-break: clone anywhere in print.css rules (which caused the 48px double-padding bug)
      const rulesOnly = printStyles.replace(/\/\*[\s\S]*?\*\//g, '');
      const hasClone = /box-decoration-break\s*:\s*clone/i.test(rulesOnly);
      expect(hasClone, 'print.css must NOT contain box-decoration-break: clone').toBe(false);
    });
  });

  // =========================================================================
  // PILLAR 3: Margin Stability Across Page 1 and Page 2
  // =========================================================================
  describe('Pillar 3: Margin Stability Across Page 1 and Page 2', () => {
    it('MARGIN-3.1: Page 1 top margin and Page 2 broken element top margin maintain 0px delta', () => {
      const pagePadding = 28;
      const pageHeight = 1123;
      const gapPx = 20;

      const zone1 = getForbiddenZone(1, pageHeight, pagePadding, gapPx);
      // Page 1 top margin is pagePadding (28px)
      const page1TopMargin = pagePadding;

      // Page 2 top content area begins at nextContentAreaTop
      // nextContentAreaTop = foldBottom + pagePadding = (1123 + 20) + 28 = 1171px
      // Relative offset from Page 2 top fold line (foldBottom = 1143px):
      const page2ContentStartOffset = zone1.nextContentAreaTop - zone1.foldBottom;

      expect(page2ContentStartOffset).toBe(pagePadding);
      expect(Math.abs(page1TopMargin - page2ContentStartOffset)).toBe(0);
    });

    it('MARGIN-3.2: Page 1 bottom margin preservation guarantees content ends at or before contentAreaBottom', () => {
      const pagePadding = 24;
      const pageHeight = 1123;
      const gapPx = 20;

      const zone = getForbiddenZone(1, pageHeight, pagePadding, gapPx);
      // Safe content area bottom: foldTop - pagePadding = 1123 - 24 = 1099px
      expect(zone.contentAreaBottom).toBe(1099);

      // Distance between safe content area bottom and page fold:
      const page1BottomMargin = zone.foldTop - zone.contentAreaBottom;
      expect(page1BottomMargin).toBe(pagePadding);
    });

    it('MARGIN-3.3: Dynamic padding elasticity adapts forbidden zones across varied pagePadding settings (16px, 32px, 40px)', () => {
      const testPaddings = [16, 24, 32, 40];
      const pageHeight = 1123;
      const gapPx = 20;

      testPaddings.forEach((pad) => {
        const zone = getForbiddenZone(1, pageHeight, pad, gapPx);
        expect(zone.forbiddenStart).toBe(1123 - pad);
        expect(zone.forbiddenEnd).toBe(1143 + pad);
        expect(zone.contentAreaBottom).toBe(1123 - pad);
        expect(zone.nextContentAreaTop).toBe(1143 + pad);

        // Safe element on Page 1 must not trigger forbidden zone
        expect(isInForbiddenBoundaryZone(100, 1123 - pad, pageHeight, pad, gapPx)).toBe(false);
        // Element intruding into newly widened boundary must trigger forbidden zone
        expect(isInForbiddenBoundaryZone(1123 - pad + 1, 1143 + pad - 1, pageHeight, pad, gapPx)).toBe(true);
        // Safe element on Page 2 must not trigger forbidden zone
        expect(isInForbiddenBoundaryZone(1143 + pad, 2000, pageHeight, pad, gapPx)).toBe(false);
      });
    });

    it('MARGIN-3.4: Invariant auditor throws FatalForbiddenZoneIncursionError when a component breaches the boundary in test mode', () => {
      const container = document.createElement('div');
      const item = document.createElement('div');
      item.className = 'cv-block';
      item.id = 'rogue-element';

      // Mock item directly inside forbidden zone [1099 .. 1167]
      item.getBoundingClientRect = () => ({ top: 1120, bottom: 1140, height: 20 });
      container.getBoundingClientRect = () => ({ top: 0, bottom: 2000, height: 2000 });
      container.appendChild(item);

      expect(() => {
        auditForbiddenBoundaryZones(container, 2, 1123, 24, 20);
      }).toThrowError(/FATAL_FORBIDDEN_ZONE_INCURSION/);
    });
  });
});
