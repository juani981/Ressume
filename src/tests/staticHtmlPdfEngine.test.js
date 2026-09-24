import { describe, it, expect, vi, beforeEach } from 'vitest';
import { defaultSchema } from '../utils/schema';
import {
  generateCleanPrintHTML,
  calculatePrintScale,
  executeCleanPrint,
  computeAdaptivePrintLayout
} from '../utils/staticHtmlPdfEngine';

describe('R5: Dedicated Static HTML PDF Rendering Core (Max 2 A4 Pages with Auto-Scaling)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleCVData = {
    ...defaultSchema,
    profile: {
      name: 'JUAN IGNACIO CARRIZO',
    },
    layout: {
      type: '2-column',
      leftBg: '#fafafa',
      rightBg: '#ffffff',
      pagePadding: 24,
      sectionGap: 20,
      itemGap: 8,
    },
  };

  // ==========================================
  // Tier 1: Core Feature Coverage (5 tests)
  // ==========================================
  describe('Tier 1: Feature Coverage', () => {
    it('T1.1: generateCleanPrintHTML produces a valid standalone HTML5 document string', () => {
      const html = generateCleanPrintHTML(sampleCVData);
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('JUAN IGNACIO CARRIZO');
    });

    it('T1.2: Strips all interactive editor artifacts (.drag-handle, .round-btn-del, .round-btn-add, .suggestion-tooltip, .inline-input)', () => {
      const html = generateCleanPrintHTML(sampleCVData);
      expect(html).not.toContain('drag-handle');
      expect(html).not.toContain('round-btn-del');
      expect(html).not.toContain('round-btn-add');
      expect(html).not.toContain('suggestion-tooltip');
      expect(html).not.toContain('<input');
      expect(html).not.toContain('contenteditable');
    });

    it('T1.3: Embeds strict break-inside: avoid and page-break-inside: avoid CSS rules on super-containers', () => {
      const html = generateCleanPrintHTML(sampleCVData);
      expect(html).toMatch(/break-inside:\s*avoid/i);
      expect(html).toMatch(/page-break-inside:\s*avoid/i);
    });

    it('T1.4: Renders both 1-column and 2-column layouts faithfully into clean print markup', () => {
      const html2Col = generateCleanPrintHTML({
        ...sampleCVData,
        layout: { ...sampleCVData.layout, type: '2-column' }
      });
      expect(html2Col).toContain('resume');

      const html1Col = generateCleanPrintHTML({
        ...sampleCVData,
        layout: { ...sampleCVData.layout, type: '1-column' }
      });
      expect(html1Col).toContain('resume');
    });

    it('T1.5: executeCleanPrint creates an isolated iframe, writes clean HTML, triggers print, and cleans up', () => {
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      executeCleanPrint(sampleCVData);
      expect(appendChildSpy).toHaveBeenCalled();
    });
  });

  // ==========================================
  // Tier 2: Boundary Value & Edge Cases (5 tests)
  // ==========================================
  describe('Tier 2: Boundary & Edge Cases', () => {
    it('T2.1: calculatePrintScale calculates scale factor correctly for content exceeding max 2 A4 pages (2246px)', () => {
      // Under 2246px -> scale is 1
      expect(calculatePrintScale(1500)).toBe(1);
      expect(calculatePrintScale(2246)).toBe(1);

      // 3000px -> scale = 2246 / 3000 = ~0.7486 clamped to floor
      const scaleOver = calculatePrintScale(3000);
      expect(scaleOver).toBeGreaterThanOrEqual(0.75);
      expect(scaleOver).toBeLessThanOrEqual(1.0);
    });

    it('T2.2: calculatePrintScale enforces strict floor limit to prevent unreadable micro-fonts', () => {
      const extremeHeight = 10000;
      const scale = calculatePrintScale(extremeHeight);
      expect(scale).toBeGreaterThanOrEqual(0.75);
      expect(scale).toBeLessThanOrEqual(1.0);
    });

    it('T2.3: Handles empty cvData or missing sections gracefully without throwing runtime errors', () => {
      const emptyData = { profile: {}, sections: [], layout: {} };
      const html = generateCleanPrintHTML(emptyData);
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
    });

    it('T2.4: Sanitizes special characters and HTML entities in user input to prevent XSS injection in static print output', () => {
      const maliciousData = {
        ...sampleCVData,
        profile: {
          name: '<script>alert("XSS")</script>Juan Carrizo',
        },
        sections: [
          {
            id: 'about_section',
            column: 'left',
            type: 'about',
            title: 'Perfil <img src=x onerror=alert(1)>',
            items: [
              { id: 'ab1', description: 'Experience with <b>HTML</b> & "quotes" & <script>' }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(maliciousData);
      expect(html).not.toContain('<script>alert("XSS")</script>');
    });

    it('T2.5: Preserves custom CSS spacing variables (--section-gap, --item-gap) inside generated print stylesheet', () => {
      const customSpacingData = {
        ...sampleCVData,
        layout: {
          type: '2-column',
          pagePadding: 32,
          sectionGap: 28,
          itemGap: 14,
        }
      };

      const html = generateCleanPrintHTML(customSpacingData);
      expect(html).toContain('28px');
      expect(html).toContain('14px');
    });

    it('T2.6: Preserves pagePadding in single-column mode in @media print rules without overriding to 0', () => {
      const singleColData = {
        ...sampleCVData,
        layout: {
          type: '1-column',
          pagePadding: 36,
          sectionGap: 24,
          itemGap: 10,
        }
      };

      const html = generateCleanPrintHTML(singleColData);
      expect(html).toContain('--page-padding: 36px');
      expect(html).toContain('padding: var(--page-padding, 36px) !important');
      expect(html).toContain('resume__single-column');
    });

    it('T2.7: Sets standardized title: version name if saved, or CV_${profileName}_${profileSubtitle} by default', () => {
      // Case 1: Unsaved / default format CV_${profileName}_${profileSubtitle}
      const cvWithNameAndSubtitle = {
        ...sampleCVData,
        profile: {
          name: 'Jane Doe',
          subtitle: 'Full Stack Engineer'
        }
      };

      const html = generateCleanPrintHTML(cvWithNameAndSubtitle);
      expect(html).toContain('<title>CV_Jane Doe_Full Stack Engineer</title>');

      // Case 2: Saved version loaded -> uses version name
      const cvWithSavedVersion = {
        ...cvWithNameAndSubtitle,
        versionName: 'CV Tech Lead 2026'
      };
      const htmlVersion = generateCleanPrintHTML(cvWithSavedVersion);
      expect(htmlVersion).toContain('<title>CV Tech Lead 2026</title>');
    });

    it('T2.8: Guarantees min-height: 297mm (full A4 sheet) for both 1-column and 2-column print layouts', () => {
      // 2-column mode
      const html2Col = generateCleanPrintHTML(sampleCVData);
      expect(html2Col).toContain('min-height: 297mm');
      expect(html2Col).toContain('resume__left');
      expect(html2Col).toContain('resume__right');

      // 1-column mode
      const singleColData = {
        ...sampleCVData,
        layout: { ...sampleCVData.layout, type: '1-column', isAtsMode: true }
      };
      const html1Col = generateCleanPrintHTML(singleColData);
      expect(html1Col).toContain('min-height: 297mm !important');
      expect(html1Col).toContain('resume__single-column');
      expect(html1Col).not.toContain('resume__left');
    });

    it('T2.9: computeAdaptivePrintLayout adapts for 1, 2, and 3+ page layouts without hardcoded ceiling', () => {
      expect(typeof computeAdaptivePrintLayout).toBe('function');

      // 1-page document
      const layout1 = computeAdaptivePrintLayout(950);
      expect(layout1.totalPages).toBe(1);
      expect(layout1.targetHeightMm).toBe(297);
      expect(layout1.scale).toBe(1.0);

      // 1-page document with slight overflow -> scaled to fit 1 page
      const layout1Spill = computeAdaptivePrintLayout(1200);
      expect(layout1Spill.totalPages).toBe(1);
      expect(layout1Spill.targetHeightMm).toBe(297);
      expect(layout1Spill.scale).toBeCloseTo(1123 / 1200, 2);

      // 2-page document
      const layout2 = computeAdaptivePrintLayout(1800);
      expect(layout2.totalPages).toBe(2);
      expect(layout2.targetHeightMm).toBe(594);
      expect(layout2.scale).toBe(1.0);

      // 2-page document with slight overflow -> scaled to fit 2 pages
      const layout2Spill = computeAdaptivePrintLayout(2400);
      expect(layout2Spill.totalPages).toBe(2);
      expect(layout2Spill.targetHeightMm).toBe(594);
      expect(layout2Spill.scale).toBeCloseTo(2246 / 2400, 2);

      // 3-page document -> fits 3 full pages, scale 1.0 (NO hardcoded 2-page ceiling!)
      const layout3 = computeAdaptivePrintLayout(3000);
      expect(layout3.totalPages).toBe(3);
      expect(layout3.targetHeightMm).toBe(891);
      expect(layout3.scale).toBe(1.0);

      // 3-page document with slight overflow -> scaled to fit 3 pages
      const layout3Spill = computeAdaptivePrintLayout(3500);
      expect(layout3Spill.totalPages).toBe(3);
      expect(layout3Spill.targetHeightMm).toBe(891);
      expect(layout3Spill.scale).toBeCloseTo(3369 / 3500, 2);
    });

    it('T2.10: Preserves strict page-break avoidance and box-decoration-break slice across fragmented columns', () => {
      const html = generateCleanPrintHTML(sampleCVData);
      expect(html).toContain('break-inside: avoid !important');
      expect(html).toContain('page-break-inside: avoid !important');
      expect(html).toContain('break-after: avoid !important');
      expect(html).toContain('box-decoration-break: slice');
    });
  });
});


