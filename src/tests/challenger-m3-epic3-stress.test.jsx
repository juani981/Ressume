import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import App from '../App';
import ActionMenu from '../components/Editor/ActionMenu';
import AddSectionModal from '../components/Editor/AddSectionModal';
import { CVProvider, useCV } from '../context/CVContext';
import * as printEngineModule from '../utils/staticHtmlPdfEngine';

// Inspector helper to check state transitions and invariants
const InvariantInspector = ({ onState }) => {
  const { cvData, activeLanguage } = useCV();
  React.useEffect(() => {
    if (onState) onState({ cvData, activeLanguage });
  }, [cvData, activeLanguage, onState]);
  return null;
};

describe('Empirical Challenger M3-1: Epic 3 Stress & Invariant Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // Challenge Suite 1: ATS Mode Stress Transitions & Section Order Invariants
  // =========================================================================
  describe('Challenge Suite 1: ATS Mode Stress Transitions & Section Order Invariants', () => {
    it('CHAL-1.1: Rapid consecutive toggles (20 cycles) maintain state consistency and zero section corruption', () => {
      let stateRecord = null;
      render(
        <CVProvider>
          <App />
          <InvariantInspector onState={(s) => { stateRecord = s; }} />
        </CVProvider>
      );

      const initialSections = JSON.parse(JSON.stringify(stateRecord.cvData.sections));
      const initialSectionIds = initialSections.map(s => s.id);
      expect(initialSections.length).toBeGreaterThan(0);

      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      const areaCv = document.getElementById('area-cv');

      // Stress test: 20 rapid back-and-forth toggles
      for (let i = 1; i <= 20; i++) {
        fireEvent.click(toggleBtn);

        const isOdd = i % 2 === 1;
        if (isOdd) {
          // Odd iteration -> ATS mode
          expect(stateRecord.cvData.layout.type).toBe('1-column');
          expect(stateRecord.cvData.layout.isAtsMode).toBe(true);
          expect(areaCv).toHaveClass('resume--ats-mode');
          expect(areaCv).toHaveClass('resume__single-column');
          expect(areaCv).not.toHaveClass('bd-grid');
          expect(areaCv.style.background).toBe('rgb(255, 255, 255)');
        } else {
          // Even iteration -> Two-column mode
          expect(stateRecord.cvData.layout.type).toBe('2-column');
          expect(stateRecord.cvData.layout.isAtsMode).toBe(false);
          expect(areaCv).not.toHaveClass('resume--ats-mode');
          expect(areaCv).toHaveClass('bd-grid');
        }

        // INVARIANT CHECK: Section order and IDs must remain 100% intact after every toggle
        const currentSectionIds = stateRecord.cvData.sections.map(s => s.id);
        expect(currentSectionIds).toEqual(initialSectionIds);

        // Verify localStorage synchronization
        const stored = JSON.parse(localStorage.getItem('cvData'));
        expect(stored.layout.isAtsMode).toBe(isOdd);
      }

      // End of 20 cycles: verify every section's internal items were not lost
      stateRecord.cvData.sections.forEach((sec, idx) => {
        expect(sec.id).toBe(initialSections[idx].id);
        expect(sec.column).toBe(initialSections[idx].column);
        expect(sec.items.length).toBe(initialSections[idx].items.length);
      });
    });

    it('CHAL-1.2: Adding a section in ATS mode renders properly and preserves column semantics upon reverting to 2-column', () => {
      let stateRecord = null;
      render(
        <CVProvider>
          <App />
          <InvariantInspector onState={(s) => { stateRecord = s; }} />
        </CVProvider>
      );

      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      // Switch to ATS mode
      fireEvent.click(toggleBtn);
      expect(stateRecord.cvData.layout.isAtsMode).toBe(true);

      const initialCount = stateRecord.cvData.sections.length;

      // Open Add Section modal in ATS mode
      const addSecBtn = screen.getByRole('button', { name: /agregar nueva sección/i });
      fireEvent.click(addSecBtn);

      // Select projects section
      const projectsCard = screen.getByTestId('add-section-card-projects');
      fireEvent.click(projectsCard);

      // Modal closes, section count increases by 1
      expect(stateRecord.cvData.sections.length).toBe(initialCount + 1);
      const newSection = stateRecord.cvData.sections[stateRecord.cvData.sections.length - 1];
      expect(newSection.type).toBe('projects');

      // Revert back to 2-column mode
      fireEvent.click(toggleBtn);
      expect(stateRecord.cvData.layout.isAtsMode).toBe(false);
      expect(stateRecord.cvData.layout.type).toBe('2-column');

      // The newly added section is still in the document and correctly assigned
      expect(stateRecord.cvData.sections.length).toBe(initialCount + 1);
      expect(stateRecord.cvData.sections.some(s => s.id === newSection.id)).toBe(true);
    });

    it('CHAL-1.3: CSS custom properties and layout tokens persist intact across ATS toggle cycles', () => {
      let stateRecord = null;
      render(
        <CVProvider>
          <App />
          <InvariantInspector onState={(s) => { stateRecord = s; }} />
        </CVProvider>
      );

      // Open Design panel and customize spacing
      fireEvent.click(screen.getByTestId('btn-open-design'));
      fireEvent.click(screen.getByTestId('tab-spacing'));

      const paddingSlider = screen.getByLabelText(/control de margen de página/i);
      fireEvent.change(paddingSlider, { target: { value: '44' } });

      const sectionGapSlider = screen.getByLabelText(/control de espacio entre secciones/i);
      fireEvent.change(sectionGapSlider, { target: { value: '30' } });

      const itemGapSlider = screen.getByLabelText(/control de espacio entre elementos/i);
      fireEvent.change(itemGapSlider, { target: { value: '16' } });

      // Toggle to ATS mode
      const toggleBtn = screen.getByTestId('ats-mode-toggle');
      fireEvent.click(toggleBtn);

      const areaCv = document.getElementById('area-cv');
      expect(areaCv.style.getPropertyValue('--page-padding')).toBe('44px');
      expect(areaCv.style.getPropertyValue('--section-gap')).toBe('30px');
      expect(areaCv.style.getPropertyValue('--item-gap')).toBe('16px');

      // Toggle back to 2-column mode
      fireEvent.click(toggleBtn);

      expect(areaCv.style.getPropertyValue('--page-padding')).toBe('44px');
      expect(areaCv.style.getPropertyValue('--section-gap')).toBe('30px');
      expect(areaCv.style.getPropertyValue('--item-gap')).toBe('16px');
      expect(stateRecord.cvData.layout.pagePadding).toBe(44);
      expect(stateRecord.cvData.layout.sectionGap).toBe(30);
      expect(stateRecord.cvData.layout.itemGap).toBe(16);
    });
  });

  // =========================================================================
  // Challenge Suite 2: AddSectionModal Viewport Geometry Stress Tests
  // =========================================================================
  describe('Challenge Suite 2: AddSectionModal Viewport Geometry Stress Tests', () => {
    let mockAreaCv;

    beforeEach(() => {
      mockAreaCv = document.createElement('div');
      mockAreaCv.id = 'area-cv';
      document.body.appendChild(mockAreaCv);
    });

    afterEach(() => {
      if (mockAreaCv && mockAreaCv.parentNode) {
        mockAreaCv.parentNode.removeChild(mockAreaCv);
      }
    });

    it('CHAL-2.1: Wide Desktop (1920px) — modal floats strictly to the right without center-overlaying #area-cv', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

      // CV centered on 1920px screen: width 1000px, left: 460px, right: 1460px
      vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 32,
        left: 460,
        right: 1460,
        bottom: 1200,
        width: 1000,
        height: 1168
      });

      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const modal = screen.getByTestId('add-section-modal');
      expect(modal).toBeInTheDocument();

      const left = parseInt(modal.style.left, 10);
      const width = parseInt(modal.style.width, 10);

      // Must be to the right of #area-cv (cvRect.right + 16 = 1476)
      expect(left).toBe(1476);
      expect(left).toBeGreaterThan(1460); // strictly right of #area-cv right edge
      expect(width).toBeLessThanOrEqual(380);
      expect(width).toBeGreaterThanOrEqual(260);

      // Must fit within viewport: left + width <= 1920
      expect(left + width).toBeLessThanOrEqual(1920);

      // Must NOT be screen-centered: screen center = 1920/2 = 960
      const centerOfModal = left + (width / 2);
      expect(Math.abs(centerOfModal - 960)).toBeGreaterThan(400);
    });

    it('CHAL-2.2: Medium Desktop (1400px) — modal docks in available right gutter without clipping #area-cv', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1400 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

      // ATS mode CV centered: width 840px, left: 280px, right: 1120px
      // Available right space: 1400 - 1120 = 280px (>= 260px)
      vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 20,
        left: 280,
        right: 1120,
        bottom: 1100,
        width: 840,
        height: 1080
      });

      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const modal = screen.getByTestId('add-section-modal');
      const left = parseInt(modal.style.left, 10);
      const width = parseInt(modal.style.width, 10);

      // Float adjacent to right edge: 1120 + 16 = 1136
      expect(left).toBe(1136);
      expect(left).toBeGreaterThanOrEqual(1120);

      // Width calculation: Math.min(380, Math.max(260, 280 - 32)) = 260px
      expect(width).toBe(260);
      expect(left + width).toBeLessThanOrEqual(1400);
    });

    it('CHAL-2.3: Narrow Viewport (<260px right gutter) — falls back to right docking without center modal obscuration', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1000 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

      // CV takes 850px of 1000px viewport, leaving only 150px right gutter (< 260px)
      vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 20,
        left: 0,
        right: 850,
        bottom: 1000,
        width: 850,
        height: 980
      });

      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const modal = screen.getByTestId('add-section-modal');
      // In constrained viewport, panel docks with right: 16px rather than center overlay
      expect(modal.style.right).toBe('16px');
      expect(modal.style.position).toBe('fixed');

      // Transparent backdrop is non-blocking
      const backdrop = screen.getByTestId('add-section-backdrop');
      expect(backdrop.style.background).toBe('rgba(15, 23, 42, 0.05)');
    });

    it('CHAL-2.4: Window resize and scroll triggers update computePosition dynamically', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1600 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

      const getRectSpy = vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 40,
        left: 300,
        right: 1140,
        bottom: 1000,
        width: 840,
        height: 960
      });

      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={vi.fn()} />
        </CVProvider>
      );

      const modal = screen.getByTestId('add-section-modal');
      expect(parseInt(modal.style.left, 10)).toBe(1156);

      // Now simulate user resizing window wider
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
      getRectSpy.mockReturnValue({
        top: 40,
        left: 460,
        right: 1300,
        bottom: 1000,
        width: 840,
        height: 960
      });

      act(() => {
        window.dispatchEvent(new Event('resize'));
      });

      expect(parseInt(modal.style.left, 10)).toBe(1316);

      // Now simulate scroll event
      getRectSpy.mockReturnValue({
        top: 10,
        left: 460,
        right: 1300,
        bottom: 970,
        width: 840,
        height: 960
      });

      act(() => {
        window.dispatchEvent(new Event('scroll'));
      });

      expect(parseInt(modal.style.top, 10)).toBe(16); // Math.max(16, ...)
    });
  });

  // =========================================================================
  // Challenge Suite 3: Submenu Interactions, Mutual Exclusion & Deep Controls
  // =========================================================================
  describe('Challenge Suite 3: Submenu Interactions, Mutual Exclusion & Controls', () => {
    it('CHAL-3.1: Submenu mutual exclusion and toggle behavior', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const designBtn = screen.getByTestId('btn-open-design');
      const designSubmenu = screen.getByTestId('design-submenu');
      const nativePrintBtn = screen.getByTestId('btn-action-native-print');

      // Initially closed
      expect(designSubmenu.style.opacity).toBe('0');
      expect(nativePrintBtn).toBeInTheDocument();

      // Click Design -> opens Design
      fireEvent.click(designBtn);
      expect(designSubmenu.style.opacity).toBe('1');
      expect(designSubmenu.style.pointerEvents).toBe('auto');

      // Click Design again -> toggles closed
      fireEvent.click(designBtn);
      expect(designSubmenu.style.opacity).toBe('0');
      expect(designSubmenu.style.pointerEvents).toBe('none');

      // Obsolete actions submenu is streamlined and absent
      expect(screen.queryByTestId('actions-submenu')).toBeNull();
      expect(screen.queryByTestId('btn-open-actions')).toBeNull();
    });

    it('CHAL-3.2: Typography controls update layout tokens and Reset Typography restores defaults', () => {
      let stateRecord = null;
      render(
        <CVProvider>
          <ActionMenu />
          <InvariantInspector onState={(s) => { stateRecord = s; }} />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('btn-open-design'));
      fireEvent.click(screen.getByTestId('tab-typography'));

      // Change Font Family to Roboto
      const fontSelect = screen.getByLabelText(/selector de tipo de letra/i);
      fireEvent.change(fontSelect, { target: { value: 'Roboto' } });
      expect(stateRecord.cvData.layout.fontFamily).toBe('Roboto');

      // Modify all scales
      fireEvent.change(screen.getByTestId('slider-title-scale'), { target: { value: '1.35' } });
      fireEvent.change(screen.getByTestId('slider-body-scale'), { target: { value: '1.20' } });
      fireEvent.change(screen.getByTestId('slider-list-scale'), { target: { value: '1.25' } });
      fireEvent.change(screen.getByTestId('slider-font-scale'), { target: { value: '1.15' } });
      fireEvent.change(screen.getByTestId('slider-line-height'), { target: { value: '1.75' } });

      expect(stateRecord.cvData.layout.titleScale).toBe(1.35);
      expect(stateRecord.cvData.layout.bodyScale).toBe(1.20);
      expect(stateRecord.cvData.layout.listScale).toBe(1.25);
      expect(stateRecord.cvData.layout.fontScale).toBe(1.15);
      expect(stateRecord.cvData.layout.lineHeight).toBe(1.75);

      // Click Reset Typography
      const resetBtn = screen.getByTestId('btn-reset-typography');
      fireEvent.click(resetBtn);

      expect(stateRecord.cvData.layout.titleScale).toBe(1.0);
      expect(stateRecord.cvData.layout.bodyScale).toBe(1.0);
      expect(stateRecord.cvData.layout.listScale).toBe(1.0);
      expect(stateRecord.cvData.layout.fontScale).toBe(1.0);
      expect(stateRecord.cvData.layout.lineHeight).toBe(1.45);
    });

    it('CHAL-3.3: Acciones menu export actions execution and error handling', async () => {
      const cleanPrintSpy = vi.spyOn(printEngineModule, 'executeCleanPrint').mockResolvedValue();
      const createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:http://localhost/mock-export-pdf');
      const revokeObjectURLSpy = vi.spyOn(window.URL, 'revokeObjectURL').mockImplementation(() => {});

      const origCreateElement = document.createElement.bind(document);
      const clickedLinks = [];
      const createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
        const el = origCreateElement(tagName, options);
        if (tagName.toLowerCase() === 'a') {
          el.click = vi.fn(() => { clickedLinks.push(el); });
        }
        return el;
      });

      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      // Native print trigger directly from toolbar
      fireEvent.click(screen.getByTestId('btn-action-native-print'));
      expect(cleanPrintSpy).toHaveBeenCalledTimes(1);

      // Verify Vector PDF button is completely removed
      expect(screen.queryByTestId('btn-action-vector-pdf')).toBeNull();

      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
      createElementSpy.mockRestore();
    });
  });
});
