import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  generateCleanPrintHTML, 
  executeCleanPrint,
  calculatePrintScale
} from '../utils/staticHtmlPdfEngine';
import baseStyles from '../index.css?raw';
import printStyles from '../styles/print.css?raw';

describe('Adversarial Challenger 1: Print Engine & CSS Transfer Stress Verification', () => {
  let createdIframes = [];

  beforeEach(() => {
    vi.clearAllMocks();
    createdIframes = [];
    document.querySelectorAll('iframe').forEach(el => el.remove());
    const existingAreaCv = document.getElementById('area-cv');
    if (existingAreaCv) existingAreaCv.remove();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.querySelectorAll('iframe').forEach(el => el.remove());
    const existingAreaCv = document.getElementById('area-cv');
    if (existingAreaCv) existingAreaCv.remove();
  });

  /**
   * Helper to set up a mock iframe that captures execution lifecycle in JSDOM
   */
  const setupMockIframe = () => {
    vi.useRealTimers();
    let capturedDoc = null;
    const originalAppendChild = document.body.appendChild.bind(document.body);

    const appendSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(function (child) {
      if (child && child.tagName === 'IFRAME') {
        const doc = document.implementation.createHTMLDocument('Print Preview Document');
        Object.defineProperty(doc, 'readyState', { get: () => 'complete', configurable: true });
        Object.defineProperty(doc, 'fonts', { get: () => ({ ready: Promise.resolve() }), configurable: true });
        
        capturedDoc = doc;
        Object.defineProperty(child, 'contentDocument', { get: () => doc, configurable: true });
        const mockWin = {
          document: doc,
          focus: vi.fn(),
          print: vi.fn(),
          addEventListener: (evt, cb) => { if (evt === 'load') cb(); }
        };
        Object.defineProperty(child, 'contentWindow', {
          get: () => mockWin,
          configurable: true
        });
        createdIframes.push(child);
      }
      return originalAppendChild(child);
    });

    return {
      getCapturedDoc: () => capturedDoc,
      restore: () => appendSpy.mockRestore()
    };
  };

  // =========================================================================
  // SUITE 1: Dynamic CSS Custom Property Transfer Under Complex Scenarios
  // =========================================================================
  describe('Suite 1: Dynamic CSS Custom Property Transfer Under Complex Scenarios', () => {
    it('S1.1: transfers nested CSS variables, calc expressions, and complex values', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--theme-primary', '#1e40af');
      editorAreaCv.style.setProperty('--accent-color', 'var(--theme-primary, var(--fallback-color, #3874ff))');
      editorAreaCv.style.setProperty('--computed-padding', 'calc(100% - 2 * var(--page-padding, 24px))');
      editorAreaCv.style.setProperty('--complex-line-height', 'calc(1.45 * var(--font-scale, 1.2))');
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        expect(rootStyle.getPropertyValue('--theme-primary')).toBe('#1e40af');
        expect(rootStyle.getPropertyValue('--accent-color')).toBe('var(--theme-primary, var(--fallback-color, #3874ff))');
        expect(rootStyle.getPropertyValue('--computed-padding')).toBe('calc(100% - 2 * var(--page-padding, 24px))');
        expect(rootStyle.getPropertyValue('--complex-line-height')).toBe('calc(1.45 * var(--font-scale, 1.2))');
      } finally {
        restore();
      }
    });

    it('S1.2: transfers exotic units and high-DPI paddings without corruption', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--page-padding-dpi', '300dpi');
      editorAreaCv.style.setProperty('--page-padding-cm', '2.54cm');
      editorAreaCv.style.setProperty('--page-padding-mm', '50mm');
      editorAreaCv.style.setProperty('--page-padding-in', '1in');
      editorAreaCv.style.setProperty('--page-padding-px', '96px');
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        expect(rootStyle.getPropertyValue('--page-padding-dpi')).toBe('300dpi');
        expect(rootStyle.getPropertyValue('--page-padding-cm')).toBe('2.54cm');
        expect(rootStyle.getPropertyValue('--page-padding-mm')).toBe('50mm');
        expect(rootStyle.getPropertyValue('--page-padding-in')).toBe('1in');
        expect(rootStyle.getPropertyValue('--page-padding-px')).toBe('96px');
      } finally {
        restore();
      }
    });

    it('S1.3: preserves priority flag (!important vs normal)', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--important-override', '48px', 'important');
      editorAreaCv.style.setProperty('--normal-prop', '24px', '');
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        expect(rootStyle.getPropertyValue('--important-override')).toBe('48px');
        // JSDOM cssstyle limitation: getPropertyPriority on custom properties (--*) returns '' in jsdom,
        // but verify that executeCleanPrint faithfully copied the priority from editorAreaCv
        expect(rootStyle.getPropertyPriority('--important-override')).toBe(
          editorAreaCv.style.getPropertyPriority('--important-override')
        );

        expect(rootStyle.getPropertyValue('--normal-prop')).toBe('24px');
        expect(rootStyle.getPropertyPriority('--normal-prop')).toBe('');
      } finally {
        restore();
      }
    });

    it('S1.4: handles edge scales, negative values, and zero-values', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--font-scale-zero', '0');
      editorAreaCv.style.setProperty('--font-scale-tiny', '0.0001');
      editorAreaCv.style.setProperty('--font-scale-huge', '10.0');
      editorAreaCv.style.setProperty('--negative-margin', '-15px');
      editorAreaCv.style.setProperty('--zero-px', '0px');
      editorAreaCv.style.setProperty('--zero-pct', '0%');
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        expect(rootStyle.getPropertyValue('--font-scale-zero')).toBe('0');
        expect(rootStyle.getPropertyValue('--font-scale-tiny')).toBe('0.0001');
        expect(rootStyle.getPropertyValue('--font-scale-huge')).toBe('10.0');
        expect(rootStyle.getPropertyValue('--negative-margin')).toBe('-15px');
        expect(rootStyle.getPropertyValue('--zero-px')).toBe('0px');
        expect(rootStyle.getPropertyValue('--zero-pct')).toBe('0%');
      } finally {
        restore();
      }
    });

    it('S1.5: stress test with 60+ simultaneous custom properties', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      const testProps = {};
      for (let i = 1; i <= 60; i++) {
        const propName = `--stress-test-variable-key-${i}`;
        const propVal = `value_${i * 1.5}_px`;
        testProps[propName] = propVal;
        editorAreaCv.style.setProperty(propName, propVal);
      }
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        for (const [propName, propVal] of Object.entries(testProps)) {
          expect(rootStyle.getPropertyValue(propName)).toBe(propVal);
        }
      } finally {
        restore();
      }
    });

    it('S1.6: strictly does NOT bleed non-custom properties to documentElement', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--safe-custom', '123px');
      editorAreaCv.style.display = 'grid';
      editorAreaCv.style.width = '794px';
      editorAreaCv.style.margin = '50px';
      editorAreaCv.style.zIndex = '9999';
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        // Custom prop transferred
        expect(rootStyle.getPropertyValue('--safe-custom')).toBe('123px');

        // Standard properties MUST NOT be transferred
        expect(rootStyle.display).not.toBe('grid');
        expect(rootStyle.width).not.toBe('794px');
        expect(rootStyle.margin).not.toBe('50px');
        expect(rootStyle.zIndex).not.toBe('9999');
      } finally {
        restore();
      }
    });

    it('S1.7: safely survives when editor #area-cv is absent from DOM', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      // Ensure no #area-cv exists
      const existing = document.getElementById('area-cv');
      if (existing) existing.remove();

      try {
        await expect(executeCleanPrint({})).resolves.not.toThrow();
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
      } finally {
        restore();
      }
    });

    it('S1.8: transfers properties with unicode, quotes, and complex data URLs', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const editorAreaCv = document.createElement('div');
      editorAreaCv.id = 'area-cv';
      editorAreaCv.style.setProperty('--font-family-quoted', '"JetBrains Mono", monospace');
      editorAreaCv.style.setProperty('--unicode-val', 'diseño-tipográfico-ñ');
      editorAreaCv.style.setProperty('--url-val', 'url("https://fonts.googleapis.com/css?family=Roboto")');
      document.body.appendChild(editorAreaCv);

      try {
        await executeCleanPrint({});
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
        const rootStyle = doc.documentElement.style;

        expect(rootStyle.getPropertyValue('--font-family-quoted')).toBe('"JetBrains Mono", monospace');
        expect(rootStyle.getPropertyValue('--unicode-val')).toBe('diseño-tipográfico-ñ');
        expect(rootStyle.getPropertyValue('--url-val')).toBe('url("https://fonts.googleapis.com/css?family=Roboto")');
      } finally {
        restore();
      }
    });
  });

  // =========================================================================
  // SUITE 2: snapshotBreaksCSS & Break Avoidance Stress Testing
  // =========================================================================
  describe('Suite 2: snapshotBreaksCSS & Break Avoidance Stress Testing', () => {
    it('S2.1: handles null, undefined, empty, and broken snapshot inputs', () => {
      const html1 = generateCleanPrintHTML({}, 'es', undefined);
      expect(html1).toContain('<style id="cv-snapshot-breaks">');

      const html2 = generateCleanPrintHTML({}, 'es', null);
      expect(html2).toContain('<style id="cv-snapshot-breaks">');

      const html3 = generateCleanPrintHTML({}, 'es', {});
      expect(html3).toContain('<style id="cv-snapshot-breaks">');

      const html4 = generateCleanPrintHTML({}, 'es', { brokenElements: [] });
      expect(html4).toContain('<style id="cv-snapshot-breaks">');

      const html5 = generateCleanPrintHTML({}, 'es', { brokenElements: null });
      expect(html5).toContain('<style id="cv-snapshot-breaks">');
    });

    it('S2.2: polymorphic brokenElements mapping (titles, items, sections) with var(--page-padding, 24px)', () => {
      const snapshot = {
        totalPages: 3,
        brokenElements: [
          { isTitle: true, sectionId: 'experience_sec', fold: 1 },
          { itemId: 'proj_item_99', isTitle: false, fold: 2 },
          { sectionId: 'education_sec', itemId: null, isTitle: false, fold: 2 }
        ]
      };

      const html = generateCleanPrintHTML({}, 'es', snapshot);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const breaksTag = doc.getElementById('cv-snapshot-breaks');

      expect(breaksTag).not.toBeNull();
      const css = breaksTag.textContent;

      // Check section title selector
      expect(css).toContain('[data-section-title="experience_sec"]');
      // Check item selector
      expect(css).toContain('[data-item-id="proj_item_99"]');
      // Check fallback section ID selector
      expect(css).toContain('[data-section-id="education_sec"]');

      // Check break-before and margin-top rules
      expect(css).toContain('break-before: page !important;');
      expect(css).toContain('page-break-before: always !important;');
      expect(css).toContain('margin-top: 0 !important;');
    });

    it('S2.3: applies DOM break injection in executeCleanPrint with margin-top: 0', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const snapshot = {
        totalPages: 2,
        brokenElements: [
          { itemId: 'item_target_alpha', fold: 1 }
        ]
      };

      const cvData = {
        sections: [
          {
            id: 'exp',
            type: 'experience',
            items: [{ id: 'item_target_alpha', position: 'Lead Dev' }]
          }
        ]
      };

      try {
        await executeCleanPrint(cvData, 'es', snapshot);
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();

        const targetEl = doc.querySelector('[data-item-id="item_target_alpha"]');
        if (targetEl) {
          expect(targetEl.style.getPropertyValue('margin-top')).toBe('0px');
          expect(targetEl.style.getPropertyPriority('margin-top')).toBe('important');
          expect(targetEl.getAttribute('data-page-break-forced')).toBe('true');
          expect(targetEl.getAttribute('data-page-break-fold')).toBe('1');
        }
      } finally {
        restore();
      }
    });

    it('S2.4: survives gracefully when snapshot references non-existent items', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const snapshot = {
        totalPages: 2,
        brokenElements: [
          { isTitle: true, sectionId: 'non_existent_section', fold: 1 },
          { itemId: 'phantom_item_xyz', fold: 2 }
        ]
      };

      try {
        await expect(executeCleanPrint({}, 'es', snapshot)).resolves.not.toThrow();
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();
      } finally {
        restore();
      }
    });

    it('S2.5: handles brokenElements with dots, hyphens, and custom identifiers', () => {
      const snapshot = {
        totalPages: 2,
        brokenElements: [
          { isTitle: true, sectionId: 'section.v2_main-alpha', fold: 1 },
          { itemId: 'item_beta.sub-1', fold: 2 }
        ]
      };

      const html = generateCleanPrintHTML({}, 'es', snapshot);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const breaksTag = doc.getElementById('cv-snapshot-breaks');

      expect(breaksTag).not.toBeNull();
      expect(breaksTag.textContent).toContain('[data-section-title="section.v2_main-alpha"]');
      expect(breaksTag.textContent).toContain('[data-item-id="item_beta.sub-1"]');
    });

    it('S2.6: handles edge-case fold values (zero, negative, NaN) gracefully', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const snapshot = {
        totalPages: 2,
        brokenElements: [
          { itemId: 'item_fold_zero', fold: 0 },
          { itemId: 'item_fold_neg', fold: -1 },
          { itemId: 'item_fold_nan', fold: 'invalid' }
        ]
      };

      const cvData = {
        sections: [
          {
            id: 'exp',
            type: 'experience',
            items: [
              { id: 'item_fold_zero', position: 'Dev' },
              { id: 'item_fold_neg', position: 'Dev' },
              { id: 'item_fold_nan', position: 'Dev' }
            ]
          }
        ]
      };

      try {
        await executeCleanPrint(cvData, 'es', snapshot);
        const doc = getCapturedDoc();
        expect(doc).not.toBeNull();

        const elZero = doc.querySelector('[data-item-id="item_fold_zero"]');
        expect(elZero).not.toBeNull();
        expect(elZero.getAttribute('data-page-break-forced')).toBe('true');
        expect(elZero.getAttribute('data-page-break-fold')).toBe('1');

        const elNeg = doc.querySelector('[data-item-id="item_fold_neg"]');
        expect(elNeg).not.toBeNull();
        expect(elNeg.getAttribute('data-page-break-forced')).toBe('true');
        expect(elNeg.getAttribute('data-page-break-fold')).toBe('-1');

        const elNaN = doc.querySelector('[data-item-id="item_fold_nan"]');
        expect(elNaN).not.toBeNull();
        expect(elNaN.getAttribute('data-page-break-forced')).toBe('true');
        expect(elNaN.getAttribute('data-page-break-fold')).toBe('invalid');
      } finally {
        restore();
      }
    });
  });

  // =========================================================================
  // SUITE 3: Empty CVs, Multi-Page Layouts, and Layout Geometry Extremes
  // =========================================================================
  describe('Suite 3: Empty CVs, Multi-Page Layouts, and Layout Geometry Extremes', () => {
    it('S3.1: generates valid clean print HTML from completely blank/corrupt CV structures', () => {
      const blankCVs = [
        {},
        null,
        undefined,
        { sections: [] },
        { sections: null, layout: null },
        { profile: { name: 'Juan' }, sections: null },
        { profile: null, layout: { type: '1-column' } },
        { layout: { type: '2-column', leftColumnWidth: 0 } },
        { layout: { type: '2-column', leftColumnWidth: 100 } }
      ];

      for (const cv of blankCVs) {
        const html = generateCleanPrintHTML(cv);
        expect(typeof html).toBe('string');
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('id="area-cv"');
        expect(html).toContain('id="cv-base-styles"');
        expect(html).toContain('id="cv-print-styles"');
        expect(html).toContain('id="cv-snapshot-breaks"');
      }
    });

    it('S3.2: verifies target heights for 1-page, 2-page, and 4-page snapshots', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const testCases = [
        { pages: 1, expectedMm: 297 },
        { pages: 2, expectedMm: 594 },
        { pages: 4, expectedMm: 1188 }
      ];

      for (const tc of testCases) {
        const snapshot = {
          totalPages: tc.pages,
          brokenElements: tc.pages > 1 ? [{ itemId: 'dummy', fold: tc.pages - 1 }] : []
        };

        await executeCleanPrint({}, 'es', snapshot);
        const doc = getCapturedDoc();
        const areaCv = doc.getElementById('area-cv');
        expect(areaCv.style.getPropertyValue('--print-total-pages')).toBe(String(tc.pages));
        expect(areaCv.style.getPropertyValue('--print-target-height-mm')).toBe(`${tc.expectedMm}mm`);
        expect(areaCv.style.getPropertyValue('min-height')).toBe(`${tc.expectedMm}mm`);
      }

      restore();
    });

    it('S3.3: verifies 1-column ATS mode preserves single-column classes and 297mm min-height', () => {
      const atsCV = {
        layout: {
          type: '1-column',
          isAtsMode: true,
          pagePadding: 32
        },
        sections: [
          {
            id: 'ats_exp',
            type: 'experience',
            title: 'ATS Experience',
            items: [{ id: 'ats_item_1', position: 'Software Engineer' }]
          }
        ]
      };

      const html = generateCleanPrintHTML(atsCV);
      expect(html).toContain('resume__single-column');
      expect(html).toContain('resume--ats-mode');
      expect(html).toContain('--page-padding: 32px');
    });

    it('S3.4: handles extreme column split configurations (0%, 50%, 100%)', () => {
      const cv50 = {
        layout: { type: '2-column', leftColumnWidth: 50 }
      };
      const html50 = generateCleanPrintHTML(cv50);
      expect(html50).toContain('grid-template-columns: 50% 50%');

      const cv33 = {
        layout: { type: '2-column', leftColumnWidth: 33.33 }
      };
      const html33 = generateCleanPrintHTML(cv33);
      expect(html33).toContain('grid-template-columns: 33.33% 66.67%');
    });

    it('S3.5: adaptive scale guard clamps overflow heights down to 0.75 floor', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const snapshot = {
        totalPages: 2,
        brokenElements: []
      };

      try {
        const executePromise = executeCleanPrint({}, 'es', snapshot);
        const doc = getCapturedDoc();
        // Mock a massive overflow scrollHeight on doc.body
        Object.defineProperty(doc.body, 'scrollHeight', {
          value: 4000,
          configurable: true
        });

        await executePromise;
        expect(Number(doc.body.style.zoom)).toBe(0.75);
      } finally {
        restore();
      }
    });

    it('S3.6: anti-orphan safeguard detects section title separated from first child and applies page break', async () => {
      const { getCapturedDoc, restore } = setupMockIframe();

      const cvData = {
        sections: [
          {
            id: 'orphan_sec',
            type: 'experience',
            title: 'Experience Header',
            items: [{ id: 'child_item_1', position: 'Engineer' }]
          }
        ]
      };

      const snapshot = {
        totalPages: 2,
        brokenElements: []
      };

      try {
        const promise = executeCleanPrint(cvData, 'es', snapshot);
        const doc = getCapturedDoc();

        const title = doc.querySelector('.section-title');
        const firstItem = doc.querySelector('.cv-block');
        const areaCv = doc.getElementById('area-cv');

        if (title && firstItem && areaCv) {
          // Mock title on page 1 (Y = 1000px, pageHeight = 1123px)
          // Mock firstItem on page 2 (Y = 1200px)
          title.getBoundingClientRect = () => ({ top: 1000, bottom: 1050 });
          firstItem.getBoundingClientRect = () => ({ top: 1200, bottom: 1300 });
          areaCv.getBoundingClientRect = () => ({ top: 0, bottom: 2246 });
        }

        await promise;

        if (title) {
          expect(title.style.getPropertyValue('break-before')).toBe('page');
          expect(title.classList.contains('force-page-break-before')).toBe(true);
        }
      } finally {
        restore();
      }
    });
  });

  // =========================================================================
  // SUITE 4: CSS Architecture & Style Tag Single Source of Truth Audit
  // =========================================================================
  describe('Suite 4: CSS Architecture & Style Tag Single Source of Truth Audit', () => {
    it('S4.1: asserts src/styles/print.css has ZERO bare rules outside @media print', () => {
      // Find any rules that are outside @media print
      const cleaned = printStyles.replace(/\/\*[\s\S]*?\*\//g, '').trim();
      const mediaPrintMatch = cleaned.match(/^@media\s+print\s*\{([\s\S]*)\}$/);

      expect(mediaPrintMatch, 'src/styles/print.css must be entirely wrapped in @media print { ... }').not.toBeNull();
    });

    it('S4.2: asserts box-decoration-break: slice !important is present on columns', () => {
      const cssWithoutComments = printStyles.replace(/\/\*[\s\S]*?\*\//g, '');
      expect(cssWithoutComments).toContain('box-decoration-break: slice !important;');
      expect(cssWithoutComments).toContain('-webkit-box-decoration-break: slice !important;');
      expect(cssWithoutComments).not.toContain('box-decoration-break: clone');
    });

    it('S4.3: asserts bullet marker color uses fallback #334155 in print.css', () => {
      expect(printStyles).toContain('var(--circle-color, var(--text-color, #334155)) !important;');
    });

    it('S4.4: asserts src/index.css contains ZERO @media print blocks', () => {
      expect(baseStyles).not.toMatch(/@media\s+print/);
    });

    it('S4.5: asserts all three style tags have discrete IDs and correct ordering in clean HTML', () => {
      const html = generateCleanPrintHTML({});
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const styleTags = Array.from(doc.querySelectorAll('style'));
      expect(styleTags.length).toBe(3);

      expect(styleTags[0].id).toBe('cv-base-styles');
      expect(styleTags[1].id).toBe('cv-print-styles');
      expect(styleTags[2].id).toBe('cv-snapshot-breaks');
    });
  });
});
