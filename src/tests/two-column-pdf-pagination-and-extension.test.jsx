import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { 
  generateCleanPrintHTML, 
  enforceTwoColumnComponentPagination,
  executeCleanPrint
} from '../utils/staticHtmlPdfEngine';
import { defaultSchema } from '../utils/schema';
import App from '../App';
import { CVProvider } from '../context/CVContext';

describe('Goal: 2-Column PDF Generation Integrity & Full-Page Left Column Extension', () => {

  describe('1. Simultaneous Component Boundary-Crossing Page Break Control', () => {
    let container;
    let areaCv;
    let leftCol;
    let rightCol;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'test-container';
      document.body.appendChild(container);

      areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';
      areaCv.style.display = 'grid';
      areaCv.style.gridTemplateColumns = '33.33% 66.67%';
      areaCv.style.minHeight = '297mm';
      areaCv.style.background = 'linear-gradient(to right, #f3f4f6 0%, #f3f4f6 33.33%, #ffffff 33.33%, #ffffff 100%)';

      leftCol = document.createElement('div');
      leftCol.className = 'resume__left';
      leftCol.style.background = '#f3f4f6';

      rightCol = document.createElement('div');
      rightCol.className = 'resume__right';
      rightCol.style.background = '#ffffff';

      areaCv.appendChild(leftCol);
      areaCv.appendChild(rightCol);
      container.appendChild(areaCv);
    });

    afterEach(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    it('1.1: cleanly pushes an element in the left column to the next page when it straddles the A4 boundary', () => {
      // Mock getBoundingClientRect for areaCv
      areaCv.getBoundingClientRect = vi.fn(() => ({ top: 0, bottom: 2000, height: 2000, left: 0, right: 794, width: 794 }));

      // Section in left column with an item straddling 1123px (top: 1080px, bottom: 1160px)
      const secLeft = document.createElement('section');
      secLeft.className = 'section cv-section';
      
      const item1 = document.createElement('div');
      item1.className = 'cv-block profile__description';
      item1.getBoundingClientRect = vi.fn(() => ({ top: 50, bottom: 250, height: 200 }));

      const straddlingLeftItem = document.createElement('div');
      straddlingLeftItem.className = 'cv-block skills__name';
      straddlingLeftItem.getBoundingClientRect = vi.fn(() => ({ top: 1080, bottom: 1160, height: 80 }));

      secLeft.appendChild(item1);
      secLeft.appendChild(straddlingLeftItem);
      leftCol.appendChild(secLeft);

      // Right column has safe items
      const secRight = document.createElement('section');
      secRight.className = 'section cv-section';
      const safeRightItem = document.createElement('div');
      safeRightItem.className = 'cv-block experience__content';
      safeRightItem.getBoundingClientRect = vi.fn(() => ({ top: 50, bottom: 600, height: 550 }));
      secRight.appendChild(safeRightItem);
      rightCol.appendChild(secRight);

      // Mock scrollHeight
      Object.defineProperty(leftCol, 'scrollHeight', { value: 1300, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 600, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 1300, configurable: true });

      const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(straddlingLeftItem.getAttribute('data-page-break-forced')).toBe('true');
      expect(straddlingLeftItem.getAttribute('data-page-break-column')).toBe('left');
      expect(straddlingLeftItem.classList.contains('force-page-break-before')).toBe(true);
      expect(straddlingLeftItem.style.breakBefore).toBe('page');
      expect(straddlingLeftItem.style.pageBreakBefore).toBe('always');

      // Right item was safe so it should not have forced break
      expect(safeRightItem.getAttribute('data-page-break-forced')).toBeNull();
    });

    it('1.2: cleanly pushes an element in the right column to the next page when it straddles the A4 boundary', () => {
      areaCv.getBoundingClientRect = vi.fn(() => ({ top: 0, bottom: 2000, height: 2000, left: 0, right: 794, width: 794 }));

      // Left column has safe items
      const secLeft = document.createElement('section');
      secLeft.className = 'section cv-section';
      const safeLeftItem = document.createElement('div');
      safeLeftItem.className = 'cv-block simple-list-item';
      safeLeftItem.getBoundingClientRect = vi.fn(() => ({ top: 50, bottom: 400, height: 350 }));
      secLeft.appendChild(safeLeftItem);
      leftCol.appendChild(secLeft);

      // Right column has an experience card straddling 1123px (top: 1050, bottom: 1200)
      const secRight = document.createElement('section');
      secRight.className = 'section cv-section';
      const straddlingRightItem = document.createElement('div');
      straddlingRightItem.className = 'cv-block experience__content';
      straddlingRightItem.getBoundingClientRect = vi.fn(() => ({ top: 1050, bottom: 1200, height: 150 }));
      secRight.appendChild(straddlingRightItem);
      rightCol.appendChild(secRight);

      Object.defineProperty(leftCol, 'scrollHeight', { value: 400, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 1500, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 1500, configurable: true });

      const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(straddlingRightItem.getAttribute('data-page-break-forced')).toBe('true');
      expect(straddlingRightItem.getAttribute('data-page-break-column')).toBe('right');
      expect(straddlingRightItem.classList.contains('force-page-break-before')).toBe(true);
      expect(straddlingRightItem.style.breakBefore).toBe('page');
      expect(straddlingRightItem.style.pageBreakBefore).toBe('always');

      expect(safeLeftItem.getAttribute('data-page-break-forced')).toBeNull();
    });

    it('1.3: simultaneously evaluates and pushes straddling elements in BOTH columns in the same pass', () => {
      areaCv.getBoundingClientRect = vi.fn(() => ({ top: 0, bottom: 2000, height: 2000, left: 0, right: 794, width: 794 }));

      // Left column straddling item at fold 1123
      const secLeft = document.createElement('section');
      secLeft.className = 'section cv-section';
      const straddlingLeftItem = document.createElement('div');
      straddlingLeftItem.className = 'cv-block skills__name';
      straddlingLeftItem.getBoundingClientRect = vi.fn(() => ({ top: 1100, bottom: 1180, height: 80 }));
      secLeft.appendChild(straddlingLeftItem);
      leftCol.appendChild(secLeft);

      // Right column straddling item at fold 1123
      const secRight = document.createElement('section');
      secRight.className = 'section cv-section';
      const straddlingRightItem = document.createElement('div');
      straddlingRightItem.className = 'cv-block education__content';
      straddlingRightItem.getBoundingClientRect = vi.fn(() => ({ top: 1060, bottom: 1220, height: 160 }));
      secRight.appendChild(straddlingRightItem);
      rightCol.appendChild(secRight);

      Object.defineProperty(leftCol, 'scrollHeight', { value: 1400, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 1600, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 1600, configurable: true });

      const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(straddlingLeftItem.getAttribute('data-page-break-forced')).toBe('true');
      expect(straddlingLeftItem.getAttribute('data-page-break-column')).toBe('left');
      expect(straddlingRightItem.getAttribute('data-page-break-forced')).toBe('true');
      expect(straddlingRightItem.getAttribute('data-page-break-column')).toBe('right');
      expect(result.breaksApplied.length).toBeGreaterThanOrEqual(2);
    });

    it('1.4: prevents orphaned section titles located near the bottom of a page fold', () => {
      areaCv.getBoundingClientRect = vi.fn(() => ({ top: 0, bottom: 2000, height: 2000, left: 0, right: 794, width: 794 }));

      // Section title in right column ending at 1110px (only 13px before 1123px fold)
      const secRight = document.createElement('section');
      secRight.className = 'section cv-section';
      const orphanTitle = document.createElement('h2');
      orphanTitle.className = 'section-title';
      orphanTitle.getBoundingClientRect = vi.fn(() => ({ top: 1080, bottom: 1110, height: 30 }));

      secRight.appendChild(orphanTitle);
      rightCol.appendChild(secRight);

      Object.defineProperty(leftCol, 'scrollHeight', { value: 500, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 1400, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 1400, configurable: true });

      enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(orphanTitle.getAttribute('data-page-break-forced')).toBe('true');
      expect(orphanTitle.classList.contains('force-page-break-before')).toBe(true);
    });
  });

  describe('2. Left Column Full-Page Extension (Current A4 Sheet Completeness)', () => {
    let container;
    let areaCv;
    let leftCol;
    let rightCol;

    beforeEach(() => {
      container = document.createElement('div');
      container.id = 'test-container-2';
      document.body.appendChild(container);

      areaCv = document.createElement('div');
      areaCv.id = 'area-cv';
      areaCv.className = 'resume bd-grid';
      areaCv.style.display = 'grid';

      leftCol = document.createElement('div');
      leftCol.className = 'resume__left';
      leftCol.style.background = '#f1f5f9';

      rightCol = document.createElement('div');
      rightCol.className = 'resume__right';
      rightCol.style.background = '#ffffff';

      areaCv.appendChild(leftCol);
      areaCv.appendChild(rightCol);
      container.appendChild(areaCv);
    });

    afterEach(() => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    it('2.1: extends left column and #area-cv to 594mm (2 full pages) when right column creates page 2', () => {
      // Left column only has 400px of content (Page 1)
      Object.defineProperty(leftCol, 'scrollHeight', { value: 400, configurable: true });
      // Right column has 1600px of content (overflows into Page 2)
      Object.defineProperty(rightCol, 'scrollHeight', { value: 1600, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 1600, configurable: true });

      const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(result.totalPages).toBe(2);
      expect(result.targetHeightMm).toBe(594);

      // Verify #area-cv was extended to 594mm
      expect(areaCv.style.minHeight).toBe('594mm');
      expect(areaCv.style.getPropertyValue('--print-target-height-mm')).toBe('594mm');
      expect(areaCv.style.getPropertyValue('--print-total-pages')).toBe('2');

      // Verify .resume__left was extended to 594mm and stretched
      expect(leftCol.style.minHeight).toBe('594mm');
      expect(leftCol.style.height).toBe('100%');
      expect(leftCol.style.alignSelf).toBe('stretch');

      // Verify .resume__right was extended to 594mm
      expect(rightCol.style.minHeight).toBe('594mm');
      expect(rightCol.style.height).toBe('100%');
      expect(rightCol.style.alignSelf).toBe('stretch');
    });

    it('2.2: extends left column and #area-cv to 891mm (3 full pages) when content requires 3 pages', () => {
      // Content reaches 2600px -> 3 pages
      Object.defineProperty(leftCol, 'scrollHeight', { value: 900, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 2600, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 2600, configurable: true });

      const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(result.totalPages).toBe(3);
      expect(result.targetHeightMm).toBe(891);
      expect(areaCv.style.minHeight).toBe('891mm');
      expect(leftCol.style.minHeight).toBe('891mm');
      expect(rightCol.style.minHeight).toBe('891mm');
    });

    it('2.3: keeps 297mm (1 full page) when document fits within single page', () => {
      Object.defineProperty(leftCol, 'scrollHeight', { value: 650, configurable: true });
      Object.defineProperty(rightCol, 'scrollHeight', { value: 980, configurable: true });
      Object.defineProperty(areaCv, 'scrollHeight', { value: 980, configurable: true });

      const result = enforceTwoColumnComponentPagination(document, areaCv, 1123);

      expect(result.totalPages).toBe(1);
      expect(result.targetHeightMm).toBe(297);
      expect(areaCv.style.minHeight).toBe('297mm');
      expect(leftCol.style.minHeight).toBe('297mm');
    });
  });

  describe('3. Static HTML Generator & CSS Rules for 2-Column Mode', () => {
    it('3.1: generates print HTML with full-page variable and stretch attributes for 2-column mode', () => {
      const cvData2Col = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '2-column',
          leftBg: '#1e293b',
          rightBg: '#ffffff'
        }
      };

      const html = generateCleanPrintHTML(cvData2Col);

      // Check structure
      expect(html).toContain('class="resume" id="area-cv"');
      expect(html).toContain('class="resume__left"');
      expect(html).toContain('class="resume__right"');

      // Check @media print rules
      expect(html).toContain('var(--print-target-height-mm, 297mm)');
      expect(html).toContain('align-self: stretch !important;');
      expect(html).toContain('box-decoration-break: slice !important;');

      // Check break-inside avoid on all component types
      expect(html).toMatch(/\.cv-block[\s\S]*?break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.experience__content[\s\S]*?break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.education__content[\s\S]*?break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.skills__name[\s\S]*?break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.simple-list-item[\s\S]*?break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.profile__description[\s\S]*?break-inside:\s*avoid\s*!important/);

      // Check force-page-break-before utility class
      expect(html).toContain('.force-page-break-before');
      expect(html).toMatch(/\.force-page-break-before\s*\{[\s\S]*?break-before:\s*page\s*!important/);
    });

    it('3.2: does not leak 2-column selectors in 1-column single column print HTML', () => {
      const cvData1Col = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '1-column',
          isAtsMode: true
        }
      };

      const html = generateCleanPrintHTML(cvData1Col);
      expect(html).toContain('resume__single-column');
      expect(html).not.toContain('resume__left');
      expect(html).not.toContain('resume__right');
    });
  });

  describe('4. Live Editor Component Layout Extension (App.jsx)', () => {
    it('4.1: renders 2-column layout with alignItems: stretch and column-left id for continuous height', () => {
      const { container } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const areaCv = container.querySelector('#area-cv');
      expect(areaCv).not.toBeNull();
      const pageBox = container.querySelector('.a4-page-box') || areaCv;
      expect(pageBox.style.display).toBe('grid');
      expect(pageBox.style.alignItems).toBe('stretch');
      expect(pageBox.style.minHeight).toContain('mm');

      const colLeft = container.querySelector('#column-left');
      expect(colLeft).not.toBeNull();
      expect(colLeft.classList.contains('resume__left')).toBe(true);
      expect(colLeft.style.minHeight).toBe('100%');
      expect(colLeft.style.height).toBe('100%');
      expect(colLeft.style.alignSelf).toBe('stretch');
    });
  });
});
