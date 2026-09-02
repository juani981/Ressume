import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render } from '@testing-library/react';
import { 
  generateCleanPrintHTML, 
  calculatePrintScale, 
  escapeHTML, 
  executeCleanPrint 
} from '../utils/staticHtmlPdfEngine';
import SuggestionTooltip from '../components/Editor/SuggestionTooltip';
import { CVProvider } from '../context/CVContext';
import { defaultSchema } from '../utils/schema';

describe('CHALLENGER 2: Empirical Stress Test Suite (PDF/Print Engine, Auto-Scaler, Dynamic Tooltips)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // Section 1: PDF & Print Engine (R5) Isolation & CSS Verification
  // =========================================================================
  describe('1. PDF & Print Engine (R5) - Deep Artifact & CSS Rule Stress Testing', () => {
    it('1.1: Generates valid HTML5 with zero interactive editor UI classes under complex multi-section CV', () => {
      const complexCV = {
        ...defaultSchema,
        profile: { name: 'Dr. Jane Doe' },
        layout: {
          type: '2-column',
          leftBg: '#1e293b',
          rightBg: '#ffffff',
          pagePadding: 30,
          sectionGap: 25,
          itemGap: 12
        },
        sections: [
          ...defaultSchema.sections,
          {
            id: 'custom_rnd_section',
            column: 'right',
            type: 'list',
            title: 'INVESTIGACIÓN Y PATENTES',
            items: [
              {
                id: 'rnd_1',
                title: 'Algoritmo de Auto-Escalado PDF',
                subtitle: 'Laboratorio de Sistemas Distribuidos',
                date: '2024 - 2026',
                link: 'https://example.com/patent',
                description: 'Diseño de un motor estático con prevención de corte de página.',
                bullets: ['Punto 1 con métricas', 'Punto 2 con optimización']
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(complexCV);

      // Verify HTML5 DOCTYPE and structure
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
      expect(html).toContain('<head>');
      expect(html).toContain('<body>');
      expect(html).toContain('Dr. Jane Doe');

      // VERIFY STRICT ABSENCE OF ALL EDITOR ARTIFACTS
      const forbiddenClasses = [
        'drag-handle',
        'round-btn-del',
        'round-btn-add',
        'suggestion-tooltip',
        'inline-input',
        'editable-section-container',
        'editable-item-container',
        'section-del-btn',
        'item-del-btn',
        'section-add-container',
        'action-menu',
        'no-print'
      ];

      forbiddenClasses.forEach(forbidden => {
        expect(html).not.toContain(forbidden);
      });

      // Verify no form elements or contenteditable attributes in body
      expect(html).not.toMatch(/<input\b[^>]*>/i);
      expect(html).not.toMatch(/<button\b[^>]*>/i);
      expect(html).not.toMatch(/contenteditable/i);
    });

    it('1.2: Verifies CSS pagination, @page, @media print, and super-container break-inside rules', () => {
      const html = generateCleanPrintHTML(defaultSchema);

      // Verify @page rule with A4 size and 0 margin
      expect(html).toMatch(/@page\s*\{\s*size:\s*A4;\s*margin:\s*0;\s*\}/i);

      // Verify @media print block
      expect(html).toMatch(/@media\s+print\s*\{/i);
      expect(html).toMatch(/-webkit-print-color-adjust:\s*exact\s*!important/i);
      expect(html).toMatch(/print-color-adjust:\s*exact\s*!important/i);

      // Verify strict page break prevention on super-containers (.cv-section, .cv-block, .experience__content, etc.)
      expect(html).toMatch(/\.cv-section,\s*\n*\s*\.cv-block[\s\S]*?break-inside:\s*avoid\s*!important;/i);
      expect(html).toMatch(/\.cv-section,\s*\n*\s*\.cv-block[\s\S]*?page-break-inside:\s*avoid\s*!important;/i);
      expect(html).toContain('class="resume');
      expect(html).toContain('id="area-cv"');
      expect(html).toContain('class="skills section cv-section"');
      expect(html).toContain('class="experience section cv-section"');
      expect(html).toContain('cv-block');
    });

    it('1.3: Handles 1-column single-column ATS mode without grid breakage', () => {
      const singleColCV = {
        ...defaultSchema,
        layout: {
          type: '1-column',
          pagePadding: 20,
          sectionGap: 16,
          itemGap: 6
        }
      };

      const html = generateCleanPrintHTML(singleColCV);
      expect(html).toContain('class="resume resume__single-column" id="area-cv"');
      expect(html).not.toContain('resume__left');
      expect(html).not.toContain('resume__right');
      expect(html).toContain('--section-gap: 16px;');
      expect(html).toContain('--item-gap: 6px;');
    });

    it('1.4: Sanitizes adversarial XSS payloads in all CV fields and sub-items', () => {
      const xssCV = {
        profile: {
          name: '<script>alert("hacked-name")</script>'
        },
        layout: {
          type: '2-column'
        },
        sections: [
          {
            id: 'xss_sec_1',
            column: 'left',
            type: 'profile_header',
            items: [
              {
                id: 'h1',
                name: '<img src=x onerror=alert(1)>',
                subtitle: '"><script>alert(2)</script>',
                location: '<svg onload=alert(3)>',
                email: 'test@<script>alert(4)</script>.com',
                phone: '123456"><script>',
                linkedin: 'in/<script>',
                github: 'git/<script>'
              }
            ]
          },
          {
            id: 'xss_sec_2',
            column: 'right',
            type: 'list',
            title: '<b>Bold Title</b>',
            items: [
              {
                id: 'exp_xss',
                title: '<script>alert(5)</script>',
                subtitle: '<iframe src="evil.com">',
                date: '2025',
                link: 'https://evil.com?param=<script>',
                description: '<script>alert(6)</script>',
                bullets: ['<script>bullet1</script>', 'bullet2 & < > " \'']
              }
            ]
          }
        ]
      };

      const html = generateCleanPrintHTML(xssCV);

      // Verify no unescaped script, img onerror, iframe or svg onload exist in output
      expect(html).not.toContain('<script>');
      expect(html).not.toContain('<img src=x onerror');
      expect(html).not.toContain('<iframe');
      expect(html).not.toContain('<svg onload');
      expect(html).toContain('&lt;script&gt;');
      expect(html).toContain('&lt;svg onload=alert(3)&gt;');
      expect(html).toContain('&amp;');
      expect(html).toContain('&quot;');
      expect(html).toContain('&#039;');
    });

    it('1.5: executeCleanPrint creates isolated iframe, triggers print, and cleans DOM', () => {
      const appendSpy = vi.spyOn(document.body, 'appendChild');
      const removeSpy = vi.spyOn(document.body, 'removeChild');

      executeCleanPrint(defaultSchema);

      expect(appendSpy).toHaveBeenCalled();
      const iframe = appendSpy.mock.calls[0][0];
      expect(iframe.tagName).toBe('IFRAME');
      expect(iframe.style.position).toBe('fixed');
    });

    it('1.6: escapeHTML handles edge cases (null, undefined, numbers, special characters)', () => {
      expect(escapeHTML(null)).toBe('');
      expect(escapeHTML(undefined)).toBe('');
      expect(escapeHTML(12345)).toBe('12345');
      expect(escapeHTML(0)).toBe('0');
      expect(escapeHTML(false)).toBe('false');
      expect(escapeHTML('a & b < c > d " e \' f')).toBe('a &amp; b &lt; c &gt; d &quot; e &#039; f');
    });
  });

  // =========================================================================
  // Section 2: Auto-Scaling Algorithm Mathematical & Boundary Stress Testing
  // =========================================================================
  describe('2. Auto-Scaling Algorithm - Mathematical & Boundary Stress Testing', () => {
    const MAX_A4_2PAGE_HEIGHT = 2246; // px

    it('2.1: calculatePrintScale returns 1.0 for heights <= 2246px', () => {
      const normalHeights = [0, 1, 100, 500, 1000, 1123, 1500, 2000, 2245, 2246];
      normalHeights.forEach(h => {
        expect(calculatePrintScale(h)).toBe(1.0);
      });
    });

    it('2.2: calculatePrintScale handles null, undefined, negative, and NaN gracefully', () => {
      expect(calculatePrintScale(null)).toBe(1.0);
      expect(calculatePrintScale(undefined)).toBe(1.0);
      expect(calculatePrintScale(-500)).toBe(1.0);
      expect(calculatePrintScale(NaN)).toBe(1.0);
    });

    it('2.3: calculatePrintScale accurately calculates scaling ratio for heights between 2247px and 2994px', () => {
      // Test 2500px: 2246 / 2500 = 0.8984 -> 0.898
      const scale2500 = calculatePrintScale(2500);
      expect(scale2500).toBeGreaterThanOrEqual(0.75);
      expect(scale2500).toBeLessThanOrEqual(1.0);

      // Test 2600px: 2246 / 2600 = 0.8638 -> 0.864
      const scale2600 = calculatePrintScale(2600);
      expect(scale2600).toBeGreaterThanOrEqual(0.75);
      expect(scale2600).toBeLessThanOrEqual(1.0);

      // Test 2800px: 2246 / 2800 = 0.8021 -> 0.802
      const scale2800 = calculatePrintScale(2800);
      expect(scale2800).toBeGreaterThanOrEqual(0.75);
      expect(scale2800).toBeLessThanOrEqual(1.0);
    });

    it('2.4: calculatePrintScale enforces strict floor limit for massive CVs exceeding 2995px', () => {
      const massiveHeights = [2995, 3000, 3500, 4000, 5000, 10000, 50000, 1000000];
      massiveHeights.forEach(h => {
        const scale = calculatePrintScale(h);
        expect(scale).toBeGreaterThanOrEqual(0.75);
        expect(scale).toBeLessThanOrEqual(1.0);
      });
    });

    it('2.5: Monte Carlo random height generator adheres strictly to [0.75, 1.0] range', () => {
      for (let i = 0; i < 500; i++) {
        const randomHeight = Math.floor(Math.random() * 20000);
        const scale = calculatePrintScale(randomHeight);
        expect(scale).toBeGreaterThanOrEqual(0.75);
        expect(scale).toBeLessThanOrEqual(1.0);
        if (randomHeight <= 2246) {
          expect(scale).toBe(1.0);
        }
      }
    });
  });

  // =========================================================================
  // Section 3: Dynamic Tooltip Positioning Bounding Rect & Obsidian Standard
  // =========================================================================
  describe('3. Dynamic Tooltip Positioning - Bounding Rect Math & Obsidian Standard', () => {
    const testSection = {
      id: 'experience',
      type: 'list',
      title: 'EXPERIENCIA LABORAL',
      items: [{ id: 'exp1', title: 'Senior Engineer', description: 'Tech lead with React and Node' }]
    };

    it('3.1: Positions tooltip to the right (rect.right + 20px) under normal viewport conditions', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

      const normalRect = {
        top: 200,
        bottom: 400,
        left: 300,
        right: 800,
        width: 500,
        height: 200
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={true} 
            layoutType={2} 
            rect={normalRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // rect.right (800) + 20 = 820px
      expect(tooltip.style.left).toBe('820px');
      // rect.top = 200px
      expect(tooltip.style.top).toBe('200px');
    });

    it('3.2: Flips tooltip to the left (rect.left - 320px) when right edge overflows viewport', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

      // rect.right = 800 -> 800 + 20 + 300 = 1120 > 1024 (overflows!)
      const edgeRect = {
        top: 150,
        bottom: 350,
        left: 500,
        right: 800,
        width: 300,
        height: 200
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={true} 
            layoutType={2} 
            rect={edgeRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // rect.left (500) - 320 = 180px
      expect(tooltip.style.left).toBe('180px');
      expect(tooltip.style.top).toBe('150px');
    });

    it('3.3: Clamps top position when approaching bottom of viewport (top + 400 > innerHeight)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

      // rect.top = 450 -> 450 + 400 = 850 > 600 (overflows bottom!)
      const bottomRect = {
        top: 450,
        bottom: 580,
        left: 200,
        right: 600,
        width: 400,
        height: 130
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={true} 
            layoutType={2} 
            rect={bottomRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // Clamped top = innerHeight (600) - 420 = 180px
      expect(tooltip.style.top).toBe('180px');
    });

    it('3.4: Clamps top position to minimum 20px when top < 20', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

      const topRect = {
        top: -30,
        bottom: 100,
        left: 200,
        right: 600,
        width: 400,
        height: 130
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={true} 
            layoutType={2} 
            rect={topRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // Minimum top clamp
      expect(tooltip.style.top).toBe('20px');
    });

    it('3.5: Verifies Obsidian Callout Theme color specifications and Lucide iconography', () => {
      render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={true} 
            layoutType={2} 
            rect={{ top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200 }} 
          />
        </CVProvider>
      );

      const callouts = document.querySelectorAll('.obsidian-callout');
      expect(callouts.length).toBeGreaterThan(0);

      callouts.forEach(callout => {
        const title = callout.querySelector('.callout-title');
        const content = callout.querySelector('.callout-content');
        const icon = callout.querySelector('.callout-icon svg');

        expect(title).toBeInTheDocument();
        expect(content).toBeInTheDocument();
        expect(icon).toBeInTheDocument();

        // Style conformance with AGENTS.md Obsidian standard
        const calloutStyle = callout.getAttribute('style') || '';
        const titleStyle = title.getAttribute('style') || '';

        expect(calloutStyle).toContain('border-left: 4px solid');
        expect(titleStyle).toContain('display: flex');
        expect(titleStyle).toContain('font-weight: 600');
      });
    });

    it('3.6: Does not render when isHovered is false or rect is null', () => {
      const { container: c1 } = render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={false} 
            layoutType={2} 
            rect={{ top: 100, bottom: 200, left: 100, right: 200, width: 100, height: 100 }} 
          />
        </CVProvider>
      );
      expect(c1.querySelector('.suggestion-tooltip')).toBeNull();

      const { container: c2 } = render(
        <CVProvider>
          <SuggestionTooltip 
            section={testSection} 
            isHovered={true} 
            layoutType={2} 
            rect={null} 
          />
        </CVProvider>
      );
      expect(c2.querySelector('.suggestion-tooltip')).toBeNull();
    });
  });

  // =========================================================================
  // Section 4: YIQ Contrast and Custom Spacing Stress Testing
  // =========================================================================
  describe('4. YIQ Contrast Calculation & Dynamic Spacing Variables in Print CSS', () => {
    it('4.1: Computes high-contrast text and circle colors for dark and light backgrounds', () => {
      const darkCV = {
        ...defaultSchema,
        layout: {
          type: '2-column',
          leftBg: '#0f172a', // Very dark slate
          rightBg: '#ffffff', // White
          pagePadding: 28,
          sectionGap: 24,
          itemGap: 10
        }
      };

      const html = generateCleanPrintHTML(darkCV);
      // Dark background should produce light text (#fcfcfc or #f0efef)
      expect(html).toContain('--title-color: #fcfcfc');
      expect(html).toContain('--text-color: #f0efef');
      // Light background should produce dark text (#0b0a0a or #403a3a)
      expect(html).toContain('--title-color: #0b0a0a');
      expect(html).toContain('--text-color: #403a3a');

      // Spacing variables injected
      expect(html).toContain('--section-gap: 24px;');
      expect(html).toContain('--item-gap: 10px;');
    });

    it('4.2: Handles short 3-character hex codes (#000, #fff, #333, #f5a)', () => {
      const shortHexCV = {
        ...defaultSchema,
        layout: {
          type: '2-column',
          leftBg: '#000',
          rightBg: '#fff',
          pagePadding: 16,
          sectionGap: 12,
          itemGap: 4
        }
      };

      const html = generateCleanPrintHTML(shortHexCV);
      expect(html).toContain('--title-color: #fcfcfc');
      expect(html).toContain('--title-color: #0b0a0a');
    });
  });

  // =========================================================================
  // Section 5: SuggestionTooltip Section Target Mapping & Rule Localizations
  // =========================================================================
  describe('5. SuggestionTooltip Target Section Mapping & Localized Rule Delivery', () => {
    const sectionTypes = [
      { id: 'experience', type: 'experience' },
      { id: 'education', type: 'education' },
      { id: 'skills', type: 'skills' },
      { id: 'projects', type: 'projects' },
      { id: 'certificates', type: 'simple_list' },
      { id: 'languages', type: 'simple_list' },
      { id: 'about_section', type: 'about' },
      { id: 'profile_header', type: 'profile_header' },
      { id: 'unknown_specialty', type: 'custom_rnd' }
    ];

    sectionTypes.forEach(({ id, type }) => {
      it(`5.1: Renders localized suggestions for section type "${type}" (id: "${id}") without crash`, () => {
        const { unmount } = render(
          <CVProvider>
            <SuggestionTooltip 
              section={{ id, type, title: `Test ${type}`, items: [] }} 
              isHovered={true} 
              layoutType={2} 
              rect={{ top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200 }} 
            />
          </CVProvider>
        );

        const tooltip = document.querySelector('.suggestion-tooltip');
        expect(tooltip).toBeInTheDocument();
        const callouts = document.querySelectorAll('.obsidian-callout');
        expect(callouts.length).toBeGreaterThan(0);

        unmount();
      });
    });
  });
});

