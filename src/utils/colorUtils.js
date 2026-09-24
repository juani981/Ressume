/**
 * colorUtils.js
 *
 * Pure utility functions for color operations, YIQ contrast calculation,
 * and dynamic text color generation based on background luminosity.
 */

/**
 * Normalizes any 3-digit or 6-digit hex color string into a clean 6-digit hex string without '#'.
 * Defaults to 'ffffff' if hexcolor is invalid or empty.
 *
 * @param {string} [hexcolor]
 * @returns {string} 6-character hex string
 */
export function normalizeHex(hexcolor) {
  if (!hexcolor || typeof hexcolor !== 'string') return 'ffffff';
  let hex = hexcolor.trim().replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map((char) => char + char).join('');
  }
  return /^[0-9a-fA-F]{6}$/.test(hex) ? hex : 'ffffff';
}

/**
 * Calculates the YIQ luminosity value for a given hex color.
 * Formula: ((r * 299) + (g * 587) + (b * 114)) / 1000
 *
 * @param {string} hexcolor
 * @returns {number} YIQ value between 0 and 255
 */
export function calculateYIQ(hexcolor) {
  const hex = normalizeHex(hexcolor);
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * Returns 'dark' if the background color is dark (YIQ < 128) requiring light text,
 * or 'light' if the background color is light (YIQ >= 128) requiring dark text.
 *
 * @param {string} hexColor
 * @returns {'dark' | 'light'}
 */
export function getContrastYIQ(hexColor) {
  const yiq = calculateYIQ(hexColor);
  return yiq < 128 ? 'dark' : 'light';
}

/**
 * Determines whether a color is perceptually dark.
 *
 * @param {string} hexColor
 * @returns {boolean} True if YIQ < 128
 */
export function isDarkColor(hexColor) {
  return calculateYIQ(hexColor) < 128;
}

/**
 * Adjusts the brightness of a hex color by a specified amount (-255 to +255).
 *
 * @param {string} color - Hex color (e.g. '#ffffff' or 'ffffff')
 * @param {number} amount - Positive to lighten, negative to darken
 * @returns {string} Adjusted 6-digit hex color with leading '#'
 */
export function adjustColor(color, amount) {
  const hex = normalizeHex(color);
  return (
    '#' +
    hex.replace(/../g, (c) =>
      ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).slice(-2)
    )
  );
}

/**
 * Validates whether a string is a syntactically valid hex color (#rgb or #rrggbb).
 *
 * @param {string} color
 * @returns {boolean}
 */
export function validateHexColor(color) {
  if (!color || typeof color !== 'string') return false;
  return /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color.trim());
}

/**
 * Generates dynamic text colors and CSS custom properties based on background color luminosity.
 *
 * @param {string} hexcolor - Background hex color
 * @param {boolean} [asCssVariables=false] - If true, returns CSS custom property names (--title-color, etc.)
 * @returns {Record<string, string>} Object with color tokens or CSS variable tokens
 */
export function getDynamicTextColors(hexcolor, asCssVariables = false) {
  const yiq = calculateYIQ(hexcolor);
  const normalizedWithHash = '#' + normalizeHex(hexcolor);
  const circleColor = adjustColor(normalizedWithHash, yiq >= 128 ? -40 : 40);

  if (asCssVariables) {
    if (yiq < 128) {
      return {
        '--title-color': '#fcfcfc',
        '--text-color': '#f0efef',
        '--text-color-light': '#cccccc',
        '--container-color-alt': 'rgba(255, 255, 255, 0.1)',
        '--circle-color': circleColor,
      };
    }
    return {
      '--title-color': '#0b0a0a',
      '--text-color': '#403a3a',
      '--text-color-light': '#707070',
      '--container-color-alt': 'rgba(0, 0, 0, 0.05)',
      '--circle-color': circleColor,
    };
  }

  if (yiq < 128) {
    return {
      titleColor: '#fcfcfc',
      textColor: '#f0efef',
      textColorLight: '#cccccc',
      containerColorAlt: 'rgba(255, 255, 255, 0.1)',
      circleColor,
    };
  }
  return {
    titleColor: '#0b0a0a',
    textColor: '#403a3a',
    textColorLight: '#707070',
    containerColorAlt: 'rgba(0, 0, 0, 0.05)',
    circleColor,
  };
}

/**
 * Convenience helper returning CSS custom property object directly for inline React styles.
 *
 * @param {string} hexcolor
 * @returns {Record<string, string>}
 */
export function getDynamicTextVariables(hexcolor) {
  return getDynamicTextColors(hexcolor, true);
}
