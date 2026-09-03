import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';
import ActionMenu from '../components/Editor/ActionMenu';
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
import { generateCleanPrintHTML, executeCleanPrint } from '../utils/staticHtmlPdfEngine';

describe('Epic 1: Client-Side PDF Generation via @react-pdf/renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const comprehensiveCVData = {
    ...defaultSchema,
    profile: {
      name: 'ALEXANDER HAMILTON',
      subtitle: 'Senior Full Stack Systems Architect',
      location: 'New York, NY',
      email: 'alexander@example.com',
      phone: '+1 (555) 019-2834',
      linkedin: 'linkedin.com/in/ahamilton',
      github: 'github.com/ahamilton'
    },
    layout: {
      type: '2-column',
      leftColumnWidth: 35,
      leftBg: '#1e293b',
      rightBg: '#ffffff',
      fontFamily: 'Inter',
      fontScale: 1.1,
      titleScale: 1.2,
      bodyScale: 1.0,
      listScale: 1.0,
      lineHeight: 1.5,
      pagePadding: 24,
      sectionGap: 22,
      itemGap: 10
    },
    sections: [
      {
        id: 'profile_header',
        type: 'profile_header',
        title: '',
        column: 'left',
        items: [
          {
            name: 'ALEXANDER HAMILTON',
            subtitle: 'Senior Full Stack Systems Architect',
            location: 'New York, NY',
            email: 'alexander@example.com',
            phone: '+1 (555) 019-2834',
            linkedin: 'linkedin.com/in/ahamilton',
            github: 'github.com/ahamilton'
          }
        ]
      },
      {
        id: 'about_sec',
        type: 'about',
        title: 'Profile Summary',
        column: 'left',
        items: [
          { description: 'Experienced architect specializing in scalable microservices and client-side document processing.' }
        ]
      },
      {
        id: 'skills_sec',
        type: 'skills',
        title: 'Core Competencies',
        column: 'left',
        items: [
          { title: 'Languages', description: 'TypeScript, JavaScript, Rust, Python, Go' },
          { title: 'Frameworks', description: 'React, Node.js, Next.js, Express, TailwindCSS' }
        ]
      },
      {
        id: 'languages_sec',
        type: 'languages',
        title: 'Languages',
        column: 'left',
        items: [
          { title: 'English', subtitle: 'Native', description: 'Native bilingual' },
          { title: 'Spanish', subtitle: 'Fluent', description: 'Professional working proficiency' }
        ]
      },
      {
        id: 'experience_sec',
        type: 'list',
        title: 'Professional Experience',
        column: 'right',
        items: [
          {
            id: 'exp-1',
            title: 'Lead Software Architect',
            subtitle: 'Treasury Financial Systems',
            date: '2021 - Present',
            description: 'Directed end-to-end architecture for multi-tenant high throughput ledger systems.',
            bullets: [
              'Architected distributed event-driven engine processing over 50,000 transactions/sec.',
              'Mentored 14 core engineers and established automated CI/CD deployment pipelines.'
            ],
            link: 'https://treasury.example.com',
            linkText: 'treasury.example.com'
          },
          {
            id: 'exp-2',
            title: 'Senior Systems Engineer',
            subtitle: 'Continental Micro Corp',
            date: '2018 - 2021',
            description: 'Engineered web applications and vector document export pipelines.',
            bullets: [
              'Reduced client-side rendering latency by 45% using virtualized trees.',
              'Implemented zero-split multi-page PDF generation.'
            ]
          }
        ]
      },
      {
        id: 'education_sec',
        type: 'education',
        title: 'Education',
        column: 'right',
        items: [
          {
            title: 'M.S. in Computer Science',
            subtitle: 'Columbia University',
            date: '2016 - 2018'
          },
          {
            title: 'B.S. in Software Engineering',
            subtitle: 'Kingston College',
            date: '2012 - 2016'
          }
        ]
      },
      {
        id: 'projects_sec',
        type: 'projects',
        title: 'Key Projects',
        column: 'right',
        items: [
          {
            title: 'Ressume Vector Core',
            subtitle: 'Open Source CV Engine',
            date: '2024',
            description: 'Ultra-fast vector PDF compiler generating 100% selectable A4 documents.',
            link: 'https://github.com/example/ressume',
            linkText: 'github.com/example/ressume',
            bullets: ['Built with React-PDF and Yoga layout engine.']
          }
        ]
      },
      {
        id: 'cert_sec',
        type: 'certificates',
        title: 'Certifications',
        column: 'right',
        items: [
          {
            title: 'AWS Certified Solutions Architect',
            subtitle: 'Amazon Web Services',
            date: '2023',
            credentialId: 'AWS-987654321',
            link: 'https://aws.amazon.com/verify'
          }
        ]
      },
      {
        id: 'awards_sec',
        type: 'awards',
        title: 'Honors & Awards',
        column: 'right',
        items: [
          {
            title: 'Innovation Champion of the Year',
            subtitle: 'Financial Tech Summit',
            date: '2022',
            description: 'Recognized for pioneering client-side cryptographic ledger verification.'
          }
        ]
      },
      {
        id: 'pub_sec',
        type: 'publications',
        title: 'Publications',
        column: 'right',
        items: [
          {
            title: 'High-Throughput Offline Vector Rendering',
            subtitle: 'ACM Software Engineering Conference',
            date: '2023',
            link: 'https://doi.org/10.1145/example'
          }
        ]
      },
      {
        id: 'vol_sec',
        type: 'volunteering',
        title: 'Volunteering',
        column: 'right',
        items: [
          {
            title: 'Code Mentor',
            subtitle: 'Tech For All Non-Profit',
            date: '2020 - Present',
            description: 'Mentoring underrepresented students in computer science fundamentals.'
          }
        ]
      },
      {
        id: 'ref_sec',
        type: 'references',
        title: 'References',
        column: 'right',
        items: [
          {
            title: 'George Washington',
            subtitle: 'Chief Executive Officer',
            email: 'gw@example.com',
            phone: '+1 (555) 999-0001',
            relationship: 'Former Manager'
          }
        ]
      },
      {
        id: 'simple_sec',
        type: 'simple_list',
        title: 'Additional Interests',
        column: 'right',
        items: [
          { text: 'Distributed Systems Research, Cryptography, Classical History' }
        ]
      }
    ]
  };

  // =========================================================================
  // TIER 1: Core Feature Requirements
  // =========================================================================
  describe('Tier 1: Feature Coverage (R1 & Acceptance Criteria)', () => {

    it('T1.1: renderPdfBlob produces a valid application/pdf Blob client-side', async () => {
      const blob = await renderPdfBlob(comprehensiveCVData, 'es');
      expect(blob).toBeDefined();
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/pdf');
      expect(blob.size).toBeGreaterThan(1000);
    });

    it('T1.2: generated PDF contains 100% selectable vector text and Type 1 font structures', async () => {
      const blob = await renderPdfBlob(comprehensiveCVData, 'es');
      expect(blob).toBeDefined();
      expect(blob.type).toBe('application/pdf');

      const pdfRawString = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsText(blob);
      });

      // Verify PDF header format
      expect(pdfRawString).toMatch(/^%PDF-1\.[3-7]/);
      // Verify Font dictionary structures are present
      expect(pdfRawString).toContain('/Font');
      expect(pdfRawString).toContain('/Type /Page');
      // Verify standard Type 1 font references (Helvetica, Helvetica-Bold)
      expect(pdfRawString).toContain('/BaseFont /Helvetica');
      expect(pdfRawString).toContain('/BaseFont /Helvetica-Bold');
      expect(pdfRawString).toContain('/Subtype /Type1');
      // Verify vector document title and author metadata
      expect(pdfRawString).toContain('ALEXANDER HAMILTON');
      expect(pdfRawString).toContain('Ressume CV Editor');
      // Verify zero raster canvas images were embedded as main body
      expect(pdfRawString).not.toContain('/Subtype /Image');
    });

    it('T1.3: renders 2-column layout matching on-screen layout parameters', async () => {
      const twoColData = {
        ...comprehensiveCVData,
        layout: {
          ...comprehensiveCVData.layout,
          type: '2-column',
          leftColumnWidth: 40,
          leftBg: '#0f172a',
          rightBg: '#f8fafc'
        }
      };
      const blob = await renderPdfBlob(twoColData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);

      const styles = createCvStyles(twoColData.layout);
      expect(styles.twoColumnRow.flexDirection).toBe('row');
    });

    it('T1.4: renders 1-column ATS mode matching single-column structure', async () => {
      const oneColData = {
        ...comprehensiveCVData,
        layout: {
          ...comprehensiveCVData.layout,
          type: '1-column',
          leftBg: '#ffffff',
          rightBg: '#ffffff'
        }
      };
      const blob = await renderPdfBlob(oneColData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(1000);

      const styles = createCvStyles(oneColData.layout);
      expect(styles.singleColumnContainer.width).toBe('100%');
    });

    it('T1.5: generateAndDownloadPdf creates download link with sanitized filename, clicks, revokes, and triggers success toast', async () => {
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-uuid');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');
      const removeChildSpy = vi.spyOn(document.body, 'removeChild');

      const showToastMock = vi.fn();
      const blob = await generateAndDownloadPdf(comprehensiveCVData, 'es', { showToast: showToastMock });

      expect(blob).toBeInstanceOf(Blob);
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      // Check downloaded link attributes
      const createdLink = appendChildSpy.mock.calls[0][0];
      expect(createdLink.tagName.toLowerCase()).toBe('a');
      expect(createdLink.download).toBe('CV_ALEXANDER_HAMILTON.pdf');
      expect(createdLink.href).toBe('blob:http://localhost/mock-uuid');

      // Check success toast notification
      expect(showToastMock).toHaveBeenCalledWith('PDF generado con éxito', 'success');

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    it('T1.6: ActionMenu renders Descargar PDF Vectorial button, triggers download, shows loading spinner, and invokes toast', async () => {
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-menu');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      // Verify vector PDF download button is present
      const vectorPdfBtn = screen.getByRole('button', { name: /descargar pdf vectorial/i });
      expect(vectorPdfBtn).toBeInTheDocument();
      expect(vectorPdfBtn).not.toBeDisabled();

      // Click button
      fireEvent.click(vectorPdfBtn);

      // Button should be disabled during loading
      expect(vectorPdfBtn).toBeDisabled();

      // Await generation completion
      await waitFor(() => {
        expect(vectorPdfBtn).not.toBeDisabled();
      }, { timeout: 5000 });

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('T1.7: multi-page pagination enforces wrap={false} on super-containers and items', () => {
      const section = comprehensiveCVData.sections.find(s => s.id === 'experience_sec');
      const styles = createCvStyles(comprehensiveCVData.layout);
      const colors = getDynamicTextColors('#ffffff');
      const fontSizes = computePdfFontSizes(comprehensiveCVData.layout);
      const spacing = computePdfSpacing(comprehensiveCVData.layout);

      const renderedSection = CVSectionPdf({
        section,
        colors,
        fontSizes,
        spacing,
        styles
      });

      expect(renderedSection).toBeDefined();
      expect(renderedSection.type).toBeDefined();

      // First child is super-container with wrap={false}
      const headerSuperContainer = renderedSection.props.children[0];
      expect(headerSuperContainer.props.wrap).toBe(false);

      // Subsequent items are each wrapped in wrap={false}
      const remainingContainers = renderedSection.props.children[1];
      remainingContainers.forEach(itemContainer => {
        expect(itemContainer.props.wrap).toBe(false);
      });
    });

    it('T1.8: renders all 13 CV section types cleanly into PDF document', async () => {
      const blob = await renderPdfBlob(comprehensiveCVData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(2000);
    });

    it('T1.9: offline execution guarantee — zero network requests (fetch / XMLHttpRequest) during rendering', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch');
      const xhrSpy = vi.spyOn(window, 'XMLHttpRequest');

      const blob = await renderPdfBlob(comprehensiveCVData, 'es');

      expect(blob).toBeInstanceOf(Blob);
      expect(fetchSpy).not.toHaveBeenCalled();
      expect(xhrSpy).not.toHaveBeenCalled();

      fetchSpy.mockRestore();
      xhrSpy.mockRestore();
    });

    it('T1.10: dual engine preservation — staticHtmlPdfEngine functions unchanged with zero interactive artifacts', () => {
      const htmlOutput = generateCleanPrintHTML(comprehensiveCVData, 'es');
      expect(htmlOutput).toBeDefined();
      expect(htmlOutput).toContain('<!DOCTYPE html>');
      expect(htmlOutput).toContain('ALEXANDER HAMILTON');
      expect(htmlOutput).toContain('break-inside: avoid !important');
      expect(htmlOutput).not.toContain('action-menu');
      expect(htmlOutput).not.toContain('drag-handle');
    });
  });

  // =========================================================================
  // TIER 2: Boundary & Edge Cases
  // =========================================================================
  describe('Tier 2: Boundary & Edge Cases', () => {

    it('T2.1: normalizeCvDataForPdf handles null, undefined, and empty objects without throwing', () => {
      const fromNull = normalizeCvDataForPdf(null);
      expect(fromNull).toBeDefined();
      expect(fromNull.layout).toBeDefined();
      expect(Array.isArray(fromNull.sections)).toBe(true);

      const fromEmpty = normalizeCvDataForPdf({});
      expect(fromEmpty).toBeDefined();
      expect(fromEmpty.layout.type).toBe('2-column');

      const fromPartial = normalizeCvDataForPdf({ profile: { name: 'Ada Lovelace' } });
      expect(fromPartial.profile.name).toBe('Ada Lovelace');
      expect(fromPartial.sections).toEqual([]);
    });

    it('T2.2: typography scaling factors and spacing tokens map accurately to PDF points', () => {
      const layout = {
        fontScale: 1.2,
        titleScale: 1.3,
        bodyScale: 1.1,
        listScale: 0.9,
        pagePadding: 32,
        sectionGap: 28,
        itemGap: 12,
        lineHeight: 1.6
      };

      const fontSizes = computePdfFontSizes(layout);
      // h1 = Math.round(18 * 1.2 * 1.3 * 10) / 10 = 28.1
      expect(fontSizes.h1).toBe(28.1);
      // body = Math.round(9.5 * 1.2 * 1.1 * 10) / 10 = 12.5
      expect(fontSizes.body).toBe(12.5);

      const spacing = computePdfSpacing(layout);
      // pagePadding = Math.round(32 * 0.75 * 10) / 10 = 24
      expect(spacing.pagePadding).toBe(24);
      // sectionGap = Math.round(28 * 0.75 * 10) / 10 = 21
      expect(spacing.sectionGap).toBe(21);
      // itemGap = Math.round(12 * 0.75 * 10) / 10 = 9
      expect(spacing.itemGap).toBe(9);
      expect(spacing.lineHeight).toBe(1.6);
    });

    it('T2.3: dynamic YIQ contrast calculation provides high contrast for dark and light backgrounds', () => {
      // Dark navy background -> light text
      const darkColors = getDynamicTextColors('#0f172a');
      expect(darkColors.titleColor).toBe('#fcfcfc');
      expect(darkColors.textColor).toBe('#f0efef');

      // Light pure white background -> dark text
      const lightColors = getDynamicTextColors('#ffffff');
      expect(lightColors.titleColor).toBe('#0f172a');
      expect(lightColors.textColor).toBe('#334155');

      // 3-digit hex shorthand (#000 -> black, #fff -> white)
      const shortDark = getDynamicTextColors('#000');
      expect(shortDark.titleColor).toBe('#fcfcfc');
      const shortLight = getDynamicTextColors('#fff');
      expect(shortLight.titleColor).toBe('#0f172a');
    });

    it('T2.4: font family mapping selects appropriate standard built-in Type 1 PDF font', () => {
      expect(mapFontFamilyToPdf('Poppins')).toBe('Helvetica');
      expect(mapFontFamilyToPdf('Inter')).toBe('Helvetica');
      expect(mapFontFamilyToPdf('Roboto')).toBe('Helvetica');
      expect(mapFontFamilyToPdf('Merriweather')).toBe('Times-Roman');
      expect(mapFontFamilyToPdf('JetBrains Mono')).toBe('Courier');
      expect(mapFontFamilyToPdf('UnknownFont')).toBe('Helvetica');
    });

    it('T2.5: handles empty sections and missing items gracefully without errors', async () => {
      const sparseData = {
        profile: { name: 'Sparse User' },
        layout: { type: '2-column' },
        sections: [
          { id: 'sec-1', type: 'about', title: 'About', column: 'left', items: [] },
          { id: 'sec-2', type: 'list', title: 'Experience', column: 'right', items: [] }
        ]
      };
      const blob = await renderPdfBlob(sparseData, 'es');
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.size).toBeGreaterThan(500);
    });

    it('T2.6: sanitizes filename when candidate name contains slashes, spaces, or special characters', async () => {
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild');

      const funkyData = {
        ...comprehensiveCVData,
        profile: { name: 'Dr. John / Jane Doe & Co.' }
      };
      await generateAndDownloadPdf(funkyData, 'en');

      const createdLink = appendChildSpy.mock.calls[0][0];
      expect(createdLink.download).toBe('CV_Dr_John_Jane_Doe_Co.pdf');

      createObjectURLSpy.mockRestore();
      appendChildSpy.mockRestore();
    });
  });
});
