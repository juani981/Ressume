/**
 * colors.js
 * 
 * Canonical color palette, contrast thresholds, and Obsidian Callout style invariants.
 * Adheres strictly to Rule 1 of AGENTS.md.
 */

export const OBSIDIAN_CALLOUT_COLORS = Object.freeze({
  danger: Object.freeze({
    bg: 'rgba(233, 49, 71, 0.1)',
    border: 'rgba(233, 49, 71, 1)',
    titleColor: '#e93147',
    icon: '🛑',
  }),
  caution: Object.freeze({
    bg: 'rgba(219, 139, 0, 0.1)',
    border: 'rgba(219, 139, 0, 1)',
    titleColor: '#db8b00',
    icon: '⚠️',
  }),
  info: Object.freeze({
    bg: 'rgba(8, 109, 221, 0.1)',
    border: 'rgba(8, 109, 221, 1)',
    titleColor: '#086ddd',
    icon: 'ℹ️',
  }),
});

export const COLOR_TOKENS = Object.freeze({
  title: '#0f172a',
  text: '#334155',
  textLight: '#64748b',
  containerLight: '#f3f4f6',
  containerWhite: '#ffffff',
  primaryAccent: '#3874ff',
  dangerRed: '#e93147',
  warningOrange: '#db8b00',
  infoBlue: '#086ddd',
  yiqThreshold: 128,
});
