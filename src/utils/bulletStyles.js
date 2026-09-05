/**
 * bulletStyles.js
 * 
 * Config and utility helpers for timeline title circle styling (.experience__rounder, .education__rounder).
 * Inner bullet points remain standardized without alterations.
 * 
 * Discrete options:
 * - Size: Normal vs Grande
 * - Variant: Negro (bold/black, #0f172a solid), Gris (#94a3b8), Anillo (ring border #0f172a)
 * - Line: Con línea vs Sin línea
 */

export const DEFAULT_BULLET_STYLE = {
  size: 'normal',
  variant: 'bold',
  showLine: true
};

export const BULLET_SIZES = [
  { id: 'normal', label: 'Normal' },
  { id: 'large', label: 'Grande' }
];

export const BULLET_VARIANTS = [
  { id: 'bold', label: 'Negro' },
  { id: 'gray', label: 'Gris' },
  { id: 'circle', label: 'Anillo' }
];

/**
 * Returns CSS class names to attach to a section container (.cv-section)
 * based on its configured bulletStyle.
 */
export const getBulletClasses = (bulletStyle) => {
  const config = { ...DEFAULT_BULLET_STYLE, ...(bulletStyle || {}) };
  const classes = [];

  // Size class
  if (config.size === 'large') {
    classes.push('bullet-size-large');
  } else {
    classes.push('bullet-size-normal');
  }

  // Visual artifact class
  if (config.variant === 'gray') {
    classes.push('bullet-variant-gray');
  } else if (config.variant === 'circle' || config.variant === 'ring') {
    classes.push('bullet-variant-circle');
  } else {
    // 'bold', 'black', or default
    classes.push('bullet-variant-bold');
  }

  // Line connector class
  if (config.showLine === false) {
    classes.push('bullet-line-none');
  }

  return classes.join(' ');
};

/**
 * Checks if a section type supports custom timeline circle styling.
 * Only timeline sections with title rounders are supported.
 */
export const supportsBulletCustomization = (sectionType) => {
  const supported = ['list', 'experience', 'projects', 'education', 'volunteering'];
  return supported.includes(sectionType);
};
