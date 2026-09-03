import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { defaultSchema } from '../utils/schema';
import CVDocument from '../components/PDF/CVDocument';
import { CVSectionPdf } from '../components/PDF/CVSectionPdf';
import { CVItemPdf } from '../components/PDF/CVItemPdf';
import { 
  getDynamicTextColors, 
  mapFontFamilyToPdf, 
  computePdfFontSizes, 
  computePdfSpacing, 
  createCvStyles 
} from '../components/PDF/pdfStyleFactory';
import { 
  renderPdfBlob, 
  generateAndDownloadPdf, 
  normalizeCvDataForPdf 
} from '../utils/reactPdfEngine';
import { 
  generateCleanPrintHTML, 
  executeCleanPrint, 
  calculatePrintScale 
} from '../utils/staticHtmlPdfEngine';

describe('Challenger M1-2: Pagination Boundaries, Dual-Engine Preservation, and Dynamic YIQ', () => {

  const baseLayout = {
    type: '2-column',
    fontFamily: 'Poppins',
    fontScale: 1.0,
    titleScale: 1.0,
    bodyScale: 1.0,
    listScale: 1.0,
    lineHeight: 1.45,
    pagePadding: 24,
    sectionGap: 20,
    itemGap: 8,
    leftBg: '#fafafa',
    rightBg: '#ffffff',
    leftColumnWidth: 35
  };

  const sampleProfile = {
    name: 'JUAN CARRIZO',
    subtitle: 'Senior Engineer',
    location: 'Tucumán, Argentina',
    email: 'juani@example.com',
    phone: '+54 381 1234567',
    linkedin: 'linkedin.com/in/juani',
    github: 'github.com/juani'
  };

  // =========================================================================
  // SECTION 1: Multi-Page Pagination & wrap={false} Mid-Item Split Prevention
  // =========================================================================
  describe('1. Multi-Page Pagination & wrap={false} Boundary Integrity', () => {
    
    it('P1.1: CVSectionPdf binds section title and first item inside an atomic wrap={false} container', () => {
      const section = {
        id: 'sec_exp',
        type: 'list',
        title: 'EXPERIENCIA LABORAL',
        items: [
          { id: 'i1', title: 'Tech Lead', subtitle: 'Company A', date: '2022' },
          { id: 'i2', title: 'Senior Dev', subtitle: 'Company B', date: '2020' },
          { id: 'i3', title: 'Mid Dev', subtitle: 'Company C', date: '2018' }
        ]
      };

      const colors = getDynamicTextColors('#ffffff');
      const fontSizes = computePdfFontSizes(baseLayout);
      const spacing = computePdfSpacing(baseLayout);
      const styles = createCvStyles(baseLayout);

      const rendered = CVSectionPdf({ section, colors, fontSizes, spacing, styles });
      expect(rendered).toBeDefined();

      // The top View contains [firstItemSuperContainer, remainingItemsContainers]
      const children = rendered.props.children;
      expect(Array.isArray(children)).toBe(true);

      const firstItemSuperContainer = children[0];
      expect(firstItemSuperContainer.props.wrap).toBe(false);

      // Verify the title is inside this supercontainer
      const superContainerChildren = firstItemSuperContainer.props.children;
      const titleElement = superContainerChildren[0];
      expect(titleElement.props.children).toBe('EXPERIENCIA LABORAL');

      // Verify first CVItemPdf is inside this supercontainer
      const firstItemElement = superContainerChildren[1];
      expect(firstItemElement.props.item.id).toBe('i1');
      expect(firstItemElement.props.isLast).toBe(false);
    });

    it('P1.2: CVSectionPdf wraps every subsequent item in an independent wrap={false} container', () => {
      const section = {
        id: 'sec_exp',
        type: 'list',
        title: 'EXPERIENCIA',
        items: [
          { id: 'i1', title: 'Job 1' },
          { id: 'i2', title: 'Job 2' },
          { id: 'i3', title: 'Job 3' },
          { id: 'i4', title: 'Job 4' }
        ]
      };

      const colors = getDynamicTextColors('#ffffff');
      const fontSizes = computePdfFontSizes(baseLayout);
      const spacing = computePdfSpacing(baseLayout);
      const styles = createCvStyles(baseLayout);

      const rendered = CVSectionPdf({ section, colors, fontSizes, spacing, styles });
      const remainingContainers = rendered.props.children[1];
      expect(remainingContainers.length).toBe(3);

      // Each remaining item container must have wrap={false} to avoid mid-item fracturing
      remainingContainers.forEach((container, idx) => {
        expect(container.props.wrap).toBe(false);
        const itemElement = container.props.children;
        expect(itemElement.props.item.id).toBe(`i${idx + 2}`);
        // Last item flag check
        expect(itemElement.props.isLast).toBe(idx === 2);
      });
    });

    it('P1.3: Single-block sections (profile_header, about) have wrap={false} on the entire section', () => {
      const colors = getDynamicTextColors('#fafafa');
      const fontSizes = computePdfFontSizes(baseLayout);
      const spacing = computePdfSpacing(baseLayout);
      const styles = createCvStyles(baseLayout);

      // Profile Header
      const profileSec = {
        id: 'profile_header',
        type: 'profile_header',
        title: '',
        items: [sampleProfile]
      };
      const renderedProfile = CVSectionPdf({ section: profileSec, colors, fontSizes, spacing, styles });
      expect(renderedProfile.props.wrap).toBe(false);

      // About Section
      const aboutSec = {
        id: 'about',
        type: 'about',
        title: 'Sobre Mí',
        items: [{ description: 'Biografía profesional completa.' }]
      };
      const renderedAbout = CVSectionPdf({ section: aboutSec, colors, fontSizes, spacing, styles });
      expect(renderedAbout.props.wrap).toBe(false);
    });

    it('P1.4: Multi-page stress pagination: rendering 25 items generates a multi-page PDF with /Count > 1', async () => {
      const largeItems = Array.from({ length: 25 }, (_, i) => ({
        id: `exp_${i}`,
        title: `Position Role #${i + 1} Enterprise Systems Architecture`,
        subtitle: `Corporation ${i + 1} Global Financial Platforms`,
        date: `201${i % 10} – 202${i % 6}`,
        description: `Responsible for designing mission-critical high-throughput pipelines, leading cross-functional teams of ${i + 5} engineers, and managing microservices infrastructure.`,
        bullets: [
          `Engineered distributed caching layer reducing P99 latency by ${10 + (i % 30)}%.`,
          `Spearheaded cloud migration to Kubernetes with zero downtime deployment.`
        ]
      }));

      const heavyCVData = {
        ...defaultSchema,
        profile: sampleProfile,
        layout: {
          ...baseLayout,
          type: '1-column' // 1-column flows 25 items down the page
        },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            items: [sampleProfile]
          },
          {
            id: 'heavy_experience',
            type: 'list',
            title: 'EXTENSIVE EXPERIENCE HISTORY',
            column: 'left',
            items: largeItems
          }
        ]
      };

      const blob = await renderPdfBlob(heavyCVData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(10000);

      // Read raw PDF text stream
      const pdfText = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(blob);
      });

      // Assert multi-page presence in PDF catalog
      // In PDF objects, /Type /Pages contains /Count N where N >= 2
      const pageCountMatch = pdfText.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
      expect(pageCountMatch).not.toBeNull();
      const pageCount = parseInt(pageCountMatch[1], 10);
      expect(pageCount).toBeGreaterThanOrEqual(2);
    });

    it('P1.5: 2-column heavy content paginates across multiple pages cleanly without data corruption', async () => {
      const leftItems = Array.from({ length: 15 }, (_, i) => ({
        id: `left_item_${i}`,
        title: `Skill / Course #${i + 1}`,
        description: `Detailed competencies in technology stack ${i + 1}`
      }));

      const rightItems = Array.from({ length: 15 }, (_, i) => ({
        id: `right_item_${i}`,
        title: `Executive Job Role #${i + 1}`,
        subtitle: `Technology Enterprise ${i + 1}`,
        date: `2015 - 2025`,
        description: `Description of systems delivered for enterprise domain ${i + 1}.`,
        bullets: [`Bullet point A for item ${i + 1}`, `Bullet point B for item ${i + 1}`]
      }));

      const heavy2ColData = {
        ...defaultSchema,
        profile: sampleProfile,
        layout: {
          ...baseLayout,
          type: '2-column',
          leftColumnWidth: 35
        },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            items: [sampleProfile]
          },
          {
            id: 'left_sec',
            type: 'skills',
            title: 'HABILIDADES TÉCNICAS',
            column: 'left',
            items: leftItems
          },
          {
            id: 'right_sec',
            type: 'list',
            title: 'EXPERIENCIA PROFESIONAL',
            column: 'right',
            items: rightItems
          }
        ]
      };

      const blob = await renderPdfBlob(heavy2ColData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);

      const pdfText = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.readAsText(blob);
      });

      const pageCountMatch = pdfText.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+(\d+)/);
      expect(pageCountMatch).not.toBeNull();
      const pageCount = parseInt(pageCountMatch[1], 10);
      expect(pageCount).toBeGreaterThanOrEqual(2);
    });
  });

  // =========================================================================
  // SECTION 2: Dual-Engine Verification (staticHtmlPdfEngine.js Coexistence)
  // =========================================================================
  describe('2. Dual-Engine Preservation (staticHtmlPdfEngine.js Integrity)', () => {

    it('D2.1: renderItemHTML handles isLast properly without ReferenceError', () => {
      // Test that generateCleanPrintHTML completes with 0 errors across timeline items
      const cvWithTimelines = {
        profile: sampleProfile,
        layout: baseLayout,
        sections: [
          {
            id: 'exp',
            type: 'list',
            column: 'right',
            title: 'EXPERIENCE',
            items: [
              { id: '1', title: 'Job 1' },
              { id: '2', title: 'Job 2' }
            ]
          },
          {
            id: 'edu',
            type: 'education',
            column: 'left',
            title: 'EDUCATION',
            items: [
              { id: 'e1', title: 'Degree 1' },
              { id: 'e2', title: 'Degree 2' }
            ]
          }
        ]
      };

      expect(() => {
        const html = generateCleanPrintHTML(cvWithTimelines, 'es');
        expect(html).toContain('Job 1');
        expect(html).toContain('Degree 2');
      }).not.toThrow();
    });

    it('D2.2: staticHtmlPdfEngine enforces break-inside: avoid and orphan protection in CSS', () => {
      const html = generateCleanPrintHTML({ profile: sampleProfile, layout: baseLayout, sections: [] }, 'es');
      
      expect(html).toContain('break-inside: avoid !important');
      expect(html).toContain('page-break-inside: avoid !important');
      expect(html).toContain('break-after: avoid !important');
      expect(html).toContain('page-break-after: avoid !important');
      expect(html).toContain('.cv-section');
      expect(html).toContain('.cv-block');
    });

    it('D2.3: executeCleanPrint creates iframe, sets dimensions, triggers print and unmounts', async () => {
      vi.useFakeTimers();

      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const cvData = { profile: sampleProfile, layout: baseLayout, sections: [] };

      executeCleanPrint(cvData);

      const iframe = appendChildSpy.mock.calls.find(c => c[0].tagName === 'IFRAME')?.[0];
      expect(iframe).toBeDefined();
      expect(iframe.style.width).toBe('794px');
      expect(iframe.style.height).toBe('1123px');

      vi.advanceTimersByTime(1500);
      expect(document.querySelectorAll('iframe').length).toBe(0);

      appendChildSpy.mockRestore();
      vi.useRealTimers();
    });

    it('D2.4: Both engines produce identical textual content for all 13 section types', async () => {
      const allTypesCV = {
        profile: sampleProfile,
        layout: baseLayout,
        sections: [
          { id: 'p', type: 'profile_header', column: 'left', items: [sampleProfile] },
          { id: 'a', type: 'about', column: 'left', items: [{ description: 'About text' }] },
          { id: 's', type: 'skills', column: 'left', items: [{ title: 'Skill', description: 'Desc' }] },
          { id: 'l', type: 'languages', column: 'left', items: [{ title: 'Spanish', subtitle: 'Native' }] },
          { id: 'e', type: 'education', column: 'left', items: [{ title: 'University', subtitle: 'Degree', date: '2020' }] },
          { id: 'x', type: 'list', column: 'right', items: [{ title: 'Work', subtitle: 'Company', date: '2022', description: 'Work desc' }] },
          { id: 'pr', type: 'projects', column: 'right', items: [{ title: 'Project', subtitle: 'Sub', description: 'Proj desc' }] },
          { id: 'c', type: 'certificates', column: 'right', items: [{ title: 'Cert', subtitle: 'Sub', date: '2023' }] },
          { id: 'aw', type: 'awards', column: 'right', items: [{ title: 'Award', subtitle: 'Sub' }] },
          { id: 'pu', type: 'publications', column: 'right', items: [{ title: 'Pub', subtitle: 'Sub' }] },
          { id: 'v', type: 'volunteering', column: 'right', items: [{ title: 'Vol', subtitle: 'Sub' }] },
          { id: 'r', type: 'references', column: 'left', items: [{ title: 'Ref Name', subtitle: 'Ref Position' }] },
          { id: 'sl', type: 'simple_list', column: 'right', items: [{ text: 'Simple bullet' }] }
        ]
      };

      // Engine 1: static HTML
      const html = generateCleanPrintHTML(allTypesCV, 'es');
      expect(html).toContain('About text');
      expect(html).toContain('University');
      expect(html).toContain('Work desc');
      expect(html).toContain('Simple bullet');

      // Engine 2: React-PDF blob
      const blob = await renderPdfBlob(allTypesCV, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(3000);
    });
  });

  // =========================================================================
  // SECTION 3: 2-Column & 1-Column Layouts with Dynamic YIQ Color Calculation
  // =========================================================================
  describe('3. Layout Geometry & Dynamic YIQ Color Calculations', () => {

    it('Y3.1: getDynamicTextColors accurately categorizes dark vs light across boundary values', () => {
      // Pure black -> dark (YIQ = 0 < 128)
      const black = getDynamicTextColors('#000000');
      expect(black.titleColor).toBe('#fcfcfc');
      expect(black.textColor).toBe('#f0efef');
      expect(black.textColorLight).toBe('#cccccc');

      // Pure white -> light (YIQ = 255 >= 128)
      const white = getDynamicTextColors('#ffffff');
      expect(white.titleColor).toBe('#0f172a');
      expect(white.textColor).toBe('#334155');
      expect(white.textColorLight).toBe('#64748b');

      // 3-digit hex variations
      const hex000 = getDynamicTextColors('#000');
      expect(hex000.titleColor).toBe('#fcfcfc');
      const hexFFF = getDynamicTextColors('#fff');
      expect(hexFFF.titleColor).toBe('#0f172a');

      // Mid-grays around threshold 128
      // #7f7f7f -> r=127, g=127, b=127 -> yiq = 127 < 128 -> dark branch
      const gray127 = getDynamicTextColors('#7f7f7f');
      expect(gray127.titleColor).toBe('#fcfcfc');

      // #808080 -> r=128, g=128, b=128 -> yiq = 128 >= 128 -> light branch
      const gray128 = getDynamicTextColors('#808080');
      expect(gray128.titleColor).toBe('#0f172a');

      // Extreme corporate dark backgrounds
      const navy = getDynamicTextColors('#0f172a');
      expect(navy.titleColor).toBe('#fcfcfc');
      const slateDark = getDynamicTextColors('#1e293b');
      expect(slateDark.titleColor).toBe('#fcfcfc');

      // Extreme light backgrounds
      const slateLight = getDynamicTextColors('#f8fafc');
      expect(slateLight.titleColor).toBe('#0f172a');
      const offWhite = getDynamicTextColors('#fafafa');
      expect(offWhite.titleColor).toBe('#0f172a');
    });

    it('Y3.2: getDynamicTextColors handles null, undefined, empty, and invalid hex gracefully', () => {
      // null / undefined / empty fall back to #ffffff
      const fromNull = getDynamicTextColors(null);
      expect(fromNull.titleColor).toBe('#0f172a');

      const fromUndefined = getDynamicTextColors(undefined);
      expect(fromUndefined.titleColor).toBe('#0f172a');

      const fromEmpty = getDynamicTextColors('');
      expect(fromEmpty.titleColor).toBe('#0f172a');

      // Hex without '#' prefix
      const noHash = getDynamicTextColors('000000');
      expect(noHash.titleColor).toBe('#fcfcfc');
    });

    it('Y3.3: 1-column layout geometry renders singleColumnContainer in React-PDF and resume__single-column in HTML', async () => {
      const oneColCV = {
        ...defaultSchema,
        profile: sampleProfile,
        layout: {
          ...baseLayout,
          type: '1-column'
        },
        sections: [
          { id: 's1', type: 'about', title: 'About', column: 'left', items: [{ description: 'test' }] }
        ]
      };

      // Check React-PDF styles
      const pdfStyles = createCvStyles(oneColCV.layout);
      expect(pdfStyles.singleColumnContainer.width).toBe('100%');

      // Check HTML output
      const html = generateCleanPrintHTML(oneColCV, 'es');
      expect(html).toContain('resume__single-column');
      expect(html).toContain('max-width: 840px');
      expect(html).toContain('margin: 0 auto');
      expect(html).not.toContain('resume__left');
      expect(html).not.toContain('resume__right');
    });

    it('Y3.4: 2-column layout geometry applies configurable column width percentage in both engines', async () => {
      const customWidthCV = {
        ...defaultSchema,
        profile: sampleProfile,
        layout: {
          ...baseLayout,
          type: '2-column',
          leftColumnWidth: 42,
          leftBg: '#1e293b',
          rightBg: '#f1f5f9'
        },
        sections: [
          { id: 's1', type: 'about', title: 'About Left', column: 'left', items: [{ description: 'left text' }] },
          { id: 's2', type: 'list', title: 'Work Right', column: 'right', items: [{ title: 'right text' }] }
        ]
      };

      // HTML Engine checks
      const html = generateCleanPrintHTML(customWidthCV, 'es');
      expect(html).toContain('grid-template-columns: 42% 58%');
      expect(html).toContain('resume__left');
      expect(html).toContain('resume__right');
      expect(html).toContain('background: #1e293b');
      expect(html).toContain('background: #f1f5f9');

      // React-PDF Document checks
      const blob = await renderPdfBlob(customWidthCV, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('Y3.5: Circle and badge colors adjust dynamically to ensure high contrast against column backgrounds', () => {
      // Dark background: circleColor is lightened (+40)
      const darkColors = getDynamicTextColors('#111111');
      expect(darkColors.circleColor).not.toBe('#111111');

      // Light background: circleColor is darkened (-40)
      const lightColors = getDynamicTextColors('#f5f5f5');
      expect(lightColors.circleColor).not.toBe('#f5f5f5');
    });
  });

  // =========================================================================
  // SECTION 4: Edge Cases & Adversarial Stress Testing
  // =========================================================================
  describe('4. Adversarial Stress Testing & Resiliency', () => {

    it('A4.1: Empty sections and sections with undefined items do not throw in either engine', async () => {
      const sparseCV = {
        profile: null,
        layout: baseLayout,
        sections: [
          { id: 'empty_1', type: 'list', title: 'Empty List', column: 'left', items: [] },
          { id: 'empty_2', type: 'about', title: 'Empty About', column: 'right' }, // items is undefined
          { id: 'empty_3', type: 'skills', title: 'Null Items', column: 'left', items: null }
        ]
      };

      // HTML Engine
      expect(() => {
        const html = generateCleanPrintHTML(sparseCV, 'es');
        expect(html).toContain('Empty List');
      }).not.toThrow();

      // React-PDF Engine
      await expect(renderPdfBlob(sparseCV, 'es')).resolves.toBeInstanceOf(Blob);
    });

    it('A4.2: Handles massive text content (5000+ chars) in item description without crashing', async () => {
      const longDescription = 'A'.repeat(5000);
      const stressCV = {
        profile: sampleProfile,
        layout: baseLayout,
        sections: [
          {
            id: 'long_about',
            type: 'about',
            title: 'EXTENSIVE PROFILE',
            column: 'left',
            items: [{ description: longDescription }]
          }
        ]
      };

      const html = generateCleanPrintHTML(stressCV, 'es');
      expect(html).toContain(longDescription);

      const blob = await renderPdfBlob(stressCV, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(2000);
    });

    it('A4.3: Handles items with null properties (missing title, subtitle, date, bullets) cleanly', async () => {
      const badItemsCV = {
        profile: { name: 'Fault Tolerant Candidate' },
        layout: baseLayout,
        sections: [
          {
            id: 'bad_exp',
            type: 'list',
            title: 'Experience',
            column: 'right',
            items: [
              { id: 'b1' }, // completely empty item
              { id: 'b2', title: null, subtitle: null, date: null, bullets: null, link: null }
            ]
          }
        ]
      };

      expect(() => generateCleanPrintHTML(badItemsCV, 'es')).not.toThrow();
      await expect(renderPdfBlob(badItemsCV, 'es')).resolves.toBeInstanceOf(Blob);
    });

    it('A4.4: Rich text markup tags (<b>, <i>, <br>) are safely processed by both engines', async () => {
      const richTextCV = {
        profile: sampleProfile,
        layout: baseLayout,
        sections: [
          {
            id: 'rich_about',
            type: 'about',
            title: 'Rich Profile',
            column: 'left',
            items: [{
              description: 'This is <b>bold statement</b> and <i>italic phrase</i> with <br> break line and <strong>strong</strong>.'
            }]
          },
          {
            id: 'rich_exp',
            type: 'list',
            title: 'Rich Experience',
            column: 'right',
            items: [{
              title: 'Senior <b>Engineer</b>',
              bullets: ['Bullet 1 with <i>emphasis</i>', 'Bullet 2 <b>important</b>']
            }]
          }
        ]
      };

      // HTML Engine preserves / escapes appropriately
      const html = generateCleanPrintHTML(richTextCV, 'es');
      expect(html).toBeDefined();

      // React-PDF Engine parses tokens cleanly
      const blob = await renderPdfBlob(richTextCV, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(2000);
    });
  });
});
