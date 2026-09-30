/**
 * geometry.js
 * 
 * Canonical Single Source of Truth (SSOT) for all physical document dimensions,
 * A4 millimeter/pixel conversions, and editor container sizing.
 * Invariants 15 and 16 of AGENTS.md.
 */

import { DEFAULT_PAGE_PADDING } from './spacing.js';

// ---------------------------------------------------------------------------
// 1. Unified Page Geometry Factory & Format Registry (SSOT)
// ---------------------------------------------------------------------------
export const CSS_DPI = 96;
export const MM_PER_INCH = 25.4;

/**
 * Creates a complete, mathematically unified page geometry specification.
 * Automatically computes exact subpixel values, rounded integer pixels for layout,
 * CSS millimeter strings, and CSS custom property dictionaries.
 *
 * @param {Object} params
 * @param {number} params.widthMm - Physical width in millimeters
 * @param {number} params.heightMm - Physical height in millimeters
 * @param {number} [params.dpi=96] - Screen CSS DPI standard
 * @param {number} [params.gapPx=20] - Separation gap between discrete pages in editor
 * @param {number} [params.paddingPx=24] - Default page margin/padding
 * @param {number} [params.scale=1.0] - Document scale
 * @returns {Readonly<Object>}
 */
export function createPageGeometry({
  widthMm,
  heightMm,
  dpi = CSS_DPI,
  gapPx = 20,
  paddingPx = DEFAULT_PAGE_PADDING,
  scale = 1.0,
}) {
  const widthCss = `${widthMm}mm`;
  const heightCss = `${heightMm}mm`;
  const exactWidthPx = (widthMm * dpi) / MM_PER_INCH;
  const exactHeightPx = (heightMm * dpi) / MM_PER_INCH;
  const widthPx = Math.round(exactWidthPx);
  const heightPx = Math.round(exactHeightPx);

  const cssVariables = Object.freeze({
    '--a4-page-width': widthCss,
    '--a4-page-height': heightCss,
    '--a4-page-width-px': `${widthPx}px`,
    '--a4-page-height-px': `${heightPx}px`,
    '--a4-page-gap': `${gapPx}px`,
    '--a4-page-scale': `${scale}`,
  });

  return Object.freeze({
    widthMm,
    heightMm,
    widthCss,
    heightCss,
    exactWidthPx,
    exactHeightPx,
    widthPx,
    heightPx,
    gapPx,
    paddingPx,
    scale,
    cssVariables,
  });
}

/** Standard Paper Format Specifications */
export const PAGE_FORMATS = Object.freeze({
  A4: createPageGeometry({ widthMm: 210, heightMm: 297 }),
  LETTER: createPageGeometry({ widthMm: 215.9, heightMm: 279.4 }),
  LEGAL: createPageGeometry({ widthMm: 215.9, heightMm: 355.6 }),
});

// Canonical A4 Specification Instance
const CANONICAL_A4 = PAGE_FORMATS.A4;

// 1. Standard ISO 216 A4 Print Dimensions (Strictly 210mm x 297mm)
export const A4_WIDTH_MM = CANONICAL_A4.widthMm;
export const A4_HEIGHT_MM = CANONICAL_A4.heightMm;
export const A4_WIDTH_CSS = CANONICAL_A4.widthCss;
export const A4_HEIGHT_CSS = CANONICAL_A4.heightCss;

// 96 DPI CSS Pixel conversions (1 inch = 25.4mm, 96px / 25.4mm)
export const A4_EXACT_WIDTH_PX = CANONICAL_A4.exactWidthPx; // ~793.70px
export const A4_EXACT_HEIGHT_PX = CANONICAL_A4.exactHeightPx; // ~1122.52px

export const A4_WIDTH_PX = CANONICAL_A4.widthPx; // 794
export const A4_PAGE_HEIGHT_PX = CANONICAL_A4.heightPx; // 1123
export const A4_GAP_PX = CANONICAL_A4.gapPx; // 20
export const A4_DOCUMENT_SCALE = CANONICAL_A4.scale; // 1.0

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
