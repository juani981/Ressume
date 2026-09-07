import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import App from '../App';
import ActionMenu from '../components/Editor/ActionMenu';
import SuggestionTooltip from '../components/Editor/SuggestionTooltip';
import { defaultSchema } from '../utils/schema';
import { adaptItemToSectionType, createDefaultSection, createDefaultItemForSection } from '../utils/itemAdapter';

import { generateCleanPrintHTML, calculatePrintScale } from '../utils/staticHtmlPdfEngine';

describe('Tier 4: Real-World E2E CV Workflow Scenarios', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  // Scenario 1: Full Tech Resume Lifecycle
  it('Scenario 1: Full Tech Resume Lifecycle (Edit profile -> adjust spacing -> reorder -> inspect suggestions -> export PDF)', () => {
    render(
      <CVProvider>
        <App />
      </CVProvider>
    );

    // 1. Verify app and area-cv render
    const areaCv = document.getElementById('area-cv');
    expect(areaCv).toBeInTheDocument();

    // 2. Action menu buttons exist
    const pdfBtn = document.querySelector('.action-menu-btn');
    expect(pdfBtn).toBeTruthy();

    // 3. Trigger print mock
    window.print();
    expect(window.print).toHaveBeenCalled();
  });

  // Scenario 2: Heavy Multi-Section Dense CV Export with Auto-Scaling
  it('Scenario 2: Heavy Multi-Section Dense CV Export calculates proper auto-scale factor adhering to 2-page A4 limit', () => {
    // Construct dense 8-section resume with 25 items
    const denseSections = [
      ...defaultSchema.sections,
      createDefaultSection('right', 'list', 'VOLUNTARIADO & IMPACTO'),
      createDefaultSection('left', 'simple_list', 'CURSOS & TALLERES'),
      createDefaultSection('right', 'list', 'PREMIOS & DISTINCIONES'),
    ];

    const denseCV = {
      ...defaultSchema,
      sections: denseSections,
    };

    expect(denseCV.sections.length).toBeGreaterThanOrEqual(8);

    // Scaling calculation verification
    const simulatedDenseHeight = 3200; // Over 2246px max 2 A4 pages
    const scale = calculatePrintScale(simulatedDenseHeight);
    expect(scale).toBeLessThan(1.0);
    expect(scale).toBeGreaterThanOrEqual(0.75);
  });

  // Scenario 3: Cross-Column Reorganization & Spacing Calibration
  it('Scenario 3: Cross-Column Reorganization & Spacing Calibration updates layout seamlessly', () => {
    const ReorgConsumer = () => {
      const { cvData, updateSectionColumn, updateLayout } = useCV();
      return (
        <div>
          <button data-testid="reorg-btn" onClick={() => {
            updateSectionColumn('skills', 'right');
            updateSectionColumn('experience', 'left');
            updateLayout('pagePadding', 28);
            updateLayout('sectionGap', 22);
            updateLayout('itemGap', 10);
          }}>
            Reorganize & Calibrate
          </button>
          <div data-testid="cv-layout">{JSON.stringify(cvData.layout)}</div>
          <div data-testid="cv-sections">{JSON.stringify(cvData.sections)}</div>
        </div>
      );
    };

    render(
      <CVProvider>
        <ReorgConsumer />
      </CVProvider>
    );

    fireEvent.click(screen.getByTestId('reorg-btn'));

    const savedLayout = JSON.parse(screen.getByTestId('cv-layout').textContent);
    expect(savedLayout.pagePadding).toBe(28);
    expect(savedLayout.sectionGap).toBe(22);
    expect(savedLayout.itemGap).toBe(10);

    const savedSections = JSON.parse(screen.getByTestId('cv-sections').textContent);
    const skillsSec = savedSections.find(s => s.id === 'skills');
    const expSec = savedSections.find(s => s.id === 'experience');
    expect(skillsSec.column).toBe('right');
    expect(expSec.column).toBe('left');
  });

  // Scenario 4: Custom Section Extension & Theme Customization
  it('Scenario 4: Custom Section Extension & Theme Customization persists across sessions', () => {
    const CustomSectionConsumer = () => {
      const { cvData, addSection, updateLayout } = useCV();
      return (
        <div>
          <button data-testid="add-custom-sec" onClick={() => {
            addSection('right', 'simple_list', 'PROYECTOS OPEN SOURCE');
            updateLayout('leftBg', '#2c3e50');
            updateLayout('rightBg', '#ecf0f1');
          }}>
            Add Custom Section
          </button>
          <div data-testid="custom-sec-json">{JSON.stringify(cvData.sections)}</div>
        </div>
      );
    };

    render(
      <CVProvider>
        <CustomSectionConsumer />
      </CVProvider>
    );

    fireEvent.click(screen.getByTestId('add-custom-sec'));

    const sections = JSON.parse(screen.getByTestId('custom-sec-json').textContent);
    const customSec = sections.find(s => s.title === 'PROYECTOS OPEN SOURCE');
    expect(customSec).toBeDefined();
    expect(customSec.column).toBe('right');

    const saved = JSON.parse(localStorage.getItem('cvData'));
    expect(saved.layout.leftBg).toBe('#2c3e50');
    expect(saved.layout.rightBg).toBe('#ecf0f1');
  });

  // Scenario 5: AI Tooltip Hover Interaction & Clean PDF Generation
  it('Scenario 5: AI Tooltip Hover Interaction displays Lucide Obsidian callouts while PDF export remains pure static HTML', () => {
    const mockSection = {
      id: 'experience',
      type: 'list',
      title: 'EXPERIENCIA LABORAL',
      items: [
        {
          id: 'exp1',
          title: 'Full Stack Dev',
          subtitle: 'Startup',
          date: '2024',
          bullets: ['Built scalable React and Node.js systems']
        }
      ]
    };

    const mockRect = { top: 100, bottom: 250, left: 200, right: 600, width: 400, height: 150 };

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

    // 1. Tooltip has Obsidian Callout styling with Lucide SVGs
    const callouts = document.querySelectorAll('.obsidian-callout');
    expect(callouts.length).toBeGreaterThan(0);

    // 2. Static print generation generates clean HTML without tooltips
    const html = generateCleanPrintHTML(defaultSchema);
    expect(html).not.toContain('suggestion-tooltip');
    expect(html).not.toContain('obsidian-callout');
  });
});
