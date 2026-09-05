import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import App from '../App';
import { CVProvider, useCV } from '../context/CVContext';
import { defaultSchema, defaultLayout } from '../utils/schema';
import { 
  generateCleanPrintHTML, 
  calculatePrintScale, 
  escapeHTML 
} from '../utils/staticHtmlPdfEngine';

// Context controller helper for fine-grained empirical control
const EmpiricalControlHarness = ({ onReady }) => {
  const cv = useCV();
  React.useEffect(() => {
    if (onReady) onReady(cv);
  }, [cv, onReady]);

  return (
    <div data-testid="empirical-harness">
      <span data-testid="cur-layout">{cv.cvData?.layout?.type}</span>
      <span data-testid="cur-font">{cv.cvData?.layout?.fontFamily}</span>
      <span data-testid="cur-scale">{cv.cvData?.layout?.fontScale}</span>
      <span data-testid="cur-line-height">{cv.cvData?.layout?.lineHeight}</span>
      <span data-testid="cur-padding">{cv.cvData?.layout?.pagePadding}</span>
      <span data-testid="cur-section-gap">{cv.cvData?.layout?.sectionGap}</span>
      <span data-testid="cur-item-gap">{cv.cvData?.layout?.itemGap}</span>
    </div>
  );
};

describe('Empirical Challenger Deep Audit: DOM Geometry, Typography & Clean Print PDF', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // MISSION 1: Container Geometry (1-Col vs 2-Col Mode)
  // =========================================================================
  describe('Mission 1: Container Geometry in 1-column mode vs 2-column mode', () => {
    it('EMP-GEO-1: 1-column mode container has max-width: 840px, display: block, and margin: 0 auto', () => {
      let cvContext;
      const { container } = render(
        <CVProvider>
          <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
          <App />
        </CVProvider>
      );

      act(() => {
        cvContext.updateLayout('type', '1-column');
      });

      const areaCV = container.querySelector('#area-cv');
      expect(areaCV).not.toBeNull();
      expect(areaCV.style.display).toBe('block');
      expect(areaCV.style.maxWidth).toBe('840px');
      expect(areaCV.style.width).toBe('100%');
      expect(areaCV.style.margin).toBe('0px auto');
      expect(areaCV.style.padding).toBe('var(--page-padding, 24px)');

      const singleColWrapper = container.querySelector('.resume__single-column');
      expect(singleColWrapper).not.toBeNull();
      expect(singleColWrapper.style.maxWidth).toBe('840px');
      expect(singleColWrapper.style.width).toBe('100%');
      expect(singleColWrapper.style.margin).toBe('0px auto');
    });

    it('EMP-GEO-2: 2-column mode container has max-width: 1024px, display: grid, and gridTemplateColumns: 1fr 2fr', () => {
      let cvContext;
      const { container } = render(
        <CVProvider>
          <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
          <App />
        </CVProvider>
      );

      act(() => {
        cvContext.updateLayout('type', '2-column');
      });

      const areaCV = container.querySelector('#area-cv');
      expect(areaCV).not.toBeNull();
      expect(areaCV.style.display).toBe('grid');
      expect(areaCV.style.gridTemplateColumns).toBe('1fr 2fr');
      expect(areaCV.style.maxWidth).toBe('1024px');
      expect(areaCV.style.width).toBe('100%');
      expect(areaCV.style.margin).toBe('0px auto');

      const leftCol = container.querySelector('.resume__left');
      const rightCol = container.querySelector('.resume__right');
      expect(leftCol).not.toBeNull();
      expect(rightCol).not.toBeNull();
    });

    it('EMP-GEO-3: Rapid 50x toggling between 1-col and 2-col preserves structural integrity', () => {
      let cvContext;
      const { container } = render(
        <CVProvider>
          <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
          <App />
        </CVProvider>
      );

      for (let i = 0; i < 50; i++) {
        act(() => {
          cvContext.updateLayout('type', i % 2 === 0 ? '1-column' : '2-column');
        });
      }

      // After 50 iterations (odd index 49 is 2-column)
      const areaCV = container.querySelector('#area-cv');
      expect(areaCV).not.toBeNull();
      expect(areaCV.style.display).toBe('grid');
      expect(cvContext.cvData.sections.length).toBeGreaterThanOrEqual(6);
    });
  });

  // =========================================================================
  // MISSION 2: Dynamic Typography Variable Calculations
  // =========================================================================
  describe('Mission 2: Dynamic Typography Variable Calculation across Scales and Line Heights', () => {
    const scales = [0.85, 1.0, 1.25];
    const lineHeights = [1.25, 1.45, 1.85];

    scales.forEach(scale => {
      lineHeights.forEach(lh => {
        it(`EMP-TYPO-CALC: scale=${scale}, lineHeight=${lh} propagates exact CSS custom properties on #area-cv`, () => {
          let cvContext;
          const { container } = render(
            <CVProvider>
              <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
              <App />
            </CVProvider>
          );

          act(() => {
            cvContext.updateLayout('fontScale', scale);
            cvContext.updateLayout('lineHeight', lh);
          });

          const areaCV = container.querySelector('#area-cv');
          expect(areaCV.style.getPropertyValue('--font-scale')).toBe(`${scale}`);
          expect(areaCV.style.getPropertyValue('--line-height')).toBe(`${lh}`);
        });
      });
    });

    it('EMP-TYPO-BOUND: Extreme scale values (0.5 and 2.0) are handled safely without NaN or layout crashes', () => {
      let cvContext;
      const { container } = render(
        <CVProvider>
          <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
          <App />
        </CVProvider>
      );

      act(() => {
        cvContext.updateLayout('fontScale', 0.5);
        cvContext.updateLayout('lineHeight', 2.0);
      });

      const areaCV = container.querySelector('#area-cv');
      expect(areaCV.style.getPropertyValue('--font-scale')).toBe('0.5');
      expect(areaCV.style.getPropertyValue('--line-height')).toBe('2');
    });
  });

  // =========================================================================
  // MISSION 3: Font Family Propagation across All 5 Fonts
  // =========================================================================
  describe('Mission 3: Font Family Propagation (Poppins, Inter, Roboto, Merriweather, JetBrains Mono)', () => {
    const fonts = [
      { name: 'Poppins', expected: "'Poppins', sans-serif" },
      { name: 'Inter', expected: "'Inter', sans-serif" },
      { name: 'Roboto', expected: "'Roboto', sans-serif" },
      { name: 'Merriweather', expected: "'Merriweather', serif" },
      { name: 'JetBrains Mono', expected: "'JetBrains Mono', monospace" }
    ];

    fonts.forEach(({ name, expected }) => {
      it(`EMP-FONT: Selecting font "${name}" updates #area-cv --body-font to "${expected}"`, () => {
        let cvContext;
        const { container } = render(
          <CVProvider>
            <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
            <App />
          </CVProvider>
        );

        act(() => {
          cvContext.updateLayout('fontFamily', name);
        });

        const areaCV = container.querySelector('#area-cv');
        expect(areaCV.style.getPropertyValue('--body-font')).toBe(expected);
      });
    });
  });

  // =========================================================================
  // MISSION 4: Static HTML PDF Engine Verification
  // =========================================================================
  describe('Mission 4: Static HTML PDF Engine (generateCleanPrintHTML & calculatePrintScale)', () => {
    it('EMP-PDF-1: generateCleanPrintHTML generates valid standalone HTML containing all CSS tokens', () => {
      const customCV = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          fontFamily: 'JetBrains Mono',
          fontScale: 1.15,
          lineHeight: 1.65,
          pagePadding: 32,
          sectionGap: 24,
          itemGap: 12
        }
      };

      const html = generateCleanPrintHTML(customCV);
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html lang="es">');
      expect(html).toContain('--page-padding: 32px;');
      expect(html).toContain('--section-gap: 24px;');
      expect(html).toContain('--item-gap: 12px;');
      expect(html).toContain("--body-font: 'JetBrains Mono', monospace;");
      expect(html).toContain('--font-scale: 1.15;');
      expect(html).toContain('--line-height: 1.65;');
      expect(html).toContain('--h1-font-size: calc(1.5rem * var(--font-scale, 1));');
      expect(html).toContain('--h2-font-size: calc(1.25rem * var(--font-scale, 1));');
      expect(html).toContain('--h3-font-size: calc(1rem * var(--font-scale, 1));');
      expect(html).toContain('--normal-font-size: calc(0.938rem * var(--font-scale, 1));');
      expect(html).toContain('--small-font-size: calc(0.875rem * var(--font-scale, 1));');
      expect(html).toContain('--smaller-font-size: calc(0.813rem * var(--font-scale, 1));');
    });

    it('EMP-PDF-2: generateCleanPrintHTML contains exactly 0 editor UI artifacts and interactive buttons', () => {
      const html = generateCleanPrintHTML(defaultSchema);
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Assert zero interactive editor elements
      expect(doc.querySelectorAll('.drag-handle').length).toBe(0);
      expect(doc.querySelectorAll('.section-drag-handle').length).toBe(0);
      expect(doc.querySelectorAll('.item-drag-handle').length).toBe(0);
      expect(doc.querySelectorAll('.round-btn-add').length).toBe(0);
      expect(doc.querySelectorAll('.round-btn-del').length).toBe(0);
      expect(doc.querySelectorAll('.add-section-btn').length).toBe(0);
      expect(doc.querySelectorAll('.section-del-btn').length).toBe(0);
      expect(doc.querySelectorAll('.item-del-btn').length).toBe(0);
      expect(doc.querySelectorAll('.suggestion-tooltip').length).toBe(0);
      expect(doc.querySelectorAll('.obsidian-callout').length).toBe(0);
      expect(doc.querySelectorAll('.inline-input').length).toBe(0);
      expect(doc.querySelectorAll('button').length).toBe(0);
      expect(doc.querySelectorAll('input').length).toBe(0);
      expect(doc.querySelectorAll('.no-print').length).toBe(0);
    });

    it('EMP-PDF-3: generateCleanPrintHTML enforces strict break-inside: avoid !important rules in style block', () => {
      const html = generateCleanPrintHTML(defaultSchema);
      expect(html).toMatch(/\.cv-section[\s\S]*break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.cv-section[\s\S]*page-break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.cv-block[\s\S]*break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.experience__content[\s\S]*break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.education__content[\s\S]*break-inside:\s*avoid\s*!important/);
      expect(html).toMatch(/\.skills__name[\s\S]*break-inside:\s*avoid\s*!important/);
    });

    it('EMP-PDF-4: calculatePrintScale scales and clamps correctly to [0.75, 1.0] across height bounds', () => {
      // Below 2 A4 pages height (<= 2246px) -> 1.0
      expect(calculatePrintScale(1000)).toBe(1.0);
      expect(calculatePrintScale(2246)).toBe(1.0);

      // Above 2 A4 pages height -> 2246 / height
      expect(calculatePrintScale(2500)).toBeCloseTo(2246 / 2500, 2);
      expect(calculatePrintScale(2800)).toBeCloseTo(2246 / 2800, 2);

      // Extreme document height clamped to 0.75 floor
      expect(calculatePrintScale(3500)).toBe(0.75);
      expect(calculatePrintScale(5000)).toBe(0.75);
      expect(calculatePrintScale(100000)).toBe(0.75);

      // Edge inputs (0, negative, undefined, null)
      expect(calculatePrintScale(0)).toBe(1.0);
      expect(calculatePrintScale(-500)).toBe(1.0);
      expect(calculatePrintScale(null)).toBe(1.0);
      expect(calculatePrintScale(undefined)).toBe(1.0);
    });

    it('EMP-PDF-5: generateCleanPrintHTML in 1-column mode formats container with 840px max-width', () => {
      const singleColData = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          type: '1-column',
          pagePadding: 30
        }
      };

      const html = generateCleanPrintHTML(singleColData);
      expect(html).toContain('class="resume resume__single-column"');
      expect(html).toContain('max-width: 840px;');
      expect(html).toContain('margin: 0 auto;');
      expect(html).toContain('padding: var(--page-padding, 24px);');
    });

    it('EMP-PDF-6: generateCleanPrintHTML sanitizes XSS injection across all 6 section types', () => {
      const maliciousCV = {
        profile: {
          name: '<script>alert("xss")</script>',
          subtitle: '<img src=x onerror=alert(1)>',
          location: '"><script>alert(2)</script>',
          email: 'test@example.com',
          phone: '+123456789',
          linkedin: 'linkedin.com/in/malicious',
          github: 'github.com/malicious'
        },
        sections: [
          {
            id: 'profile_header',
            type: 'profile_header',
            column: 'left',
            items: [{
              id: 'p1',
              name: '<script>alert("xss")</script>',
              subtitle: '<img src=x onerror=alert(1)>'
            }]
          },
          {
            id: 'about',
            type: 'about',
            title: 'Perfil <script>alert("title")</script>',
            column: 'left',
            items: [{ id: 'a1', description: 'Malicious <b>bold</b> & <script>alert("about")</script>' }]
          },
          {
            id: 'skills',
            type: 'skills',
            title: 'Habilidades',
            column: 'left',
            items: [{ id: 's1', title: 'JS<script>', description: 'Node<script>' }]
          },
          {
            id: 'simple_list',
            type: 'simple_list',
            title: 'Idiomas',
            column: 'left',
            items: [{ id: 'l1', text: 'Español <script>alert("lang")</script>' }]
          },
          {
            id: 'education',
            type: 'education',
            title: 'Educación',
            column: 'right',
            items: [{ id: 'e1', title: 'Uni<script>', subtitle: 'Degree<script>', date: '2020<script>' }]
          },
          {
            id: 'experience',
            type: 'list',
            title: 'Experiencia',
            column: 'right',
            items: [{ 
              id: 'x1', 
              title: 'Dev<script>', 
              subtitle: 'Corp<script>', 
              date: '2022', 
              description: 'Desc<script>',
              bullets: ['Bullet 1 <script>', 'Bullet 2 & special "quote"']
            }]
          }
        ]
      };

      const html = generateCleanPrintHTML(maliciousCV);
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x onerror');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;quote&quot;');
    });
  });

  // =========================================================================
  // MISSION 5: Spacing Controls & Boundary Stress
  // =========================================================================
  describe('Mission 5: Dynamic Spacing Controls & Boundary Robustness', () => {
    const spacingBoundaries = [
      { padding: 0, secGap: 0, itemGap: 0 },
      { padding: 60, secGap: 50, itemGap: 30 },
      { padding: 24, secGap: 20, itemGap: 8 }
    ];

    spacingBoundaries.forEach(({ padding, secGap, itemGap }) => {
      it(`EMP-SPACING-BOUND: pagePadding=${padding}px, sectionGap=${secGap}px, itemGap=${itemGap}px reflects on DOM and print HTML`, () => {
        let cvContext;
        const { container } = render(
          <CVProvider>
            <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
            <App />
          </CVProvider>
        );

        act(() => {
          cvContext.updateLayout('pagePadding', padding);
          cvContext.updateLayout('sectionGap', secGap);
          cvContext.updateLayout('itemGap', itemGap);
        });

        const areaCV = container.querySelector('#area-cv');
        expect(areaCV.style.getPropertyValue('--page-padding')).toBe(`${padding}px`);
        expect(areaCV.style.getPropertyValue('--section-gap')).toBe(`${secGap}px`);
        expect(areaCV.style.getPropertyValue('--item-gap')).toBe(`${itemGap}px`);

        const printHTML = generateCleanPrintHTML(cvContext.cvData);
        expect(printHTML).toContain(`--page-padding: ${padding}px;`);
        expect(printHTML).toContain(`--section-gap: ${secGap}px;`);
        expect(printHTML).toContain(`--item-gap: ${itemGap}px;`);
      });
    });
  });

  // =========================================================================
  // MISSION 6: Structural Invariants & Data Integrity
  // =========================================================================
  describe('Mission 6: Structural Invariants & Data Integrity', () => {
    it('EMP-INTEG-1: Profile header section is strictly protected against accidental deletion', () => {
      let cvContext;
      render(
        <CVProvider>
          <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
          <App />
        </CVProvider>
      );

      const initialCount = cvContext.cvData.sections.length;
      act(() => {
        cvContext.deleteSection('profile_header');
      });

      expect(cvContext.cvData.sections.length).toBe(initialCount);
      expect(cvContext.cvData.sections.find(s => s.id === 'profile_header')).toBeDefined();
    });

    it('EMP-INTEG-2: YIQ contrast color calculation appropriately adapts text colors for dark and light backgrounds', () => {
      let cvContext;
      const { container } = render(
        <CVProvider>
          <EmpiricalControlHarness onReady={(c) => { cvContext = c; }} />
          <App />
        </CVProvider>
      );

      // Dark background for left column
      act(() => {
        cvContext.updateLayout('leftBg', '#1e293b');
      });

      const leftCol = container.querySelector('.resume__left');
      expect(leftCol.style.getPropertyValue('--title-color')).toBe('#fcfcfc');
      expect(leftCol.style.getPropertyValue('--text-color')).toBe('#f0efef');

      // Light background for left column
      act(() => {
        cvContext.updateLayout('leftBg', '#ffffff');
      });
      expect(leftCol.style.getPropertyValue('--title-color')).toBe('#0b0a0a');
      expect(leftCol.style.getPropertyValue('--text-color')).toBe('#403a3a');
    });
  });
});

