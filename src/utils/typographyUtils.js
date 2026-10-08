/**
 * typographyUtils.js
 *
 * Font family definitions, typography tokens compilation, and CSS variable application
 * for universal typography scaling and line heights across the CV editor and print engine.
 */

import {
  PRINT_PAGE_SIZE,
  DEFAULT_LEFT_COLUMN_WIDTH_PERCENT,
  DEFAULT_GRID_TEMPLATE_COLUMNS,
  formatGridTemplateColumns,
} from '../constants/geometry.js';
import {
  DEFAULT_PAGE_PADDING_PX,
  DEFAULT_SECTION_GAP_PX,
  DEFAULT_ITEM_GAP_PX,
  DEFAULT_LINE_HEIGHT,
} from '../constants/spacing.js';
import {
  FONT_FAMILIES,
  DEFAULT_FONT_FAMILY,
  BASE_FONT_SIZES_PX,
} from '../constants/typography.js';

export {
  FONT_FAMILIES,
  DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_FAMILY_NAME,
  SUPPORTED_FONT_NAMES,
  TYPOGRAPHY_SCALE_LIMITS,
  BASE_FONT_SIZES_PX,
  FONT_ADVANCE_RATIOS,
  getFontAdvanceRatio,
} from '../constants/typography.js';

/**
 * Returns the CSS font-family stack corresponding to a font name.
 * Falls back to DEFAULT_FONT_FAMILY if fontName is unknown or undefined.
 *
 * @param {string} [fontName]
 * @returns {string} CSS font-family string
 */
export function getFontFamilyStack(fontName) {
  if (!fontName) return DEFAULT_FONT_FAMILY;
  return FONT_FAMILIES[fontName] || fontName || DEFAULT_FONT_FAMILY;
}

/**
 * Computes exact rendered line height in CSS pixels for a given typography level
 * based on layout scale tokens and line-height multiplier.
 *
 * @param {'h1'|'h2'|'h3'|'subtitle'|'normal'|'small'|'smaller'} level
 * @param {Object} [layout={}]
 * @returns {number}
 */
export function calcLineHeightPx(level = 'normal', layout = {}) {
  const baseSize = BASE_FONT_SIZES_PX[level] ?? BASE_FONT_SIZES_PX.normal;
  const fontScale = layout.fontScale ?? 1.0;
  let categoryScale = 1.0;
  if (level === 'h1' || level === 'h2' || level === 'h3' || level === 'subtitle') {
    categoryScale = layout.titleScale ?? 1.0;
  } else if (level === 'small' || level === 'smaller' || level === 'normal') {
    categoryScale = layout.bodyScale ?? (layout.listScale ?? 1.0);
  }
  const lineHeight = layout.lineHeight ?? DEFAULT_LINE_HEIGHT;
  return baseSize * fontScale * categoryScale * lineHeight;
}

/**
 * Compiles dynamic typography and spacing settings from layout state into CSS custom property tokens.
 *
 * @param {Object} [layout={}] - Layout configuration from cvData.layout
 * @returns {Record<string, string>} CSS custom property key-value map
 */
export function computeTypographyTokens(layout = {}) {
  const currentFontFamily = getFontFamilyStack(layout.fontFamily);
  const fontScale = layout.fontScale ?? 1.0;
  const titleScale = layout.titleScale ?? 1.0;
  const bodyScale = layout.bodyScale ?? 1.0;
  const listScale = layout.listScale ?? 1.0;
  const lineHeight = layout.lineHeight ?? DEFAULT_LINE_HEIGHT;
  const pagePadding = layout.pagePadding ?? DEFAULT_PAGE_PADDING_PX;
  const sectionGap = layout.sectionGap ?? DEFAULT_SECTION_GAP_PX;
  const itemGap = layout.itemGap ?? DEFAULT_ITEM_GAP_PX;
  const leftColPercent = layout.leftColumnWidth || DEFAULT_LEFT_COLUMN_WIDTH_PERCENT;
  const gridTemplateColumns = layout.leftColumnWidth
    ? formatGridTemplateColumns(layout.leftColumnWidth)
    : DEFAULT_GRID_TEMPLATE_COLUMNS;

  return {
    '--body-font': currentFontFamily,
    '--font-scale': `${fontScale}`,
    '--title-scale': `${titleScale}`,
    '--body-scale': `${bodyScale}`,
    '--list-scale': `${listScale}`,
    '--line-height': `${lineHeight}`,
    '--page-padding': `${pagePadding}px`,
    '--page-padding-bottom': `${Math.round(pagePadding / 2)}px`,
    '--section-gap': `${sectionGap}px`,
    '--item-gap': `${itemGap}px`,
    '--grid-template-columns': gridTemplateColumns,
    '--left-col-percent': `${leftColPercent}%`,
    '--left-bg': layout.leftBg || 'var(--container-color-alt)',
    '--right-bg': layout.rightBg || '#ffffff',
    ...PRINT_PAGE_SIZE.cssVariables,
  };
}

/**
 * Applies typography tokens directly to an HTMLElement style object.
 *
 * @param {HTMLElement} targetEl - DOM element to apply styles to
 * @param {string|number} fontScale - Font scale value
 * @param {string|number} lineHeight - Line height value
 * @param {string} [fontFamily] - Optional font family name or stack
 */
export function applyTypographyTokens(targetEl, fontScale, lineHeight, fontFamily) {
  if (!targetEl || !targetEl.style) return;
  if (fontScale !== undefined && fontScale !== null) {
    targetEl.style.setProperty('--font-scale', `${fontScale}`);
  }
  if (lineHeight !== undefined && lineHeight !== null) {
    targetEl.style.setProperty('--line-height', `${lineHeight}`);
  }
  if (fontFamily) {
    targetEl.style.setProperty('--body-font', getFontFamilyStack(fontFamily));
  }
}
