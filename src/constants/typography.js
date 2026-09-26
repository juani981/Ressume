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
  lineHeight: Object.freeze({ min: 1.15, max: 1.8, step: 0.05, default: 1.45 }),
});
