/**
 * colors.ts
 *
 * Canonical color palette, contrast thresholds, and Obsidian Callout style invariants.
 * Adheres strictly to Rule 1 of AGENTS.md. Values unchanged from colors.js.
 */

export interface ObsidianCalloutVariant {
  readonly bg: string;
  readonly border: string;
  readonly titleColor: string;
  readonly icon: string;
}

export interface ObsidianCalloutColors {
  readonly danger: ObsidianCalloutVariant;
  readonly caution: ObsidianCalloutVariant;
  readonly info: ObsidianCalloutVariant;
}

export const OBSIDIAN_CALLOUT_COLORS: ObsidianCalloutColors = Object.freeze({
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

export interface ColorTokens {
  readonly title: string;
  readonly text: string;
  readonly textLight: string;
  readonly containerLight: string;
  readonly containerWhite: string;
  readonly primaryAccent: string;
  readonly dangerRed: string;
  readonly warningOrange: string;
  readonly infoBlue: string;
  readonly badgeBg: string;
  readonly badgeText: string;
  readonly deleteBtnBg: string;
  readonly deleteBtnText: string;
  readonly yiqThreshold: number;
}

export const COLOR_TOKENS: ColorTokens = Object.freeze({
  title: '#0f172a',
  text: '#334155',
  textLight: '#64748b',
  containerLight: '#f3f4f6',
  containerWhite: '#ffffff',
  primaryAccent: '#3874ff',
  dangerRed: '#e93147',
  warningOrange: '#db8b00',
  infoBlue: '#086ddd',
  badgeBg: 'rgba(15, 23, 42, 0.75)',
  badgeText: '#ffffff',
  deleteBtnBg: 'rgba(239, 68, 68, 0.85)',
  deleteBtnText: '#ffffff',
  yiqThreshold: 128,
});
