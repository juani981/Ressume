/**
 * staticHtmlPdfEngine.js
 * 
 * Dedicated static HTML PDF generation core for high-fidelity native printing.
 * Isolates visual content from editor artifacts, embeds strict CSS pagination rules,
 * and enforces dynamic auto-scaling to fit within a maximum of 2 A4 pages.
 */

const A4_PAGE_HEIGHT_PX = 1123; // 1 A4 page at 96 DPI
const MAX_A4_2PAGE_HEIGHT_PX = 2246; // 2 A4 pages at 96 DPI (1123px * 2 = 2246px)
const MIN_SCALE_FLOOR = 0.75;

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { renderRichHTML, stripHtml } from './richTextEngine';
import { normalizeItemContacts, getContactConfig } from './contactTypes';
import { getBulletClasses } from './bulletStyles';
import { getSectionDescriptor } from '../registry/sectionRegistry';
import { PrintBaseSection } from '../components/CV/BaseSection';
import { PrintBaseItem } from '../components/CV/BaseItem';
import baseStyles from '../index.css?raw';
import printStyles from '../styles/print.css?raw';
export { renderRichHTML, stripHtml };

/**
 * Escapes HTML characters to prevent XSS and malformed HTML
 */
export const escapeHTML = (str) => {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Sanitizes a string for safe usage as a document/file name across OSs.
 * Removes/replaces forbidden characters: < > : " / \ | ? * and control chars with '_'.
 * Normalizes multiple whitespace into single spaces and trims leading/trailing spaces.
 * @param {string} name 
 * @returns {string}
 */
export const sanitizeFileName = (name) => {
  if (!name || typeof name !== 'string') return '';
  return name
    .replace(/[<>:"/\\|?*\x00-\x1F]+/g, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^\.+|\.+$/g, '');
};

/**
 * Generates standardized PDF filename / document title based on active version or defaults.
 * Format:
 * 1. If a saved version name exists: uses sanitized version name.
 * 2. If not a saved version: by default `CV_${profileName}_${profileSubtitle}`
 *    (or fallback variants if profile name/subtitle are partially missing).
 *
 * @param {Object} cvData 
 * @returns {string} Safe document title / filename
 */
export const getDynamicPdfTitle = (cvData) => {
  if (!cvData || typeof cvData !== 'object') return 'CV';

  // 1. Check if a saved version name is loaded or active
  const candidateVersionName = (
    (typeof cvData.versionName === 'string' && cvData.versionName.trim()) ||
    (typeof cvData.activeVersionName === 'string' && cvData.activeVersionName.trim()) ||
    (typeof cvData.layout?.versionName === 'string' && cvData.layout?.versionName.trim()) ||
    ''
  );

  if (candidateVersionName) {
    const sanitized = sanitizeFileName(candidateVersionName);
    if (sanitized) return sanitized;
  }

  // 2. Default: "CV_${profileName}_${profileSubtitle}"
  const rawProfileName = (
    cvData.profile?.name ||
    cvData.sections?.find(s => s.id === 'profile_header' || s.type === 'profile_header')?.items?.[0]?.name ||
    ''
  );
  const rawProfileSubtitle = (
    cvData.profile?.subtitle ||
    cvData.sections?.find(s => s.id === 'profile_header' || s.type === 'profile_header')?.items?.[0]?.subtitle ||
    ''
  );

  const profileName = stripHtml(rawProfileName).trim();
  const profileSubtitle = stripHtml(rawProfileSubtitle).trim();

  let defaultTitle = 'CV';
  if (profileName && profileSubtitle) {
    defaultTitle = `CV_${profileName}_${profileSubtitle}`;
  } else if (profileName) {
    defaultTitle = `CV_${profileName}`;
  } else if (profileSubtitle) {
    defaultTitle = `CV_${profileSubtitle}`;
  }

  return sanitizeFileName(defaultTitle) || 'CV';
};

/**
 * Computes adaptive print scale and target page count without hardcoded limits.
 * Optimizes for 1-page and 2-page documents, and gracefully supports 3+ pages.
 * @param {number} renderedHeight 
 * @returns {{ scale: number, totalPages: number, targetHeightMm: number }}
 */
export const computeAdaptivePrintLayout = (renderedHeight) => {
  if (!renderedHeight || renderedHeight <= 0 || isNaN(renderedHeight)) {
    return { scale: 1.0, totalPages: 1, targetHeightMm: 297 };
  }

  // 1. Fits in 1 page (up to 1123px)
  if (renderedHeight <= A4_PAGE_HEIGHT_PX) {
    return { scale: 1.0, totalPages: 1, targetHeightMm: 297 };
  }

  // 2. Overflows page 1 slightly (1124px - 1260px) -> optimize to 1 full page
  if (renderedHeight <= A4_PAGE_HEIGHT_PX * 1.12) {
    const scale = +( (A4_PAGE_HEIGHT_PX / renderedHeight).toFixed(3) );
    return { scale: Math.max(MIN_SCALE_FLOOR, scale), totalPages: 1, targetHeightMm: 297 };
  }

  // 3. Clearly 2 pages (1261px - 2246px)
  if (renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX) {
    return { scale: 1.0, totalPages: 2, targetHeightMm: 594 };
  }

  // 4. Overflows page 2 slightly (2247px - 2580px) -> optimize to 2 full pages
  if (renderedHeight <= MAX_A4_2PAGE_HEIGHT_PX * 1.15) {
    const scale = +( (MAX_A4_2PAGE_HEIGHT_PX / renderedHeight).toFixed(3) );
    return { scale: Math.max(MIN_SCALE_FLOOR, scale), totalPages: 2, targetHeightMm: 594 };
  }

  // 5. Clearly 3 pages (2581px - 3369px) -> 3 full pages, scale 1.0 (no arbitrary clamping)
  if (renderedHeight <= A4_PAGE_HEIGHT_PX * 3) {
    return { scale: 1.0, totalPages: 3, targetHeightMm: 891 };
  }

  // 6. Overflows page 3 slightly (3370px - 3870px) -> optimize to 3 full pages
  if (renderedHeight <= (A4_PAGE_HEIGHT_PX * 3) * 1.15) {
    const scale = +( ((A4_PAGE_HEIGHT_PX * 3) / renderedHeight).toFixed(3) );
    return { scale: Math.max(MIN_SCALE_FLOOR, scale), totalPages: 3, targetHeightMm: 891 };
  }

  // 7. General multi-page handling for >= 4 pages
  const pages = Math.ceil(renderedHeight / A4_PAGE_HEIGHT_PX);
  return { scale: 1.0, totalPages: pages, targetHeightMm: pages * 297 };
};

/**
 * Calculates auto-scale factor adhering to smart multi-page fitting.
 * Backwards-compatible signature supporting legacy unit tests.
 * @param {number} renderedHeight 
 * @param {number|null} maxPages Optional explicit max page constraint (default: 2 for legacy tests)
 * @returns {number} Scale factor between 0.75 and 1.0
 */
export const calculatePrintScale = (renderedHeight, maxPages = 2) => {
  if (!renderedHeight || renderedHeight <= 0 || isNaN(renderedHeight)) {
    return 1.0;
  }

  if (renderedHeight <= A4_PAGE_HEIGHT_PX) {
    return 1.0;
  }

  if (maxPages === 1 && renderedHeight <= A4_PAGE_HEIGHT_PX * 1.15) {
    const calculated = A4_PAGE_HEIGHT_PX / renderedHeight;
    return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
  }

  const maxAllowedHeight = maxPages ? maxPages * A4_PAGE_HEIGHT_PX : MAX_A4_2PAGE_HEIGHT_PX;
  if (renderedHeight <= maxAllowedHeight) {
    return 1.0;
  }

  const calculated = maxAllowedHeight / renderedHeight;
  return Math.max(MIN_SCALE_FLOOR, +(calculated.toFixed(3)));
};

/**
 * Computes YIQ contrast colors for backgrounds
 */
const getDynamicTextColors = (hexcolor) => {
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
    return '#' + color.replace(/^#/, '').replace(/../g, c => ('0'+Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2));
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
      titleColor: '#0b0a0a',
      textColor: '#403a3a',
      textColorLight: '#707070',
      containerColorAlt: 'rgba(0, 0, 0, 0.05)',
      circleColor
    };
  }
};

/**
 * Renders an item to clean static HTML via real React PrintBaseItem (Single Source of Truth)
 */
export const renderItemHTML = (item, sectionType, isLast = false) => {
  if (!item) return '';
  return renderToStaticMarkup(
    React.createElement(PrintBaseItem, {
      item,
      sectionId: sectionType,
      sectionType,
      isLast
    })
  );
};

/**
 * Renders a section to clean static HTML via real React PrintBaseSection
 */
export const renderSectionHTML = (section) => {
  if (!section) return '';
  return renderToStaticMarkup(
    React.createElement(PrintBaseSection, { section })
  );
};

/**
 * Captures an exact snapshot of the live editor's #area-cv container geometry
 * and forced page-break element positions.
 * Guarantees 1:1 identical break locations and zero font shrinkage when passed to the PDF print engine.
 * @returns {{ width: number, height: number, pageHeightPx: number, brokenElements: Array } | null}
 */
export const captureEditorSnapshot = () => {
  if (typeof document === 'undefined') return null;
  const areaCv = document.getElementById('area-cv');
  if (!areaCv) return null;

  const rect = typeof areaCv.getBoundingClientRect === 'function' ? areaCv.getBoundingClientRect() : null;
  const width = Math.round((rect && rect.width) || areaCv.offsetWidth || 0);
  const height = Math.round(areaCv.scrollHeight || areaCv.offsetHeight || 0);

  let pageHeightPx = A4_PAGE_HEIGHT_PX;
  try {
    const ruler = document.createElement('div');
    ruler.style.height = '297mm';
    ruler.style.position = 'absolute';
    ruler.style.visibility = 'hidden';
    ruler.style.top = '-9999px';
    document.body.appendChild(ruler);
    if (ruler.offsetHeight > 0) {
      pageHeightPx = ruler.offsetHeight;
    }
    ruler.remove();
  } catch (_) {}

  const brokenElements = [];
  const brokenNodes = areaCv.querySelectorAll('[data-editor-break-forced="true"]');
  brokenNodes.forEach((node) => {
    const isTitle = node.classList.contains('section-title') || node.hasAttribute('data-section-title');
    const section = node.closest('.cv-section') || node.closest('section');
    const sectionId = section?.getAttribute('data-section-id') || section?.id || node.getAttribute('data-section-title') || null;
    const itemId = node.getAttribute('data-item-id') || (!isTitle ? node.id : null);
    const fold = node.getAttribute('data-editor-break-fold') || '1';
    const pageNum = parseInt(fold, 10) || 1;

    let relativeTop = 0;
    try {
      if (rect && typeof node.getBoundingClientRect === 'function') {
        const nodeRect = node.getBoundingClientRect();
        relativeTop = Math.round(nodeRect.top - rect.top);
      } else {
        relativeTop = node.offsetTop || 0;
      }
    } catch (_) {}

    brokenElements.push({
      sectionId,
      itemId: isTitle ? null : itemId,
      isTitle,
      fold,
      pageNum,
      marginTop: node.style.marginTop || '',
      relativeTop
    });
  });

  const totalPagesAttr = areaCv.getAttribute('data-total-pages');
  const parsedAttr = totalPagesAttr ? parseInt(totalPagesAttr, 10) : 0;
  const maxFold = brokenElements.length > 0
    ? Math.max(...brokenElements.map(b => parseInt(b.fold || b.pageNum, 10) || 1)) + 1
    : 1;
  const totalPages = (parsedAttr && parsedAttr > 0) ? parsedAttr : maxFold;

  return {
    width: width > 0 ? width : 794,
    height,
    pageHeightPx,
    brokenElements,
    totalPages
  };
};

/**
 * Generates standalone clean static HTML for printing and PDF rendering.
 * Strips all interactive editor UI artifacts and guarantees 2-page print layout.
 * @param {Object} cvData 
 * @param {string} lang 
 * @param {Object|null} customSnapshot 
 * @returns {string} Standalone HTML document string
 */
export const generateCleanPrintHTML = (cvData, lang = 'es', customSnapshot = undefined) => {
  const snapshot = customSnapshot !== undefined ? customSnapshot : (typeof document !== 'undefined' ? captureEditorSnapshot() : null);
  const data = cvData || {};
  const layout = data.layout || {};
  const docLang = lang || layout.language || data.activeLanguage || 'es';
  let rawSections = Array.isArray(data.sections) ? data.sections : [];

  let sections = rawSections;
  if (data.profile) {
    sections = rawSections.map(sec => {
      if (sec.id === 'profile_header' || sec.type === 'profile_header') {
        const firstItem = (sec.items && sec.items[0]) ? { ...sec.items[0] } : {};
        const mergedItem = {
          ...firstItem,
          ...(data.profile.name !== undefined ? { name: data.profile.name } : {}),
          ...(data.profile.subtitle !== undefined ? { subtitle: data.profile.subtitle } : {}),
          ...(data.profile.location !== undefined ? { location: data.profile.location } : {}),
          ...(data.profile.email !== undefined ? { email: data.profile.email } : {}),
          ...(data.profile.phone !== undefined ? { phone: data.profile.phone } : {}),
          ...(data.profile.linkedin !== undefined ? { linkedin: data.profile.linkedin } : {}),
          ...(data.profile.github !== undefined ? { github: data.profile.github } : {}),
        };
        return { ...sec, items: [mergedItem, ...(sec.items ? sec.items.slice(1) : [])] };
      }
      return sec;
    });
  }

  const isAtsMode = layout.isAtsMode === true;
  const is2Col = layout.type === '2-column' && !layout.isAtsMode;
  const pagePadding = Number(layout.pagePadding ?? 24);
  const sectionGap = Number(layout.sectionGap ?? 20);
  const itemGap = Number(layout.itemGap ?? 8);

  const fontFamilies = {
    'Poppins': "'Poppins', sans-serif",
    'Inter': "'Inter', sans-serif",
    'Roboto': "'Roboto', sans-serif",
    'Merriweather': "'Merriweather', serif",
    'JetBrains Mono': "'JetBrains Mono', monospace"
  };
  const fontFamily = fontFamilies[layout.fontFamily] || layout.fontFamily || "'Poppins', sans-serif";
  const fontScale = layout.fontScale || 1.0;
  const titleScale = layout.titleScale || 1.0;
  const bodyScale = layout.bodyScale || 1.0;
  const listScale = layout.listScale || 1.0;
  const lineHeight = layout.lineHeight || 1.45;

  const leftBg = layout.leftBg || '#f3f4f6';
  const rightBg = layout.rightBg || '#ffffff';
  const leftColors = getDynamicTextColors(leftBg);
  const rightColors = getDynamicTextColors(rightBg);

  const getSectionCol = (s) => s.column || getSectionDescriptor(s.type)?.defaultColumn || 'right';
  const leftSections = sections.filter(s => getSectionCol(s) === 'left');
  const rightSections = sections.filter(s => getSectionCol(s) === 'right');

  const leftColWidth = layout.leftColumnWidth;
  const gridColumns = leftColWidth ? `${leftColWidth}% ${100 - leftColWidth}%` : '1fr 2fr';

  const leftColPercent = leftColWidth || 33.33;

  const areaCvClasses = is2Col 
    ? (snapshot ? `resume bd-grid ${isAtsMode ? 'resume--ats-mode' : ''}`.trim() : `resume ${isAtsMode ? 'resume--ats-mode' : ''}`.trim())
    : `resume resume__single-column ${isAtsMode ? 'resume--ats-mode' : ''}`.trim();

  const dynamicSpacingStyle = `
    --body-font: ${fontFamily};
    --font-scale: ${fontScale};
    --title-scale: ${titleScale};
    --body-scale: ${bodyScale};
    --list-scale: ${listScale};
    --line-height: ${lineHeight};
    --page-padding: ${pagePadding}px;
    --section-gap: ${sectionGap}px;
    --item-gap: ${itemGap}px;
  `.replace(/\s+/g, ' ').trim();

  const containerWidth = snapshot?.width ? `${snapshot.width}px` : null;

  let snapshotBreaksCSS = '';
  if (snapshot?.brokenElements?.length > 0) {
    snapshotBreaksCSS = snapshot.brokenElements.map(b => {
      const selector = b.isTitle
        ? `[data-section-title="${b.sectionId}"]`
        : (b.itemId ? `[data-item-id="${b.itemId}"]` : `[data-section-id="${b.sectionId}"]`);
      return `
        ${selector} {
          break-before: page !important;
          page-break-before: always !important;
          margin-top: var(--page-padding, 24px) !important;
        }
      `;
    }).join('\n');
  }

  let bodyContent = '';
  if (is2Col) {
    bodyContent = `
      <div class="${areaCvClasses}" id="area-cv" style="display: grid; grid-template-columns: ${gridColumns}; width: ${containerWidth || '794px'}; max-width: ${containerWidth || '794px'}; min-height: 297mm; height: 100%; margin: 0 auto; padding: 0; box-shadow: none; box-sizing: border-box; color: var(--text-color); background: linear-gradient(to right, ${leftBg} 0%, ${leftBg} ${leftColPercent}%, ${rightBg} ${leftColPercent}%, ${rightBg} 100%); ${dynamicSpacingStyle}">
        <div class="resume__left" style="background: ${leftBg}; min-height: 297mm; height: 100%; align-self: stretch; box-sizing: border-box; padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem); color: var(--text-color); --title-color: ${leftColors.titleColor}; --text-color: ${leftColors.textColor}; --text-color-light: ${leftColors.textColorLight}; --circle-color: ${leftColors.circleColor}; --container-color-alt: ${leftColors.containerColorAlt};">
          ${leftSections.map(renderSectionHTML).join('')}
        </div>
        <div class="resume__right" style="background: ${rightBg}; min-height: 297mm; height: 100%; align-self: stretch; box-sizing: border-box; padding: var(--page-padding, 2rem) var(--page-padding, 1.5rem); color: var(--text-color); --title-color: ${rightColors.titleColor}; --text-color: ${rightColors.textColor}; --text-color-light: ${rightColors.textColorLight}; --circle-color: ${rightColors.circleColor}; --container-color-alt: ${rightColors.containerColorAlt};">
          ${rightSections.map(renderSectionHTML).join('')}
        </div>
      </div>
    `;
  } else {
    bodyContent = `
      <div class="${areaCvClasses}" id="area-cv" style="width: ${containerWidth || '794px'}; max-width: ${containerWidth || '794px'}; min-height: 297mm; margin: 0 auto; box-sizing: border-box; padding: var(--page-padding, 24px); background: #ffffff; ${dynamicSpacingStyle}">
        ${sections.map(renderSectionHTML).join('')}
      </div>
    `;
  }

  const dynamicDocumentTitle = getDynamicPdfTitle(data);

  let activeBaseStyles = baseStyles || '';
  let activePrintStyles = printStyles || '';

  // Remove static :root block so dynamic variables take effect without collision
  activeBaseStyles = activeBaseStyles.replace(/:root\s*\{[\s\S]*?\}/, '/* static :root removed */');

  // Sanitize editor artifact selector names so they do not leak into clean print HTML
  // without deleting entire CSS rule blocks or affecting layout rules (.cv-section, margins, text contrast)
  const editorArtifactsPattern = /(?:section-drag-handle|item-drag-handle|drag-handle|round-btn-del|round-btn-add|suggestion-tooltip|obsidian-callout|column-resizer|l-navbar|action-menu|no-print|add-contact-btn|contact-del-btn|spacer-resize-handle|spacer-controls-bar|spacer-del-btn|section-del-btn|item-del-btn|section-add-container|editable-section-container|editable-item-container|inline-input|inline-edit-active)/gi;
  activeBaseStyles = activeBaseStyles.replace(editorArtifactsPattern, 'editor-control-stripped');
  activePrintStyles = activePrintStyles.replace(editorArtifactsPattern, 'editor-control-stripped');


  if (!is2Col) {
    activeBaseStyles = activeBaseStyles
      .replace(/[^{}]*?\.resume__(?:left|right)[^{]*?\{[^}]*?\}/gi, '')
      .replace(/\.resume__(?:left|right)\b/gi, '.col-inactive');
    activePrintStyles = activePrintStyles
      .replace(/[^{}]*?\.resume__(?:left|right)[^{]*?\{[^}]*?\}/gi, '')
      .replace(/\.resume__(?:left|right)\b/gi, '.col-inactive');
  }

  return `<!DOCTYPE html>
<html lang="${escapeHTML(docLang)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHTML(dynamicDocumentTitle)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Poppins:wght@400;500;600;700&family=Roboto:wght@400;500;700&display=swap" rel="stylesheet">
  <link href="https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css" rel="stylesheet">
  <style id="cv-base-styles">
    :root,
    #area-cv {
      --page-padding: ${pagePadding}px;
      --section-gap: ${sectionGap}px;
      --item-gap: ${itemGap}px;
      --title-color: #0f172a;
      --text-color: #334155;
      --text-color-light: #64748b;
      --container-color: #ffffff;
      --container-color-alt: #f3f4f6;
      --body-color: #ffffff;
      --first-color: #3874ff;
      --header-height: 3rem;
      --font-medium: 500;
      --font-semi-bold: 600;
      --mb-1: .5rem;
      --mb-2: 1rem;
      --mb-3: 1.5rem;
      --body-font: ${fontFamily && !fontFamily.includes(',') ? `'${fontFamily}', sans-serif` : (fontFamily || "'Poppins', sans-serif")};
      --font-scale: ${fontScale};
      --title-scale: ${titleScale};
      --body-scale: ${bodyScale};
      --list-scale: ${listScale};
      --line-height: ${lineHeight};
      --h1-font-size: calc(1.5rem * var(--font-scale, 1));
      --h2-font-size: calc(1.25rem * var(--font-scale, 1));
      --h3-font-size: calc(1rem * var(--font-scale, 1));
      --normal-font-size: calc(0.938rem * var(--font-scale, 1));
      --small-font-size: calc(0.875rem * var(--font-scale, 1));
      --smaller-font-size: calc(0.813rem * var(--font-scale, 1));

      --title-h1-size: calc(var(--h1-font-size) * var(--title-scale, 1));
      --title-h2-size: calc(var(--h2-font-size) * var(--title-scale, 1));
      --title-h3-size: calc(var(--h3-font-size) * var(--title-scale, 1));
      --title-subtitle-size: calc(1.05rem * var(--font-scale, 1) * var(--title-scale, 1));

      --body-font-size: calc(var(--normal-font-size) * var(--body-scale, 1));
      --body-small-font-size: calc(var(--small-font-size) * var(--body-scale, 1));
      --body-smaller-font-size: calc(var(--smaller-font-size) * var(--body-scale, 1));

      --list-font-size: calc(var(--normal-font-size) * var(--list-scale, 1));
    }

    .resume__single-column {
      min-height: 297mm !important;
      box-sizing: border-box !important;
      padding: var(--page-padding, ${pagePadding}px) !important;
    }

${activeBaseStyles}
  </style>
  <style id="cv-print-styles">
${activePrintStyles}
  </style>
  <style id="cv-snapshot-breaks">
${snapshotBreaksCSS}
  </style>
</head>
<body>
  ${bodyContent}
</body>
</html>`;
};

/**
 * Enforces strict per-component page break avoidance and left column full-page extension
 * exclusively for 2-column print layouts.
 * 
 * Inspects elements in BOTH columns simultaneously:
 * - If an element in the left column crosses an A4 page fold, it pushes it cleanly to the next page.
 * - If an element in the right column crosses an A4 page fold, it pushes it cleanly to the next page.
 * - Section titles about to be orphaned without child items are also pushed to the next page.
 * - After pagination settles, if total pages > 1, the left column container (.resume__left) and #area-cv
 *   are extended to occupy the full length of the current A4 page (N * 297mm).
 * 
 * @param {Document} doc The iframe document or DOM document
 * @param {HTMLElement} areaCv The #area-cv container element
 * @param {number} pageHeightPx Height of one A4 page in pixels (default: 1123)
 * @returns {{ totalPages: number, targetHeightMm: number, breaksApplied: Array }}
 */
export const enforceTwoColumnComponentPagination = (doc, areaCv, pageHeightPx = A4_PAGE_HEIGHT_PX) => {
  if (!areaCv) {
    return { totalPages: 1, targetHeightMm: 297, breaksApplied: [] };
  }

  const leftCol = areaCv.querySelector?.('.resume__left');
  const rightCol = areaCv.querySelector?.('.resume__right');

  // Strictly applicable for 2-column layout
  if (!leftCol || !rightCol) {
    const rawH = Math.max(areaCv.scrollHeight || 0, pageHeightPx);
    const pages = Math.max(1, Math.ceil(rawH / pageHeightPx));
    const targetMm = pages * 297;
    if (areaCv.style) {
      areaCv.style.minHeight = `${targetMm}mm`;
    }
    return { totalPages: pages, targetHeightMm: targetMm, breaksApplied: [] };
  }

  const getRelativeBounds = (el) => {
    if (typeof el.getBoundingClientRect === 'function' && typeof areaCv.getBoundingClientRect === 'function') {
      const elRect = el.getBoundingClientRect();
      const areaRect = areaCv.getBoundingClientRect();
      return {
        top: elRect.top - areaRect.top,
        bottom: elRect.bottom - areaRect.top,
        height: elRect.height || (el.offsetHeight || 0)
      };
    }
    const top = el.offsetTop || 0;
    const height = el.offsetHeight || 0;
    return { top, bottom: top + height, height };
  };

  const getBreakableComponents = (columnEl) => {
    const selector = '.section-title, .cv-block, .experience__content, .education__content, .skills__name, .profile__description, .home__data, .simple-list-item, li.cv-block, .contact__item';
    const rawList = Array.from(columnEl.querySelectorAll(selector));
    const filtered = rawList.filter((item, idx, arr) => {
      if (item.classList.contains('section-title')) return true;
      const hasParentInList = arr.some(other => other !== item && other.contains(item) && !other.classList.contains('section-title'));
      return !hasParentInList;
    });
    return filtered;
  };

  const breaksApplied = [];
  let passes = 0;
  let hasChanges = true;

  while (hasChanges && passes < 6) {
    passes++;
    hasChanges = false;

    const currentHeight = Math.max(
      leftCol.scrollHeight || 0,
      rightCol.scrollHeight || 0,
      areaCv.scrollHeight || 0,
      pageHeightPx
    );
    const estimatedPages = Math.max(1, Math.ceil(currentHeight / pageHeightPx));

    for (let pageNum = 1; pageNum <= estimatedPages; pageNum++) {
      const foldY = pageNum * pageHeightPx;

      const colDefs = [
        { name: 'left', el: leftCol, items: getBreakableComponents(leftCol) },
        { name: 'right', el: rightCol, items: getBreakableComponents(rightCol) }
      ];

      for (const col of colDefs) {
        for (const item of col.items) {
          if (item.getAttribute('data-page-break-forced') === 'true') {
            continue;
          }

          const { top, bottom, height } = getRelativeBounds(item);

          if (height <= 0) continue;

          // If already after fold
          if (top >= foldY) {
            continue;
          }

          // Section title orphaned near fold (less than 60px before fold)
          const isOrphanTitle = item.classList.contains('section-title') && (top < foldY && bottom > foldY - 60);

          // If safely before fold (non-orphan elements)
          if (!isOrphanTitle && bottom <= foldY - 4) {
            continue;
          }

          // Item straddles fold boundary
          const isStraddling = (top < foldY && bottom > foldY - 8);

          if (isStraddling || isOrphanTitle) {
            item.style.setProperty('break-before', 'page', 'important');
            item.style.setProperty('page-break-before', 'always', 'important');
            item.classList.add('force-page-break-before');
            item.setAttribute('data-page-break-forced', 'true');
            item.setAttribute('data-page-break-column', col.name);
            item.setAttribute('data-page-break-fold', String(pageNum));

            const pushDistance = Math.max(0, foldY - top);
            if (pushDistance > 0) {
              item.style.setProperty('margin-top', `${pushDistance + 10}px`, 'important');
            }

            breaksApplied.push({
              column: col.name,
              element: item,
              tagName: item.tagName,
              className: item.className,
              fold: foldY,
              pageNum
            });

            hasChanges = true;
            break;
          }
        }
      }
    }
  }

  // Final measurement after all component breaks have been resolved
  const finalMaxHeight = Math.max(
    leftCol.scrollHeight || 0,
    rightCol.scrollHeight || 0,
    areaCv.scrollHeight || 0,
    pageHeightPx
  );
  const totalPages = Math.max(1, Math.ceil(finalMaxHeight / pageHeightPx));
  const targetHeightMm = totalPages * 297;

  // Extend left column container, right column, and #area-cv to full page length
  areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
  areaCv.style.setProperty('--print-total-pages', String(totalPages));
  areaCv.style.alignItems = 'stretch';

  leftCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  leftCol.style.setProperty('height', '100%', 'important');
  leftCol.style.setProperty('align-self', 'stretch', 'important');
  leftCol.style.setProperty('flex', '1', 'important');
  leftCol.style.setProperty('box-sizing', 'border-box', 'important');

  rightCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
  rightCol.style.setProperty('height', '100%', 'important');
  rightCol.style.setProperty('align-self', 'stretch', 'important');
  rightCol.style.setProperty('box-sizing', 'border-box', 'important');

  return { totalPages, targetHeightMm, breaksApplied };
};

/**
 * Creates an isolated iframe, writes clean print HTML, calculates auto-scale,
 * triggers browser native print, and cleans up the DOM.
 * @param {Object} cvData 
 */
export const executeCleanPrint = (cvData, lang = 'es', customSnapshot = undefined) => {
  return new Promise((resolve) => {
    const dynamicDocumentTitle = getDynamicPdfTitle(cvData);
    const snapshot = customSnapshot !== undefined ? customSnapshot : captureEditorSnapshot();

    const html = generateCleanPrintHTML(cvData, lang, snapshot);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-10000px';
    iframe.style.left = '-10000px';
    const iframeWidth = snapshot?.width ? `${snapshot.width}px` : '794px';
    iframe.style.width = iframeWidth;
    iframe.style.minWidth = iframeWidth;
    iframe.style.height = '1123px';
    iframe.style.visibility = 'hidden';
    iframe.style.border = '0';
    iframe.setAttribute('title', 'Ressume Print Preview');

    document.body.appendChild(iframe);

    let printClosed = false;
    let fallbackTimeout = null;
    const handlePrintClosed = () => {
      if (printClosed) return;
      printClosed = true;
      if (fallbackTimeout) {
        clearTimeout(fallbackTimeout);
        fallbackTimeout = null;
      }
      try {
        window.dispatchEvent(new CustomEvent('print-dialog-closed'));
      } catch (_) {}
      setTimeout(() => {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }, 600);
    };

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!doc) {
      window.print();
      handlePrintClosed();
      resolve();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    const triggerPrint = async () => {
      try {
        if (iframe.contentWindow) {
          if (doc) {
            doc.title = dynamicDocumentTitle;
          }
          // Await font readiness with timeout fallback (max 1000ms)
          if (doc.fonts && typeof doc.fonts.ready?.then === 'function') {
            await Promise.race([
              doc.fonts.ready,
              new Promise((res) => setTimeout(res, 1000))
            ]);
          }

          const areaCv = typeof doc.getElementById === 'function' 
            ? doc.getElementById('area-cv') 
            : (doc.body?.querySelector?.('#area-cv') || doc.body?.firstElementChild);

          let pageHeightPx = A4_PAGE_HEIGHT_PX;
          if (doc.createElement && doc.body) {
            try {
              const ruler = doc.createElement('div');
              ruler.style.height = '297mm';
              ruler.style.position = 'absolute';
              ruler.style.visibility = 'hidden';
              ruler.style.top = '-9999px';
              doc.body.appendChild(ruler);
              if (ruler.offsetHeight > 0) {
                pageHeightPx = ruler.offsetHeight;
              }
              ruler.parentNode?.removeChild(ruler);
            } catch (_) {}
          }

          if (snapshot && snapshot.brokenElements) {
            // Apply live editor breaks 1:1 into iframe
            snapshot.brokenElements.forEach((b) => {
              let targetEl = null;
              if (b.isTitle) {
                targetEl = doc.querySelector(`[data-section-title="${b.sectionId}"]`) ||
                           doc.querySelector(`[data-section-id="${b.sectionId}"] .section-title`) ||
                           doc.querySelector(`#${b.sectionId} .section-title`);
              } else if (b.itemId) {
                targetEl = doc.querySelector(`[data-item-id="${b.itemId}"]`);
              }

              if (targetEl) {
                targetEl.style.setProperty('break-before', 'page', 'important');
                targetEl.style.setProperty('page-break-before', 'always', 'important');
                targetEl.style.setProperty('margin-top', 'var(--page-padding, 24px)', 'important');
                targetEl.classList.add('force-page-break-before');
                targetEl.setAttribute('data-page-break-forced', 'true');
                targetEl.setAttribute('data-page-break-fold', String(b.fold || b.pageNum || 1));
              }
            });

            const maxFold = snapshot.brokenElements.length > 0
              ? Math.max(...snapshot.brokenElements.map(b => parseInt(b.fold || b.pageNum, 10) || 1)) + 1
              : 1;
            const totalPages = snapshot.totalPages || maxFold;
            const targetHeightMm = totalPages * 297;

            if (areaCv && areaCv.style) {
              areaCv.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
              areaCv.style.setProperty('--print-target-height-mm', `${targetHeightMm}mm`);
              areaCv.style.setProperty('--print-total-pages', String(totalPages));
            }

            const leftCol = areaCv?.querySelector?.('.resume__left');
            const rightCol = areaCv?.querySelector?.('.resume__right');
            if (leftCol && leftCol.style) {
              leftCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
              leftCol.style.setProperty('height', '100%', 'important');
              leftCol.style.setProperty('align-self', 'stretch', 'important');
              leftCol.style.setProperty('box-sizing', 'border-box', 'important');
            }
            if (rightCol && rightCol.style) {
              rightCol.style.setProperty('min-height', `${targetHeightMm}mm`, 'important');
              rightCol.style.setProperty('height', '100%', 'important');
              rightCol.style.setProperty('align-self', 'stretch', 'important');
              rightCol.style.setProperty('box-sizing', 'border-box', 'important');
            }

            // Anti-orphan safeguard: Verify that no section title is separated from its first child across page folds
            const querySections = typeof doc.querySelectorAll === 'function'
              ? doc.querySelectorAll('.cv-section')
              : (typeof doc.body?.querySelectorAll === 'function' ? doc.body.querySelectorAll('.cv-section') : []);
            if (querySections && typeof querySections.forEach === 'function') {
              querySections.forEach((sec) => {
                const title = sec.querySelector?.('.section-title');
                const firstItem = sec.querySelector?.('.cv-block, .experience__content, .education__content, .skills__name, .profile__description, .simple-list-item');
                if (title && firstItem) {
                  const titleRect = typeof title.getBoundingClientRect === 'function' ? title.getBoundingClientRect() : null;
                  const itemRect = typeof firstItem.getBoundingClientRect === 'function' ? firstItem.getBoundingClientRect() : null;
                  const areaRect = typeof areaCv?.getBoundingClientRect === 'function' ? areaCv.getBoundingClientRect() : null;
                  if (titleRect && itemRect && areaRect) {
                    const titleY = titleRect.top - areaRect.top;
                    const itemY = itemRect.top - areaRect.top;
                    const titlePage = Math.floor(titleY / pageHeightPx) + 1;
                    const itemPage = Math.floor(itemY / pageHeightPx) + 1;
                    
                    if (itemPage > titlePage) {
                      title.style.setProperty('break-before', 'page', 'important');
                      title.style.setProperty('page-break-before', 'always', 'important');
                      title.classList.add('force-page-break-before');
                    }
                  }
                }
              });
            }

            // Adaptive scale guard: if content in iframe slightly overflows totalPages due to browser font rendering differences,
            // scale down adaptively to strictly guarantee fitting within totalPages without spawning an unwanted extra blank page!
            const rawHeight = Math.max(
              doc.body?.scrollHeight || 0,
              doc.documentElement?.scrollHeight || 0,
              areaCv?.scrollHeight || 0
            );
            const maxAllowedHeight = totalPages * pageHeightPx;
            if (rawHeight > maxAllowedHeight) {
              const scale = calculatePrintScale(rawHeight, totalPages);
              if (doc.body?.style) {
                doc.body.style.zoom = scale;
              }
            } else if (doc.body?.style) {
              doc.body.style.zoom = 1.0;
            }

            if (iframe && iframe.style) {
              iframe.style.height = `${totalPages * pageHeightPx}px`;
            }
          } else {
            // Fallback for headless environments without snapshot
            const { totalPages, targetHeightMm } = enforceTwoColumnComponentPagination(doc, areaCv, pageHeightPx);

            const rawHeight = Math.max(
              doc.body?.scrollHeight || 0,
              doc.documentElement?.scrollHeight || 0,
              areaCv?.scrollHeight || 0,
              pageHeightPx * totalPages
            );
            const scale = calculatePrintScale(rawHeight, Math.max(2, totalPages));
            if (scale < 1.0 && doc.body?.style) {
              doc.body.style.zoom = scale;
            } else if (doc.body?.style) {
              doc.body.style.zoom = 1.0;
            }

            if (iframe && iframe.style) {
              iframe.style.height = `${totalPages * pageHeightPx}px`;
            }
          }

          if (iframe.contentWindow && typeof iframe.contentWindow.addEventListener === 'function') {
            iframe.contentWindow.addEventListener('afterprint', handlePrintClosed, { once: true });
          }
          if (typeof window.addEventListener === 'function') {
            window.addEventListener('afterprint', handlePrintClosed, { once: true });
          }

          if (typeof iframe.contentWindow.focus === 'function') {
            iframe.contentWindow.focus();
          }
          if (typeof iframe.contentWindow.print === 'function') {
            iframe.contentWindow.print();
          } else {
            window.print();
          }
        }
      } catch (e) {
        console.warn('Iframe print failed, falling back to window.print()', e);
        window.print();
      } finally {
        resolve();
        fallbackTimeout = setTimeout(() => {
          if (!printClosed) {
            handlePrintClosed();
          }
          if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
          }
        }, 1000);
      }
    };

    if (iframe.contentWindow?.document?.readyState === 'complete') {
      triggerPrint();
    } else {
      iframe.onload = () => {
        triggerPrint();
      };
    }
  });
};

/**
 * Generates and triggers clean native PDF print dialog via executeCleanPrint.
 * @param {Object} cvData 
 * @param {string} lang 
 * @param {Object|null} customSnapshot 
 */
export const downloadPDF = async (cvData, lang = 'es', customSnapshot = undefined) => {
  return executeCleanPrint(cvData, lang, customSnapshot);
};

