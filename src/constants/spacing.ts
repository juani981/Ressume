/**
 * spacing.ts
 *
 * Canonical Single Source of Truth (SSOT) for page padding, section gaps,
 * item gaps, and line height defaults across the CV editor and print engine.
 * Invariant 19 of AGENTS.md.
 */

export const DEFAULT_PAGE_PADDING_PX: number = 24;
export const DEFAULT_SECTION_GAP_PX: number = 12;
export const DEFAULT_ITEM_GAP_PX: number = 6;
export const DEFAULT_LINE_HEIGHT: number = 1.30;

/**
 * Margen de seguridad fijo (en px) en la parte inferior de la página A4.
 * Cualquier contenido que alcance o supere (bottomPadding + PAGE_BOTTOM_CLEARANCE_PX)
 * dispara el salto preventivo a la página siguiente.
 * Modificá este valor para calibrar el margen de seguridad a mano.
 */
export const PAGE_BOTTOM_CLEARANCE_PX: number = 12;
export const DEFAULT_HEADER_MARGIN_BOTTOM_RATIO: number = 1.5;
export const DEFAULT_DATA_GAP_PX: number = 6;
export const DEFAULT_TERMINAL_SAFETY_TOLERANCE_RATIO: number = 0.1;
export const DEFAULT_TERMINAL_TOLERANCE_PX: number = Math.round((DEFAULT_PAGE_PADDING_PX + PAGE_BOTTOM_CLEARANCE_PX) * DEFAULT_TERMINAL_SAFETY_TOLERANCE_RATIO);


// Physical layout thresholds & fallback dimensions
export const MIN_PAGE_CAPACITY_PX: number = 100;
export const ATS_HEADER_BORDER_PADDING_PX: number = 6;
export const FALLBACK_ITEM_HEIGHT_PX: number = 28;
export const DEFAULT_PHOTO_SIZE_PX: number = 120;
export const DEFAULT_PHOTO_HEADER_SIZE_PX: number = 70;
export const DEFAULT_SPACER_HEIGHT_PX: number = 24;

// Aliases for backward compatibility
export const DEFAULT_PAGE_PADDING: number = DEFAULT_PAGE_PADDING_PX;
export const DEFAULT_SECTION_GAP: number = DEFAULT_SECTION_GAP_PX;
export const DEFAULT_ITEM_GAP: number = DEFAULT_ITEM_GAP_PX;

export interface SpacingTokens {
  readonly pagePaddingPx: number;
  readonly sectionGapPx: number;
  readonly itemGapPx: number;
  readonly lineHeight: number;
  readonly pageBottomClearancePx: number;
  readonly terminalSafetyToleranceRatio: number;
  readonly defaultTerminalTolerancePx: number;
  readonly headerMarginBottomRatio: number;
  readonly dataGapPx: number;
  readonly minPageCapacityPx: number;
  readonly atsHeaderBorderPaddingPx: number;
  readonly fallbackItemHeightPx: number;
  readonly defaultPhotoSizePx: number;
  readonly defaultPhotoHeaderSizePx: number;
  readonly defaultSpacerHeightPx: number;
  readonly minPagePaddingPx: number;
  readonly maxPagePaddingPx: number;
  readonly minSectionGapPx: number;
  readonly maxSectionGapPx: number;
  readonly minItemGapPx: number;
  readonly maxItemGapPx: number;
}

export const SPACING_TOKENS: SpacingTokens = Object.freeze({
  pagePaddingPx: DEFAULT_PAGE_PADDING_PX,
  sectionGapPx: DEFAULT_SECTION_GAP_PX,
  itemGapPx: DEFAULT_ITEM_GAP_PX,
  lineHeight: DEFAULT_LINE_HEIGHT,
  pageBottomClearancePx: PAGE_BOTTOM_CLEARANCE_PX,
  terminalSafetyToleranceRatio: DEFAULT_TERMINAL_SAFETY_TOLERANCE_RATIO,
  defaultTerminalTolerancePx: DEFAULT_TERMINAL_TOLERANCE_PX,
  headerMarginBottomRatio: DEFAULT_HEADER_MARGIN_BOTTOM_RATIO,
  dataGapPx: DEFAULT_DATA_GAP_PX,
  minPageCapacityPx: MIN_PAGE_CAPACITY_PX,
  atsHeaderBorderPaddingPx: ATS_HEADER_BORDER_PADDING_PX,
  fallbackItemHeightPx: FALLBACK_ITEM_HEIGHT_PX,
  defaultPhotoSizePx: DEFAULT_PHOTO_SIZE_PX,
  defaultPhotoHeaderSizePx: DEFAULT_PHOTO_HEADER_SIZE_PX,
  defaultSpacerHeightPx: DEFAULT_SPACER_HEIGHT_PX,
  minPagePaddingPx: 8,
  maxPagePaddingPx: 64,
  minSectionGapPx: 4,
  maxSectionGapPx: 48,
  minItemGapPx: 0,
  maxItemGapPx: 24,
});

export interface SpacingLimit {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly default: number;
}

export interface SpacingLimits {
  readonly pagePadding: SpacingLimit;
  readonly sectionGap: SpacingLimit;
  readonly itemGap: SpacingLimit;
}

export const SPACING_LIMITS: SpacingLimits = Object.freeze({
  pagePadding: Object.freeze({ min: 0, max: 60, step: 2, default: DEFAULT_PAGE_PADDING_PX }),
  sectionGap: Object.freeze({ min: 0, max: 50, step: 2, default: DEFAULT_SECTION_GAP_PX }),
  itemGap: Object.freeze({ min: 0, max: 30, step: 1, default: DEFAULT_ITEM_GAP_PX }),
});
