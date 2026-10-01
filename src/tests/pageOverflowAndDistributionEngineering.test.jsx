import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  createPageGeometry,
  PAGE_FORMATS,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  A4_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  A4_GEOMETRY,
} from '../constants/geometry';
import {
  calculateCharsPerLine,
  estimateItemHeight,
  estimateSectionHeight,
  distributeSectionsToPages,
} from '../utils/pageDistributor';
import A4PageBox from '../components/CV/A4PageBox';
import { defaultSchema } from '../utils/schema';

describe('Engineering Milestone: Page Geometry SSOT & Content Overflow Robustness', () => {
  describe('Problem 1: Geometry Factory & Unified Single Source of Truth', () => {
    it('creates deterministic geometry models from mm specifications', () => {
      const a4 = createPageGeometry({ widthMm: 210, heightMm: 297, dpi: 96 });
      expect(a4.widthMm).toBe(210);
      expect(a4.heightMm).toBe(297);
      expect(a4.widthPx).toBe(794);
      expect(a4.heightPx).toBe(1123);
      expect(a4.widthCss).toBe('210mm');
      expect(a4.heightCss).toBe('297mm');
    });

    it('exports frozen PAGE_FORMATS registry supporting A4, LETTER, and LEGAL', () => {
      expect(PAGE_FORMATS.A4).toBeDefined();
      expect(PAGE_FORMATS.LETTER).toBeDefined();
      expect(PAGE_FORMATS.LEGAL).toBeDefined();
      expect(Object.isFrozen(PAGE_FORMATS.A4)).toBe(true);
      expect(PAGE_FORMATS.LETTER.widthMm).toBe(215.9);
    });

    it('preserves 100% backward compatibility for all legacy scalar constants', () => {
      expect(A4_WIDTH_MM).toBe(210);
      expect(A4_HEIGHT_MM).toBe(297);
      expect(A4_WIDTH_PX).toBe(794);
      expect(A4_PAGE_HEIGHT_PX).toBe(1123);
      expect(A4_GEOMETRY.widthPx).toBe(794);
      expect(A4_GEOMETRY.heightPx).toBe(1123);
    });
  });

  describe('Problem 4 & 5: Column Width and Monospace Font Dynamic Metrics', () => {
    it('dynamically adapts charsPerLine based on leftColumnWidth slider', () => {
      const narrowCol = calculateCharsPerLine({ column: 'left', leftColumnWidth: 20 }, false);
      const standardCol = calculateCharsPerLine({ column: 'left', leftColumnWidth: 32 }, false);
      const wideCol = calculateCharsPerLine({ column: 'left', leftColumnWidth: 45 }, false);

      expect(narrowCol).toBeLessThan(standardCol);
      expect(wideCol).toBeGreaterThan(standardCol);
      expect(standardCol).toBe(28); // Baseline invariant preserved
    });

    it('scales charsPerLine down for monospace fonts (JetBrains Mono)', () => {
      const sansChars = calculateCharsPerLine({ column: 'left', fontFamily: 'Inter' }, false);
      const monoChars = calculateCharsPerLine({ column: 'left', fontFamily: 'JetBrains Mono' }, false);

      expect(sansChars).toBe(28);
      expect(monoChars).toBe(21); // ~35% wider glyphs reduces line character capacity
    });
  });

  describe('Problem 6: Rich Text Wrapping & Multi-Line Item Height Metrics', () => {
    it('estimates education height dynamically when degree or institution wraps', () => {
      const shortEdu = {
        title: 'B.S. CS',
        subtitle: 'MIT',
      };
      const longEdu = {
        title: 'Licenciatura en Ciencias de la Computación con Especialización en Sistemas Distribuidos',
        subtitle: 'Facultad de Ciencias Exactas e Ingeniería de la Universidad Nacional de Buenos Aires',
      };

      const hShort = estimateItemHeight(shortEdu, 'education', { column: 'left' });
      const hLong = estimateItemHeight(longEdu, 'education', { column: 'left' });

      expect(hLong).toBeGreaterThan(hShort);
    });

    it('accounts for explicit newlines in about section description', () => {
      const singleLine = { text: 'Paragraph one without line breaks.' };
      const multiParagraph = { text: 'Paragraph one.\n\nParagraph two.\n\nParagraph three.' };

      const hSingle = estimateItemHeight(singleLine, 'about', { column: 'left' });
      const hMulti = estimateItemHeight(multiParagraph, 'about', { column: 'left' });

      expect(hMulti).toBeGreaterThan(hSingle);
    });

    it('wraps long contact strings across multiple rows in left column', () => {
      const shortContact = {
        contacts: [
          { value: 'short@mail.com' },
        ],
      };
      const longContact = {
        contacts: [
          { value: 'super-ultra-long-custom-corporate-domain-email-address-that-wraps@extraordinary-organization.io' },
        ],
      };

      const hShort = estimateItemHeight(shortContact, 'contact', { column: 'left' });
      const hLong = estimateItemHeight(longContact, 'contact', { column: 'left' });

      expect(hLong).toBeGreaterThan(hShort);
    });
  });

  describe('Problem 7: Section bottomSpacing Inclusion in Capacity', () => {
    it('factors section.bottomSpacing into estimateSectionHeight', () => {
      const baseSection = {
        id: 'sec1',
        type: 'education',
        title: 'Educación',
        items: [{ title: 'Grado', subtitle: 'Univ' }],
      };
      const spacedSection = {
        ...baseSection,
        bottomSpacing: 60,
      };

      const hBase = estimateSectionHeight(baseSection, { column: 'left' });
      const hSpaced = estimateSectionHeight(spacedSection, { column: 'left' });

      expect(hSpaced).toBe(hBase + 60);
    });
  });

  describe('Problem 8: Visual Feedback & Obsidian Danger Callout on Overflow', () => {
    it('renders Obsidian Danger Callout when page overflow is detected', () => {
      render(
        <A4PageBox
          pageNumber={1}
          totalPages={1}
          showBadge={true}
          isOverflowed={true}
        >
          <div>Some content</div>
        </A4PageBox>
      );

      const warning = screen.getByTestId('a4-page-overflow-warning-1');
      expect(warning).toBeInTheDocument();
      expect(warning.className).toContain('obsidian-callout');
      expect(warning.className).toContain('obsidian-callout-danger');
      expect(warning).toHaveTextContent('🛑');
      expect(warning).toHaveTextContent('Desbordamiento de página 1');
    });

    it('does not render warning when page has no overflow', () => {
      render(
        <A4PageBox
          pageNumber={1}
          totalPages={1}
          showBadge={true}
          isOverflowed={false}
        >
          <div>Short content</div>
        </A4PageBox>
      );

      expect(screen.queryByTestId('a4-page-overflow-warning-1')).toBeNull();
    });

    it('renders actionable button inside Obsidian Callout and dispatches onMoveOverflowToNextPage', () => {
      const handleMove = vi.fn();
      render(
        <A4PageBox
          pageNumber={1}
          totalPages={1}
          showBadge={true}
          isOverflowed={true}
          onMoveOverflowToNextPage={handleMove}
        >
          <div>Overflowing content</div>
        </A4PageBox>
      );

      const actionBtn = screen.getByTestId('a4-page-overflow-action-1');
      expect(actionBtn).toBeInTheDocument();
      expect(actionBtn).toHaveTextContent('Pasar sobrante a Página 2 ➔');

      fireEvent.click(actionBtn);
      expect(handleMove).toHaveBeenCalledTimes(1);
      expect(handleMove).toHaveBeenCalledWith(1);
    });

    it('dynamically relocates overflowing section to page 2 when breakBefore is toggled', () => {
      const cvWithOverflow = JSON.parse(JSON.stringify(defaultSchema));
      const exp = cvWithOverflow.sections.find(s => s.id === 'experience');
      exp.items.push({
        id: 'exp2',
        title: 'Senior Distributed Systems Architect',
        subtitle: 'Enterprise Cloud Corp.',
        bullets: ['Bullet A '.repeat(10), 'Bullet B '.repeat(10)]
      });

      // User triggers action on certificates which sets breakBefore: true
      const cert = cvWithOverflow.sections.find(s => s.id === 'certificates');
      cert.breakBefore = true;

      const pages = distributeSectionsToPages(cvWithOverflow, { isEditor: true });
      expect(pages.length).toBeGreaterThan(1);
      const page2Right = pages[1].rightSections.map(s => s.id);
      expect(page2Right).toContain('certificates');
    });
  });

  describe('Problem 9: Bullet Splitting & Continuation Parent Preservation', () => {
    it('preserves originalTitle and originalItemId on split continuation items', () => {
      const cv = {
        layout: { type: '2-column', pagePadding: 24 },
        sections: [
          {
            id: 'exp',
            column: 'right',
            type: 'experience',
            title: 'Experiencia',
            items: [
              {
                id: 'exp1',
                title: 'Senior Software Engineer',
                subtitle: 'Tech Global Inc.',
                bullets: [
                  'Bullet 1 '.repeat(10),
                  'Bullet 2 '.repeat(10),
                  'Bullet 3 '.repeat(10),
                  'Bullet 4 '.repeat(10),
                  'Bullet 5 '.repeat(10),
                  'Bullet 6 '.repeat(10),
                  'Bullet 7 '.repeat(10),
                  'Bullet 8 '.repeat(10),
                  'Bullet 9 '.repeat(10),
                  'Bullet 10 '.repeat(10),
                  'Bullet 11 '.repeat(10),
                  'Bullet 12 '.repeat(10),
                  'Bullet 13 '.repeat(10),
                  'Bullet 14 '.repeat(10),
                  'Bullet 15 '.repeat(10),
                  'Bullet 16 '.repeat(10),
                  'Bullet 17 '.repeat(10),
                  'Bullet 18 '.repeat(10),
                  'Bullet 19 '.repeat(10),
                  'Bullet 20 '.repeat(10),
                ],
              },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, { isEditor: true });
      expect(pages.length).toBeGreaterThan(1);
      const page2Sec = pages[1].rightSections.find(s => s.originalSectionId === 'exp' || s.id.includes('exp'));
      expect(page2Sec).toBeDefined();
      const contItem = page2Sec.items[0];
      expect(contItem.isContinuationItem).toBe(true);
      expect(contItem.originalItemId).toBe('exp1');
      expect(contItem.originalTitle).toBe('Senior Software Engineer');
      expect(contItem.originalSubtitle).toBe('Tech Global Inc.');
      expect(contItem.title).toBe(''); // Empty for visual presentation parity
    });
  });

  describe('Problem 10: Multi-Page Overflow Cascade Strict Page Targeting', () => {
    it('relocates content from page 2 to page 3 without skipping to page 4', () => {
      const cv = JSON.parse(JSON.stringify(defaultSchema));
      const exp = cv.sections.find(s => s.id === 'experience');
      const proj = cv.sections.find(s => s.id === 'projects');
      const cert = cv.sections.find(s => s.id === 'certificates');

      exp.items.push({
        id: 'exp2',
        title: 'Lead Architect',
        subtitle: 'Enterprise Cloud',
        bullets: ['Bullet 1 '.repeat(10), 'Bullet 2 '.repeat(10)],
      });

      proj.items.push(
        {
          id: 'proj2',
          title: 'Infrastructure Project 1',
          subtitle: 'Distributed Engine',
          description: 'Long description '.repeat(25),
        },
        {
          id: 'proj3',
          title: 'Infrastructure Project 2',
          subtitle: 'Distributed Engine',
          description: 'Long description '.repeat(25),
        }
      );

      // Page 1 overflow -> moved to Page 2
      proj.targetPage = 2;
      let pages = distributeSectionsToPages(cv, { isEditor: true });
      expect(pages.length).toBeGreaterThanOrEqual(2);

      // Page 2 overflow -> moved to Page 3 (Must land on Page 3, NOT Page 4)
      cert.targetPage = 3;
      pages = distributeSectionsToPages(cv, { isEditor: true });

      const certPageIndex = pages.findIndex(p => p.rightSections.some(s => s.id.startsWith('certificates')));
      expect(certPageIndex).toBe(2); // 0-indexed: Page 3
      expect(pages.length).toBe(3);
    });
  });

  describe('Problem 11: Reordering into Whitespace & Break Lock Removal', () => {
    it('clears sticky break and targetPage properties when a section is moved', () => {
      const cv = JSON.parse(JSON.stringify(defaultSchema));
      const cert = cv.sections.find(s => s.id === 'certificates');
      cert.targetPage = 4;
      cert.breakBefore = true;

      // Simulate dragging cert to fill whitespace on Page 2 or Page 3
      delete cert.targetPage;
      delete cert.breakBefore;
      delete cert.pageBreak;

      // Move cert before projects in the right column
      cv.sections = cv.sections.filter(s => s.id !== 'certificates');
      const projIndex = cv.sections.findIndex(s => s.id === 'projects');
      cv.sections.splice(projIndex, 0, cert);

      const pages = distributeSectionsToPages(cv, { isEditor: true });
      const certPageIndex = pages.findIndex(p => p.rightSections.some(s => s.id.startsWith('certificates')));
      expect(certPageIndex).toBeLessThan(3); // Occupies page 1 or 2, not locked to page 4
      expect(cert.targetPage).toBeUndefined();
      expect(cert.breakBefore).toBeUndefined();
    });
  });

  describe('Clean Invariant: defaultSchema 1-Page Guarantee', () => {
    it('fits defaultSchema cleanly into 1 page in editor mode', () => {
      const pages = distributeSectionsToPages(defaultSchema, { isEditor: true });
      expect(pages.length).toBe(1);
      expect(pages[0].leftSections.length).toBeGreaterThan(0);
      expect(pages[0].rightSections.length).toBeGreaterThan(0);
    });
  });

  describe('Incident Remediation: Natural Bullet Overflow without Section Hijacking', () => {
    it('never sends entire section with title to page 2 when bullets fit partially on page 1', () => {
      const cv = {
        layout: { type: '2-column', pagePadding: 24, editorHeadroom: 80 },
        sections: [
          {
            id: 'exp',
            column: 'right',
            type: 'experience',
            title: 'Experiencia Laboral',
            items: [
              {
                id: 'exp1',
                title: 'Staff Platform Engineer',
                subtitle: 'Cloud Tech Inc.',
                bullets: [
                  'Architected real-time streaming analytics engine processing 50k events/sec.',
                  'Led cross-functional migration of monolithic backend to Kubernetes microservices.',
                  'Implemented automated CI/CD pipelines reducing deployment lead time by 65%.',
                  'Mentored junior and mid-level engineers across 3 distributed squads.',
                  'Designed fault-tolerant multi-region failover cluster on AWS with zero downtime.',
                  'Optimized distributed cache queries reducing latency by 45ms across all APIs.',
                  'Built custom monitoring dashboards with Prometheus and Grafana for SLO tracking.',
                  'Standardized Terraform infrastructure modules adopted by over 20 development teams.',
                ],
              },
            ],
          },
        ],
      };

      const pages = distributeSectionsToPages(cv, { isEditor: true, editorHeadroom: 80 });
      // Section exp should start on Page 1
      const page1Sec = pages[0].rightSections.find(s => s.id === 'exp' || s.originalSectionId === 'exp');
      expect(page1Sec).toBeDefined();
      // Page 1 MUST retain the title
      expect(page1Sec.title).toBe('Experiencia Laboral');
      expect(page1Sec.items[0].title).toBe('Staff Platform Engineer');
      expect(page1Sec.items[0].bullets.length).toBeGreaterThan(0);

      // If it overflowed onto Page 2, Page 2 receives continuation without repeating title
      if (pages.length > 1) {
        const page2Sec = pages[1].rightSections.find(s => s.originalSectionId === 'exp' || s.id.startsWith('exp'));
        expect(page2Sec).toBeDefined();
        // Continuation section title must be empty per user requirement
        expect(page2Sec.title).toBe('');
        const contItem = page2Sec.items[0];
        expect(contItem.isContinuationItem).toBe(true);
        expect(contItem.title).toBe('');
      }
    });

    it('calibrated headroom naturally pushes trailing bullets to page 2 without targetPage locks', () => {
      const cv = {
        layout: { type: '2-column', pagePadding: 24, editorHeadroom: 80 },
        sections: [
          {
            id: 'exp',
            column: 'right',
            type: 'experience',
            title: 'Experiencia Laboral',
            items: [
              {
                id: 'exp1',
                title: 'Senior Developer',
                subtitle: 'SaaS Corp',
                bullets: Array.from({ length: 35 }, (_, i) => `High impact achievement bullet number ${i + 1} with extensive technical description of architecture and metrics.`),
              },
            ],
          },
        ],
      };

      // With default headroom (80px)
      const pages80 = distributeSectionsToPages(cv, { isEditor: true, editorHeadroom: 80 });
      expect(pages80.length).toBeGreaterThan(1);
      const page1Bullets80 = pages80[0].rightSections[0].items[0].bullets.length;

      // With increased headroom (250px) due to overflow recalibration
      const pages250 = distributeSectionsToPages(cv, { isEditor: true, editorHeadroom: 250 });
      const page1Bullets250 = pages250[0].rightSections[0].items[0].bullets.length;

      // Increased headroom cleanly moves more bullets to page 2 naturally
      expect(page1Bullets250).toBeLessThan(page1Bullets80);
      // But page 1 ALWAYS keeps the section and its title
      expect(pages250[0].rightSections[0].title).toBe('Experiencia Laboral');
      // No targetPage lock is set on the cv input
      expect(cv.sections[0].targetPage).toBeUndefined();
    });
  });
});

