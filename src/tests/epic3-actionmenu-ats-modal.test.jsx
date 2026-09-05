import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import ActionMenu from '../components/Editor/ActionMenu';
import LayoutModeToggle from '../components/Editor/LayoutModeToggle';
import AddSectionModal from '../components/Editor/AddSectionModal';
import App from '../App';
import { CVProvider, useCV } from '../context/CVContext';
import * as printEngineModule from '../utils/staticHtmlPdfEngine';

// Helper component for observing CVContext state
const StateInspector = ({ onState }) => {
  const { cvData, activeLanguage } = useCV();
  React.useEffect(() => {
    if (onState) onState({ cvData, activeLanguage });
  }, [cvData, activeLanguage, onState]);
  return (
    <div data-testid="state-inspector" style={{ display: 'none' }}>
      <span data-testid="layout-type">{cvData.layout?.type}</span>
      <span data-testid="layout-ats">{String(cvData.layout?.isAtsMode)}</span>
      <span data-testid="layout-font">{cvData.layout?.fontFamily}</span>
      <span data-testid="layout-page-padding">{cvData.layout?.pagePadding}</span>
      <span data-testid="layout-section-gap">{cvData.layout?.sectionGap}</span>
      <span data-testid="layout-item-gap">{cvData.layout?.itemGap}</span>
    </div>
  );
};

describe('Epic 3: Floating Panel Reorganization, ATS Mode & Right-Docked Modal', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Suite 1: ActionMenu Button Streamlining & Top ATS Layout Toggle Switch
  // =========================================================================
  describe('Suite 1: ActionMenu Button Streamlining & Top ATS Switch', () => {
    it('T1.1: reduces top-level visible buttons to streamlined grouped architecture', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const navbar = document.querySelector('.l-navbar');
      expect(navbar).toBeInTheDocument();

      // Top-level button items inside .l-navbar should be strictly minimized (<= 8 items)
      // vs previous 13+ buttons & color inputs
      const topButtons = navbar.querySelectorAll('.action-menu-btn');
      expect(topButtons.length).toBeLessThanOrEqual(8);

      // Verify that color inputs are NO LONGER directly in .l-navbar
      const navbarColorInputs = navbar.querySelectorAll('input[type="color"]');
      expect(navbarColorInputs.length).toBe(0);
    });

    it('T1.2: layout toggle switch is rendered prominently with dual legends and icons', () => {
      render(
        <CVProvider>
          <LayoutModeToggle />
        </CVProvider>
      );

      const toggleContainer = document.querySelector('.layout-mode-toggle-container');
      expect(toggleContainer).toBeInTheDocument();

      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      expect(toggleBtn).toBeInTheDocument();
      expect(toggleBtn).toHaveAttribute('aria-label', expect.stringMatching(/optimizado ats|1 columna/i));
      expect(screen.getByText(/diseño tradicional/i)).toBeInTheDocument();
      expect(screen.getByText(/optimizado ats/i)).toBeInTheDocument();
    });

    it('T1.3: clicking toggle switch activates ATS mode (1-column, isAtsMode: true) and saves to localStorage', () => {
      let currentState = null;
      render(
        <CVProvider>
          <LayoutModeToggle />
          <StateInspector onState={(s) => { currentState = s; }} />
        </CVProvider>
      );

      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      fireEvent.click(toggleBtn);

      expect(currentState.cvData.layout.type).toBe('1-column');
      expect(currentState.cvData.layout.isAtsMode).toBe(true);

      const saved = JSON.parse(localStorage.getItem('cvData'));
      expect(saved.layout.type).toBe('1-column');
      expect(saved.layout.isAtsMode).toBe(true);
    });

    it('T1.4: clicking toggle switch in ATS mode reverts back to Two-Column mode', () => {
      let currentState = null;
      render(
        <CVProvider>
          <LayoutModeToggle />
          <StateInspector onState={(s) => { currentState = s; }} />
        </CVProvider>
      );

      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      // 1st click: activate ATS
      fireEvent.click(toggleBtn);
      expect(currentState.cvData.layout.type).toBe('1-column');

      // 2nd click: revert to 2-column
      fireEvent.click(toggleBtn);
      expect(currentState.cvData.layout.type).toBe('2-column');
      expect(currentState.cvData.layout.isAtsMode).toBe(false);

      const saved = JSON.parse(localStorage.getItem('cvData'));
      expect(saved.layout.type).toBe('2-column');
      expect(saved.layout.isAtsMode).toBe(false);
    });
  });

  // =========================================================================
  // Suite 2: Grouped 'Diseño' Submenu (Colors, Spacing, Typography)
  // =========================================================================
  describe('Suite 2: Grouped Diseño Submenu (Colors, Spacing, Typography)', () => {
    it('T2.1: provides single grouped entry point for Diseño and opens submenu on click', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const designBtn = screen.getByTestId('btn-open-design');
      expect(designBtn).toBeInTheDocument();

      const designSubmenu = screen.getByTestId('design-submenu');
      expect(designSubmenu).toBeInTheDocument();

      // Open Diseño submenu
      fireEvent.click(designBtn);
      expect(designSubmenu.style.opacity).toBe('1');
      expect(designSubmenu.style.pointerEvents).toBe('auto');
    });

    it('T2.2: contains Typography controls and adjusts scale and font family', () => {
      let currentState = null;
      render(
        <CVProvider>
          <ActionMenu />
          <StateInspector onState={(s) => { currentState = s; }} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-open-design'));

      // Switch to typography tab
      fireEvent.click(screen.getByTestId('tab-typography'));

      // Change font family
      const fontSelect = screen.getByLabelText(/selector de tipo de letra/i);
      fireEvent.change(fontSelect, { target: { value: 'Inter' } });
      expect(currentState.cvData.layout.fontFamily).toBe('Inter');

      // Change title scale slider
      const titleSlider = screen.getByTestId('slider-title-scale');
      fireEvent.change(titleSlider, { target: { value: '1.25' } });
      expect(currentState.cvData.layout.titleScale).toBe(1.25);

      // Change body scale slider
      const bodySlider = screen.getByTestId('slider-body-scale');
      fireEvent.change(bodySlider, { target: { value: '1.10' } });
      expect(currentState.cvData.layout.bodyScale).toBe(1.1);

      // Change font scale slider
      const fontScaleSlider = screen.getByTestId('slider-font-scale');
      fireEvent.change(fontScaleSlider, { target: { value: '1.15' } });
      expect(currentState.cvData.layout.fontScale).toBe(1.15);

      const saved = JSON.parse(localStorage.getItem('cvData'));
      expect(saved.layout.fontFamily).toBe('Inter');
      expect(saved.layout.titleScale).toBe(1.25);
    });

    it('T2.3: contains Spacing and Margin controls and updates spacing tokens', () => {
      let currentState = null;
      render(
        <CVProvider>
          <ActionMenu />
          <StateInspector onState={(s) => { currentState = s; }} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-open-design'));

      // Switch to Spacing tab
      fireEvent.click(screen.getByTestId('tab-spacing'));

      // Page padding
      const paddingSlider = screen.getByLabelText(/control de margen de página/i);
      fireEvent.change(paddingSlider, { target: { value: '32' } });
      expect(currentState.cvData.layout.pagePadding).toBe(32);

      // Section gap
      const sectionGapSlider = screen.getByLabelText(/control de espacio entre secciones/i);
      fireEvent.change(sectionGapSlider, { target: { value: '26' } });
      expect(currentState.cvData.layout.sectionGap).toBe(26);

      // Item gap
      const itemGapSlider = screen.getByLabelText(/control de espacio entre elementos/i);
      fireEvent.change(itemGapSlider, { target: { value: '12' } });
      expect(currentState.cvData.layout.itemGap).toBe(12);

      const saved = JSON.parse(localStorage.getItem('cvData'));
      expect(saved.layout.pagePadding).toBe(32);
      expect(saved.layout.sectionGap).toBe(26);
      expect(saved.layout.itemGap).toBe(12);
    });

    it('T2.4: contains Color pickers in 2-column mode and informs user in ATS mode', () => {
      let currentState = null;
      render(
        <CVProvider>
          <ActionMenu />
          <LayoutModeToggle />
          <StateInspector onState={(s) => { currentState = s; }} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-open-design'));
      fireEvent.click(screen.getByTestId('tab-colors'));

      // In 2-column mode, lateral and main column color pickers are active
      const leftBgInput = screen.getByLabelText(/fondo columna lateral/i);
      const rightBgInput = screen.getByLabelText(/fondo columna principal/i);
      expect(leftBgInput).toBeInTheDocument();
      expect(rightBgInput).toBeInTheDocument();

      fireEvent.change(leftBgInput, { target: { value: '#2d3748' } });
      expect(currentState.cvData.layout.leftBg).toBe('#2d3748');

      // Now toggle to ATS mode
      fireEvent.click(screen.getByTestId('ats-mode-toggle'));

      // In ATS mode, an Obsidian callout is displayed explaining pure white bg
      expect(screen.getByText(/modo ats activo/i)).toBeInTheDocument();
      expect(screen.getByText(/fondo blanco puro/i)).toBeInTheDocument();
    });

    it('T2.5: close button in Diseño submenu closes panel', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const designBtn = screen.getByTestId('btn-open-design');
      fireEvent.click(designBtn);

      const designSubmenu = screen.getByTestId('design-submenu');
      expect(designSubmenu.style.opacity).toBe('1');

      const closeBtn = screen.getByLabelText(/cerrar panel de diseño/i);
      fireEvent.click(closeBtn);
      expect(designSubmenu.style.opacity).toBe('0');
      expect(designSubmenu.style.pointerEvents).toBe('none');
    });
  });

  // =========================================================================
  // Suite 3: Grouped 'Acciones' Submenu (JSON, Vector PDF, Native Print)
  // =========================================================================
  describe('Suite 3: Grouped Acciones Submenu (JSON, Vector PDF, Print)', () => {
    it('T3.1: provides single grouped entry point for Acciones and toggles submenu', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const actionsBtn = screen.getByTestId('btn-open-actions');
      expect(actionsBtn).toBeInTheDocument();

      const actionsSubmenu = screen.getByTestId('actions-submenu');
      expect(actionsSubmenu).toBeInTheDocument();

      fireEvent.click(actionsBtn);
      expect(actionsSubmenu.style.opacity).toBe('1');
      expect(actionsSubmenu.style.pointerEvents).toBe('auto');

      // Close via X button
      const closeBtn = screen.getByLabelText(/cerrar panel de acciones/i);
      fireEvent.click(closeBtn);
      expect(actionsSubmenu.style.opacity).toBe('0');
      expect(actionsSubmenu.style.pointerEvents).toBe('none');
    });

    it('T3.2: opening Acciones closes Diseño and vice-versa', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const designBtn = screen.getByTestId('btn-open-design');
      const actionsBtn = screen.getByTestId('btn-open-actions');
      const designSubmenu = screen.getByTestId('design-submenu');
      const actionsSubmenu = screen.getByTestId('actions-submenu');

      // Open design
      fireEvent.click(designBtn);
      expect(designSubmenu.style.opacity).toBe('1');
      expect(actionsSubmenu.style.opacity).toBe('0');

      // Open actions
      fireEvent.click(actionsBtn);
      expect(actionsSubmenu.style.opacity).toBe('1');
      expect(designSubmenu.style.opacity).toBe('0');
    });

    it('T3.3: Direct "Descargar como PDF" button in toolbar triggers clean print and vector PDF is absent', async () => {
      const executeCleanPrintSpy = vi.spyOn(printEngineModule, 'executeCleanPrint').mockResolvedValue();

      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const nativePrintBtn = screen.getByTestId('btn-action-native-print');
      const vectorPdfBtn = screen.queryByTestId('btn-action-vector-pdf');

      expect(vectorPdfBtn).toBeNull();
      expect(nativePrintBtn).toBeInTheDocument();

      // Trigger native clean print directly from toolbar
      fireEvent.click(nativePrintBtn);
      expect(executeCleanPrintSpy).toHaveBeenCalledTimes(1);
    });
  });

  // =========================================================================
  // Suite 4: ATS Mode Visual Styling & DOM Integrity
  // =========================================================================
  describe('Suite 4: ATS Mode Visual Styling & DOM Integrity', () => {
    it('T4.1: #area-cv receives resume--ats-mode and resume__single-column in ATS mode', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      const areaCv = document.getElementById('area-cv');
      expect(areaCv).toBeInTheDocument();

      // Initially 2-column mode
      expect(areaCv).toHaveClass('bd-grid');
      expect(areaCv).not.toHaveClass('resume--ats-mode');

      // Click ATS toggle switch
      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      fireEvent.click(toggleBtn);

      // In ATS mode
      expect(areaCv).toHaveClass('resume--ats-mode');
      expect(areaCv).toHaveClass('resume__single-column');
      expect(areaCv).not.toHaveClass('bd-grid');
      expect(areaCv.style.background).toBe('rgb(255, 255, 255)');
    });

    it('T4.2: ATS mode renders clean centered document container without 2-col resizer', () => {
      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      expect(screen.getByTestId('column-resizer')).toBeInTheDocument();

      // Switch to ATS mode
      fireEvent.click(screen.getByTestId('ats-mode-toggle'));

      // Resizer divider is removed in single-column ATS layout
      expect(screen.queryByTestId('column-resizer')).not.toBeInTheDocument();
      expect(document.querySelector('.resume__single-column')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // Suite 5: AddSectionModal Right-Docked Floating Repositioning (AGENTS.md Rule 3)
  // =========================================================================
  describe('Suite 5: AddSectionModal Right-Docked Floating Repositioning', () => {
    it('T5.1: does not render modal in DOM when isOpen is false', () => {
      render(
        <CVProvider>
          <AddSectionModal isOpen={false} onClose={vi.fn()} />
        </CVProvider>
      );

      expect(screen.queryByTestId('add-section-modal')).not.toBeInTheDocument();
    });

    it('T5.2: when open, dynamically calculates position to the right of #area-cv without overlaying it', () => {
      // Mock #area-cv element in document
      const mockAreaCv = document.createElement('div');
      mockAreaCv.id = 'area-cv';
      vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 40,
        left: 100,
        right: 900,
        bottom: 1200,
        width: 800,
        height: 1160
      });
      document.body.appendChild(mockAreaCv);

      // Mock window geometry
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1400 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={vi.fn()} targetColumn="right" />
        </CVProvider>
      );

      const modal = screen.getByTestId('add-section-modal');
      expect(modal).toBeInTheDocument();

      // left must be strictly >= areaCv.right (floating to the right, never overlaying center)
      const leftValue = parseInt(modal.style.left, 10);
      expect(leftValue).toBeGreaterThanOrEqual(900);

      // Width takes advantage of available viewport space: window.innerWidth - rect.right = 1400 - 900 = 500
      const widthValue = parseInt(modal.style.width, 10);
      expect(widthValue).toBeGreaterThanOrEqual(260);
      expect(widthValue).toBeLessThanOrEqual(400);

      document.body.removeChild(mockAreaCv);
    });

    it('T5.3: renders transparent backdrop and all 12 section descriptors with add buttons', () => {
      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={vi.fn()} targetColumn="right" />
        </CVProvider>
      );

      const backdrop = screen.getByTestId('add-section-backdrop');
      expect(backdrop).toBeInTheDocument();
      expect(backdrop.style.background).toBe('rgba(15, 23, 42, 0.05)');

      // Check section type cards
      expect(screen.getByTestId('add-section-card-projects')).toBeInTheDocument();
      expect(screen.getByTestId('add-section-card-list')).toBeInTheDocument();
      expect(screen.getByTestId('add-section-card-education')).toBeInTheDocument();
      expect(screen.getByTestId('add-section-card-skills')).toBeInTheDocument();
      expect(screen.getByTestId('add-section-card-certificates')).toBeInTheDocument();
      expect(screen.getByTestId('add-section-card-languages')).toBeInTheDocument();
    });

    it('T5.4: clicking a section card adds section to target column and closes modal', () => {
      const onCloseMock = vi.fn();
      let currentState = null;

      render(
        <CVProvider>
          <StateInspector onState={(s) => { currentState = s; }} />
          <AddSectionModal isOpen={true} onClose={onCloseMock} targetColumn="right" />
        </CVProvider>
      );

      const initialCount = currentState.cvData.sections.length;

      // Click on projects section card
      fireEvent.click(screen.getByTestId('add-section-card-projects'));

      expect(onCloseMock).toHaveBeenCalledTimes(1);
      expect(currentState.cvData.sections.length).toBe(initialCount + 1);
    });

    it('T5.5: closing via close button, backdrop click, or Escape key calls onClose', () => {
      const onCloseCloseBtn = vi.fn();
      const { rerender } = render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={onCloseCloseBtn} targetColumn="right" />
        </CVProvider>
      );

      // Close button
      fireEvent.click(screen.getByLabelText(/cerrar modal/i));
      expect(onCloseCloseBtn).toHaveBeenCalledTimes(1);

      // Backdrop click
      const onCloseBackdrop = vi.fn();
      rerender(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={onCloseBackdrop} targetColumn="right" />
        </CVProvider>
      );
      fireEvent.click(screen.getByTestId('add-section-backdrop'));
      expect(onCloseBackdrop).toHaveBeenCalledTimes(1);

      // Escape key
      const onCloseEscape = vi.fn();
      rerender(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={onCloseEscape} targetColumn="right" />
        </CVProvider>
      );
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(onCloseEscape).toHaveBeenCalledTimes(1);
    });
  });
});
