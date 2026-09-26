/**
 * spacing.js
 * 
 * Canonical Single Source of Truth (SSOT) for page padding, section gaps,
 * item gaps, and line height defaults across the CV editor and print engine.
 */

export const DEFAULT_PAGE_PADDING_PX = 24;
export const DEFAULT_SECTION_GAP_PX = 20;
export const DEFAULT_ITEM_GAP_PX = 8;
export const DEFAULT_LINE_HEIGHT = 1.45;

// Aliases for backward compatibility
export const DEFAULT_PAGE_PADDING = DEFAULT_PAGE_PADDING_PX;
export const DEFAULT_SECTION_GAP = DEFAULT_SECTION_GAP_PX;
export const DEFAULT_ITEM_GAP = DEFAULT_ITEM_GAP_PX;

export const SPACING_TOKENS = Object.freeze({
  pagePaddingPx: DEFAULT_PAGE_PADDING_PX,
  sectionGapPx: DEFAULT_SECTION_GAP_PX,
  itemGapPx: DEFAULT_ITEM_GAP_PX,
  lineHeight: DEFAULT_LINE_HEIGHT,
  minPagePaddingPx: 8,
  maxPagePaddingPx: 64,
  minSectionGapPx: 4,
  maxSectionGapPx: 48,
  minItemGapPx: 0,
  maxItemGapPx: 24,
});
