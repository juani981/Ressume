import { describe, it, expect } from 'vitest';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';

describe('ATS Print Mode Fidelity & CSS Cascading', () => {
  it('ATS-1: renders resume--ats-mode on #area-cv when layout.isAtsMode is true', () => {
    const atsCV = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true
      }
    };

    const html = generateCleanPrintHTML(atsCV);
    expect(html).toContain('class="resume resume__single-column resume--ats-mode" id="area-cv"');
  });

  it('ATS-2: includes .resume--ats-mode .section-title border-bottom and left-alignment in print stylesheet', () => {
    const atsCV = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        isAtsMode: true
      }
    };

    const html = generateCleanPrintHTML(atsCV);
    // Verify ATS section title styling in print CSS
    expect(html).toMatch(/\.resume--ats-mode\s+\.section-title[\s\S]*?border-bottom:\s*1\.5px\s+solid\s+#0f172a\s*!important/);
    expect(html).toMatch(/\.resume--ats-mode\s+\.section-title[\s\S]*?padding-bottom:\s*4px\s*!important/);
    expect(html).toMatch(/\.resume--ats-mode\s+\.section-title[\s\S]*?letter-spacing:\s*0\.12rem\s*!important/);
    expect(html).toMatch(/\.resume--ats-mode\s+\.section-title[\s\S]*?text-align:\s*left\s*!important/);
    expect(html).toMatch(/\.resume--ats-mode\s+\.section-title[\s\S]*?font-weight:\s*700\s*!important/);
  });

  it('ATS-3: suppresses card shadow and border on #area-cv in ATS print mode', () => {
    const atsCV = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        isAtsMode: true
      }
    };

    const html = generateCleanPrintHTML(atsCV);
    expect(html).toMatch(/#area-cv\.resume--ats-mode[\s\S]*?border:\s*none\s*!important/);
    expect(html).toMatch(/#area-cv\.resume--ats-mode[\s\S]*?box-shadow:\s*none\s*!important/);
  });

  it('ATS-4: binds dynamic CSS variables directly into #area-cv style attribute and :root', () => {
    const customCV = {
      ...defaultSchema,
      layout: {
        ...defaultSchema.layout,
        type: '1-column',
        isAtsMode: true,
        pagePadding: 32,
        sectionGap: 24,
        itemGap: 12,
        fontScale: 1.1,
        fontFamily: 'Roboto'
      }
    };

    const html = generateCleanPrintHTML(customCV);
    // Check :root binding
    expect(html).toContain('--page-padding: 32px;');
    expect(html).toContain('--section-gap: 24px;');
    expect(html).toContain('--item-gap: 12px;');
    expect(html).toContain('--font-scale: 1.1;');
    expect(html).toContain("--body-font: 'Roboto', sans-serif;");

    // Check inline #area-cv style binding
    expect(html).toContain('--page-padding: 32px');
    expect(html).toContain('--section-gap: 24px');
    expect(html).toContain('--item-gap: 12px');
  });

  it('ATS-5: guarantees left alignment on all section titles in print', () => {
    const html = generateCleanPrintHTML(defaultSchema);
    expect(html).toMatch(/\.section-title\s*\{[\s\S]*?text-align:\s*left\s*!important/);
  });
});
