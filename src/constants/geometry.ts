/**
 * geometry.ts
 *
 * Canonical Single Source of Truth (SSOT) for all physical document dimensions,
 * A4 millimeter/pixel conversions, and editor container sizing.
 * Invariants 15 and 16 of AGENTS.md.
 * Values unchanged from geometry.js — types only.
 */

import { DEFAULT_PAGE_PADDING } from './spacing.js';

// 1. Standard ISO 216 A4 Print Dimensions (Strictly 210mm x 297mm)
export const A4_WIDTH_MM: number = 210;
export const A4_HEIGHT_MM: number = 297;
export const A4_WIDTH_CSS: string = '210mm';
export const A4_HEIGHT_CSS: string = '297mm';

// 96 DPI CSS Pixel conversions (1 inch = 25.4mm, 96px / 25.4mm)
export const A4_EXACT_WIDTH_PX: number = (210 * 96) / 25.4; // ~793.70px
export const A4_EXACT_HEIGHT_PX: number = (297 * 96) / 25.4; // ~1122.52px

export const A4_WIDTH_PX: number = 794;
export const A4_PAGE_HEIGHT_PX: number = 1123;
export const A4_GAP_PX: number = 20;
export const A4_DOCUMENT_SCALE: number = 1.0;

// Aliases for print-specific notation
export const A4_PRINT_WIDTH_MM: number = A4_WIDTH_MM;
export const A4_PRINT_HEIGHT_MM: number = A4_HEIGHT_MM;
export const A4_PRINT_WIDTH_CSS: string = A4_WIDTH_CSS;
export const A4_PRINT_HEIGHT_CSS: string = A4_HEIGHT_CSS;
export const A4_PRINT_EXACT_WIDTH_PX: number = A4_EXACT_WIDTH_PX;
export const A4_PRINT_EXACT_HEIGHT_PX: number = A4_EXACT_HEIGHT_PX;
export const A4_PRINT_WIDTH_PX: number = A4_WIDTH_PX;
export const A4_PRINT_PAGE_HEIGHT_PX: number = A4_PAGE_HEIGHT_PX;

// 2. Editor Container Dimensions (Mathematical Parity)
export const EDITOR_HEIGHT_REDUCTION_MM: number = 0;
export const EDITOR_PAGE_WIDTH_MM: number = A4_WIDTH_MM;
export const EDITOR_PAGE_HEIGHT_MM: number = A4_HEIGHT_MM - EDITOR_HEIGHT_REDUCTION_MM;
export const EDITOR_PAGE_WIDTH_CSS: string = `${EDITOR_PAGE_WIDTH_MM}mm`;
export const EDITOR_PAGE_HEIGHT_CSS: string = `${EDITOR_PAGE_HEIGHT_MM}mm`;
export const EDITOR_PAGE_WIDTH_PX: number = A4_WIDTH_PX;
export const EDITOR_PAGE_HEIGHT_PX: number = Math.round((EDITOR_PAGE_HEIGHT_MM * 96) / 25.4);
export const EDITOR_EXACT_HEIGHT_PX: number = (EDITOR_PAGE_HEIGHT_MM * 96) / 25.4;

export interface PageSizeSpec {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly widthCss: string;
  readonly heightCss: string;
  readonly exactWidthPx: number;
  readonly exactHeightPx: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly gapPx: number;
  readonly paddingPx: number;
  readonly scale: number;
  readonly heightReductionMm?: number;
  readonly cssVariables: Readonly<Record<string, string>>;
}

// 3. Frozen Canonical Page Specification Objects
export const PRINT_PAGE_SIZE: PageSizeSpec = Object.freeze({
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

export const EDITOR_PAGE_SIZE: PageSizeSpec = Object.freeze({
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

// A4_PAGE_SIZE alias of PRINT_PAGE_SIZE (retained for backward compatibility)
export const A4_PAGE_SIZE: PageSizeSpec = PRINT_PAGE_SIZE;

// 4. Multi-Column Layout Proportions & Limits (SSOT)
export const DEFAULT_LEFT_COLUMN_WIDTH_PERCENT: number = 33.33;
export const DEFAULT_RIGHT_COLUMN_WIDTH_PERCENT: number = 66.67;
export const DEFAULT_GRID_TEMPLATE_COLUMNS: string = '1fr 2fr';
export const EDITOR_PAGE_GAP_PX: number = 32;

export interface ColumnResizerLimits {
  readonly minPercent: number;
  readonly maxPercent: number;
  readonly defaultPercent: number;
}

export const COLUMN_RESIZER_LIMITS: ColumnResizerLimits = Object.freeze({
  minPercent: 20,
  maxPercent: 55,
  defaultPercent: DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
});

/**
 * Formats CSS grid-template-columns string given left column width percentage.
 */
export function formatGridTemplateColumns(
  leftPercent: number | string = DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
): string {
  if (!leftPercent) return DEFAULT_GRID_TEMPLATE_COLUMNS;
  const left = Number(leftPercent) || DEFAULT_LEFT_COLUMN_WIDTH_PERCENT;
  return `${left}% ${+(100 - left).toFixed(2)}%`;
}

/**
 * Canonical layout styling for multi-column resume containers (SSOT).
 * Shared across editor A4PageBox and DroppableColumn wrappers.
 */
export const BASE_COLUMN_STYLE: Readonly<Record<string, string>> = Object.freeze({
  height: '100%',
  minHeight: '100%',
  alignSelf: 'stretch',
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '0',
  maxWidth: '100%',
  overflowWrap: 'break-word',
  wordBreak: 'break-word',
});

export interface A4Geometry {
  readonly widthMm: number;
  readonly heightMm: number;
  readonly widthCss: string;
  readonly heightCss: string;
  readonly exactWidthPx: number;
  readonly exactHeightPx: number;
  readonly widthPx: number;
  readonly heightPx: number;
  readonly gapPx: number;
  readonly scale: number;
  readonly cssVariables: Readonly<Record<string, string>>;
  readonly editor: {
    readonly widthMm: number;
    readonly heightMm: number;
    readonly widthCss: string;
    readonly heightCss: string;
    readonly widthPx: number;
    readonly heightPx: number;
    readonly cssVariables: Readonly<Record<string, string>>;
  };
}

// 5. Frozen Canonical Page Geometry Object
export const A4_GEOMETRY: A4Geometry = Object.freeze({
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
