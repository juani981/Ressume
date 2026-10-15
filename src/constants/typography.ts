/**
 * typography.ts
 *
 * Canonical typography definitions, font families, and scale limits.
 * Values unchanged from typography.js — types only.
 */

export const FONT_FAMILIES = Object.freeze({
  Poppins: "'Poppins', sans-serif",
  Inter: "'Inter', sans-serif",
  Roboto: "'Roboto', sans-serif",
  Merriweather: "'Merriweather', serif",
  'JetBrains Mono': "'JetBrains Mono', monospace",
} as const);

export type FontFamilyName = keyof typeof FONT_FAMILIES;

export const DEFAULT_FONT_FAMILY_NAME: FontFamilyName = 'Poppins';
export const DEFAULT_FONT_FAMILY: string = FONT_FAMILIES.Poppins;

export const SUPPORTED_FONT_NAMES: readonly FontFamilyName[] = Object.freeze(
  Object.keys(FONT_FAMILIES) as FontFamilyName[],
);

export interface ScaleLimit {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly default: number;
}

export interface TypographyScaleLimits {
  readonly fontScale: ScaleLimit;
  readonly titleScale: ScaleLimit;
  readonly bodyScale: ScaleLimit;
  readonly listScale: ScaleLimit;
  readonly lineHeight: ScaleLimit;
}

export const TYPOGRAPHY_SCALE_LIMITS: TypographyScaleLimits = Object.freeze({
  fontScale: Object.freeze({ min: 0.5, max: 1.3, step: 0.05, default: 1.0 }),
  titleScale: Object.freeze({ min: 0.5, max: 1.4, step: 0.05, default: 1.0 }),
  bodyScale: Object.freeze({ min: 0.5, max: 1.3, step: 0.05, default: 1.0 }),
  listScale: Object.freeze({ min: 0.5, max: 1.3, step: 0.05, default: 1.0 }),
  lineHeight: Object.freeze({ min: 1.15, max: 1.85, step: 0.05, default: 1.3 }),
});

/**
 * Base font sizes in CSS pixels corresponding to 1rem = 16px rem tokens in index.css
 */
export interface BaseFontSizesPx {
  readonly h1: number;
  readonly h2: number;
  readonly h3: number;
  readonly subtitle: number;
  readonly normal: number;
  readonly small: number;
  readonly smaller: number;
}

export const BASE_FONT_SIZES_PX: BaseFontSizesPx = Object.freeze({
  h1: 24, // 1.5rem
  h2: 18, // 1.125rem (section titles)
  h3: 15, // (item titles)
  subtitle: 15, // (subtitles)
  normal: 12, // 0.75rem (body & lists)
  small: 11, // 0.688rem (dates, companies, links)
  smaller: 10, // 0.625rem
});

/**
 * Typographical glyph advance width ratios relative to font size (em units).
 * Used to compute exact character capacities per column width without arbitrary constants.
 */
export const FONT_ADVANCE_RATIOS: Readonly<Record<string, number>> = Object.freeze({
  Poppins: 0.55,
  Inter: 0.5,
  Roboto: 0.51,
  Merriweather: 0.54,
  'JetBrains Mono': 0.6,
});

export const DEFAULT_FONT_ADVANCE_RATIO: number = 0.52;

/**
 * Returns the average character advance ratio for a given font family.
 */
export function getFontAdvanceRatio(fontFamily?: string): number {
  if (!fontFamily) return DEFAULT_FONT_ADVANCE_RATIO;
  return FONT_ADVANCE_RATIOS[fontFamily] ?? DEFAULT_FONT_ADVANCE_RATIO;
}

export interface ColumnCharsCapacity {
  readonly text: number;
  readonly bullet: number;
}

/**
 * Standard calibrated characters capacity per line by column type (SSOT).
 * Used for deterministic fallback layout calculations prior to live DOM measurement.
 */
export const DEFAULT_COLUMN_CHARS_CAPACITY: Readonly<
  Record<'left' | 'right' | 'single', ColumnCharsCapacity>
> = Object.freeze({
  left: Object.freeze({ text: 28, bullet: 26 }),
  right: Object.freeze({ text: 44, bullet: 42 }),
  single: Object.freeze({ text: 118, bullet: 114 }),
});

export const MIN_CHARS_PER_LINE: number = 12;
export const LEFT_COLUMN_TITLE_WRAP_CHARS: number = 18;
