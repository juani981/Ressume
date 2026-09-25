/**
 * bundle.js
 * 
 * CSS Bundle Provider for static HTML print generation, iframe injection, and offline export.
 * Safely bundles baseStyles and printStyles as raw text strings without relying on
 * browser runtime relative @import resolution.
 */

import baseStyles from '../index.css?raw';
import printStyles from './print.css?raw';

export { baseStyles, printStyles };

/**
 * Returns a fully concatenated, sanitized CSS string ready for injection into print <style> tags.
 * 
 * @param {string} [layoutVariablesCSS='']
 * @returns {string} Concatenated CSS string
 */
export function buildPrintStylesheet(layoutVariablesCSS = '') {
  return `
/* === 1. Dynamic Layout Tokens === */
${layoutVariablesCSS}

/* === 2. Canonical Base Styles === */
${baseStyles}

/* === 3. Strict Print Fragmentation Rules === */
${printStyles}
  `.trim();
}
