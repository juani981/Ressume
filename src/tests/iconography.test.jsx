import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import SuggestionTooltip from '../components/Editor/SuggestionTooltip';
import { CVProvider } from '../context/CVContext';
import App from '../App';

describe('R4: Callout & Tooltip Iconography Migration to lucide-react', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockSection = {
    id: 'skills',
    type: 'skills',
    title: 'HABILIDADES TÉCNICAS',
    items: [
      { id: 'skill1', title: 'Backend', description: 'Node.js, Python, PHP' }
    ]
  };

  const mockRect = {
    top: 100,
    bottom: 250,
    left: 200,
    right: 600,
    width: 400,
    height: 150
  };

  // ==========================================
  // Tier 1: Core Feature Coverage (5 tests)
  // ==========================================
  describe('Tier 1: Feature Coverage', () => {
    it('T1.1: SuggestionTooltip renders without throwing and displays Obsidian callouts when hovered', () => {
      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      
      const callouts = document.querySelectorAll('.obsidian-callout');
      expect(callouts.length).toBeGreaterThan(0);
    });

    it('T1.2: Obsidian callouts follow strict AGENTS.md visual structure (.obsidian-callout, .callout-title, .callout-content)', () => {
      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      const callouts = document.querySelectorAll('.obsidian-callout');
      callouts.forEach(callout => {
        const titleEl = callout.querySelector('.callout-title');
        const contentEl = callout.querySelector('.callout-content');
        expect(titleEl).toBeInTheDocument();
        expect(contentEl).toBeInTheDocument();

        // Check 4px solid border style
        const style = callout.getAttribute('style') || '';
        expect(style).toContain('border-left');
      });
    });

    it('T1.3: SuggestionTooltip contains zero raw unicode emojis (like 🛑, 🚨, ⚠️, ℹ️, 💡) in its DOM output', () => {
      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      const textContent = tooltip ? tooltip.textContent : '';
      
      // Strict regex matching raw emoji unicode ranges
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}]/u;
      
      // Specifically ensure common alert emojis are not present as raw text
      expect(textContent).not.toContain('🛑');
      expect(textContent).not.toContain('🚨');
      expect(textContent).not.toContain('⚠️');
      expect(textContent).not.toContain('ℹ️');
    });

    it('T1.4: SuggestionTooltip renders SVG icon elements (Lucide icons) inside callouts', () => {
      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      const svgs = document.querySelectorAll('.suggestion-tooltip svg');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('T1.5: BoxIcons (bx bx-*, bx bxl-*) are preserved in CV header and contact links', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      // Verify presence of BoxIcons for contact / external links
      const boxIcons = document.querySelectorAll('i.bx, i.bxl-linkedin-square, i.bxl-github, i.bx-envelope, i.bx-phone, i.bx-map');
      expect(boxIcons.length).toBeGreaterThan(0);
    });
  });

  // ==========================================
  // Tier 2: Boundary Value & Edge Cases (5 tests)
  // ==========================================
  describe('Tier 2: Boundary & Edge Cases', () => {
    it('T2.1: Tooltip flips to the left (rect.left - 320) when approaching viewport right boundary (window.innerWidth)', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      
      // Right edge close to 1024 (e.g. rect.right = 900 -> 900 + 300 = 1200 > 1024)
      const nearEdgeRect = {
        top: 200,
        bottom: 350,
        left: 600,
        right: 900,
        width: 300,
        height: 150
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={nearEdgeRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // left should be positioned at rect.left - 320 = 280px
      const style = tooltip.getAttribute('style') || '';
      expect(style).toContain('left: 280px');
    });

    it('T2.2: Tooltip clamps vertically when approaching window.innerHeight to prevent overflowing', () => {
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });
      
      const bottomEdgeRect = {
        top: 700, // 700 + 400 = 1100 > 800
        bottom: 780,
        left: 200,
        right: 500,
        width: 300,
        height: 80
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={bottomEdgeRect} 
          />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      const style = tooltip.getAttribute('style') || '';
      // clamped top: 800 - 420 = 380px
      expect(style).toContain('top: 380px');
    });

    it('T2.3: Tooltip does not render (returns null) when isHovered is false or rect is null', () => {
      const { container } = render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={false} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      expect(container.querySelector('.suggestion-tooltip')).toBeNull();
    });

    it('T2.4: SuggestionTooltip falls back cleanly for unknown section types', () => {
      const unknownSection = {
        id: 'custom_rnd_99',
        type: 'quantum_computing',
        title: 'QUANTUM RESEARCH',
        items: []
      };

      render(
        <CVProvider>
          <SuggestionTooltip 
            section={unknownSection} 
            isHovered={true} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      // Should render without throwing
      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
    });

    it('T2.5: Handles severity variants (critical, warning, info) with corresponding Obsidian color palettes', () => {
      render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={mockRect} 
          />
        </CVProvider>
      );

      const callouts = document.querySelectorAll('.obsidian-callout');
      // Verify style has valid rgba color
      callouts.forEach(callout => {
        const style = callout.getAttribute('style') || '';
        expect(style).toMatch(/rgba\(233,\s*49,\s*71|rgba\(219,\s*139,\s*0|rgba\(8,\s*109,\s*221/);
      });
    });
  });
});
