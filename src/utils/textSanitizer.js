/**
 * @file textSanitizer.js
 * @description Normalization and sanitization utilities for clean OCR/ATS text extraction.
 * Prevents PDF glyph mapping errors, math-mode delimiters, and date range disconnects.
 */

/**
 * Normalizes date range strings to ensure standard ASCII hyphens and spaces.
 * Replaces Unicode en-dash (\u2013), em-dash (\u2014), figure-dash (\u2012), horizontal bar (\u2015)
 * with a clean, universally parsed " - " connector.
 *
 * @param {string} dateStr
 * @returns {string}
 */
export const normalizeDateRange = (dateStr) => {
  if (!dateStr || typeof dateStr !== 'string') return dateStr || '';
  return dateStr
    .replace(/[\u2012\u2013\u2014\u2015]/g, ' - ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
};

/**
 * Sanitizes bullet point text to prevent irregular whitespace and private-use glyph omissions.
 * Removes leading tabs, non-breaking spaces (\u00A0), and MS Word/Wingdings private-use bullets (\uF0B7).
 *
 * @param {string} text
 * @returns {string}
 */
export const sanitizeBulletText = (text) => {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/^[\s\t\u00A0\uF0B7\u25E6\u2043\u2219]+/, '')
    .trim();
};

/**
 * Sanitizes technical terms and eliminates erroneous LaTeX/OCR math-mode delimiters ($...$).
 * Corrects common sans-serif OCR confusions such as:
 * - $N+1$ -> N+1
 * - $Cl/CD$ or Cl/CD (lowercase 'l') -> CI/CD
 * - $(1+D)$ or (1+D) -> I+D
 *
 * @param {string} text
 * @returns {string}
 */
export const sanitizeOcrMathSyntax = (text) => {
  if (!text || typeof text !== 'string') return text || '';
  return text
    // Replace math-wrapped expressions like $N+1$, $CI/CD$, $Cl/CD$, $(1+D)$, $I+D$
    .replace(/\$([^\$]+)\$/g, '$1')
    // Fix lowercase 'l' in CI/CD
    .replace(/\bC[l|1]\/CD\b/g, 'CI/CD')
    // Fix (1+D) or 1+D in context of R&D / Investigación y Desarrollo
    .replace(/\(?1\s*\+\s*D\)?/g, 'I+D')
    // Fix N + 1 spacing if joined with math operators
    .replace(/\$N\s*\+\s*1\$/g, 'N+1');
};
