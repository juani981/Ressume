import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  A4_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  A4_WIDTH_CSS,
  A4_HEIGHT_CSS,
  A4_GEOMETRY,
  EDITOR_PAGE_WIDTH_CSS,
  EDITOR_PAGE_HEIGHT_CSS,
} from '../constants/geometry';
import {
  DEFAULT_PAGE_PADDING_PX,
  DEFAULT_SECTION_GAP_PX,
  DEFAULT_ITEM_GAP_PX,
  SPACING_TOKENS,
} from '../constants/spacing';
import { registerSectionType, getSectionDescriptor } from '../registry/sectionRegistry';
import { estimateItemHeight } from '../utils/pageDistributor';
import * as printServices from '../services/print';

describe('Architecture & SOLID Invariants Automated Guard', () => {
  describe('SSOT Constants & Geometry Parity', () => {
    it('defines unchangeable A4 physical dimensions according to Rule 15 of AGENTS.md', () => {
      expect(A4_WIDTH_MM).toBe(210);
      expect(A4_HEIGHT_MM).toBe(297);
      expect(A4_WIDTH_PX).toBe(794);
      expect(A4_PAGE_HEIGHT_PX).toBe(1123);
      expect(A4_WIDTH_CSS).toBe('210mm');
      expect(A4_HEIGHT_CSS).toBe('297mm');

      expect(A4_GEOMETRY.widthMm).toBe(210);
      expect(A4_GEOMETRY.heightMm).toBe(297);
      expect(A4_GEOMETRY.widthPx).toBe(794);
      expect(A4_GEOMETRY.heightPx).toBe(1123);
      expect(A4_GEOMETRY.widthCss).toBe('210mm');
      expect(A4_GEOMETRY.heightCss).toBe('297mm');
    });

    it('defines page padding and spacing strictly in single source of truth', () => {
      expect(DEFAULT_PAGE_PADDING_PX).toBe(24);
      expect(DEFAULT_SECTION_GAP_PX).toBe(12);
      expect(DEFAULT_ITEM_GAP_PX).toBe(6);
      expect(SPACING_TOKENS.pagePaddingPx).toBe(24);
      expect(EDITOR_PAGE_WIDTH_CSS).toBe('210mm');
      expect(EDITOR_PAGE_HEIGHT_CSS).toBe('297mm');
    });

    it('ensures src/styles/tokens.css is synchronized with SSOT geometry', () => {
      const tokensCssPath = path.resolve(__dirname, '../styles/tokens.css');
      expect(fs.existsSync(tokensCssPath)).toBe(true);
      const content = fs.readFileSync(tokensCssPath, 'utf8');

      expect(content).toContain('--a4-page-width: 210mm;');
      expect(content).toContain('--a4-page-height: 297mm;');
      expect(content).toContain('--page-padding: 24px;');
    });

    it('ensures legacy utilities re-export canonical geometry without drifting', async () => {
      const legacyGeometry = await import('../utils/pageGeometry');
      expect(legacyGeometry.A4_PAGE_HEIGHT_PX).toBe(A4_PAGE_HEIGHT_PX);
      expect(legacyGeometry.A4_WIDTH_PX).toBe(A4_WIDTH_PX);
      expect(legacyGeometry.DEFAULT_PAGE_PADDING).toBe(DEFAULT_PAGE_PADDING_PX);
    });
  });

  describe('Print & Pagination Forbidden Zones (Rule 7 & FRACASO_SALTOS_DE_PAGINA.md)', () => {
    it('strictly forbids break-before: page or break-before: always on repeated item selectors', () => {
      const srcDir = path.resolve(__dirname, '..');
      const cssFiles = [];

      function collectCss(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist') {
              collectCss(fullPath);
            }
          } else if (file.endsWith('.css')) {
            cssFiles.push(fullPath);
          }
        }
      }

      collectCss(srcDir);

      const forbiddenSelectors = [
        /\.cv-block[^{]*\{[^}]*break-before:\s*(page|always)/i,
        /\.experience__content[^{]*\{[^}]*break-before:\s*(page|always)/i,
        /\.education__content[^{]*\{[^}]*break-before:\s*(page|always)/i,
        /\.bullet-point[^{]*\{[^}]*break-before:\s*(page|always)/i,
        /li[^{]*\{[^}]*break-before:\s*(page|always)/i,
      ];

      for (const cssPath of cssFiles) {
        const content = fs.readFileSync(cssPath, 'utf8');
        for (const pattern of forbiddenSelectors) {
          expect(pattern.test(content)).toBe(false);
        }
      }
    });

    it('ensures staticHtmlPdfEngine is a thin facade over src/services/print', () => {
      const enginePath = path.resolve(__dirname, '../utils/staticHtmlPdfEngine.js');
      const content = fs.readFileSync(enginePath, 'utf8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);

      // Must be a concise facade under 25 lines of active code
      expect(lines.length).toBeLessThanOrEqual(25);
      expect(content).toContain("from '../services/print/index'");
    });

    it('exports all expected print lifecycle methods from src/services/print', () => {
      expect(typeof printServices.getDynamicPdfTitle).toBe('function');
      expect(typeof printServices.sanitizeFileName).toBe('function');
      expect(typeof printServices.generateCleanPrintHTML).toBe('function');
      expect(typeof printServices.createSanitizedPrintClone).toBe('function');
      expect(typeof printServices.executeCleanPrint).toBe('function');
      expect(typeof printServices.downloadPDF).toBe('function');
    });
  });

  describe('Compound Components & Decomposition Guards', () => {
    it('ensures ActionMenu.jsx delegates to modular ActionMenu compound root', () => {
      const actionMenuPath = path.resolve(__dirname, '../components/Editor/ActionMenu.jsx');
      const content = fs.readFileSync(actionMenuPath, 'utf8');
      const lines = content.split('\n').filter((l) => l.trim().length > 0);

      // Facade must be lightweight (less than 60 lines)
      expect(lines.length).toBeLessThan(60);
      expect(content).toContain("from './ActionMenu/index'");
    });

    it('ensures DesignPanel and ActionMenuRoot are cleanly decoupled', () => {
      const designPanelPath = path.resolve(__dirname, '../components/Editor/ActionMenu/DesignPanel.jsx');
      const actionMenuRootPath = path.resolve(__dirname, '../components/Editor/ActionMenu/ActionMenuRoot.jsx');

      expect(fs.existsSync(designPanelPath)).toBe(true);
      expect(fs.existsSync(actionMenuRootPath)).toBe(true);

      const rootContent = fs.readFileSync(actionMenuRootPath, 'utf8');
      expect(rootContent).toContain('DesignPanel');
    });
  });

  describe('OCP Registry Extensibility (Open-Closed Principle)', () => {
    it('allows registered components to provide custom estimateItemHeight dynamically', () => {
      const customKey = 'architecture_test_ocp';
      registerSectionType({
        type: customKey,
        label: 'Arch Test OCP',
        estimateItemHeight: (item) => 125,
      });

      const descriptor = getSectionDescriptor(customKey);
      expect(descriptor).toBeDefined();
      expect(descriptor.type).toBe(customKey);

      const height = estimateItemHeight({}, customKey);
      expect(height).toBe(125);
    });
  });
});
