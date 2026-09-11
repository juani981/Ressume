import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import SpacerBlock, { PrintSpacerBlock, EditableSpacerBlock, IntegratedBottomSpacer } from '../components/CV/SpacerBlock';
import { PrintBaseSection } from '../components/CV/BaseSection';
import BaseSection from '../components/CV/BaseSection';
import AddSectionModal from '../components/Editor/AddSectionModal';
import { getSectionDescriptor, createDefaultSection } from '../registry/sectionRegistry';
import { generateCleanPrintHTML } from '../utils/staticHtmlPdfEngine';
import { sanitizeAndValidateCVSnapshot } from '../utils/versionValidator';
import { defaultSchema } from '../utils/schema';

describe('Resizable Blank Spacer Component & Pixel-Perfect PDF Engine', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // ==========================================================================
  // TIER 1: REGISTRY & DESCRIPTOR SPECIFICATION
  // ==========================================================================
  describe('Tier 1: Section Registry & Factory Integration', () => {
    it('T1.1: spacer descriptor is properly registered in sectionRegistry', () => {
      const descriptor = getSectionDescriptor('spacer');
      expect(descriptor).toBeDefined();
      expect(descriptor.type).toBe('spacer');
      expect(descriptor.isSpacer).toBe(true);
      expect(descriptor.allowDelete).toBe(true);
      expect(descriptor.allowAddItem).toBe(false);
      expect(descriptor.sectionClass).toBe('spacer-section');
    });

    it('T1.2: createDefaultSection produces a valid spacer section with default 40px height', () => {
      const spacerSec = createDefaultSection('right', 'spacer');
      expect(spacerSec.type).toBe('spacer');
      expect(spacerSec.column).toBe('right');
      expect(spacerSec.height).toBe(40);
      expect(spacerSec.backgroundColor).toBe('transparent');
      expect(spacerSec.items).toHaveLength(1);
      expect(spacerSec.items[0].height).toBe(40);
    });

    it('T1.3: AddSectionModal includes spacer with MoveVertical icon and descriptive label', () => {
      render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={() => {}} targetColumn="right" />
        </CVProvider>
      );

      const spacerCard = screen.getByTestId('add-section-card-spacer');
      expect(spacerCard).toBeInTheDocument();
      expect(spacerCard.textContent).toMatch(/Espacio en Blanco/i);
    });
  });

  // ==========================================================================
  // TIER 2: COMPONENT RENDERING & COLOR MODES
  // ==========================================================================
  describe('Tier 2: Component Rendering & Modes (Transparent Whitespace vs Black)', () => {
    it('T2.1: renders editable spacer with default 40px height and data attributes', () => {
      const mockSection = {
        id: 'spacer_test_1',
        type: 'spacer',
        column: 'right',
        height: 40,
        backgroundColor: 'transparent',
        items: [{ id: 'sp1', height: 40 }]
      };

      render(
        <CVProvider>
          <EditableSpacerBlock section={mockSection} />
        </CVProvider>
      );

      const container = screen.getByTestId('spacer-section-spacer_test_1');
      expect(container).toBeInTheDocument();
      expect(container.getAttribute('data-spacer-height')).toBe('40');
      expect(container.style.height).toBe('40px');
      expect(container.style.backgroundColor).toBe('transparent');
      expect(container.className).toContain('spacer--blank');
    });

    it('T2.2: renders with solid black background when backgroundColor is #000000 or black', () => {
      const mockSection = {
        id: 'spacer_test_black',
        type: 'spacer',
        column: 'left',
        height: 50,
        backgroundColor: '#000000',
        items: [{ id: 'sp_black', height: 50 }]
      };

      render(
        <CVProvider>
          <EditableSpacerBlock section={mockSection} />
        </CVProvider>
      );

      const container = screen.getByTestId('spacer-section-spacer_test_black');
      expect(container.style.backgroundColor).toBe('rgb(0, 0, 0)');
      expect(container.className).toContain('spacer--black');
    });

    it('T2.3: color toggle button switches between transparent whitespace and black', () => {
      const Consumer = () => {
        const { cvData, addSection } = useCV();
        const spacer = cvData.sections.find(s => s.type === 'spacer');

        return (
          <div>
            <button data-testid="add-btn" onClick={() => addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
            <div data-testid="spacer-color-debug">{spacer?.backgroundColor || 'none'}</div>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-btn'));

      const toggleBtn = screen.getByTestId(/spacer-color-toggle-/);
      expect(screen.getByTestId('spacer-color-debug').textContent).toBe('transparent');

      // Click to switch to Negro (#000000)
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('spacer-color-debug').textContent).toBe('#000000');

      // Click to switch back to transparent
      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('spacer-color-debug').textContent).toBe('transparent');
    });
  });

  // ==========================================================================
  // TIER 3: VERTICAL RESIZING INTERACTIONS & CONTROLS
  // ==========================================================================
  describe('Tier 3: Vertical-Only Resizing & Height Controls', () => {
    it('T3.1: drag handle allows vertical resizing down (increasing height)', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));
      const resizeHandle = screen.getByTestId(/spacer-resize-handle-/);

      // Start drag at Y=100
      fireEvent.mouseDown(resizeHandle, { clientY: 100 });

      // Move down to Y=160 (+60px delta -> 40 + 60 = 100px)
      fireEvent.mouseMove(window, { clientY: 160 });

      // End drag
      fireEvent.mouseUp(window, { clientY: 160 });

      const updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(100);
    });

    it('T3.2: drag handle allows vertical resizing up and respects min-height floor of 8px', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));
      const resizeHandle = screen.getByTestId(/spacer-resize-handle-/);

      // Drag up by 200px (40 - 200 = -160, should clamp to 8px)
      fireEvent.mouseDown(resizeHandle, { clientY: 200 });
      fireEvent.mouseMove(window, { clientY: 0 });
      fireEvent.mouseUp(window, { clientY: 0 });

      const updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(8);
    });

    it('T3.3: enforces max-height ceiling of 600px when dragged excessively', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));
      const resizeHandle = screen.getByTestId(/spacer-resize-handle-/);

      // Drag down by 1000px (40 + 1000 = 1040, should clamp to 600px)
      fireEvent.mouseDown(resizeHandle, { clientY: 100 });
      fireEvent.mouseMove(window, { clientY: 1100 });
      fireEvent.mouseUp(window, { clientY: 1100 });

      const updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(600);
    });

    it('T3.4: resizing ignores horizontal clientX movements (vertical-only invariant)', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));
      const resizeHandle = screen.getByTestId(/spacer-resize-handle-/);

      // Move 500px horizontally but 0px vertically
      fireEvent.mouseDown(resizeHandle, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(window, { clientX: 600, clientY: 100 });
      fireEvent.mouseUp(window, { clientX: 600, clientY: 100 });

      const updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(40);
    });

    it('T3.5: preset buttons (20px, 40px, 80px, 120px) update height immediately', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));

      // Click 80px preset
      const preset80 = screen.getByTestId(/spacer-preset-80-/);
      fireEvent.click(preset80);

      let updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(80);

      // Click 20px preset
      const preset20 = screen.getByTestId(/spacer-preset-20-/);
      fireEvent.click(preset20);

      updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(20);
    });

    it('T3.6: slider supports keyboard ArrowUp and ArrowDown navigation', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));
      const resizeHandle = screen.getByTestId(/spacer-resize-handle-/);

      // ArrowDown increases height by 2px (or 10px with shift)
      fireEvent.keyDown(resizeHandle, { key: 'ArrowDown' });
      let updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(42);

      // Shift+ArrowUp decreases height by 10px
      fireEvent.keyDown(resizeHandle, { key: 'ArrowUp', shiftKey: true });
      updatedSpacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(updatedSpacer.height).toBe(32);
    });
  });

  // ==========================================================================
  // TIER 4: REORDERING, DELETION & SNAPSHOT PERSISTENCE
  // ==========================================================================
  describe('Tier 4: Reordering, Deletion & Snapshot Persistence', () => {
    it('T4.1: spacer can be reordered among sections and moved across columns', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        return (
          <div>
            <button
              data-testid="setup-layout"
              onClick={() => {
                context.addSection('left', 'spacer');
              }}
            >
              Setup
            </button>
            <button
              data-testid="move-to-right"
              onClick={() => {
                const spacer = currentCV.sections.find(s => s.type === 'spacer');
                context.updateSectionColumn(spacer.id, 'right');
              }}
            >
              Move
            </button>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('setup-layout'));
      let spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.column).toBe('left');

      fireEvent.click(screen.getByTestId('move-to-right'));
      spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.column).toBe('right');
    });

    it('T4.2: clicking delete button removes the spacer from cvData', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');
        return (
          <div>
            <button data-testid="add-spacer" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            {spacer && <EditableSpacerBlock section={spacer} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('add-spacer'));
      expect(currentCV.sections.some(s => s.type === 'spacer')).toBe(true);

      const delBtn = screen.getByTestId(/spacer-del-btn-/);
      fireEvent.click(delBtn);

      expect(currentCV.sections.some(s => s.type === 'spacer')).toBe(false);
    });

    it('T4.3: sanitizeAndValidateCVSnapshot preserves spacer section and its height', () => {
      const snapshotWithSpacer = {
        ...defaultSchema,
        sections: [
          ...defaultSchema.sections,
          {
            id: 'sec_spacer_custom',
            column: 'left',
            type: 'spacer',
            title: '',
            height: 95,
            backgroundColor: '#000000',
            items: [{ id: 'item_sp_1', height: 95, backgroundColor: '#000000' }]
          }
        ]
      };

      const sanitized = sanitizeAndValidateCVSnapshot(snapshotWithSpacer);
      const restoredSpacer = sanitized.sections.find(s => s.type === 'spacer');

      expect(restoredSpacer).toBeDefined();
      expect(restoredSpacer.height).toBe(95);
      expect(restoredSpacer.backgroundColor).toBe('#000000');
      expect(restoredSpacer.items[0].height).toBe(95);
    });

    it('T4.4: BaseSection routes spacer type properly in both print and edit modes', () => {
      const mockSpacer = {
        id: 'sec_spacer_route',
        column: 'right',
        type: 'spacer',
        title: '',
        height: 65,
        backgroundColor: 'transparent',
        items: [{ id: 'sp_route', height: 65 }]
      };

      // 1. Edit mode
      const { container: editContainer } = render(
        <CVProvider>
          <BaseSection section={mockSpacer} isPrint={false} />
        </CVProvider>
      );
      expect(editContainer.querySelector('.spacer-resize-handle')).toBeInTheDocument();

      // 2. Print mode
      const { container: printContainer } = render(
        <BaseSection section={mockSpacer} isPrint={true} />
      );
      expect(printContainer.querySelector('.spacer-resize-handle')).toBeNull();
      const spacerEl = printContainer.querySelector('.spacer-section');
      expect(spacerEl).toBeInTheDocument();
      expect(spacerEl.style.height).toBe('65px');
    });
  });

  // ==========================================================================
  // TIER 5: PIXEL-PERFECT PDF / PRINT FIDELITY
  // ==========================================================================
  describe('Tier 5: Pixel-Perfect PDF / Print Engine Fidelity', () => {
    it('T5.1: PrintSpacerBlock produces pure whitespace with matching pixel height and zero controls', () => {
      const mockSection = {
        id: 'spacer_print_test',
        type: 'spacer',
        height: 84,
        backgroundColor: 'transparent',
        items: [{ id: 'sp_p', height: 84 }]
      };

      const { container } = render(<PrintSpacerBlock section={mockSection} />);
      const el = container.querySelector('.spacer-section');

      expect(el).toBeInTheDocument();
      expect(el.style.height).toBe('84px');
      expect(el.style.minHeight).toBe('84px');
      expect(el.style.maxHeight).toBe('84px');
      expect(el.getAttribute('data-spacer-height')).toBe('84');
      expect(el.style.backgroundColor).toBe('transparent');

      // Verify zero editor controls or text inside print block
      expect(container.querySelectorAll('.no-print').length).toBe(0);
      expect(container.querySelectorAll('button').length).toBe(0);
      expect(container.textContent).toBe('');
    });

    it('T5.2: generateCleanPrintHTML outputs exact height and omits all editor controls', () => {
      const cvWithSpacer = {
        ...defaultSchema,
        sections: [
          ...defaultSchema.sections,
          {
            id: 'spacer_pdf_test',
            column: 'right',
            type: 'spacer',
            title: '',
            height: 110,
            backgroundColor: 'transparent',
            items: [{ id: 'sp_pdf', height: 110 }]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvWithSpacer);

      // Verify exact height in generated print HTML
      expect(html).toContain('data-spacer-height="110"');
      expect(html).toMatch(/height:\s*110px/);
      expect(html).toMatch(/min-height:\s*110px/);

      // Verify zero editor artifacts or handles leaked into print document
      expect(html).not.toContain('spacer-resize-handle');
      expect(html).not.toContain('spacer-controls-bar');
      expect(html).not.toContain('spacer-del-btn');
      expect(html).not.toContain('drag-handle');
      expect(html).not.toContain('no-print');
    });

    it('T5.3: supports solid black mode in generateCleanPrintHTML with exact color and height', () => {
      const cvWithBlackSpacer = {
        ...defaultSchema,
        sections: [
          ...defaultSchema.sections,
          {
            id: 'spacer_black_pdf',
            column: 'left',
            type: 'spacer',
            title: '',
            height: 35,
            backgroundColor: '#000000',
            items: [{ id: 'sp_b_pdf', height: 35 }]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvWithBlackSpacer);

      expect(html).toContain('data-spacer-height="35"');
      expect(html).toMatch(/height:\s*35px/);
      expect(html).toMatch(/background-color:\s*(?:#000000|black)/);
    });

    it('T5.4: maintains pixel perfection across 1-column (ATS) mode', () => {
      const cvAtsSpacer = {
        ...defaultSchema,
        layout: {
          ...defaultSchema.layout,
          type: '1-column',
          isAtsMode: true
        },
        sections: [
          ...defaultSchema.sections,
          {
            id: 'spacer_ats',
            column: 'left',
            type: 'spacer',
            title: '',
            height: 72,
            backgroundColor: 'transparent',
            items: [{ id: 'sp_ats', height: 72 }]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvAtsSpacer);

      expect(html).toContain('resume__single-column');
      expect(html).toContain('data-spacer-height="72"');
      expect(html).toMatch(/height:\s*72px/);
    });

    it('T5.5: print stylesheet enforces page-break-inside avoid on .spacer-section', () => {
      const cvData = {
        ...defaultSchema,
        sections: [
          {
            id: 'spacer_break',
            column: 'right',
            type: 'spacer',
            height: 55,
            items: [{ id: 'sp_brk', height: 55 }]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvData);
      expect(html).toContain('break-inside: avoid');
      expect(html).toContain('page-break-inside: avoid');
    });
  });

  // ==========================================================================
  // TIER 6: DEEP CROSS-FEATURE INTERACTIONS & LIFECYCLE
  // ==========================================================================
  describe('Tier 6: Deep Cross-Feature Interactions & Lifecycle', () => {
    it('T6.1: undo and redo restore and reapply spacer resizing faithfully', () => {
      let currentCV = null;
      let undoFn = null;
      let redoFn = null;

      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        undoFn = context.undo;
        redoFn = context.redo;
        const spacer = context.cvData.sections.find(s => s.type === 'spacer');

        return (
          <div>
            <button data-testid="add-btn" onClick={() => context.addSection('right', 'spacer')}>Add</button>
            <button data-testid="resize-btn" onClick={() => {
              if (spacer) context.updateSectionProperty(spacer.id, 'height', 90);
            }}>Resize</button>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      // 1. Add spacer
      fireEvent.click(screen.getByTestId('add-btn'));
      let spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.height).toBe(40);

      // 2. Resize to 90px
      fireEvent.click(screen.getByTestId('resize-btn'));
      spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.height).toBe(90);

      // 3. Undo -> reverts to 40px
      act(() => {
        undoFn();
      });
      spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.height).toBe(40);

      // 4. Redo -> re-applies 90px
      act(() => {
        redoFn();
      });
      spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.height).toBe(90);
    });

    it('T6.2: supports multiple spacers across distinct columns with independent heights in both live DOM and PDF HTML', () => {
      const cvWithMultipleSpacers = {
        ...defaultSchema,
        sections: [
          ...defaultSchema.sections,
          {
            id: 'spacer_left_30',
            column: 'left',
            type: 'spacer',
            height: 30,
            backgroundColor: 'transparent',
            items: [{ id: 'sp_l_30', height: 30 }]
          },
          {
            id: 'spacer_right_150',
            column: 'right',
            type: 'spacer',
            height: 150,
            backgroundColor: '#000000',
            items: [{ id: 'sp_r_150', height: 150 }]
          }
        ]
      };

      const html = generateCleanPrintHTML(cvWithMultipleSpacers);

      // Left spacer check
      expect(html).toContain('id="spacer_left_30"');
      expect(html).toContain('data-spacer-height="30"');
      expect(html).toMatch(/height:\s*30px/);

      // Right spacer check
      expect(html).toContain('id="spacer_right_150"');
      expect(html).toContain('data-spacer-height="150"');
      expect(html).toMatch(/height:\s*150px/);
      expect(html).toMatch(/background-color:\s*(?:#000000|black)/);
    });

    it('T6.3: global layout spacing adjustments (sectionGap, pagePadding) do not alter the intrinsic height of the spacer', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        return (
          <div>
            <button data-testid="setup-spacer" onClick={() => {
              context.addSection('right', 'spacer');
            }}>Add</button>
            <button data-testid="calibrate-spacing" onClick={() => {
              context.updateLayout('sectionGap', 36);
              context.updateLayout('pagePadding', 40);
            }}>Calibrate</button>
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      fireEvent.click(screen.getByTestId('setup-spacer'));
      let spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.height).toBe(40);

      fireEvent.click(screen.getByTestId('calibrate-spacing'));
      spacer = currentCV.sections.find(s => s.type === 'spacer');
      expect(spacer.height).toBe(40);
      expect(currentCV.layout.sectionGap).toBe(36);
      expect(currentCV.layout.pagePadding).toBe(40);
    });

    it('T6.4: full PDF print cycle invokes executeCleanPrint with clean spacer HTML and zero editor leakage', async () => {
      const printEngine = await import('../utils/staticHtmlPdfEngine');
      const printSpy = vi.spyOn(printEngine, 'executeCleanPrint').mockResolvedValue();

      const cvDataWithSpacer = {
        ...defaultSchema,
        sections: [
          ...defaultSchema.sections,
          {
            id: 'spacer_lifecycle',
            column: 'right',
            type: 'spacer',
            height: 64,
            backgroundColor: 'transparent',
            items: [{ id: 'sp_life', height: 64 }]
          }
        ]
      };

      await printEngine.executeCleanPrint(cvDataWithSpacer);
      expect(printSpy).toHaveBeenCalledWith(cvDataWithSpacer);

      const html = printEngine.generateCleanPrintHTML(cvDataWithSpacer);
      expect(html).toContain('data-spacer-height="64"');
      expect(html).toMatch(/height:\s*64px/);
      expect(html).not.toContain('no-print');

      printSpy.mockRestore();
    });
  });

  // ==========================================================================
  // TIER 7: BASE CONTAINER INTEGRATED BOTTOM SPACER (CONCATENATED 0PX WHITESPACE)
  // ==========================================================================
  describe('Tier 7: Base Container Integrated Bottom Spacer (Concatenated 0px Whitespace with Bottom Edge Resize)', () => {
    it('T7.1: createDefaultSection creates container with initial bottomSpacing of 0px', () => {
      const expSec = createDefaultSection('right', 'experience', 'EXPERIENCIA');
      expect(expSec.bottomSpacing).toBe(0);

      const skillSec = createDefaultSection('left', 'skills', 'HABILIDADES');
      expect(skillSec.bottomSpacing).toBe(0);

      const customSec = createDefaultSection('right', 'custom', 'PROYECTOS');
      expect(customSec.bottomSpacing).toBe(0);
    });

    it('T7.2: renders container with 0px whitespace and strictly zero additional menus or buttons', () => {
      const mockSection = {
        id: 'sec_test_container_1',
        type: 'experience',
        column: 'right',
        title: 'EXPERIENCIA LABORAL',
        bottomSpacing: 0,
        items: [{ id: 'item_1', title: 'Developer', subtitle: 'Tech Corp' }]
      };

      render(
        <CVProvider>
          <BaseSection section={mockSection} />
        </CVProvider>
      );

      // Verify integrated bottom spacer container exists with 0px initial height
      const spacerContainer = screen.getByTestId('integrated-bottom-spacer-sec_test_container_1');
      expect(spacerContainer).toBeInTheDocument();
      expect(spacerContainer.getAttribute('data-spacer-height')).toBe('0');
      expect(spacerContainer.style.height).toBe('0px');

      // Verify STRICT absence of any additional menu, presets, color toggle, or delete button on the bottom spacer
      expect(screen.queryByTestId(/spacer-controls-sec_test_container_1/)).toBeNull();
      expect(screen.queryByTestId(/spacer-preset-.*sec_test_container_1/)).toBeNull();
      expect(screen.queryByTestId(/spacer-color-toggle-sec_test_container_1/)).toBeNull();
      expect(screen.queryByTestId(/spacer-del-btn-.*sec_test_container_1/)).toBeNull();
    });

    it('T7.3: bottom resize handle exists with ns-resize cursor and does not interfere with section content', () => {
      const mockSection = {
        id: 'sec_test_container_2',
        type: 'experience',
        column: 'right',
        title: 'EXPERIENCIA LABORAL',
        bottomSpacing: 0,
        items: [{ id: 'item_2', title: 'Senior Engineer', subtitle: 'Cloud Corp' }]
      };

      render(
        <CVProvider>
          <BaseSection section={mockSection} />
        </CVProvider>
      );

      const resizeHandle = screen.getByTestId('spacer-resize-handle-sec_test_container_2-bottom');
      expect(resizeHandle).toBeInTheDocument();
      expect(resizeHandle.getAttribute('role')).toBe('slider');
      expect(resizeHandle.getAttribute('aria-valuenow')).toBe('0');
      expect(resizeHandle.getAttribute('aria-valuemin')).toBe('0');
      expect(resizeHandle.getAttribute('aria-valuemax')).toBe('600');
      expect(resizeHandle.style.cursor).toBe('ns-resize');

      // Verify touching / hovering the handle isolates events
      fireEvent.mouseEnter(resizeHandle);
      const stopPropagationSpy = vi.fn();
      fireEvent.mouseDown(resizeHandle, { clientY: 100, stopPropagation: stopPropagationSpy });
      fireEvent.mouseUp(window, { clientY: 100 });
    });

    it('T7.4: dragging handle downwards expands bottom whitespace below container and commits to state', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const targetSection = context.cvData.sections.find(s => s.id === 'experience') || context.cvData.sections[1];
        return (
          <div>
            {targetSection && <BaseSection section={targetSection} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      const targetSection = currentCV.sections.find(s => s.id === 'experience') || currentCV.sections[1];
      const handle = screen.getByTestId(`spacer-resize-handle-${targetSection.id}-bottom`);

      // 1. Initial height is 0
      expect(handle.getAttribute('aria-valuenow')).toBe('0');

      // 2. Drag down by 45px (from Y=100 to Y=145)
      fireEvent.mouseDown(handle, { clientY: 100 });
      fireEvent.mouseMove(window, { clientY: 145 });
      fireEvent.mouseUp(window, { clientY: 145 });

      // 3. State is updated to 45px
      const updatedSection = currentCV.sections.find(s => s.id === targetSection.id);
      expect(updatedSection.bottomSpacing).toBe(45);
    });

    it('T7.5: dragging handle upwards past 0 clamps to 0px floor without error', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const targetSection = context.cvData.sections[1];
        return (
          <div>
            <button data-testid="set-h-50" onClick={() => context.updateSectionProperty(targetSection.id, 'bottomSpacing', 50)}>Set 50</button>
            {targetSection && <BaseSection section={targetSection} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      // Set to 50px
      fireEvent.click(screen.getByTestId('set-h-50'));
      const targetSection = currentCV.sections[1];
      expect(targetSection.bottomSpacing).toBe(50);

      const handle = screen.getByTestId(`spacer-resize-handle-${targetSection.id}-bottom`);

      // Drag up by 80px (from Y=100 to Y=20 -> should clamp at 0px)
      fireEvent.mouseDown(handle, { clientY: 100 });
      fireEvent.mouseMove(window, { clientY: 20 });
      fireEvent.mouseUp(window, { clientY: 20 });

      const updatedSection = currentCV.sections[1];
      expect(updatedSection.bottomSpacing).toBe(0);
    });

    it('T7.6: keyboard navigation (ArrowDown/ArrowUp) adjusts bottom spacing with accessibility support', () => {
      let currentCV = null;
      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        const targetSection = context.cvData.sections[1];
        return (
          <div>
            {targetSection && <BaseSection section={targetSection} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      const targetSection = currentCV.sections[1];
      const handle = screen.getByTestId(`spacer-resize-handle-${targetSection.id}-bottom`);

      // ArrowDown (+2px)
      fireEvent.keyDown(handle, { key: 'ArrowDown' });
      let updated = currentCV.sections[1];
      expect(updated.bottomSpacing).toBe(2);

      // Shift + ArrowDown (+10px -> 12px)
      fireEvent.keyDown(handle, { key: 'ArrowDown', shiftKey: true });
      updated = currentCV.sections[1];
      expect(updated.bottomSpacing).toBe(12);

      // ArrowUp (-2px -> 10px)
      fireEvent.keyDown(handle, { key: 'ArrowUp' });
      updated = currentCV.sections[1];
      expect(updated.bottomSpacing).toBe(10);
    });

    it('T7.7: supports undo/redo history tracking on bottomSpacing adjustments', () => {
      let currentCV = null;
      let undoFn = null;
      let redoFn = null;

      const Consumer = () => {
        const context = useCV();
        currentCV = context.cvData;
        undoFn = context.undo;
        redoFn = context.redo;
        const targetSection = context.cvData.sections[1];
        return (
          <div>
            <button data-testid="apply-spacing" onClick={() => {
              context.updateSectionProperty(targetSection.id, 'bottomSpacing', 60);
            }}>Apply 60px</button>
            {targetSection && <BaseSection section={targetSection} />}
          </div>
        );
      };

      render(
        <CVProvider>
          <Consumer />
        </CVProvider>
      );

      // 1. Initially 0 or undefined
      let targetSection = currentCV.sections[1];
      expect(targetSection.bottomSpacing || 0).toBe(0);

      // 2. Apply 60px
      fireEvent.click(screen.getByTestId('apply-spacing'));
      targetSection = currentCV.sections[1];
      expect(targetSection.bottomSpacing).toBe(60);

      // 3. Undo -> reverts to 0
      act(() => {
        undoFn();
      });
      targetSection = currentCV.sections[1];
      expect(targetSection.bottomSpacing || 0).toBe(0);

      // 4. Redo -> restores 60px
      act(() => {
        redoFn();
      });
      targetSection = currentCV.sections[1];
      expect(targetSection.bottomSpacing).toBe(60);
    });

    it('T7.8: produces pixel-perfect PDF HTML with exact whitespace height when bottomSpacing > 0, and 0 extra DOM when 0', () => {
      const cvWithCustomBottomSpacing = {
        ...defaultSchema,
        sections: [
          {
            ...defaultSchema.sections[0],
            bottomSpacing: 0, // 0px -> renders nothing extra
          },
          {
            ...defaultSchema.sections[1],
            id: 'about_with_space',
            bottomSpacing: 56, // 56px whitespace
          }
        ]
      };

      const html = generateCleanPrintHTML(cvWithCustomBottomSpacing);

      // 1. The 0px section does NOT render an extra bottom-space div
      expect(html).not.toContain('id="profile_header-bottom-space"');

      // 2. The 56px section renders an exact pixel-perfect whitespace div inside it
      expect(html).toContain('id="about_with_space-bottom-space"');
      expect(html).toContain('data-spacer-height="56"');
      expect(html).toMatch(/height:\s*56px/);
      expect(html).toMatch(/min-height:\s*56px/);
      expect(html).toMatch(/background-color:\s*transparent/);
      expect(html).not.toContain('no-print');
    });
  });
});
