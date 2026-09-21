/**
 * typographyUtils.js
 *
 * Font family definitions, typography tokens compilation, and CSS variable application
 * for universal typography scaling and line heights across the CV editor and print engine.
 */

export const FONT_FAMILIES = {
  Poppins: "'Poppins', sans-serif",
  Inter: "'Inter', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Merriweather: "'Merriweather', serif",
  'JetBrains Mono': "'JetBrains Mono', monospace",
};

export const DEFAULT_FONT_FAMILY = "'Poppins', sans-serif";

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
  const lineHeight = layout.lineHeight ?? 1.45;
  const pagePadding = layout.pagePadding ?? 24;
  const sectionGap = layout.sectionGap ?? 20;
  const itemGap = layout.itemGap ?? 8;
  const leftColPercent = layout.leftColumnWidth || 33.33;
  const gridTemplateColumns = layout.leftColumnWidth
    ? `${layout.leftColumnWidth}% ${100 - layout.leftColumnWidth}%`
    : '1fr 2fr';

  return {
    '--body-font': currentFontFamily,
    '--font-scale': `${fontScale}`,
    '--title-scale': `${titleScale}`,
    '--body-scale': `${bodyScale}`,
    '--list-scale': `${listScale}`,
    '--line-height': `${lineHeight}`,
    '--page-padding': `${pagePadding}px`,
    '--section-gap': `${sectionGap}px`,
    '--item-gap': `${itemGap}px`,
    '--grid-template-columns': gridTemplateColumns,
    '--left-col-percent': `${leftColPercent}%`,
    '--left-bg': layout.leftBg || 'var(--container-color-alt)',
    '--right-bg': layout.rightBg || '#ffffff',
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
