import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
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

  describe('Clean Invariant: defaultSchema 1-Page Guarantee', () => {
    it('fits defaultSchema cleanly into 1 page in editor mode', () => {
      const pages = distributeSectionsToPages(defaultSchema, { isEditor: true });
      expect(pages.length).toBe(1);
      expect(pages[0].leftSections.length).toBeGreaterThan(0);
      expect(pages[0].rightSections.length).toBeGreaterThan(0);
    });
  });
});
