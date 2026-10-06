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

    // Verify Spanish rules have Laszlo Bock formula and imperative commands
    const googleXYZRule = esRules.find(r => r.id.includes('experience_001'));
    expect(googleXYZRule).toBeDefined();
    expect(googleXYZRule.suggestion_title).toContain('Impacto Cuantificado');
    expect(googleXYZRule.suggestion_body).toContain('Laszlo Bock');

    const killResponsibleRule = esRules.find(r => r.id.includes('experience_002'));
    expect(killResponsibleRule).toBeDefined();
    expect(killResponsibleRule.suggestion_title).toContain('Verbos de Acción');

    const metricsRule = esRules.find(r => r.id.includes('experience_003'));
    expect(metricsRule).toBeDefined();
    expect(metricsRule.suggestion_title).toContain('Cuantificación');

    // Verify English rules parity
    const enGoogleXYZ = enRules.find(r => r.id.includes('experience_001'));
    expect(enGoogleXYZ).toBeDefined();
    expect(enGoogleXYZ.suggestion_title).toContain('Quantified Impact');
    expect(enGoogleXYZ.suggestion_body).toContain('Laszlo Bock');

    const enKillResponsible = enRules.find(r => r.id.includes('experience_002'));
    expect(enKillResponsible).toBeDefined();
    expect(enKillResponsible.suggestion_title).toContain('Action Verbs');
  });

  it('4. Renders all advice cards unconditionally without individual dismiss buttons or counters (all-or-nothing)', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const sidebar = screen.getByTestId('ai-tips-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Verify all section cards are rendered
    const cardWrappers = sidebar.querySelectorAll('.ai-tip-card-wrapper');
    expect(cardWrappers.length).toBeGreaterThan(0);

    // Verify ZERO individual dismiss buttons (no 'descartar este consejo')
    const dismissBtns = screen.queryAllByRole('button', { name: /descartar este consejo/i });
    expect(dismissBtns).toHaveLength(0);

    // Verify ZERO restore buttons
    const restoreBtns = screen.queryAllByRole('button', { name: /restaurar/i });
    expect(restoreBtns).toHaveLength(0);

    // Verify NO counter box of how many tips are shown
    expect(sidebar.textContent).not.toMatch(/\d+\s+consejos\s+intercalados/i);
    expect(sidebar.textContent).not.toMatch(/has\s+descartado\s+todos/i);
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
    const hasCuratedRule = titles.some(t => t.includes('Impacto Cuantificado') || t.includes('Verbos de Acción') || t.includes('Cuantificación'));
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

  it('9. Enforces viewport width boundary clamping (<= VW) and vertical downward growth without horizontal scroll', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const sidebar = screen.getByTestId('ai-tips-sidebar');
    const sidebarStyle = sidebar.getAttribute('style') || '';

    // Container must be strictly clamped to <= 100vw and overflow-x clipped
    expect(sidebarStyle).toContain('max-width: 100vw');
    expect(sidebarStyle).toContain('overflow-x: clip');

    // Cards must allow vertical expansion via height: auto and wrap text cleanly
    const cardWrappers = sidebar.querySelectorAll('.ai-tip-card-wrapper');
    expect(cardWrappers.length).toBeGreaterThan(0);

    cardWrappers.forEach((wrapper) => {
      const style = wrapper.getAttribute('style') || '';
      expect(style).toContain('height: auto');
      expect(style).toContain('overflow-wrap: break-word');
      expect(style).toContain('word-break: break-word');

      // Callouts inside must also have auto height and break words
      const callouts = wrapper.querySelectorAll('.obsidian-callout');
      callouts.forEach((callout) => {
        const cStyle = callout.getAttribute('style') || '';
        expect(cStyle).toContain('overflow-wrap: break-word');
        expect(cStyle).toContain('word-break: break-word');
      });
    });
  });

  it('10. Bidirectional Section ↔ Callout Interaction: hovering or focusing inside a CV section activates the corresponding tip card and section highlight', () => {
    const { container } = render(
      <CVProvider initialCV={mockCVData}>
        <div id="area-cv">
          <div data-section-id="skills" className="cv-section" data-testid="cv-section-skills">
            Skills Content
          </div>
          <div data-section-id="experience" className="cv-section" data-testid="cv-section-experience">
            Experience Content
          </div>
        </div>
        <AITipsSidebar />
      </CVProvider>
    );

    const skillsSection = screen.getByTestId('cv-section-skills');
    const skillsCard = container.querySelector('.ai-tip-card-wrapper[data-section-id="skills"]');
    expect(skillsCard).toBeInTheDocument();

    // 1. Trigger pointerOver on skills section
    fireEvent.pointerOver(skillsSection);

    // Section should gain highlight class
    expect(skillsSection.classList.contains('ai-tip-highlighted-section')).toBe(true);

    // Skills card should receive blue highlight border
    expect(skillsCard.style.border).toContain('1.5px solid rgb(59, 130, 246)');

    // 2. Trigger pointerLeave on area-cv
    const areaCv = document.getElementById('area-cv');
    fireEvent.pointerLeave(areaCv);

    // Section and card should lose highlight
    expect(skillsSection.classList.contains('ai-tip-highlighted-section')).toBe(false);
    expect(skillsCard.style.border).not.toContain('1.5px solid rgb(59, 130, 246)');

    // 3. Trigger focusIn inside skills section (e.g. user typing in an inline edit field)
    fireEvent.focusIn(skillsSection);
    expect(skillsSection.classList.contains('ai-tip-highlighted-section')).toBe(true);
    expect(skillsCard.style.border).toContain('1.5px solid rgb(59, 130, 246)');

    // 4. Trigger focusOut outside area-cv
    fireEvent.focusOut(skillsSection);
    expect(skillsSection.classList.contains('ai-tip-highlighted-section')).toBe(false);
    expect(skillsCard.style.border).not.toContain('1.5px solid rgb(59, 130, 246)');
  });

  it('8. Verifies bilingual parity for profile sensitive data and projects repository rules', () => {
    const esRules = getRules('es');
    const enRules = getRules('en');

    // Rule count parity
    expect(esRules.length).toBe(enRules.length);
    expect(esRules.length).toBe(31);

    // Profile sensitive data rule
    const esProfile005 = esRules.find(r => r.id === 'rule_es_profile_005');
    const enProfile005 = enRules.find(r => r.id === 'rule_en_profile_005');
    expect(esProfile005).toBeDefined();
    expect(enProfile005).toBeDefined();
    expect(esProfile005.severity).toBe('critical');
    expect(enProfile005.severity).toBe('critical');
    expect(esProfile005.target_section).toBe('profile');
    expect(enProfile005.target_section).toBe('profile');

    // Projects repo README/Docker rule
    const esProjects003 = esRules.find(r => r.id === 'rule_es_projects_003');
    const enProjects003 = enRules.find(r => r.id === 'rule_en_projects_003');
    expect(esProjects003).toBeDefined();
    expect(enProjects003).toBeDefined();
    expect(esProjects003.severity).toBe('warning');
    expect(enProjects003.severity).toBe('warning');
    expect(esProjects003.target_section).toBe('projects');
    expect(enProjects003.target_section).toBe('projects');
  });

  it('9. Renders 1 tip by default and expands up to 5 tips for experience/skills on demand via toggle button', () => {
    render(
      <CVProvider initialCV={mockCVData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const expCard = document.querySelector('.ai-tip-card-wrapper[data-section-id="experience"]');
    expect(expCard).toBeInTheDocument();
    // Default progressive disclosure: 1 tip shown initially to prevent stretching layout
    const initialExpTips = expCard.querySelectorAll('.obsidian-callout');
    expect(initialExpTips.length).toBe(1);

    // Expand tips on demand
    const expToggleBtn = screen.getByTestId('btn-toggle-tips-experience');
    expect(expToggleBtn).toBeInTheDocument();
    expect(expToggleBtn.textContent).toMatch(/ver más consejos/i);
    fireEvent.click(expToggleBtn);

    const expTips = expCard.querySelectorAll('.obsidian-callout');
    expect(expTips.length).toBeGreaterThan(2);
    expect(expTips.length).toBeLessThanOrEqual(5);

    const skillsCard = document.querySelector('.ai-tip-card-wrapper[data-section-id="skills"]');
    expect(skillsCard).toBeInTheDocument();
    const skillsToggleBtn = screen.getByTestId('btn-toggle-tips-skills');
    expect(skillsToggleBtn).toBeInTheDocument();
    fireEvent.click(skillsToggleBtn);

    const skillsTips = skillsCard.querySelectorAll('.obsidian-callout');
    expect(skillsTips.length).toBeGreaterThan(2);
    expect(skillsTips.length).toBeLessThanOrEqual(5);
  });
});


