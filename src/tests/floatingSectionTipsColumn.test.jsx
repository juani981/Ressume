/**
 * @file floatingSectionTipsColumn.test.jsx
 * @description Unit & integration tests for the dynamic floating AI advice column:
 * - Section-specific targeting & placement
 * - Anti-collision / non-overlapping top-to-bottom layout
 * - Strict adherence to AGENTS.md Invariant 1 (Obsidian Callouts & SVGs)
 * - Recruiter-curated imperative action commands (Google XYZ, metrics, Laszlo Bock formula)
 * - Interactive dismiss & restore lifecycle
 * - Parity across Spanish and English locales
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import AITipsSidebar from '../components/Editor/AITipsSidebar';
import SuggestionTooltip from '../components/Editor/SuggestionTooltip';
import { getRules } from '../locales/index';

describe('Floating Section AI Tips Column & Curated Recruiter Rules', () => {
  const mockCVData = {
    layout: { type: '2-column', isAtsMode: false },
    sections: [
      { id: 'profile_header', type: 'profile_header', title: 'Encabezado', items: [] },
      { id: 'contact', type: 'contact', title: 'Contacto', items: [] },
      { id: 'about_section', type: 'about', title: 'Perfil', items: [] },
      { id: 'skills', type: 'skills', title: 'Habilidades Técnicas', items: [] },
      { id: 'experience', type: 'experience', title: 'Experiencia Laboral', items: [] },
      { id: 'projects', type: 'projects', title: 'Proyectos', items: [] },
      { id: 'education', type: 'education', title: 'Educación', items: [] },
      { id: 'certificates', type: 'certificates', title: 'Certificaciones', items: [] },
      { id: 'languages', type: 'languages', title: 'Idiomas', items: [] }
    ]
  };

  it('1. Renders the AI tips column with section-aligned cards for all active sections', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const sidebar = screen.getByTestId('ai-tips-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Verify Obsidian Callouts are present
    const callouts = sidebar.querySelectorAll('.obsidian-callout');
    expect(callouts.length).toBeGreaterThan(0);

    // Verify presence of section cards
    const cardWrappers = sidebar.querySelectorAll('.ai-tip-card-wrapper');
    expect(cardWrappers.length).toBeGreaterThan(5);
  });

  it('2. Strictly adheres to AGENTS.md Invariant 1 (Obsidian Callout structure, left border, SVGs, zero raw emojis)', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const callouts = document.querySelectorAll('.obsidian-callout');
    expect(callouts.length).toBeGreaterThan(0);

    callouts.forEach((callout) => {
      const title = callout.querySelector('.callout-title');
      const content = callout.querySelector('.callout-content');
      const icon = callout.querySelector('.callout-icon');

      expect(title).toBeInTheDocument();
      expect(content).toBeInTheDocument();
      expect(icon).toBeInTheDocument();

      // Border check
      const style = callout.getAttribute('style') || '';
      expect(style).toContain('border-left: 4px solid');

      // Zero raw unicode emojis
      expect(callout.textContent).not.toMatch(/[🛑🚨⚠️ℹ️💡✨]/);

      // Must have Lucide SVG icon
      const svg = icon.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });
  });

  it('3. Delivers imperative, recruiter-curated action commands with data & metrics', () => {
    const esRules = getRules('es');
    const enRules = getRules('en');

    // Verify Spanish rules have Google XYZ formula and imperative commands
    const googleXYZRule = esRules.find(r => r.id.includes('experience_001'));
    expect(googleXYZRule).toBeDefined();
    expect(googleXYZRule.suggestion_title).toContain('Google XYZ');
    expect(googleXYZRule.suggestion_body).toContain('Laszlo Bock');

    const killResponsibleRule = esRules.find(r => r.id.includes('experience_002'));
    expect(killResponsibleRule).toBeDefined();
    expect(killResponsibleRule.suggestion_title).toContain('Responsable de');

    const metricsRule = esRules.find(r => r.id.includes('experience_003'));
    expect(metricsRule).toBeDefined();
    expect(metricsRule.suggestion_title).toContain('Métricas Obligatorias');

    // Verify English rules parity
    const enGoogleXYZ = enRules.find(r => r.id.includes('experience_001'));
    expect(enGoogleXYZ).toBeDefined();
    expect(enGoogleXYZ.suggestion_title).toContain('Google XYZ');
    expect(enGoogleXYZ.suggestion_body).toContain('Laszlo Bock');

    const enKillResponsible = enRules.find(r => r.id.includes('experience_002'));
    expect(enKillResponsible).toBeDefined();
    expect(enKillResponsible.suggestion_title).toContain('Responsible for');
  });

  it('4. Allows dismissing individual advice cards and restoring them', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const initialCards = screen.getAllByRole('button', { name: /descartar este consejo/i });
    const initialCount = initialCards.length;
    expect(initialCount).toBeGreaterThan(0);

    // Dismiss first card
    fireEvent.click(initialCards[0]);

    // Cards count should have decreased by 1
    const updatedCards = screen.getAllByRole('button', { name: /descartar este consejo/i });
    expect(updatedCards.length).toBe(initialCount - 1);

    // Restore button should appear
    const restoreBtn = screen.getByRole('button', { name: /restaurar.*consejo/i });
    expect(restoreBtn).toBeInTheDocument();

    // Click restore
    fireEvent.click(restoreBtn);

    // All cards restored
    const restoredCards = screen.getAllByRole('button', { name: /descartar este consejo/i });
    expect(restoredCards.length).toBe(initialCount);
  });

  it('5. Renders nothing when showAITips is set to false globally', () => {
    const TestComponent = () => {
      const { setShowAITips } = useCV();
      React.useEffect(() => {
        setShowAITips(false);
      }, [setShowAITips]);

      return <AITipsSidebar />;
    };

    const { container } = render(
      <CVProvider initialCV={mockCVData}>
        <TestComponent />
      </CVProvider>
    );

    expect(container.querySelector('[data-testid="ai-tips-sidebar"]')).toBeNull();
  });

  it('6. SuggestionTooltip seamlessly inherits the updated curated rules', () => {
    const mockSection = { id: 'experience', type: 'experience', title: 'Experiencia Laboral', items: [] };
    const mockRect = { top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200 };

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

    const callouts = tooltip.querySelectorAll('.obsidian-callout');
    expect(callouts.length).toBeGreaterThan(0);

    // Check that at least one callout contains the imperative recruiter guidance
    const titles = Array.from(tooltip.querySelectorAll('.callout-title')).map(t => t.textContent);
    const hasCuratedRule = titles.some(t => t.includes('Google XYZ') || t.includes('Responsable de') || t.includes('Métricas'));
    expect(hasCuratedRule).toBe(true);
  });

  it('7. Strictly enforces <= 15 words limit for all advice in Spanish and English catalogs', () => {
    const esRules = getRules('es');
    const enRules = getRules('en');

    // Test Spanish rules
    esRules.forEach(rule => {
      const wordCount = (rule.suggestion_body || '').trim().split(/\s+/).length;
      expect(wordCount, `Rule ${rule.id} exceeds 15 words (${wordCount} words): "${rule.suggestion_body}"`).toBeLessThanOrEqual(15);
    });

    // Test English rules
    enRules.forEach(rule => {
      const wordCount = (rule.suggestion_body || '').trim().split(/\s+/).length;
      expect(wordCount, `Rule ${rule.id} exceeds 15 words (${wordCount} words): "${rule.suggestion_body}"`).toBeLessThanOrEqual(15);
    });

    // Check coverage of both ATS_1_col and Human_2_col
    const esAtsRules = esRules.filter(r => r.target_layout === 'ATS_1_col');
    const es2ColRules = esRules.filter(r => r.target_layout === 'Human_2_col');
    expect(esAtsRules.length).toBeGreaterThan(0);
    expect(es2ColRules.length).toBeGreaterThan(0);

    const enAtsRules = enRules.filter(r => r.target_layout === 'ATS_1_col');
    const en2ColRules = enRules.filter(r => r.target_layout === 'Human_2_col');
    expect(enAtsRules.length).toBeGreaterThan(0);
    expect(en2ColRules.length).toBeGreaterThan(0);
  });

  it('8. Alternates floating advice cards left and right along the main CV sheet (Title: Left, Contact: Right, Profile: Left...)', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const sidebar = screen.getByTestId('ai-tips-sidebar');
    const cardWrappers = sidebar.querySelectorAll('.ai-tip-card-wrapper');
    expect(cardWrappers.length).toBeGreaterThan(3);

    // Verify Title / Encabezado (first section) is on the LEFT
    expect(cardWrappers[0].getAttribute('data-side')).toBe('left');
    expect(cardWrappers[0].textContent).toContain('Titular & Encabezado');

    // Verify Contact (second section) is on the RIGHT
    expect(cardWrappers[1].getAttribute('data-side')).toBe('right');
    expect(cardWrappers[1].textContent).toContain('Datos de Contacto');

    // Verify Perfil Profesional (third section) is on the LEFT
    expect(cardWrappers[2].getAttribute('data-side')).toBe('left');
    expect(cardWrappers[2].textContent).toContain('Perfil Profesional');

    // Verify alternation and pointer direction across all rendered cards
    cardWrappers.forEach((wrapper, index) => {
      const expectedSide = index % 2 === 0 ? 'left' : 'right';
      expect(wrapper.getAttribute('data-side')).toBe(expectedSide);

      // Verify pointer arrows
      const pointer = wrapper.querySelector('.ai-tip-pointer');
      expect(pointer).toBeInTheDocument();
      const style = pointer.getAttribute('style') || '';
      if (expectedSide === 'left') {
        // Left card points towards CV on the right (uses border-left)
        expect(style).toContain('border-left:');
      } else {
        // Right card points towards CV on the left (uses border-right)
        expect(style).toContain('border-right:');
      }
    });
  });
});


