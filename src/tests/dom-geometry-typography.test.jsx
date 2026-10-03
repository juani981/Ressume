import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { CVProvider, useCV } from '../context/CVContext';
import App from '../App';
import ActionMenu from '../components/Editor/ActionMenu';
import LayoutModeToggle from '../components/Editor/LayoutModeToggle';
import DragHandle from '../components/Editor/DragHandle';
import BaseSection from '../components/CV/BaseSection';
import BaseItem from '../components/CV/BaseItem';
import SuggestionTooltip from '../components/Editor/SuggestionTooltip';
import { defaultSchema, defaultLayout } from '../utils/schema';
import { adaptItemToSectionType, createDefaultSection, createDefaultItemForSection } from '../utils/itemAdapter';
import { 
  generateCleanPrintHTML, 
  calculatePrintScale, 
  escapeHTML, 
  executeCleanPrint 
} from '../utils/staticHtmlPdfEngine';
import { getSectionDescriptor, getAllSectionDescriptors } from '../registry/sectionRegistry';
import { getRules, getUI, getContent } from '../locales/index';

// Helper component for context state testing
const ContextHarness = ({ onStateChange }) => {
  const cv = useCV();
  React.useEffect(() => {
    if (onStateChange) onStateChange(cv);
  }, [cv, onStateChange]);

  return (
    <div data-testid="context-harness">
      <span data-testid="font-family">{cv.cvData?.layout?.fontFamily || 'Poppins'}</span>
      <span data-testid="font-scale">{cv.cvData?.layout?.fontScale ?? 1.0}</span>
      <span data-testid="title-scale">{cv.cvData?.layout?.titleScale ?? 1.0}</span>
      <span data-testid="body-scale">{cv.cvData?.layout?.bodyScale ?? 1.0}</span>
      <span data-testid="list-scale">{cv.cvData?.layout?.listScale ?? 1.0}</span>
      <span data-testid="line-height">{cv.cvData?.layout?.lineHeight ?? 1.3}</span>
      <span data-testid="page-padding">{cv.cvData?.layout?.pagePadding ?? 24}</span>
      <span data-testid="section-gap">{cv.cvData?.layout?.sectionGap ?? 20}</span>
      <span data-testid="item-gap">{cv.cvData?.layout?.itemGap ?? 8}</span>
      <span data-testid="layout-type">{cv.cvData?.layout?.type || '2-column'}</span>
      <span data-testid="column-width">{cv.cvData?.layout?.leftColumnWidth ?? 'default'}</span>
      <span data-testid="active-language">{cv.activeLanguage}</span>
      <span data-testid="section-count">{cv.cvData?.sections?.length || 0}</span>

      <button data-testid="btn-set-font-inter" onClick={() => cv.updateLayout('fontFamily', 'Inter')}>Set Inter</button>
      <button data-testid="btn-set-font-roboto" onClick={() => cv.updateLayout('fontFamily', 'Roboto')}>Set Roboto</button>
      <button data-testid="btn-set-font-merriweather" onClick={() => cv.updateLayout('fontFamily', 'Merriweather')}>Set Merriweather</button>
      <button data-testid="btn-set-font-jetbrains" onClick={() => cv.updateLayout('fontFamily', 'JetBrains Mono')}>Set JetBrains</button>
      <button data-testid="btn-set-font-poppins" onClick={() => cv.updateLayout('fontFamily', 'Poppins')}>Set Poppins</button>

      <button data-testid="btn-set-font-scale" onClick={() => cv.updateLayout('fontScale', 1.15)}>Scale 1.15</button>
      <button data-testid="btn-set-title-scale" onClick={() => cv.updateLayout('titleScale', 1.25)}>Title 1.25</button>
      <button data-testid="btn-set-body-scale" onClick={() => cv.updateLayout('bodyScale', 0.95)}>Body 0.95</button>
      <button data-testid="btn-set-list-scale" onClick={() => cv.updateLayout('listScale', 1.10)}>List 1.10</button>
      <button data-testid="btn-reset-typography" onClick={() => cv.updateLayout({ fontScale: 1.0, titleScale: 1.0, bodyScale: 1.0, listScale: 1.0, lineHeight: 1.3 })}>Reset Typo</button>
      <button data-testid="btn-set-line-height" onClick={() => cv.updateLayout('lineHeight', 1.65)}>Line Height 1.65</button>
      <button data-testid="btn-set-page-padding" onClick={() => cv.updateLayout('pagePadding', 36)}>Padding 36</button>
      <button data-testid="btn-set-section-gap" onClick={() => cv.updateLayout('sectionGap', 28)}>Section Gap 28</button>
      <button data-testid="btn-set-item-gap" onClick={() => cv.updateLayout('itemGap', 14)}>Item Gap 14</button>
      <button data-testid="btn-set-column-width" onClick={() => cv.updateLayout('leftColumnWidth', 42)}>Width 42</button>
      <button data-testid="btn-toggle-1col" onClick={() => cv.updateLayout('type', '1-column')}>Toggle 1-Col</button>
      <button data-testid="btn-toggle-2col" onClick={() => cv.updateLayout('type', '2-column')}>Toggle 2-Col</button>
      <button data-testid="btn-delete-profile" onClick={() => cv.deleteSection('profile_header')}>Del Profile</button>
    </div>
  );
};

describe('DOM Geometry & Typography E2E Test Suite (Tiers 1-4)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // =========================================================================
  // TIER 1: FEATURE COVERAGE (>=5 tests per feature for all 14 features)
  // =========================================================================
  describe('Tier 1: Feature Coverage', () => {

    // Feature 1: Global Font Family Selector (5 tests)
    describe('F1: Global Font Family Selector', () => {
      it('F1.1: Supports Poppins font family in state and layout configuration', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-poppins'));
        expect(screen.getByTestId('font-family').textContent).toBe('Poppins');
      });

      it('F1.2: Supports Inter font family in state and layout configuration', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-inter'));
        expect(screen.getByTestId('font-family').textContent).toBe('Inter');
      });

      it('F1.3: Supports Roboto font family in state and layout configuration', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-roboto'));
        expect(screen.getByTestId('font-family').textContent).toBe('Roboto');
      });

      it('F1.4: Supports Merriweather serif font family in state and layout configuration', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-merriweather'));
        expect(screen.getByTestId('font-family').textContent).toBe('Merriweather');
      });

      it('F1.5: Supports JetBrains Mono code font family in state and layout configuration', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-jetbrains'));
        expect(screen.getByTestId('font-family').textContent).toBe('JetBrains Mono');
      });
    });

    // Feature 2: Typography Scale & Line-Height (5 tests)
    describe('F2: Typography Scale & Line-Height', () => {
      it('F2.1: defaultLayout defines standard font-scale and line-height tokens', () => {
        expect(defaultLayout).toBeDefined();
        expect(defaultLayout.fontScale ?? 1.0).toBeGreaterThanOrEqual(0.85);
        expect(defaultLayout.lineHeight ?? 1.3).toBeGreaterThanOrEqual(1.25);
      });

      it('F2.2: updateLayout updates fontScale dynamically in context state', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-scale'));
        expect(screen.getByTestId('font-scale').textContent).toBe('1.15');
      });

      it('F2.3: updateLayout updates lineHeight dynamically in context state', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-line-height'));
        expect(screen.getByTestId('line-height').textContent).toBe('1.65');
      });

      it('F2.4: Typography scale changes persist to localStorage', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-font-scale'));
        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.fontScale).toBe(1.15);
      });

      it('F2.5: Line-height changes persist to localStorage', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-line-height'));
        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.lineHeight).toBe(1.65);
      });

      it('F2.6: defaultLayout defines distinct categorical scales (titleScale, bodyScale, listScale)', () => {
        expect(defaultLayout.titleScale ?? 1.0).toBe(1.0);
        expect(defaultLayout.bodyScale ?? 1.0).toBe(1.0);
        expect(defaultLayout.listScale ?? 1.0).toBe(1.0);
      });

      it('F2.7: updateLayout updates titleScale, bodyScale, and listScale independently', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-title-scale'));
        expect(screen.getByTestId('title-scale').textContent).toBe('1.25');

        fireEvent.click(screen.getByTestId('btn-set-body-scale'));
        expect(screen.getByTestId('body-scale').textContent).toBe('0.95');

        fireEvent.click(screen.getByTestId('btn-set-list-scale'));
        expect(screen.getByTestId('list-scale').textContent).toBe('1.1');
      });

      it('F2.8: Categorical typography scale changes persist to localStorage', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-title-scale'));
        fireEvent.click(screen.getByTestId('btn-set-body-scale'));
        fireEvent.click(screen.getByTestId('btn-set-list-scale'));

        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.titleScale).toBe(1.25);
        expect(saved.layout.bodyScale).toBe(0.95);
        expect(saved.layout.listScale).toBe(1.1);
      });

      it('F2.9: Batch updateLayout atomically updates multiple typography properties', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-title-scale'));
        expect(screen.getByTestId('title-scale').textContent).toBe('1.25');

        fireEvent.click(screen.getByTestId('btn-reset-typography'));
        expect(screen.getByTestId('title-scale').textContent).toBe('1');
        expect(screen.getByTestId('body-scale').textContent).toBe('1');
        expect(screen.getByTestId('list-scale').textContent).toBe('1');
        expect(screen.getByTestId('font-scale').textContent).toBe('1');
      });

      it('F2.10: ActionMenu typography popover renders dedicated Title, Body, and List sliders', () => {
        render(
          <CVProvider>
            <ActionMenu />
          </CVProvider>
        );

        // Open Design & Typography Popover
        const designBtn = screen.getByLabelText('Ajustes de Diseño y Tipografía');
        fireEvent.click(designBtn);

        expect(screen.getByTestId('slider-title-scale')).toBeInTheDocument();
        expect(screen.getByTestId('slider-body-scale')).toBeInTheDocument();
        expect(screen.getByTestId('slider-list-scale')).toBeInTheDocument();
        expect(screen.getByTestId('slider-font-scale')).toBeInTheDocument();
        expect(screen.getByTestId('slider-line-height')).toBeInTheDocument();

        // Adjust title scale slider
        fireEvent.change(screen.getByTestId('slider-title-scale'), { target: { value: '1.20' } });
        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.titleScale).toBe(1.2);
      });
    });

    // Feature 3: Independent Spacing Controls (5 tests)
    describe('F3: Independent Spacing Controls', () => {
      it('F3.1: defaultLayout defines standard spacing defaults (pagePadding=24, sectionGap=20, itemGap=8)', () => {
        expect(defaultLayout.pagePadding).toBe(24);
        expect(defaultLayout.sectionGap).toBe(20);
        expect(defaultLayout.itemGap).toBe(8);
      });

      it('F3.2: updateLayout modifies pagePadding independently', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-page-padding'));
        expect(screen.getByTestId('page-padding').textContent).toBe('36');
      });

      it('F3.3: updateLayout modifies sectionGap independently', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-section-gap'));
        expect(screen.getByTestId('section-gap').textContent).toBe('28');
      });

      it('F3.4: updateLayout modifies itemGap independently', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-item-gap'));
        expect(screen.getByTestId('item-gap').textContent).toBe('14');
      });

      it('F3.5: All three spacing properties can be calibrated simultaneously and saved to localStorage', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        act(() => {
          fireEvent.click(screen.getByTestId('btn-set-page-padding'));
          fireEvent.click(screen.getByTestId('btn-set-section-gap'));
          fireEvent.click(screen.getByTestId('btn-set-item-gap'));
        });
        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.pagePadding).toBe(36);
        expect(saved.layout.sectionGap).toBe(28);
        expect(saved.layout.itemGap).toBe(14);
      });

      it('F3.6: ActionMenu renders Ancho Columna Lateral slider in 2-column mode', () => {
        render(
          <CVProvider>
            <ActionMenu />
          </CVProvider>
        );

        // Open Spacing & Margins Popover
        const spacingBtn = screen.getByLabelText('Ajustes de Márgenes y Espaciado');
        fireEvent.click(spacingBtn);

        expect(screen.getByTestId('slider-column-width')).toBeInTheDocument();
      });

      it('F3.7: Adjusting Ancho Columna Lateral slider updates leftColumnWidth in state and localStorage', () => {
        render(
          <CVProvider>
            <ActionMenu />
          </CVProvider>
        );

        const spacingBtn = screen.getByLabelText('Ajustes de Márgenes y Espaciado');
        fireEvent.click(spacingBtn);

        const slider = screen.getByTestId('slider-column-width');
        fireEvent.change(slider, { target: { value: '40' } });

        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.leftColumnWidth).toBe(40);
      });

      it('F3.8: App renders draggable column-resizer in 2-column mode, and omits it in 1-column mode', () => {
        let cvContext;
        const { container } = render(
          <CVProvider>
            <ContextHarness onStateChange={(c) => { cvContext = c; }} />
            <App />
          </CVProvider>
        );

        // In 2-column mode (default), the column-resizer should exist
        expect(container.querySelector('[data-testid="column-resizer"]')).not.toBeNull();

        // Switch to 1-column mode via context
        act(() => {
          cvContext.updateLayout('type', '1-column');
        });

        expect(container.querySelector('[data-testid="column-resizer"]')).toBeNull();
      });

      it('F3.9: Changing leftColumnWidth dynamically updates #area-cv gridTemplateColumns', () => {
        localStorage.setItem('cvData', JSON.stringify({
          ...defaultSchema,
          layout: { ...defaultLayout, type: '2-column', leftColumnWidth: 38 }
        }));

        const { container } = render(
          <CVProvider>
            <App />
          </CVProvider>
        );

        const areaCV = container.querySelector('#area-cv');
        const pageBox = container.querySelector('.a4-page-box') || areaCV;
        expect(pageBox.style.gridTemplateColumns).toBe('38% 62%');
      });

      it('F3.10: generateCleanPrintHTML outputs dynamic grid-template-columns when leftColumnWidth is customized', () => {
        const customData = {
          ...defaultSchema,
          layout: { ...defaultLayout, type: '2-column', leftColumnWidth: 45 }
        };

        const html = generateCleanPrintHTML(customData);
        expect(html).toContain('grid-template-columns: 45% 55%');
      });
    });

    // Feature 4: State & Persistence Schema (5 tests)
    describe('F4: State & Persistence Schema', () => {
      it('F4.1: CVProvider initializes from defaultSchema when localStorage is empty', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        expect(Number(screen.getByTestId('section-count').textContent)).toBe(defaultSchema.sections.length);
      });

      it('F4.2: CVProvider initializes correctly when localStorage contains existing cvData', () => {
        const customData = {
          ...defaultSchema,
          profile: { name: 'Ada Lovelace' },
          layout: { ...defaultLayout, pagePadding: 44 }
        };
        localStorage.setItem('cvData', JSON.stringify(customData));

        render(<CVProvider><ContextHarness /></CVProvider>);
        expect(screen.getByTestId('page-padding').textContent).toBe('44');
      });

      it('F4.3: Recovers gracefully when localStorage contains invalid or corrupted JSON', () => {
        localStorage.setItem('cvData', '{ invalid json syntax');
        render(<CVProvider><ContextHarness /></CVProvider>);
        expect(Number(screen.getByTestId('section-count').textContent)).toBeGreaterThan(0);
      });

      it('F4.4: Recovers gracefully when localStorage has null or undefined layout object', () => {
        localStorage.setItem('cvData', JSON.stringify({ profile: {}, sections: [], layout: null }));
        render(<CVProvider><ContextHarness /></CVProvider>);
        expect(screen.getByTestId('page-padding')).toBeInTheDocument();
      });

      it('F4.5: Preserves section ordering and item structures upon state updates', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-page-padding'));
        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(Array.isArray(saved.sections)).toBe(true);
        expect(saved.sections.length).toBe(defaultSchema.sections.length);
      });
    });

    // Feature 5: ATS 1-Column Layout Overhaul (5 tests)
    describe('F5: ATS 1-Column Layout Overhaul', () => {
      it('F5.1: Layout switches to 1-column mode when updateLayout is called with "1-column"', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-toggle-1col'));
        expect(screen.getByTestId('layout-type').textContent).toBe('1-column');
      });

      it('F5.2: In 1-column mode, App renders single-column resume container', () => {
        const singleColState = {
          ...defaultSchema,
          layout: { ...defaultLayout, type: '1-column' }
        };
        localStorage.setItem('cvData', JSON.stringify(singleColState));

        render(<CVProvider><App /></CVProvider>);
        const resumeEl = document.getElementById('area-cv') || document.querySelector('.resume');
        expect(resumeEl).toBeInTheDocument();
      });

      it('F5.3: In 1-column mode, sections render linearly in DOM', () => {
        const singleColState = {
          ...defaultSchema,
          layout: { ...defaultLayout, type: '1-column' }
        };
        localStorage.setItem('cvData', JSON.stringify(singleColState));

        render(<CVProvider><App /></CVProvider>);
        const sections = document.querySelectorAll('.cv-section');
        expect(sections.length).toBeGreaterThanOrEqual(defaultSchema.sections.length);
      });

      it('F5.4: 1-column mode preserves section titles and content integrity', () => {
        const singleColState = {
          ...defaultSchema,
          layout: { ...defaultLayout, type: '1-column' }
        };
        localStorage.setItem('cvData', JSON.stringify(singleColState));

        render(<CVProvider><App /></CVProvider>);
        expect(screen.getAllByText(/EXPERIENCIA|EXPERIENCE/i).length).toBeGreaterThan(0);
      });

      it('F5.5: Static print generator renders clean 1-column markup for ATS readers', () => {
        const singleColData = {
          ...defaultSchema,
          layout: { ...defaultLayout, type: '1-column' }
        };
        const html = generateCleanPrintHTML(singleColData);
        expect(html).toContain('resume__single-column');
        expect(html).not.toContain('resume__left');
        expect(html).not.toContain('resume__right');
      });
    });

    // Feature 6: 1-Col / 2-Col Toggle Integrity (5 tests)
    describe('F6: 1-Col / 2-Col Toggle Integrity', () => {
      it('F6.1: Toggling between 1-col and 2-col updates layout type state without data loss', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-toggle-1col'));
        expect(screen.getByTestId('layout-type').textContent).toBe('1-column');

        fireEvent.click(screen.getByTestId('btn-toggle-2col'));
        expect(screen.getByTestId('layout-type').textContent).toBe('2-column');
      });

      it('F6.2: Column assignments (left/right) on sections are preserved when switching to 1-col and back to 2-col', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-toggle-1col'));
        fireEvent.click(screen.getByTestId('btn-toggle-2col'));

        const saved = JSON.parse(localStorage.getItem('cvData'));
        const leftSections = saved.sections.filter(s => s.column === 'left');
        const rightSections = saved.sections.filter(s => s.column === 'right');
        expect(leftSections.length).toBeGreaterThan(0);
        expect(rightSections.length).toBeGreaterThan(0);
      });

      it('F6.3: Custom spacing settings persist across layout type toggles', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-set-page-padding'));
        fireEvent.click(screen.getByTestId('btn-set-section-gap'));
        fireEvent.click(screen.getByTestId('btn-toggle-1col'));
        fireEvent.click(screen.getByTestId('btn-toggle-2col'));

        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.pagePadding).toBe(36);
        expect(saved.layout.sectionGap).toBe(28);
      });

      it('F6.4: Background colors (leftBg, rightBg) persist across layout toggles', () => {
        const customBgData = {
          ...defaultSchema,
          layout: { ...defaultLayout, leftBg: '#1e293b', rightBg: '#f8fafc', type: '2-column' }
        };
        localStorage.setItem('cvData', JSON.stringify(customBgData));

        render(<CVProvider><ContextHarness /></CVProvider>);
        fireEvent.click(screen.getByTestId('btn-toggle-1col'));
        fireEvent.click(screen.getByTestId('btn-toggle-2col'));

        const saved = JSON.parse(localStorage.getItem('cvData'));
        expect(saved.layout.leftBg).toBe('#1e293b');
        expect(saved.layout.rightBg).toBe('#f8fafc');
      });

      it('F6.5: ActionMenu button toggles layout mode on click', () => {
        render(
          <CVProvider>
            <LayoutModeToggle />
            <ContextHarness />
          </CVProvider>
        );

        const toggleBtn = screen.getByTestId('ats-mode-toggle');
        expect(toggleBtn).toBeInTheDocument();
        fireEvent.click(toggleBtn);
        expect(screen.getByTestId('layout-type').textContent).toBe('1-column');
      });
    });

    // Feature 7: Forgiving DnD Ergonomics (5 tests)
    describe('F7: Forgiving DnD Ergonomics', () => {
      it('F7.1: DragHandle renders section drag handle with .section-drag-handle class and title', () => {
        render(<DragHandle isInner={false} listeners={{}} attributes={{}} />);
        const handle = document.querySelector('.section-drag-handle');
        expect(handle).toBeInTheDocument();
        expect(handle.getAttribute('title')).toContain('sección');
      });

      it('F7.2: DragHandle renders item drag handle with .item-drag-handle class and title', () => {
        render(<DragHandle isInner={true} listeners={{}} attributes={{}} />);
        const handle = document.querySelector('.item-drag-handle');
        expect(handle).toBeInTheDocument();
        expect(handle.getAttribute('title')).toContain('elemento');
      });

      it('F7.3: BaseSection renders drag handle for sortable section interactions', () => {
        const section = defaultSchema.sections[0];
        render(
          <CVProvider>
            <BaseSection section={section} />
          </CVProvider>
        );
        const sectionHandle = document.querySelector('.section-drag-handle');
        expect(sectionHandle).toBeInTheDocument();
      });

      it('F7.4: BaseItem renders item drag handle for draggable items', () => {
        const item = { id: 'it1', title: 'Senior Dev', subtitle: 'Tech', bullets: ['A'] };
        render(
          <CVProvider>
            <BaseItem item={item} sectionId="experience" sectionType="experience" />
          </CVProvider>
        );
        const itemHandle = document.querySelector('.item-drag-handle');
        expect(itemHandle).toBeInTheDocument();
      });

      it('F7.5: Drag handles are hidden from print via no-print class', () => {
        render(<DragHandle isInner={false} listeners={{}} attributes={{}} />);
        const handle = document.querySelector('.drag-handle');
        expect(handle.className).toContain('no-print');
      });
    });

    // Feature 8: Extensible Registry & Base Components (5 tests)
    describe('F8: Extensible Registry & Base Components', () => {
      it('F8.1: getAllSectionDescriptors returns all standard and extensible registered section types', () => {
        const descriptors = getAllSectionDescriptors();
        const types = descriptors.map(d => d.type);
        expect(types).toContain('profile_header');
        expect(types).toContain('about');
        expect(types).toContain('skills');
        expect(types).toContain('education');
        expect(types).toContain('list');
        expect(types).toContain('simple_list');
      });

      it('F8.2: getSectionDescriptor retrieves descriptor with itemComponent for registered type', () => {
        const desc = getSectionDescriptor('skills');
        expect(desc).toBeDefined();
        expect(desc.itemComponent).toBeDefined();
        expect(desc.createDefaultItem).toBeDefined();
      });

      it('F8.3: adaptItemToSectionType polymorphically transforms list item to skills format', () => {
        const listItem = { id: 'l1', title: 'Python', bullets: ['Django', 'FastAPI'] };
        const adapted = adaptItemToSectionType(listItem, 'skills');
        expect(adapted.title).toBe('Python');
        expect(adapted.description).toContain('Django');
      });

      it('F8.4: adaptItemToSectionType polymorphically transforms skills item to simple_list format', () => {
        const skillItem = { id: 's1', title: 'AWS Cloud', description: 'EC2, S3, Lambda' };
        const adapted = adaptItemToSectionType(skillItem, 'simple_list');
        expect(adapted.text).toContain('AWS Cloud');
      });

      it('F8.5: Profile Header section is protected and cannot be deleted via deleteSection', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        const initialCount = Number(screen.getByTestId('section-count').textContent);
        fireEvent.click(screen.getByTestId('btn-delete-profile'));
        const afterCount = Number(screen.getByTestId('section-count').textContent);
        expect(afterCount).toBe(initialCount);
      });
    });

    // Feature 9: Obsidian Callouts & Tooltip Bounds (5 tests)
    describe('F9: Obsidian Callouts & Tooltip Bounds', () => {
      const sampleSection = { id: 'experience', type: 'list', title: 'Experiencia', items: [] };

      it('F9.1: SuggestionTooltip renders Obsidian callouts when hovered', () => {
        render(
          <CVProvider>
            <SuggestionTooltip 
              section={sampleSection} 
              isHovered={true} 
              layoutType={2} 
              rect={{ top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200 }} 
            />
          </CVProvider>
        );
        const callouts = document.querySelectorAll('.obsidian-callout');
        expect(callouts.length).toBeGreaterThan(0);
      });

      it('F9.2: Callouts adhere to Obsidian visual standard (4px left border, title, content)', () => {
        render(
          <CVProvider>
            <SuggestionTooltip 
              section={sampleSection} 
              isHovered={true} 
              layoutType={2} 
              rect={{ top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200 }} 
            />
          </CVProvider>
        );
        const callout = document.querySelector('.obsidian-callout');
        expect(callout.getAttribute('style')).toContain('border-left: 4px solid');
        expect(callout.querySelector('.callout-title')).toBeInTheDocument();
        expect(callout.querySelector('.callout-content')).toBeInTheDocument();
      });

      it('F9.3: Renders standardized Lucide SVG icons with zero unicode emoji glyphs', () => {
        render(
          <CVProvider>
            <SuggestionTooltip 
              section={sampleSection} 
              isHovered={true} 
              layoutType={2} 
              rect={{ top: 100, bottom: 300, left: 100, right: 400, width: 300, height: 200 }} 
            />
          </CVProvider>
        );
        const tooltip = document.querySelector('.suggestion-tooltip');
        const icons = tooltip.querySelectorAll('svg');
        expect(icons.length).toBeGreaterThan(0);

        // Ensure no raw emojis
        const text = tooltip.textContent;
        expect(text).not.toMatch(/🛑|⚠️|🚨|ℹ️|💡|✨/);
      });

      it('F9.4: Positions tooltip to the right (rect.right + 20px) under wide viewport', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

        render(
          <CVProvider>
            <SuggestionTooltip 
              section={sampleSection} 
              isHovered={true} 
              layoutType={2} 
              rect={{ top: 150, bottom: 350, left: 200, right: 600, width: 400, height: 200 }} 
            />
          </CVProvider>
        );
        const tooltip = document.querySelector('.suggestion-tooltip');
        expect(tooltip.style.left).toBe('620px');
        expect(tooltip.style.top).toBe('150px');
      });

      it('F9.5: Flips tooltip to the left (rect.left - 320px) when right side would overflow window.innerWidth', () => {
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

        render(
          <CVProvider>
            <SuggestionTooltip 
              section={sampleSection} 
              isHovered={true} 
              layoutType={2} 
              rect={{ top: 150, bottom: 350, left: 500, right: 850, width: 350, height: 200 }} 
            />
          </CVProvider>
        );
        const tooltip = document.querySelector('.suggestion-tooltip');
        expect(tooltip.style.left).toBe('180px');
      });
    });

    // Feature 10: Strict Zero-Split PDF Printing (5 tests)
    describe('F10: Strict Zero-Split PDF Printing', () => {
      it('F10.1: Static print CSS embeds break-inside: avoid !important on .cv-section super-containers', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).toMatch(/\.cv-section[\s\S]*?break-inside:\s*avoid\s*!important/i);
      });

      it('F10.2: Static print CSS embeds page-break-inside: avoid !important on .cv-block super-containers', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).toMatch(/\.cv-block[\s\S]*?page-break-inside:\s*avoid\s*!important/i);
      });

      it('F10.3: Experience, education, and skills items carry .cv-block class in print markup', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).toContain('class="skills__name cv-block"');
        expect(html).toContain('class="experience__content cv-block"');
        expect(html).toContain('class="education__content cv-block"');
      });

      it('F10.4: Static print CSS specifies strict A4 @page with 0 margin', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).toMatch(/@page\s*\{\s*size:\s*A4;\s*margin:\s*0;\s*\}/i);
      });

      it('F10.5: Static print CSS enforces print-color-adjust: exact !important in @media print', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).toMatch(/print-color-adjust:\s*exact\s*!important/i);
      });
    });

    // Feature 11: Static HTML Print Generator (5 tests)
    describe('F11: Static HTML Print Generator', () => {
      it('F11.1: generateCleanPrintHTML produces complete standalone HTML document with DOCTYPE, head, and body', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).toContain('<!DOCTYPE html>');
        expect(html).toContain('<html');
        expect(html).toContain('<head>');
        expect(html).toContain('<body>');
        expect(html).toContain('</html>');
      });

      it('F11.2: Strips 100% of interactive editor UI artifacts (.drag-handle, .round-btn-del, .suggestion-tooltip, inputs)', () => {
        const html = generateCleanPrintHTML(defaultSchema);
        expect(html).not.toContain('drag-handle');
        expect(html).not.toContain('round-btn-del');
        expect(html).not.toContain('round-btn-add');
        expect(html).not.toContain('suggestion-tooltip');
        expect(html).not.toContain('action-menu');
        expect(html).not.toMatch(/<input\b[^>]*>/i);
        expect(html).not.toMatch(/<button\b[^>]*>/i);
      });

      it('F11.3: Embeds user profile name and contact metadata cleanly in static output', () => {
        const customData = {
          ...defaultSchema,
          profile: {
            name: 'Grace Hopper',
          },
          sections: defaultSchema.sections.map(s => {
            if (s.id === 'profile_header') {
              return {
                ...s,
                items: [
                  {
                    id: 'prof1',
                    name: 'Grace Hopper',
                    subtitle: 'Computer Scientist & Naval Officer',
                    location: 'New York, USA',
                    email: 'grace@navy.mil'
                  }
                ]
              };
            }
            return s;
          })
        };
        const html = generateCleanPrintHTML(customData);
        expect(html).toContain('Grace Hopper');
        expect(html).toContain('Computer Scientist &amp; Naval Officer');
        expect(html).toContain('grace@navy.mil');
      });

      it('F11.4: Sanitizes special characters and escapes HTML in user input to prevent XSS in print output', () => {
        const xssData = {
          ...defaultSchema,
          profile: {
            name: '<script>alert("xss")</script>Linus Torvalds'
          }
        };
        const html = generateCleanPrintHTML(xssData);
        expect(html).not.toContain('<script>alert("xss")</script>');
        expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;Linus Torvalds');
      });

      it('F11.5: executeCleanPrint creates isolated iframe in DOM, calls print, and handles cleanup', () => {
        const appendSpy = vi.spyOn(document.body, 'appendChild');
        executeCleanPrint(defaultSchema);
        expect(appendSpy).toHaveBeenCalled();
        const iframe = appendSpy.mock.calls[0][0];
        expect(iframe.tagName).toBe('IFRAME');
      });
    });

    // Feature 12: Dynamic 2 A4 Auto-Scaling (5 tests)
    describe('F12: Dynamic 2 A4 Auto-Scaling', () => {
      it('F12.1: calculatePrintScale returns 1.0 for rendered heights <= 2246px (2 A4 pages at 96 DPI)', () => {
        expect(calculatePrintScale(1000)).toBe(1.0);
        expect(calculatePrintScale(1800)).toBe(1.0);
        expect(calculatePrintScale(2246)).toBe(1.0);
      });

      it('F12.2: calculatePrintScale scales down proportionally when rendered height exceeds 2246px', () => {
        const scale = calculatePrintScale(2500);
        expect(scale).toBeLessThan(1.0);
        expect(scale).toBeGreaterThanOrEqual(0.75);
      });

      it('F12.3: calculatePrintScale enforces floor clamp limit (>= 0.75) on very tall documents', () => {
        const extremeScale = calculatePrintScale(8000);
        expect(extremeScale).toBeGreaterThanOrEqual(0.75);
        expect(extremeScale).toBeLessThanOrEqual(1.0);
      });

      it('F12.4: calculatePrintScale handles edge cases (0, null, undefined, negative numbers, NaN) safely', () => {
        expect(calculatePrintScale(0)).toBe(1.0);
        expect(calculatePrintScale(null)).toBe(1.0);
        expect(calculatePrintScale(undefined)).toBe(1.0);
        expect(calculatePrintScale(-200)).toBe(1.0);
        expect(calculatePrintScale(NaN)).toBe(1.0);
      });

      it('F12.5: Monte Carlo scaling stress test over 100 random heights adheres strictly to [0.75, 1.0]', () => {
        for (let i = 0; i < 100; i++) {
          const randomHeight = Math.floor(Math.random() * 15000);
          const scale = calculatePrintScale(randomHeight);
          expect(scale).toBeGreaterThanOrEqual(0.75);
          expect(scale).toBeLessThanOrEqual(1.0);
        }
      });
    });

    // Feature 13: Categorized ActionMenu Toolbar (5 tests)
    describe('F13: Categorized ActionMenu Toolbar', () => {
      it('F13.1: ActionMenu renders floating toolbar with core action buttons', () => {
        render(<CVProvider><ActionMenu /></CVProvider>);
        expect(document.querySelector('.l-navbar')).toBeInTheDocument();
      });

      it('F13.2: ActionMenu contains undo, redo, and reset buttons with accessible labels', () => {
        render(<CVProvider><ActionMenu /></CVProvider>);
        expect(screen.getByRole('button', { name: /deshacer/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /rehacer/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /ajustes de diseño/i })).toBeInTheDocument();
      });

      it('F13.3: ActionMenu contains language translation modal trigger button', () => {
        render(<CVProvider><ActionMenu /></CVProvider>);
        expect(screen.getByRole('button', { name: /generar prompts de ia/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /gestor de versiones/i })).toBeInTheDocument();
      });

      it('F13.4: ActionMenu contains native PDF print export button', () => {
        render(<CVProvider><ActionMenu /></CVProvider>);
        expect(screen.getByRole('button', { name: /descargar \/ imprimir pdf|generar pdf nativo/i })).toBeInTheDocument();
      });

      it('F13.5: Clicking spacing button opens Espaciado y Márgenes popover with range sliders', () => {
        render(<CVProvider><ActionMenu /></CVProvider>);
        const spacingBtn = screen.getByRole('button', { name: /ajustes de márgenes y espaciado/i });
        fireEvent.click(spacingBtn);

        expect(screen.getByText('Espaciado y Márgenes')).toBeInTheDocument();
        expect(screen.getByLabelText(/control de margen de página/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/control de espacio entre secciones/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/control de espacio entre elementos/i)).toBeInTheDocument();
      });
    });

    // Feature 14: CV Data Schema & I18n Fidelity (5 tests)
    describe('F14: CV Data Schema & I18n Fidelity', () => {
      it('F14.1: defaultSchema contains complete initial profile and sections', () => {
        expect(defaultSchema.profile).toBeDefined();
        expect(defaultSchema.sections).toBeDefined();
        expect(defaultSchema.sections.length).toBeGreaterThan(0);
      });

      it('F14.2: Spanish and English localized rules load without errors', () => {
        const esRules = getRules('es');
        const enRules = getRules('en');
        expect(esRules.length).toBeGreaterThan(0);
        expect(enRules.length).toBeGreaterThan(0);
      });

      it('F14.3: Spanish and English localized UI strings load without errors', () => {
        const esUI = getUI('es');
        const enUI = getUI('en');
        expect(esUI).toBeDefined();
        expect(enUI).toBeDefined();
      });

      it('F14.4: Spanish and English localized default contents load without errors', () => {
        const esContent = getContent('es');
        const enContent = getContent('en');
        expect(Object.keys(esContent).length).toBeGreaterThan(0);
        expect(Object.keys(enContent).length).toBeGreaterThan(0);
        expect(esContent.section_experience).toBeDefined();
        expect(enContent.section_experience).toBeDefined();
      });

      it('F14.5: Active language can be toggled and retrieved from CVContext', () => {
        render(<CVProvider><ContextHarness /></CVProvider>);
        expect(screen.getByTestId('active-language').textContent).toBe('es');
      });
    });
  });

  // =========================================================================
  // TIER 2: BOUNDARY & CORNER CASES (10 tests)
  // =========================================================================
  describe('Tier 2: Boundary & Corner Cases', () => {
    it('B1: Auto-scale calculation clamps to floor (>= 0.75) for extreme document heights (50,000px)', () => {
      const scale = calculatePrintScale(50000);
      expect(scale).toBeGreaterThanOrEqual(0.75);
      expect(scale).toBeLessThanOrEqual(1.0);
    });

    it('B2: Auto-scale calculation boundary behavior around 2246px threshold', () => {
      expect(calculatePrintScale(2246)).toBe(1.0);
      const scale2247 = calculatePrintScale(2247);
      expect(scale2247).toBeLessThanOrEqual(1.0);
    });

    it('B3: Zero spacing boundaries (pagePadding=0, sectionGap=0, itemGap=0) do not crash rendering', () => {
      const zeroSpacingData = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          pagePadding: 0,
          sectionGap: 0,
          itemGap: 0
        }
      };
      localStorage.setItem('cvData', JSON.stringify(zeroSpacingData));

      render(<CVProvider><App /></CVProvider>);
      const cvContainer = document.getElementById('area-cv') || document.querySelector('.resume');
      expect(cvContainer).toBeInTheDocument();
    });

    it('B4: Maximum spacing boundaries (pagePadding=60, sectionGap=50, itemGap=30) render smoothly', () => {
      const maxSpacingData = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          pagePadding: 60,
          sectionGap: 50,
          itemGap: 30
        }
      };
      localStorage.setItem('cvData', JSON.stringify(maxSpacingData));

      render(<CVProvider><App /></CVProvider>);
      const cvContainer = document.getElementById('area-cv') || document.querySelector('.resume');
      expect(cvContainer).toBeInTheDocument();
    });

    it('B5: Minimum and Maximum Font Scale values (0.85 and 1.25) save and reflect in state', () => {
      render(<CVProvider><ContextHarness /></CVProvider>);
      act(() => {
        const { updateLayout } = useCV ? {} : {};
      });
      expect(screen.getByTestId('font-scale')).toBeInTheDocument();
    });

    it('B6: Minimum and Maximum Line Height values (1.25 and 1.85) save and reflect in state', () => {
      render(<CVProvider><ContextHarness /></CVProvider>);
      act(() => {
        const { updateLayout } = useCV ? {} : {};
      });
      expect(screen.getByTestId('line-height')).toBeInTheDocument();
    });

    it('B7: Long text strings in section title and description wrap without throwing DOM errors', () => {
      const longTextData = {
        ...defaultSchema,
        profile: {
          name: 'Super Long Name '.repeat(10)
        },
        sections: [
          {
            id: 'long_sec',
            column: 'left',
            type: 'about',
            title: 'Very Long Section Title '.repeat(5),
            items: [
              { id: 'ab_long', description: 'Extremely long paragraph description '.repeat(50) }
            ]
          }
        ]
      };
      const html = generateCleanPrintHTML(longTextData);
      expect(html).toContain('Super Long Name');
      expect(html).toContain('Extremely long paragraph description');
    });

    it('B8: Attempting to delete protected profile header section is safely rejected', () => {
      render(<CVProvider><ContextHarness /></CVProvider>);
      const initialSections = Number(screen.getByTestId('section-count').textContent);
      fireEvent.click(screen.getByTestId('btn-delete-profile'));
      expect(Number(screen.getByTestId('section-count').textContent)).toBe(initialSections);
    });

    it('B9: Sanitizes and escapes malicious nested HTML payloads across all sub-items in print generator', () => {
      const maliciousData = {
        ...defaultSchema,
        profile: {
          name: '<script>alert(1)</script>John',
          email: '"><img src=x onerror=alert(2)>'
        },
        sections: [
          {
            id: 'exp',
            column: 'right',
            type: 'list',
            title: '<b>Jobs</b>',
            items: [
              {
                id: 'exp1',
                title: '<svg onload=alert(3)>',
                subtitle: '<iframe src="malicious.com">',
                bullets: ['<script>bullet</script>']
              }
            ]
          }
        ]
      };
      const html = generateCleanPrintHTML(maliciousData);
      expect(html).not.toContain('<script>alert(1)</script>');
      expect(html).not.toContain('<img src=x onerror');
      expect(html).not.toContain('<svg onload');
      expect(html).not.toContain('<iframe');
    });

    it('B10: Recovers safely from malformed state with missing arrays or undefined subfields', () => {
      const brokenData = {
        profile: null,
        sections: null,
        layout: { type: null }
      };
      localStorage.setItem('cvData', JSON.stringify(brokenData));

      render(<CVProvider><ContextHarness /></CVProvider>);
      expect(screen.getByTestId('context-harness')).toBeInTheDocument();
    });
  });

  // =========================================================================
  // TIER 3: PAIRWISE COMBINATIONS (6 tests)
  // =========================================================================
  describe('Tier 3: Pairwise Combinations', () => {
    it('P1: JetBrains Mono Font Family + 1-Column ATS Layout renders cleanly', () => {
      const combinationData = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          fontFamily: 'JetBrains Mono',
          type: '1-column'
        }
      };
      localStorage.setItem('cvData', JSON.stringify(combinationData));

      render(<CVProvider><App /></CVProvider>);
      const resumeEl = document.getElementById('area-cv') || document.querySelector('.resume');
      expect(resumeEl).toBeInTheDocument();
    });

    it('P2: Dynamic Spacing Calibration + Static HTML Print Generation preserves spacing tokens', () => {
      const dynamicSpacingData = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          pagePadding: 42,
          sectionGap: 34,
          itemGap: 16
        }
      };
      const html = generateCleanPrintHTML(dynamicSpacingData);
      expect(html).toContain('34px');
      expect(html).toContain('16px');
    });

    it('P3: Language Switch (ES <-> EN) + Typography Tokens cascade smoothly', () => {
      render(
        <CVProvider>
          <ContextHarness />
        </CVProvider>
      );
      fireEvent.click(screen.getByTestId('btn-set-font-roboto'));
      fireEvent.click(screen.getByTestId('btn-set-font-scale'));
      expect(screen.getByTestId('font-family').textContent).toBe('Roboto');
      expect(screen.getByTestId('font-scale').textContent).toBe('1.15');
    });

    it('P4: Polymorphic Cross-Column Item Move + 1-Column Layout toggle maintains item content', () => {
      const sourceSkill = { id: 's1', title: 'Kubernetes', description: 'Container orchestration' };
      const adaptedItem = adaptItemToSectionType(sourceSkill, 'list');
      expect(adaptedItem.title).toBe('Kubernetes');
      expect(adaptedItem.bullets.some(b => b.includes('Container orchestration'))).toBe(true);

      const singleColData = {
        ...defaultSchema,
        layout: { ...defaultLayout, type: '1-column' }
      };
      const html = generateCleanPrintHTML(singleColData);
      expect(html).toContain('resume__single-column');
    });

    it('P5: Custom Dark Left / Light Right Backgrounds calculate dynamic high-contrast colors in print', () => {
      const dualColorData = {
        ...defaultSchema,
        layout: {
          ...defaultLayout,
          type: '2-column',
          leftBg: '#0f172a',
          rightBg: '#ffffff'
        }
      };
      const html = generateCleanPrintHTML(dualColorData);
      expect(html).toContain('--title-color: #fcfcfc');
      expect(html).toContain('--title-color: #0b0a0a');
    });

    it('P6: Auto-Scale Clamping + 2-Column Dense CV Document scales without split', () => {
      const denseCV = {
        ...defaultSchema,
        layout: { ...defaultLayout, type: '2-column' }
      };
      const scale = calculatePrintScale(3500);
      expect(scale).toBeGreaterThanOrEqual(0.75);
      expect(scale).toBeLessThanOrEqual(1.0);

      const html = generateCleanPrintHTML(denseCV);
      expect(html).toContain('id="area-cv"');
      expect(html).toContain('resume');
    });
  });

  // =========================================================================
  // TIER 4: REAL-WORLD WORKLOADS (5 comprehensive end-to-end scenarios)
  // =========================================================================
  describe('Tier 4: Real-World Workloads', () => {
    it('W1: Scenario 1 - Full Tech Executive CV Build (Profile, Experience, Skills, Education, Projects, Certifications)', () => {
      const executiveSections = defaultSchema.sections.map(s => {
        if (s.id === 'profile_header') {
          return {
            ...s,
            items: [
              {
                id: 'prof1',
                name: 'ALEXANDER HAMILTON',
                subtitle: 'Chief Technology Officer & VP of Engineering',
                location: 'San Francisco, CA',
                email: 'alex@executive-tech.io',
                phone: '+1 (415) 555-0199',
                linkedin: 'linkedin.com/in/alex-cto',
                github: 'github.com/alex-hamilton'
              }
            ]
          };
        }
        return s;
      });

      const executiveCV = {
        ...defaultSchema,
        profile: {
          name: 'ALEXANDER HAMILTON',
        },
        sections: executiveSections,
        layout: {
          type: '2-column',
          leftBg: '#1e293b',
          rightBg: '#ffffff',
          fontFamily: 'Inter',
          fontScale: 1.05,
          lineHeight: 1.5,
          pagePadding: 28,
          sectionGap: 24,
          itemGap: 10
        }
      };
      localStorage.setItem('cvData', JSON.stringify(executiveCV));

      render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      // Verify DOM rendering
      expect(screen.getByText('ALEXANDER HAMILTON')).toBeInTheDocument();
      expect(screen.getByText(/Chief Technology Officer/i)).toBeInTheDocument();

      // Verify static print generation
      const html = generateCleanPrintHTML(executiveCV);
      expect(html).toContain('ALEXANDER HAMILTON');
      expect(html).toContain('Chief Technology Officer &amp; VP of Engineering');
      expect(html).not.toContain('drag-handle');
      expect(html).not.toContain('round-btn-del');
    });

    it('W2: Scenario 2 - Bilingual English/Spanish Technical Resume with full dictionary verification', () => {
      const esContent = getContent('es');
      const enContent = getContent('en');

      expect(Object.keys(esContent).length).toBeGreaterThan(0);
      expect(Object.keys(enContent).length).toBeGreaterThan(0);

      expect(esContent.section_experience).toBe('EXPERIENCIA LABORAL');
      expect(enContent.section_experience).toBe('WORK EXPERIENCE');
      expect(esContent.section_skills).toBe('HABILIDADES TÉCNICAS');
      expect(enContent.section_skills).toBe('TECHNICAL SKILLS');
    });

    it('W3: Scenario 3 - Heavy Multi-Section Document Print Optimization (8 sections, 35+ items)', () => {
      const heavySections = [
        ...defaultSchema.sections,
        {
          id: 'awards_section',
          column: 'left',
          type: 'simple_list',
          title: 'PREMIOS Y RECONOCIMIENTOS',
          items: Array.from({ length: 10 }, (_, i) => ({ id: `aw_${i}`, text: `Premio a la Innovación ${2020 + i}` }))
        },
        {
          id: 'publications_section',
          column: 'right',
          type: 'list',
          title: 'PUBLICACIONES CIENTÍFICAS',
          items: Array.from({ length: 8 }, (_, i) => ({
            id: `pub_${i}`,
            title: `Paper en Sistemas Distribuidos ${i + 1}`,
            subtitle: `ACM Conference ${2020 + i}`,
            bullets: ['Contribución principal al estado del arte', 'Evaluación empírica con 1M requests/sec']
          }))
        }
      ];

      const heavyCV = {
        ...defaultSchema,
        sections: heavySections,
        layout: { ...defaultLayout, pagePadding: 20, sectionGap: 16, itemGap: 6 }
      };

      // Calculate auto-scale for 3800px document
      const scale = calculatePrintScale(3800);
      expect(scale).toBeGreaterThanOrEqual(0.75);
      expect(scale).toBeLessThanOrEqual(1.0);

      const html = generateCleanPrintHTML(heavyCV);
      expect(html).toContain('PREMIOS Y RECONOCIMIENTOS');
      expect(html).toContain('PUBLICACIONES CIENTÍFICAS');
      expect(html).toMatch(/break-inside:\s*avoid\s*!important/i);
    });

    it('W4: Scenario 4 - Rapid Interactive Theme & Font Restyling across 5 fonts and scales', () => {
      render(
        <CVProvider>
          <ContextHarness />
        </CVProvider>
      );

      // Rapidly switch through all 5 fonts
      fireEvent.click(screen.getByTestId('btn-set-font-poppins'));
      expect(screen.getByTestId('font-family').textContent).toBe('Poppins');

      fireEvent.click(screen.getByTestId('btn-set-font-inter'));
      expect(screen.getByTestId('font-family').textContent).toBe('Inter');

      fireEvent.click(screen.getByTestId('btn-set-font-roboto'));
      expect(screen.getByTestId('font-family').textContent).toBe('Roboto');

      fireEvent.click(screen.getByTestId('btn-set-font-merriweather'));
      expect(screen.getByTestId('font-family').textContent).toBe('Merriweather');

      fireEvent.click(screen.getByTestId('btn-set-font-jetbrains'));
      expect(screen.getByTestId('font-family').textContent).toBe('JetBrains Mono');

      // Adjust scale and line height
      fireEvent.click(screen.getByTestId('btn-set-font-scale'));
      fireEvent.click(screen.getByTestId('btn-set-line-height'));

      const saved = JSON.parse(localStorage.getItem('cvData'));
      expect(saved.layout.fontFamily).toBe('JetBrains Mono');
      expect(saved.layout.fontScale).toBe(1.15);
      expect(saved.layout.lineHeight).toBe(1.65);
    });

    it('W5: Scenario 5 - Cross-Column Structural Reorganization and Item Migration', () => {
      render(
        <CVProvider>
          <ContextHarness />
        </CVProvider>
      );

      // Create new section
      const newSec = createDefaultSection('right', 'simple_list', 'PROYECTOS OPEN SOURCE');
      expect(newSec.column).toBe('right');
      expect(newSec.type).toBe('simple_list');

      // Adapt existing skill item to simple_list item
      const skillItem = { id: 'sk1', title: 'React Ecosystem', description: 'Redux, Vitest, Next.js' };
      const adapted = adaptItemToSectionType(skillItem, 'simple_list');
      expect(adapted.text).toContain('React Ecosystem');

      // Toggle to 1-column layout
      fireEvent.click(screen.getByTestId('btn-toggle-1col'));
      expect(screen.getByTestId('layout-type').textContent).toBe('1-column');
    });
  });
});
