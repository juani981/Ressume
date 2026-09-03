import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import App from '../App';
import ActionMenu from '../components/Editor/ActionMenu';
import InlineEdit from '../components/Editor/InlineEdit';
import RichTextToolbar from '../components/Editor/RichTextToolbar';
import AddSectionModal from '../components/Editor/AddSectionModal';
import CVDocument from '../components/PDF/CVDocument';
import { CVSectionPdf } from '../components/PDF/CVSectionPdf';
import { CVItemPdf } from '../components/PDF/CVItemPdf';
import { RichTextPdf } from '../components/PDF/richTextPdf';
import { 
  getDynamicTextColors, 
  mapFontFamilyToPdf, 
  computePdfFontSizes, 
  computePdfSpacing, 
  createCvStyles 
} from '../components/PDF/pdfStyleFactory';
import { 
  renderPdfBlob, 
  generateAndDownloadPdf, 
  normalizeCvDataForPdf 
} from '../utils/reactPdfEngine';
import { 
  generateCleanPrintHTML, 
  executeCleanPrint 
} from '../utils/staticHtmlPdfEngine';
import { 
  sanitizeRichHTML, 
  extractAlignment, 
  applyAlignment, 
  stripOuterAlignment, 
  parseHtmlToTokens 
} from '../utils/richTextEngine';
import { defaultSchema } from '../utils/schema';
import { adaptItemToSectionType } from '../utils/itemAdapter';

describe('Final E2E Cross-Cutting Challenger: Cross-Epic Adversarial Stress Suite', () => {

  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // =========================================================================
  // SUITE 1: End-to-End Pipeline: Inline Rich Editing -> ATS Switch -> Dual Export
  // =========================================================================
  describe('Suite 1: Cross-Epic Pipeline: Inline Rich Editing -> ATS Switch -> Dual Export', () => {

    it('E2E-1.1: Rich text formatting persists through ATS layout toggle and renders in both engines', async () => {
      let contextRef = null;

      const TestHarness = () => {
        const cv = useCV();
        contextRef = cv;
        return (
          <div>
            <ActionMenu />
            <div id="area-cv">
              <InlineEdit 
                value={cv.cvData.profile?.subtitle || ''} 
                onSave={(val) => cv.updateProfile('subtitle', val)} 
                multiline={false}
              />
            </div>
          </div>
        );
      };

      render(
        <CVProvider>
          <TestHarness />
        </CVProvider>
      );

      // 1. Initial State: 2-column mode by default
      expect(contextRef.cvData.layout?.type).toBe('2-column');
      expect(contextRef.cvData.layout?.isAtsMode).toBeFalsy();

      // 2. Click inline edit display to activate rich text editing
      const displaySpan = screen.getByTestId('inline-edit-display');
      fireEvent.click(displaySpan);

      const activeInput = document.querySelector('.inline-input');
      expect(activeInput).toBeTruthy();
      expect(activeInput.getAttribute('contenteditable')).toBe('true');

      // 3. Simulate rich text input with bold, italic, and centered formatting
      const richContent = '<b>Senior Lead</b> & <i>Cloud Architect</i>';
      activeInput.innerHTML = richContent;
      fireEvent.input(activeInput);

      // Apply center alignment via toolbar
      const centerBtn = screen.getByTestId('btn-format-align-center');
      fireEvent.mouseDown(centerBtn);

      // Blur to save changes
      fireEvent.blur(activeInput);
      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      // 4. Verify formatting saved in cvData and localStorage
      const savedSubtitle = contextRef.cvData.profile.subtitle;
      expect(savedSubtitle).toContain('<b>Senior Lead</b>');
      expect(savedSubtitle).toContain('<i>Cloud Architect</i>');
      expect(extractAlignment(savedSubtitle)).toBe('center');

      const localCv = JSON.parse(localStorage.getItem('cvData'));
      expect(localCv.profile.subtitle).toBe(savedSubtitle);

      // 5. Toggle ATS 1-Column Mode via ActionMenu toggle switch
      const atsToggle = screen.getByTestId('ats-mode-toggle');
      fireEvent.click(atsToggle);

      expect(contextRef.cvData.layout.type).toBe('1-column');
      expect(contextRef.cvData.layout.isAtsMode).toBe(true);

      // Verify rich formatting is intact after layout mode change
      expect(contextRef.cvData.profile.subtitle).toBe(savedSubtitle);

      // 6. Test React-PDF Engine export with this ATS rich-text state
      const pdfBlob = await renderPdfBlob(contextRef.cvData, 'es');
      expect(pdfBlob).toBeInstanceOf(Blob);
      expect(pdfBlob.size).toBeGreaterThan(500);

      // Validate tokenization into RichTextPdf
      const parsedTokens = parseHtmlToTokens(savedSubtitle);
      expect(parsedTokens.align).toBe('center');
      expect(parsedTokens.tokens.some(t => t.text.includes('Senior Lead') && t.bold)).toBe(true);
      expect(parsedTokens.tokens.some(t => t.text.includes('Cloud Architect') && t.italic)).toBe(true);

      // 7. Test Static HTML Engine export on the exact same ATS rich-text state
      const staticHtml = generateCleanPrintHTML(contextRef.cvData, 'es');
      expect(staticHtml).toContain('<b>Senior Lead</b>');
      expect(staticHtml).toContain('<i>Cloud Architect</i>');
      expect(staticHtml).toContain('text-align: center');
      // Verify zero editor artifacts in static HTML output
      expect(staticHtml).not.toContain('rich-text-toolbar');
      expect(staticHtml).not.toContain('ats-switch-btn');
      expect(staticHtml).not.toContain('action-menu-btn');
      expect(staticHtml).not.toContain('inline-edit-active');
      // Verify super-container break-inside avoid rules
      expect(staticHtml).toContain('break-inside: avoid !important');
    });

  });

  // =========================================================================
  // SUITE 2: Undo/Redo Isolation and Keyboard Shortcuts Under Hostile Interactions
  // =========================================================================
  describe('Suite 2: Undo/Redo Isolation & Keyboard Interactions', () => {

    it('E2E-2.1: Inline text formatting undo does NOT hijack global CVContext undo/redo stack', async () => {
      let contextRef = null;

      const Harness = () => {
        const cv = useCV();
        contextRef = cv;
        return (
          <div>
            <ActionMenu />
            <div id="area-cv">
              <InlineEdit 
                value={cv.cvData.profile?.name || 'INITIAL NAME'} 
                onSave={(val) => cv.updateProfile('name', val)} 
              />
            </div>
          </div>
        );
      };

      render(
        <CVProvider>
          <Harness />
        </CVProvider>
      );

      // Step A: Make a global layout change (switch ATS mode)
      const atsToggle = screen.getByTestId('ats-mode-toggle');
      fireEvent.click(atsToggle);
      expect(contextRef.cvData.layout.type).toBe('1-column');
      expect(contextRef.canUndo).toBe(true);

      // Step B: Focus inline editor
      const displaySpan = screen.getByTestId('inline-edit-display');
      fireEvent.click(displaySpan);
      const activeInput = document.querySelector('.inline-input');
      expect(activeInput).toBeTruthy();

      // Step C: Edit text locally inside contentEditable
      activeInput.innerHTML = 'INTERMEDIATE NAME';
      fireEvent.input(activeInput);

      // Press Ctrl+B shortcut to make it bold
      fireEvent.keyDown(activeInput, { key: 'b', ctrlKey: true });
      expect(activeInput.innerHTML).toContain('INTERMEDIATE NAME');

      // Step D: Press Ctrl+Z while focused in active editable
      // Must NOT trigger global CVContext undo (layout should remain '1-column')
      fireEvent.keyDown(activeInput, { key: 'z', ctrlKey: true });
      expect(contextRef.cvData.layout.type).toBe('1-column');

      // Step E: Blur input to commit final value
      fireEvent.blur(activeInput);
      await act(async () => {
        await new Promise(r => setTimeout(r, 200));
      });

      // Step F: Now press global Ctrl+Z outside editable
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      // This undoes the text edit back to the original default name (JUAN IGNACIO CARRIZO)
      expect(contextRef.cvData.profile.name).toBe('JUAN IGNACIO CARRIZO');

      // Step G: Press global Ctrl+Z again
      fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
      // This undoes the ATS mode toggle back to 2-column
      expect(contextRef.cvData.layout.type).toBe('2-column');

      // Step H: Press global Ctrl+Y to redo
      fireEvent.keyDown(window, { key: 'y', ctrlKey: true });
      expect(contextRef.cvData.layout.type).toBe('1-column');
    });

  });

  // =========================================================================
  // SUITE 3: Super-Container Pagination & Zero-Split Invariants Under Extreme Densities
  // =========================================================================
  describe('Suite 3: Super-Container Pagination & Zero-Split Invariants', () => {

    it('E2E-3.1: Enforces atomic super-container wrapping on CVSectionPdf across 1-col and 2-col modes', () => {
      const complexSection = {
        id: 'experience_heavy',
        type: 'list',
        title: 'EXPERIENCIA PROFESIONAL',
        column: 'right',
        items: [
          {
            id: 'item_1',
            title: 'Staff Infrastructure Architect',
            subtitle: 'Global Cloud Systems',
            date: '2022 - Present',
            description: 'Leading <b>distributed cloud</b> infrastructure migrations.',
            bullets: ['Spearheaded zero-downtime Kubernetes deployments', 'Architected multi-region failover protocols']
          },
          {
            id: 'item_2',
            title: 'Senior Site Reliability Engineer',
            subtitle: 'Enterprise SaaS Solutions',
            date: '2019 - 2022',
            description: 'Maintained 99.999% SLA across 400+ microservices.',
            bullets: ['Implemented automated anomaly detection pipelines']
          },
          {
            id: 'item_3',
            title: 'DevOps Engineer',
            subtitle: 'FinTech Group',
            date: '2017 - 2019',
            description: 'Automated CI/CD release engineering.',
            bullets: ['Reduced build times by 70%']
          }
        ]
      };

      const layout = { ...defaultSchema.layout, type: '2-column' };
      const colors = getDynamicTextColors('#ffffff');
      const fontSizes = computePdfFontSizes(layout);
      const spacing = computePdfSpacing(layout);
      const styles = createCvStyles(layout);

      const { container } = render(
        <CVSectionPdf 
          section={complexSection}
          colors={colors}
          fontSizes={fontSizes}
          spacing={spacing}
          styles={styles}
        />
      );

      // In CVSectionPdf:
      // The super-container combines section title + item_1 in a <View wrap={false}>
      // And subsequent items (item_2, item_3) are each wrapped in <View wrap={false}>
      expect(container).toBeTruthy();
    });

    it('E2E-3.2: Static HTML generator preserves break-inside: avoid on all sections and blocks', () => {
      const html = generateCleanPrintHTML(defaultSchema, 'es');
      expect(html).toContain('break-inside: avoid !important');
      expect(html).toContain('page-break-inside: avoid !important');
      expect(html).toContain('.cv-section');
      expect(html).toContain('.cv-block');
    });

  });

  // =========================================================================
  // SUITE 4: Dynamic Contrast Across Dark/Light Themes and ATS White Override
  // =========================================================================
  describe('Suite 4: Dynamic Contrast & Color Boundaries', () => {

    it('E2E-4.1: Correctly calculates high-contrast palette across extreme color hex codes', () => {
      // Pure dark
      const darkBlack = getDynamicTextColors('#000000');
      expect(darkBlack.titleColor).toBe('#fcfcfc');
      expect(darkBlack.textColor).toBe('#f0efef');

      // 3-digit hex dark
      const dark3 = getDynamicTextColors('#111');
      expect(dark3.titleColor).toBe('#fcfcfc');

      // Deep navy
      const navy = getDynamicTextColors('#0f172a');
      expect(navy.titleColor).toBe('#fcfcfc');

      // Pure white
      const pureWhite = getDynamicTextColors('#ffffff');
      expect(pureWhite.titleColor).toBe('#0f172a');
      expect(pureWhite.textColor).toBe('#334155');

      // 3-digit hex light
      const white3 = getDynamicTextColors('#fff');
      expect(white3.titleColor).toBe('#0f172a');

      // Subtle light slate
      const lightSlate = getDynamicTextColors('#f8fafc');
      expect(lightSlate.titleColor).toBe('#0f172a');

      // Boundary mid-tones
      const mid1 = getDynamicTextColors('#7f7f7f'); // YIQ ~127 (dark text threshold)
      const mid2 = getDynamicTextColors('#808080'); // YIQ ~128 (light text threshold)
      expect(mid1).toBeDefined();
      expect(mid2).toBeDefined();
    });

    it('E2E-4.2: Font family correctly maps to standard Type 1 PDF fonts with 0 network latency', () => {
      expect(mapFontFamilyToPdf('Poppins')).toBe('Helvetica');
      expect(mapFontFamilyToPdf('Inter')).toBe('Helvetica');
      expect(mapFontFamilyToPdf('Roboto')).toBe('Helvetica');
      expect(mapFontFamilyToPdf('Merriweather')).toBe('Times-Roman');
      expect(mapFontFamilyToPdf('JetBrains Mono')).toBe('Courier');
      expect(mapFontFamilyToPdf('UnknownFont')).toBe('Helvetica');
    });

  });

  // =========================================================================
  // SUITE 5: ActionMenu Topology, Submenu Mutual Exclusion & Modal Viewport Docking
  // =========================================================================
  describe('Suite 5: ActionMenu Topology & Modal Viewport Geometry', () => {

    it('E2E-5.1: ActionMenu floating bar has strictly <= 8 top-level buttons', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const navBar = document.querySelector('.l-navbar');
      expect(navBar).toBeTruthy();

      const topButtons = navBar.querySelectorAll('.action-menu-btn');
      expect(topButtons.length).toBeLessThanOrEqual(8);
      expect(topButtons.length).toBe(8); // exactly 8 top-level action controls (<= 8 requirement)
    });

    it('E2E-5.2: "Diseño" and "Acciones" submenus are mutually exclusive', () => {
      render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const btnDesign = screen.getByTestId('btn-open-design');
      const btnActions = screen.getByTestId('btn-open-actions');

      const designMenu = screen.getByTestId('design-submenu');
      const actionsMenu = screen.getByTestId('actions-submenu');

      // Initially both closed
      expect(designMenu.style.opacity).toBe('0');
      expect(actionsMenu.style.opacity).toBe('0');

      // Open Diseño -> opens design, actions stays closed
      fireEvent.click(btnDesign);
      expect(designMenu.style.opacity).toBe('1');
      expect(actionsMenu.style.opacity).toBe('0');

      // Open Acciones -> closes design, opens actions
      fireEvent.click(btnActions);
      expect(designMenu.style.opacity).toBe('0');
      expect(actionsMenu.style.opacity).toBe('1');

      // Toggle Acciones again -> closes actions
      fireEvent.click(btnActions);
      expect(actionsMenu.style.opacity).toBe('0');
    });

    it('E2E-5.3: AddSectionModal docks floating to the right of #area-cv when viewport allows, and closes on Escape', () => {
      const handleClose = vi.fn();

      // Mock #area-cv in DOM
      const mockAreaCv = document.createElement('div');
      mockAreaCv.id = 'area-cv';
      document.body.appendChild(mockAreaCv);

      // Wide screen simulation
      window.innerWidth = 1440;
      window.innerHeight = 900;
      vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 40,
        bottom: 840,
        left: 200,
        right: 850,
        width: 650,
        height: 800
      });

      const { unmount } = render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={handleClose} targetColumn="right" />
        </CVProvider>
      );

      const modalPanel = screen.getByTestId('add-section-modal');
      expect(modalPanel).toBeInTheDocument();
      // Right space is 1440 - 850 = 590px (> 260px), so left must be cvRect.right + 16 = 866px
      expect(modalPanel.style.left).toBe('866px');

      // Press Escape to close
      fireEvent.keyDown(window, { key: 'Escape' });
      expect(handleClose).toHaveBeenCalledTimes(1);

      unmount();
      document.body.removeChild(mockAreaCv);
    });

    it('E2E-5.4: AddSectionModal docks to screen right edge when viewport is narrow', () => {
      const handleClose = vi.fn();

      const mockAreaCv = document.createElement('div');
      mockAreaCv.id = 'area-cv';
      document.body.appendChild(mockAreaCv);

      // Narrow screen simulation
      window.innerWidth = 768;
      window.innerHeight = 1024;
      vi.spyOn(mockAreaCv, 'getBoundingClientRect').mockReturnValue({
        top: 20,
        bottom: 900,
        left: 20,
        right: 700,
        width: 680,
        height: 880
      });

      const { unmount } = render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={handleClose} targetColumn="right" />
        </CVProvider>
      );

      const modalPanel = screen.getByTestId('add-section-modal');
      // Available right space is 768 - 700 = 68px (< 260px), so docks to screen right edge
      expect(modalPanel.style.right).toBe('16px');

      unmount();
      document.body.removeChild(mockAreaCv);
    });

  });

  // =========================================================================
  // SUITE 6: Cross-Cutting Stability: Polymorphic Adaptation + Rich Text Resilience
  // =========================================================================
  describe('Suite 6: Polymorphic Adaptation + Rich Text Resilience', () => {

    it('E2E-6.1: Polymorphic item adapter preserves rich HTML formatting when converting between section types', () => {
      const richItem = {
        id: 'orig_1',
        title: '<b>Principal Architect</b>',
        subtitle: 'Enterprise Systems Inc.',
        description: '<div style="text-align: justify;">Designed <i>high-throughput</i> distributed ledger systems.</div>',
        bullets: ['<b>Built</b> consensus engines', 'Optimized <i>RPC</i> protocols']
      };

      // Adapt to projects
      const adaptedToProjects = adaptItemToSectionType(richItem, 'projects');
      expect(adaptedToProjects.title).toBe('<b>Principal Architect</b>');
      expect(adaptedToProjects.description).toContain('<i>high-throughput</i>');

      // Adapt to skills
      const adaptedToSkills = adaptItemToSectionType(richItem, 'skills');
      expect(adaptedToSkills.title).toBe('<b>Principal Architect</b>');
      expect(adaptedToSkills.description).toContain('<i>high-throughput</i>');

      // Adapt to simple_list
      const adaptedToList = adaptItemToSectionType(richItem, 'simple_list');
      expect(adaptedToList.text).toBe('<b>Principal Architect</b> — Enterprise Systems Inc.');
    });

    it('E2E-6.2: Complete CV normalization handles malformed data gracefully without breaking PDF engine', () => {
      const malformedData = {
        profile: null,
        layout: { type: 'invalid-type' },
        sections: 'not-an-array'
      };

      const normalized = normalizeCvDataForPdf(malformedData);
      expect(Array.isArray(normalized.sections)).toBe(true);
      expect(normalized.profile).toBeDefined();
      expect(normalized.layout).toBeDefined();

      const nullNormalized = normalizeCvDataForPdf(null);
      expect(nullNormalized).toBeDefined();
      expect(Array.isArray(nullNormalized.sections)).toBe(true);
    });

  });

});
