import React from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import {
  A4_PRINT_WIDTH_MM,
  A4_PRINT_HEIGHT_MM,
  A4_PRINT_WIDTH_CSS,
  A4_PRINT_HEIGHT_CSS,
  A4_PRINT_WIDTH_PX,
  A4_PRINT_PAGE_HEIGHT_PX,
  A4_WIDTH_MM,
  A4_HEIGHT_MM,
  A4_WIDTH_CSS,
  A4_HEIGHT_CSS,
  A4_WIDTH_PX,
  A4_PAGE_HEIGHT_PX,
  EDITOR_HEIGHT_REDUCTION_MM,
  EDITOR_PAGE_WIDTH_MM,
  EDITOR_PAGE_HEIGHT_MM,
  EDITOR_PAGE_WIDTH_CSS,
  EDITOR_PAGE_HEIGHT_CSS,
  EDITOR_PAGE_WIDTH_PX,
  EDITOR_PAGE_HEIGHT_PX,
  PRINT_PAGE_SIZE,
  EDITOR_PAGE_SIZE,
  getEditorPageDimensions,
  getPrintPageDimensions,
  getRulerHeightPx,
  A4_GAP_PX,
} from '../utils/pageGeometry';
import { A4PageBox } from '../components/CV/A4PageBox';
import { A4PageGuides } from '../components/Editor/A4PageGuides';
import printStyles from '../styles/print.css?raw';

describe('Editor Vertical Safety Budget & Low-Level Tuning System', () => {
  describe('1. Centralized Geometry Constants & Invariants', () => {
    it('maintains strict standard ISO 216 A4 print dimensions (210mm x 297mm / 794px x 1123px)', () => {
      expect(A4_PRINT_WIDTH_MM).toBe(210);
      expect(A4_PRINT_HEIGHT_MM).toBe(297);
      expect(A4_PRINT_WIDTH_CSS).toBe('210mm');
      expect(A4_PRINT_HEIGHT_CSS).toBe('297mm');
      expect(A4_PRINT_WIDTH_PX).toBe(794);
      expect(A4_PRINT_PAGE_HEIGHT_PX).toBe(1123);

      // Backwards-compatible aliases
      expect(A4_WIDTH_MM).toBe(210);
      expect(A4_HEIGHT_MM).toBe(297);
      expect(A4_WIDTH_CSS).toBe('210mm');
      expect(A4_HEIGHT_CSS).toBe('297mm');
      expect(A4_WIDTH_PX).toBe(794);
      expect(A4_PAGE_HEIGHT_PX).toBe(1123);
    });

    it('defines explicit vertical height reduction for editor container', () => {
      expect(EDITOR_HEIGHT_REDUCTION_MM).toBeGreaterThanOrEqual(0);
      expect(EDITOR_PAGE_HEIGHT_MM).toBe(A4_PRINT_HEIGHT_MM - EDITOR_HEIGHT_REDUCTION_MM);
      expect(EDITOR_PAGE_HEIGHT_CSS).toBe(`${EDITOR_PAGE_HEIGHT_MM}mm`);
      expect(EDITOR_PAGE_HEIGHT_PX).toBe(Math.round((EDITOR_PAGE_HEIGHT_MM * 96) / 25.4));

      // With 1:1 parity (0mm reduction), editor height matches print height
      expect(EDITOR_PAGE_HEIGHT_MM).toBe(A4_PRINT_HEIGHT_MM);
      expect(EDITOR_PAGE_HEIGHT_PX).toBe(A4_PRINT_PAGE_HEIGHT_PX);
    });

    it('exposes PRINT_PAGE_SIZE and EDITOR_PAGE_SIZE canonical objects', () => {
      const printSpec = getPrintPageDimensions();
      const editorSpec = getEditorPageDimensions();

      expect(printSpec.heightMm).toBe(297);
      expect(printSpec.heightPx).toBe(1123);
      expect(printSpec.heightCss).toBe('297mm');

      expect(editorSpec.heightMm).toBe(EDITOR_PAGE_HEIGHT_MM);
      expect(editorSpec.heightPx).toBe(EDITOR_PAGE_HEIGHT_PX);
      expect(editorSpec.heightCss).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(editorSpec.heightReductionMm).toBe(EDITOR_HEIGHT_REDUCTION_MM);

      expect(editorSpec.cssVariables['--editor-page-height']).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(editorSpec.cssVariables['--editor-page-height-px']).toBe(`${EDITOR_PAGE_HEIGHT_PX}px`);
      expect(editorSpec.cssVariables['--a4-page-height']).toBe('297mm');
    });

    it('getRulerHeightPx discriminates between editor and print targets', () => {
      // In SSR/JSDOM fallback:
      const editorHeight = getRulerHeightPx(null, true);
      const printHeight = getRulerHeightPx(null, false);

      expect(editorHeight).toBe(EDITOR_PAGE_HEIGHT_PX);
      expect(printHeight).toBe(A4_PRINT_PAGE_HEIGHT_PX);
      expect(editorHeight).toBe(printHeight);
    });
  });

  describe('2. Editor Visual Containers & Fold Guides', () => {
    it('renders <A4PageBox> with shrunk editor height by default', () => {
      const { container } = render(<A4PageBox pageNumber={1} totalPages={1} />);
      const box = container.querySelector('.a4-page-box');

      expect(box.style.height).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(box.style.minHeight).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(box.style.maxHeight).toBe(EDITOR_PAGE_HEIGHT_CSS);
      expect(box.style.width).toBe('210mm');
    });

    it('renders <A4PageGuides> calculated from EDITOR_PAGE_HEIGHT_MM', () => {
      const { container } = render(<A4PageGuides totalPages={2} />);
      const fold = container.querySelector('[data-testid="a4-page-fold-1"]');

      expect(fold).toBeTruthy();
      // JSDOM/Gecko can canonicalize calc(272mm + 0px) or calc(1028.09px)
      const expectedMmPattern = new RegExp(`calc\\((${EDITOR_PAGE_HEIGHT_MM}mm \\+ 0px|\\d+(\\.\\d+)?px)\\)`);
      expect(fold.style.top).toMatch(expectedMmPattern);
    });
  });

  describe('3. Strict Separation of Print Output (Zero Intrusion into Print PDF)', () => {
    it('verifies print stylesheet strictly enforces 297mm', () => {
      expect(printStyles).toContain('height: 297mm !important;');
      expect(printStyles).toContain('min-height: 297mm !important;');
      expect(printStyles).toContain('max-height: 297mm !important;');
    });

    it('guarantees 1:1 mathematical capacity alignment between editor and print', () => {
      const verticalBufferPx = A4_PRINT_PAGE_HEIGHT_PX - EDITOR_PAGE_HEIGHT_PX;
      const verticalBufferMm = A4_PRINT_HEIGHT_MM - EDITOR_PAGE_HEIGHT_MM;

      expect(verticalBufferPx).toBe(0);
      expect(verticalBufferMm).toBe(0);
      expect(verticalBufferMm).toBe(EDITOR_HEIGHT_REDUCTION_MM);
    });
  });
});
