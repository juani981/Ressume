/**
 * spacing.js
 * 
 * Canonical Single Source of Truth (SSOT) for page padding, section gaps,
 * item gaps, and line height defaults across the CV editor and print engine.
 * Invariant 19 of AGENTS.md.
 */

export const DEFAULT_PAGE_PADDING_PX = 24;
export const DEFAULT_SECTION_GAP_PX = 12;
export const DEFAULT_ITEM_GAP_PX = 6;
export const DEFAULT_LINE_HEIGHT = 1.30;
export const PAGE_BOTTOM_CLEARANCE_PX = 14;
export const DEFAULT_HEADER_MARGIN_BOTTOM_RATIO = 1.5;
export const DEFAULT_DATA_GAP_PX = 6;

// Physical layout thresholds & fallback dimensions
export const MIN_PAGE_CAPACITY_PX = 100;
export const ATS_HEADER_BORDER_PADDING_PX = 6;
export const FALLBACK_ITEM_HEIGHT_PX = 28;
export const DEFAULT_PHOTO_SIZE_PX = 120;
export const DEFAULT_PHOTO_HEADER_SIZE_PX = 70;
export const DEFAULT_SPACER_HEIGHT_PX = 24;

// Aliases for backward compatibility
export const DEFAULT_PAGE_PADDING = DEFAULT_PAGE_PADDING_PX;
export const DEFAULT_SECTION_GAP = DEFAULT_SECTION_GAP_PX;
export const DEFAULT_ITEM_GAP = DEFAULT_ITEM_GAP_PX;

export const SPACING_TOKENS = Object.freeze({
  pagePaddingPx: DEFAULT_PAGE_PADDING_PX,
  sectionGapPx: DEFAULT_SECTION_GAP_PX,
  itemGapPx: DEFAULT_ITEM_GAP_PX,
  lineHeight: DEFAULT_LINE_HEIGHT,
  pageBottomClearancePx: PAGE_BOTTOM_CLEARANCE_PX,
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

export const SPACING_LIMITS = Object.freeze({
  pagePadding: Object.freeze({ min: 0, max: 60, step: 2, default: DEFAULT_PAGE_PADDING_PX }),
  sectionGap: Object.freeze({ min: 0, max: 50, step: 2, default: DEFAULT_SECTION_GAP_PX }),
  itemGap: Object.freeze({ min: 0, max: 30, step: 1, default: DEFAULT_ITEM_GAP_PX }),
});
