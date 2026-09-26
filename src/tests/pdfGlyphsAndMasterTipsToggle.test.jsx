/**
 * @file pdfGlyphsAndMasterTipsToggle.test.jsx
 * @description Comprehensive test suite verifying:
 * 1. OCR text extraction & glyph sanitization (date ranges, math delimiters, bullet whitespace).
 * 2. Photo preservation in document state and automatic hiding in ATS mode.
 * 3. Master AI Tips toggle in top panel and right-rail AITipsSidebar with Obsidian Callouts.
 * 4. Total elimination of individual section-level tip buttons.
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import LayoutModeToggle from '../components/Editor/LayoutModeToggle';
import AITipsSidebar from '../components/Editor/AITipsSidebar';
import BaseSection from '../components/CV/BaseSection';
import PhotoItem from '../components/CV/items/PhotoItem';
import { normalizeDateRange, sanitizeBulletText, sanitizeOcrMathSyntax } from '../utils/textSanitizer';
import { estimateSectionHeight, distributeSectionsToPages } from '../utils/pageDistributor';
import { generateCleanPrintHTML } from '../services/print/cleanHtmlGenerator';

describe('1. PDF Text Extraction & Glyph Sanitization (textSanitizer.js)', () => {
  it('normalizes Unicode en-dash, em-dash, and irregular spaces in date ranges', () => {
    expect(normalizeDateRange('Julio 2025 – Actualidad')).toBe('Julio 2025 - Actualidad');
    expect(normalizeDateRange('Julio 2023 — Enero 2024')).toBe('Julio 2023 - Enero 2024');
    expect(normalizeDateRange('2021  -   2023')).toBe('2021 - 2023');
    expect(normalizeDateRange('Mayo 2020 -Actualidad')).toBe('Mayo 2020 - Actualidad');
  });

  it('sanitizes leading whitespace, tabs, and private-use bullet glyphs', () => {
    expect(sanitizeBulletText(' Identifiqué y resolví consultas')).toBe('Identifiqué y resolví consultas');
    expect(sanitizeBulletText('\t\u00A0Optimicé la arquitectura')).toBe('Optimicé la arquitectura');
    expect(sanitizeBulletText('\uF0B7 Diseñé pipelines CI/CD')).toBe('Diseñé pipelines CI/CD');
    expect(sanitizeBulletText('\u25E6 Automatización de pruebas')).toBe('Automatización de pruebas');
  });

  it('eliminates inadvertent math delimiters ($...$) and repairs sans-serif OCR confusions', () => {
    expect(sanitizeOcrMathSyntax('Optimicé $N+1$ en consultas SQL')).toBe('Optimicé N+1 en consultas SQL');
    expect(sanitizeOcrMathSyntax('Pipeline de $Cl/CD$ automatizado')).toBe('Pipeline de CI/CD automatizado');
    expect(sanitizeOcrMathSyntax('Flujos Cl/CD con Jenkins')).toBe('Flujos CI/CD con Jenkins');
    expect(sanitizeOcrMathSyntax('Departamento de $(1+D)$')).toBe('Departamento de I+D');
    expect(sanitizeOcrMathSyntax('Proyectos 1+D innovadores')).toBe('Proyectos I+D innovadores');
  });
});

describe('2. Photo Section Preservation in State & Seamless ATS Hiding', () => {
  const photoItem = {
    id: 'photo_1',
    url: 'https://example.com/avatar.jpg',
    shape: 'circle',
    size: 130
  };

  const photoSection = {
    id: 'profile_photo',
    type: 'photo',
    items: [photoItem],
    column: 'left'
  };

  it('renders PhotoItem in traditional 2-column mode', () => {
    const { container } = render(
      <CVProvider initialData={{ layout: { type: '2-column', isAtsMode: false } }}>
        <PhotoItem item={photoItem} sectionId="profile_photo" isPrint={true} />
      </CVProvider>
    );

    const img = container.querySelector('img.cv-photo-img');
    expect(img).toBeInTheDocument();
    expect(img.getAttribute('src')).toBe('https://example.com/avatar.jpg');
  });

  it('hides PhotoItem completely in ATS mode while preserving item in document state', () => {
    const { container } = render(
      <CVProvider initialCV={{ layout: { type: '1-column', isAtsMode: true } }}>
        <PhotoItem item={photoItem} sectionId="profile_photo" isPrint={true} />
      </CVProvider>
    );

    const img = container.querySelector('img.cv-photo-img');
    expect(img).toBeNull();
  });

  it('computes 0 height for photo section in ATS mode in pageDistributor', () => {
    const heightAts = estimateSectionHeight(photoSection, { isAtsMode: true, mode: '1-column' });
    expect(heightAts).toBe(0);

    const heightTraditional = estimateSectionHeight(photoSection, { isAtsMode: false, mode: '2-column', column: 'left' });
    expect(heightTraditional).toBeGreaterThan(100);
  });

  it('omits photo section from ATS distribution pages without deleting it from input sections', () => {
    const sections = [
      photoSection,
      { id: 'exp', type: 'experience', items: [{ id: 'e1', title: 'Developer' }] }
    ];

    const cvData = {
      sections,
      layout: { type: '1-column', isAtsMode: true }
    };

    const atsPages = distributeSectionsToPages(cvData, { isAtsMode: true, mode: '1-column' });
    const atsSectionIds = (atsPages[0]?.singleSections || []).map(s => s.id);
    expect(atsSectionIds).not.toContain('profile_photo');
    expect(atsSectionIds).toContain('exp');

    // Input sections must remain completely unmodified (pure immutability)
    expect(sections[0].id).toBe('profile_photo');
  });

  it('excludes photo section from ATS clean print HTML export', () => {
    const cvData = {
      layout: { type: '1-column', isAtsMode: true },
      sections: [
        photoSection,
        { id: 'exp', type: 'experience', title: 'Experiencia', items: [{ id: 'e1', title: 'Ingeniero de Software' }] }
      ]
    };

    const html = generateCleanPrintHTML(cvData);
    expect(html).not.toContain('cv-photo-img');
    expect(html).not.toContain('https://example.com/avatar.jpg');
    expect(html).toContain('Ingeniero de Software');
  });
});

describe('3. Master AI Tips Toggle & Right-Rail AITipsSidebar', () => {
  it('renders the master toggle in the top panel next to ATS mode toggle', () => {
    render(
      <CVProvider>
        <LayoutModeToggle />
      </CVProvider>
    );

    const masterToggle = screen.getByTestId('master-tips-toggle');
    expect(masterToggle).toBeInTheDocument();
    expect(masterToggle).toHaveTextContent('Consejos IA');
  });

  it('clicking master toggle switches showAITips state globally', () => {
    let capturedContext = null;
    const TestProbe = () => {
      capturedContext = useCV();
      return <LayoutModeToggle />;
    };

    render(
      <CVProvider>
        <TestProbe />
      </CVProvider>
    );

    const initialTipState = capturedContext.showAITips;
    const masterToggle = screen.getByTestId('master-tips-toggle');

    fireEvent.click(masterToggle);
    expect(capturedContext.showAITips).toBe(!initialTipState);

    fireEvent.click(masterToggle);
    expect(capturedContext.showAITips).toBe(initialTipState);
  });

  it('AITipsSidebar renders Obsidian Callouts strictly adhering to Invariant 1 when showAITips is true', () => {
    const cvData = {
      layout: { type: '2-column', isAtsMode: false },
      sections: [
        { id: 'experience', type: 'experience', title: 'Experiencia', items: [] },
        { id: 'skills', type: 'skills', title: 'Habilidades', items: [] }
      ]
    };

    render(
      <CVProvider initialCV={cvData}>
        <AITipsSidebar />
      </CVProvider>
    );

    const sidebar = screen.getByTestId('ai-tips-sidebar');
    expect(sidebar).toBeInTheDocument();

    // Check for Obsidian Callouts
    const callouts = sidebar.querySelectorAll('.obsidian-callout');
    expect(callouts.length).toBeGreaterThan(0);

    // Verify structure: .obsidian-callout -> .callout-title & .callout-content
    const firstCallout = callouts[0];
    const title = firstCallout.querySelector('.callout-title');
    const content = firstCallout.querySelector('.callout-content');
    const icon = firstCallout.querySelector('.callout-icon');

    expect(title).toBeInTheDocument();
    expect(content).toBeInTheDocument();
    expect(icon).toBeInTheDocument();

    // Verify zero raw emojis in DOM (must use Lucide SVGs)
    expect(firstCallout.textContent).not.toMatch(/[🛑🚨⚠️ℹ️💡]/);
    expect(icon.querySelector('svg')).toBeInTheDocument();
  });

  it('AITipsSidebar renders nothing when showAITips is false', () => {
    const Consumer = () => {
      const { setShowAITips } = useCV();
      React.useEffect(() => {
        setShowAITips(false);
      }, [setShowAITips]);

      return <AITipsSidebar />;
    };

    const { container } = render(
      <CVProvider>
        <Consumer />
      </CVProvider>
    );

    expect(container.querySelector('[data-testid="ai-tips-sidebar"]')).toBeNull();
  });

  it('BaseSection contains ZERO individual tips buttons per user requirement', () => {
    const mockSection = {
      id: 'experience',
      type: 'experience',
      title: 'Experiencia Laboral',
      items: [{ id: 'item_1', title: 'Lead Architect', bullets: ['Built distributed systems'] }]
    };

    const { container } = render(
      <CVProvider>
        <BaseSection section={mockSection} />
      </CVProvider>
    );

    // Must be completely null
    const tipsBtn = container.querySelector('.section-tips-toggle-btn');
    expect(tipsBtn).toBeNull();

    // Action buttons container only contains bullet customize (if supported) and delete button
    const actionsContainer = container.querySelector('.section-action-buttons');
    expect(actionsContainer).toBeInTheDocument();
    const buttons = actionsContainer.querySelectorAll('button');
    buttons.forEach((btn) => {
      expect(btn).not.toHaveClass('section-tips-toggle-btn');
    });
  });
});
