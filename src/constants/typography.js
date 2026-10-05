/**
 * typography.js
 * 
 * Canonical typography definitions, font families, and scale limits.
 */

export const FONT_FAMILIES = Object.freeze({
  Poppins: "'Poppins', sans-serif",
  Inter: "'Inter', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Merriweather: "'Merriweather', serif",
  'JetBrains Mono': "'JetBrains Mono', monospace",
});

export const DEFAULT_FONT_FAMILY_NAME = 'Poppins';
export const DEFAULT_FONT_FAMILY = FONT_FAMILIES.Poppins;

export const SUPPORTED_FONT_NAMES = Object.freeze(Object.keys(FONT_FAMILIES));

export const TYPOGRAPHY_SCALE_LIMITS = Object.freeze({
  fontScale: Object.freeze({ min: 0.7, max: 1.3, step: 0.05, default: 1.0 }),
  titleScale: Object.freeze({ min: 0.8, max: 1.4, step: 0.05, default: 1.0 }),
  bodyScale: Object.freeze({ min: 0.8, max: 1.3, step: 0.05, default: 1.0 }),
  listScale: Object.freeze({ min: 0.8, max: 1.3, step: 0.05, default: 1.0 }),
  lineHeight: Object.freeze({ min: 1.15, max: 1.8, step: 0.05, default: 1.3 }),
});

/**
 * Base font sizes in CSS pixels corresponding to 1rem = 16px rem tokens in index.css
 */
export const BASE_FONT_SIZES_PX = Object.freeze({
  h1: 24,       // 1.5rem
  h2: 20,       // 1.25rem (section titles)
  h3: 16,       // 1.0rem (item titles)
  subtitle: 17, // 1.05rem
  normal: 15,   // 0.938rem (body & lists)
  small: 14,    // 0.875rem (dates, companies, links)
  smaller: 13,  // 0.813rem
});

/**
 * Typographical glyph advance width ratios relative to font size (em units).
 * Used to compute exact character capacities per column width without arbitrary constants.
 */
export const FONT_ADVANCE_RATIOS = Object.freeze({
  Poppins: 0.55,
  Inter: 0.50,
  Roboto: 0.51,
  Merriweather: 0.54,
  'JetBrains Mono': 0.60,
});

export const DEFAULT_FONT_ADVANCE_RATIO = 0.52;

/**
 * Returns the average character advance ratio for a given font family.
 * @param {string} [fontFamily]
 * @returns {number} Advance ratio in em units
 */
export function getFontAdvanceRatio(fontFamily) {
  if (!fontFamily) return DEFAULT_FONT_ADVANCE_RATIO;
  return FONT_ADVANCE_RATIOS[fontFamily] || DEFAULT_FONT_ADVANCE_RATIO;
}

/**
 * Standard calibrated characters capacity per line by column type (SSOT).
 * Used for deterministic fallback layout calculations prior to live DOM measurement.
 */
export const DEFAULT_COLUMN_CHARS_CAPACITY = Object.freeze({
  left: Object.freeze({ text: 28, bullet: 26 }),
  right: Object.freeze({ text: 44, bullet: 42 }),
  single: Object.freeze({ text: 72, bullet: 70 }),
});

export const MIN_CHARS_PER_LINE = 12;
export const LEFT_COLUMN_TITLE_WRAP_CHARS = 18;
