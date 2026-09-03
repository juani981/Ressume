import { StyleSheet } from '@react-pdf/renderer';

/**
 * Computes YIQ contrast colors for background hex to ensure readability.
 * Synchronized with the logic in App.jsx and staticHtmlPdfEngine.js.
 */
export const getDynamicTextColors = (hexcolor) => {
  let calcHex = hexcolor || '#ffffff';
  let hex = calcHex.replace("#", "");
  if (hex.length === 3) {
    hex = hex.split('').map(char => char + char).join('');
  }
  const r = parseInt(hex.substr(0, 2), 16) || 0;
  const g = parseInt(hex.substr(2, 2), 16) || 0;
  const b = parseInt(hex.substr(4, 2), 16) || 0;
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  
  const adjustColor = (color, amount) => {
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
  };
  const circleColor = adjustColor(calcHex, yiq >= 128 ? -40 : 40);

  if (yiq < 128) {
    return {
      titleColor: '#fcfcfc',
      textColor: '#f0efef',
      textColorLight: '#cccccc',
      containerColorAlt: 'rgba(255, 255, 255, 0.1)',
      circleColor
    };
  } else {
    return {
      titleColor: '#0f172a',
      textColor: '#334155',
      textColorLight: '#64748b',
      containerColorAlt: 'rgba(0, 0, 0, 0.05)',
      circleColor
    };
  }
};

/**
 * Maps app font families to standard built-in PDF Type 1 fonts
 * (Zero network requests, completely offline, 100% selectable vector text)
 */
export const mapFontFamilyToPdf = (fontFamily) => {
  switch (fontFamily) {
    case 'Merriweather':
      return 'Times-Roman';
    case 'JetBrains Mono':
      return 'Courier';
    case 'Poppins':
    case 'Inter':
    case 'Roboto':
    default:
      return 'Helvetica';
  }
};

/**
 * Computes typography sizes in PDF points (pt)
 */
export const computePdfFontSizes = (layout = {}) => {
  const fontScale = layout.fontScale ?? 1.0;
  const titleScale = layout.titleScale ?? 1.0;
  const bodyScale = layout.bodyScale ?? 1.0;
  const listScale = layout.listScale ?? 1.0;

  return {
    h1: Math.round(18 * fontScale * titleScale * 10) / 10,
    h2: Math.round(13.5 * fontScale * titleScale * 10) / 10,
    h3: Math.round(11 * fontScale * titleScale * 10) / 10,
    subtitle: Math.round(10.5 * fontScale * titleScale * 10) / 10,
    body: Math.round(9.5 * fontScale * bodyScale * 10) / 10,
    small: Math.round(8.8 * fontScale * bodyScale * 10) / 10,
    smaller: Math.round(7.8 * fontScale * bodyScale * 10) / 10,
    list: Math.round(9 * fontScale * listScale * 10) / 10,
  };
};

/**
 * Computes spacing tokens in PDF points (1 px = 0.75 pt)
 */
export const computePdfSpacing = (layout = {}) => {
  const pagePaddingPx = layout.pagePadding ?? 24;
  const sectionGapPx = layout.sectionGap ?? 20;
  const itemGapPx = layout.itemGap ?? 8;
  const lineHeight = layout.lineHeight ?? 1.45;

  return {
    pagePadding: Math.round(pagePaddingPx * 0.75 * 10) / 10,
    sectionGap: Math.max(7.5, Math.round(sectionGapPx * 0.75 * 10) / 10),
    itemGap: Math.max(3, Math.round(itemGapPx * 0.75 * 10) / 10),
    lineHeight
  };
};

/**
 * Factory creating dynamic StyleSheet based on active layout state
 */
export const createCvStyles = (layout = {}) => {
  const spacing = computePdfSpacing(layout);
  const fontSizes = computePdfFontSizes(layout);
  const fontFamily = mapFontFamilyToPdf(layout.fontFamily);

  return StyleSheet.create({
    page: {
      backgroundColor: '#ffffff',
      fontFamily,
      fontSize: fontSizes.body,
      lineHeight: spacing.lineHeight,
      color: '#334155',
    },
    twoColumnRow: {
      flexDirection: 'row',
      width: '100%',
      minHeight: '100%',
      alignItems: 'stretch',
    },
    leftColumn: {
      paddingTop: spacing.pagePadding,
      paddingBottom: spacing.pagePadding,
      paddingLeft: spacing.pagePadding,
      paddingRight: spacing.pagePadding,
      minHeight: '100%',
    },
    rightColumn: {
      paddingTop: spacing.pagePadding,
      paddingBottom: spacing.pagePadding,
      paddingLeft: spacing.pagePadding,
      paddingRight: spacing.pagePadding,
      minHeight: '100%',
    },
    singleColumnContainer: {
      paddingTop: spacing.pagePadding,
      paddingBottom: spacing.pagePadding,
      paddingLeft: spacing.pagePadding,
      paddingRight: spacing.pagePadding,
      width: '100%',
    },
    section: {
      marginBottom: spacing.sectionGap,
    },
    sectionTitle: {
      fontSize: fontSizes.h2,
      fontFamily,
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
      marginBottom: Math.max(4, spacing.itemGap * 0.8),
    },
    itemBlock: {
      marginBottom: spacing.itemGap,
    }
  });
};
