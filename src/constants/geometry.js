/**
 * geometry.js
 * 
 * Canonical Single Source of Truth (SSOT) for all physical document dimensions,
 * A4 millimeter/pixel conversions, and editor container sizing.
 * Invariants 15 and 16 of AGENTS.md.
 */

import { DEFAULT_PAGE_PADDING } from './spacing.js';

// 1. Standard ISO 216 A4 Print Dimensions (Strictly 210mm x 297mm)
export const A4_WIDTH_MM = 210;
export const A4_HEIGHT_MM = 297;
export const A4_WIDTH_CSS = '210mm';
export const A4_HEIGHT_CSS = '297mm';

// 96 DPI CSS Pixel conversions (1 inch = 25.4mm, 96px / 25.4mm)
export const A4_EXACT_WIDTH_PX = (210 * 96) / 25.4; // ~793.70px
export const A4_EXACT_HEIGHT_PX = (297 * 96) / 25.4; // ~1122.52px

export const A4_WIDTH_PX = 794;
export const A4_PAGE_HEIGHT_PX = 1123;
export const A4_GAP_PX = 20;
export const A4_DOCUMENT_SCALE = 1.0;

// Aliases for print-specific notation
export const A4_PRINT_WIDTH_MM = A4_WIDTH_MM;
export const A4_PRINT_HEIGHT_MM = A4_HEIGHT_MM;
export const A4_PRINT_WIDTH_CSS = A4_WIDTH_CSS;
export const A4_PRINT_HEIGHT_CSS = A4_HEIGHT_CSS;
export const A4_PRINT_EXACT_WIDTH_PX = A4_EXACT_WIDTH_PX;
export const A4_PRINT_EXACT_HEIGHT_PX = A4_EXACT_HEIGHT_PX;
export const A4_PRINT_WIDTH_PX = A4_WIDTH_PX;
export const A4_PRINT_PAGE_HEIGHT_PX = A4_PAGE_HEIGHT_PX;

// 2. Editor Container Dimensions (Mathematical Parity)
export const EDITOR_HEIGHT_REDUCTION_MM = 0;
export const EDITOR_PAGE_WIDTH_MM = A4_WIDTH_MM;
export const EDITOR_PAGE_HEIGHT_MM = A4_HEIGHT_MM - EDITOR_HEIGHT_REDUCTION_MM;
export const EDITOR_PAGE_WIDTH_CSS = `${EDITOR_PAGE_WIDTH_MM}mm`;
export const EDITOR_PAGE_HEIGHT_CSS = `${EDITOR_PAGE_HEIGHT_MM}mm`;
export const EDITOR_PAGE_WIDTH_PX = A4_WIDTH_PX;
export const EDITOR_PAGE_HEIGHT_PX = Math.round((EDITOR_PAGE_HEIGHT_MM * 96) / 25.4);
export const EDITOR_EXACT_HEIGHT_PX = (EDITOR_PAGE_HEIGHT_MM * 96) / 25.4;

// 3. Frozen Canonical Page Specification Objects
export const PRINT_PAGE_SIZE = Object.freeze({
  widthMm: A4_PRINT_WIDTH_MM,
  heightMm: A4_PRINT_HEIGHT_MM,
  widthCss: A4_PRINT_WIDTH_CSS,
  heightCss: A4_PRINT_HEIGHT_CSS,
  exactWidthPx: A4_PRINT_EXACT_WIDTH_PX,
  exactHeightPx: A4_PRINT_EXACT_HEIGHT_PX,
  widthPx: A4_PRINT_WIDTH_PX,
  heightPx: A4_PRINT_PAGE_HEIGHT_PX,
  gapPx: A4_GAP_PX,
  paddingPx: DEFAULT_PAGE_PADDING,
  scale: A4_DOCUMENT_SCALE,
  cssVariables: Object.freeze({
    '--a4-page-width': A4_PRINT_WIDTH_CSS,
    '--a4-page-height': A4_PRINT_HEIGHT_CSS,
    '--a4-page-width-px': `${A4_PRINT_WIDTH_PX}px`,
    '--a4-page-height-px': `${A4_PRINT_PAGE_HEIGHT_PX}px`,
    '--a4-page-gap': `${A4_GAP_PX}px`,
    '--a4-page-scale': `${A4_DOCUMENT_SCALE}`,
  }),
});

export const EDITOR_PAGE_SIZE = Object.freeze({
  widthMm: EDITOR_PAGE_WIDTH_MM,
  heightMm: EDITOR_PAGE_HEIGHT_MM,
  widthCss: EDITOR_PAGE_WIDTH_CSS,
  heightCss: EDITOR_PAGE_HEIGHT_CSS,
  exactWidthPx: A4_PRINT_EXACT_WIDTH_PX,
  exactHeightPx: EDITOR_EXACT_HEIGHT_PX,
  widthPx: EDITOR_PAGE_WIDTH_PX,
  heightPx: EDITOR_PAGE_HEIGHT_PX,
  gapPx: A4_GAP_PX,
  paddingPx: DEFAULT_PAGE_PADDING,
  scale: A4_DOCUMENT_SCALE,
  heightReductionMm: EDITOR_HEIGHT_REDUCTION_MM,
  cssVariables: Object.freeze({
    '--editor-page-width': EDITOR_PAGE_WIDTH_CSS,
    '--editor-page-height': EDITOR_PAGE_HEIGHT_CSS,
    '--editor-page-width-px': `${EDITOR_PAGE_WIDTH_PX}px`,
    '--editor-page-height-px': `${EDITOR_PAGE_HEIGHT_PX}px`,
    '--editor-height-reduction-mm': `${EDITOR_HEIGHT_REDUCTION_MM}mm`,
    '--a4-page-width': A4_PRINT_WIDTH_CSS,
    '--a4-page-height': A4_PRINT_HEIGHT_CSS,
    '--a4-page-width-px': `${A4_PRINT_WIDTH_PX}px`,
    '--a4-page-height-px': `${A4_PRINT_PAGE_HEIGHT_PX}px`,
    '--a4-page-gap': `${A4_GAP_PX}px`,
    '--a4-page-scale': `${A4_DOCUMENT_SCALE}`,
  }),
});

// A4_PAGE_SIZE alias of PRINT_PAGE_SIZE
export const A4_PAGE_SIZE = PRINT_PAGE_SIZE;

// 4. Frozen Canonical Page Geometry Object
export const A4_GEOMETRY = Object.freeze({
  widthMm: A4_WIDTH_MM,
  heightMm: A4_HEIGHT_MM,
  widthCss: A4_WIDTH_CSS,
  heightCss: A4_HEIGHT_CSS,
  exactWidthPx: A4_EXACT_WIDTH_PX,
  exactHeightPx: A4_EXACT_HEIGHT_PX,
  widthPx: A4_WIDTH_PX,
  heightPx: A4_PAGE_HEIGHT_PX,
  gapPx: A4_GAP_PX,
  scale: A4_DOCUMENT_SCALE,
  cssVariables: PRINT_PAGE_SIZE.cssVariables,
  editor: Object.freeze({
    widthMm: EDITOR_PAGE_WIDTH_MM,
    heightMm: EDITOR_PAGE_HEIGHT_MM,
    widthCss: EDITOR_PAGE_WIDTH_CSS,
    heightCss: EDITOR_PAGE_HEIGHT_CSS,
    widthPx: EDITOR_PAGE_WIDTH_PX,
    heightPx: EDITOR_PAGE_HEIGHT_PX,
    cssVariables: EDITOR_PAGE_SIZE.cssVariables,
  }),
});
