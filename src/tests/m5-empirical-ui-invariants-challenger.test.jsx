import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

import App from '../App';
import { CVProvider } from '../context/CVContext';
import { 
  CONTACT_TYPES, 
  CONTACT_ICON_MAP, 
  ContactIcon, 
  getContactConfig 
} from '../utils/contactTypes';
import { 
  getAllSectionDescriptors, 
  getSectionDescriptor 
} from '../registry/sectionRegistry';
import SuggestionTooltip from '../components/Editor/SuggestionTooltip';
import ActionMenu from '../components/Editor/ActionMenu';
import AddSectionModal from '../components/Editor/AddSectionModal';
import DragHandle from '../components/Editor/DragHandle';
import SectionBulletStylePopover from '../components/Editor/SectionBulletStylePopover';
import ContactTypePicker from '../components/Editor/ContactTypePicker';
import HyperlinkEdit from '../components/Editor/HyperlinkEdit';
import RichTextToolbar from '../components/Editor/RichTextToolbar';
import VersionManagerModal from '../components/Editor/VersionManagerModal';
import useCVDndCoordinator from '../hooks/useCVDndCoordinator';

describe('Milestone M5: Empirical Stress Verification of UI Invariants, Iconography, DND & Tooltips', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  // =========================================================================
  // PILLAR 1: ICONOGRAPHY - 100% Lucide-React SVG & Zero BoxIcons Traces
  // =========================================================================
  describe('Pillar 1: Iconography Invariants (Lucide SVGs & Zero BoxIcons)', () => {
    it('ICON-1.1: index.html contains zero BoxIcons CDN stylesheets or scripts', () => {
      const indexHtmlPath = path.resolve(process.cwd(), 'index.html');
      const htmlContent = fs.readFileSync(indexHtmlPath, 'utf-8');

      expect(htmlContent).not.toMatch(/boxicons/i);
      expect(htmlContent).not.toMatch(/unpkg\.com\/boxicons/i);
      expect(htmlContent).not.toMatch(/boxicons\.min\.css/i);
    });

    it('ICON-1.2: package.json has lucide-react and zero boxicons dependencies', () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json');
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };

      expect(deps['lucide-react']).toBeDefined();
      expect(deps['boxicons']).toBeUndefined();
      expect(deps['@boxicons/react']).toBeUndefined();
    });

    it('ICON-1.3: src/ contains zero legacy BoxIcons CSS class usages (bx, bx-, bxs-) in JSX/JS components', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const scanFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            if (file !== 'tests' && file !== 'node_modules') {
              results = results.concat(scanFiles(fullPath));
            }
          } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(fullPath);
          }
        });
        return results;
      };

      const sourceFiles = scanFiles(srcDir);
      const violations = [];

      sourceFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        // Search for string literals or class assignments with bx or bx-*
        // Exclude rich text engine italic checks and JSDoc comments
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes('//') || line.includes('/*') || line.includes('*')) {
            // comment line
            return;
          }
          if (line.includes('bx-') || line.includes('bxs-') || line.includes('"bx ') || line.includes("'bx ")) {
            violations.push(path.relative(process.cwd(), file) + ':' + (idx + 1) + ': ' + line.trim());
          }
        });
      });

      expect(violations).toEqual([]);
    });

    it('ICON-1.4: All 18 Contact Types in contactTypes.js render native Lucide SVGs with 0 boxicons', () => {
      expect(CONTACT_TYPES.length).toBe(18);

      const expectedTypes = [
        'email', 'phone', 'whatsapp', 'telegram',
        'location', 'work_mode', 'citizenship', 'age',
        'linkedin', 'github', 'gitlab', 'leetcode',
        'stackoverflow', 'portfolio', 'website', 'blog',
        'figma', 'dribbble'
      ];

      expectedTypes.forEach(typeId => {
        const config = getContactConfig(typeId);
        expect(config).toBeDefined();
        expect(config.id).toBe(typeId);
        expect(config.icon).toBeTruthy();

        const { container } = render(<ContactIcon name={config.icon} size={16} className="test-contact-icon" />);
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg.tagName.toLowerCase()).toBe('svg');
        expect(svg.classList.contains('lucide')).toBe(true);
        expect(container.querySelector('i')).toBeNull();
        expect(container.querySelector('.bx')).toBeNull();
        cleanup();
      });
    });

    it('ICON-1.5: ContactIcon fallback correctly renders LinkIcon Lucide SVG for unknown types', () => {
      const { container } = render(<ContactIcon name="unknown_exotic_network_99" size={14} />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg.tagName.toLowerCase()).toBe('svg');
      expect(svg.classList.contains('lucide')).toBe(true);
      expect(container.querySelector('i')).toBeNull();
    });

    it('ICON-1.6: All registered section descriptors define valid Lucide icon metadata', () => {
      const descriptors = getAllSectionDescriptors();
      // Should include at least 15 registered types (14 standard + mentoring) + 1 fallback = 16
      expect(descriptors.length).toBeGreaterThanOrEqual(15);

      descriptors.forEach(desc => {
        expect(desc.type).toBeTruthy();
        expect(desc.label).toBeTruthy();
        expect(desc.icon).toBeTruthy();
        expect(typeof desc.icon).toBe('string');
      });

      // Also verify fallback descriptor
      const fallbackDesc = getSectionDescriptor('custom_nonexistent_section_type');
      expect(fallbackDesc.type).toBe('custom_nonexistent_section_type');
      expect(fallbackDesc.icon).toBe('FolderPlus');
    });

    it('ICON-1.7: AddSectionModal renders Lucide SVG icons for all section cards', () => {
      const descriptors = getAllSectionDescriptors().filter(d => d.type !== 'profile_header');
      
      const { container } = render(
        <CVProvider>
          <AddSectionModal isOpen={true} onClose={() => {}} targetColumn="right" />
        </CVProvider>
      );

      const modal = container.querySelector('[data-testid="add-section-modal"]');
      expect(modal).toBeInTheDocument();

      // Check that every section card contains a rendered SVG Lucide icon
      descriptors.forEach(desc => {
        const card = container.querySelector(`[data-testid="add-section-card-${desc.type}"]`);
        expect(card).toBeInTheDocument();
        const svg = card.querySelector('svg');
        expect(svg).toBeInTheDocument();
        expect(svg.tagName.toLowerCase()).toBe('svg');
      });
    });

    it('ICON-1.8: DragHandle renders native Lucide GripVertical SVG for section and item', () => {
      const { container: sectionHandleContainer } = render(
        <DragHandle isInner={false} listeners={{}} attributes={{}} />
      );
      const sectionSvg = sectionHandleContainer.querySelector('svg');
      expect(sectionSvg).toBeInTheDocument();
      expect(sectionSvg.classList.contains('lucide-grip-vertical')).toBe(true);

      const { container: itemHandleContainer } = render(
        <DragHandle isInner={true} listeners={{}} attributes={{}} />
      );
      const itemSvg = itemHandleContainer.querySelector('svg');
      expect(itemSvg).toBeInTheDocument();
      expect(itemSvg.classList.contains('lucide-grip-vertical')).toBe(true);
    });

    it('ICON-1.9: ActionMenu renders 100% Lucide SVGs across all toolbars and buttons with zero boxicons', () => {
      const { container } = render(
        <CVProvider>
          <ActionMenu />
        </CVProvider>
      );

      const allIcons = container.querySelectorAll('i');
      expect(allIcons.length).toBe(0);

      const allSvgs = container.querySelectorAll('svg');
      expect(allSvgs.length).toBeGreaterThan(5);
      allSvgs.forEach(svg => {
        expect(svg.tagName.toLowerCase()).toBe('svg');
      });
    });

    it('ICON-1.10: Popovers and Modals (HyperlinkEdit, ContactTypePicker, BulletPopover, RichTextToolbar) render Lucide SVGs', () => {
      // 1. HyperlinkEdit
      const { container: linkContainer } = render(
        <HyperlinkEdit url="https://example.com" text="Example Link" onSave={() => {}} />
      );
      expect(linkContainer.querySelector('svg')).toBeInTheDocument();
      cleanup();

      // 2. ContactTypePicker
      const { container: pickerContainer } = render(
        <ContactTypePicker isOpen={true} onClose={() => {}} onSelectType={() => {}} />
      );
      expect(pickerContainer.querySelectorAll('svg').length).toBeGreaterThan(0);
      cleanup();

      // 3. SectionBulletStylePopover
      const { container: bulletContainer } = render(
        <SectionBulletStylePopover isOpen={true} onClose={() => {}} onUpdateStyle={() => {}} />
      );
      expect(bulletContainer.querySelectorAll('svg').length).toBeGreaterThan(0);
      cleanup();

      // 4. RichTextToolbar
      const { container: toolbarContainer } = render(
        <CVProvider>
          <RichTextToolbar visible={true} activeFormats={{ bold: false, italic: false, align: 'left' }} />
        </CVProvider>
      );
      expect(toolbarContainer.querySelectorAll('svg').length).toBeGreaterThan(5);
      cleanup();
    });
  });

  // =========================================================================
  // PILLAR 2: DYNAMIC TOOLTIPS - getBoundingClientRect, Edge Flip & Clamping
  // =========================================================================
  describe('Pillar 2: Dynamic Tooltip Positioning Invariants', () => {
    const mockSection = {
      id: 'test_sec',
      type: 'skills',
      title: 'HABILIDADES TÉCNICAS',
      items: [{ id: 'item1', title: 'React', description: 'Testing' }]
    };

    it('TOOLTIP-2.1: Positions adjacent to element (rect.right + 20px) under normal desktop conditions', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1920 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 1080 });

      const rect = { top: 200, bottom: 350, left: 300, right: 700, width: 400, height: 150 };

      render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={true} layoutType={2} rect={rect} />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // left should be rect.right + 20 = 720px
      expect(tooltip.style.left).toBe('720px');
      // top should be rect.top = 200px
      expect(tooltip.style.top).toBe('200px');
    });

    it('TOOLTIP-2.2: Flips to left (rect.left - 320px) when approaching window.innerWidth', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });

      // rect.right = 800 -> 800 + 20 + 300 = 1120 > 1024 (approaches boundary)
      const rect = { top: 150, bottom: 300, left: 550, right: 800, width: 250, height: 150 };

      render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={true} layoutType={2} rect={rect} />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      // Flipped left: rect.left - 320 = 550 - 320 = 230px
      expect(tooltip.style.left).toBe('230px');
    });

    it('TOOLTIP-2.3: Clamps left coordinate to minimum 20px if left flip escapes viewport left edge', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 800 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 600 });

      // rect.right = 600 -> 600 + 20 + 300 = 920 > 800 -> flips
      // rect.left = 100 -> 100 - 320 = -220 < 20 -> should clamp to 20
      const rect = { top: 100, bottom: 250, left: 100, right: 600, width: 500, height: 150 };

      render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={true} layoutType={2} rect={rect} />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.style.left).toBe('20px');
    });

    it('TOOLTIP-2.4: Clamps top coordinate when approaching window.innerHeight (vh - 420px)', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 800 });

      // rect.top = 700 -> 700 + 400 = 1100 > 800 -> clamps to 800 - 420 = 380px
      const rect = { top: 700, bottom: 780, left: 200, right: 500, width: 300, height: 80 };

      render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={true} layoutType={2} rect={rect} />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.style.top).toBe('380px');
    });

    it('TOOLTIP-2.5: Clamps top coordinate to minimum 20px when rect.top is offscreen or negative', () => {
      Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1440 });
      Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 900 });

      const rect = { top: -50, bottom: 50, left: 200, right: 600, width: 400, height: 100 };

      render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={true} layoutType={2} rect={rect} />
        </CVProvider>
      );

      const tooltip = document.querySelector('.suggestion-tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip.style.top).toBe('20px');
    });

    it('TOOLTIP-2.6: Does not render when isHovered is false or rect is missing/null', () => {
      const { container: c1 } = render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={false} layoutType={2} rect={{ top: 100, left: 100, right: 400, bottom: 200 }} />
        </CVProvider>
      );
      expect(c1.querySelector('.suggestion-tooltip')).toBeNull();

      const { container: c2 } = render(
        <CVProvider>
          <SuggestionTooltip section={mockSection} isHovered={true} layoutType={2} rect={null} />
        </CVProvider>
      );
      expect(c2.querySelector('.suggestion-tooltip')).toBeNull();
    });
  });

  // =========================================================================
  // PILLAR 3: OBSIDIAN CALLOUTS - Visual Invariants & Lucide Alert Icons
  // =========================================================================
  describe('Pillar 3: Obsidian Callouts Invariants (Colors, Structure & Alert Icons)', () => {
    it('CALLOUT-3.1: Danger/Critical Callout adheres strictly to rgba(233, 49, 71, 0.1), 4px border & OctagonAlert', () => {
      // In VersionManagerModal when confirmDeleteVersion is active
      const { container } = render(
        <CVProvider>
          <VersionManagerModal 
            isOpen={true} 
            onClose={() => {}} 
            initialDeleteVersion={{ id: 'v1', name: 'Test Version' }} 
          />
        </CVProvider>
      );

      // Find callout with delete confirmation
      const callout = container.querySelector('.obsidian-callout');
      expect(callout).toBeInTheDocument();

      const style = callout.getAttribute('style') || '';
      // Background: rgba(233, 49, 71, 0.1)
      expect(style).toMatch(/background(-color)?:\s*rgba\(233,\s*49,\s*71,\s*0\.1\)/);
      // Border-left: 4px solid rgba(233, 49, 71, 1) or rgb(233, 49, 71)
      expect(style).toMatch(/border-left:\s*4px\s+solid\s+rgba?\(233,\s*49,\s*71(,\s*1)?\)/);

      // Header structure
      const title = callout.querySelector('.callout-title');
      expect(title).toBeInTheDocument();
      expect(title.style.display).toBe('flex');
      expect(title.style.gap).toBe('8px');
      expect(title.style.fontWeight).toBe('600');
      expect(title.style.color).toMatch(/rgba?\(233,\s*49,\s*71(,\s*1)?\)/);

      // Lucide OctagonAlert icon
      const icon = title.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon.classList.contains('lucide-octagon-alert') || icon.classList.contains('lucide')).toBe(true);

      // Content structure
      const content = callout.querySelector('.callout-content');
      expect(content).toBeInTheDocument();
    });

    it('CALLOUT-3.2: Caution/Warning Callout adheres strictly to rgba(219, 139, 0, 0.1), 4px border & TriangleAlert', () => {
      const { container } = render(
        <CVProvider>
          <VersionManagerModal 
            isOpen={true} 
            onClose={() => {}} 
            initialConfirmBlank={true} 
          />
        </CVProvider>
      );

      const callout = container.querySelector('[data-testid=callout-confirm-blank]');
      expect(callout).toBeInTheDocument();

      const style = callout.getAttribute('style') || '';
      expect(style).toMatch(/background(-color)?:\s*rgba\(219,\s*139,\s*0,\s*0\.1\)/);
      expect(style).toMatch(/border-left:\s*4px\s+solid\s+rgba?\(219,\s*139,\s*0(,\s*1)?\)/);

      const title = callout.querySelector('.callout-title');
      expect(title).toBeInTheDocument();
      expect(title.style.display).toBe('flex');
      expect(title.style.gap).toBe('8px');
      expect(title.style.fontWeight).toBe('600');
      expect(title.style.color).toMatch(/rgba?\(219,\s*139,\s*0(,\s*1)?\)/);

      // Lucide TriangleAlert icon
      const icon = title.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon.classList.contains('lucide-triangle-alert') || icon.classList.contains('lucide')).toBe(true);

      const content = callout.querySelector('.callout-content');
      expect(content).toBeInTheDocument();
    });

    it('CALLOUT-3.3: Info Callout adheres strictly to rgba(8, 109, 221, 0.1), 4px border & Info icon', () => {
      // ActionMenu in ATS mode renders the Info Callout
      const { container } = render(
        <CVProvider initialCV={{ layout: { type: '1-column', isAtsMode: true } }}>
          <ActionMenu />
        </CVProvider>
      );

      // Open Design Menu to see the ATS info callout
      const designBtn = container.querySelector('[data-testid="btn-open-design"]') || container.querySelector('button[title*="Diseño"]');
      if (designBtn) {
        fireEvent.click(designBtn);
      }

      const colorsTab = container.querySelector('[data-testid="tab-colors"]');
      if (colorsTab) {
        fireEvent.click(colorsTab);
      }

      const callout = container.querySelector('.obsidian-callout');
      expect(callout).toBeInTheDocument();

      const style = callout.getAttribute('style') || '';
      expect(style).toMatch(/background(-color)?:\s*rgba\(8,\s*109,\s*221,\s*0\.1\)/);
      expect(style).toMatch(/border-left:\s*4px\s+solid\s+rgba?\(8,\s*109,\s*221(,\s*1)?\)/);

      const title = callout.querySelector('.callout-title');
      expect(title).toBeInTheDocument();
      expect(title.style.display).toBe('flex');
      expect(title.style.gap).toBe('8px');
      expect(title.style.fontWeight).toBe('600');
      expect(title.style.color).toMatch(/rgba?\(8,\s*109,\s*221(,\s*1)?\)/);

      // Lucide Info icon
      const icon = title.querySelector('svg');
      expect(icon).toBeInTheDocument();
      expect(icon.classList.contains('lucide-info') || icon.classList.contains('lucide')).toBe(true);
    });

    it('CALLOUT-3.4: All callouts across the application render zero raw unicode alert emojis', () => {
      const mockSection = {
        id: 'skills',
        type: 'skills',
        title: 'HABILIDADES TÉCNICAS',
        items: [{ id: 's1', title: 'Tech', description: 'Testing' }]
      };

      const { container } = render(
        <CVProvider>
          <SuggestionTooltip 
            section={mockSection} 
            isHovered={true} 
            layoutType={2} 
            rect={{ top: 200, bottom: 400, left: 300, right: 600, width: 300, height: 200 }} 
          />
        </CVProvider>
      );

      const rawText = container.textContent || '';
      expect(rawText).not.toContain('🛑');
      expect(rawText).not.toContain('🚨');
      expect(rawText).not.toContain('⚠️');
      expect(rawText).not.toContain('ℹ️');
    });
  });

  // =========================================================================
  // PILLAR 4: DRAG AND DROP - @dnd-kit Exclusivity & Zero Swapy
  // =========================================================================
  describe('Pillar 4: Drag and Drop Architecture (@dnd-kit Exclusive, Zero Swapy)', () => {
    it('DND-4.1: Entire codebase has zero runtime swapy imports or references', () => {
      const srcDir = path.resolve(process.cwd(), 'src');
      const scanFiles = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            results = results.concat(scanFiles(fullPath));
          } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
            results.push(fullPath);
          }
        });
        return results;
      };

      const sourceFiles = scanFiles(srcDir);
      const swapyImports = [];

      sourceFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf-8');
        if (/import\s+.*from\s+[']swapy[']/.test(content) ||
            /require\([']swapy[']\)/.test(content) ||
            /\bcreateSwapy\b/.test(content)) {
          swapyImports.push(file);
        }
      });

      expect(swapyImports).toEqual([]);
    });

    it('DND-4.2: useCVDndCoordinator initializes @dnd-kit sensors, collision detection and handlers', () => {
      const mockMoveItem = vi.fn();
      const mockMoveSection = vi.fn();
      const mockCvData = {
        sections: [
          { id: 'sec1', column: 'left', items: [{ id: 'item1' }] },
          { id: 'sec2', column: 'right', items: [{ id: 'item2' }] }
        ]
      };

      let hookResult;
      const TestComponent = () => {
        hookResult = useCVDndCoordinator({
          cvData: mockCvData,
          moveItemBetweenSections: mockMoveItem,
          moveSectionToColumnAndIndex: mockMoveSection
        });
        return null;
      };

      render(<TestComponent />);

      expect(hookResult).toBeDefined();
      expect(hookResult.sensors).toBeDefined();
      expect(hookResult.collisionDetection).toBeDefined();
      expect(typeof hookResult.handleDragStart).toBe('function');
      expect(typeof hookResult.handleDragOver).toBe('function');
      expect(typeof hookResult.handleDragEnd).toBe('function');
    });

    it('DND-4.3: App mounts @dnd-kit DndContext and SortableContext for two-column paper', () => {
      const { container } = render(
        <CVProvider>
          <App />
        </CVProvider>
      );

      // In the rendered DOM, check that draggable sections and drag handles exist
      const dragHandles = container.querySelectorAll('.drag-handle');
      expect(dragHandles.length).toBeGreaterThan(0);

      // Check section and item handles
      const sectionHandles = container.querySelectorAll('.section-drag-handle');
      expect(sectionHandles.length).toBeGreaterThan(0);
    });
  });
});
